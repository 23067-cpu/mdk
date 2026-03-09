from rest_framework import viewsets, status, permissions, generics
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.decorators import action
from rest_framework.authtoken.models import Token
from rest_framework.parsers import MultiPartParser, FormParser
from django.contrib.auth import authenticate
from django.utils import timezone
from django.db import transaction as db_transaction
from django.db.models import Sum, Count, Q, F
from django.http import HttpResponse
from django.contrib.contenttypes.models import ContentType
from datetime import timedelta
import uuid
import io

from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.lib.units import mm
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer, Image
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_CENTER, TA_RIGHT

from .models import (
    User, Branch, Folio, Transaction, Settlement, 
    Receipt, Invoice, Document, Notification, 
    SystemSettings, AuditLog, Account, CashDenomination, CashCount
)
from .serializers import (
    UserSerializer, UserCreateSerializer, UserProfileSerializer,
    BranchSerializer, FolioSerializer, FolioCreateSerializer, FolioCloseSerializer,
    TransactionSerializer, TransactionCreateSerializer, TransactionVoidSerializer,
    SettlementSerializer, SettlementCreateSerializer, SettlementApprovalSerializer,
    ReceiptSerializer, InvoiceSerializer, InvoiceCreateSerializer,
    DocumentSerializer, NotificationSerializer,
    SystemSettingsSerializer, AuditLogSerializer,
    AdminDashboardSerializer, GerantDashboardSerializer,
    CaissierDashboardSerializer
)
from .permissions import (
    IsAdmin, IsGerantOrAdmin, IsCaissierOrAbove,
    CanManageFolio, CanManageTransaction, CanApprove,
    CanVoidTransaction, CanManageUsers, CanManageSettings,
    CanViewAuditLogs, CanExportReports
)
from .utils import send_smart_alert


def log_audit(user, action, obj=None, details=None, reason=None, before=None, after=None, request=None):
    """Helper function to create audit log entries"""
    ip_address = None
    user_agent = None
    if request:
        ip_address = request.META.get('HTTP_X_FORWARDED_FOR', request.META.get('REMOTE_ADDR'))
        user_agent = request.META.get('HTTP_USER_AGENT', '')[:500]
    
    AuditLog.objects.create(
        user=user,
        action=action,
        object_type=obj.__class__.__name__ if obj else None,
        object_id=obj.pk if obj else None,
        object_repr=str(obj) if obj else None,
        details=details,
        reason=reason,
        before_state=before,
        after_state=after,
        ip_address=ip_address,
        user_agent=user_agent
    )


class AuthView(APIView):
    """Authenticate user and return token + profile"""
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        username = request.data.get('username')
        password = request.data.get('password')
        
        if not username or not password:
            return Response({
                'success': False,
                'message': 'Nom d\'utilisateur et mot de passe requis'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        user = authenticate(username=username, password=password)
        
        if user:
            if not user.is_active:
                log_audit(user, 'LOGIN_FAILED', details='Account disabled', request=request)
                return Response({
                    'success': False,
                    'message': 'Compte désactivé'
                }, status=status.HTTP_403_FORBIDDEN)
            
            token, _ = Token.objects.get_or_create(user=user)
            
            log_audit(user, 'LOGIN', details='Login successful', request=request)
            
            return Response({
                'success': True,
                'token': token.key,
                'user': UserSerializer(user).data
            })
        else:
            # Log failed attempt
            log_audit(None, 'LOGIN_FAILED', details=f'Failed login attempt for: {username}', request=request)
            return Response({
                'success': False,
                'message': 'Identifiants invalides'
            }, status=status.HTTP_401_UNAUTHORIZED)


class LogoutView(APIView):
    """Logout current user (revoke token)"""
    permission_classes = [permissions.IsAuthenticated]
    
    def post(self, request):
        log_audit(request.user, 'LOGOUT', request=request)
        request.user.auth_token.delete()
        return Response({'success': True, 'message': 'Déconnexion réussie'})


class CurrentUserView(APIView):
    """Get current user profile"""
    permission_classes = [permissions.IsAuthenticated]
    
    def get(self, request):
        return Response({
            'success': True,
            'user': UserSerializer(request.user).data
        })
    
    def patch(self, request):
        serializer = UserProfileSerializer(request.user, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response({'success': True, 'user': serializer.data})
        return Response({'success': False, 'errors': serializer.errors}, status=status.HTTP_400_BAD_REQUEST)


class ChangePasswordView(APIView):
    """Change current user password"""
    permission_classes = [permissions.IsAuthenticated]
    
    def post(self, request):
        current_password = request.data.get('current_password')
        new_password = request.data.get('new_password')
        
        if not current_password or not new_password:
            return Response({
                'success': False,
                'message': 'Mot de passe actuel et nouveau mot de passe requis'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        if not request.user.check_password(current_password):
            return Response({
                'success': False,
                'message': 'Mot de passe actuel incorrect'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        if len(new_password) < 8:
            return Response({
                'success': False,
                'message': 'Le nouveau mot de passe doit contenir au moins 8 caractères'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        request.user.set_password(new_password)
        request.user.save()
        
        log_audit(request.user, 'PASSWORD_CHANGE', request=request)
        
        return Response({'success': True, 'message': 'Mot de passe modifié avec succès'})


# ==================== DASHBOARD VIEWS ====================

class AdminDashboardView(APIView):
    """Admin dashboard statistics"""
    permission_classes = [IsAdmin]
    
    def get(self, request):
        today = timezone.now().date()
        today_start = timezone.make_aware(timezone.datetime.combine(today, timezone.datetime.min.time()))
        
        # Chart Data Calculations
        seven_days_ago = today_start - timedelta(days=6)
        
        # Cash Flow (last 7 days)
        cash_flow_data = []
        for i in range(7):
            day = seven_days_ago + timedelta(days=i)
            day_name = day.strftime('%a')
            day_receipts = Transaction.objects.filter(
                type='RECEIPT', status='APPROVED', 
                created_at__year=day.year, created_at__month=day.month, created_at__day=day.day
            ).aggregate(total=Sum('amount'))['total'] or 0
            
            day_payments = Transaction.objects.filter(
                type='PAYMENT', status='APPROVED', 
                created_at__year=day.year, created_at__month=day.month, created_at__day=day.day
            ).aggregate(total=Sum('amount'))['total'] or 0
            
            cash_flow_data.append({
                'name': day_name,
                'receipts': float(day_receipts),
                'payments': float(day_payments)
            })
            
        # Payment Methods
        payment_methods_data = []
        methods = Transaction.objects.filter(status='APPROVED').values('payment_method').annotate(total=Sum('amount'))
        for pm in methods:
            if pm['payment_method'] and pm['total'] > 0:
                pm_display = dict(Transaction._meta.get_field('payment_method').choices).get(pm['payment_method'], pm['payment_method'])
                payment_methods_data.append({
                    'name': str(pm_display),
                    'value': float(pm['total'])
                })
        
        # KPIs
        open_folios = Folio.objects.filter(status='OPEN')
        total_liquidity = sum(folio.running_balance for folio in open_folios)
        
        open_folios = Folio.objects.filter(status='OPEN')
        
        today_receipts = Transaction.objects.filter(
            type='RECEIPT', status='APPROVED', created_at__gte=today_start
        ).aggregate(total=Sum('amount'))['total'] or 0
        
        today_payments = Transaction.objects.filter(
            type='PAYMENT', status='APPROVED', created_at__gte=today_start
        ).aggregate(total=Sum('amount'))['total'] or 0
        
        pending_approvals = Settlement.objects.filter(status='PROPOSED').count()
        pending_approvals += Folio.objects.filter(status='CLOSURE_PROPOSED').count()
        
        security_alerts = AuditLog.objects.filter(
            action__in=['LOGIN_FAILED', 'SECURITY_ALERT'],
            timestamp__gte=today_start - timedelta(days=1)
        ).count()
        
        # Recent modifications
        recent_mods = AuditLog.objects.filter(
            action__in=['UPDATE', 'VOID_TRANSACTION']
        ).select_related('user')[:10]
        
        # Pending settlements
        pending_settlements = Settlement.objects.filter(
            status='PROPOSED'
        ).select_related('created_by', 'folio')[:10]
        
        # Open folios by branch
        folios_by_branch = {}
        for folio in open_folios.select_related('branch'):
            branch_name = folio.branch.name if folio.branch else 'Sans branche'
            if branch_name not in folios_by_branch:
                folios_by_branch[branch_name] = []
            folios_by_branch[branch_name].append(FolioSerializer(folio).data)
        
        data = {
            'total_liquidity': float(total_liquidity),
            'open_folios_count': open_folios.count(),
            'today_receipts': float(today_receipts),
            'today_payments': float(today_payments),
            'pending_approvals': pending_approvals,
            'today_transactions_count': Transaction.objects.filter(created_at__gte=today_start).count(),
            'security_alerts_24h': security_alerts,
            'branches_count': Branch.objects.filter(is_active=True).count(),
            'users_count': User.objects.filter(is_active=True).count(),
            'recent_modifications': AuditLogSerializer(recent_mods, many=True).data,
            'pending_settlements': SettlementSerializer(pending_settlements, many=True).data,
            'open_folios_by_branch': folios_by_branch,
            'cash_flow_data': cash_flow_data,
            'payment_methods_data': payment_methods_data
        }
        
        return Response(data)


class GerantDashboardView(APIView):
    """Gérant dashboard statistics"""
    permission_classes = [IsGerantOrAdmin]
    
    def get(self, request):
        today = timezone.now().date()
        today_start = timezone.make_aware(timezone.datetime.combine(today, timezone.datetime.min.time()))
        
        user_branch = request.user.branch
        
        # Filter by branch if not admin
        folio_filter = Q(status='OPEN')
        transaction_filter = Q(status='APPROVED', created_at__gte=today_start)
        
        if user_branch and request.user.role != 'ADMIN':
            folio_filter &= Q(branch=user_branch)
            transaction_filter &= Q(folio__branch=user_branch)
        
        open_folios = Folio.objects.filter(folio_filter)
        
        today_receipts = Transaction.objects.filter(
            transaction_filter & Q(type='RECEIPT')
        ).aggregate(total=Sum('amount'))['total'] or 0
        
        today_payments = Transaction.objects.filter(
            transaction_filter & Q(type='PAYMENT')
        ).aggregate(total=Sum('amount'))['total'] or 0
        
        # Pending closure requests
        closure_filter = Q(status='CLOSURE_PROPOSED')
        if user_branch and request.user.role != 'ADMIN':
            closure_filter &= Q(branch=user_branch)
        pending_closures = Folio.objects.filter(closure_filter).count()
        
        # Pending settlements
        settlement_filter = Q(status='PROPOSED')
        if user_branch and request.user.role != 'ADMIN':
            settlement_filter &= Q(folio__branch=user_branch)
        pending_settlements = Settlement.objects.filter(settlement_filter).count()
        
        # Caissier performance
        caissier_stats = Transaction.objects.filter(
            transaction_filter
        ).values('created_by__username', 'created_by__first_name', 'created_by__last_name').annotate(
            count=Count('id'),
            total=Sum('amount')
        ).order_by('-count')[:10]
        
        # Discrepancy alerts
        discrepancies = Folio.objects.filter(
            status='CLOSED',
            closed_at__gte=today_start - timedelta(days=7)
        ).exclude(
            actual_physical_balance__isnull=True
        ).annotate(
            diff=F('actual_physical_balance') - F('closing_balance')
        ).filter(
            ~Q(diff=0)
        )[:5]
        
        data = {
            'total_liquidity': sum(folio.running_balance for folio in open_folios),
            'open_folios_count': open_folios.count(),
            'today_receipts': float(today_receipts),
            'today_payments': float(today_payments),
            'pending_approvals': pending_settlements + pending_closures,
            'today_transactions_count': Transaction.objects.filter(transaction_filter).count(),
            'branch_name': user_branch.name if user_branch else 'Toutes les branches',
            'pending_closure_requests': pending_closures,
            'caissiers_performance': list(caissier_stats),
            'discrepancy_alerts': FolioSerializer(discrepancies, many=True).data
        }
        
        return Response(data)


class CaissierDashboardView(APIView):
    """Caissier dashboard statistics"""
    permission_classes = [IsCaissierOrAbove]
    
    def get(self, request):
        today = timezone.now().date()
        today_start = timezone.make_aware(timezone.datetime.combine(today, timezone.datetime.min.time()))
        
        # Get current open folio for user
        current_folio = Folio.objects.filter(
            opened_by=request.user,
            status='OPEN'
        ).first()
        
        if not current_folio:
            # Try to get any open folio in user's branch
            if request.user.branch:
                current_folio = Folio.objects.filter(
                    branch=request.user.branch,
                    status='OPEN'
                ).first()
        
        opening_balance = float(current_folio.opening_balance) if current_folio else 0
        running_balance = current_folio.running_balance if current_folio else 0
        
        # Today's transactions for this user
        today_transactions = Transaction.objects.filter(
            created_by=request.user,
            created_at__gte=today_start
        ).count()
        
        # Last receipt
        last_receipt = Receipt.objects.filter(
            generated_by=request.user
        ).order_by('-generated_at').first()
        
        # Recent transactions
        recent_transactions = Transaction.objects.filter(
            created_by=request.user
        ).order_by('-created_at')[:10]
        
        data = {
            'current_folio': FolioSerializer(current_folio).data if current_folio else None,
            'opening_balance': opening_balance,
            'running_balance': running_balance,
            'today_transactions_count': today_transactions,
            'last_receipt_number': last_receipt.receipt_number if last_receipt else None,
            'recent_transactions': TransactionSerializer(recent_transactions, many=True).data
        }
        
        return Response(data)


# ==================== VIEWSETS ====================

class BranchViewSet(viewsets.ModelViewSet):
    """Branch management - Admin only"""
    queryset = Branch.objects.all().order_by('code')
    serializer_class = BranchSerializer
    permission_classes = [IsAdmin]


class UserViewSet(viewsets.ModelViewSet):
    """User management - Admin and Gérant"""
    queryset = User.objects.all().order_by('-date_joined')
    permission_classes = [CanManageUsers]
    
    def get_serializer_class(self):
        if self.action == 'create':
            return UserCreateSerializer
        return UserSerializer
    
    def get_queryset(self):
        queryset = super().get_queryset()
        user = self.request.user
        
        # Enforce Gérant restrictions
        if user.role == 'GERANT':
            queryset = queryset.filter(role='CAISSIER')
            if user.branch:
                queryset = queryset.filter(branch=user.branch)
        
        # Filter by role
        role = self.request.query_params.get('role')
        if role:
            # If Gérant, role filter is already restricted to CAISSIER
            if user.role != 'GERANT' or role == 'CAISSIER':
                queryset = queryset.filter(role=role)
        
        # Filter by branch
        branch_id = self.request.query_params.get('branch')
        if branch_id:
            if user.role != 'GERANT' or (user.branch and str(user.branch.id) == str(branch_id)) or not user.branch:
                queryset = queryset.filter(branch_id=branch_id)
        
        # Filter by active status
        is_active = self.request.query_params.get('is_active')
        if is_active is not None:
            queryset = queryset.filter(is_active=is_active.lower() == 'true')
        
        return queryset
        
    def perform_create(self, serializer):
        user = self.request.user
        
        # Enforce Gérant restrictions on creation
        if user.role == 'GERANT':
            # Force role to CAISSIER
            # Force branch to Gérant's branch if they have one
            save_kwargs = {'role': 'CAISSIER'}
            if user.branch:
                save_kwargs['branch'] = user.branch
            serializer.save(**save_kwargs)
        else:
            serializer.save()
    
    @action(detail=True, methods=['post'])
    def reset_password(self, request, pk=None):
        """Reset user password"""
        user = self.get_object()
        new_password = request.data.get('new_password')
        
        if not new_password or len(new_password) < 8:
            return Response({
                'success': False,
                'message': 'Mot de passe invalide (minimum 8 caractères)'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        user.set_password(new_password)
        user.save()
        
        log_audit(request.user, 'PASSWORD_CHANGE', obj=user, 
                  details=f'Password reset by admin', request=request)
        
        return Response({'success': True, 'message': 'Mot de passe réinitialisé'})
    
    @action(detail=True, methods=['post'])
    def toggle_active(self, request, pk=None):
        """Toggle user active status"""
        user = self.get_object()
        user.is_active = not user.is_active
        user.save()
        
        log_audit(request.user, 'UPDATE', obj=user,
                  details=f'User {"activated" if user.is_active else "deactivated"}',
                  request=request)
        
        return Response({
            'success': True,
            'is_active': user.is_active,
            'message': f'Utilisateur {"activé" if user.is_active else "désactivé"}'
        })


class FolioViewSet(viewsets.ModelViewSet):
    """Folio management with workflow"""
    queryset = Folio.objects.all().order_by('-opened_at')
    permission_classes = [CanManageFolio]
    
    def get_serializer_class(self):
        if self.action == 'create':
            return FolioCreateSerializer
        return FolioSerializer
    
    def get_queryset(self):
        queryset = super().get_queryset()
        user = self.request.user
        
        # CAISSIER: only sees folios explicitly assigned to them
        if user.role == 'CAISSIER':
            queryset = queryset.filter(assigned_users=user)
        # GERANT: sees folios for their branch
        elif user.role == 'GERANT' and user.branch:
            queryset = queryset.filter(Q(branch=user.branch) | Q(branch__isnull=True))
        # ADMIN: sees all folios (no filter)
        
        # Filter by status
        status_param = self.request.query_params.get('status')
        if status_param:
            queryset = queryset.filter(status=status_param)
        
        return queryset
    
    def create(self, request, *args, **kwargs):
        """Create and open a new Folio — Admin and GERANT only"""
        if request.user.role not in ['ADMIN', 'GERANT']:
            return Response({
                'success': False,
                'message': 'Seul un Administrateur ou Gérant peut créer un folio'
            }, status=status.HTTP_403_FORBIDDEN)
        
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        # Generate unique code
        code = f"FOLIO-{timezone.now().strftime('%Y%m%d')}-{uuid.uuid4().hex[:6].upper()}"
        
        # FEATURE 4 — Branch auto-link: GERANT's branch is used if no branch provided
        branch = serializer.validated_data.get('branch')
        if not branch and request.user.branch:
            branch = request.user.branch
        
        assigned_users = serializer.validated_data.pop('assigned_users', [])
        
        with db_transaction.atomic():
            folio = Folio.objects.create(
                code=code,
                branch=branch,
                opened_by=request.user,
                opening_balance=serializer.validated_data.get('opening_balance', 0),
                notes=serializer.validated_data.get('notes', ''),
                status='OPEN'
            )
            
            # Assign users if provided
            if assigned_users:
                folio.assigned_users.set(assigned_users)
            
            log_audit(request.user, 'OPEN_FOLIO', obj=folio, request=request)
        
        return Response({
            'success': True,
            'message': 'Folio ouvert avec succès',
            'folio': FolioSerializer(folio).data
        }, status=status.HTTP_201_CREATED)
    
    @action(detail=True, methods=['post'])
    def propose_closure(self, request, pk=None):
        """Propose folio closure (Caissier action)"""
        folio = self.get_object()
        
        if folio.status != 'OPEN':
            return Response({
                'success': False,
                'message': 'Seul un folio ouvert peut être proposé à la clôture'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        notes = request.data.get('notes', '')
        actual_balance = request.data.get('actual_physical_balance')
        cash_counts_data = request.data.get('cash_counts', [])
        
        with db_transaction.atomic():
            # Handle Cash Counts (Billetage)
            if cash_counts_data:
                # Clear existing counts if any (retry scenario)
                CashCount.objects.filter(folio=folio).delete()
                
                calculated_total = 0
                for item in cash_counts_data:
                    try:
                        denom_id = item.get('denomination')
                        quantity = int(item.get('quantity', 0))
                        
                        if quantity > 0:
                            denom = CashDenomination.objects.get(pk=denom_id)
                            CashCount.objects.create(
                                folio=folio,
                                denomination=denom,
                                quantity=quantity
                            )
                            calculated_total += float(denom.value) * quantity
                    except (CashDenomination.DoesNotExist, ValueError):
                        continue
                
                # Update actual balance from strict count
                actual_balance = calculated_total
            
            folio.status = 'CLOSURE_PROPOSED'
            folio.closure_proposed_by = request.user
            folio.closure_proposed_at = timezone.now()
            folio.closure_notes = notes
            
            if actual_balance is not None:
                folio.actual_physical_balance = actual_balance
                
            folio.save()
            
            log_audit(request.user, 'PROPOSE_CLOSURE', obj=folio, 
                      details=f"Notes: {notes} | Balance: {actual_balance}", request=request)
            
            # Notify Gérants
            gerants = User.objects.filter(
                Q(role='GERANT') | Q(role='ADMIN'),
                is_active=True
            )
            if folio.branch:
                gerants = gerants.filter(Q(branch=folio.branch) | Q(role='ADMIN'))
            
            for gerant in gerants:
                Notification.objects.create(
                    user=gerant,
                    notification_type='FOLIO_CLOSURE',
                    priority='HIGH',
                    title='NOTIF_FOLIO_CLOSURE_PROPOSED_TITLE',
                    message='NOTIF_FOLIO_CLOSURE_PROPOSED_MSG',
                    action_data={'folio_code': folio.code, 'user': request.user.get_full_name()},
                    action_url=f'/folios/{folio.id}'
                )
        
        return Response({
            'success': True,
            'message': 'Proposition de clôture envoyée',
            'folio': FolioSerializer(folio).data
        })
    
    @action(detail=True, methods=['post'])
    def approve_closure(self, request, pk=None):
        """Approve folio closure (Gérant/Admin action)"""
        folio = self.get_object()
        
        if request.user.role not in ['ADMIN', 'GERANT']:
            return Response({
                'success': False,
                'message': 'Seul un Gérant ou Admin peut approuver la clôture'
            }, status=status.HTTP_403_FORBIDDEN)
        
        if folio.status not in ['OPEN', 'CLOSURE_PROPOSED']:
            return Response({
                'success': False,
                'message': 'Ce folio ne peut pas être fermé'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        actual_balance = request.data.get('actual_physical_balance')
        notes = request.data.get('notes', '')
        
        with db_transaction.atomic():
            # Calculate closing balance
            receipts = folio.transactions.filter(
                type='RECEIPT', status='APPROVED'
            ).aggregate(total=Sum('amount'))['total'] or 0
            
            payments = folio.transactions.filter(
                type='PAYMENT', status='APPROVED'
            ).aggregate(total=Sum('amount'))['total'] or 0
            
            closing_balance = float(folio.opening_balance) + float(receipts) - float(payments)
            
            folio.status = 'CLOSED'
            folio.closed_by = request.user
            folio.closed_at = timezone.now()
            folio.closing_balance = closing_balance
            if actual_balance is not None:
                folio.actual_physical_balance = actual_balance
            if notes:
                folio.notes = (folio.notes or '') + f'\n[Clôture] {notes}'
            folio.save()
            
            log_audit(request.user, 'CLOSE_FOLIO', obj=folio,
                      details=f'Closing balance: {closing_balance}', request=request)
            
            # Delete pending closure notifications for this folio
            Notification.objects.filter(
                notification_type='FOLIO_CLOSURE',
                title__contains=folio.code
            ).delete()
            
            # Notify the proposer explicitly that it was approved
            if getattr(folio, 'closure_proposed_by', None):
                Notification.objects.create(
                    user=folio.closure_proposed_by,
                    notification_type='GENERAL',
                    priority='HIGH',
                    title='NOTIF_FOLIO_CLOSURE_APPROVED_TITLE',
                    message='NOTIF_FOLIO_CLOSURE_APPROVED_MSG',
                    action_data={'folio_code': folio.code, 'user': request.user.get_full_name()},
                    action_url=f'/folios/{folio.id}'
                )
            
            # Smart email alert
            send_smart_alert('folio_closure', {
                'folio': folio.code,
                'user': request.user.get_full_name() or request.user.username,
                'balance': float(folio.closing_balance)
            })
        
        return Response({
            'success': True,
            'message': 'Folio clôturé avec succès',
            'folio': FolioSerializer(folio).data
        })
    
    @action(detail=True, methods=['post'])
    def reject_closure(self, request, pk=None):
        """Reject folio closure proposal (Gérant/Admin action)"""
        folio = self.get_object()
        
        if request.user.role not in ['ADMIN', 'GERANT']:
            return Response({
                'success': False,
                'message': 'Seul un Gérant ou Admin peut rejeter la clôture'
            }, status=status.HTTP_403_FORBIDDEN)
        
        if folio.status != 'CLOSURE_PROPOSED':
            return Response({
                'success': False,
                'message': 'Aucune proposition de clôture en attente'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        reason = request.data.get('reason', 'Aucune raison fournie')
        
        with db_transaction.atomic():
            folio.status = 'OPEN'
            folio.closure_proposed_by = None
            folio.closure_proposed_at = None
            folio.notes = (folio.notes or '') + f'\n[Clôture refusée] {reason}'
            folio.save()
            
            log_audit(request.user, 'REJECT_CLOSURE', obj=folio,
                      reason=reason, request=request)
            
            # Notify the proposer explicitly
            if folio.closure_proposed_by:
                notif_user = folio.closure_proposed_by
                Notification.objects.create(
                    user=notif_user,
                    notification_type='GENERAL',
                    priority='HIGH',
                    title='NOTIF_FOLIO_CLOSURE_REJECTED_TITLE',
                    message='NOTIF_FOLIO_CLOSURE_REJECTED_MSG',
                    action_data={'folio_code': folio.code, 'reason': reason},
                    action_url=f'/folios/{folio.id}'
                )
            
            # Delete pending closure notifications for this folio
            Notification.objects.filter(
                notification_type='FOLIO_CLOSURE',
                title__contains=folio.code
            ).delete()
        
        return Response({
            'success': True,
            'message': 'Proposition de clôture refusée',
            'folio': FolioSerializer(folio).data
        })
    
    @action(detail=True, methods=['post'])
    def direct_close(self, request, pk=None):
        """FEATURE 3 — Directly close a folio (Admin/GERANT only, no CLOSURE_PROPOSED step needed)"""
        folio = self.get_object()
        
        if request.user.role not in ['ADMIN', 'GERANT']:
            return Response({
                'success': False,
                'message': 'Seul un Administrateur ou Gérant peut fermer directement un folio'
            }, status=status.HTTP_403_FORBIDDEN)
        
        if folio.status not in ['OPEN', 'CLOSURE_PROPOSED']:
            return Response({
                'success': False,
                'message': 'Ce folio ne peut pas être fermé (statut actuel: ' + folio.get_status_display() + ')'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        actual_balance = request.data.get('actual_physical_balance')
        notes = request.data.get('notes', '')
        
        with db_transaction.atomic():
            receipts = folio.transactions.filter(
                type='RECEIPT', status='APPROVED'
            ).aggregate(total=Sum('amount'))['total'] or 0
            payments = folio.transactions.filter(
                type='PAYMENT', status='APPROVED'
            ).aggregate(total=Sum('amount'))['total'] or 0
            closing_balance = float(folio.opening_balance) + float(receipts) - float(payments)
            
            folio.status = 'CLOSED'
            folio.closed_by = request.user
            folio.closed_at = timezone.now()
            folio.closing_balance = closing_balance
            if actual_balance is not None:
                folio.actual_physical_balance = actual_balance
            if notes:
                folio.notes = (folio.notes or '') + f'\n[Clôture directe] {notes}'
            folio.save()
            
            log_audit(request.user, 'CLOSE_FOLIO', obj=folio,
                      details=f'Direct close. Closing balance: {closing_balance}', request=request)
            
            # Notify assigned users
            for assigned_user in folio.assigned_users.all():
                Notification.objects.create(
                    user=assigned_user,
                    notification_type='FOLIO_CLOSURE',
                    priority='HIGH',
                    title='NOTIF_FOLIO_CLOSED_TITLE',
                    message='NOTIF_FOLIO_CLOSED_MSG',
                    action_data={'folio_code': folio.code, 'user': request.user.get_full_name()},
                    action_url=f'/folios/{folio.id}'
                )
        
        return Response({
            'success': True,
            'message': 'Folio clôturé avec succès',
            'folio': FolioSerializer(folio).data
        })
    
    @action(detail=True, methods=['post'])
    def assign_users(self, request, pk=None):
        """FEATURE 1 — Assign CAISSIER users to a folio (Admin only)"""
        if request.user.role not in ['ADMIN', 'GERANT']:
            return Response({
                'success': False,
                'message': 'Seul un Administrateur ou Gérant peut assigner des utilisateurs'
            }, status=status.HTTP_403_FORBIDDEN)
        
        folio = self.get_object()
        user_ids = request.data.get('user_ids', [])
        
        if not isinstance(user_ids, list):
            return Response({
                'success': False,
                'message': 'user_ids doit être une liste'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        users_to_assign = User.objects.filter(id__in=user_ids, is_active=True)
        
        with db_transaction.atomic():
            folio.assigned_users.set(users_to_assign)
            folio.save()
            
            log_audit(request.user, 'UPDATE', obj=folio,
                      details=f'Assigned users: {[u.username for u in users_to_assign]}',
                      request=request)
            
            # Notify newly assigned users
            for u in users_to_assign:
                Notification.objects.create(
                    user=u,
                    notification_type='GENERAL',
                    priority='MEDIUM',
                    title='NOTIF_FOLIO_ASSIGNED_TITLE',
                    message='NOTIF_FOLIO_ASSIGNED_MSG',
                    action_data={'folio_code': folio.code, 'user': request.user.get_full_name()},
                    action_url=f'/folios/{folio.id}'
                )
        
        return Response({
            'success': True,
            'message': f'{users_to_assign.count()} utilisateur(s) assigné(s) au folio',
            'folio': FolioSerializer(folio).data
        })
    
    @action(detail=True, methods=['get'])
    def print_summary(self, request, pk=None):
        """Generate PDF summary for folio"""
        folio = self.get_object()
        
        buffer = io.BytesIO()
        doc = SimpleDocTemplate(buffer, pagesize=A4, topMargin=20*mm, bottomMargin=20*mm)
        
        styles = getSampleStyleSheet()
        title_style = ParagraphStyle(
            'CustomTitle',
            parent=styles['Heading1'],
            fontSize=18,
            alignment=TA_CENTER,
            spaceAfter=12
        )
        
        elements = []
        
        # Title
        elements.append(Paragraph(f"Résumé du Folio: {folio.code}", title_style))
        elements.append(Spacer(1, 12))
        
        # Folio info
        info_data = [
            ['Ouvert par:', folio.opened_by.get_full_name()],
            ['Date ouverture:', folio.opened_at.strftime('%d/%m/%Y %H:%M')],
            ['Solde ouverture:', f"{folio.opening_balance:,.2f} MRU"],
            ['Statut:', folio.get_status_display()],
        ]
        
        if folio.status == 'CLOSED':
            info_data.extend([
                ['Fermé par:', folio.closed_by.get_full_name() if folio.closed_by else '-'],
                ['Date clôture:', folio.closed_at.strftime('%d/%m/%Y %H:%M') if folio.closed_at else '-'],
                ['Solde clôture:', f"{folio.closing_balance:,.2f} MRU" if folio.closing_balance else '-'],
            ])
        
        info_table = Table(info_data, colWidths=[120, 300])
        info_table.setStyle(TableStyle([
            ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, -1), 10),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
        ]))
        elements.append(info_table)
        elements.append(Spacer(1, 20))
        
        # Transactions summary
        elements.append(Paragraph("Résumé des transactions", styles['Heading2']))
        
        receipts = folio.transactions.filter(type='RECEIPT', status='APPROVED')
        payments = folio.transactions.filter(type='PAYMENT', status='APPROVED')
        
        total_receipts = receipts.aggregate(total=Sum('amount'))['total'] or 0
        total_payments = payments.aggregate(total=Sum('amount'))['total'] or 0
        
        summary_data = [
            ['Type', 'Nombre', 'Montant Total'],
            ['Encaissements', str(receipts.count()), f"{total_receipts:,.2f} MRU"],
            ['Décaissements', str(payments.count()), f"{total_payments:,.2f} MRU"],
            ['Solde Net', '', f"{float(total_receipts) - float(total_payments):,.2f} MRU"],
        ]
        
        summary_table = Table(summary_data, colWidths=[200, 100, 150])
        summary_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#1e3a5f')),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
            ('ALIGN', (1, 0), (-1, -1), 'RIGHT'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, -1), 10),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
            ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
        ]))
        elements.append(summary_table)
        
        # Build PDF
        doc.build(elements)
        buffer.seek(0)
        
        log_audit(request.user, 'EXPORT', obj=folio,
                  details='PDF summary generated', request=request)
        
        response = HttpResponse(buffer, content_type='application/pdf')
        response['Content-Disposition'] = f'attachment; filename="folio_{folio.code}.pdf"'
        return response


class TransactionViewSet(viewsets.ModelViewSet):
    """Transaction management"""
    queryset = Transaction.objects.all().order_by('-created_at')
    permission_classes = [CanManageTransaction]
    
    def get_serializer_class(self):
        if self.action == 'create':
            return TransactionCreateSerializer
        return TransactionSerializer
    
    def get_queryset(self):
        queryset = super().get_queryset()
        user = self.request.user
        
        # Filter by user's branch for non-admins
        if user.role == 'GERANT' and user.branch:
            queryset = queryset.filter(folio__branch=user.branch)
        
        # FEATURE 1: CAISSIER only sees their own transactions
        if user.role == 'CAISSIER':
            queryset = queryset.filter(created_by=user)
        
        # Additional filters
        folio_id = self.request.query_params.get('folio')
        if folio_id:
            queryset = queryset.filter(folio_id=folio_id)
        
        tx_type = self.request.query_params.get('type')
        if tx_type:
            queryset = queryset.filter(type=tx_type)
        
        tx_status = self.request.query_params.get('status')
        if tx_status:
            queryset = queryset.filter(status=tx_status)
        
        date_from = self.request.query_params.get('date_from')
        if date_from:
            queryset = queryset.filter(created_at__date__gte=date_from)
        
        date_to = self.request.query_params.get('date_to')
        if date_to:
            queryset = queryset.filter(created_at__date__lte=date_to)
        
        return queryset
    
    def create(self, request, *args, **kwargs):
        """Create a new transaction"""
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        folio = serializer.validated_data['folio']
        
        if folio.status != 'OPEN':
            return Response({
                'success': False,
                'message': 'Impossible d\'ajouter une transaction à un folio fermé'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Check approval threshold based on tiered limits
        amount = float(serializer.validated_data['amount'])
        approval_setting = SystemSettings.objects.filter(key='approval').first()
        
        requires_approval = False
        requires_admin = False
        
        if approval_setting and isinstance(approval_setting.value, dict):
            gerant_limit = float(approval_setting.value.get('transaction_threshold', 0))
            admin_limit = float(approval_setting.value.get('admin_transaction_threshold', 0))
            
            if admin_limit > 0 and amount >= admin_limit:
                requires_approval = True
                requires_admin = True
            elif gerant_limit > 0 and amount >= gerant_limit:
                requires_approval = True
        else:
            # Fallback for old setting structure
            approval_threshold = SystemSettings.objects.filter(key='approval_threshold').first()
            if approval_threshold and amount >= float(approval_threshold.value.get('amount', 0)):
                requires_approval = True
        
        with db_transaction.atomic():
            # Generate receipt number for RECEIPT type
            receipt_number = None
            if serializer.validated_data['type'] == 'RECEIPT':
                from .services import SequencingService  # Import here to avoid circular dependency if any
                receipt_number = SequencingService.get_next_sequence('REC')
            
            transaction = Transaction.objects.create(
                **serializer.validated_data,
                created_by=request.user,
                receipt_number=receipt_number,
                status='PENDING' if requires_approval else 'APPROVED',
                requires_approval=requires_approval
            )
            
            
            log_audit(request.user, 'CREATE_TRANSACTION', obj=transaction, request=request)
            
            # Smart email alert
            send_smart_alert('high_value_transaction', {
                'amount': float(transaction.amount),
                'user': request.user.get_full_name() or request.user.username,
                'folio': folio.code
            })
            
            if requires_approval:
                # Only notify ADMINs if it's an admin-level transaction,
                # otherwise notify both ADMIN and GERANT
                if requires_admin:
                    approvers = User.objects.filter(role='ADMIN', is_active=True)
                else:
                    approvers = User.objects.filter(role__in=['ADMIN', 'GERANT'], is_active=True)
                
                for approver in approvers:
                    Notification.objects.create(
                        user=approver,
                        notification_type='TRANSACTION_APPROVAL',
                        priority='HIGH',
                        title='NOTIF_TX_APPROVAL_TITLE',
                        message='NOTIF_TX_APPROVAL_MSG',
                        action_data={
                            'amount': str(amount),
                            'user': request.user.get_full_name() or request.user.username,
                            'admin_only': requires_admin
                        },
                        action_url='/transactions'
                    )
        
        return Response({
            'success': True,
            'message': 'Transaction créée' + (' (en attente d\'approbation)' if requires_approval else ''),
            'transaction': TransactionSerializer(transaction).data
        }, status=status.HTTP_201_CREATED)
    
    @action(detail=True, methods=['post'])
    def approve(self, request, pk=None):
        """Approve a pending transaction"""
        transaction = self.get_object()
        
        if transaction.status != 'PENDING':
            return Response({
                'success': False,
                'message': 'Cette transaction n\'est pas en attente d\'approbation'
            }, status=status.HTTP_400_BAD_REQUEST)
            
        with db_transaction.atomic():
            requires_admin = False
            approval_settings = SystemSettings.objects.filter(key='approval').first()
            if approval_settings and isinstance(approval_settings.value, dict):
                admin_limit = float(approval_settings.value.get('admin_transaction_threshold', 0))
                if admin_limit > 0 and float(transaction.amount) >= admin_limit:
                    requires_admin = True
                    
            if requires_admin and request.user.role != 'ADMIN':
                return Response({
                    'success': False,
                    'message': f'Cette transaction nécessite l\'approbation d\'un Administrateur (montant >= {admin_limit})'
                }, status=status.HTTP_403_FORBIDDEN)
                
            if request.user.role not in ['ADMIN', 'GERANT']:
                return Response({
                    'success': False,
                    'message': 'Non autorisé'
                }, status=status.HTTP_403_FORBIDDEN)
                
            transaction.status = 'APPROVED'
            transaction.save()
            
            log_audit(request.user, 'APPROVE_TRANSACTION', obj=transaction, request=request)
            
            # Send smart email alert if it was a high-value transaction
            send_smart_alert('high_value_transaction', {
                'amount': float(transaction.amount),
                'user': request.user.get_full_name() or request.user.username,
                'folio': transaction.folio.code if transaction.folio else 'N/A'
            })
            
            Notification.objects.create(
                user=transaction.created_by,
                notification_type='GENERAL',
                priority='LOW',
                title='NOTIF_TX_APPROVED_TITLE',
                message='NOTIF_TX_APPROVED_MSG',
                action_data={'ref': str(transaction.id)[:8], 'amount': str(transaction.amount)},
                action_url='/transactions'
            )
            
        return Response({
            'success': True,
            'message': 'Transaction approuvée',
            'transaction': TransactionSerializer(transaction).data
        })

    @action(detail=True, methods=['post'])
    def reject(self, request, pk=None):
        """Reject a pending transaction"""
        transaction = self.get_object()
        
        if transaction.status != 'PENDING':
            return Response({
                'success': False,
                'message': 'Cette transaction n\'est pas en attente d\'approbation'
            }, status=status.HTTP_400_BAD_REQUEST)
            
        if request.user.role not in ['ADMIN', 'GERANT']:
            return Response({
                'success': False,
                'message': 'Non autorisé'
            }, status=status.HTTP_403_FORBIDDEN)
            
        # Check if this is an admin-only transaction
        approval_settings = SystemSettings.objects.filter(key='approval').first()
        if approval_settings and isinstance(approval_settings.value, dict):
            admin_limit = float(approval_settings.value.get('admin_transaction_threshold', 0))
            if admin_limit > 0 and float(transaction.amount) >= admin_limit:
                if request.user.role != 'ADMIN':
                    return Response({
                        'success': False,
                        'message': f'Cette transaction nécessite l\'autorisation d\'un Administrateur.'
                    }, status=status.HTTP_403_FORBIDDEN)

            transaction.status = 'REJECTED'
            transaction.save()
            
            log_audit(request.user, 'REJECT_TRANSACTION', obj=transaction, request=request)
            
            Notification.objects.create(
                user=transaction.created_by,
                notification_type='GENERAL',
                priority='MEDIUM',
                title='Transaction refusée',
                message=f'Votre transaction de {transaction.amount} MRU a été refusée.',
                action_data={'ref': str(transaction.id)[:8]},
                action_url='/transactions'
            )
            
        return Response({
            'success': True,
            'message': 'Transaction refusée',
            'transaction': TransactionSerializer(transaction).data
        })

    @action(detail=True, methods=['post'])
    def void(self, request, pk=None):
        """Void a transaction"""
        transaction = self.get_object()
        
        if transaction.is_void:
            return Response({
                'success': False,
                'message': 'Cette transaction est déjà annulée'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        reason = request.data.get('reason')
        if not reason or len(reason) < 10:
            return Response({
                'success': False,
                'message': 'Une raison détaillée est requise (minimum 10 caractères)'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        user = request.user
        # FEATURE 2 — Any non-admin/non-gerant role must go through request workflow
        needs_approval = user.role not in ['ADMIN', 'GERANT']
        
        with db_transaction.atomic():
            if needs_approval:
                # Caissier requests void, needs Gérant approval
                transaction.status = 'PENDING'
                transaction.void_reason = reason
                transaction.void_requested_by = user
                transaction.save()
                
                # Notify approvers
                approvers = User.objects.filter(
                    role__in=['ADMIN', 'GERANT'],
                    is_active=True
                )
                for approver in approvers:
                    Notification.objects.create(
                        user=approver,
                        notification_type='VOID_REQUEST',
                        priority='HIGH',
                        title='NOTIF_VOID_REQUEST_TITLE',
                        message='NOTIF_VOID_REQUEST_MSG',
                        action_data={'ref': str(transaction.id)[:8], 'user': user.get_full_name() or user.username},
                        action_url='/transactions'
                    )
                
                log_audit(user, 'VOID_REQUEST', obj=transaction, reason=reason, request=request)
                
                return Response({
                    'success': True,
                    'message': 'Demande d\'annulation envoyée pour approbation'
                })
            else:
                # Gérant/Admin can void directly
                transaction.is_void = True
                transaction.status = 'VOID'
                transaction.void_reason = reason
                transaction.void_approved_by = user
                transaction.voided_at = timezone.now()
                transaction.save()
                
                log_audit(user, 'VOID_TRANSACTION', obj=transaction, reason=reason, request=request)
                
                return Response({
                    'success': True,
                    'message': 'Transaction annulée',
                    'transaction': TransactionSerializer(transaction).data
                })
    
    @action(detail=True, methods=['post'])
    def approve_void(self, request, pk=None):
        """FEATURE 2 — Approve a pending void request (Admin/GERANT only)"""
        if request.user.role not in ['ADMIN', 'GERANT']:
            return Response({
                'success': False,
                'message': 'Seul un Administrateur ou Gérant peut approuver une annulation'
            }, status=status.HTTP_403_FORBIDDEN)
        
        transaction = self.get_object()
        
        if not (transaction.void_requested_by and transaction.status == 'PENDING'):
            return Response({
                'success': False,
                'message': 'Aucune demande d\'annulation en attente pour cette transaction'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        with db_transaction.atomic():
            transaction.is_void = True
            transaction.status = 'VOID'
            transaction.void_approved_by = request.user
            transaction.voided_at = timezone.now()
            transaction.save()
            
            log_audit(request.user, 'VOID_TRANSACTION', obj=transaction,
                      reason=transaction.void_reason, request=request)
            
            # Notify the requester
            if transaction.void_requested_by:
                Notification.objects.create(
                    user=transaction.void_requested_by,
                    notification_type='VOID_REQUEST',
                    priority='MEDIUM',
                    title='NOTIF_VOID_APPROVED_TITLE',
                    message='NOTIF_VOID_APPROVED_MSG',
                    action_data={'ref': str(transaction.id)[:8]},
                    action_url='/transactions'
                )
        
        return Response({
            'success': True,
            'message': 'Transaction annulée avec succès',
            'transaction': TransactionSerializer(transaction).data
        })
    
    @action(detail=True, methods=['post'])
    def reject_void(self, request, pk=None):
        """Reject a pending void request (Admin/GERANT only)"""
        if request.user.role not in ['ADMIN', 'GERANT']:
            return Response({
                'success': False,
                'message': 'Non autorisé'
            }, status=status.HTTP_403_FORBIDDEN)
        
        transaction = self.get_object()
        
        if not (transaction.void_requested_by and transaction.status == 'PENDING'):
            return Response({
                'success': False,
                'message': 'Aucune demande d\'annulation en attente pour cette transaction'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        rejection_reason = request.data.get('reason', 'Demande refusée')
        
        with db_transaction.atomic():
            # Save requester reference before clearing
            original_requester = transaction.void_requested_by
            
            # Restore the transaction to APPROVED
            transaction.status = 'APPROVED'
            transaction.void_requested_by = None
            transaction.void_reason = None
            transaction.save()
            
            log_audit(request.user, 'UPDATE', obj=transaction,
                      details=f'Void request rejected: {rejection_reason}', request=request)
            
            # Notify the requester
            if original_requester:
                Notification.objects.create(
                    user=original_requester,
                    notification_type='VOID_REQUEST',
                    priority='MEDIUM',
                    title='NOTIF_VOID_REJECTED_TITLE',
                    message='NOTIF_VOID_REJECTED_MSG',
                    action_data={'reason': rejection_reason},
                    action_url='/transactions'
                )
        
        return Response({
            'success': True,
            'message': 'Demande d\'annulation refusée',
            'transaction': TransactionSerializer(transaction).data
        })
    
    @action(detail=True, methods=['post'])
    def print_receipt(self, request, pk=None):
        """Generate PDF receipt"""
        transaction = self.get_object()
        
        if transaction.type != 'RECEIPT':
            return Response({
                'success': False,
                'message': 'Seules les transactions de type Encaissement peuvent avoir un reçu'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        buffer = io.BytesIO()
        doc = SimpleDocTemplate(buffer, pagesize=A4, topMargin=15*mm, bottomMargin=15*mm)
        
        styles = getSampleStyleSheet()
        title_style = ParagraphStyle(
            'ReceiptTitle',
            parent=styles['Heading1'],
            fontSize=16,
            alignment=TA_CENTER,
            spaceAfter=10
        )
        center_style = ParagraphStyle(
            'Center',
            parent=styles['Normal'],
            alignment=TA_CENTER
        )
        
        elements = []
        
        # Header
        elements.append(Paragraph("NexaSolft", title_style))
        elements.append(Paragraph("Système de Gestion de Trésorerie", center_style))
        elements.append(Spacer(1, 20))
        
        # Receipt title
        elements.append(Paragraph("REÇU D'ENCAISSEMENT", ParagraphStyle(
            'ReceiptHeader',
            parent=styles['Heading2'],
            alignment=TA_CENTER,
            textColor=colors.HexColor('#1e3a5f')
        )))
        elements.append(Spacer(1, 15))
        
        # Receipt info
        receipt_data = [
            ['N° Reçu:', transaction.receipt_number or f"REC-{transaction.id}"],
            ['Date:', transaction.created_at.strftime('%d/%m/%Y %H:%M')],
            ['Folio:', transaction.folio.code],
            [''],
            ['Montant:', f"{transaction.amount:,.2f} MRU"],
            ['Méthode:', transaction.get_payment_method_display()],
            ['Référence:', transaction.reference or '-'],
        ]
        
        if transaction.client_name:
            receipt_data.append(['Client:', transaction.client_name])
        
        if transaction.description:
            receipt_data.append(['Description:', transaction.description])
        
        receipt_table = Table(receipt_data, colWidths=[100, 300])
        receipt_table.setStyle(TableStyle([
            ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, -1), 11),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
            ('LINEBELOW', (0, 3), (-1, 3), 1, colors.grey),
        ]))
        elements.append(receipt_table)
        elements.append(Spacer(1, 30))
        
        # Footer
        elements.append(Paragraph(f"Émis par: {transaction.created_by.get_full_name()}", center_style))
        elements.append(Paragraph("Merci pour votre confiance", center_style))
        
        doc.build(elements)
        buffer.seek(0)
        
        # Create or update receipt record
        receipt, created = Receipt.objects.get_or_create(
            transaction=transaction,
            defaults={
                'generated_by': request.user,
                'receipt_number': transaction.receipt_number or f"REC-{transaction.id}"
            }
        )
        if not created:
            receipt.print_count += 1
            receipt.save()
        
        log_audit(request.user, 'PRINT_RECEIPT', obj=transaction, request=request)
        
        response = HttpResponse(buffer, content_type='application/pdf')
        response['Content-Disposition'] = f'attachment; filename="receipt_{transaction.receipt_number or transaction.id}.pdf"'
        return response
    
    @action(detail=False, methods=['get'])
    def export(self, request):
        """Export transactions to CSV"""
        import csv
        
        queryset = self.filter_queryset(self.get_queryset())
        
        response = HttpResponse(content_type='text/csv')
        response['Content-Disposition'] = f'attachment; filename="transactions_{timezone.now().strftime("%Y%m%d")}.csv"'
        response.write('\ufeff')  # BOM for Excel UTF-8
        
        writer = csv.writer(response)
        writer.writerow([
            'ID', 'Date', 'Folio', 'Type', 'Montant', 'Devise', 
            'Méthode', 'Référence', 'Description', 'Créé par', 'Statut', 'N° Reçu'
        ])
        
        for tx in queryset:
            writer.writerow([
                tx.id,
                tx.created_at.strftime('%Y-%m-%d %H:%M:%S'),
                tx.folio.code,
                tx.get_type_display(),
                tx.amount,
                tx.currency,
                tx.get_payment_method_display(),
                tx.reference or '',
                tx.description or '',
                tx.created_by.get_full_name(),
                tx.get_status_display(),
                tx.receipt_number or ''
            ])
        
        log_audit(request.user, 'EXPORT', details=f'Exported {queryset.count()} transactions', request=request)
        
        return response


class SettlementViewSet(viewsets.ModelViewSet):
    """Settlement management with approval workflow"""
    queryset = Settlement.objects.all().order_by('-created_at')
    serializer_class = SettlementSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_serializer_class(self):
        if self.action == 'create':
            return SettlementCreateSerializer
        return SettlementSerializer
    
    def get_queryset(self):
        queryset = super().get_queryset()
        user = self.request.user
        
        # Filter based on role
        if user.role == 'SAISIE_FACTURE':
            queryset = queryset.none() # Saisie Facture can no longer access settlements
        
        # Status filter
        status_param = self.request.query_params.get('status')
        if status_param:
            queryset = queryset.filter(status=status_param)
        
        # Party type filter
        party_type = self.request.query_params.get('party_type')
        if party_type:
            queryset = queryset.filter(party_type=party_type)
        
        return queryset
    
    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        invoice_ids = serializer.validated_data.pop('invoice_ids', [])
        settlement_amount = serializer.validated_data.get('amount', 0)
        
        # Overpayment guard: validate each linked invoice won't be overpaid
        if invoice_ids:
            invoices_to_link = Invoice.objects.filter(id__in=invoice_ids)
            for invoice in invoices_to_link:
                # Sum all approved/proposed settlements already linked to this invoice
                already_paid = Settlement.objects.filter(
                    invoices=invoice,
                    status__in=['DRAFT', 'PROPOSED', 'APPROVED']
                ).aggregate(total=Sum('amount'))['total'] or 0
                
                projected_total = already_paid + settlement_amount
                if projected_total > invoice.total_amount:
                    overpay = float(projected_total - invoice.total_amount)
                    return Response({
                        'success': False,
                        'message': (
                            f"Dépassement détecté sur la facture {invoice.invoice_number} "
                            f"({invoice.party_name}). Montant restant : {float(invoice.remaining_amount):.2f} MRU. "
                            f"Vous avez saisi {float(settlement_amount):.2f} MRU, ce qui dépasse de {overpay:.2f} MRU."
                        )
                    }, status=status.HTTP_400_BAD_REQUEST)
        
        with db_transaction.atomic():
            settlement = Settlement.objects.create(
                **serializer.validated_data,
                created_by=request.user,
                status='DRAFT'
            )
            
            if invoice_ids:
                settlement.invoices.set(Invoice.objects.filter(id__in=invoice_ids))
            
            log_audit(request.user, 'CREATE_SETTLEMENT', obj=settlement, request=request)
        
        return Response({
            'success': True,
            'message': 'Règlement créé en brouillon',
            'settlement': SettlementSerializer(settlement).data
        }, status=status.HTTP_201_CREATED)
    
    @action(detail=True, methods=['post'])
    def propose(self, request, pk=None):
        """Submit settlement for approval"""
        settlement = self.get_object()
        
        if settlement.status != 'DRAFT':
            return Response({
                'success': False,
                'message': 'Seul un brouillon peut être proposé'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        with db_transaction.atomic():
            settlement.status = 'PROPOSED'
            settlement.proposed_at = timezone.now()
            settlement.save()
            
            log_audit(request.user, 'PROPOSE_SETTLEMENT', obj=settlement, request=request)
            
            # Notify approvers
            approvers = User.objects.filter(
                role__in=['ADMIN', 'GERANT'],
                is_active=True
            )
            for approver in approvers:
                Notification.objects.create(
                    user=approver,
                    notification_type='SETTLEMENT_APPROVAL',
                    priority='MEDIUM',
                    title='NOTIF_SETTLEMENT_APPROVAL_REQUIRED_TITLE',
                    message='NOTIF_SETTLEMENT_APPROVAL_REQUIRED_MSG',
                    action_data={'amount': str(settlement.amount), 'party_name': settlement.party_name},
                    action_url='/settlements'
                )
        
        return Response({
            'success': True,
            'message': 'Règlement soumis pour approbation',
            'settlement': SettlementSerializer(settlement).data
        })
    
    @action(detail=True, methods=['post'])
    def approve(self, request, pk=None):
        """Approve settlement (Gérant/Admin)"""
        if request.user.role not in ['ADMIN', 'GERANT']:
            return Response({
                'success': False,
                'message': 'Non autorisé'
            }, status=status.HTTP_403_FORBIDDEN)
        
        settlement = self.get_object()
        
        if settlement.status != 'PROPOSED':
            return Response({
                'success': False,
                'message': 'Ce règlement ne peut pas être approuvé'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        with db_transaction.atomic():
            settlement.status = 'APPROVED'
            settlement.approved_by = request.user
            settlement.approved_at = timezone.now()
            settlement.save()
            
            # Update linked invoices
            for invoice in settlement.invoices.all():
                invoice.paid_amount += settlement.amount
                if invoice.paid_amount >= invoice.total_amount:
                    invoice.status = 'PAID'
                else:
                    invoice.status = 'PARTIAL'
                invoice.save()
            
            log_audit(request.user, 'APPROVE_SETTLEMENT', obj=settlement, request=request)
            
            # Notify creator
            Notification.objects.create(
                user=settlement.created_by,
                notification_type='GENERAL',
                priority='LOW',
                title='NOTIF_SETTLEMENT_APPROVED_TITLE',
                    message='NOTIF_SETTLEMENT_APPROVED_MSG',
                    action_data={'party_name': settlement.party_name},
                action_url='/settlements'
            )
            
            # Smart email alert
            send_smart_alert('settlement_approval', {
                'amount': float(settlement.amount),
                'user': request.user.get_full_name() or request.user.username,
                'party_name': settlement.party_name
            })
        
        return Response({
            'success': True,
            'message': 'Règlement approuvé',
            'settlement': SettlementSerializer(settlement).data
        })
    
    @action(detail=True, methods=['post'])
    def reject(self, request, pk=None):
        """Reject settlement (Gérant/Admin)"""
        if request.user.role not in ['ADMIN', 'GERANT']:
            return Response({
                'success': False,
                'message': 'Non autorisé'
            }, status=status.HTTP_403_FORBIDDEN)
        
        settlement = self.get_object()
        reason = request.data.get('reason', 'Aucune raison fournie')
        
        if settlement.status != 'PROPOSED':
            return Response({
                'success': False,
                'message': 'Ce règlement ne peut pas être rejeté'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        with db_transaction.atomic():
            settlement.status = 'REJECTED'
            settlement.rejection_reason = reason
            settlement.save()
            
            log_audit(request.user, 'REJECT_SETTLEMENT', obj=settlement, reason=reason, request=request)
            
            # Notify creator
            Notification.objects.create(
                user=settlement.created_by,
                notification_type='GENERAL',
                priority='MEDIUM',
                title='NOTIF_SETTLEMENT_REJECTED_TITLE',
                    message='NOTIF_SETTLEMENT_REJECTED_MSG',
                    action_data={'reason': reason},
                action_url='/settlements'
            )
        
        return Response({
            'success': True,
            'message': 'Règlement rejeté',
            'settlement': SettlementSerializer(settlement).data
        })


class InvoiceViewSet(viewsets.ModelViewSet):
    """Invoice management"""
    queryset = Invoice.objects.all().order_by('-created_at')
    permission_classes = [permissions.IsAuthenticated]
    
    def get_serializer_class(self):
        if self.action == 'create':
            return InvoiceCreateSerializer
        return InvoiceSerializer
    
    def get_queryset(self):
        queryset = super().get_queryset()
        
        # Filter by type
        invoice_type = self.request.query_params.get('type')
        if invoice_type:
            queryset = queryset.filter(invoice_type=invoice_type)
        
        # Filter by status
        status_param = self.request.query_params.get('status')
        if status_param:
            queryset = queryset.filter(status=status_param)
        
        # Filter open invoices
        open_only = self.request.query_params.get('open_only')
        if open_only and open_only.lower() == 'true':
            queryset = queryset.filter(status__in=['DRAFT', 'SENT', 'PARTIAL'])
        
        # Role-based filtering
        user = self.request.user# Assuming other roles like ADMIN, GERANT, CAISSIER can see all invoices or have other rules defined elsewhere
        
        return queryset
    
    def perform_create(self, serializer):
        from .services import SequencingService
        invoice_number = SequencingService.get_next_sequence('INV')
        serializer.save(
            created_by=self.request.user,
            invoice_number=invoice_number
        )


class NotificationViewSet(viewsets.ModelViewSet):
    """User notifications"""
    serializer_class = NotificationSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        return Notification.objects.filter(user=self.request.user).order_by('-created_at')
    
    @action(detail=False, methods=['get'])
    def unread_count(self, request):
        count = self.get_queryset().filter(is_read=False).count()
        return Response({'count': count})
    
    @action(detail=True, methods=['post'])
    def mark_read(self, request, pk=None):
        notification = self.get_object()
        notification.is_read = True
        notification.read_at = timezone.now()
        notification.save()
        return Response({'success': True})
    
    @action(detail=False, methods=['post'])
    def mark_all_read(self, request):
        self.get_queryset().filter(is_read=False).update(
            is_read=True,
            read_at=timezone.now()
        )
        return Response({'success': True})


class DocumentViewSet(viewsets.ModelViewSet):
    """Document/Attachment management"""
    queryset = Document.objects.all().order_by('-uploaded_at')
    serializer_class = DocumentSerializer
    permission_classes = [permissions.IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]
    
    def perform_create(self, serializer):
        file = self.request.FILES.get('file')
        serializer.save(
            uploaded_by=self.request.user,
            file_size=file.size if file else None
        )


class SystemSettingsViewSet(viewsets.ModelViewSet):
    """System settings - Admin only"""
    queryset = SystemSettings.objects.all()
    serializer_class = SystemSettingsSerializer
    permission_classes = [CanManageSettings]
    
    def perform_update(self, serializer):
        before = SystemSettingsSerializer(self.get_object()).data
        instance = serializer.save(updated_by=self.request.user)
        after = SystemSettingsSerializer(instance).data
        
        log_audit(
            self.request.user, 'SETTINGS_CHANGE',
            obj=instance,
            before=before,
            after=after,
            request=self.request
        )


class AuditLogViewSet(viewsets.ReadOnlyModelViewSet):
    """Audit log viewer - Admin/Gérant only"""
    queryset = AuditLog.objects.all().order_by('-timestamp')
    serializer_class = AuditLogSerializer
    permission_classes = [CanViewAuditLogs]
    
    def get_queryset(self):
        queryset = super().get_queryset()
        
        # Gérant can only see their branch logs
        if self.request.user.role == 'GERANT' and self.request.user.branch:
            # Filter by users in the same branch
            branch_users = User.objects.filter(branch=self.request.user.branch)
            queryset = queryset.filter(user__in=branch_users)
        
        # Filter by action
        action = self.request.query_params.get('action')
        if action:
            queryset = queryset.filter(action=action)
        
        # Filter by user
        user_id = self.request.query_params.get('user')
        if user_id:
            queryset = queryset.filter(user_id=user_id)
        
        # Filter by date
        date_from = self.request.query_params.get('date_from')
        if date_from:
            queryset = queryset.filter(timestamp__date__gte=date_from)
        
        date_to = self.request.query_params.get('date_to')
        if date_to:
            queryset = queryset.filter(timestamp__date__lte=date_to)
        
        return queryset

class PublicSettingsView(APIView):
    """Public settings for login and unauthenticated views"""
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        company_setting = SystemSettings.objects.filter(key='company').first()
        company_data = company_setting.value if company_setting else {
            'name': 'NexaSolft',
            'logo': ''
        }
        return Response({
            'company': {
                'name': company_data.get('name', 'NexaSolft'),
                'logo': company_data.get('logo', '')
            }
        })


class ReportsPDFView(APIView):
    """Generate a professional PDF report using ReportLab"""
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        if request.user.role not in ['ADMIN', 'GERANT']:
            return Response({'detail': 'Forbidden'}, status=status.HTTP_403_FORBIDDEN)

        # Query params
        date_from_str = request.query_params.get('date_from')
        date_to_str = request.query_params.get('date_to')
        type_filter = request.query_params.get('type', '')

        qs = Transaction.objects.filter(status='APPROVED', is_void=False)
        if date_from_str:
            qs = qs.filter(created_at__date__gte=date_from_str)
        if date_to_str:
            qs = qs.filter(created_at__date__lte=date_to_str)
        if type_filter:
            qs = qs.filter(type=type_filter)

        transactions = list(qs.order_by('created_at'))

        # Company info
        company_setting = SystemSettings.objects.filter(key='company').first()
        company = company_setting.value if company_setting else {}
        company_name = company.get('name', 'NexaSolft')
        company_phone = company.get('phone', '')
        company_email = company.get('email', '')
        company_website = company.get('website', '')

        # ---- Build PDF ----
        buffer = io.BytesIO()
        doc = SimpleDocTemplate(
            buffer,
            pagesize=A4,
            leftMargin=15 * mm,
            rightMargin=15 * mm,
            topMargin=15 * mm,
            bottomMargin=20 * mm,
        )

        styles = getSampleStyleSheet()
        BLUE = colors.HexColor('#1e5aeb')
        DARK = colors.HexColor('#1e293b')
        GRAY = colors.HexColor('#64748b')
        LIGHT = colors.HexColor('#f1f5f9')
        GREEN = colors.HexColor('#059669')
        RED = colors.HexColor('#dc2626')
        WHITE = colors.white

        title_style = ParagraphStyle('Title', fontSize=22, fontName='Helvetica-Bold', textColor=DARK, spaceAfter=2)
        sub_style = ParagraphStyle('Sub', fontSize=10, fontName='Helvetica', textColor=GRAY)
        section_style = ParagraphStyle('Section', fontSize=13, fontName='Helvetica-Bold', textColor=DARK, spaceBefore=14, spaceAfter=6)
        small_style = ParagraphStyle('Small', fontSize=8, fontName='Helvetica', textColor=GRAY)
        label_style = ParagraphStyle('Label', fontSize=9, fontName='Helvetica-Bold', textColor=DARK)

        story = []

        # ── Header ──────────────────────────────────────────────────────────
        period_str = ''
        if date_from_str and date_to_str:
            period_str = f"Période : {date_from_str}  →  {date_to_str}"
        elif date_from_str:
            period_str = f"À partir de : {date_from_str}"

        # Try to build logo element from base64
        logo_element = None
        logo_b64 = company.get('logo', '')
        if logo_b64 and logo_b64.startswith('data:image'):
            try:
                import base64
                header_split = logo_b64.split(',', 1)
                img_data = base64.b64decode(header_split[1])
                logo_buf = io.BytesIO(img_data)
                logo_element = Image(logo_buf, width=20 * mm, height=20 * mm)
                logo_element.hAlign = 'LEFT'
            except Exception:
                logo_element = None

        left_cell = logo_element if logo_element else Paragraph(
            f"<b><font color='#1e5aeb'>{company_name}</font></b>", title_style
        )

        header_data = [
            [
                left_cell,
                Paragraph(f"<b>Rapport de Trésorerie</b>", ParagraphStyle('rh', fontSize=16, fontName='Helvetica-Bold', textColor=DARK, alignment=2)),
            ],
            [
                Paragraph(f"<b><font color='#1e5aeb'>{company_name}</font></b><br/><font color='#64748b' size='9'>{company_phone}  {company_email}</font>", sub_style),
                Paragraph(period_str, ParagraphStyle('per', fontSize=9, fontName='Helvetica', textColor=GRAY, alignment=2)),
            ],
        ]

        header_table = Table(header_data, colWidths=[90 * mm, 90 * mm])
        header_table.setStyle(TableStyle([
            ('VALIGN', (0, 0), (-1, -1), 'TOP'),
            ('LINEBELOW', (0, 1), (-1, 1), 1.5, BLUE),
            ('BOTTOMPADDING', (0, 1), (-1, 1), 8),
        ]))
        story.append(header_table)
        story.append(Spacer(1, 8 * mm))

        # ── Stats Summary ──────────────────────────────────────────────────
        receipts = [tx for tx in transactions if tx.type == 'RECEIPT']
        payments = [tx for tx in transactions if tx.type == 'PAYMENT']
        total_in = sum(float(tx.amount) for tx in receipts)
        total_out = sum(float(tx.amount) for tx in payments)
        net = total_in - total_out

        def fmt(v):
            return f"{v:,.2f} MRU"

        stats_data = [
            [Paragraph("Recettes totales", label_style), Paragraph("Dépenses totales", label_style), Paragraph("Solde net", label_style)],
            [Paragraph(f"<font color='#059669'><b>+{fmt(total_in)}</b></font>", ParagraphStyle('v', fontSize=14, fontName='Helvetica-Bold', textColor=GREEN)),
             Paragraph(f"<font color='#dc2626'><b>-{fmt(total_out)}</b></font>", ParagraphStyle('v2', fontSize=14, fontName='Helvetica-Bold', textColor=RED)),
             Paragraph(f"<b>{'+' if net >= 0 else ''}{fmt(net)}</b>", ParagraphStyle('v3', fontSize=14, fontName='Helvetica-Bold', textColor=BLUE if net >= 0 else RED))],
            [Paragraph(f"{len(receipts)} transaction(s)", small_style), Paragraph(f"{len(payments)} transaction(s)", small_style), Paragraph("", small_style)],
        ]
        stats_table = Table(stats_data, colWidths=[60 * mm, 60 * mm, 60 * mm])
        stats_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, -1), LIGHT),
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#e2e8f0')),
            ('ROWBACKGROUNDS', (0, 1), (-1, 1), [WHITE]),
            ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
            ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
            ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#cbd5e1')),
            ('TOPPADDING', (0, 0), (-1, -1), 8),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
            ('ROUNDEDCORNERS', [4]),
        ]))
        story.append(stats_table)
        story.append(Spacer(1, 6 * mm))

        # ── Transactions Table ─────────────────────────────────────────────
        story.append(Paragraph("Détail des transactions", section_style))

        tx_header = ['Date', 'Référence', 'Type', 'Montant', 'Méthode', 'Folio', 'Créé par']
        tx_rows = [tx_header]
        for tx in transactions:
            type_label = 'Recette' if tx.type == 'RECEIPT' else 'Dépense'
            amount_str = f"+{fmt(float(tx.amount))}" if tx.type == 'RECEIPT' else f"-{fmt(float(tx.amount))}"
            tx_rows.append([
                tx.created_at.strftime('%d/%m/%Y %H:%M'),
                tx.reference or '-',
                type_label,
                amount_str,
                tx.payment_method or '-',
                tx.folio.code if tx.folio else '-',
                tx.created_by.get_full_name() or tx.created_by.username if tx.created_by else '-',
            ])

        if len(tx_rows) == 1:
            tx_rows.append(['Aucune transaction dans cette période', '', '', '', '', '', ''])

        col_w = [30, 32, 22, 30, 22, 22, 22]  # mm
        tx_table = Table(tx_rows, colWidths=[w * mm for w in col_w], repeatRows=1)
        tx_style = TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), BLUE),
            ('TEXTCOLOR', (0, 0), (-1, 0), WHITE),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, 0), 8),
            ('FONTSIZE', (0, 1), (-1, -1), 7),
            ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
            ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
            ('ROWBACKGROUNDS', (0, 1), (-1, -1), [WHITE, LIGHT]),
            ('GRID', (0, 0), (-1, -1), 0.3, colors.HexColor('#e2e8f0')),
            ('TOPPADDING', (0, 0), (-1, -1), 5),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 5),
        ])
        for i, tx in enumerate(transactions, start=1):
            color = colors.HexColor('#dcfce7') if tx.type == 'RECEIPT' else colors.HexColor('#fee2e2')
            tx_style.add('BACKGROUND', (3, i), (3, i), color)
        tx_table.setStyle(tx_style)
        story.append(tx_table)
        story.append(Spacer(1, 6 * mm))

        # ── Payment Methods Breakdown ──────────────────────────────────────
        method_map = {}
        for tx in transactions:
            m = tx.payment_method or 'Autre'
            if m not in method_map:
                method_map[m] = {'receipts': 0.0, 'payments': 0.0}
            if tx.type == 'RECEIPT':
                method_map[m]['receipts'] += float(tx.amount)
            else:
                method_map[m]['payments'] += float(tx.amount)

        if method_map:
            story.append(Paragraph("Répartition par méthode de paiement", section_style))
            meth_header = ['Méthode', 'Recettes', 'Dépenses', 'Total net']
            meth_rows = [meth_header]
            for m, vals in method_map.items():
                net_m = vals['receipts'] - vals['payments']
                meth_rows.append([
                    m, f"+{fmt(vals['receipts'])}", f"-{fmt(vals['payments'])}", fmt(net_m)
                ])
            meth_table = Table(meth_rows, colWidths=[50 * mm, 40 * mm, 40 * mm, 40 * mm])
            meth_table.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (-1, 0), DARK),
                ('TEXTCOLOR', (0, 0), (-1, 0), WHITE),
                ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
                ('FONTSIZE', (0, 0), (-1, -1), 8),
                ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
                ('ROWBACKGROUNDS', (0, 1), (-1, -1), [WHITE, LIGHT]),
                ('GRID', (0, 0), (-1, -1), 0.3, colors.HexColor('#e2e8f0')),
                ('TOPPADDING', (0, 0), (-1, -1), 5),
                ('BOTTOMPADDING', (0, 0), (-1, -1), 5),
            ]))
            story.append(meth_table)
            story.append(Spacer(1, 6 * mm))

        # ── Daily Breakdown ────────────────────────────────────────────────
        daily = {}
        for tx in transactions:
            d = tx.created_at.strftime('%Y-%m-%d')
            if d not in daily:
                daily[d] = {'receipts': 0.0, 'payments': 0.0}
            if tx.type == 'RECEIPT':
                daily[d]['receipts'] += float(tx.amount)
            else:
                daily[d]['payments'] += float(tx.amount)

        if daily:
            story.append(Paragraph("Récapitulatif journalier", section_style))
            day_header = ['Date', 'Recettes', 'Dépenses', 'Solde du jour']
            day_rows = [day_header]
            for d in sorted(daily.keys()):
                vals = daily[d]
                net_d = vals['receipts'] - vals['payments']
                day_rows.append([
                    d, f"+{fmt(vals['receipts'])}", f"-{fmt(vals['payments'])}", fmt(net_d)
                ])
            day_table = Table(day_rows, colWidths=[40 * mm, 42 * mm, 42 * mm, 42 * mm])
            day_table.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#374151')),
                ('TEXTCOLOR', (0, 0), (-1, 0), WHITE),
                ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
                ('FONTSIZE', (0, 0), (-1, -1), 8),
                ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
                ('ROWBACKGROUNDS', (0, 1), (-1, -1), [WHITE, LIGHT]),
                ('GRID', (0, 0), (-1, -1), 0.3, colors.HexColor('#e2e8f0')),
                ('TOPPADDING', (0, 0), (-1, -1), 5),
                ('BOTTOMPADDING', (0, 0), (-1, -1), 5),
            ]))
            story.append(day_table)
            story.append(Spacer(1, 8 * mm))

        # ── Signature Footer ───────────────────────────────────────────────
        from datetime import datetime
        gen_time = datetime.now().strftime('%d/%m/%Y à %H:%M')
        sig_data = [
            ['Caissier', 'Gérant', 'Administrateur'],
            ['\n\n\n_________________', '\n\n\n_________________', '\n\n\n_________________'],
        ]
        sig_table = Table(sig_data, colWidths=[60 * mm, 60 * mm, 60 * mm])
        sig_table.setStyle(TableStyle([
            ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, -1), 9),
            ('TEXTCOLOR', (0, 0), (-1, 0), GRAY),
            ('LINEABOVE', (0, 0), (-1, 0), 1, colors.HexColor('#e2e8f0')),
            ('TOPPADDING', (0, 0), (-1, 0), 10),
        ]))
        story.append(sig_table)
        story.append(Spacer(1, 4 * mm))
        story.append(Paragraph(
            f"<font color='#94a3b8'>Document généré le {gen_time} — {company_name} — Confidentiel</font>",
            ParagraphStyle('footer', fontSize=7, fontName='Helvetica', alignment=TA_CENTER)
        ))

        doc.build(story)
        buffer.seek(0)

        filename = f"rapport_tresorerie_{date_from_str or 'tout'}_{date_to_str or 'tout'}.pdf"
        response = HttpResponse(buffer.read(), content_type='application/pdf')
        response['Content-Disposition'] = f'attachment; filename="{filename}"'
        return response


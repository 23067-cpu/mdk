from rest_framework import viewsets, status, views, permissions
from rest_framework.response import Response
from rest_framework.decorators import action
from rest_framework.authtoken.models import Token
from django.contrib.auth import authenticate, login
from django.utils import timezone
from django.db import transaction as db_transaction
from django.db.models import Sum, Q
from .models import User, Folio, Transaction, Settlement, Receipt, Invoice, AuditLog
from .serializers import UserSerializer, FolioSerializer, TransactionSerializer, SettlementSerializer, InvoiceSerializer
import uuid

class AuthView(views.APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        username = request.data.get('username')
        password = request.data.get('password')
        user = authenticate(username=username, password=password)
        if user:
            login(request, user)
            user.last_login_at = timezone.now()
            user.save()
            
            token, created = Token.objects.get_or_create(user=user)
            
            return Response({
                "success": True,
                "user": UserSerializer(user).data,
                "token": token.key
            })
        return Response({"success": False, "message": "Invalid credentials"}, status=status.HTTP_401_UNAUTHORIZED)

class DashboardView(views.APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        # Get the currently open folio for the logged-in user (or generally)
        # Spec 5.2: "policy: just if not folio open... practical assumption: allows multiple folios unless specified"
        # But Dashboard 3.2 says "Summary of Open Folio (if exists)"
        
        # Let's try to find an open folio for the current user first, or the latest open one.
        # For simplicity in this demo, we'll look for *any* open folio by this user.
        open_folio = Folio.objects.filter(status='OPEN', opened_by=request.user).last()
        
        folio_data = None
        if open_folio:
            # Calculate running balance
            receipts = open_folio.transactions.filter(type='RECEIPT', is_void=False).aggregate(Sum('amount'))['amount__sum'] or 0
            payments = open_folio.transactions.filter(type='PAYMENT', is_void=False).aggregate(Sum('amount'))['amount__sum'] or 0
            running_balance = open_folio.opening_balance + receipts - payments
            
            folio_data = FolioSerializer(open_folio).data
            folio_data['running_balance'] = running_balance

        return Response({
            "success": True,
            "folio": folio_data
        })

class FolioViewSet(viewsets.ModelViewSet):
    queryset = Folio.objects.all().order_by('-opened_at')
    serializer_class = FolioSerializer
    permission_classes = [permissions.IsAuthenticated]

    def create(self, request, *args, **kwargs):
        # Spec 5.2: Open Folio
        # Check if user already has an open folio?
        if Folio.objects.filter(status='OPEN', opened_by=request.user).exists():
             return Response({"success": False, "message": "You already have an open folio."}, status=status.HTTP_400_BAD_REQUEST)

        data = request.data.copy()
        data['opened_by'] = request.user.id
        data['status'] = 'OPEN'
        # code generation
        data['code'] = f"FOLIO-{timezone.now().strftime('%Y%m%d')}-{uuid.uuid4().hex[:4].upper()}"
        
        serializer = self.get_serializer(data=data)
        serializer.is_valid(raise_exception=True)
        folio = serializer.save()
        
        AuditLog.objects.create(user=request.user, action='OPEN_FOLIO', object_type='FOLIO', object_id=folio.id, details=f"Opened folio {folio.code}")

        return Response({
            "success": True,
            "folio": serializer.data
        })

    @action(detail=True, methods=['post'])
    def close(self, request, pk=None):
        folio = self.get_object()
        if folio.status != 'OPEN':
            return Response({"success": False, "message": "Folio is not open"}, status=status.HTTP_400_BAD_REQUEST)

        with db_transaction.atomic():
            # Spec 5.6: Close Folio logic
            receipts = folio.transactions.filter(type='RECEIPT', is_void=False).aggregate(Sum('amount'))['amount__sum'] or 0
            payments = folio.transactions.filter(type='PAYMENT', is_void=False).aggregate(Sum('amount'))['amount__sum'] or 0
            closing_balance = folio.opening_balance + receipts - payments

            folio.status = 'CLOSED'
            folio.closed_by = request.user
            folio.closed_at = timezone.now()
            folio.closing_balance = closing_balance
            folio.save()

            AuditLog.objects.create(
                user=request.user, 
                action='CLOSE_FOLIO', 
                object_type='FOLIO', 
                object_id=folio.id, 
                details=f"Closed with balance {closing_balance}"
            )

            return Response({
                "success": True,
                "folio": FolioSerializer(folio).data,
                "summary": {
                    "sum_receipts": receipts,
                    "sum_payments": payments,
                    "closing_balance": closing_balance
                }
            })

class TransactionViewSet(viewsets.ModelViewSet):
    queryset = Transaction.objects.all().order_by('-created_at')
    serializer_class = TransactionSerializer
    permission_classes = [permissions.IsAuthenticated]

    def create(self, request, *args, **kwargs):
        # Spec 5.3: Add Transaction
        folio_id = request.data.get('folio')
        try:
            folio = Folio.objects.get(id=folio_id)
        except Folio.DoesNotExist:
            return Response({"success": False, "message": "Folio not found"}, status=status.HTTP_404_NOT_FOUND)

        if folio.status != 'OPEN':
            return Response({"success": False, "message": "Cannot add transaction to closed folio"}, status=status.HTTP_400_BAD_REQUEST)

        data = request.data.copy()
        data['created_by'] = request.user.id
        
        # Generate receipt number if receipt
        if data.get('type') == 'RECEIPT':
             data['receipt_number'] = f"R-{timezone.now().strftime('%Y%m%d')}-{uuid.uuid4().hex[:4].upper()}"

        serializer = self.get_serializer(data=data)
        serializer.is_valid(raise_exception=True)
        transaction = serializer.save()

        AuditLog.objects.create(user=request.user, action='CREATE_TRANSACTION', object_type='TRANSACTION', object_id=transaction.id)

        # Calculate running balance
        receipts = folio.transactions.filter(type='RECEIPT', is_void=False).aggregate(Sum('amount'))['amount__sum'] or 0
        payments = folio.transactions.filter(type='PAYMENT', is_void=False).aggregate(Sum('amount'))['amount__sum'] or 0
        running_balance = folio.opening_balance + receipts - payments

        return Response({
            "success": True,
            "transaction": serializer.data,
            "folio_running_balance": running_balance
        })

    @action(detail=True, methods=['post'])
    def print_receipt(self, request, pk=None):
        transaction = self.get_object()
        
        receipt_number = transaction.receipt_number
        if not receipt_number:
            receipt_number = f"R-{timezone.now().strftime('%Y%m%d')}-{uuid.uuid4().hex[:4].upper()}"
            transaction.receipt_number = receipt_number
            transaction.save()

        # Check if receipt already exists
        receipt, created = Receipt.objects.get_or_create(
            transaction=transaction,
            defaults={
                'generated_by': request.user,
                'receipt_number': receipt_number,
                'pdf_path': f"/media/receipts/{receipt_number}.pdf"
            }
        )

        if not created:
            receipt.print_count += 1
            receipt.save()
        
        AuditLog.objects.create(user=request.user, action='PRINT_RECEIPT', object_type='TRANSACTION', object_id=transaction.id)

        # Generate PDF using ReportLab
        from reportlab.lib.pagesizes import A4
        from reportlab.pdfgen import canvas
        from reportlab.lib.units import inch
        import os
        from django.conf import settings
        from django.http import HttpResponse

        response = HttpResponse(content_type='application/pdf')
        response['Content-Disposition'] = f'attachment; filename="{receipt_number}.pdf"'

        p = canvas.Canvas(response, pagesize=A4)
        width, height = A4

        # Header
        p.setFont("Helvetica-Bold", 18)
        p.drawString(1 * inch, height - 1 * inch, "NexaSolft Treasury")
        p.setFont("Helvetica", 12)
        p.drawString(1 * inch, height - 1.25 * inch, "Receipt / Reçu")
        
        # Receipt Details
        y = height - 2 * inch
        p.drawString(1 * inch, y, f"Receipt No: {receipt_number}")
        y -= 0.25 * inch
        p.drawString(1 * inch, y, f"Date: {transaction.created_at.strftime('%Y-%m-%d %H:%M')}")
        y -= 0.25 * inch
        p.drawString(1 * inch, y, f"Folio: {transaction.folio.code}")
        y -= 0.25 * inch
        p.drawString(1 * inch, y, f"Type: {transaction.type}")
        y -= 0.25 * inch
        p.drawString(1 * inch, y, f"Amount: {transaction.amount} MRU")
        y -= 0.25 * inch
        p.drawString(1 * inch, y, f"Method: {transaction.payment_method}")
        y -= 0.25 * inch
        if transaction.reference:
            p.drawString(1 * inch, y, f"Reference: {transaction.reference}")
            y -= 0.25 * inch
        if transaction.description:
            p.drawString(1 * inch, y, f"Description: {transaction.description}")
            y -= 0.25 * inch
        
        p.drawString(1 * inch, y, f"Issued By: {request.user.username}")

        # Footer
        p.setFont("Helvetica-Oblique", 10)
        p.drawString(1 * inch, 1 * inch, "This receipt is a proof of payment. / Ce reçu est une preuve de paiement.")
        
        p.showPage()
        p.save()

        return response

    @action(detail=False, methods=['get'])
    def export_transactions(self, request):
        import csv
        from django.http import HttpResponse

        response = HttpResponse(content_type='text/csv')
        response['Content-Disposition'] = 'attachment; filename="transactions.csv"'

        writer = csv.writer(response)
        writer.writerow(['ID', 'Date', 'Type', 'Amount', 'Method', 'Reference', 'Description', 'Folio', 'Created By'])

        transactions = self.get_queryset()
        for txn in transactions:
            writer.writerow([
                txn.id,
                txn.created_at.strftime('%Y-%m-%d %H:%M:%S'),
                txn.type,
                txn.amount,
                txn.payment_method,
                txn.reference,
                txn.description,
                txn.folio.code,
                txn.created_by.username
            ])

        return response

class SettlementViewSet(viewsets.ModelViewSet):
    queryset = Settlement.objects.all().order_by('-created_at')
    serializer_class = SettlementSerializer
    permission_classes = [permissions.IsAuthenticated]

    def perform_create(self, serializer):
        # Spec 3.6: Create settlement
        serializer.save(created_by=self.request.user)

class InvoiceViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Invoice.objects.all().order_by('-created_at')
    serializer_class = InvoiceSerializer
    permission_classes = [permissions.IsAuthenticated]

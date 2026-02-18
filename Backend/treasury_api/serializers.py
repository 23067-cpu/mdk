from rest_framework import serializers
from .models import (
    User, Branch, Folio, Transaction, Settlement, 
    Receipt, Invoice, Document, Notification, 
    SystemSettings, AuditLog, Account, CashDenomination, CashCount
)


class BranchSerializer(serializers.ModelSerializer):
    class Meta:
        model = Branch
        fields = '__all__'


class AccountSerializer(serializers.ModelSerializer):
    class Meta:
        model = Account
        fields = '__all__'


class CashDenominationSerializer(serializers.ModelSerializer):
    class Meta:
        model = CashDenomination
        fields = '__all__'


class CashCountSerializer(serializers.ModelSerializer):
    denomination_value = serializers.DecimalField(source='denomination.value', read_only=True, max_digits=10, decimal_places=2)
    currency = serializers.CharField(source='denomination.currency', read_only=True)
    
    class Meta:
        model = CashCount
        fields = ['id', 'folio', 'denomination', 'denomination_value', 'currency', 'quantity', 'total']


class UserSerializer(serializers.ModelSerializer):
    branch_name = serializers.CharField(source='branch.name', read_only=True)
    role_display = serializers.CharField(source='get_role_display', read_only=True)
    
    class Meta:
        model = User
        fields = [
            'id', 'username', 'email', 'first_name', 'last_name',
            'role', 'role_display', 'branch', 'branch_name', 'phone',
            'is_active', 'preferred_language', 'date_joined', 'last_login'
        ]
        read_only_fields = ['date_joined', 'last_login']


class UserCreateSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=8)
    
    class Meta:
        model = User
        fields = [
            'id', 'username', 'email', 'password', 'first_name', 'last_name',
            'role', 'branch', 'phone', 'preferred_language'
        ]
    
    def create(self, validated_data):
        password = validated_data.pop('password')
        user = User(**validated_data)
        user.set_password(password)
        user.save()
        return user


class UserProfileSerializer(serializers.ModelSerializer):
    branch_name = serializers.CharField(source='branch.name', read_only=True)
    role_display = serializers.CharField(source='get_role_display', read_only=True)
    
    class Meta:
        model = User
        fields = [
            'id', 'username', 'email', 'first_name', 'last_name',
            'role', 'role_display', 'branch', 'branch_name', 'phone',
            'preferred_language', 'is_2fa_enabled'
        ]
        read_only_fields = ['username', 'role', 'branch']


class FolioSerializer(serializers.ModelSerializer):
    opened_by_name = serializers.CharField(source='opened_by.get_full_name', read_only=True)
    closed_by_name = serializers.CharField(source='closed_by.get_full_name', read_only=True)
    closure_proposed_by_name = serializers.CharField(source='closure_proposed_by.get_full_name', read_only=True)
    branch_name = serializers.CharField(source='branch.name', read_only=True)
    running_balance = serializers.FloatField(read_only=True)
    variance = serializers.FloatField(read_only=True)
class FolioSerializer(serializers.ModelSerializer):
    opened_by_name = serializers.CharField(source='opened_by.get_full_name', read_only=True)
    closed_by_name = serializers.CharField(source='closed_by.get_full_name', read_only=True)
    closure_proposed_by_name = serializers.CharField(source='closure_proposed_by.get_full_name', read_only=True)
    branch_name = serializers.CharField(source='branch.name', read_only=True)
    running_balance = serializers.FloatField(read_only=True)
    variance = serializers.FloatField(read_only=True)
    transaction_count = serializers.SerializerMethodField()
    cash_counts = CashCountSerializer(many=True, read_only=True)
    
    class Meta:
        model = Folio
        fields = '__all__'
    
    def get_transaction_count(self, obj):
        return obj.transactions.filter(status='APPROVED').count()


class FolioCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Folio
        fields = ['opening_balance', 'notes', 'branch']


class FolioCloseSerializer(serializers.Serializer):
    actual_physical_balance = serializers.DecimalField(max_digits=18, decimal_places=2, required=False)
    notes = serializers.CharField(required=False, allow_blank=True)
    cash_counts = serializers.ListField(
        child=serializers.DictField(child=serializers.CharField()), 
        required=False, write_only=True
    )  # List of {denomination_id: quantity}


class TransactionSerializer(serializers.ModelSerializer):
    created_by_name = serializers.CharField(source='created_by.get_full_name', read_only=True)
    approved_by_name = serializers.CharField(source='approved_by.get_full_name', read_only=True)
    folio_code = serializers.CharField(source='folio.code', read_only=True)
    type_display = serializers.CharField(source='get_type_display', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    payment_method_display = serializers.CharField(source='get_payment_method_display', read_only=True)
    
    debit_account_details = AccountSerializer(source='debit_account', read_only=True)
    credit_account_details = AccountSerializer(source='credit_account', read_only=True)
    
    class Meta:
        model = Transaction
        fields = '__all__'


class TransactionCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Transaction
        fields = [
            'folio', 'type', 'amount', 'currency', 'payment_method',
            'reference', 'description', 'client_name', 'supplier_name',
            'client_request_id', 'debit_account', 'credit_account'
        ]


class TransactionVoidSerializer(serializers.Serializer):
    reason = serializers.CharField(required=True, min_length=10)


class SettlementSerializer(serializers.ModelSerializer):
    created_by_name = serializers.CharField(source='created_by.get_full_name', read_only=True)
    approved_by_name = serializers.CharField(source='approved_by.get_full_name', read_only=True)
    folio_code = serializers.CharField(source='folio.code', read_only=True)
    party_type_display = serializers.CharField(source='get_party_type_display', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    invoice_numbers = serializers.SerializerMethodField()
    
    class Meta:
        model = Settlement
        fields = '__all__'
    
    def get_invoice_numbers(self, obj):
        return list(obj.invoices.values_list('invoice_number', flat=True))


class SettlementCreateSerializer(serializers.ModelSerializer):
    invoice_ids = serializers.ListField(child=serializers.IntegerField(), required=False)
    
    class Meta:
        model = Settlement
        fields = [
            'folio', 'party_type', 'party_name', 'amount', 
            'method', 'reference', 'notes', 'invoice_ids'
        ]


class SettlementApprovalSerializer(serializers.Serializer):
    action = serializers.ChoiceField(choices=['approve', 'reject'])
    rejection_reason = serializers.CharField(required=False, allow_blank=True)


class ReceiptSerializer(serializers.ModelSerializer):
    transaction_info = TransactionSerializer(source='transaction', read_only=True)
    generated_by_name = serializers.CharField(source='generated_by.get_full_name', read_only=True)
    
    class Meta:
        model = Receipt
        fields = '__all__'


class InvoiceSerializer(serializers.ModelSerializer):
    created_by_name = serializers.CharField(source='created_by.get_full_name', read_only=True)
    type_display = serializers.CharField(source='get_invoice_type_display', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    is_overdue = serializers.SerializerMethodField()
    
    class Meta:
        model = Invoice
        fields = '__all__'
    
    def get_is_overdue(self, obj):
        from django.utils import timezone
        if obj.due_date and obj.status not in ['PAID', 'CANCELLED']:
            return obj.due_date < timezone.now()
        return False


class InvoiceCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Invoice
        fields = [
            'invoice_number', 'invoice_type', 'party_name',
            'total_amount', 'due_date', 'notes'
        ]
        extra_kwargs = {
            'invoice_number': {'required': False, 'allow_null': True}
        }


class DocumentSerializer(serializers.ModelSerializer):
    uploaded_by_name = serializers.CharField(source='uploaded_by.get_full_name', read_only=True)
    
    class Meta:
        model = Document
        fields = '__all__'
        read_only_fields = ['uploaded_by', 'uploaded_at', 'file_size']


class NotificationSerializer(serializers.ModelSerializer):
    type_display = serializers.CharField(source='get_notification_type_display', read_only=True)
    priority_display = serializers.CharField(source='get_priority_display', read_only=True)
    
    class Meta:
        model = Notification
        fields = '__all__'
        read_only_fields = ['user', 'created_at']


class SystemSettingsSerializer(serializers.ModelSerializer):
    updated_by_name = serializers.CharField(source='updated_by.get_full_name', read_only=True)
    
    class Meta:
        model = SystemSettings
        fields = '__all__'
        read_only_fields = ['updated_by', 'updated_at']


class AuditLogSerializer(serializers.ModelSerializer):
    user_name = serializers.CharField(source='user.get_full_name', read_only=True)
    
    class Meta:
        model = AuditLog
        fields = '__all__'


# Dashboard Serializers
class DashboardKPISerializer(serializers.Serializer):
    total_liquidity = serializers.FloatField()
    open_folios_count = serializers.IntegerField()
    today_receipts = serializers.FloatField()
    today_payments = serializers.FloatField()
    pending_approvals = serializers.IntegerField()
    today_transactions_count = serializers.IntegerField()


class AdminDashboardSerializer(DashboardKPISerializer):
    security_alerts_24h = serializers.IntegerField()
    branches_count = serializers.IntegerField()
    users_count = serializers.IntegerField()
    recent_modifications = serializers.ListField()
    pending_settlements = serializers.ListField()
    open_folios_by_branch = serializers.DictField()


class GerantDashboardSerializer(DashboardKPISerializer):
    branch_name = serializers.CharField()
    pending_closure_requests = serializers.IntegerField()
    caissiers_performance = serializers.ListField()
    discrepancy_alerts = serializers.ListField()


class CaissierDashboardSerializer(serializers.Serializer):
    current_folio = FolioSerializer(allow_null=True)
    opening_balance = serializers.FloatField()
    running_balance = serializers.FloatField()
    today_transactions_count = serializers.IntegerField()
    last_receipt_number = serializers.CharField(allow_null=True)
    recent_transactions = TransactionSerializer(many=True)


class SaisieDashboardSerializer(serializers.Serializer):
    today_registered_count = serializers.IntegerField()
    processing_amount = serializers.FloatField()
    pending_approvals = serializers.IntegerField()
    recent_settlements = SettlementSerializer(many=True)
    open_invoices = InvoiceSerializer(many=True)


# Report Serializers
class FolioSummaryReportSerializer(serializers.Serializer):
    folio_code = serializers.CharField()
    opened_by = serializers.CharField()
    opened_at = serializers.DateTimeField()
    opening_balance = serializers.FloatField()
    total_receipts = serializers.FloatField()
    total_payments = serializers.FloatField()
    closing_balance = serializers.FloatField()
    closed_by = serializers.CharField(allow_null=True)
    closed_at = serializers.DateTimeField(allow_null=True)
    variance = serializers.FloatField(allow_null=True)


class TransactionReportSerializer(serializers.Serializer):
    id = serializers.IntegerField()
    date = serializers.DateTimeField()
    folio_code = serializers.CharField()
    type = serializers.CharField()
    amount = serializers.FloatField()
    payment_method = serializers.CharField()
    reference = serializers.CharField(allow_null=True)
    created_by = serializers.CharField()
    status = serializers.CharField()
    receipt_number = serializers.CharField(allow_null=True)


class EmployeePerformanceSerializer(serializers.Serializer):
    user_id = serializers.IntegerField()
    user_name = serializers.CharField()
    role = serializers.CharField()
    transactions_count = serializers.IntegerField()
    total_amount = serializers.FloatField()
    void_count = serializers.IntegerField()
    void_percentage = serializers.FloatField()

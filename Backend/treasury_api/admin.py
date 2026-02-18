
from django.contrib import admin
from .models import (
    Branch, User, Folio, Transaction, Settlement,
    Receipt, Invoice, Document, Notification,
    SystemSettings, AuditLog, Account, CashDenomination, CashCount, Sequence
)


@admin.register(Account)
class AccountAdmin(admin.ModelAdmin):
    list_display = ('code', 'name', 'type', 'parent', 'is_active')
    search_fields = ('code', 'name')
    list_filter = ('type', 'is_active', 'branch')

@admin.register(CashDenomination)
class CashDenominationAdmin(admin.ModelAdmin):
    list_display = ('value', 'currency', 'is_coin', 'is_active')
    list_filter = ('currency', 'is_coin', 'is_active')

@admin.register(CashCount)
class CashCountAdmin(admin.ModelAdmin):
    list_display = ('folio', 'denomination', 'quantity', 'total')
    list_filter = ('denomination',)


@admin.register(Branch)
class BranchAdmin(admin.ModelAdmin):
    list_display = ['code', 'name', 'is_active', 'created_at']
    list_filter = ['is_active']
    search_fields = ['code', 'name']


@admin.register(User)
class UserAdmin(admin.ModelAdmin):
    list_display = ['username', 'email', 'role', 'branch', 'is_active', 'last_login']
    list_filter = ['role', 'is_active', 'branch']
    search_fields = ['username', 'email', 'first_name', 'last_name']
    list_editable = ['role', 'is_active']


@admin.register(Folio)
class FolioAdmin(admin.ModelAdmin):
    list_display = ['code', 'branch', 'status', 'opened_by', 'opened_at', 'opening_balance', 'closing_balance']
    list_filter = ['status', 'branch']
    search_fields = ['code']
    date_hierarchy = 'opened_at'


@admin.register(Transaction)
class TransactionAdmin(admin.ModelAdmin):
    list_display = ['id', 'folio', 'type', 'amount', 'payment_method', 'status', 'created_by', 'created_at']
    list_filter = ['type', 'status', 'payment_method', 'is_void']
    search_fields = ['receipt_number', 'reference', 'description']
    date_hierarchy = 'created_at'


@admin.register(Settlement)
class SettlementAdmin(admin.ModelAdmin):
    list_display = ['id', 'party_type', 'party_name', 'amount', 'status', 'created_by', 'created_at']
    list_filter = ['party_type', 'status']
    search_fields = ['party_name', 'reference']
    date_hierarchy = 'created_at'


@admin.register(Receipt)
class ReceiptAdmin(admin.ModelAdmin):
    list_display = ['receipt_number', 'transaction', 'generated_by', 'generated_at', 'print_count']
    search_fields = ['receipt_number']
    date_hierarchy = 'generated_at'


@admin.register(Invoice)
class InvoiceAdmin(admin.ModelAdmin):
    list_display = ['invoice_number', 'invoice_type', 'party_name', 'total_amount', 'paid_amount', 'status']
    list_filter = ['invoice_type', 'status']
    search_fields = ['invoice_number', 'party_name']
    date_hierarchy = 'created_at'


@admin.register(Document)
class DocumentAdmin(admin.ModelAdmin):
    list_display = ['original_filename', 'file_type', 'uploaded_by', 'uploaded_at']
    list_filter = ['file_type']
    search_fields = ['original_filename']
    date_hierarchy = 'uploaded_at'


@admin.register(Notification)
class NotificationAdmin(admin.ModelAdmin):
    list_display = ['title', 'user', 'notification_type', 'priority', 'is_read', 'created_at']
    list_filter = ['notification_type', 'priority', 'is_read']
    search_fields = ['title', 'message']
    date_hierarchy = 'created_at'


@admin.register(SystemSettings)
class SystemSettingsAdmin(admin.ModelAdmin):
    list_display = ['key', 'category', 'updated_by', 'updated_at']
    list_filter = ['category']
    search_fields = ['key', 'description']


@admin.register(AuditLog)
class AuditLogAdmin(admin.ModelAdmin):
    list_display = ['action', 'user', 'object_type', 'object_id', 'timestamp', 'ip_address']
    list_filter = ['action', 'object_type']
    search_fields = ['object_repr', 'details']
    date_hierarchy = 'timestamp'
    readonly_fields = ['user', 'action', 'object_type', 'object_id', 'object_repr', 
                      'before_state', 'after_state', 'details', 'reason', 
                      'ip_address', 'user_agent', 'timestamp']

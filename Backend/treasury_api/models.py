import sys
print(f"DEBUG: Loading models.py. Name: {__name__}, File: {__file__}", file=sys.stderr)

from django.db import models
from django.contrib.auth.models import AbstractUser
from django.conf import settings
from django.utils import timezone

class User(AbstractUser):
    # Inherits username, password, first_name, last_name, email, is_active, last_login, date_joined (created_at)
    # We can add extra fields if needed, but the spec matches AbstractUser well.
    pass

class Folio(models.Model):
    STATUS_CHOICES = [
        ('OPEN', 'Open'),
        ('CLOSED', 'Closed'),
    ]

    code = models.CharField(max_length=50, unique=True)
    opened_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.PROTECT, related_name='opened_folios')
    opened_at = models.DateTimeField(default=timezone.now)
    opening_balance = models.DecimalField(max_digits=18, decimal_places=2, default=0.00)
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default='OPEN')
    closed_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.PROTECT, null=True, blank=True, related_name='closed_folios')
    closed_at = models.DateTimeField(null=True, blank=True)
    closing_balance = models.DecimalField(max_digits=18, decimal_places=2, null=True, blank=True)
    notes = models.TextField(null=True, blank=True)

    def __str__(self):
        return self.code

class Transaction(models.Model):
    TYPE_CHOICES = [
        ('RECEIPT', 'Receipt'),
        ('PAYMENT', 'Payment'),
    ]

    folio = models.ForeignKey(Folio, on_delete=models.PROTECT, related_name='transactions')
    type = models.CharField(max_length=10, choices=TYPE_CHOICES)
    amount = models.DecimalField(max_digits=18, decimal_places=2)
    currency = models.CharField(max_length=10, default='MRU')
    payment_method = models.CharField(max_length=50, null=True, blank=True)
    reference = models.CharField(max_length=100, null=True, blank=True)
    description = models.TextField(null=True, blank=True)
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.PROTECT, related_name='created_transactions')
    created_at = models.DateTimeField(default=timezone.now)
    receipt_number = models.CharField(max_length=50, unique=True, null=True, blank=True)
    is_void = models.BooleanField(default=False)
    # settlement relation can be handled via foreign key in Settlement or here if 1-to-1, spec says Settlement has transaction_id
    # Spec 4.3 says Transaction has settlement_id
    settlement = models.ForeignKey('Settlement', on_delete=models.SET_NULL, null=True, blank=True, related_name='linked_transactions')

    def __str__(self):
        return f"{self.type} - {self.amount} ({self.folio.code})"

class Settlement(models.Model):
    STATUS_CHOICES = [
        ('CONFIRMED', 'Confirmed'),
        ('PENDING', 'Pending'),
        ('CANCELLED', 'Cancelled'),
    ]

    folio = models.ForeignKey(Folio, on_delete=models.PROTECT, related_name='settlements')
    transaction = models.ForeignKey(Transaction, on_delete=models.SET_NULL, null=True, blank=True, related_name='settlements')
    amount = models.DecimalField(max_digits=18, decimal_places=2)
    method = models.CharField(max_length=50, null=True, blank=True)
    reference = models.CharField(max_length=100, null=True, blank=True)
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.PROTECT)
    created_at = models.DateTimeField(default=timezone.now)
    status = models.CharField(max_length=20, default='CONFIRMED', choices=STATUS_CHOICES)

class Receipt(models.Model):
    transaction = models.ForeignKey(Transaction, on_delete=models.PROTECT, related_name='receipts')
    generated_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.PROTECT)
    generated_at = models.DateTimeField(default=timezone.now)
    receipt_number = models.CharField(max_length=50, unique=True)
    pdf_path = models.CharField(max_length=500, null=True, blank=True)
    print_count = models.IntegerField(default=1)

class Invoice(models.Model):
    STATUS_CHOICES = [
        ('DRAFT', 'Draft'),
        ('SENT', 'Sent'),
        ('PAID', 'Paid'),
        ('PARTIAL', 'Partially Paid'),
    ]

    invoice_number = models.CharField(max_length=50, unique=True)
    client_name = models.CharField(max_length=200, null=True, blank=True)
    total_amount = models.DecimalField(max_digits=18, decimal_places=2, null=True, blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, null=True, blank=True)
    created_at = models.DateTimeField(default=timezone.now)
    due_date = models.DateTimeField(null=True, blank=True)
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True)

class AuditLog(models.Model):
    ACTION_CHOICES = [
        ('OPEN_FOLIO', 'Open Folio'),
        ('CREATE_TRANSACTION', 'Create Transaction'),
        ('CLOSE_FOLIO', 'Close Folio'),
        ('PRINT_RECEIPT', 'Print Receipt'),
        ('LOGIN', 'Login'),
    ]
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True)
    action = models.CharField(max_length=50, choices=ACTION_CHOICES) 
    object_type = models.CharField(max_length=50, null=True, blank=True)
    object_id = models.IntegerField(null=True, blank=True)
    details = models.TextField(null=True, blank=True)
    timestamp = models.DateTimeField(default=timezone.now)

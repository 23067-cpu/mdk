from django.db import models
import uuid
from django.contrib.auth.models import AbstractUser
from django.conf import settings
from django.utils import timezone
from django.contrib.contenttypes.fields import GenericForeignKey, GenericRelation
from django.contrib.contenttypes.models import ContentType


class Branch(models.Model):
    """Branch/Location model for multi-branch support"""
    code = models.CharField(max_length=20, unique=True)
    name = models.CharField(max_length=200)
    address = models.TextField(null=True, blank=True)
    phone = models.CharField(max_length=50, null=True, blank=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(default=timezone.now)

    class Meta:
        verbose_name_plural = "Branches"

    def __str__(self):
        return f"{self.code} - {self.name}"


class User(AbstractUser):
    """Extended User model with roles and branch assignment"""
    ROLE_CHOICES = [
        ('ADMIN', 'Administrateur'),
        ('GERANT', 'Gérant / Manager'),
        ('CAISSIER', 'Caissier / Cashier'),
        ('SAISIE_CLIENT', 'Saisie Règlement Client'),
        ('SAISIE_FOURNISSEUR', 'Saisie Règlement Fournisseurs'),
    ]
    
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='CAISSIER')
    branch = models.ForeignKey(Branch, on_delete=models.SET_NULL, null=True, blank=True, related_name='users')
    phone = models.CharField(max_length=50, null=True, blank=True)
    avatar = models.ImageField(upload_to='avatars/', null=True, blank=True)
    is_2fa_enabled = models.BooleanField(default=False)
    preferred_language = models.CharField(max_length=5, default='fr', choices=[('fr', 'Français'), ('ar', 'العربية'), ('en', 'English')])
    
    def __str__(self):
        return f"{self.username} ({self.get_role_display()})"
    
    @property
    def is_admin(self):
        return self.role == 'ADMIN'
    
    @property
    def is_gerant(self):
        return self.role in ['ADMIN', 'GERANT']
    
    @property
    def is_caissier(self):
        return self.role in ['ADMIN', 'GERANT', 'CAISSIER']



class Account(models.Model):
    """Chart of Accounts (Plan Comptable)"""
    TYPE_CHOICES = [
        ('ASSET', 'Actif'),
        ('LIABILITY', 'Passif'),
        ('INCOME', 'Produit'),
        ('EXPENSE', 'Charge'),
        ('EQUITY', 'Capitaux Propres'),
    ]

    code = models.CharField(max_length=20, unique=True)
    name = models.CharField(max_length=200)
    type = models.CharField(max_length=20, choices=TYPE_CHOICES)
    is_active = models.BooleanField(default=True)
    parent = models.ForeignKey('self', on_delete=models.SET_NULL, null=True, blank=True, related_name='children')
    branch = models.ForeignKey(Branch, on_delete=models.CASCADE, null=True, blank=True, related_name='accounts')

    class Meta:
        ordering = ['code']

    def __str__(self):
        return f"{self.code} - {self.name}"


class CashDenomination(models.Model):
    """Available cash bills/coins (Billetage)"""
    value = models.DecimalField(max_digits=10, decimal_places=2)
    currency = models.CharField(max_length=10, default='MRU')
    is_coin = models.BooleanField(default=False)
    is_active = models.BooleanField(default=True)

    class Meta:
        ordering = ['-value']

    def __str__(self):
        return f"{self.value} {self.currency}"


class Folio(models.Model):
    """Treasury Folio - A session/period for cash management"""
    STATUS_CHOICES = [
        ('DRAFT', 'Brouillon'),
        ('OPEN', 'Ouvert'),
        ('CLOSURE_PROPOSED', 'Clôture Proposée'),
        ('CLOSED', 'Fermé'),
        ('ARCHIVED', 'Archivé'),
    ]

    code = models.CharField(max_length=50, unique=True)
    branch = models.ForeignKey(Branch, on_delete=models.PROTECT, null=True, blank=True, related_name='folios')
    
    # Opening
    opened_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.PROTECT, related_name='opened_folios')
    opened_at = models.DateTimeField(default=timezone.now)
    opening_balance = models.DecimalField(max_digits=18, decimal_places=2, default=0.00)
    
    # Status
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='OPEN')
    
    # Closure proposal
    closure_proposed_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name='proposed_folios')
    closure_proposed_at = models.DateTimeField(null=True, blank=True)
    closure_notes = models.TextField(null=True, blank=True)
    
    # Final closure
    closed_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.PROTECT, null=True, blank=True, related_name='closed_folios')
    closed_at = models.DateTimeField(null=True, blank=True)
    closing_balance = models.DecimalField(max_digits=18, decimal_places=2, null=True, blank=True)
    actual_physical_balance = models.DecimalField(max_digits=18, decimal_places=2, null=True, blank=True)
    
    # Notes
    notes = models.TextField(null=True, blank=True)

    class Meta:
        ordering = ['-opened_at']

    def __str__(self):
        return self.code
    
    @property
    def running_balance(self):
        """Calculate current running balance"""
        receipts = self.transactions.filter(type='RECEIPT', status='APPROVED').aggregate(
            total=models.Sum('amount'))['total'] or 0
        payments = self.transactions.filter(type='PAYMENT', status='APPROVED').aggregate(
            total=models.Sum('amount'))['total'] or 0
        return float(self.opening_balance) + float(receipts) - float(payments)
    
    @property
    def variance(self):
        """Calculate variance between expected and actual balance"""
        if self.actual_physical_balance is not None and self.closing_balance is not None:
            return float(self.actual_physical_balance) - float(self.closing_balance)
        return None


class CashCount(models.Model):
    """Physical cash count for a specific denomination in a Folio (Billetage Line)"""
    folio = models.ForeignKey(Folio, on_delete=models.CASCADE, related_name='cash_counts')
    denomination = models.ForeignKey(CashDenomination, on_delete=models.PROTECT)
    quantity = models.PositiveIntegerField(default=0)
    
    def __str__(self):
        return f"{self.quantity} x {self.denomination.value}"
    
    @property
    def total(self):
        return self.quantity * self.denomination.value


class Sequence(models.Model):
    """Tracks the last used number for various sequences (Receipts, Invoices, etc.)"""
    code = models.CharField(max_length=50, primary_key=True)  # e.g., 'REC-2024', 'INV-2024'
    last_number = models.PositiveIntegerField(default=0)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.code}: {self.last_number}"


class Transaction(models.Model):
    """Financial transaction within a Folio"""
    TYPE_CHOICES = [
        ('RECEIPT', 'Encaissement'),
        ('PAYMENT', 'Décaissement'),
    ]
    
    STATUS_CHOICES = [
        ('PENDING', 'En attente'),
        ('APPROVED', 'Approuvé'),
        ('REJECTED', 'Rejeté'),
        ('VOID', 'Annulé'),
    ]
    
    PAYMENT_METHOD_CHOICES = [
        ('CASH', 'Espèces'),
        ('CARD', 'Carte bancaire'),
        ('TRANSFER', 'Virement'),
        ('CHECK', 'Chèque'),
        ('MOBILE', 'Mobile Money'),
        ('OTHER', 'Autre'),
    ]

    folio = models.ForeignKey(Folio, on_delete=models.PROTECT, related_name='transactions')
    # Use UUID for transaction ID as per spec
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    # Idempotency key
    client_request_id = models.CharField(max_length=100, unique=True, null=True, blank=True)
    
    type = models.CharField(max_length=10, choices=TYPE_CHOICES)
    amount = models.DecimalField(max_digits=18, decimal_places=2)
    currency = models.CharField(max_length=10, default='MRU')
    payment_method = models.CharField(max_length=50, choices=PAYMENT_METHOD_CHOICES, default='CASH')
    reference = models.CharField(max_length=100, null=True, blank=True)
    description = models.TextField(null=True, blank=True)
    
    # Creator and approval
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.PROTECT, related_name='created_transactions')
    created_at = models.DateTimeField(default=timezone.now)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='APPROVED')
    requires_approval = models.BooleanField(default=False)
    approved_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name='approved_transactions')
    approved_at = models.DateTimeField(null=True, blank=True)
    
    # Void handling
    is_void = models.BooleanField(default=False)
    void_reason = models.TextField(null=True, blank=True)
    void_requested_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name='void_requested_transactions')
    void_approved_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name='void_approved_transactions')
    voided_at = models.DateTimeField(null=True, blank=True)
    
    # Receipt
    receipt_number = models.CharField(max_length=50, unique=True, null=True, blank=True)
    
    # Client/Supplier info for settlements
    client_name = models.CharField(max_length=200, null=True, blank=True)
    supplier_name = models.CharField(max_length=200, null=True, blank=True)
    
    # Accounting (Double Entry)
    debit_account = models.ForeignKey(Account, on_delete=models.PROTECT, related_name='debit_transactions', null=True, blank=True)
    credit_account = models.ForeignKey(Account, on_delete=models.PROTECT, related_name='credit_transactions', null=True, blank=True)
    
    # Settlement link
    settlement = models.ForeignKey('Settlement', on_delete=models.SET_NULL, null=True, blank=True, related_name='linked_transactions')

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.type} - {self.amount} {self.currency} ({self.folio.code})"


class Settlement(models.Model):
    """Settlement record linking payments to invoices"""
    STATUS_CHOICES = [
        ('DRAFT', 'Brouillon'),
        ('PROPOSED', 'Proposé'),
        ('APPROVED', 'Approuvé'),
        ('REJECTED', 'Rejeté'),
        ('CANCELLED', 'Annulé'),
    ]
    
    PARTY_TYPE_CHOICES = [
        ('CLIENT', 'Client'),
        ('SUPPLIER', 'Fournisseur'),
    ]

    folio = models.ForeignKey(Folio, on_delete=models.PROTECT, related_name='settlements')
    party_type = models.CharField(max_length=20, choices=PARTY_TYPE_CHOICES, default='CLIENT')
    party_name = models.CharField(max_length=200)
    
    amount = models.DecimalField(max_digits=18, decimal_places=2)
    method = models.CharField(max_length=50, null=True, blank=True)
    reference = models.CharField(max_length=100, null=True, blank=True)
    
    # Link to invoice(s)
    invoices = models.ManyToManyField('Invoice', blank=True, related_name='settlements')
    
    # Creator and approval workflow
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.PROTECT, related_name='created_settlements')
    created_at = models.DateTimeField(default=timezone.now)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='DRAFT')
    
    proposed_at = models.DateTimeField(null=True, blank=True)
    approved_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name='approved_settlements')
    approved_at = models.DateTimeField(null=True, blank=True)
    rejection_reason = models.TextField(null=True, blank=True)
    
    notes = models.TextField(null=True, blank=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"Règlement {self.party_name} - {self.amount}"


class Receipt(models.Model):
    """Generated receipt for a transaction"""
    transaction = models.ForeignKey(Transaction, on_delete=models.PROTECT, related_name='receipts')
    generated_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.PROTECT)
    generated_at = models.DateTimeField(default=timezone.now)
    receipt_number = models.CharField(max_length=50, unique=True)
    pdf_path = models.CharField(max_length=500, null=True, blank=True)
    print_count = models.IntegerField(default=1)

    def __str__(self):
        return self.receipt_number


class Invoice(models.Model):
    """Invoice model for client/supplier billing"""
    STATUS_CHOICES = [
        ('DRAFT', 'Brouillon'),
        ('SENT', 'Envoyée'),
        ('PAID', 'Payée'),
        ('PARTIAL', 'Partiellement Payée'),
        ('OVERDUE', 'En retard'),
        ('CANCELLED', 'Annulée'),
    ]
    
    TYPE_CHOICES = [
        ('CLIENT', 'Client'),
        ('SUPPLIER', 'Fournisseur'),
    ]

    invoice_number = models.CharField(max_length=50, unique=True)
    invoice_type = models.CharField(max_length=20, choices=TYPE_CHOICES, default='CLIENT')
    party_name = models.CharField(max_length=200)
    
    total_amount = models.DecimalField(max_digits=18, decimal_places=2)
    paid_amount = models.DecimalField(max_digits=18, decimal_places=2, default=0)
    remaining_amount = models.DecimalField(max_digits=18, decimal_places=2, null=True, blank=True)
    
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='DRAFT')
    
    created_at = models.DateTimeField(default=timezone.now)
    due_date = models.DateTimeField(null=True, blank=True)
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True)
    
    notes = models.TextField(null=True, blank=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.invoice_number} - {self.party_name}"
    
    def save(self, *args, **kwargs):
        self.remaining_amount = self.total_amount - self.paid_amount
        super().save(*args, **kwargs)


class Document(models.Model):
    """Attached documents for transactions, settlements, etc."""
    TYPE_CHOICES = [
        ('IMAGE', 'Image'),
        ('PDF', 'PDF'),
        ('SCAN', 'Scan'),
        ('OTHER', 'Autre'),
    ]
    
    # Generic relation to attach to any model
    content_type = models.ForeignKey(ContentType, on_delete=models.CASCADE)
    object_id = models.PositiveIntegerField()
    content_object = GenericForeignKey('content_type', 'object_id')
    
    file = models.FileField(upload_to='documents/%Y/%m/')
    original_filename = models.CharField(max_length=255)
    file_type = models.CharField(max_length=20, choices=TYPE_CHOICES, default='OTHER')
    file_size = models.PositiveIntegerField(null=True, blank=True)
    
    uploaded_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.PROTECT)
    uploaded_at = models.DateTimeField(default=timezone.now)
    description = models.TextField(null=True, blank=True)

    def __str__(self):
        return self.original_filename


class Notification(models.Model):
    """User notifications"""
    TYPE_CHOICES = [
        ('FOLIO_CLOSURE', 'Demande de clôture Folio'),
        ('SETTLEMENT_APPROVAL', 'Approbation règlement'),
        ('TRANSACTION_APPROVAL', 'Approbation transaction'),
        ('DISCREPANCY_ALERT', 'Alerte écart'),
        ('SECURITY_ALERT', 'Alerte sécurité'),
        ('VOID_REQUEST', 'Demande d\'annulation'),
        ('GENERAL', 'Général'),
    ]
    
    PRIORITY_CHOICES = [
        ('LOW', 'Basse'),
        ('MEDIUM', 'Moyenne'),
        ('HIGH', 'Haute'),
        ('URGENT', 'Urgente'),
    ]

    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='notifications')
    notification_type = models.CharField(max_length=30, choices=TYPE_CHOICES, default='GENERAL')
    priority = models.CharField(max_length=10, choices=PRIORITY_CHOICES, default='MEDIUM')
    
    title = models.CharField(max_length=200)
    message = models.TextField()
    
    is_read = models.BooleanField(default=False)
    read_at = models.DateTimeField(null=True, blank=True)
    
    action_url = models.CharField(max_length=500, null=True, blank=True)
    action_data = models.JSONField(null=True, blank=True)
    
    created_at = models.DateTimeField(default=timezone.now)
    expires_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.title} - {self.user.username}"


class SystemSettings(models.Model):
    """System-wide configurable settings"""
    key = models.CharField(max_length=100, unique=True)
    value = models.JSONField()
    description = models.TextField(null=True, blank=True)
    category = models.CharField(max_length=50, default='general')
    
    updated_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name_plural = "System Settings"

    def __str__(self):
        return self.key


class AuditLog(models.Model):
    """Comprehensive audit trail for all actions"""
    ACTION_CHOICES = [
        ('CREATE', 'Création'),
        ('UPDATE', 'Modification'),
        ('DELETE', 'Suppression'),
        ('OPEN_FOLIO', 'Ouverture Folio'),
        ('CLOSE_FOLIO', 'Clôture Folio'),
        ('PROPOSE_CLOSURE', 'Proposition clôture'),
        ('APPROVE_CLOSURE', 'Approbation clôture'),
        ('REJECT_CLOSURE', 'Rejet clôture'),
        ('CREATE_TRANSACTION', 'Création transaction'),
        ('VOID_TRANSACTION', 'Annulation transaction'),
        ('APPROVE_TRANSACTION', 'Approbation transaction'),
        ('PRINT_RECEIPT', 'Impression reçu'),
        ('CREATE_SETTLEMENT', 'Création règlement'),
        ('APPROVE_SETTLEMENT', 'Approbation règlement'),
        ('REJECT_SETTLEMENT', 'Rejet règlement'),
        ('LOGIN', 'Connexion'),
        ('LOGOUT', 'Déconnexion'),
        ('LOGIN_FAILED', 'Tentative connexion échouée'),
        ('PASSWORD_CHANGE', 'Changement mot de passe'),
        ('SETTINGS_CHANGE', 'Modification paramètres'),
        ('EXPORT', 'Exportation données'),
    ]
    
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True)
    action = models.CharField(max_length=50)
    
    # Object reference
    object_type = models.CharField(max_length=50, null=True, blank=True)
    object_id = models.IntegerField(null=True, blank=True)
    object_repr = models.CharField(max_length=200, null=True, blank=True)
    
    # Change tracking
    before_state = models.JSONField(null=True, blank=True)
    after_state = models.JSONField(null=True, blank=True)
    
    # Context
    details = models.TextField(null=True, blank=True)
    reason = models.TextField(null=True, blank=True)
    
    # Request info
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    user_agent = models.CharField(max_length=500, null=True, blank=True)
    
    timestamp = models.DateTimeField(default=timezone.now)

    class Meta:
        ordering = ['-timestamp']

    def __str__(self):
        return f"{self.action} by {self.user} at {self.timestamp}"

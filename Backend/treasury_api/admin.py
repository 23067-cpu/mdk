from django.contrib import admin
from .models import User, Folio, Transaction, Settlement, Receipt, Invoice, AuditLog

admin.site.register(User)
admin.site.register(Folio)
admin.site.register(Transaction)
admin.site.register(Settlement)
admin.site.register(Receipt)
admin.site.register(Invoice)
admin.site.register(AuditLog)

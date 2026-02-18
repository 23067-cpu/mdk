from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    AuthView, LogoutView, CurrentUserView, ChangePasswordView,
    AdminDashboardView, GerantDashboardView, CaissierDashboardView,
    SaisieClientDashboardView, SaisieFournisseurDashboardView,
    BranchViewSet, UserViewSet, FolioViewSet, TransactionViewSet,
    SettlementViewSet, InvoiceViewSet, NotificationViewSet,
    DocumentViewSet, SystemSettingsViewSet, AuditLogViewSet
)

router = DefaultRouter()
router.register(r'branches', BranchViewSet)
router.register(r'users', UserViewSet)
router.register(r'folios', FolioViewSet)
router.register(r'transactions', TransactionViewSet)
router.register(r'settlements', SettlementViewSet)
router.register(r'invoices', InvoiceViewSet)
router.register(r'notifications', NotificationViewSet, basename='notifications')
router.register(r'documents', DocumentViewSet)
router.register(r'settings', SystemSettingsViewSet)
router.register(r'audit-logs', AuditLogViewSet)

urlpatterns = [
    # Authentication
    path('auth/login/', AuthView.as_view(), name='login'),
    path('auth/logout/', LogoutView.as_view(), name='logout'),
    path('auth/me/', CurrentUserView.as_view(), name='current-user'),
    path('auth/change-password/', ChangePasswordView.as_view(), name='change-password'),
    
    # Role-based Dashboards
    path('dashboard/admin/', AdminDashboardView.as_view(), name='dashboard-admin'),
    path('dashboard/gerant/', GerantDashboardView.as_view(), name='dashboard-gerant'),
    path('dashboard/caissier/', CaissierDashboardView.as_view(), name='dashboard-caissier'),
    path('dashboard/saisie-client/', SaisieClientDashboardView.as_view(), name='dashboard-saisie-client'),
    path('dashboard/saisie-fournisseur/', SaisieFournisseurDashboardView.as_view(), name='dashboard-saisie-fournisseur'),
    
    # Router URLs
    path('', include(router.urls)),
]

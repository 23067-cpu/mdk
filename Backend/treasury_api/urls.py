from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import AuthView, FolioViewSet, TransactionViewSet, DashboardView, InvoiceViewSet, SettlementViewSet

router = DefaultRouter()
router.register(r'folios', FolioViewSet)
router.register(r'transactions', TransactionViewSet)
router.register(r'invoices', InvoiceViewSet)
router.register(r'settlements', SettlementViewSet)

urlpatterns = [
    path('auth/login/', AuthView.as_view(), name='login'),
    path('dashboard/', DashboardView.as_view(), name='dashboard'),
    path('', include(router.urls)),
]

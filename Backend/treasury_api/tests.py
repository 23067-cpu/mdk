from django.test import TestCase, Client
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from rest_framework import status
from django.urls import reverse
from .models import Folio, Branch, Transaction, Settlement

User = get_user_model()

class HappyPathTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        
        # 1. Setup Admin and Data
        self.admin = User.objects.create_superuser('admin', 'admin@example.com', 'adminpass')
        self.branch = Branch.objects.create(code='BR01', name='Siège', is_active=True)
        self.caissier = User.objects.create_user('caissier', 'caissier@example.com', 'userpass', role='CAISSIER', branch=self.branch)
        
    def test_complete_cash_flow(self):
        """
        Verify the complete workflow: Login -> Open Folio -> Transaction -> Close Folio
        """
        
        # 2. Login as Caissier
        login_resp = self.client.post('/api/auth/login/', {'username': 'caissier', 'password': 'userpass'})
        self.assertEqual(login_resp.status_code, 200)
        token = login_resp.data['token']
        self.client.credentials(HTTP_AUTHORIZATION='Token ' + token)
        
        # 3. Open Folio
        folio_data = {'opening_balance': 1000.00, 'notes': 'Start of day'}
        folio_resp = self.client.post('/api/folios/', folio_data)
        self.assertEqual(folio_resp.status_code, 201)
        folio_id = folio_resp.data['folio']['id']
        folio_code = folio_resp.data['folio']['code']
        
        # 4. Create Transaction (Receipt)
        tx_data = {
            'folio': folio_id,
            'type': 'RECEIPT',
            'amount': 500.00,
            'payment_method': 'CASH',
            'description': 'Client deposit'
        }
        tx_resp = self.client.post('/api/transactions/', tx_data)
        self.assertEqual(tx_resp.status_code, 201)
        
        # Verify Balance (Opening 1000 + Receipt 500 = 1500)
        folio_obj = Folio.objects.get(id=folio_id)
        self.assertEqual(folio_obj.running_balance, 1500.00)
        
        # 5. Propose Closure
        closure_data = {
            'actual_physical_balance': 1500.00,
            'notes': 'End of day'
        }
        closure_resp = self.client.post(f'/api/folios/{folio_id}/propose_closure/', closure_data)
        self.assertEqual(closure_resp.status_code, 200)
        self.assertEqual(closure_resp.data['folio']['status'], 'CLOSURE_PROPOSED')
        
        # 6. Login as Admin to Approve
        self.client.credentials() # Logout
        admin_login = self.client.post('/api/auth/login/', {'username': 'admin', 'password': 'adminpass'})
        admin_token = admin_login.data['token']
        self.client.credentials(HTTP_AUTHORIZATION='Token ' + admin_token)
        
        # 7. Approve Closure
        approve_data = {
            'actual_physical_balance': 1500.00,
            'notes': 'Verified ok'
        }
        approve_resp = self.client.post(f'/api/folios/{folio_id}/approve_closure/', approve_data)
        self.assertEqual(approve_resp.status_code, 200)
        
        # Final Verification
        folio_final = Folio.objects.get(id=folio_id)
        self.assertEqual(folio_final.status, 'CLOSED')
        self.assertEqual(float(folio_final.closing_balance), 1500.00)

class SettlementTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.admin = User.objects.create_superuser('admin', 'admin@example.com', 'adminpass')
        self.branch = Branch.objects.create(code='BR01', name='Siège', is_active=True)
        self.saisie = User.objects.create_user('saisie', 'saisie@example.com', 'userpass', role='SAISIE_CLIENT', branch=self.branch)
        
        # Create Folio for settlement context
        self.folio = Folio.objects.create(code='F1', opened_by=self.admin, branch=self.branch, status='OPEN')

    def test_settlement_workflow(self):
        # Login
        self.client.force_authenticate(user=self.saisie)
        
        # Create Settlement Draft
        data = {
            'folio': self.folio.id,
            'party_type': 'CLIENT',
            'party_name': 'Client A',
            'amount': 2000.00,
            'method': 'CHECK'
        }
        resp = self.client.post('/api/settlements/', data)
        self.assertEqual(resp.status_code, 201)
        settlement_id = resp.data['settlement']['id']
        
        # Propose
        prop_resp = self.client.post(f'/api/settlements/{settlement_id}/propose/')
        self.assertEqual(prop_resp.status_code, 200)
        self.assertEqual(prop_resp.data['settlement']['status'], 'PROPOSED')
        
        # Admin Approve
        self.client.force_authenticate(user=self.admin)
        app_resp = self.client.post(f'/api/settlements/{settlement_id}/approve/')
        self.assertEqual(app_resp.status_code, 200)
        self.assertEqual(app_resp.data['settlement']['status'], 'APPROVED')

from django.core.management.base import BaseCommand
from treasury_api.models import Account, CashDenomination

class Command(BaseCommand):
    help = 'Initialize default Chart of Accounts and Cash Denominations'

    def handle(self, *args, **kwargs):
        self.stdout.write('Initializing Accounting Data...')

        # 1. Cash Denominations (MRU)
        denominations = [
            (2000, False), (1000, False), (500, False), (200, False), (100, False), (50, False),
            (20, True), (10, True), (5, True), (1, True)
        ]
        
        for value, is_coin in denominations:
            CashDenomination.objects.get_or_create(
                value=value,
                defaults={'currency': 'MRU', 'is_coin': is_coin}
            )
        self.stdout.write(self.style.SUCCESS(f'Created {len(denominations)} cash denominations'))

        # 2. Chart of Accounts (Simplified PCG)
        accounts_data = [
            # TREASURY (Assets)
            ('530', 'Caisse Principale', 'ASSET'),
            ('531', 'Caisse Secondaire', 'ASSET'),
            ('512', 'Banque', 'ASSET'),
            
            # INCOME (Produits)
            ('701', 'Vente de Marchandises', 'INCOME'),
            ('706', 'Prestation de Services', 'INCOME'),
            ('758', 'Produits Divers', 'INCOME'),
            
            # EXPENSES (Charges)
            ('601', 'Achat de Marchandises', 'EXPENSE'),
            ('606', 'Achats Non Stockés', 'EXPENSE'),
            ('613', 'Location', 'EXPENSE'),
            ('623', 'Publicité', 'EXPENSE'),
            ('625', 'Déplacements', 'EXPENSE'),
            ('626', 'Frais Postaux et Télécoms', 'EXPENSE'),
            ('640', 'Salaires et Appointements', 'EXPENSE'),
            ('658', 'Charges Diverses', 'EXPENSE'),
            
            # THIRD PARTY (Tiers - usually managed dynamically but good to have roots)
            ('411', 'Clients', 'ASSET'),
            ('401', 'Fournisseurs', 'LIABILITY'),
        ]

        for code, name, type in accounts_data:
            Account.objects.get_or_create(
                code=code,
                defaults={'name': name, 'type': type}
            )
        
        self.stdout.write(self.style.SUCCESS(f'Created {len(accounts_data)} default accounts'))

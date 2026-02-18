from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from treasury_api.models import Branch, SystemSettings


User = get_user_model()


class Command(BaseCommand):
    help = 'Initialize the system with default admin user and settings'

    def handle(self, *args, **options):
        # Create default branch
        default_branch, created = Branch.objects.get_or_create(
            code='HQ',
            defaults={
                'name': 'Siège Principal',
                'address': 'Nouakchott, Mauritanie',
                'is_active': True
            }
        )
        if created:
            self.stdout.write(self.style.SUCCESS(f'Created default branch: {default_branch.code}'))
        else:
            self.stdout.write(self.style.WARNING(f'Branch {default_branch.code} already exists'))

        # Create admin user
        admin_username = 'chvii'
        if not User.objects.filter(username=admin_username).exists():
            admin_user = User.objects.create_user(
                username=admin_username,
                password='qweR13@&',
                email='admin@nexasoft.mr',
                first_name='Admin',
                last_name='NexaSolft',
                role='ADMIN',
                branch=default_branch,
                is_staff=True,
                is_superuser=True
            )
            self.stdout.write(self.style.SUCCESS(f'Created admin user: {admin_username}'))
        else:
            self.stdout.write(self.style.WARNING(f'Admin user {admin_username} already exists'))

        # Create default system settings
        default_settings = [
            {
                'key': 'approval_threshold',
                'value': {'amount': 10000, 'currency': 'MRU'},
                'description': 'Montant minimum nécessitant approbation du Gérant',
                'category': 'workflow'
            },
            {
                'key': 'discrepancy_threshold',
                'value': {'amount': 1000, 'currency': 'MRU'},
                'description': 'Écart de solde déclenchant une alerte',
                'category': 'alerts'
            },
            {
                'key': 'max_void_per_user_week',
                'value': {'count': 5},
                'description': 'Nombre maximum d\'annulations par utilisateur par semaine avant alerte',
                'category': 'security'
            },
            {
                'key': 'receipt_template',
                'value': {
                    'company_name': 'NexaSolft',
                    'company_address': 'Nouakchott, Mauritanie',
                    'footer_text': 'Merci pour votre confiance'
                },
                'description': 'Paramètres du modèle de reçu',
                'category': 'templates'
            },
            {
                'key': 'company_info',
                'value': {
                    'name': 'NexaSolft',
                    'email': 'info@nexasoft.mr',
                    'website': 'https://www.nexasoft.mr',
                    'facebook': 'https://web.facebook.com/nexasoft.mr',
                    'whatsapp': 'https://wa.me/22227736247',
                    'phone': '+222 27 73 62 47'
                },
                'description': 'Informations de contact de la société',
                'category': 'company'
            }
        ]

        for setting in default_settings:
            obj, created = SystemSettings.objects.get_or_create(
                key=setting['key'],
                defaults={
                    'value': setting['value'],
                    'description': setting['description'],
                    'category': setting['category']
                }
            )
            if created:
                self.stdout.write(self.style.SUCCESS(f'Created setting: {setting["key"]}'))
            else:
                self.stdout.write(self.style.WARNING(f'Setting {setting["key"]} already exists'))

        self.stdout.write(self.style.SUCCESS('System initialization complete!'))

from django.db import migrations
from django.contrib.auth.hashers import make_password

def create_default_admin(apps, schema_editor):
    User = apps.get_model('treasury_api', 'User')
    
    if not User.objects.filter(username='mdk').exists():
        User.objects.create(
            username='mdk',
            password=make_password('qweR13@&'),
            first_name='mouth',
            last_name='mdk',
            email='23099@supnum.mr',
            role='ADMIN',
            is_active=True,
            is_staff=True,
            is_superuser=True
        )

def remove_default_admin(apps, schema_editor):
    User = apps.get_model('treasury_api', 'User')
    User.objects.filter(username='mdk').delete()

class Migration(migrations.Migration):

    dependencies = [
        ('treasury_api', '0003_update_saisie_roles'),
    ]

    operations = [
        migrations.RunPython(create_default_admin, remove_default_admin),
    ]

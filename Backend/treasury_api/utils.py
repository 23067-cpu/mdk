import threading
from django.core.mail import send_mail
from django.conf import settings
from .models import SystemSettings
import logging

logger = logging.getLogger(__name__)

def _send_email_thread(subject, message, recipient_list):
    try:
        send_mail(
            subject=subject,
            message=message,
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=recipient_list,
            fail_silently=True,
        )
        logger.info(f"Email sent successfully to {recipient_list}")
    except Exception as e:
        logger.error(f"Failed to send email to {recipient_list}: {str(e)}")


def send_smart_alert(action_type, context_data):
    """
    Sends an email alert if the system settings permit it for the given action_type.
    action_type can be: 'high_value_transaction', 'folio_closure', 'settlement_approval'
    context_data is a dict containing details to format the email message.
    """
    try:
        notifications_setting = SystemSettings.objects.filter(key='notifications').first()
        if not notifications_setting or not isinstance(notifications_setting.value, dict):
            return

        config = notifications_setting.value
        recipient_email = '23067@supnum.mr'  # As requested by the user
        
        subject = ""
        message = ""
        should_send = False

        if action_type == 'high_value_transaction':
            threshold = float(config.get('discrepancy_threshold', 0))
            amount = float(context_data.get('amount', 0))
            if config.get('email_on_high_value_transaction') and amount >= threshold:
                should_send = True
                subject = "🚨 Alerte : Transaction de valeur élevée"
                message = (
                    f"Une transaction de valeur élevée a été enregistrée.\n\n"
                    f"Montant : {amount}\n"
                    f"Auteur : {context_data.get('user')}\n"
                    f"Folio : {context_data.get('folio')}\n"
                )

        elif action_type == 'folio_closure':
            if config.get('email_on_folio_closure'):
                should_send = True
                subject = "🔒 Notification : Clôture de Folio"
                message = (
                    f"Un folio a été clôturé ou proposé pour clôture.\n\n"
                    f"Folio : {context_data.get('folio')}\n"
                    f"Utilisateur : {context_data.get('user')}\n"
                    f"Solde de clôture : {context_data.get('balance')}\n"
                )

        elif action_type == 'settlement_approval':
            if config.get('email_on_settlement_approval'):
                should_send = True
                subject = "✅ Notification : Approbation de Règlement"
                message = (
                    f"Un règlement a été approuvé.\n\n"
                    f"Montant : {context_data.get('amount')}\n"
                    f"Approuvé par : {context_data.get('user')}\n"
                    f"Bénéficiaire/Payeur : {context_data.get('party_name')}\n"
                )

        if should_send and subject and message:
            # Send asynchronously to prevent blocking the API request
            thread = threading.Thread(target=_send_email_thread, args=(subject, message, [recipient_email]))
            thread.start()

    except Exception as e:
        logger.error(f"Error evaluating smart alerts: {str(e)}")

import datetime
from django.utils import timezone
from django.http import JsonResponse
from rest_framework.authtoken.models import Token
from .models import SystemSettings

class SessionTimeoutMiddleware:
    """
    Middleware to enforce session timeouts from SystemSettings for token-authenticated users.
    It checks if the token has been inactive for longer than session_timeout_minutes.
    Instead of adding a new field or writing to DB on every request, we will leverage
    a custom caching or just update the DB every 5 minutes to track last activity.
    For simplicity and accuracy in this project, we'll use Django's built-in session or 
    update the token's 'created' field to act as a 'last_activity' tracker.
    """
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        # Allow preflight and unauthenticated routes
        if request.path.startswith('/api/auth/login/') or request.path.startswith('/api/public-settings/'):
            return self.get_response(request)

        auth_header = request.headers.get('Authorization')
        if auth_header and auth_header.startswith('Token '):
            token_key = auth_header.split(' ')[1]
            try:
                token = Token.objects.get(key=token_key)
                
                # Fetch timeout setting
                security_settings = SystemSettings.objects.filter(key='security').first()
                timeout_minutes = 30 # Default
                if security_settings and isinstance(security_settings.value, dict):
                    timeout_minutes = security_settings.value.get('session_timeout_minutes', 30)

                # Check expiration. We use token.created to store the last activity.
                now = timezone.now()
                time_elapsed = now - token.created
                
                if time_elapsed > datetime.timedelta(minutes=timeout_minutes):
                    token.delete()
                    return JsonResponse({
                        'success': False,
                        'message': 'Session expired due to inactivity. Please log in again.',
                        'code': 'token_not_valid'
                    }, status=401)
                
                # Update 'created' to act as last_activity if it was more than 1 minute ago to reduce DB hits
                if time_elapsed > datetime.timedelta(minutes=1):
                    token.created = now
                    token.save(update_fields=['created'])
                    
            except Token.DoesNotExist:
                pass

        response = self.get_response(request)
        return response

from django.db import transaction as db_transaction
from django.utils import timezone
from .models import Sequence

class SequencingService:
    @staticmethod
    def get_next_sequence(prefix, year=None):
        """
        Generates the next sequence number for a given prefix and year.
        Format: PREFIX-YEAR-XXXXX (e.g., REC-2024-00001)
        Uses select_for_update() to ensure gapless, atomic increments.
        """
        if year is None:
            year = timezone.now().year

        code = f"{prefix}-{year}"
        
        with db_transaction.atomic():
            # Lock the sequence row or create it if it doesn't exist
            sequence, created = Sequence.objects.select_for_update().get_or_create(
                code=code,
                defaults={'last_number': 0}
            )
            
            # Increment
            sequence.last_number += 1
            sequence.save()
            
            # Format: PREFIX-YEAR-00001 (5 digits padding)
            return f"{code}-{sequence.last_number:05d}"

from django.core.management.base import BaseCommand
from django.utils import timezone
from apps.leaves.services import create_annual_leave_balances


class Command(BaseCommand):
    help = 'Generate annual leave balances for all employees'

    def add_arguments(self, parser):
        parser.add_argument(
            '--year',
            type=int,
            default=timezone.localdate().year
        )

    def handle(self, *args, **options):
        year = options['year']

        create_annual_leave_balances(year)

        self.stdout.write(
            self.style.SUCCESS(
                f'Leave balances generated successfully for {year}.'
            )
        )

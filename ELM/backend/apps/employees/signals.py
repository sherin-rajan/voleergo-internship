from django.db.models.signals import post_save
from django.dispatch import receiver

from apps.employees.models import Employee
from apps.leaves.services import create_employee_leave_balances


@receiver(post_save, sender=Employee)
def create_leave_balances(sender, instance, created, **kwargs):
    if created:
        create_employee_leave_balances(instance)

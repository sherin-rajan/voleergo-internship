
from apps.leaves.models import LeaveType, LeaveBalance


def create_employee_leave_balances(employee):
    joining_date = employee.joining_date

    # Count the joining month as a full month.
    remaining_months = 12 - joining_date.month + 1

    leave_types = LeaveType.objects.all()

    for leave_type in leave_types:
        allocated_days = (
            leave_type.annual_days * remaining_months
        ) // 12

        LeaveBalance.objects.get_or_create(
            employee=employee,
            leave_type=leave_type,
            year=joining_date.year,
            defaults={
                'allocated_days': allocated_days,
                'used_days': 0,
            }
        )

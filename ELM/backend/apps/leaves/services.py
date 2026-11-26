from apps.leaves.models import LeaveType, LeaveBalance
from datetime import timedelta


def create_employee_leave_balances(employee, year=None):
    joining_date = employee.joining_date

    # If no year is provided, create the joining-year balance.
    balance_year = year if year is not None else joining_date.year

    # Employees cannot receive leave balances before joining.
    if balance_year < joining_date.year:
        return

    leave_types = LeaveType.objects.all()

    for leave_type in leave_types:

        if balance_year == joining_date.year:
            # Pro-rata allocation in the joining year.
            remaining_months = 12 - joining_date.month + 1

            allocated_days = (
                leave_type.annual_days * remaining_months
            ) // 12

        else:
            # Full annual allocation in subsequent years.
            allocated_days = leave_type.annual_days

        LeaveBalance.objects.get_or_create(
            employee=employee,
            leave_type=leave_type,
            year=balance_year,
            defaults={
                'allocated_days': allocated_days,
                'used_days': 0,
            }
        )


def create_annual_leave_balances(year):
    """
    Generate annual leave balances for all employees
    for the specified calendar year.
    """
    from apps.employees.models import Employee

    employees = Employee.objects.all()

    for employee in employees:
        create_employee_leave_balances(employee, year)


def calculate_working_days(start_date, end_date):
    total_days = 0
    current_date = start_date

    while current_date <= end_date:
        # Monday = 0, Sunday = 6
        if current_date.weekday() < 5:
            total_days += 1

        current_date += timedelta(days=1)

    return total_days

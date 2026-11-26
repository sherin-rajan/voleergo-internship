from rest_framework import generics, permissions
from apps.leaves.models import LeaveRequest, LeaveBalance
from apps.leaves.serializers import LeaveRequestSerializer,LeaveReviewSerializer
from apps.leaves.services import calculate_working_days
from apps.employees.models import Employee, Department

from django.shortcuts import get_object_or_404
from datetime import timedelta
from django.db.models import Q
from django.utils import timezone
from django.db import transaction
from rest_framework import status
from rest_framework.views import APIView
from rest_framework.generics import ListAPIView
from rest_framework.response import Response
from rest_framework.exceptions import PermissionDenied, ValidationError
from rest_framework.permissions import IsAuthenticated



class LeaveRequestCreateView(generics.CreateAPIView):
    serializer_class = LeaveRequestSerializer
    permission_classes = [permissions.IsAuthenticated]

    def perform_create(self, serializer):
        employee = self.request.user.employee
        serializer.save(employee=employee)



class ManagerLeaveRequestListView(ListAPIView):
    serializer_class = LeaveRequestSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        if self.request.user.role not in ['manager', 'hr']:
            raise PermissionDenied(
                "Only managers and HR Administrators can view team requests."
            )

        return LeaveRequest.objects.filter(
            employee__manager=self.request.user
        ).order_by('-created_at')


class ManagerLeaveReviewView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def patch(self, request, pk):
        if request.user.role not in ['manager', 'hr']:
            raise PermissionDenied(
                "Only managers and HR Administrators can review leave requests."
            )

        serializer = LeaveReviewSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        with transaction.atomic():
            leave_request = get_object_or_404(
                LeaveRequest.objects.select_for_update(),
                pk=pk,
                employee__manager=request.user
            )

            if leave_request.status != 'pending':
                raise ValidationError(
                    "This request has already been reviewed."
                )

            decision = serializer.validated_data['status']
            comment = serializer.validated_data.get('manager_comment', '')

            if decision == 'approved':
                total_days = calculate_working_days(
                    leave_request.start_date,
                    leave_request.end_date
                )

                balance = get_object_or_404(
                    LeaveBalance.objects.select_for_update(),
                    employee=leave_request.employee,
                    leave_type=leave_request.leave_type,
                    year=leave_request.start_date.year
                )

                if total_days > balance.remaining_days:
                    raise ValidationError("Insufficient leave balance.")

                balance.used_days += total_days
                balance.save(update_fields=['used_days'])

            leave_request.status = decision
            leave_request.manager_comment = comment
            leave_request.reviewed_by = request.user
            leave_request.reviewed_at = timezone.now()
            leave_request.save()

        return Response({
            "message": f"Leave request {decision} successfully.",
            "status": leave_request.status,
            "manager_comment": leave_request.manager_comment
        }, status=status.HTTP_200_OK)


class MyLeaveRequestListView(ListAPIView):
    serializer_class = LeaveRequestSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return LeaveRequest.objects.filter(
            employee__user=self.request.user
        ).order_by('-created_at')


class MyLeaveBalanceListView(ListAPIView):
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        from apps.leaves.models import LeaveBalance

        return LeaveBalance.objects.filter(
            employee__user=self.request.user,
            year=timezone.now().year
        ).select_related('leave_type')

    def list(self, request, *args, **kwargs):
        balances = self.get_queryset()

        data = [
            {
                'leave_type': balance.leave_type.name,
                'allocated_days': balance.allocated_days,
                'used_days': balance.used_days,
                'remaining_days': balance.remaining_days,
                'year': balance.year,
            }
            for balance in balances
        ]

        return Response(data)


class ManagerDashboardView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        if request.user.role != 'manager':
            raise PermissionDenied("Only managers can access this dashboard.")

        team_employees = Employee.objects.filter(
            manager=request.user
        )

        team_requests = LeaveRequest.objects.filter(
            employee__manager=request.user
        )

        data = {
            'total_employees': team_employees.count(),
            'pending_requests': team_requests.filter(
                status='pending'
            ).count(),
            'approved_requests': team_requests.filter(
                status='approved'
            ).count(),
            'rejected_requests': team_requests.filter(
                status='rejected'
            ).count(),
            'recent_requests': LeaveRequestSerializer(
                team_requests.order_by('-created_at')[:5],
                many=True
            ).data
        }

        return Response(data)


class HRDashboardView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        if request.user.role != 'hr':
            raise PermissionDenied("Only HR administrators can access this dashboard.")

        all_requests = LeaveRequest.objects.all()

        department_data = []

        for department in Department.objects.all():
            department_data.append({
                'department': department.name,
                'total_employees': department.employees.count()
            })

        data = {
            'total_employees': Employee.objects.count(),
            'total_departments': Department.objects.count(),
            'pending_requests': all_requests.filter(status='pending').count(),
            'approved_requests': all_requests.filter(status='approved').count(),
            'rejected_requests': all_requests.filter(status='rejected').count(),
            'department_summary': department_data
        }

        return Response(data)


class HRMonthlyLeaveReportView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        if request.user.role != 'hr':
            raise PermissionDenied(
                "Only HR Administrators can access this report."
            )

        from collections import defaultdict

        from apps.leaves.services import calculate_working_days

        year = request.query_params.get('year', timezone.now().year)

        try:
            year = int(year)
        except ValueError:
            return Response(
                {"error": "Please provide a valid year."},
                status=400
            )

        requests = LeaveRequest.objects.filter(
            start_date__year=year
        ).select_related('employee', 'leave_type')

        monthly_data = defaultdict(lambda: {
            'total_requests': 0,
            'pending_requests': 0,
            'approved_requests': 0,
            'rejected_requests': 0,
            'approved_leave_days': 0,
        })

        for leave in requests:
            month = leave.start_date.month
            data = monthly_data[month]

            data['total_requests'] += 1
            data[f'{leave.status}_requests'] += 1

            if leave.status == 'approved':
                data['approved_leave_days'] += calculate_working_days(
                    leave.start_date,
                    leave.end_date
                )

        report = []

        for month in range(1, 13):
            report.append({
                'month': month,
                **monthly_data[month]
            })

        return Response({
            'year': year,
            'monthly_report': report
        })


class HRDepartmentLeaveReportView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        if request.user.role != 'hr':
            raise PermissionDenied(
                "Only HR Administrators can access this report."
            )

        from apps.leaves.services import calculate_working_days

        report = []

        for department in Department.objects.all():
            requests = LeaveRequest.objects.filter(
                employee__department=department
            )

            approved_requests = requests.filter(status='approved')

            approved_days = sum(
                calculate_working_days(item.start_date, item.end_date)
                for item in approved_requests
            )

            report.append({
                'department': department.name,
                'total_employees': department.employees.count(),
                'total_requests': requests.count(),
                'pending_requests': requests.filter(status='pending').count(),
                'approved_requests': approved_requests.count(),
                'rejected_requests': requests.filter(status='rejected').count(),
                'approved_leave_days': approved_days,
            })

        return Response({
            'department_report': report
        })


class LeaveCalendarView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        user = request.user

        if user.role not in ['employee', 'manager', 'hr']:
            raise PermissionDenied("You do not have calendar access.")

        leaves = LeaveRequest.objects.filter(
            status='approved'
        ).select_related(
            'employee__user',
            'employee__department',
            'leave_type'
        )

        if user.role == 'employee':
            leaves = leaves.filter(employee__user=user)

        elif user.role == 'manager':
            leaves = leaves.filter(
                Q(employee__manager=user) |
                Q(employee__user=user)
            )

        # HR Administrator can view all approved leaves.

        events = []

        for leave in leaves:
            events.append({
                'id': leave.id,
                'title': f"{leave.employee.user.username} - {leave.leave_type.name}",
                'start': leave.start_date.isoformat(),
                # FullCalendar uses an exclusive end date.
                'end': (leave.end_date + timedelta(days=1)).isoformat(),
                'allDay': True,
                'extendedProps': {
                    'employee': leave.employee.user.username,
                    'department': leave.employee.department.name,
                    'leave_type': leave.leave_type.name,
                }
            })

        return Response(events)


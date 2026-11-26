from rest_framework import serializers
from apps.leaves.models import LeaveRequest, LeaveBalance, LeaveType
from apps.leaves.services import calculate_working_days
from django.utils import timezone


class LeaveRequestSerializer(serializers.ModelSerializer):

    total_days = serializers.SerializerMethodField()

    class Meta:
        model = LeaveRequest
        fields = [
            'id',
            'leave_type',
            'start_date',
            'end_date',
            'reason',
            'status',
            'total_days',
            'created_at',
        ]
        read_only_fields = ['id', 'status', 'created_at', 'total_days']

    def get_total_days(self, obj):
        return calculate_working_days(obj.start_date, obj.end_date)

    def validate(self, data):
        request_user = self.context['request'].user

        start_date = data['start_date']
        end_date = data['end_date']
        leave_type = data['leave_type']

        if request_user.role not in ['employee', 'manager']:
            raise serializers.ValidationError(
                "You are not allowed to apply for leave."
            )

        employee = getattr(request_user, 'employee', None)

        if employee is None:
            raise serializers.ValidationError(
                "Employee profile not found."
            )

        if start_date < employee.joining_date:
            raise serializers.ValidationError(
                "Leave cannot be applied for dates before the joining date."
            )

        if end_date < start_date:
            raise serializers.ValidationError(
                "End date cannot be before start date."
            )

        total_days = calculate_working_days(start_date, end_date)

        if total_days == 0:
            raise serializers.ValidationError(
                "Leave request must contain at least one working day."
            )

        year = start_date.year

        if end_date.year != year:
            raise serializers.ValidationError(
                "Leave requests cannot cross calendar years."
            )

        overlapping = LeaveRequest.objects.filter(
            employee=employee,
            start_date__lte=end_date,
            end_date__gte=start_date,
            status__in=['pending', 'approved']
        )

        if overlapping.exists():
            raise serializers.ValidationError(
                "You already have a pending or approved leave request for these dates."
            )

        try:
            balance = LeaveBalance.objects.get(
                employee=employee,
                leave_type=leave_type,
                year=year
            )
        except LeaveBalance.DoesNotExist:
            raise serializers.ValidationError(
                "Leave balance not found for this year."
            )

        if total_days > balance.remaining_days:
            raise serializers.ValidationError(
                f"Insufficient leave balance. Available: {balance.remaining_days} days."
            )

        return data


class LeaveReviewSerializer(serializers.Serializer):
    status = serializers.ChoiceField(
        choices=['approved', 'rejected']
    )
    manager_comment = serializers.CharField(
        required=False,
        allow_blank=True
    )

class LeaveTypeSerializer(serializers.ModelSerializer):
    class Meta:
        model = LeaveType
        fields = ['id', 'name', 'annual_days', 'description']

class ManagerLeaveRequestSerializer(serializers.ModelSerializer):
    employee_name = serializers.CharField(
        source='employee.user.username',
        read_only=True
    )
    employee_id = serializers.CharField(
        source='employee.employee_id',
        read_only=True
    )
    department = serializers.CharField(
        source='employee.department.name',
        read_only=True
    )
    leave_type_name = serializers.CharField(
        source='leave_type.name',
        read_only=True
    )

    total_days = serializers.SerializerMethodField()

    class Meta:
        model = LeaveRequest
        fields = [
            'id',
            'employee_name',
            'employee_id',
            'department',
            'leave_type_name',
            'start_date',
            'end_date',
            'total_days',
            'reason',
            'status',
            'created_at',
        ]

    def get_total_days(self, obj):
        return calculate_working_days(
            obj.start_date,
            obj.end_date
        )


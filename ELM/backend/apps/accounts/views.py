from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from apps.employees.models import Employee


class CurrentUserView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user

        employee = Employee.objects.select_related(
            "department", "manager"
        ).filter(user=user).first()

        data = {
            "username": user.username,
            "role": user.role,
            "employee_id": employee.employee_id if employee else None,
            "department": employee.department.name if employee else None,
            "manager": employee.manager.username if employee and employee.manager else None,
        }

        return Response(data)
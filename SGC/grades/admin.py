from django.contrib import admin
from .models import Student, Subject, StudentMark, UserProfile

# Register your models here.

admin.site.register(Student)
admin.site.register(Subject)
admin.site.register(StudentMark)
admin.site.register(UserProfile)
from django.urls import path
from . import views

urlpatterns = [
    path('', views.home, name='home'),
    path('add_student/', views.add_student, name='add_student'),   
    path('add_subject/', views.add_subject, name='add_subject'),
    path('student_list/', views.student_list, name='student_list'),
    path('student/<int:id>/', views.student_detail, name='student_detail'),
    path('add_mark/<int:id>/', views.add_student_mark, name='add_mark'),
]
from django.urls import path
from . import views

urlpatterns = [
    path('', views.home, name='home'),
    path('add_student/', views.add_student, name='add_student'),
    path('edit_student/<int:id>/', views.edit_student, name='edit_student'),
    path('delete_student/<int:id>/', views.delete_student, name='delete_student'),   
    path('add_subject/', views.add_subject, name='add_subject'),
    path('subject_list/', views.subject_list, name='subject_list'),
    path('edit_subject/<int:id>/', views.edit_subject, name='edit_subject'),
    path('delete_subject/<int:id>/', views.delete_subject, name='delete_subject'),
    path('student_list/', views.student_list, name='student_list'),
    path('student/<int:id>/', views.student_detail, name='student_detail'),
    path('add_mark/<int:id>/', views.add_student_mark, name='add_mark'),
    path(
        'add_mark/<int:id>/<int:subject_id>/',
        views.add_student_mark,
        name='add_mark_subject'
    ),
    path(
        'edit_mark/<int:student_id>/<int:mark_id>/',
        views.edit_student_mark,
        name='edit_mark'
    ),
    path(
        'delete_mark/<int:student_id>/<int:mark_id>/',
        views.delete_student_mark,
        name='delete_mark'
    ),
    path('dashboard/', views.dashboard, name='dashboard'),
    path(
        'results/<str:result_type>/',
        views.result_students,
        name='result_students'
    ),
        ]
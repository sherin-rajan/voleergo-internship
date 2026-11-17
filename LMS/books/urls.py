from django.urls import path
from . import views

urlpatterns = [
    path('', views.home, name='home'),
    path('add_book/', views.add_book, name='add_book'),
    path('book_list/', views.book_list, name='book_list'),
    path('book/<int:pk>/', views.book_details, name='book_details'),
    path('book_update/<int:pk>/', views.update_book, name='update_book'),]
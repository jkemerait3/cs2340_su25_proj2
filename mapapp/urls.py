# mapapp/urls.py
from django.urls import path
from . import views

urlpatterns = [
    path('', views.map_view, name='map'),
    path('shop/<int:shop_id>/', views.map_view, name='map_shop'),
]
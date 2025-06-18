from django.urls import path
from . import views
from django.contrib.auth import views as auth_views
from django.conf import settings
from django.conf.urls.static import static

urlpatterns = [
    path('', views.home, name='home'),
    path('register/', views.register, name='register'),
    path('login/', auth_views.LoginView.as_view(template_name='home/login.html'), name='login'),
    path('logout/', auth_views.LogoutView.as_view(next_page='home'), name='logout'),
    path('shops/', views.coffee_shops, name='coffee_shops'),
    path('shops/<int:shop_id>/review/', views.add_review, name='add_review'),
    path('review/<int:review_id>/edit/', views.edit_review, name='edit_review'),
    path('review/<int:review_id>/delete/', views.delete_review, name='delete_review'),
    path('coffee_shops/<int:id>/like/', views.like_coffee_shop, name='coffee_shops.like_coffee_shop'),
    path('coffee_shops/liked/', views.liked_coffee_shops, name='coffee_shops.liked_coffee_shops'),
    path('favorites/', views.liked_coffee_shops, name='coffee_shops.liked_coffee_shops'),
]
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
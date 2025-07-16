from django.contrib import admin
from .models import CoffeeShop, Review

@admin.register(CoffeeShop)
class CoffeeShopAdmin(admin.ModelAdmin):
    list_display = ('name', 'address', 'source', 'is_top_pick')
    search_fields = ('name', 'address')
    list_filter = ('source', 'is_top_pick')

@admin.register(Review)
class ReviewAdmin(admin.ModelAdmin):
    list_display = ('user', 'shop', 'rating', 'created_at')
    search_fields = ('user__username', 'shop__name')

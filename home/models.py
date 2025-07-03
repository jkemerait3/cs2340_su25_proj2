from django.db import models
from django.contrib.auth.models import User
from django.db.models import Avg

class CoffeeShop(models.Model):
    name = models.CharField(max_length=200)
    address = models.CharField(max_length=300)
    hours = models.CharField(max_length=100)
    amenities = models.TextField()
    image = models.ImageField(upload_to='shop_images/')
    is_top_pick = models.BooleanField(default=False)
    favorited_by = models.ManyToManyField(User, related_name='favorite_shops', blank=True)
    latitude = models.FloatField(null=True, blank=True)
    longitude = models.FloatField(null=True, blank=True)
    
    def __str__(self):
        return self.name
    def average_rating(self):
        return self.reviews.aggregate(avg=Avg('rating'))['avg'] or 0

class Review(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    shop = models.ForeignKey(CoffeeShop, on_delete=models.CASCADE, related_name='reviews')
    content = models.TextField()
    rating = models.FloatField()
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']
        constraints = [
            models.UniqueConstraint(
                fields=['user', 'shop'], 
                name='one_review_per_user_per_shop'
            )
        ]

from django.db import models
from django.contrib.auth.models import User
class CoffeeShop(models.Model):
    name = models.CharField(max_length=200)
    address = models.CharField(max_length=300)
    hours = models.CharField(max_length=100)
    amenities = models.TextField()
    image = models.ImageField(upload_to='shop_images/')

    def __str__(self):
        return self.name

class Review(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    shop = models.ForeignKey(CoffeeShop, on_delete=models.CASCADE, related_name='reviews')
    content = models.TextField()
    rating = models.PositiveSmallIntegerField()
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

class Favorite(models.Model):
    id = models.AutoField(primary_key=True)
    coffeeshop = models.ForeignKey(CoffeeShop, on_delete=models.CASCADE)
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    def __str__(self):
        return f"{self.id} - {self.movie.name}"
from django.db import models
from home.models import CoffeeShop  # adjust as needed

class Summarizer(models.Model):
    shop = models.OneToOneField(CoffeeShop, on_delete=models.CASCADE)
    summary = models.TextField()

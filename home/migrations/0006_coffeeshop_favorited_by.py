# Generated by Django 5.0 on 2025-06-22 23:41

from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('home', '0005_alter_review_options'),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.AddField(
            model_name='coffeeshop',
            name='favorited_by',
            field=models.ManyToManyField(blank=True, related_name='favorite_shops', to=settings.AUTH_USER_MODEL),
        ),
    ]

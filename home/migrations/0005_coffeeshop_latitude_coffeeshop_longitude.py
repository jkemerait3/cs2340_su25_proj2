# Generated by Django 5.0 on 2025-06-18 14:35

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('home', '0004_rename_like_favorite'),
    ]

    operations = [
        migrations.AddField(
            model_name='coffeeshop',
            name='latitude',
            field=models.FloatField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name='coffeeshop',
            name='longitude',
            field=models.FloatField(blank=True, null=True),
        ),
    ]

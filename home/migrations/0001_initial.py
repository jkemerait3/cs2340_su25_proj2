# Generated by Django 5.0 on 2025-06-10 21:44

from django.db import migrations, models


class Migration(migrations.Migration):

    initial = True

    dependencies = [
    ]

    operations = [
        migrations.CreateModel(
            name='CoffeeShop',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('name', models.CharField(max_length=200)),
                ('address', models.CharField(max_length=300)),
                ('hours', models.CharField(max_length=100)),
                ('amenities', models.TextField()),
                ('image', models.ImageField(upload_to='shop_images/')),
            ],
        ),
    ]

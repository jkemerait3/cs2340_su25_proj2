from django.core.management.base import BaseCommand
from geopy.geocoders import Nominatim
from home.models import CoffeeShop
import time

class Command(BaseCommand):
    help = 'Geocode CoffeeShop addresses and save lat/lon'

    def handle(self, *args, **kwargs):
        geolocator = Nominatim(user_agent="coffee-map")
        shops = CoffeeShop.objects.filter(latitude__isnull=True, longitude__isnull=True)

        for shop in shops:
            try:
                location = geolocator.geocode(shop.address)
                if location:
                    shop.latitude = location.latitude
                    shop.longitude = location.longitude
                    shop.save()
                    self.stdout.write(self.style.SUCCESS(f"Geocoded: {shop.name}"))
                else:
                    self.stdout.write(self.style.WARNING(f"Could not geocode: {shop.name}"))
            except Exception as e:
                self.stderr.write(f"Error geocoding {shop.name}: {e}")
            time.sleep(1)

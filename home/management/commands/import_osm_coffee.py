import requests
from django.core.management.base import BaseCommand
from home.models import CoffeeShop

class Command(BaseCommand):
    help = 'Fetch coffee shops from OpenStreetMap and save them to the CoffeeShop model.'

    def handle(self, *args, **kwargs):
        overpass_url = "https://overpass-api.de/api/interpreter"
        query = '''
        [out:json][timeout:60];
        node["amenity"="cafe"](33.6407,-84.5511,33.8868,-84.2890);
        out body;
        '''
        response = requests.get(overpass_url, params={'data': query})
        data = response.json()

        count = 0
        for el in data.get('elements', []):
            tags = el.get('tags', {})
            name = tags.get('name')
            lat = el.get('lat')
            lon = el.get('lon')
            address = tags.get('addr:street', '')
            hours = tags.get('opening_hours', '')
            wifi = tags.get('internet_access') in ['wlan', 'yes']

            if not name or lat is None or lon is None:
                continue

            if CoffeeShop.objects.filter(name=name, latitude=lat, longitude=lon).exists():
                continue

            CoffeeShop.objects.create(
                name=name,
                address=address,
                hours=hours,
                amenities='WiFi' if wifi else '',
                latitude=lat,
                longitude=lon,
                source='osm'
            )
            count += 1

        self.stdout.write(self.style.SUCCESS(f'Successfully imported {count} OSM coffee shops.'))

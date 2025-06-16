from django.shortcuts import render
from home.models import CoffeeShop

def map_view(request):
    # Convert to list of plain dicts (this is the fix)
    shops = list(CoffeeShop.objects.values('name', 'address', 'hours', 'amenities'))

    return render(request, 'mapapp/map.html', {
        'coffee_shops': shops
    })

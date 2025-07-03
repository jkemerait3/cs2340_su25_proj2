from django.shortcuts import render
from home.models import CoffeeShop

def map_view(request):
    shops = CoffeeShop.objects.filter(latitude__isnull=False, longitude__isnull=False).values(
        'name', 'address', 'hours', 'amenities', 'latitude', 'longitude', 'image',
    )

    user = request.user
    bookmarked_shops = user.favorite_shops.all()

    return render(request, 'mapapp/map.html', {
        'coffee_shops': list(shops),
        'bookmarked_shops': bookmarked_shops
    })

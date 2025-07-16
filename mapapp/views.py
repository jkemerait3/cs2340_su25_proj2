from django.shortcuts import render
from home.models import CoffeeShop
from django.http import JsonResponse
from datetime import datetime
import json

def map_view(request):
    shops = CoffeeShop.objects.filter(latitude__isnull=False, longitude__isnull=False).values(
        'name', 'address', 'hours', 'amenities', 'latitude', 'longitude', 'image',
    )

    return render(request, 'mapapp/map.html', {
        'coffee_shops': list(shops)
    })

def coffee_shop_api(request):
    shops = CoffeeShop.objects.filter(latitude__isnull=False, longitude__isnull=False)

    # Handle amenities filtering
    if request.GET.get('wifi') == 'true':
        shops = shops.filter(amenities__icontains='wifi')
    if request.GET.get('outlets') == 'true':
        shops = shops.filter(amenities__icontains='outlets')

    # Handle openNow
    if request.GET.get('openNow') == 'true':
        now = datetime.now()
        weekday = now.strftime('%A').lower()  # 'monday', 'tuesday', etc.
        current_hour = now.hour + now.minute / 60
        matching_ids = []
        for shop in shops:
            try:
                hours = json.loads(shop.hours)  # assume JSON like {'monday': {'open': 8, 'close': 22}, ...}
                today_hours = hours.get(weekday)
                if today_hours and today_hours['open'] <= current_hour <= today_hours['close']:
                    matching_ids.append(shop.id)
            except:
                continue
        shops = shops.filter(id__in=matching_ids)

    # Open After / Close Before
    open_after = request.GET.get('openAfter')
    close_before = request.GET.get('closeBefore')
    if open_after or close_before:
        weekday = datetime.now().strftime('%A').lower()
        matching_ids = []
        for shop in shops:
            try:
                hours = json.loads(shop.hours)
                today_hours = hours.get(weekday)
                if today_hours:
                    if open_after:
                        after_val = int(open_after.split(":")[0]) + int(open_after.split(":")[1]) / 60
                        if today_hours['open'] < after_val:
                            continue
                    if close_before:
                        before_val = int(close_before.split(":")[0]) + int(close_before.split(":")[1]) / 60
                        if today_hours['close'] > before_val:
                            continue
                    matching_ids.append(shop.id)
            except:
                continue
        shops = shops.filter(id__in=matching_ids)

    data = list(shops.values('name', 'address', 'latitude', 'longitude', 'image', 'amenities', 'hours'))
    return JsonResponse(data, safe=False)

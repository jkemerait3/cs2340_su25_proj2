from django.shortcuts import render
from home.models import CoffeeShop
from django.core.serializers import serialize
import json

def map_view(request, shop_id=None):
    """
    Renders the map view with coffee shop data.
    
    Handles both:
    - The main map view (/map/)
    - Specific shop views (/map/shop/<shop_id>/)
    
    Args:
        request: HttpRequest object
        shop_id (int, optional): ID of a specific coffee shop to highlight. Defaults to None.
    
    Returns:
        HttpResponse: Rendered map template with context data
    """
    
    # Query coffee shops that have valid coordinates
    shops = CoffeeShop.objects.filter(
        latitude__isnull=False, 
        longitude__isnull=False
    ).values(
        'id',  # MUST include ID for URL functionality
        'name', 
        'address', 
        'hours', 
        'amenities', 
        'latitude', 
        'longitude', 
        'image',
    )

    # Get current user
    user = request.user
    
    # Get user's bookmarked shops if authenticated
    bookmarked_shops = user.favorite_shops.all() if user.is_authenticated else []
    
    # Find the specific shop if ID is provided in URL
    initial_shop = None
    if shop_id:
        # Try to find the shop in the queryset
        initial_shop = next(
            (shop for shop in shops if shop['id'] == shop_id),
            None
        )
    
    # Convert bookmarked shops to JSON-safe format for JavaScript
    bookmarked_shops_json = json.dumps([
        {
            'id': shop.id,
            'name': shop.name,
            'address': shop.address,
            'image': shop.image.url if shop.image else '',
        } 
        for shop in bookmarked_shops
    ])
    
    return render(request, 'mapapp/map.html', {
        'coffee_shops': list(shops),  # All coffee shops with coordinates
        'bookmarked_shops': bookmarked_shops,  # User's bookmarked shops
        'bookmarked_shops_json': bookmarked_shops_json,  # JSON version for JS
        'initial_shop_id': shop_id,  # Pass shop ID to template
        'initial_shop': initial_shop,  # Pass shop data if found
        'filter_hours': range(1, 13),
        'filter_minutes': ['00', '15', '30', '45'],
        'ampm_options': ['AM', 'PM']
    }
)
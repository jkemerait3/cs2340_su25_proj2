from django import template

register = template.Library()

@register.filter
def star_rating_parts(rating):
    try:
        rating = float(rating)
    except (TypeError, ValueError):
        rating = 0.0

    stars = []
    for i in range(1, 6):
        if rating >= i:
            stars.append('full')
        elif rating >= i - 0.5:
            stars.append('half')
        else:
            stars.append('empty')
    return stars
    
@register.filter
def star_fill_percent(rating):
    try:
        rating = float(rating)
        return round((rating / 5.0) * 100)  # Convert to %
    except (TypeError, ValueError):
        return 0

# In your review_extras.py file
from django import template
import math # Make sure math is imported!

register = template.Library()

@register.filter
def star_rating_parts(rating, max_stars=5):
    """
    Generates a list of star types ('full', 'half', 'empty') for rendering
    individual star icons. The average rating is rounded to the nearest 0.5
    with "round half up" behavior for consistent visual display.
    """
    try:
        rating_float = float(rating)
    except (ValueError, TypeError):
        rating_float = 0.0

    stars = []
    
    # MODIFIED LINE: Use math.floor(x + 0.5) for "round half up" behavior
    # This will ensure 2.25*2 = 4.5 becomes 5.0 before dividing by 2, resulting in 2.5.
    display_rating = math.floor(rating_float * 2 + 0.5) / 2
    
    for i in range(1, max_stars + 1):
        if display_rating >= i:
            stars.append('full')
        elif display_rating >= i - 0.5:
            stars.append('half')
        else:
            stars.append('empty')
            
    return stars[:max_stars]

# You can remove the @register.filter def debug_star_display_value if you added it earlier
# as it's no longer needed for debugging this specific issue.
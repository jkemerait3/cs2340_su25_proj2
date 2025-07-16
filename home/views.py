from django.shortcuts import get_object_or_404, render
from django.contrib.auth.forms import UserCreationForm
from django.contrib.auth import login
from django.shortcuts import redirect
from .models import CoffeeShop
from .forms import ReviewForm
from .models import Review
from django.contrib.auth.decorators import login_required
from django.contrib.auth.models import User
from django.contrib import messages
from django.db.models import Avg, Count
from summarizer.utils import summarize_reviews_hf

def home(request):
    top_picks = CoffeeShop.objects.filter(is_top_pick=True)[:3]
    latest_reviews = Review.objects.select_related('user', 'shop').order_by('-created_at')[:5]
    
    return render(request, 'home/home.html', {
        'top_picks': top_picks,
        'latest_reviews': latest_reviews
    })

def register(request):
    if request.method == 'POST':
        form = UserCreationForm(request.POST)
        if form.is_valid():
            user = form.save()
            login(request, user)
            return redirect('home')
    else:
        form = UserCreationForm()
    return render(request, 'account/register.html', {'form': form})

def shops(request):
    shops = CoffeeShop.objects.annotate(
        average_rating=Avg('reviews__rating'),
        review_count=Count('reviews')
    )

    bookmarked_shops = []
    if request.user.is_authenticated:
        bookmarked_shops = request.user.favorite_shops.all()

    return render(request, 'home/shops.html', {
        'shops': shops,
        'bookmarked_shops': bookmarked_shops,
    })

def shop_detail(request, shop_id):
    shop = get_object_or_404(CoffeeShop, id=shop_id)
    reviews = Review.objects.filter(shop=shop)
    
    user_review = (
        reviews.filter(user=request.user).first() if request.user.is_authenticated else None
    )
    other_reviews = reviews.exclude(id=user_review.id) if user_review else reviews

    # Combine review texts for summarization
    review_texts = [review.content for review in reviews]
    summary = summarize_reviews_hf(review_texts,shop.name)
    return render(request, "home/shop_detail.html", {
        "shop": shop,
        "user_review": user_review,
        "other_reviews": other_reviews,
        "summary": summary,
    })

@login_required
def add_review(request, shop_id):
    shop = get_object_or_404(CoffeeShop, id=shop_id)
    
    # Check for existing review
    existing_review = Review.objects.filter(
        user=request.user, 
        shop=shop
    ).first()
    
    if existing_review:
        messages.warning(request, "You've already reviewed this coffee shop")
        return redirect('edit_review', review_id=existing_review.id)
    
    if request.method == 'POST':
        form = ReviewForm(request.POST)
        if form.is_valid():
            review = form.save(commit=False)
            review.user = request.user
            review.shop = shop
            review.save()
            return redirect('shop_detail', pk=shop.id)
    else:
        form = ReviewForm()
    
    return render(request, 'review/add_review.html', {
        'form': form, 
        'shop': shop,
        'existing_review': existing_review
    })

@login_required
def edit_review(request, review_id):
    review = get_object_or_404(Review, id=review_id, user=request.user)
    if request.method == 'POST':
        form = ReviewForm(request.POST, instance=review)
        if form.is_valid():
            form.save()
            return redirect('shop_detail', pk=review.shop.id)
    else:
        form = ReviewForm(instance=review)
    return render(request, 'review/edit_review.html', {
        'form': form,
        'review': review
    })

@login_required
def delete_review(request, review_id):
    review = get_object_or_404(Review, id=review_id, user=request.user)
    if request.method == 'POST':
        shop_id = review.shop.id
        review.delete()
        return redirect('shop_detail', pk=shop_id)
    return render(request, 'review/delete_review.html', {'review': review})

def about(request):
    return render(request, 'home/about.html')
    
@login_required
def account_view(request):
    user = request.user
    bookmarked_shops = user.favorite_shops.all()  # Make sure `related_name='favorite_shops'` is set
    reviews = Review.objects.filter(user=user).select_related('shop')
    return render(request, 'account/account.html', {
        'bookmarked_shops': bookmarked_shops,
        'reviews': reviews,
    })

@login_required
def toggle_favorite(request, shop_id):
    shop = get_object_or_404(CoffeeShop, id=shop_id)
    user = request.user
    if user in shop.favorited_by.all():
        shop.favorited_by.remove(user)
    else:
        shop.favorited_by.add(user)
    return redirect(request.META.get('HTTP_REFERER', 'home'))  # returns to previous page

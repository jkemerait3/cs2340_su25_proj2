from django.shortcuts import get_object_or_404, render, redirect
from django.contrib.auth.forms import UserCreationForm
from django.contrib.auth import login
from django.contrib.auth.decorators import login_required
from django.contrib import messages
from django.db.models import Avg, Count
from django.http import Http404

from .models import CoffeeShop, Review
from .forms import ReviewForm

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
    return render(request, 'home/register.html', {'form': form})

def coffee_shops(request):
    shops = CoffeeShop.objects.annotate(
        average_rating=Avg('reviews__rating'),
        review_count=Count('reviews')
    )
    bookmarked_shops = request.user.favorite_shops.all() if request.user.is_authenticated else []
    return render(request, 'home/coffee_shops.html', {
        'shops': shops,
        'bookmarked_shops': bookmarked_shops,
    })

def shop_detail(request, pk):
    shop = get_object_or_404(CoffeeShop, pk=pk)
    user_review = Review.objects.filter(user=request.user, shop=shop).first() if request.user.is_authenticated else None
    other_reviews = shop.reviews.exclude(id=user_review.id) if user_review else shop.reviews.all()
    return render(request, 'home/shop_detail.html', {
        'shop': shop,
        'user_review': user_review,
        'other_reviews': other_reviews.order_by('-created_at')
    })

@login_required
def add_review(request, shop_id):
    shop = get_object_or_404(CoffeeShop, id=shop_id)
    if Review.objects.filter(user=request.user, shop=shop).exists():
        messages.warning(request, "You've already reviewed this coffee shop")
        return redirect('edit_review', review_id=Review.objects.get(user=request.user, shop=shop).id)

    form = ReviewForm(request.POST or None)
    if form.is_valid():
        review = form.save(commit=False)
        review.user = request.user
        review.shop = shop
        review.save()
        return redirect('shop_detail', pk=shop.id)

    return render(request, 'home/add_review.html', {'form': form, 'shop': shop})

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
    return render(request, 'home/edit_review.html', {'form': form, 'review': review})

@login_required
def delete_review(request, review_id):
    review = get_object_or_404(Review, id=review_id, user=request.user)
    if request.method == 'POST':
        redirect_url = 'shop_detail' if review.shop_id else 'account'
        shop_id = review.shop.id if review.shop else None
        review.delete()
        return redirect(redirect_url, pk=shop_id) if shop_id else redirect(redirect_url)
    return render(request, 'home/delete_review.html', {'review': review})

def about(request):
    return render(request, 'home/about.html')

@login_required
def account_view(request):
    user = request.user
    bookmarked_shops = user.favorite_shops.all()
    reviews = Review.objects.filter(user=user).select_related('shop')
    return render(request, 'home/account.html', {
        'bookmarked_shops': bookmarked_shops,
        'reviews': reviews,
    })

@login_required
def toggle_favorite(request, shop_id):
    shop = get_object_or_404(CoffeeShop, id=shop_id)
    if request.user in shop.favorited_by.all():
        shop.favorited_by.remove(request.user)
    else:
        shop.favorited_by.add(request.user)
    return redirect(request.META.get('HTTP_REFERER', 'home'))
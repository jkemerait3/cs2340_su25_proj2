from django.shortcuts import get_object_or_404, render
from django.shortcuts import render
from django.contrib.auth.forms import UserCreationForm
from django.contrib.auth import login
from django.shortcuts import redirect
from .models import CoffeeShop
from .forms import ReviewForm
from .models import Review
from .models import Favorite
from django.contrib.auth.decorators import login_required

def home(request):
    return render(request, 'home/base.html')

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
    shops = CoffeeShop.objects.all()
    liked_ids = []
    if request.user.is_authenticated:
        liked_ids = Favorite.objects.filter(user=request.user).values_list('coffeeshop__id', flat=True)
    return render(request, 'home/coffee_shops.html', {
        'shops': shops,
        'liked_ids': liked_ids
    })

@login_required
def add_review(request, shop_id):
    shop = CoffeeShop.objects.get(id=shop_id)
    if request.method == 'POST':
        form = ReviewForm(request.POST)
        if form.is_valid():
            review = form.save(commit=False)
            review.user = request.user
            review.shop = shop
            review.save()
            return redirect('coffee_shops')
    else:
        form = ReviewForm()
    return render(request, 'home/add_review.html', {'form': form, 'shop': shop})
@login_required
def edit_review(request, review_id):
    review = get_object_or_404(Review, id=review_id, user=request.user)
    if request.method == 'POST':
        form = ReviewForm(request.POST, instance=review)
        if form.is_valid():
            form.save()
            return redirect('coffee_shops')
    else:
        form = ReviewForm(instance=review)
    return render(request, 'home/edit_review.html', {'form': form, 'review': review})

@login_required
def delete_review(request, review_id):
    review = get_object_or_404(Review, id=review_id, user=request.user)
    if request.method == 'POST':
        review.delete()
        return redirect('coffee_shops')
    return render(request, 'home/delete_review.html', {'review': review})

def about(request):
    return render(request, 'home/about.html')

@login_required
def like_coffee_shop(request, id):
    coffee_shop = get_object_or_404(CoffeeShop, id=id)
    existing_like = Favorite.objects.filter(user=request.user, coffeeshop=coffee_shop)
    if existing_like.exists():
        existing_like.delete()
    else:
        Favorite.objects.create(user=request.user, coffeeshop=coffee_shop)
    return redirect('coffee_shops')

@login_required
def liked_coffee_shops(request):
    liked_ids = Favorite.objects.filter(user=request.user).values_list('coffeeshop__id', flat=True)
    liked_shops = CoffeeShop.objects.filter(id__in=liked_ids)

    return render(request, 'home/favorites.html', {
        'shops': liked_shops
    })

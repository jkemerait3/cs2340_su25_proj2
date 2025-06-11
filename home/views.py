from django.shortcuts import get_object_or_404, render
from django.contrib.auth.forms import UserCreationForm
from django.contrib.auth import login
from django.shortcuts import redirect
from .models import CoffeeShop
from .forms import ReviewForm
from .models import Review
from django.contrib.auth.decorators import login_required
from django.contrib.auth.models import User
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
    return render(request, 'home/coffee_shops.html', {'shops': shops})

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
def account_view(request):
    user_reviews = Review.objects.filter(user=request.user).select_related('shop').order_by('-created_at')
    return render(request, 'home/account.html', {'reviews': user_reviews})
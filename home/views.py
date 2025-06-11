from django.shortcuts import render
from django.contrib.auth.forms import UserCreationForm
from django.contrib.auth import login
from django.shortcuts import redirect
from .models import CoffeeShop
from .forms import ReviewForm
from .models import Review
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
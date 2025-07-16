from django import forms
from .models import Review

class ReviewForm(forms.ModelForm):
    class Meta:
        model = Review
        fields = ['content', 'rating']
        widgets = {
            'rating': forms.HiddenInput(),  # will be set by stars
            'content': forms.Textarea(attrs={'rows': 3})
        }
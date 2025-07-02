# main/views.py

from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.forms import AuthenticationForm
from django.shortcuts import render, redirect
from django.contrib import messages
from django.views.decorators.csrf import csrf_protect
from django.views.decorators.cache import never_cache
from django.contrib.auth.decorators import login_required
from django.http import JsonResponse
from django.core.exceptions import ValidationError
from django.contrib.auth.models import User
from main.models import Employees


@csrf_protect
@never_cache
def custom_login(request):
    """Custom login view for Softy ERP"""
    
    # Agar user allaqachon login bo'lsa, dashboard'ga yo'naltirish
    if request.user.is_authenticated:
        return redirect('main:dashboard')
    
    if request.method == 'POST':
        # Form ma'lumotlarini olish
        username = request.POST.get('username', '').strip()
        password = request.POST.get('password', '').strip()

        # Basic validation
        if not username or not password:
            messages.error(request, 'Telefon raqami va parolni kiriting!')
            return render(request, 'main/login.html', {'title': 'Softy ERP - Kirish'})
        
        # Telefon raqamini normalize qilish
        phone_clean = username.replace(' ', '').replace('(', '').replace(')', '').replace('-', '').replace('+', '')
        
        # O'zbek telefon raqami formatini tekshirish
        if not phone_clean.startswith('998') or len(phone_clean) != 12:
            messages.error(request, 'Telefon raqami noto\'g\'ri formatda! (+998XXXXXXXXX)')
            return render(request, 'main/login.html', {'title': 'Softy ERP - Kirish'})
        
        # Authentication
        user = authenticate(request, username=phone_clean, password=password)
        if user is not None:
            if user.is_active:
                login(request, user)
                
                # Employee ma'lumotlarini olish
                try:
                    employee = Employees.objects.get(user=user)
                    full_name = f"{employee.first_name} {employee.last_name or ''}".strip()
                except Employees.DoesNotExist:
                    full_name = user.get_full_name() or user.username
                
                # messages.success(request, f'Xush kelibsiz, {full_name}!')
                
                # Redirect to next page or dashboard
                next_page = request.POST.get('next') or request.GET.get('next')
                return redirect(next_page if next_page else 'main:dashboard')
            else:
                messages.error(request, 'Hisobingiz bloklangan! Administrator bilan bog\'laning.')
        else:
            messages.error(request, 'Telefon raqami yoki parol noto\'g\'ri!')
    
    return render(request, 'main/login.html', {
        'title': 'Softy ERP - Kirish'
    })


@login_required
def custom_logout(request):
    """Custom logout view"""
    user_name = request.user.get_full_name() or request.user.username
    logout(request)
    messages.success(request, f'Siz muvaffaqiyatli tizimdan chiqdingiz!')
    return redirect('main:login')



@csrf_protect
def check_phone_ajax(request):
    """AJAX telefon raqam tekshirish (ixtiyoriy)"""
    if request.method == 'POST':
        phone = request.POST.get('phone', '').strip()
        phone_clean = phone.replace('+', '').replace(' ', '').replace('(', '').replace(')', '').replace('-', '')
        
        if phone_clean.startswith('998') and len(phone_clean) == 12:
            try:
                user = User.objects.get(username=phone_clean)
                return JsonResponse({'valid': True, 'exists': True})
            except User.DoesNotExist:
                return JsonResponse({'valid': True, 'exists': False})
        else:
            return JsonResponse({'valid': False, 'exists': False})
    
    return JsonResponse({'valid': False, 'exists': False})
# main/views.py ga qo'shish
from django.shortcuts import render, get_object_or_404, redirect
from django.contrib.auth.decorators import login_required
from django.contrib import messages
from django.contrib.auth import update_session_auth_hash
from django.contrib.auth.forms import SetPasswordForm
from django.http import JsonResponse
from main.models import Employees
from main.forms import EmployeeEditForm, EmployeeAddForm
from django.contrib.auth.models import User
from django.db import transaction

def admin_required(view_func):
    """Admin huquqi talab qiluvchi decorator"""
    @login_required
    def wrapper(request, *args, **kwargs):
        try:
            employee = Employees.objects.get(user=request.user)
            if employee.position != 'admin':
                messages.error(request, 'Bu sahifaga faqat adminlar kira oladi!')
                return redirect('main:dashboard')
        except Employees.DoesNotExist:
            messages.error(request, 'Employee ma\'lumotlari topilmadi!')
            return redirect('main:dashboard')
        
        return view_func(request, *args, **kwargs)
    return wrapper

@admin_required
def employee_list(request):
    """Barcha xodimlar ro'yxati - faqat admin uchun"""
    
    employees = Employees.objects.select_related('user').all().order_by('-hire_date')
    
    context = {
        'title': 'Xodimlar - Softy ERP',
        'employees': employees,
        'total_employees': employees.count(),
        'active_employees': employees.filter(is_active=True).count(),
        'inactive_employees': employees.filter(is_active=False).count(),
    }
    
    return render(request, 'main/employee.html', context)

@admin_required  
def employee_detail(request, employee_id):
    """Xodim tafsilotlari - faqat admin uchun"""
    
    employee = get_object_or_404(Employees, id=employee_id)
    
    context = {
        'title': f'{employee.first_name} {employee.last_name} - Xodim',
        'employee': employee,
    }
    
    return render(request, 'main/employee_detail.html', context)


@admin_required
def employee_edit(request, employee_id):
    """Xodim ma'lumotlarini tahrirlash - faqat admin uchun"""
    
    employee = get_object_or_404(Employees, id=employee_id)
    
    if request.method == 'POST':
        form = EmployeeEditForm(request.POST, instance=employee)
        if form.is_valid():
            form.save()
            messages.success(request, 'Xodim ma\'lumotlari muvaffaqiyatli yangilandi!')
            return redirect('main:employee_detail', employee_id=employee.id)
        else:
            messages.error(request, 'Ma\'lumotlarda xatolik bor. Iltimos, tekshiring.')
    else:
        form = EmployeeEditForm(instance=employee)
    
    context = {
        'title': f'{employee.first_name} tahrirlash - Softy ERP',
        'employee': employee,
        'form': form,
    }
    
    return render(request, 'main/employee_edit.html', context)

@admin_required
def employee_password_change(request, employee_id):
    """Xodim parolini o'zgartirish - faqat admin uchun"""
    
    employee = get_object_or_404(Employees, id=employee_id)
    user = employee.user
    
    if request.method == 'POST':
        form = SetPasswordForm(user, request.POST)
        if form.is_valid():
            form.save()
            messages.success(request, f'{employee.first_name} ning paroli muvaffaqiyatli o\'zgartirildi!')
            return redirect('main:employee_detail', employee_id=employee.id)
        else:
            messages.error(request, 'Parol o\'zgartirishda xatolik yuz berdi.')
    else:
        form = SetPasswordForm(user)
    
    context = {
        'title': f'{employee.first_name} paroli - Softy ERP',
        'employee': employee,
        'form': form,
    }
    
    return render(request, 'main/employee_password.html', context)



# main/views.py - Complete Employee Add View

@admin_required
def employee_add(request):
    """Yangi xodim qo'shish - faqat admin uchun"""
    
    if request.method == 'POST':
        form = EmployeeAddForm(request.POST)
        
        if form.is_valid():
            try:
                with transaction.atomic():
                    # Form ma'lumotlarini olish
                    phone_number = form.cleaned_data['phone_number']
                    password = form.cleaned_data['password1']
                    first_name = form.cleaned_data['first_name']
                    last_name = form.cleaned_data['last_name']
                    position = form.cleaned_data['position']
                    hire_date = form.cleaned_data['hire_date']
                    is_active = form.cleaned_data['is_active']
                    
                    # User yaratish
                    user = User.objects.create_user(
                        username=phone_number,
                        password=password,  # Django avtomatik hash qiladi
                        first_name=first_name,
                        last_name=last_name,
                        is_active=is_active
                    )
                    
                    # Employee yaratish
                    employee = Employees.objects.create(
                        user=user,
                        first_name=first_name,
                        last_name=last_name,
                        position=position,
                        phone_number=phone_number,
                        hire_date=hire_date,
                        password=password,  # Plain text parol Employee modelida
                        is_active=is_active
                    )
                    
                    # Debug uchun log
                    print(f"Employee yaratildi: {employee.id}")
                    print(f"User yaratildi: {user.id}")
                    print(f"Password Employee modelida: {employee.password}")
                    print(f"Password User modelida: HASHED")
                    
                    messages.success(
                        request, 
                        f'{employee.first_name} {employee.last_name} muvaffaqiyatli qo\'shildi! '
                        f'Telefon: {phone_number}, Parol: {password}'
                    )
                    return redirect('main:employee_detail', employee_id=employee.id)
                    
            except Exception as e:
                print(f"Xatolik: {str(e)}")  # Debug uchun
                messages.error(request, f'Xodim qo\'shishda xatolik: {str(e)}')
        else:
            print("Form xatoliklari:", form.errors)  # Debug uchun
            messages.error(request, 'Ma\'lumotlarda xatolik bor. Iltimos, tekshiring.')
    else:
        form = EmployeeAddForm()
    
    context = {
        'title': 'Yangi xodim qo\'shish - Softy ERP',
        'form': form,
    }
    
    return render(request, 'main/employee_add.html', context)
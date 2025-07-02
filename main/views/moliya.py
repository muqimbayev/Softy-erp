# main/views.py - Finance section

from django.shortcuts import render, get_object_or_404, redirect
from django.contrib.auth.decorators import login_required
from django.contrib import messages
from django.http import JsonResponse
from django.db.models import Q, Sum
from django.core.paginator import Paginator
from django.utils import timezone
from datetime import datetime, timedelta
from decimal import Decimal
import json

from main.models import (
    Expenses, ExpensesCategory, Service, Company, 
    Employees, Income
)
from main.forms import ExpenseForm
def access_required(view_func):
    """Service bo'limiga kirish huquqi decorator"""
    @login_required
    def wrapper(request, *args, **kwargs):
        try:
            employee = Employees.objects.get(user=request.user)
            # Barcha pozitsiyalar ko'ra oladi
            if employee.position in ['accounted', 'admin']:
                return view_func(request, *args, **kwargs)
            else:
                messages.error(request, 'Bu sahifaga kirish huquqingiz yo\'q!')
                return redirect('main:dashboard')
        except Employees.DoesNotExist:
            messages.error(request, 'Employee ma\'lumotlari topilmadi!')
            return redirect('main:dashboard')
    return wrapper

@access_required
@login_required
def expenses_list(request):
    """Xarajatlar ro'yxati"""
    expenses = Expenses.objects.select_related(
        'category', 'service', 'employee', 'created_by'
    ).all()
    
    # Filtrlash
    category_filter = request.GET.get('category')
    expense_type = request.GET.get('type')  # monthly, service, company
    date_from = request.GET.get('date_from')
    date_to = request.GET.get('date_to')
    search = request.GET.get('search')
    
    if category_filter:
        expenses = expenses.filter(category_id=category_filter)
    
    if expense_type:
        if expense_type == 'monthly':
            expenses = expenses.filter(service__isnull=True, employee__isnull=False)
        elif expense_type == 'service':
            expenses = expenses.filter(service__isnull=False)
        elif expense_type == 'company':
            expenses = expenses.filter(service__isnull=True, employee__isnull=True)
    
    if date_from:
        expenses = expenses.filter(date__gte=date_from)
    
    if date_to:
        expenses = expenses.filter(date__lte=date_to)
    
    if search:
        expenses = expenses.filter(
            Q(title__icontains=search) |
            Q(notes__icontains=search) |
            Q(employee__first_name__icontains=search) |
            Q(service__name__icontains=search)
        )
    
    # Pagination
    paginator = Paginator(expenses, 20)
    page_number = request.GET.get('page')
    page_obj = paginator.get_page(page_number)
    
    # Statistika
    total_amount = expenses.aggregate(Sum('amount'))['amount__sum'] or 0
    
    context = {
        'page_obj': page_obj,
        'categories': ExpensesCategory.objects.filter(is_active=True),
        'total_amount': total_amount,
        'filters': {
            'category': category_filter,
            'type': expense_type,
            'date_from': date_from,
            'date_to': date_to,
            'search': search,
        }
    }
    
    return render(request, 'finance/expenses_list.html', context)

@access_required
@login_required
def expense_create(request):
    """Xarajat qo'shish"""
    if request.method == 'POST':
        form = ExpenseForm(request.POST)
        if form.is_valid():
            expense = form.save(commit=False)
            expense.created_by = request.user.employees
            
            # Kategoriya bo'yicha soliq qo'shish
            category = expense.category
            if category.tax_rate > 0:
                tax_amount = expense.amount * Decimal(category.tax_rate) / 100
                expense.amount += tax_amount
            
            expense.save()
            messages.success(request, 'Xarajat muvaffaqiyatli qo\'shildi!')
            return redirect('main:expenses_list')
    else:
        form = ExpenseForm()
    
    context = {
        'form': form,
        'categories': ExpensesCategory.objects.filter(is_active=True),
        'employees': Employees.objects.filter(is_active=True),
        'services': Service.objects.filter(is_active=True),
    }
    
    return render(request, 'finance/expense_form.html', context)


# views.py - expense_detail funksiyasini yangilang
from decimal import Decimal
@access_required
@login_required
def expense_detail(request, pk):
    """Xarajat tafsilotlari"""
    expense = get_object_or_404(Expenses, pk=pk)
    
    # Soliq hisoblash
    base_amount = None
    tax_amount = None
    
    if expense.category.tax_rate > 0:
        # Agar soliq qo'shilgan bo'lsa, bazaviy summani hisoblash
        tax_rate_decimal = Decimal(str(expense.category.tax_rate))
        base_amount = expense.amount / (Decimal('1') + tax_rate_decimal / Decimal('100'))
        tax_amount = expense.amount - base_amount
    
    context = {
        'expense': expense,
        'base_amount': base_amount,
        'tax_amount': tax_amount,
    }
    
    return render(request, 'finance/expense_detail.html', context)

@access_required
@login_required
def expense_edit(request, pk):
    """Xarajatni tahrirlash"""
    expense = get_object_or_404(Expenses, pk=pk)
    
    if request.method == 'POST':
        form = ExpenseForm(request.POST, instance=expense)
        if form.is_valid():
            expense = form.save(commit=False)
            
            # Kategoriya bo'yicha soliq qo'shish
            category = expense.category
            if category.tax_rate > 0:
                base_amount = expense.amount / (1 + Decimal(category.tax_rate) / 100)
                tax_amount = base_amount * Decimal(category.tax_rate) / 100
                expense.amount = base_amount + tax_amount
            
            expense.save()
            messages.success(request, 'Xarajat muvaffaqiyatli yangilandi!')
            return redirect('main:expense_detail', pk=expense.pk)
    else:
        form = ExpenseForm(instance=expense)
    
    context = {
        'form': form,
        'expense': expense,
        'categories': ExpensesCategory.objects.filter(is_active=True),
    }
    
    return render(request, 'finance/expense_form.html', context)

@access_required
@login_required
def expense_delete(request, pk):
    """Xarajatni o'chirish"""
    expense = get_object_or_404(Expenses, pk=pk)
    
    if request.method == 'POST':
        expense.delete()
        messages.success(request, 'Xarajat muvaffaqiyatli o\'chirildi!')
        return redirect('main:expenses_list')
    
    context = {
        'expense': expense,
    }
    
    return render(request, 'finance/expense_confirm_delete.html', context)


@access_required
@login_required
def get_category_tax(request):
    """Kategoriya soliq stavkasini olish"""
    category_id = request.GET.get('category_id')
    if category_id:
        try:
            category = ExpensesCategory.objects.get(id=category_id)
            return JsonResponse({
                'tax_rate': category.tax_rate,
                'name': category.name
            })
        except ExpensesCategory.DoesNotExist:
            pass
    
    return JsonResponse({'tax_rate': 0})

@access_required
@login_required
def search_employees(request):
    """Xodimlar qidirish"""
    query = request.GET.get('q', '')
    employees = Employees.objects.filter(
        Q(first_name__icontains=query) |
        Q(last_name__icontains=query),
        is_active=True
    )[:10]
    
    results = [
        {
            'id': emp.id,
            'text': f"{emp.first_name} {emp.last_name or ''}".strip(),
            'phone': emp.phone_number
        }
        for emp in employees
    ]
    
    return JsonResponse({'results': results})

@access_required
@login_required
def search_services(request):
    """Xizmatlar qidirish"""
    query = request.GET.get('q', '')
    services = Service.objects.filter(
        Q(name__icontains=query) |
        Q(company__name__icontains=query),
        is_active=True
    ).select_related('company')[:10]
    
    results = [
        {
            'id': service.id,
            'text': f"{service.name} - {service.company.name}",
            'company': service.company.name
        }
        for service in services
    ]
    
    return JsonResponse({'results': results})


# Kategoriya boshqaruvi - mavjud category_mng.py dan foydalaniladi



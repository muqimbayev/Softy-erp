# views.py - Expenses Category Management Views
from django.shortcuts import render, redirect, get_object_or_404
from django.contrib.auth.decorators import login_required, user_passes_test
from django.contrib import messages
from django.http import JsonResponse
from django.core.paginator import Paginator
from django.db.models import Q, Count, Sum
from django.urls import reverse
from main.models import ExpensesCategory, Expenses
from main.forms import ExpensesCategoryForm


def has_accounting_access(user):
    """Accounting yoki admin huquqini tekshirish"""
    if hasattr(user, 'employees'):
        return user.employees.position in ['admin', 'accounted']
    return user.is_staff or user.is_superuser


@login_required
@user_passes_test(has_accounting_access)
def expenses_category_list(request):
    """Xarajat kategoriyalari ro'yxati"""
    search = request.GET.get('search', '')
    is_active = request.GET.get('is_active', '')
    
    categories = ExpensesCategory.objects.all()
    
    # Filtrlash
    if search:
        categories = categories.filter(
            Q(name__icontains=search) |
            Q(notes__icontains=search)
        )
    
    if is_active:
        categories = categories.filter(is_active=is_active == 'true')
    
    # Har bir kategoriya uchun xarajatlar sonini hisoblash
    categories = categories.annotate(
        expenses_count=Count('expenses'),
        total_amount=Sum('expenses__amount')
    ).order_by('-is_active', 'name')
    
    # Pagination
    paginator = Paginator(categories, 15)
    page_number = request.GET.get('page')
    page_obj = paginator.get_page(page_number)
    
    # Statistikalar
    total_categories = ExpensesCategory.objects.count()
    active_categories = ExpensesCategory.objects.filter(is_active=True).count()
    inactive_categories = total_categories - active_categories
    
    context = {
        'title': 'Xarajat Kategoriyalari',
        'page_obj': page_obj,
        'search': search,
        'is_active': is_active,
        'total_categories': total_categories,
        'active_categories': active_categories,
        'inactive_categories': inactive_categories,
        'page': 'expenses_categories'
    }
    return render(request, 'main/list.html', context)


@login_required
@user_passes_test(has_accounting_access)
def expenses_category_create(request):
    """Yangi xarajat kategoriyasi yaratish"""
    if request.method == 'POST':
        form = ExpensesCategoryForm(request.POST)
        if form.is_valid():
            category = form.save()
            messages.success(request, f'"{category.name}" kategoriyasi muvaffaqiyatli yaratildi!')
            return redirect('expenses_category:list')
        else:
            messages.error(request, 'Formada xatoliklar mavjud!')
    else:
        form = ExpensesCategoryForm()
    
    context = {
        'title': 'Yangi Xarajat Kategoriyasi',
        'form': form,
        'page': 'expenses_categories'
    }
    return render(request, 'main/form.html', context)


@login_required
@user_passes_test(has_accounting_access)
def expenses_category_edit(request, pk):
    """Xarajat kategoriyasini tahrirlash"""
    category = get_object_or_404(ExpensesCategory, pk=pk)
    
    if request.method == 'POST':
        form = ExpensesCategoryForm(request.POST, instance=category)
        if form.is_valid():
            category = form.save()
            messages.success(request, f'"{category.name}" kategoriyasi muvaffaqiyatli yangilandi!')
            return redirect('main:category_list')
        else:
            messages.error(request, 'Formada xatoliklar mavjud!')
    else:
        form = ExpensesCategoryForm(instance=category)
    
    context = {
        'title': f'"{category.name}" Kategoriyasini Tahrirlash',
        'form': form,
        'category': category,
        'page': 'expenses_categories'
    }
    return render(request, 'main/form.html', context)


@login_required
@user_passes_test(has_accounting_access)
def expenses_category_detail(request, pk):
    """Xarajat kategoriyasi tafsilotlari"""
    category = get_object_or_404(ExpensesCategory, pk=pk)
    
    # Kategoriya bo'yicha xarajatlar
    expenses = Expenses.objects.filter(category=category).select_related(
        'service', 'service__company', 'employee'
    ).order_by('-date')
    
    # Pagination for expenses
    paginator = Paginator(expenses, 10)
    page_number = request.GET.get('page')
    expenses_page = paginator.get_page(page_number)
    
    # Statistikalar
    total_expenses = expenses.count()
    total_amount = expenses.aggregate(total=Sum('amount'))['total'] or 0
    
    # Oylik statistika (so'nggi 6 oy)
    from datetime import datetime, timedelta
    from django.db.models.functions import TruncMonth
    
    six_months_ago = datetime.now() - timedelta(days=180)
    monthly_stats = expenses.filter(
        date__gte=six_months_ago
    ).annotate(
        month=TruncMonth('date')
    ).values('month').annotate(
        count=Count('id'),
        total=Sum('amount')
    ).order_by('month')
    
    context = {
        'title': f'"{category.name}" Kategoriyasi',
        'category': category,
        'expenses_page': expenses_page,
        'total_expenses': total_expenses,
        'total_amount': total_amount,
        'monthly_stats': monthly_stats,
        'page': 'expenses_categories'
    }
    return render(request, 'expenses_category/detail.html', context)


@login_required
@user_passes_test(has_accounting_access)
def expenses_category_delete(request, pk):
    """Xarajat kategoriyasini o'chirish"""
    category = get_object_or_404(ExpensesCategory, pk=pk)
    
    # Kategoriya bo'yicha xarajatlar sonini tekshirish
    expenses_count = category.expenses.count()
    
    if request.method == 'POST':
        if expenses_count > 0:
            messages.error(request, 
                f'"{category.name}" kategoriyasini o\'chirish mumkin emas! '
                f'Bu kategoriyada {expenses_count} ta xarajat mavjud.'
            )
            return redirect('expenses_category:detail', pk=pk)
        
        category_name = category.name
        category.delete()
        messages.success(request, f'"{category_name}" kategoriyasi muvaffaqiyatli o\'chirildi!')
        return redirect('expenses_category:list')
    
    context = {
        'title': f'"{category.name}" Kategoriyasini O\'chirish',
        'category': category,
        'expenses_count': expenses_count,
        'page': 'expenses_categories'
    }
    return render(request, 'expenses_category/delete.html', context)


@login_required
@user_passes_test(has_accounting_access)
def expenses_category_toggle_status(request, pk):
    """Kategoriya holatini o'zgartirish (faol/nofaol)"""
    if request.method == 'POST':
        category = get_object_or_404(ExpensesCategory, pk=pk)
        category.is_active = not category.is_active
        category.save()
        
        status = "faollashtirildi" if category.is_active else "nofaollashtirildi"
        messages.success(request, f'"{category.name}" kategoriyasi {status}!')
        
        return JsonResponse({
            'success': True,
            'is_active': category.is_active,
            'message': f'Kategoriya {status}'
        })
    
    return JsonResponse({'success': False, 'message': 'Noto\'g\'ri so\'rov'})


@login_required
@user_passes_test(has_accounting_access)
def expenses_category_stats(request):
    """Xarajat kategoriyalari statistikasi"""
    from django.db.models.functions import TruncMonth
    from datetime import datetime, timedelta
    
    # Asosiy statistikalar
    total_categories = ExpensesCategory.objects.count()
    active_categories = ExpensesCategory.objects.filter(is_active=True).count()
    
    # Top kategoriyalar (xarajat miqdori bo'yicha)
    top_categories = ExpensesCategory.objects.annotate(
        expenses_count=Count('expenses'),
        total_amount=Sum('expenses__amount')
    ).filter(
        total_amount__isnull=False
    ).order_by('-total_amount')[:10]
    
    # Oylik statistika
    twelve_months_ago = datetime.now() - timedelta(days=365)
    monthly_data = Expenses.objects.filter(
        date__gte=twelve_months_ago
    ).annotate(
        month=TruncMonth('date')
    ).values('month', 'category__name').annotate(
        count=Count('id'),
        total=Sum('amount')
    ).order_by('month')
    
    # So'nggi qo'shilgan kategoriyalar
    recent_categories = ExpensesCategory.objects.order_by('-created_date')[:5]
    
    context = {
        'title': 'Xarajat Kategoriyalari Statistikasi',
        'total_categories': total_categories,
        'active_categories': active_categories,
        'inactive_categories': total_categories - active_categories,
        'top_categories': top_categories,
        'monthly_data': monthly_data,
        'recent_categories': recent_categories,
        'page': 'expenses_categories'
    }
    return render(request, 'expenses_category/stats.html', context)


@login_required
@user_passes_test(has_accounting_access)
def expenses_category_export(request):
    """Kategoriyalarni CSV formatida eksport qilish"""
    import csv
    from django.http import HttpResponse
    
    response = HttpResponse(content_type='text/csv')
    response['Content-Disposition'] = 'attachment; filename="xarajat_kategoriyalari.csv"'
    
    writer = csv.writer(response)
    writer.writerow([
        'Nomi', 'Soliq foizi', 'Holat', 'Xarajatlar soni', 
        'Umumiy miqdor', 'Yaratilgan sana', 'Izoh'
    ])
    
    categories = ExpensesCategory.objects.annotate(
        expenses_count=Count('expenses'),
        total_amount=Sum('expenses__amount')
    ).order_by('name')
    
    for category in categories:
        writer.writerow([
            category.name,
            f"{category.tax_rate}%",
            "Faol" if category.is_active else "Nofaol",
            category.expenses_count or 0,
            category.total_amount or 0,
            category.created_date.strftime('%d.%m.%Y'),
            category.notes or ''
        ])
    
    return response
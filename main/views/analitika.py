# views.py - Complete Analytics Views
from django.shortcuts import render
from django.contrib.auth.decorators import login_required
from django.http import JsonResponse, HttpResponse
from django.db.models import Sum, Count, Q, Avg
from django.db.models.functions import TruncMonth, TruncYear
from datetime import datetime, timedelta
from decimal import Decimal
from django.contrib import messages
import csv
from django.shortcuts import render, get_object_or_404, redirect
from main.models import (
    Service, Income, Expenses, Company, Employees, 
    ServiceStatus, ExpensesCategory
)
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
def analytics_dashboard(request):
    """Asosiy analitika sahifasi"""
    context = {
        'title': 'Analitika Dashboard',
        'page': 'analytics'
    }
    return render(request, 'main/analitika.html', context)


@login_required
def get_dashboard_stats(request):
    """Dashboard uchun asosiy statistikalar"""
    # Asosiy ko'rsatkichlar
    total_companies = Company.objects.count()
    total_services = Service.objects.count()
    active_services = Service.objects.filter(is_active=True).count()
    total_employees = Employees.objects.filter(is_active=True).count()
    
    # Moliyaviy ko'rsatkichlar
    total_income = Income.objects.filter(status='received').aggregate(
        total=Sum('amount'))['total'] or Decimal('0')
    
    total_expenses = Expenses.objects.aggregate(
        total=Sum('amount'))['total'] or Decimal('0')
    
    profit = total_income - total_expenses
    
    # Bu oyning statistikasi
    current_month = datetime.now().replace(day=1)
    monthly_income = Income.objects.filter(
        status='received',
        payment_date__gte=current_month
    ).aggregate(total=Sum('amount'))['total'] or Decimal('0')
    
    monthly_expenses = Expenses.objects.filter(
        date__gte=current_month
    ).aggregate(total=Sum('amount'))['total'] or Decimal('0')
    
    # Tender statistikasi
    tender_stats = Service.objects.values('tender_status').annotate(
        count=Count('id')
    )
    
    # Xizmat turlari statistikasi
    service_types = Service.objects.values('type').annotate(
        count=Count('id'),
        total_amount=Sum('contract_amount')
    )
    
    data = {
        'basic_stats': {
            'total_companies': total_companies,
            'total_services': total_services,
            'active_services': active_services,
            'total_employees': total_employees,
        },
        'financial_stats': {
            'total_income': float(total_income),
            'total_expenses': float(total_expenses),
            'profit': float(profit),
            'monthly_income': float(monthly_income),
            'monthly_expenses': float(monthly_expenses),
            'monthly_profit': float(monthly_income - monthly_expenses),
        },
        'tender_stats': list(tender_stats),
        'service_types': list(service_types),
    }
    
    return JsonResponse(data)


@login_required
def get_monthly_chart_data(request):
    """Oylik grafik ma'lumotlari"""
    # So'nggi 12 oy
    end_date = datetime.now()
    start_date = end_date - timedelta(days=365)
    
    # Oylik daromadlar
    monthly_income = Income.objects.filter(
        status='received',
        payment_date__gte=start_date
    ).annotate(
        month=TruncMonth('payment_date')
    ).values('month').annotate(
        total=Sum('amount')
    ).order_by('month')
    
    # Oylik xarajatlar
    monthly_expenses = Expenses.objects.filter(
        date__gte=start_date
    ).annotate(
        month=TruncMonth('date')
    ).values('month').annotate(
        total=Sum('amount')
    ).order_by('month')
    
    # Ma'lumotlarni formatlash
    income_data = {item['month'].strftime('%Y-%m'): float(item['total'] or 0) 
                   for item in monthly_income}
    expense_data = {item['month'].strftime('%Y-%m'): float(item['total'] or 0) 
                    for item in monthly_expenses}
    
    # 12 oylik ma'lumotlar
    months = []
    incomes = []
    expenses = []
    profits = []
    
    for i in range(12):
        month_date = (end_date - timedelta(days=30*i)).replace(day=1)
        month_key = month_date.strftime('%Y-%m')
        month_name = month_date.strftime('%b %Y')
        
        income = income_data.get(month_key, 0)
        expense = expense_data.get(month_key, 0)
        profit = income - expense
        
        months.insert(0, month_name)
        incomes.insert(0, income)
        expenses.insert(0, expense)
        profits.insert(0, profit)
    
    return JsonResponse({
        'months': months,
        'income': incomes,
        'expenses': expenses,
        'profit': profits
    })


@login_required
def get_tender_status_chart(request):
    """Tender holati grafigi"""
    tender_data = Service.objects.values('tender_status').annotate(
        count=Count('id'),
        total_amount=Sum('contract_amount')
    ).order_by('-count')
    
    labels = []
    data = []
    colors = {
        'won': '#28a745',           # green - yutgan
        'lost': '#dc3545',          # red - yutqazgan
        'canceled': '#6c757d',      # gray - bekor qilingan
        'not_participating': '#ffc107',  # yellow - qatnashmagan
    }
    
    chart_colors = []
    amounts = []
    
    for item in tender_data:
        status = item['tender_status']
        # Choice'dan display nomini olish
        display_name = dict(Service.TENDER_CHOICES).get(status, status)
        labels.append(display_name)
        data.append(item['count'])
        amounts.append(float(item['total_amount'] or 0))
        chart_colors.append(colors.get(status, '#6b7280'))
    
    return JsonResponse({
        'labels': labels,
        'data': data,
        'colors': chart_colors,
        'amounts': amounts
    })


@login_required
def get_service_type_chart(request):
    """Xizmat turlari grafigi"""
    type_data = Service.objects.values('type').annotate(
        count=Count('id'),
        total_amount=Sum('contract_amount'),
        avg_amount=Avg('contract_amount')
    ).order_by('-count')
    
    labels = []
    data = []
    amounts = []
    colors = ['#714b67', '#17a2b8', '#28a745', '#ffc107', '#dc3545']
    
    for i, item in enumerate(type_data):
        type_name = item['type']
        # Choice'dan display nomini olish
        display_name = dict(Service.TYPE_CHOICES).get(type_name, type_name)
        labels.append(display_name)
        data.append(item['count'])
        amounts.append(float(item['total_amount'] or 0))
    
    return JsonResponse({
        'labels': labels,
        'data': data,
        'colors': colors[:len(labels)],
        'amounts': amounts
    })


@login_required
def get_tender_success_rate(request):
    """Tender muvaffaqiyat ko'rsatkichi"""
    total_tenders = Service.objects.exclude(tender_status='not_participating').count()
    won_tenders = Service.objects.filter(tender_status='won').count()
    
    success_rate = (won_tenders / total_tenders * 100) if total_tenders > 0 else 0
    
    # Oylik tender statistikasi
    monthly_tenders = Service.objects.filter(
        started_date__isnull=False,
        started_date__gte=datetime.now() - timedelta(days=365)
    ).annotate(
        month=TruncMonth('started_date')
    ).values('month', 'tender_status').annotate(
        count=Count('id')
    ).order_by('month')
    
    # Ma'lumotlarni formatlash
    months_data = {}
    for item in monthly_tenders:
        month_key = item['month'].strftime('%Y-%m')
        if month_key not in months_data:
            months_data[month_key] = {'won': 0, 'lost': 0, 'canceled': 0, 'total': 0}
        
        status = item['tender_status']
        if status != 'not_participating':
            months_data[month_key][status] = item['count']
            months_data[month_key]['total'] += item['count']
    
    # Success rate hisoblash
    months = []
    success_rates = []
    won_counts = []
    total_counts = []
    
    for month_key in sorted(months_data.keys())[-12:]:  # So'nggi 12 oy
        month_data = months_data[month_key]
        month_obj = datetime.strptime(month_key, '%Y-%m')
        
        months.append(month_obj.strftime('%b %Y'))
        won_counts.append(month_data['won'])
        total_counts.append(month_data['total'])
        
        rate = (month_data['won'] / month_data['total'] * 100) if month_data['total'] > 0 else 0
        success_rates.append(round(rate, 1))
    
    return JsonResponse({
        'overall_success_rate': round(success_rate, 1),
        'total_tenders': total_tenders,
        'won_tenders': won_tenders,
        'monthly_data': {
            'months': months,
            'success_rates': success_rates,
            'won_counts': won_counts,
            'total_counts': total_counts
        }
    })


@login_required
def get_service_status_chart(request):
    """Xizmat holati grafigi"""
    status_data = ServiceStatus.objects.values('service_status').annotate(
        count=Count('service', distinct=True)
    )
    
    labels = []
    data = []
    colors = {
        'expected': '#fbbf24',      # amber
        'preparing': '#3b82f6',     # blue
        'delivering': '#f59e0b',    # yellow
        'submitted': '#10b981',     # green
    }
    
    chart_colors = []
    
    for item in status_data:
        status = item['service_status']
        labels.append(dict(ServiceStatus.SERVICE_STATUS_CHOICES)[status])
        data.append(item['count'])
        chart_colors.append(colors.get(status, '#6b7280'))
    
    return JsonResponse({
        'labels': labels,
        'data': data,
        'colors': chart_colors
    })


@login_required
def get_expenses_by_category(request):
    """Kategoriya bo'yicha xarajatlar"""
    category_data = Expenses.objects.values(
        'category__name'
    ).annotate(
        total=Sum('amount'),
        count=Count('id')
    ).order_by('-total')[:10]  # Top 10 kategoriya
    
    labels = [item['category__name'] for item in category_data]
    data = [float(item['total']) for item in category_data]
    
    return JsonResponse({
        'labels': labels,
        'data': data
    })


@login_required
def get_top_companies(request):
    """Eng ko'p daromad keltirgan kompaniyalar"""
    companies = Company.objects.annotate(
        total_income=Sum('incomes__amount', 
                        filter=Q(incomes__status='received')),
        service_count=Count('services')
    ).filter(
        total_income__isnull=False
    ).order_by('-total_income')[:10]
    
    data = []
    for company in companies:
        data.append({
            'name': company.name,
            'total_income': float(company.total_income or 0),
            'service_count': company.service_count,
            'phone': company.phone_number or '',
        })
    
    return JsonResponse({'companies': data})


from django.db.models import Count, Sum, Q

@login_required
def get_employee_performance(request):
    """Xodimlar samaradorligi"""
    employees = Employees.objects.filter(is_active=True).annotate(
        created_services_count=Count('created_services', distinct=True),
        created_expenses_total=Sum('created_expenses__amount', distinct=True),
        managed_income_total=Sum(
            'created_incomes__amount',
            filter=Q(created_incomes__status='received'),
            distinct=True
        )
    )
    
    data = []
    for emp in employees:
        data.append({
            'name': f"{emp.first_name} {emp.last_name or ''}".strip(),
            'position': emp.get_position_display(),
            'services_created': emp.created_services_count or 0,
            'expenses_managed': float(emp.created_expenses_total or 0),
            'income_managed': float(emp.managed_income_total or 0),
        })
    
    return JsonResponse({'employees': data})
from django.db.models import Count, Sum, Q

@login_required
def get_employee_performance(request):
    """Xodimlar samaradorligi"""
    employees = Employees.objects.filter(is_active=True).annotate(
        created_services_count=Count('created_services', distinct=True),
        created_expenses_total=Sum('created_expenses__amount', distinct=True),
        managed_income_total=Sum(
            'created_incomes__amount',
            filter=Q(created_incomes__status='received'),
            distinct=True
        )
    )
    
    data = []
    for emp in employees:
        data.append({
            'name': f"{emp.first_name} {emp.last_name or ''}".strip(),
            'position': emp.get_position_display(),
            'services_created': emp.created_services_count or 0,
            'expenses_managed': float(emp.created_expenses_total or 0),
            'income_managed': float(emp.managed_income_total or 0),
        })
    
    return JsonResponse({'employees': data})

@login_required
def export_analytics_data(request):
    """Analitika ma'lumotlarini eksport qilish"""
    response = HttpResponse(content_type='text/csv')
    response['Content-Disposition'] = 'attachment; filename="analytics_report.csv"'
    
    writer = csv.writer(response)
    
    # Sarlavhalar
    writer.writerow(['Kompaniya', 'Xizmatlar soni', 'Umumiy daromad', 'Telefon'])
    
    # Ma'lumotlar
    companies = Company.objects.annotate(
        total_income=Sum('incomes__amount', 
                        filter=Q(incomes__status='received')),
        service_count=Count('services')
    ).order_by('-total_income')
    
    for company in companies:
        writer.writerow([
            company.name,
            company.service_count or 0,
            float(company.total_income or 0),
            company.phone_number or ''
        ])
    
    return response


@login_required
def financial_report(request):
    """Moliyaviy hisobot sahifasi"""
    start_date = request.GET.get('start_date')
    end_date = request.GET.get('end_date')
    
    # Filtrlash
    income_filter = Q()
    expense_filter = Q()
    
    if start_date:
        income_filter &= Q(payment_date__gte=start_date)
        expense_filter &= Q(date__gte=start_date)
    
    if end_date:
        income_filter &= Q(payment_date__lte=end_date)
        expense_filter &= Q(date__lte=end_date)
    
    # Statistikalar
    incomes = Income.objects.filter(income_filter, status='received')
    expenses = Expenses.objects.filter(expense_filter)
    
    total_income = incomes.aggregate(total=Sum('amount'))['total'] or Decimal('0')
    total_expenses = expenses.aggregate(total=Sum('amount'))['total'] or Decimal('0')
    
    # Foizlarni hisoblash
    profit = total_income - total_expenses
    profit_margin = round((profit / total_income * 100), 1) if total_income > 0 else 0
    expense_ratio = round((total_expenses / total_income * 100), 1) if total_income > 0 else 100
    
    # Status text
    status_text = "Foydali" if profit >= 0 else "Zarar"
    status_class = "amount-positive" if profit >= 0 else "amount-negative"
    status_icon = "fas fa-check-circle" if profit >= 0 else "fas fa-exclamation-triangle"
    
    # Period text
    if start_date and end_date:
        start_obj = datetime.strptime(start_date, '%Y-%m-%d')
        end_obj = datetime.strptime(end_date, '%Y-%m-%d')
        period_text = f"{start_obj.strftime('%d.%m.%Y')} - {end_obj.strftime('%d.%m.%Y')}"
    else:
        period_text = "Barcha vaqt"
    
    # Summalarni formatlash
    total_income_formatted = f"{total_income:,.0f}"
    total_expenses_formatted = f"{total_expenses:,.0f}"
    profit_formatted = f"{profit:,.0f}"
    
    context = {
        'title': 'Moliyaviy hisobot',
        'total_income': total_income,
        'total_expenses': total_expenses,
        'profit': profit,
        'total_income_formatted': total_income_formatted,
        'total_expenses_formatted': total_expenses_formatted,
        'profit_formatted': profit_formatted,
        'profit_margin': profit_margin,
        'expense_ratio': expense_ratio,
        'status_text': status_text,
        'status_class': status_class,
        'status_icon': status_icon,
        'period_text': period_text,
        'start_date': start_date,
        'end_date': end_date,
        'recent_incomes': incomes.order_by('-payment_date')[:10],
        'recent_expenses': expenses.order_by('-date')[:10],
    }
    
    return render(request, 'main/financial_report.html', context)
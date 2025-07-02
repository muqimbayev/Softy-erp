# main/views.py - Updated with safe dashboard

from django.contrib.auth import authenticate, login, logout
from django.shortcuts import render, redirect
from django.contrib import messages
from django.views.decorators.csrf import csrf_protect
from django.views.decorators.cache import never_cache
from django.contrib.auth.decorators import login_required
from django.http import JsonResponse
from django.db.models import Sum, Count, Q
from django.utils import timezone
from datetime import datetime, timedelta
from main.models import Employees

# Import optional models with safety
try:
    from main.models import Company, Service, Income, Expenses
    MODELS_AVAILABLE = True
except ImportError:
    MODELS_AVAILABLE = False
    print("⚠️ Ba'zi modellar mavjud emas. Dashboard demo rejimida ishlaydi.")



@login_required
def dashboard(request):
    """Main dashboard - role-based"""
    try:
        employee = Employees.objects.get(user=request.user)
    except Employees.DoesNotExist:
        employee = None
        messages.warning(request, 'Employee ma\'lumotlari topilmadi!')
    
    # Check user role and redirect if needed
    if employee and employee.position == 'admin':
        return admin_dashboard(request, employee)
    elif employee and employee.position == 'accounted':
        return accountant_dashboard(request, employee)
    else:
        return employee_dashboard(request, employee)

def admin_dashboard(request, employee):
    """Rahbar dashboard - full access"""
    
    # Get dashboard statistics
    stats = get_dashboard_stats()
    
    # Recent activities - to'g'ri tartib
    recent_services = []
    upcoming_deadlines = []
    
    # Service modelini tekshirish va to'g'ri ma'lumot olish
    try:
        # Avval filter, keyin slice
        recent_services = Service.objects.select_related(
            'company', 'created_by'
        ).order_by('-created_at')[:5]
        
        # Upcoming deadlines
        upcoming_deadlines = Service.objects.filter(
            end_date__gte=timezone.now().date(),
            end_date__lte=timezone.now().date() + timedelta(days=30),
            is_active=True
        ).order_by('end_date')[:10]
        
    except Exception as e:
        # Service model mavjud bo'lmasa, bo'sh ro'yxat
        print(f"Service model xatosi: {e}")
        recent_services = []
        upcoming_deadlines = []
    
    context = {
        'user': request.user,
        'employee': employee,
        'title': 'Rahbar Dashboard - Softy ERP',
        'stats': stats,
        'recent_services': recent_services,
        'upcoming_deadlines': upcoming_deadlines,
        'is_admin': True,
        'dashboard_type': 'admin'
    }
    
    # Bitta template ishlatish
    return render(request, 'main/dashboard.html', context)


def accountant_dashboard(request, employee):
    """Bugalter dashboard - financial focus"""
    
    # Financial statistics - xavfsiz
    stats = get_financial_stats()
    
    # Recent data - models mavjudligini tekshirish
    recent_incomes = []
    recent_expenses = []
    
    if MODELS_AVAILABLE:
        try:
            recent_incomes = Income.objects.select_related(
                'company', 'service'
            ).order_by('-payment_date')[:5]
            
            recent_expenses = Expenses.objects.select_related(
                'service', 'employee', 'category'
            ).order_by('-date')[:5]
        except Exception as e:
            print(f"Bugalter dashboard xatosi: {e}")
    
    context = {
        'user': request.user,
        'employee': employee,
        'title': 'Bugalter Dashboard - Softy ERP',
        'stats': stats,
        'recent_incomes': recent_incomes,
        'recent_expenses': recent_expenses,
        'is_accountant': True,
        'dashboard_type': 'accountant'
    }
    
    # Bitta template ishlatish
    return render(request, 'main/dashboard.html', context)


def employee_dashboard(request, employee):
    """Xodim dashboard - limited access"""
    
    # Employee's data - xavfsiz
    employee_services = []
    employee_stats = {
        'my_services': 0,
        'completed_services': 0,
        'pending_services': 0,
    }
    print("Salom")
    
    if MODELS_AVAILABLE and employee:
        try:
            # Avval slice siz QuerySet yarating
            employee_services_qs = Service.objects.filter(
                Q(created_by=employee)
            ).order_by('-created_at')
            print(employee_services_qs)
            print("Xayir")
            # Employee's stats - slice siz QuerySet dan
            employee_stats = {
                'my_services': employee_services_qs.count(),
                'completed_services': employee_services_qs.filter(tender_status='won').count(),
                'pending_services': employee_services_qs.filter(is_active=True).count(),
            }
            
            # Ko'rsatish uchun slice oling (eng oxirida)
            employee_services = employee_services_qs[:10]
            
        except Exception as e:
            print(f"Employee dashboard xatosi: {e}")
    
    context = {
        'user': request.user,
        'employee': employee,
        'title': 'Xodim Dashboard - Softy ERP',
        'stats': employee_stats,
        'my_services': employee_services,
        'is_employee': True,
        'dashboard_type': 'employee'
    }
    
    # Bitta template ishlatish
    return render(request, 'main/dashboard.html', context)

def get_dashboard_stats():
    """Get main dashboard statistics"""
    
    # Current month
    current_month = timezone.now().replace(day=1)
    last_month = (current_month - timedelta(days=1)).replace(day=1)
    
    # Model mavjudligini tekshirish va xavfsiz ma'lumot olish
    try:
        # Total income
        total_income = Income.objects.filter(status='received').aggregate(
            total=Sum('amount')
        )['total'] or 0
    except:
        total_income = 0
    
    try:
        # Monthly income
        monthly_income = Income.objects.filter(
            payment_date__gte=current_month,
            status='received'
        ).aggregate(total=Sum('amount'))['total'] or 0
        
        last_month_income = Income.objects.filter(
            payment_date__gte=last_month,
            payment_date__lt=current_month,
            status='received'
        ).aggregate(total=Sum('amount'))['total'] or 0
    except:
        monthly_income = 0
        last_month_income = 0
    
    # Income growth
    income_growth = 0
    if last_month_income > 0:
        income_growth = ((monthly_income - last_month_income) / last_month_income) * 100
    
    try:
        # Active services
        active_services = Service.objects.filter(is_active=True).count()
    except:
        active_services = 0
    
    try:
        # Services expiring soon (next 7 days)
        expiring_soon = Service.objects.filter(
            end_date__gte=timezone.now().date(),
            end_date__lte=timezone.now().date() + timedelta(days=7),
            is_active=True
        ).count()
    except:
        expiring_soon = 0
    
    try:
        # Total companies
        total_companies = Company.objects.count()
    except:
        total_companies = 0
    
    return {
        'total_income': total_income,
        'monthly_income': monthly_income,
        'income_growth': round(income_growth, 1),
        'active_services': active_services,
        'expiring_soon': expiring_soon,
        'total_companies': total_companies
    }


def get_financial_stats():
    """Get financial statistics for accountant"""
    
    if not MODELS_AVAILABLE:
        return {
            'monthly_income': 0,
            'monthly_expenses': 0,
            'monthly_profit': 0,
            'pending_payments': 0
        }
    
    current_month = timezone.now().replace(day=1)
    
    try:
        # Monthly income/expenses
        monthly_income = Income.objects.filter(
            payment_date__gte=current_month,
            status='received'
        ).aggregate(total=Sum('amount'))['total'] or 0
        
        monthly_expenses = Expenses.objects.filter(
            date__gte=current_month
        ).aggregate(total=Sum('amount'))['total'] or 0
        
        # Profit
        monthly_profit = monthly_income - monthly_expenses
        
        # Pending payments
        pending_payments = Income.objects.filter(
            status__in=['pending', 'partial']
        ).aggregate(total=Sum('amount'))['total'] or 0
        
    except Exception as e:
        print(f"Financial stats xatosi: {e}")
        monthly_income = 0
        monthly_expenses = 0
        monthly_profit = 0
        pending_payments = 0
    
    return {
        'monthly_income': monthly_income,
        'monthly_expenses': monthly_expenses,
        'monthly_profit': monthly_profit,
        'pending_payments': pending_payments
    }


# AJAX endpoints for dashboard data
@login_required
def dashboard_stats_api(request):
    """API endpoint for dashboard statistics"""
    try:
        employee = Employees.objects.get(user=request.user)
        
        if employee.position == 'admin':
            stats = get_dashboard_stats()
        elif employee.position == 'accounted':
            stats = get_financial_stats()
        else:
            stats = {'error': 'Access denied'}
        
        return JsonResponse(stats)
    
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)


@login_required
def dashboard_chart_data_api(request):
    """API endpoint for chart data"""
    try:
        employee = Employees.objects.get(user=request.user)
        
        if employee.position not in ['admin', 'accounted']:
            return JsonResponse({'error': 'Access denied'}, status=403)
        
        # Monthly income data for last 12 months
        income_data = []
        for i in range(12):
            month_start = timezone.now().replace(day=1) - timedelta(days=30*i)
            month_end = (month_start + timedelta(days=32)).replace(day=1) - timedelta(days=1)
            
            monthly_total = Income.objects.filter(
                payment_date__gte=month_start,
                payment_date__lte=month_end,
                status='received'
            ).aggregate(total=Sum('amount'))['total'] or 0
            
            income_data.append({
                'month': month_start.strftime('%b'),
                'amount': monthly_total
            })
        
        income_data.reverse()
        
        # Services status data
        services_data = [
            {
                'status': 'Tugallangan',
                'count': Service.objects.filter(tender_status='won').count(),
                'color': '#28a745'
            },
            {
                'status': 'Jarayonda',
                'count': Service.objects.filter(is_active=True, tender_status__in=['', 'in_progress']).count(),
                'color': '#714B67'
            },
            {
                'status': 'Kutilmoqda',
                'count': Service.objects.filter(tender_status='not_participating').count(),
                'color': '#ffc107'
            }
        ]
        
        return JsonResponse({
            'income_data': income_data,
            'services_data': services_data
        })
    
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)
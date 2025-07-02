from django.shortcuts import render
from django.utils import timezone
from datetime import datetime, timedelta
from main.models import Service

def expiring_services(request):
    """Tugashiga 30 kundan kam qolgan faol xizmatlar"""
    today = timezone.now().date()
    thirty_days_later = today + timedelta(days=30)
    
    services = Service.objects.filter(
        is_active=True,
        end_date__isnull=False,
        end_date__lte=thirty_days_later,
        end_date__gte=today
    ).select_related('company', 'created_by').order_by('end_date')
    
    # Dashboard statistikalari
    total_services = Service.objects.filter(is_active=True).count()
    active_services = Service.objects.filter(is_active=True, end_date__gte=today).count()
    won_tenders = Service.objects.filter(is_active=True, tender_status='won').count()
    
    # Har bir xizmat uchun qolgan kunlarni hisoblash
    for service in services:
        if service.end_date:
            remaining_days = (service.end_date - today).days
            service.remaining_days = remaining_days
    
    context = {
        'services': services,
        'total_count': services.count(),
        'today': today,
        'total_services': total_services,
        'active_services': active_services,
        'won_tenders': won_tenders,
    }
    
    return render(request, 'main/expiring_list.html', context)
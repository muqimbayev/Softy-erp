# views.py - SMS Management Views
from django.shortcuts import render, redirect, get_object_or_404
from django.contrib.auth.decorators import login_required, user_passes_test
from django.contrib import messages
from django.http import JsonResponse
from django.core.paginator import Paginator
from django.db.models import Q
from main.models import AdminSettings, Service, Notification
from main.forms import AdminSettingsForm, NotificationForm


def is_admin_user(user):
    """Admin huquqini tekshirish"""
    if hasattr(user, 'employees'):
        return user.employees.position == 'admin'
    return user.is_staff or user.is_superuser


@login_required
@user_passes_test(is_admin_user)
def sms_settings_list(request):
    """SMS sozlamalari ro'yxati"""
    try:
        admin_settings = AdminSettings.objects.first()
        if not admin_settings:
            admin_settings = AdminSettings.objects.create(
                first_message="Hurmatli mijoz, sizning xizmatingingiz boshlandi.",
                last_month_message="Sizning xizmatingingiz tugashiga 1 oy qoldi.",
                last_message="Sizning xizmatingingiz tugadi. Rahmat!"
            )
    except Exception as e:
        messages.error(request, f"Xatolik: {str(e)}")
        admin_settings = None
    
    context = {
        'title': 'SMS Sozlamalari',
        'admin_settings': admin_settings,
        'page': 'sms_settings'
    }
    return render(request, 'main/settings_list.html', context)


@login_required
@user_passes_test(is_admin_user)
def sms_settings_edit(request):
    """SMS sozlamalarini tahrirlash"""
    try:
        admin_settings = AdminSettings.objects.first()
        if not admin_settings:
            admin_settings = AdminSettings()
    except Exception as e:
        messages.error(request, f"Xatolik: {str(e)}")
        return redirect('main:settings_list')
    
    if request.method == 'POST':
        form = AdminSettingsForm(request.POST, instance=admin_settings)
        if form.is_valid():
            try:
                form.save()
                messages.success(request, 'SMS sozlamalari muvaffaqiyatli yangilandi!')
                return redirect('main:settings_list')
            except Exception as e:
                messages.error(request, f"Saqlashda xatolik: {str(e)}")
        else:
            messages.error(request, 'Formada xatoliklar mavjud!')
    else:
        form = AdminSettingsForm(instance=admin_settings)
    
    context = {
        'title': 'SMS Sozlamalarini Tahrirlash',
        'form': form,
        'admin_settings': admin_settings,
        'page': 'sms_settings'
    }
    return render(request, 'main/settings_edit.html', context)


@login_required
@user_passes_test(is_admin_user)
def notification_list(request):
    """Bildirishnomalar ro'yxati"""
    search = request.GET.get('search', '')
    notification_type = request.GET.get('type', '')
    is_sent = request.GET.get('is_sent', '')
    
    notifications = Notification.objects.all().order_by('-date')
    
    # Filtrlash
    if search:
        notifications = notifications.filter(
            Q(message__icontains=search) |
            Q(service__name__icontains=search) |
            Q(service__company__name__icontains=search)
        )
    
    if notification_type:
        notifications = notifications.filter(type=notification_type)
    
    if is_sent:
        notifications = notifications.filter(is_sent=is_sent == 'true')
    
    # Pagination
    paginator = Paginator(notifications, 20)
    page_number = request.GET.get('page')
    page_obj = paginator.get_page(page_number)
    
    context = {
        'title': 'SMS Bildirishnomalar',
        'page_obj': page_obj,
        'search': search,
        'notification_type': notification_type,
        'is_sent': is_sent,
        'type_choices': Notification.TYPE_CHOICES,
        'page': 'notifications'
    }
    return render(request, 'main/notification_list.html', context)


@login_required
@user_passes_test(is_admin_user)
def notification_create(request):
    """Yangi bildirishnoma yaratish"""
    if request.method == 'POST':
        form = NotificationForm(request.POST)
        if form.is_valid():
            notification = form.save(commit=False)
            notification.save()
            messages.success(request, 'Bildirishnoma muvaffaqiyatli yaratildi!')
            return redirect('main:notification_list')
        else:
            messages.error(request, 'Formada xatoliklar mavjud!')
    else:
        form = NotificationForm()
    
    context = {
        'title': 'Yangi Bildirishnoma',
        'form': form,
        'page': 'notifications'
    }
    return render(request, 'main/notification_form.html', context)


@login_required
@user_passes_test(is_admin_user)
def notification_edit(request, pk):
    """Bildirishnomani tahrirlash"""
    notification = get_object_or_404(Notification, pk=pk)
    
    if request.method == 'POST':
        form = NotificationForm(request.POST, instance=notification)
        if form.is_valid():
            form.save()
            messages.success(request, 'Bildirishnoma muvaffaqiyatli yangilandi!')
            return redirect('main:notification_list')
        else:
            messages.error(request, 'Formada xatoliklar mavjud!')
    else:
        form = NotificationForm(instance=notification)
    
    context = {
        'title': 'Bildirishnomani Tahrirlash',
        'form': form,
        'notification': notification,
        'page': 'notifications'
    }
    return render(request, 'main/notification_form.html', context)


@login_required
@user_passes_test(is_admin_user)
def notification_delete(request, pk):
    """Bildirishnomani o'chirish"""
    notification = get_object_or_404(Notification, pk=pk)
    
    if request.method == 'POST':
        notification.delete()
        messages.success(request, 'Bildirishnoma muvaffaqiyatli o\'chirildi!')
        return redirect('main:notification_list')
    
    context = {
        'title': 'Bildirishnomani O\'chirish',
        'notification': notification,
        'page': 'notifications'
    }
    return render(request, 'main/notification_delete.html', context)


@login_required
@user_passes_test(is_admin_user)
def send_notification(request, pk):
    """Bildirishnomani yuborish"""
    notification = get_object_or_404(Notification, pk=pk)
    
    if request.method == 'POST':
        try:
            # Bu yerda SMS yuborish logikasi bo'ladi
            # Hozircha faqat statusni o'zgartiramiz
            from django.utils import timezone
            notification.is_sent = True
            notification.sent_date = timezone.now()
            notification.save()
            
            messages.success(request, f'SMS muvaffaqiyatli yuborildi: {notification.service.company.name}')
            return JsonResponse({'success': True, 'message': 'SMS yuborildi'})
        except Exception as e:
            messages.error(request, f'SMS yuborishda xatolik: {str(e)}')
            return JsonResponse({'success': False, 'message': str(e)})
    
    return JsonResponse({'success': False, 'message': 'Noto\'g\'ri so\'rov'})


@login_required
@user_passes_test(is_admin_user)
def bulk_send_notifications(request):
    """Ommaviy SMS yuborish"""
    if request.method == 'POST':
        notification_ids = request.POST.getlist('notification_ids')
        
        if not notification_ids:
            messages.error(request, 'Hech qanday bildirishnoma tanlanmagan!')
            return redirect('main:notification_list')
        
        try:
            from django.utils import timezone
            sent_count = 0
            
            for notification_id in notification_ids:
                notification = Notification.objects.get(pk=notification_id, is_sent=False)
                # SMS yuborish logikasi
                notification.is_sent = True
                notification.sent_date = timezone.now()
                notification.save()
                sent_count += 1
            
            messages.success(request, f'{sent_count} ta SMS muvaffaqiyatli yuborildi!')
        except Exception as e:
            messages.error(request, f'SMS yuborishda xatolik: {str(e)}')
    
    return redirect('main:notification_list')


@login_required
@user_passes_test(is_admin_user)
def notification_stats(request):
    """SMS statistikalari"""
    from django.db.models import Count
    from datetime import datetime, timedelta
    
    # Asosiy statistikalar
    total_notifications = Notification.objects.count()
    sent_notifications = Notification.objects.filter(is_sent=True).count()
    pending_notifications = Notification.objects.filter(is_sent=False).count()
    
    # Tur bo'yicha statistika
    type_stats = Notification.objects.values('type').annotate(
        count=Count('id')
    ).order_by('-count')
    
    # Oylik statistika
    last_12_months = []
    for i in range(12):
        month_start = (datetime.now() - timedelta(days=30*i)).replace(day=1)
        month_end = (month_start + timedelta(days=32)).replace(day=1) - timedelta(days=1)
        
        month_data = Notification.objects.filter(
            date__gte=month_start,
            date__lte=month_end
        ).aggregate(
            total=Count('id'),
            sent=Count('id', filter=Q(is_sent=True))
        )
        
        last_12_months.insert(0, {
            'month': month_start.strftime('%b %Y'),
            'total': month_data['total'] or 0,
            'sent': month_data['sent'] or 0
        })
    
    context = {
        'title': 'SMS Statistikalari',
        'total_notifications': total_notifications,
        'sent_notifications': sent_notifications,
        'pending_notifications': pending_notifications,
        'success_rate': (sent_notifications / total_notifications * 100) if total_notifications > 0 else 0,
        'type_stats': type_stats,
        'monthly_stats': last_12_months,
        'page': 'sms_stats'
    }
    return render(request, 'main/stats.html', context)


@login_required
@user_passes_test(is_admin_user)
def preview_message(request):
    """Xabar ko'rish"""
    if request.method == 'POST':
        service_id = request.POST.get('service_id')
        message_type = request.POST.get('message_type')
        
        try:
            service = Service.objects.get(pk=service_id)
            admin_settings = AdminSettings.objects.first()
            
            if not admin_settings:
                return JsonResponse({'success': False, 'message': 'SMS sozlamalari topilmadi'})
            
            # Xabarni template bilan formatlash
            if message_type == 'first':
                message = admin_settings.first_message
            elif message_type == 'last_month':
                message = admin_settings.last_month_message
            elif message_type == 'last':
                message = admin_settings.last_message
            else:
                return JsonResponse({'success': False, 'message': 'Noto\'g\'ri xabar turi'})
            
            # Template o'zgaruvchilarini almashtirish
            formatted_message = message.replace('{company_name}', service.company.name)
            formatted_message = formatted_message.replace('{service_name}', service.name)
            formatted_message = formatted_message.replace('{end_date}', 
                service.end_date.strftime('%d.%m.%Y') if service.end_date else 'Belgilanmagan')
            
            return JsonResponse({
                'success': True,
                'message': formatted_message,
                'company': service.company.name,
                'phone': service.company.phone_number
            })
            
        except Service.DoesNotExist:
            return JsonResponse({'success': False, 'message': 'Xizmat topilmadi'})
        except Exception as e:
            return JsonResponse({'success': False, 'message': str(e)})
    
    return JsonResponse({'success': False, 'message': 'Noto\'g\'ri so\'rov'})
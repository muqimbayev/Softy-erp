# main/views.py ga qo'shish
from django.shortcuts import render, get_object_or_404, redirect
from django.contrib.auth.decorators import login_required
from django.contrib import messages
from django.http import JsonResponse
from django.db.models import Q, Sum, F
from django.core.paginator import Paginator
from datetime import datetime, date
from main.models import *
from main.forms import ServiceForm, ServiceIncomeForm, ServiceExpenseForm, CompanyQuickForm
from django.views.decorators.csrf import csrf_exempt
import json
def service_access_required(view_func):
    """Service bo'limiga kirish huquqi decorator"""
    @login_required
    def wrapper(request, *args, **kwargs):
        try:
            employee = Employees.objects.get(user=request.user)
            # Barcha pozitsiyalar ko'ra oladi
            if employee.position in ['admin', 'accounted', 'employee']:
                return view_func(request, *args, **kwargs)
            else:
                messages.error(request, 'Bu sahifaga kirish huquqingiz yo\'q!')
                return redirect('main:dashboard')
        except Employees.DoesNotExist:
            messages.error(request, 'Employee ma\'lumotlari topilmadi!')
            return redirect('main:dashboard')
    return wrapper

def service_edit_required(view_func):
    """Service tahrirlash huquqi decorator"""
    @login_required
    def wrapper(request, *args, **kwargs):
        try:
            employee = Employees.objects.get(user=request.user)
            # Faqat admin va employee tahrirlashi mumkin
            if employee.position in ['admin', 'employee']:
                return view_func(request, *args, **kwargs)
            else:
                messages.error(request, 'Tahrirlash huquqingiz yo\'q!')
                return redirect('main:service_list')
        except Employees.DoesNotExist:
            messages.error(request, 'Employee ma\'lumotlari topilmadi!')
            return redirect('main:dashboard')
    return wrapper

def finance_access_required(view_func):
    """Moliya bo'limiga kirish huquqi decorator"""
    @login_required
    def wrapper(request, *args, **kwargs):
        try:
            employee = Employees.objects.get(user=request.user)
            # Faqat admin va bugalter moliyaga kirishi mumkin
            if employee.position in ['admin', 'accounted', 'employee']:
                return view_func(request, *args, **kwargs)
            else:
                messages.error(request, 'Moliya bo\'limiga kirish huquqingiz yo\'q!')
                return redirect('main:service_list')
        except Employees.DoesNotExist:
            messages.error(request, 'Employee ma\'lumotlari topilmadi!')
            return redirect('main:dashboard')
    return wrapper

@service_access_required
def service_list(request):
    """Xizmatlar ro'yxati"""

    services = Service.objects.select_related(
        'company', 'created_by', 'updated_by'
    ).prefetch_related('incomes', 'expenses')

    # Filterlash parametrlarini olish
    tender_status = request.GET.get('tender_status')
    service_type = request.GET.get('type')
    created_by = request.GET.get('created_by')
    payment_status = request.GET.get('payment_status')
    
    # 👇 Default qiymat o'rnatish
    is_active = request.GET.get('is_active', 'true')  # Default 'true'
    
    search = request.GET.get('search')
    date_from = request.GET.get('date_from')
    date_to = request.GET.get('date_to')

    # Filterlash
    if tender_status:
        services = services.filter(tender_status=tender_status)

    if service_type:
        services = services.filter(type=service_type)

    if created_by:
        services = services.filter(created_by_id=created_by)

    # 👇 Default holatda ham filter qilish
    if is_active == 'true':
        services = services.filter(is_active=True)
    elif is_active == 'false':
        services = services.filter(is_active=False)
    # 'Barchasi' uchun hech narsa qilmaymiz

    if date_from:
        try:
            date_from_obj = datetime.strptime(date_from, '%Y-%m-%d').date()
            services = services.filter(started_date__gte=date_from_obj)
        except ValueError:
            pass

    if date_to:
        try:
            date_to_obj = datetime.strptime(date_to, '%Y-%m-%d').date()
            services = services.filter(started_date__lte=date_to_obj)
        except ValueError:
            pass

    if search and search.strip():
        services = services.filter(
            Q(name__icontains=search.strip()) |
            Q(company__name__icontains=search.strip()) |
            Q(company__stir__icontains=search.strip())
        )

    if payment_status:
        services_with_income = services.annotate(
            total_income=Sum('incomes__amount', filter=Q(incomes__status='received'))
        )

        if payment_status == 'paid':
            services = services_with_income.filter(
                total_income__gte=F('contract_amount'),
                contract_amount__isnull=False,
                contract_amount__gt=0
            )
        elif payment_status == 'partial':
            services = services_with_income.filter(
                total_income__lt=F('contract_amount'),
                total_income__gt=0,
                contract_amount__isnull=False,
                contract_amount__gt=0
            )
        elif payment_status == 'unpaid':
            services = services_with_income.filter(
                Q(total_income__isnull=True) | Q(total_income=0)
            )

    # Tartibga solish
    services = services.order_by('-created_at')

    # Sahifalash
    paginator = Paginator(services, 20)
    page_number = request.GET.get('page')
    services = paginator.get_page(page_number)

    # Statistika
    total_services = Service.objects.count()
    active_services = Service.objects.filter(is_active=True).count()
    won_services = Service.objects.filter(tender_status='won').count()

    employees = Employees.objects.filter(position__in=['admin', 'employee'])

    context = {
        'title': 'Xizmatlar - Softy ERP',
        'services': services,
        'total_services': total_services,
        'active_services': active_services,
        'won_services': won_services,
        'employees': employees,
        'tender_choices': Service.TENDER_CHOICES,
        'type_choices': Service.TYPE_CHOICES,
        'current_filters': {
            'tender_status': tender_status,
            'type': service_type,
            'created_by': created_by,
            'payment_status': payment_status,
            'is_active': is_active,  # Bu avtomatik 'true' bo'ladi
            'date_from': date_from,
            'date_to': date_to,
            'search': search.strip() if search else '',
        }
    }

    return render(request, 'main/services/service_list.html', context)


@service_access_required
def service_detail(request, service_id):
    """Xizmat tafsilotlari"""
    
    service = get_object_or_404(Service, id=service_id)
    
    # Moliyaviy ma'lumotlar
    incomes = service.incomes.all().order_by('-payment_date')
    expenses = service.expenses.all().order_by('-date')
    
    total_income = service.get_total_income()
    total_expenses = service.get_total_expenses()
    profit = service.get_profit()
    first_sms = Notification.objects.filter(service=service, type='first').first()
    last_month_sms = Notification.objects.filter(service=service, type='last_month').first()
    last_sms = Notification.objects.filter(service=service, type='last').first()



    
    # Huquqlarni tekshirish
    employee = Employees.objects.get(user=request.user)
    can_edit_service = employee.position in ['admin', 'employee']
    can_edit_finance = employee.position in ['admin', 'accounted']
    
    context = {
        'title': f'{service.name} - Softy ERP',
        'service': service,
        'incomes': incomes,
        'expenses': expenses,
        'total_income': total_income,
        'total_expenses': total_expenses,
        'profit': profit,
        'can_edit_service': can_edit_service,
        'can_edit_finance': can_edit_finance,
        'first_sms': first_sms,
        'last_month_sms': last_month_sms,
        'last_sms': last_sms,

    }
    
    return render(request, 'main/services/service_detail.html', context)

@service_edit_required
def service_edit(request, service_id):
    """Xizmatni tahrirlash"""
    
    service = get_object_or_404(Service, id=service_id)
    
    if request.method == 'POST':
        form = ServiceForm(request.POST, request.FILES, instance=service)
        if form.is_valid():
            service = form.save(commit=False)
            service.updated_by = Employees.objects.get(user=request.user)
            service.save()
            messages.success(request, f'"{service.name}" xizmati muvaffaqiyatli yangilandi!')
            return redirect('main:service_detail', service_id=service.id)
        else:
            messages.error(request, 'Ma\'lumotlarda xatolik bor. Iltimos, tekshiring.')
    else:
        form = ServiceForm(instance=service)
    
    context = {
        'title': f'{service.name} tahrirlash - Softy ERP',
        'form': form,
        'service': service,
    }
    
    return render(request, 'main/services/service_edit.html', context)

@service_edit_required
def service_delete(request, service_id):
    """Xizmatni o'chirish"""
    
    service = get_object_or_404(Service, id=service_id)
    
    if request.method == 'POST':
        service_name = service.name
        service.delete()
        messages.success(request, f'"{service_name}" xizmati muvaffaqiyatli o\'chirildi!')
        return redirect('main:company_detail', company_id=service.company.id)
    
    context = {
        'title': f'{service.name} o\'chirish - Softy ERP',
        'service': service,
    }
    
    return render(request, 'main/services/service_delete.html', context)

@service_access_required
def service_income_add(request, service_id):
    """Xizmatga daromad qo'shish"""
    
    service = get_object_or_404(Service, id=service_id)
    
    if request.method == 'POST':
        form = ServiceIncomeForm(request.POST)
        if form.is_valid():
            income = form.save(commit=False)
            income.service = service
            income.company = service.company
            income.created_by = Employees.objects.get(user=request.user)
            income.save()
            messages.success(request, 'Daromad muvaffaqiyatli qo\'shildi!')
            return redirect('main:service_detail', service_id=service.id)
        else:
            messages.error(request, 'Ma\'lumotlarda xatolik bor. Iltimos, tekshiring.')
    else:
        form = ServiceIncomeForm(initial={'payment_date': date.today()})
    
    context = {
        'title': f'{service.name} - Daromad qo\'shish',
        'form': form,
        'service': service,
    }
    
    return render(request, 'main/services/income_add.html', context)



import json
from datetime import date
from django.shortcuts import render, get_object_or_404, redirect
from django.contrib import messages
from django.contrib.auth.decorators import login_required
from django.http import JsonResponse
from django.views.decorators.http import require_POST

@finance_access_required
def service_expense_add(request, service_id):
    """Xizmatga xarajat qo'shish"""
    
    service = get_object_or_404(Service, id=service_id)
    
    if request.method == 'POST':
        form = ServiceExpenseForm(request.POST)
        
        if form.is_valid():
            expense = form.save(commit=False)
            expense.service = service
            
            try:
                employee = Employees.objects.get(user=request.user)
                expense.created_by = employee
                
                if hasattr(expense, 'employee'):
                    expense.employee = employee
                    
            except Employees.DoesNotExist:
                messages.error(request, 'Employee profili topilmadi!')
                return redirect('main:service_detail', service_id=service.id)
            
            print(f"DEBUG: Saving expense:")
            print(f"  Amount (with tax): {expense.amount}")
            print(f"  Category: {expense.category.name}")
            print(f"  Tax Rate: {expense.category.tax_rate}%")
            
            expense.save()
            
            messages.success(request, 'Xarajat muvaffaqiyatli qo\'shildi!')
            return redirect('main:service_detail', service_id=service.id)
        else:
            messages.error(request, 'Formada xatoliklar bor. Iltimos, tekshiring.')
            print(f"DEBUG: Form errors: {form.errors}")
    
    else:
        # GET request - bo'sh form
        # Default kategoriyani olish
        try:
            default_category = ExpensesCategory.objects.get(name="Servis xarajatlari")
        except ExpensesCategory.DoesNotExist:
            # Agar yo'q bo'lsa yaratish
            default_category = ExpensesCategory.objects.create(
                name="Servis xarajatlari",
                is_active=True,
                tax_rate=12.0  # 12% default tax
            )
            print(f"DEBUG: Created default category with tax_rate: {default_category.tax_rate}")
        
        print(f"DEBUG: Default category tax_rate: {default_category.tax_rate}")
        
        # Form yaratish, faqat initial values bilan
        form = ServiceExpenseForm(initial={
            'date': date.today(),
            'category': default_category.id
        })
    
    # Context yaratish
    categories = ExpensesCategory.objects.filter(is_active=True).order_by('name')
    
    # Categories JSON yaratish - aniq format bilan
    categories_dict = {}
    for cat in categories:
        # Tax rate ni to'g'ri formatda olish
        tax_rate = float(cat.tax_rate) if cat.tax_rate is not None else 0.0
        categories_dict[str(cat.id)] = tax_rate
        print(f"DEBUG: Category {cat.name} (ID: {cat.id}): {tax_rate}% tax")
    
    # JSON formatga o'tkazish
    categories_json = json.dumps(categories_dict)
    
    print(f"DEBUG: Final categories JSON: {categories_json}")  # Debug uchun
    
    context = {
        'title': f'{service.name} - Xarajat qo\'shish',
        'form': form,
        'service': service,
        'categories': categories,
        'categories_json': categories_json,
    }
    
    return render(request, 'main/services/expense_add.html', context)


@finance_access_required
def income_edit(request, income_id):
    """Daromadni tahrirlash"""
    
    income = get_object_or_404(Income, id=income_id)
    
    if request.method == 'POST':
        form = ServiceIncomeForm(request.POST, instance=income)
        if form.is_valid():
            income = form.save(commit=False)
            income.updated_by = Employees.objects.get(user=request.user)
            income.save()
            messages.success(request, 'Daromad ma\'lumotlari yangilandi!')
            return redirect('main:service_detail', service_id=income.service.id)
        else:
            messages.error(request, 'Ma\'lumotlarda xatolik bor.')
    else:
        form = ServiceIncomeForm(instance=income)
    
    context = {
        'title': 'Daromadni tahrirlash',
        'form': form,
        'income': income,
    }
    
    return render(request, 'main/services/income_edit.html', context)

@finance_access_required
def expense_edit(request, expense_id):
    """Xarajatni tahrirlash"""
    
    expense = get_object_or_404(Expenses, id=expense_id)
    
    if request.method == 'POST':
        form = ServiceExpenseForm(request.POST, instance=expense)
        if form.is_valid():
            form.save()
            messages.success(request, 'Xarajat ma\'lumotlari yangilandi!')
            return redirect('main:service_detail', service_id=expense.service.id)
        else:
            messages.error(request, 'Ma\'lumotlarda xatolik bor.')
    else:
        form = ServiceExpenseForm(instance=expense)
    
    context = {
        'title': 'Xarajatni tahrirlash',
        'form': form,
        'expense': expense,
    }
    
    return render(request, 'main/services/expense_edit.html', context)

@finance_access_required
def income_delete(request, income_id):
    """Daromadni o'chirish"""
    
    income = get_object_or_404(Income, id=income_id)
    service_id = income.service.id
    
    if request.method == 'POST':
        income.delete()
        messages.success(request, 'Daromad ma\'lumoti o\'chirildi!')
        return JsonResponse({
            'success': True,
            'service_id': service_id,
            'redirect_url': f'/services/{service_id}/'
        })
    
    # GET request uchun delete sahifasini ko'rsatish
    context = {
        'title': f'{income.service.name} - Daromadni o\'chirish',
        'service': income.service,
        'income': income,
    }
    
    return render(request, 'main/services/income_delete.html', context)

@finance_access_required
def expense_delete(request, expense_id):
    """Xarajatni o'chirish"""
    
    expense = get_object_or_404(Expenses, id=expense_id)
    service_id = expense.service.id
    
    if request.method == 'POST':
        expense.delete()
        messages.success(request, 'Xarajat ma\'lumoti o\'chirildi!')
        return JsonResponse({
            'success': True,
            'service_id': service_id,
            'redirect_url': f'/services/{service_id}/'
        })
    
    context = {
        'title': f'{expense.service.name} - Daromadni o\'chirish',
        'service': expense.service,
        'expense': expense,
    }
    
    return render(request, 'main/services/expense_delete.html', context)

# AJAX API endpoints
@service_access_required
def company_search_api(request):
    """Kompaniyalarni qidirish API"""
    
    query = request.GET.get('q', '')
    
    if len(query) < 2:
        return JsonResponse({'results': []})
    
    companies = Company.objects.filter(
        Q(name__icontains=query) | Q(stir__icontains=query)
    )[:10]
    
    results = []
    for company in companies:
        results.append({
            'id': company.id,
            'name': company.name,
            'stir': company.stir,
            'display': f"{company.name} ({company.stir})"
        })
    
    return JsonResponse({'results': results})

@service_edit_required
def company_create_api(request):
    """Yangi kompaniya yaratish API"""
    
    if request.method == 'POST':
        form = CompanyQuickForm(request.POST)
        if form.is_valid():
            company = form.save()
            return JsonResponse({
                'success': True,
                'company': {
                    'id': company.id,
                    'name': company.name,
                    'stir': company.stir,
                    'display': f"{company.name} ({company.stir})"
                }
            })
        else:
            return JsonResponse({
                'success': False,
                'errors': form.errors
            })
    
    return JsonResponse({'success': False})



def service_create(request, company_id=None):
    """Yangi xizmat yaratish"""
    company = None
    if company_id:
        company = get_object_or_404(Company, id=company_id)
    
    if request.method == 'POST':
        try:
            # Form ma'lumotlarini olish
            name = request.POST.get('name')
            company_id = request.POST.get('company')
            tender_status = request.POST.get('tender_status')
            type_choice = request.POST.get('type')
            started_date = request.POST.get('started_date')
            end_date = request.POST.get('end_date')
            contract_amount = request.POST.get('contract_amount')
            contract = request.FILES.get('contract')
            comment = request.POST.get('comment')
            
            # SMS sozlamalari
            first_sms = request.POST.get('first_sms') == 'on'
            last_month_sms = request.POST.get('last_month_sms') == 'on'
            last_sms = request.POST.get('last_sms') == 'on'
            
            # Validatsiya
            if not name or not company_id or not tender_status or not type_choice:
                messages.error(request, 'Majburiy maydonlarni to\'ldiring!')
                return render(request, 'main/services/service_create.html', {
                    'company': company,
                    'form_data': request.POST
                })
            
            # Kompaniyani olish
            try:
                selected_company = Company.objects.get(id=company_id)
            except Company.DoesNotExist:
                messages.error(request, 'Kompaniya topilmadi!')
                return render(request, 'main/services/service_create.html', {
                    'company': company,
                    'form_data': request.POST
                })
            
            # Xizmatni yaratish
            service = Service.objects.create(
                name=name,
                company=selected_company,
                tender_status=tender_status,
                type=type_choice,
                started_date=started_date if started_date else None,
                end_date=end_date if end_date else None,
                contract_amount=contract_amount if contract_amount else None,
                contract=contract,
                comment=comment,
                first_sms=first_sms,
                last_month_sms=last_month_sms,
                last_sms=last_sms,
                created_by=request.user.employees if hasattr(request.user, 'employees') else None
            )
            
            messages.success(request, f'"{name}" xizmati muvaffaqiyatli yaratildi!')
            return redirect('main:company_detail', company_id=company.pk)
            
        except Exception as e:
            messages.error(request, f'Xatolik yuz berdi: {str(e)}')
            # Xatolik bo'lsa ham to'g'ri sahifaga qaytarish
            if company:
                    return redirect('main:company_detail', company_id=company.pk)
            return render(request, 'main/services/service_create.html', {
                'company': company,
                'form_data': request.POST
            })
    
    return render(request, 'main/services/service_create.html', {
        'company': company
    })

@csrf_exempt
def company_search_ajax(request):
    """Kompaniya qidirish AJAX"""
    if request.method == 'POST':
        try:
            data = json.loads(request.body)
            query = data.get('query', '').strip()
            
            if len(query) < 2:
                return JsonResponse({'companies': []})
            
            # Kompaniyalarni qidirish
            companies = Company.objects.filter(
                name__icontains=query
            ).order_by('name')[:10]
            
            companies_data = []
            for company in companies:
                companies_data.append({
                    'id': company.id,
                    'name': company.name,
                    'stir': company.stir,
                    'phone_number': company.phone_number or '',
                    'email': company.email or '',
                    'address': company.address or ''
                })
            
            return JsonResponse({'companies': companies_data})
            
        except Exception as e:
            return JsonResponse({'error': str(e)}, status=400)
    
    return JsonResponse({'error': 'Noto\'g\'ri so\'rov'}, status=400)





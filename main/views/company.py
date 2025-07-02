# main/views.py ga qo'shish
from django.shortcuts import render, get_object_or_404, redirect
from django.contrib.auth.decorators import login_required
from django.contrib import messages
from django.db import transaction
from main.models import Company, Service, Employees
from main.forms import CompanyAddForm, CompanyEditForm

def company_access_required(view_func):
    """Kompaniya huquqi decorator (admin, employee ko'rish/tahrirlash, accounted faqat ko'rish)"""
    @login_required
    def wrapper(request, *args, **kwargs):
        try:
            employee = Employees.objects.get(user=request.user)
            if employee.position in ['admin', 'employee', 'accounted']:
                return view_func(request, *args, **kwargs)
            else:
                messages.error(request, 'Bu sahifaga kirish huquqingiz yo\'q!')
                return redirect('main:dashboard')
        except Employees.DoesNotExist:
            messages.error(request, 'Employee ma\'lumotlari topilmadi!')
            return redirect('main:dashboard')
    return wrapper

def company_edit_required(view_func):
    """Kompaniya tahrirlash huquqi (faqat admin va employee)"""
    @login_required
    def wrapper(request, *args, **kwargs):
        try:
            employee = Employees.objects.get(user=request.user)
            if employee.position in ['admin', 'employee']:
                return view_func(request, *args, **kwargs)
            else:
                messages.error(request, 'Tahrirlash huquqingiz yo\'q!')
                return redirect('main:company_list')
        except Employees.DoesNotExist:
            messages.error(request, 'Employee ma\'lumotlari topilmadi!')
            return redirect('main:dashboard')
    return wrapper

@company_access_required
def company_list(request):
    """Barcha kompaniyalar ro'yxati"""
    
    companies = Company.objects.select_related('created_by', 'updated_by').all().order_by('-created_date')
    
    context = {
        'title': 'Kompaniyalar - Softy ERP',
        'companies': companies,
        'total_companies': companies.count(),
        'can_edit': request.user.employees.position in ['admin', 'employee'],
    }
    
    return render(request, 'main/companies/company_list.html', context)

@company_access_required
def company_detail(request, company_id):
    """Kompaniya tafsilotlari"""
    
    company = get_object_or_404(Company, id=company_id)
    
    # Bu kompaniyaning xizmatlari
    services = Service.objects.filter(company=company).order_by('-created_at')
    
    context = {
        'title': f'{company.name} - Kompaniya',
        'company': company,
        'services': services,
        'can_edit': request.user.employees.position in ['admin', 'employee'],
    }
    
    return render(request, 'main/companies/company_detail.html', context)

@company_edit_required
def company_add(request):
    """Yangi kompaniya qo'shish"""
    
    if request.method == 'POST':
        form = CompanyAddForm(request.POST)
        
        if form.is_valid():
            try:
                with transaction.atomic():
                    company = form.save(commit=False)
                    company.created_by = request.user.employees
                    company.save()
                    
                    messages.success(
                        request, 
                        f'"{company.name}" kompaniyasi muvaffaqiyatli qo\'shildi!'
                    )
                    return redirect('main:company_detail', company_id=company.id)
                    
            except Exception as e:
                messages.error(request, f'Kompaniya qo\'shishda xatolik: {str(e)}')
        else:
            messages.error(request, 'Ma\'lumotlarda xatolik bor. Iltimos, tekshiring.')
    else:
        form = CompanyAddForm()
    
    context = {
        'title': 'Yangi kompaniya qo\'shish - Softy ERP',
        'form': form,
    }
    
    return render(request, 'main/companies/company_add.html', context)

@company_edit_required
def company_edit(request, company_id):
    """Kompaniya tahrirlash"""
    
    company = get_object_or_404(Company, id=company_id)
    
    if request.method == 'POST':
        form = CompanyEditForm(request.POST, instance=company)
        
        if form.is_valid():
            try:
                with transaction.atomic():
                    company = form.save(commit=False)
                    company.updated_by = request.user.employees
                    company.save()
                    
                    messages.success(
                        request, 
                        f'"{company.name}" kompaniyasi muvaffaqiyatli yangilandi!'
                    )
                    return redirect('main:company_detail', company_id=company.id)
                    
            except Exception as e:
                messages.error(request, f'Kompaniya tahrirlashda xatolik: {str(e)}')
        else:
            messages.error(request, 'Ma\'lumotlarda xatolik bor. Iltimos, tekshiring.')
    else:
        form = CompanyEditForm(instance=company)
    
    context = {
        'title': f'{company.name} tahrirlash - Softy ERP',
        'company': company,
        'form': form,
    }
    
    return render(request, 'main/companies/company_edit.html', context)
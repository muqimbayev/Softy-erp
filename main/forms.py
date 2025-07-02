from django import forms
from main.models import *
from django.contrib.auth.models import User
from django.utils import timezone

#Employee edit
class EmployeeEditForm(forms.ModelForm):
    """Xodim ma'lumotlarini tahrirlash formasi"""
    
    class Meta:
        model = Employees
        fields = ['first_name', 'last_name', 'position', 'phone_number', 'hire_date', 'is_active', 'salary']
        widgets = {
            'first_name': forms.TextInput(attrs={
                'class': 'form-control',
                'placeholder': 'Ism'
            }),
            'last_name': forms.TextInput(attrs={
                'class': 'form-control', 
                'placeholder': 'Familiya'
            }),
            'position': forms.Select(attrs={
                'class': 'form-control'
            }),
            'phone_number': forms.TextInput(attrs={
                'class': 'form-control',
                'placeholder': '+998 90 123 45 67'
            }),
            'hire_date': forms.DateInput(attrs={
                'class': 'form-control',
                'type': 'date'
            }),
            'salary': forms.NumberInput(attrs={
                'class': 'form-control',
                'placeholder': '3,000,000',
            }),
            'is_active': forms.CheckboxInput(attrs={
                'class': 'form-check-input'
            })
        }
        labels = {
            'first_name': 'Ism',
            'last_name': 'Familiya', 
            'position': 'Lavozim',
            'phone_number': 'Telefon raqam (Login)',
            'hire_date': 'Ishga kirgan sana',
            'is_active': 'Faol',
            'salary': "Oylik maoshi"
        }
    
    def clean_phone_number(self):
        phone = self.cleaned_data.get('phone_number')
        if phone and not (phone.startswith('998') or phone.startswith('+998')):
            raise forms.ValidationError('Telefon raqam +998 bilan boshlanishi kerak')
        
        # Check if phone number already exists (excluding current employee)
        clean_phone = phone.replace(' ', '').replace('+', '')
        existing_user = User.objects.filter(username=clean_phone).exclude(id=self.instance.user.id)
        if existing_user.exists():
            raise forms.ValidationError('Bu telefon raqam bilan boshqa xodim mavjud')
            
        return clean_phone
    
    def clean_hire_date(self):
        hire_date = self.cleaned_data.get('hire_date')
        
        if hire_date and hire_date > timezone.now().date():
            raise forms.ValidationError('Ishga kirgan sana kelajakda bo\'lishi mumkin emas')
            
        return hire_date
    
    def save(self, commit=True):
        employee = super().save(commit=False)
        
        if commit:
            # Update User model fields as well
            user = employee.user
            user.first_name = employee.first_name
            user.last_name = employee.last_name
            user.username = employee.phone_number  # Phone number as username
            user.save()
            
            employee.save()
        
        return employee


#Employee add
class EmployeeAddForm(forms.Form):
    """Yangi xodim qo'shish formasi"""
    
    # Employee ma'lumotlari
    first_name = forms.CharField(
        max_length=100,
        widget=forms.TextInput(attrs={
            'class': 'form-control',
            'placeholder': 'Ism'
        }),
        label='Ism'
    )
    
    last_name = forms.CharField(
        max_length=100,
        widget=forms.TextInput(attrs={
            'class': 'form-control',
            'placeholder': 'Familiya'
        }),
        label='Familiya'
    )
    
    phone_number = forms.CharField(
        max_length=20,
        widget=forms.TextInput(attrs={
            'class': 'form-control',
            'placeholder': '+998 90 123 45 67'
        }),
        label='Telefon raqam (Login uchun)'
    )

    salary = forms.IntegerField(
        widget=forms.TextInput(attrs={
            'class': 'form-control',
            'placeholder': 'Oylik maoshi'
        }),
        label='Oylik maoshi'
    )
    
    position = forms.ChoiceField(
        choices=Employees.TYPE_CHOICES,
        widget=forms.Select(attrs={
            'class': 'form-control'
        }),
        label='Lavozim'
    )
    
    hire_date = forms.DateField(
        widget=forms.DateInput(attrs={
            'class': 'form-control',
            'type': 'date',
            'placeholder': 'yyyy-mm-dd'
        }),
        label='Ishga kirgan sana',
        initial=timezone.now().date()
    )
    
    # Parol ma'lumotlari
    password1 = forms.CharField(
        widget=forms.PasswordInput(attrs={
            'class': 'form-control',
            'placeholder': '••••••••'
        }),
        label='Parol'
    )
    
    password2 = forms.CharField(
        widget=forms.PasswordInput(attrs={
            'class': 'form-control',
            'placeholder': '••••••••'
        }),
        label='Parolni tasdiqlash'
    )
    
    is_active = forms.BooleanField(
        required=False,
        initial=True,
        widget=forms.CheckboxInput(attrs={
            'class': 'form-check-input'
        }),
        label='Faol'
    )
    
    def clean_phone_number(self):
        phone = self.cleaned_data.get('phone_number')
        
        # Phone format validation
        if not phone.startswith('+998'):
            raise forms.ValidationError('Telefon raqam +998 bilan boshlanishi kerak')
        
        # Remove spaces and check length
        clean_phone = phone.replace(' ', '')
        if len(clean_phone) != 13:
            raise forms.ValidationError('Telefon raqam to\'liq bo\'lishi kerak: +998901234567')
        
        # Check if phone already exists
        if User.objects.filter(username=clean_phone).exists():
            raise forms.ValidationError('Bu telefon raqam bilan xodim allaqachon mavjud')
            
        return clean_phone
    
    def clean_hire_date(self):
        hire_date = self.cleaned_data.get('hire_date')
        
        if hire_date and hire_date > timezone.now().date():
            raise forms.ValidationError('Ishga kirgan sana kelajakda bo\'lishi mumkin emas')
            
        return hire_date
    
    def clean_password2(self):
        password1 = self.cleaned_data.get('password1')
        password2 = self.cleaned_data.get('password2')
        
        if password1 and password2 and password1 != password2:
            raise forms.ValidationError('Parollar mos kelmaydi')
        
        if password2 and len(password2) < 8:
            raise forms.ValidationError('Parol kamida 8 ta belgidan iborat bo\'lishi kerak')
            
        return password2
    


#Company add
class CompanyAddForm(forms.ModelForm):
    """Yangi kompaniya qo'shish formasi"""
    
    class Meta:
        model = Company
        fields = ['name', 'stir', 'full_name', 'phone_number', 'email', 'comment']
        widgets = {
            'name': forms.TextInput(attrs={
                'class': 'form-control',
                'placeholder': 'Kompaniya nomi'
            }),
            'stir': forms.TextInput(attrs={
                'class': 'form-control',
                'placeholder': '123456789',
                'maxlength': '9'
            }),
            'full_name': forms.TextInput(attrs={
                'class': 'form-control',
                'placeholder': 'Mas: Aliyev Vali Saidovich'
            }),
            'phone_number': forms.TextInput(attrs={
                'class': 'form-control',
                'placeholder': '+998 90 123 45 67'
            }),
            'email': forms.EmailInput(attrs={
                'class': 'form-control',
                'placeholder': 'company@example.com'
            }),
            'comment': forms.Textarea(attrs={
                'class': 'form-control',
                'placeholder': 'Kompaniya haqida qo\'shimcha ma\'lumot...',
                'rows': 4
            })
        }
        labels = {
            'name': 'Kompaniya nomi',
            'stir': 'STIR raqami',
            'full_name': 'Mas\'ul shaxs F.I.O',
            'phone_number': 'Telefon raqam',
            'email': 'Email',
            'comment': 'Izoh'
        }
    
    def clean_stir(self):
        stir = self.cleaned_data.get('stir')
        if stir:
            # Faqat raqamlar
            if not stir.isdigit():
                raise forms.ValidationError('STIR faqat raqamlardan iborat bo\'lishi kerak')
            
            # 9 ta raqam
            if len(stir) != 9:
                raise forms.ValidationError('STIR 9 ta raqamdan iborat bo\'lishi kerak')
        
        return stir
    
    def clean_phone_number(self):
        phone = self.cleaned_data.get('phone_number')
        if phone:
            if not phone.startswith('+998'):
                raise forms.ValidationError('Telefon raqam +998 bilan boshlanishi kerak')
            
            clean_phone = phone.replace(' ', '').replace('-', '')
            if len(clean_phone) != 13:
                raise forms.ValidationError('Telefon raqam to\'liq bo\'lishi kerak')
        
        return phone

#Company edit
class CompanyEditForm(forms.ModelForm):
    """Kompaniya tahrirlash formasi"""
    
    class Meta:
        model = Company
        fields = ['name', 'stir', 'full_name', 'phone_number', 'email', 'comment']
        widgets = {
            'name': forms.TextInput(attrs={
                'class': 'form-control',
                'placeholder': 'Kompaniya nomi'
            }),
            'stir': forms.TextInput(attrs={
                'class': 'form-control',
                'placeholder': '123456789',
                'maxlength': '9'
            }),
            'full_name': forms.TextInput(attrs={
                'class': 'form-control',
                'placeholder': 'Mas: Aliyev Vali Saidovich'
            }),
            'phone_number': forms.TextInput(attrs={
                'class': 'form-control',
                'placeholder': '+998 90 123 45 67'
            }),
            'email': forms.EmailInput(attrs={
                'class': 'form-control',
                'placeholder': 'company@example.com'
            }),
            'comment': forms.Textarea(attrs={
                'class': 'form-control',
                'placeholder': 'Kompaniya haqida qo\'shimcha ma\'lumot...',
                'rows': 4
            })
        }
        labels = {
            'name': 'Kompaniya nomi',
            'stir': 'STIR raqami',
            'full_name': 'Mas\'ul shaxs F.I.O',
            'phone_number': 'Telefon raqam',
            'email': 'Email',
            'comment': 'Izoh'
        }
    
    def clean_stir(self):
        stir = self.cleaned_data.get('stir')
        if stir:
            if not stir.isdigit():
                raise forms.ValidationError('STIR faqat raqamlardan iborat bo\'lishi kerak')
            if len(stir) != 9:
                raise forms.ValidationError('STIR 9 ta raqamdan iborat bo\'lishi kerak')
            
            # STIR noyobligini tekshirish (o'zidan boshqa)
            existing = Company.objects.filter(stir=stir).exclude(id=self.instance.id)
            if existing.exists():
                raise forms.ValidationError('Bu STIR raqami bilan kompaniya allaqachon mavjud')
        
        return stir
    
    def clean_phone_number(self):
        phone = self.cleaned_data.get('phone_number')
        if phone:
            if not phone.startswith('+998'):
                raise forms.ValidationError('Telefon raqam +998 bilan boshlanishi kerak')
            
            clean_phone = phone.replace(' ', '').replace('-', '')
            if len(clean_phone) != 13:
                raise forms.ValidationError('Telefon raqam to\'liq bo\'lishi kerak')
        
        return phone
    

# main/forms.py ga qo'shish
from django import forms
from django.core.exceptions import ValidationError
from main.models import Service, Company, Income, Expenses, ExpensesCategory, Employees

class ServiceForm(forms.ModelForm):
    """Xizmat formasi"""
    
    class Meta:
        model = Service
        fields = [
            'name', 'company', 'tender_status', 'type', 'started_date', 
            'end_date', 'contract_amount', 'contract', 'comment',
            'first_sms', 'last_month_sms', 'last_sms', 'is_active'
        ]
        widgets = {
            'name': forms.TextInput(attrs={
                'class': 'form-control',
                'placeholder': 'Xizmat nomi'
            }),
            'company': forms.Select(attrs={
                'class': 'form-control company-select',
                'data-placeholder': 'Kompaniyani tanlang'
            }),
            'tender_status': forms.Select(attrs={
                'class': 'form-control'
            }),
            'type': forms.Select(attrs={
                'class': 'form-control'
            }),
            'started_date': forms.DateInput(attrs={
                'class': 'form-control',
                'type': 'date'
            }),
            'end_date': forms.DateInput(attrs={
                'class': 'form-control',
                'type': 'date'
            }),
            'contract_amount': forms.NumberInput(attrs={
                'class': 'form-control',
                'placeholder': '0.00',
                'step': '0.01'
            }),
            'contract': forms.FileInput(attrs={
                'class': 'form-control',
                'accept': '.pdf,.doc,.docx'
            }),
            'comment': forms.Textarea(attrs={
                'class': 'form-control',
                'rows': 3,
                'placeholder': 'Qo\'shimcha izoh...'
            }),
            'first_sms': forms.CheckboxInput(attrs={
                'class': 'form-check-input'
            }),
            'last_month_sms': forms.CheckboxInput(attrs={
                'class': 'form-check-input'
            }),
            'last_sms': forms.CheckboxInput(attrs={
                'class': 'form-check-input'
            }),
            'is_active': forms.CheckboxInput(attrs={
                'class': 'form-check-input'
            })
        }
        labels = {
            'name': 'Xizmat nomi',
            'company': 'Kompaniya',
            'tender_status': 'Tender holati',
            'type': 'Xizmat turi',
            'started_date': 'Boshlangan sana',
            'end_date': 'Tugash sanasi',
            'contract_amount': 'Shartnoma summasi',
            'contract': 'Shartnoma fayli',
            'comment': 'Izoh',
            'first_sms': 'Birinchi SMS',
            'last_month_sms': 'Oxirgi oy SMS',
            'last_sms': 'Oxirgi SMS',
            'is_active': 'Faol'
        }
    
    def clean(self):
        cleaned_data = super().clean()
        started_date = cleaned_data.get('started_date')
        end_date = cleaned_data.get('end_date')
        
        if started_date and end_date:
            if end_date <= started_date:
                raise ValidationError('Tugash sanasi boshlangan sanadan keyin bo\'lishi kerak')
        
        return cleaned_data

class CompanyQuickForm(forms.ModelForm):
    """Tezkor kompaniya yaratish formasi"""
    
    class Meta:
        model = Company
        fields = ['name', 'stir', 'phone_number', 'comment']
        widgets = {
            'name': forms.TextInput(attrs={
                'class': 'form-control',
                'placeholder': 'Kompaniya nomi',
                'required': True
            }),
            'stir': forms.TextInput(attrs={
                'class': 'form-control',
                'placeholder': '123456789',
                'required': True
            }),
            'phone_number': forms.TextInput(attrs={
                'class': 'form-control',
                'placeholder': '+998 90 123 45 67'
            }),
            'address': forms.Textarea(attrs={
                'class': 'form-control',
                'rows': 2,
                'placeholder': 'Izoh'
            })
        }
        labels = {
            'name': 'Kompaniya nomi',
            'stir': 'STIR',
            'phone_number': 'Telefon',
            'address': 'Manzil'
        }
    
    def clean_stir(self):
        stir = self.cleaned_data.get('stir')
        if stir and len(stir) != 9:
            raise ValidationError('STIR 9 ta raqamdan iborat bo\'lishi kerak')
        
        # Mavjudligini tekshirish
        if Company.objects.filter(stir=stir).exists():
            raise ValidationError('Bu STIR bilan kompaniya allaqachon mavjud')
        
        return stir

# forms.py - Updated Income Form
class ServiceIncomeForm(forms.ModelForm):
    """Xizmat daromadi formasi"""
    
    STATUS_CHOICES = [
        ('received', 'Qabul qilingan'),
        ('pending', 'Kutilmoqda'),
        ('unpaid', "To'lanmagan"),
        ('partial', 'Qisman to\'langan'),
        ('cancelled', 'Bekor qilingan'),
    ]
    
    # Override status field to include cancelled option
    status = forms.ChoiceField(
        choices=STATUS_CHOICES,
        widget=forms.Select(attrs={'class': 'form-control'}),
        label='To\'lov holati'
    )
    
    class Meta:
        model = Income
        fields = ['amount', 'status', 'payment_method', 'payment_date', 'notes']
        widgets = {
            'amount': forms.NumberInput(attrs={
                'class': 'form-control',
                'placeholder': '0.00',
                'step': '0.01',
                'min': '0'
            }),
            'payment_method': forms.Select(attrs={
                'class': 'form-control'
            }),
            'payment_date': forms.DateInput(attrs={
                'class': 'form-control',
                'type': 'date'
            }),
            'notes': forms.Textarea(attrs={
                'class': 'form-control',
                'rows': 3,
                'placeholder': 'Qo\'shimcha izoh...'
            })
        }
        labels = {
            'amount': 'Miqdor (so\'m)',
            'payment_method': 'To\'lov usuli',
            'payment_date': 'To\'lov sanasi',
            'notes': 'Izoh'
        }
    
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        
        # Make payment_method and payment_date not required for certain statuses
        self.fields['payment_method'].required = False
        self.fields['payment_date'].required = False
    
    def clean(self):
        cleaned_data = super().clean()
        status = cleaned_data.get('status')
        payment_method = cleaned_data.get('payment_method')
        payment_date = cleaned_data.get('payment_date')
        
        # For received, unpaid, and partial statuses, payment method and date are required
        if status in ['received', 'unpaid', 'partial']:
            if not payment_method:
                raise ValidationError({
                    'payment_method': 'Bu holat uchun to\'lov usuli majburiy'
                })
            if not payment_date:
                raise ValidationError({
                    'payment_date': 'Bu holat uchun to\'lov sanasi majburiy'
                })
        
        return cleaned_data
    
    def clean_amount(self):
        amount = self.cleaned_data.get('amount')
        if amount and amount <= 0:
            raise ValidationError('Miqdor 0 dan katta bo\'lishi kerak')
        return amount

# forms.py

from django import forms
from django.forms.widgets import NumberInput, Select, DateInput, Textarea

class ServiceExpenseForm(forms.ModelForm):
    class Meta:
        model = Expenses
        fields = ['amount', 'category', 'date', 'payment_method', 'notes']
        widgets = {
            'amount': NumberInput(attrs={
                'class': 'form-control',
                'placeholder': 'Miqdorni kiriting',
                'step': '0.01',
                'min': '0'
            }),
            'category': Select(attrs={
                'class': 'form-control'
            }),
            'date': DateInput(attrs={
                'class': 'form-control',
                'type': 'date'
            }),
            'payment_method': Select(attrs={
                'class': 'form-control'
            }),
            'notes': Textarea(attrs={
                'class': 'form-control',
                'rows': 3,
                'placeholder': 'Xarajat haqida batafsil ma\'lumot...'
            })
        }
        labels = {
            'amount': 'Miqdor',
            'category': 'Kategoriya',
            'date': 'Sana',
            'payment_method': 'To\'lov usuli',
            'notes': 'Tavsif'
        }

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        
        # Category fieldini yangilash - soliq foizi bilan
        categories = ExpensesCategory.objects.filter(is_active=True).order_by('name')
        category_choices = [('', '--- Kategoriya tanlang ---')]
        
        for category in categories:
            tax_rate = float(category.tax_rate) if category.tax_rate is not None else 0.0
            label = f"{category.name} ({tax_rate}%)"
            category_choices.append((category.id, label))
        
        self.fields['category'].choices = category_choices
        
        # Required fieldlar
        self.fields['amount'].required = True
        self.fields['category'].required = True
        self.fields['date'].required = True
        
        # Field help texts
        self.fields['amount'].help_text = 'Xarajat miqdorini kiriting'
        self.fields['category'].help_text = 'Xarajat kategoriyasini tanlang'
        self.fields['date'].help_text = 'Xarajat sanasini kiriting'
        self.fields['payment_method'].help_text = 'To\'lov usulini tanlang (ixtiyoriy)'
        self.fields['notes'].help_text = 'Xarajat haqida qo\'shimcha ma\'lumot (ixtiyoriy)'

    def clean_amount(self):
        amount = self.cleaned_data.get('amount')
        if amount is not None and amount <= 0:
            raise forms.ValidationError('Miqdor 0 dan katta bo\'lishi kerak.')
        return amount

    def clean_date(self):
        from datetime import date
        expense_date = self.cleaned_data.get('date')
        if expense_date and expense_date > date.today():
            raise forms.ValidationError('Xarajat sanasi kelajakda bo\'lishi mumkin emas.')
        return expense_date

class ServiceFilterForm(forms.Form):
    """Xizmatlar filterlash formasi"""
    
    tender_status = forms.ChoiceField(
        choices=[('', 'Barcha holatlar')] + Service.TENDER_CHOICES,
        required=False,
        widget=forms.Select(attrs={
            'class': 'form-control'
        })
    )
    
    service_type = forms.ChoiceField(
        choices=[('', 'Barcha turlar')] + Service.TYPE_CHOICES,
        required=False,
        widget=forms.Select(attrs={
            'class': 'form-control'
        })
    )
    
    created_by = forms.ModelChoiceField(
        queryset=Employees.objects.filter(position__in=['admin', 'employee']),
        required=False,
        empty_label="Barcha xodimlar",
        widget=forms.Select(attrs={
            'class': 'form-control'
        })
    )
    
    payment_status = forms.ChoiceField(
        choices=[
            ('', 'Barcha to\'lovlar'),
            ('paid', 'To\'liq to\'langan'),
            ('partial', 'Qisman to\'langan'),
            ('unpaid', 'To\'lanmagan'),
        ],
        required=False,
        widget=forms.Select(attrs={
            'class': 'form-control'
        })
    )
    
    date_from = forms.DateField(
        required=False,
        widget=forms.DateInput(attrs={
            'class': 'form-control',
            'type': 'date'
        })
    )
    
    date_to = forms.DateField(
        required=False,
        widget=forms.DateInput(attrs={
            'class': 'form-control',
            'type': 'date'
        })
    )
    
    search = forms.CharField(
        required=False,
        widget=forms.TextInput(attrs={
            'class': 'form-control',
            'placeholder': 'Xizmat yoki kompaniya nomi, STIR...'
        })
    )



    # forms.py - SMS Management Forms
from django import forms
from .models import AdminSettings, Notification, Service


class AdminSettingsForm(forms.ModelForm):
    """Admin sozlamalari formasi"""
    
    class Meta:
        model = AdminSettings
        fields = ['first_message', 'last_month_message', 'last_message']
        widgets = {
            'first_message': forms.Textarea(attrs={
                'class': 'form-control',
                'rows': 4,
                'placeholder': 'Birinchi xabar matni...',
                'help_text': 'Template o\'zgaruvchilari: {company_name}, {service_name}, {end_date}'
            }),
            'last_month_message': forms.Textarea(attrs={
                'class': 'form-control',
                'rows': 4,
                'placeholder': 'Oxirgi oy xabari matni...',
                'help_text': 'Template o\'zgaruvchilari: {company_name}, {service_name}, {end_date}'
            }),
            'last_message': forms.Textarea(attrs={
                'class': 'form-control',
                'rows': 4,
                'placeholder': 'Oxirgi xabar matni...',
                'help_text': 'Template o\'zgaruvchilari: {company_name}, {service_name}, {end_date}'
            }),
        }
    
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        
        # Default xabarlar
        if not self.instance.pk:
            self.fields['first_message'].initial = "Hurmatli {company_name}, sizning '{service_name}' xizmatingingiz boshlandi. Tugash sanasi: {end_date}"
            self.fields['last_month_message'].initial = "Hurmatli {company_name}, sizning '{service_name}' xizmatingingiz tugashiga 1 oy qoldi. Tugash sanasi: {end_date}"
            self.fields['last_message'].initial = "Hurmatli {company_name}, sizning '{service_name}' xizmatingingiz tugadi. Hamkorlik uchun rahmat!"
        
        # Label va help textlarni o'rnatish
        self.fields['first_message'].help_text = "Xizmat boshlanishida yuboriladigan xabar"
        self.fields['last_month_message'].help_text = "Xizmat tugashiga 1 oy qolganda yuboriladigan xabar"
        self.fields['last_message'].help_text = "Xizmat tugagandan keyin yuboriladigan xabar"


class NotificationForm(forms.ModelForm):
    """Bildirishnoma formasi"""
    
    class Meta:
        model = Notification
        fields = ['service', 'message', 'type']
        widgets = {
            'service': forms.Select(attrs={
                'class': 'form-control select2',
                'placeholder': 'Xizmatni tanlang...'
            }),
            'message': forms.Textarea(attrs={
                'class': 'form-control',
                'rows': 5,
                'placeholder': 'Xabar matni...'
            }),
            'type': forms.Select(attrs={
                'class': 'form-control'
            }),
        }
    
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        
        # Service choices'ni optimizatsiya qilish
        self.fields['service'].queryset = Service.objects.select_related('company').filter(is_active=True)
        self.fields['service'].empty_label = "Xizmatni tanlang..."
        
        # Xabar turi bo'yicha default xabar o'rnatish
        if not self.instance.pk and 'type' in self.data:
            message_type = self.data.get('type')
            try:
                admin_settings = AdminSettings.objects.first()
                if admin_settings:
                    if message_type == 'first':
                        self.fields['message'].initial = admin_settings.first_message
                    elif message_type == 'last_month':
                        self.fields['message'].initial = admin_settings.last_month_message
                    elif message_type == 'last':
                        self.fields['message'].initial = admin_settings.last_message
            except AdminSettings.DoesNotExist:
                pass
    
    def clean_message(self):
        """Xabar validatsiyasi"""
        message = self.cleaned_data.get('message')
        if not message or len(message.strip()) < 10:
            raise forms.ValidationError('Xabar kamida 10 ta belgidan iborat bo\'lishi kerak.')
        
        if len(message) > 1000:
            raise forms.ValidationError('Xabar 1000 ta belgidan oshmasligi kerak.')
        
        return message.strip()
    
    def clean(self):
        """Form validatsiyasi"""
        cleaned_data = super().clean()
        service = cleaned_data.get('service')
        notification_type = cleaned_data.get('type')
        
        if service and notification_type:
            # Bir xil xizmat va tur uchun yuborilmagan bildirishnoma borligini tekshirish
            existing = Notification.objects.filter(
                service=service,
                type=notification_type,
                is_sent=False
            )
            
            if self.instance.pk:
                existing = existing.exclude(pk=self.instance.pk)
            
            if existing.exists():
                raise forms.ValidationError(
                    f"Bu xizmat uchun '{notification_type}' tipida yuborilmagan bildirishnoma allaqachon mavjud."
                )
        
        return cleaned_data


class BulkNotificationForm(forms.Form):
    """Ommaviy bildirishnoma formasi"""
    
    services = forms.ModelMultipleChoiceField(
        queryset=Service.objects.select_related('company').filter(is_active=True),
        widget=forms.CheckboxSelectMultiple(attrs={
            'class': 'form-check-input'
        }),
        label="Xizmatlar"
    )
    
    message_type = forms.ChoiceField(
        choices=Notification.TYPE_CHOICES,
        widget=forms.Select(attrs={
            'class': 'form-control'
        }),
        label="Xabar turi"
    )
    
    custom_message = forms.CharField(
        widget=forms.Textarea(attrs={
            'class': 'form-control',
            'rows': 5,
            'placeholder': 'Maxsus xabar matni (ixtiyoriy)...'
        }),
        required=False,
        label="Maxsus xabar"
    )
    
    def clean(self):
        """Form validatsiyasi"""
        cleaned_data = super().clean()
        services = cleaned_data.get('services')
        
        if not services:
            raise forms.ValidationError('Kamida bitta xizmat tanlanishi kerak.')
        
        if len(services) > 100:
            raise forms.ValidationError('Bir vaqtda maksimal 100 ta xizmatga xabar yuborish mumkin.')
        
        return cleaned_data


class MessagePreviewForm(forms.Form):
    """Xabar ko'rish formasi"""
    
    service = forms.ModelChoiceField(
        queryset=Service.objects.select_related('company').filter(is_active=True),
        widget=forms.Select(attrs={
            'class': 'form-control select2'
        }),
        label="Xizmat"
    )
    
    message_type = forms.ChoiceField(
        choices=Notification.TYPE_CHOICES,
        widget=forms.Select(attrs={
            'class': 'form-control'
        }),
        label="Xabar turi"
    )



class ExpensesCategoryForm(forms.ModelForm):
    """Xarajat kategoriyasi formasi"""
    
    class Meta:
        model = ExpensesCategory
        fields = ['name', 'tax_rate', 'is_active', 'notes']
        widgets = {
            'name': forms.TextInput(attrs={
                'class': 'form-control',
                'placeholder': 'Kategoriya nomini kiriting...',
                'maxlength': 255
            }),
            'tax_rate': forms.NumberInput(attrs={
                'class': 'form-control',
                'placeholder': '0',
                'min': 0,
                'max': 100,
                'step': 1
            }),
            'is_active': forms.CheckboxInput(attrs={
                'class': 'form-check-input'
            }),
            'notes': forms.Textarea(attrs={
                'class': 'form-control',
                'rows': 4,
                'placeholder': 'Kategoriya haqida qo\'shimcha ma\'lumot...'
            }),
        }
        labels = {
            'name': 'Kategoriya nomi',
            'tax_rate': 'Soliq foizi (%)',
            'is_active': 'Faol',
            'notes': 'Izoh'
        }
        help_texts = {
            'name': 'Kategoriya uchun tushunarli nom kiriting',
            'tax_rate': 'Bu kategoriya uchun soliq foizi (0-100%)',
            'is_active': 'Faol kategoriyalar yangi xarajatlarda ishlatiladi',
            'notes': 'Kategoriya haqida qo\'shimcha ma\'lumot (ixtiyoriy)'
        }
    
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        
        # Default values
        if not self.instance.pk:
            self.fields['is_active'].initial = True
            self.fields['tax_rate'].initial = 12  # Default tax rate
        
        # Required field styling
        self.fields['name'].widget.attrs['required'] = True
        
        # Custom styling for tax rate
        self.fields['tax_rate'].widget.attrs.update({
            'title': 'Soliq foizini 0 dan 100 gacha kiriting'
        })
    
    def clean_name(self):
        """Kategoriya nomini validatsiya qilish"""
        name = self.cleaned_data.get('name')
        if not name:
            raise forms.ValidationError('Kategoriya nomi kiritilishi shart!')
        
        name = name.strip()
        if len(name) < 2:
            raise forms.ValidationError('Kategoriya nomi kamida 2 ta belgidan iborat bo\'lishi kerak!')
        
        # Dublikat tekshirish
        existing = ExpensesCategory.objects.filter(name__iexact=name)
        if self.instance.pk:
            existing = existing.exclude(pk=self.instance.pk)
        
        if existing.exists():
            raise forms.ValidationError(f'"{name}" nomli kategoriya allaqachon mavjud!')
        
        return name
    
    def clean_tax_rate(self):
        """Soliq foizini validatsiya qilish"""
        tax_rate = self.cleaned_data.get('tax_rate')
        
        if tax_rate is None:
            return 0
        
        if tax_rate < 0:
            raise forms.ValidationError('Soliq foizi manfiy bo\'lishi mumkin emas!')
        
        if tax_rate > 100:
            raise forms.ValidationError('Soliq foizi 100% dan oshmasligi kerak!')
        
        return tax_rate
    
    def clean_notes(self):
        """Izohni validatsiya qilish"""
        notes = self.cleaned_data.get('notes')
        if notes:
            notes = notes.strip()
            if len(notes) > 1000:
                raise forms.ValidationError('Izoh 1000 ta belgidan oshmasligi kerak!')
        
        return notes or None


class ExpensesCategoryFilterForm(forms.Form):
    """Kategoriyalarni filtrlash formasi"""
    
    search = forms.CharField(
        max_length=255,
        required=False,
        widget=forms.TextInput(attrs={
            'class': 'form-control',
            'placeholder': 'Kategoriya nomi yoki izoh bo\'yicha qidiring...'
        }),
        label='Qidiruv'
    )
    
    is_active = forms.ChoiceField(
        choices=[
            ('', 'Barchasi'),
            ('true', 'Faol'),
            ('false', 'Nofaol')
        ],
        required=False,
        widget=forms.Select(attrs={
            'class': 'form-control'
        }),
        label='Holat'
    )
    
    tax_rate_min = forms.IntegerField(
        min_value=0,
        max_value=100,
        required=False,
        widget=forms.NumberInput(attrs={
            'class': 'form-control',
            'placeholder': 'Min %'
        }),
        label='Min soliq foizi'
    )
    
    tax_rate_max = forms.IntegerField(
        min_value=0,
        max_value=100,
        required=False,
        widget=forms.NumberInput(attrs={
            'class': 'form-control',
            'placeholder': 'Max %'
        }),
        label='Max soliq foizi'
    )
    
    def clean(self):
        """Cross-field validation"""
        cleaned_data = super().clean()
        tax_rate_min = cleaned_data.get('tax_rate_min')
        tax_rate_max = cleaned_data.get('tax_rate_max')
        
        if tax_rate_min is not None and tax_rate_max is not None:
            if tax_rate_min > tax_rate_max:
                raise forms.ValidationError(
                    'Minimal soliq foizi maksimaldan katta bo\'lishi mumkin emas!'
                )
        
        return cleaned_data


class BulkCategoryActionForm(forms.Form):
    """Ommaviy amallar formasi"""
    
    ACTION_CHOICES = [
        ('activate', 'Faollashtirish'),
        ('deactivate', 'Nofaollashtirish'),
        ('set_tax_rate', 'Soliq foizini o\'rnatish'),
        ('delete', 'O\'chirish')
    ]
    
    action = forms.ChoiceField(
        choices=ACTION_CHOICES,
        widget=forms.Select(attrs={
            'class': 'form-control'
        }),
        label='Amal'
    )
    
    tax_rate = forms.IntegerField(
        min_value=0,
        max_value=100,
        required=False,
        widget=forms.NumberInput(attrs={
            'class': 'form-control',
            'placeholder': 'Yangi soliq foizi...'
        }),
        label='Soliq foizi'
    )
    
    category_ids = forms.CharField(
        widget=forms.HiddenInput(),
        label='Tanlangan kategoriyalar'
    )
    
    def clean(self):
        """Form validation"""
        cleaned_data = super().clean()
        action = cleaned_data.get('action')
        tax_rate = cleaned_data.get('tax_rate')
        category_ids = cleaned_data.get('category_ids')
        
        if not category_ids:
            raise forms.ValidationError('Hech qanday kategoriya tanlanmagan!')
        
        if action == 'set_tax_rate' and tax_rate is None:
            raise forms.ValidationError('Soliq foizini kiritish kerak!')
        
        # Convert category_ids to list
        try:
            category_list = [int(id.strip()) for id in category_ids.split(',') if id.strip()]
            if not category_list:
                raise forms.ValidationError('Hech qanday kategoriya tanlanmagan!')
            cleaned_data['category_list'] = category_list
        except ValueError:
            raise forms.ValidationError('Noto\'g\'ri kategoriya ID\'lari!')
        
        return cleaned_data
    


class ExpenseForm(forms.ModelForm):
    EXPENSE_TYPE_CHOICES = [
        ('', 'Xarajat turini tanlang'),
        ('monthly', 'Oylik xarajat'),
        ('service', 'Xizmat xarajati'),
        ('company', 'Kompaniya xarajati'),
    ]
    
    expense_type = forms.ChoiceField(
        choices=EXPENSE_TYPE_CHOICES,
        required=True,
        widget=forms.Select(attrs={
            'class': 'form-control',
            'id': 'expense_type'
        }),
        label='Xarajat turi'
    )
    
    class Meta:
        model = Expenses
        fields = [
            'title', 'amount', 'date', 'category', 
            'payment_method', 'service', 'employee', 'notes'
        ]
        
        widgets = {
            'title': forms.TextInput(attrs={
                'class': 'form-control',
                'placeholder': 'Xarajat nomi'
            }),
            'amount': forms.NumberInput(attrs={
                'class': 'form-control',
                'placeholder': '0.00',
                'step': '0.01',
                'id': 'base_amount'
            }),
            'date': forms.DateInput(attrs={
                'class': 'form-control',
                'type': 'date'
            }),
            'category': forms.Select(attrs={
                'class': 'form-control',
                'id': 'category_select'
            }),
            'payment_method': forms.Select(attrs={
                'class': 'form-control'
            }),
            'service': forms.Select(attrs={
                'class': 'form-control service-select',
                'style': 'display: none;'
            }),
            'employee': forms.Select(attrs={
                'class': 'form-control employee-select',
                'style': 'display: none;'
            }),
            'notes': forms.Textarea(attrs={
                'class': 'form-control',
                'rows': 3,
                'placeholder': 'Qo\'shimcha izoh...'
            }),
        }
        
        labels = {
            'title': 'Xarajat nomi',
            'amount': 'Miqdor (so\'m)',
            'date': 'Sana',
            'category': 'Kategoriya',
            'payment_method': 'To\'lov usuli',
            'service': 'Xizmat',
            'employee': 'Xodim',
            'notes': 'Izoh',
        }
    
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        
        # Select2 uchun empty option
        self.fields['service'].queryset = Service.objects.filter(is_active=True)
        self.fields['employee'].queryset = Employees.objects.filter(is_active=True)
        
        # Required maydonlarni sozlash
        self.fields['service'].required = False
        self.fields['employee'].required = False
        
        # Instance mavjud bo'lsa, expense_type ni aniqlash
        if self.instance and self.instance.pk:
            if self.instance.employee and not self.instance.service:
                self.fields['expense_type'].initial = 'monthly'
            elif self.instance.service:
                self.fields['expense_type'].initial = 'service'
            else:
                self.fields['expense_type'].initial = 'company'
    
    def clean(self):
        cleaned_data = super().clean()
        expense_type = cleaned_data.get('expense_type')
        service = cleaned_data.get('service')
        employee = cleaned_data.get('employee')
        
        if expense_type == 'monthly':
            if not employee:
                raise ValidationError('Oylik xarajat uchun xodim tanlanishi kerak!')
            cleaned_data['service'] = None
            
        elif expense_type == 'service':
            if not service:
                raise ValidationError('Xizmat xarajati uchun xizmat tanlanishi kerak!')
            cleaned_data['employee'] = None
            
        elif expense_type == 'company':
            cleaned_data['service'] = None
            cleaned_data['employee'] = None
        
        return cleaned_data

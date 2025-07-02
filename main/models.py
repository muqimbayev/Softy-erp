from django.db import models
from django.contrib.auth.models import User
from django.core.validators import RegexValidator
from django.contrib.auth.hashers import make_password, check_password


# models.py - Employee modeliga password maydoni


class Employees(models.Model):
    TYPE_CHOICES = [
        ('admin', 'Rahbar'),
        ('employee', 'Xodim'),
        ('accounted', 'Bugalter'),
    ]
    
    user = models.OneToOneField(User, on_delete=models.CASCADE, null=True, blank=True)
    
    first_name = models.CharField(max_length=255, verbose_name="Ism")
    last_name = models.CharField(max_length=255, blank=True, null=True, verbose_name="Familiya")
    
    phone_regex = RegexValidator(
        regex=r'^\+?998[0-9]{9}$',
        message="Telefon raqam formati: +998901234567"
    )
    phone_number = models.CharField(
        validators=[phone_regex], 
        max_length=17, 
        unique=True,
        verbose_name="Telefon raqam"
    )
    
    # To'g'ridan-to'g'ri password maydoni
    password = models.CharField(
        max_length=128, 
        verbose_name="Parol",
        help_text="Xodim login uchun paroli"
    )
    
    position = models.CharField(
        max_length=50, 
        choices=TYPE_CHOICES,
        verbose_name="Lavozim"
    )
    
    created_date = models.DateTimeField(auto_now_add=True, verbose_name="Yaratilgan sana")
    hire_date = models.DateField(verbose_name="Ishga olingan sana")
    is_active = models.BooleanField(default=True, verbose_name="Faol")
    salary = models.DecimalField(max_digits=12, decimal_places=2, blank=True, null=True, verbose_name="Maosh")

    def save(self, *args, **kwargs):
        """Employee saqlashda avtomatik User yaratish/yangilash"""
        created = self.pk is None  # Yangi Employee ekanligini tekshirish
        
        # Telefon raqamni normalize qilish
        phone_clean = self.phone_number.replace('+', '').replace(' ', '').replace('(', '').replace(')', '').replace('-', '')
        
        # Parolni hash qilish (agar oddiy matn bo'lsa)
        if self.password and not self.password.startswith('pbkdf2_'):
            self.password = make_password(self.password)
        
        # User yaratish yoki yangilash
        if created or not self.user:
            # Mavjud User'ni tekshirish
            existing_user = User.objects.filter(username=phone_clean).first()
            
            if existing_user:
                self.user = existing_user
            else:
                # Yangi User yaratish
                user = User.objects.create_user(
                    username=phone_clean,
                    first_name=self.first_name,
                    last_name=self.last_name or '',
                    password=None,  # Password Employee'da saqlanadi
                    is_active=self.is_active
                )
                self.user = user
        
        # User ma'lumotlarini yangilash
        if self.user:
            self.user.first_name = self.first_name
            self.user.last_name = self.last_name or ''
            self.user.is_active = self.is_active
            
            # Admin huquqlari
            if self.position == 'admin':
                self.user.is_staff = True
                self.user.is_superuser = True
            else:
                self.user.is_staff = False
                self.user.is_superuser = False
            
            # Employee'dagi parolni User'ga ko'chirish
            if self.password:
                self.user.password = self.password
            
            self.user.save()
        
        super().save(*args, **kwargs)

    def set_password(self, raw_password):
        """Parol o'rnatish"""
        self.password = make_password(raw_password)
        if self.user:
            self.user.set_password(raw_password)
            self.user.save()

    def check_password(self, raw_password):
        """Parolni tekshirish"""
        return check_password(raw_password, self.password)

    def get_phone_clean(self):
        """Toza telefon raqam"""
        return self.phone_number.replace('+', '').replace(' ', '').replace('(', '').replace(')', '').replace('-', '')

    def __str__(self):
        return f"{self.first_name} {self.last_name or ''}".strip()

    class Meta:
        verbose_name = "Xodim"
        verbose_name_plural = "Xodimlar"
        ordering = ['-created_date']

class Company(models.Model):
    name = models.CharField(max_length=255, verbose_name="Nomi")
    stir = models.CharField(max_length=9, unique=True, help_text="STIR raqami (9 raqam)")
    full_name = models.CharField(max_length=500, blank=True, null=True, verbose_name="Xodiminin ism familyasi")
    
    phone_regex = RegexValidator(
        regex=r'^\+?998[0-9]{9}$',
        message="Telefon raqam formati: +998901234567"
    )
    phone_number = models.CharField(
        validators=[phone_regex], 
        max_length=17, 
        blank=True, 
        null=True,
        verbose_name="Telefon raqam"
    )
    
    email = models.EmailField(blank=True, null=True, verbose_name="Email")
        
    created_date = models.DateTimeField(auto_now_add=True, verbose_name="Yaratilgan sana")
    update_date = models.DateTimeField(auto_now=True, verbose_name="Yangilangan sana")
    comment = models.TextField(blank=True, null=True, verbose_name="Izoh")
    created_by = models.ForeignKey(
        Employees, 
        on_delete=models.SET_NULL, 
        null=True,
        related_name='created_companies',
        verbose_name="Yaratgan"
    )
    updated_by = models.ForeignKey(
        Employees, 
        on_delete=models.SET_NULL, 
        null=True,
        blank=True,
        related_name='updated_companies',
        verbose_name="Yangilagan"
    )

    def __str__(self):
        return self.name

    class Meta:
        verbose_name = "Kompaniya"
        verbose_name_plural = "Kompaniyalar"
        ordering = ['-created_date']


class Service(models.Model):
    TENDER_CHOICES = [
        ('won', 'Yutgan'),
        ('lost', 'Yutqazgan'),
        ('canceled', 'Bekor qilingan'),
        ('not_participating', 'Qatnashmagan'),
    ]
    
    TYPE_CHOICES = [
        ('contract', 'Shartnoma'),
        ('xt_xarid', 'XT-xarid'),
        ('xarid_uzex', 'xarid.uzex'),
    ]

    name = models.CharField(max_length=255, verbose_name="Nomi")
    company = models.ForeignKey(
        Company, 
        on_delete=models.CASCADE, 
        related_name='services',
        verbose_name="Kompaniya"
    )
    tender_status = models.CharField(
        max_length=20, 
        choices=TENDER_CHOICES, 
        default='in_progress',
        verbose_name="Tender holati"
    )
    type = models.CharField(max_length=50, choices=TYPE_CHOICES, verbose_name="Turi")
    
    started_date = models.DateField(verbose_name="Boshlangan sana", null=True, blank=True)
    end_date = models.DateField(blank=True, null=True, verbose_name="Tugash sanasi")
    
    contract_amount = models.DecimalField(
        max_digits=15, 
        decimal_places=2, 
        null=True, 
        blank=True,
        verbose_name="Shartnoma summasi"
    )
    
    contract = models.FileField(
        upload_to='contracts/%Y/%m/', 
        help_text="Shartnoma fayli",
        blank=True,
        null=True,
        verbose_name="Shartnoma fayli"
    )
    
    comment = models.TextField(blank=True, null=True, verbose_name="Izoh")
    is_active = models.BooleanField(default=True, verbose_name="Faol")
    
    created_by = models.ForeignKey(
        Employees, 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True, 
        related_name='created_services',
        verbose_name="Yaratgan"
    )
    updated_by = models.ForeignKey(
        Employees, 
        on_delete=models.SET_NULL, 
        null=True,
        blank=True,
        related_name='updated_services',
        verbose_name="Yangilagan"
    )
    
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="Yaratilgan vaqt")
    updated_at = models.DateTimeField(auto_now=True, verbose_name="Yangilangan vaqt")
    
    first_sms = models.BooleanField(default=True, verbose_name="Birinchi SMS")
    last_month_sms = models.BooleanField(default=True, verbose_name="Oxirgi oy SMS")
    last_sms = models.BooleanField(default=True, verbose_name="Oxirgi SMS")

    def __str__(self):
        return f"{self.name} - {self.company.name}"

    def get_total_income(self):
        """Umumiy daromadni hisoblash"""
        return self.incomes.filter(status='received').aggregate(
            total=models.Sum('amount')
        )['total'] or 0

    def get_total_expenses(self):
        """Umumiy xarajatni hisoblash"""
        return self.expenses.aggregate(
            total=models.Sum('amount')
        )['total'] or 0

    def get_profit(self):
        """Foyda hisoblash"""
        return self.get_total_income() - self.get_total_expenses()

    class Meta:
        verbose_name = "Xizmat"
        verbose_name_plural = "Xizmatlar"
        ordering = ['-created_at']


class ServiceStatus(models.Model): 
    SERVICE_STATUS_CHOICES = [  
        ('expected', 'Kutilmoqda'),
        ('preparing', 'Tayorlanmoqda'),
        ('delivering', 'Yetkazilmoqda'),
        ('submitted', 'Topshirilgan'), 
    ]

    service = models.ForeignKey(  
        Service, 
        on_delete=models.CASCADE,
        related_name='status_history',
        verbose_name="Xizmat"
    )
    service_status = models.CharField(
        max_length=20, 
        choices=SERVICE_STATUS_CHOICES, 
        default='expected',
        verbose_name="Xizmat holati"
    )
    date = models.DateTimeField(auto_now_add=True, verbose_name="Sana")  
    updated_by = models.ForeignKey(
        Employees, 
        on_delete=models.SET_NULL,
        null=True,
        verbose_name="Yangilagan"
    )
    notes = models.TextField(blank=True, null=True, verbose_name="Izoh")

    def __str__(self):
        return f"{self.service.name} - {self.get_service_status_display()}"

    class Meta:
        verbose_name = "Xizmat holati"
        verbose_name_plural = "Xizmat holatlari"
        ordering = ['-date']


class Notification(models.Model):
    TYPE_CHOICES = [
        ('first', 'Birinchi xabar'),
        ('last_month', 'Oxirgi oy xabari'),
        ('last', 'Songi xabar'),
    ]

    service = models.ForeignKey(
        Service, 
        on_delete=models.CASCADE, 
        related_name='notifications',
        verbose_name="Xizmat"
    )
    message = models.TextField(verbose_name="Xabar")
    type = models.CharField(
        max_length=20, 
        choices=TYPE_CHOICES, 
        default='first',
        verbose_name="Turi"
    )
    date = models.DateTimeField(auto_now_add=True, verbose_name="Sana")  
    is_sent = models.BooleanField(default=False, verbose_name="Yuborildi")
    sent_date = models.DateTimeField(null=True, blank=True, verbose_name="Yuborilgan sana")

    def __str__(self):
        return f"{self.get_type_display()}: {self.message[:50]}..."

    class Meta:
        verbose_name = "Bildirishnoma"
        verbose_name_plural = "Bildirishnomalar"
        ordering = ['-date']


class Income(models.Model):
    STATUS_CHOICES = [
        ('received', 'Qabul qilingan'),
        ('pending', 'Kutilmoqda'),
        ('partial', 'Qisman to\'langan'), 
    ]
    
    PAYMENT_METHOD_CHOICES = [
        ('cash', 'Naqd'),
        ('card', 'Karta'),
        ('transfer', 'O\'tkazma'),
    ]

    company = models.ForeignKey(
        Company, 
        on_delete=models.CASCADE, 
        related_name='incomes',
        verbose_name="Kompaniya"
    )
    service = models.ForeignKey(
        Service, 
        on_delete=models.CASCADE, 
        related_name='incomes',
        verbose_name="Xizmat"
    )
    
    amount = models.DecimalField(
        max_digits=15, 
        decimal_places=2,
        verbose_name="Miqdor"
    )
    
    status = models.CharField(
        max_length=20, 
        choices=STATUS_CHOICES, 
        default='pending',
        verbose_name="Holat"
    )
    payment_method = models.CharField(
        max_length=20, 
        choices=PAYMENT_METHOD_CHOICES,
        verbose_name="To'lov usuli"
    )
    payment_date = models.DateField(verbose_name="To'lov sanasi")
    notes = models.TextField(blank=True, null=True, verbose_name="Izoh")
    
    update_date = models.DateTimeField(auto_now=True, verbose_name="Yangilangan sana")
    created_date = models.DateTimeField(auto_now_add=True, verbose_name="Yaratilgan sana")
    
    taxes = models.DecimalField(
        max_digits=10, 
        decimal_places=2, 
        default=0,
        verbose_name="Soliq"
    )
    
    created_by = models.ForeignKey(
        Employees, 
        on_delete=models.SET_NULL, 
        null=True,
        related_name='created_incomes',
        verbose_name="Yaratgan"
    )
    updated_by = models.ForeignKey(
        Employees, 
        on_delete=models.SET_NULL, 
        null=True,
        blank=True,
        related_name='updated_incomes',
        verbose_name="Yangilagan"
    )

    def __str__(self):
        return f"{self.company.name} - {self.amount:,} so'm"

    class Meta:
        verbose_name = "Daromad"
        verbose_name_plural = "Daromadlar"
        ordering = ['-payment_date']


class ExpensesCategory(models.Model):
    name = models.CharField(max_length=255, verbose_name="Nomi")
    is_active = models.BooleanField(default=True, verbose_name="Faol")
    created_date = models.DateTimeField(auto_now_add=True, verbose_name="Yaratilgan sana")
    tax_rate = models.IntegerField(default=0)
    notes = models.TextField(blank=True, null=True, verbose_name="Izoh")  # TextField

    def __str__(self):
        return self.name

    class Meta:
        verbose_name = "Xarajat kategoriyasi"
        verbose_name_plural = "Xarajat kategoriyalari"
        ordering = ['name']


class Expenses(models.Model):
    PAYMENT_METHOD_CHOICES = [
        ('cash', 'Naqd'),
        ('card', 'Karta'),
        ('transfer', 'O\'tkazma'),
        ('check', 'Chek'),
    ]

    service = models.ForeignKey(
        Service, 
        on_delete=models.CASCADE, 
        related_name='expenses', 
        help_text="Loyiha/Xizmat",
        verbose_name="Xizmat",
        null=True
    )
    employee = models.ForeignKey(
        Employees, 
        on_delete=models.CASCADE, 
        related_name='expenses',
        verbose_name="Xodim",
        null=True
    )
    title = models.CharField(max_length=255, verbose_name="Sarlavha")  
    
    amount = models.DecimalField(
        max_digits=12, 
        decimal_places=2,
        verbose_name="Miqdor"
    )


    
    date = models.DateField(verbose_name="Sana")
    category = models.ForeignKey(
        ExpensesCategory, 
        on_delete=models.CASCADE, 
        related_name='expenses',
        verbose_name="Kategoriya"
    )
    payment_method = models.CharField(
        max_length=20, 
        choices=PAYMENT_METHOD_CHOICES,
        verbose_name="To'lov usuli"
    )
    created_by = models.ForeignKey(
        Employees, 
        on_delete=models.SET_NULL, 
        null=True,
        related_name='created_expenses',
        verbose_name="Yaratgan"
    )
    notes = models.TextField(blank=True, null=True, verbose_name="Izoh")

    
    created_date = models.DateTimeField(auto_now_add=True, verbose_name="Yaratilgan sana")

    def __str__(self):
        return f"{self.title} - {self.amount:,} so'm"

    class Meta:
        verbose_name = "Xarajat"
        verbose_name_plural = "Xarajatlar"
        ordering = ['-date']


class AdminSettings(models.Model):  
    first_message = models.TextField(verbose_name="Birinchi xabar")
    last_month_message = models.TextField(verbose_name="Oxirgi oy xabari")
    last_message = models.TextField(verbose_name="Oxirgi xabar")
    
    created_date = models.DateTimeField(auto_now_add=True, verbose_name="Yaratilgan sana")
    updated_date = models.DateTimeField(auto_now=True, verbose_name="Yangilangan sana")
    
    class Meta:
        verbose_name = "Admin sozlamalari"
        verbose_name_plural = "Admin sozlamalari"

    def save(self, *args, **kwargs):
        if not self.pk and AdminSettings.objects.exists():
            raise Exception("Faqat bitta admin sozlamasi bo'lishi mumkin")
        return super().save(*args, **kwargs)

    def __str__(self):
        return f"Admin sozlamalari - {self.created_date.strftime('%d.%m.%Y')}"
from django.contrib import admin
from .models import *
# Register your models here.
admin.site.register(Employees)
admin.site.register(Company)
admin.site.register(Service)
admin.site.register(Income)
admin.site.register(Expenses)
admin.site.register(ExpensesCategory)
admin.site.register(Notification)





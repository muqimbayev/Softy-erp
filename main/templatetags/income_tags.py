# templatetags/income_tags.py - Template uchun permission check
from django import template
from ..models import Employees

register = template.Library()

@register.simple_tag
def can_edit_income(user):
    """Foydalanuvchi income edit qila oladimi?"""
    try:
        employee = user.employees
        return employee.position in ['admin', 'accounting']
    except Employees.DoesNotExist:
        return False

@register.filter
def has_income_permission(user):
    """Template filter sifatida ishlatish uchun"""
    try:
        employee = user.employees
        return employee.position in ['admin', 'accounting']
    except Employees.DoesNotExist:
        return False
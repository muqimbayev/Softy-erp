# templatetags/math_filters.py
from django import template
from decimal import Decimal, InvalidOperation

register = template.Library()

@register.filter
def mul(value, arg):
    """Multiply filter"""
    try:
        return float(value) * float(arg)
    except (ValueError, TypeError):
        return 0

@register.filter  
def div(value, arg):
    """Divide filter"""
    try:
        if float(arg) == 0:
            return 0
        return float(value) / float(arg)
    except (ValueError, TypeError, ZeroDivisionError):
        return 0

@register.filter
def sub(value, arg):
    """Subtract filter"""
    try:
        return float(value) - float(arg)
    except (ValueError, TypeError):
        return 0

@register.filter
def add_decimal(value, arg):
    """Add two decimal values"""
    try:
        return Decimal(str(value)) + Decimal(str(arg))
    except (ValueError, TypeError, InvalidOperation):
        return 0

@register.filter
def percentage(value, total):
    """Calculate percentage"""
    try:
        if float(total) == 0:
            return 0
        return (float(value) / float(total)) * 100
    except (ValueError, TypeError, ZeroDivisionError):
        return 0

@register.filter
def currency_format(value):
    """Format as currency"""
    try:
        return f"{float(value):,.0f} so'm"
    except (ValueError, TypeError):
        return "0 so'm"

@register.filter
def abs_value(value):
    """Absolute value"""
    try:
        return abs(float(value))
    except (ValueError, TypeError):
        return 0
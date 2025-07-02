# main/templatetags/dashboard_filters.py
# Bu fayl yarating: main/templatetags/ papkasida

from django import template

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
    except (ValueError, TypeError):
        return 0

@register.filter
def format_currency(value):
    """Format currency"""
    try:
        return f"{int(value):,} so'm".replace(',', ' ')
    except (ValueError, TypeError):
        return "0 so'm"

@register.filter
def percentage(value, total):
    """Calculate percentage"""
    try:
        if float(total) == 0:
            return 0
        return round((float(value) / float(total)) * 100, 1)
    except (ValueError, TypeError):
        return 0
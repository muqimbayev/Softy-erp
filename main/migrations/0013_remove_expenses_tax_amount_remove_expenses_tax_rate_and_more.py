# Generated by Django 5.1.1 on 2025-07-01 03:21

from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ("main", "0012_expenses_tax_amount_expenses_tax_rate_and_more"),
    ]

    operations = [
        migrations.RemoveField(
            model_name="expenses",
            name="tax_amount",
        ),
        migrations.RemoveField(
            model_name="expenses",
            name="tax_rate",
        ),
        migrations.RemoveField(
            model_name="expenses",
            name="total_amount",
        ),
    ]

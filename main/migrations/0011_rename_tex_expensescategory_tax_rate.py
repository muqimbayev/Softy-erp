# Generated by Django 5.1.1 on 2025-06-30 15:18

from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ("main", "0010_expensescategory_tex"),
    ]

    operations = [
        migrations.RenameField(
            model_name="expensescategory",
            old_name="tex",
            new_name="tax_rate",
        ),
    ]

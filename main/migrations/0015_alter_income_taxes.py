# Generated by Django 4.2.7 on 2025-07-02 08:55

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('main', '0014_remove_adminsettings_tax_amount'),
    ]

    operations = [
        migrations.AlterField(
            model_name='income',
            name='taxes',
            field=models.DecimalField(decimal_places=2, default=0, max_digits=10, verbose_name='Soliq'),
        ),
    ]

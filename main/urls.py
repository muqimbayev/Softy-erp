from django.urls import path
from . import views
from .views import employee
from .views import company
from .views import service
from .views import analitika
from .views import sms_mng
from .views import category_mng
from .views import expiring
from .views import moliya



app_name = 'main'
#main
urlpatterns = [
    # path('', views.dashboard, name='dashboard'),
    # path('profile/', views.profile, name='profile'),
    path('logout/', views.custom_logout, name='logout')
    
]
#admin
urlpatterns += [
    path('', views.custom_login, name='login'),
    path('dashboard/', views.dashboard, name='dashboard'),
    path('api/stats/', views.dashboard_stats_api, name='dashboard_stats'),
    path('api/charts/', views.dashboard_chart_data_api, name='dashboard_charts'),
]

#employee
urlpatterns +=[    
    # Employee URLs
    path('employees/add/', employee.employee_add, name='employee_add'),  # Yangi qo'shildi
    path('employees/', employee.employee_list, name='employee_list'),
    path('employees/<int:employee_id>/', employee.employee_detail, name='employee_detail'),
    path('employees/<int:employee_id>/edit/', employee.employee_edit, name='employee_edit'),
    path('employees/<int:employee_id>/password/', employee.employee_password_change, name='employee_password_change'),
]

#Company
urlpatterns += [

    path('companies/', company.company_list, name='company_list'),
    path('companies/add/', company.company_add, name='company_add'),
    path('companies/<int:company_id>/', company.company_detail, name='company_detail'),
    path('companies/<int:company_id>/edit/', company.company_edit, name='company_edit'),
]

#Service
urlpatterns += [
    
    # Services URLs
    path('services/', service.service_list, name='service_list'),
    path('services/<int:service_id>/', service.service_detail, name='service_detail'),
    path('services/<int:service_id>/edit/', service.service_edit, name='service_edit'),
    path('services/<int:service_id>/delete/', service.service_delete, name='service_delete'),
    
    # Income & Expenses for Services
    path('services/create/<int:company_id>/', service.service_create, name='service_create_with_company'),
    path('services/<int:service_id>/income/add/', service.service_income_add, name='service_income_add'),
    path('services/<int:service_id>/expense/add/', service.service_expense_add, name='service_expense_add'),
    path('income/<int:income_id>/edit/', service.income_edit, name='income_edit'),
    path('income/<int:income_id>/delete/', service.income_delete, name='income_delete'),
    path('expense/<int:expense_id>/edit/', service.expense_edit, name='expense_edit'),
    path('expense/<int:expense_id>/delete/', service.expense_delete, name='expense_delete'),
    
    # AJAX endpoints
    path('api/companies/search/', service.company_search_api, name='company_search_api'),
    path('api/companies/create/', service.company_create_api, name='company_create_api'),
    path('ajax/company-search/', service.company_search_ajax, name='company_search_ajax'),

    #expiring
    path('expiring/', expiring.expiring_services, name='expiring_list'),
    # path('api/expiring-data/', expiring.get_expiring_services_data, name='expiring_data'),
    # path('api/expiring-stats/', views.expiring_services_stats, name='expiring_stats'),
    

    
]

urlpatterns += [
    # Main analytics dashboard
    path('', analitika.analytics_dashboard, name='analytics'),
    path('analytics/', analitika.analytics_dashboard, name='analytics'),
    
    # API endpoints for AJAX requests
    path('api/dashboard-stats/', analitika.get_dashboard_stats, name='dashboard_stats'),
    path('api/monthly-chart-data/', analitika.get_monthly_chart_data, name='monthly_chart_data'),
    path('api/service-status-chart/', analitika.get_service_status_chart, name='service_status_chart'),
    path('api/tender-status-chart/', analitika.get_tender_status_chart, name='tender_status_chart'),
    path('api/service-type-chart/', analitika.get_service_type_chart, name='service_type_chart'),
    path('api/tender-success-rate/', analitika.get_tender_success_rate, name='tender_success_rate'),
    path('api/expenses-by-category/', analitika.get_expenses_by_category, name='expenses_by_category'),
    path('api/top-companies/', analitika.get_top_companies, name='top_companies'),
    path('api/employee-performance/', analitika.get_employee_performance, name='employee_performance'),
    path('api/export-analytics-data/', analitika.export_analytics_data, name='export_analytics_data'),
    
    # Financial reports
    path('financial-report/', analitika.financial_report, name='financial_report'),
]



urlpatterns += [
    # SMS Settings
    path('settings/', sms_mng.sms_settings_list, name='settings_list'),
    path('settings/edit/', sms_mng.sms_settings_edit, name='settings_edit'),
    
    # Notifications CRUD
    path('notifications/', sms_mng.notification_list, name='notification_list'),
    path('notifications/create/', sms_mng.notification_create, name='notification_create'),
    path('notifications/<int:pk>/edit/', sms_mng.notification_edit, name='notification_edit'),
    path('notifications/<int:pk>/delete/', sms_mng.notification_delete, name='notification_delete'),
    
    # Notification Actions
    path('notifications/<int:pk>/send/', sms_mng.send_notification, name='send_notification'),
    path('notifications/bulk-send/', sms_mng.bulk_send_notifications, name='bulk_send_notifications'),
    
    # Statistics and Reports
    path('stats/', sms_mng.notification_stats, name='notification_stats'),
    
    # AJAX endpoints
    path('preview-message/', sms_mng.preview_message, name='preview_message'),
]



urlpatterns += [
    # List and CRUD operations
    path('category/', category_mng.expenses_category_list, name='category_list'),
    path('category/create/', category_mng.expenses_category_create, name='category_create'),
    path('category/<int:pk>/', category_mng.expenses_category_detail, name='category_detail'),
    path('category/<int:pk>/edit/', category_mng.expenses_category_edit, name='category_edit'),
    path('category/<int:pk>/delete/', category_mng.expenses_category_delete, name='category_delete'),
    
    path('category/<int:pk>/toggle-status/', category_mng.expenses_category_toggle_status, name='toggle_status'),
    
    # Reports and exports
    path('category/stats/', category_mng.expenses_category_stats, name='stats'),
    path('category/export/', category_mng.expenses_category_export, name='export'),
]



urlpatterns += [
    # Expenses URLs
    path('expenses/', moliya.expenses_list, name='expenses_list'),
    path('expenses/create/', moliya.expense_create, name='expense_create'),
    path('expenses/<int:pk>/', moliya.expense_detail, name='expense_detail'),
    path('expenses/<int:pk>/edit/', moliya.expense_edit, name='expense_edit'),
    path('expenses/<int:pk>/delete/', moliya.expense_delete, name='expense_delete'),
    
    # AJAX URLs
    path('ajax/category-tax/', moliya.get_category_tax, name='get_category_tax'),
    path('ajax/search-employees/', moliya.search_employees, name='search_employees'),
    path('ajax/search-services/', moliya.search_services, name='search_services'),
    
    # Reports
    
]
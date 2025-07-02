# config/urls.py - Main URLs

from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
#     # App URLs
#     path('accounting/', include('accounting.urls')),
#     path('employees/', include('employees.urls')),
#     path('main/', include('main.urls')),
# ]
urlpatterns = [
    path('admin/', admin.site.urls),
    path('', include('main.urls', namespace='main')),  # namespace MUHIM
]

# Static va Media fayllar uchun
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)


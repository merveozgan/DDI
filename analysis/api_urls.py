from django.urls import path

from . import views

urlpatterns = [
    path('health/', views.health, name='api-health'),
    # API_SPEC.md: GET /api/drugs/ ve POST /api/predict/ 2-3. haftalarda eklenecek.
]

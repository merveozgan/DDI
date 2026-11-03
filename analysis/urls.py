from django.urls import path

from . import views

app_name = 'analysis'

urlpatterns = [
    path('ilaclar/', views.drugs, name='drugs'),
    path('ilaclar/<str:drug_id>/', views.drug_detail, name='drug_detail'),
    path('analiz/', views.analysis_page, name='analysis'),
    path('sonuclar/', views.results, name='results'),
    path('gecmis/', views.history, name='history'),
]
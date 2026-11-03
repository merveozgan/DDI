from django.shortcuts import render
from rest_framework.decorators import api_view
from rest_framework.response import Response

def drugs(request):
    return render(request, 'analysis/drugs.html')

def drug_detail(request, drug_id):
    return render(request, 'analysis/drug_detail.html', {'drug_id': drug_id})

def analysis_page(request):
    return render(request, 'analysis/analysis.html')

def results(request):
    return render(request, 'analysis/results.html')

def history(request):
    return render(request, 'analysis/history.html')

@api_view(['GET'])
def health(request):
    """Sunucu ve REST Framework ayarlarinin calistigini dogrular."""
    return Response({'status': 'ok', 'api_version': 'v0.1'})

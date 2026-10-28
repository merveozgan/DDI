from django.shortcuts import render
from rest_framework.decorators import api_view
from rest_framework.response import Response


def analysis_page(request):
    return render(request, 'analysis/analysis.html')


@api_view(['GET'])
def health(request):
    """Sunucu ve REST Framework ayarlarinin calistigini dogrular."""
    return Response({'status': 'ok', 'api_version': 'v0.1'})

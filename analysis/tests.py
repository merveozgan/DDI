from django.test import TestCase
from django.urls import reverse


class AnalysisTests(TestCase):
    def test_analysis_page_opens(self):
        response = self.client.get(reverse('analysis:analysis'))
        self.assertEqual(response.status_code, 200)

    def test_health_endpoint(self):
        response = self.client.get('/api/health/')
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()['status'], 'ok')

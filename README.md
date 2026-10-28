# İlaç Etkileşimi Tahmini (Django)

Kanser tedavisinde ilaç-ilaç etkileşimlerini bilgi grafikleri ve yapay zekâ ile tahmin eden web sitesi ve API. Tek Django projesinde hem web sayfaları hem REST API bulunur.

API sözleşmesi: `API_SPEC.md`.

## Gereksinimler

- Python 3.10 veya üzeri
- Git

## Kurulum

Projeyi indirdikten sonra proje klasöründe şu adımları sırasıyla çalıştırın.

**1. Sanal ortam oluşturun ve etkinleştirin**

macOS / Linux:
```bash
python3 -m venv venv
source venv/bin/activate
```

Windows (PowerShell):
```powershell
python -m venv venv
venv\Scripts\Activate.ps1
```

Windows (Komut İstemi):
```bat
python -m venv venv
venv\Scripts\activate.bat
```

**2. Bağımlılıkları kurun**
```bash
pip install -r requirements.txt
```

**3. Veri tabanını hazırlayın**
```bash
python manage.py migrate
```

**4. Sunucuyu çalıştırın**
```bash
python manage.py runserver
```

Tarayıcıda şu adresleri açın:

| Adres | Beklenen |
|---|---|
| http://127.0.0.1:8000/ | Ana sayfa |
| http://127.0.0.1:8000/analiz/ | İlaç analizi sayfası (taslak) |
| http://127.0.0.1:8000/api/health/ | `{"status": "ok", "api_version": "v0.1"}` |

Sunucuyu durdurmak için terminalde `Ctrl+C` tuşlarına basın.

## Testler

```bash
python manage.py test
```

## Proje yapısı

```
ddi_project/      Django proje ayarları (settings.py, urls.py)
core/             Genel sayfalar (ana sayfa)
analysis/         İlaç analizi sayfası ve API (api_urls.py)
templates/        HTML şablonları (base.html, core/, analysis/)
static/           CSS ve diğer statik dosyalar
requirements.txt  Python bağımlılıkları
```

## Ayarlar

Geliştirme için varsayılan değerler yeterlidir. Gerçek bir sunucuya yüklerken şu ortam değişkenlerini tanımlayın:

| Değişken | Anlamı |
|---|---|
| `DJANGO_SECRET_KEY` | Gizli anahtar. Kod deposuna yazmayın. |
| `DJANGO_DEBUG` | Üretimde `0` yapın. |

## Çalışma kuralları

- `venv/` ve `db.sqlite3` Git'e eklenmez (`.gitignore`).
- Yeni bir paket kurduktan sonra `pip freeze > requirements.txt` ile listeyi güncelleyin.
- API alanlarında değişiklik gerekirse önce `API_SPEC.md` güncellenir ve ekibe haber verilir.

## Yapılacaklar

- [ ] `GET /api/drugs/` (ilaç arama)
- [ ] `POST /api/predict/` (tahmin)
- [ ] İlaç analizi ve sonuç ekranları

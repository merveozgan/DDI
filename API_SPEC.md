# API Sözleşmesi (API_SPEC.md)

**Proje:** AI-Based Prediction of Drug-Drug Interactions in Cancer Treatment Using Knowledge Graphs
**Sürüm:** v0.1 (taslak) · **Hazırlayan:** K3 · **Durum:** K1 ve K2 onayı bekliyor

Bu belge arayüz (frontend), backend (Django), model (K1) ve graf/açıklama (K2) bileşenlerinin nasıl haberleşeceğini tanımlar. Alan adları İngilizce, açıklamalar Türkçedir. Aşağıdaki örneklerdeki ilaç kimlikleri gerçektir, **olasılık değerleri ve açıklama yolları yalnızca biçimi göstermek için uydurulmuş örneklerdir**, gerçek model çıktısı değildir.

---

## 1. Kararlar ve durumları

| # | Karar | Durum |
|---|---|---|
| 1 | İlaç kimliği olarak **DrugBank ID** kullanılır (`DB` + 5 hane, örn. `DB00515`). | K2 onayı bekliyor |
| 2 | Uç noktalar: `GET /api/drugs/` (ilaç arama), `POST /api/predict/` (tahmin). | K1, K2 görüşü bekliyor |
| 3 | Birden fazla ilaç girilirse sistem **tüm ikili kombinasyonları** analiz eder; N ilaç için N×(N−1)/2 çift. Üçlü veya daha büyük kombinasyonların ortak etkisi modellenmez. | K1 onayı bekliyor |
| 4 | İlaç sayısı **en az 2, en çok 10** (en çok 45 çift). Sınır, 5 saniye yanıt hedefi içindir. | K1 onayı bekliyor (süre ölçümüne göre güncellenebilir) |
| 5 | Her çift için `probability`, `risk_level` (K1), `explanation` ve `source` (K2) alanları döner. | K1, K2 onayı bekliyor |
| 6 | Hata durumları iki düzeydedir: tüm isteği reddeden **istek hatası** ve tek bir çiftin sonuçsuz kaldığı **çift düzeyi durum** (bkz. 5 ve 6). | Ekip onayı bekliyor |

---

## 2. İlaç arama: `GET /api/drugs/`

**İstek:** `GET /api/drugs/?q=cispl`
`q` en az 2 karakter olmalıdır. En çok 20 sonuç döner.

**Yanıt (200):**
```json
{
  "results": [
    { "drug_id": "DB00515", "name": "Cisplatin" }
  ]
}
```
Sonuç yoksa `"results": []` döner (hata değil).

---

## 3. Tahmin: `POST /api/predict/`

### 3.1 İstek

```json
{
  "drugs": ["DB00515", "DB00531", "DB00904"]
}
```

| Alan | Tür | Kural |
|---|---|---|
| `drugs` | string listesi | Zorunlu. 2 ile 10 eleman. Her eleman `DB` + 5 haneli numara. Tekrar eden kimlik olamaz. |

### 3.2 Başarılı yanıt (200)

```json
{
  "api_version": "v0.1",
  "model_version": "v1",
  "graph_version": "drkg-oncology-v1",
  "note": "Sonuçlar ikili etkileşimlerden türetilmiştir; üç veya daha fazla ilacın ortak etkisini modellemez.",
  "pairs": [
    {
      "drug_a": "DB00515",
      "drug_b": "DB00531",
      "status": "ok",
      "probability": 0.82,
      "risk_level": "high",
      "explanation": [
        {
          "path": [
            { "id": "DB00515", "type": "drug",   "name": "Cisplatin" },
            { "id": "CYP3A4",  "type": "enzyme", "name": "CYP3A4" },
            { "id": "DB00531", "type": "drug",   "name": "Cyclophosphamide" }
          ],
          "relations": ["substrate_of", "substrate_of"],
          "source": "DRKG"
        }
      ],
      "explanation_status": "found"
    },
    {
      "drug_a": "DB00515",
      "drug_b": "DB00904",
      "status": "no_data",
      "probability": null,
      "risk_level": "unknown",
      "explanation": [],
      "explanation_status": "not_found"
    }
  ]
}
```
*(Örnek kısaltılmıştır: 3 ilaç için 3 çift döner.)*

### 3.3 Alanlar ve sorumlular

| Alan | Anlamı | Kim üretir |
|---|---|---|
| `probability` | Modelin etkileşim olasılığı, 0 ile 1 arası. Bu bir olasılık tahminidir, klinik kanıt değildir. | K1 |
| `risk_level` | `low`, `medium`, `high` veya `unknown`. Eşikler ve kural tablosu danışmanla belirlenir (açık soru 1). | K1 |
| `status` | Çift düzeyi durum: `ok`, `no_data`, `error` (bkz. 6). | K3 (K1'in çıktısına göre) |
| `explanation` | Graf üzerinden bulunan **olası biyolojik bağlantılar**. Boş liste olabilir. | K2 |
| `explanation[].path` | Düğüm listesi: `id`, `type` (`drug`, `gene`, `protein`, `enzyme`, `pathway`, ...) ve `name`. | K2 |
| `explanation[].relations` | Ardışık düğümler arasındaki ilişki adları (`path` uzunluğu − 1 eleman). | K2 |
| `explanation[].source` | Verinin geldiği kaynak (`DRKG`, `DrugBank`, `TWOSIDES`, `KEGG`). | K2 |
| `explanation_status` | `found` veya `not_found`. | K2 |
| `model_version`, `graph_version` | Sonucun hangi model ve graf sürümüyle üretildiği. | K1, K2 |

**Gösterim kuralı:** Arayüzde açıklamalar "olası biyolojik bağlantı" olarak sunulur. Bir yolun varlığı, tek başına klinik olarak kanıtlanmış bir etkileşim anlamına gelmez.

---

## 4. Çoklu ilaç davranışı

- N ilaç için tüm ikili çiftler (a, b) hesaplanır; her çift bir kez (a, b ve b, a ayrı sonuç olmaz).
- Sonuç listesi `probability` değerine göre azalan sırada değil, **istekteki ilaç sırasına göre** döner. Sıralama arayüzde yapılır.
- Üçlü sinerji modellenmez; bu durum her yanıtta `note` alanıyla belirtilir.
- Yönlü (asimetrik) etkileşim ilk sürümde kapsam dışıdır.

---

## 5. İstek düzeyi hatalar

Tüm istek reddedilir, `pairs` dönmez.

**Hata biçimi:**
```json
{
  "error": {
    "code": "UNKNOWN_DRUG",
    "message": "Bir veya daha fazla ilaç bulunamadı.",
    "details": ["DB99999"]
  }
}
```

| HTTP | `code` | Ne zaman |
|---|---|---|
| 400 | `INVALID_REQUEST` | Geçersiz JSON, `drugs` alanı yok veya liste değil, kimlik biçimi hatalı. |
| 422 | `TOO_FEW_DRUGS` | 2'den az ilaç. |
| 422 | `TOO_MANY_DRUGS` | 10'dan fazla ilaç. |
| 422 | `DUPLICATE_DRUG` | Aynı kimlik birden fazla kez gönderilmiş. `details` tekrar edenleri listeler. |
| 422 | `UNKNOWN_DRUG` | Kimlik ilaç veri tabanında yok. `details` bulunamayanları listeler. |
| 500 | `ANALYSIS_FAILED` | Tahmin sırasında beklenmeyen hata. Ayrıntı sunucu günlüğüne yazılır, kullanıcıya genel mesaj gösterilir. |
| 503 | `MODEL_UNAVAILABLE` | Model yüklenemedi veya servis hazır değil. |

---

## 6. Çift düzeyi durumlar

İstek geçerlidir ama bir çift için sonuç üretilemez. Yanıt yine 200 döner, ilgili çiftte:

| `status` | Anlamı | `probability` | `risk_level` |
|---|---|---|---|
| `ok` | Sonuç üretildi. | sayı | `low` / `medium` / `high` |
| `no_data` | İlaçlardan biri veya ikisi grafikte/modelde yok, tahmin yapılamadı. | `null` | `unknown` |
| `error` | Bu çift için hesaplama hatası oluştu. | `null` | `unknown` |

Açıklama bulunamazsa `explanation` boş liste, `explanation_status` `not_found` olur. Bu bir hata değildir.

Arayüz `unknown` sonuçları "Sonuç yok / yeterli veri bulunamadı" olarak göstermeli, düşük risk gibi sunmamalıdır.

---

## 7. Süre hedefi

Hedef: bir `POST /api/predict/` isteği, en çok 10 ilaç için **5 saniyenin altında** yanıtlanır. Ölçüm yalnızca model çağrısını değil, ilaç doğrulama ve açıklama sorgusunu da kapsar. Hedef donanım ve veri büyüklüğüne göre test edilir; karşılanmazsa 4. karardaki üst sınır düşürülür.

---

## 8. Açık sorular (K1, K2 ve danışmanla)

1. **Risk eşikleri:** `low` / `medium` / `high` hangi olasılık aralıklarından ve hangi kurallardan türetilecek? (K1 + danışman kural tablosu)
2. **K2:** DRKG'deki ilaç kimlikleri DrugBank ID ile birebir eşleşiyor mu? Eşleşmeyen ilaçlar için ne yapılacak?
3. **K2:** Açıklama yolu için ilişki adları sabit bir listeden mi gelecek? Kaç yol döndürülecek (en çok kaç)?
4. **K1:** `probability` kalibre edilmiş bir olasılık mı, ham model skoru mu? Ham skorsa alan adını `score` yapmak daha dürüst olabilir.
5. **K1:** Modelin tanımadığı ilaçlar için `no_data` yeterli mi, yoksa SMILES girişiyle yeni ilaç desteği ilk sürümde var mı? (Varsayılan: yok.)
6. **Ekip:** İlaç sayısı sınırı 10 olarak kalsın mı?

---

## 9. Onay

| Rol | Ad | Durum | Tarih | Not |
|---|---|---|---|---|
| K1 | | Bekliyor | | |
| K2 | | Bekliyor | | |
| K3 | | Hazırladı | | |
| K4 | | Bekliyor | | |

Değişiklik kuralı: Sözleşmede değişiklik gerekirse `API_SPEC.md` güncellenir, sürüm numarası artırılır (v0.1 → v0.2) ve ekibe haber verilir. Bir alan adı, onaysız ve haber verilmeden değiştirilmez.

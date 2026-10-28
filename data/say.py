import pandas as pd

klasor = r"C:\Users\brhmk\OneDrive\Masaüstü\üniversite\Multidisipliner_proje"
girdi = klasor + r"\twosides_kemo.csv.gz"

df = pd.read_csv(girdi, dtype={"drug_1_rxnorn_id": str, "drug_2_rxnorm_id": str},
                 usecols=["drug_1_rxnorn_id", "drug_1_concept_name",
                          "drug_2_rxnorm_id", "drug_2_concept_name",
                          "condition_meddra_id", "PRR"])

cift = (df.groupby(["drug_1_rxnorn_id", "drug_1_concept_name",
                    "drug_2_rxnorm_id", "drug_2_concept_name"])
          .agg(yan_etki_sayisi=("condition_meddra_id", "nunique"),
               max_prr=("PRR", "max"),
               ort_prr=("PRR", "mean"))
          .reset_index())

print("Benzersiz ilaç çifti:", len(cift))
print(cift.sort_values("yan_etki_sayisi", ascending=False).head(10))
cift.to_csv(klasor + r"\twosides_kemo_ciftler.csv", index=False)
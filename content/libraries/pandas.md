---
title: pandas
---
**Cos'è.** Tabelle di dati (DataFrame) con colonne con nome: lettura di CSV ed Excel, filtri, raggruppamenti, statistiche, serie temporali.

**Perché ti serve.** I dati delle prove sperimentali e dei sensori arrivano in tabelle "sporche": pandas le pulisce e le riassume in poche righe.

```python
import io
import pandas as pd
csv = io.StringIO("provino;materiale;Rm\n1;S235;402\n2;S235;417\n3;S355;531\n4;S355;548\n")
df = pd.read_csv(csv, sep=";")
print(df.groupby("materiale")["Rm"].agg(["mean", "std"]).round(1))
```

**Da sapere per primo:** `read_csv(sep=";", decimal=",")`, `df["colonna"]`, `df[df.x > 0]`, `groupby`, `describe`, `to_excel`.

**Nel percorso:** Parte V (in arrivo).

```bash
pip install pandas
```

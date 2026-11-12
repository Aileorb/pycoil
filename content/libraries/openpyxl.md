---
title: openpyxl
---
**Cos'è.** Lettura e scrittura di file Excel `.xlsx`: celle, formule, formati, più fogli.

**Perché ti serve.** In azienda molti calcoli vivono in Excel. Con openpyxl compili i fogli in automatico, raccogli dati da cento file o generi report formattati.

```python
from openpyxl import Workbook
wb = Workbook()
ws = wb.active
ws.append(["acciaio", "fy [MPa]", "fyd [MPa]"])
for nome, fy in [("S235", 235), ("S355", 355)]:
    ws.append([nome, fy, f"=B{ws.max_row + 1}/1.05"])
wb.save("verifiche.xlsx")
```

**Nel percorso:** Parte VIII, «Excel con openpyxl», e Progetto 9.

```bash
pip install openpyxl
```

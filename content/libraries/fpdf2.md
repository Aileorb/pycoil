---
title: fpdf2
---
**Cos'è.** Creazione di file PDF da Python: testo, celle, tabelle, immagini, intestazioni e piè di pagina, font Unicode.

**Perché ti serve.** Certificati di collaudo, schede di prova ed etichette si consegnano in PDF: si aprono uguali ovunque e nessuno li modifica per sbaglio.

```python
from fpdf import FPDF
pdf = FPDF()
pdf.add_page()
pdf.set_font("Helvetica", style="B", size=16)
pdf.cell(0, 10, "Certificato di collaudo", new_x="LMARGIN", new_y="NEXT")
pdf.output("certificato.pdf")
```

**Nel percorso:** Parte IX, «Report PDF con fpdf2».

```bash
pip install fpdf2
```

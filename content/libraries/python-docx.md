---
title: python-docx
---
**Cos'è.** Lettura e scrittura di documenti Word `.docx`: titoli, paragrafi formattati, tabelle, immagini, margini.

**Perché ti serve.** Relazioni di prova, verbali di collaudo e schede tecniche hanno sempre la stessa struttura e numeri diversi: con python-docx escono già compilati dai dati, partendo anche dal modello aziendale.

```python
from docx import Document
doc = Document()
doc.add_heading("Relazione di prova n. 17", level=1)
p = doc.add_paragraph("Resistenza a trazione: ")
p.add_run("512 MPa").bold = True
doc.save("relazione_17.docx")
```

**Nel percorso:** Parte IX, «Report Word con python-docx», e Progetto 10.

```bash
pip install python-docx
```

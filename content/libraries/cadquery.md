---
title: CadQuery
---
**Cos'è.** CAD parametrico scritto in Python: schizzi, estrusioni, fori, raccordi, assiemi, esportazione STEP e STL.

**Perché ti serve.** Generare famiglie di pezzi da una tabella di dimensioni (flange, staffe, distanziali) o collegare il calcolo al modello.

```python norun
import cadquery as cq
flangia = (
    cq.Workplane("XY").circle(60).extrude(12)
    .faces(">Z").workplane().hole(30)
    .faces(">Z").workplane().polarArray(45, 0, 360, 6).hole(9)
)
cq.exporters.export(flangia, "flangia.step")
```

> [!nota] CadQuery si installa solo sul computer (ha bisogno del kernel geometrico OpenCascade).

**Nel percorso:** Parte VII, «CAD parametrico con CadQuery».

```bash
pip install cadquery
```

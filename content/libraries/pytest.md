---
title: pytest
---
**Cos'è.** Lo strumento per scrivere ed eseguire test automatici: funzioni che iniziano con `test_` e contengono degli `assert`.

**Perché ti serve.** Un calcolo che ha funzionato una volta può rompersi alla prossima modifica. I test lo controllano per te in un secondo. Tutti i progetti di PyCoil si verificano con pytest.

```python norun
# file test_sezioni.py
from pytest import approx
from formulario import rettangolo

def test_area():
    assert rettangolo(100, 200)["A"] == approx(20_000)
```

```bash
pip install pytest
pytest -q
```

**Da sapere per primo:** `assert`, `pytest.approx` per i float, `pytest.raises` per gli errori attesi.

**Nel percorso:** Parte II, «Ambienti virtuali, Jupyter e pytest», e tutti i progetti. Prima di allora i kata si verificano direttamente nell'app con gli stessi test.

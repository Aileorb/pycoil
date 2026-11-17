---
title: Requests
---
**Cos'è.** La libreria più usata per fare richieste HTTP: leggere e inviare dati alle API web con poche righe.

**Perché ti serve.** Gestionali di produzione, stazioni meteo, sensori IoT e portali dei fornitori parlano attraverso API web: con requests i loro dati arrivano direttamente nei tuoi script.

```python norun
import requests
r = requests.get("https://api.open-meteo.com/v1/forecast",
                 params={"latitude": 45.07, "longitude": 7.69, "hourly": "temperature_2m"}, timeout=10)
r.raise_for_status()
print(r.json()["hourly"]["temperature_2m"][:3])
```

Funziona sul computer: dentro l'app, che gira nel browser, le richieste seguono regole diverse.

**Nel percorso:** Parte IX, «API web e JSON».

```bash
pip install requests
```

import type React from 'react';
import { StoreProvider, useStore } from './store';
import { useRoute } from './router';
import { Today } from './screens/Today';
import { PathIndex } from './screens/PathIndex';
import { DocPage } from './screens/DocPage';
import { Stats } from './screens/Stats';
import { Welcome } from './screens/Welcome';
import { ReminderAsk } from './screens/ReminderAsk';
import { ImportProgress } from './screens/ImportProgress';
import { useState } from 'react';
import { Toast } from './components/Sheet';
import { TabIcons } from './components/icons';

// Link di trasferimento dal vecchio indirizzo: «…/#importa=CODICE». Si legge una volta e si toglie dall'indirizzo.
const linkCode = /^#importa=/.test(location.hash) ? location.hash.slice(1) : null;
if (linkCode) history.replaceState(null, '', location.pathname + location.search);

function Shell() {
  const { ready, state, toast } = useStore();
  const route = useRoute();
  const [importing, setImporting] = useState<string | null>(linkCode);
  if (!ready) return <div className="empty" style={{ paddingTop: '40vh' }}>PyCoil</div>;
  if (importing !== null) return <div className="app"><ImportProgress code={importing || undefined} onClose={() => setImporting(null)} /><Toast text={toast} /></div>;
  if (!state.level) return <div className="app"><Welcome onImport={() => setImporting('')} /><Toast text={toast} /></div>;
  if (!state.reminder?.asked) return <div className="app"><ReminderAsk /><Toast text={toast} /></div>;

  const [head, id] = route;
  let tab: 'oggi' | 'percorso' | 'statistiche' = 'oggi';
  let screen = <Today />;
  if (head === 'percorso' && id) {
    tab = 'percorso';
    screen = <DocPage kind="percorso" id={id} />;
  } else if ((head === 'libreria' || head === 'doc' || head === 'progetto') && id) {
    tab = 'percorso';
    screen = <DocPage kind={head} id={id} />;
  } else if (head === 'percorso') {
    tab = 'percorso';
    screen = <PathIndex />;
  } else if (head === 'statistiche') {
    tab = 'statistiche';
    screen = <Stats />;
  }

  return (
    <div className="app">
      {screen}
      <nav className="tabbar" aria-label="Sezioni dell'app" style={{ '--i': ['oggi', 'percorso', 'statistiche'].indexOf(tab) } as React.CSSProperties}>
        {(['oggi', 'percorso', 'statistiche'] as const).map((t) => (
          <a key={t} href={`#/${t}`} aria-current={tab === t ? 'page' : undefined}>
            {TabIcons[t](tab === t)}
            {t === 'oggi' ? 'Oggi' : t === 'percorso' ? 'Percorso' : 'Statistiche'}
          </a>
        ))}
      </nav>
      <Toast text={toast} />
    </div>
  );
}

export default function App() {
  return (
    <StoreProvider>
      <Shell />
    </StoreProvider>
  );
}

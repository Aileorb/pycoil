import { StoreProvider, useStore } from './store';
import { useRoute } from './router';
import { Today } from './screens/Today';
import { PathIndex } from './screens/PathIndex';
import { DocPage } from './screens/DocPage';
import { Stats } from './screens/Stats';
import { Welcome } from './screens/Welcome';
import { Toast } from './components/Sheet';
import { TabIcons } from './components/icons';

function Shell() {
  const { ready, state, toast } = useStore();
  const route = useRoute();
  if (!ready) return <div className="empty" style={{ paddingTop: '40vh' }}>PyCoil</div>;
  if (!state.level) return <div className="app"><Welcome /><Toast text={toast} /></div>;

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
      <nav className="tabbar" aria-label="Sezioni dell'app">
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

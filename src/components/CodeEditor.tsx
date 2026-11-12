import { useRef } from 'react';

const KEYS = ['Tab', ':', '(', ')', '[', ']', '{', '}', '_', '"', "'", '=', '.', ','];

/** Mini editor per il telefono: barra con i simboli che sulla tastiera iOS sono scomodi. */
export function CodeEditor({ value, onChange, label }: { value: string; onChange: (v: string) => void; label: string }) {
  const ta = useRef<HTMLTextAreaElement>(null);

  const insert = (text: string) => {
    const el = ta.current;
    if (!el) return;
    const s = el.selectionStart;
    const e = el.selectionEnd;
    const next = value.slice(0, s) + text + value.slice(e);
    onChange(next);
    requestAnimationFrame(() => {
      el.focus();
      el.selectionStart = el.selectionEnd = s + text.length;
    });
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      insert('    ');
    } else if (e.key === 'Enter') {
      // mantiene l'indentazione e la aumenta dopo i due punti
      const el = e.currentTarget;
      const before = value.slice(0, el.selectionStart);
      const line = before.split('\n').pop() ?? '';
      const indent = line.match(/^\s*/)?.[0] ?? '';
      const extra = line.trimEnd().endsWith(':') ? '    ' : '';
      e.preventDefault();
      insert('\n' + indent + extra);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <textarea
        ref={ta}
        className="editor"
        aria-label={label}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={onKeyDown}
        spellCheck={false}
        autoCapitalize="off"
        autoCorrect="off"
        autoComplete="off"
        rows={Math.max(7, value.split('\n').length + 1)}
      />
      <div className="keybar" role="toolbar" aria-label="Simboli">
        {KEYS.map((k) => (
          <button key={k} type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => insert(k === 'Tab' ? '    ' : k)} aria-label={k === 'Tab' ? 'Indenta' : k}>
            {k === 'Tab' ? '⇥' : k}
          </button>
        ))}
      </div>
    </div>
  );
}

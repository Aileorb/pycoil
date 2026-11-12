// Evidenziazione minima lato client (solo per le domande del test iniziale):
// un solo passaggio con una regex a gruppi, per non toccare l'HTML già generato.
const KW = new Set('def return for in if elif else while import from as class lambda None True False and or not match case try except with'.split(' '));
const BUILTIN = new Set('print range len sum min max list dict set tuple int float str abs round sorted enumerate zip'.split(' '));
const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

export function highlightLite(code: string): string {
  const re = /(#[^\n]*)|("(?:\\.|[^"\\\n])*"|'(?:\\.|[^'\\\n])*')|(\b\d[\d_]*\.?\d*\b)|([A-Za-z_]\w*)|([\s\S])/g;
  let out = '';
  let m: RegExpExecArray | null;
  while ((m = re.exec(code))) {
    const [tok, com, str, num, word] = m;
    if (com) out += `<span class="c">${esc(com)}</span>`;
    else if (str) out += `<span class="s">${esc(str)}</span>`;
    else if (num) out += `<span class="n">${num}</span>`;
    else if (word) out += KW.has(word) ? `<span class="k">${word}</span>` : BUILTIN.has(word) ? `<span class="b">${word}</span>` : word;
    else out += esc(tok);
  }
  return out;
}

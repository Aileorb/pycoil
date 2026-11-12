// Converte i contenuti didattici di content/ (Markdown + JSON) nei file JSON
// pubblicati su GitHub Pages in public/content/. Non entrano mai nel bundle dell'app.
//   node scripts/build-content.mjs          → genera
//   node scripts/build-content.mjs --check  → valida soltanto
import { readFileSync, writeFileSync, mkdirSync, rmSync, existsSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { Marked } from 'marked';

const SRC = 'content';
const OUT = 'public/content';
const CHECK = process.argv.includes('--check');
const errors = [];
const fail = (msg) => errors.push(msg);

// ---------------------------------------------------------------- evidenziazione Python
const KW = new Set('False None True and as assert async await break case class continue def del elif else except finally for from global if import in is lambda match nonlocal not or pass raise return try type while with yield'.split(' '));
const BUILTIN = new Set('print len range enumerate zip sum min max abs round int float str list dict set tuple bool type isinstance sorted reversed map filter any all open input repr id hash super object iter next format divmod pow vars dir help'.split(' '));
const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

export function highlightPython(code) {
  const re = /(#[^\n]*)|([rRbBfFuU]{0,2}"""[\s\S]*?"""|[rRbBfFuU]{0,2}'''[\s\S]*?'''|[rRbBfFuU]{0,2}"(?:\\.|[^"\\\n])*"|[rRbBfFuU]{0,2}'(?:\\.|[^'\\\n])*')|(@[A-Za-z_][\w.]*)|(\b\d[\d_]*\.?\d*(?:[eE][+-]?\d+)?j?\b)|([A-Za-z_]\w*)|([\s\S])/g;
  let out = '';
  let prev = '';
  let m;
  while ((m = re.exec(code))) {
    const [tok, com, str, deco, num, word] = m;
    if (com) out += `<span class="c">${esc(com)}</span>`;
    else if (str) out += `<span class="s">${esc(str)}</span>`;
    else if (deco) out += `<span class="d">${esc(deco)}</span>`;
    else if (num) out += `<span class="n">${esc(num)}</span>`;
    else if (word) {
      if (KW.has(word)) out += `<span class="k">${word}</span>`;
      else if (prev === 'def' || prev === 'class') out += `<span class="f">${word}</span>`;
      else if (BUILTIN.has(word)) out += `<span class="b">${word}</span>`;
      else if (/^[A-Z][A-Za-z0-9]+$/.test(word)) out += `<span class="t">${word}</span>`;
      else out += word;
      prev = word;
      continue;
    } else out += esc(tok);
    if (!/^\s$/.test(tok)) prev = tok;
  }
  return out;
}

// ---------------------------------------------------------------- Markdown
const CALLOUTS = {
  trappola: 'Trappola',
  c: 'Se vieni dal C',
  java: 'Se vieni da Java',
  nota: 'Nota',
  ing: "Nel lavoro dell'ingegnere",
  desktop: 'Desktop'
};

function makeMarked() {
  const m = new Marked({ gfm: true, breaks: false });
  m.use({
    renderer: {
      code({ text, lang }) {
        const [language, flag] = (lang || '').split(/\s+/);
        if (language === 'python' || language === 'py') {
          const run = flag === 'norun' ? '' : ' data-run="1"';
          const plot = /plt\.|matplotlib/.test(text) ? ' data-plot="1"' : '';
          return `<pre class="code" data-lang="python"${run}${plot}><code>${highlightPython(text)}</code></pre>\n`;
        }
        return `<pre class="code out"><code>${esc(text)}</code></pre>\n`;
      },
      blockquote({ tokens }) {
        const first = tokens[0];
        const raw = first && first.raw ? first.raw : '';
        const tag = raw.match(/^\[!(\w+)\]\s*/);
        if (tag && CALLOUTS[tag[1]]) {
          const inner = this.parser.parse(tokens).replace(/\[!\w+\]\s*/, '');
          return `<aside class="callout callout-${tag[1]}"><strong>${CALLOUTS[tag[1]]}</strong>${inner}</aside>\n`;
        }
        return `<blockquote>${this.parser.parse(tokens)}</blockquote>\n`;
      },
      link({ href, title, tokens }) {
        const text = this.parser.parseInline(tokens);
        const ext = /^https?:/.test(href);
        return `<a href="${href}"${title ? ` title="${esc(title)}"` : ''}${ext ? ' target="_blank" rel="noopener"' : ''}>${text}${ext ? ' ↗' : ''}</a>`;
      }
    }
  });
  return m;
}
const md = makeMarked();
const mdInline = (s) => md.parseInline(s ?? '');
const mdBlock = (s) => md.parse(s ?? '');

// frontmatter minimale: chiave: valore, liste "- elemento"
function parseDoc(text, file) {
  const m = text.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/);
  if (!m) {
    fail(`${file}: frontmatter mancante`);
    return { meta: {}, body: text };
  }
  const meta = {};
  let key = null;
  for (const line of m[1].split('\n')) {
    const kv = line.match(/^(\w+):\s*(.*)$/);
    if (kv) {
      key = kv[1];
      meta[key] = kv[2] === '' ? [] : kv[2].replace(/^"(.*)"$/, '$1');
    } else if (/^\s*-\s+/.test(line) && key) {
      if (!Array.isArray(meta[key])) meta[key] = [];
      meta[key].push(line.replace(/^\s*-\s+/, '').replace(/^"(.*)"$/, '$1'));
    }
  }
  return { meta, body: m[2] };
}

const sources = (list = []) =>
  (Array.isArray(list) ? list : [list]).map((s) => {
    const [label, url] = s.split(' | ');
    return { label: label.trim(), url: (url ?? label).trim() };
  });

const readJson = (p) => JSON.parse(readFileSync(p, 'utf8'));
const files = [];
const emit = (path, data) => files.push([path, data]);

// ---------------------------------------------------------------- libro
const book = readJson(join(SRC, 'book.json'));
const tasksIndex = [];
const sectionIds = new Set();

for (const part of book.parts) {
  for (const ch of part.chapters) {
    for (const sec of ch.sections) {
      sectionIds.add(sec.id);
      const file = join(SRC, 'sections', `${sec.id}.md`);
      if (!existsSync(file)) {
        sec.stub = true;
        emit(`sections/${sec.id}.json`, {
          id: sec.id, title: sec.title, part: part.id, chapter: ch.id, minutes: sec.minutes ?? 5, stub: true,
          html: `<p class="stub">Questa sezione arriva con i prossimi aggiornamenti dei contenuti. Intanto puoi studiarla dalle fonti qui sotto.</p>${
            sec.goals ? `<h3>Obiettivi</h3><ul>${sec.goals.map((g) => `<li>${mdInline(g)}</li>`).join('')}</ul>` : ''}`,
          sources: sources(sec.sources ?? part.sources ?? [])
        });
        continue;
      }
      const { meta, body } = parseDoc(readFileSync(file, 'utf8'), file);
      const [cardMd] = body.split('<!-- /card -->');
      if (!body.includes('<!-- /card -->')) fail(`${file}: manca il marcatore <!-- /card -->`);
      const html = mdBlock(body.replace('<!-- /card -->', ''));
      const words = body.replace(/```[\s\S]*?```/g, '').split(/\s+/).length;
      sec.minutes = Number(meta.minutes) || Math.max(3, Math.round(words / 160) + 2);
      if (meta.desktop === 'true') sec.desktop = true;
      emit(`sections/${sec.id}.json`, {
        id: sec.id, title: sec.title, part: part.id, chapter: ch.id, minutes: sec.minutes,
        desktop: sec.desktop || undefined, html, sources: sources(meta.sources)
      });
      // task "Impara": la scheda breve all'inizio della sezione
      const impara = { id: `impara-${sec.id}`, type: 'impara', section: sec.id, title: meta.card || sec.title, minutes: 3, html: mdBlock(cardMd) };
      emit(`tasks/${impara.id}.json`, impara);
      tasksIndex.push({ id: impara.id, type: 'impara', section: sec.id, title: impara.title, minutes: 3 });
    }
  }
}

// ---------------------------------------------------------------- esercizi per sezione
const taskDir = join(SRC, 'tasks');
for (const f of readdirSync(taskDir).filter((f) => f.endsWith('.json'))) {
  const section = f.replace('.json', '');
  if (!sectionIds.has(section)) fail(`tasks/${f}: sezione ${section} inesistente`);
  const list = readJson(join(taskDir, f));
  const counters = {};
  for (const t of list) {
    counters[t.kind] = (counters[t.kind] ?? 0) + 1;
    const id = `${t.kind}-${section}-${String.fromCharCode(96 + counters[t.kind])}`;
    if (t.kind === 'prevedi') {
      if (!(t.answer >= 0 && t.answer < t.options.length)) fail(`${id}: risposta fuori range`);
      emit(`tasks/${id}.json`, {
        id, type: 'prevedi', section, title: t.title, minutes: t.minutes ?? 2,
        code: t.code, codeHtml: highlightPython(t.code), options: t.options, answer: t.answer, explain: mdInline(t.explain)
      });
    } else if (t.kind === 'scrivi') {
      if (!t.tests || !t.solution) fail(`${id}: servono tests e solution`);
      emit(`tasks/${id}.json`, {
        id, type: 'scrivi', section, title: t.title, minutes: t.minutes ?? 4,
        promptHtml: mdBlock(t.prompt), starter: t.starter ?? '', tests: t.tests, solution: t.solution, hints: (t.hints ?? []).map(mdInline)
      });
    } else fail(`${id}: tipo sconosciuto ${t.kind}`);
    tasksIndex.push({ id, type: t.kind, section, title: t.title, minutes: t.minutes ?? (t.kind === 'prevedi' ? 2 : 4) });
  }
}

// ---------------------------------------------------------------- kata
const katas = readJson(join(SRC, 'katas.json'));
const katasIndex = katas.map((k) => {
  if (!sectionIds.has(k.section)) fail(`kata ${k.id}: sezione ${k.section} inesistente`);
  emit(`tasks/${k.id}.json`, {
    id: k.id, type: 'kata', section: k.section, title: k.title, minutes: k.minutes,
    promptHtml: mdBlock(k.prompt), hints: (k.hints ?? []).map(mdInline), solution: k.solution, testFile: k.testFile
  });
  return { id: k.id, type: 'kata', section: k.section, title: k.title, minutes: k.minutes };
});

// ---------------------------------------------------------------- progetti
const projects = [];
for (const pid of readdirSync(join(SRC, 'projects'))) {
  const p = readJson(join(SRC, 'projects', pid, 'project.json'));
  projects.push({ id: p.id, title: p.title, stars: p.stars, unlockAfter: p.unlockAfter, summary: p.summary, steps: p.steps.map((s) => ({ id: s.id, title: s.title, minutes: s.minutes })) });
  p.steps.forEach((s, i) => {
    emit(`tasks/${p.id}-${s.id}.json`, {
      id: `${p.id}-${s.id}`, type: 'step', section: p.unlockAfter, project: p.id, step: i + 1, title: s.title, minutes: s.minutes,
      promptHtml: mdBlock(s.prompt), hints: (s.hints ?? []).map(mdInline), solution: s.solution, testFile: s.test ? { name: s.testName, code: s.test } : undefined
    });
  });
  emit(`projects/${p.id}.json`, {
    id: p.id, title: p.title, part: p.unlockAfter, chapter: '', minutes: 3,
    html: mdBlock(p.intro) + (p.steps.length
      ? mdBlock(`## Le tappe\n\n${p.steps.map((s, i) => `${i + 1}. **${s.title}** · circa ${s.minutes} min`).join('\n')}\n\nOgni tappa arriva tra le task avanzate di **Oggi**, due alla volta. Lavoro totale stimato: ${Math.round(p.steps.reduce((a, s) => a + s.minutes, 0) / 5) * 5} minuti.`)
      : '') + mdBlock(p.final ?? ''),
    sources: sources(p.sources ?? [])
  });
}

// ---------------------------------------------------------------- librerie e appendice
const libraries = readJson(join(SRC, 'libraries.json'));
for (const lib of libraries) {
  const file = join(SRC, 'libraries', `${lib.id}.md`);
  const body = existsSync(file) ? parseDoc(readFileSync(file, 'utf8'), file).body : `${lib.desc}.`;
  emit(`libraries/${lib.id}.json`, { id: lib.id, title: lib.name, part: lib.part, chapter: '', minutes: 3, html: mdBlock(body), sources: [{ label: `Documentazione di ${lib.name}`, url: lib.url }] });
}
const appendix = [];
for (const f of readdirSync(join(SRC, 'appendix')).filter((f) => f.endsWith('.md')).sort()) {
  const { meta, body } = parseDoc(readFileSync(join(SRC, 'appendix', f), 'utf8'), f);
  const id = f.replace('.md', '');
  appendix.push({ id, letter: meta.letter, title: meta.title });
  emit(`appendix/${id}.json`, { id, title: meta.title, part: 'appendice', chapter: '', minutes: 5, html: mdBlock(body), sources: sources(meta.sources) });
}

const quiz = readJson(join(SRC, 'quiz.json'));

// ---------------------------------------------------------------- indice
const index = {
  version: new Date().toISOString().slice(0, 10),
  python: book.python,
  parts: book.parts.map((p) => ({
    id: p.id, roman: p.roman, title: p.title, short: p.short,
    chapters: p.chapters.map((c) => ({ id: c.id, title: c.title, sections: c.sections.map((s) => ({ id: s.id, title: s.title, minutes: s.minutes ?? 5, desktop: s.desktop || undefined, stub: s.stub || undefined })) }))
  })),
  libraries, appendix, tasks: tasksIndex, katas: katasIndex, projects, quiz
};
emit('index.json', index);

// controlli incrociati
const ids = new Set(tasksIndex.map((t) => t.id));
if (ids.size !== tasksIndex.length) fail('ID task duplicati');
for (const p of projects) if (!book.parts.some((x) => x.id === p.unlockAfter)) fail(`progetto ${p.id}: parte ${p.unlockAfter} inesistente`);

if (errors.length) {
  console.error('Errori nei contenuti:\n - ' + errors.join('\n - '));
  process.exit(1);
}
if (!CHECK) {
  rmSync(OUT, { recursive: true, force: true });
  for (const [path, data] of files) {
    const full = join(OUT, path);
    mkdirSync(full.slice(0, full.lastIndexOf('/')), { recursive: true });
    writeFileSync(full, JSON.stringify(data));
  }
}
const full = book.parts.flatMap((p) => p.chapters.flatMap((c) => c.sections)).filter((s) => !s.stub).length;
console.log(`Contenuti ok: ${full} sezioni complete, ${tasksIndex.length} task, ${katasIndex.length} kata, ${projects.length} progetti, ${files.length} file${CHECK ? ' (solo verifica)' : ` in ${OUT}`}.`);

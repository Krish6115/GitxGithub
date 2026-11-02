// GitHub Docs (Markdown + Liquid) -> plain Markdown, rendered for GitHub.com (fpt/ghec).
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { tidy } from './sections.js';

const DOCS = 'https://docs.github.com/en';

export interface RenderedPage {
  title: string;
  intro: string;
  body: string;
}

/** Truthy for GitHub.com (fpt) and GHEC; false for GHES/GHAE-only conditions; feature flags assumed on. */
function evalCond(expr: string): boolean {
  const toks = expr.trim().split(/\s+(and|or)\s+/);
  const atom = (a: string): boolean => {
    a = a.trim();
    if (a.startsWith('not ')) return !atom(a.slice(4));
    const name = a.split(/\s|[<>=!]/)[0] ?? '';
    if (name === 'fpt' || name === 'ghec') return true;
    return !/^gh(es|ae)/.test(name);
  };
  let val = atom(toks[0] ?? '');
  for (let k = 1; k + 1 < toks.length; k += 2) {
    const rhs = atom(toks[k + 1] ?? '');
    val = toks[k] === 'and' ? val && rhs : val || rhs;
  }
  return val;
}

function resolveIfs(text: string): string {
  const re = /\{%-?\s*(ifversion|elsif|else|endif|if)\b([^%]*?)-?%\}/g;
  const out: string[] = [];
  const stack: { active: boolean; taken: boolean }[] = [];
  let last = 0;
  const active = (): boolean => stack.every((s) => s.active);
  for (const m of text.matchAll(re)) {
    if (active()) out.push(text.slice(last, m.index));
    last = m.index + m[0].length;
    const kw = m[1];
    const cond = m[2] ?? '';
    const top = stack.at(-1);
    if (kw === 'ifversion' || kw === 'if') {
      const v = kw === 'if' ? false : evalCond(cond);
      stack.push({ active: v, taken: v });
    } else if (kw === 'elsif' && top) {
      const v = !top.taken && evalCond(cond);
      top.active = v;
      top.taken ||= v;
    } else if (kw === 'else' && top) {
      top.active = !top.taken;
      top.taken = true;
    } else stack.pop();
  }
  if (active()) out.push(text.slice(last));
  return out.join('');
}

function loadVars(root: string, file: string): Map<string, string> {
  const map = new Map<string, string>();
  const p = join(root, 'data', 'variables', `${file}.yml`);
  if (!existsSync(p)) return map;
  const lines = readFileSync(p, 'utf8').split(/\r?\n/);
  for (let i = 0; i < lines.length; i++) {
    const m = (lines[i] ?? '').match(/^([\w-]+):\s*(['"]?)(.*)\2\s*$/);
    if (!m?.[1]) continue;
    let v = m[3] ?? '';
    if (/^[>|][-+]?$/.test(v)) {
      // YAML block scalar: join the indented continuation lines
      const block: string[] = [];
      while (i + 1 < lines.length && /^\s+\S/.test(lines[i + 1] ?? '')) block.push((lines[++i] ?? '').trim());
      v = block.join(' ');
    }
    map.set(m[1], v.replace(/''/g, "'"));
  }
  return map;
}

const titleFrom = (p: string): string =>
  (p.split('/').filter(Boolean).pop() ?? '').replace(/-/g, ' ').replace(/^./, (c) => c.toUpperCase());

export function makeRenderer(root: string): (relPath: string) => RenderedPage {
  const varCache = new Map<string, Map<string, string>>();
  const vars = (file: string): Map<string, string> => {
    let m = varCache.get(file);
    if (!m) varCache.set(file, (m = loadVars(root, file)));
    return m;
  };

  const render = (input: string, depth = 0): string => {
    const raws: string[] = [];
    let text = input.replace(/\{%\s*raw\s*%\}([\s\S]*?)\{%\s*endraw\s*%\}/g, (_m, r: string) => `\u0000RAW${raws.push(r) - 1}\u0000`);
    text = resolveIfs(text);
    text = text.replace(/\{%-?\s*data\s+variables\.([\w-]+)\.([\w.-]+)\s*-?%\}/g, (_m, f: string, k: string) => {
      const v = vars(f).get(k);
      return v != null && depth < 5 ? render(v, depth + 1).trim() : 'GitHub';
    });
    text = text.replace(/\{%-?\s*data\s+reusables\.([\w.-]+)\s*-?%\}/g, (_m, k: string) => {
      const p = join(root, 'data', 'reusables', ...k.split('.')) + '.md';
      return existsSync(p) && depth < 6 ? render(readFileSync(p, 'utf8'), depth + 1).trim() : '';
    });
    text = text
      // An icon alone in bold ("click the **<icon>** icon") keeps its label; icons next to text are dropped.
      .replace(/\*\*\s*\{%\s*octicon\s+"([\w-]+)"(?:[^%]*?aria-label="([^"]*)")?[^%]*%\}\s*\*\*/g,
        (_m, name: string, label?: string) => `**${label || name.replace(/-/g, ' ')}**`)
      .replace(/\{%\s*octicon[^%]*%\}/g, '')
      .replace(/\{%-?\s*(webui|endwebui|cli|endcli|desktop|enddesktop|codespaces|endcodespaces|endwindows|endmac|endlinux|indented_data_reference[^%]*)\s*-?%\}/g, '')
      .replace(/\{%\s*(windows|mac|linux)\s*%\}/g, (_m, os: string) => `\n**${os === 'mac' ? 'macOS' : cap1(os)}:**\n`)
      .replace(/\{%[^%]*%\}/g, '');
    return text.replace(/\u0000RAW(\d+)\u0000/g, (_m, n: string) => raws[Number(n)] ?? '');
  };

  return (relPath) => {
    const raw = readFileSync(join(root, relPath), 'utf8').replace(/\r/g, '');
    const fm = raw.match(/^---\n([\s\S]*?)\n---\n/);
    const front = fm?.[1] ?? '';
    const get = (k: string): string => {
      const m = front.match(new RegExp(`^${k}:\\s*(?:'((?:[^']|'')*)'|"([^"]*)"|(.*))$`, 'm'));
      return m ? (m[1]?.replace(/''/g, "'") ?? m[2] ?? m[3] ?? '').trim() : '';
    };
    const body = render(fm ? raw.slice(fm[0].length) : raw)
      .replace(/!\[[^\]]*\]\([^)]*\)/g, '')
      .replace(/\[AUTOTITLE\]\((\/[^)#]*)(#[^)]*)?\)/g, (_m, p: string, h?: string) => `[${titleFrom(p)}](${DOCS}${p}${h ?? ''})`)
      .replace(/\]\((\/(?!\/)[^)]*)\)/g, (_m, p: string) => `](${DOCS}${p})`)
      .replace(/^([ \t]*)>[ \t]*\[!(NOTE|TIP|WARNING|IMPORTANT|CAUTION)\][ \t]*/gm, (_m, sp: string, t: string) => `${sp}> **${cap1(t.toLowerCase())}:** `)
      .replace(/(^|\s)\*\* +(?=\S)/gm, '$1**');
    return { title: render(get('title')).trim(), intro: render(get('intro')).trim(), body: tidy(body) };
  };
}

const cap1 = (s: string): string => s.charAt(0).toUpperCase() + s.slice(1);

// Minimal AsciiDoc -> Markdown for Pro Git sections and git man pages.
import { tidy } from './sections.js';

type Xref = (anchor: string) => string;

const inlineFmt = (s: string, xref: Xref): string =>
  s
    .replace(/\(\(\(.*?\)\)\)/g, '')
    .replace(/indexterm:\[[^\]]*\]/g, '')
    .replace(/linkgit:([\w-]+)\[\d\]/g, (_m, c: string) => '`' + c.replace(/^git-/, 'git ') + '`')
    .replace(/<<([\w#:.-]+),\s*([^<>]+)>>/g, (_m, _a: string, t: string) => t.replace(/^"|"$/g, ''))
    .replace(/<<([\w#:.-]+)>>/g, (_m, a: string) => xref(a))
    .replace(/"`|`"/g, '"')
    .replace(/(?:link:)?(https?:\/\/[^\s[]+)\[([^\]]*)\]/g, (_m, u: string, t: string) => (t ? `[${t.replace(/\^$/, '')}](${u})` : u))
    .replace(/(^|[\s(])\+([^+\n]+?)\+(?=[\s.,;:)]|$)/g, '$1`$2`')
    .replace(/(^|[\s(])\*([^*\s][^*\n]*?)\*(?=[\s.,;:)!?]|$)/g, '$1**$2**')
    .replace(/(^|[\s(])'([^'\n]+?)'(?=[\s.,;:)]|$)/g, '$1_$2_')
    .replace(/ --(?= )/g, ' —')
    .replace(/\{empty\}|\{nbsp\}/g, ' ');

const defaultXref: Xref = (a) => {
  const name = (a.split('#').pop() ?? '')
    .replace(/^ch\d+-/, '')
    .replace(/-chapter$/, '')
    .replace(/^_+/, '')
    .replace(/[_-]+/g, ' ')
    .trim();
  const title = name.replace(/\b\w/g, (c) => c.toUpperCase());
  return name ? `"${title}" (Pro Git)` : 'a related Pro Git section';
};

const cap = (s: string): string => s.charAt(0) + s.slice(1).toLowerCase();

/** Convert AsciiDoc text to Markdown. */
export function adocToMd(src: string): string {
  const lines = src.replace(/\r/g, '').split('\n');
  const at = (k: number): string => lines[k] ?? '';
  // Figures are dropped, so references to them name the figure caption instead.
  const figs = new Map<string, string>();
  lines.forEach((l, k) => {
    const a = l.match(/^\[\[([\w.-]+)\]\]$/);
    if (a?.[1] && /^\./.test(at(k + 1)) && /^image::/.test(at(k + 2))) figs.set(a[1], at(k + 1).slice(1).trim());
  });
  const xref: Xref = (a) => (figs.has(a) ? `the figure "${figs.get(a)}" (in the online book)` : defaultXref(a));

  const out: string[] = [];
  let i = 0;
  let pendingLang = '';
  let pendingTitle = '';
  let admonition: string | null = null;

  while (i < lines.length) {
    let line = at(i);
    const next = at(i + 1);

    // man-page underlined headings: TEXT followed by ---- of the same length
    if (/^[A-Za-z][\w ()'-]*$/.test(line) && /^(-{3,}|={3,}|~{3,})$/.test(next) && Math.abs(next.length - line.length) <= 1) {
      const level = next[0] === '=' ? '#' : next[0] === '-' ? '##' : '###';
      out.push('', `${level} ${cap(line)}`, '');
      i += 2;
      continue;
    }
    if (/^\[\[.*\]\]$/.test(line) || /^(ifdef|ifndef|endif|ifeval|include)::/.test(line) || /^:[\w-]+:/.test(line) || /^\/\//.test(line)) {
      i++;
      continue;
    }
    if (/^image::/.test(line)) {
      pendingTitle = '';
      i++;
      continue;
    }
    if (/^\[synopsis\]$/.test(line)) {
      // man-page synopsis is an undelimited paragraph
      i++;
      out.push('', '```text');
      while (i < lines.length && at(i).trim() !== '') out.push(at(i++).replace(/\t/g, '    '));
      out.push('```', '');
      continue;
    }
    if (/^\t+\S/.test(line)) line = line.replace(/^\t+/, ''); // man-page option bodies are tab-indented
    const srcAttr = line.match(/^\[source(?:,\s*([\w-]+))?.*\]$/);
    if (srcAttr) {
      pendingLang = srcAttr[1] ?? '';
      i++;
      continue;
    }
    const adm = line.match(/^\[(NOTE|TIP|WARNING|IMPORTANT|CAUTION)\]$/);
    if (adm?.[1]) {
      admonition = adm[1];
      i++;
      continue;
    }
    if (/^\[.*\]$/.test(line)) {
      i++;
      continue;
    }
    if (/^\.[A-Za-z`"']/.test(line) && !/^\.\.\./.test(line)) {
      pendingTitle = inlineFmt(line.slice(1), xref);
      i++;
      continue;
    }
    if (admonition) {
      out.push('', `> **${cap(admonition)}${pendingTitle ? ` — ${pendingTitle}` : ''}:**`, '>');
      pendingTitle = '';
      const delimited = /^====\s*$/.test(line);
      if (delimited) i++;
      // delimited: read to the closing ====; otherwise just the next paragraph
      while (i < lines.length && (delimited ? !/^====\s*$/.test(at(i)) : at(i).trim() !== '')) {
        out.push(at(i).trim() ? `> ${inlineFmt(at(i), xref)}` : '>');
        i++;
      }
      if (delimited) i++;
      admonition = null;
      out.push('');
      continue;
    }
    if (/^(-{4,}|\.{4,})\s*$/.test(line)) {
      const fence = line.trim();
      if (pendingTitle) {
        out.push('', `*${pendingTitle}*`);
        pendingTitle = '';
      }
      out.push('', '```' + pendingLang);
      pendingLang = '';
      i++;
      while (i < lines.length && at(i).trim() !== fence) out.push(at(i++).replace(/\s*<\d+>\s*$/, '').replace(/\t/g, '    '));
      out.push('```', '');
      i++;
      continue;
    }
    if (/^(\*{4,}|_{4,}|={4,})\s*$/.test(line)) {
      i++;
      continue;
    }
    if (line.trim() === '+') {
      out.push('');
      i++;
      continue;
    }
    const inlineAdm = line.match(/^(NOTE|TIP|WARNING|IMPORTANT|CAUTION):\s+(.*)$/);
    if (inlineAdm?.[1] && inlineAdm[2] !== undefined) {
      out.push('', `> **${cap(inlineAdm[1])}:** ${inlineFmt(inlineAdm[2], xref)}`, '');
      i++;
      continue;
    }
    const h = line.match(/^(={2,6})\s+(.*)$/);
    if (h?.[1] && h[2] !== undefined) {
      out.push('', `${'#'.repeat(Math.max(2, h[1].length - 1))} ${inlineFmt(h[2], xref)}`, '');
      i++;
      continue;
    }
    const dl = line.match(/^(.+?)::\s*(.*)$/);
    if (dl?.[1] && !/^\s/.test(line) && !/https?:/.test(dl[1])) {
      out.push('', `- **${inlineFmt(dl[1], xref)}**${dl[2] ? ': ' + inlineFmt(dl[2], xref) : ''}`);
      i++;
      continue;
    }
    line = line.replace(/^(\.+)\s+/, (_m, dots: string) => `${'   '.repeat(dots.length - 1)}1. `);
    line = line.replace(/^(\*{2,})\s+/, (_m, stars: string) => `${'  '.repeat(stars.length - 1)}* `);
    if (pendingTitle) {
      out.push('', `**${pendingTitle}**`, '');
      pendingTitle = '';
    }
    out.push(inlineFmt(line, xref));
    i++;
  }
  return tidy(out.join('\n'));
}

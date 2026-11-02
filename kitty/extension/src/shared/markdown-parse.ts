// Tiny Markdown parser for tutor answers -> plain data (rendered as Preact elements, so nothing is ever HTML-injected).
// Supports: ``` fences, # headings, - / * / 1. lists, paragraphs, `code`, **bold**, [text](http(s) url), bare URLs, [n] citations.

export type Inline =
  | { t: 'text'; v: string }
  | { t: 'code'; v: string }
  | { t: 'bold'; v: Inline[] }
  | { t: 'link'; href: string; v: string }
  | { t: 'cite'; n: number };

export type Block =
  | { t: 'code'; lang: string; v: string }
  | { t: 'heading'; level: number; v: Inline[] }
  | { t: 'list'; ordered: boolean; items: Inline[][] }
  | { t: 'para'; v: Inline[] };

const SAFE_URL = /^https?:\/\/[^\s<>"']+$/i;
const INLINE = /(`[^`\n]+`)|(\*\*[^*\n]+\*\*)|(\[([^\]\n]+)\]\(([^)\s]+)\))|(\[(\d{1,2})\])|(https?:\/\/[^\s<>()"'`]+[^\s<>()"'`.,;:!?])/g;

export function parseInline(src: string): Inline[] {
  const out: Inline[] = [];
  let last = 0;
  const text = (v: string): void => {
    if (!v) return;
    const prev = out.at(-1);
    if (prev?.t === 'text') prev.v += v;
    else out.push({ t: 'text', v });
  };
  for (const m of src.matchAll(INLINE)) {
    text(src.slice(last, m.index));
    last = m.index + m[0].length;
    if (m[1]) out.push({ t: 'code', v: m[1].slice(1, -1) });
    else if (m[2]) out.push({ t: 'bold', v: parseInline(m[2].slice(2, -2)) });
    else if (m[3]) {
      const href = m[5] ?? '';
      if (SAFE_URL.test(href)) out.push({ t: 'link', href, v: m[4] ?? href });
      else text(m[4] ?? ''); // javascript:, data:, relative links -> plain text
    } else if (m[6]) out.push({ t: 'cite', n: Number(m[7]) });
    else if (m[8]) out.push({ t: 'link', href: m[8], v: m[8] });
  }
  text(src.slice(last));
  return out;
}

export function parseMarkdown(src: string): Block[] {
  const lines = src.replace(/\r/g, '').split('\n');
  const blocks: Block[] = [];
  let para: string[] = [];
  let list: { ordered: boolean; items: string[] } | null = null;
  const flushPara = (): void => {
    if (para.length) blocks.push({ t: 'para', v: parseInline(para.join(' ')) });
    para = [];
  };
  const flushList = (): void => {
    if (list) blocks.push({ t: 'list', ordered: list.ordered, items: list.items.map(parseInline) });
    list = null;
  };
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i] ?? '';
    const fence = line.match(/^\s*```\s*([\w+-]*)/);
    if (fence) {
      flushPara();
      flushList();
      const body: string[] = [];
      const indent = line.match(/^\s*/)?.[0].length ?? 0;
      while (++i < lines.length && !/^\s*```\s*$/.test(lines[i] ?? '')) body.push((lines[i] ?? '').slice(Math.min(indent, (lines[i] ?? '').match(/^\s*/)?.[0].length ?? 0)));
      blocks.push({ t: 'code', lang: fence[1] ?? '', v: body.join('\n') }); // an unclosed fence (still streaming) runs to the end
      continue;
    }
    const h = line.match(/^(#{1,4})\s+(.*)$/);
    const item = line.match(/^\s*(?:([-*])|(\d+)[.)])\s+(.*)$/);
    if (h) {
      flushPara();
      flushList();
      blocks.push({ t: 'heading', level: h[1]?.length ?? 1, v: parseInline(h[2] ?? '') });
    } else if (item) {
      flushPara();
      const ordered = Boolean(item[2]);
      if (list && list.ordered !== ordered) flushList();
      list ??= { ordered, items: [] };
      list.items.push(item[3] ?? '');
    } else if (line.trim() === '') {
      flushPara();
      flushList();
    } else if (list && /^\s{2,}\S/.test(line)) {
      list.items[list.items.length - 1] += ` ${line.trim()}`; // continuation of a list item
    } else {
      flushList();
      para.push(line.trim());
    }
  }
  flushPara();
  flushList();
  return blocks;
}

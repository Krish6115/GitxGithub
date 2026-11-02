// PDF -> Markdown with headings inferred from font size.
import { extractTextItems, getDocumentProxy } from 'unpdf';

export interface PdfLine {
  page: number;
  text: string;
  size: number;
}

/** Group positioned text items into lines (pure; exported for tests). */
export function groupLines(pages: { str: string; y: number; fontSize: number; hasEOL: boolean }[][]): PdfLine[] {
  const lines: PdfLine[] = [];
  pages.forEach((items, page) => {
    let cur: { parts: string[]; y: number; size: number } | null = null;
    const flush = (): void => {
      if (!cur) return;
      const text = cur.parts.join('').replace(/\s+/g, ' ').trim();
      if (text) lines.push({ page, text, size: cur.size });
      cur = null;
    };
    for (const it of items) {
      if (cur && Math.abs(it.y - cur.y) > 2) flush();
      cur ??= { parts: [], y: it.y, size: 0 };
      cur.parts.push(it.str);
      if (it.str.trim()) cur.size = Math.max(cur.size, it.fontSize);
      if (it.hasEOL) flush();
    }
    flush();
  });
  return lines;
}

/** Body font size = the size carrying the most characters. */
function bodySize(lines: PdfLine[]): number {
  const chars = new Map<number, number>();
  for (const l of lines) chars.set(Math.round(l.size), (chars.get(Math.round(l.size)) ?? 0) + l.text.length);
  return [...chars].sort((a, b) => b[1] - a[1])[0]?.[0] ?? 10;
}

/** Turn lines into Markdown: big text -> headings, repeated running headers and page numbers removed. */
export function linesToMarkdown(lines: PdfLine[], fallbackTitle: string): { title: string; markdown: string } {
  const pageCount = new Set(lines.map((l) => l.page)).size;
  // Running headers/footers: the same text in the first or last two lines of many pages.
  const seenOn = new Map<string, Set<number>>();
  const byPage = new Map<number, PdfLine[]>();
  for (const l of lines) byPage.set(l.page, [...(byPage.get(l.page) ?? []), l]);
  for (const [page, ls] of byPage) {
    for (const l of [...ls.slice(0, 2), ...ls.slice(-2)]) {
      const key = l.text.toLowerCase();
      seenOn.set(key, (seenOn.get(key) ?? new Set()).add(page));
    }
  }
  const body = bodySize(lines);
  const level = (l: PdfLine): number => {
    if (l.text.length > 120) return 0;
    if (l.size >= body * 2.6) return 1;
    if (l.size >= body * 1.8) return 2;
    if (l.size >= body * 1.3) return 3;
    return 0;
  };

  const out: string[] = [];
  const titleParts: string[] = [];
  let lastPage = -1;
  let lastHeading = -1; // index in `out` of the previous line if it was a heading
  for (const l of lines) {
    const repeated = pageCount >= 3 && (seenOn.get(l.text.toLowerCase())?.size ?? 0) >= Math.max(2, pageCount / 2);
    if (repeated || /^\d{1,3}$/.test(l.text)) continue;
    // icon-font glyphs extract as stray "n"/"nn" before a capitalised word
    const text = l.text.replace(/^n{1,2} (?=[A-Z])/, '');
    const lv = level(l);
    if (lv === 1 && l.page === 0) {
      titleParts.push(text);
      continue;
    }
    if (l.page !== lastPage && out.length) {
      out.push('');
      lastHeading = -1;
    }
    lastPage = l.page;
    if (lv > 0) {
      const heading = text.replace(/^[^\w(]+/, '');
      const prev = lastHeading >= 0 ? out[lastHeading] : undefined;
      if (prev !== undefined && prev.startsWith('#'.repeat(Math.max(lv, 2)) + ' ')) {
        out[lastHeading] = `${prev} ${heading}`; // heading wrapped onto a second line
      } else {
        out.push('', `${'#'.repeat(Math.max(lv, 2))} ${heading}`);
        lastHeading = out.length - 1;
        out.push('');
      }
    } else {
      out.push(text.replace(/^#/, '\\#')); // shell comments must not become Markdown headings
      lastHeading = -1;
    }
  }
  const title = titleParts.join(' ').replace(/[^\x20-\x7E·—–&]/g, '').replace(/\s+/g, ' ').trim() || fallbackTitle;
  return { title, markdown: out.join('\n').replace(/\n{3,}/g, '\n\n').trim() + '\n' };
}

/** Extract a PDF as Markdown. Returns `null` markdown when the PDF has (almost) no text layer. */
export async function pdfToMarkdown(data: Uint8Array, fallbackTitle: string): Promise<{ title: string; markdown: string | null }> {
  const pdf = await getDocumentProxy(data, { verbosity: 0 });
  const { items } = await extractTextItems(pdf);
  const lines = groupLines(items);
  const words = lines.reduce((n, l) => n + l.text.split(/\s+/).length, 0);
  if (words < 50) return { title: fallbackTitle, markdown: null };
  return linesToMarkdown(lines, fallbackTitle);
}

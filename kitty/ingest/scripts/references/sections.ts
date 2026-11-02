// Fence-aware Markdown section utilities.

export interface Section {
  level: number;
  title: string;
  text: string;
}

export interface SectionFilter {
  /** Titles to include, with their subsections. When set, everything else is dropped. */
  keep?: string[];
  /** Titles to exclude, with their subsections. */
  drop?: string[];
  dropIntro?: boolean;
}

/** Split markdown into sections; each section's text includes its heading line. */
export function splitSections(md: string): Section[] {
  const secs: { level: number; title: string; lines: string[] }[] = [{ level: 0, title: '(intro)', lines: [] }];
  let fence = false;
  for (const l of md.split('\n')) {
    if (/^```/.test(l)) fence = !fence;
    const h = fence ? null : l.match(/^(#{1,6}) (.*)$/);
    if (h?.[1] && h[2] !== undefined) secs.push({ level: h[1].length, title: h[2].trim(), lines: [l] });
    else secs.at(-1)?.lines.push(l);
  }
  return secs.map((s) => ({ level: s.level, title: s.title, text: s.lines.join('\n') }));
}

const norm = (s: string): string => s.toLowerCase().replace(/[`*_]/g, '').trim();

/** Keep or drop sections by title. Throws if a named section doesn't exist (catches upstream renames). */
export function selectSections(md: string, { keep, drop, dropIntro = false }: SectionFilter = {}): string {
  const secs = splitSections(md);
  const keepSet = keep ? new Set(keep.map(norm)) : null;
  const dropSet = new Set((drop ?? []).map(norm));
  const out: string[] = [];
  let mode: { level: number; include: boolean } | null = null;
  for (const s of secs) {
    if (s.level === 0) {
      if (!dropIntro && !keepSet) out.push(s.text);
      continue;
    }
    if (mode && s.level > mode.level) {
      if (mode.include) out.push(s.text);
      continue;
    }
    mode = null;
    const t = norm(s.title);
    if (dropSet.has(t)) {
      mode = { level: s.level, include: false };
      continue;
    }
    if (keepSet) {
      if (keepSet.has(t)) {
        mode = { level: s.level, include: true };
        out.push(s.text);
      }
      continue;
    }
    out.push(s.text);
  }
  const used = new Set(secs.map((s) => norm(s.title)));
  const unknown = [...(keep ?? []), ...(drop ?? [])].filter((k) => !used.has(norm(k)));
  if (unknown.length) throw new Error(`unknown section(s): ${unknown.join(', ')}`);
  return out.join('\n');
}

/** Shift headings outside code fences by `delta` levels, clamped to 2..6. */
export function shiftHeadings(md: string, delta: number): string {
  let fence = false;
  return md
    .split('\n')
    .map((l) => {
      if (/^```/.test(l)) fence = !fence;
      if (fence) return l;
      return l.replace(/^(#{1,6}) /, (_m, h: string) => '#'.repeat(Math.min(6, Math.max(2, h.length + delta))) + ' ');
    })
    .join('\n');
}

export function tidy(md: string): string {
  return md.replace(/[ \t]+$/gm, '').replace(/\n{3,}/g, '\n\n').trim() + '\n';
}

export const countWords = (s: string): number => s.split(/\s+/).filter(Boolean).length;

// Builds Git/references/*.md, Scenario-Based_Guide/references/*.md and SOURCES.md from the cache.
// Usage: npm run refs:build -w ingest   (run refs:fetch first)
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { adocToMd } from './adoc.js';
import { makeRenderer } from './liquid.js';
import { cachePath, CACHE_DIR, REPO_ROOT, RETRIEVED, UPSTREAM } from './pins.js';
import { countWords, selectSections, shiftHeadings, tidy } from './sections.js';
import { renderSourcesMd, type BuiltFile, type BuiltPart } from './sources-md.js';
import { SPEC, type Part } from './spec.js';

const renderPage = makeRenderer(join(CACHE_DIR, 'ghdocs'));
const CHAPTERS: Record<string, string> = {
  '02': 'Git-Basics', '03': 'Git-Branching', '05': 'Distributed-Git',
  '07': 'Git-Tools', '08': 'Customizing-Git', '10': 'Git-Internals',
};
const read = (p: Part): string => readFileSync(cachePath(p.kind, `${UPSTREAM[p.kind].base}/${p.file}`), 'utf8');
const sourceLine = (label: string, url: string, p: Part): string => `> Source: [${label}](${url}) · ${UPSTREAM[p.kind].license.name}`;

function renderPart(part: Part): BuiltPart & { md: string } {
  if (part.kind === 'progit') {
    const full = adocToMd(read(part));
    const title = full.match(/^## (.*)$/m)?.[1] ?? part.file;
    const chapter = CHAPTERS[part.file.slice(0, 2)] ?? '';
    const url = `https://git-scm.com/book/en/v2/${chapter}-${title.replace(/[^\w\s-]/g, '').trim().replace(/\s+/g, '-')}`;
    const label = `Pro Git, 2nd ed., §${part.num ?? ''} ${title}`;
    const md = selectSections(full, part).replace(/^## .*$/m, (h) => `${h}\n\n${sourceLine(label, url, part)}`);
    return { md, label, url, kind: part.kind };
  }
  if (part.kind === 'ghdocs') {
    const { title, intro, body } = renderPage(`content/${part.file}`);
    const url = `https://docs.github.com/en/${part.file.replace(/\.md$/, '')}`;
    const label = `GitHub Docs: ${title}`;
    const md = `## ${title}\n\n${sourceLine(label, url, part)}\n\n${intro ? `${intro}\n\n` : ''}${shiftHeadings(selectSections(body, part), 1)}`;
    return { md, label, url, kind: part.kind };
  }
  const page = part.file.replace(/\.adoc$/, '');
  const url = `https://git-scm.com/docs/${page}`;
  const label = `Git documentation: ${page}`;
  let src = read(part);
  let md: string;
  if (part.lines) {
    src = src.replace(/\r/g, '').split('\n').slice(part.lines[0] - 1, part.lines[1]).join('\n');
    md = adocToMd(src);
  } else {
    md = shiftHeadings(selectSections(adocToMd(src), part), 1);
  }
  const heading = part.heading ?? `\`${page.replace(/^git-/, 'git ')}\` manual (excerpt)`;
  return { md: `## ${heading}\n\n${sourceLine(label, url, part)}\n\n${md}`, label, url, kind: part.kind };
}

const built: BuiltFile[] = [];
for (const file of SPEC) {
  const parts = file.parts.map(renderPart);
  const unique = parts.filter((p, i) => parts.findIndex((q) => q.url === p.url) === i);
  const header = [
    `# ${file.title}`,
    '',
    '> **Sources and license.** This file contains adapted excerpts from openly licensed sources, retrieved',
    `> ${RETRIEVED}. Changes: selected sections only, converted to Markdown, images and non-GitHub.com product variants removed.`,
    "> Each excerpt keeps the license of its source. This file is **not** covered by the repository's MIT license.",
    '>',
    ...unique.map((p) => {
      const u = UPSTREAM[p.kind];
      return `> - [${p.label}](${p.url}) · ${u.attribution} · [${u.license.name}](${u.license.url})`;
    }),
    '',
  ].join('\n');
  const body = tidy(`${header}\n${parts.map((p) => p.md).join('\n\n')}`);
  const dest = join(REPO_ROOT, file.out);
  mkdirSync(dirname(dest), { recursive: true });
  writeFileSync(dest, body);
  built.push({ out: file.out, words: countWords(body), parts: parts.map(({ label, url, kind }) => ({ label, url, kind })) });
  console.log(`${String(countWords(body)).padStart(6)}  ${file.out}`);
}
writeFileSync(join(REPO_ROOT, 'Git', 'references', 'SOURCES.md'), renderSourcesMd(built));
console.log(`total words: ${built.reduce((a, f) => a + f.words, 0)}; wrote SOURCES.md`);

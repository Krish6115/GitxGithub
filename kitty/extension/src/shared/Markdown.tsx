// Renders parsed Markdown as Preact elements (text is always escaped by Preact; links are http(s) only).
import { useState } from 'preact/hooks';
import type { ChatSource } from './chat';
import { parseMarkdown, type Inline } from './markdown-parse';

function CodeBlock({ code, lang }: { code: string; lang: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <div class="code">
      <button
        class="copy"
        aria-label="Copy code"
        onClick={() => void navigator.clipboard.writeText(code).then(() => { setCopied(true); setTimeout(() => setCopied(false), 1200); })}
      >
        {copied ? 'Copied' : 'Copy'}
      </button>
      <pre data-lang={lang}><code>{code}</code></pre>
    </div>
  );
}

function Inlines({ nodes, sources }: { nodes: Inline[]; sources: ChatSource[] }) {
  return (
    <>
      {nodes.map((n, i) => {
        switch (n.t) {
          case 'text': return n.v;
          case 'code': return <code key={i}>{n.v}</code>;
          case 'bold': return <strong key={i}><Inlines nodes={n.v} sources={sources} /></strong>;
          case 'link': return <a key={i} href={n.href} target="_blank" rel="noopener noreferrer">{n.v}</a>;
          case 'cite': {
            const s = sources.find((x) => x.n === n.n);
            return s ? <a key={i} class="cite" href={s.sourceUrl} target="_blank" rel="noopener noreferrer" title={s.title}>[{n.n}]</a> : `[${n.n}]`;
          }
        }
      })}
    </>
  );
}

export function Markdown({ text, sources }: { text: string; sources: ChatSource[] }) {
  return (
    <div class="md">
      {parseMarkdown(text).map((b, i) => {
        if (b.t === 'code') return <CodeBlock key={i} code={b.v} lang={b.lang} />;
        if (b.t === 'heading') return <h4 key={i}><Inlines nodes={b.v} sources={sources} /></h4>;
        if (b.t === 'list') {
          const items = b.items.map((it, j) => <li key={j}><Inlines nodes={it} sources={sources} /></li>);
          return b.ordered ? <ol key={i}>{items}</ol> : <ul key={i}>{items}</ul>;
        }
        return <p key={i}><Inlines nodes={b.v} sources={sources} /></p>;
      })}
    </div>
  );
}

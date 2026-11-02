// What the user is looking at on GitHub, so the chat can answer about the current page.
import { pageTypeFromUrl, type PageType } from './page-type';

export const PAGE_CONTEXT_MAX_CHARS = 6000;
/** chrome.storage.local key: whether the chat reads the current page (on by default). */
export const READ_PAGE_KEY = 'kitty:read-page';

export type PageContextRequest = { type: 'get-page-context' };

export interface PageContext {
  url: string;
  title: string;
  pageType: PageType;
  /** Text the user has selected, if any. */
  selection: string;
  /** Visible main content, whitespace-collapsed and capped. */
  text: string;
  truncated: boolean;
}

/** Collapse runs of blank lines and spaces, then cap the length. */
export function cleanPageText(raw: string, max = PAGE_CONTEXT_MAX_CHARS): { text: string; truncated: boolean } {
  const text = raw
    .replace(/[ \t ]+/g, ' ')
    .replace(/ *\n */g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
  return text.length > max ? { text: `${text.slice(0, max)}\n[…]`, truncated: true } : { text, truncated: false };
}

/** Source code keeps its indentation; only cap the length. */
function cleanFile(code: string, max = PAGE_CONTEXT_MAX_CHARS): { text: string; truncated: boolean } {
  return code.length > max ? { text: `${code.slice(0, max)}\n[…]`, truncated: true } : { text: code, truncated: false };
}

/** Read the current GitHub page (runs in the content script). */
export function readPageContext(doc: Document = document, href = location.href): PageContext {
  // a code file: GitHub keeps the exact source in a hidden read-only textarea
  const code = doc.querySelector<HTMLTextAreaElement>('textarea#read-only-cursor-text-area')?.value;
  const main = doc.querySelector<HTMLElement>('main') ?? doc.querySelector<HTMLElement>('#repo-content-pjax-container') ?? doc.body;
  const { text, truncated } = code ? cleanFile(code) : cleanPageText(main?.innerText ?? '');
  const selection = (doc.getSelection?.()?.toString() ?? '').trim().slice(0, 2000);
  return { url: href, title: doc.title, pageType: pageTypeFromUrl(href), selection, text, truncated };
}

/** Short label for the chat header, e.g. "Krish6115/GitKitty · README.md". */
export function pageLabel(ctx: Pick<PageContext, 'url' | 'title'>): string {
  try {
    const parts = new URL(ctx.url).pathname.split('/').filter(Boolean);
    if (parts.length >= 2) {
      const repo = `${parts[0]}/${parts[1]}`;
      const rest = parts.slice(2);
      const tail = rest[0] === 'blob' || rest[0] === 'tree' ? rest.at(-1) : rest.slice(0, 2).join(' ');
      return tail ? `${repo} · ${decodeURIComponent(tail)}` : repo;
    }
  } catch {
    /* fall back to the title */
  }
  return ctx.title.slice(0, 60);
}

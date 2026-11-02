// Finds the file header on a GitHub file page. GitHub's markup changes, so several selectors are tried
// and a miss is fine: the tour then shows the bubble without a highlight.

const FILE_HEADER_SELECTORS = [
  '[data-testid="breadcrumbs-filename"]',
  '#file-name-id-wide',
  '#sticky-file-name-id',
  '[data-testid="breadcrumbs"]',
  '#repos-sticky-header',
  '.react-code-view-header-wrap--narrow',
  '.file-header',
  'main h1',
];

export function findFileHeader(doc: Document = document): Element | null {
  for (const sel of FILE_HEADER_SELECTORS) {
    const el = doc.querySelector(sel);
    if (el && el.getBoundingClientRect().width > 0) return el;
  }
  return null;
}

export interface Box {
  top: number;
  left: number;
  width: number;
  height: number;
}

/** Viewport box around an element, padded a little. */
export function boxOf(el: Element, pad = 6): Box {
  const r = el.getBoundingClientRect();
  return { top: r.top - pad, left: r.left - pad, width: r.width + pad * 2, height: r.height + pad * 2 };
}

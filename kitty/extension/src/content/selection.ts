// Pure helpers for "Explain this": when to offer the button and where to place things.

export const MIN_SELECTION = 3;
export const MAX_SELECTION = 4000;

export interface Rect {
  top: number;
  left: number;
  right: number;
  bottom: number;
}

export interface Viewport {
  width: number;
  height: number;
}

/** Offer "Ask Kitty" for a real selection outside editable fields and outside Kitty's own UI. */
export function shouldOffer(text: string, inEditable: boolean, inKitty: boolean): boolean {
  const t = text.trim();
  return !inEditable && !inKitty && t.length >= MIN_SELECTION && t.length <= MAX_SELECTION;
}

/** Pill goes just below the end of the selection, clamped inside the viewport (flips above when there is no room). */
export function pillPosition(rect: Rect, vp: Viewport, size = { w: 110, h: 30 }): { top: number; left: number } {
  const below = rect.bottom + 6;
  const top = below + size.h > vp.height - 4 ? Math.max(4, rect.top - size.h - 6) : below;
  const left = Math.min(Math.max(4, rect.right - size.w), vp.width - size.w - 4);
  return { top, left };
}

/** Explanation bubble: below the selection if it fits, otherwise above, otherwise pinned to the top; always inside the viewport. */
export function bubblePosition(rect: Rect | null, vp: Viewport, size = { w: 380, h: 320 }): { top: number; left: number } {
  const w = Math.min(size.w, vp.width - 16);
  if (!rect) return { top: Math.max(8, vp.height - size.h - 110), left: Math.max(8, vp.width - w - 24) }; // above the cat
  let top = rect.bottom + 8;
  if (top + size.h > vp.height - 8) top = rect.top - size.h - 8;
  if (top < 8) top = 8;
  const left = Math.min(Math.max(8, rect.left), vp.width - w - 8);
  return { top, left };
}

/** True when a DOM node sits inside an input, textarea or contenteditable region. */
export function isEditable(node: Node | null): boolean {
  let el: Element | null = node instanceof Element ? node : (node?.parentElement ?? null);
  while (el) {
    if (el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement || (el as HTMLElement).isContentEditable) return true;
    el = el.parentElement;
  }
  return false;
}

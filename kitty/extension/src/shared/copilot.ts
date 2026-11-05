// Hand-off to GitHub Copilot for things Kitty doesn't do (writing or changing code, deep code review).
// Kitty prepares the prompt, opens Copilot on github.com and types it into the chat box. The user reviews it and
// presses Enter: Kitty never sends anything to Copilot on its own.

export const COPILOT_URL = 'https://github.com/copilot';
export const COPILOT_PENDING_KEY = 'kitty:copilot-prompt';
export const COPILOT_TTL_MS = 120_000;
export interface CopilotPending {
  prompt: string;
  at: number;
}

export const isCopilotPage = (href: string): boolean => {
  try {
    const u = new URL(href);
    return u.hostname === 'github.com' && /^\/copilot(\/|$)/.test(u.pathname);
  } catch {
    return false;
  }
};

/** Copilot's chat box: a textarea in most layouts, a contenteditable in some. Kitty's own UI is never matched. */
const BOX_SELECTORS = [
  '#copilot-chat-textarea',
  'textarea[data-testid*="copilot" i]',
  'textarea[placeholder*="Ask" i]',
  'textarea[aria-label*="Copilot" i]',
  'main textarea',
  '[contenteditable="true"][role="textbox"]',
];
export function findCopilotBox(doc: Document = document): HTMLElement | null {
  for (const sel of BOX_SELECTORS) {
    for (const el of doc.querySelectorAll<HTMLElement>(sel)) {
      const r = el.getBoundingClientRect();
      if (!el.closest('#kitty-root') && r.width > 0 && r.height > 0) return el;
    }
  }
  return null;
}

/** Put `text` in the box the way typing would (React only notices value changes made through the native setter). */
export function fillBox(el: HTMLElement, text: string): void {
  el.focus();
  if (el instanceof HTMLTextAreaElement) {
    const setter = Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, 'value')?.set;
    setter?.call(el, text);
    el.dispatchEvent(new Event('input', { bubbles: true }));
  } else {
    el.textContent = text;
    el.dispatchEvent(new InputEvent('input', { bubbles: true, data: text, inputType: 'insertText' }));
  }
}

/** A Copilot prompt with the context Kitty has (repo, page, tour step), kept short. */
export function copilotPrompt(request: string, ctx: { repo?: string | undefined; page?: string | undefined; file?: string | undefined } = {}): string {
  const lines = [
    ctx.repo ? `Repository: ${ctx.repo}` : '',
    ctx.file ? `File: ${ctx.file}` : '',
    ctx.page && !ctx.file ? `Page: ${ctx.page}` : '',
    '',
    request.trim(),
  ].filter((l, i, a) => l || (i > 0 && a[i - 1]));
  return lines.join('\n').trim().slice(0, 4000);
}

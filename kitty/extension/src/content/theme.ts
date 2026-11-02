// Follow GitHub's own appearance setting (html[data-color-mode]), falling back to the OS preference for "auto".

export type Theme = 'light' | 'dark';

/** GitHub sets data-color-mode="light" | "dark" | "auto" on <html>. */
export function effectiveTheme(colorMode: string | null, prefersDark: boolean): Theme {
  if (colorMode === 'dark') return 'dark';
  if (colorMode === 'light') return 'light';
  return prefersDark ? 'dark' : 'light';
}

/** Keep `host[data-theme]` in sync with GitHub's setting and the OS preference. Returns a cleanup function. */
export function syncTheme(host: HTMLElement): () => void {
  const media = window.matchMedia('(prefers-color-scheme: dark)');
  const apply = (): void => {
    host.dataset.theme = effectiveTheme(document.documentElement.getAttribute('data-color-mode'), media.matches);
  };
  apply();
  const observer = new MutationObserver(apply);
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-color-mode'] });
  media.addEventListener('change', apply);
  return () => {
    observer.disconnect();
    media.removeEventListener('change', apply);
  };
}

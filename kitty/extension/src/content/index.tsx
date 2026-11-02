import { render } from 'preact';
import { Cat } from './Cat';
import css from './cat.css?inline';

const HOST_ID = 'kitty-root';

function mount(): void {
  if (document.getElementById(HOST_ID)) return;
  const host = document.createElement('div');
  host.id = HOST_ID;
  const shadow = host.attachShadow({ mode: 'open' });
  const style = document.createElement('style');
  style.textContent = css;
  const container = document.createElement('div');
  shadow.append(style, container);
  // Attach to <html>, not <body>: GitHub's Turbo navigation swaps <body>.
  document.documentElement.append(host);
  render(<Cat spriteUrl={chrome.runtime.getURL('sprites/kitty.svg')} />, container);
}

mount();

import { render } from 'preact';
import { ExplainUI } from './ExplainUI';
import { KittyApp } from './KittyApp';
import { syncTheme } from './theme';
import { readPageContext, type PageContextRequest } from '../shared/page-context';
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
  syncTheme(host);
  render(
    <>
      <KittyApp />
      <ExplainUI hostId={HOST_ID} />
    </>,
    container,
  );
}

mount();

// The side panel chat asks for the page the user is looking at.
chrome.runtime.onMessage.addListener((msg: PageContextRequest, _sender, sendResponse) => {
  if (msg?.type !== 'get-page-context') return;
  sendResponse(readPageContext());
});

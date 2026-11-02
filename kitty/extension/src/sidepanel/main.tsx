import { render } from 'preact';
import { TourView } from './TourView';

const css = `
  :root { color-scheme: light dark; --fg: #1f2328; --muted: #57606a; --bg: #fff; --accent: #f0a04b; --line: #d0d7de; }
  @media (prefers-color-scheme: dark) { :root { --fg: #e6edf3; --muted: #9da7b3; --bg: #0d1117; --line: #30363d; } }
  body { margin: 0; background: var(--bg); color: var(--fg); font: 14px/1.5 system-ui, -apple-system, "Segoe UI", sans-serif; }
  main { padding: 16px; }
  h1 { font-size: 18px; margin: 0 0 12px; } h2 { font-size: 16px; margin: 0 0 8px; } h3 { font-size: 14px; margin: 16px 0 6px; }
  .muted { color: var(--muted); } .small { font-size: 12px; }
  .badge { background: #fff1db; color: #7a4b00; border: 1px solid var(--accent); border-radius: 8px; padding: 4px 8px; font-size: 12px; }
  .stack { display: flex; flex-wrap: wrap; gap: 4px; } .stack span { border: 1px solid var(--line); border-radius: 999px; padding: 0 8px; font-size: 12px; }
  .steps { padding-left: 20px; margin: 0; } .steps li { margin: 4px 0; }
  .steps button { all: unset; cursor: pointer; display: flex; flex-direction: column; padding: 4px 6px; border-radius: 6px; width: 100%; box-sizing: border-box; }
  .steps button:hover, .steps li.current button { background: rgb(240 160 75 / 0.18); }
  .steps code { font-size: 12px; color: var(--muted); word-break: break-all; }
  .pre { white-space: pre-wrap; }
`;

function SidePanel() {
  return (
    <main>
      <style>{css}</style>
      <h1>Kitty</h1>
      <TourView />
    </main>
  );
}

const root = document.getElementById('app');
if (root) render(<SidePanel />, root);

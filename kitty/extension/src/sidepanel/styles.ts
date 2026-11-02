// Side panel styles (light/dark via prefers-color-scheme).
export const css = `
  :root { color-scheme: light dark; --fg: #1f2328; --muted: #57606a; --bg: #fff; --panel: #f6f8fa; --accent: #238636; --accent-hover: #2ea043; --line: #d0d7de; --warn: #9a6700; --err: #cf222e; }
  @media (prefers-color-scheme: dark) { :root { --fg: #e6edf3; --muted: #9da7b3; --bg: #0d1117; --panel: #161b22; --line: #30363d; --warn: #d29922; --err: #f85149; } }
  * { box-sizing: border-box; }
  body { margin: 0; background: var(--bg); color: var(--fg); font: 14px/1.5 system-ui, -apple-system, "Segoe UI", sans-serif; }
  main { padding: 12px 14px 16px; display: flex; flex-direction: column; min-height: 100vh; }
  h2 { font-size: 16px; margin: 0 0 8px; } h3 { font-size: 14px; margin: 16px 0 6px; } h4 { font-size: 14px; margin: 10px 0 4px; }
  .muted { color: var(--muted); } .small { font-size: 12px; }
  .tabs { display: flex; gap: 4px; border-bottom: 1px solid var(--line); margin-bottom: 12px; }
  .tabs button { all: unset; cursor: pointer; padding: 6px 10px; border-bottom: 2px solid transparent; color: var(--muted); }
  .tabs button.active { color: var(--fg); border-bottom-color: var(--accent); font-weight: 600; }
  .tabs button:focus-visible { outline: 2px solid var(--accent); }
  button:not(.tabs button):not(.copy):not(.steps button) { font: inherit; cursor: pointer; padding: 4px 12px; border-radius: 6px; border: 1px solid rgb(31 35 40 / 0.15); background: var(--accent); color: #fff; font-weight: 600; }
  button:not(.tabs button):not(.copy):not(.steps button):not(.ghost):hover:not(:disabled) { background: var(--accent-hover); }
  button.ghost { background: transparent !important; color: var(--fg) !important; border-color: var(--line) !important; font-weight: 400 !important; }
  button:disabled { opacity: 0.5; cursor: default; }
  .row { display: flex; gap: 6px; align-items: center; flex-wrap: wrap; margin-top: 6px; }
  .badge { background: #dafbe1; color: #1a7f37; border: 1px solid var(--accent); border-radius: 8px; padding: 4px 8px; font-size: 12px; }
  .stack { display: flex; flex-wrap: wrap; gap: 4px; } .stack span { border: 1px solid var(--line); border-radius: 999px; padding: 0 8px; font-size: 12px; }
  .steps { padding-left: 20px; margin: 0; } .steps li { margin: 4px 0; }
  .steps button { all: unset; cursor: pointer; display: flex; flex-direction: column; padding: 4px 6px; border-radius: 6px; width: 100%; }
  .steps button:hover, .steps li.current button { background: rgb(46 160 67 / 0.15); }
  .steps code { font-size: 12px; color: var(--muted); word-break: break-all; }
  .pre { white-space: pre-wrap; }
  .chat { display: flex; flex-direction: column; flex: 1; gap: 8px; }
  .messages { flex: 1; display: flex; flex-direction: column; gap: 10px; }
  .msg { padding: 8px 10px; border-radius: 10px; max-width: 100%; overflow-wrap: anywhere; }
  .msg.user { align-self: flex-end; background: rgb(46 160 67 / 0.18); white-space: pre-wrap; max-width: 90%; }
  .msg.kitty { background: var(--panel); border: 1px solid var(--line); }
  .md p, .md ul, .md ol { margin: 0 0 8px; } .md ul, .md ol { padding-left: 20px; }
  .md code { font: 12px ui-monospace, SFMono-Regular, Consolas, monospace; background: rgb(127 127 127 / 0.15); padding: 1px 4px; border-radius: 4px; }
  .code { position: relative; margin: 0 0 8px; }
  .code pre { margin: 0; padding: 26px 10px 10px; overflow-x: auto; background: var(--bg); border: 1px solid var(--line); border-radius: 6px; }
  .code pre code { background: none; padding: 0; }
  .copy { position: absolute; top: 4px; right: 4px; font: 11px system-ui; cursor: pointer; border: 1px solid var(--line); border-radius: 4px; background: var(--panel); color: var(--fg); padding: 1px 6px; }
  .cite { font-size: 11px; vertical-align: super; text-decoration: none; color: var(--accent); }
  .sources summary { cursor: pointer; color: var(--muted); font-size: 12px; } .sources ol { margin: 4px 0 0; padding-left: 20px; font-size: 12px; }
  .warn { color: var(--warn); font-size: 12px; } .warn code { margin: 0 2px; }
  .error { color: var(--err); }
  .ok { color: #1a7f37; } @media (prefers-color-scheme: dark) { .ok { color: #3fb950; } }
  .welcome { max-width: 560px; margin: 0 auto; } .howto { padding-left: 18px; } .howto li { margin: 4px 0; }
  .thinking::after { content: ""; animation: dots 1.2s steps(4) infinite; }
  @keyframes dots { 0% { content: ""; } 25% { content: "."; } 50% { content: ".."; } 75% { content: "..."; } }
  .chip { display: block; margin: 6px 0; background: transparent !important; color: var(--fg) !important; text-align: left; }
  .page-bar { display: flex; align-items: center; gap: 6px; font-size: 12px; padding: 6px 2px; border-top: 1px solid var(--line); cursor: pointer; }
  .page-bar strong { word-break: break-all; }
  .composer { position: sticky; bottom: 0; background: var(--bg); padding-top: 6px; border-top: 1px solid var(--line); }
  .composer textarea, .settings input { width: 100%; font: inherit; color: var(--fg); background: var(--bg); border: 1px solid var(--line); border-radius: 6px; padding: 6px 8px; }
  .composer textarea { resize: vertical; }
  .settings { display: flex; flex-direction: column; gap: 10px; } .settings label { display: flex; flex-direction: column; gap: 4px; font-weight: 600; }
  .settings label span { font-weight: 400; }
  .settings label.check { flex-direction: row; align-items: center; gap: 8px; font-weight: 400; } .settings label.check input { width: auto; }
  @media (prefers-reduced-motion: reduce) { .thinking::after { animation: none; } }
`;

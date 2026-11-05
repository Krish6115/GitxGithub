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
  button:not(.tabs button):not(.copy):not(.steps button):not(.focus-chip button) { font: inherit; cursor: pointer; padding: 4px 12px; border-radius: 6px; border: 1px solid rgb(31 35 40 / 0.15); background: var(--accent); color: #fff; font-weight: 600; }
  button:not(.tabs button):not(.copy):not(.steps button):not(.focus-chip button):not(.ghost):hover:not(:disabled) { background: var(--accent-hover); }
  button.ghost { background: transparent !important; color: var(--fg) !important; border-color: var(--line) !important; font-weight: 400 !important; }
  button:disabled { opacity: 0.5; cursor: default; }
  .row { display: flex; gap: 6px; align-items: center; flex-wrap: wrap; margin-top: 6px; }
  .context-pack { margin: 10px 0 6px; padding: 8px; border: 1px dashed var(--line); border-radius: 8px; }
  .learning-path { margin: 12px 0; padding: 8px; border: 1px solid var(--line); border-radius: 8px; color: var(--fg); }
  .learning-path summary { cursor: pointer; font-weight: 600; }
  .path-bar { height: 6px; background: var(--panel); border-radius: 3px; margin: 6px 0; overflow: hidden; }
  .path-bar span { display: block; height: 100%; background: var(--accent); }
  .quiz-q { margin: 8px 0; }
  button.choice { display: block; width: 100%; text-align: left; margin: 3px 0; padding: 5px 8px !important; background: var(--panel) !important; color: var(--fg) !important; border: 1px solid var(--line) !important; border-radius: 6px; font-weight: 400 !important; }
  button.choice:disabled { opacity: 1; }
  button.choice:hover:not(:disabled) { border-color: var(--accent) !important; }
  button.choice.right { border-color: var(--accent) !important; background: rgb(35 134 54 / 0.18) !important; font-weight: 600 !important; }
  button.choice.wrong { border-color: var(--err) !important; background: rgb(207 34 46 / 0.14) !important; }
  .badge { background: #dafbe1; color: #1a7f37; border: 1px solid var(--accent); border-radius: 8px; padding: 4px 8px; font-size: 12px; }
  .stack { display: flex; flex-wrap: wrap; gap: 4px; } .stack span { border: 1px solid var(--line); border-radius: 999px; padding: 0 8px; font-size: 12px; }
  .steps { padding-left: 20px; margin: 0; } .steps li { margin: 4px 0; }
  .steps li { display: flex; gap: 6px; align-items: center; }
  .steps button.step { all: unset; cursor: pointer; display: flex; flex-direction: column; padding: 4px 6px; border-radius: 6px; flex: 1; min-width: 0; }
  .steps button.ask-step { all: unset; cursor: pointer; font-size: 12px; padding: 2px 8px; border: 1px solid var(--line); border-radius: 6px; color: var(--fg); }
  .steps button.ask-step:hover { border-color: var(--accent-hover); color: var(--accent-hover); }
  .steps button.step:hover, .steps li.current button.step { background: rgb(46 160 67 / 0.15); }
  .tour-panel { border: 1px solid var(--line); border-radius: 8px; padding: 6px 10px; margin-bottom: 10px; background: var(--panel); }
  .tour-panel > summary { cursor: pointer; font-size: 13px; }
  .tour-panel[open] { max-height: 45vh; overflow-y: auto; }
  .fix-plan { border-top: 1px solid var(--line); margin-top: 6px; padding-top: 6px; } .fix-plan h4 { margin: 8px 0 4px; }
  .tour-panel details { margin-top: 6px; } .tour-panel details summary { cursor: pointer; color: var(--muted); font-size: 13px; }
  .focus-chip { display: flex; align-items: center; gap: 6px; font-size: 12px; padding: 4px 8px; margin: 0 0 6px; border: 1px solid var(--accent-hover); border-radius: 999px; background: rgb(46 160 67 / 0.12); }
  .focus-chip span { flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .focus-chip button { all: unset; cursor: pointer; color: var(--muted); padding: 0 4px; }
  .action-card { margin-top: 6px; padding: 6px 8px; border: 1px solid var(--accent-hover); border-radius: 8px; background: rgb(46 160 67 / 0.08); }
  .action-card p { margin: 0 0 4px; } .found { margin: 4px 0 0; padding-left: 18px; } .found li { margin: 0 0 8px; } .found a { color: var(--fg); text-decoration: none; }
  button.small { padding: 1px 8px; font-size: 12px; }
  .msg .about { display: block; font-size: 11px; color: var(--muted); margin-bottom: 2px; }
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
  .learn .subtabs { display: flex; gap: 6px; margin-bottom: 10px; flex-wrap: wrap; }
  .chip.active { border-color: var(--accent); background: rgb(35 134 54 / 0.15); font-weight: 600; }
  .story { margin: 6px 0 2px; } .goal { margin: 2px 0 8px; }
  .git-graph { overflow-x: auto; border: 1px solid var(--line); border-radius: 8px; background: var(--panel); padding: 4px; }
  .git-graph .edge { stroke: var(--muted); stroke-width: 2; } .git-graph .edge.lost { stroke-dasharray: 3 3; opacity: 0.4; }
  .git-graph .node circle { fill: var(--accent); stroke: var(--bg); stroke-width: 2; }
  .git-graph .node.lost circle { fill: var(--muted); opacity: 0.45; }
  .git-graph .cid { font: 10px ui-monospace, monospace; fill: var(--muted); text-anchor: middle; }
  .git-graph .ref { font: 600 10px system-ui, sans-serif; fill: var(--fg); } .git-graph .ref.head { fill: var(--accent); } .git-graph .ref.remote { fill: var(--warn); }
  .graph-empty { padding: 12px; text-align: center; }
  .term { background: #0d1117; color: #e6edf3; border-radius: 8px; padding: 8px; max-height: 220px; overflow: auto; font: 12px ui-monospace, monospace; margin-top: 8px; }
  .term pre { margin: 2px 0 8px; white-space: pre-wrap; color: #9da7b3; } .term pre.err { color: #f85149; }
  .term .prompt { color: #3fb950; margin-right: 4px; } .term .muted { color: #9da7b3; }
  .term .risk { font: 600 10px system-ui, sans-serif; padding: 1px 6px; border-radius: 8px; margin-left: 6px; }
  .risk-safe { background: #dafbe1; color: #1a7f37; } .risk-rewrite { background: #fff8c5; color: #9a6700; } .risk-danger { background: #ffebe9; color: #cf222e; }
  .term-input { display: flex; gap: 6px; align-items: center; margin-top: 6px; }
  .term-input input { flex: 1; font: 12px ui-monospace, monospace; padding: 6px; border: 1px solid var(--line); border-radius: 6px; background: var(--bg); color: var(--fg); }
  .solved { background: rgb(35 134 54 / 0.15); border: 1px solid var(--accent); border-radius: 8px; padding: 6px 8px; }
  .lesson-steps { display: flex; gap: 4px; list-style: none; padding: 0; margin: 6px 0 10px; font-size: 12px; }
  .lesson-steps li { flex: 1; text-align: center; padding: 3px; border-bottom: 3px solid var(--line); color: var(--muted); }
  .lesson-steps li.current { border-color: var(--accent); color: var(--fg); font-weight: 600; } .lesson-steps li.done { border-color: rgb(35 134 54 / 0.5); }
  .lesson-list, .checklist { list-style: none; padding: 0; margin: 6px 0; }
  .lesson-list li { margin: 2px 0; } .lesson-list button.step { width: 100%; text-align: left; }
  .checklist li { padding: 6px 0; border-bottom: 1px solid var(--line); } .checklist li.done strong { text-decoration: line-through; color: var(--muted); }
  .checklist li.current { border-left: 3px solid var(--accent); padding-left: 6px; }
  .checklist .check { display: flex; gap: 8px; align-items: center; } .checklist .check input { width: auto; }
  .step-how { margin: 4px 0 0 24px; font-size: 13px; }
  .octicon { display: inline-block; vertical-align: text-bottom; flex-shrink: 0; }
  .status-icon.s-fail { color: #cf222e; } .status-icon.s-warn { color: #9a6700; } .status-icon.s-info { color: #0969da; } .status-icon.s-pass { color: #1a7f37; }
  .lesson-state { display: inline-block; width: 18px; color: var(--accent, #1a7f37); }
  @media (prefers-reduced-motion: reduce) { .thinking::after { animation: none; } }
`;

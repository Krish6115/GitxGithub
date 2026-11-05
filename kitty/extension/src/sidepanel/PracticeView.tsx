// Practice mode: a safe, simulated repo. Pick a scenario, type git commands, watch the graph change, and see the
// risk of each command. Nothing touches a real repository.
import { useEffect, useRef, useState } from 'preact/hooks';
import type { SimState } from '../shared/git-sim';
import { PRACTICE_HELP, run, type Risk } from '../shared/git-sim-commands';
import { SCENARIOS, scenarioById, type Scenario } from '../shared/practice-scenarios';
import { GitGraph } from './GitGraph';
import { Icon } from '../shared/Icon';

const RISK: Record<Risk, { label: string; cls: string }> = {
  safe: { label: 'Safe', cls: 'risk-safe' },
  rewrites_history: { label: 'Rewrites history', cls: 'risk-rewrite' },
  can_lose_work: { label: 'Can lose work', cls: 'risk-danger' },
};
export const PRACTICE_DONE_KEY = 'kitty:practice-done';

interface Line {
  cmd: string;
  out: string;
  error?: boolean;
  risk?: Risk;
}

export function PracticeView({ scenarioId, onDone }: { scenarioId?: string; onDone?: (id: string) => void }) {
  const [sc, setSc] = useState<Scenario>(() => scenarioById(scenarioId ?? '') ?? (SCENARIOS[0] as Scenario));
  const [state, setState] = useState<SimState>(() => sc.setup());
  const [lines, setLines] = useState<Line[]>([]);
  const [input, setInput] = useState('');
  const [solved, setSolved] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const logRef = useRef<HTMLDivElement | null>(null);

  const start = (next: Scenario): void => {
    setSc(next);
    setState(next.setup());
    setLines([]);
    setSolved(false);
    setShowHint(false);
  };
  useEffect(() => {
    const next = scenarioById(scenarioId ?? '');
    if (next && next.id !== sc.id) start(next);
  }, [scenarioId]);
  useEffect(() => logRef.current?.scrollTo({ top: logRef.current.scrollHeight }), [lines]);

  const submit = (cmd: string): void => {
    const c = cmd.trim();
    if (!c) return;
    setInput('');
    if (c === 'help') return setLines((l) => [...l, { cmd: c, out: PRACTICE_HELP }]);
    if (c === 'clear') return setLines([]);
    const r = run(state, c);
    setState(r.state);
    setLines((l) => [...l, { cmd: c, out: r.output, ...(r.error ? { error: true } : {}), ...(r.risk ? { risk: r.risk } : {}) }]);
    if (!solved && sc.done(r.state)) {
      setSolved(true);
      onDone?.(sc.id);
      void chrome.storage.local.get(PRACTICE_DONE_KEY).then((x) => {
        const done = new Set((x[PRACTICE_DONE_KEY] as string[] | undefined) ?? []);
        done.add(sc.id);
        return chrome.storage.local.set({ [PRACTICE_DONE_KEY]: [...done] });
      });
    }
  };

  return (
    <section class="practice" data-kitty="practice">
      <label class="small">
        Scenario{' '}
        <select value={sc.id} onChange={(e) => { const n = scenarioById((e.target as HTMLSelectElement).value); if (n) start(n); }}>
          {SCENARIOS.map((s) => <option key={s.id} value={s.id}>{s.title}</option>)}
        </select>
      </label>
      <p class="story">{sc.story}</p>
      <p class="goal"><strong>Goal:</strong> {sc.goal}</p>
      <GitGraph state={state} />
      <p class="muted small">Uncommitted: {state.working} changed · {state.staged} staged{state.stash.length ? ` · ${state.stash.length} stashed` : ''}</p>
      <div class="term" ref={logRef} data-kitty="practice-log">
        {lines.length === 0 && <p class="muted small">Type a command below, or "help". This is a simulation: it is safe to break things.</p>}
        {lines.map((l, i) => (
          <div key={i} class="term-line">
            <div><span class="prompt">$</span> {l.cmd} {l.risk && l.risk !== 'safe' && <span class={`risk ${RISK[l.risk].cls}`}>{RISK[l.risk].label}</span>}</div>
            <pre class={l.error ? 'err' : ''}>{l.out}</pre>
          </div>
        ))}
      </div>
      {solved && <p class="solved" data-kitty="practice-solved"><Icon name="check-circle" /> Goal reached. Try another scenario, or keep exploring.</p>}
      <form class="term-input" onSubmit={(e) => { e.preventDefault(); submit(input); }}>
        <span class="prompt">$</span>
        <input value={input} onInput={(e) => setInput((e.target as HTMLInputElement).value)} placeholder="git status" aria-label="Command" autocomplete="off" spellcheck={false} />
        <button type="submit" class="small">Run</button>
      </form>
      <div class="row">
        <button class="ghost small" onClick={() => setShowHint(true)}>Hint</button>
        <button class="ghost small" onClick={() => start(sc)}>Start over</button>
      </div>
      {showHint && <p class="hint small" data-kitty="practice-hint"><Icon name="light-bulb" size={12} /> {sc.hint}</p>}
    </section>
  );
}

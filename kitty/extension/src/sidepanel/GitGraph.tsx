// SVG commit graph for Practice mode: one lane per branch, labels for branches, origin/* and HEAD,
// and "lost" commits (only in the reflog) drawn faded at the bottom.
import { headBranch, headId, reachable, type SimState } from '../shared/git-sim';

const DX = 48;
const DY = 46;

export function layout(s: SimState): { lane: Record<string, number>; lanes: number } {
  const lane: Record<string, number> = {};
  const tips = [
    s.branches.main,
    ...Object.keys(s.branches).filter((b) => b !== 'main').sort().map((b) => s.branches[b]),
    ...Object.values(s.remote),
    headId(s),
  ].filter(Boolean) as string[];
  let n = 0;
  for (const tip of tips) {
    let c: string | undefined = tip;
    let used = false;
    while (c && lane[c] === undefined) {
      lane[c] = n;
      used = true;
      c = s.commits[c]?.parents[0];
    }
    if (used) n++;
  }
  const live = reachable(s);
  const lost = s.order.filter((c) => !live.has(c));
  for (const c of lost) lane[c] = n;
  return { lane, lanes: n + (lost.length ? 1 : 0) };
}

export function GitGraph({ state }: { state: SimState }) {
  const { lane, lanes } = layout(state);
  const live = reachable(state);
  const x = (c: string): number => state.order.indexOf(c) * DX + 22;
  const y = (c: string): number => (lane[c] ?? 0) * DY + 34;
  const labels: Record<string, string[]> = {};
  const add = (id: string | undefined, l: string): void => void (id && (labels[id] = [...(labels[id] ?? []), l]));
  for (const [b, id] of Object.entries(state.branches)) add(id, b === headBranch(state) ? `HEAD → ${b}` : b);
  for (const [b, id] of Object.entries(state.remote)) add(id, `origin/${b}`);
  if (!headBranch(state)) add(headId(state), 'HEAD (detached)');
  const width = Math.max(state.order.length * DX + 70, 200);
  const height = Math.max(lanes, 1) * DY + 26;
  if (state.order.length === 0) return <p class="muted small graph-empty">No commits yet.</p>;
  return (
    <div class="git-graph" data-kitty="git-graph">
      <svg width={width} height={height} role="img" aria-label="Commit graph">
        {state.order.flatMap((c) =>
          (state.commits[c]?.parents ?? []).map((p) => (
            <line key={`${p}-${c}`} x1={x(p)} y1={y(p)} x2={x(c)} y2={y(c)} class={live.has(c) ? 'edge' : 'edge lost'} />
          )),
        )}
        {state.order.map((c) => (
          <g key={c} class={live.has(c) ? 'node' : 'node lost'}>
            <title>{`${c}: ${state.commits[c]?.msg}${live.has(c) ? '' : ' (lost: only in the reflog)'}`}</title>
            <circle cx={x(c)} cy={y(c)} r={9} />
            <text x={x(c)} y={y(c) + 22} class="cid">{c}</text>
            {(labels[c] ?? []).map((l, i) => (
              <text key={l} x={x(c) + 12} y={y(c) - 12 - i * 12} class={l.startsWith('HEAD') ? 'ref head' : l.startsWith('origin/') ? 'ref remote' : 'ref'}>{l}</text>
            ))}
          </g>
        ))}
      </svg>
    </div>
  );
}

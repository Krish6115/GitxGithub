// The on-page Kitty: cat, menu, tour speech bubble and file highlight (rendered inside Kitty's shadow root).
import { useEffect, useState } from 'preact/hooks';
import { boxOf, findFileHeader, type Box } from './highlight';
import { useTour } from './useTour';

/** Re-find the file header after navigation (GitHub renders file views asynchronously) and track scroll/resize. */
function useHighlight(active: boolean, href: string): Box | null {
  const [box, setBox] = useState<Box | null>(null);
  useEffect(() => {
    if (!active) return setBox(null);
    let el: Element | null = null;
    let raf = 0;
    const started = Date.now();
    const tick = (): void => {
      if (!el || !el.isConnected) el = findFileHeader();
      setBox(el ? boxOf(el) : null);
      if (el || Date.now() - started < 8000) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [active, href]);
  return box;
}

export function KittyApp({ spriteUrl }: { spriteUrl: string }) {
  const t = useTour();
  const [menuOpen, setMenuOpen] = useState(false);
  const step = t.tour && t.onTourRepo ? t.tour.steps[t.tour.currentIndex] : undefined;
  const showStep = Boolean(step && t.atCurrentStep);
  const box = useHighlight(showStep, t.href);
  const loading = t.phase.kind === 'loading';

  let bubble = null;
  if (t.phase.kind === 'loading') {
    bubble = <div class="bubble" role="status"><p class="thinking">{t.phase.message}</p></div>;
  } else if (t.phase.kind === 'error') {
    bubble = (
      <div class="bubble" role="alert">
        <p>{t.phase.message}</p>
        <div class="row">
          {t.repo && <button onClick={() => t.start()}>Try again</button>}
          <button class="ghost" onClick={() => t.setPhase({ kind: 'idle' })}>Close</button>
        </div>
      </div>
    );
  } else if (t.tour && t.onTourRepo && step) {
    const n = t.tour.currentIndex;
    const total = t.tour.steps.length;
    bubble = showStep ? (
      <div class="bubble tour" data-kitty="step">
        <div class="meta">
          Step {n + 1} of {total}
          {t.tour.partial && <span class="badge" title="GitHub returned only part of this repository's file list">Large repo · partial tour</span>}
        </div>
        <h3>{step.title}</h3>
        <p>{step.what}</p>
        <p class="why"><strong>Why it matters:</strong> {step.why_it_matters}</p>
        <div class="row">
          <button class="ghost" disabled={n === 0} onClick={() => void t.goTo(n - 1)}>Back</button>
          {n < total - 1 ? <button onClick={() => void t.goTo(n + 1)}>Next</button> : <button onClick={() => void t.exit()}>Finish</button>}
          <button class="ghost" onClick={() => void t.exit()}>Exit</button>
        </div>
      </div>
    ) : (
      <div class="bubble" data-kitty="resume">
        <p>You stepped off the tour (step {n + 1} of {total}: {step.path}).</p>
        <div class="row">
          <button onClick={() => void t.goTo(n)}>Resume</button>
          <button class="ghost" onClick={() => void t.exit()}>Exit tour</button>
        </div>
      </div>
    );
  } else if (menuOpen) {
    bubble = (
      <div class="bubble menu">
        {t.repo ? (
          <>
            <p>Hi! Want a guided walkthrough of <strong>{t.repo.owner}/{t.repo.repo}</strong>?</p>
            <div class="row">
              <button data-kitty="start-tour" onClick={() => { setMenuOpen(false); t.start(); }}>Tour this repo</button>
            </div>
          </>
        ) : (
          <p>Open a repository page and click me for a tour.</p>
        )}
      </div>
    );
  }

  return (
    <>
      {box && <div class="highlight" data-kitty="highlight" style={{ top: `${box.top}px`, left: `${box.left}px`, width: `${box.width}px`, height: `${box.height}px` }} />}
      <div class={`kitty${loading ? ' is-thinking' : ''}${showStep ? ' is-touring' : ''}`}>
        {bubble}
        <button class="cat" aria-label="Kitty" title="Kitty" onClick={() => setMenuOpen((o) => !o)}>
          <img src={spriteUrl} alt="Kitty the cat" width={64} height={64} draggable={false} />
        </button>
      </div>
    </>
  );
}

// The on-page Kitty: cat, menu, tour speech bubble and file highlight (rendered inside Kitty's shadow root).
import { useEffect, useState } from 'preact/hooks';
import { besideBox, CAT_SIZE, guideSpot, viewport } from './cat-motion';
import { boxOf, findFileHeader, type Box } from './highlight';
import { PixelCat } from './PixelCat';
import { useCatMotion } from './useCatMotion';
import { useTour } from './useTour';
import { IssuesView, PreflightView } from './ContributeViews';
import { useApi } from './useApi';
import { requestCiExplain, requestExplain } from './useExplain';
import { issueText, usePendingAction } from './usePendingAction';
import { actionsRunFromUrl, issueNumberFromUrl, pullNumberFromUrl } from '../shared/github-page';
import type { BeginnerIssues, PreflightResult } from '../shared/contribute';
import { CHAT_FOCUS_KEY, type ChatFocus } from '../shared/tour';
import { GuideBubble, GuidesMenu } from './GuideBubble';
import { CatMenu } from './CatMenu';
import { useGuide } from './useGuide';

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

export function KittyApp() {
  const t = useTour();
  const [menuOpen, setMenuOpen] = useState(false);
  const [chatHint, setChatHint] = useState(false);
  // contributor helpers: good first issues (repo pages) and PR pre-flight (PR pages)
  const [panel, setPanel] = useState<'none' | 'issues' | 'preflight' | 'guides'>('none');
  const g = useGuide(t.href);
  const [lastIssue, setLastIssue] = useState<number | undefined>(undefined);
  const issuesApi = useApi<BeginnerIssues>('/issues');
  const preflightApi = useApi<PreflightResult>('/preflight');
  const issueNo = issueNumberFromUrl(t.href);
  const prNo = pullNumberFromUrl(t.href);
  const ciRun = actionsRunFromUrl(t.href);
  useEffect(() => setPanel((p) => (p === 'preflight' ? 'none' : p)), [prNo]);
  const startTour = (issue?: number, pr?: number): void => {
    setMenuOpen(false);
    setPanel('none');
    setLastIssue(issue);
    t.start(issue, pr);
  };
  // actions from the side panel chat ("find me an issue... take me there") run here once this page loads
  usePendingAction(t.href, (a) => {
    const [owner, repo] = a.repo.split('/');
    if (a.type === 'guide') {
      setMenuOpen(false);
      setPanel('none');
      g.start(a.guide, a.repo, a.number);
    } else if (a.type === 'tour') startTour();
    else if (a.type === 'fix_issue') startTour(a.number);
    else if (a.type === 'check_pr') {
      setMenuOpen(false);
      setPanel('preflight');
      preflightApi.run({ owner, repo, pr: a.number });
    } else void issueText(a.number).then(requestExplain);
  });
  const step = t.tour && t.onTourRepo ? t.tour.steps[t.tour.currentIndex] : undefined;
  const showStep = Boolean(step && t.atCurrentStep);
  const tourBox = useHighlight(showStep && !g.state, t.href);
  const box = g.state ? (g.view?.kind === 'here' ? g.view.box : null) : tourBox;
  const loading = t.phase.kind === 'loading';
  const vp = viewport();
  // During a tour the cat walks to the highlighted file header; otherwise it rests bottom-right.
  // anything Kitty is showing counts as "in use": a moved cat only walks home after a minute of nothing
  const busy = menuOpen || panel !== 'none' || t.phase.kind !== 'idle' || Boolean(t.tour && t.onTourRepo) || Boolean(g.state);
  const spot = box && g.state ? guideSpot(box, vp) : null;
  const cat = useCatMotion(box ? (spot ? spot.point : besideBox(box, vp)) : null, loading, busy);
  // Near the top the bubble goes under the cat, so the container is anchored by its top edge instead of its bottom.
  const below = spot ? spot.bubbleBelow : cat.pos.y < 280; // walkthroughs: the bubble opens on the side away from the target
  const anchor = below
    ? { top: `${Math.round(cat.pos.y)}px`, transition: `right ${cat.moveMs}ms linear, top ${cat.moveMs}ms linear` }
    : { bottom: `${Math.round(vp.height - cat.pos.y - CAT_SIZE)}px`, transition: `right ${cat.moveMs}ms linear, bottom ${cat.moveMs}ms linear` };

  // "Ask" on a tour step: open the side panel chat already pointed at this step.
  const askAboutStep = (index: number): void => {
    if (!t.tour) return;
    const focus: ChatFocus = { kind: 'tour-step', owner: t.tour.owner, repo: t.tour.repo, index };
    void chrome.storage.session.set({ [CHAT_FOCUS_KEY]: focus });
    void chrome.runtime.sendMessage({ type: 'open-chat' }).then((r: { ok?: boolean } | undefined) => setChatHint(!r?.ok));
  };

  let bubble = null;
  if (g.state) {
    bubble = <GuideBubble g={g} />;
  } else if (panel === 'guides' && t.repo) {
    const repo = `${t.repo.owner}/${t.repo.repo}`;
    bubble = <GuidesMenu isPr={Boolean(prNo)} onClose={() => setPanel('none')} onPick={(guide) => { setPanel('none'); g.start(guide.id, repo, prNo ?? undefined); }} />;
  } else if (t.phase.kind === 'loading') {
    bubble = <div class="bubble" role="status"><p class="thinking">{t.phase.message}</p></div>;
  } else if (t.phase.kind === 'error') {
    bubble = (
      <div class="bubble" role="alert">
        <p>{t.phase.message}</p>
        <div class="row">
          {t.repo && <button onClick={() => startTour(lastIssue)}>Try again</button>}
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
          {t.tour.result.meta.issue && <span class="badge" title={t.tour.result.meta.issue.title}>Issue #{t.tour.result.meta.issue.number}</span>}
          {t.tour.result.meta.pr && <span class="badge" title={t.tour.result.meta.pr.title}>PR #{t.tour.result.meta.pr.number}</span>}
          Step {n + 1} of {t.tour.streaming ? `~${Math.max(total, t.tour.expectedSteps ?? total)}` : total}
          {t.tour.partial && <span class="badge" title="GitHub returned only part of this repository's file list">Large repo · partial tour</span>}
        </div>
        <h3>{step.title}</h3>
        <p>{step.what}</p>
        <p class="why"><strong>Why it matters:</strong> {step.why_it_matters}</p>
        <div class="row">
          <button class="ghost" disabled={n === 0} onClick={() => void t.goTo(n - 1)}>Back</button>
          {n < total - 1 ? (
            <button onClick={() => void t.goTo(n + 1)}>Next</button>
          ) : t.tour.streaming ? (
            <button disabled title="Kitty is still writing the next step">Next</button>
          ) : (
            <button onClick={() => void t.exit()}>Finish</button>
          )}
          <button class="ghost" data-kitty="ask-step" title="Ask Kitty about this step in the side panel" onClick={() => askAboutStep(n)}>Ask</button>
          <button class="ghost" onClick={() => void t.exit()}>Exit</button>
        </div>
        {t.tour.result.meta.issue && n === total - 1 && (
          <p class="hint">
            Ready to fix it? Your exact git commands are in the side panel.{' '}
            <a href="#" data-kitty="show-commands" onClick={(e) => { e.preventDefault(); askAboutStep(n); }}>Show them</a>
          </p>
        )}
        {t.tour.streaming && step.draft && <p class="hint thinking" data-kitty="writing-step">Kitty is writing a fuller explanation</p>}
        {t.tour.streaming && !step.draft && n === total - 1 && <p class="hint thinking" data-kitty="writing-next">Kitty is writing the next step</p>}
        {chatHint && <p class="hint">Click the Kitty icon in the toolbar to open the chat.</p>}
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
  } else if (panel === 'issues' && t.repo) {
    bubble = <IssuesView state={issuesApi.state} repo={`${t.repo.owner}/${t.repo.repo}`} onFix={(n) => startTour(n)} onClose={() => setPanel('none')} />;
  } else if (panel === 'preflight') {
    bubble = <PreflightView state={preflightApi.state} onClose={() => setPanel('none')} onHint={() => setChatHint(true)} {...(t.repo ? { target: t.repo } : {})} />;
  } else if (menuOpen) {
    const close = (): void => setMenuOpen(false);
    bubble = (
      <CatMenu
        repo={t.repo}
        issueNo={issueNo}
        prNo={prNo}
        ciRun={Boolean(ciRun)}
        chatHint={chatHint}
        act={{
          onCi: () => { close(); if (t.repo && ciRun) requestCiExplain({ owner: t.repo.owner, repo: t.repo.repo, ...ciRun }); },
          onFixIssue: () => issueNo && startTour(issueNo),
          onPreflight: () => { close(); setPanel('preflight'); if (t.repo && prNo) preflightApi.run({ owner: t.repo.owner, repo: t.repo.repo, pr: prNo }); },
          onPrTour: () => prNo && startTour(undefined, prNo),
          onTour: () => startTour(),
          onFindIssues: () => { close(); setPanel('issues'); if (t.repo) issuesApi.run({ owner: t.repo.owner, repo: t.repo.repo }); },
          onGuides: () => { close(); setPanel('guides'); },
          onAsk: () => void chrome.runtime.sendMessage({ type: 'open-chat' }).then((r: { ok?: boolean } | undefined) => (r?.ok ? close() : setChatHint(true))),
        }}
      />
    );
  }

  return (
    <>
      {box && <div class="highlight" data-kitty="highlight" style={{ top: `${box.top}px`, left: `${box.left}px`, width: `${box.width}px`, height: `${box.height}px` }} />}
      <div
        class={`kitty mode-${cat.mode}${below ? ' below' : ''}`}
        data-kitty-mode={cat.mode}
        style={{ right: `${Math.round(vp.width - cat.pos.x - CAT_SIZE)}px`, ...anchor }}
      >
        {bubble}
        <button
          class="cat"
          aria-label="Kitty (drag to move)"
          title="Kitty: click for options, drag to move"
          onPointerDown={cat.onPointerDown}
          onClick={() => {
            if (cat.consumeDrag()) return; // a drag isn't a click
            setMenuOpen((o) => !o);
          }}
        >
          <div class="pose" style={{ transform: cat.mode === 'held' ? `rotate(${cat.swing}deg)` : undefined }}>
            <PixelCat frame={cat.frame} flip={cat.flip} />
          </div>
        </button>
      </div>
    </>
  );
}

// The Learn tab: guided lessons, Practice mode (a simulated repo) and the first-contribution guide.
import { useEffect, useState } from 'preact/hooks';
import { LEARN_FOCUS_KEY, type LearnFocus } from '../shared/learn';
import { FirstPrView } from './FirstPrView';
import { LessonsView } from './LessonsView';
import { PracticeView } from './PracticeView';
import { Icon, type IconName } from '../shared/Icon';

type View = LearnFocus['view'];
const VIEWS: { id: View; label: string; icon: IconName }[] = [
  { id: 'lessons', label: 'Lessons', icon: 'mortar-board' },
  { id: 'practice', label: 'Practice', icon: 'beaker' },
  { id: 'first-pr', label: 'First PR', icon: 'git-pull-request' },
];

export function LearnView() {
  const [focus, setFocus] = useState<LearnFocus>({ view: 'lessons' });
  useEffect(() => {
    const take = (f: unknown): void => {
      if (f && typeof f === 'object' && 'view' in f) setFocus(f as LearnFocus);
    };
    void chrome.storage.session.get(LEARN_FOCUS_KEY).then((r) => take(r[LEARN_FOCUS_KEY]));
    const onChange = (c: Record<string, chrome.storage.StorageChange>, area: string): void => {
      if (area === 'session' && c[LEARN_FOCUS_KEY]?.newValue) take(c[LEARN_FOCUS_KEY].newValue);
    };
    chrome.storage.onChanged.addListener(onChange);
    return () => chrome.storage.onChanged.removeListener(onChange);
  }, []);
  const go = (f: LearnFocus): void => {
    setFocus(f);
    void chrome.storage.session.set({ [LEARN_FOCUS_KEY]: f });
  };
  return (
    <section class="learn" data-kitty="learn">
      <nav class="subtabs">
        {VIEWS.map((v) => (
          <button key={v.id} class={focus.view === v.id ? 'chip active' : 'chip'} data-kitty={`learn-${v.id}`} onClick={() => go({ view: v.id } as LearnFocus)}><Icon name={v.icon} size={14} /> {v.label}</button>
        ))}
      </nav>
      {focus.view === 'lessons' && <LessonsView skill={focus.skill} onPractice={(scenario) => go({ view: 'practice', scenario })} />}
      {focus.view === 'practice' && <PracticeView {...(focus.scenario ? { scenarioId: focus.scenario } : {})} />}
      {focus.view === 'first-pr' && <FirstPrView />}
    </section>
  );
}

import { render } from 'preact';
import { useEffect, useState } from 'preact/hooks';
import { SIDEPANEL_TAB_KEY } from '../shared/messages';
import { ONBOARDED_KEY } from '../shared/onboarding';
import { ChatView } from './ChatView';
import { SettingsView } from './SettingsView';
import { css } from './styles';
import { TourView } from './TourView';
import { WelcomeView } from './WelcomeView';

type Tab = 'tour' | 'chat' | 'settings';
const TAB_KEY = SIDEPANEL_TAB_KEY;
const TABS: { id: Tab; label: string }[] = [
  { id: 'tour', label: 'Tour' },
  { id: 'chat', label: 'Ask Kitty' },
  { id: 'settings', label: 'Settings' },
];

function SidePanel() {
  const [tab, setTab] = useState<Tab>('tour');
  // null = still loading; the welcome screen shows until onboarding is finished (or when opened with ?welcome)
  const [welcome, setWelcome] = useState<boolean | null>(null);
  useEffect(() => {
    const forced = new URLSearchParams(location.search).has('welcome');
    void chrome.storage.local.get(ONBOARDED_KEY).then((r) => setWelcome(forced || r[ONBOARDED_KEY] !== true));
  }, []);
  useEffect(() => {
    // the cat's "Ask Kitty" menu item asks for the chat tab
    void chrome.storage.session.get(TAB_KEY).then((r) => r[TAB_KEY] && setTab(r[TAB_KEY] as Tab));
    const onChange = (c: Record<string, chrome.storage.StorageChange>, area: string): void => {
      if (area === 'session' && c[TAB_KEY]?.newValue) setTab(c[TAB_KEY].newValue as Tab);
    };
    chrome.storage.onChanged.addListener(onChange);
    return () => chrome.storage.onChanged.removeListener(onChange);
  }, []);
  const choose = (t: Tab): void => {
    setTab(t);
    void chrome.storage.session.set({ [TAB_KEY]: t });
  };
  if (welcome === null) return null;
  if (welcome) {
    return (
      <main>
        <style>{css}</style>
        <WelcomeView onDone={() => setWelcome(false)} />
      </main>
    );
  }
  return (
    <main>
      <style>{css}</style>
      <nav class="tabs" role="tablist">
        {TABS.map((t) => (
          <button key={t.id} role="tab" aria-selected={tab === t.id} class={tab === t.id ? 'active' : ''} onClick={() => choose(t.id)}>{t.label}</button>
        ))}
      </nav>
      {tab === 'tour' && <TourView />}
      {tab === 'chat' && <ChatView />}
      {tab === 'settings' && <SettingsView />}
    </main>
  );
}

const root = document.getElementById('app');
if (root) render(<SidePanel />, root);

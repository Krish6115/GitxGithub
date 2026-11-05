// On github.com/copilot: when Kitty handed a question over, type it into Copilot's chat box and tell the user to
// review it and press Enter. Kitty never submits it.
import { useEffect, useState } from 'preact/hooks';
import { COPILOT_PENDING_KEY, COPILOT_TTL_MS, fillBox, findCopilotBox, isCopilotDetour, isCopilotPage, type CopilotPending } from '../shared/copilot';
import { Icon } from '../shared/Icon';

export function CopilotFill() {
  const [status, setStatus] = useState<'idle' | 'filled' | 'missing' | 'signin'>('idle');
  const [prompt, setPrompt] = useState('');

  useEffect(() => {
    const detour = isCopilotDetour(location.href);
    if (!isCopilotPage(location.href) && !detour) return;
    let cancelled = false;
    void chrome.storage.session.get(COPILOT_PENDING_KEY).then(async (r) => {
      const p = r[COPILOT_PENDING_KEY] as CopilotPending | undefined;
      if (!p || Date.now() - p.at > COPILOT_TTL_MS) return;
      if (detour) {
        // signed out (or no Copilot): keep the question for after sign-in, and offer to copy it now
        setPrompt(p.prompt);
        return setStatus('signin');
      }
      await chrome.storage.session.remove(COPILOT_PENDING_KEY);
      setPrompt(p.prompt);
      // Copilot's page renders its chat box after load: wait for it
      for (let i = 0; i < 40 && !cancelled; i++) {
        const box = findCopilotBox();
        if (box) {
          fillBox(box, p.prompt);
          return setStatus('filled');
        }
        await new Promise((res) => setTimeout(res, 250));
      }
      if (!cancelled) setStatus('missing');
    });
    return () => void (cancelled = true);
  }, []);

  if (status === 'idle') return null;
  return (
    <div class="bubble copilot-note" data-kitty="copilot-note" role="status">
      <div class="meta"><Icon name="copilot" size={14} /> Handed over to GitHub Copilot</div>
      {status === 'signin' ? (
        <p>GitHub Copilot needs you to sign in (Copilot Free is enough). Sign in and open Copilot again within two minutes, and I'll type your question in. Or copy it now:</p>
      ) : status === 'filled' ? (
        <p>I typed your question into Copilot's chat. Check it, then press <strong>Enter</strong> to send.</p>
      ) : (
        <p>I couldn't find Copilot's chat box (you may need to sign in or enable Copilot). Copy the question and paste it in:</p>
      )}
      <div class="row">
        <button class="ghost" onClick={() => void navigator.clipboard.writeText(prompt)}>Copy question</button>
        <button class="ghost" onClick={() => setStatus('idle')}>Close</button>
      </div>
    </div>
  );
}

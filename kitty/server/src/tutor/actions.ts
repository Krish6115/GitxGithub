// Chat -> cat actions: the tutor can ask Kitty (the on-page cat) to do something, by ending its answer with one
// "ACTION: {...}" line. The server validates it and sends it as an `action` event; the extension carries it out.
import { z } from 'zod';

/** Mirror of the extension's shared/guides.ts ids. */
export const GUIDE_IDS = ['explore-repo', 'fork-clone', 'open-pr', 'review-pr', 'ci-checks', 'sync-fork'] as const;

const repoName = z.string().regex(/^[A-Za-z0-9_.-]{1,100}\/[A-Za-z0-9_.-]{1,100}$/);

export const ActionSchema = z.discriminatedUnion('type', [
  /** Search GitHub for beginner-friendly open issues matching a topic (optionally in one repo). */
  z.object({ type: z.literal('find_issues'), query: z.string().trim().min(1).max(120), repo: repoName.optional() }),
  /** Open a repo and start Kitty's tour. */
  z.object({ type: z.literal('tour'), repo: repoName }),
  /** Open an issue and have the cat explain it. */
  z.object({ type: z.literal('explain_issue'), repo: repoName, number: z.number().int().positive() }),
  /** Open an issue and start the "help me fix this issue" walkthrough. */
  z.object({ type: z.literal('fix_issue'), repo: repoName, number: z.number().int().positive() }),
  /** Open a pull request and run the pre-flight check. */
  z.object({ type: z.literal('check_pr'), repo: repoName, number: z.number().int().positive() }),
  /** Walk the user through GitHub's own pages, pointing at the real buttons (number = a PR, for review-pr). */
  /** Hand the request to GitHub Copilot (writing/changing code is Copilot's job, not Kitty's). */
  z.object({ type: z.literal('copilot'), prompt: z.string().trim().min(5).max(4000) }),
  z.object({ type: z.literal('guide'), repo: repoName, guide: z.enum(GUIDE_IDS), number: z.number().int().positive().optional() }),
]);
export type KittyAction = z.infer<typeof ActionSchema>;

export const ACTIONS_PROMPT = [
  'KITTY ACTIONS (the cat on the page can act for the user):',
  '- If the user asks Kitty to DO something on GitHub, end your reply with exactly one line: ACTION: {json}. Keep the text before it to one or two short sentences (no SOURCES needed, no Situation/Commands format).',
  '- {"type":"find_issues","query":"<topic words, e.g. docker beginner>","repo":"owner/name"} find open, beginner-friendly issues. Include "repo" only if the user wants this repo (use PAGE or TOUR for "this repo").',
  '- {"type":"tour","repo":"owner/name"} open a repository and start the guided tour.',
  '- {"type":"explain_issue","repo":"owner/name","number":123} open an issue and explain it on the page.',
  '- {"type":"fix_issue","repo":"owner/name","number":123} open an issue and walk through the files to change.',
  '- {"type":"check_pr","repo":"owner/name","number":45} open a pull request and run the pre-flight check.',
  '- {"type":"guide","repo":"owner/name","guide":"<id>"} show the user HOW to do something on GitHub: the cat walks through GitHub\'s pages pointing at the real buttons. Ids: explore-repo (find your way around), fork-clone, open-pr, review-pr (needs "number" of the PR), ci-checks, sync-fork. Use it for "show me how to…" / "where do I click to…" questions about GitHub\'s website; use the repo from PAGE or TOUR.',
  '- {"type":"copilot","prompt":"<a complete, self-contained request for GitHub Copilot, including the repo, file and what to do>"} when the user wants code WRITTEN, CHANGED, REFACTORED, GENERATED (tests, features, fixes) or a deep code review. Kitty teaches and explains; Copilot writes code. Say so in one friendly sentence, then add this line.',
  '- Only use repos and numbers the user gave or that appear in PAGE/TOUR. Never invent them. If something is missing, ask instead of acting.',
  '- For normal questions (how/why/what), do not add an ACTION line.',
].join('\n');

const LINE = /^\s*ACTION:\s*(\{.*\})\s*$/m;

/** The action in a finished answer, if any (invalid or unknown actions are ignored). */
export function parseAction(answer: string): KittyAction | null {
  const m = LINE.exec(answer);
  if (!m?.[1]) return null;
  try {
    const parsed = ActionSchema.safeParse(JSON.parse(m[1]));
    return parsed.success ? parsed.data : null;
  } catch {
    return null;
  }
}

// "Find a good first issue": ranks a repo's open, unassigned issues for a newcomer. Pure heuristics, no model.
import type { Issue } from './client.js';

export interface BeginnerIssue {
  number: number;
  title: string;
  url: string;
  labels: string[];
  comments: number;
  updatedAt: string;
  score: number;
  /** Short, human reasons, e.g. "labelled good first issue", "quiet thread". */
  reasons: string[];
}

export interface BeginnerIssues {
  issues: BeginnerIssue[];
  /** false when the repo labels no issue as beginner-friendly and these are just the quietest recent ones */
  labeled: boolean;
}

const GOOD_FIRST = /good[\s_-]*first|first[\s_-]*timers?|beginner|newcomer|starter|\beasy\b|e-easy|low[\s_-]*hanging|difficulty[:\s_-]*(low|easy)/i;
const HELP = /help[\s_-]*wanted|contributions?[\s_-]*welcome|up[\s_-]*for[\s_-]*grabs|hacktoberfest|pr[\s_-]*welcome/i;
const DOCS = /\bdocs?\b|documentation|typo/i;
const AVOID = /\bhard\b|complex|breaking|security|needs[\s_-]*(design|discussion|triage|decision|info)|blocked|wontfix|won't[\s_-]*fix|duplicate|invalid|question|discussion|on[\s_-]*hold|stale|in[\s_-]*progress|assigned/i;
const DAY = 86_400_000;

export function scoreIssue(issue: Issue, now: number): BeginnerIssue | null {
  if (issue.pull_request !== undefined || issue.assignees.length > 0 || issue.state !== 'open') return null;
  const labels = issue.labels;
  const reasons: string[] = [];
  let score = 0;
  const first = labels.find((l) => GOOD_FIRST.test(l));
  const help = labels.find((l) => HELP.test(l));
  if (first) {
    score += 10;
    reasons.push(`labelled "${first}"`);
  }
  if (help) {
    score += 5;
    reasons.push(`labelled "${help}"`);
  }
  if (labels.some((l) => DOCS.test(l))) {
    score += 2;
    reasons.push('docs change: a gentle start');
  }
  const avoid = labels.find((l) => AVOID.test(l));
  if (avoid) score -= 8;
  if (issue.comments <= 3) {
    score += 2;
    reasons.push(issue.comments === 0 ? 'nobody has replied yet' : 'quiet thread');
  } else if (issue.comments > 10) {
    score -= 3;
  }
  const age = now - Date.parse(issue.updated_at);
  if (age < 90 * DAY) {
    score += 1;
    reasons.push('recently active');
  } else if (age > 365 * DAY) {
    score -= 2;
  }
  return {
    number: issue.number,
    title: issue.title,
    url: issue.html_url,
    labels,
    comments: issue.comments,
    updatedAt: issue.updated_at,
    score,
    reasons,
  };
}

/** Top `limit` beginner-friendly issues; when none are labelled as such, the quietest recent ones (flagged). */
export function rankBeginnerIssues(issues: Issue[], now = Date.now(), limit = 5): BeginnerIssues {
  const scored = issues.map((i) => scoreIssue(i, now)).filter((i): i is BeginnerIssue => i !== null);
  const labeled = scored.filter((i) => i.labels.some((l) => GOOD_FIRST.test(l) || HELP.test(l)) && !i.labels.some((l) => AVOID.test(l)));
  const pool = labeled.length > 0 ? labeled : scored.filter((i) => !i.labels.some((l) => AVOID.test(l)));
  pool.sort((a, b) => b.score - a.score || Date.parse(b.updatedAt) - Date.parse(a.updatedAt));
  return { issues: pool.slice(0, limit), labeled: labeled.length > 0 };
}

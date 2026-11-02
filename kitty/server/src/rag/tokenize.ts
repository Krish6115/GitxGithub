// Git-aware tokenizer shared by the indexer (kitty/ingest) and the retriever.
// Changing anything here changes how text is indexed: bump TOKENIZER_VERSION and re-run `npm run ingest`.

export const TOKENIZER_VERSION = 1;

const STOPWORDS = new Set(
  ('a an and are as at be but by can could did do does doing for from had has have how i if in into is it its just ' +
    'me my no not of on or our so should than that the their them then there these they this to too up us was we ' +
    'what when where which while who why will with would you your git use using want need get').split(' '),
);

// Special git shapes that must survive as single tokens.
const SPECIAL = [
  /@\{-?\d+\}/g, // @{-1}, @{2}
];
const SPLIT = /[\s,;:()[\]{}"'`<>!?|*=]+/;

/** Split text into raw tokens, keeping flags (`--force-with-lease`), revisions (`HEAD~1`), refs and paths intact. */
export function tokenize(text: string): string[] {
  const out: string[] = [];
  let rest = text;
  for (const re of SPECIAL) {
    rest = rest.replace(re, (m) => {
      out.push(m);
      return ' ';
    });
  }
  for (const piece of rest.split(SPLIT)) {
    // trim sentence punctuation, but keep a leading "-" (flags) or "." (.gitignore) and a trailing "~N" / "^"
    const t = piece.replace(/^[^\w.@~^-]+/, '').replace(/(?<![~^\d])[.\-/]+$/, '').replace(/^\.(?=\.)/, '');
    if (!t || /^[-.]+$/.test(t)) continue;
    out.push(t);
    if (/^-/.test(t)) continue; // flags stay whole
    // compound tokens are indexed whole AND as parts: cherry-pick -> cherry, pick; origin/main -> origin, main
    if (/[-/]|\.\.|[~^]/.test(t)) {
      for (const part of t.split(/[-/~^]+|\.\.+/)) if (part && part !== t) out.push(part);
    }
  }
  return out;
}

/** Light English stemmer, applied only to plain alphabetic words. */
export function stem(w: string): string {
  if (w.length <= 3) return w;
  let s = w;
  if (s.endsWith('ies') && s.length > 4) s = s.slice(0, -3) + 'y';
  else if (s.endsWith('sses')) s = s.slice(0, -2);
  else if (s.endsWith('s') && !/(ss|us|is)$/.test(s)) s = s.slice(0, -1);
  let suffixCut = false;
  for (const suf of ['ing', 'ed']) {
    if (s.endsWith(suf) && s.length - suf.length >= 3) {
      s = s.slice(0, -suf.length);
      suffixCut = true;
      break;
    }
  }
  if (suffixCut && /([b-df-hj-np-tv-z])\1$/.test(s) && !/(ll|ss|zz)$/.test(s)) s = s.slice(0, -1); // committ -> commit
  if (s.length > 3 && s.endsWith('e')) s = s.slice(0, -1); // merge/merging/merged -> merg
  return s;
}

/** Normalize one token: lowercase, drop stopwords, stem plain words; git-shaped tokens pass through unchanged. */
export function processTerm(term: string): string | null {
  const t = term.toLowerCase();
  if (!/^[a-z]+$/.test(t)) return t.length > 0 ? t : null; // flags, revisions, refs, paths, numbers
  if (t.length < 2 || STOPWORDS.has(t)) return null;
  return stem(t);
}

/** Convenience: tokenize + processTerm, dropping nulls. */
export function terms(text: string): string[] {
  return tokenize(text).map(processTerm).filter((t): t is string => t !== null);
}

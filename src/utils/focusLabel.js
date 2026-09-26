/**
 * Paste guard for focus areas (s121j, 26 Sep 2026) — mirrors focusLabel() in
 * the backend's briefService, which is the one that decides; this copy only
 * lets the page explain the problem before a round trip. On 26 Sep a chunk of
 * chat text was pasted into the box and became a section on a client's brief.
 * Returns { label } or { error }.
 */
export const MAX_LABEL = 80;
export const MAX_WORDS = 10;

export function focusLabel(raw) {
  const text = String(raw ?? '');
  if (/[\r\n]|\*\*|`|https?:|:\/\/|\s#{1,6}\s|^#{1,6}\s/.test(text)) {
    return { error: 'That looks like pasted text. Type a short focus area, e.g. "AI-powered creative at scale".' };
  }
  const label = text.replace(/\s+/g, ' ').trim();
  if (label.length < 3) return { error: 'A focus area needs at least 3 characters.' };
  if (/^([-*•]|\d+[.)])\s/.test(label) || /[.!?]\s+\S/.test(label)) {
    return { error: 'That looks like a sentence or a list. Type one short focus area.' };
  }
  if (label.length > MAX_LABEL) return { error: `Keep a focus area under ${MAX_LABEL} characters.` };
  if (label.split(' ').length > MAX_WORDS) return { error: `Keep a focus area to ${MAX_WORDS} words or fewer.` };
  return { label };
}

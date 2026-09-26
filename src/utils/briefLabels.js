/**
 * Brief Preview accuracy labels (s121k), applied on the client the way the
 * server applies them, so a 👍/👎 click shows at once.
 */
// s121k — a label applied locally, as the server will: 👍 marks the card, 👎 hides it; the score follows.
export function applyLabel(b, { priority_key, startup_user_id, label }) {
  if (!b) return b;
  return { ...b, sections: b.sections.map((s) => {
    if (s.priority_key !== priority_key) return s;
    const prev = s.items.find(i => i.user_id === startup_user_id)?.eval_label || null;
    const items = label === 'bad'
      ? s.items.filter(i => i.user_id !== startup_user_id)
      : s.items.map(i => (i.user_id === startup_user_id ? { ...i, eval_label: label } : i));
    if (!s.quality) return { ...s, items };
    const q = { ...s.quality };
    if (prev === 'good') q.good -= 1;
    if (prev === 'bad') q.bad -= 1;
    if (label === 'good') q.good += 1;
    if (label === 'bad') q.bad += 1;
    q.labeled = q.good + q.bad;
    return { ...s, items, quality: q };
  }) };
}

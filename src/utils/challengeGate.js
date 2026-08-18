/**
 * s81 (18 Aug 2026) — UX mirror of the backend gate (src/utils/challengeGate.js
 * in openi-hub-backend). Reported by Dentsu: a closed challenge accepted invites
 * and reported "invitation sent" while nothing usable happened.
 *
 * THIS IS NOT THE ENFORCEMENT. The backend returns 409 with the message and is
 * the only thing that actually stops an invite; core.js:96 already turns that
 * body into err.message, which the modal's catch already toasts. This copy
 * exists purely so the user is told BEFORE composing a list of invitees rather
 * than after pressing Send.
 *
 * That split matters if the two ever disagree: this one failing open costs a
 * wasted click and a toast, never a bad write. Do not promote it to a security
 * control, and do not delete the backend gate because this exists.
 */

const TERMINAL_STATUSES = ['closed', 'awarded'];

export function deadlinePassed(deadline) {
  if (!deadline) return false;
  const d = new Date(deadline);
  if (Number.isNaN(d.getTime())) return false;
  return d.setHours(0, 0, 0, 0) < new Date().setHours(0, 0, 0, 0);
}

/** @returns {{ok: true} | {ok: false, reason: string, message: string}} */
export function canInviteToChallenge(challenge) {
  if (!challenge) return { ok: true };  // unknown → let the server decide
  if (TERMINAL_STATUSES.includes(challenge.status)) {
    // Verbatim from the client's bug report. Keep in sync with the backend copy.
    return { ok: false, reason: 'closed', message: 'Invitation cannot be sent because the challenge is closed' };
  }
  if (deadlinePassed(challenge.deadline)) {
    return { ok: false, reason: 'expired', message: 'Invitation cannot be sent because the challenge has passed its deadline' };
  }
  return { ok: true };
}

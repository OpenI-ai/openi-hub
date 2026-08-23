#!/bin/bash
# SessionStart hook — Claude Code on the web.
#
# Two jobs:
#   1. Install frontend dependencies, so lint/build work in the first turn
#      rather than after a manual `npm install` mid-task.
#   2. Report whether the backend sibling repo is present, because openi-hub
#      and openi-hub-backend are routinely changed together and the backend is
#      NOT attached to a session by default.
set -euo pipefail

# Local checkouts already have their own node_modules and sibling repos; this
# only exists to make a fresh remote container usable.
if [ "${CLAUDE_CODE_REMOTE:-}" != "true" ]; then
  exit 0
fi

cd "$CLAUDE_PROJECT_DIR"

# `install`, not `ci`: the container image is cached after this hook completes,
# and install can reuse that cache across sessions where ci always wipes
# node_modules and starts over.
if [ ! -d node_modules ] || [ package-lock.json -nt node_modules ]; then
  npm install --no-audit --no-fund
else
  echo "node_modules present and newer than package-lock.json — skipping install"
fi

# ── Backend sibling repo ────────────────────────────────────────────────────
# OpenI-ai/openi-hub-backend is PRIVATE, so this hook cannot clone it: the
# session's git proxy only serves credentials for repos attached to the
# session, and nothing is attached at SessionStart beyond the session's own
# sources. Detect and instruct rather than fail.
#
# The durable fix is to add openi-hub-backend as a second SOURCE on the
# environment, which makes it present before this hook ever runs. This block
# is the fallback for when that has not been done.
BACKEND_DIR="${OPENI_BACKEND_DIR:-/home/user/openi-hub-backend}"

if git -C "$BACKEND_DIR" rev-parse HEAD >/dev/null 2>&1; then
  echo "openi-hub-backend: present at $BACKEND_DIR ($(git -C "$BACKEND_DIR" rev-parse --short HEAD))"
else
  cat <<'NOTE'

NOTE TO CLAUDE — the backend repo is not in this container.

OpenI-ai/openi-hub and OpenI-ai/openi-hub-backend are changed together often
enough that a frontend-only session is usually the wrong starting point: the
marketplace pager, the Knowledge Hub report fields and the public /reports
payload all span both.

If this session touches API behaviour, response shapes or anything under
src/pages/dashboard that reads them, attach the backend BEFORE planning:

  1. add_repo  owner=OpenI-ai  repo=openi-hub-backend  access=push
  2. git clone --depth 1 https://github.com/OpenI-ai/openi-hub-backend \
       /home/user/openi-hub-backend
  3. register_repo_root for that path

It is private, so step 1 is required — the clone fails without it. Do not
re-clone if the directory already exists and `git rev-parse HEAD` succeeds.

If the work is purely frontend, ignore this.
NOTE
fi

---
description: End-of-session wrap-up - sync README/CLAUDE.md/PRD.md with what actually changed, commit, then ask before pushing
---

Run this procedure now, in order. This is a documentation-sync step, not a code-review step — don't second-guess or redo the session's actual work.

1. **Check for uncommitted changes.** Run `git status --short` and `git diff --stat` in the ParrotSpeak repo. If there's nothing uncommitted and nothing to sync in the docs below, say so plainly and stop here — don't manufacture busywork.

2. **Decide what actually needs updating**, based on this session's real work (not by re-deriving from scratch):
   - **CLAUDE.md** — architecture/infra changes, newly fixed or newly discovered "Known Issues & Landmines," anything that would mislead a future session if left stale. Most sessions touch this if they changed how something works.
   - **README.md** — only if user-facing setup/usage/feature-list claims changed. Most sessions do NOT need this touched — don't edit it reflexively.
   - **PRD.md** — only if a Part One feature's actual behavior changed, or a Part Two gap-analysis item's status changed (fixed, newly found, etc.). Cross-check against the live claude.ai artifact URL at the top of PRD.md if there's any doubt it's already in sync — PRD.md is a snapshot, not the source of truth.

3. **Make the edits.** Keep changes factual and specific to what happened this session — no speculative "future work" additions, no rewriting sections that are still accurate.

4. **Verify before committing:** if code changed, confirm `npm run type-check` still passes clean. Don't commit on top of a broken build.

5. **Commit** everything (doc updates plus any other uncommitted work from the session) with one commit message describing what the session actually did. Do not push yet.

6. **Ask the user explicitly before pushing** — state what's committed and ask for a clear go-ahead. Never push without that confirmation, regardless of how the session ended or how confident the changes look. (This project had a real incident with an unauthorized background push — see CLAUDE.md/memory for context. Treat that as a hard rule, not a formality.)

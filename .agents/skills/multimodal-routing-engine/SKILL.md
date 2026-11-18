---
name: multimodal-routing-engine
description: Superseded pointer. Use marshgo-routing for MARSHGO multimodal journey invariants.
---

# Multimodal routing engine — superseded

Superseded by `marshgo-routing` on 2026-11-03. Load that skill instead; this stub exists only so older task notes and git history still resolve.

Verified facts from this skill were moved, not deleted: walk limits 900 / 1000 / 400 m and the 150 m implicit intermodal walk now live in `marshgo-routing` with code citations (`MarshGO-Server/server/journey/gtfsTimetable.ts:38-43`).

The 6–10 minute transfer penalty and the segment-ribbon field list were never confirmed in code — read `server/journey/` for the actual cost model before tuning anything.

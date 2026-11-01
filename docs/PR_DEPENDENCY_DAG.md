# Open PR dependency graph — 2026-10-26

GitHub open-PR metadata was queried for all six canonical repositories. Arrows below mean **head branch → base branch**. They describe GitHub PR ancestry, not confirmation that the change is integrated in the current release manifest.

## Orchestrator (`dima1203oleg/MarshGO`)

```text
#6 security-dependencies -> production-finalization (#5) -> marshgo-production (#1) -> main
#4 unified-repository-governance -> navigation-experience-6 (#3) -> redis-smart-cache (#2) -> marshgo-production (#1)
```

PR #2 is `CONFLICTING`; #1, #3–#6 are reported mergeable. #1/#4/#5/#6 are drafts. Resolve the cache chain before considering the release chain; do not merge all heads independently.

## Server (`MarshGO-Server`)

```text
#42 sorted-frontier-scan -> #41 nearby-stop-retention -> #40 current-pr39-integration
 -> #39 pathway-retention -> #38 round-search -> #36 production-integration
 -> #34 raptor-round-search -> #33 raptor-multilabel -> #31 realtime-freshness
 -> #30 lazy-event-search -> #29 candidate-diversity -> #28 compact-edge-retention
 -> #27 bounded-timetable -> #26 Lviv-trip-update -> #25 direct-only-search
 -> #24 route-oracle -> #23 sampling-truncation -> #22 freshness -> #21 server-release-integration
 -> #19 GTFS fixture / rendezvous stack -> #17 trip-segment-sampling -> #15 transfer-rule-index
 -> #14 worker-bounded-cache -> #12 journey-search-completeness -> #10 -> #9 -> main
```

Separate branch families include PR #20/#19 rendezvous/HTTP-fixture work, PR #7/#5/#4/#3 mobility-registry/cache/partner foundation, PR #6 GTFS stop arrivals, PR #2 bearer parsing. PR #1 rendezvous-live-pickup is `CONFLICTING`. Most recent PRs #38–#42 are a deep draft stack. Existing local dirty Server branch is PR #7's head branch, while current working code has additional uncommitted deltas.

## Site (`MarshGO-Site`)

```text
#27 GTFS-truncation-reasons -> #26 map-layers-fit -> #25 current-pr24-integration
 -> #24 place-search-guard -> #23 rideshare-route-detail -> #22 map-layers-reference
 -> #21 site-final-rc -> sync-journey-mobility-ui (#3) -> main
```

Earlier route-sheet/navigation chain: PR #20 -> #19 -> #18 -> #15, with PR #17 also targeting the route-overview branch. Rendezvous and production integration chain: PR #14 -> #13 -> #12 -> #11 -> #9 -> main; PR #10 also targets integration #9. PR #1 rendezvous-live-pickup is `CONFLICTING`. The current dirty checkout is the base for PR #21, not a cleanly materialized immutable candidate.

## iOS (`MarshGO-iOS`)

Current release-candidate PR #14 targets `main` directly and is reported mergeable. Older exact-pin stack: PR #12 -> #11 -> #9 -> #8 -> #7 -> `main`; PR #3 redis-smart-cache is `CONFLICTING`, and PR #1 simulator-smoke-capture is `CONFLICTING`. Do not combine this older stack with PR #14 without comparing exact Site and Server pins.

## Admin and Partner

- Admin PR #1 `codex/p0-admin -> main` is open and mergeable; PR #2 ownership guidance is a draft.
- Partner PR #1 `codex/p0-partner -> main` is open and mergeable; PR #2 ownership guidance is a draft.

## Safe integration conclusion

There are long stacked PR chains, drafts, conflicting PRs, and local source deltas. The safe path is to select one reviewed head per component, verify its parent ancestry and checks, then pin the exact 5+1 tuple in the orchestrator. This inventory does not authorize or perform merges, branch deletion, force-push, or deployment.

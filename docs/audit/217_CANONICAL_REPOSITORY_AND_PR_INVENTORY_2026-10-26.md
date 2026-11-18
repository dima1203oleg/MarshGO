# Canonical repository / PR inventory and exact tuple — 2026-10-26

## Results

- Queried the six user-authorized repositories only: MarshGO, MarshGO-Server, MarshGO-Site, MarshGO-iOS, MarshGO-Admin, MarshGO-Partner.
- Current local branches and SHAs, dirty path counts, manifest pins and deployment status are recorded in [REPOSITORY_INVENTORY.md](../REPOSITORY_INVENTORY.md).
- The open PR head/base graph and known conflicts are recorded in [PR_DEPENDENCY_DAG.md](../PR_DEPENDENCY_DAG.md). The graph contains deep Server/Site stacks and open drafts; GitHub's `MERGEABLE` flag was not treated as semantic or release acceptance.
- The current manifest remains `NOT_RELEASED`, `production_ready=false`, `ready_for_server_deployment=false`; staging URL/provider are null, prior ngrok staging is recorded offline, and `deployed_site_sha` is null.
- Current dirty Server/Site source and current iOS/Admin checkouts do not match the manifest tuple. Partner HEAD matches its manifest SHA. No branch was merged, deleted, force-pushed or deployed.
- Root manifest's historical `current_candidate_checks` include exact-head hosted checks, but the root orchestrator Verify is blocked by missing `MARSHGO_REPOS_READ_TOKEN`; those checks do not cover current uncommitted source trees.
- Server has 75 registered Git worktrees; 30 report `prunable`. This is not a cleanup authorization: no worktree or branch was removed because detached/unique local changes must first be mapped and preserved.

## Browser verification completed

- Post-locator-fix full Playwright run: **25/25 PASS in 6.7 minutes** against the isolated `marshgo_e2e` loopback database, current dirty Server checkout and local fixture-built Site.
- Button/control audit in that run: **179 clicked; zero inert; zero changed before click**. Covered route selection/focus, route URL restore, 12 transport modes, two-account search/booking/demand/chat, driver GPS reroute, responsive iPhone 15/16 Pro Max viewports, GPS denial, partial-result warning, price/strategy metadata and consent/revocation rendezvous.
- The run is local fixture evidence only (test API, map, geocoder and OSRM). It does not close staging, live-provider, physical-iPhone, all-mockup parity or production acceptance.
- Separate direct compatibility smoke on the same dirty Site bundle: **3/3 PASS** (one responsive sign-in/home/search scenario in Chromium, Firefox and WebKit; 43.7 seconds). This is not a full cross-browser replay of every route, role or map scenario.

## Durable reports

- [Architecture audit](../ARCHITECTURE_AUDIT.md)
- [Implementation matrix](../IMPLEMENTATION_MATRIX.md)
- [Repository inventory](../REPOSITORY_INVENTORY.md)
- [PR dependency DAG](../PR_DEPENDENCY_DAG.md)

## Next action

Reconcile exact parent ancestry and review dirty Server/Site diffs into a reproducible immutable tuple; keep dense-feed truncation visible. Do not merge conflicting/draft stacks or change `NOT_RELEASED` without the corresponding evidence.

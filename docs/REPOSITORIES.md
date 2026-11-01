# MARSHGO GitHub repositories

The original [`MarshGO`](https://github.com/dima1203oleg/MarshGO) repository remains the umbrella/source-history repository. The product is also published as three focused public repositories:

| Repository | Owns | Build entry |
| --- | --- | --- |
| [`MarshGO-Server`](https://github.com/dima1203oleg/MarshGO-Server) | TypeScript API, SQL migrations, DB/Redis development stack, backend tests and API/security/deployment docs | `npm ci && npm run typecheck && npm test`; `docker compose up -d db redis` for integration tests |
| [`MarshGO-Site`](https://github.com/dima1203oleg/MarshGO-Site) | React/Vite PWA, responsive screens and static assets | `npm ci && npm run lint && npm run typecheck && npm run build` |
| [`MarshGO-iOS`](https://github.com/dima1203oleg/MarshGO-iOS) | Capacitor/Xcode wrapper, simulator build workflow and iOS setup | Build consumes the Site repository into `web/` and runs `npx cap sync ios` |

The iOS repository deliberately consumes the site repository instead of carrying a second copy of the React application. Its GitHub Action compiles the iOS Simulator target; it does not sign or publish an App Store build. Set the repository variable `MARSHGO_API_BASE_URL` before generating a usable native bundle.

The focused repositories have independent default branches and commits; matching feature names or a recent umbrella report do not prove that their contents match. Treat their commit SHAs as separate release inputs. The umbrella repository's CI remains the cross-repository end-to-end acceptance source.

The iOS workflow now permits the Site `main` branch for development builds. A version-tagged iOS build fails closed unless repository variables pin full commit SHAs for Site and Server and specify the API-contract and database-migration versions. It embeds `release-manifest.json` in the app bundle, recording the exact iOS, Site, and Server revisions. Set these variables only after reviewing the corresponding canonical commits. This workflow compiles an unsigned simulator target; it does not sign or publish an App Store release.

Production launch remains blocked on external service configuration and staging/device acceptance recorded in [`PRODUCTION_CHECKLIST.md`](PRODUCTION_CHECKLIST.md).

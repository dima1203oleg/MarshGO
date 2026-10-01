# Owner actions required

No owner response is needed to continue software work. These external inputs are required only for hosted release acceptance:

**Credential hygiene follow-up:** During staging process inspection, the inherited shell environment contained unrelated third-party AI API keys and their names/values appeared in a Codex diagnostic output. Those keys were not configured for MARSHGO services or forwarded by the staging edge. The edge was stopped and relaunched with an empty allowlisted environment. If these are live credentials, revoke/rotate them in their vendor consoles and remove them from broadly inherited shell environments. Do not send the replacement values in chat.

| Blocker | Why / when needed | Exact owner action | What it unblocks |
|---|---|---|---|
| Linux server or managed hosting | Before hosted staging and deployment | Provide SSH access/IP, OS, CPU/RAM/disk, and operator account or hosting project | Bootstrap, HTTPS, migration, restore drill, staging smoke |
| Domain and DNS | Before public TLS | Provide a purchased domain and DNS control; point A/AAAA records to the host | Caddy ACME certificate and public app/API URLs |
| SMS | Before real-user OTP | Provide approved provider account, verified sender, and secrets through a secret manager | Real SMS delivery and auth acceptance |
| Routing/geocoding/map data | Before real-route/map release | Select contracted/self-hosted endpoints, attribution/data license, and credentials | Real production route, address, tiles, and map health tests |
| Private object storage and malware scan | Before production vehicle/document uploads | Provide private S3-compatible endpoint/bucket, encryption/access policy, lifecycle/logging, and scanner endpoint/license | Production upload, review, retention, delete acceptance |
| Apple Developer/APNs | Before signed TestFlight/push acceptance | Provide Apple team access, signing/provisioning, APNs key, bundle ID/Associated Domains | Signed Release archive, APNs, Universal Links/TestFlight |
| Physical iPhones | Before two-device acceptance | Provide two supported iPhones with TestFlight and staging network access | GPS/background/QR/push/rendezvous physical acceptance |
| Payments | Only if commercial online checkout ships | Choose merchant/provider and provide sandbox/production credentials plus webhook configuration | Payment intent/capture/refund certification |
| Commercial transport providers | Only for modes enabled at launch | Provide contracts, approved feeds, API endpoints/credentials for bus/rail/taxi | Real commercial availability, fares, booking and delay feeds |
| Rotate potentially exposed unrelated AI provider keys | Immediately, if live | Revoke and replace the AI provider API keys that were present in the inherited process environment (Cohere, Gemini/Google, Mistral, OpenRouter, Together, and Z.ai); remove them from global shell exports. Store replacements in the provider's secret manager only. | Restores confidence in those unrelated accounts; replacement keys are not required by MARSHGO staging. |

Local services, integration fixtures, and Simulator are explicitly not represented as substitutes for these hosted/provider/device checks.

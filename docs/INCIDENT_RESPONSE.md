# Incident response

## Readiness

This document is a response outline. Alerting, error tracking, named on-call owners, escalation contacts, and incident paging are not configured, so it is not a complete operational response system.

## First response

1. Record UTC start time, affected environment, symptoms, request/correlation IDs, and customer impact. Do not copy tokens, phone numbers, chat contents, documents, or precise location into incident notes.
2. Check `/healthz`, `/readyz`, API logs, database/Redis health, outbox depth/oldest age, provider health, and recent deploy/config changes.
3. For API or dependency failure, disable only the affected optional provider/feature if its kill switch exists; do not advertise stale transport or map data as live.
4. For booking/inventory integrity, stop the affected write path and reconcile authoritative PostgreSQL rows before reopening it.
5. For suspected credential exposure, revoke/rotate the affected credential at its provider, replace the application secret, and inspect access logs. Never paste the secret into the incident record.
6. Restore service using the deployment rollback procedure only after confirming database compatibility. Preserve request IDs and scrubbed logs for investigation.
7. Close with a timeline, verified user impact, root cause, data/privacy impact, recovery evidence, and assigned corrective actions.

## Severity and escalation

Define severity levels, response targets, customer communications, privacy/legal escalation, and 24/7 ownership with the operating team before public launch. Those policies cannot be inferred from this codebase.

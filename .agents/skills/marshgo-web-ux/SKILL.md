---
name: marshgo-web-ux
description: Implement and verify canonical MARSHGO Web/PWA search, route, map, and passenger/driver interactions.
---

# MARSHGO Web UX

- Work in production entrypoints, not demo components. Preserve the five-item navigation and shared route-lip contract.
- Use Ukrainian copy, keyboard and screen-reader labels, reduced motion, safe areas, and touch targets of at least 44 by 44 CSS pixels.
- Check the affected viewport states at 320, 390, 430, 768, 1280, and 1440 pixels; avoid mobile-phone framing on desktop.
- Keep date/time and passenger controls clear; never imply a flexible date range until the API accepts it.
- Verify rendered behavior in the browser after targeted lint/typecheck/build as applicable.

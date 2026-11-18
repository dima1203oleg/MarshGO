-- The previous Kyiv seed used guessed partner URLs and hard-coded fleet counts.
-- Disable those records until authorized provider APIs and data rights are verified.
UPDATE mobility_providers
   SET status = 'disabled',
       health = 'offline',
       access = 'requires_partner_access',
       license = NULL,
       commercial_use = false,
       attribution_required = true,
       discovery_status = 'REQUIRES_PARTNERSHIP',
       last_error = 'REQUIRES_PARTNERSHIP: authorized provider API and data rights are not configured',
       last_report = jsonb_build_object(
         'health', 'offline',
         'checks', jsonb_build_array(jsonb_build_object(
           'ok', false,
           'name', 'provider API and data rights',
           'error', 'REQUIRES_PARTNERSHIP: authorized provider API and data rights are not configured'
         ))
       ),
       last_checked_at = now(),
       updated_at = now()
 WHERE city = 'Київ'
   AND (name IN ('Uklon — Таксі', 'Bolt — Таксі', 'Zelectra — Електросамокати', 'Bikenow — Велопрокат', 'Getmancar — Каршеринг')
        OR name ILIKE '3electra%');

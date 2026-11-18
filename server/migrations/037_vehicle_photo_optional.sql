-- Temporary rule: a vehicle with a valid plate is usable (trust level 1) without a photo.
-- Set REQUIRE_VEHICLE_PHOTO=true on the API to require plate + photo again for new vehicles.
UPDATE vehicles SET trust_level=1 WHERE trust_level=0 AND plate IS NOT NULL AND archived_at IS NULL;

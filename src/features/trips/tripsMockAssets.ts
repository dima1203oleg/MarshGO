// Visual Assets and SVG Helpers for My Trips identical to mockup
export const TRIPS_MOCK_ASSETS = {
  // Toyota RAV4 / Dark Metallic SUV matching screenshot
  carRav4: `data:image/svg+xml;utf8,${encodeURIComponent(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 280 150" fill="none">
      <defs>
        <linearGradient id="rav4body" x1="0" y1="0" x2="280" y2="150" gradientUnits="userSpaceOnUse">
          <stop stop-color="#1E293B"/>
          <stop offset="0.4" stop-color="#334155"/>
          <stop offset="0.8" stop-color="#0F172A"/>
          <stop offset="1" stop-color="#020617"/>
        </linearGradient>
        <linearGradient id="rav4glass" x1="50" y1="25" x2="190" y2="70" gradientUnits="userSpaceOnUse">
          <stop stop-color="#93C5FD" stop-opacity="0.85"/>
          <stop offset="1" stop-color="#1E3A8A" stop-opacity="0.95"/>
        </linearGradient>
        <linearGradient id="rim" x1="0" y1="0" x2="1" y2="1">
          <stop stop-color="#E2E8F0"/>
          <stop offset="1" stop-color="#475569"/>
        </linearGradient>
      </defs>
      <!-- Wheels -->
      <circle cx="68" cy="112" r="26" fill="#090D16"/>
      <circle cx="68" cy="112" r="16" fill="url(#rim)" stroke="#94A3B8" stroke-width="3"/>
      <circle cx="68" cy="112" r="6" fill="#0F172A"/>
      <circle cx="212" cy="112" r="26" fill="#090D16"/>
      <circle cx="212" cy="112" r="16" fill="url(#rim)" stroke="#94A3B8" stroke-width="3"/>
      <circle cx="212" cy="112" r="6" fill="#0F172A"/>
      <!-- Body SUV High Profile -->
      <path d="M16 100 C18 78, 38 74, 60 74 L82 46 C98 28, 168 28, 204 46 L248 70 C264 74, 274 86, 272 104 L258 112 C248 108, 228 108, 218 112 L86 112 C76 108, 56 108, 44 112 Z" fill="url(#rav4body)"/>
      <!-- Windows & Pillars -->
      <path d="M88 47 C102 34, 162 34, 196 47 L190 70 L92 70 Z" fill="url(#rav4glass)"/>
      <line x1="140" y1="36" x2="140" y2="70" stroke="#0F172A" stroke-width="4"/>
      <!-- Roof Rails -->
      <path d="M96 28 L194 28" stroke="#64748B" stroke-width="3.5" stroke-linecap="round"/>
      <!-- Headlights / LED -->
      <polygon points="248,72 268,80 252,86" fill="#38BDF8"/>
      <!-- Grille -->
      <path d="M256 86 L268 98 L254 102 Z" fill="#0F172A" stroke="#475569" stroke-width="1"/>
      <!-- Taillight -->
      <polygon points="20,78 30,82 26,92 18,88" fill="#EF4444"/>
    </svg>
  `)}`,

  // White Sedan (Skoda Octavia)
  carOctavia: `data:image/svg+xml;utf8,${encodeURIComponent(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 280 150" fill="none">
      <defs>
        <linearGradient id="octaviabody" x1="0" y1="0" x2="280" y2="150" gradientUnits="userSpaceOnUse">
          <stop stop-color="#FFFFFF"/>
          <stop offset="0.5" stop-color="#F1F5F9"/>
          <stop offset="1" stop-color="#CBD5E1"/>
        </linearGradient>
        <linearGradient id="octaviaglass" x1="60" y1="30" x2="190" y2="70" gradientUnits="userSpaceOnUse">
          <stop stop-color="#60A5FA" stop-opacity="0.85"/>
          <stop offset="1" stop-color="#1E3A8A" stop-opacity="0.9"/>
        </linearGradient>
      </defs>
      <!-- Wheels -->
      <circle cx="65" cy="115" r="24" fill="#0F172A"/>
      <circle cx="65" cy="115" r="14" fill="#94A3B8" stroke="#E2E8F0" stroke-width="3"/>
      <circle cx="215" cy="115" r="24" fill="#0F172A"/>
      <circle cx="215" cy="115" r="14" fill="#94A3B8" stroke="#E2E8F0" stroke-width="3"/>
      <!-- Body -->
      <path d="M15 105 C25 85, 45 80, 70 80 L95 55 C115 35, 175 35, 205 55 L245 78 C265 80, 275 90, 275 105 L260 115 C250 110, 230 110, 220 115 L80 115 C70 110, 50 110, 40 115 Z" fill="url(#octaviabody)" stroke="#94A3B8" stroke-width="1"/>
      <!-- Windows -->
      <path d="M100 56 C115 42, 160 42, 195 56 L190 75 L105 75 Z" fill="url(#octaviaglass)"/>
      <!-- Headlights -->
      <polygon points="260,85 272,92 260,98" fill="#38BDF8"/>
      <!-- Taillight -->
      <polygon points="18,85 26,88 24,96 16,92" fill="#EF4444"/>
    </svg>
  `)}`,

  // Mini Map Preview Graphic (Stryi to Lviv satellite/vector hybrid style)
  mapMiniStryiLviv: `data:image/svg+xml;utf8,${encodeURIComponent(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 200" fill="none">
      <defs>
        <linearGradient id="mapbg" x1="0" y1="0" x2="320" y2="200" gradientUnits="userSpaceOnUse">
          <stop stop-color="#E2F1E8"/>
          <stop offset="0.5" stop-color="#EDF7F1"/>
          <stop offset="1" stop-color="#D7EADF"/>
        </linearGradient>
      </defs>
      <rect width="320" height="200" rx="16" fill="url(#mapbg)"/>
      <!-- Roads network background -->
      <path d="M10 50 Q80 80 160 40 T310 90" stroke="#CBD5E1" stroke-width="6" fill="none" opacity="0.6"/>
      <path d="M50 190 Q120 120 180 140 T290 180" stroke="#CBD5E1" stroke-width="5" fill="none" opacity="0.6"/>
      <path d="M30 180 L290 30" stroke="#E2E8F0" stroke-width="12" fill="none" opacity="0.4"/>
      <!-- Highlighted Active Route (Stryi -> Lviv) -->
      <path d="M45 160 C80 130, 110 115, 150 90 S220 75, 275 45" stroke="#3B82F6" stroke-width="6" stroke-linecap="round" fill="none"/>
      <!-- Route shadow -->
      <path d="M45 160 C80 130, 110 115, 150 90 S220 75, 275 45" stroke="#1D4ED8" stroke-width="2" stroke-dasharray="4 4" fill="none"/>
      <!-- Origin Pin (Стрий) -->
      <circle cx="45" cy="160" r="10" fill="#0066FF" stroke="#FFFFFF" stroke-width="3"/>
      <!-- Destination Pin (Львів) -->
      <circle cx="275" cy="45" r="10" fill="#0066FF" stroke="#FFFFFF" stroke-width="3"/>
      <!-- Place Labels -->
      <rect x="25" y="174" width="46" height="18" rx="6" fill="#0F172A" opacity="0.85"/>
      <text x="48" y="187" fill="#FFFFFF" font-size="10" font-family="sans-serif" font-weight="bold" text-anchor="middle">Стрий</text>
      <rect x="252" y="16" width="46" height="18" rx="6" fill="#0066FF"/>
      <text x="275" y="29" fill="#FFFFFF" font-size="10" font-family="sans-serif" font-weight="bold" text-anchor="middle">Львів</text>
    </svg>
  `)}`,

  // Map header preview for Detail View (Satellite with route line)
  mapDetailHeader: `data:image/svg+xml;utf8,${encodeURIComponent(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 320" fill="none">
      <defs>
        <linearGradient id="satbg" x1="0" y1="0" x2="600" y2="320" gradientUnits="userSpaceOnUse">
          <stop stop-color="#4B6651"/>
          <stop offset="0.3" stop-color="#556E5A"/>
          <stop offset="0.7" stop-color="#677E68"/>
          <stop offset="1" stop-color="#3D5341"/>
        </linearGradient>
      </defs>
      <rect width="600" height="320" fill="url(#satbg)"/>
      <!-- Topo texture lines -->
      <path d="M0 60 Q200 40 400 90 T600 70" stroke="#7E967D" stroke-width="8" fill="none" opacity="0.4"/>
      <path d="M0 240 Q180 200 360 250 T600 210" stroke="#7E967D" stroke-width="12" fill="none" opacity="0.3"/>
      <path d="M120 0 Q180 160 210 320" stroke="#364C3B" stroke-width="14" fill="none" opacity="0.5"/>
      <!-- Route line -->
      <path d="M140 210 C220 180, 310 130, 480 90" stroke="#0066FF" stroke-width="8" stroke-linecap="round" fill="none"/>
      <path d="M140 210 C220 180, 310 130, 480 90" stroke="#FFFFFF" stroke-width="2" stroke-linecap="round" fill="none"/>
      <!-- Origin Pin with Car -->
      <circle cx="140" cy="210" r="16" fill="#0066FF" stroke="#FFFFFF" stroke-width="4"/>
      <rect x="100" y="150" width="76" height="32" rx="10" fill="#FFFFFF" filter="drop-shadow(0 4px 6px rgba(0,0,0,0.2))"/>
      <text x="138" y="171" fill="#0F172A" font-size="13" font-family="sans-serif" font-weight="900" text-anchor="middle">Стрий</text>
      <!-- Destination Pin with 'Д' -->
      <circle cx="480" cy="90" r="16" fill="#0066FF" stroke="#FFFFFF" stroke-width="4"/>
      <text x="480" y="96" fill="#FFFFFF" font-size="14" font-family="sans-serif" font-weight="900" text-anchor="middle">Д</text>
    </svg>
  `)}`,

  // Verified driver Oleg photo
  avatarOleg: `data:image/svg+xml;utf8,${encodeURIComponent(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" fill="none">
      <defs>
        <linearGradient id="olegGrad" x1="0" y1="0" x2="100" y2="100">
          <stop stop-color="#475569"/>
          <stop offset="1" stop-color="#1E293B"/>
        </linearGradient>
      </defs>
      <circle cx="50" cy="50" r="50" fill="url(#olegGrad)"/>
      <!-- Head -->
      <circle cx="50" cy="38" r="19" fill="#FBD38D"/>
      <!-- Beard & glasses -->
      <path d="M38 42 C38 56, 62 56, 62 42 Z" fill="#6B46C1"/>
      <circle cx="43" cy="36" r="5" stroke="#0F172A" stroke-width="2" fill="none"/>
      <circle cx="57" cy="36" r="5" stroke="#0F172A" stroke-width="2" fill="none"/>
      <line x1="48" y1="36" x2="52" y2="36" stroke="#0F172A" stroke-width="2"/>
      <!-- Body -->
      <path d="M18 92 C24 68, 76 68, 82 92 Z" fill="#0066FF"/>
    </svg>
  `)}`,

  // Passenger Maria photo
  avatarMaria: `data:image/svg+xml;utf8,${encodeURIComponent(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" fill="none">
      <circle cx="50" cy="50" r="50" fill="#F472B6"/>
      <circle cx="50" cy="40" r="20" fill="#FEE2E2"/>
      <!-- Hair -->
      <path d="M28 36 C28 14, 72 14, 72 36 C72 52, 68 58, 68 58 L32 58 Z" fill="#92400E"/>
      <circle cx="43" cy="38" r="2.5" fill="#1F2937"/>
      <circle cx="57" cy="38" r="2.5" fill="#1F2937"/>
      <path d="M46 48 Q50 52 54 48" stroke="#E11D48" stroke-width="2" stroke-linecap="round"/>
      <path d="M20 94 C26 72, 74 72, 80 94 Z" fill="#EC4899"/>
    </svg>
  `)}`,

  // Passenger Avatar 1
  avatarUser1: `data:image/svg+xml;utf8,${encodeURIComponent(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" fill="none">
      <circle cx="50" cy="50" r="50" fill="#3B82F6"/>
      <circle cx="50" cy="40" r="18" fill="#FCD34D"/>
      <path d="M30 32 C34 18, 66 18, 70 32 Z" fill="#1E293B"/>
      <path d="M18 92 C24 68, 76 68, 82 92 Z" fill="#1E40AF"/>
    </svg>
  `)}`,

  // Passenger Avatar 2
  avatarUser2: `data:image/svg+xml;utf8,${encodeURIComponent(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" fill="none">
      <circle cx="50" cy="50" r="50" fill="#10B981"/>
      <circle cx="50" cy="40" r="18" fill="#FDE68A"/>
      <path d="M28 34 C30 16, 70 16, 72 34 Z" fill="#92400E"/>
      <path d="M18 92 C24 68, 76 68, 82 92 Z" fill="#065F46"/>
    </svg>
  `)}`,

  // Passenger Avatar 3
  avatarUser3: `data:image/svg+xml;utf8,${encodeURIComponent(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" fill="none">
      <circle cx="50" cy="50" r="50" fill="#8B5CF6"/>
      <circle cx="50" cy="40" r="18" fill="#FBCFE8"/>
      <path d="M32 30 C36 16, 64 16, 68 30 Z" fill="#312E81"/>
      <path d="M18 92 C24 68, 76 68, 82 92 Z" fill="#5B21B6"/>
    </svg>
  `)}`,
};

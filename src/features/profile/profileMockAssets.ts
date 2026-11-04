// SVG Mock assets for Profile Experience matching mockup
export const PROFILE_MOCK_ASSETS = {
  // Avatr 11 Modern Electric SUV matching screenshot
  carAvatr11: `data:image/svg+xml;utf8,${encodeURIComponent(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 180" fill="none">
      <defs>
        <linearGradient id="avatrBody" x1="0" y1="0" x2="320" y2="180" gradientUnits="userSpaceOnUse">
          <stop stop-color="#334155"/>
          <stop offset="0.3" stop-color="#1E293B"/>
          <stop offset="0.7" stop-color="#0F172A"/>
          <stop offset="1" stop-color="#020617"/>
        </linearGradient>
        <linearGradient id="avatrGlass" x1="60" y1="30" x2="220" y2="80" gradientUnits="userSpaceOnUse">
          <stop stop-color="#38BDF8" stop-opacity="0.8"/>
          <stop offset="1" stop-color="#0284C7" stop-opacity="0.95"/>
        </linearGradient>
        <linearGradient id="avatrWheel" x1="0" y1="0" x2="1" y2="1">
          <stop stop-color="#E2E8F0"/>
          <stop offset="1" stop-color="#334155"/>
        </linearGradient>
      </defs>
      <!-- Wheels with aerodynamic covers -->
      <circle cx="75" cy="130" r="30" fill="#090D16"/>
      <circle cx="75" cy="130" r="18" fill="url(#avatrWheel)" stroke="#94A3B8" stroke-width="3"/>
      <circle cx="75" cy="130" r="7" fill="#0F172A"/>
      <circle cx="245" cy="130" r="30" fill="#090D16"/>
      <circle cx="245" cy="130" r="18" fill="url(#avatrWheel)" stroke="#94A3B8" stroke-width="3"/>
      <circle cx="245" cy="130" r="7" fill="#0F172A"/>
      <!-- Body Coupe-SUV profile -->
      <path d="M20 115 C22 92, 45 88, 70 88 L100 52 C120 32, 195 32, 235 52 L285 82 C302 88, 312 102, 310 120 L292 130 C280 125, 260 125, 250 130 L95 130 C85 125, 65 125, 50 130 Z" fill="url(#avatrBody)"/>
      <!-- Streamlined Panoramic Roof & Windows -->
      <path d="M106 54 C122 38, 190 38, 226 54 L222 80 L110 80 Z" fill="url(#avatrGlass)"/>
      <line x1="165" y1="40" x2="165" y2="80" stroke="#0F172A" stroke-width="4"/>
      <!-- Slim LED Headlight Blade -->
      <path d="M285 84 L308 92 L290 98 Z" fill="#38BDF8"/>
      <!-- Digital Door Handles -->
      <rect x="135" y="88" width="18" height="4" rx="2" fill="#64748B"/>
      <rect x="195" y="88" width="18" height="4" rx="2" fill="#64748B"/>
      <!-- Taillight LED Bar -->
      <path d="M20 95 L28 98 L24 106 Z" fill="#EF4444"/>
    </svg>
  `)}`,

  // Dima Kizima Avatar with verified check badge
  avatarDima: `data:image/svg+xml;utf8,${encodeURIComponent(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" fill="none">
      <defs>
        <linearGradient id="dimaBg" x1="0" y1="0" x2="100" y2="100">
          <stop stop-color="#3B82F6"/>
          <stop offset="1" stop-color="#1D4ED8"/>
        </linearGradient>
      </defs>
      <circle cx="50" cy="50" r="50" fill="url(#dimaBg)"/>
      <!-- Head -->
      <circle cx="50" cy="38" r="19" fill="#FBD38D"/>
      <!-- Hair & Beard -->
      <path d="M34 26 C38 15, 62 15, 66 26 Z" fill="#451A03"/>
      <path d="M38 42 C38 56, 62 56, 62 42 Z" fill="#451A03"/>
      <!-- Glasses -->
      <circle cx="43" cy="36" r="5.5" stroke="#0F172A" stroke-width="2" fill="none"/>
      <circle cx="57" cy="36" r="5.5" stroke="#0F172A" stroke-width="2" fill="none"/>
      <line x1="48.5" y1="36" x2="51.5" y2="36" stroke="#0F172A" stroke-width="2"/>
      <!-- Body -->
      <path d="M18 92 C24 68, 76 68, 82 92 Z" fill="#0F172A"/>
    </svg>
  `)}`,

  // Car Photo Thumbnail 1 (Front angle)
  carThumbFront: `data:image/svg+xml;utf8,${encodeURIComponent(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 90" fill="none">
      <rect width="120" height="90" rx="12" fill="#1E293B"/>
      <!-- Front Grille & Lights -->
      <rect x="25" y="30" width="70" height="35" rx="8" fill="#0F172A"/>
      <line x1="30" y1="40" x2="50" y2="40" stroke="#38BDF8" stroke-width="3" stroke-linecap="round"/>
      <line x1="70" y1="40" x2="90" y2="40" stroke="#38BDF8" stroke-width="3" stroke-linecap="round"/>
      <rect x="45" y="52" width="30" height="8" rx="2" fill="#E2E8F0"/>
    </svg>
  `)}`,

  // Car Photo Thumbnail 2 (Side profile)
  carThumbSide: `data:image/svg+xml;utf8,${encodeURIComponent(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 90" fill="none">
      <rect width="120" height="90" rx="12" fill="#334155"/>
      <path d="M15 60 L30 45 L85 45 L105 60 Z" fill="#0F172A"/>
      <circle cx="35" cy="62" r="10" fill="#020617"/>
      <circle cx="85" cy="62" r="10" fill="#020617"/>
    </svg>
  `)}`,

  // Car Photo Thumbnail 3 (Interior Steering & Cockpit)
  carThumbInterior: `data:image/svg+xml;utf8,${encodeURIComponent(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 90" fill="none">
      <rect width="120" height="90" rx="12" fill="#0F172A"/>
      <!-- Steering wheel -->
      <circle cx="45" cy="50" r="18" stroke="#64748B" stroke-width="5" fill="none"/>
      <!-- Large Screen -->
      <rect x="65" y="35" width="40" height="25" rx="4" fill="#0066FF"/>
    </svg>
  `)}`,

  // Tesla Model Y (Archived car)
  carTeslaModelY: `data:image/svg+xml;utf8,${encodeURIComponent(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 90" fill="none">
      <defs>
        <linearGradient id="teslaBody" x1="0" y1="0" x2="160" y2="90">
          <stop stop-color="#475569"/>
          <stop offset="1" stop-color="#1E293B"/>
        </linearGradient>
      </defs>
      <circle cx="40" cy="65" r="14" fill="#090D16"/>
      <circle cx="40" cy="65" r="8" fill="#94A3B8"/>
      <circle cx="120" cy="65" r="14" fill="#090D16"/>
      <circle cx="120" cy="65" r="8" fill="#94A3B8"/>
      <path d="M12 58 C15 48, 30 45, 45 45 L65 26 C75 16, 105 16, 120 28 L142 45 C152 48, 155 54, 152 62 L142 66 C136 63, 126 63, 120 66 L48 66 C42 63, 32 63, 26 66 Z" fill="url(#teslaBody)"/>
      <path d="M68 28 C76 20, 100 20, 114 28 L112 42 L70 42 Z" fill="#38BDF8" fill-opacity="0.75"/>
    </svg>
  `)}`,
};

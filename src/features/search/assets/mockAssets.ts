// SVG Visual Assets for MARSHGO V6 Vehicle Cards & Photos
// Ensures 100% reliable, instant, crisp rendering in all offline, mobile, and browser environments.

export const MOCK_ASSETS = {
  // Sleek modern sedan (Toyota Camry / dark grey metallic)
  carSedan: `data:image/svg+xml;utf8,${encodeURIComponent(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 280 150" fill="none">
      <defs>
        <linearGradient id="body" x1="0" y1="0" x2="280" y2="150" gradientUnits="userSpaceOnUse">
          <stop stop-color="#334155"/>
          <stop offset="0.5" stop-color="#1E293B"/>
          <stop offset="1" stop-color="#0F172A"/>
        </linearGradient>
        <linearGradient id="glass" x1="60" y1="30" x2="190" y2="70" gradientUnits="userSpaceOnUse">
          <stop stop-color="#93C5FD" stop-opacity="0.9"/>
          <stop offset="1" stop-color="#1E3A8A" stop-opacity="0.8"/>
        </linearGradient>
      </defs>
      <!-- Wheels -->
      <circle cx="65" cy="115" r="24" fill="#0F172A"/>
      <circle cx="65" cy="115" r="14" fill="#64748B" stroke="#CBD5E1" stroke-width="4"/>
      <circle cx="215" cy="115" r="24" fill="#0F172A"/>
      <circle cx="215" cy="115" r="14" fill="#64748B" stroke="#CBD5E1" stroke-width="4"/>
      <!-- Body -->
      <path d="M15 105 C25 85, 45 80, 70 80 L95 55 C115 35, 175 35, 205 55 L245 78 C265 80, 275 90, 275 105 L260 115 C250 110, 230 110, 220 115 L80 115 C70 110, 50 110, 40 115 Z" fill="url(#body)"/>
      <!-- Windows -->
      <path d="M100 56 C115 42, 160 42, 195 56 L190 75 L105 75 Z" fill="url(#glass)"/>
      <!-- Headlights -->
      <polygon points="260,85 272,92 260,98" fill="#67E8F9"/>
      <!-- Taillight -->
      <polygon points="18,85 26,88 24,96 16,92" fill="#EF4444"/>
      <!-- Chrome trim -->
      <line x1="75" y1="80" x2="235" y2="80" stroke="#94A3B8" stroke-width="1.5"/>
    </svg>
  `)}`,

  // Intercity Bus (Neoplan / Tourismo coach)
  busCoach: `data:image/svg+xml;utf8,${encodeURIComponent(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 280 150" fill="none">
      <defs>
        <linearGradient id="busBody" x1="0" y1="0" x2="0" y2="150" gradientUnits="userSpaceOnUse">
          <stop stop-color="#FFFFFF"/>
          <stop offset="0.7" stop-color="#F1F5F9"/>
          <stop offset="1" stop-color="#CBD5E1"/>
        </linearGradient>
        <linearGradient id="busGlass" x1="0" y1="0" x2="0" y2="1" gradientUnits="userSpaceOnUse">
          <stop stop-color="#38BDF8"/>
          <stop offset="1" stop-color="#0284C7"/>
        </linearGradient>
      </defs>
      <!-- Body -->
      <rect x="20" y="30" width="240" height="85" rx="16" fill="url(#busBody)" stroke="#CBD5E1" stroke-width="1.5"/>
      <!-- Front slant -->
      <path d="M220 30 L255 60 L255 110 L235 115 Z" fill="#E2E8F0"/>
      <!-- Long Window Strip -->
      <rect x="35" y="42" width="180" height="28" rx="6" fill="url(#busGlass)" opacity="0.9"/>
      <rect x="220" y="42" width="30" height="28" rx="4" fill="url(#busGlass)" opacity="0.9"/>
      <!-- Window dividers -->
      <line x1="70" y1="42" x2="70" y2="70" stroke="#FFFFFF" stroke-width="2"/>
      <line x1="110" y1="42" x2="110" y2="70" stroke="#FFFFFF" stroke-width="2"/>
      <line x1="150" y1="42" x2="150" y2="70" stroke="#FFFFFF" stroke-width="2"/>
      <line x1="185" y1="42" x2="185" y2="70" stroke="#FFFFFF" stroke-width="2"/>
      <!-- Side blue ribbon stripe -->
      <path d="M20 85 L255 85 L250 96 L20 96 Z" fill="#0866F5"/>
      <path d="M20 98 L248 98 L246 102 L20 102 Z" fill="#F59E0B"/>
      <!-- Wheels -->
      <circle cx="65" cy="115" r="20" fill="#1E293B"/>
      <circle cx="65" cy="115" r="10" fill="#94A3B8"/>
      <circle cx="215" cy="115" r="20" fill="#1E293B"/>
      <circle cx="215" cy="115" r="10" fill="#94A3B8"/>
      <!-- Lights -->
      <rect x="252" y="90" width="4" height="12" rx="2" fill="#38BDF8"/>
    </svg>
  `)}`,

  // Modern Train (Hyundai Rotem Intercity+)
  trainFast: `data:image/svg+xml;utf8,${encodeURIComponent(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 280 150" fill="none">
      <defs>
        <linearGradient id="trainBody" x1="0" y1="0" x2="0" y2="150" gradientUnits="userSpaceOnUse">
          <stop stop-color="#F8FAFC"/>
          <stop offset="0.6" stop-color="#E2E8F0"/>
          <stop offset="1" stop-color="#94A3B8"/>
        </linearGradient>
      </defs>
      <!-- Main streamlined nose -->
      <path d="M15 110 L15 45 L170 45 C210 45, 255 75, 270 100 L260 110 Z" fill="url(#trainBody)"/>
      <!-- Blue & Red speed stripes -->
      <path d="M15 78 L265 78 L260 86 L15 86 Z" fill="#0866F5"/>
      <path d="M15 88 L256 88 L250 94 L15 94 Z" fill="#EF4444"/>
      <!-- Cab windshield -->
      <path d="M185 50 C215 50, 245 70, 252 82 L205 82 L185 50 Z" fill="#0284C7"/>
      <!-- Passenger windows -->
      <rect x="25" y="55" width="28" height="16" rx="4" fill="#0284C7"/>
      <rect x="65" y="55" width="28" height="16" rx="4" fill="#0284C7"/>
      <rect x="105" y="55" width="28" height="16" rx="4" fill="#0284C7"/>
      <rect x="145" y="55" width="28" height="16" rx="4" fill="#0284C7"/>
      <!-- Wheels / track -->
      <rect x="10" y="110" width="260" height="6" fill="#334155"/>
      <circle cx="50" cy="116" r="8" fill="#64748B"/>
      <circle cx="85" cy="116" r="8" fill="#64748B"/>
      <circle cx="170" cy="116" r="8" fill="#64748B"/>
      <circle cx="205" cy="116" r="8" fill="#64748B"/>
    </svg>
  `)}`,

  // Taxi driver avatar (friendly portrait)
  avatarTaxi: `data:image/svg+xml;utf8,${encodeURIComponent(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" fill="none">
      <circle cx="50" cy="50" r="50" fill="#FDE68A"/>
      <circle cx="50" cy="38" r="20" fill="#92400E"/>
      <circle cx="50" cy="38" r="16" fill="#FBBF24"/>
      <path d="M22 88 C25 65, 75 65, 78 88 Z" fill="#1F2937"/>
      <circle cx="44" cy="36" r="2.5" fill="#1F2937"/>
      <circle cx="56" cy="36" r="2.5" fill="#1F2937"/>
      <path d="M45 44 Q50 49 55 44" stroke="#1F2937" stroke-width="2" stroke-linecap="round"/>
    </svg>
  `)}`,

  // Driver Andriy avatar
  avatarAndriy: `data:image/svg+xml;utf8,${encodeURIComponent(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" fill="none">
      <defs>
        <linearGradient id="bgGrad" x1="0" y1="0" x2="100" y2="100">
          <stop stop-color="#3B82F6"/>
          <stop offset="1" stop-color="#1D4ED8"/>
        </linearGradient>
      </defs>
      <circle cx="50" cy="50" r="50" fill="url(#bgGrad)"/>
      <circle cx="50" cy="38" r="18" fill="#FCD34D"/>
      <path d="M32 30 C34 18, 66 18, 68 30 Z" fill="#1E293B"/>
      <circle cx="43" cy="36" r="2" fill="#1E293B"/>
      <circle cx="57" cy="36" r="2" fill="#1E293B"/>
      <path d="M46 43 Q50 47 54 43" stroke="#1E293B" stroke-width="2" stroke-linecap="round"/>
      <path d="M18 90 C22 66, 78 66, 82 90 Z" fill="#FFFFFF"/>
    </svg>
  `)}`,

  // Car interior photo 1 (Steering wheel & dash)
  interiorWheel: `data:image/svg+xml;utf8,${encodeURIComponent(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 100" fill="none">
      <rect width="120" height="100" fill="#1E293B"/>
      <!-- Windshield perspective -->
      <polygon points="10,0 110,0 95,45 25,45" fill="#38BDF8" opacity="0.6"/>
      <!-- Dashboard -->
      <path d="M0 45 Q60 40 120 45 L120 100 L0 100 Z" fill="#0F172A"/>
      <!-- Steering wheel -->
      <circle cx="35" cy="70" r="22" stroke="#64748B" stroke-width="6" fill="none"/>
      <circle cx="35" cy="70" r="8" fill="#334155"/>
      <!-- Center screen -->
      <rect x="68" y="52" width="24" height="16" rx="2" fill="#0866F5"/>
    </svg>
  `)}`,

  // Car interior photo 2 (Leather back seats)
  interiorSeats: `data:image/svg+xml;utf8,${encodeURIComponent(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 100" fill="none">
      <rect width="120" height="100" fill="#334155"/>
      <!-- Seat backs -->
      <rect x="10" y="20" width="45" height="55" rx="8" fill="#475569" stroke="#1E293B" stroke-width="2"/>
      <rect x="65" y="20" width="45" height="55" rx="8" fill="#475569" stroke="#1E293B" stroke-width="2"/>
      <!-- Headrests -->
      <rect x="22" y="8" width="22" height="14" rx="4" fill="#1E293B"/>
      <rect x="76" y="8" width="22" height="14" rx="4" fill="#1E293B"/>
      <!-- Armrest -->
      <rect x="52" y="45" width="16" height="35" rx="3" fill="#1E293B"/>
    </svg>
  `)}`,
};

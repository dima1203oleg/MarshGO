/**
 * Multimodal MARSHGO City Illustration
 * Apple Maps / Linear style vector composition:
 * - City skyline with Kyiv architecture silhouettes
 * - Train viaduct & high-speed transit
 * - Electric bus on transit lane
 * - Sleek modern car on road with luminous blue route
 * - Scooter rider on mobility lane
 */
export function HeroIllustration({ className = '' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 460 260"
      role="img"
      aria-label="Мультимодальне місто MARSHGO: авто, автобус, потяг та самокат"
      className={className}
      preserveAspectRatio="xMidYMid meet"
    >
      <defs>
        <radialGradient id="sky-glow" cx="50%" cy="30%" r="70%">
          <stop offset="0%" stopColor="#EBF4FF" stopOpacity="0.9" />
          <stop offset="60%" stopColor="#F5F9FF" stopOpacity="0.5" />
          <stop offset="100%" stopColor="#F7F9FC" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="road-grad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#CBDDF2" />
          <stop offset="100%" stopColor="#B3CBEC" />
        </linearGradient>
        <linearGradient id="route-pulse" x1="0" y1="1" x2="1" y2="0">
          <stop offset="0%" stopColor="#175CD3" />
          <stop offset="50%" stopColor="#38BDF8" />
          <stop offset="100%" stopColor="#60A5FA" />
        </linearGradient>
        <linearGradient id="car-body" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#FFFFFF" />
          <stop offset="100%" stopColor="#E2E8F0" />
        </linearGradient>
        <linearGradient id="bus-body" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#3B82F6" />
          <stop offset="100%" stopColor="#1D4ED8" />
        </linearGradient>
        <linearGradient id="train-body" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#475569" />
          <stop offset="50%" stopColor="#64748B" />
          <stop offset="100%" stopColor="#334155" />
        </linearGradient>
        <filter id="soft-glow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="4" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* Sky backdrop glow */}
      <rect x="0" y="0" width="460" height="260" fill="url(#sky-glow)" />

      {/* Distant Kyiv Landmark & Skyline Silhouettes */}
      <g fill="#CBDCF0" opacity="0.55">
        {/* Monastery bell tower silhouette */}
        <path d="M 408 120 L 413 98 L 418 90 L 420 72 L 422 72 L 424 90 L 429 98 L 434 120 Z" />
        <circle cx="421" cy="70" r="3" fill="#FBBF24" opacity="0.8" />
        <path d="M 419 66 L 423 66 M 421 63 L 421 69" stroke="#FBBF24" strokeWidth="1.2" strokeLinecap="round" opacity="0.8" />
        {/* Domes */}
        <ellipse cx="396" cy="115" rx="7" ry="10" />
        <circle cx="396" cy="103" r="2" fill="#FBBF24" opacity="0.75" />
        <ellipse cx="442" cy="118" rx="6" ry="8" />
        {/* Distant highrises */}
        <rect x="18" y="78" width="22" height="70" rx="3" />
        <rect x="44" y="92" width="28" height="56" rx="3" />
        <rect x="76" y="68" width="18" height="80" rx="3" />
        <rect x="98" y="85" width="24" height="63" rx="3" />
        <rect x="136" y="96" width="30" height="52" rx="3" />
        <rect x="330" y="88" width="20" height="60" rx="3" />
        <rect x="354" y="74" width="26" height="74" rx="3" />
      </g>

      {/* Hills / Green banks of Dnipro river */}
      <path d="M 0 148 Q 120 128 240 142 T 460 134 L 460 180 L 0 180 Z" fill="#D9E8F8" opacity="0.7" />
      <path d="M 160 140 Q 280 126 460 142 L 460 180 L 160 180 Z" fill="#E2EEFA" opacity="0.6" />

      {/* Train Viaduct Bridge on the right */}
      <g opacity="0.9">
        <rect x="290" y="128" width="170" height="7" rx="2" fill="#94A3B8" />
        {/* Viaduct pillars */}
        <rect x="320" y="135" width="8" height="34" rx="2" fill="#CBD5E1" />
        <rect x="370" y="135" width="8" height="34" rx="2" fill="#CBD5E1" />
        <rect x="420" y="135" width="8" height="34" rx="2" fill="#CBD5E1" />
        {/* Modern high-speed train / tram */}
        <path d="M 334 126 L 396 126 Q 408 126 414 121 L 418 116 L 334 116 Z" fill="url(#train-body)" />
        <rect x="334" y="117" width="70" height="4" fill="#38BDF8" opacity="0.9" />
        {/* Train windows */}
        <g fill="#F8FAFC" opacity="0.9">
          <rect x="340" y="119" width="8" height="4" rx="1" />
          <rect x="352" y="119" width="8" height="4" rx="1" />
          <rect x="364" y="119" width="8" height="4" rx="1" />
          <rect x="376" y="119" width="8" height="4" rx="1" />
          <rect x="388" y="119" width="8" height="4" rx="1" />
        </g>
      </g>

      {/* Main road sweeping across bottom */}
      <path d="M -20 260 L 160 162 Q 220 152 280 162 L 480 260 Z" fill="url(#road-grad)" />
      {/* Road border markings */}
      <path d="M -20 260 L 160 162 Q 220 152 280 162 L 480 260" fill="none" stroke="#FFFFFF" strokeWidth="2.5" opacity="0.75" />
      {/* Center divider dashes */}
      <path d="M 226 156 L 226 260" stroke="#FFFFFF" strokeWidth="3" strokeDasharray="14 12" opacity="0.7" />

      {/* Electric City Bus on left lane */}
      <g transform="translate(14, 158)">
        <ellipse cx="36" cy="38" rx="34" ry="5" fill="#0E1F35" opacity="0.18" />
        {/* Bus chassis */}
        <rect x="4" y="4" width="62" height="30" rx="7" fill="url(#bus-body)" />
        {/* Roof line */}
        <rect x="8" y="1" width="54" height="4" rx="2" fill="#1E40AF" />
        {/* Windshield & Windows */}
        <rect x="8" y="8" width="16" height="13" rx="2" fill="#E0F2FE" />
        <rect x="27" y="8" width="16" height="13" rx="2" fill="#E0F2FE" />
        <rect x="46" y="8" width="16" height="13" rx="2" fill="#E0F2FE" />
        {/* Bus headlights & wheels */}
        <rect x="62" y="24" width="4" height="4" rx="1" fill="#FEF08A" />
        <circle cx="18" cy="34" r="6" fill="#1E293B" />
        <circle cx="18" cy="34" r="2.5" fill="#94A3B8" />
        <circle cx="52" cy="34" r="6" fill="#1E293B" />
        <circle cx="52" cy="34" r="2.5" fill="#94A3B8" />
      </g>

      {/* Scooter rider on the side */}
      <g transform="translate(92, 178)">
        {/* Rider */}
        <circle cx="12" cy="6" r="4.5" fill="#334155" />
        <path d="M 12 11 L 11 26 L 15 36" stroke="#334155" strokeWidth="3" strokeLinecap="round" />
        <path d="M 12 16 L 18 20" stroke="#334155" strokeWidth="2.5" strokeLinecap="round" />
        {/* Scooter frame */}
        <path d="M 18 20 L 16 38 L 4 38" fill="none" stroke="#059669" strokeWidth="2.5" strokeLinecap="round" />
        <circle cx="4" cy="38" r="3" fill="#0F172A" />
        <circle cx="17" cy="38" r="3" fill="#0F172A" />
      </g>

      {/* Luminous dynamic navigation route curve */}
      <path
        d="M 234 162 C 234 195, 230 205, 246 220"
        fill="none"
        stroke="#38BDF8"
        strokeWidth="10"
        strokeLinecap="round"
        opacity="0.35"
        filter="url(#soft-glow)"
      />
      <path
        d="M 234 162 C 234 195, 230 205, 246 220"
        fill="none"
        stroke="url(#route-pulse)"
        strokeWidth="4"
        strokeLinecap="round"
      />

      {/* Modern White Passenger Car driving forward */}
      <g transform="translate(202, 184)">
        {/* Shadow */}
        <ellipse cx="44" cy="46" rx="54" ry="9" fill="#0B1730" opacity="0.22" />
        {/* Car body */}
        <path
          d="M 2 34 L 14 18 L 32 8 Q 44 4 58 8 L 74 18 L 86 32 Q 90 40 78 42 L 8 42 Q -2 40 2 34 Z"
          fill="url(#car-body)"
        />
        {/* Roof / Windshield / Glass */}
        <path
          d="M 20 18 L 34 10 Q 44 8 54 10 L 68 18 Q 70 24 64 25 L 24 25 Q 18 24 20 18 Z"
          fill="#0F172A"
          opacity="0.85"
        />
        <path
          d="M 36 12 L 52 12 L 64 18 L 24 18 Z"
          fill="#38BDF8"
          opacity="0.4"
        />
        {/* Headlights */}
        <ellipse cx="84" cy="32" rx="4" ry="2.5" fill="#FEF08A" />
        <ellipse cx="84" cy="32" rx="9" ry="5" fill="#FEF08A" opacity="0.25" filter="url(#soft-glow)" />
        {/* Wheels */}
        <circle cx="18" cy="42" r="8" fill="#1E293B" />
        <circle cx="18" cy="42" r="4" fill="#94A3B8" />
        <circle cx="70" cy="42" r="8" fill="#1E293B" />
        <circle cx="70" cy="42" r="4" fill="#94A3B8" />
      </g>
    </svg>
  );
}

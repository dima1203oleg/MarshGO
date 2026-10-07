import { ArrowUpRight, CalendarClock, Search } from 'lucide-react';

/**
 * Start screen: one idea — "just drive, MARSHGO finds a fellow traveller on the way".
 * No map, no transport tiles, no lists. Static illustration, two equal scenarios.
 * Drivers start map navigation; passengers go to search (from / to). Drivers can also plan a trip for later.
 */
export function HomeHero({ isDriver, onStartNavigation, onChooseDestination, onPlanTrip }: { isDriver: boolean; onStartNavigation: () => void; onChooseDestination: () => void; onPlanTrip: () => void }) {
  return <div className="home-hero mx-auto flex w-full max-w-xl flex-col px-5 pb-8 pt-3">
    <section aria-label="Головна ідея" className="text-center">
      <h1 className="text-[1.75rem] font-extrabold leading-[1.15] tracking-tight text-[#0E1F35]">Їдеш? MARSHGO знайде попутника по дорозі.</h1>
      <p className="mx-auto mt-3 max-w-sm text-[15px] leading-6 text-slate-600">Просто почни навігацію. Ми шукатимемо попутників уздовж твого маршруту.</p>
    </section>

    <div className="mx-auto mt-4 w-full max-w-md">
      <svg viewBox="0 0 420 330" role="img" aria-label="Синій автомобіль на дорозі, світний маршрут веде до попутника з аватаром" className="h-auto w-full">
        <defs>
          <linearGradient id="hh-road" x1="0" y1="1" x2="1" y2="0"><stop offset="0" stopColor="#D5E1F0"/><stop offset="1" stopColor="#F4F8FD"/></linearGradient>
          <linearGradient id="hh-body" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#4FA3F7"/><stop offset="1" stopColor="#1769D6"/></linearGradient>
          <linearGradient id="hh-glass" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#DCEEFF"/><stop offset="1" stopColor="#7DB6EE"/></linearGradient>
          <filter id="hh-glow" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="5" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
          <filter id="hh-soft" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="6"/></filter>
        </defs>
        <path d="M-20 300 L170 190 L440 300 L440 340 L-20 340Z" fill="url(#hh-road)"/>
        <path d="M10 300 L190 214 L400 300" fill="none" stroke="#C3D2E6" strokeWidth="2.5" strokeDasharray="12 14"/>
        <ellipse cx="150" cy="268" rx="118" ry="26" fill="#0E1F35" opacity=".16" filter="url(#hh-soft)"/>
        <path d="M232 238 C300 238 330 214 300 192 C276 174 330 170 342 150 C352 132 316 118 288 112 C266 108 254 98 262 90" fill="none" stroke="#0EA5E9" strokeOpacity=".35" strokeWidth="17" strokeLinecap="round" strokeLinejoin="round" filter="url(#hh-soft)"/>
        <path d="M232 238 C300 238 330 214 300 192 C276 174 330 170 342 150 C352 132 316 118 288 112 C266 108 254 98 262 90" fill="none" stroke="#38D5F5" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round" filter="url(#hh-glow)"/>
        <path d="M232 238 C300 238 330 214 300 192 C276 174 330 170 342 150 C352 132 316 118 288 112 C266 108 254 98 262 90" fill="none" stroke="#fff" strokeOpacity=".85" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
        <g transform="translate(150 60)"><path d="M0 -22 C-10 -22 -17 -14 -17 -6 C-17 5 0 20 0 20 S17 5 17 -6 C17 -14 10 -22 0 -22Z" fill="#38BDF8"/><circle cx="0" cy="-7" r="6" fill="#fff"/></g>
        <g transform="translate(250 34)"><rect x="-30" y="-30" width="60" height="60" rx="16" fill="#3B9BF4"/><circle cx="0" cy="-6" r="11" fill="#fff"/><path d="M-17 22 Q0 0 17 22Z" fill="#fff"/><path d="M-11 -10 C-9 -22 9 -22 11 -10 C6 -15 -6 -15 -11 -10Z" fill="#2B2A3A"/><path d="M-6 30 L0 40 L6 30Z" fill="#3B9BF4"/></g>
        <g transform="translate(330 176)">
          <ellipse cx="2" cy="62" rx="26" ry="7" fill="#0E1F35" opacity=".14"/>
          <rect x="-13" y="14" width="11" height="46" rx="5" fill="#2C5AA0"/><rect x="2" y="14" width="11" height="46" rx="5" fill="#27518F"/>
          <rect x="-16" y="-24" width="32" height="44" rx="12" fill="#8CC2F7"/>
          <path d="M16 -14 L40 -2" stroke="#8CC2F7" strokeWidth="9" strokeLinecap="round"/><circle cx="42" cy="-1" r="4.5" fill="#F2C9A5"/>
          <rect x="-24" y="-8" width="14" height="26" rx="3" fill="#2B4C8C" transform="rotate(-8 -17 5)"/>
          <circle cx="0" cy="-36" r="12" fill="#F2C9A5"/><path d="M-12 -38 C-10 -52 10 -52 12 -38 C6 -44 -6 -44 -12 -38Z" fill="#2A211C"/>
          <rect x="22" y="40" width="16" height="22" rx="4" fill="#B98F5B"/><rect x="25" y="34" width="10" height="8" rx="3" fill="none" stroke="#8A6A3E" strokeWidth="2"/>
        </g>
        <g transform="translate(130 238)">
          <path d="M-96 28 L-70 -6 L-22 -48 Q-6 -58 18 -56 L60 -46 Q92 -34 108 -2 L116 26 Q120 44 100 50 L-70 58 Q-104 54 -96 28Z" fill="url(#hh-body)"/>
          <path d="M-52 -4 L-20 -40 Q-10 -48 8 -47 L50 -38 Q70 -30 80 -6 Z" fill="url(#hh-glass)"/>
          <path d="M-8 -45 L10 -4" stroke="#1769D6" strokeWidth="4"/><path d="M-96 28 L-70 -6 L-52 -4 L-60 30Z" fill="#2E86EA"/>
          <path d="M-60 30 L100 50" stroke="#0F54B3" strokeWidth="2.5" opacity=".6"/>
          <ellipse cx="108" cy="30" rx="7" ry="5" fill="#FDF3B8"/><path d="M96 46 L118 40" stroke="#E5EEF9" strokeWidth="5" strokeLinecap="round"/>
          <g><ellipse cx="-44" cy="52" rx="17" ry="20" fill="#0E1F35" transform="rotate(-12 -44 52)"/><ellipse cx="-44" cy="52" rx="8" ry="10" fill="#B6C6DB" transform="rotate(-12 -44 52)"/></g>
          <g><ellipse cx="66" cy="62" rx="17" ry="21" fill="#0E1F35" transform="rotate(-12 66 62)"/><ellipse cx="66" cy="62" rx="8" ry="10" fill="#B6C6DB" transform="rotate(-12 66 62)"/></g>
        </g>
      </svg>
    </div>

    <button type="button" onClick={onStartNavigation} className="mt-3 flex w-full items-center justify-between rounded-full bg-[#1789F4] px-7 py-[1.15rem] text-base font-bold text-white shadow-[0_14px_30px_rgba(23,137,244,.35)] transition active:scale-[.99]">
      <span className="flex-1 text-center">Почати навігацію</span><ArrowUpRight size={22}/>
    </button>
    <button type="button" onClick={onChooseDestination} className="mt-3 flex w-full items-center gap-3 rounded-full border border-[#DFE7F1] bg-white px-6 py-4 text-left text-[15px] text-slate-500 shadow-sm">
      <Search size={19} className="text-slate-400"/>Куди їдемо?
    </button>
    {isDriver && <button type="button" onClick={onPlanTrip} className="mt-3 flex items-center justify-center gap-2 self-center rounded-full px-4 py-2 text-sm font-bold text-[#1789F4]">
      <CalendarClock size={17}/>Запланувати поїздку на завтра
    </button>}
  </div>;
}

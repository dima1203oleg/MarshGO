import React from 'react';
import {
  BusFront,
  ChevronRight,
  CirclePlus,
  MapPin,
  Navigation,
  Search,
  Ticket,
} from 'lucide-react';

export interface HomeTrip {
  id: string;
  kind: 'booking' | 'journey';
  origin_name: string;
  destination_name: string;
  departure_at: string;
  status: string;
  priceLabel?: string;
}

export interface HomeV5Props {
  onStartNavigation: () => void;
  onSearchTrip: () => void;
  onPlanTrip: () => void;
  onOpenMap?: () => void;
  onSearchDestination?: (destination: string) => void;
  trips?: HomeTrip[];
  onOpenTrip?: (trip: HomeTrip) => void;
}

const homeActions = [
  { title: 'Навігація', description: 'Побудувати маршрут', tone: 'navigation', image: '/images/card_navigation_car.jpg', icon: Navigation, action: 'navigation' },
  { title: 'Карта транспорту', description: 'Зупинки, лінії, рух', tone: 'transport', image: '/images/hero_ukraine_mobility.jpg', icon: BusFront, action: 'map' },
  { title: 'Знайти маршрут', description: 'Усі види транспорту', tone: 'search', image: '/images/lviv_stop_banner.jpg', icon: Search, action: 'search' },
  { title: 'Опублікувати поїздку', description: 'Попутка / маршрут', tone: 'publish', image: '/images/welcome-road.jpg', icon: CirclePlus, action: 'publish' },
] as const;

const popularRoutes = [
  { destination: 'Київ', image: '/images/welcome-kyiv-v1.jpg' },
  { destination: 'Рівне', image: '/images/hero_mountain_bus.jpg' },
  { destination: 'Тернопіль', image: '/images/lviv_stop_banner.jpg' },
] as const;

function formatDeparture(value: string): string {
  const departure = new Date(value);
  if (!Number.isFinite(departure.getTime())) return 'Час не вказано';
  return new Intl.DateTimeFormat('uk-UA', {
    day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Kyiv',
  }).format(departure);
}

export const HomeV5: React.FC<HomeV5Props> = ({
  onStartNavigation,
  onSearchTrip,
  onPlanTrip,
  onOpenMap,
  onSearchDestination,
  trips = [],
  onOpenTrip,
}) => {
  const runAction = (action: (typeof homeActions)[number]['action']) => {
    if (action === 'search') onSearchTrip();
    if (action === 'publish') onPlanTrip();
    if (action === 'navigation') onStartNavigation();
    if (action === 'map') (onOpenMap ?? onStartNavigation)();
  };

  return (
    <main className="home-v5-screen mx-auto flex w-full max-w-xl flex-col px-4 pb-2 pt-2 transition-colors duration-200">
      <button
        type="button"
        onClick={onSearchTrip}
        aria-label="Вибрати місто для пошуку, зараз Львів"
        className="home-v5-city mb-2 flex min-h-9 shrink-0 items-center gap-2 self-start rounded-full border border-[#E3EBF4] bg-white px-3.5 text-sm font-bold text-[#142642] shadow-sm dark:border-slate-700 dark:bg-[#101E38] dark:text-white"
      >
        <MapPin size={16} className="text-blue-600" /> Львів
        <ChevronRight size={15} className="rotate-90 text-slate-400" />
      </button>

      <section className="home-v5-hero relative mb-3 flex shrink-0 flex-col justify-between overflow-hidden rounded-[26px] border border-white/80 p-4 shadow-[0_7px_22px_rgba(26,73,133,.10)] dark:border-slate-700" aria-label="Розумні поїздки">
        <img src="/images/hero_mountain_bus.jpg" alt="" className="absolute inset-0 h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-r from-white via-white/90 to-white/10 dark:from-[#0B1730] dark:via-[#0B1730]/85 dark:to-[#0B1730]/15" />
        <div className="relative z-10 max-w-[72%]">
          <p className="text-[18px] font-black leading-tight tracking-tight text-[#102344] dark:text-white">Розумні поїздки</p>
          <p className="mt-1 text-[11px] font-semibold leading-snug text-[#1769ED] dark:text-blue-300">для міста і міжміста</p>
          <p className="mt-1 text-[10px] font-semibold text-slate-600 dark:text-slate-300">Люди · Транспорт · Можливості</p>
        </div>

        <button type="button" onClick={onSearchTrip} className="relative z-10 inline-flex min-h-9 w-fit items-center gap-2 rounded-full bg-white/95 px-3.5 text-[12px] font-bold text-[#142642] shadow-sm dark:bg-[#101E38]/95 dark:text-white">
          <MapPin size={15} className="text-blue-600" /> Україна <ChevronRight size={15} />
        </button>
      </section>

      {trips.length > 0 && (
        <section className="home-v5-active-trips mb-3 space-y-2" aria-label="Ваші активні поїздки">
          {trips.slice(0, 1).map((trip, index) => (
            <button
              key={`${trip.status}:${trip.id}`}
              type="button"
              aria-label={`${index === 0 ? 'Активна поїздка' : 'Поїздка'} ${trip.origin_name.split(',')[0]} → ${trip.destination_name.split(',')[0]}`}
              onClick={() => onOpenTrip?.(trip)}
              className="home-v5-trip-card flex min-h-[76px] w-full items-center gap-3 rounded-[24px] border border-emerald-200/80 bg-[#E8F8F0] px-3.5 py-3 text-left shadow-[0_4px_14px_rgba(16,132,92,.08)] transition active:scale-[.99] dark:border-emerald-900/60 dark:bg-[#0A261E]"
            >
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl border border-emerald-100 bg-white text-emerald-700 shadow-sm dark:border-emerald-900 dark:bg-[#101E38] dark:text-emerald-300"><Ticket size={21}/></span>
              <span className="min-w-0 flex-1">
                <span className="mb-1 flex items-center gap-1.5 text-[10px] font-black uppercase tracking-[.12em] text-emerald-800 dark:text-emerald-300"><span className="h-2 w-2 rounded-full bg-emerald-500" />{index === 0 ? 'Активна поїздка' : 'Ваша поїздка'}</span>
                <span className="block truncate text-[14px] font-black text-[#142642] dark:text-white">{trip.origin_name.split(',')[0]} → {trip.destination_name.split(',')[0]}</span>
                <span className="mt-0.5 block truncate text-[10px] font-semibold text-emerald-900/70 dark:text-emerald-200/70">{formatDeparture(trip.departure_at)}{trip.priceLabel ? ` · ${trip.priceLabel}` : ''}</span>
              </span>
              <ChevronRight size={19} className="shrink-0 text-emerald-700 dark:text-emerald-300" />
            </button>
          ))}
        </section>
      )}

      <div className="home-v5-actions grid grid-cols-2 gap-2.5" aria-label="Швидкі дії">
        {homeActions.map(({ title, description, tone, image, icon: Icon, action }) => (
          <button
            key={action}
            type="button"
            onClick={() => runAction(action)}
            className={`home-v5-action-card home-v5-action-card--${tone} relative flex min-h-[112px] flex-col items-start justify-between overflow-hidden rounded-[22px] border p-3 text-left transition duration-200 active:scale-[.98]`}
          >
            <img src={image} alt="" loading="lazy" className="home-v5-action-art absolute inset-0 h-full w-full object-cover" />
            <span aria-hidden="true" className="home-v5-action-tint absolute inset-0" />
            <span className="home-v5-action-icon relative z-10 grid h-10 w-10 place-items-center rounded-2xl">
              <Icon size={22} strokeWidth={2.35} />
            </span>
            <span className="relative z-10 flex w-full items-end justify-between gap-1">
              <span className="min-w-0">
                <span className="home-v5-action-card-title block text-[14px] font-black leading-tight tracking-tight">{title}</span>
                <span className="mt-1 block text-[10px] font-semibold leading-snug opacity-80">{description}</span>
              </span>
              <span aria-hidden="true" className="home-v5-action-arrow grid h-8 w-8 shrink-0 place-items-center rounded-full bg-white/95 shadow-sm">
                <ChevronRight size={18} />
              </span>
            </span>
          </button>
        ))}
      </div>

      <section className="home-v5-routes mt-3 min-h-0" aria-labelledby="home-routes-title">
        <div className="mb-2 flex items-center justify-between px-1">
          <h2 id="home-routes-title" className="text-sm font-black text-[#132443] dark:text-white">Популярні напрямки</h2>
          <button type="button" onClick={onSearchTrip} className="text-[10px] font-bold text-blue-600">Показати всі <ChevronRight className="inline" size={12}/></button>
        </div>
        <div className="no-scrollbar flex gap-2.5 overflow-x-auto pb-1">
          {popularRoutes.map(({ destination, image }) => (
            <button
              key={destination}
              type="button"
              onClick={() => onSearchDestination?.(destination)}
              className="home-v5-route-card relative h-[84px] min-w-[108px] flex-1 overflow-hidden rounded-2xl border border-white/70 bg-slate-200 text-left shadow-sm transition active:scale-[.98] dark:border-slate-700"
            >
              <img src={image} alt="" loading="lazy" className="absolute inset-0 h-full w-full object-cover" />
              <span className="absolute inset-0 bg-gradient-to-t from-slate-950/75 via-slate-950/10 to-transparent" />
              <span className="absolute inset-x-2 bottom-2 flex items-end justify-between gap-1 text-[10px] font-extrabold leading-tight text-white">Львів → {destination}<ChevronRight size={13} className="shrink-0" /></span>
            </button>
          ))}
        </div>
      </section>
    </main>
  );
};

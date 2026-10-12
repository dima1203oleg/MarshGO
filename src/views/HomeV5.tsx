import React from 'react';
import {
  ArrowRight,
  BusFront,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  CirclePlus,
  MapPin,
  Navigation,
  QrCode,
  Search,
  ShieldCheck,
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
  currentUserIsDriver?: boolean;
  driverName?: string;
  seatCount?: number;
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
  { title: 'Навігація', description: 'Побудувати маршрут', tone: 'navigation', icon: Navigation, action: 'navigation' },
  { title: 'Карта транспорту', description: 'Зупинки, лінії, рух', tone: 'transport', icon: BusFront, action: 'map' },
  { title: 'Знайти маршрут', description: 'Усі види транспорту', tone: 'search', icon: Search, action: 'search' },
  { title: 'Опублікувати поїздку', description: 'Попутка / маршрут', tone: 'publish', icon: CirclePlus, action: 'publish' },
] as const;

const popularRoutes: ReadonlyArray<{ destination: string; image: string; imagePosition?: string }> = [
  { destination: 'Київ', image: '/images/welcome-kyiv-v1.jpg' },
  { destination: 'Рівне', image: '/images/welcome-road.jpg', imagePosition: 'center 84%' },
  { destination: 'Тернопіль', image: '/images/lviv_stop_banner.jpg' },
] as const;

const homeBanners = [
  {
    eyebrow: 'MARSHGO · ПОПУТКИ',
    title: 'Попутники знайдуться на твоєму маршруті',
    description: 'Опублікуй поїздку й розділи витрати на дорогу.',
    image: '/images/welcome-road.jpg',
    imagePosition: 'center 84%',
    action: 'publish',
    actionLabel: 'Опублікувати поїздку',
  },
  {
    eyebrow: 'МІСТО ТА МІЖМІСТО',
    title: 'Усі способи доїхати в одному пошуку',
    description: 'Попутки, міський транспорт і подорожі Україною.',
    image: '/hero_car_route.png',
    imagePosition: 'center',
    action: 'search',
    actionLabel: 'Знайти маршрут',
  },
] as const;

function formatDeparture(value: string): string {
  const departure = new Date(value);
  if (!Number.isFinite(departure.getTime())) return 'Час не вказано';
  return new Intl.DateTimeFormat('uk-UA', {
    day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Kyiv',
  }).format(departure);
}

export function selectActiveMarshPasses(trips: HomeTrip[]): HomeTrip[] {
  return trips.filter((trip) => trip.kind === 'booking'
    && !trip.currentUserIsDriver
    && ['confirmed', 'boarding', 'in_progress'].includes(trip.status));
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
  const marshPasses = selectActiveMarshPasses(trips);
  const [bannerIndex, setBannerIndex] = React.useState(0);
  const [marshPassIndex, setMarshPassIndex] = React.useState(0);
  const touchStartX = React.useRef<number | null>(null);
  const activeBanner = homeBanners[bannerIndex] ?? homeBanners[0];
  const activePass = marshPasses[marshPassIndex] ?? marshPasses[0];

  React.useEffect(() => {
    if (marshPasses.length > 0 || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const timer = window.setInterval(() => {
      setBannerIndex((current) => (current + 1) % homeBanners.length);
    }, 5000);
    return () => window.clearInterval(timer);
  }, [marshPasses.length]);

  React.useEffect(() => {
    setMarshPassIndex((current) => Math.min(current, Math.max(0, marshPasses.length - 1)));
  }, [marshPasses.length]);

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

      {activePass ? (
        <section className={`home-v5-pass-slot mb-3 ${marshPasses.length > 1 ? 'home-v5-pass-slot--multiple' : ''}`} aria-label="Активні MarshPass">
          <button
            key={activePass.id}
            type="button"
            aria-label={`Відкрити MarshPass: ${activePass.origin_name.split(',')[0]} — ${activePass.destination_name.split(',')[0]}`}
            onClick={() => onOpenTrip?.(activePass)}
            onTouchStart={(event) => { touchStartX.current = event.touches[0]?.clientX ?? null; }}
            onTouchEnd={(event) => {
              const endX = event.changedTouches[0]?.clientX;
              if (touchStartX.current === null || endX === undefined || marshPasses.length < 2) return;
              const delta = endX - touchStartX.current;
              if (Math.abs(delta) > 40) setMarshPassIndex((index) => (index + (delta < 0 ? 1 : -1) + marshPasses.length) % marshPasses.length);
              touchStartX.current = null;
            }}
            className="home-v5-marshpass-card flex h-full w-full flex-col justify-between overflow-hidden rounded-[24px] border p-3.5 text-left transition active:scale-[.99]"
          >
            <span className="flex items-center justify-between gap-2">
              <span className="flex items-center gap-2"><span className="grid h-8 w-8 place-items-center rounded-xl bg-blue-600 text-white"><Ticket size={17}/></span><span className="text-[11px] font-black tracking-[.1em]">MARSHGO <span className="text-blue-600 dark:text-blue-300">MARSH PASS</span></span></span>
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-[9px] font-bold text-emerald-800 dark:bg-emerald-950/70 dark:text-emerald-300"><CheckCircle2 size={12}/>{activePass.status === 'boarding' || activePass.status === 'in_progress' ? 'У дорозі' : 'Підтверджено'}</span>
            </span>
            <span className="my-1 flex min-w-0 items-center gap-2">
              <span className="min-w-0 flex-1"><span className="block truncate text-[18px] font-black leading-tight">{activePass.origin_name.split(',')[0]}</span><span className="block text-[10px] font-semibold text-slate-500 dark:text-slate-300">{formatDeparture(activePass.departure_at)}</span></span>
              <ArrowRight size={19} className="shrink-0 text-blue-600 dark:text-blue-300"/>
              <span className="min-w-0 flex-1 text-right"><span className="block truncate text-[18px] font-black leading-tight">{activePass.destination_name.split(',')[0]}</span><span className="block text-[10px] font-semibold text-slate-500 dark:text-slate-300">{activePass.priceLabel ?? 'Ціна уточнюється'}</span></span>
            </span>
            <span className="flex items-center justify-between gap-2 border-t border-slate-200/70 pt-2 dark:border-slate-700/80"><span className="flex min-w-0 items-center gap-1.5 text-[10px] font-semibold text-slate-600 dark:text-slate-300"><ShieldCheck size={13} className="shrink-0 text-emerald-600 dark:text-emerald-400"/><span className="truncate">{activePass.driverName ?? 'Приватна поїздка'}{activePass.seatCount ? ` · ${activePass.seatCount} ${activePass.seatCount === 1 ? 'місце' : 'місця'}` : ''}</span></span><span className="inline-flex shrink-0 items-center gap-1 text-[10px] font-bold text-blue-700 dark:text-blue-300"><QrCode size={14}/>Відкрити квиток</span></span>
          </button>
          {marshPasses.length > 1 && <div className="mt-1.5 flex items-center justify-center gap-3" aria-label={`MarshPass ${marshPassIndex + 1} з ${marshPasses.length}`}>
            <button type="button" aria-label="Попередній MarshPass" onClick={() => setMarshPassIndex((index) => (index - 1 + marshPasses.length) % marshPasses.length)} className="grid h-8 w-8 place-items-center rounded-full border border-slate-200 bg-white text-slate-700 dark:border-slate-700 dark:bg-[#16202B] dark:text-slate-100"><ChevronLeft size={16}/></button>
            <span className="text-[10px] font-bold text-slate-500 dark:text-slate-300">{marshPassIndex + 1} / {marshPasses.length}</span>
            <button type="button" aria-label="Наступний MarshPass" onClick={() => setMarshPassIndex((index) => (index + 1) % marshPasses.length)} className="grid h-8 w-8 place-items-center rounded-full border border-slate-200 bg-white text-slate-700 dark:border-slate-700 dark:bg-[#16202B] dark:text-slate-100"><ChevronRight size={16}/></button>
          </div>}
        </section>
      ) : (
        <section className="home-v5-hero home-v5-banner relative mb-3 flex shrink-0 flex-col justify-between overflow-hidden rounded-[26px] border border-white/80 p-4 shadow-[0_7px_22px_rgba(26,73,133,.10)] dark:border-slate-700" aria-label="MARSHGO: банер про поїздки">
          <img src={activeBanner.image} alt="" style={{ objectPosition: activeBanner.imagePosition }} className="absolute inset-0 h-full w-full object-cover" />
          <div className="home-v5-banner-scrim absolute inset-0" />
          <div className="relative z-10 max-w-[78%]">
            <p className="text-[9px] font-black uppercase tracking-[.16em] text-blue-700 dark:text-blue-300">{activeBanner.eyebrow}</p>
            <p className="mt-1 text-[16px] font-black leading-tight tracking-tight text-[#102344] dark:text-white">{activeBanner.title}</p>
            <p className="mt-1 text-[11px] font-semibold leading-snug text-slate-600 dark:text-slate-200">{activeBanner.description}</p>
          </div>
          <div className="relative z-10 flex items-center justify-between">
            <button type="button" onClick={activeBanner.action === 'publish' ? onPlanTrip : onSearchTrip} className="inline-flex min-h-9 items-center gap-2 rounded-full bg-blue-600 px-3.5 text-[11px] font-bold text-white shadow-md shadow-blue-900/20">
              {activeBanner.actionLabel} <ArrowRight size={14}/>
            </button>
            <div className="flex items-center gap-1.5" role="group" aria-label="Банери MARSHGO">
              {homeBanners.map((banner, index) => <button key={banner.eyebrow} type="button" aria-label={`Показати банер ${index + 1}: ${banner.eyebrow}`} aria-pressed={bannerIndex === index} onClick={() => setBannerIndex(index)} className={`h-2.5 rounded-full transition-all ${bannerIndex === index ? 'w-5 bg-blue-600' : 'w-2.5 bg-slate-400/60'}`} />)}
            </div>
          </div>
        </section>
      )}

      <div className="home-v5-actions grid grid-cols-2 gap-2.5" aria-label="Швидкі дії">
        {homeActions.map(({ title, description, tone, icon: Icon, action }) => (
          <button
            key={action}
            type="button"
            onClick={() => runAction(action)}
            className={`home-v5-action-card home-v5-action-card--${tone} relative flex min-h-[112px] flex-col items-center justify-center gap-3 overflow-hidden rounded-[22px] border p-3 text-center transition duration-200 active:scale-[.98]`}
          >
            <span className="home-v5-action-icon relative z-10 grid h-10 w-10 place-items-center rounded-2xl">
              <Icon size={22} strokeWidth={2.35} />
            </span>
            <span className="relative z-10 w-full">
              <span className="min-w-0">
                <span className="home-v5-action-card-title block text-[14px] font-black leading-tight tracking-tight">{title}</span>
                <span className="mt-1 block text-[11px] font-semibold leading-snug">{description}</span>
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
          {popularRoutes.map(({ destination, image, imagePosition }) => (
            <button
              key={destination}
              type="button"
              onClick={() => onSearchDestination?.(destination)}
              className="home-v5-route-card relative h-[84px] min-w-[108px] flex-1 overflow-hidden rounded-2xl border border-white/70 bg-slate-200 text-left shadow-sm transition active:scale-[.98] dark:border-slate-700"
            >
              <img src={image} alt="" loading="lazy" style={{ objectPosition: imagePosition ?? 'center' }} className="absolute inset-0 h-full w-full object-cover" />
              <span className="absolute inset-0 bg-gradient-to-t from-slate-950/75 via-slate-950/10 to-transparent" />
              <span className="absolute inset-x-2 bottom-2 flex items-end justify-between gap-1 text-[10px] font-extrabold leading-tight text-white">Львів → {destination}<ChevronRight size={13} className="shrink-0" /></span>
            </button>
          ))}
        </div>
      </section>
    </main>
  );
};

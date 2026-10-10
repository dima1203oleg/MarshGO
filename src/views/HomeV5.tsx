import React, { useState, useEffect } from 'react';
import {
  ArrowRight,
  Bus,
  ChevronRight,
  MapPin,
  Navigation,
  Plus,
  Search,
  Ticket,
} from 'lucide-react';

export interface HomeV5Props {
  onStartNavigation: () => void;
  onSearchTrip: () => void;
  onPlanTrip: () => void;
  onOpenMap?: () => void;
  activeBooking?: {
    id: string;
    origin: string;
    destination: string;
    departureAt: string;
    driverName: string;
    status: string;
  } | null;
  onOpenActiveBooking?: (id: string) => void;
}

export const HomeV5: React.FC<HomeV5Props> = ({
  onStartNavigation,
  onSearchTrip,
  onPlanTrip,
  onOpenMap,
  activeBooking = null,
  onOpenActiveBooking,
}) => {
  const [activeSlide, setActiveSlide] = useState<0 | 1>(0);

  // Subtle auto-advance hero banner every 8 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      setActiveSlide((prev) => (prev === 0 ? 1 : 0));
    }, 8000);
    return () => clearInterval(timer);
  }, []);


  return (
    <div className="home-v5-screen mx-auto w-full max-w-xl px-4 pb-20 pt-2 transition-colors duration-200">
      {/* 1. Hero Dynamic Promotional Banner (Carousel: Screen 1 & Screen 3) */}
      <div className="home-v5-hero relative mb-4 overflow-hidden rounded-[32px] border border-blue-500/10 shadow-lg shadow-blue-500/5 transition-all">
        {activeSlide === 0 ? (
          /* Slide 1: Розумні поїздки для міста і міжміста (Photo 1) */
          <div className="home-v5-hero-slide relative min-h-[220px] sm:min-h-[240px] w-full overflow-hidden bg-gradient-to-br from-[#EAF2FF] via-[#F3F8FF] to-[#E3EFFF] p-5 sm:p-6 dark:from-[#0B1E40] dark:via-[#091730] dark:to-[#0B1A38]">
            {/* Background scenic photo with gradient masking */}
            <div
              className="pointer-events-none absolute inset-0 bg-cover bg-right sm:bg-center opacity-85 transition-opacity"
              style={{
                backgroundImage: 'url(/images/hero_ukraine_mobility.jpg)',
                maskImage: 'linear-gradient(to right, rgba(0,0,0,0.15) 0%, rgba(0,0,0,0.85) 45%, black 100%)',
                WebkitMaskImage: 'linear-gradient(to right, rgba(0,0,0,0.15) 0%, rgba(0,0,0,0.85) 45%, black 100%)',
              }}
            />

            {/* Gradient wash to ensure text readability */}
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-white/95 via-white/80 to-transparent dark:from-[#091730]/95 dark:via-[#091730]/80 dark:to-transparent" />

            <div className="relative z-10 flex flex-col justify-between h-full max-w-[70%] sm:max-w-[65%]">
              <div>
                <h1 className="text-xl sm:text-2xl font-black tracking-tight text-[#142642] dark:text-white leading-[1.2]">
                  Розумні поїздки <br />
                  <span className="text-[#0066FF] dark:text-[#3B82F6]">для міста і міжміста</span>
                </h1>
                <p className="mt-1 text-xs font-semibold text-[#6A7F98] dark:text-slate-300">
                  Люди · Транспорт · Можливості
                </p>
              </div>

              <div className="home-v5-hero-cta mt-4 flex items-center gap-2">
                <button
                  type="button"
                  onClick={onSearchTrip}
                  className="inline-flex items-center gap-1.5 rounded-full bg-white/95 px-3 py-1.5 text-xs font-bold text-[#142642] shadow-sm backdrop-blur-sm transition hover:bg-white hover:scale-105 active:scale-95 dark:bg-slate-900/90 dark:text-white"
                >
                  <MapPin size={13} className="text-[#0066FF]" />
                  <span>Україна</span>
                  <ChevronRight size={13} className="text-slate-400" />
                </button>
              </div>
            </div>

            {/* Artistic handwritten tagline on bottom right */}
            <div className="pointer-events-none absolute bottom-4 right-4 z-10 hidden sm:block text-right">
              <span className="text-xs font-bold italic tracking-wide text-white drop-shadow-md bg-blue-600/60 px-2.5 py-1 rounded-full backdrop-blur-xs">
                Країна рухається разом
              </span>
            </div>
          </div>
        ) : (
          /* Slide 2: ВІДКРИВАЙ Нові маршрути щодня (Photo 3) */
          <div className="home-v5-hero-slide relative min-h-[220px] sm:min-h-[240px] w-full overflow-hidden bg-gradient-to-br from-[#00388A] via-[#0A48A5] to-[#0D5BCE] p-5 sm:p-6 text-white">
            <div
              className="pointer-events-none absolute inset-0 bg-cover bg-center opacity-70 transition-opacity"
              style={{
                backgroundImage: 'url(/images/hero_mountain_bus.jpg)',
              }}
            />
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-[#00388A]/95 via-[#00388A]/75 to-transparent" />

            <div className="relative z-10 flex flex-col justify-between h-full max-w-[70%] sm:max-w-[65%]">
              <div>
                <span className="inline-block rounded-md bg-white/20 px-2 py-0.5 text-[10px] font-black uppercase tracking-widest text-white backdrop-blur-xs">
                  ВІДКРИВАЙ
                </span>
                <h1 className="mt-2 text-xl sm:text-2xl font-black tracking-tight text-white leading-[1.2]">
                  Нові маршрути <br />
                  щодня
                </h1>
                <p className="mt-1.5 text-xs font-medium text-blue-100">
                  Комфортні поїздки містом і міжмістом
                </p>
              </div>

              <div className="home-v5-hero-cta mt-4">
                <button
                  type="button"
                  onClick={onSearchTrip}
                  className="grid h-9 w-9 place-items-center rounded-full bg-white text-[#0066FF] shadow-md transition hover:scale-110 active:scale-95"
                  aria-label="Перейти до маршрутів"
                >
                  <ArrowRight size={18} strokeWidth={2.5} />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Carousel Slide Indicators */}
        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 z-20 flex items-center gap-1.5 bg-black/20 px-2.5 py-1 rounded-full backdrop-blur-xs">
          <button
            type="button"
            onClick={() => setActiveSlide(0)}
            aria-label="Слайд 1"
            className={`h-1.5 rounded-full transition-all ${
              activeSlide === 0 ? 'w-5 bg-white' : 'w-1.5 bg-white/50'
            }`}
          />
          <button
            type="button"
            onClick={() => setActiveSlide(1)}
            aria-label="Слайд 2"
            className={`h-1.5 rounded-full transition-all ${
              activeSlide === 1 ? 'w-5 bg-white' : 'w-1.5 bg-white/50'
            }`}
          />
        </div>
      </div>

      {/* 2. Active Trip Card (Mint Green Card from Reference Photo 1) */}
      {activeBooking ? <div className="home-v5-active-trip mb-4">
        <button
          type="button"
          onClick={() => onOpenActiveBooking?.(activeBooking.id)}
          className="flex w-full items-center justify-between rounded-3xl border border-[#C6F0DC] bg-[#E8F8F0] p-4 text-left shadow-sm transition hover:shadow-md hover:border-emerald-400 active:scale-[0.99] dark:border-emerald-900/60 dark:bg-[#0A261E]"
        >
          <div className="flex items-center gap-3.5 min-w-0">
            {/* Green icon container */}
            <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-white text-emerald-600 shadow-xs border border-emerald-100 dark:bg-emerald-900/60 dark:text-emerald-300 dark:border-emerald-800">
              <Ticket size={24} strokeWidth={2.2} />
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-1.5 leading-none">
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[11px] font-black uppercase tracking-wider text-emerald-800 dark:text-emerald-300">
                  Активна поїздка
                </span>
              </div>
              <h2 className="mt-1 text-base font-black text-[#142642] dark:text-white truncate">
                {activeBooking.origin} → {activeBooking.destination}
              </h2>
              <p className="text-xs font-semibold text-emerald-900/70 dark:text-emerald-400/80">
                {new Intl.DateTimeFormat('uk-UA', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'Europe/Kyiv' }).format(new Date(activeBooking.departureAt))} · {activeBooking.driverName}
              </p>
            </div>
          </div>

          <div className="grid h-8 w-8 shrink-0 place-items-center rounded-full text-emerald-800/60 dark:text-emerald-300">
            <ChevronRight size={22} strokeWidth={2.4} />
          </div>
        </button>
      </div> : <button type="button" onClick={onSearchTrip} className="home-v5-active-trip mb-4 flex w-full items-center justify-between rounded-3xl border border-blue-100 bg-white p-4 text-left shadow-sm transition hover:border-blue-300 dark:border-slate-800 dark:bg-[#101E38]"><span className="flex items-center gap-3"><span className="grid h-12 w-12 place-items-center rounded-2xl bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300"><Ticket size={22} /></span><span><b className="block text-sm text-slate-900 dark:text-white">Знайти поїздку</b><span className="mt-1 block text-xs text-slate-500">Пошук за реальними маршрутами й доступністю</span></span></span><ChevronRight size={20} className="text-blue-600" /></button>}

      {/* 3. The 4 Grand Interactive Action Cards (2x2 Grid from Reference Photos) */}
      <div className="home-v5-actions mb-6 grid grid-cols-2 gap-3 sm:gap-4">
        {/* Card 1: Навігація (Blue Gradient Card) */}
        <button
          type="button"
          onClick={onStartNavigation}
          className="home-v5-action-card group relative flex flex-col justify-between overflow-hidden rounded-[28px] border border-blue-400/20 bg-gradient-to-br from-[#1E6BFF] via-[#0D57E6] to-[#0A41B3] p-4 sm:p-5 text-left text-white shadow-md shadow-blue-500/15 transition-all hover:scale-[1.02] hover:shadow-xl active:scale-[0.98] min-h-[160px] sm:min-h-[175px]"
        >
          {/* Subtle vehicle background image */}
          <div
            className="pointer-events-none absolute inset-0 bg-cover bg-center opacity-30 mix-blend-overlay transition-transform group-hover:scale-105"
            style={{ backgroundImage: 'url(/images/card_navigation_car.jpg)' }}
          />

          <div className="relative z-10">
            <div className="grid h-11 w-11 place-items-center rounded-2xl bg-white text-[#0D57E6] shadow-sm">
              <Navigation size={22} strokeWidth={2.4} />
            </div>
          </div>

          <div className="relative z-10 mt-3 flex items-end justify-between">
            <div className="pr-2 min-w-0">
              <h3 className="text-lg sm:text-xl font-black tracking-tight text-white leading-tight">
                Навігація
              </h3>
              <p className="mt-1 text-[11px] sm:text-xs font-medium text-blue-100 leading-snug line-clamp-2">
                Побудувати оптимальний маршрут
              </p>
            </div>
            <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-white text-[#0D57E6] shadow-md transition group-hover:scale-110">
              <ArrowRight size={17} strokeWidth={2.5} />
            </div>
          </div>
        </button>

        {/* Card 2: Карта транспорту (Emerald Gradient Card) */}
        <button
          type="button"
          onClick={onOpenMap ?? onStartNavigation}
          className="home-v5-action-card group relative flex flex-col justify-between overflow-hidden rounded-[28px] border border-emerald-400/20 bg-gradient-to-br from-[#10B981] via-[#059669] to-[#047857] p-4 sm:p-5 text-left text-white shadow-md shadow-emerald-500/15 transition-all hover:scale-[1.02] hover:shadow-xl active:scale-[0.98] min-h-[160px] sm:min-h-[175px]"
        >
          <div
            className="pointer-events-none absolute inset-0 bg-cover bg-center opacity-25 mix-blend-overlay transition-transform group-hover:scale-105"
            style={{ backgroundImage: 'url(/images/hero_mountain_bus.jpg)' }}
          />

          <div className="relative z-10">
            <div className="grid h-11 w-11 place-items-center rounded-2xl bg-white text-[#059669] shadow-sm">
              <Bus size={22} strokeWidth={2.4} />
            </div>
          </div>

          <div className="relative z-10 mt-3 flex items-end justify-between">
            <div className="pr-2 min-w-0">
              <h3 className="text-lg sm:text-xl font-black tracking-tight text-white leading-tight">
                Карта транспорту
              </h3>
              <p className="mt-1 text-[11px] sm:text-xs font-medium text-emerald-100 leading-snug line-clamp-2">
                Увесь міський транспорт на одній карті
              </p>
            </div>
            <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-white text-[#059669] shadow-md transition group-hover:scale-110">
              <ArrowRight size={17} strokeWidth={2.5} />
            </div>
          </div>
        </button>

        {/* Card 3: Знайти (Purple Gradient Card) */}
        <button
          type="button"
          onClick={onSearchTrip}
          className="home-v5-action-card group relative flex flex-col justify-between overflow-hidden rounded-[28px] border border-purple-400/20 bg-gradient-to-br from-[#8B5CF6] via-[#7C3AED] to-[#6D28D9] p-4 sm:p-5 text-left text-white shadow-md shadow-purple-500/15 transition-all hover:scale-[1.02] hover:shadow-xl active:scale-[0.98] min-h-[160px] sm:min-h-[175px]"
        >
          <div
            className="pointer-events-none absolute inset-0 bg-cover bg-center opacity-25 mix-blend-overlay transition-transform group-hover:scale-105"
            style={{ backgroundImage: 'url(/images/hero_ukraine_mobility.jpg)' }}
          />

          <div className="relative z-10">
            <div className="grid h-11 w-11 place-items-center rounded-2xl bg-white text-[#7C3AED] shadow-sm">
              <Search size={22} strokeWidth={2.4} />
            </div>
          </div>

          <div className="relative z-10 mt-3 flex items-end justify-between">
            <div className="pr-2 min-w-0">
              <h3 className="text-lg sm:text-xl font-black tracking-tight text-white leading-tight">
                Знайти
              </h3>
              <p className="mt-1 text-[11px] sm:text-xs font-medium text-purple-100 leading-snug line-clamp-2">
                Попутників, поїздки та транспорт
              </p>
            </div>
            <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-white text-[#7C3AED] shadow-md transition group-hover:scale-110">
              <ArrowRight size={17} strokeWidth={2.5} />
            </div>
          </div>
        </button>

        {/* Card 4: Опублікувати (Orange Gradient Card) */}
        <button
          type="button"
          onClick={onPlanTrip}
          className="home-v5-action-card group relative flex flex-col justify-between overflow-hidden rounded-[28px] border border-amber-400/20 bg-gradient-to-br from-[#F59E0B] via-[#EA580C] to-[#D97706] p-4 sm:p-5 text-left text-white shadow-md shadow-amber-500/15 transition-all hover:scale-[1.02] hover:shadow-xl active:scale-[0.98] min-h-[160px] sm:min-h-[175px]"
        >
          <div
            className="pointer-events-none absolute inset-0 bg-cover bg-center opacity-25 mix-blend-overlay transition-transform group-hover:scale-105"
            style={{ backgroundImage: 'url(/images/card_navigation_car.jpg)' }}
          />

          <div className="relative z-10">
            <div className="grid h-11 w-11 place-items-center rounded-2xl bg-white text-[#EA580C] shadow-sm">
              <Plus size={24} strokeWidth={2.8} />
            </div>
          </div>

          <div className="relative z-10 mt-3 flex items-end justify-between">
            <div className="pr-2 min-w-0">
              <h3 className="text-lg sm:text-xl font-black tracking-tight text-white leading-tight">
                Опублікувати
              </h3>
              <p className="mt-1 text-[11px] sm:text-xs font-medium text-amber-100 leading-snug line-clamp-2">
                Створити поїздку або знайти пасажирів
              </p>
            </div>
            <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-white text-[#EA580C] shadow-md transition group-hover:scale-110">
              <ArrowRight size={17} strokeWidth={2.5} />
            </div>
          </div>
        </button>
      </div>

      {/* The 4 action cards conclude the main Home view per Audio 1 instructions */}
    </div>
  );
};

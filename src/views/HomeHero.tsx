import { useLayoutEffect, useRef, useState } from 'react';
import { ArrowUpRight, CalendarClock, CarFront, Search } from 'lucide-react';
import { HeroIllustration } from '../components/HeroIllustration';

/**
 * Start screen: one idea — "just drive, MARSHGO finds a fellow traveller on the way".
 * Three equal scenarios, no global "driver / passenger" switch — the role comes from the action:
 * start navigation (now), search a ride (as a passenger), plan a trip (later).
 *
 * The phone screen never scrolls: the hero measures the real space between the app header and the bottom navigation
 * on the device (notch, Safari toolbars, safe areas included) and the illustration takes whatever height is left.
 */
export function HomeHero({ onStartNavigation, onSearchTrip, onPlanTrip }: { onStartNavigation: () => void; onSearchTrip: () => void; onPlanTrip: () => void }) {
  const root = useRef<HTMLDivElement | null>(null);
  const probe = useRef<HTMLDivElement | null>(null);
  const [height, setHeight] = useState<number | null>(null);

  // The hero gets exactly the space between the app header and the bottom navigation. The viewport height is read from a
  // fixed, viewport-sized probe element observed with ResizeObserver: unlike resize events or vh/svh units it follows every
  // viewport change in every browser (WebKit does not always deliver those after the window is resized).
  useLayoutEffect(() => {
    const measure = () => {
      const element = root.current, viewport = probe.current;
      if (!element || !viewport || window.innerWidth >= 1024) { setHeight(null); return; }
      const top = element.getBoundingClientRect().top + window.scrollY;
      const shell = element.closest('.production-app');
      const reserved = shell ? parseFloat(getComputedStyle(shell).paddingBottom) || 0 : 0;
      setHeight(Math.max(300, Math.floor(viewport.getBoundingClientRect().height - top - reserved - 4)));
    };
    measure();
    const frame = requestAnimationFrame(measure); // once more after the first layout (header height, web fonts)
    window.addEventListener('resize', measure);
    window.addEventListener('orientationchange', measure);
    const observer = typeof ResizeObserver === 'undefined' || !probe.current ? null : new ResizeObserver(measure);
    if (probe.current) observer?.observe(probe.current);
    return () => { cancelAnimationFrame(frame); observer?.disconnect(); window.removeEventListener('resize', measure); window.removeEventListener('orientationchange', measure); };
  }, []);

  return <div ref={root} className={`home-hero mx-auto flex w-full max-w-xl flex-col px-5 pb-2 pt-2 ${height === null ? '' : 'home-hero--fit overflow-hidden'}`} style={height === null ? undefined : { height }}>
    <div ref={probe} aria-hidden="true" className="pointer-events-none invisible fixed inset-0 -z-10"/>
    <section aria-label="Головна ідея" className="shrink-0 text-center">
      <h1 className="home-hero-title text-[1.7rem] font-extrabold leading-[1.15] tracking-tight text-[#0E1F35]">Їдеш? MARSHGO знайде попутника по дорозі.</h1>
      <p className="home-hero-sub mx-auto mt-2.5 max-w-sm text-[15px] leading-6 text-slate-600">Просто почни навігацію. Ми шукатимемо попутників уздовж твого маршруту.</p>
    </section>

    <div className="home-hero-art mx-auto flex min-h-0 w-full max-w-md flex-1 items-center justify-center py-1">
      <HeroIllustration className="h-full max-h-[320px] w-auto max-w-full"/>
    </div>

    <button type="button" onClick={onStartNavigation} className="mt-2 flex w-full shrink-0 items-center justify-between rounded-full bg-[linear-gradient(135deg,#2B95FF,#1477E6)] px-7 py-[1.05rem] text-base font-bold text-white shadow-[0_14px_30px_rgba(23,137,244,.35)] transition active:scale-[.99]">
      <span className="flex flex-1 items-center justify-center gap-2"><CarFront size={20}/>Почати навігацію</span><ArrowUpRight size={22}/>
    </button>
    <button type="button" onClick={onSearchTrip} className="mt-2.5 flex w-full shrink-0 items-center justify-center gap-2 rounded-full border border-[#DFE7F1] bg-white px-6 py-[.95rem] text-[15px] font-bold text-[#0E1F35] shadow-sm"><Search size={19} className="text-[#1789F4]"/>Шукати поїздку</button>
    <button type="button" onClick={onPlanTrip} className="mt-2.5 flex w-full shrink-0 items-center justify-center gap-2 rounded-full border border-[#DFE7F1] bg-white px-6 py-[.95rem] text-[15px] font-bold text-[#0E1F35] shadow-sm"><CalendarClock size={19} className="text-[#1789F4]"/>Запланувати поїздку</button>
  </div>;
}

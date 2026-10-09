import React, { useState, useEffect } from 'react';
import {
  MapPin,
  ArrowRight,
  Search,
  CarFront,
  ShieldCheck,
  Navigation,
  Moon,
  Sun,
  Bell,
  ChevronRight,
} from 'lucide-react';
import { themeService } from '../services/theme';

interface HomeV5Props {
  onStartNavigation: () => void;
  onSearchTrip: () => void;
  onPlanTrip: () => void;
  onOpenNotifications: () => void;
}

export const HomeV5: React.FC<HomeV5Props> = ({
  onStartNavigation,
  onSearchTrip,
  onPlanTrip,
  onOpenNotifications,
}) => {
  const [isDark, setIsDark] = useState(() => themeService.isDark());

  useEffect(() => {
    return themeService.subscribe((_theme, dark) => setIsDark(dark));
  }, []);

  const toggleTheme = () => {
    themeService.setTheme(isDark ? 'light' : 'dark');
  };

  return (
    <div className="flex min-h-[100svh] flex-col bg-[#F4F8FD] dark:bg-[#070E1B] text-[#0D1C34] dark:text-white transition-colors duration-200">
      {/* Top Header */}
      <header className="flex w-full items-center justify-between px-5 pt-[max(0.75rem,env(safe-area-inset-top))] pb-1">
        {/* Logo and Brand */}
        <div className="flex items-center gap-2.5">
          <div className="grid h-10 w-10 place-items-center rounded-[14px] bg-gradient-to-b from-[#1B74F3] to-[#085AD4] text-white shadow-md shadow-blue-500/25">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
              <path
                d="M4.5 19V6.5L12 13.5L19.5 6.5V19"
                stroke="white"
                strokeWidth="3.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-1.5 leading-none">
              <span className="text-[19px] font-black tracking-tight text-[#0D1C34] dark:text-white">
                MARSHGO
              </span>
              <span className="h-2 w-2 rounded-full bg-[#10B981]"></span>
            </div>
            <p className="mt-1 text-[11px] font-semibold text-[#66788F] dark:text-slate-400 leading-none">
              Розумні поїздки · Україна
            </p>
          </div>
        </div>

        {/* Right actions: Theme toggle & Notifications */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={toggleTheme}
            className="grid h-10 w-10 place-items-center rounded-full bg-white dark:bg-[#111e36] text-[#0066FF] dark:text-blue-400 shadow-sm border border-slate-100 dark:border-slate-800 transition active:scale-95"
            aria-label="Змінити тему"
          >
            {isDark ? <Sun size={19} /> : <Moon size={19} />}
          </button>

          <button
            type="button"
            onClick={onOpenNotifications}
            className="relative grid h-10 w-10 place-items-center rounded-full bg-white dark:bg-[#111e36] text-[#0D1C34] dark:text-slate-200 shadow-sm border border-slate-100 dark:border-slate-800 transition active:scale-95"
            aria-label="Сповіщення"
          >
            <Bell size={19} />
            <span className="absolute top-2.5 right-2.5 h-2 w-2 rounded-full bg-[#EF4444] ring-2 ring-white dark:ring-[#111e36]" />
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <div className="flex-1 px-4 pb-4">
        {/* Pill Badge */}
        <div className="mt-3 flex justify-center">
          <div className="inline-flex items-center gap-2 rounded-full bg-[#E8F2FF] dark:bg-blue-950/60 px-4 py-1.5">
            <MapPin size={13} className="text-[#0066FF] fill-[#0066FF]" />
            <span className="text-[12px] font-semibold text-[#0B4DB3] dark:text-blue-300">
              Підбір попутників уздовж маршруту
            </span>
          </div>
        </div>

        {/* Hero Title */}
        <div className="mt-4 text-center">
          <h1 className="text-[28px] sm:text-[32px] font-black leading-[1.12] tracking-tight text-[#0D1C34] dark:text-white">
            Їдеш? MARSHGO знайде
            <span className="block text-[#0066FF] dark:text-[#2582FF]">
              попутника по дорозі.
            </span>
          </h1>

          <p className="mx-auto mt-2.5 max-w-[320px] text-[13px] font-medium leading-snug text-[#62748D] dark:text-slate-400">
            Запусти навігацію — платформа підбере<br />
            пасажирів точно по твоєму напрямку.
          </p>
        </div>

        {/* 3D Illustration matching design */}
        <div className="mt-1 flex justify-center overflow-hidden">
          <img
            src="/hero_car_route.png"
            alt="Маршрут та попутники MARSHGO"
            className="w-full max-w-[440px] h-auto object-contain select-none pointer-events-none drop-shadow-sm dark:brightness-90"
          />
        </div>

        {/* Big Blue CTA Card: Почати навігацію */}
        <div className="mt-2">
          <button
            type="button"
            onClick={onStartNavigation}
            className="group relative flex w-full items-center justify-between overflow-hidden rounded-[26px] bg-gradient-to-r from-[#0066FF] to-[#0050DC] p-3.5 sm:p-4 text-white shadow-[0_10px_25px_rgba(0,102,255,0.35)] transition-all hover:shadow-[0_12px_28px_rgba(0,102,255,0.45)] active:scale-[0.99]"
          >
            {/* Left White Squircle with Blue Car */}
            <div className="grid h-12 w-12 shrink-0 place-items-center rounded-[16px] bg-white text-[#0066FF] shadow-sm">
              <CarFront size={22} strokeWidth={2.4} />
            </div>

            {/* Middle Content */}
            <div className="min-w-0 flex-1 px-3 text-left">
              <div className="flex items-center gap-2">
                <span className="text-[17px] sm:text-[18px] font-bold tracking-tight text-white">
                  Почати навігацію
                </span>
                <span className="inline-flex items-center gap-1 rounded-full bg-[#08488E]/85 px-2 py-0.5 text-[11px] font-semibold text-white">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#22C55E]"></span>
                  Автопідбір
                </span>
              </div>
              <p className="mt-0.5 truncate text-[11.5px] font-normal text-blue-100/90">
                Маршрут + попутники без відхилень
              </p>
            </div>

            {/* Right White Circle with Arrow */}
            <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-white text-[#0066FF] shadow-sm transition-transform group-hover:translate-x-0.5">
              <ArrowRight size={18} strokeWidth={2.5} />
            </div>
          </button>
        </div>

        {/* Two Cards Grid: Пасажир & Водій */}
        <div className="mt-3 grid grid-cols-2 gap-3">
          {/* Passenger Card */}
          <button
            type="button"
            onClick={onSearchTrip}
            className="group flex flex-col justify-between rounded-[24px] bg-white dark:bg-[#111e36] p-4 text-left shadow-sm border border-slate-100/80 dark:border-slate-800 transition hover:shadow-md active:scale-[0.99]"
          >
            <div>
              {/* Category pill/icon */}
              <div className="flex items-center gap-2">
                <div className="grid h-9 w-9 place-items-center rounded-[13px] bg-[#EAF2FF] dark:bg-blue-950/60 text-[#0066FF] dark:text-blue-400">
                  <Search size={18} strokeWidth={2.5} />
                </div>
                <span className="text-[11px] font-extrabold uppercase tracking-wider text-[#8A9BA8] dark:text-slate-400">
                  Пасажир
                </span>
              </div>

              {/* Title & Chevron */}
              <div className="mt-3 flex items-center justify-between gap-1">
                <h2 className="text-[15.5px] font-extrabold leading-tight text-[#0D1C34] dark:text-white">
                  Шукаю поїздку
                </h2>
                <div className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-[#F3F7FC] dark:bg-slate-800 text-[#8A9BA8] group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                  <ChevronRight size={16} strokeWidth={2.5} />
                </div>
              </div>
            </div>

            {/* Subtitle */}
            <p className="mt-1 text-[11.5px] leading-snug text-[#7A8B9E] dark:text-slate-400">
              Знайти рейс або створити запит
            </p>
          </button>

          {/* Driver Card */}
          <button
            type="button"
            onClick={onPlanTrip}
            className="group flex flex-col justify-between rounded-[24px] bg-white dark:bg-[#111e36] p-4 text-left shadow-sm border border-slate-100/80 dark:border-slate-800 transition hover:shadow-md active:scale-[0.99]"
          >
            <div>
              {/* Category pill/icon */}
              <div className="flex items-center gap-2">
                <div className="grid h-9 w-9 place-items-center rounded-[13px] bg-[#FFF5E5] dark:bg-amber-950/50 text-[#D97706] dark:text-amber-400">
                  <CarFront size={18} strokeWidth={2.5} />
                </div>
                <span className="text-[11px] font-extrabold uppercase tracking-wider text-[#8A9BA8] dark:text-slate-400">
                  Водій
                </span>
              </div>

              {/* Title & Chevron */}
              <div className="mt-3 flex items-center justify-between gap-1">
                <h2 className="text-[15.5px] font-extrabold leading-tight text-[#0D1C34] dark:text-white">
                  Запланувати поїздку
                </h2>
                <div className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-[#F3F7FC] dark:bg-slate-800 text-[#8A9BA8] group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
                  <ChevronRight size={16} strokeWidth={2.5} />
                </div>
              </div>
            </div>

            {/* Subtitle */}
            <p className="mt-1 text-[11.5px] leading-snug text-[#7A8B9E] dark:text-slate-400">
              Власне авто та вільні місця
            </p>
          </button>
        </div>

        {/* 3 Trust Badges */}
        <div className="mt-4 flex items-center justify-between px-2 py-1">
          {/* Badge 1: 0% комісії */}
          <div className="flex items-center gap-2">
            <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-[#EAF2FF] dark:bg-blue-950/60 text-[#0066FF] dark:text-blue-400">
              <ShieldCheck size={18} strokeWidth={2.2} />
            </div>
            <div className="leading-tight">
              <p className="text-[11.5px] font-extrabold text-[#0D1C34] dark:text-white">
                0% комісії
              </p>
              <p className="text-[10px] font-medium text-[#7A8B9E] dark:text-slate-400">
                Community
              </p>
            </div>
          </div>

          {/* Badge 2: Перевірені авто */}
          <div className="flex items-center gap-2">
            <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-[#EAF2FF] dark:bg-blue-950/60 text-[#0066FF] dark:text-blue-400">
              <CarFront size={18} strokeWidth={2.2} />
            </div>
            <div className="leading-tight">
              <p className="text-[11.5px] font-extrabold text-[#0D1C34] dark:text-white">
                Перевірені
              </p>
              <p className="text-[10px] font-medium text-[#7A8B9E] dark:text-slate-400">
                авто
              </p>
            </div>
          </div>

          {/* Badge 3: Пошук по коридору */}
          <div className="flex items-center gap-2">
            <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-[#EAF2FF] dark:bg-blue-950/60 text-[#0066FF] dark:text-blue-400">
              <Navigation size={18} strokeWidth={2.2} />
            </div>
            <div className="leading-tight">
              <p className="text-[11.5px] font-extrabold text-[#0D1C34] dark:text-white">
                Пошук по
              </p>
              <p className="text-[10px] font-medium text-[#7A8B9E] dark:text-slate-400">
                коридору
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

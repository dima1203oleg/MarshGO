import React, { useState } from 'react';
import { Bell, ChevronDown, MapPin, Moon, Sun } from 'lucide-react';
import { themeService } from '../../../services/theme';

interface SearchHeaderProps {
  currentCity: string;
  onSelectCity: (city: string) => void;
  onOpenNotifications: () => void;
}

const CITIES = ['Львів', 'Київ', 'Одеса', 'Дніпро', 'Харків', 'Стрий', 'Івано-Франківськ', 'Тернопіль', 'Ужгород'];

export const SearchHeader: React.FC<SearchHeaderProps> = ({
  currentCity,
  onSelectCity,
  onOpenNotifications,
}) => {
  const [isDark, setIsDark] = useState(() => themeService.isDark());
  const [showCityMenu, setShowCityMenu] = useState(false);

  const toggleTheme = () => {
    themeService.setTheme(isDark ? 'light' : 'dark');
    setIsDark(!isDark);
  };

  return (
    <header className="flex w-full items-center justify-between px-4 pt-[max(0.6rem,env(safe-area-inset-top))] pb-2 relative z-30">
      {/* Brand & City */}
      <div className="flex items-center gap-2.5">
        <div className="grid h-10 w-10 place-items-center rounded-[14px] bg-gradient-to-b from-[#0866F5] to-[#0755CA] text-white shadow-md shadow-blue-500/25 shrink-0">
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

        <div>
          <div className="flex items-center gap-1.5 leading-none">
            <span className="text-[18px] font-black tracking-tight text-[#081B35] dark:text-white">
              MARSHGO
            </span>
            <span className="h-2 w-2 rounded-full bg-[#16B87A]" />
          </div>
          <p className="mt-1 text-[10.5px] font-semibold text-[#63738C] dark:text-slate-400 leading-none">
            Розумні поїздки · Україна
          </p>
        </div>
      </div>

      {/* Right: City selector pill & controls */}
      <div className="flex items-center gap-2">
        <div className="relative">
          <button
            type="button"
            onClick={() => setShowCityMenu(!showCityMenu)}
            className="flex items-center gap-1.5 rounded-full bg-[#EAF3FF] dark:bg-blue-950/70 px-3 py-1.5 text-xs font-bold text-[#0866F5] dark:text-blue-300 border border-blue-100/60 dark:border-blue-900/50 transition hover:bg-blue-100/80 active:scale-95"
          >
            <MapPin size={13} className="text-[#0866F5] fill-[#0866F5]" />
            <span>{currentCity}</span>
            <ChevronDown size={14} className="opacity-70" />
          </button>

          {showCityMenu && (
            <div className="absolute right-0 top-full mt-2 w-44 rounded-2xl bg-white dark:bg-[#111e36] p-1.5 shadow-xl border border-slate-100 dark:border-slate-800 z-50 animate-in fade-in zoom-in-95 duration-100">
              <p className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Оберіть місто
              </p>
              {CITIES.map((city) => (
                <button
                  key={city}
                  type="button"
                  onClick={() => {
                    onSelectCity(city);
                    setShowCityMenu(false);
                  }}
                  className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-xs font-semibold text-left transition ${
                    city === currentCity
                      ? 'bg-blue-50 text-[#0866F5] font-bold dark:bg-blue-950/50 dark:text-blue-400'
                      : 'text-slate-700 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800'
                  }`}
                >
                  <span>{city}</span>
                  {city === currentCity && <span className="h-1.5 w-1.5 rounded-full bg-[#0866F5]" />}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Theme Toggle */}
        <button
          type="button"
          onClick={toggleTheme}
          className="grid h-9 w-9 place-items-center rounded-full bg-white dark:bg-[#111e36] text-[#0866F5] dark:text-blue-400 shadow-sm border border-slate-100 dark:border-slate-800 transition active:scale-95"
          aria-label="Змінити тему"
        >
          {isDark ? <Sun size={17} /> : <Moon size={17} />}
        </button>

        {/* Notifications */}
        <button
          type="button"
          onClick={onOpenNotifications}
          className="relative grid h-9 w-9 place-items-center rounded-full bg-white dark:bg-[#111e36] text-[#081B35] dark:text-slate-200 shadow-sm border border-slate-100 dark:border-slate-800 transition active:scale-95"
          aria-label="Сповіщення"
        >
          <Bell size={17} />
          <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-[#E73C59] ring-2 ring-white dark:ring-[#111e36]" />
        </button>
      </div>
    </header>
  );
};

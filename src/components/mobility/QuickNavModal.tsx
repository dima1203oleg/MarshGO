import React from 'react';
import {
  Navigation,
  Bus,
  Search,
  Plus,
  ArrowRight,
  X,
  Info,
  MapPin,
} from 'lucide-react';

export interface QuickNavModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStartNavigation: () => void;
  onOpenMap: () => void;
  onSearchTrip: () => void;
  onPublishTrip: () => void;
}

export const QuickNavModal: React.FC<QuickNavModalProps> = ({
  isOpen,
  onClose,
  onStartNavigation,
  onOpenMap,
  onSearchTrip,
  onPublishTrip,
}) => {
  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="quick-nav-title"
      className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/50 p-0 sm:items-center sm:p-4 backdrop-blur-sm transition-all"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="w-full max-w-lg rounded-t-[36px] sm:rounded-[36px] border border-slate-100 bg-white p-5 sm:p-6 shadow-2xl transition-all duration-300 dark:border-slate-800 dark:bg-[#0E1A33] animate-in slide-in-from-bottom-8">
        {/* Drag handle */}
        <div className="mx-auto mb-3 h-1.5 w-12 rounded-full bg-slate-200 dark:bg-slate-700" />

        {/* Modal Top Bar */}
        <div className="mb-5 flex items-start justify-between">
          <div>
            <h2
              id="quick-nav-title"
              className="text-2xl font-black tracking-tight text-[#142642] dark:text-white"
            >
              Що ви хочете зробити?
            </h2>
            <p className="mt-1 text-xs sm:text-sm font-semibold text-[#6A7F98] dark:text-slate-400">
              Швидкий доступ до основних можливостей
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Закрити вікно"
            className="grid h-9 w-9 place-items-center rounded-full bg-slate-100 text-slate-500 transition hover:bg-slate-200 active:scale-95 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
          >
            <X size={18} strokeWidth={2.5} />
          </button>
        </div>

        {/* The 4 Elongated Horizontal Cards (Matching Middle Screen from Reference Image) */}
        <div className="space-y-3.5">
          {/* Card 1: Навігація */}
          <button
            type="button"
            onClick={() => {
              onClose();
              onStartNavigation();
            }}
            className="group relative flex w-full items-center justify-between overflow-hidden rounded-[26px] border border-blue-100 bg-gradient-to-r from-blue-50/95 via-sky-50/60 to-white p-3.5 sm:p-4 text-left shadow-2xs transition-all hover:border-blue-400 hover:shadow-md active:scale-[0.99] dark:border-blue-900/40 dark:from-blue-950/40 dark:via-slate-900/60 dark:to-[#101E38]"
          >
            {/* Background scenic photo on the right */}
            <div
              className="pointer-events-none absolute inset-y-0 right-14 w-44 sm:w-52 opacity-35 sm:opacity-45 transition-transform group-hover:scale-105"
              style={{
                backgroundImage: 'url(/images/card_navigation_car.jpg)',
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                maskImage: 'linear-gradient(to right, transparent, black 35%, transparent)',
                WebkitMaskImage: 'linear-gradient(to right, transparent, black 35%, transparent)',
              }}
            />

            <div className="relative z-10 flex items-center gap-3.5 min-w-0 pr-2">
              <div className="grid h-13 w-13 shrink-0 place-items-center rounded-2xl bg-[#0066FF] text-white shadow-md shadow-blue-500/25 transition group-hover:scale-105">
                <Navigation size={26} strokeWidth={2.3} />
              </div>
              <div className="min-w-0">
                <h3 className="text-base sm:text-lg font-black tracking-tight text-[#142642] dark:text-white">
                  Навігація
                </h3>
                <p className="mt-0.5 text-xs sm:text-[13px] font-medium text-[#6A7F98] dark:text-slate-300 leading-snug">
                  Побудувати оптимальний маршрут по Україні
                </p>
              </div>
            </div>

            <div className="relative z-10 flex items-center gap-2 shrink-0">
              <span className="hidden sm:inline-flex items-center text-blue-500 opacity-60">
                <MapPin size={16} />
              </span>
              <div className="grid h-9 w-9 sm:h-10 sm:w-10 place-items-center rounded-full bg-white text-[#0066FF] shadow-xs border border-blue-100 transition group-hover:bg-[#0066FF] group-hover:text-white dark:bg-slate-800 dark:border-slate-700 dark:text-blue-400 dark:group-hover:bg-[#0066FF] dark:group-hover:text-white">
                <ArrowRight size={18} strokeWidth={2.5} />
              </div>
            </div>
          </button>

          {/* Card 2: Карта транспорту */}
          <button
            type="button"
            onClick={() => {
              onClose();
              onOpenMap();
            }}
            className="group relative flex w-full items-center justify-between overflow-hidden rounded-[26px] border border-emerald-100 bg-gradient-to-r from-emerald-50/95 via-teal-50/60 to-white p-3.5 sm:p-4 text-left shadow-2xs transition-all hover:border-emerald-400 hover:shadow-md active:scale-[0.99] dark:border-emerald-900/40 dark:from-emerald-950/40 dark:via-slate-900/60 dark:to-[#101E38]"
          >
            <div
              className="pointer-events-none absolute inset-y-0 right-14 w-44 sm:w-52 opacity-35 sm:opacity-45 transition-transform group-hover:scale-105"
              style={{
                backgroundImage: 'url(/images/hero_mountain_bus.jpg)',
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                maskImage: 'linear-gradient(to right, transparent, black 35%, transparent)',
                WebkitMaskImage: 'linear-gradient(to right, transparent, black 35%, transparent)',
              }}
            />

            <div className="relative z-10 flex items-center gap-3.5 min-w-0 pr-2">
              <div className="grid h-13 w-13 shrink-0 place-items-center rounded-2xl bg-[#10B981] text-white shadow-md shadow-emerald-500/25 transition group-hover:scale-105">
                <Bus size={26} strokeWidth={2.3} />
              </div>
              <div className="min-w-0">
                <h3 className="text-base sm:text-lg font-black tracking-tight text-[#142642] dark:text-white">
                  Карта транспорту
                </h3>
                <p className="mt-0.5 text-xs sm:text-[13px] font-medium text-[#6A7F98] dark:text-slate-300 leading-snug">
                  Увесь міський транспорт на одній карті
                </p>
              </div>
            </div>

            <div className="relative z-10 flex items-center gap-2 shrink-0">
              <span className="hidden sm:inline-flex items-center text-emerald-500 opacity-60">
                <MapPin size={16} />
              </span>
              <div className="grid h-9 w-9 sm:h-10 sm:w-10 place-items-center rounded-full bg-white text-[#10B981] shadow-xs border border-emerald-100 transition group-hover:bg-[#10B981] group-hover:text-white dark:bg-slate-800 dark:border-slate-700 dark:text-emerald-400 dark:group-hover:bg-[#10B981] dark:group-hover:text-white">
                <ArrowRight size={18} strokeWidth={2.5} />
              </div>
            </div>
          </button>

          {/* Card 3: Знайти */}
          <button
            type="button"
            onClick={() => {
              onClose();
              onSearchTrip();
            }}
            className="group relative flex w-full items-center justify-between overflow-hidden rounded-[26px] border border-purple-100 bg-gradient-to-r from-purple-50/95 via-fuchsia-50/50 to-white p-3.5 sm:p-4 text-left shadow-2xs transition-all hover:border-purple-400 hover:shadow-md active:scale-[0.99] dark:border-purple-900/40 dark:from-purple-950/40 dark:via-slate-900/60 dark:to-[#101E38]"
          >
            <div
              className="pointer-events-none absolute inset-y-0 right-14 w-44 sm:w-52 opacity-30 sm:opacity-40 transition-transform group-hover:scale-105"
              style={{
                backgroundImage: 'url(/images/hero_ukraine_mobility.jpg)',
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                maskImage: 'linear-gradient(to right, transparent, black 35%, transparent)',
                WebkitMaskImage: 'linear-gradient(to right, transparent, black 35%, transparent)',
              }}
            />

            <div className="relative z-10 flex items-center gap-3.5 min-w-0 pr-2">
              <div className="grid h-13 w-13 shrink-0 place-items-center rounded-2xl bg-[#8B5CF6] text-white shadow-md shadow-purple-500/25 transition group-hover:scale-105">
                <Search size={26} strokeWidth={2.3} />
              </div>
              <div className="min-w-0">
                <h3 className="text-base sm:text-lg font-black tracking-tight text-[#142642] dark:text-white">
                  Знайти
                </h3>
                <p className="mt-0.5 text-xs sm:text-[13px] font-medium text-[#6A7F98] dark:text-slate-300 leading-snug">
                  Попутників, поїздки та транспорт
                </p>
              </div>
            </div>

            <div className="relative z-10 shrink-0">
              <div className="grid h-9 w-9 sm:h-10 sm:w-10 place-items-center rounded-full bg-white text-[#8B5CF6] shadow-xs border border-purple-100 transition group-hover:bg-[#8B5CF6] group-hover:text-white dark:bg-slate-800 dark:border-slate-700 dark:text-purple-400 dark:group-hover:bg-[#8B5CF6] dark:group-hover:text-white">
                <ArrowRight size={18} strokeWidth={2.5} />
              </div>
            </div>
          </button>

          {/* Card 4: Опублікувати */}
          <button
            type="button"
            onClick={() => {
              onClose();
              onPublishTrip();
            }}
            className="group relative flex w-full items-center justify-between overflow-hidden rounded-[26px] border border-amber-100 bg-gradient-to-r from-amber-50/95 via-orange-50/50 to-white p-3.5 sm:p-4 text-left shadow-2xs transition-all hover:border-amber-400 hover:shadow-md active:scale-[0.99] dark:border-amber-900/40 dark:from-amber-950/40 dark:via-slate-900/60 dark:to-[#101E38]"
          >
            <div
              className="pointer-events-none absolute inset-y-0 right-14 w-44 sm:w-52 opacity-30 sm:opacity-40 transition-transform group-hover:scale-105"
              style={{
                backgroundImage: 'url(/images/card_navigation_car.jpg)',
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                maskImage: 'linear-gradient(to right, transparent, black 35%, transparent)',
                WebkitMaskImage: 'linear-gradient(to right, transparent, black 35%, transparent)',
              }}
            />

            <div className="relative z-10 flex items-center gap-3.5 min-w-0 pr-2">
              <div className="grid h-13 w-13 shrink-0 place-items-center rounded-2xl bg-[#F97316] text-white shadow-md shadow-orange-500/25 transition group-hover:scale-105">
                <Plus size={28} strokeWidth={2.8} />
              </div>
              <div className="min-w-0">
                <h3 className="text-base sm:text-lg font-black tracking-tight text-[#142642] dark:text-white">
                  Опублікувати
                </h3>
                <p className="mt-0.5 text-xs sm:text-[13px] font-medium text-[#6A7F98] dark:text-slate-300 leading-snug">
                  Створити поїздку або знайти пасажирів
                </p>
              </div>
            </div>

            <div className="relative z-10 shrink-0">
              <div className="grid h-9 w-9 sm:h-10 sm:w-10 place-items-center rounded-full bg-white text-[#F97316] shadow-xs border border-amber-100 transition group-hover:bg-[#F97316] group-hover:text-white dark:bg-slate-800 dark:border-slate-700 dark:text-amber-400 dark:group-hover:bg-[#F97316] dark:group-hover:text-white">
                <ArrowRight size={18} strokeWidth={2.5} />
              </div>
            </div>
          </button>
        </div>

        {/* Bottom Note (Matching Middle Screen: "ⓘ Усі можливості MARSHGO в одному додатку") */}
        <div className="mt-5 flex items-center justify-center gap-1.5 text-center text-xs font-semibold text-[#6A7F98] dark:text-slate-400">
          <Info size={14} className="text-[#0066FF] shrink-0" />
          <span>Усі можливості MARSHGO в одному додатку</span>
        </div>
      </div>
    </div>
  );
};

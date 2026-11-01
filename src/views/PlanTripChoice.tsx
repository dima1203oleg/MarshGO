import React from 'react';
import { ArrowLeft, ArrowRight, CarFront, User } from 'lucide-react';

export interface PlanTripChoiceProps {
  onBack: () => void;
  onAsDriver: () => void;
  onAsPassenger: () => void;
}

/** "Опублікувати поїздку": role selection matching Screen 2 */
export const PlanTripChoice: React.FC<PlanTripChoiceProps> = ({
  onBack,
  onAsDriver,
  onAsPassenger,
}) => {
  return (
    <div className="mx-auto w-full max-w-xl px-4 pb-12 pt-2 transition-colors">
      {/* Header */}
      <div className="mb-6 flex items-center gap-3.5">
        <button
          type="button"
          onClick={onBack}
          aria-label="Назад"
          className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-slate-200 bg-white text-slate-700 shadow-sm transition hover:bg-slate-50 active:scale-95 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200"
        >
          <ArrowLeft size={18} strokeWidth={2.4} />
        </button>
        <div>
          <h1 className="text-2xl font-black tracking-tight text-[#142642] dark:text-white">
            Опублікувати поїздку
          </h1>
          <p className="mt-0.5 text-xs sm:text-sm font-semibold text-[#6A7F98] dark:text-slate-400">
            Оберіть, що ви хочете зробити
          </p>
        </div>
      </div>

      {/* Cards List */}
      <div className="space-y-4">
        {/* Option 1: Я їду на автомобілі */}
        <button
          type="button"
          onClick={onAsDriver}
          className="group relative flex w-full items-center justify-between overflow-hidden rounded-[28px] border border-blue-100 bg-gradient-to-r from-blue-50/90 via-sky-50/60 to-white p-5 text-left shadow-sm transition-all hover:border-blue-400 hover:shadow-lg active:scale-[0.99] dark:border-blue-900/40 dark:from-blue-950/40 dark:via-slate-900/60 dark:to-[#101E38]"
        >
          <div
            className="pointer-events-none absolute inset-y-0 right-16 w-48 opacity-30 sm:opacity-40 transition-transform group-hover:scale-105"
            style={{
              backgroundImage: 'url(/images/card_navigation_car.jpg)',
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              maskImage: 'linear-gradient(to right, transparent, black 40%, transparent)',
              WebkitMaskImage: 'linear-gradient(to right, transparent, black 40%, transparent)',
            }}
          />

          <div className="relative z-10 flex items-center gap-4 min-w-0 pr-3">
            <div className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-[#0066FF] text-white shadow-md shadow-blue-500/25 transition group-hover:scale-105">
              <CarFront size={28} strokeWidth={2.2} />
            </div>
            <div className="min-w-0">
              <h3 className="text-base sm:text-lg font-black tracking-tight text-[#142642] dark:text-white">
                Я їду на автомобілі
              </h3>
              <p className="mt-0.5 text-xs sm:text-sm font-medium text-[#6A7F98] dark:text-slate-300 leading-snug">
                Запропонувати вільні місця та знайти пасажирів
              </p>
            </div>
          </div>

          <div className="relative z-10 grid h-10 w-10 shrink-0 place-items-center rounded-full bg-white text-[#0066FF] shadow-sm border border-blue-100 transition group-hover:bg-[#0066FF] group-hover:text-white dark:bg-slate-800 dark:border-slate-700 dark:text-blue-400 dark:group-hover:bg-[#0066FF] dark:group-hover:text-white">
            <ArrowRight size={18} strokeWidth={2.5} />
          </div>
        </button>

        {/* Option 2: Я хочу поїхати */}
        <button
          type="button"
          onClick={onAsPassenger}
          className="group relative flex w-full items-center justify-between overflow-hidden rounded-[28px] border border-purple-100 bg-gradient-to-r from-purple-50/90 via-fuchsia-50/50 to-white p-5 text-left shadow-sm transition-all hover:border-purple-400 hover:shadow-lg active:scale-[0.99] dark:border-purple-900/40 dark:from-purple-950/40 dark:via-slate-900/60 dark:to-[#101E38]"
        >
          <div
            className="pointer-events-none absolute inset-y-0 right-16 w-48 opacity-25 sm:opacity-35 transition-transform group-hover:scale-105"
            style={{
              backgroundImage: 'url(/images/hero_mountain_bus.jpg)',
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              maskImage: 'linear-gradient(to right, transparent, black 40%, transparent)',
              WebkitMaskImage: 'linear-gradient(to right, transparent, black 40%, transparent)',
            }}
          />

          <div className="relative z-10 flex items-center gap-4 min-w-0 pr-3">
            <div className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-[#8B5CF6] text-white shadow-md shadow-purple-500/25 transition group-hover:scale-105">
              <User size={28} strokeWidth={2.2} />
            </div>
            <div className="min-w-0">
              <h3 className="text-base sm:text-lg font-black tracking-tight text-[#142642] dark:text-white">
                Я хочу поїхати
              </h3>
              <p className="mt-0.5 text-xs sm:text-sm font-medium text-[#6A7F98] dark:text-slate-300 leading-snug">
                Знайти поїздку, попутників або транспорт
              </p>
            </div>
          </div>

          <div className="relative z-10 grid h-10 w-10 shrink-0 place-items-center rounded-full bg-white text-[#8B5CF6] shadow-sm border border-purple-100 transition group-hover:bg-[#8B5CF6] group-hover:text-white dark:bg-slate-800 dark:border-slate-700 dark:text-purple-400 dark:group-hover:bg-[#8B5CF6] dark:group-hover:text-white">
            <ArrowRight size={18} strokeWidth={2.5} />
          </div>
        </button>
      </div>
    </div>
  );
};

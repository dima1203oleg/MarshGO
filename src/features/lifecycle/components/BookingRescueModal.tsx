import React, { useState } from 'react';
import {
  AlertTriangle,
  RefreshCw,
  X,
} from 'lucide-react';
import type { ActiveTripData } from '../model/lifecycleTypes';

interface BookingRescueModalProps {
  trip: ActiveTripData;
  onClose: () => void;
  onConfirmCancel: (reason: string) => void;
  onBookAlternative: (altId: string) => void;
}

const RESCUE_ALTERNATIVES = [
  {
    id: 'rescue-carpool-2',
    type: 'carpool',
    modeLabel: 'Попутка MARSHGO',
    driverName: 'Максим · Skoda Octavia',
    departureTime: '19:15',
    durationLabel: '5 год 10 хв',
    priceLabel: '400 ₴',
    rating: 4.8,
  },
  {
    id: 'rescue-bus-2',
    type: 'bus',
    modeLabel: 'Рейсовий автобус',
    driverName: 'Автолюкс Express',
    departureTime: '19:30',
    durationLabel: '6 год 00 хв',
    priceLabel: '450 ₴',
    rating: 4.6,
  },
  {
    id: 'rescue-train-2',
    type: 'train',
    modeLabel: 'Поїзд Інтерсіті+',
    driverName: 'Укрзалізниця №744',
    departureTime: '20:10',
    durationLabel: '6 год 50 хв',
    priceLabel: '610 ₴',
    rating: 4.9,
  },
];

export const BookingRescueModal: React.FC<BookingRescueModalProps> = ({
  trip,
  onClose,
  onConfirmCancel,
  onBookAlternative,
}) => {
  const [selectedReason, setSelectedReason] = useState('plans_changed');
  const [showRescueOffers, setShowRescueOffers] = useState(false);

  const REASONS = [
    { id: 'plans_changed', label: 'Змінилися особисті плани' },
    { id: 'driver_delayed', label: 'Водій запізнюється або не приїхав' },
    { id: 'driver_unresponsive', label: 'Водій не виходить на зв’язок' },
    { id: 'found_another', label: 'Знайшов інший варіант поїздки' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-950/60 backdrop-blur-sm p-0 sm:p-4 animate-in fade-in duration-200">
      <div className="relative w-full max-w-md mx-auto rounded-t-[28px] sm:rounded-[28px] bg-white dark:bg-[#0B1730] shadow-2xl border border-slate-100 dark:border-slate-800 p-6 animate-in slide-in-from-bottom-6 duration-300">
        {/* Close */}
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 grid h-8 w-8 place-items-center rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-800 dark:text-slate-300"
          aria-label="Закрити"
        >
          <X size={17} />
        </button>

        {!showRescueOffers ? (
          <div>
            <div className="flex items-center gap-3">
              <div className="grid h-12 w-12 place-items-center rounded-2xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400">
                <AlertTriangle size={24} />
              </div>
              <div>
                <h3 className="text-base font-black text-[#081B35] dark:text-white">
                  Скасування бронювання
                </h3>
                <p className="text-xs font-semibold text-[#63738C] dark:text-slate-400">
                  {trip.routeTitle} · {trip.departureTime}
                </p>
              </div>
            </div>

            <div className="mt-4">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-2">
                Будь ласка, вкажіть причину скасування:
              </label>
              <div className="space-y-2">
                {REASONS.map((r) => (
                  <label
                    key={r.id}
                    className={`flex items-center gap-2.5 rounded-2xl p-3 border cursor-pointer transition ${
                      selectedReason === r.id
                        ? 'bg-[#EAF3FF] dark:bg-blue-950/80 border-[#0866F5] text-[#0866F5] dark:text-blue-300 font-extrabold'
                        : 'bg-slate-50 dark:bg-slate-800/50 border-slate-100 dark:border-slate-800 text-slate-700 dark:text-slate-300 font-medium'
                    }`}
                  >
                    <input
                      type="radio"
                      name="cancel_reason"
                      checked={selectedReason === r.id}
                      onChange={() => setSelectedReason(r.id)}
                      className="accent-[#0866F5]"
                    />
                    <span className="text-xs">{r.label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Smart Rescue banner */}
            <div className="mt-4 rounded-2xl bg-blue-50/80 dark:bg-blue-950/40 p-3.5 border border-blue-100 dark:border-blue-900/40">
              <div className="flex items-start gap-2.5">
                <RefreshCw size={18} className="text-[#0866F5] shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-xs font-black text-[#0866F5] dark:text-blue-300">
                    Потрібна заміна прямо зараз?
                  </h4>
                  <p className="text-[11px] font-semibold text-slate-600 dark:text-slate-300 mt-0.5">
                    MARSHGO Rescue вже знайшов 3 альтернативні поїздки за тим самим маршрутом.
                  </p>
                </div>
              </div>
            </div>

            {/* Buttons */}
            <div className="mt-5 grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setShowRescueOffers(true)}
                className="rounded-xl bg-[#0866F5] py-3 text-xs font-black text-white shadow-md shadow-blue-500/20"
              >
                Підібрати заміну ↗
              </button>
              <button
                type="button"
                onClick={() => onConfirmCancel(selectedReason)}
                className="rounded-xl bg-rose-50 dark:bg-rose-950/50 py-3 text-xs font-black text-[#E73C59] border border-rose-200/60 dark:border-rose-900/40"
              >
                Скасувати поїздку
              </button>
            </div>
          </div>
        ) : (
          <div>
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="text-base font-black text-[#081B35] dark:text-white">
                  Альтернативні варіанти
                </h3>
                <p className="text-xs font-semibold text-[#16B87A]">
                  MARSHGO Booking Rescue
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowRescueOffers(false)}
                className="text-xs font-bold text-[#0866F5]"
              >
                Назад
              </button>
            </div>

            <div className="space-y-2.5">
              {RESCUE_ALTERNATIVES.map((alt) => (
                <div
                  key={alt.id}
                  className="rounded-2xl bg-[#F4F8FF] dark:bg-slate-800/60 p-3.5 border border-blue-100 dark:border-slate-800 flex items-center justify-between gap-3"
                >
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-black text-[#081B35] dark:text-white">
                        {alt.departureTime}
                      </span>
                      <span className="text-[11px] font-bold text-slate-500">
                        ({alt.durationLabel})
                      </span>
                    </div>
                    <p className="text-xs font-semibold text-slate-600 dark:text-slate-300 mt-0.5">
                      {alt.driverName}
                    </p>
                    <span className="text-[10.5px] font-extrabold text-[#0866F5]">
                      {alt.priceLabel}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => onBookAlternative(alt.id)}
                    className="rounded-xl bg-[#0866F5] px-3.5 py-2 text-xs font-bold text-white shadow-sm"
                  >
                    Забронювати
                  </button>
                </div>
              ))}
            </div>

            <button
              type="button"
              onClick={() => onConfirmCancel(selectedReason)}
              className="mt-4 w-full text-center text-xs font-bold text-rose-500"
            >
              Скасувати без вибору заміни
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

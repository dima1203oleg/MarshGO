import React from 'react';
import {
  ArrowLeft,
  Clock,
  MapPin,
  MessageCircle,
  Navigation,
  Phone,
  ShieldCheck,
  Star,
  CheckCircle2,
} from 'lucide-react';
import type { ActiveTripData } from '../model/lifecycleTypes';
import { MOCK_ASSETS } from '../../search/assets/mockAssets';

interface ActiveTripHubProps {
  trip: ActiveTripData;
  onBack: () => void;
  onOpenChat: () => void;
  onOpenPhoneModal: () => void;
  onOpenRendezvous: () => void;
  onOpenSafetyModal: () => void;
  onOpenRescueModal: () => void;
  onOpenReviewModal: () => void;
}

export const ActiveTripHub: React.FC<ActiveTripHubProps> = ({
  trip,
  onBack,
  onOpenChat,
  onOpenPhoneModal,
  onOpenRendezvous,
  onOpenSafetyModal,
  onOpenRescueModal,
  onOpenReviewModal,
}) => {
  return (
    <div className="mx-auto flex flex-col min-h-[100svh] w-full max-w-md overflow-x-hidden bg-[#F4F8FF] dark:bg-[#070E1B] text-[#081B35] dark:text-white pb-24">
      {/* Top Header */}
      <header className="sticky top-0 z-30 flex items-center justify-between border-b border-slate-100/80 dark:border-slate-800/80 bg-white/95 dark:bg-[#0B1730]/95 backdrop-blur-md px-4 py-3 pt-[max(0.6rem,env(safe-area-inset-top))]">
        <button
          type="button"
          onClick={onBack}
          className="grid h-9 w-9 place-items-center rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 transition active:scale-95"
          aria-label="Назад"
        >
          <ArrowLeft size={18} />
        </button>

        <div className="text-center">
          <h1 className="text-sm font-black tracking-tight text-[#081B35] dark:text-white">
            Активна поїздка
          </h1>
          <p className="text-[11px] font-semibold text-[#16B87A] flex items-center justify-center gap-1">
            <span className="h-1.5 w-1.5 rounded-full bg-[#16B87A] animate-pulse" />
            {trip.statusLabel || 'Підтверджено'}
          </p>
        </div>

        <button
          type="button"
          onClick={onOpenSafetyModal}
          className="grid h-9 w-9 place-items-center rounded-full bg-blue-50 dark:bg-blue-950/40 text-[#0866F5] dark:text-blue-400"
          aria-label="Безпека"
          title="Центр безпеки"
        >
          <ShieldCheck size={18} />
        </button>
      </header>

      {/* Main Content Scroll Area */}
      <div className="px-4 py-4 space-y-4">
        {/* Route Banner Card */}
        <section className="rounded-[26px] bg-white dark:bg-[#111e36] p-5 shadow-sm border border-slate-100/90 dark:border-slate-800">
          <div className="flex items-center justify-between">
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 dark:bg-emerald-950/50 px-2.5 py-1 text-[11px] font-black text-[#16B87A]">
              <CheckCircle2 size={12} />
              Бронювання підтверджено
            </span>
            <span className="text-base font-black text-[#0866F5] dark:text-blue-400">
              {trip.priceLabel}
            </span>
          </div>

          <div className="mt-3">
            <h2 className="text-xl font-black text-[#081B35] dark:text-white">
              {trip.routeTitle}
            </h2>
            <div className="mt-1 flex items-center gap-2 text-xs font-semibold text-[#63738C] dark:text-slate-400">
              <span className="flex items-center gap-1">
                <Clock size={13} className="text-[#0866F5]" />
                Відправлення {trip.departureTime}
              </span>
              <span>·</span>
              <span>{trip.seats} {trip.seats === 1 ? 'місце' : 'місця'}</span>
            </div>
          </div>

          {/* Pickup address callout */}
          <div className="mt-3.5 flex items-start gap-2.5 rounded-2xl bg-[#F4F8FF] dark:bg-slate-800/50 p-3 border border-blue-100/60 dark:border-slate-800">
            <MapPin size={16} className="text-[#0866F5] shrink-0 mt-0.5" />
            <div>
              <span className="text-[11px] font-bold text-[#63738C] dark:text-slate-400 block">
                Місце посадки:
              </span>
              <span className="text-xs font-black text-[#081B35] dark:text-white">
                {trip.pickupAddress}
              </span>
            </div>
          </div>
        </section>

        {/* Driver Profile Card */}
        <section className="rounded-[26px] bg-white dark:bg-[#111e36] p-5 shadow-sm border border-slate-100/90 dark:border-slate-800">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="h-13 w-13 rounded-full overflow-hidden bg-blue-100 border-2 border-white dark:border-slate-700 shadow-xs">
                  <img
                    src={trip.driver.avatar || MOCK_ASSETS.avatarAndriy}
                    alt={trip.driver.name}
                    className="h-full w-full object-cover"
                  />
                </div>
                {trip.driver.verified && (
                  <div className="absolute -bottom-1 -right-1 grid h-5 w-5 place-items-center rounded-full bg-white dark:bg-slate-900 shadow">
                    <ShieldCheck size={13} className="text-[#0866F5]" fill="currentColor" />
                  </div>
                )}
              </div>

              <div>
                <div className="flex items-center gap-1.5">
                  <h3 className="text-base font-black text-[#081B35] dark:text-white">
                    {trip.driver.name}
                  </h3>
                  <div className="flex items-center gap-0.5 text-amber-500">
                    <Star size={12} fill="currentColor" />
                    <span className="text-xs font-extrabold">{trip.driver.rating.toFixed(1)}</span>
                    <span className="text-[10px] text-slate-400">({trip.driver.reviewCount})</span>
                  </div>
                </div>
                <p className="text-xs font-semibold text-[#63738C] dark:text-slate-400">
                  {trip.driver.vehicleModel} · {trip.driver.vehiclePlate}
                </p>
              </div>
            </div>

            {/* Car miniature */}
            <div className="h-10 w-16 overflow-hidden rounded-xl bg-slate-50 dark:bg-slate-800 p-0.5">
              <img
                src={MOCK_ASSETS.carSedan}
                alt="Авто"
                className="h-full w-full object-contain"
              />
            </div>
          </div>

          {/* 3 Primary Communication Buttons */}
          <div className="mt-4 grid grid-cols-3 gap-2">
            {/* Write message */}
            <button
              type="button"
              onClick={onOpenChat}
              className="flex flex-col items-center justify-center rounded-[20px] bg-[#EAF3FF] dark:bg-blue-950/70 p-3 text-[#0866F5] dark:text-blue-400 transition hover:bg-blue-100 active:scale-95 border border-[#D3E5FD] dark:border-blue-900/40"
            >
              <MessageCircle size={20} strokeWidth={2.4} />
              <span className="mt-1 text-xs font-black">Написати</span>
            </button>

            {/* Direct call */}
            <button
              type="button"
              onClick={onOpenPhoneModal}
              className="flex flex-col items-center justify-center rounded-[20px] bg-emerald-50 dark:bg-emerald-950/60 p-3 text-[#16B87A] dark:text-emerald-400 transition hover:bg-emerald-100 active:scale-95 border border-emerald-200/60 dark:border-emerald-800/40"
            >
              <Phone size={20} strokeWidth={2.4} />
              <span className="mt-1 text-xs font-black">Подзвонити</span>
            </button>

            {/* Rendezvous meeting */}
            <button
              type="button"
              onClick={onOpenRendezvous}
              className="flex flex-col items-center justify-center rounded-[20px] bg-indigo-50 dark:bg-indigo-950/60 p-3 text-indigo-600 dark:text-indigo-400 transition hover:bg-indigo-100 active:scale-95 border border-indigo-200/60 dark:border-indigo-800/40"
            >
              <Navigation size={20} strokeWidth={2.4} />
              <span className="mt-1 text-xs font-black">Зустріч</span>
            </button>
          </div>
        </section>

        {/* Approaching Status Banner with GPS Mini-Map */}
        <section className="rounded-[26px] bg-white dark:bg-[#111e36] p-4 shadow-sm border border-slate-100/90 dark:border-slate-800">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-black text-[#081B35] dark:text-white flex items-center gap-1.5">
              <Navigation size={14} className="text-[#0866F5] animate-bounce" />
              Водій наближається · {trip.driverEtaMinutes} хв
            </span>
            <span className="text-[11px] font-bold text-slate-500">
              ~{(trip.driverDistanceMeters / 1000).toFixed(1)} км
            </span>
          </div>

          {/* Interactive Mini-map Preview */}
          <div
            onClick={onOpenRendezvous}
            className="cursor-pointer relative h-28 w-full overflow-hidden rounded-2xl bg-[#E7F0FD] dark:bg-slate-800/70 border border-slate-200/80 dark:border-slate-700"
          >
            <svg className="w-full h-full" viewBox="0 0 350 110" preserveAspectRatio="none">
              <path
                d="M 30 85 Q 120 70 200 45 T 320 25"
                stroke="#0866F5"
                strokeWidth="4"
                strokeLinecap="round"
                fill="none"
              />
              <circle cx="30" cy="85" r="8" fill="#16B87A" />
              <circle cx="30" cy="85" r="4" fill="#FFFFFF" />
              <circle cx="240" cy="38" r="8" fill="#0866F5" />
              <circle cx="240" cy="38" r="4" fill="#FFFFFF" />
            </svg>

            {/* Labels */}
            <div className="absolute left-3 bottom-2 text-[10px] font-extrabold bg-white/90 dark:bg-slate-900/90 px-1.5 py-0.5 rounded shadow">
              Ви: Стрийська 45
            </div>
            <div className="absolute right-14 top-2 text-[10px] font-extrabold bg-[#0866F5] text-white px-1.5 py-0.5 rounded shadow">
              Водій: 4 хв
            </div>
            <div className="absolute right-2 bottom-2 text-[10px] font-black text-[#0866F5] bg-white/90 dark:bg-slate-900/90 px-2 py-0.5 rounded-full shadow">
              Відкрити карту ↗
            </div>
          </div>
        </section>

        {/* Secondary Trip Actions: Safety, Complete, Cancel */}
        <div className="space-y-2 pt-1">
          <button
            type="button"
            onClick={onOpenReviewModal}
            className="w-full rounded-[20px] bg-white dark:bg-[#111e36] p-3.5 text-center text-xs font-black text-[#0866F5] dark:text-blue-400 border border-blue-200/80 dark:border-slate-800 shadow-sm transition active:scale-98"
          >
            Завершити поїздку & Залишити відгук ★
          </button>

          <button
            type="button"
            onClick={onOpenRescueModal}
            className="w-full rounded-[20px] bg-slate-100 dark:bg-slate-800/60 p-3 text-center text-xs font-bold text-slate-500 hover:text-red-500 transition active:scale-98"
          >
            Скасувати бронювання або знайти заміну
          </button>
        </div>
      </div>
    </div>
  );
};

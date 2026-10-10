import React, { useState } from 'react';
import {
  ArrowLeft,
  CheckCircle2,
  Compass,
  Phone,
  Shield,
} from 'lucide-react';
import type { ActiveTripData } from '../model/lifecycleTypes';
import { MarshGoMap } from '../../../map/MarshGoMap';

interface RendezvousMeetingViewProps {
  trip: ActiveTripData;
  onBack: () => void;
  onOpenChat: () => void;
  onOpenPhoneModal: () => void;
  onConfirmBoarding: () => void;
}

export const RendezvousMeetingView: React.FC<RendezvousMeetingViewProps> = ({
  trip,
  onBack,
  onOpenChat: _onOpenChat,
  onOpenPhoneModal,
  onConfirmBoarding,
}) => {
  const [sharingLocation, setSharingLocation] = useState(true);
  const [statusNotice, setStatusNotice] = useState<string | null>(null);
  const driverEta = trip.driverEtaMinutes || 4;

  const handleNotifyArrived = () => {
    setStatusNotice('Водієві надіслано сигнал «Я на місці»');
    setTimeout(() => setStatusNotice(null), 3000);
  };

  const handleNotifyDelay = () => {
    setStatusNotice('Водієві надіслано «Буду за 2 хв»');
    setTimeout(() => setStatusNotice(null), 3000);
  };

  return (
    <div className="relative flex flex-col h-[100svh] w-full max-w-md mx-auto overflow-hidden bg-[#F4F8FF] dark:bg-[#070E1B] text-[#081B35] dark:text-white">
      {/* Top Floating Controls */}
      <header className="absolute top-0 inset-x-0 z-30 flex items-center justify-between p-4 pt-[max(0.6rem,env(safe-area-inset-top))] pointer-events-none">
        <button
          type="button"
          onClick={onBack}
          className="pointer-events-auto grid h-10 w-10 place-items-center rounded-full bg-white/95 dark:bg-[#0B1730]/95 shadow-md text-slate-700 dark:text-slate-200 border border-slate-200/80 dark:border-slate-700 transition active:scale-95"
          aria-label="Назад"
        >
          <ArrowLeft size={18} />
        </button>

        {/* Floating status pill */}
        <div className="pointer-events-auto flex items-center gap-2 rounded-2xl bg-white/95 dark:bg-[#0B1730]/95 px-3.5 py-2 shadow-md border border-slate-200/80 dark:border-slate-700">
          <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-xs font-black text-[#081B35] dark:text-white">
            Водій наближається · {driverEta} хв
          </span>
        </div>

        <div className="pointer-events-auto flex items-center gap-1.5">
          <button
            type="button"
            onClick={onOpenPhoneModal}
            className="grid h-10 w-10 place-items-center rounded-full bg-white/95 dark:bg-[#0B1730]/95 text-[#16B87A] shadow-md border border-slate-200/80 dark:border-slate-700 transition active:scale-95"
            aria-label="Подзвонити"
          >
            <Phone size={18} />
          </button>
        </div>
      </header>

      {/* Map Area */}
      <div className="relative flex-1 w-full overflow-hidden bg-[#E7F0FD] dark:bg-[#0A162B]">
        <div className="absolute inset-0 z-0">
          <MarshGoMap
            route={[
              [24.015, 49.815],
              [24.025, 49.825],
              [24.032, 49.832],
            ]}
            onStatus={() => {}}
            onAdapter={() => {}}
          />
        </div>

        {/* Live Visual Meeting Canvas Overlay */}
        <div className="pointer-events-none absolute inset-0 z-10">
          <svg className="w-full h-full" viewBox="0 0 360 400" preserveAspectRatio="none">
            {/* Approach Path line */}
            <path
              d="M 180 80 Q 220 180 180 270"
              stroke="#0866F5"
              strokeWidth="5"
              strokeLinecap="round"
              strokeDasharray="8 6"
              fill="none"
            />

            {/* Passenger Pin at (180, 270) */}
            <circle cx="180" cy="270" r="24" fill="#0866F5" opacity="0.2" className="animate-ping" />
            <circle cx="180" cy="270" r="14" fill="#0866F5" />
            <circle cx="180" cy="270" r="7" fill="#FFFFFF" />

            {/* Driver Car Marker at (180, 80) */}
            <circle cx="180" cy="80" r="18" fill="#16B87A" />
            <circle cx="180" cy="80" r="8" fill="#FFFFFF" />
          </svg>

          {/* Passenger Marker Label */}
          <div className="absolute left-[120px] top-[285px] bg-white/95 dark:bg-[#0B1730]/95 px-2.5 py-1 rounded-xl shadow-md border border-blue-200 text-center">
            <span className="text-[11px] font-black text-[#081B35] dark:text-white block">
              Ви тут (посадка)
            </span>
            <span className="text-[9.5px] font-semibold text-[#0866F5]">
              {trip.pickupAddress}
            </span>
          </div>

          {/* Driver Marker Label */}
          <div className="absolute left-[110px] top-[40px] bg-white/95 dark:bg-[#0B1730]/95 px-2.5 py-1 rounded-xl shadow-md border border-emerald-200 text-center">
            <span className="text-[11px] font-black text-[#081B35] dark:text-white block">
              {trip.driver.name} ({trip.driver.vehicleModel})
            </span>
            <span className="text-[9.5px] font-extrabold text-[#16B87A]">
              ~1.2 км · {driverEta} хв
            </span>
          </div>
        </div>

        {/* Recenter Button */}
        <div className="absolute right-4 bottom-72 z-20 pointer-events-auto">
          <button
            type="button"
            className="grid h-11 w-11 place-items-center rounded-2xl bg-white/95 dark:bg-[#0B1730]/95 shadow-lg border border-slate-200/80 dark:border-slate-700 text-[#0866F5]"
            aria-label="Центрувати карту"
          >
            <Compass size={20} />
          </button>
        </div>
      </div>

      {/* Floating Status Notification Toast */}
      {statusNotice && (
        <div className="absolute top-20 inset-x-4 z-40 flex justify-center animate-in fade-in duration-200">
          <div className="rounded-2xl bg-slate-900/90 text-white px-4 py-2.5 text-xs font-bold shadow-xl border border-slate-700">
            {statusNotice}
          </div>
        </div>
      )}

      {/* Slide-Up Rendezvous Action Panel */}
      <div className="relative z-30 w-full bg-white dark:bg-[#0B1730] rounded-t-[28px] shadow-[0_-8px_30px_rgba(8,27,53,0.12)] dark:shadow-[0_-8px_30px_rgba(0,0,0,0.5)] border-t border-slate-100 dark:border-slate-800 px-5 pt-3 pb-20 space-y-3">
        {/* Grab Handle */}
        <div className="mx-auto mb-2 h-1 w-12 rounded-full bg-slate-300 dark:bg-slate-700" />

        {/* Location Sharing Toggle */}
        <div className="flex items-center justify-between py-1 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <Shield size={16} className="text-[#0866F5]" />
            <span className="text-xs font-bold text-[#081B35] dark:text-white">
              Обмін місцем зустрічі (GPS)
            </span>
          </div>
          <button
            type="button"
            onClick={() => setSharingLocation(!sharingLocation)}
            className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out ${
              sharingLocation ? 'bg-[#0866F5]' : 'bg-slate-200 dark:bg-slate-700'
            }`}
          >
            <span
              className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                sharingLocation ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
        </div>

        {/* Quick Driver Signals */}
        <div className="grid grid-cols-2 gap-2 pt-1">
          <button
            type="button"
            onClick={handleNotifyArrived}
            className="rounded-2xl bg-[#EAF3FF] dark:bg-blue-950/70 p-2.5 text-center text-xs font-black text-[#0866F5] dark:text-blue-300 border border-[#D3E5FD] dark:border-blue-900/40 transition active:scale-95"
          >
            Я на місці 📍
          </button>
          <button
            type="button"
            onClick={handleNotifyDelay}
            className="rounded-2xl bg-amber-50 dark:bg-amber-950/60 p-2.5 text-center text-xs font-black text-amber-700 dark:text-amber-300 border border-amber-200/60 dark:border-amber-800/40 transition active:scale-95"
          >
            Буду за 2 хв ⏱️
          </button>
        </div>

        {/* Boarding Confirmation Button */}
        <button
          type="button"
          onClick={onConfirmBoarding}
          className="w-full rounded-[20px] bg-[#0866F5] py-3.5 text-center text-sm font-black text-white shadow-lg shadow-blue-500/25 transition active:scale-[0.98] flex items-center justify-center gap-2"
        >
          <CheckCircle2 size={18} />
          Підтвердити посадку в авто
        </button>
      </div>
    </div>
  );
};

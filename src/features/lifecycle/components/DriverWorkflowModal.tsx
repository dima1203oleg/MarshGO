import React, { useState } from 'react';
import {
  ArrowLeft,
  CheckCircle2,
  MapPin,
  Navigation,
  Shield,
  Users,
  Volume2,
} from 'lucide-react';

interface DriverWorkflowModalProps {
  onClose: () => void;
  onOpenPassengerDetails?: (passengerId: string) => void;
}

export const DriverWorkflowModal: React.FC<DriverWorkflowModalProps> = ({
  onClose,
}) => {
  const [poolingEnabled, setPoolingEnabled] = useState(true);
  const [hasRequest, setHasRequest] = useState(true);
  const [acceptedRequest, setAcceptedRequest] = useState(false);
  const [eta, setEta] = useState('5 год 15 хв');

  const handleAccept = () => {
    setAcceptedRequest(true);
    setEta('5 год 19 хв (+4 хв)');
    setTimeout(() => {
      setHasRequest(false);
    }, 2500);
  };

  const handleDecline = () => {
    setHasRequest(false);
  };

  return (
    <div className="relative flex flex-col h-[100svh] w-full max-w-md mx-auto overflow-hidden bg-[#081B35] text-white">
      {/* Top Driver Bar */}
      <header className="flex items-center justify-between p-4 pt-[max(0.6rem,env(safe-area-inset-top))] bg-[#081B35]/90 backdrop-blur-md border-b border-slate-700/60 z-30">
        <button
          type="button"
          onClick={onClose}
          className="grid h-10 w-10 place-items-center rounded-full bg-slate-800 text-white"
          aria-label="Вийти"
        >
          <ArrowLeft size={18} />
        </button>

        <div className="text-center">
          <span className="text-[10px] uppercase font-black tracking-widest text-[#16B87A] flex items-center justify-center gap-1">
            <span className="h-1.5 w-1.5 rounded-full bg-[#16B87A] animate-pulse" />
            Навігація водія MARSHGO
          </span>
          <h2 className="text-sm font-black">
            Львів → Київ · {eta}
          </h2>
        </div>

        <button
          type="button"
          className="grid h-10 w-10 place-items-center rounded-full bg-slate-800 text-blue-400"
          aria-label="Голосові підказки"
        >
          <Volume2 size={18} />
        </button>
      </header>

      {/* Simulated 3D Road / Map View */}
      <div className="relative flex-1 w-full overflow-hidden bg-slate-900">
        <svg className="w-full h-full" viewBox="0 0 360 400" preserveAspectRatio="none">
          {/* Horizon & road perspective */}
          <polygon points="120,0 240,0 360,400 0,400" fill="#1E293B" opacity="0.6" />
          <line x1="180" y1="0" x2="180" y2="400" stroke="#FBBF24" strokeWidth="4" strokeDasharray="20 15" />
          {/* Car icon position */}
          <circle cx="180" cy="330" r="16" fill="#0866F5" />
          <polygon points="180,318 190,336 180,332 170,336" fill="#FFFFFF" />
        </svg>

        {/* Next Maneuver Banner */}
        <div className="absolute top-4 inset-x-4 z-20 flex items-center gap-3 rounded-2xl bg-[#0866F5] p-3.5 shadow-xl">
          <div className="grid h-10 w-10 place-items-center rounded-xl bg-white/20 text-white">
            <Navigation size={22} className="rotate-45" />
          </div>
          <div>
            <span className="text-[11px] font-bold text-blue-100 block">
              Через 450 м тримайтеся праворуч
            </span>
            <span className="text-sm font-black text-white">
              Виїзд на трасу М06 (Київ — Чоп)
            </span>
          </div>
        </div>

        {/* Incoming Passenger Request Modal/Banner (Safe Driving UI) */}
        {hasRequest && (
          <div className="absolute inset-x-4 bottom-24 z-30 animate-in slide-in-from-bottom-8 duration-300">
            <div className="rounded-[26px] bg-white text-[#081B35] p-4 shadow-2xl border-2 border-[#0866F5]">
              {!acceptedRequest ? (
                <>
                  <div className="flex items-center justify-between">
                    <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2.5 py-0.5 text-[10.5px] font-black text-[#0866F5]">
                      <Users size={12} />
                      Пасажир вздовж вашого маршруту
                    </span>
                    <span className="text-base font-black text-[#16B87A]">
                      +420 ₴
                    </span>
                  </div>

                  <div className="mt-2.5 flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-black text-[#081B35]">
                        Олена К. · 1 місце
                      </h4>
                      <p className="text-xs font-semibold text-slate-500 flex items-center gap-1 mt-0.5">
                        <MapPin size={12} className="text-[#0866F5]" />
                        Посадка: Стрийська 45 (~1.8 км)
                      </p>
                    </div>

                    <div className="text-right">
                      <span className="text-xs font-black text-amber-600 block">
                        +4 хв об'їзд
                      </span>
                      <span className="text-[10px] text-slate-400">
                        Вільні місця: 3
                      </span>
                    </div>
                  </div>

                  {/* 1-Tap Safe Actions */}
                  <div className="mt-3.5 grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={handleDecline}
                      className="rounded-xl bg-slate-100 py-3 text-xs font-bold text-slate-600 active:scale-95"
                    >
                      Пропустити
                    </button>
                    <button
                      type="button"
                      onClick={handleAccept}
                      className="rounded-xl bg-[#0866F5] py-3 text-xs font-black text-white shadow-md shadow-blue-500/25 active:scale-95"
                    >
                      Прийняти (+420 ₴)
                    </button>
                  </div>
                </>
              ) : (
                <div className="py-2 text-center text-emerald-600">
                  <CheckCircle2 size={28} className="mx-auto" />
                  <h4 className="text-sm font-black text-[#081B35] mt-1">
                    Пасажира додано до маршруту!
                  </h4>
                  <p className="text-xs text-slate-500">
                    Точку посадки додано. Зустріч через ~4 хв.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Bottom Controls Bar */}
      <div className="p-4 bg-[#081B35] border-t border-slate-800 flex items-center justify-between pb-[max(1rem,env(safe-area-inset-bottom))]">
        <div className="flex items-center gap-2">
          <Shield size={16} className="text-[#16B87A]" />
          <span className="text-xs font-bold">
            Підбір попутників
          </span>
        </div>

        <button
          type="button"
          onClick={() => setPoolingEnabled(!poolingEnabled)}
          className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out ${
            poolingEnabled ? 'bg-[#16B87A]' : 'bg-slate-700'
          }`}
        >
          <span
            className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
              poolingEnabled ? 'translate-x-5' : 'translate-x-0'
            }`}
          />
        </button>
      </div>
    </div>
  );
};

import React, { useState } from 'react';
import { Check, Copy, Phone, ShieldCheck, X } from 'lucide-react';
import type { DriverContact } from '../model/lifecycleTypes';

interface PhoneContactModalProps {
  driver: DriverContact;
  onClose: () => void;
}

export const PhoneContactModal: React.FC<PhoneContactModalProps> = ({
  driver,
  onClose,
}) => {
  const [copied, setCopied] = useState(false);
  const phoneNumber = driver.phone || '+380 67 123 4567';

  const handleCopy = () => {
    navigator.clipboard?.writeText(phoneNumber);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-950/50 backdrop-blur-sm p-0 sm:p-4 animate-in fade-in duration-200">
      <div className="relative w-full max-w-md mx-auto rounded-t-[28px] sm:rounded-[28px] bg-white dark:bg-[#0B1730] shadow-2xl border border-slate-100 dark:border-slate-800 p-6 animate-in slide-in-from-bottom-6 duration-300">
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 grid h-8 w-8 place-items-center rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-800 dark:text-slate-300"
          aria-label="Закрити"
        >
          <X size={17} />
        </button>

        {/* Driver Avatar & Name */}
        <div className="flex flex-col items-center text-center mt-2">
          <div className="relative">
            <div className="h-20 w-20 rounded-full overflow-hidden border-3 border-[#0866F5] shadow-md bg-blue-50">
              <img
                src={driver.avatar}
                alt={driver.name}
                className="h-full w-full object-cover"
              />
            </div>
            {driver.verified && (
              <div className="absolute -bottom-1 -right-1 grid h-6 w-6 place-items-center rounded-full bg-white dark:bg-slate-900 shadow">
                <ShieldCheck size={16} className="text-[#0866F5]" fill="currentColor" />
              </div>
            )}
          </div>

          <h3 className="mt-3 text-lg font-black text-[#081B35] dark:text-white">
            {driver.name}
          </h3>
          <p className="text-xs font-semibold text-[#63738C] dark:text-slate-400">
            {driver.vehicleModel} · <span className="font-mono font-bold text-slate-700 dark:text-slate-300">{driver.vehiclePlate}</span>
          </p>

          {/* Privacy badge */}
          <div className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-emerald-50 dark:bg-emerald-950/50 px-3 py-1 text-[11px] font-bold text-[#16B87A] border border-emerald-200/50 dark:border-emerald-800/40">
            <ShieldCheck size={13} />
            Захищений контакт · Бронювання підтверджено
          </div>

          {/* Phone Display */}
          <div className="mt-5 w-full rounded-2xl bg-[#F4F8FF] dark:bg-slate-800/50 p-4 border border-blue-100 dark:border-slate-800">
            <span className="text-[11px] font-bold text-[#63738C] dark:text-slate-400 block">
              Номер телефону водія:
            </span>
            <span className="text-xl font-black text-[#081B35] dark:text-white tracking-wider block mt-1">
              {phoneNumber}
            </span>
          </div>

          {/* Actions: Call & Copy */}
          <div className="mt-5 w-full space-y-2.5">
            <a
              href={`tel:${phoneNumber.replace(/\s+/g, '')}`}
              className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[#16B87A] hover:bg-emerald-600 py-3.5 text-center text-sm font-black text-white shadow-lg shadow-emerald-500/25 transition active:scale-98"
            >
              <Phone size={18} />
              Зателефонувати водієві
            </a>

            <button
              type="button"
              onClick={handleCopy}
              className="flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-100 dark:bg-slate-800 py-3 text-center text-xs font-bold text-[#081B35] dark:text-slate-200 transition active:scale-98"
            >
              {copied ? <Check size={15} className="text-emerald-500" /> : <Copy size={15} />}
              {copied ? 'Номер скопійовано!' : 'Скопіювати номер'}
            </button>
          </div>

          <p className="mt-4 text-[10.5px] text-[#63738C] dark:text-slate-400 max-w-xs">
            Номер надається виключно для координації посадки. Відповідно до правил безпеки MARSHGO, ніколи не передавайте коди з SMS чи платіжні дані.
          </p>
        </div>
      </div>
    </div>
  );
};

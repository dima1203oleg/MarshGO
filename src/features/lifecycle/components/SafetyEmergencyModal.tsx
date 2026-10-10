import React, { useState } from 'react';
import {
  Check,
  Headphones,
  PhoneCall,
  Share2,
  ShieldCheck,
  X,
} from 'lucide-react';
import type { ActiveTripData } from '../model/lifecycleTypes';

interface SafetyEmergencyModalProps {
  trip: ActiveTripData;
  onClose: () => void;
  onSubmitReport?: (category: string, details: string) => void;
}

export const SafetyEmergencyModal: React.FC<SafetyEmergencyModalProps> = ({
  trip,
  onClose,
  onSubmitReport,
}) => {
  const [copiedLink, setCopiedLink] = useState(false);
  const [showReportForm, setShowReportForm] = useState(false);
  const [reportCategory, setReportCategory] = useState('behavior');
  const [reportDetails, setReportDetails] = useState('');
  const [reportSubmitted, setReportSubmitted] = useState(false);

  const handleShare = () => {
    const trackingLink = `https://marshgo.app/track/${trip.id || 'live-trip-demo'}`;
    navigator.clipboard?.writeText(trackingLink);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const handleSendReport = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmitReport?.(reportCategory, reportDetails);
    setReportSubmitted(true);
    setTimeout(() => {
      setShowReportForm(false);
      setReportSubmitted(false);
      setReportDetails('');
    }, 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-950/60 backdrop-blur-sm p-0 sm:p-4 animate-in fade-in duration-200">
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

        {/* Safety Header */}
        <div className="flex items-center gap-3">
          <div className="grid h-12 w-12 place-items-center rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-[#0866F5] dark:text-blue-400">
            <ShieldCheck size={26} strokeWidth={2.4} />
          </div>
          <div>
            <h2 className="text-lg font-black text-[#081B35] dark:text-white">
              Центр безпеки MARSHGO
            </h2>
            <p className="text-xs font-semibold text-[#16B87A] flex items-center gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-[#16B87A]" />
              Поїздка захищена Safety 360°
            </p>
          </div>
        </div>

        {/* 4 Key Safety Modules */}
        {!showReportForm ? (
          <div className="mt-5 space-y-3">
            {/* 1. Share live ride with family */}
            <button
              type="button"
              onClick={handleShare}
              className="flex w-full items-center justify-between rounded-2xl bg-[#F4F8FF] dark:bg-slate-800/50 p-4 border border-blue-100 dark:border-slate-800 text-left transition hover:bg-blue-50/80 active:scale-98"
            >
              <div className="flex items-center gap-3">
                <div className="grid h-10 w-10 place-items-center rounded-xl bg-white dark:bg-slate-700 text-[#0866F5] shadow-xs">
                  <Share2 size={18} />
                </div>
                <div>
                  <h4 className="text-xs font-black text-[#081B35] dark:text-white">
                    Поділитися поїздкою з близькими
                  </h4>
                  <p className="text-[11px] font-semibold text-[#63738C] dark:text-slate-400">
                    Посилання на живий маршрут та авто водія
                  </p>
                </div>
              </div>
              <span className="text-xs font-black text-[#0866F5]">
                {copiedLink ? <Check size={16} className="text-emerald-500" /> : 'Поділитись'}
              </span>
            </button>

            {/* 2. MARSHGO 24/7 Support Hotline */}
            <a
              href="tel:0800330044"
              className="flex w-full items-center justify-between rounded-2xl bg-slate-50 dark:bg-slate-800/40 p-4 border border-slate-100 dark:border-slate-800 text-left transition hover:bg-slate-100/80 active:scale-98"
            >
              <div className="flex items-center gap-3">
                <div className="grid h-10 w-10 place-items-center rounded-xl bg-white dark:bg-slate-700 text-[#0866F5] shadow-xs">
                  <Headphones size={18} />
                </div>
                <div>
                  <h4 className="text-xs font-black text-[#081B35] dark:text-white">
                    Підтримка MARSHGO 24/7
                  </h4>
                  <p className="text-[11px] font-semibold text-[#63738C] dark:text-slate-400">
                    Оператор на зв’язку в будь-який час
                  </p>
                </div>
              </div>
              <span className="text-xs font-bold text-slate-500">
                0 800 33 00 44
              </span>
            </a>

            {/* 3. Emergency SOS Dial */}
            <a
              href="tel:112"
              className="flex w-full items-center justify-between rounded-2xl bg-rose-50 dark:bg-rose-950/40 p-4 border border-rose-200/60 dark:border-rose-900/40 text-left transition hover:bg-rose-100/80 active:scale-98"
            >
              <div className="flex items-center gap-3">
                <div className="grid h-10 w-10 place-items-center rounded-xl bg-rose-500 text-white shadow-xs">
                  <PhoneCall size={18} />
                </div>
                <div>
                  <h4 className="text-xs font-black text-rose-700 dark:text-rose-300">
                    Екстрена допомога SOS (112)
                  </h4>
                  <p className="text-[11px] font-semibold text-rose-600/80 dark:text-rose-400">
                    Прямий виклик поліції та екстрених служб
                  </p>
                </div>
              </div>
              <span className="text-xs font-black text-rose-600 dark:text-rose-400">
                Виклик 112
              </span>
            </a>

            {/* 4. Report driver / violation */}
            <button
              type="button"
              onClick={() => setShowReportForm(true)}
              className="w-full text-center py-2 text-xs font-bold text-slate-500 hover:text-red-500 transition"
            >
              Поскаржитися на водія чи порушення правил
            </button>
          </div>
        ) : (
          <form onSubmit={handleSendReport} className="mt-5 space-y-3">
            <h3 className="text-sm font-black text-[#081B35] dark:text-white">
              Повідомити про порушення
            </h3>

            <div>
              <label className="text-xs font-bold text-slate-600 dark:text-slate-300 block mb-1">
                Категорія:
              </label>
              <select
                value={reportCategory}
                onChange={(e) => setReportCategory(e.target.value)}
                className="w-full rounded-xl bg-slate-100 dark:bg-slate-800 px-3 py-2 text-xs font-bold text-slate-800 dark:text-white focus:outline-none"
              >
                <option value="behavior">Некоректна поведінка водія</option>
                <option value="vehicle">Невідповідність автомобіля / стану</option>
                <option value="price">Вимагання додаткової оплати</option>
                <option value="safety">Небезпечне водіння</option>
                <option value="other">Інше</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-600 dark:text-slate-300 block mb-1">
                Опишіть ситуацію:
              </label>
              <textarea
                rows={3}
                required
                value={reportDetails}
                onChange={(e) => setReportDetails(e.target.value)}
                placeholder="Вкажіть деталі інциденту…"
                className="w-full rounded-xl bg-slate-100 dark:bg-slate-800 p-3 text-xs text-slate-800 dark:text-white placeholder-slate-400 focus:outline-none"
              />
            </div>

            {reportSubmitted ? (
              <div className="rounded-xl bg-emerald-50 dark:bg-emerald-950/50 p-3 text-center text-xs font-black text-[#16B87A]">
                Скаргу зареєстровано. Відділ безпеки розглядає звернення.
              </div>
            ) : (
              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setShowReportForm(false)}
                  className="flex-1 rounded-xl bg-slate-100 dark:bg-slate-800 py-3 text-xs font-bold text-slate-600 dark:text-slate-300"
                >
                  Назад
                </button>
                <button
                  type="submit"
                  className="flex-1 rounded-xl bg-[#E73C59] py-3 text-xs font-black text-white shadow-md shadow-rose-500/20"
                >
                  Надіслати скаргу
                </button>
              </div>
            )}
          </form>
        )}
      </div>
    </div>
  );
};

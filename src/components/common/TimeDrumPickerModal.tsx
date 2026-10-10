import React, { useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { Clock, Check, X, Zap } from 'lucide-react';
import { DrumWheelPicker } from './DrumWheelPicker';

interface TimeDrumPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  timeStr: string; // 'HH:MM'
  timeMode: 'now' | 'depart_at' | 'arrive_by';
  onConfirm: (time: string, mode: 'now' | 'depart_at' | 'arrive_by') => void;
}

const HOURS = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0'));
const MINUTES = Array.from({ length: 60 }, (_, i) => String(i).padStart(2, '0'));

export const TimeDrumPickerModal: React.FC<TimeDrumPickerModalProps> = ({
  isOpen,
  onClose,
  timeStr,
  timeMode,
  onConfirm,
}) => {
  const [initialH, initialM] = useMemo(() => {
    const parts = (timeStr || '12:00').split(':');
    return [
      HOURS.includes(parts[0]) ? parts[0] : '12',
      MINUTES.includes(parts[1]) ? parts[1] : '00',
    ];
  }, [timeStr]);

  const [selectedHour, setSelectedHour] = useState(initialH);
  const [selectedMinute, setSelectedMinute] = useState(initialM);
  const [isNow, setIsNow] = useState(timeMode === 'now');

  if (!isOpen || typeof document === 'undefined') return null;

  const handleApplyNow = () => {
    setIsNow(true);
    const now = new Date();
    const h = String(now.getHours()).padStart(2, '0');
    const m = String(now.getMinutes()).padStart(2, '0');
    setSelectedHour(h);
    setSelectedMinute(m);
  };

  const handleApply = () => {
    onConfirm(`${selectedHour}:${selectedMinute}`, isNow ? 'now' : 'depart_at');
    onClose();
  };

  return createPortal((
    <div
      className="fixed inset-0 z-[100] flex items-end justify-center bg-black/50 backdrop-blur-xs sm:items-center p-0 sm:p-4 animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-t-[32px] sm:rounded-[32px] bg-white dark:bg-[#0B1730] border border-slate-200/80 dark:border-slate-800 shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Handle bar on mobile */}
        <div className="flex justify-center pt-3 pb-1 sm:hidden">
          <div className="h-1.5 w-12 rounded-full bg-slate-300 dark:bg-slate-700" />
        </div>

        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="grid h-10 w-10 place-items-center rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-[#0066FF] dark:text-blue-400">
              <Clock size={20} strokeWidth={2.4} />
            </div>
            <div>
              <h3 className="text-base font-black text-[#0B1730] dark:text-white leading-tight">
                Час відправлення
              </h3>
              <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                Крутілка годин та хвилин
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="grid h-9 w-9 place-items-center rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-800 dark:hover:text-white transition"
          >
            <X size={18} />
          </button>
        </div>

        {/* Quick "Зараз" Pill Button */}
        <div className="px-6 pt-4 pb-2">
          <button
            type="button"
            onClick={handleApplyNow}
            className={`flex w-full items-center justify-center gap-2 rounded-2xl py-2.5 px-4 text-xs font-black transition-all ${
              isNow
                ? 'bg-[#0066FF] text-white shadow-md shadow-blue-500/20'
                : 'bg-slate-100 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 hover:bg-blue-50 hover:text-[#0066FF]'
            }`}
          >
            <Zap size={14} className={isNow ? 'text-amber-300' : 'text-[#0066FF]'} />
            <span>Зараз (найближчий доступний час)</span>
          </button>
        </div>

        {/* Drum Wheel Columns (Hours & Minutes) */}
        <div className="px-6 py-4">
          <div className="grid grid-cols-2 gap-4 rounded-3xl bg-slate-50/80 dark:bg-slate-900/50 p-2 border border-slate-200/60 dark:border-slate-800">
            {/* Hours Column */}
            <div>
              <div className="mb-1 text-center text-[11px] font-black uppercase tracking-wider text-slate-400">
                Години (00-23)
              </div>
              <DrumWheelPicker
                items={HOURS}
                value={selectedHour}
                onChange={(h) => {
                  setSelectedHour(h);
                  setIsNow(false);
                }}
                label="Години"
              />
            </div>

            {/* Minutes Column */}
            <div>
              <div className="mb-1 text-center text-[11px] font-black uppercase tracking-wider text-slate-400">
                Хвилини (00-59)
              </div>
              <DrumWheelPicker
                items={MINUTES}
                value={selectedMinute}
                onChange={(m) => {
                  setSelectedMinute(m);
                  setIsNow(false);
                }}
                label="Хвилини"
              />
            </div>
          </div>

          <div className="mt-3 text-center">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
              Обрано:{' '}
            </span>
            <span className="text-sm font-black text-[#0066FF] dark:text-blue-400">
              {isNow ? `Зараз (${selectedHour}:${selectedMinute})` : `${selectedHour}:${selectedMinute}`}
            </span>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center gap-3 px-6 py-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded-2xl border border-slate-200 dark:border-slate-700 py-3 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 transition"
          >
            Скасувати
          </button>
          <button
            type="button"
            onClick={handleApply}
            className="flex-2 flex items-center justify-center gap-2 rounded-2xl bg-[#0066FF] py-3 text-xs font-black text-white shadow-lg shadow-blue-500/25 hover:bg-[#0052CC] transition active:scale-98"
          >
            <Check size={16} strokeWidth={2.8} />
            <span>Застосувати</span>
          </button>
        </div>
      </div>
    </div>
  ), document.body);
};

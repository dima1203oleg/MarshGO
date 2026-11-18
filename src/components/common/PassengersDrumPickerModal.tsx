import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { User, Check, X } from 'lucide-react';
import { DrumWheelPicker } from './DrumWheelPicker';

interface PassengersDrumPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  passengers: number;
  onConfirm: (count: number) => void;
}

const PASSENGER_OPTIONS = [1, 2, 3, 4, 5, 6, 7, 8];

const getPassengerLabel = (n: number) => {
  if (n === 1) return '1 особа';
  if (n >= 2 && n <= 4) return `${n} особи`;
  return `${n} осіб`;
};

export const PassengersDrumPickerModal: React.FC<PassengersDrumPickerModalProps> = ({
  isOpen,
  onClose,
  passengers,
  onConfirm,
}) => {
  const [selectedCount, setSelectedCount] = useState(
    PASSENGER_OPTIONS.includes(passengers) ? passengers : 1
  );

  if (!isOpen || typeof document === 'undefined') return null;

  const handleApply = () => {
    onConfirm(selectedCount);
    onClose();
  };

  return createPortal((
    <div
      className="fixed inset-0 z-[100] flex items-end justify-center bg-black/50 backdrop-blur-xs sm:items-center p-0 sm:p-4 animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm rounded-t-[32px] sm:rounded-[32px] bg-white dark:bg-[#0B1730] border border-slate-200/80 dark:border-slate-800 shadow-2xl overflow-hidden"
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
              <User size={20} strokeWidth={2.4} />
            </div>
            <div>
              <h3 className="text-base font-black text-[#0B1730] dark:text-white leading-tight">
                Пасажири
              </h3>
              <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                Крутілка кількості людей
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

        {/* Drum Wheel Container */}
        <div className="px-6 py-4">
          <div className="rounded-3xl bg-slate-50/80 dark:bg-slate-900/50 p-2 border border-slate-200/60 dark:border-slate-800">
            <div className="mb-1 text-center text-[11px] font-black uppercase tracking-wider text-slate-400">
              Оберіть кількість
            </div>
            <DrumWheelPicker
              items={PASSENGER_OPTIONS}
              value={selectedCount}
              onChange={setSelectedCount}
              renderItem={(n) => (
                <div className="flex items-center justify-center gap-2">
                  <User size={16} className="opacity-60" />
                  <span>{getPassengerLabel(n)}</span>
                </div>
              )}
              label="Пасажири"
            />
          </div>

          <div className="mt-3 text-center">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
              Кількість місць:{' '}
            </span>
            <span className="text-sm font-black text-[#0066FF] dark:text-blue-400">
              {getPassengerLabel(selectedCount)}
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

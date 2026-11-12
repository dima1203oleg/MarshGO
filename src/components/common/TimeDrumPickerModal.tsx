import React, { useLayoutEffect, useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { Clock, Check, X } from 'lucide-react';
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
  const [selectedMode, setSelectedMode] = useState(timeMode);
  const isNow = selectedMode === 'now';

  useLayoutEffect(() => {
    if (!isOpen) return;
    setSelectedHour(initialH);
    setSelectedMinute(initialM);
    setSelectedMode(timeMode);
  }, [isOpen, initialH, initialM, timeMode]);

  if (!isOpen || typeof document === 'undefined') return null;

  const handleApplyNow = () => {
    const currentTime = new Date();
    setSelectedMode('now');
    setSelectedHour(String(currentTime.getHours()).padStart(2, '0'));
    setSelectedMinute(String(currentTime.getMinutes()).padStart(2, '0'));
  };

  const chooseTimeMode = (mode: 'now' | 'depart_at' | 'arrive_by') => {
    if (mode === 'now') {
      handleApplyNow();
      return;
    }
    setSelectedMode(mode);
  };

  const handleApply = () => {
    onConfirm(`${selectedHour}:${selectedMinute}`, selectedMode);
    onClose();
  };

  return createPortal((
    <div
      className="fixed inset-0 z-[100] flex items-end justify-center bg-[#061328]/55 backdrop-blur-sm sm:items-center p-0 sm:p-4 animate-in fade-in duration-200"
      data-testid="time-drum-modal"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md overflow-hidden rounded-t-[32px] border border-slate-200/80 bg-gradient-to-b from-white to-[#f5f9ff] shadow-[0_-16px_60px_rgba(12,36,72,0.22)] dark:border-[#17365d] dark:from-[#071426] dark:to-[#06172c] sm:rounded-[32px]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-center pt-3 sm:hidden">
          <div className="h-1.5 w-12 rounded-full bg-slate-300 dark:bg-slate-600" />
        </div>

        <div className="flex items-center justify-between px-5 pb-3 pt-4 sm:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-blue-50 text-[#0066FF] shadow-sm dark:bg-blue-950/70 dark:text-blue-300">
              <Clock size={21} strokeWidth={2.4} />
            </div>
            <div>
              <h3 className="text-lg font-black leading-tight tracking-tight text-[#0B1730] dark:text-white">
                Час маршруту
              </h3>
              <p className="mt-0.5 text-xs font-medium text-slate-500 dark:text-slate-400">
                {selectedMode === 'arrive_by' ? 'Прибути не пізніше обраного часу' : isNow ? 'Пошук від поточного часу' : 'Час відправлення за Києвом'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Закрити вибір часу"
            className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-slate-100 text-slate-500 transition hover:bg-slate-200 hover:text-slate-900 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 dark:hover:text-white"
          >
            <X size={18} />
          </button>
        </div>

        <div className="px-5 pt-1 sm:px-6">
          <div className="grid grid-cols-3 gap-1.5 rounded-2xl border border-slate-200/80 bg-slate-100/80 p-1 dark:border-slate-700/80 dark:bg-[#0a1c32]" aria-label="Режим часу">
            {([
              { mode: 'now', label: 'Зараз' },
              { mode: 'depart_at', label: 'Відправлення' },
              { mode: 'arrive_by', label: 'Прибуття' },
            ] as const).map(({ mode, label }) => (
              <button
                key={mode}
                type="button"
                aria-pressed={selectedMode === mode}
                onClick={() => chooseTimeMode(mode)}
                className={`min-h-11 rounded-xl px-2 text-[11px] font-extrabold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${selectedMode === mode
                  ? 'bg-[#0866f5] text-white shadow-md shadow-blue-600/20'
                  : 'text-slate-600 hover:bg-white dark:text-slate-300 dark:hover:bg-slate-800'}`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <div className="px-5 pb-4 pt-4 sm:px-6">
          <div className="mb-3 text-center">
            <p className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">{selectedMode === 'arrive_by' ? 'Прибути до' : 'Виїхати о'}</p>
            <div className="mt-1 flex items-center justify-center gap-1.5 text-[42px] font-black leading-none tracking-tight text-[#0b1d3a] tabular-nums dark:text-white" aria-live="polite" aria-label={`Обраний час ${selectedHour}:${selectedMinute}`}>
              <span>{selectedHour}</span>
              <span className="pb-1 text-blue-600 dark:text-cyan-300">:</span>
              <span>{selectedMinute}</span>
            </div>
          </div>

          <div className="relative rounded-[26px] border border-slate-200/90 bg-[#f8fafc] p-3 shadow-inner dark:border-[#18365b] dark:bg-[#091b31]">
            <div className="grid grid-cols-[minmax(0,1fr)_20px_minmax(0,1fr)] items-center gap-1">
              <div className="text-center text-[10px] font-black uppercase tracking-[0.16em] text-slate-400 dark:text-slate-500">Години</div>
              <div aria-hidden="true" />
              <div className="text-center text-[10px] font-black uppercase tracking-[0.16em] text-slate-400 dark:text-slate-500">Хвилини</div>
              <div>
                <DrumWheelPicker
                  items={HOURS}
                  value={selectedHour}
                  onChange={(hour) => {
                    setSelectedHour(hour);
                    setSelectedMode((mode) => mode === 'now' ? 'depart_at' : mode);
                  }}
                  label="Години"
                />
              </div>
              <div aria-hidden="true" className="-mt-1 text-center text-2xl font-black text-blue-600 dark:text-cyan-300">:</div>
              <div>
              <DrumWheelPicker
                items={MINUTES}
                value={selectedMinute}
                onChange={(minute) => {
                  setSelectedMinute(minute);
                  setSelectedMode((mode) => mode === 'now' ? 'depart_at' : mode);
                }}
                label="Хвилини"
              />
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-slate-200/80 bg-white/70 px-5 pb-[calc(env(safe-area-inset-bottom)+1rem)] pt-3 dark:border-slate-800 dark:bg-[#061426]/80 sm:px-6 sm:pb-5">
          <button
            type="button"
            onClick={handleApply}
            className="flex min-h-14 w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[#0878ff] to-[#0758e8] text-sm font-black text-white shadow-lg shadow-blue-600/25 transition hover:brightness-105 active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-[#061426]"
          >
            <Check size={18} strokeWidth={2.8} />
            <span>Застосувати</span>
          </button>
          <button
            type="button"
            onClick={onClose}
            className="mt-2 min-h-11 w-full rounded-xl text-xs font-bold text-slate-500 transition hover:bg-slate-100 hover:text-slate-800 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white"
          >
            Скасувати
          </button>
        </div>
      </div>
    </div>
  ), document.body);
};

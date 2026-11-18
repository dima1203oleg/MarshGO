import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { Calendar as CalendarIcon, Check, ChevronLeft, ChevronRight, X } from 'lucide-react';
import { todayKyivDate } from '../../domain/kyivTime';

interface CalendarPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  dateStr: string; // 'YYYY-MM-DD'
  onConfirm: (date: string) => void;
}

const dateAtOffset = (base: string, offset: number) => {
  const [year, month, day] = base.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day + offset));
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}-${String(date.getUTCDate()).padStart(2, '0')}`;
};

const MONTH_NAMES = [
  'Січень', 'Лютий', 'Березень', 'Квітень', 'Травень', 'Червень',
  'Липень', 'Серпень', 'Вересень', 'Жовтень', 'Листопад', 'Грудень'
];

const WEEKDAYS = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Нд'];

export const CalendarPickerModal: React.FC<CalendarPickerModalProps> = ({
  isOpen,
  onClose,
  dateStr,
  onConfirm,
}) => {
  const today = todayKyivDate();
  const [selectedDate, setSelectedDate] = useState(dateStr || today);

  // Month navigation state
  const [viewYear, setViewYear] = useState(() => Number(selectedDate.split('-')[0] || today.split('-')[0]));
  const [viewMonth, setViewMonth] = useState(() => Number(selectedDate.split('-')[1] || today.split('-')[1]) - 1);

  if (!isOpen || typeof document === 'undefined') return null;

  const handlePrevMonth = () => {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear(viewYear - 1);
    } else {
      setViewMonth(viewMonth - 1);
    }
  };

  const handleNextMonth = () => {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear(viewYear + 1);
    } else {
      setViewMonth(viewMonth + 1);
    }
  };

  // Build grid days for the month
  const firstDayOfMonth = new Date(Date.UTC(viewYear, viewMonth, 1));
  const startingDay = (firstDayOfMonth.getUTCDay() + 6) % 7; // Monday = 0
  const daysInMonth = new Date(Date.UTC(viewYear, viewMonth + 1, 0)).getUTCDate();

  const calendarDays: Array<{ date: string; day: number; isCurrentMonth: boolean }> = [];
  for (let i = 0; i < startingDay; i++) {
    calendarDays.push({ date: '', day: 0, isCurrentMonth: false });
  }
  for (let d = 1; d <= daysInMonth; d++) {
    const formatted = `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    calendarDays.push({ date: formatted, day: d, isCurrentMonth: true });
  }

  const handleApply = () => {
    onConfirm(selectedDate);
    onClose();
  };

  return createPortal((
    <div
      className="fixed inset-0 z-[100] flex items-end justify-center bg-black/50 backdrop-blur-xs sm:items-center p-0 sm:p-4 animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="max-h-[90svh] w-full max-w-sm overflow-y-auto overscroll-contain rounded-t-[32px] border border-slate-200/80 bg-white shadow-2xl dark:border-slate-800 dark:bg-[#0B1730] sm:rounded-[32px]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Handle bar on mobile */}
        <div className="flex justify-center pt-3 pb-1 sm:hidden">
          <div className="h-1.5 w-12 rounded-full bg-slate-300 dark:bg-slate-700" />
        </div>

        {/* Modal Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-100 bg-white px-6 py-4 dark:border-slate-800 dark:bg-[#0B1730]">
          <div className="flex items-center gap-2.5">
            <div className="grid h-10 w-10 place-items-center rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-[#0066FF] dark:text-blue-400">
              <CalendarIcon size={20} strokeWidth={2.4} />
            </div>
            <div>
              <h3 className="text-base font-black text-[#0B1730] dark:text-white leading-tight">
                Дата поїздки
              </h3>
              <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                Календарний вибір
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

        {/* Quick Date Pills */}
        <div className="flex items-center gap-2 px-6 pt-4 pb-2">
          {[
            { label: 'Сьогодні', val: today },
            { label: 'Завтра', val: dateAtOffset(today, 1) },
            { label: 'Післязавтра', val: dateAtOffset(today, 2) },
          ].map((pill) => (
            <button
              key={pill.val}
              type="button"
              onClick={() => {
                setSelectedDate(pill.val);
                const [y, m] = pill.val.split('-').map(Number);
                setViewYear(y);
                setViewMonth(m - 1);
              }}
              className={`flex-1 rounded-xl py-2 px-1 text-center text-xs font-bold transition-all ${
                selectedDate === pill.val
                  ? 'bg-[#0066FF] text-white shadow-md shadow-blue-500/20'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-blue-50'
              }`}
            >
              {pill.label}
            </button>
          ))}
        </div>

        {/* Calendar Month Navigation */}
        <div className="px-6 py-3">
          <div className="flex items-center justify-between mb-3 px-1">
            <span className="text-sm font-black text-[#0B1730] dark:text-white">
              {MONTH_NAMES[viewMonth]} {viewYear}
            </span>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={handlePrevMonth}
                className="grid h-8 w-8 place-items-center rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200"
              >
                <ChevronLeft size={16} />
              </button>
              <button
                type="button"
                onClick={handleNextMonth}
                className="grid h-8 w-8 place-items-center rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>

          {/* Weekday headers */}
          <div className="grid grid-cols-7 gap-1 text-center mb-1">
            {WEEKDAYS.map((w, idx) => (
              <span
                key={w}
                className={`text-[10px] font-bold ${
                  idx >= 5 ? 'text-rose-500' : 'text-slate-400'
                }`}
              >
                {w}
              </span>
            ))}
          </div>

          {/* Days Grid */}
          <div className="grid grid-cols-7 gap-1 text-center">
            {calendarDays.map((cell, idx) => {
              if (!cell.isCurrentMonth) {
                return <div key={`empty-${idx}`} className="h-9 w-9" />;
              }
              const isSelected = cell.date === selectedDate;
              const isToday = cell.date === today;
              const isPast = cell.date < today;

              return (
                <button
                  key={cell.date}
                  type="button"
                  disabled={isPast}
                  onClick={() => setSelectedDate(cell.date)}
                  className={`grid h-9 w-9 place-items-center rounded-xl text-xs font-black transition-all ${
                    isSelected
                      ? 'bg-[#0066FF] text-white shadow-md shadow-blue-500/25 scale-105'
                      : isToday
                      ? 'border border-[#0066FF] text-[#0066FF] dark:text-blue-400'
                      : isPast
                      ? 'text-slate-300 dark:text-slate-700 opacity-40 cursor-not-allowed'
                      : 'text-slate-800 dark:text-slate-200 hover:bg-blue-50 dark:hover:bg-blue-950/40'
                  }`}
                >
                  {cell.day}
                </button>
              );
            })}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="sticky bottom-0 flex items-center gap-3 border-t border-slate-100 bg-slate-50 px-6 py-4 dark:border-slate-800 dark:bg-[#0B1730]">
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

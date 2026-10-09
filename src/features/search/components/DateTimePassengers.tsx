import React, { useState } from 'react';
import { Calendar, ChevronDown, Clock, Minus, Plus, User } from 'lucide-react';

interface DateTimePassengersProps {
  dateStr: string;
  timeStr: string;
  timeMode: 'now' | 'depart_at' | 'arrive_by';
  passengers: number;
  onDateChange: (date: string) => void;
  onTimeChange: (time: string) => void;
  onTimeModeChange: (mode: 'now' | 'depart_at' | 'arrive_by') => void;
  onPassengersChange: (count: number) => void;
}

export const DateTimePassengers: React.FC<DateTimePassengersProps> = ({
  dateStr,
  timeStr,
  timeMode: _timeMode,
  passengers,
  onDateChange,
  onTimeChange,
  onTimeModeChange,
  onPassengersChange,
}) => {
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [showPassengerPicker, setShowPassengerPicker] = useState(false);

  return (
    <div className="relative mt-2">
      <div className="grid grid-cols-3 gap-2">
        {/* Date Selector: Сьогодні \n 14 травня */}
        <div className="relative">
          <button
            type="button"
            onClick={() => {
              setShowDatePicker(!showDatePicker);
              setShowTimePicker(false);
              setShowPassengerPicker(false);
            }}
            className="flex w-full items-center gap-2 rounded-[20px] bg-white dark:bg-[#0B1730] px-3 py-2 text-left shadow-xs border border-slate-100/90 dark:border-slate-800 transition active:scale-95"
          >
            <div className="grid h-8 w-8 place-items-center rounded-xl bg-blue-50 dark:bg-blue-950/60 text-[#0866F5] shrink-0">
              <Calendar size={16} strokeWidth={2.4} />
            </div>
            <div className="min-w-0 flex-1 leading-tight">
              <span className="block text-[10px] font-bold text-[#63738C] dark:text-slate-400">
                Сьогодні
              </span>
              <span className="block text-[12px] font-black text-[#081B35] dark:text-white truncate">
                14 травня
              </span>
            </div>
          </button>

          {/* Quick Date Picker Dropdown */}
          {showDatePicker && (
            <div className="absolute left-0 top-full z-40 mt-1.5 w-44 rounded-2xl bg-white dark:bg-[#0B1730] p-2 shadow-xl border border-slate-100 dark:border-slate-800 animate-in fade-in-50 zoom-in-95">
              <div className="space-y-1">
                {['Сьогодні, 14 травня', 'Завтра, 15 травня', 'Пт, 16 травня', 'Сб, 17 травня'].map((d) => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => {
                      onDateChange(d);
                      setShowDatePicker(false);
                    }}
                    className={`flex w-full items-center rounded-xl px-2.5 py-1.5 text-xs font-bold text-left transition ${
                      dateStr === d
                        ? 'bg-[#0866F5] text-white'
                        : 'text-[#081B35] dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800'
                    }`}
                  >
                    {d}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Time Selector: 18:30 ⌵ */}
        <div className="relative">
          <button
            type="button"
            onClick={() => {
              setShowTimePicker(!showTimePicker);
              setShowDatePicker(false);
              setShowPassengerPicker(false);
            }}
            className="flex w-full items-center justify-between rounded-[20px] bg-white dark:bg-[#0B1730] px-3 py-2 text-left shadow-xs border border-slate-100/90 dark:border-slate-800 transition active:scale-95"
          >
            <div className="flex items-center gap-2 min-w-0">
              <div className="grid h-8 w-8 place-items-center rounded-xl bg-blue-50 dark:bg-blue-950/60 text-[#0866F5] shrink-0">
                <Clock size={16} strokeWidth={2.4} />
              </div>
              <span className="text-[13px] font-black text-[#081B35] dark:text-white">
                {timeStr}
              </span>
            </div>
            <ChevronDown size={14} className="text-[#63738C] shrink-0" />
          </button>

          {/* Quick Time Picker Dropdown */}
          {showTimePicker && (
            <div className="absolute left-0 top-full z-40 mt-1.5 w-40 rounded-2xl bg-white dark:bg-[#0B1730] p-2 shadow-xl border border-slate-100 dark:border-slate-800 animate-in fade-in-50 zoom-in-95">
              <div className="space-y-1">
                {['Зараз', '18:30', '19:00', '20:00', '21:30', 'Вранці 08:00'].map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => {
                      if (t === 'Зараз') {
                        onTimeModeChange('now');
                        onTimeChange('Зараз');
                      } else {
                        onTimeModeChange('depart_at');
                        onTimeChange(t);
                      }
                      setShowTimePicker(false);
                    }}
                    className={`flex w-full items-center rounded-xl px-2.5 py-1.5 text-xs font-bold text-left transition ${
                      timeStr === t
                        ? 'bg-[#0866F5] text-white'
                        : 'text-[#081B35] dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800'
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Passenger Selector: 1 пасажир ⌵ */}
        <div className="relative">
          <button
            type="button"
            onClick={() => {
              setShowPassengerPicker(!showPassengerPicker);
              setShowDatePicker(false);
              setShowTimePicker(false);
            }}
            className="flex w-full items-center justify-between rounded-[20px] bg-white dark:bg-[#0B1730] px-3 py-2 text-left shadow-xs border border-slate-100/90 dark:border-slate-800 transition active:scale-95"
          >
            <div className="flex items-center gap-2 min-w-0">
              <div className="grid h-8 w-8 place-items-center rounded-xl bg-blue-50 dark:bg-blue-950/60 text-[#0866F5] shrink-0">
                <User size={16} strokeWidth={2.4} />
              </div>
              <span className="text-[12px] font-black text-[#081B35] dark:text-white truncate">
                {passengers} {passengers === 1 ? 'пасажир' : 'пасажири'}
              </span>
            </div>
            <ChevronDown size={14} className="text-[#63738C] shrink-0" />
          </button>

          {/* Quick Passenger Counter Dropdown */}
          {showPassengerPicker && (
            <div className="absolute right-0 top-full z-40 mt-1.5 w-44 rounded-2xl bg-white dark:bg-[#0B1730] p-3 shadow-xl border border-slate-100 dark:border-slate-800 animate-in fade-in-50 zoom-in-95">
              <div className="flex items-center justify-between">
                <span className="text-xs font-extrabold text-[#081B35] dark:text-white">
                  Пасажири
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    disabled={passengers <= 1}
                    onClick={() => onPassengersChange(Math.max(1, passengers - 1))}
                    className="grid h-7 w-7 place-items-center rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 disabled:opacity-40"
                  >
                    <Minus size={13} />
                  </button>
                  <span className="w-4 text-center text-sm font-black text-[#081B35] dark:text-white">
                    {passengers}
                  </span>
                  <button
                    type="button"
                    disabled={passengers >= 8}
                    onClick={() => onPassengersChange(Math.min(8, passengers + 1))}
                    className="grid h-7 w-7 place-items-center rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 disabled:opacity-40"
                  >
                    <Plus size={13} />
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

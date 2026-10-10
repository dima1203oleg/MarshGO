import React, { useState } from 'react';
import { Calendar, ChevronDown, Clock, User } from 'lucide-react';
import { todayKyivDate } from '../../../domain/kyivTime';
import { CalendarPickerModal } from '../../../components/common/CalendarPickerModal';
import { TimeDrumPickerModal } from '../../../components/common/TimeDrumPickerModal';
import { PassengersDrumPickerModal } from '../../../components/common/PassengersDrumPickerModal';

interface DateTimePassengersProps {
  dateStr: string;
  timeStr: string;
  timeMode: 'now' | 'depart_at' | 'arrive_by';
  passengers: number;
  onDateChange: (date: string) => void;
  onTimeChange: (time: string) => void;
  onTimeModeChange: (mode: 'now' | 'depart_at' | 'arrive_by') => void;
  onPassengersChange: (count: number) => void;
  showTimeModeToggle?: boolean;
}

const formatDisplayDate = (dateVal: string) => {
  const today = todayKyivDate();
  if (dateVal === today) return 'Сьогодні';
  try {
    const [y, m, d] = dateVal.split('-').map(Number);
    const dateObj = new Date(Date.UTC(y, m - 1, d));
    return new Intl.DateTimeFormat('uk-UA', { day: 'numeric', month: 'short' }).format(dateObj);
  } catch {
    return dateVal;
  }
};

const getPassengerShortLabel = (n: number) => {
  if (n === 1) return '1 особа';
  if (n >= 2 && n <= 4) return `${n} особи`;
  return `${n} осіб`;
};

export const DateTimePassengers: React.FC<DateTimePassengersProps> = ({
  dateStr,
  timeStr,
  timeMode,
  passengers,
  onDateChange,
  onTimeChange,
  onTimeModeChange,
  onPassengersChange,
}) => {
  const [openCalendar, setOpenCalendar] = useState(false);
  const [openTimeDrum, setOpenTimeDrum] = useState(false);
  const [openPassengersDrum, setOpenPassengersDrum] = useState(false);

  return (
    <>
      {/* 3 Pills Row matching reference screenshot */}
      <div className="grid grid-cols-3 gap-2 px-3.5 py-2.5 border-t border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-900/20">
        {/* Date Pill */}
        <button
          type="button"
          onClick={() => setOpenCalendar(true)}
          className="flex items-center justify-between gap-1 rounded-xl bg-white dark:bg-[#101E38] px-2.5 py-2 border border-slate-200/80 dark:border-slate-700/80 shadow-2xs hover:border-[#0066FF] transition active:scale-95"
        >
          <div className="flex items-center gap-1.5 min-w-0">
            <Calendar size={13} className="text-[#0066FF] shrink-0" />
            <div className="text-left min-w-0">
              <span className="block text-[9.5px] font-bold text-slate-400 dark:text-slate-500 leading-none">
                Дата
              </span>
              <span className="block text-xs font-black text-[#0B1730] dark:text-white truncate leading-tight mt-0.5">
                {formatDisplayDate(dateStr)}
              </span>
            </div>
          </div>
          <ChevronDown size={12} className="text-slate-400 shrink-0" />
        </button>

        {/* Time Pill */}
        <button
          type="button"
          onClick={() => setOpenTimeDrum(true)}
          className="flex items-center justify-between gap-1 rounded-xl bg-white dark:bg-[#101E38] px-2.5 py-2 border border-slate-200/80 dark:border-slate-700/80 shadow-2xs hover:border-[#0066FF] transition active:scale-95"
        >
          <div className="flex items-center gap-1.5 min-w-0">
            <Clock size={13} className="text-[#0066FF] shrink-0" />
            <div className="text-left min-w-0">
              <span className="block text-[9.5px] font-bold text-slate-400 dark:text-slate-500 leading-none">
                Час
              </span>
              <span className="block text-xs font-black text-[#0B1730] dark:text-white truncate leading-tight mt-0.5">
                {timeMode === 'now' ? 'Зараз' : timeStr}
              </span>
            </div>
          </div>
          <ChevronDown size={12} className="text-slate-400 shrink-0" />
        </button>

        {/* Passengers Pill */}
        <button
          type="button"
          onClick={() => setOpenPassengersDrum(true)}
          className="flex items-center justify-between gap-1 rounded-xl bg-white dark:bg-[#101E38] px-2.5 py-2 border border-slate-200/80 dark:border-slate-700/80 shadow-2xs hover:border-[#0066FF] transition active:scale-95"
        >
          <div className="flex items-center gap-1.5 min-w-0">
            <User size={13} className="text-[#0066FF] shrink-0" />
            <div className="text-left min-w-0">
              <span className="block text-[9.5px] font-bold text-slate-400 dark:text-slate-500 leading-none">
                Пасажири
              </span>
              <span className="block text-xs font-black text-[#0B1730] dark:text-white truncate leading-tight mt-0.5">
                {getPassengerShortLabel(passengers)}
              </span>
            </div>
          </div>
          <ChevronDown size={12} className="text-slate-400 shrink-0" />
        </button>
      </div>

      {/* Date Calendar Picker Modal */}
      <CalendarPickerModal
        isOpen={openCalendar}
        onClose={() => setOpenCalendar(false)}
        dateStr={dateStr}
        onConfirm={onDateChange}
      />

      {/* Time Drum Wheel Picker Modal */}
      <TimeDrumPickerModal
        isOpen={openTimeDrum}
        onClose={() => setOpenTimeDrum(false)}
        timeStr={timeStr}
        timeMode={timeMode}
        onConfirm={(newTime, newMode) => {
          onTimeChange(newTime);
          onTimeModeChange(newMode);
        }}
      />

      {/* Passengers Drum Wheel Picker Modal */}
      <PassengersDrumPickerModal
        isOpen={openPassengersDrum}
        onClose={() => setOpenPassengersDrum(false)}
        passengers={passengers}
        onConfirm={onPassengersChange}
      />
    </>
  );
};

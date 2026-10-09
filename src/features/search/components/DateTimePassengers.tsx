import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Calendar, Check, Clock, Minus, Plus, User, X } from 'lucide-react';
import { todayKyivDate } from '../../../domain/kyivTime';

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

const dateAtOffset = (base: string, offset: number) => {
  const [year, month, day] = base.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day + offset));
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}-${String(date.getUTCDate()).padStart(2, '0')}`;
};

const formatDay = (value: string, options: Intl.DateTimeFormatOptions) =>
  new Intl.DateTimeFormat('uk-UA', { ...options, timeZone: 'Europe/Kyiv' }).format(new Date(`${value}T12:00:00Z`));

const TIME_OPTIONS = Array.from({ length: 96 }, (_, index) =>
  `${String(Math.floor(index / 4)).padStart(2, '0')}:${String((index % 4) * 15).padStart(2, '0')}`,
);

const WHEEL_ROW_HEIGHT = 48;

function TimeWheelColumn({
  label,
  values,
  selected,
  selectedIndex: selectedIndexOverride,
  onChange,
}: {
  label: string;
  values: string[];
  selected: string;
  selectedIndex?: number;
  onChange: (value: string) => void;
}) {
  const wheelRef = useRef<HTMLDivElement>(null);
  const selectedIndex = selectedIndexOverride ?? Math.max(0, values.indexOf(selected));

  useEffect(() => {
    if (!wheelRef.current) return;
    wheelRef.current.scrollTop = selectedIndex * WHEEL_ROW_HEIGHT;
  }, [selectedIndex]);

  const handleScroll = (event: React.UIEvent<HTMLDivElement>) => {
    const index = Math.round(event.currentTarget.scrollTop / WHEEL_ROW_HEIGHT);
    const value = values[Math.max(0, Math.min(values.length - 1, index))];
    if (value && value !== selected) onChange(value);
  };

  return (
    <div className="relative h-[240px] flex-1 overflow-hidden rounded-2xl" aria-label={label}>
      <div
        ref={wheelRef}
        role="listbox"
        aria-label={label}
        onScroll={handleScroll}
        className="h-full touch-pan-y snap-y snap-mandatory overflow-y-auto overscroll-contain [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        <div aria-hidden="true" className="h-24" />
        {values.map((value, index) => {
          const distance = Math.abs(index - selectedIndex);
          const active = index === selectedIndex;
          return (
            <button
              key={`${value}-${index}`}
              type="button"
              role="option"
              aria-selected={active}
              onClick={() => { onChange(value); wheelRef.current?.scrollTo({ top: index * WHEEL_ROW_HEIGHT, behavior: 'smooth' }); }}
              className={`flex h-12 w-full snap-center items-center justify-center text-center tabular-nums transition-colors ${active ? 'text-[26px] font-black text-white' : distance === 1 ? 'text-[19px] font-semibold text-slate-400' : 'text-[16px] font-medium text-slate-600'}`}
            >
              {value}
            </button>
          );
        })}
        <div aria-hidden="true" className="h-24" />
      </div>
      <div aria-hidden="true" className="pointer-events-none absolute inset-x-2 top-1/2 h-12 -translate-y-1/2 rounded-xl border border-blue-300/10 bg-[#17365B]/65" />
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_bottom,#0B1830_0%,transparent_30%,transparent_70%,#0B1830_100%)]" />
    </div>
  );
}

export const DateTimePassengers: React.FC<DateTimePassengersProps> = ({
  dateStr,
  timeStr,
  timeMode,
  passengers,
  onDateChange,
  onTimeChange,
  onTimeModeChange,
  onPassengersChange,
  showTimeModeToggle = true,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [customDate, setCustomDate] = useState(dateStr);
  const [draftDate, setDraftDate] = useState(dateStr);
  const [draftTime, setDraftTime] = useState(timeStr);
  const [draftTimeMode, setDraftTimeMode] = useState(timeMode);
  const [draftPassengers, setDraftPassengers] = useState(passengers);
  const today = todayKyivDate();
  const tomorrow = dateAtOffset(today, 1);
  const dateOptions = useMemo(() => Array.from({ length: 7 }, (_, index) => {
    const value = dateAtOffset(today, index);
    return {
      value,
      weekday: formatDay(value, { weekday: 'short' }).replace('.', ''),
      day: formatDay(value, { day: 'numeric' }),
      month: formatDay(value, { month: 'short' }).replace('.', ''),
    };
  }), [today]);

  useEffect(() => {
    if (!isOpen) return;
    setCustomDate(dateStr);
    setDraftDate(dateStr);
    setDraftTime(timeStr);
    setDraftTimeMode(timeMode);
    setDraftPassengers(passengers);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setIsOpen(false);
    };
    window.addEventListener('keydown', closeOnEscape);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', closeOnEscape);
    };
  }, [dateStr, isOpen, passengers, timeMode, timeStr]);

  const selectedTime = TIME_OPTIONS.includes(draftTime) ? draftTime : '18:30';
  const selectedHour = selectedTime.slice(0, 2);
  const selectedMinute = selectedTime.slice(3);
  const hourValues = useMemo(() => Array.from({ length: 24 }, (_, hour) => String(hour).padStart(2, '0')), []);
  const minuteValues = useMemo(() => {
    const quarterHours = ['00', '15', '30', '45'];
    const selectedIndex = quarterHours.indexOf(selectedMinute);
    return Array.from({ length: 9 }, (_, index) => quarterHours[(selectedIndex + index - 4 + quarterHours.length * 2) % quarterHours.length]);
  }, [selectedMinute]);
  const selectDate = (value: string) => {
    setCustomDate(value);
    setDraftDate(value);
    setDraftTimeMode('depart_at');
  };

  return (
    <div className="relative mt-3 space-y-2">
      {showTimeModeToggle && <div className="grid grid-cols-2 gap-1 rounded-2xl border border-[#E3EBF4] bg-[#EAF0F8] p-1 dark:border-slate-800 dark:bg-[#0B1730]" role="group" aria-label="Час поїздки">
        <button
          type="button"
          aria-pressed={timeMode === 'now'}
          onClick={() => onTimeModeChange('now')}
          className={`flex min-h-11 items-center justify-center gap-2 rounded-xl px-3 text-sm font-bold transition ${timeMode === 'now' ? 'bg-white text-[#1769ED] shadow-sm dark:bg-[#152640] dark:text-blue-300' : 'text-[#63738C] dark:text-slate-400'}`}
        >
          <Clock size={16} /> Зараз
        </button>
        <button
          type="button"
          aria-pressed={timeMode !== 'now'}
          onClick={() => { onTimeModeChange('depart_at'); setIsOpen(true); }}
          className={`flex min-h-11 items-center justify-center gap-2 rounded-xl px-3 text-sm font-bold transition ${timeMode !== 'now' ? 'bg-white text-[#1769ED] shadow-sm dark:bg-[#152640] dark:text-blue-300' : 'text-[#63738C] dark:text-slate-400'}`}
        >
          <Calendar size={16} /> Запланувати дату
        </button>
      </div>}

      <div className="grid grid-cols-3 gap-2">
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          aria-label={`Дата поїздки: ${formatDay(dateStr, { day: 'numeric', month: 'long' })}`}
          className="flex min-w-0 items-center gap-2 rounded-[18px] border border-[#E3EBF4] bg-white px-2 py-2.5 text-left shadow-xs transition active:scale-95 dark:border-slate-800 dark:bg-[#101E38]"
        >
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-blue-50 text-[#1769ED] dark:bg-blue-950/60"><Calendar size={17} strokeWidth={2.4} /></span>
          <span className="min-w-0"><span className="block text-[10px] font-semibold leading-none text-[#8291A5] dark:text-slate-400">Дата</span><span className="mt-1 block truncate text-[12px] font-extrabold text-[#142642] dark:text-white">{formatDay(dateStr, { day: 'numeric', month: 'short' })}</span></span>
        </button>

        <button type="button" onClick={() => setIsOpen(true)} className="flex min-w-0 items-center gap-2 rounded-[18px] border border-[#E3EBF4] bg-white px-2 py-2.5 text-left shadow-xs transition active:scale-95 dark:border-slate-800 dark:bg-[#101E38]" aria-label={`Час відправлення: ${timeMode === 'now' ? 'Зараз' : timeStr}`}>
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-blue-50 text-[#1769ED] dark:bg-blue-950/60"><Clock size={17} strokeWidth={2.4} /></span>
          <span className="min-w-0"><span className="block text-[10px] font-semibold leading-none text-[#8291A5] dark:text-slate-400">Час</span><span className="mt-1 block truncate text-[12px] font-extrabold text-[#142642] dark:text-white">{timeMode === 'now' ? 'Зараз' : timeStr}</span></span>
        </button>

        <div className="flex min-w-0 items-center justify-between gap-1.5 rounded-[18px] border border-[#E3EBF4] bg-white px-2 py-2.5 shadow-xs dark:border-slate-800 dark:bg-[#101E38]">
          <span className="grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-blue-50 text-[#1769ED] dark:bg-blue-950/60"><User size={16} strokeWidth={2.4} /></span>
          <span className="min-w-0 flex-1"><span className="block text-[9px] font-semibold leading-none text-[#8291A5] dark:text-slate-400">Пасажири</span><span className="mt-1 block truncate text-[11px] font-extrabold text-[#142642] dark:text-white">{passengers} {passengers === 1 ? 'пасажир' : 'пасажири'}</span></span>
          <button type="button" disabled={passengers <= 1} aria-label="Менше пасажирів" onClick={() => onPassengersChange(Math.max(1, passengers - 1))} className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-slate-100 text-slate-700 disabled:opacity-40 dark:bg-slate-800 dark:text-slate-200"><Minus size={12} /></button>
          <button type="button" disabled={passengers >= 8} aria-label="Більше пасажирів" onClick={() => onPassengersChange(Math.min(8, passengers + 1))} className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-[#1769ED] text-white disabled:opacity-40"><Plus size={12} /></button>
        </div>
      </div>

      {isOpen && (
        <div className="fixed inset-0 z-[70] flex items-end justify-center bg-[#10223C]/35 backdrop-blur-sm sm:items-center sm:p-4" onMouseDown={(event) => { if (event.target === event.currentTarget) setIsOpen(false); }}>
          <section role="dialog" aria-modal="true" aria-labelledby="search-datetime-title" className="flex max-h-[min(92svh,780px)] w-full max-w-md flex-col overflow-hidden rounded-t-[28px] border border-[#183454] bg-[#07172D] text-white shadow-2xl sm:rounded-[28px]">
            <header className="flex items-center justify-between border-b border-[#183454] bg-[#07172D] px-5 py-4">
              <span className="w-9" />
              <h2 id="search-datetime-title" className="text-base font-black">Вибір дати і часу</h2>
              <button type="button" aria-label="Закрити вибір дати" onClick={() => setIsOpen(false)} className="grid h-9 w-9 place-items-center rounded-full bg-[#10243F] text-slate-300 hover:bg-[#173454]"><X size={18} /></button>
            </header>

            <div className="min-h-0 flex-1 space-y-5 overflow-y-auto bg-[#07172D] px-5 py-5">
              <div className="grid grid-cols-3 gap-2" role="group" aria-label="Швидкий вибір дати">
                {([['today', 'Сьогодні', today], ['tomorrow', 'Завтра', tomorrow], ['other', 'Інша дата', 'other']] as const).map(([id, label, value]) => {
                  const active = id === 'today' ? draftDate === today : id === 'tomorrow' ? draftDate === tomorrow : draftDate !== today && draftDate !== tomorrow;
                  return <button key={id} type="button" aria-pressed={active} onClick={() => { if (id !== 'other') selectDate(value); else selectDate(draftDate !== today && draftDate !== tomorrow ? draftDate : dateAtOffset(today, 2)); }} className={`rounded-2xl px-2 py-3 text-sm font-bold transition ${active ? 'bg-[#0866F5] text-white shadow-md shadow-blue-600/20' : 'border border-[#193552] bg-[#0C1F38] text-slate-300 hover:border-blue-500'}`}>{label}</button>;
                })}
              </div>

              <div>
                <div className="mb-2 flex items-center justify-between"><h3 className="text-xs font-bold text-slate-200">Дата поїздки</h3><span className="text-[11px] text-slate-500">Київський час</span></div>
                <div className="no-scrollbar flex gap-2 overflow-x-auto pb-1" role="group" aria-label="Дати найближчого тижня">
                  {dateOptions.map((option) => <button key={option.value} type="button" aria-pressed={draftDate === option.value} onClick={() => selectDate(option.value)} className={`flex min-w-[58px] flex-col items-center rounded-2xl border px-2 py-2.5 transition ${draftDate === option.value ? 'border-[#0866F5] bg-[#0866F5] text-white shadow-md shadow-blue-600/20' : 'border-[#193552] bg-[#0C1F38] text-slate-300 hover:border-blue-500'}`}><span className={`text-[10px] font-bold uppercase ${option.value === dateAtOffset(today, 5) || option.value === dateAtOffset(today, 6) ? (draftDate === option.value ? 'text-blue-100' : 'text-rose-400') : ''}`}>{option.weekday}</span><span className="mt-1 text-lg font-black leading-none">{option.day}</span><span className="mt-1 text-[10px]">{option.month}</span></button>)}
                </div>
                <label className="mt-3 flex items-center justify-between gap-3 rounded-2xl border border-[#193552] bg-[#0C1F38] px-3 py-2.5 text-xs font-semibold text-slate-300">
                  <span>{draftDate !== today && draftDate !== tomorrow ? formatDay(draftDate, { day: 'numeric', month: 'long', year: 'numeric' }) : 'Обрати іншу дату'}</span>
                  <input aria-label="Інша дата поїздки" type="date" min={today} value={customDate} onChange={(event) => { setCustomDate(event.target.value); if (event.target.value) selectDate(event.target.value); }} className="max-w-[145px] rounded-lg border border-[#1C395A] bg-[#07172D] px-2 py-1.5 text-xs text-white [color-scheme:dark]" />
                </label>
              </div>

              <div>
                <div className="mb-2 flex items-center justify-between"><h3 className="text-xs font-bold text-slate-200">Час відправлення</h3><span className="text-[11px] text-slate-500">Europe/Kyiv</span></div>
                <div className="flex items-center justify-center gap-2 rounded-2xl border border-[#193552] bg-[#0C1F38] p-2">
                  <TimeWheelColumn label="Година відправлення" values={hourValues} selected={selectedHour} onChange={(hour) => { setDraftTime(`${hour}:${selectedMinute}`); setDraftTimeMode('depart_at'); }} />
                  <span aria-hidden="true" className="text-2xl font-black text-slate-400">:</span>
                  <TimeWheelColumn label="Хвилини відправлення" values={minuteValues} selected={selectedMinute} selectedIndex={4} onChange={(minute) => { setDraftTime(`${selectedHour}:${minute}`); setDraftTimeMode('depart_at'); }} />
                </div>
                <p className="mt-2 text-[11px] text-[#8291A5] dark:text-slate-500">Час вказано за часовим поясом Europe/Kyiv</p>
              </div>

              <div className="flex items-center justify-between rounded-2xl border border-[#193552] bg-[#0C1F38] px-4 py-3">
                <div><h3 className="text-sm font-bold">Пасажири</h3><p className="mt-0.5 text-xs text-slate-400">Кількість місць у поїздці</p></div>
                <div className="flex items-center gap-4"><button type="button" aria-label="Менше пасажирів" disabled={draftPassengers <= 1} onClick={() => setDraftPassengers(Math.max(1, draftPassengers - 1))} className="grid h-10 w-10 place-items-center rounded-full border border-[#254667] bg-[#10243F] text-slate-200 disabled:opacity-40"><Minus size={18} /></button><span aria-live="polite" className="w-4 text-center text-lg font-black">{draftPassengers}</span><button type="button" aria-label="Більше пасажирів" disabled={draftPassengers >= 8} onClick={() => setDraftPassengers(Math.min(8, draftPassengers + 1))} className="grid h-10 w-10 place-items-center rounded-full bg-[#0866F5] text-white disabled:opacity-40"><Plus size={18} /></button></div>
              </div>
            </div>

            <footer className="border-t border-[#183454] bg-[#07172D] p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))]">
              <button type="button" onClick={() => { onDateChange(draftDate); onTimeChange(selectedTime); onTimeModeChange(draftTimeMode); onPassengersChange(draftPassengers); setIsOpen(false); }} className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[#0866F5] py-4 text-base font-black text-white shadow-lg shadow-blue-600/20 active:scale-[.99]"><Check size={18} />Застосувати</button>
            </footer>
          </section>
        </div>
      )}
    </div>
  );
};

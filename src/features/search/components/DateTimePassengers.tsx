import React, { useEffect, useMemo, useState } from 'react';
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
  const selectDate = (value: string) => {
    setCustomDate(value);
    setDraftDate(value);
    setDraftTimeMode('depart_at');
  };

  return (
    <div className="relative mt-2">
      <div className="grid grid-cols-3 gap-2">
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          aria-label={`Дата поїздки: ${formatDay(dateStr, { day: 'numeric', month: 'long' })}`}
          className="flex min-w-0 items-center gap-2 rounded-[20px] border border-slate-100/90 bg-white px-3 py-2 text-left shadow-xs transition active:scale-95 dark:border-slate-800 dark:bg-[#0B1730]"
        >
          <span className="grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-blue-50 text-[#0866F5] dark:bg-blue-950/60"><Calendar size={16} strokeWidth={2.4} /></span>
          <span className="min-w-0 truncate text-[12px] font-black text-[#081B35] dark:text-white">{formatDay(dateStr, { day: 'numeric', month: 'short' })}</span>
        </button>

        <button type="button" onClick={() => setIsOpen(true)} className="flex min-w-0 items-center justify-center gap-2 rounded-[20px] border border-slate-100/90 bg-white px-3 py-2 shadow-xs transition active:scale-95 dark:border-slate-800 dark:bg-[#0B1730]" aria-label={`Час відправлення: ${timeMode === 'now' ? 'Зараз' : timeStr}`}>
          <span className="grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-blue-50 text-[#0866F5] dark:bg-blue-950/60"><Clock size={16} strokeWidth={2.4} /></span>
          <span className="truncate text-[13px] font-black text-[#081B35] dark:text-white">{timeMode === 'now' ? 'Зараз' : timeStr}</span>
        </button>

        <div className="flex min-w-0 items-center justify-between gap-1 rounded-[20px] border border-slate-100/90 bg-white px-2 py-2 shadow-xs dark:border-slate-800 dark:bg-[#0B1730]">
          <span className="grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-blue-50 text-[#0866F5] dark:bg-blue-950/60"><User size={16} strokeWidth={2.4} /></span>
          <span className="truncate text-[11px] font-black text-[#081B35] dark:text-white">{passengers} пас.</span>
          <button type="button" disabled={passengers <= 1} aria-label="Менше пасажирів" onClick={() => onPassengersChange(Math.max(1, passengers - 1))} className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-slate-100 text-slate-700 disabled:opacity-40 dark:bg-slate-800 dark:text-slate-200"><Minus size={13} /></button>
          <button type="button" disabled={passengers >= 8} aria-label="Більше пасажирів" onClick={() => onPassengersChange(Math.min(8, passengers + 1))} className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-[#0866F5] text-white disabled:opacity-40"><Plus size={13} /></button>
        </div>
      </div>

      {isOpen && (
        <div className="fixed inset-0 z-[70] flex items-end justify-center bg-[#020817]/65 backdrop-blur-sm sm:items-center sm:p-4" onMouseDown={(event) => { if (event.target === event.currentTarget) setIsOpen(false); }}>
          <section role="dialog" aria-modal="true" aria-labelledby="search-datetime-title" className="flex max-h-[min(92svh,780px)] w-full max-w-md flex-col overflow-hidden rounded-t-[28px] border border-[#1C3655] bg-[#07172B] text-white shadow-2xl sm:rounded-[28px]">
            <header className="flex items-center justify-between border-b border-white/10 px-5 py-4">
              <span className="w-9" />
              <h2 id="search-datetime-title" className="text-base font-black">Вибір дати і часу</h2>
              <button type="button" aria-label="Закрити вибір дати" onClick={() => setIsOpen(false)} className="grid h-9 w-9 place-items-center rounded-full bg-white/5 text-slate-300 hover:bg-white/10"><X size={18} /></button>
            </header>

            <div className="min-h-0 flex-1 space-y-5 overflow-y-auto px-5 py-5">
              <div className="grid grid-cols-3 gap-2" role="group" aria-label="Швидкий вибір дати">
                {([['today', 'Сьогодні', today], ['tomorrow', 'Завтра', tomorrow], ['other', 'Інша дата', 'other']] as const).map(([id, label, value]) => {
                  const active = id === 'today' ? draftDate === today : id === 'tomorrow' ? draftDate === tomorrow : draftDate !== today && draftDate !== tomorrow;
                  return <button key={id} type="button" aria-pressed={active} onClick={() => { if (id !== 'other') selectDate(value); else selectDate(draftDate !== today && draftDate !== tomorrow ? draftDate : dateAtOffset(today, 2)); }} className={`rounded-2xl px-2 py-3 text-sm font-bold transition ${active ? 'bg-[#0866F5] text-white shadow-lg shadow-blue-600/20' : 'border border-white/10 bg-white/[0.04] text-slate-300 hover:bg-white/[0.08]'}`}>{label}</button>;
                })}
              </div>

              <div>
                <div className="mb-2 flex items-center justify-between"><h3 className="text-xs font-bold text-slate-300">Дата поїздки</h3><span className="text-[11px] text-slate-500">Київський час</span></div>
                <div className="no-scrollbar flex gap-2 overflow-x-auto pb-1" role="group" aria-label="Дати найближчого тижня">
                  {dateOptions.map((option) => <button key={option.value} type="button" aria-pressed={draftDate === option.value} onClick={() => selectDate(option.value)} className={`flex min-w-[58px] flex-col items-center rounded-2xl border px-2 py-2.5 transition ${draftDate === option.value ? 'border-[#0866F5] bg-[#0866F5] text-white shadow-lg shadow-blue-600/20' : 'border-white/10 bg-white/[0.04] text-slate-300 hover:border-white/20'}`}><span className={`text-[10px] font-bold uppercase ${option.value === dateAtOffset(today, 5) || option.value === dateAtOffset(today, 6) ? 'text-rose-300' : ''}`}>{option.weekday}</span><span className="mt-1 text-lg font-black leading-none">{option.day}</span><span className="mt-1 text-[10px]">{option.month}</span></button>)}
                </div>
                <label className="mt-3 flex items-center justify-between gap-3 rounded-2xl border border-white/10 bg-white/[0.04] px-3 py-2.5 text-xs font-semibold text-slate-300">
                  <span>{draftDate !== today && draftDate !== tomorrow ? formatDay(draftDate, { day: 'numeric', month: 'long', year: 'numeric' }) : 'Обрати іншу дату'}</span>
                  <input aria-label="Інша дата поїздки" type="date" min={today} value={customDate} onChange={(event) => { setCustomDate(event.target.value); if (event.target.value) selectDate(event.target.value); }} className="max-w-[145px] rounded-lg border border-white/10 bg-[#0C2039] px-2 py-1.5 text-xs text-white [color-scheme:dark]" />
                </label>
              </div>

              <div>
                <div className="mb-2 flex items-center justify-between"><h3 className="text-xs font-bold text-slate-300">Час відправлення</h3><button type="button" onClick={() => { setDraftTimeMode('now'); }} className={`rounded-full px-3 py-1 text-[11px] font-bold ${draftTimeMode === 'now' ? 'bg-blue-600 text-white' : 'bg-white/5 text-slate-400'}`}>Зараз</button></div>
                <div className="flex items-center justify-center gap-3 rounded-2xl border border-white/10 bg-[#0B203A] p-3">
                  <label className="sr-only" htmlFor="search-departure-hour">Година відправлення</label>
                  <select id="search-departure-hour" aria-label="Година відправлення" value={selectedTime.slice(0, 2)} onChange={(event) => { setDraftTime(`${event.target.value}:${selectedTime.slice(3)}`); setDraftTimeMode('depart_at'); }} className="w-24 appearance-none rounded-xl bg-transparent py-2 text-center text-3xl font-black text-white outline-none focus:bg-white/5">
                    {Array.from({ length: 24 }, (_, hour) => <option key={hour} value={String(hour).padStart(2, '0')} className="bg-[#0B203A] text-white">{String(hour).padStart(2, '0')}</option>)}
                  </select>
                  <span className="text-2xl font-black text-slate-400">:</span>
                  <label className="sr-only" htmlFor="search-departure-minute">Хвилини відправлення</label>
                  <select id="search-departure-minute" aria-label="Хвилини відправлення" value={selectedTime.slice(3)} onChange={(event) => { setDraftTime(`${selectedTime.slice(0, 2)}:${event.target.value}`); setDraftTimeMode('depart_at'); }} className="w-24 appearance-none rounded-xl bg-transparent py-2 text-center text-3xl font-black text-white outline-none focus:bg-white/5">
                    {['00', '15', '30', '45'].map((minute) => <option key={minute} value={minute} className="bg-[#0B203A] text-white">{minute}</option>)}
                  </select>
                </div>
                <p className="mt-2 text-[11px] text-slate-500">Час вказано за часовим поясом Europe/Kyiv</p>
              </div>

              <div className="flex items-center justify-between border-y border-white/10 py-4">
                <div><h3 className="text-sm font-bold">Пасажири</h3><p className="mt-0.5 text-xs text-slate-400">Кількість місць у поїздці</p></div>
                <div className="flex items-center gap-4"><button type="button" aria-label="Менше пасажирів" disabled={draftPassengers <= 1} onClick={() => setDraftPassengers(Math.max(1, draftPassengers - 1))} className="grid h-10 w-10 place-items-center rounded-full border border-white/10 bg-white/[0.04] text-white disabled:opacity-40"><Minus size={18} /></button><span aria-live="polite" className="w-4 text-center text-lg font-black">{draftPassengers}</span><button type="button" aria-label="Більше пасажирів" disabled={draftPassengers >= 8} onClick={() => setDraftPassengers(Math.min(8, draftPassengers + 1))} className="grid h-10 w-10 place-items-center rounded-full bg-[#0866F5] text-white disabled:opacity-40"><Plus size={18} /></button></div>
              </div>
            </div>

            <footer className="border-t border-white/10 bg-[#07172B] p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))]">
              <button type="button" onClick={() => { onDateChange(draftDate); onTimeChange(selectedTime); onTimeModeChange(draftTimeMode); onPassengersChange(draftPassengers); setIsOpen(false); }} className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[#0866F5] py-4 text-base font-black text-white shadow-lg shadow-blue-600/20 active:scale-[.99]"><Check size={18} />Застосувати</button>
            </footer>
          </section>
        </div>
      )}
    </div>
  );
};

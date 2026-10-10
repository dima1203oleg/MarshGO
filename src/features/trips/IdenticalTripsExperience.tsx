import React, { useMemo, useState } from 'react';
import { Bell, CalendarDays, Car, CheckCircle2, ChevronRight, Clock3, MessageCircle, Plus, Search, Ticket, Users } from 'lucide-react';
import type { ApiBooking, ApiDemand, ApiOffer, ApiRescueResult, ApiStoredJourney } from '../../services/productionApi';

export type UserRoleMode = 'passenger' | 'driver';
export type SubTabMode = 'overview' | 'offers' | 'demands' | 'saved';

interface IdenticalTripsProps {
  onOpenSearch?: () => void;
  onOpenPublish?: () => void;
  onOpenNotifications?: () => void;
  onOpenChat?: (bookingId?: string) => void;
  onNavigateHome?: () => void;
  onManageBooking?: (bookingId: string) => void;
  onEditOffer?: (offerId: string) => void;
  onCancelBooking?: (bookingId: string) => void;
  onOpenJourney?: (journeyId: string) => void;
  onOpenRescueOffer?: (offerId: string, journeyId: string, journeyLegId: string) => void;
  bookings?: ApiBooking[];
  offers?: ApiOffer[];
  demands?: ApiDemand[];
  journeys?: ApiStoredJourney[];
  bookingRescues?: Record<string, { loading: boolean; failed: boolean; result?: ApiRescueResult }>;
}

const ACTIVE_BOOKING_STATES = new Set(['confirmed', 'boarding', 'in_progress']);
const TERMINAL_JOURNEY_STATES = new Set(['CANCELLED', 'COMPLETED', 'FAILED']);

function formatDate(value: string): string {
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return 'Час не вказано';
  return new Intl.DateTimeFormat('uk-UA', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'Europe/Kyiv' }).format(date);
}

function formatMoney(minor: number | null, currency = 'UAH'): string {
  if (minor === null) return 'Ціна не визначена';
  return new Intl.NumberFormat('uk-UA', { style: 'currency', currency, maximumFractionDigits: 0 }).format(minor / 100);
}

function statusLabel(status: string): string {
  const labels: Record<string, string> = {
    confirmed: 'Підтверджено', boarding: 'Посадка', in_progress: 'У дорозі',
    completed: 'Завершено', cancelled: 'Скасовано', pending: 'Очікує підтвердження',
    PLANNED: 'Заплановано', READY: 'Маршрут готовий', PARTIALLY_RESERVED: 'Частково заброньовано',
    REPLANNING: 'Потрібне перепланування', ACTIVE: 'У дорозі', COMPLETED: 'Завершено',
    CANCELLED: 'Скасовано', FAILED: 'Не вдалося побудувати',
  };
  return labels[status] ?? status;
}

function StatusPill({ status }: { status: string }) {
  const positive = ['confirmed', 'boarding', 'in_progress', 'completed', 'READY', 'ACTIVE'].includes(status);
  return <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-bold ${positive ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300' : 'bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300'}`}><CheckCircle2 size={13} />{statusLabel(status)}</span>;
}

export const IdenticalTripsExperience: React.FC<IdenticalTripsProps> = ({
  onOpenSearch, onOpenPublish, onOpenNotifications, onOpenChat, onNavigateHome,
  onManageBooking, onEditOffer, onCancelBooking, onOpenJourney, onOpenRescueOffer,
  journeys = [], bookings = [], offers = [], demands = [], bookingRescues = {},
}) => {
  const [role, setRole] = useState<UserRoleMode>('passenger');
  const [subTab, setSubTab] = useState<SubTabMode>('overview');
  const activeJourneys = useMemo(() => journeys.filter((journey) => !TERMINAL_JOURNEY_STATES.has(journey.state)), [journeys]);
  const upcomingBookings = useMemo(() => bookings.filter((booking) => ACTIVE_BOOKING_STATES.has(booking.status)), [bookings]);
  const nextJourney = [...activeJourneys].sort((a, b) => Date.parse(a.requested_departure_at) - Date.parse(b.requested_departure_at))[0];
  const nextBooking = [...upcomingBookings].sort((a, b) => Date.parse(a.departure_at) - Date.parse(b.departure_at))[0];
  const bookingList = role === 'driver' ? bookings.filter((booking) => booking.current_user_is_driver) : bookings.filter((booking) => !booking.current_user_is_driver);

  return (
    <main className="min-h-[70svh] bg-[#F5F8FD] px-4 pb-28 pt-3 dark:bg-[#08121f]">
      <div className="mx-auto max-w-xl space-y-4">
        <header className="flex items-center justify-between rounded-3xl border border-[#E3EBF4] bg-white px-4 py-3 shadow-sm dark:border-slate-800 dark:bg-[#101E38]">
          <button type="button" onClick={onNavigateHome} className="flex items-center gap-2 text-left" aria-label="На головну">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-blue-600 font-black text-white">M</span>
            <span><b className="block text-sm text-slate-900 dark:text-white">MARSHGO</b><span className="text-[10px] text-slate-500">Мої поїздки</span></span>
          </button>
          <div className="flex gap-2">
            <button type="button" onClick={() => onOpenChat?.()} aria-label="Повідомлення" className="grid h-10 w-10 place-items-center rounded-full bg-slate-50 text-slate-600 dark:bg-slate-800 dark:text-slate-200"><MessageCircle size={18} /></button>
            <button type="button" onClick={onOpenNotifications} aria-label="Сповіщення" className="grid h-10 w-10 place-items-center rounded-full bg-slate-50 text-slate-600 dark:bg-slate-800 dark:text-slate-200"><Bell size={18} /></button>
          </div>
        </header>

        <section className="rounded-3xl border border-[#E3EBF4] bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-[#101E38]">
          <div className="flex items-start justify-between gap-3">
            <div><h1 className="text-2xl font-black tracking-tight text-slate-950 dark:text-white">Мої поїздки</h1><p className="mt-1 text-sm text-slate-500">Бронювання, маршрути, пропозиції та заявки з вашого акаунта.</p></div>
            <span className="rounded-2xl bg-blue-50 px-3 py-2 text-xs font-bold text-blue-700 dark:bg-blue-950/50 dark:text-blue-300">{bookings.length + journeys.length}</span>
          </div>
          <div className="mt-4 grid grid-cols-2 rounded-2xl bg-slate-100 p-1 dark:bg-slate-900">
            {(['passenger', 'driver'] as const).map((value) => <button key={value} type="button" onClick={() => setRole(value)} className={`rounded-xl px-3 py-2.5 text-sm font-bold ${role === value ? 'bg-white text-blue-700 shadow-sm dark:bg-slate-800 dark:text-blue-300' : 'text-slate-500'}`}>{value === 'passenger' ? 'Пасажир' : 'Водій'}</button>)}
          </div>
          <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
            {([{ id: 'overview', label: 'Огляд' }, { id: 'offers', label: `Пропозиції · ${offers.length}` }, { id: 'demands', label: `Заявки · ${demands.length}` }, { id: 'saved', label: `Маршрути · ${journeys.length}` }] as const).map((tab) => <button key={tab.id} type="button" aria-label={tab.id === 'saved' ? 'Збережені маршрути' : undefined} onClick={() => setSubTab(tab.id)} className={`shrink-0 rounded-full px-4 py-2 text-xs font-bold ${subTab === tab.id ? 'bg-blue-600 text-white' : 'border border-slate-200 bg-white text-slate-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300'}`}>{tab.label}</button>)}
          </div>
        </section>

        {subTab === 'overview' && <>
          <section className="rounded-3xl border border-[#E3EBF4] bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-[#101E38]">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-500"><CalendarDays size={15} /> НАЙБЛИЖЧА ПОЇЗДКА</div>
            {nextJourney ? <div className="mt-3"><div className="flex items-start justify-between gap-2"><h2 className="text-lg font-black text-slate-900 dark:text-white">{nextJourney.origin_name} → {nextJourney.destination_name}</h2><StatusPill status={nextJourney.state} /></div><p className="mt-2 text-sm text-slate-500">{formatDate(nextJourney.requested_departure_at)} · {nextJourney.passenger_count} пас.</p><p className="mt-1 text-sm font-bold text-slate-700 dark:text-slate-200">{formatMoney(nextJourney.confirmed_price_minor ?? nextJourney.total_price_minor)} · {nextJourney.legs.length} сегм.</p><button onClick={() => onOpenJourney?.(nextJourney.id)} className="mt-4 w-full rounded-2xl bg-blue-600 py-3 text-sm font-bold text-white">Відкрити маршрут</button></div> : nextBooking ? <div className="mt-3"><div className="flex items-start justify-between gap-2"><h2 className="text-lg font-black text-slate-900 dark:text-white">{nextBooking.origin_name} → {nextBooking.destination_name}</h2><StatusPill status={nextBooking.status} /></div><p className="mt-2 text-sm text-slate-500">{formatDate(nextBooking.departure_at)} · {nextBooking.seat_count} місц.</p><p className="mt-1 text-sm font-bold text-slate-700 dark:text-slate-200">{formatMoney(nextBooking.total_price_minor, nextBooking.currency)}</p><button onClick={() => onManageBooking?.(nextBooking.id)} className="mt-4 w-full rounded-2xl bg-blue-600 py-3 text-sm font-bold text-white">Деталі бронювання</button></div> : <EmptyState title="Запланованих поїздок поки немає" text="Знайдіть маршрут або опублікуйте поїздку. Додані варіанти з’являться тут." onSearch={onOpenSearch} onPublish={onOpenPublish} />}
          </section>
          <section className="space-y-3">
            <div className="flex items-center justify-between"><h2 className="text-lg font-black text-slate-900 dark:text-white">Бронювання</h2><span className="text-xs text-slate-500">{bookingList.length}</span></div>
            {bookingList.length ? bookingList.slice(0, 5).map((booking) => {
              const linkedLeg = journeys.flatMap((journey) => journey.legs.map((leg) => ({ journey, leg }))).find(({ leg }) => leg.bookingId === booking.id);
              return <BookingCard key={booking.id} booking={booking} rescue={bookingRescues[booking.id]} routeRef={linkedLeg ? { journeyId: linkedLeg.journey.id, journeyLegId: linkedLeg.leg.id } : undefined} onOpenRescueOffer={onOpenRescueOffer} onOpenChat={onOpenChat} onManage={onManageBooking} onCancel={onCancelBooking} />;
            }) : <EmptyCard text="Бронювань для цього режиму ще немає." />}
          </section>
        </>}

        {subTab === 'offers' && <section className="space-y-3"><h2 className="text-lg font-black text-slate-900 dark:text-white">Мої пропозиції</h2>{offers.length ? offers.map((offer) => <article key={offer.id} className="rounded-3xl border border-[#E3EBF4] bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-[#101E38]"><div className="flex items-start justify-between gap-3"><div><h3 className="font-black text-slate-900 dark:text-white">{offer.origin_name} → {offer.destination_name}</h3><p className="mt-1 text-xs text-slate-500">{formatDate(offer.departure_at)}</p><p className="mt-2 text-sm font-bold text-blue-700 dark:text-blue-300">{formatMoney(offer.price_per_seat_minor, offer.currency)} за місце</p><p className="mt-1 text-xs text-slate-500">{offer.available_seats} вільних із {offer.total_seats} місць</p></div><Car className="text-blue-600" /></div><button type="button" onClick={() => onEditOffer?.(offer.id)} className="mt-4 w-full rounded-xl border border-blue-200 py-3 text-xs font-bold text-blue-700 dark:border-blue-900 dark:text-blue-300">Відкрити пропозицію</button></article>) : <EmptyState title="Опублікованих поїздок поки немає" text="Створені пропозиції відображатимуться тут після відповіді сервера." onPublish={onOpenPublish} />}</section>}

        {subTab === 'demands' && <section className="space-y-3"><h2 className="text-lg font-black text-slate-900 dark:text-white">Мої заявки</h2>{demands.length ? demands.map((demand) => <article key={demand.id} className="rounded-3xl border border-[#E3EBF4] bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-[#101E38]"><div className="flex items-start justify-between gap-3"><div><h3 className="font-black text-slate-900 dark:text-white">{demand.origin_name} → {demand.destination_name}</h3><p className="mt-1 text-xs text-slate-500">{formatDate(demand.earliest_departure)} — {formatDate(demand.latest_departure)}</p><p className="mt-2 text-sm text-slate-600 dark:text-slate-300">{demand.passenger_count} пас. · {demand.budget_minor === null ? 'Бюджет не вказано' : `${formatMoney(demand.budget_minor)} ${demand.budget_type === 'per_seat' ? 'за місце' : 'загалом'}`}</p><p className="mt-1 text-xs text-slate-500">{demand.proposal_count ?? 0} пропозицій · {statusLabel(demand.status)}</p></div><Users className="text-blue-600" /></div>{demand.notes && <p className="mt-3 rounded-xl bg-slate-50 p-3 text-xs text-slate-600 dark:bg-slate-900 dark:text-slate-300">{demand.notes}</p>}</article>) : <EmptyState title="Заявок ще немає" text="Пасажирські запити, створені у пошуку, з’являться тут." onSearch={onOpenSearch} />}</section>}

        {subTab === 'saved' && <section role="region" aria-label="Збережені маршрути" className="space-y-3"><h2 className="text-lg font-black text-slate-900 dark:text-white">Маршрути</h2>{journeys.length ? journeys.map((journey) => <article key={journey.id} className="rounded-3xl border border-[#E3EBF4] bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-[#101E38]"><div className="flex items-start justify-between gap-2"><div><StatusPill status={journey.state} /><h3 className="mt-2 font-black text-slate-900 dark:text-white">{journey.origin_name} → {journey.destination_name}</h3><p className="mt-1 text-xs text-slate-500">{formatDate(journey.requested_departure_at)} · {journey.passenger_count} пас.</p></div><span className="text-sm font-black text-blue-700 dark:text-blue-300">{formatMoney(journey.confirmed_price_minor ?? journey.total_price_minor)}</span></div><p className="mt-3 text-xs text-slate-500">{journey.legs.length} сегм. · {journey.legs.map((leg) => leg.mode).join(' → ') || 'Сегменти не надані'}</p><button onClick={() => onOpenJourney?.(journey.id)} className="mt-3 w-full rounded-xl bg-blue-600 py-3 text-xs font-bold text-white">Переглянути маршрут</button></article>) : <EmptyState title="Збережених маршрутів поки немає" text="Побудовані та збережені маршрути будуть показані тут." onSearch={onOpenSearch} />}</section>}
      </div>
    </main>
  );
};

function EmptyCard({ text }: { text: string }) {
  return <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-5 text-center text-sm text-slate-500 dark:border-slate-700 dark:bg-[#101E38]">{text}</div>;
}

function EmptyState({ title, text, onSearch, onPublish }: { title: string; text: string; onSearch?: () => void; onPublish?: () => void }) {
  return <div className="mt-3 rounded-2xl bg-slate-50 p-4 text-center dark:bg-slate-900"><p className="font-bold text-slate-800 dark:text-slate-100">{title}</p><p className="mt-1 text-xs leading-5 text-slate-500">{text}</p><div className="mt-3 flex justify-center gap-2">{onSearch && <button type="button" onClick={onSearch} className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-bold text-white"><Search size={14} />Пошук</button>}{onPublish && <button type="button" onClick={onPublish} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-bold text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"><Plus size={14} />Створити</button>}</div></div>;
}

function BookingCard({ booking, rescue, routeRef, onOpenRescueOffer, onOpenChat, onManage, onCancel }: { booking: ApiBooking; rescue?: { loading: boolean; failed: boolean; result?: ApiRescueResult }; routeRef?: { journeyId: string; journeyLegId: string }; onOpenRescueOffer?: (offerId: string, journeyId: string, journeyLegId: string) => void; onOpenChat?: (bookingId?: string) => void; onManage?: (bookingId: string) => void; onCancel?: (bookingId: string) => void }) {
  return <article className="rounded-3xl border border-[#E3EBF4] bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-[#101E38]"><div className="flex items-start justify-between gap-3"><div className="min-w-0"><StatusPill status={booking.status} /><h3 className="mt-2 truncate font-black text-slate-900 dark:text-white">{booking.origin_name} → {booking.destination_name}</h3><p className="mt-1 flex items-center gap-1 text-xs text-slate-500"><Clock3 size={13} />{formatDate(booking.departure_at)}</p><p className="mt-1 text-xs text-slate-500">{booking.current_user_is_driver ? 'Пасажир' : 'Водій'}: {booking.current_user_is_driver ? booking.passenger_name : booking.driver_name}</p></div><p className="shrink-0 text-sm font-black text-blue-700 dark:text-blue-300">{formatMoney(booking.total_price_minor, booking.currency)}</p></div><div className="mt-3 flex gap-2"><button type="button" onClick={() => onManage?.(booking.id)} className="flex-1 rounded-xl bg-blue-600 py-2.5 text-xs font-bold text-white"><Ticket className="mr-1 inline" size={14} />Деталі</button><button type="button" onClick={() => onOpenChat?.(booking.id)} className="flex-1 rounded-xl border border-slate-200 py-2.5 text-xs font-bold text-slate-700 dark:border-slate-700 dark:text-slate-200"><MessageCircle className="mr-1 inline" size={14} />Чат</button>{!booking.current_user_is_driver && ACTIVE_BOOKING_STATES.has(booking.status) && <button type="button" onClick={() => onCancel?.(booking.id)} className="rounded-xl border border-rose-200 px-3 py-2.5 text-xs font-bold text-rose-700 dark:border-rose-900 dark:text-rose-300">Скасувати</button>}</div>{rescue?.loading && <p className="mt-3 text-xs text-slate-500">Перевіряємо варіанти порятунку…</p>}{rescue?.failed && <p className="mt-3 rounded-xl bg-amber-50 p-3 text-xs text-amber-800 dark:bg-amber-950/40 dark:text-amber-200">Не вдалося перевірити альтернативи зараз.</p>}{rescue?.result?.alternatives.map((alternative) => routeRef ? <button key={alternative.id} type="button" data-offer-id={alternative.id} onClick={() => onOpenRescueOffer?.(alternative.id, routeRef.journeyId, routeRef.journeyLegId)} className="mt-3 flex w-full items-center justify-between rounded-xl bg-emerald-50 p-3 text-left text-xs text-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-200"><span><b>Альтернатива після скасування</b><span className="block mt-1">{alternative.origin_name} → {alternative.destination_name} · {formatMoney(alternative.price_per_seat_minor, alternative.currency)}</span></span><ChevronRight size={16} /></button> : <div key={alternative.id} className="mt-3 rounded-xl bg-emerald-50 p-3 text-xs text-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-200"><b>Знайдено альтернативу</b><span className="mt-1 block">{alternative.origin_name} → {alternative.destination_name} · {formatMoney(alternative.price_per_seat_minor, alternative.currency)}</span></div>)}</article>;
}

import { FormEvent, useCallback, useEffect, useState } from 'react';
import { ArrowRight, CarFront, Clock3, LogOut, MapPin, Search, ShieldCheck, Users } from 'lucide-react';
import { ApiBooking, ApiOffer, ApiUser, productionApi } from '../services/productionApi';

const formatMoney = (minor: number, currency: string) => new Intl.NumberFormat('uk-UA', { style: 'currency', currency }).format(minor / 100);
const formatDate = (value: string) => new Intl.DateTimeFormat('uk-UA', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'Europe/Kyiv' }).format(new Date(value));

export function ProductionMarketplace() {
  const [user, setUser] = useState<ApiUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [phone, setPhone] = useState('+380');
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [otpRequested, setOtpRequested] = useState(false);
  const [devCode, setDevCode] = useState('');
  const [origin, setOrigin] = useState('');
  const [destination, setDestination] = useState('');
  const [date, setDate] = useState(() => new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Kyiv' }).format(new Date()));
  const [seats, setSeats] = useState(1);
  const [offers, setOffers] = useState<ApiOffer[]>([]);
  const [bookings, setBookings] = useState<ApiBooking[]>([]);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');

  const refreshBookings = useCallback(async () => setBookings(await productionApi.bookings()), []);
  const loadOffers = useCallback(async () => {
    setOffers(await productionApi.offers({ origin, destination, date, seats }));
  }, [date, destination, origin, seats]);

  useEffect(() => {
    productionApi.restoreSession().then(async (currentUser) => {
      setUser(currentUser);
      await refreshBookings();
    }).catch(() => undefined).finally(() => setLoading(false));
  }, [refreshBookings]);

  const requestOtp = async (event: FormEvent) => {
    event.preventDefault();
    setBusy(true); setMessage('');
    try {
      const result = await productionApi.requestOtp(phone, name);
      setOtpRequested(true);
      setDevCode(result.developmentCode ?? '');
      setMessage(result.delivery === 'development' ? 'Локальний код тестового середовища показано нижче.' : 'Код надіслано SMS.');
    } catch (error) { setMessage(error instanceof Error ? error.message : 'Не вдалося запросити код.'); }
    finally { setBusy(false); }
  };

  const verifyOtp = async (event: FormEvent) => {
    event.preventDefault();
    setBusy(true); setMessage('');
    try {
      const currentUser = await productionApi.verifyOtp(phone, code);
      setUser(currentUser);
      setBookings(await productionApi.bookings());
    } catch (error) { setMessage(error instanceof Error ? error.message : 'Код не прийнято.'); }
    finally { setBusy(false); }
  };

  const search = async (event: FormEvent) => {
    event.preventDefault(); setBusy(true); setMessage('');
    try { await loadOffers(); }
    catch (error) { setMessage(error instanceof Error ? error.message : 'Пошук не вдався.'); }
    finally { setBusy(false); }
  };

  const book = async (offer: ApiOffer) => {
    setBusy(true); setMessage('');
    try {
      await productionApi.book(offer.id, seats);
      setMessage('Бронювання підтверджено сервером.');
      await refreshBookings().catch(() => undefined);
      await loadOffers().catch(() => undefined);
    } catch (error) { setMessage(error instanceof Error ? error.message : 'Не вдалося створити бронювання.'); }
    finally { setBusy(false); }
  };

  if (loading) return <main className="grid min-h-screen place-items-center bg-[#f3f7fc] text-slate-500">Завантажуємо захищену сесію…</main>;

  if (!user) return (
    <main className="min-h-screen bg-[radial-gradient(ellipse_at_top,#dbeafe_0%,#f3f7fc_50%,#edf3fb_100%)] px-4 py-10 text-slate-900">
      <section className="mx-auto max-w-md rounded-[2rem] border border-white bg-white/90 p-7 shadow-xl shadow-blue-950/10 sm:p-9">
        <div className="mb-8 flex items-center gap-3"><div className="grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br from-blue-500 to-sky-400 text-2xl font-black text-white">M</div><div><strong className="text-xl tracking-tight">MARSH<span className="text-blue-600">GO</span></strong><p className="text-xs text-slate-500">Один маршрут. Усі можливості.</p></div></div>
        <h1 className="text-2xl font-bold">Вхід за номером телефону</h1>
        <p className="mt-2 text-sm leading-6 text-slate-500">Після підтвердження ви працюватимете з даними спільного серверного маркетплейсу.</p>
        {!otpRequested ? <form onSubmit={requestOtp} className="mt-7 space-y-4">
          <label className="block text-sm font-semibold">Ваше ім’я<input required minLength={2} maxLength={80} value={name} onChange={(event) => setName(event.target.value)} className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100" autoComplete="name" /></label>
          <label className="block text-sm font-semibold">Номер телефону<input required type="tel" value={phone} onChange={(event) => setPhone(event.target.value)} placeholder="+380…" className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100" autoComplete="tel" /></label>
          <button disabled={busy} className="w-full rounded-2xl bg-blue-600 px-4 py-3.5 font-bold text-white shadow-lg shadow-blue-600/20 disabled:opacity-60">{busy ? 'Надсилаємо…' : 'Надіслати код'}</button>
        </form> : <form onSubmit={verifyOtp} className="mt-7 space-y-4">
          <label className="block text-sm font-semibold">Код із SMS<input required inputMode="numeric" pattern="[0-9]{6}" maxLength={6} value={code} onChange={(event) => setCode(event.target.value)} className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-center text-xl tracking-[0.4em] outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100" autoComplete="one-time-code" /></label>
          {devCode && <p className="rounded-xl bg-amber-50 p-3 text-sm text-amber-800">Тестовий OTP для локального середовища: <strong>{devCode}</strong></p>}
          <button disabled={busy} className="w-full rounded-2xl bg-blue-600 px-4 py-3.5 font-bold text-white disabled:opacity-60">{busy ? 'Перевіряємо…' : 'Підтвердити номер'}</button>
          <button type="button" onClick={() => { setOtpRequested(false); setCode(''); setDevCode(''); }} className="w-full py-2 text-sm font-semibold text-slate-500">Змінити номер</button>
        </form>}
        {message && <p role="status" className="mt-4 rounded-xl bg-blue-50 p-3 text-sm text-blue-800">{message}</p>}
        <p className="mt-7 flex gap-2 border-t border-slate-100 pt-5 text-xs leading-5 text-slate-500"><ShieldCheck className="h-4 w-4 shrink-0 text-emerald-600" />Код у локальному режимі не надсилається до SMS-провайдера. Реальні SMS активуються після конфігурації захищених серверних ключів.</p>
      </section>
    </main>
  );

  return <main className="min-h-screen bg-[#f3f7fc] pb-12 text-slate-900">
    <header className="sticky top-0 z-10 border-b border-white/70 bg-white/90 backdrop-blur-xl"><div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3"><div className="flex items-center gap-3"><div className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-blue-500 to-sky-400 font-black text-white">M</div><div><strong className="tracking-tight">MARSH<span className="text-blue-600">GO</span></strong><p className="text-xs text-slate-500">Маркетплейс поїздок</p></div></div><div className="flex items-center gap-3"><span className="hidden text-sm font-semibold sm:inline">{user.display_name}</span><button onClick={async () => { await productionApi.logout().catch(() => undefined); setUser(null); setOtpRequested(false); }} aria-label="Вийти" className="rounded-xl border border-slate-200 p-2 text-slate-500"><LogOut className="h-4 w-4" /></button></div></div></header>
    <div className="mx-auto grid max-w-5xl gap-6 px-4 py-6 lg:grid-cols-[1.15fr_.85fr]">
      <section className="rounded-[1.75rem] bg-gradient-to-br from-[#092346] via-[#0f3d73] to-[#0d62ce] p-6 text-white shadow-xl shadow-blue-950/15 sm:p-8">
        <p className="text-xs font-bold uppercase tracking-[.25em] text-blue-200">Україна ближче</p><h1 className="mt-3 text-3xl font-black sm:text-4xl">Знайдіть свою поїздку</h1><p className="mt-2 max-w-lg text-sm leading-6 text-blue-100">Пошук і бронювання звертаються до API та спільної бази. Показуються лише опубліковані пропозиції водіїв.</p>
        <form onSubmit={search} className="mt-6 grid gap-3 rounded-2xl bg-white p-3 text-slate-800 sm:grid-cols-2">
          <label className="flex items-center gap-2 rounded-xl bg-slate-50 px-3 py-2"><MapPin className="h-4 w-4 text-blue-600" /><span className="min-w-0 flex-1"><small className="block text-[10px] font-bold text-slate-400">ЗВІДКИ</small><input required value={origin} onChange={(event) => setOrigin(event.target.value)} className="w-full bg-transparent text-sm font-semibold outline-none" placeholder="Стрий" /></span></label>
          <label className="flex items-center gap-2 rounded-xl bg-slate-50 px-3 py-2"><MapPin className="h-4 w-4 text-blue-600" /><span className="min-w-0 flex-1"><small className="block text-[10px] font-bold text-slate-400">КУДИ</small><input required value={destination} onChange={(event) => setDestination(event.target.value)} className="w-full bg-transparent text-sm font-semibold outline-none" placeholder="Львів" /></span></label>
          <label className="flex items-center gap-2 rounded-xl bg-slate-50 px-3 py-2"><Clock3 className="h-4 w-4 text-blue-600" /><span><small className="block text-[10px] font-bold text-slate-400">ДАТА</small><input required type="date" value={date} onChange={(event) => setDate(event.target.value)} className="bg-transparent text-sm font-semibold outline-none" /></span></label>
          <label className="flex items-center gap-2 rounded-xl bg-slate-50 px-3 py-2"><Users className="h-4 w-4 text-blue-600" /><span><small className="block text-[10px] font-bold text-slate-400">ПАСАЖИРИ</small><select value={seats} onChange={(event) => setSeats(Number(event.target.value))} className="bg-transparent text-sm font-semibold outline-none">{Array.from({ length: 20 }, (_, i) => i + 1).map((n) => <option key={n} value={n}>{n}</option>)}</select></span></label>
          <button disabled={busy} className="flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-3 font-bold text-white sm:col-span-2"><Search className="h-4 w-4" />Знайти поїздку<ArrowRight className="h-4 w-4" /></button>
        </form>
      </section>
      <section className="rounded-[1.75rem] border border-white bg-white p-5 shadow-sm sm:p-6"><div className="flex items-center justify-between"><div><p className="text-xs font-bold uppercase tracking-wider text-blue-600">Мої бронювання</p><h2 className="mt-1 text-xl font-bold">Ваші поїздки</h2></div><CarFront className="h-6 w-6 text-blue-600" /></div>
        {bookings.length ? <div className="mt-4 space-y-3">{bookings.map((booking) => <article key={booking.id} className="rounded-2xl bg-slate-50 p-4"><div className="font-bold">{booking.origin_name} → {booking.destination_name}</div><div className="mt-1 text-xs text-slate-500">{formatDate(booking.departure_at)} · {booking.seat_count} місця · {booking.status}</div><div className="mt-2 font-bold text-blue-700">{formatMoney(booking.total_price_minor, booking.currency)}</div></article>)}</div> : <p className="mt-4 rounded-2xl bg-slate-50 p-4 text-sm text-slate-500">Поки немає бронювань у вашому обліковому записі.</p>}
      </section>
      <section className="lg:col-span-2"><div className="mb-3 flex items-end justify-between"><div><p className="text-xs font-bold uppercase tracking-wider text-blue-600">MARSHGO Community · 0% комісії</p><h2 className="mt-1 text-xl font-bold">Знайдені поїздки</h2></div><span className="text-xs text-slate-500">{offers.length} пропозицій</span></div>
        {message && <p role="status" className="mb-3 rounded-xl border border-blue-100 bg-blue-50 p-3 text-sm text-blue-800">{message}</p>}
        {offers.length ? <div className="grid gap-3 md:grid-cols-2">{offers.map((offer) => <article key={offer.id} className="rounded-2xl border border-white bg-white p-5 shadow-sm"><div className="flex items-start justify-between gap-3"><div><h3 className="font-bold">{offer.origin_name} → {offer.destination_name}</h3><p className="mt-1 text-xs text-slate-500">Виїзд {formatDate(offer.departure_at)}</p><p className="mt-1 text-xs text-slate-500">{offer.arrival_at ? `Прибуття ${formatDate(offer.arrival_at)}` : 'Час прибуття ще не підтверджено маршрутизатором'}</p></div><span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-700">{offer.available_seats} місць</span></div><div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3"><div><p className="text-xs text-slate-500">Водій · {offer.driver_name}</p><p className="mt-1 text-sm font-bold">{formatMoney(offer.price_per_seat_minor * seats, offer.currency)} <span className="font-normal text-slate-500">за {seats}</span></p></div><button disabled={busy || offer.available_seats < seats} onClick={() => void book(offer)} className="rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-bold text-white disabled:opacity-50">Забронювати</button></div></article>)}</div> : <div className="rounded-2xl border border-dashed border-slate-300 bg-white/70 p-8 text-center text-sm text-slate-500">Вкажіть маршрут і дату, щоб отримати актуальні пропозиції з сервера.</div>}
      </section>
    </div>
  </main>;
}

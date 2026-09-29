import { FormEvent, useCallback, useEffect, useState } from 'react';
import {
  ArrowDownUp, ArrowLeft, ArrowRight, Bell, CalendarDays, CarFront, ChevronRight,
  CircleUserRound, Clock3, Compass, Home, LogOut, MapPin, MessageCircle, Minus, Navigation,
  Plus, Search, ShieldCheck, Ticket, Users, X,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { ApiBooking, ApiMessage, ApiOffer, ApiUser, ApiVehicle, productionApi } from '../services/productionApi';

type Tab = 'home' | 'search' | 'trips' | 'chat' | 'profile';
const formatMoney = (minor: number, currency: string) => new Intl.NumberFormat('uk-UA', { style: 'currency', currency, maximumFractionDigits: 0 }).format(minor / 100);
const formatDate = (value: string, options: Intl.DateTimeFormatOptions = { dateStyle: 'medium', timeStyle: 'short' }) => new Intl.DateTimeFormat('uk-UA', { ...options, timeZone: 'Europe/Kyiv' }).format(new Date(value));
const todayKyiv = () => new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Kyiv' }).format(new Date());
const tabItems: { id: Tab; label: string; icon: typeof Home }[] = [
  { id: 'home', label: 'Головна', icon: Home }, { id: 'search', label: 'Пошук', icon: Search },
  { id: 'trips', label: 'Поїздки', icon: Ticket }, { id: 'chat', label: 'Чати', icon: MessageCircle },
  { id: 'profile', label: 'Профіль', icon: CircleUserRound },
];

export function ProductionMarketplace() {
  const [user, setUser] = useState<ApiUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [phone, setPhone] = useState('+380');
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [otpRequested, setOtpRequested] = useState(false);
  const [devCode, setDevCode] = useState('');
  const [showLogin, setShowLogin] = useState(false);
  const [authIntro, setAuthIntro] = useState(true);
  const [origin, setOrigin] = useState('');
  const [destination, setDestination] = useState('');
  const [date, setDate] = useState(todayKyiv);
  const [seats, setSeats] = useState(1);
  const [offers, setOffers] = useState<ApiOffer[]>([]);
  const [bookings, setBookings] = useState<ApiBooking[]>([]);
  const [vehicles, setVehicles] = useState<ApiVehicle[]>([]);
  const [tab, setTab] = useState<Tab>('home');
  const [showResults, setShowResults] = useState(false);
  const [selectedOffer, setSelectedOffer] = useState<ApiOffer | null>(null);
  const [selectedBooking, setSelectedBooking] = useState<ApiBooking | null>(null);
  const [messages, setMessages] = useState<ApiMessage[]>([]);
  const [messageDraft, setMessageDraft] = useState('');
  const [busy, setBusy] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [showVehicleForm, setShowVehicleForm] = useState(false);
  const [vehicleForm, setVehicleForm] = useState({ make: '', model: '', modelYear: new Date().getFullYear(), seats: 4 });

  const refreshBookings = useCallback(async () => setBookings(await productionApi.bookings()), []);
  const refreshVehicles = useCallback(async () => setVehicles(await productionApi.vehicles()), []);
  const loadOffers = useCallback(async () => {
    const next = await productionApi.offers({ origin: origin.trim(), destination: destination.trim(), date, seats });
    setOffers(next);
    return next;
  }, [date, destination, origin, seats]);

  useEffect(() => {
    productionApi.restoreSession().then(async () => {
      const currentUser = await productionApi.me();
      setUser(currentUser);
      await Promise.all([refreshBookings(), refreshVehicles()]);
    }).catch(() => undefined).finally(() => setLoading(false));
  }, [refreshBookings, refreshVehicles]);

  const requestOtp = async (event: FormEvent) => {
    event.preventDefault(); setBusy(true); setStatusMessage('');
    try {
      const result = await productionApi.requestOtp(phone, name);
      setOtpRequested(true); setDevCode(result.developmentCode ?? '');
      setStatusMessage(result.delivery === 'development' ? 'Код тестового середовища показано нижче.' : 'Код надіслано SMS.');
    } catch (error) { setStatusMessage(error instanceof Error ? error.message : 'Не вдалося запросити код.'); }
    finally { setBusy(false); }
  };

  const verifyOtp = async (event: FormEvent) => {
    event.preventDefault(); setBusy(true); setStatusMessage('');
    try {
      const currentUser = await productionApi.verifyOtp(phone, code);
      setUser(currentUser);
      const refreshedUser = await productionApi.me(); setUser(refreshedUser);
      await Promise.all([refreshBookings(), refreshVehicles()]);
      setShowLogin(false);
    } catch (error) { setStatusMessage(error instanceof Error ? error.message : 'Код не прийнято.'); }
    finally { setBusy(false); }
  };

  const search = async (event?: FormEvent) => {
    event?.preventDefault();
    if (!origin.trim() || !destination.trim()) { setStatusMessage('Вкажіть місто відправлення та призначення.'); return; }
    setBusy(true); setStatusMessage('');
    try { await loadOffers(); setShowResults(true); setTab('search'); }
    catch (error) { setStatusMessage(error instanceof Error ? error.message : 'Пошук не вдався.'); }
    finally { setBusy(false); }
  };

  const book = async (offer: ApiOffer) => {
    setBusy(true); setStatusMessage('');
    try {
      await productionApi.book(offer.id, seats);
      setStatusMessage('Місця заброньовано. Підтвердження збережено на сервері.');
      await Promise.all([refreshBookings(), loadOffers()]);
      setSelectedOffer(null); setTab('trips');
    } catch (error) { setStatusMessage(error instanceof Error ? error.message : 'Не вдалося створити бронювання.'); }
    finally { setBusy(false); }
  };

  const openChat = async (booking: ApiBooking) => {
    setSelectedBooking(booking); setBusy(true); setStatusMessage('');
    try {
      const conversation = await productionApi.conversation(booking.id);
      setMessages(await productionApi.messages(conversation.id)); setTab('chat');
    } catch (error) { setStatusMessage(error instanceof Error ? error.message : 'Чат недоступний.'); }
    finally { setBusy(false); }
  };

  const sendMessage = async (event: FormEvent) => {
    event.preventDefault();
    if (!selectedBooking || !messageDraft.trim()) return;
    setBusy(true);
    try {
      const conversation = await productionApi.conversation(selectedBooking.id);
      const sent = await productionApi.sendMessage(conversation.id, messageDraft.trim());
      setMessages((current) => [...current, { ...sent, sender_name: user?.display_name ?? '' }]); setMessageDraft('');
    } catch (error) { setStatusMessage(error instanceof Error ? error.message : 'Повідомлення не надіслано.'); }
    finally { setBusy(false); }
  };

  const createVehicle = async (event: FormEvent) => {
    event.preventDefault(); setBusy(true);
    try {
      await productionApi.createVehicle(vehicleForm); await refreshVehicles(); setShowVehicleForm(false);
      setStatusMessage('Автомобіль додано. Перевірка профілю водія може бути потрібна перед публікацією поїздки.');
    } catch (error) { setStatusMessage(error instanceof Error ? error.message : 'Не вдалося додати автомобіль.'); }
    finally { setBusy(false); }
  };

  const enableDriver = async () => {
    if (!user) return;
    setBusy(true);
    try { await productionApi.enableRole('driver'); setUser({ ...user, roles: [...new Set([...user.roles, 'driver'])] }); }
    catch (error) { setStatusMessage(error instanceof Error ? error.message : 'Не вдалося змінити роль.'); }
    finally { setBusy(false); }
  };

  const logout = async () => {
    await productionApi.logout().catch(() => undefined);
    setUser(null); setBookings([]); setVehicles([]); setOffers([]); setShowLogin(true); setOtpRequested(false);
  };

  if (loading) return <main className="grid min-h-[100svh] place-items-center bg-[#f5f8fd] text-sm text-slate-500">Завантажуємо захищену сесію…</main>;
  if (!user || showLogin) return (
    <main className="relative flex min-h-[100svh] items-end overflow-hidden bg-[#081b35] px-5 pb-[max(2rem,env(safe-area-inset-bottom))] pt-safe text-white sm:items-center sm:justify-center">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_55%_35%,rgba(41,131,255,.65),transparent_48%),linear-gradient(180deg,#113d75_0%,#122f54_48%,#08121f_100%)]" />
      <div className="absolute inset-x-0 bottom-0 h-[48%] bg-[linear-gradient(0deg,rgba(4,10,18,.88),transparent)]" />
      <section className="relative z-10 mx-auto w-full max-w-md pb-2">
        {!authIntro && <button onClick={() => { setAuthIntro(true); setShowLogin(false); setStatusMessage(''); }} className="mb-6 grid h-10 w-10 place-items-center rounded-full border border-white/25 bg-white/10" aria-label="Назад"><ArrowLeft size={19}/></button>}
        <div className="mb-8 flex items-center gap-3"><div className="grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br from-sky-300 to-blue-500 text-2xl font-black">M</div><div><strong className="text-2xl tracking-tight">MARSH<span className="text-sky-400">GO</span></strong><p className="text-xs text-blue-100/80">One Route. Every Way.</p></div></div>
        {authIntro ? <div className="flex min-h-[58svh] flex-col justify-end pb-4">
          <p className="text-xs font-bold uppercase tracking-[.24em] text-blue-200">Україна ближче</p><h1 className="mt-3 text-4xl font-extrabold leading-tight">Один маршрут.<br/>Усі способи доїхати.</h1>
          <p className="mt-3 max-w-sm text-sm leading-6 text-blue-100/80">Знаходьте попутки та керуйте поїздками з одного застосунку.</p>
          <button onClick={() => setAuthIntro(false)} className="mt-8 w-full rounded-2xl bg-blue-600 px-5 py-4 font-bold shadow-lg shadow-blue-900/40">Почати</button>
          <button onClick={() => setAuthIntro(false)} className="mt-3 w-full rounded-2xl border border-white/35 bg-white/5 px-5 py-3.5 text-sm font-semibold">У мене вже є акаунт</button>
        </div> : !otpRequested ? <>
          <h1 className="text-3xl font-extrabold">Вхід за номером телефону</h1><p className="mt-2 text-sm text-blue-100/80">Створіть профіль або увійдіть за номером.</p>
          <form onSubmit={requestOtp} className="mt-6 space-y-3">
            <input required minLength={2} maxLength={80} value={name} onChange={(event) => setName(event.target.value)} className="w-full rounded-2xl border border-white/20 bg-white/10 px-4 py-3.5 text-white outline-none placeholder:text-blue-100/55 focus:border-sky-300" placeholder="Ваше ім’я" autoComplete="name" />
            <input required type="tel" value={phone} onChange={(event) => setPhone(event.target.value)} className="w-full rounded-2xl border border-white/20 bg-white/10 px-4 py-3.5 text-white outline-none placeholder:text-blue-100/55 focus:border-sky-300" placeholder="+380 номер телефону" autoComplete="tel" />
            <button disabled={busy} className="w-full rounded-2xl bg-blue-600 px-5 py-4 font-bold shadow-lg shadow-blue-900/40 disabled:opacity-60">{busy ? 'Надсилаємо…' : 'Почати'}</button>
          </form>
        </> : <>
          <h1 className="text-3xl font-extrabold">Вхід за номером</h1><p className="mt-2 text-sm text-blue-100/80">Підтвердьте номер телефону, щоб продовжити.</p>
          <form onSubmit={verifyOtp} className="mt-6 space-y-3">
            <input required inputMode="numeric" pattern="[0-9]{6}" maxLength={6} value={code} onChange={(event) => setCode(event.target.value)} className="w-full rounded-2xl border border-white/20 bg-white/10 px-4 py-4 text-center text-2xl tracking-[.4em] text-white outline-none focus:border-sky-300" placeholder="••••••" autoComplete="one-time-code" />
            {devCode && <p className="rounded-xl bg-amber-100 p-3 text-sm text-amber-950">Тестовий OTP локального середовища: <b>{devCode}</b></p>}
            <button disabled={busy} className="w-full rounded-2xl bg-blue-600 px-5 py-4 font-bold disabled:opacity-60">{busy ? 'Перевіряємо…' : 'Підтвердити номер'}</button>
            <button type="button" onClick={() => { setOtpRequested(false); setCode(''); }} className="w-full py-2 text-sm text-blue-100">Змінити номер</button>
          </form>
        </>}
        {statusMessage && <p role="status" className="mt-4 rounded-xl bg-white/10 p-3 text-sm text-white">{statusMessage}</p>}
        {!authIntro && <p className="mt-5 flex gap-2 text-xs leading-5 text-blue-100/70"><ShieldCheck size={16} className="shrink-0"/>Реальна доставка SMS вмикається після налаштування провайдера.</p>}
      </section>
    </main>
  );

  const status = statusMessage ? <div role="status" className="mx-auto mt-3 w-full max-w-xl rounded-2xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-blue-800">{statusMessage}<button onClick={() => setStatusMessage('')} className="float-right"><X size={16}/></button></div> : null;
  const header = <header className="mx-auto flex w-full max-w-xl items-center justify-between px-5 pb-3 pt-[max(.8rem,env(safe-area-inset-top))]">
    <div className="flex items-center gap-2"><span className="grid h-9 w-9 place-items-center rounded-xl bg-blue-600 text-sm font-black text-white">M</span><div><strong className="text-[17px] tracking-tight">MARSH<span className="text-blue-600">GO</span></strong><p className="-mt-1 text-[10px] text-slate-500">Усі поїздки в одному місці</p></div></div>
    <button onClick={() => setStatusMessage('Нових сповіщень немає.')} aria-label="Сповіщення" className="relative grid h-10 w-10 place-items-center rounded-full bg-white text-slate-700 shadow-sm"><Bell size={19}/></button>
  </header>;

  const searchForm = <form onSubmit={search} className="rounded-[1.7rem] border border-white bg-white p-3 shadow-[0_10px_28px_rgba(31,67,114,.08)]">
    <div className="relative">
      <label className="flex items-center gap-3 rounded-t-2xl bg-[#f6f8fc] px-3 py-3"><MapPin size={19} className="text-blue-600"/><span className="flex-1"><small className="block text-[10px] text-slate-400">Звідки</small><input required value={origin} onChange={(event) => setOrigin(event.target.value)} className="w-full bg-transparent text-sm font-bold outline-none" placeholder="Місто відправлення" /></span><span className="mr-1 h-2 w-2 rounded-full bg-emerald-500"/></label>
      <div className="ml-[21px] h-3 border-l-2 border-dotted border-slate-300" />
      <label className="flex items-center gap-3 rounded-b-2xl bg-[#f6f8fc] px-3 py-3"><MapPin size={19} className="text-rose-500"/><span className="flex-1"><small className="block text-[10px] text-slate-400">Куди</small><input required value={destination} onChange={(event) => setDestination(event.target.value)} className="w-full bg-transparent text-sm font-bold outline-none" placeholder="Місто призначення" /></span><button type="button" onClick={() => { setOrigin(destination); setDestination(origin); }} className="grid h-9 w-9 place-items-center rounded-full bg-white text-blue-600 shadow-sm" aria-label="Поміняти місцями"><ArrowDownUp size={17}/></button></label>
    </div>
    <div className="mt-2 grid grid-cols-[1.2fr_.8fr] gap-2">
      <label className="flex items-center gap-2 rounded-xl bg-[#f6f8fc] px-3 py-2.5"><CalendarDays size={17} className="text-slate-500"/><span className="min-w-0"><small className="block text-[10px] text-slate-400">Дата</small><input required type="date" value={date} onChange={(event) => setDate(event.target.value)} className="w-full bg-transparent text-xs font-semibold outline-none" /></span></label>
      <div className="flex items-center justify-between rounded-xl bg-[#f6f8fc] px-2.5"><Users size={17} className="text-slate-500"/><span className="text-xs font-semibold">{seats} пас.</span><button type="button" onClick={() => setSeats(Math.max(1,seats-1))} className="grid h-8 w-7 place-items-center text-slate-500" aria-label="Менше пасажирів"><Minus size={14}/></button><button type="button" onClick={() => setSeats(Math.min(8,seats+1))} className="grid h-8 w-7 place-items-center text-blue-600" aria-label="Більше пасажирів"><Plus size={16}/></button></div>
    </div>
    <button disabled={busy} className="mt-3 flex w-full items-center justify-center gap-2 rounded-2xl bg-blue-600 px-4 py-3.5 text-sm font-bold text-white shadow-md shadow-blue-600/20 disabled:opacity-60"><Search size={17}/>{busy ? 'Шукаємо…' : 'Знайти маршрут'}<ArrowRight size={17}/></button>
  </form>;

  const transportTypes = <div className="grid grid-cols-4 gap-2">
    {([
      { label: 'Попутка', Icon: CarFront, active: true }, { label: 'Автобус', Icon: Ticket, active: false },
      { label: 'Таксі', Icon: CarFront, active: false }, { label: 'Маршрутка', Icon: Users, active: false },
    ] satisfies { label: string; Icon: LucideIcon; active: boolean }[]).map(({ label, Icon, active }) => <button key={label} onClick={() => !active && setStatusMessage(`${label} поки не підключено як перевірене джерело. Працює MARSHGO Community.`)} className={`flex flex-col items-center gap-1 rounded-2xl px-1 py-3 text-[11px] font-semibold ${active ? 'bg-blue-50 text-blue-700 ring-1 ring-blue-100' : 'bg-white text-slate-500 shadow-sm'}`}><span className={`grid h-9 w-9 place-items-center rounded-xl ${active ? 'bg-blue-600 text-white' : 'bg-slate-50 text-slate-500'}`}><Icon size={18}/></span>{label}</button>)}
  </div>;

  const offerCard = (offer: ApiOffer, index: number) => <button key={offer.id} onClick={() => setSelectedOffer(offer)} className="w-full rounded-[1.35rem] border border-slate-100 bg-white p-4 text-left shadow-[0_4px_16px_rgba(30,64,100,.05)]">
    <div className="mb-3 flex items-center justify-between"><span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-emerald-700">Community · Попутка</span><span className="text-[10px] text-slate-400">{offer.available_seats} місць</span></div>
    <div className="grid grid-cols-[1fr_auto_1fr_auto] items-center gap-2"><div><b className="text-lg">{formatDate(offer.departure_at,{hour:'2-digit',minute:'2-digit'})}</b><p className="text-xs font-semibold text-slate-700">{offer.origin_name}</p></div><span className="text-slate-300">→</span><div><b className="text-lg">{offer.arrival_at ? formatDate(offer.arrival_at,{hour:'2-digit',minute:'2-digit'}) : '—'}</b><p className="text-xs font-semibold text-slate-700">{offer.destination_name}</p></div><div className="text-right"><b className="text-lg">{formatMoney(offer.price_per_seat_minor,offer.currency)}</b><p className="text-[10px] text-slate-400">за одне місце</p></div></div>
    <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-3"><span className="flex min-w-0 items-center gap-2"><span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-blue-100 text-xs font-bold text-blue-700">{offer.driver_name.slice(0,1).toUpperCase()}</span><span className="truncate text-xs font-bold">{offer.driver_name}</span>{offer.review_count > 0 ? <span className="shrink-0 text-[10px] text-amber-600">★ {Number(offer.average_rating).toFixed(1)} ({offer.review_count})</span> : <span className="shrink-0 text-[10px] text-slate-400">Новий</span>}</span><span className="rounded-xl bg-blue-600 px-3 py-2 text-xs font-bold text-white">Деталі</span></div>
    {index === 0 && offer.duration_s ? <p className="mt-2 flex items-center gap-1.5 text-[10px] text-slate-400"><Clock3 size={12}/>{Math.floor(offer.duration_s/3600)} год {Math.round((offer.duration_s%3600)/60)} хв · маршрут розраховано</p> : null}
  </button>;

  const homeScreen = <div className="mx-auto w-full max-w-xl px-5 pb-5">
    <div className="mb-4"><p className="text-sm text-slate-500">Привіт, {user.display_name.split(' ')[0]}!</p><h1 className="text-xl font-extrabold tracking-tight">Куди їдемо сьогодні?</h1></div>
    {transportTypes}<div className="mt-4">{searchForm}</div>
    <button onClick={() => setStatusMessage('Публікація попиту потребує вибору точок на карті. Геокодер ще не підключено, тому заявку не створено.')} className="mt-3 flex w-full items-center justify-center gap-2 rounded-2xl bg-blue-50 px-4 py-3 text-xs font-bold text-blue-700"><Compass size={16}/>Запропонувати свою ціну <span className="font-normal text-blue-500">· функція очікує геокодер</span></button>
    <div className="mt-6 flex items-end justify-between"><div><p className="text-[10px] font-bold uppercase tracking-[.16em] text-blue-600">Реальні пропозиції</p><h2 className="mt-1 text-lg font-extrabold">Маршрути поруч</h2></div><button onClick={() => setTab('search')} className="text-xs font-semibold text-blue-600">Усі результати</button></div>
    {offers.length ? <div className="mt-3 space-y-3">{offers.slice(0,2).map(offerCard)}</div> : <div className="mt-3 rounded-2xl bg-white p-4 text-sm text-slate-500 shadow-sm">Шукайте маршрут, щоб побачити опубліковані водіями поїздки.</div>}
    <div className="mt-5 rounded-2xl bg-[#0c2850] p-4 text-white"><div className="flex items-center gap-3"><span className="grid h-10 w-10 place-items-center rounded-xl bg-white/10"><Navigation size={20}/></span><div><p className="text-sm font-bold">Навігація MARSHGO</p><p className="text-xs text-blue-100/75">Foreground GPS та підбір попутників ще не доступні.</p></div></div></div>
  </div>;

  const resultsScreen = <div className="mx-auto w-full max-w-xl px-5 pb-5"><div className="mb-4 flex items-center gap-3"><button onClick={() => setShowResults(false)} className="grid h-10 w-10 place-items-center rounded-full bg-white shadow-sm"><ArrowLeft size={18}/></button><div className="min-w-0 flex-1"><h1 className="truncate text-lg font-extrabold">{origin} → {destination}</h1><p className="text-xs text-slate-500">{new Intl.DateTimeFormat('uk-UA',{dateStyle:'medium',timeZone:'Europe/Kyiv'}).format(new Date(`${date}T12:00:00`))} · {seats} пасажир(и)</p></div><button onClick={() => setStatusMessage('Збереження маршруту сповістить вас після підключення push-сповіщень.')} className="grid h-10 w-10 place-items-center rounded-full bg-white shadow-sm"><Bell size={18}/></button></div>
    <div className="mb-4 flex gap-2 overflow-x-auto pb-1">{['Усі','Попутки','Автобуси','Таксі'].map((item,index)=><button key={item} onClick={()=>index>1&&setStatusMessage(`${item} не підключено як реальне джерело.`)} className={`shrink-0 rounded-full px-4 py-2 text-xs font-bold ${index===0||index===1?'bg-blue-600 text-white':'bg-white text-slate-500'}`}>{item}</button>)}</div>
    <div className="mb-3 flex items-center justify-between"><h2 className="font-bold">Знайдені поїздки</h2><span className="text-xs text-slate-500">{offers.length} варіантів</span></div>
    {offers.length ? <div className="space-y-3">{offers.map(offerCard)}</div> : <div className="rounded-2xl bg-white p-6 text-center"><Search className="mx-auto text-slate-300"/><p className="mt-2 font-bold">Немає поїздок за цими умовами</p><p className="mt-1 text-sm text-slate-500">Спробуйте змінити дату або кількість пасажирів.</p></div>}
  </div>;

  const tripsScreen = <div className="mx-auto w-full max-w-xl px-5 pb-5"><div className="mb-5"><p className="text-xs font-bold uppercase tracking-[.16em] text-blue-600">Ваші бронювання</p><h1 className="mt-1 text-2xl font-extrabold">Мої поїздки</h1></div>
    {bookings.length ? <div className="space-y-3">{bookings.map((booking)=><article key={booking.id} className="rounded-[1.4rem] bg-white p-4 shadow-sm"><div className="flex items-center justify-between"><span className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${booking.status==='confirmed'?'bg-emerald-50 text-emerald-700':'bg-slate-100 text-slate-600'}`}>{booking.status==='confirmed'?'Підтверджено':booking.status}</span><span className="text-[10px] text-slate-400">{formatDate(booking.departure_at,{day:'numeric',month:'short'})}</span></div><h2 className="mt-3 text-lg font-extrabold">{booking.origin_name} <span className="text-blue-600">→</span> {booking.destination_name}</h2><p className="mt-1 text-xs text-slate-500">{formatDate(booking.departure_at)} · {booking.seat_count} місця · {formatMoney(booking.total_price_minor,booking.currency)}</p><div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3"><span className="text-xs text-slate-500">{booking.current_user_is_driver ? `Пасажир · ${booking.passenger_name}` : `Водій · ${booking.driver_name}`}</span><button onClick={()=>void openChat(booking)} className="flex items-center gap-1 rounded-xl bg-blue-50 px-3 py-2 text-xs font-bold text-blue-700"><MessageCircle size={14}/>Написати</button></div></article>)}</div> : <div className="rounded-2xl bg-white p-6 text-center"><Ticket className="mx-auto text-slate-300"/><p className="mt-2 font-bold">Поки немає поїздок</p><p className="mt-1 text-sm text-slate-500">Знайдіть маршрут і забронюйте місце.</p><button onClick={()=>setTab('home')} className="mt-4 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-bold text-white">Знайти поїздку</button></div>}
  </div>;

  const chatScreen = <div className="mx-auto flex min-h-[65svh] w-full max-w-xl flex-col px-5 pb-5"><div className="mb-4 flex items-center gap-3"><button onClick={()=>{setSelectedBooking(null);setTab('trips');}} className="grid h-10 w-10 place-items-center rounded-full bg-white"><ArrowLeft size={18}/></button><div><h1 className="font-extrabold">{selectedBooking ? (selectedBooking.current_user_is_driver ? selectedBooking.passenger_name : selectedBooking.driver_name) : 'Чати'}</h1><p className="text-xs text-slate-500">{selectedBooking ? `${selectedBooking.origin_name} → ${selectedBooking.destination_name}` : 'Повідомлення за бронюваннями'}</p></div></div>
    {!selectedBooking ? <div className="space-y-3">{bookings.length ? bookings.map(booking=><button key={booking.id} onClick={()=>void openChat(booking)} className="flex w-full items-center gap-3 rounded-2xl bg-white p-4 text-left"><span className="grid h-10 w-10 place-items-center rounded-full bg-blue-50 text-blue-600"><MessageCircle size={18}/></span><span className="min-w-0 flex-1"><b className="block text-sm">{booking.origin_name} → {booking.destination_name}</b><small className="text-slate-500">{booking.driver_name} · {formatDate(booking.departure_at,{day:'numeric',month:'short'})}</small></span><ChevronRight size={17} className="text-slate-400"/></button>) : <p className="rounded-2xl bg-white p-5 text-sm text-slate-500">Чат з’явиться після підтвердження бронювання.</p>}</div> : <>
      <div className="mb-3 rounded-xl bg-white px-3 py-2 text-center text-[11px] text-slate-500">Бронювання · {selectedBooking.origin_name} → {selectedBooking.destination_name}</div>
      <div className="flex-1 space-y-3 overflow-y-auto rounded-2xl bg-white/60 p-3">{messages.length ? messages.map((item)=><div key={item.id} className={`max-w-[84%] rounded-2xl px-3 py-2.5 text-sm ${item.sender_id===user.id?'ml-auto rounded-br-md bg-blue-600 text-white':'rounded-bl-md bg-white shadow-sm'}`}><p>{item.body}</p><small className={`mt-1 block text-[10px] ${item.sender_id===user.id?'text-blue-100':'text-slate-400'}`}>{formatDate(item.created_at,{hour:'2-digit',minute:'2-digit'})}</small></div>) : <div className="py-10 text-center text-sm text-slate-500">Почніть розмову з водієм або пасажиром.</div>}</div>
      <form onSubmit={sendMessage} className="mt-3 flex gap-2 rounded-full bg-white p-2 shadow-sm"><input value={messageDraft} onChange={event=>setMessageDraft(event.target.value)} className="min-w-0 flex-1 bg-transparent px-3 text-sm outline-none" placeholder="Напишіть повідомлення…" maxLength={4000}/><button disabled={busy||!messageDraft.trim()} className="grid h-10 w-10 place-items-center rounded-full bg-blue-600 text-white disabled:opacity-50"><ArrowRight size={18}/></button></form>
    </>}
  </div>;

  const profileScreen = <div className="mx-auto w-full max-w-xl px-5 pb-5"><div className="mb-5"><p className="text-xs font-bold uppercase tracking-[.16em] text-blue-600">Обліковий запис</p><h1 className="mt-1 text-2xl font-extrabold">Профіль</h1></div>
    <div className="flex items-center gap-4 rounded-[1.4rem] bg-white p-5 shadow-sm"><span className="grid h-14 w-14 place-items-center rounded-full bg-blue-100 text-xl font-extrabold text-blue-700">{user.display_name.slice(0,1).toUpperCase()}</span><div className="min-w-0 flex-1"><b className="text-lg">{user.display_name}</b><p className="text-sm text-slate-500">{user.phone_e164}</p><p className="mt-1 flex items-center gap-1 text-xs text-emerald-700">{user.is_verified ? <><ShieldCheck size={14}/> Номер підтверджено</> : 'Профіль не верифіковано'}</p></div></div>
    <div className="mt-4 rounded-[1.4rem] bg-white p-4 shadow-sm"><div className="mb-3 flex items-center justify-between"><div><h2 className="font-extrabold">Мій автомобіль</h2><p className="text-xs text-slate-500">Авто, прив’язані до вашого акаунта</p></div><button onClick={()=>user.roles.includes('driver')?setShowVehicleForm(true):setStatusMessage('Спершу активуйте роль водія.')} className="grid h-9 w-9 place-items-center rounded-full bg-blue-50 text-blue-700" aria-label="Додати авто"><Plus size={19}/></button></div>
      {vehicles.length ? <div className="space-y-2">{vehicles.map(vehicle=><div key={vehicle.id} className="flex items-center gap-3 rounded-xl bg-[#f6f8fc] p-3"><span className="grid h-10 w-10 place-items-center rounded-xl bg-white text-blue-600"><CarFront size={19}/></span><div className="min-w-0 flex-1"><b className="block text-sm">{vehicle.make} {vehicle.model}</b><small className="text-slate-500">{vehicle.model_year} · {vehicle.seat_count} місць · {vehicle.verification_status==='verified'?'Перевірено':'Очікує перевірки'}</small></div>{vehicle.is_active ? <span className="rounded-full bg-emerald-50 px-2 py-1 text-[10px] font-bold text-emerald-700">Активне</span> : <button onClick={async()=>{setBusy(true);try{await productionApi.activateVehicle(vehicle.id);await refreshVehicles();}catch(e){setStatusMessage(e instanceof Error?e.message:'Не вдалося активувати авто.');}finally{setBusy(false);}}} className="text-xs font-bold text-blue-600">Обрати</button>}</div>)}</div> : <p className="rounded-xl bg-[#f6f8fc] p-3 text-sm text-slate-500">Автомобілів ще не додано.</p>}
      <button onClick={()=>void enableDriver()} disabled={user.roles.includes('driver')||busy} className="mt-3 w-full rounded-xl border border-blue-100 py-3 text-sm font-bold text-blue-700 disabled:text-slate-400">{user.roles.includes('driver')?'Роль водія активна':'Увімкнути роль водія'}</button>
    </div>
    <div className="mt-4 overflow-hidden rounded-[1.4rem] bg-white shadow-sm">{[['Документи','Статус перевірки доступний у профілі'],['Налаштування','Особисті налаштування'],['Допомога','Центр підтримки']].map(([title,sub])=><button key={title} onClick={()=>setStatusMessage(`${title}: цей розділ ще не реалізовано.`)} className="flex w-full items-center gap-3 border-b border-slate-100 px-4 py-4 text-left last:border-0"><span className="grid h-9 w-9 place-items-center rounded-xl bg-slate-50 text-slate-600"><ShieldCheck size={17}/></span><span className="flex-1"><b className="block text-sm">{title}</b><small className="text-slate-400">{sub}</small></span><ChevronRight size={17} className="text-slate-400"/></button>)}</div>
    <button onClick={()=>void logout()} className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-white py-3 text-sm font-bold text-rose-600 shadow-sm"><LogOut size={16}/>Вийти</button>
  </div>;

  const screen = selectedOffer ? <div className="mx-auto w-full max-w-xl px-5 pb-5"><div className="mb-4 flex items-center gap-3"><button onClick={()=>setSelectedOffer(null)} className="grid h-10 w-10 place-items-center rounded-full bg-white shadow-sm"><ArrowLeft size={18}/></button><div><p className="text-xs text-slate-500">Деталі поїздки</p><h1 className="font-extrabold">{selectedOffer.origin_name} → {selectedOffer.destination_name}</h1></div></div><div className="rounded-[1.5rem] bg-white p-5 shadow-sm"><span className="rounded-full bg-emerald-50 px-3 py-1 text-[10px] font-bold text-emerald-700">COMMUNITY · Попутка</span><div className="mt-5 grid grid-cols-2 gap-4"><div><small className="text-slate-400">Відправлення</small><p className="mt-1 text-xl font-extrabold">{formatDate(selectedOffer.departure_at,{hour:'2-digit',minute:'2-digit'})}</p><b>{selectedOffer.origin_name}</b></div><div className="text-right"><small className="text-slate-400">Прибуття</small><p className="mt-1 text-xl font-extrabold">{selectedOffer.arrival_at?formatDate(selectedOffer.arrival_at,{hour:'2-digit',minute:'2-digit'}):'—'}</p><b>{selectedOffer.destination_name}</b></div></div><div className="my-4 border-t border-slate-100"/><p className="flex items-center gap-3 text-sm"><span className="grid h-10 w-10 place-items-center rounded-full bg-blue-100 font-bold text-blue-700">{selectedOffer.driver_name.slice(0,1)}</span><span><b>{selectedOffer.driver_name}</b><small className="block text-slate-500">{selectedOffer.review_count?`★ ${Number(selectedOffer.average_rating).toFixed(1)} · ${selectedOffer.review_count} відгуків`:'Новий водій'}</small></span></p><div className="mt-5 flex justify-between text-sm"><span className="text-slate-500">Вільні місця</span><b>{selectedOffer.available_seats}</b></div><div className="mt-3 flex justify-between text-sm"><span className="text-slate-500">Вартість · {seats} місце(ць)</span><b className="text-lg">{formatMoney(selectedOffer.price_per_seat_minor*seats,selectedOffer.currency)}</b></div><p className="mt-1 text-right text-[10px] text-slate-400">MARSHGO Community · комісія платформи 0%</p><button disabled={busy||selectedOffer.available_seats<seats} onClick={()=>void book(selectedOffer)} className="mt-5 flex w-full items-center justify-center gap-2 rounded-2xl bg-blue-600 py-4 font-bold text-white disabled:opacity-50">{busy?'Обробляємо…':'Забронювати місце'}<ArrowRight size={17}/></button></div></div> : tab==='home' ? (showResults ? resultsScreen : homeScreen) : tab==='search' ? resultsScreen : tab==='trips' ? tripsScreen : tab==='chat' ? chatScreen : profileScreen;

  return <main className="min-h-[100svh] bg-[#f5f8fd] pb-[calc(5.3rem+env(safe-area-inset-bottom))] text-[#17243a]">
    {header}
    {status}
    <div className="pt-1">{screen}</div>
    <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-slate-200/80 bg-white/95 pb-[max(.35rem,env(safe-area-inset-bottom))] pt-2 backdrop-blur-xl"><div className="mx-auto flex max-w-xl items-center justify-around px-1">{tabItems.map((item,index)=>{const Icon=item.icon;const active=tab===item.id;return <span key={item.id} className="contents">{index===2&&<button onClick={()=>setStatusMessage('Створення поїздки потребує водійської форми з геокодером і перевіреним авто. Цей сценарій ще не підключений у новому інтерфейсі.')} aria-label="Створити поїздку" className="-mt-5 grid h-12 w-12 place-items-center rounded-full bg-blue-600 text-white shadow-lg shadow-blue-600/30"><Plus size={23}/></button>}<button onClick={()=>{setTab(item.id);setSelectedOffer(null);setSelectedBooking(null);}} className={`flex min-w-[48px] flex-col items-center gap-1 px-1 py-1 ${active?'text-blue-600':'text-slate-400'}`}><Icon size={19} strokeWidth={active?2.5:2}/><span className="text-[9px] font-semibold">{item.label}</span></button></span>})}</div></nav>
    {showVehicleForm && <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/40 p-3 sm:items-center"><form onSubmit={createVehicle} className="w-full max-w-md rounded-[1.7rem] bg-white p-5 shadow-xl"><div className="mb-4 flex items-center justify-between"><h2 className="text-lg font-extrabold">Додати автомобіль</h2><button type="button" onClick={()=>setShowVehicleForm(false)} aria-label="Закрити"><X size={20}/></button></div>{([['make','Марка'],['model','Модель']] as const).map(([key,label])=><label key={key} className="mb-3 block text-xs font-bold text-slate-600">{label}<input required value={vehicleForm[key]} onChange={event=>setVehicleForm({...vehicleForm,[key]:event.target.value})} className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-3 text-sm outline-none focus:border-blue-500"/></label>)}<div className="grid grid-cols-2 gap-3"><label className="text-xs font-bold text-slate-600">Рік<input required type="number" min="1950" max={new Date().getFullYear()+1} value={vehicleForm.modelYear} onChange={event=>setVehicleForm({...vehicleForm,modelYear:Number(event.target.value)})} className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-3 text-sm"/></label><label className="text-xs font-bold text-slate-600">Місця<input required type="number" min="1" max="20" value={vehicleForm.seats} onChange={event=>setVehicleForm({...vehicleForm,seats:Number(event.target.value)})} className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-3 text-sm"/></label></div><p className="my-3 text-xs leading-5 text-amber-700">Фотографії авто та перевірка документів ще не підключені. Нове авто не отримає автоматичну верифікацію.</p><button disabled={busy} className="w-full rounded-xl bg-blue-600 py-3.5 font-bold text-white">{busy?'Зберігаємо…':'Зберегти автомобіль'}</button></form></div>}
  </main>;
}

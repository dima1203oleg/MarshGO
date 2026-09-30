import { FormEvent, useCallback, useEffect, useState } from 'react';
import {
  ArrowDownUp, ArrowLeft, ArrowRight, Bell, CalendarDays, CarFront, ChevronRight,
  CircleUserRound, Clock3, Compass, Home, LogOut, MapPin, MessageCircle, Minus, Navigation,
  Plus, Search, ShieldCheck, Ticket, Users, X,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { Capacitor } from '@capacitor/core';
import { StatusBar, Style } from '@capacitor/status-bar';
import { ApiBooking, ApiDemand, ApiMessage, ApiOffer, ApiPlace, ApiProposal, ApiProposalRevision, ApiUser, ApiVehicle, ApiVerificationQueueItem, ApiVerificationRecord, productionApi } from '../services/productionApi';

type Tab = 'home' | 'search' | 'trips' | 'chat' | 'profile' | 'demand' | 'requests' | 'my-demands' | 'admin';
const formatMoney = (minor: number, currency: string) => new Intl.NumberFormat('uk-UA', { style: 'currency', currency, maximumFractionDigits: 0 }).format(minor / 100);
const formatDate = (value: string, options: Intl.DateTimeFormatOptions = { dateStyle: 'medium', timeStyle: 'short' }) => new Intl.DateTimeFormat('uk-UA', { ...options, timeZone: 'Europe/Kyiv' }).format(new Date(value));
const todayKyiv = () => new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Kyiv' }).format(new Date());
const localDateTime = (days: number, hour: number) => {
  const value = new Date(); value.setDate(value.getDate() + days); value.setHours(hour, 0, 0, 0);
  const pad = (part: number) => String(part).padStart(2, '0');
  return `${value.getFullYear()}-${pad(value.getMonth()+1)}-${pad(value.getDate())}T${pad(value.getHours())}:${pad(value.getMinutes())}`;
};
const toLocalDateTimeInput = (date: string) => {
  const value = new Date(date);
  const pad = (part: number) => String(part).padStart(2, '0');
  return `${value.getFullYear()}-${pad(value.getMonth()+1)}-${pad(value.getDate())}T${pad(value.getHours())}:${pad(value.getMinutes())}`;
};
const tabItems: { id: Tab; label: string; icon: typeof Home }[] = [
  { id: 'home', label: 'Головна', icon: Home }, { id: 'search', label: 'Пошук', icon: Search },
  { id: 'trips', label: 'Поїздки', icon: Ticket }, { id: 'profile', label: 'Профіль', icon: CircleUserRound },
];
const demandRequirementLabels: Record<string, string> = { luggage: 'Багаж', pets: 'Тварини', childSeat: 'Дитяче крісло' };

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
  const [verificationRecords, setVerificationRecords] = useState<ApiVerificationRecord[]>([]);
  const [myDemands, setMyDemands] = useState<ApiDemand[]>([]);
  const [openDemands, setOpenDemands] = useState<ApiDemand[]>([]);
  const [selectedDemand, setSelectedDemand] = useState<ApiDemand | null>(null);
  const [selectedDemandIsOwned, setSelectedDemandIsOwned] = useState(false);
  const [proposals, setProposals] = useState<ApiProposal[]>([]);
  const [proposalRevisions, setProposalRevisions] = useState<Record<string, ApiProposalRevision[]>>({});
  const [proposalTarget, setProposalTarget] = useState<ApiDemand | null>(null);
  const [counterTarget, setCounterTarget] = useState<ApiProposal | null>(null);
  const [showCreateMenu, setShowCreateMenu] = useState(false);
  const [placeField, setPlaceField] = useState<'origin' | 'destination' | null>(null);
  const [placeSuggestions, setPlaceSuggestions] = useState<ApiPlace[]>([]);
  const [placeSearchBusy, setPlaceSearchBusy] = useState(false);
  const [demandOriginText, setDemandOriginText] = useState('');
  const [demandDestinationText, setDemandDestinationText] = useState('');
  const [demandOrigin, setDemandOrigin] = useState<ApiPlace | null>(null);
  const [demandDestination, setDemandDestination] = useState<ApiPlace | null>(null);
  const [demandEarliest, setDemandEarliest] = useState(() => localDateTime(1, 8));
  const [demandLatest, setDemandLatest] = useState(() => localDateTime(1, 10));
  const [demandPassengers, setDemandPassengers] = useState(1);
  const [demandBudget, setDemandBudget] = useState('');
  const [demandBudgetType, setDemandBudgetType] = useState<'total_all' | 'per_seat'>('total_all');
  const [demandNotes, setDemandNotes] = useState('');
  const [demandRequirements, setDemandRequirements] = useState({ luggage: false, pets: false, childSeat: false });
  const [proposalPrice, setProposalPrice] = useState('');
  const [proposalDeparture, setProposalDeparture] = useState('');
  const [proposalComment, setProposalComment] = useState('');
  const [proposalVehicleId, setProposalVehicleId] = useState('');
  const [counterPrice, setCounterPrice] = useState('');
  const [counterDeparture, setCounterDeparture] = useState('');
  const [counterComment, setCounterComment] = useState('');
  const [tab, setTab] = useState<Tab>('home');
  const [showResults, setShowResults] = useState(false);
  const [selectedOffer, setSelectedOffer] = useState<ApiOffer | null>(null);
  const [selectedBooking, setSelectedBooking] = useState<ApiBooking | null>(null);
  const [messages, setMessages] = useState<ApiMessage[]>([]);
  const [messageDraft, setMessageDraft] = useState('');
  const [busy, setBusy] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [showVehicleForm, setShowVehicleForm] = useState(false);
  const [verificationTarget, setVerificationTarget] = useState<ApiVehicle | null>(null);
  const [registrationEvidence, setRegistrationEvidence] = useState<File | null>(null);
  const [driverLicenseEvidence, setDriverLicenseEvidence] = useState<File | null>(null);
  const [adminQueue, setAdminQueue] = useState<ApiVerificationQueueItem[]>([]);
  const [reviewingRecord, setReviewingRecord] = useState<ApiVerificationQueueItem | null>(null);
  const [reviewEvidenceUrl, setReviewEvidenceUrl] = useState('');
  const [reviewNote, setReviewNote] = useState('');
  const [vehicleForm, setVehicleForm] = useState({ make: '', model: '', modelYear: new Date().getFullYear(), seats: 4 });

  const refreshBookings = useCallback(async () => setBookings(await productionApi.bookings()), []);
  const refreshVehicles = useCallback(async () => {
    const [nextVehicles, nextVerification] = await Promise.all([productionApi.vehicles(), productionApi.verificationRecords()]);
    setVehicles(nextVehicles); setVerificationRecords(nextVerification);
  }, []);
  const refreshMyDemands = useCallback(async () => setMyDemands(await productionApi.myDemands()), []);
  const refreshOpenDemands = useCallback(async () => setOpenDemands(await productionApi.openDemands()), []);
  const refreshAdminQueue = useCallback(async () => setAdminQueue(await productionApi.adminVerificationQueue()), []);
  const loadOffers = useCallback(async () => {
    const next = await productionApi.offers({ origin: origin.trim(), destination: destination.trim(), date, seats });
    setOffers(next);
    return next;
  }, [date, destination, origin, seats]);

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;
    void StatusBar.setOverlaysWebView({ overlay: true }).catch(() => undefined);
    void StatusBar.setStyle({ style: user ? Style.Light : Style.Dark }).catch(() => undefined);
  }, [user]);

  useEffect(() => {
    productionApi.restoreSession().then(async () => {
      const currentUser = await productionApi.me();
      setUser(currentUser);
      await Promise.all([refreshBookings(), refreshVehicles(), ...(currentUser.roles.includes('passenger') ? [refreshMyDemands()] : []), ...(currentUser.roles.includes('driver') ? [refreshOpenDemands()] : [])]);
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
      await Promise.all([refreshBookings(), refreshVehicles(), ...(refreshedUser.roles.includes('passenger') ? [refreshMyDemands()] : []), ...(refreshedUser.roles.includes('driver') ? [refreshOpenDemands()] : [])]);
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

  const searchPlace = async (field: 'origin' | 'destination') => {
    const query = field === 'origin' ? demandOriginText.trim() : demandDestinationText.trim();
    if (query.length < 3) { setStatusMessage('Введіть щонайменше 3 символи для пошуку місця.'); return; }
    setPlaceField(field); setPlaceSearchBusy(true); setPlaceSuggestions([]); setStatusMessage('');
    try { setPlaceSuggestions(await productionApi.suggestPlaces(query)); }
    catch (error) { setStatusMessage(error instanceof Error ? error.message : 'Пошук місця недоступний.'); }
    finally { setPlaceSearchBusy(false); }
  };

  const choosePlace = (place: ApiPlace) => {
    if (placeField === 'origin') { setDemandOrigin(place); setDemandOriginText(place.label); }
    if (placeField === 'destination') { setDemandDestination(place); setDemandDestinationText(place.label); }
    setPlaceSuggestions([]); setPlaceField(null);
  };

  const publishDemand = async (event: FormEvent) => {
    event.preventDefault();
    if (!demandOrigin || !demandDestination) { setStatusMessage('Оберіть обидва місця зі справжніх результатів геокодера.'); return; }
    const earliest = new Date(demandEarliest); const latest = new Date(demandLatest);
    if (!Number.isFinite(earliest.getTime()) || !Number.isFinite(latest.getTime()) || latest < earliest) { setStatusMessage('Перевірте часовий інтервал.'); return; }
    const budget = demandBudget.trim() ? Math.round(Number(demandBudget.replace(',', '.')) * 100) : undefined;
    if (demandBudget.trim() && (!Number.isFinite(budget) || budget! < 1)) { setStatusMessage('Бюджет має бути додатною сумою.'); return; }
    setBusy(true); setStatusMessage('');
    try {
      const demand = await productionApi.createDemand({
        originName: demandOrigin.label, destinationName: demandDestination.label,
        origin: [demandOrigin.longitude, demandOrigin.latitude], destination: [demandDestination.longitude, demandDestination.latitude],
        earliestDeparture: earliest.toISOString(), latestDeparture: latest.toISOString(), passengers: demandPassengers,
        ...(budget === undefined ? {} : { budgetMinor: budget }), budgetType: demandBudgetType, notes: demandNotes, requirements: demandRequirements,
      });
      setStatusMessage('Заявку опубліковано на сервері.');
      await refreshMyDemands(); setSelectedDemand(demand); setSelectedDemandIsOwned(true); setProposals([]); setTab('my-demands');
    } catch (error) { setStatusMessage(error instanceof Error ? error.message : 'Не вдалося опублікувати заявку.'); }
    finally { setBusy(false); }
  };

  const viewDemand = async (demand: ApiDemand, isOwned: boolean) => {
    setSelectedDemand(demand); setSelectedDemandIsOwned(isOwned); setProposals([]); setProposalRevisions({}); setBusy(true); setStatusMessage('');
    try { setProposals(await productionApi.demandProposals(demand.id)); setTab(isOwned ? 'my-demands' : 'requests'); }
    catch (error) { setStatusMessage(error instanceof Error ? error.message : 'Не вдалося завантажити пропозиції.'); }
    finally { setBusy(false); }
  };

  const loadProposalHistory = async (proposalId: string) => {
    setBusy(true);
    try { const history = await productionApi.proposalRevisions(proposalId); setProposalRevisions((current) => ({ ...current, [proposalId]: history })); }
    catch (error) { setStatusMessage(error instanceof Error ? error.message : 'Історія переговорів недоступна.'); }
    finally { setBusy(false); }
  };

  const sendProposal = async (event: FormEvent) => {
    event.preventDefault();
    if (!proposalTarget) return;
    const amount = Math.round(Number(proposalPrice.replace(',', '.')) * 100);
    if (!Number.isInteger(amount) || amount < 1 || !proposalDeparture || !proposalVehicleId) { setStatusMessage('Потрібні перевірений автомобіль, час і ціна більша за 0.'); return; }
    setBusy(true);
    try {
      await productionApi.createProposal(proposalTarget.id, { vehicleId: proposalVehicleId, priceMinor: amount, departureAt: new Date(proposalDeparture).toISOString(), comment: proposalComment });
      setProposalTarget(null); setStatusMessage('Цінову пропозицію надіслано пасажиру.'); await refreshOpenDemands();
      await viewDemand(proposalTarget, false);
    } catch (error) { setStatusMessage(error instanceof Error ? error.message : 'Не вдалося надіслати пропозицію.'); }
    finally { setBusy(false); }
  };

  const sendCounter = async (event: FormEvent) => {
    event.preventDefault();
    if (!counterTarget) return;
    const amount = Math.round(Number(counterPrice.replace(',', '.')) * 100);
    if (!Number.isInteger(amount) || amount < 1 || !counterDeparture) { setStatusMessage('Вкажіть додатну ціну й час виїзду.'); return; }
    setBusy(true);
    try {
      await productionApi.counterProposal(counterTarget.id, { priceMinor: amount, departureAt: new Date(counterDeparture).toISOString(), comment: counterComment });
      setCounterTarget(null); setStatusMessage('Зустрічну пропозицію збережено.');
      if (selectedDemand) await viewDemand(selectedDemand, selectedDemandIsOwned);
    } catch (error) { setStatusMessage(error instanceof Error ? error.message : 'Не вдалося оновити пропозицію.'); }
    finally { setBusy(false); }
  };

  const agreeProposal = async (proposal: ApiProposal) => {
    setBusy(true);
    try {
      await productionApi.agreeProposal(proposal.id); setStatusMessage('Ви погодили ціну. Пасажир має підтвердити бронювання.');
      if (selectedDemand) await viewDemand(selectedDemand, selectedDemandIsOwned);
    } catch (error) { setStatusMessage(error instanceof Error ? error.message : 'Не вдалося погодити ціну.'); }
    finally { setBusy(false); }
  };

  const confirmProposal = async (proposal: ApiProposal) => {
    setBusy(true);
    try {
      await productionApi.acceptProposal(proposal.id); setStatusMessage('Домовленість підтверджено; бронювання створено на сервері.');
      await Promise.all([refreshBookings(), refreshMyDemands(), refreshOpenDemands()]); setSelectedDemand(null); setTab('trips');
    } catch (error) { setStatusMessage(error instanceof Error ? error.message : 'Не вдалося підтвердити бронювання.'); }
    finally { setBusy(false); }
  };

  const cancelDemand = async (demand: ApiDemand) => {
    setBusy(true);
    try { await productionApi.cancelDemand(demand.id); await refreshMyDemands(); setStatusMessage('Заявку скасовано.'); if (selectedDemand?.id===demand.id) setSelectedDemand(null); }
    catch (error) { setStatusMessage(error instanceof Error ? error.message : 'Не вдалося скасувати заявку.'); }
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

  const submitVerification = async (event: FormEvent) => {
    event.preventDefault();
    if (!verificationTarget || !registrationEvidence || !driverLicenseEvidence) {
      setStatusMessage('Додайте техпаспорт і посвідчення водія.'); return;
    }
    const acceptedTypes = new Set(['image/jpeg', 'image/png', 'application/pdf']);
    const files = [registrationEvidence, driverLicenseEvidence];
    if (files.some((file) => !acceptedTypes.has(file.type) || file.size < 1 || file.size > 8 * 1024 * 1024)) {
      setStatusMessage('Дозволені JPEG, PNG або PDF до 8 МБ кожен.'); return;
    }
    setBusy(true); setStatusMessage('');
    try {
      const [registration, license] = await Promise.all([
        productionApi.uploadVerificationEvidence(verificationTarget.id, registrationEvidence),
        productionApi.uploadVerificationEvidence(verificationTarget.id, driverLicenseEvidence),
      ]);
      await productionApi.submitVehicleVerification(verificationTarget.id, {
        registrationEvidenceKey: registration.key, registrationContentType: registration.contentType,
        driverLicenseEvidenceKey: license.key, driverLicenseContentType: license.contentType,
      });
      await refreshVehicles(); setVerificationTarget(null); setRegistrationEvidence(null); setDriverLicenseEvidence(null);
      setStatusMessage('Документи передано на перевірку. Статус авто оновиться після рішення модератора.');
    } catch (error) { setStatusMessage(error instanceof Error ? error.message : 'Не вдалося передати документи.'); }
    finally { setBusy(false); }
  };

  const openVerificationEvidence = async (record: ApiVerificationQueueItem) => {
    setBusy(true); setStatusMessage('');
    try {
      const evidence = await productionApi.adminVerificationEvidence(record.id);
      setReviewingRecord(record); setReviewEvidenceUrl(evidence.url); setReviewNote('');
    } catch (error) { setStatusMessage(error instanceof Error ? error.message : 'Документ недоступний для перевірки.'); }
    finally { setBusy(false); }
  };

  const decideVerification = async (decision: 'approved' | 'rejected') => {
    if (!reviewingRecord) return;
    if (decision === 'rejected' && reviewNote.trim().length < 3) { setStatusMessage('Для відмови вкажіть коротку причину.'); return; }
    setBusy(true);
    try {
      await productionApi.decideVerification(reviewingRecord.id, decision, reviewNote.trim());
      setReviewingRecord(null); setReviewEvidenceUrl(''); setReviewNote(''); await refreshAdminQueue();
      setStatusMessage(decision === 'approved' ? 'Документ схвалено.' : 'Документ відхилено із зазначеною причиною.');
    } catch (error) { setStatusMessage(error instanceof Error ? error.message : 'Рішення не збережено.'); }
    finally { setBusy(false); }
  };

  const enableDriver = async () => {
    if (!user) return;
    setBusy(true);
    try { await productionApi.enableRole('driver'); setUser({ ...user, roles: [...new Set([...user.roles, 'driver'])] }); await refreshOpenDemands(); }
    catch (error) { setStatusMessage(error instanceof Error ? error.message : 'Не вдалося змінити роль.'); }
    finally { setBusy(false); }
  };

  const logout = async () => {
    await productionApi.logout().catch(() => undefined);
    setUser(null); setBookings([]); setVehicles([]); setOffers([]); setShowLogin(true); setOtpRequested(false);
  };

  if (loading) return <main className="grid min-h-[100svh] place-items-center bg-[#f5f8fd] text-sm text-slate-500">Завантажуємо захищену сесію…</main>;
  if (!user || showLogin) return (
    <main className={`auth-screen relative flex min-h-[100svh] overflow-hidden bg-[#081b35] px-5 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-safe text-white ${authIntro ? 'items-stretch' : 'items-end sm:items-center sm:justify-center'}`}>
      {authIntro && <img src="/images/welcome-road.jpg" alt="" className="absolute inset-0 h-full w-full object-cover object-[center_58%]" />}
      <div className={`absolute inset-0 ${authIntro ? 'bg-[linear-gradient(180deg,rgba(4,17,37,.45)_0%,rgba(5,22,44,.08)_34%,rgba(5,15,29,.28)_57%,rgba(3,10,19,.9)_100%)]' : 'bg-[radial-gradient(ellipse_at_55%_35%,rgba(41,131,255,.65),transparent_48%),linear-gradient(180deg,#113d75_0%,#122f54_48%,#08121f_100%)]'}`} />
      {!authIntro && <div className="absolute inset-x-0 bottom-0 h-[48%] bg-[linear-gradient(0deg,rgba(4,10,18,.88),transparent)]" />}
      <section className={`relative z-10 mx-auto flex w-full max-w-md flex-col ${authIntro ? 'min-h-[calc(100svh-env(safe-area-inset-top))] items-center pb-1 text-center' : 'pb-2'}`}>
        {!authIntro && <button onClick={() => { setAuthIntro(true); setShowLogin(false); setStatusMessage(''); }} className="mb-6 grid h-10 w-10 place-items-center rounded-full border border-white/25 bg-white/10" aria-label="Назад"><ArrowLeft size={19}/></button>}
        {authIntro ? <>
          <div className="mt-[max(3rem,10svh)] flex flex-col items-center drop-shadow-[0_2px_16px_rgba(4,12,28,.3)]">
            <span className="relative mb-3 grid h-[4.4rem] w-[4.4rem] place-items-center rounded-full border border-white/55 bg-white/15 text-white shadow-[0_0_38px_rgba(56,189,248,.42)] backdrop-blur-sm"><MapPin size={42} strokeWidth={1.8}/><span className="absolute left-1/2 top-[35%] h-2 w-2 -translate-x-1/2 rounded-full bg-sky-300"/></span>
            <strong className="text-[2rem] font-extrabold tracking-tight">MARSH<span className="text-sky-400">GO</span></strong>
            <p className="mt-1 text-xs text-white/85">One Route. Every Way.</p>
            <p className="mt-1 text-[10px] text-white/75">Один маршрут. Усі способи доїхати.</p>
          </div>
          <div className="mt-auto w-full pb-5 pt-8 text-left drop-shadow-[0_2px_12px_rgba(0,0,0,.55)]">
            <p className="text-[11px] font-bold uppercase tracking-[.27em] text-blue-100">Україна ближче</p>
            <h1 className="mt-2 text-[2.15rem] font-extrabold leading-[1.08] tracking-tight">Усі способи<br/>доїхати — в одному<br/>застосунку.</h1>
            <p className="mt-3 max-w-sm text-sm leading-5 text-blue-50/90">Попутки, автобуси та міські маршрути — шукайте разом.</p>
          </div>
          <div className="w-full">
            <button onClick={() => setAuthIntro(false)} className="w-full rounded-2xl bg-blue-600 px-5 py-[1.05rem] text-sm font-bold shadow-lg shadow-blue-950/45">Почати</button>
            <button onClick={() => setAuthIntro(false)} className="mt-3 w-full rounded-2xl border border-white/50 bg-slate-950/25 px-5 py-3.5 text-sm font-semibold backdrop-blur-sm">У мене вже є акаунт</button>
          </div>
        </> : <>
        <div className="mb-8 flex items-center gap-3"><div className="grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br from-sky-300 to-blue-500 text-2xl font-black">M</div><div><strong className="text-2xl tracking-tight">MARSH<span className="text-sky-400">GO</span></strong><p className="text-xs text-blue-100/80">One Route. Every Way.</p></div></div>
        {!otpRequested ? <>
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
        </>}
      </section>
    </main>
  );

  const status = statusMessage ? <div role="status" className="mx-auto mt-3 w-full max-w-xl rounded-2xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-blue-800">{statusMessage}<button onClick={() => setStatusMessage('')} className="float-right"><X size={16}/></button></div> : null;
  const header = <header className="mx-auto flex w-full max-w-xl items-center justify-between px-5 pb-3 pt-[max(.8rem,env(safe-area-inset-top))]">
    <div className="flex items-center gap-2"><span className="grid h-9 w-9 place-items-center rounded-full bg-blue-50 text-blue-600"><MapPin size={22} strokeWidth={2.5}/></span><div><strong className="text-[18px] tracking-tight">MARSH<span className="text-blue-600">GO</span></strong><p className="-mt-1 text-[10px] text-slate-500">Усі поїздки в одному місці</p></div></div>
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
    <button onClick={() => setTab('demand')} className="mt-3 flex w-full items-center justify-center gap-2 rounded-2xl bg-blue-50 px-4 py-3 text-xs font-bold text-blue-700"><Compass size={16}/>Опублікувати свій запит на поїздку<ArrowRight size={15}/></button>
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
      {vehicles.length ? <div className="space-y-2">{vehicles.map(vehicle=>{const records=verificationRecords.filter(record=>record.vehicle_id===vehicle.id);const reviewPending=records.some(record=>record.status==='pending');const reviewRejected=records.some(record=>record.status==='rejected');return <div key={vehicle.id} className="rounded-xl bg-[#f6f8fc] p-3"><div className="flex items-center gap-3"><span className="grid h-10 w-10 place-items-center rounded-xl bg-white text-blue-600"><CarFront size={19}/></span><div className="min-w-0 flex-1"><b className="block text-sm">{vehicle.make} {vehicle.model}</b><small className="text-slate-500">{vehicle.model_year} · {vehicle.seat_count} місць · {vehicle.verification_status==='verified'?'Перевірено':vehicle.verification_status==='rejected'?'Відхилено':'Потрібна перевірка'}</small></div>{vehicle.is_active ? <span className="rounded-full bg-emerald-50 px-2 py-1 text-[10px] font-bold text-emerald-700">Активне</span> : <button onClick={async()=>{setBusy(true);try{await productionApi.activateVehicle(vehicle.id);await refreshVehicles();}catch(e){setStatusMessage(e instanceof Error?e.message:'Не вдалося активувати авто.');}finally{setBusy(false);}}} className="text-xs font-bold text-blue-600">Обрати</button>}</div>{vehicle.verification_status!=='verified'&&<button disabled={reviewPending} onClick={()=>{setRegistrationEvidence(null);setDriverLicenseEvidence(null);setVerificationTarget(vehicle);}} className="mt-2 flex w-full items-center justify-center gap-1.5 rounded-lg bg-white py-2 text-xs font-bold text-blue-700 disabled:text-slate-400"><ShieldCheck size={14}/>{reviewPending?'Документи на перевірці':reviewRejected?'Надіслати повторно':'Подати документи'}</button>}</div>})}</div> : <p className="rounded-xl bg-[#f6f8fc] p-3 text-sm text-slate-500">Автомобілів ще не додано.</p>}
      <button onClick={()=>void enableDriver()} disabled={user.roles.includes('driver')||busy} className="mt-3 w-full rounded-xl border border-blue-100 py-3 text-sm font-bold text-blue-700 disabled:text-slate-400">{user.roles.includes('driver')?'Роль водія активна':'Увімкнути роль водія'}</button>
    </div>
    <div className="mt-4 overflow-hidden rounded-[1.4rem] bg-white shadow-sm">{[['Документи','Статус перевірки доступний у профілі'],['Налаштування','Особисті налаштування'],['Допомога','Центр підтримки']].map(([title,sub])=><button key={title} onClick={()=>setStatusMessage(`${title}: цей розділ ще не реалізовано.`)} className="flex w-full items-center gap-3 border-b border-slate-100 px-4 py-4 text-left last:border-0"><span className="grid h-9 w-9 place-items-center rounded-xl bg-slate-50 text-slate-600"><ShieldCheck size={17}/></span><span className="flex-1"><b className="block text-sm">{title}</b><small className="text-slate-400">{sub}</small></span><ChevronRight size={17} className="text-slate-400"/></button>)}</div>
    {user.roles.some((role)=>role==='admin'||role==='moderator')&&<button onClick={()=>{setTab('admin');void refreshAdminQueue().catch((error:unknown)=>setStatusMessage(error instanceof Error?error.message:'Черга перевірок недоступна.'));}} className="mt-3 flex w-full items-center justify-between rounded-xl bg-white p-4 text-left shadow-sm"><span><b className="block text-sm">Модерація документів</b><small className="text-slate-500">Захищена черга перевірки водіїв</small></span><ChevronRight size={17} className="text-slate-400"/></button>}
    <button onClick={()=>void logout()} className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-white py-3 text-sm font-bold text-rose-600 shadow-sm"><LogOut size={16}/>Вийти</button>
  </div>;

  const adminScreen = <div className="mx-auto w-full max-w-xl px-5 pb-5"><div className="mb-4 flex items-center justify-between"><div><p className="text-xs font-bold uppercase tracking-[.16em] text-blue-600">Тільки персонал</p><h1 className="text-2xl font-extrabold">Перевірка документів</h1></div><button onClick={()=>void refreshAdminQueue().catch((error:unknown)=>setStatusMessage(error instanceof Error?error.message:'Черга недоступна.'))} className="rounded-xl bg-white px-3 py-2 text-xs font-bold text-blue-700">Оновити</button></div><p className="mb-3 rounded-xl bg-amber-50 p-3 text-xs leading-5 text-amber-800">Документи містять чутливі дані. Відкриття й рішення журналюються; схвалення одного документа ще не верифікує авто.</p>{adminQueue.length?<div className="space-y-3">{adminQueue.map(record=><article key={record.id} className="rounded-2xl bg-white p-4 shadow-sm"><div className="flex items-start justify-between gap-3"><div><p className="text-[10px] font-bold uppercase tracking-wide text-blue-600">{record.verification_type==='vehicle'?'Реєстраційний документ':record.verification_type==='driver_license'?'Посвідчення водія':record.verification_type}</p><h2 className="mt-1 font-extrabold">{record.display_name}</h2><p className="mt-1 text-xs text-slate-500">{record.make&&record.model?`${record.make} ${record.model} · ${record.model_year} · ${record.seat_count} місць`:'Документ профілю'}</p><p className="mt-1 text-[10px] text-slate-400">Подано {formatDate(record.created_at)}</p></div><span className="rounded-full bg-amber-50 px-2.5 py-1 text-[10px] font-bold text-amber-700">Очікує</span></div><button disabled={busy} onClick={()=>void openVerificationEvidence(record)} className="mt-3 w-full rounded-xl bg-blue-600 py-3 text-xs font-bold text-white disabled:opacity-50">Відкрити та перевірити документ</button></article>)}</div>:<div className="rounded-2xl bg-white p-6 text-center"><ShieldCheck className="mx-auto text-emerald-600"/><p className="mt-2 font-bold">Черга порожня</p><p className="mt-1 text-xs text-slate-500">Нові подання з’являться після завантаження водієм документів.</p></div>}</div>;

  const demandFormScreen = <div className="mx-auto w-full max-w-xl px-5 pb-5">
    <div className="mb-4 flex items-center gap-3"><button onClick={()=>setTab('home')} className="grid h-10 w-10 place-items-center rounded-full bg-white"><ArrowLeft size={18}/></button><div><p className="text-xs text-slate-500">Reverse Marketplace</p><h1 className="font-extrabold">Шукаю поїздку</h1></div><button onClick={()=>{setSelectedDemand(null);setTab('my-demands');}} className="ml-auto text-xs font-bold text-blue-600">Мої заявки</button></div>
    <form onSubmit={publishDemand} className="space-y-3 rounded-[1.5rem] bg-white p-4 shadow-sm">
      {([['origin','Звідки',demandOriginText,setDemandOriginText,demandOrigin],['destination','Куди',demandDestinationText,setDemandDestinationText,demandDestination]] as const).map(([field,label,value,setValue,selected])=><div key={field} className="rounded-xl bg-[#f6f8fc] p-3"><label className="block text-[10px] font-semibold text-slate-400">{label}</label><div className="mt-1 flex items-center gap-2"><MapPin size={16} className={field==='origin'?'text-emerald-600':'text-rose-500'}/><input required value={value} onChange={event=>{setValue(event.target.value);if(field==='origin')setDemandOrigin(null);else setDemandDestination(null);}} className="min-w-0 flex-1 bg-transparent text-sm font-bold outline-none" placeholder="Пошук адреси або міста"/><button type="button" onClick={()=>void searchPlace(field)} disabled={placeSearchBusy} className="rounded-lg bg-white px-3 py-2 text-[11px] font-bold text-blue-700">{placeSearchBusy&&placeField===field?'...':'Знайти'}</button></div>{selected&&<p className="mt-1 text-[10px] text-emerald-700">Точку вибрано з геокодера</p>}{placeField===field&&placeSuggestions.length>0&&<div className="mt-2 divide-y divide-slate-100 overflow-hidden rounded-xl border border-slate-100 bg-white">{placeSuggestions.map(place=><button key={place.providerId} type="button" onClick={()=>choosePlace(place)} className="block w-full px-3 py-2.5 text-left text-xs hover:bg-blue-50">{place.label}</button>)}</div>}</div>)}
      <div className="grid grid-cols-2 gap-2"><label className="rounded-xl bg-[#f6f8fc] p-3 text-[10px] font-semibold text-slate-400">Не раніше<input required type="datetime-local" value={demandEarliest} onChange={event=>setDemandEarliest(event.target.value)} className="mt-1 block w-full bg-transparent text-xs font-bold text-slate-800 outline-none"/></label><label className="rounded-xl bg-[#f6f8fc] p-3 text-[10px] font-semibold text-slate-400">Не пізніше<input required type="datetime-local" value={demandLatest} onChange={event=>setDemandLatest(event.target.value)} className="mt-1 block w-full bg-transparent text-xs font-bold text-slate-800 outline-none"/></label></div>
      <div className="grid grid-cols-2 gap-2"><label className="rounded-xl bg-[#f6f8fc] p-3 text-[10px] font-semibold text-slate-400">Пасажири<select value={demandPassengers} onChange={event=>setDemandPassengers(Number(event.target.value))} className="mt-1 block w-full bg-transparent text-sm font-bold text-slate-800">{Array.from({length:8},(_,i)=>i+1).map(n=><option key={n} value={n}>{n}</option>)}</select></label><label className="rounded-xl bg-[#f6f8fc] p-3 text-[10px] font-semibold text-slate-400">Бюджет, грн<input inputMode="decimal" value={demandBudget} onChange={event=>setDemandBudget(event.target.value)} className="mt-1 block w-full bg-transparent text-sm font-bold text-slate-800 outline-none" placeholder="Не вказано"/></label></div>
      <label className="block rounded-xl bg-[#f6f8fc] p-3 text-[10px] font-semibold text-slate-400">Тип бюджету<select value={demandBudgetType} onChange={event=>setDemandBudgetType(event.target.value as 'total_all'|'per_seat')} className="mt-1 block w-full bg-transparent text-xs font-bold text-slate-800"><option value="total_all">За всю поїздку</option><option value="per_seat">За одне місце</option></select></label>
      <div className="rounded-xl bg-[#f6f8fc] p-3"><p className="mb-2 text-[10px] font-semibold text-slate-400">Потреби пасажирів</p><div className="flex flex-wrap gap-2">{([['luggage','Багаж'],['pets','Тварини'],['childSeat','Дитяче крісло']] as const).map(([key,label])=><label key={key} className="flex items-center gap-1.5 rounded-full bg-white px-2.5 py-1.5 text-[10px] font-semibold text-slate-600"><input type="checkbox" checked={demandRequirements[key]} onChange={event=>setDemandRequirements({...demandRequirements,[key]:event.target.checked})} className="accent-blue-600"/>{label}</label>)}</div></div>
      <label className="block rounded-xl bg-[#f6f8fc] p-3 text-[10px] font-semibold text-slate-400">Додаткові умови<textarea value={demandNotes} onChange={event=>setDemandNotes(event.target.value)} maxLength={1000} rows={2} className="mt-1 block w-full resize-none bg-transparent text-sm text-slate-800 outline-none" placeholder="Що ще важливо водієві знати?"/></label>
      <button disabled={busy} className="flex w-full items-center justify-center gap-2 rounded-2xl bg-blue-600 py-4 text-sm font-bold text-white disabled:opacity-50">{busy?'Публікуємо…':'Опублікувати заявку'}<ArrowRight size={17}/></button>
      <p className="text-[10px] leading-4 text-slate-400">Координати зберігаються з вибраних геокодером точок. Якщо сервіс місць не налаштовано, заявка не публікується.</p>
    </form>
  </div>;

  const proposalCard = (proposal: ApiProposal) => {
    const myRole = selectedDemandIsOwned ? 'passenger' : 'driver';
    const isMyTurn = proposal.last_actor_role !== myRole && proposal.status === 'pending';
    const needsDriverAgreement = selectedDemandIsOwned && proposal.last_actor_role === 'passenger' && proposal.status === 'pending';
    const passengerCanConfirm = selectedDemandIsOwned && proposal.last_actor_role === 'driver' && proposal.status === 'pending';
    return <article key={proposal.id} className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm"><div className="flex items-start justify-between gap-3"><div><b className="text-sm">{proposal.driver_name}</b><p className="text-xs text-slate-500">{proposal.make} {proposal.model} · {proposal.model_year}</p></div><span className={`rounded-full px-2 py-1 text-[10px] font-bold ${proposal.status==='pending'?'bg-amber-50 text-amber-700':'bg-slate-100 text-slate-500'}`}>{proposal.status==='pending'?'Переговори':proposal.status}</span></div><div className="mt-3 flex items-center justify-between"><span className="text-xs text-slate-500">{formatDate(proposal.departure_at)}</span><b className="text-lg">{formatMoney(proposal.price_minor,proposal.currency)}</b></div>{proposal.last_comment&&<p className="mt-2 rounded-xl bg-slate-50 p-3 text-xs text-slate-600">{proposal.last_comment}</p>}
      <button onClick={()=>void loadProposalHistory(proposal.id)} className="mt-3 text-[11px] font-bold text-blue-600">Історія переговорів</button>
      {proposalRevisions[proposal.id]&&<div className="mt-2 space-y-1 border-l-2 border-blue-100 pl-3">{proposalRevisions[proposal.id].map(revision=><p key={revision.revision_number} className="text-[10px] text-slate-500">{revision.actor_role==='driver'?'Водій':'Пасажир'} · {formatMoney(revision.price_minor,'UAH')} · {formatDate(revision.created_at,{hour:'2-digit',minute:'2-digit'})}{revision.comment?` · ${revision.comment}`:''}</p>)}</div>}
      {proposal.status==='pending'&&<div className="mt-3 grid grid-cols-1 gap-2">{isMyTurn&&<button onClick={()=>{setCounterTarget(proposal);setCounterPrice(String((proposal.price_minor/100).toFixed(2)));setCounterDeparture(toLocalDateTimeInput(proposal.departure_at));setCounterComment('');}} className="rounded-xl border border-blue-200 py-2.5 text-xs font-bold text-blue-700">Змінити ціну або час</button>}{needsDriverAgreement&&<button disabled={busy} onClick={()=>void agreeProposal(proposal)} className="rounded-xl bg-emerald-600 py-2.5 text-xs font-bold text-white">Погодити зустрічну ціну</button>}{passengerCanConfirm&&<button disabled={busy} onClick={()=>void confirmProposal(proposal)} className="rounded-xl bg-blue-600 py-3 text-xs font-bold text-white">Підтвердити домовленість і бронювання</button>}</div>}</article>;
  };

  const demandDetailScreen = (owned: boolean) => selectedDemand ? <div className="mx-auto w-full max-w-xl px-5 pb-5"><div className="mb-4 flex items-center gap-3"><button onClick={()=>setSelectedDemand(null)} className="grid h-10 w-10 place-items-center rounded-full bg-white"><ArrowLeft size={18}/></button><div><p className="text-xs text-slate-500">{owned?'Моя заявка':'Заявка пасажира'}</p><h1 className="font-extrabold">{selectedDemand.origin_name.split(',')[0]} → {selectedDemand.destination_name.split(',')[0]}</h1></div></div><div className="mb-3 rounded-2xl bg-white p-4 shadow-sm"><p className="text-sm font-bold">{formatDate(selectedDemand.earliest_departure)} – {formatDate(selectedDemand.latest_departure,{hour:'2-digit',minute:'2-digit'})}</p><p className="mt-1 text-xs text-slate-500">{selectedDemand.passenger_count} пасажири · {selectedDemand.budget_minor===null?'Бюджет не вказано':`${formatMoney(selectedDemand.budget_minor,'UAH')} ${selectedDemand.budget_type==='per_seat'?'за місце':'за всіх'}`}</p>{selectedDemand.notes&&<p className="mt-2 text-xs text-slate-600">{selectedDemand.notes}</p>}{owned&&selectedDemand.status==='open'&&<button onClick={()=>void cancelDemand(selectedDemand)} className="mt-3 text-xs font-bold text-rose-600">Скасувати заявку</button>}</div><div className="mb-2 flex items-center justify-between"><h2 className="font-extrabold">Пропозиції водіїв</h2><span className="text-xs text-slate-500">{proposals.length}</span></div>{proposals.length?<div className="space-y-3">{proposals.map(proposalCard)}</div>:<p className="rounded-2xl bg-white p-4 text-sm text-slate-500">Пропозицій поки немає.</p>}</div> : null;

  const myDemandsScreen = selectedDemand && selectedDemandIsOwned ? demandDetailScreen(true) : <div className="mx-auto w-full max-w-xl px-5 pb-5"><div className="mb-4 flex items-center justify-between"><div><p className="text-xs font-bold uppercase tracking-[.16em] text-blue-600">Пасажир</p><h1 className="text-2xl font-extrabold">Мої заявки</h1></div><button onClick={()=>{setSelectedDemand(null);setTab('demand');}} className="grid h-10 w-10 place-items-center rounded-full bg-blue-600 text-white"><Plus size={20}/></button></div>{myDemands.length?<div className="space-y-3">{myDemands.map(demand=><button key={demand.id} onClick={()=>void viewDemand(demand,true)} className="w-full rounded-2xl bg-white p-4 text-left shadow-sm"><div className="flex items-center justify-between"><b>{demand.origin_name.split(',')[0]} → {demand.destination_name.split(',')[0]}</b><span className="text-[10px] text-slate-400">{demand.status}</span></div><p className="mt-1 text-xs text-slate-500">{formatDate(demand.earliest_departure)} · {demand.passenger_count} пасажир(и)</p><p className="mt-2 text-xs font-bold text-blue-600">{demand.budget_minor===null?'Без вказаного бюджету':`${formatMoney(demand.budget_minor,'UAH')} ${demand.budget_type==='per_seat'?'за місце':'за всіх'}`} · {demand.proposal_count ?? 0} пропозицій</p></button>)}</div>:<div className="rounded-2xl bg-white p-6 text-center"><Compass className="mx-auto text-slate-300"/><p className="mt-2 font-bold">Ви ще не публікували запитів</p><button onClick={()=>setTab('demand')} className="mt-3 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-bold text-white">Створити заявку</button></div>}</div>;

  const requestsScreen = selectedDemand && !selectedDemandIsOwned ? demandDetailScreen(false) : (
    <div className="mx-auto w-full max-w-xl px-5 pb-5">
      <div className="mb-4 flex items-center justify-between">
        <div><p className="text-xs font-bold uppercase tracking-[.16em] text-blue-600">Для водія</p><h1 className="text-2xl font-extrabold">Заявки пасажирів</h1></div>
        <button onClick={() => { void refreshOpenDemands().catch((error: unknown) => setStatusMessage(error instanceof Error ? error.message : 'Заявки недоступні.')); }} className="rounded-xl bg-white px-3 py-2 text-xs font-bold text-blue-700">Оновити</button>
      </div>
      <p className="mb-3 rounded-xl bg-amber-50 p-3 text-[11px] leading-4 text-amber-800">Список показує відкриті заявки. Автоматичне географічне ранжування за маршрутом ще не підключено.</p>
      {openDemands.length ? <div className="space-y-3">
        {openDemands.map((demand) => <article key={demand.id} className="rounded-2xl bg-white p-4 shadow-sm">
          <button onClick={() => { void viewDemand(demand, false); }} className="w-full text-left">
            <div className="flex items-start justify-between gap-2"><b>{demand.origin_name.split(',')[0]} → {demand.destination_name.split(',')[0]}</b><ChevronRight size={17} className="shrink-0 text-slate-400"/></div>
            <p className="mt-1 text-xs text-slate-500">{formatDate(demand.earliest_departure)} – {formatDate(demand.latest_departure, { hour: '2-digit', minute: '2-digit' })}</p>
            <p className="mt-1 text-xs text-slate-500">{demand.passenger_count} пасажири · {demand.budget_minor === null ? 'Бюджет не вказано' : `${formatMoney(demand.budget_minor, 'UAH')} ${demand.budget_type === 'per_seat' ? 'за місце' : 'за всіх'}`}</p>
            {demand.notes && <p className="mt-2 line-clamp-2 text-xs text-slate-600">{demand.notes}</p>}
            {Object.entries(demand.requirements ?? {}).some(([, enabled]) => enabled === true) && <p className="mt-2 text-[10px] font-semibold text-blue-700">{Object.entries(demand.requirements ?? {}).filter(([, enabled]) => enabled === true).map(([key]) => demandRequirementLabels[key] ?? key).join(' · ')}</p>}
          </button>
          <button disabled={!vehicles.some((vehicle) => vehicle.verification_status === 'verified') || busy} onClick={() => {
            setProposalTarget(demand);
            setProposalDeparture(toLocalDateTimeInput(demand.earliest_departure));
            const proposedTotal = demand.budget_minor === null ? null : demand.budget_minor / 100 * (demand.budget_type === 'per_seat' ? demand.passenger_count : 1);
            setProposalPrice(proposedTotal === null ? '' : String(proposedTotal.toFixed(2)));
            const verified = vehicles.find((vehicle) => vehicle.verification_status === 'verified' && vehicle.is_active) ?? vehicles.find((vehicle) => vehicle.verification_status === 'verified');
            setProposalVehicleId(verified?.id ?? '');
          }} className="mt-3 w-full rounded-xl bg-blue-600 py-2.5 text-xs font-bold text-white disabled:bg-slate-200 disabled:text-slate-500">
            {vehicles.some((vehicle) => vehicle.verification_status === 'verified') ? 'Запропонувати ціну' : 'Потрібне перевірене авто'}
          </button>
        </article>)}
      </div> : <p className="rounded-2xl bg-white p-5 text-sm text-slate-500">Відкритих заявок зараз немає.</p>}
    </div>
  );

  const createMenu = showCreateMenu ? <div className="fixed inset-0 z-40 flex items-end justify-center bg-slate-950/35 p-3 sm:items-center"><div className="w-full max-w-md rounded-[1.6rem] bg-white p-4 shadow-xl"><div className="mb-3 flex items-center justify-between"><h2 className="font-extrabold">Створити</h2><button onClick={()=>setShowCreateMenu(false)} aria-label="Закрити"><X size={20}/></button></div><button onClick={()=>{setShowCreateMenu(false);setSelectedDemand(null);setTab('demand');}} className="mb-2 flex w-full items-center gap-3 rounded-xl bg-blue-50 p-3 text-left"><Compass className="text-blue-600"/><span><b className="block text-sm">Шукаю поїздку</b><small className="text-slate-500">Опублікувати маршрут і бюджет</small></span></button><button onClick={()=>{setShowCreateMenu(false);if(!user.roles.includes('driver')){setStatusMessage('Спершу активуйте роль водія у профілі.');setTab('profile');return;}setTab('requests');void refreshOpenDemands().catch(e=>setStatusMessage(e instanceof Error?e.message:'Заявки недоступні.'));}} className="flex w-full items-center gap-3 rounded-xl bg-slate-50 p-3 text-left"><CarFront className="text-emerald-600"/><span><b className="block text-sm">Знайти пасажира</b><small className="text-slate-500">Переглянути заявки водієві</small></span></button></div></div> : null;

  const screen = selectedOffer ? <div className="mx-auto w-full max-w-xl px-5 pb-5"><div className="mb-4 flex items-center gap-3"><button onClick={()=>setSelectedOffer(null)} className="grid h-10 w-10 place-items-center rounded-full bg-white shadow-sm"><ArrowLeft size={18}/></button><div><p className="text-xs text-slate-500">Деталі поїздки</p><h1 className="font-extrabold">{selectedOffer.origin_name} → {selectedOffer.destination_name}</h1></div></div><div className="rounded-[1.5rem] bg-white p-5 shadow-sm"><span className="rounded-full bg-emerald-50 px-3 py-1 text-[10px] font-bold text-emerald-700">COMMUNITY · Попутка</span><div className="mt-5 grid grid-cols-2 gap-4"><div><small className="text-slate-400">Відправлення</small><p className="mt-1 text-xl font-extrabold">{formatDate(selectedOffer.departure_at,{hour:'2-digit',minute:'2-digit'})}</p><b>{selectedOffer.origin_name}</b></div><div className="text-right"><small className="text-slate-400">Прибуття</small><p className="mt-1 text-xl font-extrabold">{selectedOffer.arrival_at?formatDate(selectedOffer.arrival_at,{hour:'2-digit',minute:'2-digit'}):'—'}</p><b>{selectedOffer.destination_name}</b></div></div><div className="my-4 border-t border-slate-100"/><p className="flex items-center gap-3 text-sm"><span className="grid h-10 w-10 place-items-center rounded-full bg-blue-100 font-bold text-blue-700">{selectedOffer.driver_name.slice(0,1)}</span><span><b>{selectedOffer.driver_name}</b><small className="block text-slate-500">{selectedOffer.review_count?`★ ${Number(selectedOffer.average_rating).toFixed(1)} · ${selectedOffer.review_count} відгуків`:'Новий водій'}</small></span></p><div className="mt-5 flex justify-between text-sm"><span className="text-slate-500">Вільні місця</span><b>{selectedOffer.available_seats}</b></div><div className="mt-3 flex justify-between text-sm"><span className="text-slate-500">Вартість · {seats} місце(ць)</span><b className="text-lg">{formatMoney(selectedOffer.price_per_seat_minor*seats,selectedOffer.currency)}</b></div><p className="mt-1 text-right text-[10px] text-slate-400">MARSHGO Community · комісія платформи 0%</p><button disabled={busy||selectedOffer.available_seats<seats} onClick={()=>void book(selectedOffer)} className="mt-5 flex w-full items-center justify-center gap-2 rounded-2xl bg-blue-600 py-4 font-bold text-white disabled:opacity-50">{busy?'Обробляємо…':'Забронювати місце'}<ArrowRight size={17}/></button></div></div> : tab==='home' ? (showResults ? resultsScreen : homeScreen) : tab==='search' ? resultsScreen : tab==='trips' ? tripsScreen : tab==='chat' ? chatScreen : tab==='profile' ? profileScreen : tab==='admin' ? adminScreen : tab==='demand' ? demandFormScreen : tab==='requests' ? requestsScreen : myDemandsScreen;

  return <main className="min-h-[100svh] bg-[#f5f8fd] pb-[calc(5.3rem+env(safe-area-inset-bottom))] text-[#17243a]">
    {header}
    {status}
    <div className="pt-1">{screen}</div>
    <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-slate-200/80 bg-white/95 pb-[max(.35rem,env(safe-area-inset-bottom))] pt-2 backdrop-blur-xl"><div className="mx-auto flex max-w-xl items-center justify-around px-1">{tabItems.map((item,index)=>{const Icon=item.icon;const active=tab===item.id;return <span key={item.id} className="contents">{index===2&&<button onClick={()=>setShowCreateMenu(true)} aria-label="Створити" className="-mt-5 grid h-12 w-12 place-items-center rounded-full bg-blue-600 text-white shadow-lg shadow-blue-600/30"><Plus size={23}/></button>}<button onClick={()=>{setTab(item.id);setSelectedOffer(null);setSelectedBooking(null);}} className={`flex min-w-[56px] flex-col items-center gap-1 px-2 py-1 ${active?'text-blue-600':'text-slate-400'}`}><Icon size={20} strokeWidth={active?2.5:2}/><span className="text-[10px] font-semibold">{item.label}</span></button></span>})}</div></nav>
    {createMenu}
    {proposalTarget&&<div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/40 p-3 sm:items-center"><form onSubmit={sendProposal} className="w-full max-w-md rounded-[1.7rem] bg-white p-5 shadow-xl"><div className="mb-3 flex items-center justify-between"><div><p className="text-xs text-slate-500">Ваша ціна для пасажира</p><h2 className="font-extrabold">{proposalTarget.origin_name.split(',')[0]} → {proposalTarget.destination_name.split(',')[0]}</h2></div><button type="button" onClick={()=>setProposalTarget(null)} aria-label="Закрити"><X size={20}/></button></div><label className="mb-3 block text-xs font-bold text-slate-600">Перевірене авто<select required value={proposalVehicleId} onChange={event=>setProposalVehicleId(event.target.value)} className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm"><option value="">Оберіть авто</option>{vehicles.filter(v=>v.verification_status==='verified').map(v=><option key={v.id} value={v.id}>{v.make} {v.model} · {v.seat_count} місць</option>)}</select></label>{!vehicles.some(v=>v.verification_status==='verified')&&<p className="mb-3 text-xs leading-5 text-amber-700">Немає перевіреного авто. Спершу потрібно пройти перевірку перевізника.</p>}<div className="grid grid-cols-2 gap-3"><label className="text-xs font-bold text-slate-600">Ціна, грн<input required inputMode="decimal" value={proposalPrice} onChange={event=>setProposalPrice(event.target.value)} className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-3 text-sm" placeholder="Загальна сума"/></label><label className="text-xs font-bold text-slate-600">Час виїзду<input required type="datetime-local" value={proposalDeparture} onChange={event=>setProposalDeparture(event.target.value)} className="mt-1.5 w-full rounded-xl border border-slate-200 px-2 py-3 text-xs"/></label></div><label className="mt-3 block text-xs font-bold text-slate-600">Коментар<input value={proposalComment} onChange={event=>setProposalComment(event.target.value)} maxLength={1000} className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-3 text-sm" placeholder="Коротко про поїздку"/></label><button disabled={busy||!vehicles.some(v=>v.verification_status==='verified')} className="mt-4 w-full rounded-xl bg-blue-600 py-3.5 font-bold text-white disabled:opacity-50">Надіслати пропозицію</button></form></div>}
    {counterTarget&&<div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/40 p-3 sm:items-center"><form onSubmit={sendCounter} className="w-full max-w-md rounded-[1.7rem] bg-white p-5 shadow-xl"><div className="mb-4 flex items-center justify-between"><div><p className="text-xs text-slate-500">Зустрічна пропозиція</p><h2 className="font-extrabold">Змінити суму або час</h2></div><button type="button" onClick={()=>setCounterTarget(null)} aria-label="Закрити"><X size={20}/></button></div><label className="mb-3 block text-xs font-bold text-slate-600">Загальна сума, грн<input required inputMode="decimal" value={counterPrice} onChange={event=>setCounterPrice(event.target.value)} className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-3 text-sm"/></label><label className="mb-3 block text-xs font-bold text-slate-600">Час відправлення<input required type="datetime-local" value={counterDeparture} onChange={event=>setCounterDeparture(event.target.value)} className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-3 text-sm"/></label><label className="block text-xs font-bold text-slate-600">Коментар<input value={counterComment} onChange={event=>setCounterComment(event.target.value)} maxLength={1000} className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-3 text-sm"/></label><button disabled={busy} className="mt-4 w-full rounded-xl bg-blue-600 py-3.5 font-bold text-white">Надіслати зустрічну</button></form></div>}
    {showVehicleForm && <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/40 p-3 sm:items-center"><form onSubmit={createVehicle} className="w-full max-w-md rounded-[1.7rem] bg-white p-5 shadow-xl"><div className="mb-4 flex items-center justify-between"><h2 className="text-lg font-extrabold">Додати автомобіль</h2><button type="button" onClick={()=>setShowVehicleForm(false)} aria-label="Закрити"><X size={20}/></button></div>{([['make','Марка'],['model','Модель']] as const).map(([key,label])=><label key={key} className="mb-3 block text-xs font-bold text-slate-600">{label}<input required value={vehicleForm[key]} onChange={event=>setVehicleForm({...vehicleForm,[key]:event.target.value})} className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-3 text-sm outline-none focus:border-blue-500"/></label>)}<div className="grid grid-cols-2 gap-3"><label className="text-xs font-bold text-slate-600">Рік<input required type="number" min="1950" max={new Date().getFullYear()+1} value={vehicleForm.modelYear} onChange={event=>setVehicleForm({...vehicleForm,modelYear:Number(event.target.value)})} className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-3 text-sm"/></label><label className="text-xs font-bold text-slate-600">Місця<input required type="number" min="1" max="20" value={vehicleForm.seats} onChange={event=>setVehicleForm({...vehicleForm,seats:Number(event.target.value)})} className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-3 text-sm"/></label></div><p className="my-3 text-xs leading-5 text-amber-700">Після додавання завантажте техпаспорт і посвідчення водія. Фото авто можна буде додати після підключення сховища.</p><button disabled={busy} className="w-full rounded-xl bg-blue-600 py-3.5 font-bold text-white">{busy?'Зберігаємо…':'Зберегти автомобіль'}</button></form></div>}
    {verificationTarget&&<div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/40 p-3 sm:items-center"><form onSubmit={submitVerification} className="w-full max-w-md rounded-[1.7rem] bg-white p-5 shadow-xl"><div className="mb-3 flex items-center justify-between"><div><p className="text-xs text-slate-500">Перевірка автомобіля</p><h2 className="font-extrabold">{verificationTarget.make} {verificationTarget.model}</h2></div><button type="button" onClick={()=>{setVerificationTarget(null);setRegistrationEvidence(null);setDriverLicenseEvidence(null);}} aria-label="Закрити"><X size={20}/></button></div><p className="mb-4 rounded-xl bg-blue-50 p-3 text-xs leading-5 text-blue-900">Завантажте техпаспорт і посвідчення водія. Маршрути не показують ці документи; рішення ухвалює уповноважений модератор.</p><label className="mb-3 block text-xs font-bold text-slate-600">Свідоцтво про реєстрацію<input required type="file" accept="image/jpeg,image/png,application/pdf" onChange={event=>setRegistrationEvidence(event.target.files?.[0]??null)} className="mt-1.5 block w-full rounded-xl border border-slate-200 p-2 text-xs"/></label><label className="block text-xs font-bold text-slate-600">Посвідчення водія<input required type="file" accept="image/jpeg,image/png,application/pdf" onChange={event=>setDriverLicenseEvidence(event.target.files?.[0]??null)} className="mt-1.5 block w-full rounded-xl border border-slate-200 p-2 text-xs"/></label><p className="mt-2 text-[10px] text-slate-500">JPEG, PNG або PDF · до 8 МБ на файл</p><button disabled={busy} className="mt-4 w-full rounded-xl bg-blue-600 py-3.5 font-bold text-white disabled:opacity-50">{busy?'Завантажуємо…':'Передати на перевірку'}</button></form></div>}
    {reviewingRecord&&<div className="fixed inset-0 z-[60] flex items-end justify-center bg-slate-950/50 p-3 sm:items-center"><section className="w-full max-w-lg rounded-[1.7rem] bg-white p-4 shadow-2xl"><div className="mb-3 flex items-center justify-between"><div><p className="text-[10px] font-bold uppercase tracking-wide text-blue-600">Перегляд документа</p><h2 className="font-extrabold">{reviewingRecord.display_name} · {reviewingRecord.verification_type==='vehicle'?'Техпаспорт':reviewingRecord.verification_type==='driver_license'?'Посвідчення водія':'Документ'}</h2></div><button onClick={()=>{setReviewingRecord(null);setReviewEvidenceUrl('');}} aria-label="Закрити"><X size={20}/></button></div><iframe title="Документ водія для перевірки" src={reviewEvidenceUrl} className="h-[48svh] w-full rounded-xl border border-slate-200 bg-slate-50"/><label className="mt-3 block text-xs font-bold text-slate-600">Причина відмови — обов’язкова для відхилення<textarea value={reviewNote} onChange={event=>setReviewNote(event.target.value)} maxLength={1000} className="mt-1.5 min-h-16 w-full rounded-xl border border-slate-200 p-3 text-sm font-normal" placeholder="Коротко опишіть невідповідність"/></label><div className="mt-3 grid grid-cols-2 gap-2"><button disabled={busy} onClick={()=>void decideVerification('rejected')} className="rounded-xl border border-rose-200 py-3 text-xs font-bold text-rose-700 disabled:opacity-50">Відхилити</button><button disabled={busy} onClick={()=>void decideVerification('approved')} className="rounded-xl bg-emerald-600 py-3 text-xs font-bold text-white disabled:opacity-50">Схвалити документ</button></div></section></div>}
  </main>;
}

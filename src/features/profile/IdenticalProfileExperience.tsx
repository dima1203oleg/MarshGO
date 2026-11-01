import React, { useEffect, useState } from 'react';
import { ArrowLeft, Bell, Car, ChevronRight, Download, FileCheck2, HelpCircle, LogOut, MessageCircle, Moon, Settings, Shield, ShieldCheck, Sun, Ticket, Trash2, UserRound } from 'lucide-react';
import { themeService, type ThemeMode } from '../../services/theme';
import type { ApiAccountDeletionRequest, ApiUser, ApiVehicle, ApiVehiclePhoto, ApiVerificationRecord } from '../../services/productionApi';

export type ProfileView = 'main' | 'menu' | 'vehicle' | 'verification' | 'settings' | 'edit-profile' | 'reputation' | 'saved' | 'payments' | 'messages' | 'help' | 'security';

interface IdenticalProfileExperienceProps {
  user: ApiUser;
  vehicles: ApiVehicle[];
  vehiclePhotos?: Record<string, ApiVehiclePhoto[]>;
  records: ApiVerificationRecord[];
  currentView?: ProfileView;
  onViewChange?: (view: ProfileView) => void;
  onLogout: () => void;
  onLogoutAll?: () => Promise<void>;
  onDownloadData?: () => void;
  onRequestDeletion?: () => void;
  deletionRequest?: ApiAccountDeletionRequest | null;
  onCancelDeletion?: () => void;
  onNavigateToTrips?: () => void;
  onNavigateToDemands?: () => void;
  onNavigateToOffers?: () => void;
  onNavigateToChat?: () => void;
  onOpenNotifications?: () => void;
  onAddVehicle?: () => void;
  onVerifyVehicle?: (vehicle: ApiVehicle) => void;
  onUpdateUser?: (updated: Partial<ApiUser>) => void;
}

const viewLabels: Record<ProfileView, string> = {
  main: 'Профіль', menu: 'Меню профілю', vehicle: 'Мої автомобілі', verification: 'Документи та перевірка',
  settings: 'Налаштування та вигляд', 'edit-profile': 'Особисті дані', reputation: 'Репутація', saved: 'Збережене',
  payments: 'Способи оплати', messages: 'Повідомлення', help: 'Допомога', security: 'Безпека',
};

function initials(name: string): string {
  return name.trim().split(/\s+/).slice(0, 2).map((part) => part[0] ?? '').join('').toLocaleUpperCase('uk-UA') || 'M';
}

function verificationLabel(record: ApiVerificationRecord): string {
  const types: Record<ApiVerificationRecord['verification_type'], string> = {
    vehicle: 'Документ автомобіля', driver_license: 'Посвідчення водія', identity: 'Особистість', commercial: 'Комерційний дозвіл',
  };
  return types[record.verification_type];
}

function statusLabel(status: string): string {
  const values: Record<string, string> = { pending: 'На перевірці', approved: 'Підтверджено', rejected: 'Потрібне виправлення', verified: 'Підтверджено', active: 'Активний', inactive: 'Неактивний' };
  return values[status] ?? status;
}

export const IdenticalProfileExperience: React.FC<IdenticalProfileExperienceProps> = ({
  user, vehicles, vehiclePhotos = {}, records, currentView, onViewChange, onLogout, onLogoutAll, onDownloadData,
  onRequestDeletion, deletionRequest, onCancelDeletion, onNavigateToTrips, onNavigateToDemands,
  onNavigateToOffers, onNavigateToChat, onOpenNotifications, onAddVehicle, onVerifyVehicle,
}) => {
  const [internalView, setInternalView] = useState<ProfileView>(currentView ?? 'main');
  const view = currentView ?? internalView;
  const [theme, setTheme] = useState<ThemeMode>(themeService.getTheme());
  const [logoutAllBusy, setLogoutAllBusy] = useState(false);

  useEffect(() => {
    if (currentView) setInternalView(currentView);
  }, [currentView]);
  useEffect(() => themeService.subscribe((next) => setTheme(next)), []);

  const navigate = (next: ProfileView) => {
    setInternalView(next);
    onViewChange?.(next);
  };

  const header = (
    <header className="mb-4 flex items-center justify-between rounded-3xl border border-[#E3EBF4] bg-white px-4 py-3 shadow-sm dark:border-slate-800 dark:bg-[#101E38]">
      {view === 'main' ? <div className="flex items-center gap-2"><span className="grid h-9 w-9 place-items-center rounded-xl bg-blue-600 font-black text-white">M</span><div><b className="block text-sm text-slate-900 dark:text-white">MARSHGO</b><span className="text-[10px] text-slate-500">Розумні поїздки · Україна</span></div></div> : <button type="button" onClick={() => navigate('main')} aria-label="Назад до профілю" className="grid h-10 w-10 place-items-center rounded-full bg-slate-50 text-blue-700 dark:bg-slate-800 dark:text-blue-300"><ArrowLeft size={19} /></button>}
      <div className="flex items-center gap-2">{view !== 'main' && <h1 className="text-sm font-black text-slate-900 dark:text-white">{viewLabels[view]}</h1>}<button type="button" onClick={onNavigateToChat} aria-label="Повідомлення" className="grid h-10 w-10 place-items-center rounded-full bg-slate-50 text-slate-600 dark:bg-slate-800 dark:text-slate-200"><MessageCircle size={18} /></button><button type="button" aria-label="Сповіщення" onClick={onOpenNotifications} className="grid h-10 w-10 place-items-center rounded-full bg-slate-50 text-slate-600 dark:bg-slate-800 dark:text-slate-200"><Bell size={18} /></button></div>
    </header>
  );

  return (
    <main className={`profile-experience min-h-[70svh] bg-[#F5F8FD] px-4 pb-28 pt-[max(4.75rem,calc(env(safe-area-inset-top)+2rem))] dark:bg-[#08121f]`}>
      <div className="mx-auto max-w-xl">{view !== 'main' && header}
        {view === 'main' && <>
          <div className="mb-3 flex items-center justify-between px-1">
            <h1 className="text-2xl font-black tracking-tight text-slate-950 dark:text-white">Профіль</h1>
            <button type="button" onClick={onOpenNotifications} aria-label="Сповіщення" className="grid h-10 w-10 place-items-center rounded-full border border-[#E3EBF4] bg-white text-slate-600 shadow-sm dark:border-slate-700 dark:bg-[#101E38] dark:text-slate-200"><Bell size={18} /></button>
          </div>
          <section className="mb-2 flex flex-col items-center px-3 py-2 text-center">
            {user.driver_photo_url ? <img src={user.driver_photo_url} alt="Фото профілю" className="h-16 w-16 rounded-full object-cover ring-4 ring-slate-100 dark:ring-slate-800" /> : <div aria-hidden="true" className="grid h-16 w-16 place-items-center rounded-full bg-blue-50 text-xl font-black text-blue-700 ring-4 ring-slate-100 dark:bg-blue-950 dark:text-blue-300 dark:ring-slate-800">{initials(user.display_name)}</div>}
            <h2 className="mt-1.5 truncate text-base font-black text-slate-950 dark:text-white">{user.display_name}</h2>
            <p className="mt-0.5 text-[11px] text-slate-500">{user.phone_e164}</p>
            <span className={`mt-1.5 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[9px] font-bold ${user.is_verified ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300' : 'bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300'}`}><ShieldCheck size={12} />{user.is_verified ? 'Підтверджено' : 'Профіль не підтверджено'}</span>
          </section>

          <section className="divide-y divide-slate-100 overflow-hidden rounded-3xl border border-[#E3EBF4] bg-white shadow-sm dark:divide-slate-800 dark:border-slate-800 dark:bg-[#101E38]">
            <MenuRow icon={<UserRound />} title="Особисті дані" subtitle="Ім’я, телефон і профіль" tone="blue" onClick={() => navigate('edit-profile')} />
            <MenuRow icon={<Car />} title="Мій транспорт" subtitle={vehicles.length ? `${vehicles.length} автомобілів` : 'Автомобілі та документи'} tone="blue" onClick={() => navigate('vehicle')} />
            <MenuRow icon={<ShieldCheck />} title="Верифікація" subtitle={records.length ? `${records.length} записів перевірки` : 'Підтвердження документів'} tone="green" onClick={() => navigate('verification')} />
            <MenuRow icon={<Ticket />} title="Платежі та гаманець" subtitle="Способи оплати й розрахунки" tone="amber" onClick={() => navigate('payments')} />
            <MenuRow icon={<Ticket />} title="Мої поїздки" subtitle="Бронювання та історія" tone="blue" onClick={onNavigateToTrips ?? (() => navigate('menu'))} />
            {user.roles.includes('driver') && <MenuRow icon={<Car />} title="Мої пропозиції" subtitle="Опубліковані поїздки" tone="green" onClick={onNavigateToOffers ?? (() => navigate('menu'))} />}
            <MenuRow icon={<UserRound />} title="Мої заявки" subtitle="Пасажирські запити" tone="rose" onClick={onNavigateToDemands ?? (() => navigate('menu'))} />
            <MenuRow icon={<Ticket />} title="Збережені маршрути" subtitle="Обрані поїздки" tone="blue" onClick={() => navigate('saved')} />
            <MenuRow icon={<Bell />} title="Сповіщення" subtitle="Оновлення поїздок і заявок" tone="amber" onClick={onOpenNotifications ?? (() => navigate('messages'))} />
            <MenuRow icon={<Settings />} title="Налаштування" subtitle="Тема та параметри застосунку" tone="blue" onClick={() => navigate('settings')} />
            <MenuRow icon={<HelpCircle />} title="Допомога" subtitle="Підтримка та безпека поїздки" tone="rose" onClick={() => navigate('help')} />
            <MenuRow icon={<Shield />} title="Безпека та приватність" subtitle="Експорт і видалення даних" tone="blue" onClick={() => navigate('security')} />
          </section>
        </>}

        {view === 'vehicle' && <section className="space-y-3"><div><h1 className="text-2xl font-black text-slate-950 dark:text-white">Мій транспорт</h1><p className="mt-1 text-xs text-slate-500">Автомобілі та перевірка документів</p></div>{vehicles.length ? vehicles.map((vehicle) => <VehicleRow key={vehicle.id} vehicle={vehicle} photos={vehiclePhotos[vehicle.id] ?? []} onVerify={onVerifyVehicle} detailed />) : <EmptyPanel text="До акаунта ще не додано автомобілів." />}<button onClick={onAddVehicle} className="w-full rounded-2xl bg-blue-600 py-3.5 font-bold text-white">Додати автомобіль</button></section>}

        {view === 'verification' && <section className="space-y-3">{records.length ? records.map((record) => <article key={record.id} className="rounded-2xl border border-[#E3EBF4] bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-[#101E38]"><div className="flex items-center justify-between gap-3"><div className="flex items-center gap-3"><span className="grid h-10 w-10 place-items-center rounded-xl bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300"><FileCheck2 size={19} /></span><div><b className="text-sm text-slate-900 dark:text-white">{verificationLabel(record)}</b><p className="mt-1 text-xs text-slate-500">Подано {new Intl.DateTimeFormat('uk-UA', { dateStyle: 'medium' }).format(new Date(record.created_at))}</p></div></div><span className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-bold text-slate-600 dark:bg-slate-800 dark:text-slate-300">{statusLabel(record.status)}</span></div>{record.review_note && <p className="mt-3 text-xs text-slate-600 dark:text-slate-300">{record.review_note}</p>}</article>) : <EmptyPanel text="Записів про перевірку документів немає." />}</section>}

        {view === 'settings' && <section className="rounded-3xl border border-[#E3EBF4] bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-[#101E38]"><h2 className="mb-1 text-lg font-black text-slate-900 dark:text-white">Вигляд</h2><p className="mb-4 text-xs text-slate-500">Глобальна тема застосунку.</p><div className="space-y-2">{([{ mode: 'light', label: 'Світла', icon: <Sun size={18} /> }, { mode: 'dark', label: 'Темна', icon: <Moon size={18} /> }, { mode: 'system', label: 'Як у системі', icon: <Settings size={18} /> }] as const).map((item) => <button key={item.mode} type="button" aria-pressed={theme === item.mode} onClick={() => themeService.setTheme(item.mode)} className={`flex w-full items-center justify-between rounded-2xl border p-4 text-sm font-bold ${theme === item.mode ? 'border-blue-500 bg-blue-50 text-blue-800 dark:bg-blue-950/40 dark:text-blue-200' : 'border-slate-200 text-slate-700 dark:border-slate-700 dark:text-slate-200'}`}><span className="flex items-center gap-3">{item.icon}{item.label}</span><span className={`h-4 w-4 rounded-full border-2 ${theme === item.mode ? 'border-blue-600 bg-blue-600 ring-2 ring-blue-200 dark:ring-blue-900' : 'border-slate-300'}`} /></button>)}</div></section>}

        {view === 'security' && <section className="space-y-3"><article className="rounded-2xl border border-[#E3EBF4] bg-white p-4 dark:border-slate-800 dark:bg-[#101E38]"><h2 className="font-black text-slate-900 dark:text-white">Ваші дані</h2><p className="mt-1 text-xs leading-5 text-slate-500">Завантажте копію даних акаунта або надішліть запит на його видалення.</p><button type="button" onClick={onDownloadData} className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 py-3 text-sm font-bold text-slate-700 dark:border-slate-700 dark:text-slate-200"><Download size={16} />Завантажити мої дані</button></article>
          {deletionRequest ? <article className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-amber-900 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-200"><b className="text-sm">Запит на видалення: {statusLabel(deletionRequest.status)}</b>{deletionRequest.cooling_off_until && <p className="mt-1 text-xs">Очікування до {new Intl.DateTimeFormat('uk-UA', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(deletionRequest.cooling_off_until))}</p>}{deletionRequest.status === 'cooling_off' && <button type="button" onClick={onCancelDeletion} className="mt-3 rounded-xl bg-white px-4 py-2 text-xs font-bold text-slate-700 dark:bg-slate-800 dark:text-slate-100">Скасувати запит</button>}</article> : <button type="button" onClick={onRequestDeletion} className="flex w-full items-center justify-center gap-2 rounded-2xl border border-rose-200 bg-rose-50 py-3.5 text-sm font-bold text-rose-700 dark:border-rose-900 dark:bg-rose-950/30 dark:text-rose-300"><Trash2 size={17} />Подати запит на видалення</button>}
          <button type="button" onClick={async () => { if (!onLogoutAll || logoutAllBusy) return; setLogoutAllBusy(true); try { await onLogoutAll(); } finally { setLogoutAllBusy(false); } }} disabled={!onLogoutAll || logoutAllBusy} className="w-full rounded-2xl border border-slate-200 bg-white py-3 text-sm font-bold text-slate-700 disabled:opacity-50 dark:border-slate-700 dark:bg-[#101E38] dark:text-slate-200">{logoutAllBusy ? 'Завершуємо сесії…' : 'Вийти з усіх пристроїв'}</button>
          <button type="button" onClick={onLogout} className="flex w-full items-center justify-center gap-2 rounded-2xl bg-rose-600 py-3.5 text-sm font-bold text-white"><LogOut size={17} />Вийти з акаунта</button>
        </section>}

        {['edit-profile', 'reputation', 'saved', 'payments', 'messages', 'help', 'menu'].includes(view) && <section className="rounded-3xl border border-[#E3EBF4] bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-[#101E38]"><h2 className="font-black text-slate-900 dark:text-white">{viewLabels[view]}</h2><p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">Для цього розділу сервер поки не надав даних або активної операції. Жодних прикладів чи тестових записів тут не показуємо.</p>{view === 'messages' && <button type="button" onClick={onNavigateToChat} className="mt-4 rounded-xl bg-blue-600 px-4 py-3 text-sm font-bold text-white">Відкрити повідомлення</button>}{view === 'menu' && <button type="button" onClick={() => navigate('main')} className="mt-4 rounded-xl bg-blue-600 px-4 py-3 text-sm font-bold text-white">До профілю</button>}</section>}
      </div>
    </main>
  );
};

function VehicleRow({ vehicle, photos = [], onVerify, detailed = false }: { vehicle: ApiVehicle; photos?: ApiVehiclePhoto[]; onVerify?: (vehicle: ApiVehicle) => void; detailed?: boolean }) {
  const orderedPhotos = [...photos].sort((a, b) => a.sort_order - b.sort_order);
  const primaryPhoto = photos.find((photo) => photo.is_primary) ?? orderedPhotos[0];
  const isVerified = ['verified', 'approved'].includes(vehicle.verification_status.toLocaleLowerCase('uk-UA'));
  const verificationTone = isVerified
    ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300'
    : vehicle.verification_status.toLocaleLowerCase('uk-UA') === 'pending'
      ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300'
      : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300';
  return <article className={`overflow-hidden rounded-2xl border border-[#E3EBF4] bg-white shadow-sm dark:border-slate-800 dark:bg-[#101E38] ${detailed ? '' : 'flex items-center gap-3 p-3'}`}>
    {detailed ? <div className="relative h-44 bg-gradient-to-br from-slate-100 to-blue-50 dark:from-slate-900 dark:to-slate-800">{primaryPhoto ? <img src={primaryPhoto.url} alt={`${vehicle.make} ${vehicle.model}`} className="h-full w-full object-cover" /> : <div className="flex h-full flex-col items-center justify-center gap-2 text-slate-400"><Car size={42} /><span className="text-xs font-semibold">Фото автомобіля не додано</span></div>}<span className={`absolute left-3 top-3 rounded-full px-3 py-1.5 text-[10px] font-extrabold ${verificationTone}`}>{statusLabel(vehicle.verification_status)}</span></div> : <span className="h-14 w-[4.5rem] shrink-0 overflow-hidden rounded-xl bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300">{primaryPhoto ? <img src={primaryPhoto.url} alt={`${vehicle.make} ${vehicle.model}`} className="h-full w-full object-cover" /> : <span className="grid h-full w-full place-items-center"><Car size={23} /></span>}</span>}
    {detailed && orderedPhotos.length > 1 && <div className="no-scrollbar flex gap-2 overflow-x-auto px-3 pt-3">{orderedPhotos.slice(0, 4).map((photo, index) => <img key={photo.id} src={photo.url} alt={`${vehicle.make} ${vehicle.model}, фото ${index + 1}`} className="h-14 w-20 shrink-0 rounded-xl object-cover" loading="lazy" />)}</div>}
      <div className={`${detailed ? 'p-4' : 'min-w-0 flex-1'}`}>
      <div className="flex items-start justify-between gap-2"><div className="min-w-0"><b className="block truncate text-sm text-slate-900 dark:text-white">{vehicle.make} {vehicle.model} · {vehicle.model_year}</b><p className="mt-1 text-xs text-slate-500">{vehicle.plate || 'Номер не вказано'} · {vehicle.seat_count} місць</p>{!detailed && <span className={`mt-1 inline-flex rounded-full px-2 py-0.5 text-[9px] font-extrabold ${verificationTone}`}>{statusLabel(vehicle.verification_status)}</span>}</div>{!detailed && <ChevronRight size={17} className="mt-1 shrink-0 text-slate-400" />}</div>
      {detailed && <div className="mt-3 grid grid-cols-2 gap-2 text-xs"><span className="rounded-xl bg-slate-50 p-3 dark:bg-slate-900"><span className="block text-slate-400">Пасажири</span><b className="mt-1 block text-slate-800 dark:text-white">{vehicle.seat_count} місць</b></span><span className="rounded-xl bg-slate-50 p-3 dark:bg-slate-900"><span className="block text-slate-400">Статус авто</span><b className="mt-1 block text-slate-800 dark:text-white">{vehicle.is_active ? 'Активний' : 'Неактивний'}</b></span></div>}
      {onVerify && !isVerified && vehicle.verification_status.toLocaleLowerCase('uk-UA') !== 'pending' && <button type="button" onClick={() => onVerify(vehicle)} className={`${detailed ? 'mt-3' : 'mt-2'} w-full rounded-xl bg-[#1769ED] px-3 py-2.5 text-xs font-extrabold text-white`}>Передати документи на перевірку</button>}
    </div>
  </article>;
}

function MenuRow({ icon, title, subtitle, tone = 'blue', onClick }: { icon: React.ReactNode; title: string; subtitle: string; tone?: 'blue' | 'green' | 'emerald' | 'amber' | 'rose'; onClick: () => void }) {
  const toneClasses = {
    blue: 'bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300',
    green: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300',
    emerald: 'bg-green-50 text-green-700 dark:bg-green-950/50 dark:text-green-300',
    amber: 'bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300',
    rose: 'bg-rose-50 text-rose-700 dark:bg-rose-950/50 dark:text-rose-300',
  };
  return <button type="button" onClick={onClick} className="flex min-h-12 w-full items-center gap-2.5 px-2.5 py-1.5 text-left"><span className={`grid h-9 w-9 shrink-0 place-items-center rounded-xl ${toneClasses[tone]}`}>{icon}</span><span className="min-w-0 flex-1"><b className="block truncate text-xs font-bold text-slate-900 dark:text-white">{title}</b><span className="mt-0.5 block truncate text-[10px] leading-tight text-slate-500">{subtitle}</span></span><ChevronRight size={16} className="shrink-0 text-slate-400" /></button>;
}

function EmptyPanel({ text }: { text: string }) {
  return <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-5 text-center text-sm text-slate-500 dark:border-slate-700 dark:bg-[#101E38]">{text}</div>;
}

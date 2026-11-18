import { useState } from 'react';
import {
  ArrowLeft,
  Bell,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Clock3,
  Download,
  FileText,
  Globe,
  LogOut,
  Moon,
  Shield,
  Trash2,
  XCircle,
} from 'lucide-react';
import { MapLayerSwitch } from '../components/MapLayerSwitch';
import { ThemeToggle } from '../components/ThemeToggle';
import type { ApiAccountDeletionRequest, ApiVehicle, ApiVerificationRecord } from '../services/productionApi';

export type ProfileSection = 'documents' | 'settings' | 'help';

const statusMeta = {
  approved: { label: 'Підтверджено', tone: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300', Icon: CheckCircle2 },
  pending: { label: 'На перевірці', tone: 'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300', Icon: Clock3 },
  rejected: { label: 'Відхилено', tone: 'bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300', Icon: XCircle },
} as const;

const typeLabel: Record<ApiVerificationRecord['verification_type'], string> = {
  vehicle: 'Техпаспорт авто',
  driver_license: 'Посвідчення водія',
  identity: 'Особа',
  commercial: 'Комерційний перевізник',
};

const dateFormat = new Intl.DateTimeFormat('uk-UA', { dateStyle: 'medium', timeZone: 'Europe/Kyiv' });

const faq: Array<[string, string]> = [
  ['Як забронювати місце?', 'Знайдіть поїздку на головній, відкрийте її та натисніть «Забронювати місце». Підтвердження з’явиться у вкладці «Поїздки».'],
  ['Як працює квиток для посадки?', 'У «Поїздках» натисніть «Показати квиток для посадки». Водій скануватиме QR або вставить підписаний токен, коли ви сядете.'],
  ['Коли відкривається обмін місцем?', 'За 15 хвилин до запланованого виїзду. До цього кнопка неактивна.'],
  ['Як скасувати бронювання?', 'У «Поїздках» натисніть «Скасувати» біля потрібної поїздки. Місце повернеться водієві автоматично.'],
  ['Як стати водієм?', 'У профілі увімкніть роль водія, додайте авто з фото та подайте документи. Після перевірки модератором можна публікувати поїздки.'],
  ['Як заблокувати користувача або поскаржитися?', 'Відкрийте чат із бронювання: угорі є кнопки «Поскаржитися» та «Заблокувати співрозмовника».'],
  ['Як отримати або видалити мої дані?', 'У налаштуваннях: «Завантажити мої дані» та «Подати запит на видалення». Видалення має період очікування з можливістю скасування.'],
];

export function ProfileSections({
  section,
  onBack,
  vehicles,
  records,
  onLogoutAll,
  onDownloadData,
  onRequestDeletion,
  deletionRequest,
  onCancelDeletion,
  onLogout,
}: {
  section: ProfileSection;
  onBack: () => void;
  vehicles: ApiVehicle[];
  records: ApiVerificationRecord[];
  onLogoutAll: () => Promise<void>;
  onDownloadData?: () => void;
  onRequestDeletion?: () => void;
  deletionRequest?: ApiAccountDeletionRequest | null;
  onCancelDeletion?: () => void;
  onLogout?: () => void;
}) {
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const [expandedSetting, setExpandedSetting] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState('');

  const title = {
    documents: 'Документи',
    settings: 'Налаштування та конфіденційність',
    help: 'Допомога',
  }[section];

  const vehicleName = (id: string | null) => {
    const v = vehicles.find((item) => item.id === id);
    return v ? `${v.make} ${v.model}` : null;
  };

  const toggleSetting = (key: string) => {
    setExpandedSetting((prev) => (prev === key ? null : key));
  };

  return (
    <div className="mx-auto w-full max-w-xl px-5 pb-8">
      {/* Header with back arrow */}
      <div className="mb-4 flex items-center gap-3 pt-1">
        <button
          onClick={onBack}
          aria-label="Назад до профілю"
          className="grid h-10 w-10 place-items-center rounded-full border border-slate-200/80 dark:border-white/10 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 shadow-2xs hover:bg-slate-50 transition"
        >
          <ArrowLeft size={18} />
        </button>
        <h1 className="text-lg font-black text-[#0B1730] dark:text-white">{title}</h1>
      </div>

      {/* 1. DOCUMENTS SECTION */}
      {section === 'documents' && (
        <div className="space-y-3">
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Статус перевірки ваших документів і авто. Нові документи можна подати в розділі «Мій автомобіль».
          </p>
          {records.length === 0 ? (
            <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-[#101E38] p-5 text-center text-sm text-slate-500 shadow-2xs">
              Документів ще не подано. Додайте авто в профілі та натисніть «Подати документи».
            </div>
          ) : (
            records.map((record) => {
              const meta = statusMeta[record.status];
              const car = vehicleName(record.vehicle_id);
              return (
                <article
                  key={record.id}
                  className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-[#101E38] p-4 shadow-2xs"
                >
                  <div className="flex items-center justify-between gap-2">
                    <b className="text-sm text-[#0B1730] dark:text-white">
                      {typeLabel[record.verification_type]}
                    </b>
                    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-bold ${meta.tone}`}>
                      <meta.Icon size={12} />
                      {meta.label}
                    </span>
                  </div>
                  {car && <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{car}</p>}
                  <p className="mt-1 text-[11px] text-slate-400">
                    Подано {dateFormat.format(new Date(record.created_at))}
                    {record.reviewed_at ? ` · перевірено ${dateFormat.format(new Date(record.reviewed_at))}` : ''}
                  </p>
                  {record.status === 'rejected' && record.review_note && (
                    <p className="mt-2 rounded-xl bg-rose-50 dark:bg-rose-950/40 p-2.5 text-xs text-rose-700 dark:text-rose-300">
                      Причина: {record.review_note}
                    </p>
                  )}
                </article>
              );
            })
          )}
        </div>
      )}

      {/* 2. SETTINGS & PRIVACY (MOCKUP #2 EXACT ALIGNMENT) */}
      {section === 'settings' && (
        <div className="space-y-4">
          {/* GROUP 1: Загальні */}
          <div>
            <h2 className="mb-2 px-1 text-[12px] font-bold text-[#65748B] dark:text-slate-400">
              Загальні
            </h2>
            <div className="overflow-hidden rounded-2xl border border-[#E3EAF2] dark:border-slate-800 bg-white dark:bg-[#101E38] shadow-2xs divide-y divide-slate-100 dark:divide-slate-800/80">
              {/* Theme */}
              <div className="transition hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                <button
                  type="button"
                  onClick={() => toggleSetting('theme')}
                  className="flex w-full items-center justify-between p-3.5 text-left"
                >
                  <div className="flex items-center gap-3">
                    <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-[#F3E8FF] dark:bg-purple-950/50 text-[#9333EA] dark:text-purple-300">
                      <Moon size={18} className="stroke-[2.2]" />
                    </span>
                    <div>
                      <span className="block text-[14px] font-extrabold text-[#0B1730] dark:text-white leading-tight">
                        Тема
                      </span>
                      <span className="mt-0.5 block text-[11px] text-[#65748B] dark:text-slate-400">
                        Світла, темна або як у системі
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 text-[12px] font-medium text-slate-500">
                    <span>Як у системі</span>
                    <ChevronRight size={16} className={`text-slate-400 transition-transform ${expandedSetting === 'theme' ? 'rotate-90' : ''}`} />
                  </div>
                </button>
                {expandedSetting === 'theme' && (
                  <div className="px-4 pb-3.5 pt-1">
                    <ThemeToggle variant="segmented" />
                  </div>
                )}
              </div>

              {/* Map display mode */}
              <div className="p-3.5">
                <span className="mb-2 block text-[14px] font-extrabold text-[#0B1730] dark:text-white">Режим карти</span>
                <MapLayerSwitch className="w-full justify-center" />
              </div>

              {/* Notifications */}
              <div className="transition hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                <button
                  type="button"
                  onClick={() => toggleSetting('notifications')}
                  className="flex w-full items-center justify-between p-3.5 text-left"
                >
                  <div className="flex items-center gap-3">
                    <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-[#FEE2E2] dark:bg-rose-950/50 text-[#EF4444] dark:text-rose-300">
                      <Bell size={18} className="stroke-[2.2]" />
                    </span>
                    <div>
                      <span className="block text-[14px] font-extrabold text-[#0B1730] dark:text-white leading-tight">
                        Сповіщення
                      </span>
                      <span className="mt-0.5 block text-[11px] text-[#65748B] dark:text-slate-400">
                        Керуйте push-сповіщеннями
                      </span>
                    </div>
                  </div>
                  <ChevronRight size={16} className={`text-slate-400 transition-transform ${expandedSetting === 'notifications' ? 'rotate-90' : ''}`} />
                </button>
                {expandedSetting === 'notifications' && (
                  <div className="px-4 pb-3.5 pt-1 text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                    Сповіщення про нові пропозиції, зміну часу поїздки та повідомлення від водія активовані автоматично.
                  </div>
                )}
              </div>

              {/* Language */}
              <div className="transition hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                <button
                  type="button"
                  onClick={() => toggleSetting('language')}
                  className="flex w-full items-center justify-between p-3.5 text-left"
                >
                  <div className="flex items-center gap-3">
                    <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-[#DCFCE7] dark:bg-emerald-950/50 text-[#15803D] dark:text-emerald-300">
                      <Globe size={18} className="stroke-[2.2]" />
                    </span>
                    <div>
                      <span className="block text-[14px] font-extrabold text-[#0B1730] dark:text-white leading-tight">
                        Мова
                      </span>
                      <span className="mt-0.5 block text-[11px] text-[#65748B] dark:text-slate-400">
                        Мова додатку
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 text-[12px] font-medium text-slate-500">
                    <span>Українська</span>
                    <ChevronRight size={16} className={`text-slate-400 transition-transform ${expandedSetting === 'language' ? 'rotate-90' : ''}`} />
                  </div>
                </button>
                {expandedSetting === 'language' && (
                  <div className="px-4 pb-3.5 pt-1 text-xs text-slate-500 dark:text-slate-400">
                    Наразі встановлена офіційна українська локалізація.
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* GROUP 2: Безпека */}
          <div>
            <h2 className="mb-2 px-1 text-[12px] font-bold text-[#65748B] dark:text-slate-400">
              Безпека
            </h2>
            <div className="overflow-hidden rounded-2xl border border-[#E3EAF2] dark:border-slate-800 bg-white dark:bg-[#101E38] shadow-2xs divide-y divide-slate-100 dark:divide-slate-800/80">
              <div className="transition hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                <button
                  type="button"
                  onClick={() => toggleSetting('security')}
                  className="flex w-full items-center justify-between p-3.5 text-left"
                >
                  <div className="flex items-center gap-3">
                    <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-[#EAF2FF] dark:bg-blue-950/50 text-[#175CD3] dark:text-blue-300">
                      <Shield size={18} className="stroke-[2.2]" />
                    </span>
                    <div>
                      <span className="block text-[14px] font-extrabold text-[#0B1730] dark:text-white leading-tight">
                        Безпека входу
                      </span>
                      <span className="mt-0.5 block text-[11px] text-[#65748B] dark:text-slate-400">
                        Пароль, біометрія та інші налаштування
                      </span>
                    </div>
                  </div>
                  <ChevronRight size={16} className={`text-slate-400 transition-transform ${expandedSetting === 'security' ? 'rotate-90' : ''}`} />
                </button>
                {expandedSetting === 'security' && (
                  <div className="px-4 pb-3.5 pt-1">
                    <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">
                      Завершити сесії на всіх інших пристроях. Для повторного входу знадобиться номер телефону.
                    </p>
                    <button
                      disabled={busy}
                      onClick={async () => {
                        setBusy(true);
                        setNote('');
                        try {
                          await onLogoutAll();
                        } catch {
                          setNote('Не вдалося завершити сесії. Спробуйте ще раз.');
                          setBusy(false);
                        }
                      }}
                      className="w-full rounded-xl border border-rose-200 dark:border-rose-900/40 bg-rose-50/60 dark:bg-rose-950/30 py-2.5 text-xs font-bold text-rose-700 dark:text-rose-300 disabled:opacity-50"
                    >
                      {busy ? 'Завершуємо…' : 'Вийти на всіх пристроях'}
                    </button>
                    {note && <p role="status" className="mt-2 text-xs text-rose-700">{note}</p>}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* GROUP 3: Дані та документи */}
          <div>
            <h2 className="mb-2 px-1 text-[12px] font-bold text-[#65748B] dark:text-slate-400">
              Дані та документи
            </h2>
            <div className="overflow-hidden rounded-2xl border border-[#E3EAF2] dark:border-slate-800 bg-white dark:bg-[#101E38] shadow-2xs divide-y divide-slate-100 dark:divide-slate-800/80">
              {/* Documents */}
              <button
                type="button"
                onClick={() => toggleSetting('documents_preview')}
                className="flex w-full items-center justify-between p-3.5 text-left transition hover:bg-slate-50/50 dark:hover:bg-slate-800/40"
              >
                <div className="flex items-center gap-3">
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-[#F1F5F9] dark:bg-slate-800 text-[#475569] dark:text-slate-300">
                    <FileText size={18} className="stroke-[2.2]" />
                  </span>
                  <div>
                    <span className="block text-[14px] font-extrabold text-[#0B1730] dark:text-white leading-tight">
                      Документи
                    </span>
                    <span className="mt-0.5 block text-[11px] text-[#65748B] dark:text-slate-400">
                      Статус перевірки документів і авто
                    </span>
                  </div>
                </div>
                <ChevronRight size={16} className={`text-slate-400 transition-transform ${expandedSetting === 'documents_preview' ? 'rotate-90' : ''}`} />
              </button>
              {expandedSetting === 'documents_preview' && (
                <div className="px-4 pb-3.5 pt-1 text-xs text-slate-500 dark:text-slate-400">
                  {records.length > 0 ? (
                    <div className="space-y-1.5 pt-1">
                      {records.map((r) => (
                        <div key={r.id} className="flex items-center justify-between">
                          <span>{typeLabel[r.verification_type]}</span>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${statusMeta[r.status].tone}`}>
                            {statusMeta[r.status].label}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    'Документи водія ще не завантажені.'
                  )}
                </div>
              )}

              {/* Download My Data */}
              <button
                type="button"
                onClick={() => onDownloadData?.()}
                className="flex w-full items-center justify-between p-3.5 text-left transition hover:bg-slate-50/50 dark:hover:bg-slate-800/40"
              >
                <div className="flex items-center gap-3">
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-[#EAF2FF] dark:bg-blue-950/50 text-[#175CD3] dark:text-blue-300">
                    <Download size={18} className="stroke-[2.2]" />
                  </span>
                  <div>
                    <span className="block text-[14px] font-extrabold text-[#0B1730] dark:text-white leading-tight">
                      Завантажити мої дані
                    </span>
                    <span className="mt-0.5 block text-[11px] text-[#65748B] dark:text-slate-400">
                      Копія профілю, автомобілів, бронювань і заявок
                    </span>
                  </div>
                </div>
                <ChevronRight size={16} className="text-slate-400" />
              </button>
            </div>
          </div>

          {/* GROUP 4: Небезпечна зона */}
          <div>
            <h2 className="mb-2 px-1 text-[12px] font-bold text-[#65748B] dark:text-slate-400">
              Небезпечна зона
            </h2>
            <div className="overflow-hidden rounded-2xl border border-rose-100 dark:border-rose-950/40 bg-white dark:bg-[#101E38] shadow-2xs divide-y divide-rose-50 dark:divide-slate-800/80">
              {/* Account Deletion */}
              {deletionRequest && deletionRequest.status !== 'cancelled' && (
                <div className="p-3.5 text-xs leading-5 text-rose-800 dark:text-rose-200" role="status">
                  Запит має стан «{deletionRequest.status}».
                  {deletionRequest.cooling_off_until && ` Період очікування до ${dateFormat.format(new Date(deletionRequest.cooling_off_until))}.`}
                  {deletionRequest.status === 'cooling_off' && onCancelDeletion && (
                    <button type="button" onClick={onCancelDeletion} className="mt-2 block font-bold underline underline-offset-2">
                      Скасувати запит на видалення
                    </button>
                  )}
                </div>
              )}
              <button
                type="button"
                disabled={deletionRequest?.status === 'cooling_off' || deletionRequest?.status === 'processing' || deletionRequest?.status === 'completed'}
                onClick={() => onRequestDeletion?.()}
                className="flex w-full items-center justify-between p-3.5 text-left transition hover:bg-rose-50/30 disabled:cursor-not-allowed disabled:opacity-50 dark:hover:bg-rose-950/20"
              >
                <div className="flex items-center gap-3">
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-[#FEE2E2] dark:bg-rose-950/50 text-[#EF4444] dark:text-rose-300">
                    <Trash2 size={18} className="stroke-[2.2]" />
                  </span>
                  <div className="max-w-xs sm:max-w-md">
                    <span className="block text-[14px] font-extrabold text-rose-600 dark:text-rose-400 leading-tight">
                      Подати запит на видалення
                    </span>
                    <span className="mt-0.5 block text-[11px] text-[#65748B] dark:text-slate-400 line-clamp-2">
                      Запит відкриває період очікування з можливістю скасування. Фактичне видалення потребує окремої обробки даних.
                    </span>
                  </div>
                </div>
                <ChevronRight size={16} className="text-slate-400 shrink-0 ml-2" />
              </button>

              {/* Logout */}
              <button
                type="button"
                onClick={() => onLogout?.()}
                className="flex w-full items-center justify-between p-3.5 text-left transition hover:bg-rose-50/30 dark:hover:bg-rose-950/20"
              >
                <div className="flex items-center gap-3">
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-[#FEE2E2] dark:bg-rose-950/50 text-[#EF4444] dark:text-rose-300">
                    <LogOut size={18} className="stroke-[2.2]" />
                  </span>
                  <div>
                    <span className="block text-[14px] font-extrabold text-rose-600 dark:text-rose-400 leading-tight">
                      Вийти
                    </span>
                    <span className="mt-0.5 block text-[11px] text-[#65748B] dark:text-slate-400">
                      Вийти з поточного акаунта на цьому пристрої
                    </span>
                  </div>
                </div>
                <ChevronRight size={16} className="text-slate-400" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 3. HELP FAQ SECTION */}
      {section === 'help' && (
        <div className="space-y-2">
          {faq.map(([question, answer], index) => (
            <div
              key={question}
              className="overflow-hidden rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-[#101E38] shadow-2xs"
            >
              <button
                aria-expanded={openFaq === index}
                onClick={() => setOpenFaq(openFaq === index ? null : index)}
                className="flex w-full items-center justify-between gap-3 px-4 py-3.5 text-left"
              >
                <b className="text-sm text-[#0B1730] dark:text-white">{question}</b>
                <ChevronDown
                  size={17}
                  className={`shrink-0 text-slate-400 transition-transform ${openFaq === index ? 'rotate-180' : ''}`}
                />
              </button>
              {openFaq === index && (
                <p className="px-4 pb-4 text-xs leading-5 text-slate-600 dark:text-slate-300">
                  {answer}
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

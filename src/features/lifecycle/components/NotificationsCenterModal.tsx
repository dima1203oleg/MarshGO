import React, { useState } from 'react';
import {
  Bell,
  X,
} from 'lucide-react';
import type { V7Notification, NotificationCategory } from '../model/lifecycleTypes';

interface NotificationsCenterModalProps {
  onClose: () => void;
  onNavigateToScreen: (screen: V7Notification['actionScreen']) => void;
}

const DEFAULT_NOTIFICATIONS: V7Notification[] = [
  {
    id: 'notif-1',
    category: 'trips',
    title: 'Водій наближається',
    body: 'Андрій на Toyota Camry буде на Стрийській 45 через 4 хвилини.',
    time: '3 хв тому',
    isRead: false,
    actionLabel: 'Відкрити зустріч',
    actionScreen: 'rendezvous',
  },
  {
    id: 'notif-2',
    category: 'messages',
    title: 'Нове повідомлення від водія',
    body: '«Доброго дня! Я вже вирушаю з гаража. Буду о 18:25.»',
    time: '12 хв тому',
    isRead: false,
    actionLabel: 'Відкрити чат',
    actionScreen: 'chat',
  },
  {
    id: 'notif-3',
    category: 'trips',
    title: 'Бронювання підтверджене',
    body: 'Поїздка Львів → Київ, виїзд сьогодні о 18:30. 1 місце зафіксовано.',
    time: '35 хв тому',
    isRead: true,
    actionLabel: 'Відкрити поїздку',
    actionScreen: 'active_trip',
  },
  {
    id: 'notif-4',
    category: 'offers',
    title: 'Надійшла нова пропозиція',
    body: 'Водій Максим пропонує підвезти вас за 400 ₴ за маршрутом Львів → Київ.',
    time: '1 год тому',
    isRead: true,
    actionLabel: 'Переглянути',
    actionScreen: 'active_trip',
  },
  {
    id: 'notif-5',
    category: 'system',
    title: 'Оцініть попередню поїздку',
    body: 'Як минула поїздка з Києва до Житомира? Залиште короткий відгук.',
    time: 'Вчора',
    isRead: true,
    actionLabel: 'Залишити відгук',
    actionScreen: 'review',
  },
];

export const NotificationsCenterModal: React.FC<NotificationsCenterModalProps> = ({
  onClose,
  onNavigateToScreen,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<NotificationCategory>('all');
  const [notifications, setNotifications] = useState<V7Notification[]>(DEFAULT_NOTIFICATIONS);

  const filtered = selectedCategory === 'all'
    ? notifications
    : notifications.filter((n) => n.category === selectedCategory);

  const handleAction = (notif: V7Notification) => {
    // mark read
    setNotifications((prev) =>
      prev.map((n) => (n.id === notif.id ? { ...n, isRead: true } : n))
    );
    onNavigateToScreen(notif.actionScreen);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-950/60 backdrop-blur-sm p-0 sm:p-4 animate-in fade-in duration-200">
      <div className="relative flex max-h-[88svh] w-full max-w-md mx-auto flex-col rounded-t-[28px] sm:rounded-[28px] bg-white dark:bg-[#0B1730] shadow-2xl border border-slate-100 dark:border-slate-800 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 px-5 py-4">
          <div className="flex items-center gap-2">
            <Bell size={18} className="text-[#0866F5]" />
            <h2 className="text-base font-black text-[#081B35] dark:text-white">
              Сповіщення
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="grid h-8 w-8 place-items-center rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-800 dark:text-slate-300"
            aria-label="Закрити"
          >
            <X size={17} />
          </button>
        </div>

        {/* Categories Strip */}
        <div className="flex items-center gap-1.5 overflow-x-auto px-4 py-2.5 border-b border-slate-100 dark:border-slate-800 scrollbar-none">
          {[
            { id: 'all', label: 'Усі' },
            { id: 'trips', label: 'Поїздки' },
            { id: 'messages', label: 'Повідомлення' },
            { id: 'offers', label: 'Пропозиції' },
            { id: 'system', label: 'Система' },
          ].map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => setSelectedCategory(cat.id as NotificationCategory)}
              className={`shrink-0 rounded-full px-3.5 py-1 text-xs font-bold transition ${
                selectedCategory === cat.id
                  ? 'bg-[#0866F5] text-white shadow-sm'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Notifications List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2.5">
          {filtered.length === 0 ? (
            <div className="py-12 text-center text-slate-400">
              <Bell size={32} className="mx-auto mb-2 opacity-50" />
              <p className="text-xs font-bold">Немає сповіщень у цій категорії</p>
            </div>
          ) : (
            filtered.map((item) => (
              <div
                key={item.id}
                className={`rounded-2xl p-3.5 border transition ${
                  item.isRead
                    ? 'bg-white dark:bg-[#111e36] border-slate-100 dark:border-slate-800'
                    : 'bg-[#F4F8FF] dark:bg-blue-950/40 border-blue-200/80 dark:border-blue-900/60 shadow-xs'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    {!item.isRead && (
                      <span className="h-2 w-2 rounded-full bg-[#0866F5]" />
                    )}
                    <h4 className="text-xs font-black text-[#081B35] dark:text-white">
                      {item.title}
                    </h4>
                  </div>
                  <span className="text-[10px] font-semibold text-slate-400">
                    {item.time}
                  </span>
                </div>

                <p className="mt-1 text-xs font-medium text-slate-600 dark:text-slate-300 leading-relaxed">
                  {item.body}
                </p>

                <div className="mt-2.5 flex justify-end">
                  <button
                    type="button"
                    onClick={() => handleAction(item)}
                    className="rounded-xl bg-[#0866F5] px-3.5 py-1.5 text-[11px] font-black text-white shadow-sm transition active:scale-95"
                  >
                    {item.actionLabel} →
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

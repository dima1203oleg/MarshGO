import React, { useState } from 'react';
import { Bell, MessageCircle, Moon, Sun, User } from 'lucide-react';
import { themeService } from '../../../services/theme';

interface SearchHeaderProps {
  currentCity?: string;
  onSelectCity?: (city: string) => void;
  onOpenNotifications: () => void;
  unreadCount?: number;
  onOpenMessages?: () => void;
  onOpenProfile?: () => void;
}

export const SearchHeader: React.FC<SearchHeaderProps> = ({
  onOpenNotifications,
  unreadCount = 0,
  onOpenMessages,
  onOpenProfile,
}) => {
  const [isDark, setIsDark] = useState(() => themeService.isDark());

  const toggleTheme = () => {
    themeService.setTheme(isDark ? 'light' : 'dark');
    setIsDark(!isDark);
  };

  return (
    <header className="flex w-full items-center justify-between px-4 pt-[max(0.6rem,env(safe-area-inset-top))] pb-2 relative z-30">
      {/* Brand & City */}
      <div className="flex items-center gap-2.5">
        <div className="grid h-10 w-10 place-items-center rounded-[14px] bg-[#0066FF] text-white shadow-md shadow-blue-500/25 shrink-0">
          <span className="text-xl font-black tracking-tighter">M</span>
        </div>

        <div>
          <div className="flex items-center gap-1.5 leading-none">
            <span className="text-[17px] font-black tracking-tight text-[#0B1730] dark:text-white">
              MARSHGO
            </span>
            <span className="h-2 w-2 rounded-full bg-[#10B981]" />
          </div>
          <p className="mt-1 text-[10.5px] font-semibold text-slate-500 dark:text-slate-400 leading-none">
            Розумні поїздки · Україна
          </p>
        </div>
      </div>

      {/* Right Icons: Chat, Bell, Dark Mode, Profile Avatar */}
      <div className="flex items-center gap-2">
        {/* Chat / Messages */}
        <button
          type="button"
          onClick={onOpenMessages}
          className="grid h-9 w-9 place-items-center rounded-full bg-white dark:bg-[#111e36] text-slate-700 dark:text-slate-300 shadow-xs border border-slate-200/70 dark:border-slate-800 transition active:scale-95 hover:bg-slate-50"
          aria-label="Повідомлення"
        >
          <MessageCircle size={17} />
        </button>

        {/* Notifications */}
        <button
          type="button"
          onClick={onOpenNotifications}
          className="relative grid h-9 w-9 place-items-center rounded-full bg-white dark:bg-[#111e36] text-slate-700 dark:text-slate-300 shadow-xs border border-slate-200/70 dark:border-slate-800 transition active:scale-95 hover:bg-slate-50"
          aria-label="Сповіщення"
        >
          <Bell size={17} />
          {unreadCount > 0 ? (
            <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-[#E73C59] ring-2 ring-white dark:ring-[#111e36]" />
          ) : (
            <span className="absolute top-2 right-2 h-1.5 w-1.5 rounded-full bg-[#E73C59]" />
          )}
        </button>

        {/* Theme Toggle */}
        <button
          type="button"
          onClick={toggleTheme}
          className="grid h-9 w-9 place-items-center rounded-full bg-white dark:bg-[#111e36] text-slate-700 dark:text-slate-300 shadow-xs border border-slate-200/70 dark:border-slate-800 transition active:scale-95 hover:bg-slate-50"
          aria-label="Змінити тему"
        >
          {isDark ? <Sun size={17} className="text-amber-400" /> : <Moon size={17} />}
        </button>

        {/* Profile Avatar */}
        <button
          type="button"
          onClick={onOpenProfile}
          className="grid h-9 w-9 place-items-center rounded-full bg-gradient-to-tr from-amber-200 to-amber-100 text-amber-900 border border-amber-300/80 shadow-xs transition active:scale-95 overflow-hidden"
          aria-label="Профіль користувача"
        >
          <User size={18} className="text-amber-800" />
        </button>
      </div>
    </header>
  );
};

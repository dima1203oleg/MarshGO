import React from 'react';
import {
  Car,
  User as UserIcon,
  Shield,
  Download,
  Bell,
  Compass,
  PlusCircle,
  Menu,
  X,
  HelpCircle
} from 'lucide-react';
import { User } from '../types';
import { UserAvatar } from './UserAvatar';
import { ThemeToggle } from './ThemeToggle';

interface AppHeaderProps {
  user: User;
  onRoleSwitch: (role: 'passenger' | 'driver') => void;
  currentView: string;
  onNavigate: (view: string) => void;
  onOpenInstall: () => void;
  isInstallable: boolean;
  isInstalled: boolean;
  demoMode: boolean;
  onToggleDemo: () => void;
  onStartTour?: () => void;
}

export const AppHeader: React.FC<AppHeaderProps> = ({
  user,
  onRoleSwitch,
  currentView,
  onNavigate,
  onOpenInstall,
  isInstallable,
  isInstalled,
  demoMode,
  onToggleDemo,
  onStartTour
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);

  const isDriver = user.activeRole === 'driver';

  return (
    <header className="sticky top-0 z-40 bg-[#081B35] border-b border-[#1E293B] text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
        {/* Zone 1: Brand Wordmark */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => onNavigate('home')}
            className="flex items-center gap-2.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1769F4] rounded-lg text-left"
          >
            {/* SVG Logo mark */}
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#1769F4] to-[#0A47B8] flex items-center justify-center shadow-md shadow-[#1769F4]/20 border border-white/10 shrink-0">
              <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 18V9l8 6 8-6v9" />
                <path d="M9 15.5V20" />
                <path d="M15 15.5V20" />
              </svg>
            </div>
            <div className="flex items-baseline tracking-tight">
              <span className="font-extrabold text-xl text-white font-display">MARSH</span>
              <span className="font-extrabold text-xl text-[#38BDF8] font-display">GO</span>
            </div>
          </button>

          {/* Mode Switcher Pill */}
          <div className="hidden sm:flex items-center p-0.5 bg-[#0F284E] rounded-full border border-[#1E3A8A]/50 text-xs">
            <button
              onClick={() => onRoleSwitch('passenger')}
              className={`px-3 py-1 rounded-full font-medium transition-all ${
                !isDriver ? 'bg-[#1769F4] text-white shadow-sm' : 'text-slate-300 hover:text-white'
              }`}
            >
              Пасажир
            </button>
            <button
              onClick={() => onRoleSwitch('driver')}
              className={`px-3 py-1 rounded-full font-medium transition-all ${
                isDriver ? 'bg-[#1769F4] text-white shadow-sm' : 'text-slate-300 hover:text-white'
              }`}
            >
              Водій
            </button>
          </div>
        </div>

        {/* Zone 2: Navigation Links (Desktop) */}
        <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-300">
          <button
            onClick={() => onNavigate('home')}
            className={`hover:text-white transition-colors ${currentView === 'home' ? 'text-white font-semibold border-b-2 border-[#1769F4] pb-0.5' : ''}`}
          >
            Пошук
          </button>
          <button
            onClick={() => onNavigate('search')}
            className={`hover:text-white transition-colors ${currentView === 'search' ? 'text-white font-semibold border-b-2 border-[#1769F4] pb-0.5' : ''}`}
          >
            Всі рейси
          </button>
          <button
            onClick={() => onNavigate(isDriver ? 'driver-requests' : 'demand-new')}
            className={`hover:text-white transition-colors flex items-center gap-1.5 ${
              currentView === 'demand-new' || currentView === 'driver-requests' ? 'text-white font-semibold border-b-2 border-[#1769F4] pb-0.5' : ''
            }`}
          >
            <span className="text-[#38BDF8]">Біржа попиту</span>
          </button>
          <button
            onClick={() => onNavigate('navigation')}
            className={`hover:text-white transition-colors flex items-center gap-1.5 ${
              currentView === 'navigation' ? 'text-white font-semibold border-b-2 border-[#1769F4] pb-0.5' : ''
            }`}
          >
            <Compass className="w-4 h-4 text-[#38BDF8]" />
            <span>Навігація (Beta)</span>
          </button>
          <button
            onClick={() => onNavigate('trips')}
            className={`hover:text-white transition-colors ${currentView === 'trips' ? 'text-white font-semibold border-b-2 border-[#1769F4] pb-0.5' : ''}`}
          >
            Мої поїздки
          </button>
        </nav>

        {/* Zone 3: Actions & Profile */}
        <div className="flex items-center gap-2.5">
          {/* DEMO mode indicator badge */}
          <button
            onClick={onToggleDemo}
            title="Перемкнути Demo режим"
            className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#0F284E] border border-[#1E3A8A]/60 text-[11px] font-medium text-amber-300 hover:bg-[#1E3A8A]/40 transition"
          >
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
            <span>DEMO ДАНІ</span>
          </button>

          {/* PWA Install Trigger */}
          {!isInstalled && (
            <button
              onClick={onOpenInstall}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#1769F4] hover:bg-[#1358CE] text-white text-xs font-semibold shadow-sm transition active:scale-95"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Встановити</span>
              <span>PWA</span>
            </button>
          )}

          {/* Messages */}
          <button
            onClick={() => onNavigate('messages')}
            className="relative p-2 rounded-lg text-slate-300 hover:text-white hover:bg-white/5 transition"
            aria-label="Повідомлення"
          >
            <Bell className="w-5 h-5" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[#1769F4]" />
          </button>

          {/* Onboarding Tour Trigger */}
          {onStartTour && (
            <button
              onClick={onStartTour}
              title="Підказки та гід по можливостях платформи"
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-200 hover:text-white text-xs font-semibold border border-white/10 transition active:scale-95"
            >
              <HelpCircle className="w-4 h-4 text-[#38BDF8]" />
              <span className="hidden sm:inline">Гід</span>
            </button>
          )}

          {/* Theme Toggle Button (Light/Dark Night Mode) */}
          <ThemeToggle />

          {/* User Profile Avatar */}
          <button
            onClick={() => onNavigate(isDriver ? 'driver' : 'profile')}
            className="flex items-center gap-2 p-1 rounded-full hover:ring-2 hover:ring-[#1769F4] transition focus:outline-none"
            aria-label="Профіль користувача"
          >
            <UserAvatar
              src={user.avatar}
              name={user.name}
              size="sm"
              className="border border-white/20"
            />
          </button>

          {/* Mobile hamburger menu toggle */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-lg text-slate-300 hover:text-white hover:bg-white/5 transition"
            aria-label="Меню"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-[#1E293B] bg-[#0A1D38] px-4 py-4 space-y-3">
          <div className="flex items-center justify-between pb-3 border-b border-white/10">
            <span className="text-xs text-slate-400">Режим користувача:</span>
            <div className="flex items-center p-0.5 bg-[#081B35] rounded-full border border-[#1E3A8A]/50 text-xs">
              <button
                onClick={() => {
                  onRoleSwitch('passenger');
                  setMobileMenuOpen(false);
                }}
                className={`px-3 py-1 rounded-full font-medium transition ${
                  !isDriver ? 'bg-[#1769F4] text-white' : 'text-slate-300'
                }`}
              >
                Пасажир
              </button>
              <button
                onClick={() => {
                  onRoleSwitch('driver');
                  setMobileMenuOpen(false);
                }}
                className={`px-3 py-1 rounded-full font-medium transition ${
                  isDriver ? 'bg-[#1769F4] text-white' : 'text-slate-300'
                }`}
              >
                Водій
              </button>
            </div>
          </div>

          {/* Theme switcher for mobile */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/10">
            <span className="text-xs font-bold text-slate-200">Тема (Нічний режим):</span>
            <ThemeToggle variant="segmented" />
          </div>

          <div className="grid grid-cols-2 gap-2 text-sm">
            <button
              onClick={() => {
                onNavigate('home');
                setMobileMenuOpen(false);
              }}
              className="p-2.5 rounded-lg bg-white/5 text-left font-medium hover:bg-white/10"
            >
              Головний пошук
            </button>
            <button
              onClick={() => {
                onNavigate('search');
                setMobileMenuOpen(false);
              }}
              className="p-2.5 rounded-lg bg-white/5 text-left font-medium hover:bg-white/10"
            >
              Всі пропозиції
            </button>
            <button
              onClick={() => {
                onNavigate('demand-new');
                setMobileMenuOpen(false);
              }}
              className="p-2.5 rounded-lg bg-white/5 text-left font-medium hover:bg-white/10 text-[#38BDF8]"
            >
              Шукаю поїздку (Бюджет)
            </button>
            <button
              onClick={() => {
                onNavigate('navigation');
                setMobileMenuOpen(false);
              }}
              className="p-2.5 rounded-lg bg-white/5 text-left font-medium hover:bg-white/10 text-emerald-400"
            >
              Навігація (Beta)
            </button>
            <button
              onClick={() => {
                onNavigate('driver-vehicle');
                setMobileMenuOpen(false);
              }}
              className="p-2.5 rounded-lg bg-white/5 text-left font-medium hover:bg-white/10"
            >
              Мій автомобіль
            </button>
            <button
              onClick={() => {
                onNavigate('admin');
                setMobileMenuOpen(false);
              }}
              className="p-2.5 rounded-lg bg-white/5 text-left font-medium hover:bg-white/10"
            >
              Адмін панель
            </button>

            {onStartTour && (
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  onStartTour();
                }}
                className="col-span-2 p-2.5 rounded-lg bg-[#1769F4]/20 border border-[#1769F4]/40 text-left font-bold text-white flex items-center gap-2"
              >
                <HelpCircle className="w-4 h-4 text-[#38BDF8]" />
                <span>Гід по додатку (Підказки)</span>
              </button>
            )}
          </div>
        </div>
      )}
    </header>
  );
};

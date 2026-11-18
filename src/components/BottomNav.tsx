import React from 'react';
import { Home, Search, Plus, Briefcase, User as UserIcon } from 'lucide-react';

interface BottomNavProps {
  currentView: string;
  onNavigate: (view: string) => void;
  onOpenActionDrawer: () => void;
  isDriver: boolean;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  currentView,
  onNavigate,
  onOpenActionDrawer,
}) => {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-[#DFE7F1] pb-safe shadow-[0_-4px_20px_rgba(0,0,0,0.05)] dark:bg-[#0B1730]/95 dark:border-slate-800">
      <div className="grid grid-cols-5 h-16 items-center px-2 max-w-xl mx-auto">
        {/* Tab 1: Home */}
        <button
          onClick={() => onNavigate('home')}
          className={`flex flex-col items-center justify-center py-1 transition-colors ${
            currentView === 'home' ? 'text-[#1769ED] dark:text-blue-400' : 'text-[#62718A] dark:text-slate-400'
          }`}
        >
          <Home className="w-5 h-5" strokeWidth={currentView === 'home' ? 2.5 : 2} />
          <span className="text-[10px] font-bold mt-1">Головна</span>
        </button>

        {/* Tab 2: Search */}
        <button
          onClick={() => onNavigate('search')}
          className={`flex flex-col items-center justify-center py-1 transition-colors ${
            currentView === 'search' ? 'text-[#1769ED] dark:text-blue-400' : 'text-[#62718A] dark:text-slate-400'
          }`}
        >
          <Search className="w-5 h-5" strokeWidth={currentView === 'search' ? 2.5 : 2} />
          <span className="text-[10px] font-bold mt-1">Пошук</span>
        </button>

        {/* Tab 3: Central Action Button (+) */}
        <div className="flex items-center justify-center -mt-6">
          <button
            onClick={onOpenActionDrawer}
            className="w-13 h-13 rounded-full bg-[#1769ED] text-white flex items-center justify-center shadow-lg shadow-[#1769ED]/35 hover:scale-105 active:scale-95 transition-transform border-4 border-white dark:border-[#0B1730]"
            aria-label="Створити поїздку або запит"
          >
            <Plus className="w-6 h-6 stroke-[2.6]" />
          </button>
        </div>

        {/* Tab 4: My Trips */}
        <button
          onClick={() => onNavigate('trips')}
          className={`flex flex-col items-center justify-center py-1 transition-colors ${
            currentView === 'trips' ? 'text-[#1769ED] dark:text-blue-400' : 'text-[#62718A] dark:text-slate-400'
          }`}
        >
          <Briefcase className="w-5 h-5" strokeWidth={currentView === 'trips' ? 2.5 : 2} />
          <span className="text-[10px] font-bold mt-1">Мої поїздки</span>
        </button>

        {/* Tab 5: Profile */}
        <button
          onClick={() => onNavigate('profile')}
          className={`flex flex-col items-center justify-center py-1 transition-colors ${
            currentView === 'profile' ? 'text-[#1769ED] dark:text-blue-400' : 'text-[#62718A] dark:text-slate-400'
          }`}
        >
          <UserIcon className="w-5 h-5" strokeWidth={currentView === 'profile' ? 2.5 : 2} />
          <span className="text-[10px] font-bold mt-1">Профіль</span>
        </button>
      </div>
    </nav>
  );
};

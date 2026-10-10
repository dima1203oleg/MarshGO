import React from 'react';
import { Coins, Sparkles, Zap } from 'lucide-react';
import type { SearchStrategyMode } from '../model/types';

interface StrategySelectorProps {
  selectedStrategy: SearchStrategyMode;
  onSelectStrategy: (strategy: SearchStrategyMode) => void;
}

const STRATEGIES = [
  { id: 'BALANCED', label: 'Оптимальний', sub: 'Баланс часу і ціни', icon: Sparkles },
  { id: 'FASTEST', label: 'Найшвидший', sub: 'Мінімум часу', icon: Zap },
  { id: 'CHEAPEST', label: 'Найдешевший', sub: 'Мінімум вартості', icon: Coins },
] as const;

export const StrategySelector: React.FC<StrategySelectorProps> = ({ selectedStrategy, onSelectStrategy }) => (
  <div>
    <div role="group" aria-label="Пріоритет поїздки" className="grid grid-cols-3 gap-2">
      {STRATEGIES.map(({ id, label, icon: Icon }) => {
        const active = selectedStrategy === id;
        return (
          <button
            key={id}
            type="button"
            aria-pressed={active}
            onClick={() => onSelectStrategy(id)}
            className={`flex min-h-11 items-center justify-center gap-1.5 rounded-xl px-2 py-2 text-center transition-all active:scale-95 ${
              active
                ? 'border-2 border-[#0066FF] bg-blue-50/80 text-[#0066FF] shadow-xs dark:border-[#0066FF] dark:bg-blue-950/40 dark:text-blue-300'
                : 'border border-slate-200/90 bg-white text-[#0B1730] hover:border-slate-300 dark:border-slate-800 dark:bg-[#101E38] dark:text-white'
            }`}
          >
            <Icon size={13} className={active ? 'shrink-0 text-[#0066FF] dark:text-blue-400' : 'shrink-0 text-slate-500 dark:text-slate-400'} />
            <span className="text-[11px] font-black leading-tight">{label}</span>
          </button>
        );
      })}
    </div>
  </div>
);

import React from 'react';
import { Coins, Zap } from 'lucide-react';
import type { SearchStrategyMode } from '../model/types';

interface StrategySelectorProps {
  selectedStrategy: SearchStrategyMode;
  onSelectStrategy: (strategy: SearchStrategyMode) => void;
}

export const StrategySelector: React.FC<StrategySelectorProps> = ({
  selectedStrategy,
  onSelectStrategy,
}) => {
  const strategy = selectedStrategy;
  const onChangeStrategy = onSelectStrategy;
  return (
    <div className="mt-3.5">
      <h2 className="text-[13px] font-black text-[#081B35] dark:text-white px-1 mb-2">
        Режим пошуку
      </h2>

      <div className="grid grid-cols-3 gap-2">
        {/* Balanced (Оптимальний) */}
        <button
          type="button"
          onClick={() => onChangeStrategy('BALANCED')}
          className={`flex flex-col items-center justify-center rounded-[18px] p-2.5 text-center transition-all active:scale-95 ${
            strategy === 'BALANCED'
              ? 'bg-[#0866F5] text-white shadow-md shadow-blue-500/25'
              : 'bg-white dark:bg-[#111e36] text-[#081B35] dark:text-white border border-slate-100/90 dark:border-slate-800 shadow-sm'
          }`}
        >
          <span className="text-[12px] font-black leading-tight">
            Оптимальний
          </span>
          <span
            className={`text-[9.5px] font-medium leading-tight mt-0.5 ${
              strategy === 'BALANCED' ? 'text-blue-100' : 'text-[#63738C] dark:text-slate-400'
            }`}
          >
            Баланс часу і ціни
          </span>
        </button>

        {/* Fastest (Найшвидший) */}
        <button
          type="button"
          onClick={() => onChangeStrategy('FASTEST')}
          className={`flex flex-col items-center justify-center rounded-[18px] p-2.5 text-center transition-all active:scale-95 ${
            strategy === 'FASTEST'
              ? 'bg-[#0866F5] text-white shadow-md shadow-blue-500/25'
              : 'bg-white dark:bg-[#111e36] text-[#081B35] dark:text-white border border-slate-100/90 dark:border-slate-800 shadow-sm'
          }`}
        >
          <div className="flex items-center gap-1">
            <Zap size={13} className={strategy === 'FASTEST' ? 'text-white' : 'text-[#0866F5]'} />
            <span className="text-[12px] font-black leading-tight">
              Найшвидший
            </span>
          </div>
          <span
            className={`text-[9.5px] font-medium leading-tight mt-0.5 ${
              strategy === 'FASTEST' ? 'text-blue-100' : 'text-[#63738C] dark:text-slate-400'
            }`}
          >
            Мінімум часу
          </span>
        </button>

        {/* Cheapest (Найдешевший) */}
        <button
          type="button"
          onClick={() => onChangeStrategy('CHEAPEST')}
          className={`flex flex-col items-center justify-center rounded-[18px] p-2.5 text-center transition-all active:scale-95 ${
            strategy === 'CHEAPEST'
              ? 'bg-[#0866F5] text-white shadow-md shadow-blue-500/25'
              : 'bg-white dark:bg-[#111e36] text-[#081B35] dark:text-white border border-slate-100/90 dark:border-slate-800 shadow-sm'
          }`}
        >
          <div className="flex items-center gap-1">
            <Coins size={13} className={strategy === 'CHEAPEST' ? 'text-white' : 'text-[#0866F5]'} />
            <span className="text-[12px] font-black leading-tight">
              Найдешевший
            </span>
          </div>
          <span
            className={`text-[9.5px] font-medium leading-tight mt-0.5 ${
              strategy === 'CHEAPEST' ? 'text-blue-100' : 'text-[#63738C] dark:text-slate-400'
            }`}
          >
            Мінімум ціни
          </span>
        </button>
      </div>
    </div>
  );
};

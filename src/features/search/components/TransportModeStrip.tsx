import React from 'react';
import {
  Bike,
  Bus,
  CarFront,
  CarTaxiFront,
  Grid,
  Plane,
  Repeat,
  Ship,
  TrainFront,
  TrainFrontTunnel,
  TramFront,
  Users,
  Zap,
} from 'lucide-react';
import type { SearchTransportMode } from '../model/types';

interface TransportModeStripProps {
  selectedModes: Set<SearchTransportMode>;
  onToggleMode: (mode: SearchTransportMode) => void;
  onSelectAll: () => void;
  onOpenAllModal?: () => void;
}

interface ModeItem {
  id: SearchTransportMode;
  label: string;
  icon: React.ComponentType<{ size?: number; className?: string; strokeWidth?: number }>;
  color: string;
}

const MODES: ModeItem[] = [
  { id: 'all', label: 'Усі', icon: Grid, color: '#0866F5' },
  { id: 'bus', label: 'Автобуси', icon: Bus, color: '#0284C7' },
  { id: 'minibus', label: 'Маршрутки', icon: Users, color: '#D97706' },
  { id: 'tram', label: 'Трамвай', icon: TramFront, color: '#E11D48' },
  { id: 'trolleybus', label: 'Тролейбуси', icon: Bus, color: '#0D9488' },
  { id: 'metro', label: 'Метро', icon: TrainFront, color: '#2563EB' },
  { id: 'carpool', label: 'Попутки', icon: CarFront, color: '#4F46E5' },
  { id: 'taxi', label: 'Таксі', icon: CarTaxiFront, color: '#F59E0B' },
  { id: 'train', label: 'Поїзди', icon: TrainFront, color: '#9333EA' },
  { id: 'suburban_train', label: 'Електрички', icon: TrainFrontTunnel, color: '#059669' },
  { id: 'bike', label: 'Велосипеди', icon: Bike, color: '#DC2626' },
  { id: 'scooter', label: 'Самокати', icon: Zap, color: '#84CC16' },
  { id: 'carsharing', label: 'Каршеринг', icon: Users, color: '#10B981' },
  { id: 'transfer', label: 'Трансфер', icon: Repeat, color: '#6366F1' },
  { id: 'water', label: 'Водний', icon: Ship, color: '#06B6D4' },
  { id: 'air', label: 'Літаки', icon: Plane, color: '#3B82F6' },
];

export const TransportModeStrip: React.FC<TransportModeStripProps> = ({
  selectedModes,
  onToggleMode,
  onSelectAll,
}) => {
  const isAll = selectedModes.has('all') || selectedModes.size === 0;

  return (
    <div className="mt-3.5">
      {/* Header */}
      <div className="flex items-center justify-between px-1 mb-2">
        <h2 className="text-[13px] font-black text-[#081B35] dark:text-white">
          Види транспорту
        </h2>
        <button
          type="button"
          onClick={onSelectAll}
          className="text-xs font-bold text-[#0866F5] hover:underline dark:text-blue-400"
        >
          Усі
        </button>
      </div>

      {/* Horizontal Strip */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1.5 scrollbar-none -mx-1 px-1">
        {MODES.map((item) => {
          const Icon = item.icon;
          const active = item.id === 'all' ? isAll : selectedModes.has(item.id);

          return (
            <button
              key={item.id}
              type="button"
              onClick={() => {
                if (item.id === 'all') onSelectAll();
                else onToggleMode(item.id);
              }}
              className={`flex flex-col items-center justify-center shrink-0 w-[62px] h-[64px] rounded-[18px] transition-all active:scale-95 ${
                active
                  ? 'bg-[#EAF3FF] dark:bg-blue-950/80 border-2 border-[#0866F5] shadow-sm'
                  : 'bg-white dark:bg-[#111e36] border border-slate-100/90 dark:border-slate-800 shadow-sm opacity-90 hover:opacity-100'
              }`}
            >
              <div
                className={`grid h-7 w-7 place-items-center rounded-xl transition ${
                  active
                    ? 'text-[#0866F5] dark:text-blue-400'
                    : 'text-slate-600 dark:text-slate-300'
                }`}
              >
                <Icon size={18} strokeWidth={2.4} />
              </div>
              <span
                className={`text-[9.5px] truncate max-w-[56px] mt-0.5 leading-none ${
                  active
                    ? 'font-extrabold text-[#0866F5] dark:text-blue-400'
                    : 'font-semibold text-[#63738C] dark:text-slate-400'
                }`}
              >
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

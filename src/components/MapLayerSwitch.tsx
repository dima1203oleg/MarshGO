import { useEffect, useState } from 'react';
import { Box, Layers, Map as MapIcon } from 'lucide-react';
import { getMapLayer, mapLayers, setMapLayer, subscribeMapLayer, type MapLayer } from '../map/mapMode';

const icons = { standard: MapIcon, navigation: Box, hybrid: Layers } as const;

/** The three map modes: schematic 2D, 3D navigation, satellite. */
export function MapLayerSwitch({ className = '', layout = 'vertical' }: { className?: string; layout?: 'vertical' | 'horizontal' }) {
  const [layer, setLayer] = useState<MapLayer>(getMapLayer());
  useEffect(() => subscribeMapLayer(setLayer), []);
  return <div role="radiogroup" aria-label="Режим карти" className={`inline-flex gap-1 rounded-2xl border border-slate-200 bg-[#F5F8FD] p-1 dark:border-slate-800 dark:bg-slate-900/90 ${className}`}>
    {(Object.keys(mapLayers) as MapLayer[]).map((key) => { const Icon = icons[key]; return <button key={key} type="button" role="radio" aria-checked={layer === key} onClick={() => setMapLayer(key)} className={`flex ${layout === 'vertical' ? 'min-w-[4.2rem] flex-col gap-0.5 px-3 py-1.5' : 'min-w-[3.45rem] items-center justify-center px-2 py-2'} rounded-xl text-[11px] font-bold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1789F4] ${layer === key ? 'bg-[#0066FF] text-white shadow-xs' : 'text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white'}`}>{layout === 'vertical' && <Icon size={17} />}{mapLayers[key].label}</button>; })}
  </div>;
}

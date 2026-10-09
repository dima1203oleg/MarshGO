import React, { useState, useEffect, useRef } from 'react';
import { ArrowDownUp, Crosshair, MapPin, Search as SearchIcon } from 'lucide-react';
import type { RoutePlace } from '../model/types';
import { productionApi, type ApiPlace } from '../../../services/productionApi';

interface RouteInputsProps {
  origin: RoutePlace;
  destination: RoutePlace;
  onOriginChange: (place: RoutePlace) => void;
  onDestinationChange: (place: RoutePlace) => void;
  onOpenMapPicker?: (field: 'origin' | 'destination') => void;
}

export const RouteInputs: React.FC<RouteInputsProps> = ({
  origin,
  destination,
  onOriginChange,
  onDestinationChange,
  onOpenMapPicker: _onOpenMapPicker,
}) => {
  const [activeField, setActiveField] = useState<'origin' | 'destination' | null>(null);
  const [originText, setOriginText] = useState(origin.label);
  const [destText, setDestText] = useState(destination.label);
  const [suggestions, setSuggestions] = useState<ApiPlace[]>([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [detectingGps, setDetectingGps] = useState(false);
  const debounceTimer = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    setOriginText(origin.label);
  }, [origin.label]);

  useEffect(() => {
    setDestText(destination.label);
  }, [destination.label]);

  const fetchSuggestions = (query: string) => {
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    if (!query.trim() || query.trim().length < 2) {
      setSuggestions([]);
      return;
    }
    setLoadingSuggestions(true);
    debounceTimer.current = setTimeout(async () => {
      try {
        const results = await productionApi.suggestPlaces(query.trim());
        setSuggestions(results);
      } catch {
        setSuggestions([]);
      } finally {
        setLoadingSuggestions(false);
      }
    }, 200);
  };

  const handleGpsCurrentLocation = () => {
    if (!navigator.geolocation) return;
    setDetectingGps(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const { latitude, longitude } = pos.coords;
          const reverse = await productionApi.reverseGeocode(latitude, longitude);
          const label = reverse.label || 'Моє поточне місцезнаходження';
          setOriginText(label);
          onOriginChange({ label, latitude, longitude, providerId: reverse.providerId });
        } catch {
          setOriginText('Моє поточне місцезнаходження');
          onOriginChange({ label: 'Моє поточне місцезнаходження', latitude: pos.coords.latitude, longitude: pos.coords.longitude });
        } finally {
          setDetectingGps(false);
        }
      },
      () => setDetectingGps(false),
      { enableHighAccuracy: true, timeout: 6000 }
    );
  };

  const handleSwap = () => {
    const prevOrigin = origin;
    onOriginChange(destination);
    onDestinationChange(prevOrigin);
  };

  return (
    <div className="relative rounded-[24px] bg-white dark:bg-[#0B1730] p-3.5 shadow-sm border border-slate-100/90 dark:border-slate-800">
      {/* Origin Field (Звідки) */}
      <div className="relative flex items-center gap-3 py-1.5 px-2">
        <span className="h-3 w-3 rounded-full bg-[#0866F5] ring-4 ring-blue-50 dark:ring-blue-950 shrink-0" />
        <div className="min-w-0 flex-1">
          <label className="block text-[10.5px] font-bold text-[#63738C] dark:text-slate-400 leading-none">
            Звідки
          </label>
          <input
            type="text"
            value={originText}
            placeholder="Місто, адреса або зупинка"
            onFocus={() => {
              setActiveField('origin');
              fetchSuggestions(originText);
            }}
            onChange={(e) => {
              setOriginText(e.target.value);
              onOriginChange({ ...origin, label: e.target.value });
              fetchSuggestions(e.target.value);
            }}
            className="w-full bg-transparent pt-1 text-[15px] font-bold text-[#081B35] dark:text-white placeholder:text-slate-400 placeholder:font-medium outline-none"
          />
        </div>

        {/* GPS location icon button */}
        <button
          type="button"
          aria-busy={loadingSuggestions}
          onClick={handleGpsCurrentLocation}
          title="Визначити моє місцезнаходження"
          className={`grid h-8 w-8 place-items-center rounded-full transition ${
            detectingGps
              ? 'animate-spin text-[#0866F5]'
              : 'text-[#0866F5] hover:bg-blue-50 dark:hover:bg-blue-950/60'
          }`}
        >
          <Crosshair size={18} strokeWidth={2.4} />
        </button>
      </div>

      {/* Divider with Swap Button */}
      <div className="relative my-1.5 flex items-center justify-between border-t border-slate-100 dark:border-slate-800/80">
        <div className="absolute right-2 -top-3.5 z-10">
          <button
            type="button"
            onClick={handleSwap}
            className="grid h-7 w-7 place-items-center rounded-full bg-slate-50 dark:bg-slate-800 text-slate-500 hover:text-[#0866F5] dark:text-slate-400 shadow-sm border border-slate-200/80 dark:border-slate-700 transition active:scale-90"
            aria-label="Поміняти місцями"
          >
            <ArrowDownUp size={13} strokeWidth={2.4} />
          </button>
        </div>
      </div>

      {/* Destination Field (Куди) */}
      <div className="relative flex items-center gap-3 py-1.5 px-2">
        <span className="h-3 w-3 rounded-full bg-[#E73C59] ring-4 ring-rose-50 dark:ring-rose-950 shrink-0" />
        <div className="min-w-0 flex-1">
          <label className="block text-[10.5px] font-bold text-[#63738C] dark:text-slate-400 leading-none">
            Куди
          </label>
          <input
            type="text"
            value={destText}
            placeholder="Місто, вокзал або адреса"
            onFocus={() => {
              setActiveField('destination');
              fetchSuggestions(destText);
            }}
            onChange={(e) => {
              setDestText(e.target.value);
              onDestinationChange({ ...destination, label: e.target.value });
              fetchSuggestions(e.target.value);
            }}
            className="w-full bg-transparent pt-1 text-[15px] font-bold text-[#081B35] dark:text-white placeholder:text-slate-400 placeholder:font-medium outline-none"
          />
        </div>

        <button
          type="button"
          onClick={() => {
            setActiveField('destination');
            fetchSuggestions(destText);
          }}
          className="grid h-8 w-8 place-items-center text-slate-400"
        >
          <SearchIcon size={18} strokeWidth={2.4} />
        </button>
      </div>

      {/* Autocomplete Suggestions Dropdown */}
      {activeField && suggestions.length > 0 && (
        <div className="mt-3 border-t border-slate-100 dark:border-slate-800 pt-2 space-y-1 max-h-56 overflow-y-auto">
          {suggestions.map((s, idx) => (
            <button
              key={`${s.label}-${idx}`}
              type="button"
              onClick={() => {
                const selected: RoutePlace = {
                  label: s.label,
                  latitude: s.latitude,
                  longitude: s.longitude,
                  providerId: s.providerId,
                };
                if (activeField === 'origin') {
                  setOriginText(s.label);
                  onOriginChange(selected);
                } else {
                  setDestText(s.label);
                  onDestinationChange(selected);
                }
                setActiveField(null);
                setSuggestions([]);
              }}
              className="flex w-full items-center gap-2.5 rounded-xl px-2.5 py-2 text-left hover:bg-slate-50 dark:hover:bg-slate-800/80 transition"
            >
              <MapPin size={16} className="text-[#0866F5] shrink-0" />
              <div className="min-w-0 flex-1">
                <span className="block text-xs font-bold text-[#081B35] dark:text-white truncate">
                  {s.label}
                </span>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

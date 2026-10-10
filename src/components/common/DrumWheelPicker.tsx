import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Capacitor } from '@capacitor/core';
import { Haptics, ImpactStyle } from '@capacitor/haptics';

const ITEM_HEIGHT = 44;
const VISIBLE_COUNT = 5;

interface DrumWheelPickerProps<T extends string | number> {
  items: T[];
  value: T;
  onChange: (value: T) => void;
  renderItem?: (item: T) => React.ReactNode;
  label?: string;
  className?: string;
}

export function DrumWheelPicker<T extends string | number>({
  items,
  value,
  onChange,
  renderItem,
  label,
  className = '',
}: DrumWheelPickerProps<T>) {
  const containerRef = useRef<HTMLDivElement>(null);
  const isScrollingRef = useRef(false);
  const [isDragging, setIsDragging] = useState(false);
  const startYRef = useRef(0);
  const startScrollTopRef = useRef(0);

  const selectedIndex = Math.max(0, items.indexOf(value));
  const lastFeedbackIndexRef = useRef(selectedIndex);
  const lastFeedbackAtRef = useRef(0);
  const audioContextRef = useRef<AudioContext | null>(null);

  const playRatchet = useCallback((index: number) => {
    if (lastFeedbackIndexRef.current === index) return;
    lastFeedbackIndexRef.current = index;

    const now = typeof performance !== 'undefined' ? performance.now() : Date.now();
    if (now - lastFeedbackAtRef.current < 28) return;
    lastFeedbackAtRef.current = now;

    if (typeof window !== 'undefined') {
      try {
        type WindowWithWebkitAudio = Window & { webkitAudioContext?: typeof AudioContext };
        const AudioContextConstructor = window.AudioContext ?? (window as WindowWithWebkitAudio).webkitAudioContext;
        if (AudioContextConstructor) {
          const context = audioContextRef.current ?? new AudioContextConstructor();
          audioContextRef.current = context;
          if (context.state === 'suspended') void context.resume().catch(() => undefined);

          const oscillator = context.createOscillator();
          const envelope = context.createGain();
          const startAt = context.currentTime;
          oscillator.type = 'triangle';
          oscillator.frequency.setValueAtTime(1180, startAt);
          envelope.gain.setValueAtTime(0.0001, startAt);
          envelope.gain.exponentialRampToValueAtTime(0.025, startAt + 0.004);
          envelope.gain.exponentialRampToValueAtTime(0.0001, startAt + 0.026);
          oscillator.connect(envelope);
          envelope.connect(context.destination);
          oscillator.start(startAt);
          oscillator.stop(startAt + 0.03);
        }
      } catch {
        // Audio feedback is optional; keep wheel interaction working if the browser blocks it.
      }
    }

    if (Capacitor.isNativePlatform()) {
      void Haptics.impact({ style: ImpactStyle.Light }).catch(() => undefined);
    } else if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      try {
        navigator.vibrate(7);
      } catch {
        // Browser vibration is optional and may be unavailable due to platform policy.
      }
    }
  }, []);

  // Sync scroll position when value changes from outside
  useEffect(() => {
    if (!containerRef.current || isDragging || isScrollingRef.current) return;
    const targetScroll = selectedIndex * ITEM_HEIGHT;
    if (Math.abs(containerRef.current.scrollTop - targetScroll) > 2) {
      containerRef.current.scrollTo({
        top: targetScroll,
        behavior: 'smooth',
      });
    }
  }, [selectedIndex, isDragging]);

  useEffect(() => () => {
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      void audioContextRef.current.close().catch(() => undefined);
    }
  }, []);

  const snapToNearest = useCallback(() => {
    if (!containerRef.current) return;
    const currentScroll = containerRef.current.scrollTop;
    const nearestIndex = Math.round(currentScroll / ITEM_HEIGHT);
    const clampedIndex = Math.max(0, Math.min(items.length - 1, nearestIndex));
    const targetScroll = clampedIndex * ITEM_HEIGHT;

    containerRef.current.scrollTo({
      top: targetScroll,
      behavior: 'smooth',
    });

    const chosen = items[clampedIndex];
    if (chosen !== undefined && chosen !== value) {
      playRatchet(clampedIndex);
      onChange(chosen);
    }
  }, [items, value, onChange, playRatchet]);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    if (isDragging) return;
    isScrollingRef.current = true;
    const currentScroll = e.currentTarget.scrollTop;
    const nearestIndex = Math.round(currentScroll / ITEM_HEIGHT);
    const clampedIndex = Math.max(0, Math.min(items.length - 1, nearestIndex));
    const chosen = items[clampedIndex];
    if (chosen !== undefined && chosen !== value) {
      playRatchet(clampedIndex);
      onChange(chosen);
    }
    // Timeout to release programmatic lock
    setTimeout(() => {
      isScrollingRef.current = false;
    }, 150);
  };

  // Touch / Pointer dragging for realistic momentum and haptic feel
  const handlePointerDown = (e: React.PointerEvent) => {
    if (!containerRef.current) return;
    setIsDragging(true);
    startYRef.current = e.clientY;
    startScrollTopRef.current = containerRef.current.scrollTop;
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging || !containerRef.current) return;
    const deltaY = e.clientY - startYRef.current;
    containerRef.current.scrollTop = startScrollTopRef.current - deltaY;
    const nearestIndex = Math.round(containerRef.current.scrollTop / ITEM_HEIGHT);
    const clampedIndex = Math.max(0, Math.min(items.length - 1, nearestIndex));
    const chosen = items[clampedIndex];
    if (chosen !== undefined && lastFeedbackIndexRef.current !== clampedIndex) {
      playRatchet(clampedIndex);
      onChange(chosen);
    }
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (!isDragging) return;
    setIsDragging(false);
    (e.target as HTMLElement).releasePointerCapture?.(e.pointerId);
    snapToNearest();
  };

  const padItemsCount = Math.floor(VISIBLE_COUNT / 2);

  return (
    <div
      className={`relative h-[220px] select-none overflow-hidden touch-none ${className}`}
      aria-label={label}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
    >
      {/* Center highlight glass lens */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-2 top-1/2 -translate-y-1/2 h-[44px] rounded-xl border border-blue-500/20 bg-blue-500/10 dark:border-[#2D66A8]/50 dark:bg-[#153455]/90 z-10"
      />

      {/* Top and Bottom Gradient Fades (iOS barrel wheel perspective) */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 h-[88px] bg-gradient-to-b from-white dark:from-[#071426] to-transparent z-20"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 bottom-0 h-[88px] bg-gradient-to-t from-white dark:from-[#071426] to-transparent z-20"
      />

      {/* Scrollable list */}
      <div
        ref={containerRef}
        role="listbox"
        aria-label={label}
        onScroll={handleScroll}
        className="h-full overflow-y-scroll snap-y snap-mandatory scrollbar-none [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        style={{ scrollBehavior: isDragging ? 'auto' : 'smooth' }}
      >
        {/* Top spacer padding */}
        <div style={{ height: padItemsCount * ITEM_HEIGHT }} aria-hidden="true" />

        {items.map((item, index) => {
          const isSelected = item === value;
          const distance = Math.abs(index - selectedIndex);

          // 3D perspective rotation scale
          let opacity = 0.25;
          let scale = 0.85;
          if (isSelected) {
            opacity = 1;
            scale = 1.08;
          } else if (distance === 1) {
            opacity = 0.65;
            scale = 0.95;
          } else if (distance === 2) {
            opacity = 0.35;
            scale = 0.88;
          }

          return (
            <div
              key={`${item}-${index}`}
              role="option"
              aria-selected={isSelected}
              onClick={() => {
                if (item !== value) playRatchet(index);
                onChange(item);
                containerRef.current?.scrollTo({
                  top: index * ITEM_HEIGHT,
                  behavior: 'smooth',
                });
              }}
              style={{
                height: ITEM_HEIGHT,
                opacity,
                transform: `scale(${scale})`,
              }}
              className={`flex items-center justify-center snap-center cursor-pointer transition-all duration-150 tabular-nums ${
                isSelected
                  ? 'font-black text-[22px] text-[#0066FF] dark:text-white'
                  : 'font-semibold text-[17px] text-slate-700 dark:text-slate-400'
              }`}
            >
              {renderItem ? renderItem(item) : String(item)}
            </div>
          );
        })}

        {/* Bottom spacer padding */}
        <div style={{ height: padItemsCount * ITEM_HEIGHT }} aria-hidden="true" />
      </div>
    </div>
  );
}

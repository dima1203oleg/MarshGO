import React from 'react';
import { TransportCategory } from '../types';
import { HomeHero } from './HomeHero';

interface HomeViewProps {
  onSearch: (params: { origin: string; destination: string; date: string; passengers: number }) => void;
  onNavigate: (view: string) => void;
  onCategoryClick: (cat: TransportCategory) => void;
}

export const HomeView: React.FC<HomeViewProps> = ({ onSearch, onNavigate, onCategoryClick }) => {
  return (
    <HomeHero
      onStartNavigation={() => onNavigate('navigation')}
      onSearchTrip={() => onNavigate('search')}
      onPlanTrip={(mode) => onNavigate(mode === 'driver' ? 'driver-offer-new' : 'demand-new')}
      onSearchRoute={(orig, dest, date, _time, passengers) => {
        onSearch({
          origin: orig || 'Львів',
          destination: dest || 'Київ',
          date: date || '',
          passengers: passengers || 1,
        });
      }}
      onSelectCategory={(cat) => onCategoryClick(cat as TransportCategory)}
      onViewAllTrips={() => onNavigate('trips')}
      onOpenMap={() => onNavigate('search')}
    />
  );
};

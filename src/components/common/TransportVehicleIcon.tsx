import React from 'react';

interface TransportVehicleIconProps {
  type: string;
  className?: string;
}

export const TransportVehicleIcon: React.FC<TransportVehicleIconProps> = ({ type, className = 'h-10 w-10' }) => {
  switch (type) {
    case 'bus':
      // Blue City Bus
      return (
        <svg viewBox="0 0 48 48" fill="none" className={className} xmlns="http://www.w3.org/2000/svg">
          <rect x="8" y="10" width="32" height="26" rx="6" fill="#0284C7" />
          <rect x="11" y="13" width="26" height="11" rx="3" fill="#E0F2FE" />
          <line x1="24" y1="13" x2="24" y2="24" stroke="#0284C7" strokeWidth="2" />
          <rect x="12" y="27" width="6" height="4" rx="1.5" fill="#FEF08A" />
          <rect x="30" y="27" width="6" height="4" rx="1.5" fill="#FEF08A" />
          <rect x="19" y="28" width="10" height="3" rx="1" fill="#0369A1" />
          <circle cx="14" cy="37" r="4" fill="#1E293B" />
          <circle cx="14" cy="37" r="1.5" fill="#94A3B8" />
          <circle cx="34" cy="37" r="4" fill="#1E293B" />
          <circle cx="34" cy="37" r="1.5" fill="#94A3B8" />
          <rect x="18" y="7" width="12" height="3" rx="1.5" fill="#0369A1" />
        </svg>
      );

    case 'marshrutka':
      // Yellow Sprinter / Bogdan Marshrutka
      return (
        <svg viewBox="0 0 48 48" fill="none" className={className} xmlns="http://www.w3.org/2000/svg">
          <rect x="6" y="12" width="36" height="23" rx="5" fill="#EAB308" />
          <path d="M6 21H42" stroke="#CA8A04" strokeWidth="1.5" />
          <rect x="9" y="15" width="8" height="8" rx="2" fill="#FEF9C3" />
          <rect x="20" y="15" width="8" height="8" rx="2" fill="#FEF9C3" />
          <rect x="31" y="15" width="8" height="8" rx="2" fill="#FEF9C3" />
          <rect x="9" y="26" width="4" height="3" rx="1" fill="#FEF08A" />
          <rect x="35" y="26" width="4" height="3" rx="1" fill="#EF4444" />
          <circle cx="13" cy="36" r="4" fill="#1E293B" />
          <circle cx="13" cy="36" r="1.5" fill="#CBD5E1" />
          <circle cx="35" cy="36" r="4" fill="#1E293B" />
          <circle cx="35" cy="36" r="1.5" fill="#CBD5E1" />
        </svg>
      );

    case 'trolleybus':
      // Green Trolleybus with overhead poles
      return (
        <svg viewBox="0 0 48 48" fill="none" className={className} xmlns="http://www.w3.org/2000/svg">
          {/* Overhead poles */}
          <line x1="20" y1="12" x2="10" y2="4" stroke="#475569" strokeWidth="2" strokeLinecap="round" />
          <line x1="28" y1="12" x2="38" y2="4" stroke="#475569" strokeWidth="2" strokeLinecap="round" />
          <circle cx="10" cy="4" r="1.5" fill="#10B981" />
          <circle cx="38" cy="4" r="1.5" fill="#10B981" />
          {/* Body */}
          <rect x="7" y="12" width="34" height="23" rx="5" fill="#10B981" />
          <rect x="10" y="15" width="28" height="9" rx="2" fill="#DCFCE7" />
          <line x1="24" y1="15" x2="24" y2="24" stroke="#059669" strokeWidth="2" />
          <rect x="10" y="26" width="5" height="3" rx="1" fill="#FEF08A" />
          <rect x="33" y="26" width="5" height="3" rx="1" fill="#FEF08A" />
          <circle cx="14" cy="36" r="4" fill="#1E293B" />
          <circle cx="14" cy="36" r="1.5" fill="#A7F3D0" />
          <circle cx="34" cy="36" r="4" fill="#1E293B" />
          <circle cx="34" cy="36" r="1.5" fill="#A7F3D0" />
        </svg>
      );

    case 'tram':
      // Red Tram
      return (
        <svg viewBox="0 0 48 48" fill="none" className={className} xmlns="http://www.w3.org/2000/svg">
          {/* Pantograph */}
          <path d="M19 10L24 5L29 10" stroke="#475569" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          <line x1="21" y1="5" x2="27" y2="5" stroke="#DC2626" strokeWidth="2" />
          {/* Body */}
          <rect x="8" y="10" width="32" height="25" rx="5" fill="#EF4444" />
          <rect x="11" y="13" width="26" height="10" rx="2.5" fill="#FEE2E2" />
          <line x1="24" y1="13" x2="24" y2="23" stroke="#DC2626" strokeWidth="2" />
          <rect x="11" y="25" width="5" height="3" rx="1" fill="#FEF08A" />
          <rect x="32" y="25" width="5" height="3" rx="1" fill="#FEF08A" />
          <rect x="18" y="26" width="12" height="2" rx="1" fill="#B91C1C" />
          {/* Wheels / tracks */}
          <circle cx="15" cy="36" r="3.5" fill="#1E293B" />
          <circle cx="33" cy="36" r="3.5" fill="#1E293B" />
          <line x1="6" y1="40" x2="42" y2="40" stroke="#94A3B8" strokeWidth="2" strokeLinecap="round" />
        </svg>
      );

    case 'metro':
      // Purple Subway / Metro
      return (
        <svg viewBox="0 0 48 48" fill="none" className={className} xmlns="http://www.w3.org/2000/svg">
          <rect x="8" y="10" width="32" height="26" rx="6" fill="#8B5CF6" />
          <path d="M12 14H36V23C36 24.1 35.1 25 34 25H14C12.9 25 12 24.1 12 23V14Z" fill="#F3E8FF" />
          <circle cx="16" cy="29" r="2.5" fill="#FEF08A" />
          <circle cx="32" cy="29" r="2.5" fill="#FEF08A" />
          <rect x="21" y="28" width="6" height="3" rx="1" fill="#6D28D9" />
          <rect x="12" y="36" width="24" height="3" rx="1.5" fill="#4C1D95" />
          <circle cx="16" cy="38" r="2.5" fill="#1E293B" />
          <circle cx="32" cy="38" r="2.5" fill="#1E293B" />
        </svg>
      );

    case 'carpool':
      // Blue Passenger Car
      return (
        <svg viewBox="0 0 48 48" fill="none" className={className} xmlns="http://www.w3.org/2000/svg">
          <path
            d="M8 26L13 15C13.8 13.2 15.6 12 17.6 12H30.4C32.4 12 34.2 13.2 35 15L40 26C41.7 26.5 43 28 43 30V34C43 35.1 42.1 36 41 36H39V38C39 39.1 38.1 40 37 40H35C33.9 40 33 39.1 33 38V36H15V38C15 39.1 14.1 40 13 40H11C9.9 40 9 39.1 9 38V36H7C5.9 36 5 35.1 5 34V30C5 28 6.3 26.5 8 26Z"
            fill="#2563EB"
          />
          <path d="M14 16L11 23H37L34 16H14Z" fill="#DBEAFE" />
          <circle cx="12" cy="29" r="2.5" fill="#FEF08A" />
          <circle cx="36" cy="29" r="2.5" fill="#FEF08A" />
          <rect x="18" y="29" width="12" height="3" rx="1" fill="#1D4ED8" />
        </svg>
      );

    case 'taxi':
      // Yellow Taxi with roof sign
      return (
        <svg viewBox="0 0 48 48" fill="none" className={className} xmlns="http://www.w3.org/2000/svg">
          {/* Taxi roof sign */}
          <rect x="20" y="8" width="8" height="4" rx="1" fill="#1E293B" />
          <rect x="21" y="9" width="6" height="2" rx="0.5" fill="#FACC15" />
          {/* Body */}
          <path
            d="M8 26L13 15C13.8 13.2 15.6 12 17.6 12H30.4C32.4 12 34.2 13.2 35 15L40 26C41.7 26.5 43 28 43 30V34C43 35.1 42.1 36 41 36H39V38C39 39.1 38.1 40 37 40H35C33.9 40 33 39.1 33 38V36H15V38C15 39.1 14.1 40 13 40H11C9.9 40 9 39.1 9 38V36H7C5.9 36 5 35.1 5 34V30C5 28 6.3 26.5 8 26Z"
            fill="#FACC15"
          />
          <path d="M14 16L11 23H37L34 16H14Z" fill="#FEF9C3" />
          {/* Checkered pattern */}
          <rect x="17" y="24" width="3" height="2" fill="#1E293B" />
          <rect x="23" y="24" width="3" height="2" fill="#1E293B" />
          <rect x="29" y="24" width="3" height="2" fill="#1E293B" />
          <circle cx="12" cy="29" r="2.5" fill="#FFFFFF" />
          <circle cx="36" cy="29" r="2.5" fill="#FFFFFF" />
        </svg>
      );

    case 'train':
      // Express Bullet Train
      return (
        <svg viewBox="0 0 48 48" fill="none" className={className} xmlns="http://www.w3.org/2000/svg">
          <path
            d="M10 20C10 13.4 15.4 8 22 8H26C32.6 8 38 13.4 38 20V32C38 34.2 36.2 36 34 36H14C11.8 36 10 34.2 10 32V20Z"
            fill="#1E40AF"
          />
          <path d="M13 14C13 12.3 14.3 11 16 11H32C33.7 11 35 12.3 35 14V22H13V14Z" fill="#DBEAFE" />
          <circle cx="16" cy="28" r="2.5" fill="#FEF08A" />
          <circle cx="32" cy="28" r="2.5" fill="#FEF08A" />
          <rect x="20" y="27" width="8" height="3" rx="1.5" fill="#1D4ED8" />
          <path d="M8 38L40 38" stroke="#64748B" strokeWidth="2.5" strokeLinecap="round" />
          <path d="M14 36L12 40M24 36L24 40M34 36L36 40" stroke="#94A3B8" strokeWidth="2" />
        </svg>
      );

    case 'bike':
      // Green City Bicycle
      return (
        <svg viewBox="0 0 48 48" fill="none" className={className} xmlns="http://www.w3.org/2000/svg">
          <circle cx="13" cy="30" r="8" stroke="#10B981" strokeWidth="3" />
          <circle cx="35" cy="30" r="8" stroke="#10B981" strokeWidth="3" />
          <circle cx="24" cy="30" r="3" fill="#10B981" />
          <path d="M13 30L21 18H28L35 30" stroke="#059669" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M24 30L21 18M24 30H35" stroke="#059669" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M18 16H23" stroke="#1E293B" strokeWidth="3" strokeLinecap="round" />
          <path d="M28 15L31 18" stroke="#1E293B" strokeWidth="2.5" strokeLinecap="round" />
        </svg>
      );

    case 'scooter':
      // Purple Electric Scooter
      return (
        <svg viewBox="0 0 48 48" fill="none" className={className} xmlns="http://www.w3.org/2000/svg">
          <circle cx="12" cy="36" r="4" fill="#1E293B" />
          <circle cx="12" cy="36" r="1.5" fill="#A855F7" />
          <circle cx="36" cy="36" r="4" fill="#1E293B" />
          <circle cx="36" cy="36" r="1.5" fill="#A855F7" />
          <rect x="12" y="33" width="22" height="4" rx="2" fill="#9333EA" />
          <line x1="33" y1="33" x2="28" y2="12" stroke="#7E22CE" strokeWidth="3" strokeLinecap="round" />
          <line x1="24" y1="12" x2="32" y2="12" stroke="#1E293B" strokeWidth="3" strokeLinecap="round" />
          <circle cx="30" cy="14" r="1.5" fill="#FACC15" />
        </svg>
      );

    case 'carsharing':
      // Blue Carsharing with sync badge
      return (
        <svg viewBox="0 0 48 48" fill="none" className={className} xmlns="http://www.w3.org/2000/svg">
          <path
            d="M8 26L13 15C13.8 13.2 15.6 12 17.6 12H30.4C32.4 12 34.2 13.2 35 15L40 26C41.7 26.5 43 28 43 30V34C43 35.1 42.1 36 41 36H39V38C39 39.1 38.1 40 37 40H35C33.9 40 33 39.1 33 38V36H15V38C15 39.1 14.1 40 13 40H11C9.9 40 9 39.1 9 38V36H7C5.9 36 5 35.1 5 34V30C5 28 6.3 26.5 8 26Z"
            fill="#3B82F6"
          />
          <path d="M14 16L11 23H37L34 16H14Z" fill="#EFF6FF" />
          <circle cx="12" cy="29" r="2.5" fill="#FEF08A" />
          <circle cx="36" cy="29" r="2.5" fill="#FEF08A" />
          {/* Key / share badge */}
          <circle cx="36" cy="14" r="6" fill="#10B981" />
          <path d="M34 14L35.5 15.5L38.5 12.5" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );

    case 'transfer':
      // Dark Silver Executive Transfer Shuttle Van
      return (
        <svg viewBox="0 0 48 48" fill="none" className={className} xmlns="http://www.w3.org/2000/svg">
          <rect x="6" y="14" width="36" height="21" rx="5" fill="#475569" />
          <rect x="10" y="17" width="28" height="8" rx="2" fill="#CBD5E1" />
          <rect x="9" y="27" width="5" height="3" rx="1" fill="#FEF08A" />
          <rect x="34" y="27" width="5" height="3" rx="1" fill="#FEF08A" />
          <circle cx="13" cy="35" r="4" fill="#0F172A" />
          <circle cx="13" cy="35" r="1.5" fill="#94A3B8" />
          <circle cx="35" cy="35" r="4" fill="#0F172A" />
          <circle cx="35" cy="35" r="1.5" fill="#94A3B8" />
        </svg>
      );

    default:
      return null;
  }
};

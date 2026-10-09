import React, { useState } from 'react';
import type { ActiveTripData } from './model/lifecycleTypes';
import { ActiveTripHub } from './components/ActiveTripHub';
import { PhoneContactModal } from './components/PhoneContactModal';
import { TripChatView } from './components/TripChatView';
import { RendezvousMeetingView } from './components/RendezvousMeetingView';
import { SafetyEmergencyModal } from './components/SafetyEmergencyModal';
import { BookingRescueModal } from './components/BookingRescueModal';
import { TripReviewModal } from './components/TripReviewModal';
import { DriverWorkflowModal } from './components/DriverWorkflowModal';
import { NotificationsCenterModal } from './components/NotificationsCenterModal';
import { MOCK_ASSETS } from '../search/assets/mockAssets';

interface TripLifecycleCoordinatorProps {
  initialTrip?: Partial<ActiveTripData>;
  onCloseLifecycle?: () => void;
  onBookAlternative?: (altId: string) => void;
}

export function buildDefaultActiveTrip(): ActiveTripData {
  return {
    id: 'active-trip-v7-1',
    routeTitle: 'Львів → Київ',
    originCity: 'Львів',
    destCity: 'Київ',
    pickupAddress: 'Львів, вул. Стрийська 45 (АЗС WOG)',
    dropoffAddress: 'Київ, Центральний залізничний вокзал',
    departureTime: '18:30',
    arrivalTime: '23:50',
    durationLabel: '5 год 20 хв',
    distanceLabel: '520 км',
    priceLabel: '420 ₴',
    seats: 1,
    status: 'confirmed',
    statusLabel: 'Підтверджено',
    driver: {
      name: 'Андрій',
      avatar: MOCK_ASSETS.avatarAndriy,
      phone: '+380 67 123 4567',
      rating: 4.9,
      reviewCount: 124,
      vehicleModel: 'Toyota Camry · Чорний',
      vehiclePlate: 'BC 7788 AI',
      verified: true,
    },
    driverEtaMinutes: 4,
    driverDistanceMeters: 1200,
    isLocationSharing: true,
    passengerCoordinates: [24.0297, 49.8397],
    driverCoordinates: [24.0215, 49.8310],
    pickupCoordinates: [24.0297, 49.8397],
  };
}

type ActiveView =
  | 'hub'
  | 'chat'
  | 'rendezvous'
  | 'driver_nav';

export const TripLifecycleCoordinator: React.FC<TripLifecycleCoordinatorProps> = ({
  initialTrip,
  onCloseLifecycle,
  onBookAlternative,
}) => {
  const [trip, setTrip] = useState<ActiveTripData>(() => ({
    ...buildDefaultActiveTrip(),
    ...initialTrip,
  }));

  const [currentView, setCurrentView] = useState<ActiveView>('hub');

  // Modals state
  const [showPhoneModal, setShowPhoneModal] = useState(false);
  const [showSafetyModal, setShowSafetyModal] = useState(false);
  const [showRescueModal, setShowRescueModal] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [showNotificationsModal, setShowNotificationsModal] = useState(false);

  const handleConfirmBoarding = () => {
    setTrip((prev) => ({
      ...prev,
      status: 'in_progress',
      statusLabel: 'У дорозі',
    }));
    setCurrentView('hub');
  };

  const handleConfirmCancel = (_reason: string) => {
    setTrip((prev) => ({
      ...prev,
      status: 'cancelled',
      statusLabel: 'Скасовано',
    }));
    setShowRescueModal(false);
  };

  const handleReviewSubmit = (_rating: number, _comment: string, _tags: string[]) => {
    setTrip((prev) => ({
      ...prev,
      status: 'completed',
      statusLabel: 'Завершено',
    }));
  };

  const handleNavigateFromNotification = (screen: string) => {
    setShowNotificationsModal(false);
    if (screen === 'active_trip') setCurrentView('hub');
    else if (screen === 'chat') setCurrentView('chat');
    else if (screen === 'rendezvous') setCurrentView('rendezvous');
    else if (screen === 'phone') setShowPhoneModal(true);
    else if (screen === 'safety') setShowSafetyModal(true);
    else if (screen === 'rescue') setShowRescueModal(true);
    else if (screen === 'review') setShowReviewModal(true);
  };

  return (
    <div className="relative min-h-[100svh] w-full bg-[#F4F8FF] dark:bg-[#070E1B]">
      {/* Primary Screen Views */}
      {currentView === 'hub' && (
        <ActiveTripHub
          trip={trip}
          onBack={onCloseLifecycle || (() => {})}
          onOpenChat={() => setCurrentView('chat')}
          onOpenPhoneModal={() => setShowPhoneModal(true)}
          onOpenRendezvous={() => setCurrentView('rendezvous')}
          onOpenSafetyModal={() => setShowSafetyModal(true)}
          onOpenRescueModal={() => setShowRescueModal(true)}
          onOpenReviewModal={() => setShowReviewModal(true)}
        />
      )}

      {currentView === 'chat' && (
        <TripChatView
          driver={trip.driver}
          onBack={() => setCurrentView('hub')}
          onCallDriver={() => setShowPhoneModal(true)}
        />
      )}

      {currentView === 'rendezvous' && (
        <RendezvousMeetingView
          trip={trip}
          onBack={() => setCurrentView('hub')}
          onOpenChat={() => setCurrentView('chat')}
          onOpenPhoneModal={() => setShowPhoneModal(true)}
          onConfirmBoarding={handleConfirmBoarding}
        />
      )}

      {currentView === 'driver_nav' && (
        <DriverWorkflowModal
          onClose={() => setCurrentView('hub')}
        />
      )}

      {/* Floating Modals */}
      {showPhoneModal && (
        <PhoneContactModal
          driver={trip.driver}
          onClose={() => setShowPhoneModal(false)}
        />
      )}

      {showSafetyModal && (
        <SafetyEmergencyModal
          trip={trip}
          onClose={() => setShowSafetyModal(false)}
        />
      )}

      {showRescueModal && (
        <BookingRescueModal
          trip={trip}
          onClose={() => setShowRescueModal(false)}
          onConfirmCancel={handleConfirmCancel}
          onBookAlternative={(altId) => {
            setShowRescueModal(false);
            onBookAlternative?.(altId);
          }}
        />
      )}

      {showReviewModal && (
        <TripReviewModal
          trip={trip}
          onClose={() => setShowReviewModal(false)}
          onSubmitReview={handleReviewSubmit}
        />
      )}

      {showNotificationsModal && (
        <NotificationsCenterModal
          onClose={() => setShowNotificationsModal(false)}
          onNavigateToScreen={handleNavigateFromNotification}
        />
      )}
    </div>
  );
};

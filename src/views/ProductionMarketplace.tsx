import { FormEvent, lazy, Suspense, useCallback, useEffect, useRef, useState } from 'react';
import {
  ArrowDownUp, ArrowLeft, ArrowRight, Baby, Ban, Bell, Briefcase, CalendarDays, CarFront, ChevronRight,
  CircleUserRound, Clock3, Compass, FileDown, FileText, Flag, HelpCircle, Home, LogOut, MapPin, MessageCircle, Minus, Moon, Navigation,
  PawPrint, Plus, Search, Settings, ShieldCheck, SlidersHorizontal, Sun, Ticket, User, Users, X,
} from 'lucide-react';

import { Capacitor } from '@capacitor/core';
import { StatusBar, Style } from '@capacitor/status-bar';
import { BrandMark } from '../components/BrandMark';
import { VehiclePhoto } from '../components/VehiclePhoto';
import { passengersLabel } from '../domain/plural';
import { TransportTypesPanel } from '../components/TransportTypesPanel';
import { OtherModesPanel } from '../components/OtherModesPanel';
import { PlanTripChoice } from './PlanTripChoice';
import { OnboardingSlides } from '../components/OnboardingSlides';
import { DriverPhotoCard } from '../components/DriverPhotoCard';
import { OfferEditSheet } from '../components/TripManagement';
import { activeTypesForSearch, loadSelection, saveSelection, selectAll, toJourneyPreferences, type TransportSelection, type TransportTypeId } from '../domain/transportPreferences';
import { TicketQr } from '../components/TicketQr';
import type { ProfileSection } from './ProfileSections';
import { ApiAccountDeletionRequest, ApiBlockedUser, ApiBooking, ApiDemand, ApiJourneySearchResult, ApiJourneyStrategy, ApiMessage, ApiModerationCase, ApiNotification, ApiNotificationPage, ApiOffer, ApiPassengerNavigationMatch, ApiPlace, ApiProposal, ApiProposalRevision, ApiRescueResult, ApiRendezvous, ApiStoredJourney, ApiUser, ApiVehicle, ApiVehiclePhoto, ApiVerificationQueueItem, ApiVerificationRecord, productionApi } from '../services/productionApi';
import { OfflineNavigationStore } from '../navigation/OfflineNavigationStore';
import { defaultKyivDateTime, formatKyivDateTimeInput, kyivDateTimeInputToDate, kyivDateTimeInputToIso } from '../domain/kyivTime';
import { useProductionTabRouter } from '../routing/useProductionTabRouter';
import { pathForProductionEntity, type ProductionTab } from '../routing/productionRoutes';
import { buildSearchRoute, parseSearchRoute } from '../routing/searchRouteState';
import { JourneyResultsPanel } from './JourneyResultsPanel';
import { themeService } from '../services/theme';
const MobilityAdminPanel = lazy(() => import('./MobilityAdminPanel').then((module) => ({ default: module.MobilityAdminPanel })));
const ProfileSections = lazy(() => import('./ProfileSections').then((module) => ({ default: module.ProfileSections })));
const MapPointPicker = lazy(() => import('../components/MapPointPicker').then((module) => ({ default: module.MapPointPicker })));
const OfferRoutePreview = lazy(() => import('./OfferRoutePreview').then((module) => ({ default: module.OfferRoutePreview })));
const MeetingMapView = lazy(() => import('./MeetingMapView').then((module) => ({ default: module.MeetingMapView })));
const TransportMapView = lazy(() => import('./TransportMapView').then((module) => ({ default: module.TransportMapView })));
const ProductionNavigation = lazy(() => import('./ProductionNavigation').then((module) => ({ default: module.ProductionNavigation })));
import { HomeV5 } from './HomeV5';
import { SearchExperienceV6 } from '../features/search/SearchExperienceV6';
import type { SearchTransportMode } from '../features/search/model/types';

type Tab = ProductionTab;
const formatMoney = (minor: number, currency: string) => new Intl.NumberFormat('uk-UA', { style: 'currency', currency, maximumFractionDigits: 0 }).format(minor / 100);
const formatDate = (value: string, options: Intl.DateTimeFormatOptions = { dateStyle: 'medium', timeStyle: 'short' }) => new Intl.DateTimeFormat('uk-UA', { ...options, timeZone: 'Europe/Kyiv' }).format(new Date(value));
const todayKyiv = () => new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Kyiv' }).format(new Date());
const tabItems: { id: Tab; label: string; icon: typeof Home }[] = [
  { id: 'home', label: 'Головна', icon: Home },
  { id: 'search', label: 'Пошук', icon: Search },
  { id: 'trips', label: 'Поїздки', icon: Ticket },
  { id: 'profile', label: 'Профіль', icon: CircleUserRound },
];
const demandRequirementLabels: Record<string, string> = { luggage: 'Багаж', pets: 'Тварини', childSeat: 'Дитяче крісло' };

/** Usable = level 1+ (plate and photo). Older servers only expose verification_status, so 'verified' also counts. */
const vehicleUsable = (vehicle: ApiVehicle) => (vehicle.trust_level ?? 0) >= 1 || vehicle.verification_status === 'verified';

export function ProductionMarketplace() {
  const [user, setUser] = useState<ApiUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [isDark, setIsDark] = useState(() => themeService.isDark());
  const [phone, setPhone] = useState('+380');
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [otpRequested, setOtpRequested] = useState(false);
  const [devCode, setDevCode] = useState('');
  const [authIntro, setAuthIntro] = useState(false);
  const [onboardingStep, setOnboardingStep] = useState(0);
  const [onboardingPermissionMessage, setOnboardingPermissionMessage] = useState('');
  const [origin, setOrigin] = useState('');
  const [destination, setDestination] = useState('');
  const [useLegacySearchForm, setUseLegacySearchForm] = useState(import.meta.env.VITE_ENABLE_LEGACY_SEARCH_FORM === 'true');
  const [searchOriginPlace, setSearchOriginPlace] = useState<ApiPlace | null>(null);
  const [searchDestinationPlace, setSearchDestinationPlace] = useState<ApiPlace | null>(null);
  const [routePlaceField, setRoutePlaceField] = useState<'origin' | 'destination' | null>(null);
  const [routePlaceSuggestions, setRoutePlaceSuggestions] = useState<ApiPlace[]>([]);
  const [date, setDate] = useState(todayKyiv);
  const [seats, setSeats] = useState(1);
  const [searchScheduleMode, setSearchScheduleMode] = useState<'now' | 'scheduled'>('now');
  const [searchRequirements, setSearchRequirements] = useState({ luggage: false, pets: false, childSeat: false });
  const [showFilterSheet, setShowFilterSheet] = useState(false);
  const [showTransportModal, setShowTransportModal] = useState(false);
  const [journeyDeparture, setJourneyDeparture] = useState(() => defaultKyivDateTime(1, 8));
  const [journeyStrategy, setJourneyStrategy] = useState<ApiJourneyStrategy>('BALANCED');
  const [journeyResult, setJourneyResult] = useState<ApiJourneySearchResult | null>(null);
  const [journeyResultMode, setJourneyResultMode] = useState('all');
  const [journeyBookingLink, setJourneyBookingLink] = useState<{ journeyId: string; journeyLegId: string } | null>(null);
  const [journeys, setJourneys] = useState<ApiStoredJourney[]>([]);
  const [notificationPage, setNotificationPage] = useState<ApiNotificationPage>({ items: [], nextCursor: null, unreadCount: 0 });
  const [showNotifications, setShowNotifications] = useState(false);
  const [notificationsLoading, setNotificationsLoading] = useState(false);
  const [offers, setOffers] = useState<ApiOffer[]>([]);
  const [myOffers, setMyOffers] = useState<ApiOffer[]>([]);
  const [bookings, setBookings] = useState<ApiBooking[]>([]);
  const [rendezvousSessions, setRendezvousSessions] = useState<Record<string, ApiRendezvous>>({});
  const rendezvousSessionsRef = useRef<Record<string, ApiRendezvous>>({});
  const [rendezvousBusyId, setRendezvousBusy] = useState<string | null>(null);
  const [bookingRescues, setBookingRescues] = useState<Record<string, { loading: boolean; failed: boolean; result?: ApiRescueResult }>>({});
  const [blockedUsers, setBlockedUsers] = useState<ApiBlockedUser[]>([]);
  const [vehicles, setVehicles] = useState<ApiVehicle[]>([]);
  const [vehiclePhotos, setVehiclePhotos] = useState<Record<string, ApiVehiclePhoto[]>>({});
  const [verificationRecords, setVerificationRecords] = useState<ApiVerificationRecord[]>([]);
  const [myDemands, setMyDemands] = useState<ApiDemand[]>([]);
  const [passengerNavigationMatches, setPassengerNavigationMatches] = useState<ApiPassengerNavigationMatch[]>([]);
  const [openDemands, setOpenDemands] = useState<ApiDemand[]>([]);
  const [selectedDemand, setSelectedDemand] = useState<ApiDemand | null>(null);
  const [selectedDemandIsOwned, setSelectedDemandIsOwned] = useState(false);
  const [proposals, setProposals] = useState<ApiProposal[]>([]);
  const [proposalRevisions, setProposalRevisions] = useState<Record<string, ApiProposalRevision[]>>({});
  const [proposalTarget, setProposalTarget] = useState<ApiDemand | null>(null);
  const [proposalNavigationCandidateId, setProposalNavigationCandidateId] = useState<string | null>(null);
  const [counterTarget, setCounterTarget] = useState<ApiProposal | null>(null);
  const [showCreateMenu, setShowCreateMenu] = useState(false);
  const [placeField, setPlaceField] = useState<'origin' | 'destination' | null>(null);
  const [placeSuggestions, setPlaceSuggestions] = useState<ApiPlace[]>([]);
  const [placeSearchBusy, setPlaceSearchBusy] = useState(false);
  const [demandOriginText, setDemandOriginText] = useState('');
  const [demandDestinationText, setDemandDestinationText] = useState('');
  const [demandOrigin, setDemandOrigin] = useState<ApiPlace | null>(null);
  const [demandDestination, setDemandDestination] = useState<ApiPlace | null>(null);
  const [offerOriginText, setOfferOriginText] = useState('');
  const [offerDestinationText, setOfferDestinationText] = useState('');
  const [offerOrigin, setOfferOrigin] = useState<ApiPlace | null>(null);
  const [offerDestination, setOfferDestination] = useState<ApiPlace | null>(null);
  const [offerPlaceField, setOfferPlaceField] = useState<'origin' | 'destination' | null>(null);
  const [offerPlaceSuggestions, setOfferPlaceSuggestions] = useState<ApiPlace[]>([]);
  const [offerDeparture, setOfferDeparture] = useState(() => defaultKyivDateTime(1, 8));
  const [offerPrice, setOfferPrice] = useState('150');
  const [offerSeats, setOfferSeats] = useState(1);
  const [offerVehicleId, setOfferVehicleId] = useState('');
  const [demandEarliest, setDemandEarliest] = useState(() => defaultKyivDateTime(1, 8));
  const [demandLatest, setDemandLatest] = useState(() => defaultKyivDateTime(1, 10));
  const [demandPassengers, setDemandPassengers] = useState(1);
  const [demandBudget, setDemandBudget] = useState('');
  const [demandBudgetType, setDemandBudgetType] = useState<'total_all' | 'per_seat'>('total_all');
  const [demandNotes, setDemandNotes] = useState('');
  const [demandRequirements, setDemandRequirements] = useState({ luggage: false, pets: false, childSeat: false });
  const [proposalPrice, setProposalPrice] = useState('');
  const [proposalDeparture, setProposalDeparture] = useState('');
  const [proposalComment, setProposalComment] = useState('');
  const [proposalVehicleId, setProposalVehicleId] = useState('');
  const [counterPrice, setCounterPrice] = useState('');
  const [counterDeparture, setCounterDeparture] = useState('');
  const [counterComment, setCounterComment] = useState('');
  const { tab, setTab, activateTab, route, locationKey, setRoutePath, notFound, goHome } = useProductionTabRouter();
  const [showResults, setShowResults] = useState(false);
  const [picker, setPicker] = useState<{ form: 'search' | 'offer' | 'demand'; field: 'origin' | 'destination' } | null>(null);
  const [profileSection, setProfileSection] = useState<ProfileSection | null>(null);
  const [transportSelection, setTransportSelection] = useState<TransportSelection>(() => loadSelection());
  const [navAutoStart, setNavAutoStart] = useState(false);
  const [bookSeats, setBookSeats] = useState(1);
  const [meetingBookingId, setMeetingBookingId] = useState<string | null>(null);
  const [bookError, setBookError] = useState('');
  const [confirmDeletion, setConfirmDeletion] = useState(false);
  const [editingOffer, setEditingOffer] = useState<ApiOffer | null>(null);
  const [vehicleToDelete, setVehicleToDelete] = useState<ApiVehicle | null>(null);
  const [tripsSection, setTripsSection] = useState<'active' | 'upcoming' | 'past' | 'requests'>('upcoming');
  const tripsSectionChosen = useRef(false);
  const [providerGroups, setProviderGroups] = useState<Awaited<ReturnType<typeof productionApi.providersByTransport>> | null>(null);
  const [offerSort, setOfferSort] = useState<'earliest' | 'cheapest' | 'fastest'>('earliest');
  const [restoredSearchMode, setRestoredSearchMode] = useState<'offers' | 'planner' | null>(null);
  const [selectedOffer, setSelectedOffer] = useState<ApiOffer | null>(null);
  const [selectedJourney, setSelectedJourney] = useState<ApiStoredJourney | null>(null);
  const [selectedBooking, setSelectedBooking] = useState<ApiBooking | null>(null);
  const [visibleBookingTicket, setVisibleBookingTicket] = useState<{ bookingId: string; token: string } | null>(null);
  const [boardingTicketInput, setBoardingTicketInput] = useState<Record<string, string>>({});
  const [reviewBookingId, setReviewBookingId] = useState<string | null>(null);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const [messages, setMessages] = useState<ApiMessage[]>([]);
  const [olderMessagesAvailable, setOlderMessagesAvailable] = useState(false);
  const [olderMessageCursor, setOlderMessageCursor] = useState<string | null>(null);
  const [loadingOlderMessages, setLoadingOlderMessages] = useState(false);
  const [unreadConversations, setUnreadConversations] = useState<Record<string, number>>({});
  const [realtimeConnected, setRealtimeConnected] = useState(false);
  const [messageDraft, setMessageDraft] = useState('');
  const [busy, setBusy] = useState(false);
  const [bookingToCancel, setBookingToCancel] = useState<ApiBooking | null>(null);
  const [exportingData, setExportingData] = useState(false);
  const [deletionRequest, setDeletionRequest] = useState<ApiAccountDeletionRequest | null>(null);
  const [deletionBusy, setDeletionBusy] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [showVehicleForm, setShowVehicleForm] = useState(false);
  const [verificationTarget, setVerificationTarget] = useState<ApiVehicle | null>(null);
  const [registrationEvidence, setRegistrationEvidence] = useState<File | null>(null);
  const [driverLicenseEvidence, setDriverLicenseEvidence] = useState<File | null>(null);
  const [adminQueue, setAdminQueue] = useState<ApiVerificationQueueItem[]>([]);
  const [moderationCases, setModerationCases] = useState<ApiModerationCase[]>([]);
  const [moderationNotes, setModerationNotes] = useState<Record<string, string>>({});
  const [showReportForm, setShowReportForm] = useState(false);
  const [reportCategory, setReportCategory] = useState<ApiModerationCase['category']>('safety');
  const [reportDetails, setReportDetails] = useState('');
  const [reviewingRecord, setReviewingRecord] = useState<ApiVerificationQueueItem | null>(null);
  const [reviewEvidenceUrl, setReviewEvidenceUrl] = useState('');
  const [reviewNote, setReviewNote] = useState('');
  const [vehicleForm, setVehicleForm] = useState({ make: '', model: '', modelYear: new Date().getFullYear(), seats: 4, plate: '' });
  const [vehicleFormPhoto, setVehicleFormPhoto] = useState<File | null>(null);
  const routedEntityKey = useRef('');
  const hydratedSearchLocation = useRef<string | null>(null);

  const refreshUnreadConversations = useCallback(async () => {
    const unread = await productionApi.conversationUnreadCounts();
    setUnreadConversations(Object.fromEntries(unread.filter((item) => item.booking_id).map((item) => [item.booking_id!, item.unread_count])));
  }, []);
  const refreshBookings = useCallback(async () => {
    setBookings(await productionApi.bookings());
    await refreshUnreadConversations().catch(() => undefined);
  }, [refreshUnreadConversations]);
  useEffect(() => { rendezvousSessionsRef.current = rendezvousSessions; }, [rendezvousSessions]);
  // Opening an offer: start from the passenger count of the search, never above the free seats.
  useEffect(() => { if (selectedOffer) { setBookSeats(Math.max(1, Math.min(seats, selectedOffer.available_seats))); setBookError(''); } }, [selectedOffer?.id, seats]);
  // Publishing a trip: preselect the active (or only) usable vehicle and keep the seat count within its capacity.
  useEffect(() => {
    const usable = vehicles.filter(vehicleUsable);
    if (usable.length === 0) { if (offerVehicleId) setOfferVehicleId(''); return; }
    const current = usable.find((vehicle) => vehicle.id === offerVehicleId);
    const chosen = current ?? usable.find((vehicle) => vehicle.is_active) ?? usable[0];
    if (!current) { setOfferVehicleId(chosen.id); setOfferSeats(Math.min(3, chosen.seat_count)); }
    else if (offerSeats > current.seat_count) setOfferSeats(current.seat_count);
  }, [vehicles, offerVehicleId]);
  const refreshJourneys = useCallback(async () => setJourneys(await productionApi.journeys()), []);
  const refreshNotifications = useCallback(async () => setNotificationPage(await productionApi.notifications()), []);
  const refreshBlockedUsers = useCallback(async () => setBlockedUsers(await productionApi.blockedUsers()), []);
  const refreshMyOffers = useCallback(async () => setMyOffers(await productionApi.myOffers()), []);
  const refreshVehicles = useCallback(async () => {
    const [nextVehicles, nextVerification] = await Promise.all([productionApi.vehicles(), productionApi.verificationRecords()]);
    const photos = await Promise.all(nextVehicles.map(async (vehicle) => [vehicle.id, await productionApi.vehiclePhotos(vehicle.id).catch(() => [])] as const));
    setVehicles(nextVehicles); setVerificationRecords(nextVerification); setVehiclePhotos(Object.fromEntries(photos));
  }, []);
  const refreshMyDemands = useCallback(async () => setMyDemands(await productionApi.myDemands()), []);
  const refreshPassengerNavigationMatches = useCallback(async () => setPassengerNavigationMatches(await productionApi.myNavigationMatches()), []);
  const refreshOpenDemands = useCallback(async () => setOpenDemands(await productionApi.openDemands()), []);
  const refreshAdminQueue = useCallback(async () => setAdminQueue(await productionApi.adminVerificationQueue()), []);
  const refreshModerationCases = useCallback(async () => setModerationCases(await productionApi.moderationCases('all')), []);

  useEffect(() => {
    if (!user || loading || tab !== 'admin' || !user.roles.some((role) => role === 'admin' || role === 'moderator')) return;
    void Promise.all([refreshAdminQueue(), refreshModerationCases()]).catch((error: unknown) => {
      setStatusMessage(error instanceof Error ? error.message : 'Черга модерації недоступна.');
    });
  }, [loading, refreshAdminQueue, refreshModerationCases, tab, user?.id, user?.roles.join(',')]);
  // Until the user picks a section, show the first one that has trips (active → upcoming → past). Declared before any early return.
  const activeTripCount = bookings.filter((booking) => booking.status === 'boarding' || booking.status === 'in_progress').length;
  const upcomingTripCount = bookings.filter((booking) => booking.status === 'confirmed').length + journeys.length; // saved journeys belong to "Майбутні"
  const pastTripCount = bookings.filter((booking) => booking.status !== 'boarding' && booking.status !== 'in_progress' && booking.status !== 'confirmed').length;
  useEffect(() => {
    if (tripsSectionChosen.current) return;
    setTripsSection(activeTripCount > 0 ? 'active' : upcomingTripCount > 0 ? 'upcoming' : pastTripCount > 0 ? 'past' : 'upcoming');
  }, [activeTripCount, upcomingTripCount, pastTripCount]);

  const changeTransportSelection = (selection: TransportSelection) => { setTransportSelection(selection); saveSelection(selection); };
  // Providers depend on where the search starts: reload when the origin point changes.
  useEffect(() => {
    if (!user) return;
    const point = searchOriginPlace ? { latitude: searchOriginPlace.latitude, longitude: searchOriginPlace.longitude } : undefined;
    productionApi.providersByTransport(point).then(setProviderGroups).catch(() => setProviderGroups(null));
  }, [user, searchOriginPlace]);

  const loadOffers = useCallback(async () => {
    if (!activeTypesForSearch(transportSelection).includes('carpool')) { setOffers([]); return []; }
    const next = await productionApi.offers({
      origin: origin.trim(), destination: destination.trim(), date, seats,
      ...(searchOriginPlace && searchDestinationPlace ? {
        originCoordinates: [searchOriginPlace.longitude, searchOriginPlace.latitude] as [number, number],
        destinationCoordinates: [searchDestinationPlace.longitude, searchDestinationPlace.latitude] as [number, number],
      } : {}),
    });
    setOffers(next);
    return next;
  }, [date, destination, origin, seats, searchDestinationPlace, searchOriginPlace, transportSelection]);

  useEffect(() => {
    if (route?.kind === 'tab' && route.tab === 'home' && tab === 'home') {
      setShowResults(false);
      return;
    }
    if (!user || loading || tab !== 'search' || route?.kind !== 'tab'
      || hydratedSearchLocation.current === locationKey) return;
    hydratedSearchLocation.current = locationKey;
    const parsed = parseSearchRoute(window.location.search);
    if (!parsed) {
      if (route.tab === 'home') setShowResults(false);
      return;
    }
    setOrigin(parsed.origin.label);
    setDestination(parsed.destination.label);
    setSearchOriginPlace(parsed.origin);
    setSearchDestinationPlace(parsed.destination);
    setDate(parsed.date);
    setSeats(parsed.passengers);
    setJourneyDeparture(parsed.departure);
    setJourneyStrategy(parsed.strategy);
    setJourneyResult(null);
    setRestoredSearchMode(parsed.mode);
    setShowResults(true);

    let active = true;
    void productionApi.offers({
      origin: parsed.origin.label,
      destination: parsed.destination.label,
      date: parsed.date,
      seats: parsed.passengers,
      originCoordinates: [parsed.origin.longitude, parsed.origin.latitude],
      destinationCoordinates: [parsed.destination.longitude, parsed.destination.latitude],
    }).then((nextOffers) => {
      if (active) setOffers(nextOffers);
    }).catch((error: unknown) => {
      if (active) setStatusMessage(error instanceof Error ? error.message : 'Не вдалося відновити результати пошуку.');
    });
    if (parsed.mode === 'planner') {
      setStatusMessage('Параметри планування відновлено. Натисніть «Оптимізувати весь маршрут», щоб оновити варіанти.');
    }
    return () => { active = false; };
  }, [loading, locationKey, route?.kind, route?.tab, tab, user?.id]);

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;
    void StatusBar.setOverlaysWebView({ overlay: true }).catch(() => undefined);
    void StatusBar.setStyle({ style: user ? Style.Light : Style.Dark }).catch(() => undefined);
  }, [user]);

  useEffect(() => {
    return themeService.subscribe((_theme, dark) => setIsDark(dark));
  }, []);

  useEffect(() => {
    productionApi.restoreSession().then(async () => {
      const currentUser = await productionApi.me();
      setUser(currentUser);
      const [currentDeletionRequest] = await Promise.all([productionApi.accountDeletionRequest(), refreshBookings(), refreshJourneys(), refreshNotifications(), refreshVehicles(), refreshBlockedUsers(), ...(currentUser.roles.includes('driver') ? [refreshMyOffers(), refreshOpenDemands()] : []), ...(currentUser.roles.includes('passenger') ? [refreshMyDemands(), refreshPassengerNavigationMatches()] : [])]);
      setDeletionRequest(currentDeletionRequest);
    }).catch((error: unknown) => {
      setUser(null);
      
      if (error instanceof DOMException && error.name === 'AbortError') {
        setStatusMessage('Сервер не відповідає. Перевірте з’єднання та спробуйте увійти ще раз.');
      }
    }).finally(() => setLoading(false));
  }, [refreshBlockedUsers, refreshBookings, refreshJourneys, refreshMyOffers, refreshPassengerNavigationMatches, refreshVehicles]);

  useEffect(() => {
    const entityId = route?.entityId;
    if (!user || loading || !route || route.kind === 'tab' || !entityId) {
      routedEntityKey.current = '';
      return;
    }
    const key = `${user.id}:${route.kind}:${entityId}`;
    if (routedEntityKey.current === key) return;
    routedEntityKey.current = key;
    let active = true;
    const load = async () => {
      try {
        if (route.kind === 'offer') {
          const offer = await productionApi.offer(entityId);
          if (!active) return;
          setSelectedJourney(null); setSelectedOffer(offer); activateTab('search');
        } else if (route.kind === 'booking') {
          const currentBookings = await productionApi.bookings();
          const booking = currentBookings.find((item) => item.id === entityId);
          if (!booking) throw new Error('Бронювання недоступне для цього облікового запису.');
          if (!active) return;
          setBookings(currentBookings); setSelectedOffer(null); setSelectedJourney(null); activateTab('trips');
        } else if (route.kind === 'demand') {
          let demand: ApiDemand | undefined;
          let owned = false;
          if (user.roles.includes('passenger')) {
            const mine = await productionApi.myDemands();
            demand = mine.find((item) => item.id === entityId);
            owned = Boolean(demand);
            if (active) setMyDemands(mine);
          }
          if (!demand && user.roles.includes('driver')) demand = await productionApi.openDemand(entityId);
          if (!demand) throw new Error('Заявка недоступна для цього облікового запису.');
          const nextProposals = await productionApi.demandProposals(entityId).catch(() => []);
          if (!active) return;
          setSelectedDemand(demand); setSelectedDemandIsOwned(owned); setProposals(nextProposals);
          activateTab(owned ? 'my-demands' : 'requests');
        } else if (route.kind === 'journey') {
          const journey = await productionApi.journey(entityId);
          if (!active) return;
          setSelectedOffer(null); setSelectedJourney(journey); activateTab('trips');
        } else if (route.kind === 'conversation') {
          const conversation = await productionApi.conversationById(entityId);
          const currentBookings = await productionApi.bookings();
          const booking = currentBookings.find((item) => item.id === conversation.booking_id);
          if (!booking) throw new Error('Розмова недоступна для цього облікового запису.');
          const history = await productionApi.messagePage(conversation.id);
          const readState = await productionApi.markConversationRead(conversation.id).catch(() => null);
          if (!active) return;
          setBookings(currentBookings); setSelectedBooking(booking); setMessages(history.messages);
          setOlderMessagesAvailable(history.hasMore); setOlderMessageCursor(history.nextCursor);
          if (readState) setUnreadConversations((current) => ({ ...current, [booking.id]: readState.unread_count }));
          activateTab('chat');
        }
      } catch (error) {
        if (!active) return;
        setStatusMessage(error instanceof Error ? error.message : 'Посилання більше недоступне. Перевірте доступ і спробуйте ще раз.');
        activateTab(route.tab);
      }
    };
    void load();
    return () => { active = false; };
  }, [activateTab, loading, route?.entityId, route?.kind, route?.tab, user?.id, user?.roles.join(',')]);

  useEffect(() => {
    if (!user) return;
    return productionApi.subscribeRealtime((event) => {
      void refreshNotifications().catch(() => undefined);
      if (event.type === 'conversation.message.created') {
        if (event.data.sender_id !== user.id) void refreshUnreadConversations().catch(() => undefined);
        return;
      }
      if (event.type === 'journey.updated') {
        void refreshJourneys().catch(() => setStatusMessage('Маршрут не оновився. Оновіть список поїздок.'));
        setStatusMessage(event.data.state === 'READY' ? 'Ваш маршрут готов, бронювання збережене.' : 'Стан маршруту змінився. Перевірте актуальні варіанти.');
        return;
      }
      if (event.type === 'booking.change-requested') setStatusMessage('Водій змінив умови поїздки. Перегляньте зміни в «Поїздках» і погодьтеся або відмовтеся.');
      if (event.type === 'trip.cancelled') setStatusMessage('Водій скасував поїздку. Ваше бронювання скасовано.');
      if (event.type === 'trip.updated') setStatusMessage('Водій оновив поїздку. Перевірте актуальні деталі.');
      if (event.type.startsWith('booking.') || event.type.startsWith('trip.')) {
        void Promise.all([refreshBookings(), ...(user.roles.includes('driver') ? [refreshMyOffers()] : [])])
          .catch((error: unknown) => setStatusMessage(error instanceof Error ? error.message : 'Стан бронювання не оновився.'));
        return;
      }
      if (event.type.startsWith('rendezvous.')) {
        if ('rendezvous_id' in event.data) {
          const rendezvousId = event.data.rendezvous_id;
          const session = Object.values(rendezvousSessionsRef.current).find((item) => item.id === rendezvousId);
          if (session) void productionApi.bookingRendezvous(session.bookingId).then((next) => setRendezvousSessions((current) => ({ ...current, [session.bookingId]: next }))).catch(() => undefined);
        }
        return;
      }
      if (event.type === 'navigation.match.driver-interested') {
        if (user.roles.includes('passenger')) {
          void refreshPassengerNavigationMatches()
            .then(() => setStatusMessage('Водій зацікавився вашою заявкою на маршрут.'))
            .catch((error: unknown) => setStatusMessage(error instanceof Error ? error.message : 'Не вдалося оновити пропозиції водіїв.'));
        }
        return;
      }
      if (!event.type.startsWith('proposal.')) return;
      const refreshes: Promise<unknown>[] = [];
      if (user.roles.includes('driver')) refreshes.push(refreshOpenDemands());
      if (user.roles.includes('passenger')) refreshes.push(refreshMyDemands());
      if (selectedDemand) refreshes.push(productionApi.demandProposals(selectedDemand.id).then(setProposals));
      void Promise.all(refreshes).catch((error: unknown) => setStatusMessage(error instanceof Error ? error.message : 'Цінова пропозиція змінилася. Оновіть список.'));
    }, () => undefined);
  }, [refreshBookings, refreshJourneys, refreshMyDemands, refreshMyOffers, refreshNotifications, refreshOpenDemands, refreshUnreadConversations, selectedDemand?.id, user?.id, user?.roles.join(',')]);

  useEffect(() => {
    if (!user) return;
    const pending = bookings.filter(booking => booking.status === 'cancelled' && !booking.current_user_is_driver && !bookingRescues[booking.id]);
    if (!pending.length) return;
    setBookingRescues(current => ({
      ...current,
      ...Object.fromEntries(pending.map(booking => [booking.id, { loading: true, failed: false }])),
    }));
    for (const booking of pending) {
      void productionApi.bookingRescue(booking.id)
        .then(result => setBookingRescues(current => ({ ...current, [booking.id]: { loading: false, failed: false, result } })))
        .catch(() => setBookingRescues(current => ({ ...current, [booking.id]: { loading: false, failed: true } })));
    }
  }, [bookingRescues, bookings, user?.id]);

  useEffect(() => {
    if (!user || tab !== 'trips') return;
    // Keep the cross-device trip state fresh if a realtime connection is temporarily unavailable.
    const timer = window.setInterval(() => {
      if (document.visibilityState === 'visible') {
        void refreshBookings().catch((error: unknown) => setStatusMessage(error instanceof Error ? error.message : 'Стан поїздок не оновився.'));
      }
    }, 3000);
    return () => window.clearInterval(timer);
  }, [refreshBookings, tab, user?.id]);

  useEffect(() => {
    if (tab !== 'chat' || !selectedBooking) { setRealtimeConnected(false); return; }
    let disposed = false;
    let unsubscribe: () => void = () => { /* No socket exists until the conversation is resolved. */ };
    void productionApi.conversation(selectedBooking.id).then((conversation) => {
      if (disposed) return;
      unsubscribe = productionApi.subscribeRealtime((event) => {
        if (event.type !== 'conversation.message.created') return;
        if (event.data.conversation_id !== conversation.id) return;
        setMessages((current) => current.some((message) => message.id === event.data.id)
          ? current : [...current, event.data]);
        if (document.visibilityState === 'visible') {
          void productionApi.markConversationRead(conversation.id)
            .then((readState) => {
              const bookingId = selectedBooking.id;
              setUnreadConversations((current) => ({ ...current, [bookingId]: readState.unread_count }));
            })
            .catch(() => undefined);
        }
      }, (connected) => {
        setRealtimeConnected(connected);
        if (connected) void productionApi.messagePage(conversation.id).then(async (history) => {
          if (disposed) return;
          setMessages((current) => {
            const merged = new Map(history.messages.map((message) => [message.id, message]));
            for (const message of current) merged.set(message.id, message);
            return [...merged.values()].sort((left, right) => left.created_at.localeCompare(right.created_at));
          });
          setOlderMessagesAvailable((current) => current || history.hasMore);
          setOlderMessageCursor((current) => current ?? history.nextCursor);
          if (document.visibilityState === 'visible') {
            await productionApi.markConversationRead(conversation.id);
            await refreshUnreadConversations().catch(() => undefined);
          }
        }).catch(() => undefined);
      });
    }).catch((error: unknown) => {
      if (!disposed) setStatusMessage(error instanceof Error ? error.message : 'Чат недоступний.');
    });
    return () => { disposed = true; unsubscribe(); setRealtimeConnected(false); };
  }, [refreshUnreadConversations, selectedBooking?.id, tab]);

  const requestOtp = async (event: FormEvent) => {
    event.preventDefault(); setBusy(true); setStatusMessage('');
    try {
      const result = await productionApi.requestOtp(phone, name);
      setOtpRequested(true); setDevCode(result.developmentCode ?? '');
      setStatusMessage(result.delivery === 'development' ? 'Код тестового середовища показано нижче.' : 'Код надіслано SMS.');
    } catch (error) { setStatusMessage(error instanceof Error ? error.message : 'Не вдалося запросити код.'); }
    finally { setBusy(false); }
  };

  const verifyOtp = async (event: FormEvent) => {
    event.preventDefault(); setBusy(true); setStatusMessage('');
    try {
      const currentUser = await productionApi.verifyOtp(phone, code);
      setUser(currentUser);
      const refreshedUser = await productionApi.me(); setUser(refreshedUser);
      await Promise.all([refreshBookings(), refreshJourneys(), refreshVehicles(), refreshBlockedUsers(), ...(refreshedUser.roles.includes('driver') ? [refreshMyOffers(), refreshOpenDemands()] : []), ...(refreshedUser.roles.includes('passenger') ? [refreshMyDemands(), refreshPassengerNavigationMatches()] : [])]);
      
    } catch (error) { setStatusMessage(error instanceof Error ? error.message : 'Код не прийнято.'); }
    finally { setBusy(false); }
  };

  const search = async (event?: FormEvent) => {
    event?.preventDefault();
    if (!origin.trim() || !destination.trim()) { setStatusMessage('Вкажіть місто відправлення та призначення.'); return; }
    if (!searchOriginPlace || !searchDestinationPlace) { setStatusMessage('Оберіть обидві точки зі справжніх результатів геокодера.'); return; }
    setBusy(true); setStatusMessage('');
    try {
      setJourneyResult(null);
      await loadOffers();
      setShowResults(true);
      setRestoredSearchMode('offers');
      const searchPath = buildSearchRoute({
        origin: searchOriginPlace, destination: searchDestinationPlace, date, passengers: seats,
        departure: journeyDeparture, strategy: journeyStrategy, mode: 'offers',
      });
      hydratedSearchLocation.current = searchPath;
      setRoutePath(searchPath);
    }
    catch (error) { setStatusMessage(error instanceof Error ? error.message : 'Пошук не вдався.'); }
    finally { setBusy(false); }
  };

  const searchJourney = async (criteria?: {
    origin: ApiPlace;
    destination: ApiPlace;
    date: string;
    time: string;
    passengers: number;
    strategy: ApiJourneyStrategy;
    selection: TransportSelection;
  }) => {
    const journeyOrigin = criteria?.origin ?? searchOriginPlace;
    const journeyDestination = criteria?.destination ?? searchDestinationPlace;
    const journeyDate = criteria?.date ?? date;
    const journeyTime = criteria?.time ?? journeyDeparture.slice(11, 16);
    const journeyPassengers = criteria?.passengers ?? seats;
    const strategy = criteria?.strategy ?? journeyStrategy;
    const selection = criteria?.selection ?? transportSelection;
    if (!journeyOrigin?.label.trim() || !journeyDestination?.label.trim()) { setStatusMessage('Вкажіть початок і кінець маршруту.'); return; }
    if (!journeyOrigin || !journeyDestination || journeyOrigin.latitude == null || journeyOrigin.longitude == null || journeyDestination.latitude == null || journeyDestination.longitude == null) {
      setStatusMessage('Оберіть початок і кінець маршруту зі списку місць.'); return;
    }
    const departureInput = `${journeyDate}T${journeyTime}`;
    const departure = kyivDateTimeInputToDate(departureInput);
    if (!departure || departure.getTime() <= Date.now()) { setStatusMessage('Оберіть коректний майбутній час за київським часом.'); return; }
    setBusy(true); setStatusMessage('');
    try {
      setOrigin(journeyOrigin.label);
      setDestination(journeyDestination.label);
      setSearchOriginPlace(journeyOrigin);
      setSearchDestinationPlace(journeyDestination);
      setDate(journeyDate);
      setSeats(journeyPassengers);
      setJourneyDeparture(departureInput);
      setJourneyStrategy(strategy);
      changeTransportSelection(selection);
      setJourneyResult(null);
      setSelectedOffer(null);
      setTab('search');
      let availableProviderGroups = providerGroups;
      if (criteria) {
        try {
          availableProviderGroups = await productionApi.providersByTransport({ latitude: journeyOrigin.latitude, longitude: journeyOrigin.longitude });
          setProviderGroups(availableProviderGroups);
        } catch { /* use the providers already loaded for the current search area */ }
      }
      const result = await productionApi.searchJourneys({
        origin: { name: journeyOrigin.label, coordinates: [journeyOrigin.longitude, journeyOrigin.latitude] },
        destination: { name: journeyDestination.label, coordinates: [journeyDestination.longitude, journeyDestination.latitude] },
        departureAt: departure.toISOString(), passengers: journeyPassengers, strategy,
        preferences: toJourneyPreferences(selection, availableProviderGroups),
      });
      setJourneyResult(result); setJourneyResultMode('all'); setShowResults(true); setRestoredSearchMode('planner');
      const searchPath = buildSearchRoute({
        origin: journeyOrigin, destination: journeyDestination, date: journeyDate, passengers: journeyPassengers,
        departure: departureInput, strategy, mode: 'planner',
      });
      hydratedSearchLocation.current = searchPath;
      setRoutePath(searchPath);
    } catch (error) { setStatusMessage(error instanceof Error ? error.message : 'Не вдалося побудувати маршрут.'); }
    finally { setBusy(false); }
  };

  const openJourneyOffer = async (offerId: string, journeyId: string, journeyLegId: string) => {
    setBusy(true); setStatusMessage('');
    try {
      const offer = await productionApi.offer(offerId);
      setJourneyBookingLink({ journeyId, journeyLegId });
      setSelectedOffer(offer);
      setSelectedJourney(null);
      setRoutePath(pathForProductionEntity('offer', offerId));
    }
    catch (error) { setStatusMessage(error instanceof Error ? error.message : 'Пропозиція більше недоступна. Оновіть пошук.'); }
    finally { setBusy(false); }
  };

  const searchRoutePlace = async (field: 'origin' | 'destination') => {
    const query = field === 'origin' ? origin.trim() : destination.trim();
    if (query.length < 3) { setStatusMessage('Введіть щонайменше 3 символи для пошуку місця.'); return; }
    setRoutePlaceField(field); setRoutePlaceSuggestions([]); setPlaceSearchBusy(true); setStatusMessage('');
    try { setRoutePlaceSuggestions(await productionApi.suggestPlaces(query)); }
    catch (error) { setStatusMessage(error instanceof Error ? error.message : 'Пошук місця недоступний.'); }
    finally { setPlaceSearchBusy(false); }
  };

  const choosePickedPlace = (place: ApiPlace) => {
    if (!picker) return;
    const { form, field } = picker;
    if (form === 'search') {
      if (field === 'origin') { setSearchOriginPlace(place); setOrigin(place.label); } else { setSearchDestinationPlace(place); setDestination(place.label); }
    } else if (form === 'offer') {
      if (field === 'origin') { setOfferOrigin(place); setOfferOriginText(place.label); } else { setOfferDestination(place); setOfferDestinationText(place.label); }
    } else if (field === 'origin') { setDemandOrigin(place); setDemandOriginText(place.label); } else { setDemandDestination(place); setDemandDestinationText(place.label); }
    setPicker(null);
  };

  const useMyLocationAsOrigin = async () => {
    if (!navigator.geolocation) { setStatusMessage('Геолокація недоступна на цьому пристрої.'); return; }
    setStatusMessage('');
    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => navigator.geolocation.getCurrentPosition(resolve, reject, { enableHighAccuracy: true, timeout: 15_000 }));
      const place = await productionApi.reverseGeocode(position.coords.latitude, position.coords.longitude);
      setSearchOriginPlace(place); setOrigin(place.label); setRoutePlaceSuggestions([]); setRoutePlaceField(null);
    } catch (error) { setStatusMessage(error instanceof Error && error.message ? error.message : 'Не вдалося визначити місцезнаходження. Дозвольте геолокацію в браузері.'); }
  };

  const chooseSearchPlace = (place: ApiPlace) => {
    if (routePlaceField === 'origin') { setSearchOriginPlace(place); setOrigin(place.label); }
    if (routePlaceField === 'destination') { setSearchDestinationPlace(place); setDestination(place.label); }
    setRoutePlaceSuggestions([]); setRoutePlaceField(null);
  };

  const refreshRescueCandidates = (cancelledBookings: ApiBooking[]) => {
    for (const cancelled of cancelledBookings) {
      setBookingRescues(current => ({ ...current, [cancelled.id]: { loading: true, failed: false } }));
      void productionApi.bookingRescue(cancelled.id)
        .then(result => setBookingRescues(current => ({ ...current, [cancelled.id]: { loading: false, failed: false, result } })))
        .catch(() => setBookingRescues(current => ({ ...current, [cancelled.id]: { loading: false, failed: true } })));
    }
  };

  const rescueJourneyForBooking = (booking: ApiBooking) => journeys.find(journey =>
    journey.state === 'REPLANNING' && journey.legs.some(leg => leg.bookingId === booking.id && leg.state === 'CANCELLED'),
  );

  const book = async (offer: ApiOffer, count = journeyBookingLink ? seats : bookSeats) => {
    setBusy(true); setStatusMessage(''); setBookError('');
    try {
      await productionApi.book(offer.id, count, journeyBookingLink ?? undefined);
    } catch (error) {
      const message = error instanceof Error ? error.message : '';
      // The reason is shown right next to the button (a toast at the top of the page is easy to miss).
      setBookError(/own offer/i.test(message) ? 'Це ваша власна поїздка: водій не може бронювати місця в ній.'
        : /not enough available seats/i.test(message) ? 'Вільних місць стало менше. Оберіть меншу кількість або іншу поїздку.'
        : /departure has passed|offer unavailable/i.test(message) ? 'Ця поїздка вже недоступна. Оновіть пошук.'
        : /Too many requests|Забагато/i.test(message) ? 'Забагато спроб. Зачекайте хвилину і повторіть.'
        : message && !/^Request failed/.test(message) ? message : 'Не вдалося забронювати. Перевірте зʼєднання і спробуйте ще раз.');
      setBusy(false);
      return;
    }

    const linkedJourney = journeyBookingLink;
    setStatusMessage(linkedJourney
      ? 'Місце заброньовано. Journey оновлюється на сервері.'
      : 'Місця заброньовано. Підтвердження збережено на сервері.');
    setSelectedOffer(null); setJourneyBookingLink(null); setTab('trips');
    setBusy(false);

    // Booking is committed. Follow-up reads must never turn that success into
    // a failed-looking booking that the user could accidentally submit again.
    void refreshBookings().catch((error: unknown) => setStatusMessage(
      error instanceof Error ? `Бронювання збережено, але список не оновився: ${error.message}` : 'Бронювання збережено. Список оновиться після повторного завантаження.',
    ));
    if (linkedJourney) void refreshJourneys().catch(() => setStatusMessage('Бронювання збережено. Маршрут Journey оновиться після повторного завантаження.'));
    refreshRescueCandidates(bookings.filter(item => item.status === 'cancelled' && !item.current_user_is_driver));
    if (origin.trim() && destination.trim() && searchOriginPlace && searchDestinationPlace) void loadOffers().catch(() => undefined);
  };

  const cancelTrip = (booking: ApiBooking) => {
    setBookingToCancel(booking);
  };

  const confirmCancelTrip = async (booking: ApiBooking) => {
    setBusy(true); setStatusMessage('');
    try {
      await productionApi.cancelBooking(booking.id);
      await refreshBookings();
      await refreshJourneys().catch(() => undefined);
      refreshRescueCandidates([
        ...bookings.filter(item => item.status === 'cancelled' && !item.current_user_is_driver && item.id !== booking.id),
        { ...booking, status: 'cancelled' },
      ].filter(item => !item.current_user_is_driver));
      setBookingToCancel(null);
      // A cancelled booking moves to "Минулі"; follow it so the rescue alternatives stay in view.
      tripsSectionChosen.current = true; setTripsSection('past');
      setStatusMessage(booking.current_user_is_driver
        ? 'Бронювання скасовано на сервері, місця повернено. Пасажиру надіслано оновлення.'
        : 'Бронювання скасовано. Перевіряємо актуальні поїздки поруч із цим маршрутом.');
    } catch (error) { setStatusMessage(error instanceof Error ? error.message : 'Не вдалося скасувати бронювання.'); }
    finally { setBusy(false); }
  };

  const showBookingTicket = async (booking: ApiBooking) => {
    setBusy(true); setStatusMessage('');
    try {
      const ticket = await productionApi.bookingTicket(booking.id);
      setVisibleBookingTicket({ bookingId: booking.id, token: ticket.token });
    } catch (error) { setStatusMessage(error instanceof Error ? error.message : 'Квиток недоступний.'); }
    finally { setBusy(false); }
  };

  const loadRendezvous = async (booking: ApiBooking) => {
    setRendezvousBusy(booking.id); setStatusMessage('');
    try { const session = await productionApi.bookingRendezvous(booking.id); setRendezvousSessions((current) => ({ ...current, [booking.id]: session })); }
    catch (error) { setStatusMessage(error instanceof Error ? error.message : 'Зустріч поки недоступна.'); }
    finally { setRendezvousBusy(null); }
  };

  const confirmBoarding = async (booking: ApiBooking) => {
    const ticket = boardingTicketInput[booking.id]?.trim();
    if (!ticket) { setStatusMessage('Введіть підписаний токен квитка пасажира.'); return; }
    setBusy(true); setStatusMessage('');
    try {
      await productionApi.markBoarding(booking.id, ticket);
      setBoardingTicketInput((current) => ({ ...current, [booking.id]: '' }));
      await refreshBookings();
      setStatusMessage('Посадку підтверджено сервером.');
    } catch (error) { setStatusMessage(error instanceof Error ? error.message : 'Не вдалося підтвердити посадку.'); }
    finally { setBusy(false); }
  };

  const startTrip = async (booking: ApiBooking) => {
    setBusy(true); setStatusMessage('');
    try {
      await productionApi.startTrip(booking.id);
      await refreshBookings();
      setStatusMessage('Початок поїздки збережено на сервері.');
    } catch (error) { setStatusMessage(error instanceof Error ? error.message : 'Не вдалося розпочати поїздку.'); }
    finally { setBusy(false); }
  };

  const confirmTripCompletion = async (booking: ApiBooking) => {
    setBusy(true); setStatusMessage('');
    try {
      const result = await productionApi.confirmTripCompletion(booking.id);
      await refreshBookings();
      setStatusMessage(result.status === 'completed' ? 'Поїздку завершено за підтвердженнями обох учасників.' : `Завершення підтверджено вами · ${result.confirmations} з ${result.requiredConfirmations}. Очікуємо другого учасника.`);
    } catch (error) { setStatusMessage(error instanceof Error ? error.message : 'Не вдалося підтвердити завершення.'); }
    finally { setBusy(false); }
  };

  const submitBookingReview = async (booking: ApiBooking) => {
    setReviewSubmitting(true);
    try {
      await productionApi.createBookingReview(booking.id, { rating: reviewRating, comment: reviewComment.trim() || undefined });
      setBookings((current) => current.map((item) => item.id === booking.id ? { ...item, current_user_has_review: true } : item));
      setReviewBookingId(null);
      setReviewComment('');
      setStatusMessage('Дякуємо! Ваш відгук збережено.');
      await refreshBookings().catch(() => {
        setStatusMessage('Відгук збережено на сервері. Не вдалося оновити список зараз; стан оновиться після повторного завантаження.');
      });
    } catch (error) {
      setStatusMessage(error instanceof Error ? error.message : 'Не вдалося зберегти відгук. Перевірте з’єднання та спробуйте ще раз.');
    } finally {
      setReviewSubmitting(false);
    }
  };

  const openChat = async (booking: ApiBooking) => {
    setSelectedBooking(booking); setMessages([]); setOlderMessagesAvailable(false); setOlderMessageCursor(null); setBusy(true); setStatusMessage('');
    try {
      const conversation = await productionApi.conversation(booking.id);
      const history = await productionApi.messagePage(conversation.id);
      setMessages(history.messages); setOlderMessagesAvailable(history.hasMore); setOlderMessageCursor(history.nextCursor);
      const readState = await productionApi.markConversationRead(conversation.id).catch(() => null);
      if (readState) setUnreadConversations((current) => ({ ...current, [booking.id]: readState.unread_count }));
      setRoutePath(pathForProductionEntity('conversation', conversation.id));
    } catch (error) { setStatusMessage(error instanceof Error ? error.message : 'Чат недоступний.'); }
    finally { setBusy(false); }
  };

  const loadOlderMessages = async () => {
    if (!selectedBooking || !olderMessagesAvailable || !olderMessageCursor || loadingOlderMessages) return;
    setLoadingOlderMessages(true); setStatusMessage('');
    try {
      const conversation = await productionApi.conversation(selectedBooking.id);
      const page = await productionApi.messagePage(conversation.id, olderMessageCursor);
      setMessages((current) => {
        const merged = new Map(current.map((message) => [message.id, message]));
        for (const message of page.messages) merged.set(message.id, message);
        return [...merged.values()].sort((left, right) => left.created_at.localeCompare(right.created_at));
      });
      setOlderMessagesAvailable(page.hasMore); setOlderMessageCursor(page.nextCursor);
    } catch (error) {
      setStatusMessage(error instanceof Error ? error.message : 'Не вдалося завантажити попередні повідомлення.');
    } finally { setLoadingOlderMessages(false); }
  };

  const sendMessage = async (event: FormEvent) => {
    event.preventDefault();
    if (!selectedBooking || !messageDraft.trim()) return;
    setBusy(true);
    try {
      const conversation = await productionApi.conversation(selectedBooking.id);
      const sent = await productionApi.sendMessage(conversation.id, messageDraft.trim());
      setMessages((current) => current.some((message) => message.id === sent.id)
        ? current : [...current, { ...sent, sender_name: user?.display_name ?? sent.sender_name }]); setMessageDraft('');
    } catch (error) { setStatusMessage(error instanceof Error ? error.message : 'Повідомлення не надіслано.'); }
    finally { setBusy(false); }
  };

  const searchPlace = async (field: 'origin' | 'destination') => {
    const query = field === 'origin' ? demandOriginText.trim() : demandDestinationText.trim();
    if (query.length < 3) { setStatusMessage('Введіть щонайменше 3 символи для пошуку місця.'); return; }
    setPlaceField(field); setPlaceSearchBusy(true); setPlaceSuggestions([]); setStatusMessage('');
    try { setPlaceSuggestions(await productionApi.suggestPlaces(query)); }
    catch (error) { setStatusMessage(error instanceof Error ? error.message : 'Пошук місця недоступний.'); }
    finally { setPlaceSearchBusy(false); }
  };

  const searchOfferPlace = async (field: 'origin' | 'destination') => {
    const query = field === 'origin' ? offerOriginText.trim() : offerDestinationText.trim();
    if (query.length < 3) { setStatusMessage('Введіть щонайменше 3 символи для пошуку місця.'); return; }
    setOfferPlaceField(field); setOfferPlaceSuggestions([]); setPlaceSearchBusy(true); setStatusMessage('');
    try { setOfferPlaceSuggestions(await productionApi.suggestPlaces(query)); }
    catch (error) { setStatusMessage(error instanceof Error ? error.message : 'Пошук місця недоступний.'); }
    finally { setPlaceSearchBusy(false); }
  };

  const chooseOfferPlace = (place: ApiPlace) => {
    if (offerPlaceField === 'origin') { setOfferOrigin(place); setOfferOriginText(place.label); }
    if (offerPlaceField === 'destination') { setOfferDestination(place); setOfferDestinationText(place.label); }
    setOfferPlaceSuggestions([]); setOfferPlaceField(null);
  };

  const publishOffer = async (event: FormEvent) => {
    event.preventDefault();
    const vehicle = vehicles.find((item) => item.id === offerVehicleId && vehicleUsable(item));
    const departure = kyivDateTimeInputToDate(offerDeparture);
    const priceMinor = Math.round(Number(offerPrice.replace(',', '.')) * 100);
    if (!offerOrigin || !offerDestination) { setStatusMessage('Оберіть звідки й куди зі справжніх результатів геокодера.'); return; }
    if (!vehicle) { setStatusMessage('Оберіть своє авто після проходження перевірки.'); return; }
    if (!departure || departure <= new Date()) { setStatusMessage('Час відправлення має бути коректним київським часом у майбутньому.'); return; }
    if (!Number.isInteger(priceMinor) || priceMinor < 1) { setStatusMessage('Ціна за місце має бути більшою за 0.'); return; }
    if (!Number.isInteger(offerSeats) || offerSeats < 1 || offerSeats > vehicle.seat_count) { setStatusMessage('Кількість місць не може перевищувати місткість авто.'); return; }
    setBusy(true); setStatusMessage('');
    try {
      await productionApi.createOffer({
        vehicleId: vehicle.id, originName: offerOrigin.label, destinationName: offerDestination.label,
        origin: [offerOrigin.longitude, offerOrigin.latitude], destination: [offerDestination.longitude, offerDestination.latitude],
        departureAt: departure.toISOString(), pricePerSeatMinor: priceMinor, seats: offerSeats,
      });
      await Promise.all([refreshMyOffers(), refreshBookings()]);
      setStatusMessage('Поїздку збережено на сервері. Вона з’явиться у ваших поїздках після оновлення.');
      setOfferOrigin(null); setOfferDestination(null); setOfferOriginText(''); setOfferDestinationText('');
      setOfferPlaceSuggestions([]); setTab('trips');
    } catch (error) { setStatusMessage(error instanceof Error ? error.message : 'Не вдалося опублікувати поїздку.'); }
    finally { setBusy(false); }
  };

  const choosePlace = (place: ApiPlace) => {
    if (placeField === 'origin') { setDemandOrigin(place); setDemandOriginText(place.label); }
    if (placeField === 'destination') { setDemandDestination(place); setDemandDestinationText(place.label); }
    setPlaceSuggestions([]); setPlaceField(null);
  };

  const publishDemand = async (event: FormEvent) => {
    event.preventDefault();
    if (!demandOrigin || !demandDestination) { setStatusMessage('Оберіть обидва місця зі справжніх результатів геокодера.'); return; }
    const earliest = kyivDateTimeInputToDate(demandEarliest); const latest = kyivDateTimeInputToDate(demandLatest);
    if (!earliest || !latest || latest < earliest) { setStatusMessage('Перевірте часовий інтервал за київським часом.'); return; }
    const budget = demandBudget.trim() ? Math.round(Number(demandBudget.replace(',', '.')) * 100) : undefined;
    if (demandBudget.trim() && (!Number.isFinite(budget) || budget! < 1)) { setStatusMessage('Бюджет має бути додатною сумою.'); return; }
    setBusy(true); setStatusMessage('');
    try {
      const demand = await productionApi.createDemand({
        originName: demandOrigin.label, destinationName: demandDestination.label,
        origin: [demandOrigin.longitude, demandOrigin.latitude], destination: [demandDestination.longitude, demandDestination.latitude],
        earliestDeparture: earliest.toISOString(), latestDeparture: latest.toISOString(), passengers: demandPassengers,
        ...(budget === undefined ? {} : { budgetMinor: budget }), budgetType: demandBudgetType, notes: demandNotes, requirements: demandRequirements,
      });
      setStatusMessage('Заявку опубліковано на сервері.');
      await refreshMyDemands(); setSelectedDemand(demand); setSelectedDemandIsOwned(true); setProposals([]); setRoutePath(pathForProductionEntity('demand', demand.id)); activateTab('my-demands');
    } catch (error) { setStatusMessage(error instanceof Error ? error.message : 'Не вдалося опублікувати заявку.'); }
    finally { setBusy(false); }
  };

  const viewDemand = async (demand: ApiDemand, isOwned: boolean) => {
    setSelectedDemand(demand); setSelectedDemandIsOwned(isOwned); setProposals([]); setProposalRevisions({}); setBusy(true); setStatusMessage('');
    try { setProposals(await productionApi.demandProposals(demand.id).catch(() => [])); setRoutePath(pathForProductionEntity('demand', demand.id)); activateTab(isOwned ? 'my-demands' : 'requests'); }
    catch (error) { setStatusMessage(error instanceof Error ? error.message : 'Не вдалося завантажити пропозиції.'); }
    finally { setBusy(false); }
  };

  const openNavigationDemand = async (demandId: string, candidateId: string) => {
    setBusy(true); setStatusMessage('');
    try {
      const demands = await productionApi.openDemands();
      setOpenDemands(demands);
      const demand = demands.find((item) => item.id === demandId);
      if (!demand) { setStatusMessage('Заявка вже недоступна або закрита.'); return; }
      await viewDemand(demand, false);
      setProposalNavigationCandidateId(candidateId);
      setProposalTarget(demand);
      setProposalDeparture(formatKyivDateTimeInput(demand.earliest_departure));
      const proposedTotal = demand.budget_minor === null ? null : demand.budget_minor / 100 * (demand.budget_type === 'per_seat' ? demand.passenger_count : 1);
      setProposalPrice(proposedTotal === null ? '' : String(proposedTotal.toFixed(2)));
      const verified = vehicles.find((vehicle) => vehicleUsable(vehicle) && vehicle.is_active) ?? vehicles.find((vehicle) => vehicleUsable(vehicle));
      setProposalVehicleId(verified?.id ?? '');
    } catch (error) { setStatusMessage(error instanceof Error ? error.message : 'Не вдалося відкрити заявку пасажира.'); }
    finally { setBusy(false); }
  };

  const loadProposalHistory = async (proposalId: string) => {
    setBusy(true);
    try { const history = await productionApi.proposalRevisions(proposalId); setProposalRevisions((current) => ({ ...current, [proposalId]: history })); }
    catch (error) { setStatusMessage(error instanceof Error ? error.message : 'Історія переговорів недоступна.'); }
    finally { setBusy(false); }
  };

  const sendProposal = async (event: FormEvent) => {
    event.preventDefault();
    if (!proposalTarget) return;
    const amount = Math.round(Number(proposalPrice.replace(',', '.')) * 100);
    const departureAt = kyivDateTimeInputToIso(proposalDeparture);
    if (!Number.isInteger(amount) || amount < 1 || !departureAt || !proposalVehicleId) { setStatusMessage('Потрібні перевірений автомобіль, коректний київський час і ціна більша за 0.'); return; }
    setBusy(true);
    try {
      await productionApi.createProposal(proposalTarget.id, { vehicleId: proposalVehicleId, priceMinor: amount, departureAt, comment: proposalComment, ...(proposalNavigationCandidateId ? { navigationCandidateId: proposalNavigationCandidateId } : {}) });
      setProposalTarget(null); setProposalNavigationCandidateId(null); await refreshOpenDemands();
      await viewDemand(proposalTarget, false);
      setStatusMessage('Цінову пропозицію надіслано пасажиру.');
    } catch (error) { setStatusMessage(error instanceof Error ? error.message : 'Не вдалося надіслати пропозицію.'); }
    finally { setBusy(false); }
  };

  const sendCounter = async (event: FormEvent) => {
    event.preventDefault();
    if (!counterTarget) return;
    const amount = Math.round(Number(counterPrice.replace(',', '.')) * 100);
    const departureAt = kyivDateTimeInputToIso(counterDeparture);
    if (!Number.isInteger(amount) || amount < 1 || !departureAt) { setStatusMessage('Вкажіть додатну ціну й коректний київський час виїзду.'); return; }
    setBusy(true);
    try {
      await productionApi.counterProposal(counterTarget.id, { priceMinor: amount, departureAt, comment: counterComment });
      setCounterTarget(null); setStatusMessage('Зустрічну пропозицію збережено.');
      if (selectedDemand) await viewDemand(selectedDemand, selectedDemandIsOwned);
    } catch (error) { setStatusMessage(error instanceof Error ? error.message : 'Не вдалося оновити пропозицію.'); }
    finally { setBusy(false); }
  };

  const agreeProposal = async (proposal: ApiProposal) => {
    setBusy(true);
    try {
      await productionApi.agreeProposal(proposal.id); setStatusMessage('Ви погодили ціну. Пасажир має підтвердити бронювання.');
      if (selectedDemand) await viewDemand(selectedDemand, selectedDemandIsOwned);
    } catch (error) { setStatusMessage(error instanceof Error ? error.message : 'Не вдалося погодити ціну.'); }
    finally { setBusy(false); }
  };

  const confirmProposal = async (proposal: ApiProposal) => {
    setBusy(true);
    try {
      await productionApi.acceptProposal(proposal.id); setStatusMessage('Домовленість підтверджено; бронювання створено на сервері.');
      await Promise.all([refreshBookings(), refreshMyDemands()]); setSelectedDemand(null); setTab('trips');
    } catch (error) { setStatusMessage(error instanceof Error ? error.message : 'Не вдалося підтвердити бронювання.'); }
    finally { setBusy(false); }
  };

  const confirmNavigationMatch = async (candidateId: string) => {
    setBusy(true); setStatusMessage('');
    try {
      await productionApi.confirmNavigationMatch(candidateId);
      await refreshPassengerNavigationMatches();
      setStatusMessage('Взаємний інтерес підтверджено. Ціну та бронювання ще не погоджено — це окремий наступний крок.');
    } catch (error) { setStatusMessage(error instanceof Error ? error.message : 'Не вдалося підтвердити взаємний інтерес.'); }
    finally { setBusy(false); }
  };

  const cancelDemand = async (demand: ApiDemand) => {
    setBusy(true);
    try { await productionApi.cancelDemand(demand.id); await refreshMyDemands(); setStatusMessage('Заявку скасовано.'); if (selectedDemand?.id===demand.id) setSelectedDemand(null); }
    catch (error) { setStatusMessage(error instanceof Error ? error.message : 'Не вдалося скасувати заявку.'); }
    finally { setBusy(false); }
  };

  const createVehicle = async (event: FormEvent) => {
    event.preventDefault();
    setBusy(true);
    try {
      const created = await productionApi.createVehicle(vehicleForm);
      try { if (vehicleFormPhoto) await productionApi.uploadVehiclePhoto(created.id, vehicleFormPhoto); }
      catch (error) { await refreshVehicles(); setShowVehicleForm(false); setStatusMessage(`Автомобіль додано, але фото не завантажилось: ${error instanceof Error ? error.message : 'помилка'}. Додайте фото в картці авто, щоб ним користуватись.`); return; }
      await refreshVehicles(); setShowVehicleForm(false); setVehicleFormPhoto(null); setVehicleForm({ ...vehicleForm, make: '', model: '', plate: '' });
      setStatusMessage('Автомобіль додано автоматично. Ним можна користуватись одразу; документи можна додати пізніше, щоб підвищити довіру.');
    } catch (error) { setStatusMessage(error instanceof Error ? error.message : 'Не вдалося додати автомобіль.'); }
    finally { setBusy(false); }
  };

  const uploadVehiclePhoto = async (vehicleId: string, file: File) => {
    setBusy(true); setStatusMessage('');
    try {
      const photo = await productionApi.uploadVehiclePhoto(vehicleId, file);
      setVehiclePhotos((current) => ({ ...current, [vehicleId]: [...(current[vehicleId] ?? []), photo] }));
      setStatusMessage('Фото автомобіля завантажено до приватного сховища.');
    } catch (error) { setStatusMessage(error instanceof Error ? error.message : 'Не вдалося завантажити фото.'); }
    finally { setBusy(false); }
  };

  const setPrimaryVehiclePhoto = async (vehicleId: string, photoId: string) => {
    setBusy(true);
    try { await productionApi.setPrimaryVehiclePhoto(vehicleId, photoId); await refreshVehicles(); }
    catch (error) { setStatusMessage(error instanceof Error ? error.message : 'Не вдалося змінити головне фото.'); }
    finally { setBusy(false); }
  };

  const moveVehiclePhoto = async (vehicleId: string, photoId: string, direction: -1 | 1) => {
    const photos = vehiclePhotos[vehicleId] ?? [];
    const index = photos.findIndex((photo) => photo.id === photoId);
    const nextIndex = index + direction;
    if (index < 0 || nextIndex < 0 || nextIndex >= photos.length) return;
    const reordered = [...photos];
    [reordered[index], reordered[nextIndex]] = [reordered[nextIndex], reordered[index]];
    setBusy(true);
    try {
      const result = await productionApi.reorderVehiclePhotos(vehicleId, reordered.map((photo) => photo.id));
      const byId = new Map(photos.map((photo) => [photo.id, photo]));
      setVehiclePhotos((current) => ({ ...current, [vehicleId]: result.photoIds.flatMap((id) => byId.has(id) ? [byId.get(id)!] : []) }));
    } catch (error) { setStatusMessage(error instanceof Error ? error.message : 'Не вдалося змінити порядок фото.'); }
    finally { setBusy(false); }
  };

  const deleteVehiclePhoto = async (vehicleId: string, photoId: string) => {
    setBusy(true);
    try { await productionApi.deleteVehiclePhoto(vehicleId, photoId); await refreshVehicles(); }
    catch (error) { setStatusMessage(error instanceof Error ? error.message : 'Не вдалося видалити фото.'); }
    finally { setBusy(false); }
  };

  const confirmDeleteVehicle = async (vehicle: ApiVehicle) => {
    setBusy(true); setStatusMessage('');
    try {
      const result = await productionApi.deleteVehicle(vehicle.id);
      setVehicleToDelete(null);
      await refreshVehicles();
      setStatusMessage(result.activatedVehicleId ? 'Авто видалено. Активним стало інше ваше авто.' : 'Авто видалено.');
    } catch (error) {
      setVehicleToDelete(null);
      setStatusMessage(error instanceof Error && /upcoming trips/i.test(error.message) ? 'Авто використовується в майбутніх поїздках. Спершу змініть авто в цих поїздках або скасуйте їх.' : error instanceof Error ? error.message : 'Не вдалося видалити авто.');
    } finally { setBusy(false); }
  };

  const vehicleCard = (vehicle: ApiVehicle) => {
    const records = verificationRecords.filter((record) => record.vehicle_id === vehicle.id);
    const reviewPending = records.some((record) => record.status === 'pending');
    const reviewRejected = records.some((record) => record.status === 'rejected');
    const latestRejected = records
      .filter((record) => record.status === 'rejected')
      .sort((a, b) => Date.parse(b.reviewed_at ?? b.created_at) - Date.parse(a.reviewed_at ?? a.created_at))[0];
    const photos = vehiclePhotos[vehicle.id] ?? [];
    return <article key={vehicle.id} className="rounded-xl bg-[#f6f8fc] p-3">
      <div className="flex items-center gap-3"><span className="grid h-10 w-10 place-items-center rounded-xl bg-white text-blue-600"><CarFront size={19}/></span><div className="min-w-0 flex-1"><b className="block text-sm">{vehicle.make} {vehicle.model}</b><small className="text-slate-500">{vehicle.plate ? `${vehicle.plate} · ` : ''}{vehicle.model_year} · {vehicle.seat_count} місць</small><div className="mt-1 flex flex-wrap gap-1">{vehicleUsable(vehicle) ? <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700">✓ Авто додано</span> : <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-bold text-amber-800">Додайте {vehicle.plate ? 'фото' : 'номер і фото'}</span>}{(vehicle.trust_level ?? 0) >= 2 && <span className="rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-bold text-blue-700">✓ Автомобіль підтверджено</span>}{(vehicle.trust_level ?? 0) >= 3 && <span className="rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-bold text-blue-700">✓ Водій підтверджений</span>}</div></div>{vehicle.is_active?<span className="rounded-full bg-emerald-50 px-2 py-1 text-[10px] font-bold text-emerald-700">Активне</span>:<button onClick={async()=>{setBusy(true);try{await productionApi.activateVehicle(vehicle.id);await refreshVehicles();}catch(error){setStatusMessage(error instanceof Error?error.message:'Не вдалося активувати авто.');}finally{setBusy(false);}}} className="text-xs font-bold text-blue-600">Обрати</button>}</div>
      {photos.length>0?<div className="mt-3 grid grid-cols-3 gap-2">{photos.map((photo,index)=><div key={photo.id} className="relative overflow-hidden rounded-lg bg-white"><img src={photo.url} alt={`${vehicle.make} ${vehicle.model}`} className="aspect-[4/3] w-full object-cover"/><div className="absolute inset-x-0 bottom-0 flex items-center justify-between gap-1 bg-slate-950/70 px-1.5 py-1 text-[9px] text-white"><div className="flex items-center gap-1"><button type="button" disabled={busy||index===0} onClick={()=>void moveVehiclePhoto(vehicle.id,photo.id,-1)} aria-label={`Перемістити фото ${index+1} вище`} className="px-1 font-bold disabled:opacity-40">↑</button><button type="button" disabled={busy||index===photos.length-1} onClick={()=>void moveVehiclePhoto(vehicle.id,photo.id,1)} aria-label={`Перемістити фото ${index+1} нижче`} className="px-1 font-bold disabled:opacity-40">↓</button></div><button type="button" onClick={()=>void setPrimaryVehiclePhoto(vehicle.id,photo.id)} className="truncate font-bold">{photo.is_primary?'Головне':'Головне фото'}</button><button type="button" onClick={()=>void deleteVehiclePhoto(vehicle.id,photo.id)} aria-label="Видалити фото">×</button></div></div>)}</div>:<p className="mt-2 text-[10px] text-slate-500">Фото потрібне для публікації поїздки.</p>}
      {user?.roles?.includes('driver')&&(photos.length>=3?<p className="mt-2 text-center text-[11px] text-slate-500">Максимум 3 фото. Видаліть одне, щоб додати інше.</p>:<label className="mt-2 flex w-full cursor-pointer items-center justify-center rounded-lg bg-white py-2 text-xs font-bold text-blue-700">{busy?'Зачекайте…':photos.length===0?'Додати фото авто (обов’язково)':`Додати ще фото (${photos.length}/3)`}<input type="file" accept="image/jpeg,image/png,image/webp" disabled={busy} onChange={event=>{const file=event.target.files?.[0];if(file)void uploadVehiclePhoto(vehicle.id,file);event.currentTarget.value='';}} className="sr-only"/></label>)}
      <button type="button" onClick={()=>setVehicleToDelete(vehicle)} className="mt-2 w-full rounded-lg py-2 text-xs font-bold text-rose-600">Видалити авто</button>
      {vehicle.verification_status==='rejected'&&latestRejected&&<p role="status" className="mt-2 rounded-lg border border-rose-100 bg-rose-50 p-2.5 text-xs leading-5 text-rose-800"><b>Потрібно виправити документи.</b> Причина: {latestRejected.review_note||'Модератор попросив подати документи повторно.'} Після виправлення їх можна надіслати ще раз.</p>}
      {(vehicle.trust_level ?? (vehicle.verification_status === 'verified' ? 3 : 0)) < 3&&<button disabled={reviewPending} onClick={()=>{setRegistrationEvidence(null);setDriverLicenseEvidence(null);setVerificationTarget(vehicle);}} className="mt-2 flex w-full items-center justify-center gap-1.5 rounded-lg bg-white py-2 text-xs font-bold text-blue-700 disabled:text-slate-400"><ShieldCheck size={14}/>{reviewPending?'Документи на перевірці':reviewRejected?'Надіслати повторно':'Підвищити довіру: додати документи (необов’язково)'}</button>}
    </article>;
  };

  const submitVerification = async (event: FormEvent) => {
    event.preventDefault();
    if (!verificationTarget || !registrationEvidence || !driverLicenseEvidence) {
      setStatusMessage('Додайте техпаспорт і посвідчення водія.'); return;
    }
    const acceptedTypes = new Set(['image/jpeg', 'image/png', 'application/pdf']);
    const files = [registrationEvidence, driverLicenseEvidence];
    if (files.some((file) => !acceptedTypes.has(file.type) || file.size < 1 || file.size > 8 * 1024 * 1024)) {
      setStatusMessage('Дозволені JPEG, PNG або PDF до 8 МБ кожен.'); return;
    }
    setBusy(true); setStatusMessage('');
    try {
      const [registration, license] = await Promise.all([
        productionApi.uploadVerificationEvidence(verificationTarget.id, registrationEvidence),
        productionApi.uploadVerificationEvidence(verificationTarget.id, driverLicenseEvidence),
      ]);
      await productionApi.submitVehicleVerification(verificationTarget.id, {
        registrationEvidenceKey: registration.key, registrationContentType: registration.contentType,
        driverLicenseEvidenceKey: license.key, driverLicenseContentType: license.contentType,
      });
      await refreshVehicles(); setVerificationTarget(null); setRegistrationEvidence(null); setDriverLicenseEvidence(null);
      setStatusMessage('Документи передано на перевірку. Статус авто оновиться після рішення модератора.');
    } catch (error) { setStatusMessage(error instanceof Error ? error.message : 'Не вдалося передати документи.'); }
    finally { setBusy(false); }
  };

  const openVerificationEvidence = async (record: ApiVerificationQueueItem) => {
    setBusy(true); setStatusMessage('');
    try {
      const evidence = await productionApi.adminVerificationEvidence(record.id);
      setReviewingRecord(record); setReviewEvidenceUrl(evidence.url); setReviewNote('');
    } catch (error) { setStatusMessage(error instanceof Error ? error.message : 'Документ недоступний для перевірки.'); }
    finally { setBusy(false); }
  };

  const decideVerification = async (decision: 'approved' | 'rejected') => {
    if (!reviewingRecord) return;
    if (decision === 'rejected' && reviewNote.trim().length < 3) { setStatusMessage('Для відмови вкажіть коротку причину.'); return; }
    setBusy(true);
    try {
      await productionApi.decideVerification(reviewingRecord.id, decision, reviewNote.trim());
      setReviewingRecord(null); setReviewEvidenceUrl(''); setReviewNote(''); await refreshAdminQueue();
      setStatusMessage(decision === 'approved' ? 'Документ схвалено.' : 'Документ відхилено із зазначеною причиною.');
    } catch (error) { setStatusMessage(error instanceof Error ? error.message : 'Рішення не збережено.'); }
    finally { setBusy(false); }
  };

  const enableDriver = async () => {
    if (!user) return;
    setBusy(true);
    try { await productionApi.enableRole('driver'); setUser({ ...user, roles: [...new Set([...user.roles, 'driver'])] }); await Promise.all([refreshOpenDemands(), refreshMyOffers()]); }
    catch (error) { setStatusMessage(error instanceof Error ? error.message : 'Не вдалося змінити роль.'); }
    finally { setBusy(false); }
  };

  const blockBookingContact = async () => {
    if (!selectedBooking) return;
    const contactName = selectedBooking.current_user_is_driver ? selectedBooking.passenger_name : selectedBooking.driver_name;
    if (!window.confirm(`Заблокувати ${contactName}? Чат і нові пропозиції між вами будуть недоступні. Наявне бронювання не скасується.`)) return;
    setBusy(true); setStatusMessage('');
    try {
      await productionApi.blockBookingOther(selectedBooking.id);
      await refreshBlockedUsers();
      setMessages([]); setRealtimeConnected(false); setSelectedBooking(null); setTab((currentTab) => currentTab === 'chat' ? 'trips' : currentTab);
      setStatusMessage(`${contactName} заблоковано. Бронювання залишилось у списку поїздок.`);
    } catch (error) { setStatusMessage(error instanceof Error ? error.message : 'Не вдалося заблокувати користувача.'); }
    finally { setBusy(false); }
  };

  const unblockContact = async (blocked: ApiBlockedUser) => {
    setBusy(true); setStatusMessage('');
    try {
      await productionApi.unblockUser(blocked.user_id);
      await refreshBlockedUsers();
      setStatusMessage(`${blocked.display_name} розблоковано.`);
    } catch (error) { setStatusMessage(error instanceof Error ? error.message : 'Не вдалося розблокувати користувача.'); }
    finally { setBusy(false); }
  };

  const submitSafetyReport = async (event: FormEvent) => {
    event.preventDefault();
    if (!selectedBooking || reportDetails.trim().length < 10) return;
    setBusy(true); setStatusMessage('');
    try {
      await productionApi.createReport({ bookingId: selectedBooking.id, category: reportCategory, details: reportDetails.trim() });
      setShowReportForm(false); setReportDetails(''); setSelectedBooking(null); setMessages([]); setTab('trips');
      setStatusMessage('Скаргу передано команді безпеки. Її перевірить уповноважений модератор.');
    } catch (error) { setStatusMessage(error instanceof Error ? error.message : 'Не вдалося передати скаргу.'); }
    finally { setBusy(false); }
  };

  const reviewModerationCase = async (report: ApiModerationCase, status: 'in_review' | 'resolved' | 'dismissed', action?: 'no_action' | 'suspend_account') => {
    const note = moderationNotes[report.id]?.trim();
    if (status !== 'in_review' && (!action || (note?.length ?? 0) < 3)) { setStatusMessage('Для закриття скарги потрібне рішення та короткий коментар.'); return; }
    setBusy(true); setStatusMessage('');
    try {
      await productionApi.reviewModerationCase(report.id, { status, ...(action ? { action } : {}), ...(note ? { note } : {}) });
      await refreshModerationCases();
      setStatusMessage(status === 'in_review' ? 'Скаргу взято в роботу.' : action === 'suspend_account' ? 'Акаунт призупинено, активні сесії відкликано.' : status === 'dismissed' ? 'Скаргу закрито без підтвердження порушення.' : 'Розгляд скарги завершено.');
    } catch (error) { setStatusMessage(error instanceof Error ? error.message : 'Не вдалося оновити скаргу.'); }
    finally { setBusy(false); }
  };

  const logout = async () => {
    const activeNavigation = await productionApi.activeNavigation().catch(() => null);
    if (activeNavigation) await productionApi.endNavigation(activeNavigation.id).catch(() => undefined);
    await productionApi.logout().catch(() => undefined);
    new OfflineNavigationStore().clear();
    setUser(null); setBookings([]); setJourneys([]); setNotificationPage({ items: [], nextCursor: null, unreadCount: 0 }); setShowNotifications(false); setBlockedUsers([]); setVehicles([]); setOffers([]);  setOtpRequested(false);
  };

  const logoutAllDevices = async () => {
    await productionApi.logoutAll();
    new OfflineNavigationStore().clear();
    setProfileSection(null); setUser(null); setBookings([]); setJourneys([]); setNotificationPage({ items: [], nextCursor: null, unreadCount: 0 }); setShowNotifications(false); setBlockedUsers([]); setVehicles([]); setOffers([]);  setOtpRequested(false);
  };

  const downloadPersonalData = async () => {
    setExportingData(true);
    setStatusMessage('');
    try {
      const data = await productionApi.exportMyData();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `marshgo-data-${new Date().toISOString().slice(0, 10)}.json`;
      link.click();
      URL.revokeObjectURL(url);
      setStatusMessage('Ваші дані завантажено у форматі JSON.');
    } catch (error) {
      setStatusMessage(error instanceof Error ? `Не вдалося експортувати дані: ${error.message}` : 'Не вдалося експортувати дані. Спробуйте ще раз.');
    } finally {
      setExportingData(false);
    }
  };

  const requestDeletion = async () => {
    setConfirmDeletion(false);
    setDeletionBusy(true); setStatusMessage('');
    try {
      setDeletionRequest(await productionApi.requestAccountDeletion());
      setStatusMessage('Запит на видалення зареєстровано. Він ще не видаляє дані; перевірте стан і дату в профілі.');
    } catch (error) { setStatusMessage(error instanceof Error ? error.message : 'Не вдалося подати запит на видалення.'); }
    finally { setDeletionBusy(false); }
  };

  const cancelDeletion = async () => {
    setDeletionBusy(true); setStatusMessage('');
    try {
      setDeletionRequest(await productionApi.cancelAccountDeletion());
      setStatusMessage('Запит на видалення скасовано. Акаунт і його дані залишаються активними.');
    } catch (error) { setStatusMessage(error instanceof Error ? error.message : 'Не вдалося скасувати запит.'); }
    finally { setDeletionBusy(false); }
  };

  const openNotifications = async () => {
    setShowNotifications(true); setNotificationsLoading(true);
    try { await refreshNotifications(); }
    catch (error) { setStatusMessage(error instanceof Error ? error.message : 'Сповіщення тимчасово недоступні.'); }
    finally { setNotificationsLoading(false); }
  };

  const markNotificationRead = async (notification: ApiNotification) => {
    if (notification.read_at) return;
    try {
      await productionApi.markNotificationRead(notification.id);
      setNotificationPage(current => ({ ...current, unreadCount: Math.max(0, current.unreadCount - 1), items: current.items.map(item => item.id === notification.id ? { ...item, read_at: new Date().toISOString() } : item) }));
    } catch (error) { setStatusMessage(error instanceof Error ? error.message : 'Не вдалося позначити сповіщення прочитаним.'); }
  };

  const markAllNotificationsRead = async () => {
    try {
      await productionApi.markAllNotificationsRead();
      const now = new Date().toISOString();
      setNotificationPage(current => ({ ...current, unreadCount: 0, items: current.items.map(item => ({ ...item, read_at: item.read_at ?? now })) }));
    } catch (error) { setStatusMessage(error instanceof Error ? error.message : 'Не вдалося оновити сповіщення.'); }
  };

  const loadMoreNotifications = async () => {
    if (!notificationPage.nextCursor || notificationsLoading) return;
    setNotificationsLoading(true);
    try {
      const next = await productionApi.notifications(notificationPage.nextCursor);
      setNotificationPage(current => ({ ...next, items: [...current.items, ...next.items] }));
    } catch (error) { setStatusMessage(error instanceof Error ? error.message : 'Не вдалося завантажити давніші сповіщення.'); }
    finally { setNotificationsLoading(false); }
  };

  const continueToPhoneLogin = () => {
    setOnboardingStep(0);
    
  };
  const requestOnboardingLocation = () => {
    if (!navigator.geolocation) {
      setOnboardingPermissionMessage('Цей браузер не надає доступу до геолокації. Її можна ввімкнути пізніше в налаштуваннях пристрою.');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      () => setOnboardingPermissionMessage('Доступ увімкнено. Геолокація потрібна лише під час активної навігації або зустрічі.'),
      () => setOnboardingPermissionMessage('Дозвіл не надано. Його можна ввімкнути пізніше перед навігацією.'),
      { enableHighAccuracy: false, maximumAge: 30_000, timeout: 12_000 },
    );
  };

  if (loading && !user) return <main className="grid min-h-[100svh] place-items-center bg-[#f5f8fd] text-sm text-slate-500">Завантажуємо захищену сесію…</main>;
  if (!user) return (
    <main className={`auth-screen relative flex min-h-[100svh] overflow-hidden px-5 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-safe ${authIntro ? 'auth-intro-screen' : ''} ${onboardingStep > 0 ? 'bg-[#f4f8ff] text-[#14243b]' : 'bg-[#081b35] text-white'} ${authIntro ? 'items-stretch' : onboardingStep > 0 ? 'h-[100svh] max-h-[100svh] items-stretch' : 'items-end sm:items-center sm:justify-center'}`}>
      {authIntro && <img src="/images/welcome-kyiv-v1.jpg" alt="" className="absolute inset-0 h-full w-full object-cover object-[center_58%]" />}
      <div className={`absolute inset-0 ${authIntro ? 'bg-[linear-gradient(180deg,rgba(4,17,37,.45)_0%,rgba(5,22,44,.08)_34%,rgba(5,15,29,.28)_57%,rgba(3,10,19,.9)_100%)]' : onboardingStep > 0 ? 'bg-[linear-gradient(180deg,#f4f8ff_0%,#ffffff_58%,#edf4ff_100%)]' : 'bg-[radial-gradient(ellipse_at_55%_35%,rgba(41,131,255,.65),transparent_48%),linear-gradient(180deg,#113d75_0%,#122f54_48%,#08121f_100%)]'}`} />
      {!authIntro && onboardingStep === 0 && <div className="absolute inset-x-0 bottom-0 h-[48%] bg-[linear-gradient(0deg,rgba(4,10,18,.88),transparent)]" />}
      <section className={`relative z-10 mx-auto flex w-full max-w-md flex-col ${authIntro ? 'min-h-[calc(100svh-env(safe-area-inset-top))] items-center pb-1 text-center' : 'pb-2'}`}>
        {!authIntro && onboardingStep === 0 && <button onClick={() => { setAuthIntro(true);  setStatusMessage(''); }} className="mb-6 grid h-10 w-10 place-items-center rounded-full border border-white/25 bg-white/10" aria-label="Назад"><ArrowLeft size={19}/></button>}
        {authIntro ? <>
          <div className="mt-[max(3rem,10svh)] flex flex-col items-center drop-shadow-[0_2px_16px_rgba(4,12,28,.3)]">
            <BrandMark size="lg" className="mb-3 ring-1 ring-white/60 shadow-[0_0_38px_rgba(56,189,248,.42)]" />
            <strong className="text-[2rem] font-extrabold tracking-tight">MARSH<span className="text-sky-400">GO</span></strong>
            <p className="mt-1 text-xs text-white/85">Один маршрут. Усі способи доїхати.</p>
            <p className="mt-1 text-[10px] text-white/75">Попутки · міські поїздки · подорожі Україною</p>
          </div>
          <div className="mt-auto w-full pb-5 pt-8 text-left drop-shadow-[0_2px_12px_rgba(0,0,0,.55)]">
            <p className="text-[11px] font-bold uppercase tracking-[.27em] text-blue-100">Україна ближче</p>
            <h1 className="mt-2 text-[2.15rem] font-extrabold leading-[1.08] tracking-tight">Усі способи<br/>доїхати — в одному<br/>застосунку.</h1>
            <p className="mt-3 max-w-sm text-sm leading-5 text-blue-50/90">Знайдіть попутку, сплануйте маршрут і домовтеся про поїздку в одному місці.</p>
          </div>
          <div className="w-full">
            <button onClick={() => { setAuthIntro(false); setOnboardingStep(1);  }} className="w-full rounded-2xl bg-blue-600 px-5 py-[1.05rem] text-sm font-bold shadow-lg shadow-blue-950/45">Почати</button>
            <button onClick={() => { setAuthIntro(false); setOnboardingStep(0);  }} className="mt-3 w-full rounded-2xl border border-white/50 bg-slate-950/25 px-5 py-3.5 text-sm font-semibold backdrop-blur-sm">У мене вже є акаунт</button>
          </div>
        </> : onboardingStep > 0 ? <OnboardingSlides step={onboardingStep as 1 | 2 | 3} permissionMessage={onboardingPermissionMessage}
          onNext={() => setOnboardingStep(Math.min(3, onboardingStep + 1))} onBack={() => onboardingStep === 1 ? setAuthIntro(true) : setOnboardingStep(onboardingStep - 1)}
          onSkip={continueToPhoneLogin} onFinish={continueToPhoneLogin} onRequestLocation={requestOnboardingLocation}/> : <>
        <div className="mb-8 flex items-center gap-3"><BrandMark/><div><strong className="text-2xl tracking-tight">MARSH<span className="text-sky-400">GO</span></strong><p className="text-xs text-blue-100/80">Один маршрут. Усі способи доїхати.</p></div></div>
        {!otpRequested ? <>
          <h1 className="text-3xl font-extrabold">Вхід за номером телефону</h1><p className="mt-2 text-sm text-blue-100/80">Створіть профіль або увійдіть за номером.</p>
          <form onSubmit={requestOtp} className="mt-6 space-y-3">
            <input required minLength={2} maxLength={80} value={name} onChange={(event) => setName(event.target.value)} className="w-full rounded-2xl border border-white/20 bg-white/10 px-4 py-3.5 text-white outline-none placeholder:text-blue-100/55 focus:border-sky-300" placeholder="Ваше ім’я" autoComplete="name" />
            <input required type="tel" value={phone} onChange={(event) => setPhone(event.target.value)} className="w-full rounded-2xl border border-white/20 bg-white/10 px-4 py-3.5 text-white outline-none placeholder:text-blue-100/55 focus:border-sky-300" placeholder="+380 номер телефону" autoComplete="tel" />
            <button disabled={busy} className="w-full rounded-2xl bg-blue-600 px-5 py-4 font-bold shadow-lg shadow-blue-900/40 disabled:opacity-60">{busy ? 'Надсилаємо…' : 'Почати'}</button>
          </form>
        </> : <>
          <h1 className="text-3xl font-extrabold">Вхід за номером</h1><p className="mt-2 text-sm text-blue-100/80">Підтвердьте номер телефону, щоб продовжити.</p>
          <form onSubmit={verifyOtp} className="mt-6 space-y-3">
            <input required inputMode="numeric" pattern="[0-9]{6}" maxLength={6} value={code} onChange={(event) => setCode(event.target.value)} className="w-full rounded-2xl border border-white/20 bg-white/10 px-4 py-4 text-center text-2xl tracking-[.4em] text-white outline-none focus:border-sky-300" placeholder="••••••" autoComplete="one-time-code" />
            {devCode && <p className="rounded-xl bg-amber-100 p-3 text-sm text-amber-950">Тестовий OTP локального середовища: <b>{devCode}</b></p>}
            <button disabled={busy} className="w-full rounded-2xl bg-blue-600 px-5 py-4 font-bold disabled:opacity-60">{busy ? 'Перевіряємо…' : 'Підтвердити номер'}</button>
            <button type="button" onClick={() => { setOtpRequested(false); setCode(''); }} className="w-full py-2 text-sm text-blue-100">Змінити номер</button>
          </form>
        </>}
        {statusMessage && <p role="status" className="mt-4 rounded-xl bg-white/10 p-3 text-sm text-white">{statusMessage}</p>}
        {!authIntro && <p className="mt-5 flex gap-2 text-xs leading-5 text-blue-100/70"><ShieldCheck size={16} className="shrink-0"/>Реальна доставка SMS вмикається після налаштування провайдера.</p>}
        </>}
      </section>
    </main>
  );

  // The protected application is rendered only after the auth guard above.
  // Keep a stable non-null reference for callbacks rendered by this branch.
  const authenticatedUser = user;

  if (notFound) return <main className="grid min-h-[70svh] place-items-center px-5 text-center"><div className="max-w-md rounded-3xl bg-white p-8 shadow-sm"><p className="text-xs font-bold uppercase tracking-[.16em] text-blue-600">404</p><h1 className="mt-2 text-2xl font-extrabold">Сторінку не знайдено</h1><p className="mt-2 text-sm text-slate-500">Перевірте адресу або поверніться до головної сторінки MARSHGO.</p><button onClick={goHome} className="mt-5 rounded-xl bg-blue-600 px-5 py-3 text-sm font-bold text-white">На головну</button></div></main>;

  const status = statusMessage ? <div role="status" className="mx-auto mt-3 w-full max-w-xl rounded-2xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-blue-800">{statusMessage}<button onClick={() => setStatusMessage('')} className="float-right"><X size={16}/></button></div> : null;
  const header = tab === 'home' || tab === 'search' ? null : <header className="app-header mx-auto flex w-full max-w-xl items-center justify-between px-4 pb-3 pt-[max(.8rem,env(safe-area-inset-top))]">
    <div className="flex items-center gap-2.5">
      <BrandMark size="sm"/>
      <div>
        <strong className="text-[19px] font-black tracking-tight text-[#142642] dark:text-white">MARSH<span className="text-[#1769ED]">GO</span></strong>
        <p className="-mt-1 text-[10px] font-medium text-[#6A7F98] dark:text-slate-400">Усі поїздки в одному місці</p>
      </div>
    </div>
    <nav aria-label="Розділи MARSHGO" className="desktop-top-nav hidden items-center gap-1">
      {([['home','Головна'],['search','Пошук поїздок'],['trips','Мої поїздки'],['profile','Профіль']] as const).map(([id,label])=><button key={id} aria-current={tab===id?'page':undefined} onClick={()=>{setTab(id);if(id==='home')setShowResults(false);setSelectedOffer(null);setSelectedJourney(null);setSelectedBooking(null);setJourneyBookingLink(null);}} className="rounded-xl px-3 py-2 text-xs font-bold text-slate-600 hover:bg-blue-50 hover:text-blue-700 aria-[current=page]:bg-blue-50 aria-[current=page]:text-blue-700 dark:text-slate-300 dark:hover:bg-slate-800 dark:aria-[current=page]:bg-slate-800 dark:aria-[current=page]:text-blue-400">{label}</button>)}
    </nav>
    <div className="flex items-center gap-2">
      <button type="button" onClick={() => themeService.toggle()} aria-label="Перемкнути тему" className="grid h-10 w-10 place-items-center rounded-full border border-[#E3EBF4] bg-white text-[#142642] shadow-xs transition hover:bg-slate-50 dark:border-slate-800 dark:bg-[#101E38] dark:text-slate-200">
        {isDark ? <Sun size={18}/> : <Moon size={18}/>}
      </button>
      <button onClick={() => void openNotifications()} aria-label={`Сповіщення${notificationPage.unreadCount ? `, непрочитаних ${notificationPage.unreadCount}` : ''}`} className="relative grid h-10 w-10 place-items-center rounded-full border border-[#E3EBF4] bg-white text-[#142642] shadow-xs transition hover:bg-slate-50 dark:border-slate-800 dark:bg-[#101E38] dark:text-slate-200">
        <Bell size={18}/>
        {notificationPage.unreadCount>0&&<span className="absolute -right-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full bg-rose-600 px-1 text-[9px] font-bold text-white">{notificationPage.unreadCount>99?'99+':notificationPage.unreadCount}</span>}
      </button>
    </div>
  </header>;

  const searchForm = (
    <form onSubmit={search} className="space-y-4">
      {/* 1. Main Route Card: 02_Пошук.png */}
      <div className="rounded-3xl border border-[#E3EBF4] bg-white p-4 shadow-xs dark:border-slate-800 dark:bg-[#101E38]">
        {/* Origin */}
        <div className="flex items-center justify-between gap-3">
          <span className="grid h-5 w-5 shrink-0 place-items-center">
            <span className="h-2.5 w-2.5 rounded-full bg-[#1769ED]" />
          </span>
          <div className="min-w-0 flex-1">
            <label className="block text-[11px] font-medium text-[#6A7F98] dark:text-slate-400">Звідки</label>
            <input
              required
              value={origin}
              onChange={(e) => {
                setOrigin(e.target.value);
                setSearchOriginPlace(null);
              }}
              placeholder="Львів"
              className="w-full bg-transparent text-base font-bold text-[#142642] placeholder:text-slate-300 outline-none dark:text-white"
            />
          </div>
          <div className="flex items-center gap-1">
            <button
              type="button"
              aria-label="Знайти населений пункт"
              title="Знайти населений пункт"
              onClick={() => void searchRoutePlace('origin')}
              className="grid h-7 w-7 place-items-center rounded-lg text-[#6A7F98] hover:text-[#1769ED] dark:text-slate-400"
            >
              <Search size={15} />
            </button>
            <button
              type="button"
              aria-label="Обрати на мапі"
              title="Обрати на мапі"
              onClick={() => setPicker({ form: 'search', field: 'origin' })}
              className="grid h-7 w-7 place-items-center rounded-lg text-[#6A7F98] hover:text-[#1769ED] dark:text-slate-400"
            >
              <MapPin size={15} />
            </button>
            <button
              type="button"
              aria-label="Моя локація"
              title="Моя локація"
              onClick={() => void useMyLocationAsOrigin()}
              className="grid h-7 w-7 place-items-center rounded-lg text-[#6A7F98] hover:text-emerald-600 dark:text-slate-400"
            >
              <Navigation size={15} />
            </button>
            <button
              type="button"
              aria-label="Поміняти місцями"
              onClick={() => {
                setOrigin(destination);
                setDestination(origin);
                setSearchOriginPlace(searchDestinationPlace);
                setSearchDestinationPlace(searchOriginPlace);
              }}
              className="grid h-8 w-8 place-items-center rounded-full text-[#6A7F98] hover:bg-blue-50 hover:text-[#1769ED] dark:text-slate-400 dark:hover:bg-slate-800"
            >
              <ArrowDownUp size={16} />
            </button>
          </div>
        </div>

        {routePlaceField === 'origin' && routePlaceSuggestions.length > 0 && (
          <div className="my-2 divide-y divide-slate-100 overflow-hidden rounded-xl border border-slate-100 bg-white shadow-md dark:divide-slate-800 dark:border-slate-800 dark:bg-[#101E38]">
            {routePlaceSuggestions.map((place) => (
              <button
                key={place.providerId}
                type="button"
                onClick={() => chooseSearchPlace(place)}
                className="block w-full px-3 py-2 text-left text-xs font-medium text-slate-700 hover:bg-blue-50 dark:text-slate-200 dark:hover:bg-slate-800"
              >
                {place.label}
              </button>
            ))}
          </div>
        )}

        <div className="my-3 border-b border-[#E3EBF4] dark:border-slate-800" />

        {/* Destination */}
        <div className="flex items-center justify-between gap-3">
          <span className="grid h-5 w-5 shrink-0 place-items-center">
            <span className="h-2.5 w-2.5 rounded-full bg-[#EF4444]" />
          </span>
          <div className="min-w-0 flex-1">
            <label className="block text-[11px] font-medium text-[#6A7F98] dark:text-slate-400">Куди</label>
            <input
              required
              value={destination}
              onChange={(e) => {
                setDestination(e.target.value);
                setSearchDestinationPlace(null);
              }}
              placeholder="Стрий"
              className="w-full bg-transparent text-base font-bold text-[#142642] placeholder:text-slate-300 outline-none dark:text-white"
            />
          </div>
          <div className="flex items-center gap-1">
            <button
              type="button"
              aria-label="Знайти населений пункт"
              title="Знайти населений пункт"
              onClick={() => void searchRoutePlace('destination')}
              className="grid h-7 w-7 place-items-center rounded-lg text-[#6A7F98] hover:text-[#1769ED] dark:text-slate-400"
            >
              <Search size={15} />
            </button>
            <button
              type="button"
              aria-label="Обрати на мапі"
              title="Обрати на мапі"
              onClick={() => setPicker({ form: 'search', field: 'destination' })}
              className="grid h-7 w-7 place-items-center rounded-lg text-[#6A7F98] hover:text-[#1769ED] dark:text-slate-400"
            >
              <MapPin size={15} />
            </button>
          </div>
        </div>

        {routePlaceField === 'destination' && routePlaceSuggestions.length > 0 && (
          <div className="my-2 divide-y divide-slate-100 overflow-hidden rounded-xl border border-slate-100 bg-white shadow-md dark:divide-slate-800 dark:border-slate-800 dark:bg-[#101E38]">
            {routePlaceSuggestions.map((place) => (
              <button
                key={place.providerId}
                type="button"
                onClick={() => chooseSearchPlace(place)}
                className="block w-full px-3 py-2 text-left text-xs font-medium text-slate-700 hover:bg-blue-50 dark:text-slate-200 dark:hover:bg-slate-800"
              >
                {place.label}
              </button>
            ))}
          </div>
        )}

        <div className="my-3 border-b border-[#E3EBF4] dark:border-slate-800" />

        {/* Date & Passengers row: 02_Пошук.png */}
        <div className="flex items-center justify-between text-xs font-bold text-[#142642] dark:text-slate-200">
          <label className="relative flex cursor-pointer items-center gap-2">
            <CalendarDays size={16} className="text-[#1769ED]" />
            <span>
              {searchScheduleMode === 'now'
                ? `Сьогодні, ${new Intl.DateTimeFormat('uk-UA', { day: 'numeric', month: 'long' }).format(new Date())}`
                : new Intl.DateTimeFormat('uk-UA', { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date(`${date}T12:00:00`))}
            </span>
            <input
              type="date"
              lang="uk-UA"
              value={date}
              onChange={(e) => {
                setDate(e.target.value);
                setSearchScheduleMode('scheduled');
              }}
              className="absolute inset-0 cursor-pointer opacity-0"
            />
          </label>
          <div className="flex items-center gap-2">
            <Users size={16} className="text-[#1769ED]" />
            <span>{passengersLabel(seats)}</span>
            <div className="ml-1 flex items-center gap-1">
              <button
                type="button"
                aria-label="Менше пасажирів"
                disabled={seats <= 1}
                onClick={() => setSeats(Math.max(1, seats - 1))}
                className="grid h-6 w-6 place-items-center rounded-full bg-slate-100 text-slate-600 disabled:opacity-30 dark:bg-slate-800 dark:text-slate-300"
              >
                -
              </button>
              <button
                type="button"
                aria-label="Більше пасажирів"
                disabled={seats >= 8}
                onClick={() => setSeats(Math.min(8, seats + 1))}
                className="grid h-6 w-6 place-items-center rounded-full bg-slate-100 text-slate-600 disabled:opacity-30 dark:bg-slate-800 dark:text-slate-300"
              >
                +
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Коли їхати: 02_Пошук.png */}
      <div>
        <h3 className="mb-2 text-xs font-bold text-[#142642] dark:text-slate-300">Коли їхати</h3>
        <div className="grid grid-cols-2 gap-1 rounded-2xl bg-[#EEF3F9] p-1 dark:bg-[#0B1730]">
          <button
            type="button"
            onClick={() => {
              setSearchScheduleMode('now');
              setDate(todayKyiv());
            }}
            className={`rounded-xl py-2.5 text-xs font-bold transition ${
              searchScheduleMode === 'now'
                ? 'bg-white text-[#1769ED] shadow-xs dark:bg-[#101E38] dark:text-blue-400'
                : 'text-[#6A7F98] dark:text-slate-400'
            }`}
          >
            Зараз
          </button>
          <button
            type="button"
            onClick={() => setSearchScheduleMode('scheduled')}
            className={`rounded-xl py-2.5 text-xs font-bold transition ${
              searchScheduleMode === 'scheduled'
                ? 'bg-white text-[#1769ED] shadow-xs dark:bg-[#101E38] dark:text-blue-400'
                : 'text-[#6A7F98] dark:text-slate-400'
            }`}
          >
            Планувати дату
          </button>
        </div>
      </div>

      {/* 3. Як хочете їхати? 02_Пошук.png */}
      <div>
        <div className="mb-2 flex items-center justify-between">
          <h3 className="text-xs font-bold text-[#142642] dark:text-slate-300">Як хочете їхати?</h3>
          <button
            type="button"
            onClick={() => setShowTransportModal(!showTransportModal)}
            className="text-xs font-bold text-[#1769ED] hover:underline"
          >
            {showTransportModal ? 'Сховати ↑' : 'Налаштувати →'}
          </button>
        </div>
        <div className="no-scrollbar flex gap-2 overflow-x-auto pb-1">
          {[
            { id: 'all', label: 'Усі' },
            { id: 'carpool', label: 'Попутка' },
            { id: 'taxi', label: 'Таксі' },
            { id: 'bus', label: 'Автобус' },
            { id: 'train', label: 'Поїзд' },
          ].map((item, idx) => (
            <button
              key={item.id}
              type="button"
              onClick={() => {
                if (idx > 0) {
                  setStatusMessage(`Фільтр: ${item.label}`);
                }
              }}
              className={`shrink-0 rounded-full px-4 py-2 text-xs font-bold transition ${
                idx === 0
                  ? 'bg-[#EAF2FF] text-[#1769ED] dark:bg-blue-950/60 dark:text-blue-300'
                  : 'border border-[#E3EBF4] bg-white text-[#142642] hover:border-slate-300 dark:border-slate-800 dark:bg-[#101E38] dark:text-slate-300'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {/* 4. Пріоритет маршруту: 02_Пошук.png */}
      <div>
        <h3 className="mb-2 text-xs font-bold text-[#142642] dark:text-slate-300">Пріоритет маршруту</h3>
        <div className="grid grid-cols-3 gap-1 rounded-2xl bg-[#EEF3F9] p-1 dark:bg-[#0B1730]">
          {[
            { id: 'BALANCED', label: 'Оптимальний' },
            { id: 'FASTEST', label: 'Найшвидший' },
            { id: 'CHEAPEST', label: 'Дешевший' },
          ].map((strat) => (
            <button
              key={strat.id}
              type="button"
              onClick={() => setJourneyStrategy(strat.id as ApiJourneyStrategy)}
              className={`rounded-xl py-2.5 text-xs font-bold transition ${
                journeyStrategy === strat.id
                  ? 'bg-white text-[#1769ED] shadow-xs dark:bg-[#101E38] dark:text-blue-400'
                  : 'text-[#6A7F98] dark:text-slate-400'
              }`}
            >
              {strat.label}
            </button>
          ))}
        </div>
      </div>

      {/* 5. Додаткові фільтри card: 02_Пошук.png */}
      <div
        role="button"
        tabIndex={0}
        onClick={() => setShowFilterSheet(!showFilterSheet)}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') setShowFilterSheet(!showFilterSheet); }}
        className="flex cursor-pointer items-center justify-between rounded-2xl border border-[#E3EBF4] bg-white p-4 shadow-xs transition hover:border-slate-300 dark:border-slate-800 dark:bg-[#101E38]"
      >
        <div className="flex items-center gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-xl bg-blue-50 text-[#1769ED] dark:bg-blue-950/60 dark:text-blue-400">
            <SlidersHorizontal size={18} />
          </div>
          <div>
            <b className="block text-sm font-bold text-[#142642] dark:text-white">Додаткові фільтри</b>
            <p className="text-xs text-[#6A7F98] dark:text-slate-400">Багаж, тварини, дитяче крісло</p>
          </div>
        </div>
        <span className="flex items-center gap-1 text-xs font-bold text-[#6A7F98]">
          {[searchRequirements.luggage, searchRequirements.pets, searchRequirements.childSeat].filter(Boolean).length > 0
            ? `${[searchRequirements.luggage, searchRequirements.pets, searchRequirements.childSeat].filter(Boolean).length} обрано`
            : '3 опції'}{' '}
          <ChevronRight size={16} />
        </span>
      </div>

      {/* Expandable filter options */}
      {showFilterSheet && (
        <div className="flex flex-wrap gap-2 rounded-2xl border border-blue-100 bg-[#F5F8FC] p-3 dark:border-slate-800 dark:bg-[#0B1730]">
          <button
            type="button"
            onClick={() => setSearchRequirements((r) => ({ ...r, luggage: !r.luggage }))}
            className={`flex items-center gap-1.5 rounded-full px-3.5 py-2 text-xs font-bold transition ${
              searchRequirements.luggage
                ? 'bg-[#1769ED] text-white shadow-xs'
                : 'border border-slate-200 bg-white text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300'
            }`}
          >
            <Briefcase size={14} />
            <span>Багаж</span>
            <span>{searchRequirements.luggage ? '✓' : '+'}</span>
          </button>
          <button
            type="button"
            onClick={() => setSearchRequirements((r) => ({ ...r, pets: !r.pets }))}
            className={`flex items-center gap-1.5 rounded-full px-3.5 py-2 text-xs font-bold transition ${
              searchRequirements.pets
                ? 'bg-[#1769ED] text-white shadow-xs'
                : 'border border-slate-200 bg-white text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300'
            }`}
          >
            <PawPrint size={14} />
            <span>Тварини</span>
            <span>{searchRequirements.pets ? '✓' : '+'}</span>
          </button>
          <button
            type="button"
            onClick={() => setSearchRequirements((r) => ({ ...r, childSeat: !r.childSeat }))}
            className={`flex items-center gap-1.5 rounded-full px-3.5 py-2 text-xs font-bold transition ${
              searchRequirements.childSeat
                ? 'bg-[#1769ED] text-white shadow-xs'
                : 'border border-slate-200 bg-white text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300'
            }`}
          >
            <Baby size={14} />
            <span>Дитяче крісло</span>
            <span>{searchRequirements.childSeat ? '✓' : '+'}</span>
          </button>
        </div>
      )}

      <section className="rounded-2xl border border-indigo-100 bg-indigo-50/70 p-4 dark:border-indigo-900/50 dark:bg-indigo-950/20">
        <h3 className="text-sm font-extrabold text-indigo-950 dark:text-indigo-100">Який маршрут обрати?</h3>
        <p className="mt-1 text-xs leading-5 text-indigo-900/75 dark:text-indigo-200/80">Порівняйте попутки з доступними розкладами транспорту та пересадками.</p>
        <label className="mt-3 block text-xs font-bold text-slate-700 dark:text-slate-200">Час відправлення для плану
          <input aria-label="Час відправлення для плану" required type="datetime-local" value={journeyDeparture} onChange={(event) => setJourneyDeparture(event.target.value)} className="mt-1.5 w-full rounded-xl border border-indigo-100 bg-white px-3 py-3 text-sm dark:border-indigo-900 dark:bg-[#101E38]" />
        </label>
        <label className="mt-3 block text-xs font-bold text-slate-700 dark:text-slate-200">Пріоритет маршруту
          <select aria-label="Пріоритет маршруту" value={journeyStrategy} onChange={(event) => setJourneyStrategy(event.target.value as ApiJourneyStrategy)} className="mt-1.5 w-full rounded-xl border border-indigo-100 bg-white px-3 py-3 text-sm dark:border-indigo-900 dark:bg-[#101E38]">
            <option value="BALANCED">Оптимальний</option><option value="FASTEST">Найшвидший</option><option value="CHEAPEST">Найдешевший</option><option value="RELIABLE">Надійний</option>
          </select>
        </label>
        <button type="button" disabled={busy} onClick={() => void searchJourney()} className="mt-3 w-full rounded-xl bg-indigo-600 py-3 text-sm font-extrabold text-white disabled:opacity-50">Оптимізувати весь маршрут</button>
      </section>

      {/* 6. Primary CTA button: 02_Пошук.png */}
      <button
        type="submit"
        disabled={busy}
        className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[#1769ED] py-4 text-sm font-extrabold text-white shadow-md shadow-blue-500/25 transition-all hover:bg-blue-600 active:scale-[0.99] disabled:opacity-60"
      >
        <Search size={18} />
        <span>{busy ? 'Шукаємо…' : 'Показати маршрути'}</span>
        <ArrowRight size={18} />
      </button>

      {/* Transport modal/sheet when requested */}
      {showTransportModal && (
        <div className="mt-4 rounded-3xl border border-[#E3EBF4] bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-[#101E38]">
          <div className="mb-3 flex items-center justify-between">
            <h4 className="text-sm font-extrabold text-[#142642] dark:text-white">Види транспорту</h4>
            <button
              type="button"
              onClick={() => setShowTransportModal(false)}
              className="text-xs font-bold text-[#6A7F98] hover:text-[#142642]"
            >
              Закрити ✕
            </button>
          </div>
          <TransportTypesPanel
            selection={transportSelection}
            groups={providerGroups}
            onChange={changeTransportSelection}
            onOpenMap={() => setTab('map')}
            onSearch={() => void search()}
          />
        </div>
      )}
    </form>
  );

  const sortedOffers = [...offers].sort((a, b) => offerSort === 'cheapest' ? a.price_per_seat_minor - b.price_per_seat_minor
    : offerSort === 'fastest' ? (a.duration_s ?? Infinity) - (b.duration_s ?? Infinity) : Date.parse(a.departure_at) - Date.parse(b.departure_at));
  const cheapestPrice = offers.length > 1 && new Set(offers.map((item) => item.price_per_seat_minor)).size > 1 ? Math.min(...offers.map((item) => item.price_per_seat_minor)) : null;
  const fastestDuration = offers.length > 1 && new Set(offers.map((item) => item.duration_s)).size > 1 ? Math.min(...offers.map((item) => item.duration_s ?? Infinity)) : null;
  const offerCard = (offer: ApiOffer, _index: number) => {
    const dur = offer.duration_s ? `${Math.floor(offer.duration_s/3600)} год ${Math.round((offer.duration_s%3600)/60)} хв` : null;
    const t = (v: string) => formatDate(v,{hour:'2-digit',minute:'2-digit'});
    return (
      <button
        key={offer.id}
        onClick={() => {
          setJourneyBookingLink(null);
          setSelectedJourney(null);
          setSelectedOffer(offer);
          setRoutePath(pathForProductionEntity('offer', offer.id));
        }}
        className="journey-offer-card w-full rounded-3xl border border-[#E3EBF4] bg-white p-4 text-left shadow-[0_4px_20px_rgba(20,58,112,0.04)] transition hover:border-[#1769ED]/40 dark:border-slate-800 dark:bg-[#101E38]"
      >
        <div className="mb-3 flex items-center justify-between">
          <span className="flex flex-wrap items-center gap-1.5">
            <span className="rounded-full bg-[#EAF2FF] px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wide text-[#1769ED] dark:bg-blue-950/60 dark:text-blue-300">
              Попутка
            </span>
            {cheapestPrice !== null && offer.price_per_seat_minor === cheapestPrice && (
              <span className="rounded-full bg-[#FEF3C7] px-2.5 py-1 text-[10px] font-bold text-[#D97706] dark:bg-amber-950/60 dark:text-amber-300">
                Найдешевша
              </span>
            )}
            {fastestDuration !== null && Number.isFinite(fastestDuration) && offer.duration_s === fastestDuration && (
              <span className="rounded-full bg-[#ECFDF5] px-2.5 py-1 text-[10px] font-bold text-[#059669] dark:bg-emerald-950/60 dark:text-emerald-300">
                Найшвидша
              </span>
            )}
          </span>
          <span className="text-xs font-semibold text-[#6A7F98] dark:text-slate-400">
            {offer.available_seats} місць
          </span>
        </div>

        {offer.vehicle_photo_url && (
          <div className="mb-3 overflow-hidden rounded-2xl">
            <VehiclePhoto url={offer.vehicle_photo_url} alt={`Автомобіль водія ${offer.driver_name}`} />
          </div>
        )}

        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[1.25rem] font-extrabold leading-tight text-[#142642] dark:text-white">
              {t(offer.departure_at)} → {offer.arrival_at ? t(offer.arrival_at) : '—'}
            </p>
            <p className="mt-1 truncate text-xs font-semibold text-[#6A7F98] dark:text-slate-300">
              {offer.origin_name.split(',')[0]} → {offer.destination_name.split(',')[0]}
            </p>
            {dur && (
              <p className="mt-1 flex items-center gap-1 text-[11px] font-medium text-[#6A7F98] dark:text-slate-400">
                <Clock3 size={12} />
                <span>{dur} дорогою</span>
              </p>
            )}
          </div>
          <div className="shrink-0 text-right">
            <b className="text-[1.35rem] font-black text-[#142642] dark:text-white">
              {formatMoney(offer.price_per_seat_minor, offer.currency)}
            </b>
            <p className="text-[10px] font-medium text-[#6A7F98] dark:text-slate-400">за місце</p>
          </div>
        </div>

        <div className="mt-3.5 flex items-center justify-between border-t border-[#E3EBF4] pt-3 dark:border-slate-800">
          <div className="flex min-w-0 items-center gap-2.5">
            <span className="grid h-9 w-9 shrink-0 place-items-center overflow-hidden rounded-full bg-[#EAF2FF] text-xs font-extrabold text-[#1769ED] dark:bg-blue-950/60 dark:text-blue-300">
              {offer.driver_photo_url ? (
                <img src={offer.driver_photo_url} alt={`Фото водія ${offer.driver_name}`} className="h-full w-full object-cover" />
              ) : (
                offer.driver_name.slice(0, 1).toUpperCase()
              )}
            </span>
            <div className="min-w-0">
              <span className="block truncate text-xs font-extrabold text-[#142642] dark:text-white">
                {offer.driver_name}
              </span>
              {offer.review_count > 0 ? (
                <span className="text-[11px] font-bold text-amber-500">
                  ★ {Number(offer.average_rating).toFixed(1)}{' '}
                  <span className="font-medium text-[#6A7F98] dark:text-slate-400">({offer.review_count})</span>
                </span>
              ) : (
                <span className="text-[10px] font-medium text-[#6A7F98] dark:text-slate-400">Новий водій</span>
              )}
            </div>
          </div>
          <span className="rounded-xl bg-[#1769ED] px-4 py-2 text-xs font-extrabold text-white shadow-xs">
            Обрати
          </span>
        </div>
      </button>
    );
  };

  const searchScreen = useLegacySearchForm ? (
    <div className="mx-auto w-full max-w-xl px-4 pb-24">
      <button type="button" onClick={() => setUseLegacySearchForm(false)} className="mb-3 rounded-full border border-[#E3EBF4] bg-white px-3 py-2 text-xs font-bold text-[#1769ED] shadow-xs dark:border-slate-800 dark:bg-[#101E38]">
        Повернутися до пошуку MARSHGO
      </button>
      {searchForm}
    </div>
  ) : (
    <SearchExperienceV6
      onOpenNotifications={() => void openNotifications()}
      unreadNotificationCount={notificationPage.unreadCount}
      initialOrigin={searchOriginPlace?.label || origin || ''}
      initialDestination={searchDestinationPlace?.label || destination || ''}
      onBookOfferId={(offerId, passengerCount) => {
        setSeats(passengerCount);
        void productionApi.offer(offerId).then((off) => {
          setSelectedOffer(off);
        }).catch(() => {});
      }}
      onOpenReverseMarketplace={(orig, dest) => {
        setDemandOriginText(orig);
        setDemandDestinationText(dest);
        setTab('demand');
      }}
      onOpenJourneyPlanner={(criteria) => {
        const originPoint = criteria.origin.latitude == null || criteria.origin.longitude == null
          ? null
          : { label: criteria.origin.label, latitude: criteria.origin.latitude, longitude: criteria.origin.longitude, providerId: criteria.origin.providerId ?? 'coordinates' };
        const destinationPoint = criteria.destination.latitude == null || criteria.destination.longitude == null
          ? null
          : { label: criteria.destination.label, latitude: criteria.destination.latitude, longitude: criteria.destination.longitude, providerId: criteria.destination.providerId ?? 'coordinates' };
        if (!originPoint || !destinationPoint) {
          setStatusMessage('Оберіть обидва населені пункти зі списку пошуку.');
          return;
        }
        const modeTypes: Record<SearchTransportMode, TransportTypeId[]> = {
          all: [], carpool: ['carpool'], taxi: ['taxi'], bus: ['bus', 'intercity_bus'], minibus: ['marshrutka'],
          tram: ['tram'], trolleybus: ['trolleybus'], metro: ['metro'], train: ['train'], suburban_train: ['suburban_train'],
          bike: ['bike'], scooter: ['scooter'], carsharing: ['carsharing'], transfer: ['transfer'], water: ['ferry'], air: ['plane'], other: ['walk'],
        };
        const selection = criteria.modes.includes('all')
          ? selectAll(transportSelection)
          : { ...transportSelection, active: [...new Set(criteria.modes.flatMap((mode) => modeTypes[mode]))] };
        return searchJourney({
          origin: originPoint,
          destination: destinationPoint,
          date: criteria.date,
          time: criteria.time,
          passengers: criteria.passengers,
          strategy: criteria.strategy,
          selection,
        });
      }}
    />
  );

  const homeScreen = (
    <HomeV5
      unreadNotificationCount={notificationPage.unreadCount}
      onStartNavigation={() => { setNavAutoStart(true); setTab('navigation'); }}
      onSearchTrip={() => { setNavAutoStart(false); setTab('search'); }}
      onPlanTrip={() => { setNavAutoStart(false); setTab('plan'); }}
      onOpenNotifications={() => void openNotifications()}
    />
  );  const planScreen = <PlanTripChoice onBack={() => setTab('home')}
    onAsDriver={() => { if (!authenticatedUser.roles.includes('driver')) { setStatusMessage('Щоб запланувати поїздку автомобілем, додайте та верифікуйте авто у профілі.'); setTab('profile'); return; } setTab('offer-new'); }}
    onAsPassenger={() => setTab('demand')}/>;

  const journeyModeLabel = (journey: ApiJourneySearchResult['journeys'][number]) => {
    if (journey.legs.length > 1) return 'Комбіновані';
    const labels: Record<string, string> = {
      COMMUNITY: 'Попутки', TAXI: 'Таксі', BUS: 'Автобуси', MINIBUS: 'Маршрутки', RAIL: 'Поїзди',
      TRAM: 'Трамвай', TROLLEYBUS: 'Тролейбус', METRO: 'Метро', FERRY: 'Пором',
    };
    return labels[journey.legs[0]?.mode ?? ''] ?? 'Інше';
  };
  const journeyModeChoices = journeyResult
    ? [...new Set(journeyResult.journeys.map(journeyModeLabel))]
    : [];
  const visibleJourneyResult = journeyResult && journeyResultMode !== 'all'
    ? { ...journeyResult, journeys: journeyResult.journeys.filter((journey) => journeyModeLabel(journey) === journeyResultMode) }
    : journeyResult;

  const resultsScreen = (
    <div className="journey-results mx-auto w-full max-w-xl px-4 pb-8">
      {/* Header matching 05_Результати.png */}
      <div className="mb-4 flex items-center gap-3">
        <button
          onClick={() => { setShowResults(false); setJourneyResult(null); setRestoredSearchMode(null); setTab('search'); }}
          aria-label="Повернутися до пошуку"
          className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-[#E3EBF4] bg-white text-[#142642] shadow-xs dark:border-slate-800 dark:bg-[#101E38] dark:text-slate-200"
        >
          <ArrowLeft size={18} />
        </button>
        <div className="min-w-0 flex-1">
          <h1 title={`${origin} → ${destination}`} className="truncate text-lg font-extrabold text-[#142642] dark:text-white">
            {origin.split(',')[0]} → {destination.split(',')[0]}
          </h1>
          <p className="text-xs text-[#6A7F98] dark:text-slate-400">
            {new Intl.DateTimeFormat('uk-UA', { dateStyle: 'medium', timeZone: 'Europe/Kyiv' }).format(new Date(`${date}T12:00:00`))} · {passengersLabel(seats)}
          </p>
        </div>
        <div className="flex items-center gap-1 rounded-2xl bg-[#F5F8FC] p-1 border border-[#E3EBF4] dark:border-slate-800 dark:bg-[#0B1730]">
          <button
            type="button"
            className="rounded-xl bg-white px-3 py-1.5 text-xs font-extrabold text-[#1769ED] shadow-xs dark:bg-[#101E38] dark:text-blue-400"
          >
            Список ({journeyResult?.journeys.length ?? offers.length})
          </button>
          <button
            type="button"
            onClick={() => setTab('map')}
            className="rounded-xl px-3 py-1.5 text-xs font-semibold text-[#6A7F98] hover:text-[#142642] dark:text-slate-400 dark:hover:text-white"
          >
            Карта
          </button>
        </div>
      </div>

      {/* Transport filters reflect modes returned by the active providers. */}
      <div className="no-scrollbar mb-4 flex gap-2 overflow-x-auto pb-1">
        {(journeyResult
          ? [{ id: 'all', label: 'Усі', count: journeyResult.journeys.length }, ...journeyModeChoices.map((label) => ({ id: label, label, count: journeyResult.journeys.filter((journey) => journeyModeLabel(journey) === label).length }))]
          : [{ id: 'all', label: 'Усі', count: offers.length }, { id: 'Попутки', label: 'Попутки', count: offers.length }]
        ).map((item) => {
          const active = journeyResult ? journeyResultMode === item.id : item.id === 'all';
          return <button
            key={item.id}
            type="button"
            aria-pressed={active}
            onClick={() => { if (journeyResult) setJourneyResultMode(item.id); }}
            className={`shrink-0 rounded-full px-4 py-2 text-xs font-extrabold transition-all ${active ? 'bg-[#1769ED] text-white shadow-xs' : 'border border-[#E3EBF4] bg-white text-[#6A7F98] hover:border-slate-300 dark:border-slate-800 dark:bg-[#101E38] dark:text-slate-300'}`}
          >
            {item.label} <span className="opacity-75">{item.count}</span>
          </button>;
        })}
      </div>

      {offers.length > 1 && (
        <div role="group" aria-label="Сортування поїздок" className="no-scrollbar mb-4 flex items-center gap-2 overflow-x-auto pb-1">
          <span className="shrink-0 text-[11px] font-bold text-[#6A7F98]">Сортувати:</span>
          {([['earliest', 'Найраніше'], ['cheapest', 'Найдешевше'], ['fastest', 'Найшвидше']] as const).map(([key, label]) => (
            <button
              key={key}
              type="button"
              aria-pressed={offerSort === key}
              onClick={() => setOfferSort(key)}
              className={`shrink-0 rounded-full border px-3 py-1.5 text-xs font-bold transition-colors ${
                offerSort === key
                  ? 'border-[#1769ED] bg-[#EAF2FF] text-[#1769ED] dark:border-blue-500 dark:bg-blue-950/60 dark:text-blue-300'
                  : 'border-[#E3EBF4] bg-white text-[#6A7F98] dark:border-slate-800 dark:bg-[#101E38] dark:text-slate-400'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      )}

      {offers.length > 0 && offers.every((item) => item.other_date) && (
        <p role="status" className="mb-3 rounded-2xl bg-amber-50 p-3 text-xs leading-5 text-amber-900 border border-amber-100">
          На обрану дату поїздок немає. Нижче — той самий маршрут в інші дні.
        </p>
      )}

      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-extrabold text-[#142642] dark:text-white">Знайдені поїздки</h2>
        <span className="text-xs font-semibold text-[#6A7F98]">{journeyResult?.journeys.length ?? offers.length} варіантів</span>
      </div>

      {journeyResult ? (
        <JourneyResultsPanel result={visibleJourneyResult ?? journeyResult} onOpenOffer={(offerId, journeyId, journeyLegId) => void openJourneyOffer(offerId, journeyId, journeyLegId)} />
      ) : restoredSearchMode === 'planner' ? (
        <div className="rounded-3xl border border-[#E3EBF4] bg-white p-6 text-center dark:border-slate-800 dark:bg-[#101E38]">
          <Compass className="mx-auto text-[#1769ED]" />
          <p className="mt-2 font-extrabold text-[#142642] dark:text-white">Параметри маршруту відновлено</p>
          <p className="mt-1 text-sm text-[#6A7F98] dark:text-slate-400">Оновіть план, щоб перевірити актуальні пропозиції.</p>
          <button onClick={() => void searchJourney()} className="mt-4 rounded-2xl bg-[#1769ED] px-5 py-3 text-sm font-extrabold text-white">
            Оптимізувати весь маршрут
          </button>
        </div>
      ) : offers.length ? (
        <div className="space-y-3">{sortedOffers.map(offerCard)}</div>
      ) : (
        <div className="rounded-3xl border border-[#E3EBF4] bg-white p-6 text-center dark:border-slate-800 dark:bg-[#101E38]">
          <Search className="mx-auto text-[#6A7F98]" />
          <p className="mt-2 font-extrabold text-[#142642] dark:text-white">Немає поїздок за цими умовами</p>
          <p className="mt-1 text-sm text-[#6A7F98] dark:text-slate-400">Спробуйте змінити дату або кількість пасажирів.</p>
        </div>
      )}

      <OtherModesPanel selection={transportSelection} groups={providerGroups} origin={searchOriginPlace ? { latitude: searchOriginPlace.latitude, longitude: searchOriginPlace.longitude } : null} />
    </div>
  );

  const visibleBookings = route?.kind === 'booking' && route.entityId ? bookings.filter((booking) => booking.id === route.entityId) : bookings;
  const upcomingOffers = myOffers.filter((offer) => (offer.status ?? 'published') === 'published' && new Date(offer.departure_at).getTime() > Date.now());
  const bookingSection = (booking: ApiBooking) => booking.status === 'boarding' || booking.status === 'in_progress' ? 'active' : booking.status === 'confirmed' ? 'upcoming' : 'past';
  const sectionBookings = route?.kind === 'booking' && route.entityId ? visibleBookings : visibleBookings.filter((booking) => bookingSection(booking) === tripsSection);
  const tripSectionCounts = { active: visibleBookings.filter((b) => bookingSection(b) === 'active').length, upcoming: visibleBookings.filter((b) => bookingSection(b) === 'upcoming').length, past: visibleBookings.filter((b) => bookingSection(b) === 'past').length };

  const activeVehicle = vehicles.find((v) => v.is_active) ?? vehicles[0];

  const tripsScreen = (
    <div className="mx-auto w-full max-w-xl px-5 pb-8">
      {/* Header: 12_Мої поїздки.png */}
      <div className="mb-4 pt-1">
        <h1 className="text-3xl font-extrabold tracking-tight text-[#142642] dark:text-white">Мої поїздки</h1>
        <p className="mt-1 text-sm text-[#6A7F98] dark:text-slate-400">
          Все, що заплановано, в одному місці
        </p>
      </div>

      {/* Segmented controls: 12_Мої поїздки.png */}
      <div role="tablist" aria-label="Розділи поїздок" className="mb-5 grid grid-cols-4 gap-1 rounded-2xl bg-[#EEF3F9] p-1 text-xs dark:bg-[#0B1730]">
        {([['active', 'Активні'], ['upcoming', 'Майбутні'], ['past', 'Минулі'], ['requests', 'Запити']] as const).map(([key, label]) => (
          <button
            key={key}
            type="button"
            role="tab"
            aria-selected={tripsSection === key}
            onClick={() => {
              tripsSectionChosen.current = true;
              setTripsSection(key);
            }}
            className={`rounded-xl py-2.5 font-bold transition-all ${
              tripsSection === key
                ? 'bg-white text-[#1769ED] shadow-xs dark:bg-[#101E38] dark:text-blue-400'
                : 'text-[#6A7F98] dark:text-slate-400'
            }`}
          >
            {label}
            {key !== 'requests' && tripSectionCounts[key] > 0 ? ` · ${tripSectionCounts[key]}` : ''}
          </button>
        ))}
      </div>

      {(tripsSection === 'upcoming' || tripsSection === 'past') && journeys.length > 0 && (
        <section className="mb-5" aria-label="Збережені маршрути">
          <div className="mb-2 flex items-center justify-between">
            <h2 className="font-extrabold text-[#142642] dark:text-white">Збережені маршрути</h2>
            <button
              onClick={() => void refreshJourneys().catch((error) => setStatusMessage(error instanceof Error ? error.message : 'Маршрути недоступні.'))}
              className="text-xs font-bold text-[#1769ED]"
            >
              Оновити
            </button>
          </div>
          <div className="space-y-3">
            {journeys.map((journey) => {
              const statusLabel: Record<string, string> = {
                PLANNED: 'Заплановано',
                READY: 'Маршрут готовий',
                PARTIALLY_RESERVED: 'Частково заброньовано',
                REPLANNING: 'Потрібне перепланування',
                ACTIVE: 'У дорозі',
                COMPLETED: 'Завершено',
                CANCELLED: 'Скасовано',
                FAILED: 'Не вдалося побудувати',
              };
              return (
                <article key={journey.id} className="rounded-3xl border border-[#E3EBF4] bg-white p-4 shadow-xs dark:border-slate-800 dark:bg-[#101E38]">
                  <div className="flex items-center justify-between gap-2">
                    <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${
                      journey.state === 'READY'
                        ? 'bg-emerald-50 text-emerald-700'
                        : journey.state === 'REPLANNING'
                        ? 'bg-amber-50 text-amber-800'
                        : 'bg-blue-50 text-[#1769ED]'
                    }`}>
                      {statusLabel[journey.state] ?? journey.state}
                    </span>
                    <span className="text-[10px] text-[#6A7F98]">{journey.strategy}</span>
                  </div>
                  <button onClick={() => setRoutePath(pathForProductionEntity('journey', journey.id))} className="mt-2 text-left text-base font-extrabold text-[#142642] dark:text-white">
                    {journey.origin_name} <span className="text-[#1769ED]">→</span> {journey.destination_name}
                  </button>
                  <p className="mt-1 text-xs text-[#6A7F98] dark:text-slate-400">
                    {formatDate(journey.requested_departure_at)} · {passengersLabel(journey.passenger_count)} · {journey.legs.length} відрізок
                  </p>
                  <p className="mt-1 text-xs font-bold text-[#1769ED]">
                    {journey.confirmed_price_minor !== null
                      ? `Підтверджено ${formatMoney(journey.confirmed_price_minor, 'UAH')}`
                      : journey.total_price_minor !== null
                      ? `Оцінка ${formatMoney(journey.total_price_minor, 'UAH')}`
                      : 'Ціна оновиться після перепланування'}
                  </p>
                </article>
              );
            })}
          </div>
        </section>
      )}

      {tripsSection === 'requests' && (
        <section className="mb-5" aria-label="Запити">
          <div className="space-y-3">
            <button
              type="button"
              onClick={() => setTab('my-demands')}
              className="flex w-full items-center justify-between rounded-3xl border border-[#E3EBF4] bg-white p-4 text-left shadow-xs hover:border-[#1769ED]/40 dark:border-slate-800 dark:bg-[#101E38]"
            >
              <div className="flex items-center gap-3">
                <div className="grid h-10 w-10 place-items-center rounded-xl bg-blue-50 text-[#1769ED] dark:bg-blue-950/60 dark:text-blue-400">
                  <Users size={18} />
                </div>
                <div>
                  <b className="block text-sm font-bold text-[#142642] dark:text-white">Мої запити на поїздку</b>
                  <small className="text-xs text-[#6A7F98] dark:text-slate-400">
                    {myDemands.length ? `${myDemands.length} — переглянути пропозиції водіїв` : 'Створіть запит кнопкою «+»'}
                  </small>
                </div>
              </div>
              <ChevronRight size={18} className="text-[#6A7F98]" />
            </button>
            {authenticatedUser.roles.includes('driver') && (
              <button
                type="button"
                onClick={() => setTab('requests')}
                className="flex w-full items-center justify-between rounded-3xl border border-[#E3EBF4] bg-white p-4 text-left shadow-xs hover:border-[#1769ED]/40 dark:border-slate-800 dark:bg-[#101E38]"
              >
                <div className="flex items-center gap-3">
                  <div className="grid h-10 w-10 place-items-center rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400">
                    <Compass size={18} />
                  </div>
                  <div>
                    <b className="block text-sm font-bold text-[#142642] dark:text-white">Запити пасажирів</b>
                    <small className="text-xs text-[#6A7F98] dark:text-slate-400">Відкриті запити, на які можна запропонувати ціну</small>
                  </div>
                </div>
                <ChevronRight size={18} className="text-[#6A7F98]" />
              </button>
            )}
          </div>
        </section>
      )}

      {tripsSection === 'upcoming' && authenticatedUser.roles.includes('driver') && (
        <section className="mb-5">
          <div className="mb-2 flex items-center justify-between">
            <h2 className="font-extrabold text-[#142642] dark:text-white">Мої оголошення</h2>
            <button
              onClick={() => void refreshMyOffers().catch((error) => setStatusMessage(error instanceof Error ? error.message : 'Оголошення недоступні.'))}
              className="text-xs font-bold text-[#1769ED]"
            >
              Оновити
            </button>
          </div>
          {upcomingOffers.length ? (
            <div className="space-y-3">
              {upcomingOffers.map((offer) => (
                <article key={offer.id} className="rounded-3xl border border-[#E3EBF4] bg-white p-4 shadow-xs dark:border-slate-800 dark:bg-[#101E38]">
                  <div className="flex items-center justify-between gap-2">
                    <span className="rounded-full bg-blue-50 px-2.5 py-1 text-[10px] font-bold text-[#1769ED] dark:bg-blue-950/60 dark:text-blue-300">
                      Моє оголошення
                    </span>
                    <span className="text-xs font-semibold text-[#6A7F98]">
                      {formatDate(offer.departure_at, { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <h3 className="mt-2 text-base font-extrabold text-[#142642] dark:text-white">
                    {offer.origin_name.split(',')[0]} → {offer.destination_name.split(',')[0]}
                  </h3>
                  <p className="mt-1 text-xs text-[#6A7F98] dark:text-slate-400">
                    {offer.available_seats} вільні місця · {formatMoney(offer.price_per_seat_minor, offer.currency)} за місце
                  </p>
                  <div className="my-3 border-t border-[#E3EBF4] dark:border-slate-800" />
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1.5 text-xs font-semibold text-[#142642] dark:text-slate-300">
                      <Users size={14} className="text-[#6A7F98]" />
                      <span>{offer.total_seats - offer.available_seats} бронювання</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => setEditingOffer(offer)}
                      className="text-xs font-extrabold text-[#1769ED] hover:underline"
                    >
                      Керувати →
                    </button>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <p className="rounded-2xl bg-white p-4 text-sm text-[#6A7F98] shadow-xs dark:bg-[#101E38]">
              Запланованих поїздок немає. Створіть поїздку через «Запланувати поїздку».
            </p>
          )}
        </section>
      )}

      {tripsSection === 'requests' && !(route?.kind === 'booking') ? null : sectionBookings.length ? (
        <div className="space-y-3">
          {sectionBookings.map((booking) => {
            const statusLabel: Record<string, string> = {
              confirmed: 'Підтверджено',
              boarding: 'Посадка',
              in_progress: 'У дорозі',
              completed: 'Завершено',
              cancelled: 'Скасовано',
            };
            const rendezvous = rendezvousSessions[booking.id];
            return (
              <article key={booking.id} className="rounded-3xl border border-[#E3EBF4] bg-white p-4 shadow-xs dark:border-slate-800 dark:bg-[#101E38]">
                <div className="flex items-center justify-between">
                  <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${
                    booking.status === 'confirmed'
                      ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300'
                      : booking.status === 'completed'
                      ? 'bg-blue-50 text-[#1769ED] dark:bg-blue-950/50 dark:text-blue-300'
                      : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'
                  }`}>
                    ● {statusLabel[booking.status] ?? booking.status}
                  </span>
                  <span className="text-xs font-semibold text-[#6A7F98]">
                    {formatDate(booking.departure_at, { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <h2 className="mt-2 text-lg font-extrabold text-[#142642] dark:text-white">
                  {booking.origin_name.split(',')[0]} <span className="text-[#1769ED]">→</span> {booking.destination_name.split(',')[0]}
                </h2>
                <p className="mt-1 text-xs text-[#6A7F98] dark:text-slate-400">
                  {booking.current_user_is_driver ? `Пасажир ${booking.passenger_name}` : `Водій ${booking.driver_name}`} · {booking.seat_count} місця · {formatMoney(booking.total_price_minor, booking.currency)}
                </p>

                <div className="my-3 border-t border-[#E3EBF4] dark:border-slate-800" />

                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-xs font-semibold text-[#142642] dark:text-slate-300">
                    <MapPin size={14} className="text-[#6A7F98]" />
                    <span>{booking.origin_name.split(',')[0]}</span>
                  </span>
                  <div className="flex items-center gap-2">
                    {booking.status === 'confirmed' && (
                      <button
                        disabled={busy}
                        onClick={() => void cancelTrip(booking)}
                        className="rounded-xl bg-rose-50 px-3 py-1.5 text-xs font-bold text-rose-700 hover:bg-rose-100 disabled:opacity-50 dark:bg-rose-950/50 dark:text-rose-300"
                      >
                        Скасувати
                      </button>
                    )}
                    {(() => {
                      const unreadCount = unreadConversations[booking.id] ?? 0;
                      return (
                        <button
                          onClick={() => void openChat(booking)}
                          className="flex items-center gap-1 rounded-xl bg-blue-50 px-3 py-1.5 text-xs font-bold text-[#1769ED] hover:bg-blue-100 dark:bg-blue-950/60 dark:text-blue-300"
                        >
                          <MessageCircle size={14} />
                          <span>Чат</span>
                          {unreadCount > 0 && (
                            <span className="grid h-4 min-w-4 place-items-center rounded-full bg-[#1769ED] px-1 text-[9px] text-white">
                              {unreadCount}
                            </span>
                          )}
                        </button>
                      );
                    })()}
                  </div>
                </div>

                {['confirmed', 'boarding', 'in_progress'].includes(booking.status) && (
                  <section className="mt-3 rounded-2xl border border-blue-100 bg-blue-50/70 p-3 dark:border-blue-900/40 dark:bg-blue-950/30">
                    <div className="flex items-center justify-between gap-2">
                      <div>
                        <b className="block text-xs text-[#142642] dark:text-white">Зустріч із {booking.current_user_is_driver ? booking.passenger_name : booking.driver_name}</b>
                        <small className="text-[10px] text-[#6A7F98]">Точка посадки · {rendezvous?.pickup.label ?? booking.origin_name}</small>
                      </div>
                    </div>
                    {!rendezvous ? (
                      <button disabled={rendezvousBusyId === booking.id} onClick={() => void loadRendezvous(booking)} className="mt-2 w-full rounded-xl bg-white py-2 text-xs font-bold text-[#1769ED] shadow-xs disabled:opacity-50 dark:bg-[#101E38] dark:text-blue-400">
                        {rendezvousBusyId === booking.id ? 'Завантажуємо…' : 'Відкрити зустріч'}
                      </button>
                    ) : (
                      <button type="button" onClick={() => setMeetingBookingId(booking.id)} className="mt-2 w-full rounded-xl bg-[#1769ED] py-2 text-xs font-bold text-white">
                        Відкрити карту зустрічі
                      </button>
                    )}
                  </section>
                )}

                {booking.status === 'confirmed' && !booking.current_user_is_driver && (
                  <div className="mt-3 rounded-2xl bg-blue-50/60 p-3 dark:bg-blue-950/20">
                    <button disabled={busy} onClick={() => void showBookingTicket(booking)} className="text-xs font-bold text-[#1769ED]">
                      {visibleBookingTicket?.bookingId === booking.id ? 'Оновити квиток' : 'Показати квиток для посадки'}
                    </button>
                    {visibleBookingTicket?.bookingId === booking.id && (
                      <div className="mt-2 rounded-xl bg-white p-2 shadow-xs dark:bg-[#101E38]">
                        <p className="text-[10px] font-semibold text-[#6A7F98]">Підписаний QR-код посадки</p>
                        <TicketQr token={visibleBookingTicket.token} />
                      </div>
                    )}
                  </div>
                )}

                {booking.status === 'confirmed' && booking.current_user_is_driver && (
                  <form
                    className="mt-3 rounded-2xl bg-blue-50/60 p-3 dark:bg-blue-950/20"
                    onSubmit={(event) => { event.preventDefault(); void confirmBoarding(booking); }}
                  >
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-200">
                      Підтвердити посадку пасажира
                      <input
                        required
                        value={boardingTicketInput[booking.id] ?? ''}
                        onChange={(event) => setBoardingTicketInput((current) => ({ ...current, [booking.id]: event.target.value }))}
                        autoComplete="off"
                        placeholder="Введіть токен із квитка пасажира"
                        className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 font-mono text-xs dark:border-slate-700 dark:bg-slate-900"
                      />
                    </label>
                    <button disabled={busy} className="mt-2 w-full rounded-xl bg-[#1769ED] py-2.5 text-xs font-bold text-white disabled:opacity-50">
                      Підтвердити квиток
                    </button>
                  </form>
                )}

                {booking.status === 'boarding' && booking.current_user_is_driver && (
                  <button type="button" disabled={busy} onClick={() => void startTrip(booking)} className="mt-3 w-full rounded-xl bg-emerald-600 py-3 text-sm font-bold text-white disabled:opacity-50">
                    Розпочати поїздку
                  </button>
                )}

                {booking.status === 'in_progress' && (
                  <div className="mt-3 rounded-2xl bg-emerald-50 p-3 dark:bg-emerald-950/30">
                    <p className="text-xs leading-5 text-emerald-900 dark:text-emerald-200">
                      {booking.current_user_confirmed_completion
                        ? `Ви підтвердили прибуття (${booking.completion_confirmation_count}/2). Очікуємо другого учасника.`
                        : `Підтверджень прибуття: ${booking.completion_confirmation_count}/2.`}
                    </p>
                    {!booking.current_user_confirmed_completion && (
                      <button type="button" disabled={busy} onClick={() => void confirmTripCompletion(booking)} className="mt-2 w-full rounded-xl bg-emerald-600 py-2.5 text-xs font-bold text-white disabled:opacity-50">
                        Підтвердити прибуття
                      </button>
                    )}
                  </div>
                )}

                {booking.status === 'completed' && !booking.current_user_has_review && (
                  <button type="button" onClick={() => { setReviewBookingId(booking.id); setReviewRating(5); setReviewComment(''); }} className="mt-3 w-full rounded-xl border border-amber-200 bg-amber-50 py-2.5 text-xs font-bold text-amber-800 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-200">
                    Залишити відгук
                  </button>
                )}
                {booking.status === 'cancelled' && !booking.current_user_is_driver && (() => {
                  const rescue = bookingRescues[booking.id];
                  const replanningJourney = rescueJourneyForBooking(booking);
                  const replanningLeg = replanningJourney?.legs.find(leg => leg.bookingId === booking.id && leg.state === 'CANCELLED');
                  return <section className="mt-3 rounded-2xl bg-amber-50 p-3 dark:bg-amber-950/25">
                    <h3 className="text-xs font-extrabold text-amber-950 dark:text-amber-100">Підібрати заміну скасованій поїздці</h3>
                    {replanningJourney && <button type="button" onClick={() => { setSelectedJourney(replanningJourney); setTab('trips'); }} className="mt-2 block text-left text-xs font-bold text-blue-700 underline dark:text-blue-300">Відкрити оновлений маршрут із пересадками</button>}
                    {!rescue || rescue.loading ? <p className="mt-2 text-xs text-amber-900 dark:text-amber-200">Шукаємо поїздки за цим маршрутом…</p>
                      : rescue.failed ? <p className="mt-2 text-xs text-rose-700">Не вдалося знайти альтернативи. Оновіть список пізніше.</p>
                      : rescue.result?.alternatives.length ? <div className="mt-2 space-y-2">{rescue.result.alternatives.slice(0, 3).map((alternative) => <button key={alternative.id} type="button" data-offer-id={alternative.id} onClick={() => { setJourneyBookingLink(replanningJourney && replanningLeg ? { journeyId: replanningJourney.id, journeyLegId: replanningLeg.id } : null); setSelectedJourney(null); setSelectedOffer(alternative); setTab('search'); setRoutePath(pathForProductionEntity('offer', alternative.id)); }} className="block w-full rounded-xl bg-white p-3 text-left text-xs shadow-xs dark:bg-[#101E38]"><b className="block">{alternative.origin_name.split(',')[0]} → {alternative.destination_name.split(',')[0]}</b><span className="mt-1 block text-slate-600 dark:text-slate-300">{formatDate(alternative.departure_at)} · {formatMoney(alternative.price_per_seat_minor, alternative.currency)} за місце</span><span className="mt-1 block text-[10px] text-slate-500">{alternative.rescue_match === 'ALONG_CANCELLED_ROUTE' ? 'Підібрано вздовж початкового маршруту' : 'Збіг за початком і кінцем маршруту'}</span></button>)}</div>
                        : <p className="mt-2 text-xs text-amber-900 dark:text-amber-200">Поки не знайшли доступних поїздок поруч із маршрутом.</p>}
                  </section>;
                })()}
              </article>
            );
          })}
        </div>
      ) : (
        <div className="rounded-3xl border border-[#E3EBF4] bg-white p-8 text-center shadow-xs dark:border-slate-800 dark:bg-[#101E38]">
          <Ticket className="mx-auto text-slate-300" size={36} />
          <p className="mt-3 font-extrabold text-[#142642] dark:text-white">Поки немає поїздок</p>
          <p className="mt-1 text-xs text-[#6A7F98] dark:text-slate-400">Знайдіть маршрут і забронюйте місце.</p>
          <button onClick={() => setTab('search')} className="mt-4 rounded-2xl bg-[#1769ED] px-5 py-3 text-xs font-extrabold text-white shadow-xs">
            Знайти поїздку
          </button>
        </div>
      )}
    </div>
  );

  const profileScreen = (
    <div className="mx-auto w-full max-w-xl px-5 pb-8">
      {/* Header: 15_Профіль.png */}
      <div className="mb-4 pt-1">
        <h1 className="text-3xl font-extrabold tracking-tight text-[#142642] dark:text-white">Профіль</h1>
        <p className="mt-1 text-sm text-[#6A7F98] dark:text-slate-400">Мій обліковий запис</p>
      </div>

      {/* User Info Card: 15_Профіль.png */}
      <div className="flex items-center gap-4 rounded-3xl border border-[#E3EBF4] bg-white p-4 shadow-xs dark:border-slate-800 dark:bg-[#101E38]">
        <div className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-blue-50 text-[#1769ED] dark:bg-blue-950/60 dark:text-blue-400">
          {authenticatedUser.driver_photo_url ? (
            <img src={authenticatedUser.driver_photo_url} alt="" className="h-full w-full rounded-2xl object-cover" />
          ) : (
            <User size={28} />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <b className="block text-base font-extrabold text-[#142642] dark:text-white">
            {authenticatedUser.display_name || 'Мій профіль'}
          </b>
          <p className="text-xs text-[#6A7F98] dark:text-slate-400">
            {authenticatedUser.phone_e164 || 'Номер телефону не додано'}
          </p>
          <span className={`mt-1.5 inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-bold ${authenticatedUser.is_verified ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400' : 'bg-amber-50 text-amber-800 dark:bg-amber-950/50 dark:text-amber-300'}`}>
            {authenticatedUser.is_verified ? '✓ Профіль перевірено' : 'Профіль очікує перевірки'}
          </span>
        </div>
      </div>

      {/* Driver Photo upload/preview */}
      <div className="mt-3">
        <DriverPhotoCard
          photoUrl={authenticatedUser.driver_photo_url}
          isDriver={authenticatedUser.roles.includes('driver')}
          onChange={(url, message) => {
            setUser((current) => current ? { ...current, driver_photo_url: url } : current);
            setStatusMessage(message);
          }}
        />
      </div>

      {/* Мій транспорт Section: 15_Профіль.png */}
      <div className="mt-5">
        <h2 className="mb-2 text-sm font-extrabold text-[#142642] dark:text-white">Мій транспорт</h2>
        <button
          type="button"
          onClick={() => {
            if (authenticatedUser.roles.includes('driver')) setShowVehicleForm(true);
            else void enableDriver();
          }}
          className="flex w-full items-center justify-between rounded-3xl border border-[#E3EBF4] bg-white p-4 text-left shadow-xs transition hover:border-[#1769ED]/40 hover:shadow-sm dark:border-slate-800 dark:bg-[#101E38]"
        >
          <div className="flex items-center gap-3">
            <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-blue-50 to-sky-100 text-[#1769ED] dark:from-blue-950/70 dark:to-slate-800 dark:text-blue-300">
              <CarFront size={22} />
            </div>
            <div className="min-w-0">
              <span className="block text-[10px] font-bold uppercase tracking-[0.12em] text-[#8291A5] dark:text-slate-500">
                {activeVehicle ? 'Активний автомобіль' : 'Профіль водія'}
              </span>
              <b className="mt-0.5 block truncate text-sm font-extrabold text-[#142642] dark:text-white">
                {activeVehicle ? `${activeVehicle.make} ${activeVehicle.model}` : authenticatedUser.roles.includes('driver') ? 'Додайте автомобіль' : 'Ставайте водієм'}
              </b>
              <p className="mt-0.5 text-xs text-[#6A7F98] dark:text-slate-400">
                {activeVehicle ? `${activeVehicle.model_year} · ${activeVehicle.seat_count} місць` : 'Автомобіль для спільних поїздок'}
              </p>
            </div>
          </div>
          <ChevronRight size={18} className="shrink-0 text-[#6A7F98]" />
        </button>

        {vehicles.length > 0 && (
          <div className="mt-3 space-y-2">
            {vehicles.map(vehicleCard)}
          </div>
        )}
      </div>

      {/* Обліковий запис Section: 15_Профіль.png */}
      <div className="mt-5">
        <h2 className="mb-2 text-sm font-extrabold text-[#142642] dark:text-white">Обліковий запис</h2>
        <div className="divide-y divide-[#E3EBF4] rounded-3xl border border-[#E3EBF4] bg-white shadow-xs dark:divide-slate-800 dark:border-slate-800 dark:bg-[#101E38]">
          {/* Документи */}
          <button
            type="button"
            onClick={() => setProfileSection('documents')}
            className="flex w-full items-center justify-between p-4 text-left transition hover:bg-slate-50 dark:hover:bg-slate-800/40"
          >
            <div className="flex items-center gap-3">
              <div className="grid h-10 w-10 place-items-center rounded-xl bg-blue-50 text-[#1769ED] dark:bg-blue-950/60 dark:text-blue-400">
                <FileText size={18} />
              </div>
              <div>
                <b className="block text-sm font-bold text-[#142642] dark:text-white">Документи</b>
                <p className="text-xs text-[#6A7F98] dark:text-slate-400">Перевірка особи та автомобіля</p>
              </div>
            </div>
            <ChevronRight size={18} className="text-[#6A7F98]" />
          </button>

          {/* Безпека */}
          <button
            type="button"
            onClick={() => setProfileSection('settings')}
            className="flex w-full items-center justify-between p-4 text-left transition hover:bg-slate-50 dark:hover:bg-slate-800/40"
          >
            <div className="flex items-center gap-3">
              <div className="grid h-10 w-10 place-items-center rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400">
                <ShieldCheck size={18} />
              </div>
              <div>
                <b className="block text-sm font-bold text-[#142642] dark:text-white">Безпека</b>
                <p className="text-xs text-[#6A7F98] dark:text-slate-400">Налаштування захисту</p>
              </div>
            </div>
            <ChevronRight size={18} className="text-[#6A7F98]" />
          </button>

          {/* Налаштування */}
          <button
            type="button"
            onClick={() => setProfileSection('settings')}
            className="flex w-full items-center justify-between p-4 text-left transition hover:bg-slate-50 dark:hover:bg-slate-800/40"
          >
            <div className="flex items-center gap-3">
              <div className="grid h-10 w-10 place-items-center rounded-xl bg-slate-100 text-[#6A7F98] dark:bg-slate-800 dark:text-slate-300">
                <Settings size={18} />
              </div>
              <div>
                <b className="block text-sm font-bold text-[#142642] dark:text-white">Налаштування</b>
                <p className="text-xs text-[#6A7F98] dark:text-slate-400">Мова, тема, сповіщення</p>
              </div>
            </div>
            <ChevronRight size={18} className="text-[#6A7F98]" />
          </button>

          {/* Допомога */}
          <button
            type="button"
            onClick={() => setProfileSection('help')}
            className="flex w-full items-center justify-between p-4 text-left transition hover:bg-slate-50 dark:hover:bg-slate-800/40"
          >
            <div className="flex items-center gap-3">
              <div className="grid h-10 w-10 place-items-center rounded-xl bg-amber-50 text-amber-600 dark:bg-amber-950/60 dark:text-amber-400">
                <HelpCircle size={18} />
              </div>
              <div>
                <b className="block text-sm font-bold text-[#142642] dark:text-white">Допомога</b>
                <p className="text-xs text-[#6A7F98] dark:text-slate-400">Підтримка та відповіді</p>
              </div>
            </div>
            <ChevronRight size={18} className="text-[#6A7F98]" />
          </button>
        </div>
      </div>

      {authenticatedUser.roles.some((role) => role === 'admin' || role === 'moderator') && (
        <button
          onClick={() => setTab('admin')}
          className="mt-4 flex w-full items-center justify-between rounded-3xl border border-[#E3EBF4] bg-white p-4 text-left shadow-xs dark:border-slate-800 dark:bg-[#101E38]"
        >
          <span>
            <b className="block text-sm font-bold text-[#142642] dark:text-white">Модерація та скарги</b>
            <small className="text-xs text-[#6A7F98] dark:text-slate-400">Захищені черги перевірки документів і безпеки</small>
          </span>
          <ChevronRight size={18} className="text-[#6A7F98]" />
        </button>
      )}

      {/* Blocked Users */}
      {blockedUsers.length > 0 && (
        <section className="mt-4 rounded-3xl border border-[#E3EBF4] bg-white p-4 shadow-xs dark:border-slate-800 dark:bg-[#101E38]">
          <div className="mb-3 flex items-center gap-2">
            <Ban size={17} className="text-rose-600" />
            <div>
              <h2 className="text-sm font-extrabold text-[#142642] dark:text-white">Заблоковані користувачі</h2>
              <p className="text-xs text-[#6A7F98] dark:text-slate-400">Керуйте приватним списком блокувань</p>
            </div>
          </div>
          <div className="space-y-2">
            {blockedUsers.map((blocked) => (
              <div key={blocked.user_id} className="flex items-center gap-3 rounded-2xl bg-[#F5F8FC] p-3 dark:bg-[#0B1730]">
                <span className="grid h-9 w-9 place-items-center rounded-full bg-white text-sm font-bold text-slate-600 dark:bg-slate-800 dark:text-slate-200">
                  {blocked.display_name.slice(0, 1).toUpperCase()}
                </span>
                <span className="min-w-0 flex-1">
                  <b className="block truncate text-sm text-[#142642] dark:text-white">{blocked.display_name}</b>
                  <small className="text-xs text-[#6A7F98]">Заблоковано {formatDate(blocked.created_at, { day: 'numeric', month: 'short' })}</small>
                </span>
                <button disabled={busy} onClick={() => void unblockContact(blocked)} className="rounded-xl bg-white px-3 py-1.5 text-xs font-bold text-[#1769ED] shadow-xs">Розблокувати</button>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Export data & Logout */}
      <div className="mt-5 flex gap-3">
        <button
          type="button"
          disabled={exportingData}
          onClick={() => void downloadPersonalData()}
          className="flex flex-1 items-center justify-center gap-2 rounded-2xl border border-[#E3EBF4] bg-white py-3.5 text-xs font-bold text-[#142642] shadow-xs hover:bg-slate-50 dark:border-slate-800 dark:bg-[#101E38] dark:text-slate-200"
        >
          <FileDown size={15} />
          {exportingData ? 'Готуємо…' : 'Експорт даних'}
        </button>
        <button
          onClick={() => void logout()}
          className="flex flex-1 items-center justify-center gap-2 rounded-2xl border border-rose-100 bg-rose-50/70 py-3.5 text-xs font-bold text-rose-600 shadow-xs hover:bg-rose-100 dark:border-rose-950 dark:bg-rose-950/30"
        >
          <LogOut size={15} />
          Вийти
        </button>
      </div>
    </div>
  );

  const adminScreen = <div className="mx-auto w-full max-w-xl px-5 pb-5"><div className="mb-4 flex items-center justify-between"><div><p className="text-xs font-bold uppercase tracking-[.16em] text-blue-600">Тільки персонал</p><h1 className="text-2xl font-extrabold">Перевірка документів</h1></div><button onClick={()=>void refreshAdminQueue().catch((error:unknown)=>setStatusMessage(error instanceof Error?error.message:'Черга недоступна.'))} className="rounded-xl bg-white px-3 py-2 text-xs font-bold text-blue-700">Оновити</button></div><p className="mb-3 rounded-xl bg-amber-50 p-3 text-xs leading-5 text-amber-800">Документи містять чутливі дані. Відкриття й рішення журналюються; схвалення одного документа ще не верифікує авто.</p>{adminQueue.length?<div className="space-y-3">{adminQueue.map(record=><article key={record.id} className="rounded-2xl bg-white p-4 shadow-sm"><div className="flex items-start justify-between gap-3"><div><p className="text-[10px] font-bold uppercase tracking-wide text-blue-600">{record.verification_type==='vehicle'?'Реєстраційний документ':record.verification_type==='driver_license'?'Посвідчення водія':record.verification_type}</p><h2 className="mt-1 font-extrabold">{record.display_name}</h2><p className="mt-1 text-xs text-slate-500">{record.make&&record.model?`${record.make} ${record.model} · ${record.model_year} · ${record.seat_count} місць`:'Документ профілю'}</p><p className="mt-1 text-[10px] text-slate-400">Подано {formatDate(record.created_at)}</p></div><span className="rounded-full bg-amber-50 px-2.5 py-1 text-[10px] font-bold text-amber-700">Очікує</span></div><button disabled={busy} onClick={()=>void openVerificationEvidence(record)} className="mt-3 w-full rounded-xl bg-blue-600 py-3 text-xs font-bold text-white disabled:opacity-50">Відкрити та перевірити документ</button></article>)}</div>:<div className="rounded-2xl bg-white p-6 text-center"><ShieldCheck className="mx-auto text-emerald-600"/><p className="mt-2 font-bold">Черга порожня</p><p className="mt-1 text-xs text-slate-500">Нові подання з’являться після завантаження водієм документів.</p></div>}</div>;

  const moderationScreen = <section className="mb-5 rounded-[1.4rem] bg-[#eef4ff] p-4"><div className="mb-3 flex items-center justify-between"><div><p className="text-[10px] font-bold uppercase tracking-[.16em] text-blue-700">Безпека спільноти</p><h2 className="text-lg font-extrabold">Скарги користувачів</h2></div><button onClick={()=>void refreshModerationCases().catch(error=>setStatusMessage(error instanceof Error?error.message:'Черга скарг недоступна.'))} className="rounded-xl bg-white px-3 py-2 text-xs font-bold text-blue-700">Оновити</button></div>{moderationCases.length? <div className="space-y-3">{moderationCases.map(report=><article key={report.id} className="rounded-2xl bg-white p-4 shadow-sm"><div className="flex items-start justify-between gap-3"><div><p className="text-[10px] font-bold uppercase tracking-wide text-rose-600">{({safety:'Безпека',harassment:'Домагання',fraud:'Шахрайство',service:'Якість сервісу',other:'Інше'} as const)[report.category]}</p><h3 className="mt-1 text-sm font-extrabold">{report.reporter_name} · {report.reported_user_name}</h3><p className="mt-1 text-xs text-slate-500">{report.origin_name&&report.destination_name?`${report.origin_name} → ${report.destination_name}`:'Бронювання недоступне'} · {formatDate(report.created_at)}</p><p className="mt-2 whitespace-pre-wrap text-sm text-slate-700">{report.details}</p></div><span className={`shrink-0 rounded-full px-2 py-1 text-[10px] font-bold ${report.status==='open'?'bg-amber-50 text-amber-700':report.status==='in_review'?'bg-blue-50 text-blue-700':'bg-slate-100 text-slate-600'}`}>{report.status==='open'?'Нова':report.status==='in_review'?'У роботі':report.status==='resolved'?'Вирішена':'Відхилена'}</span></div>{report.status==='open'&&<button disabled={busy} onClick={()=>void reviewModerationCase(report,'in_review')} className="mt-3 w-full rounded-xl bg-blue-600 py-2.5 text-xs font-bold text-white disabled:opacity-50">Взяти у роботу</button>}{report.status==='in_review'&&<><label className="mt-3 block text-xs font-semibold text-slate-600">Рішення й коротке обґрунтування<textarea value={moderationNotes[report.id]??''} onChange={event=>setModerationNotes(current=>({...current,[report.id]:event.target.value}))} maxLength={1000} className="mt-1.5 min-h-16 w-full rounded-xl border border-slate-200 p-3 text-sm font-normal" placeholder="Опишіть перевірку та вжиті заходи"/></label><div className="mt-2 grid grid-cols-2 gap-2"><button disabled={busy} onClick={()=>void reviewModerationCase(report,'resolved','no_action')} className="rounded-xl bg-emerald-600 py-2.5 text-xs font-bold text-white disabled:opacity-50">Підтвердити, без блокування</button><button disabled={busy} onClick={()=>void reviewModerationCase(report,'dismissed','no_action')} className="rounded-xl border border-slate-200 py-2.5 text-xs font-bold text-slate-700 disabled:opacity-50">Відхилити скаргу</button>{authenticatedUser.roles.includes('admin')&&<button disabled={busy} onClick={()=>void reviewModerationCase(report,'resolved','suspend_account')} className="col-span-2 rounded-xl bg-rose-600 py-2.5 text-xs font-bold text-white disabled:opacity-50">Призупинити акаунт і відкликати сесії</button>}</div></>}</article>)}</div>:<div className="rounded-xl bg-white p-4 text-sm text-slate-500">Скарг у черзі немає.</div>}</section>;
  const adminDashboard = authenticatedUser.roles.some((role) => role === 'admin' || role === 'moderator')
    ? <div className="mx-auto w-full max-w-xl px-5 pb-5">{moderationScreen}{adminScreen}{authenticatedUser.roles.includes('admin') && <Suspense fallback={null}><MobilityAdminPanel/></Suspense>}</div>
    : <main className="grid min-h-[70svh] place-items-center px-5 text-center"><div className="max-w-md rounded-3xl bg-white p-8 shadow-sm"><p className="text-xs font-bold uppercase tracking-[.16em] text-amber-700">403</p><h1 className="mt-2 text-2xl font-extrabold">Доступ заборонено</h1><p className="mt-2 text-sm text-slate-500">Цей розділ доступний лише модераторам і адміністраторам.</p><button onClick={goHome} className="mt-5 rounded-xl bg-blue-600 px-5 py-3 text-sm font-bold text-white">На головну</button></div></main>;

  // A vehicle with a plate is enough for now (photo is optional).
  const publishableVehicles = vehicles.filter(vehicleUsable);
  const offerFormScreen = <div className="mx-auto w-full max-w-xl px-5 pb-5">
    <div className="mb-4 flex items-center gap-3"><button onClick={()=>setTab('home')} className="grid h-10 w-10 place-items-center rounded-full bg-white"><ArrowLeft size={18}/></button><div><p className="text-xs text-slate-500">MARSHGO Community</p><h1 className="font-extrabold">Опублікувати поїздку</h1></div></div>
    <form onSubmit={publishOffer} className="space-y-3 rounded-[1.5rem] bg-white p-4 shadow-sm">
      {([['origin','Звідки',offerOriginText,setOfferOriginText,offerOrigin],['destination','Куди',offerDestinationText,setOfferDestinationText,offerDestination]] as const).map(([field,label,value,setValue,selected])=><div key={field} className="rounded-xl bg-[#f6f8fc] p-3"><label className="block text-[11px] font-semibold text-slate-500">{label}</label><div className="mt-1 flex items-center gap-2"><MapPin size={16} className={field==='origin'?'text-emerald-600':'text-rose-500'}/><input required value={value} onChange={event=>{setValue(event.target.value);if(field==='origin')setOfferOrigin(null);else setOfferDestination(null);}} className="min-w-0 flex-1 bg-transparent text-sm font-bold outline-none" placeholder="Пошук адреси або міста"/><button type="button" aria-label="Знайти" title="Знайти" onClick={()=>void searchOfferPlace(field)} disabled={placeSearchBusy} className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-white text-blue-700">{placeSearchBusy&&offerPlaceField===field?'…':<Search size={15}/>}</button><button type="button" aria-label="Обрати на мапі" title="Обрати на мапі" onClick={()=>setPicker({form:'offer',field})} className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-white text-[#1789F4]"><MapPin size={15}/></button></div>{selected&&<p className="mt-1 text-[10px] text-emerald-700">Точку вибрано з геокодера</p>}{offerPlaceField===field&&offerPlaceSuggestions.length>0&&<div className="mt-2 divide-y divide-slate-100 overflow-hidden rounded-xl border border-slate-100 bg-white">{offerPlaceSuggestions.map(place=><button key={place.providerId} type="button" onClick={()=>chooseOfferPlace(place)} className="block w-full px-3 py-2.5 text-left text-xs hover:bg-blue-50">{place.label}</button>)}</div>}</div>)}
      <label className="block rounded-xl bg-[#f6f8fc] p-3 text-[11px] font-semibold text-slate-500">Час відправлення · Київ<input required type="datetime-local" min={formatKyivDateTimeInput(new Date(Date.now()+60_000))} value={offerDeparture} onChange={event=>setOfferDeparture(event.target.value)} className="mt-1 block w-full bg-transparent text-sm font-bold text-slate-800 outline-none"/></label>
      <label className="block rounded-xl bg-[#f6f8fc] p-3 text-[11px] font-semibold text-slate-500">Автомобіль<select required value={offerVehicleId} onChange={event=>{setOfferVehicleId(event.target.value);const selected=vehicles.find(vehicle=>vehicle.id===event.target.value);if(selected)setOfferSeats(Math.min(offerSeats,selected.seat_count));}} className="mt-1 block w-full bg-transparent text-sm font-bold text-slate-800"><option value="">Оберіть авто</option>{publishableVehicles.map(vehicle=><option key={vehicle.id} value={vehicle.id}>{vehicle.make} {vehicle.model}{vehicle.plate?` · ${vehicle.plate}`:''} · {vehicle.seat_count} місць{vehicle.is_active?' · активне':''}</option>)}</select></label>
      {publishableVehicles.length===0&&<div className="rounded-xl bg-amber-50 p-3 text-xs leading-5 text-amber-800">Для публікації потрібне авто з номером. Додайте авто в профілі — фото поки необов’язкове.<button type="button" onClick={()=>setTab('profile')} className="ml-1 font-bold underline">Відкрити профіль</button></div>}
      <div className="grid grid-cols-2 gap-2"><label className="rounded-xl bg-[#f6f8fc] p-3 text-[11px] font-semibold text-slate-500">Ціна за місце, грн<input required inputMode="decimal" value={offerPrice} onChange={event=>setOfferPrice(event.target.value)} className="mt-1 block w-full bg-transparent text-sm font-bold text-slate-800 outline-none"/></label><label className="rounded-xl bg-[#f6f8fc] p-3 text-[11px] font-semibold text-slate-500">Місця<select value={offerSeats} onChange={event=>setOfferSeats(Number(event.target.value))} className="mt-1 block w-full bg-transparent text-sm font-bold text-slate-800">{Array.from({length:Math.max(1,vehicles.find(vehicle=>vehicle.id===offerVehicleId)?.seat_count??1)},(_,index)=>index+1).map(count=><option key={count} value={count}>{count}</option>)}</select></label></div>
      <button disabled={busy||!publishableVehicles.some(vehicle=>vehicle.id===offerVehicleId)} className="flex w-full items-center justify-center gap-2 rounded-2xl bg-blue-600 py-4 text-sm font-bold text-white disabled:opacity-50">{busy?'Публікуємо…':'Опублікувати поїздку'}<ArrowRight size={17}/></button>
      <p className="text-[10px] leading-4 text-slate-400">Платформа бере 0% комісії з приватних Community-поїздок. Дорожню відстань та ETA має підтвердити налаштований сервер маршрутизації.</p>
    </form>
  </div>;

  const demandFormScreen = <div className="mx-auto w-full max-w-xl px-5 pb-5">
    <div className="mb-4 flex items-center gap-3"><button onClick={()=>setTab('home')} className="grid h-10 w-10 place-items-center rounded-full bg-white"><ArrowLeft size={18}/></button><div><p className="text-xs text-slate-500">Зворотний маркетплейс</p><h1 className="font-extrabold">Шукаю поїздку</h1></div><button onClick={()=>{setSelectedDemand(null);setTab('my-demands');}} className="ml-auto text-xs font-bold text-blue-600">Мої заявки</button></div>
    <form onSubmit={publishDemand} className="space-y-3 rounded-[1.5rem] bg-white p-4 shadow-sm">
      {([['origin','Звідки',demandOriginText,setDemandOriginText,demandOrigin],['destination','Куди',demandDestinationText,setDemandDestinationText,demandDestination]] as const).map(([field,label,value,setValue,selected])=><div key={field} className="rounded-xl bg-[#f6f8fc] p-3"><label className="block text-[11px] font-semibold text-slate-500">{label}</label><div className="mt-1 flex items-center gap-2"><MapPin size={16} className={field==='origin'?'text-emerald-600':'text-rose-500'}/><input required value={value} onChange={event=>{setValue(event.target.value);if(field==='origin')setDemandOrigin(null);else setDemandDestination(null);}} className="min-w-0 flex-1 bg-transparent text-sm font-bold outline-none" placeholder="Пошук адреси або міста"/><button type="button" aria-label="Знайти" title="Знайти" onClick={()=>void searchPlace(field)} disabled={placeSearchBusy} className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-white text-blue-700">{placeSearchBusy&&placeField===field?'…':<Search size={15}/>}</button><button type="button" aria-label="Обрати на мапі" title="Обрати на мапі" onClick={()=>setPicker({form:'demand',field})} className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-white text-[#1789F4]"><MapPin size={15}/></button></div>{selected&&<p className="mt-1 text-[10px] text-emerald-700">Точку вибрано з геокодера</p>}{placeField===field&&placeSuggestions.length>0&&<div className="mt-2 divide-y divide-slate-100 overflow-hidden rounded-xl border border-slate-100 bg-white">{placeSuggestions.map(place=><button key={place.providerId} type="button" onClick={()=>choosePlace(place)} className="block w-full px-3 py-2.5 text-left text-xs hover:bg-blue-50">{place.label}</button>)}</div>}</div>)}
      <div className="grid grid-cols-2 gap-2"><label className="rounded-xl bg-[#f6f8fc] p-3 text-[11px] font-semibold text-slate-500">Не раніше<input required type="datetime-local" value={demandEarliest} onChange={event=>setDemandEarliest(event.target.value)} className="mt-1 block w-full bg-transparent text-xs font-bold text-slate-800 outline-none"/></label><label className="rounded-xl bg-[#f6f8fc] p-3 text-[11px] font-semibold text-slate-500">Не пізніше<input required type="datetime-local" value={demandLatest} onChange={event=>setDemandLatest(event.target.value)} className="mt-1 block w-full bg-transparent text-xs font-bold text-slate-800 outline-none"/></label></div>
      <div className="grid grid-cols-2 gap-2"><label className="rounded-xl bg-[#f6f8fc] p-3 text-[11px] font-semibold text-slate-500">Пасажири<select value={demandPassengers} onChange={event=>setDemandPassengers(Number(event.target.value))} className="mt-1 block w-full bg-transparent text-sm font-bold text-slate-800">{Array.from({length:8},(_,i)=>i+1).map(n=><option key={n} value={n}>{n}</option>)}</select></label><label className="rounded-xl bg-[#f6f8fc] p-3 text-[11px] font-semibold text-slate-500">Бюджет, грн<input inputMode="decimal" value={demandBudget} onChange={event=>setDemandBudget(event.target.value)} className="mt-1 block w-full bg-transparent text-sm font-bold text-slate-800 outline-none" placeholder="Не вказано"/></label></div>
      <label className="block rounded-xl bg-[#f6f8fc] p-3 text-[11px] font-semibold text-slate-500">Тип бюджету<select value={demandBudgetType} onChange={event=>setDemandBudgetType(event.target.value as 'total_all'|'per_seat')} className="mt-1 block w-full bg-transparent text-xs font-bold text-slate-800"><option value="total_all">За всю поїздку</option><option value="per_seat">За одне місце</option></select></label>
      <div className="rounded-xl bg-[#f6f8fc] p-3"><p className="mb-2 text-[11px] font-semibold text-slate-500">Потреби пасажирів</p><div className="flex flex-wrap gap-2">{([['luggage','Багаж'],['pets','Тварини'],['childSeat','Дитяче крісло']] as const).map(([key,label])=><label key={key} className="flex items-center gap-1.5 rounded-full bg-white px-2.5 py-1.5 text-[10px] font-semibold text-slate-600"><input type="checkbox" checked={demandRequirements[key]} onChange={event=>setDemandRequirements({...demandRequirements,[key]:event.target.checked})} className="accent-blue-600"/>{label}</label>)}</div></div>
      <label className="block rounded-xl bg-[#f6f8fc] p-3 text-[11px] font-semibold text-slate-500">Додаткові умови<textarea value={demandNotes} onChange={event=>setDemandNotes(event.target.value)} maxLength={1000} rows={2} className="mt-1 block w-full resize-none bg-transparent text-sm text-slate-800 outline-none" placeholder="Що ще важливо водієві знати?"/></label>
      <button disabled={busy} className="flex w-full items-center justify-center gap-2 rounded-2xl bg-blue-600 py-4 text-sm font-bold text-white disabled:opacity-50">{busy?'Публікуємо…':'Опублікувати заявку'}<ArrowRight size={17}/></button>
      <p className="text-[10px] leading-4 text-slate-400">Координати зберігаються з вибраних геокодером точок. Якщо сервіс місць не налаштовано, заявка не публікується.</p>
    </form>
  </div>;

  const proposalCard = (proposal: ApiProposal) => {
    const myRole = selectedDemandIsOwned ? 'passenger' : 'driver';
    const isMyTurn = proposal.last_actor_role !== myRole && proposal.status === 'pending';
    const needsDriverAgreement = !selectedDemandIsOwned && proposal.last_actor_role === 'passenger' && proposal.status === 'pending';
    const passengerCanConfirm = selectedDemandIsOwned && proposal.last_actor_role === 'driver' && proposal.status === 'pending';
    return <article key={proposal.id} className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm"><div className="flex items-start justify-between gap-3"><div><b className="text-sm">{proposal.driver_name}</b><p className="text-xs text-slate-500">{proposal.make} {proposal.model} · {proposal.model_year}</p></div><span className={`rounded-full px-2 py-1 text-[10px] font-bold ${proposal.status==='pending'?'bg-amber-50 text-amber-700':'bg-slate-100 text-slate-500'}`}>{proposal.status==='pending'?'Переговори':proposal.status==='expired'?'Пропозиція більше не актуальна':proposal.status==='accepted'?'Бронювання створено':proposal.status==='rejected'?'Закрито':'Відкликано'}</span></div><div className="mt-3 flex items-center justify-between"><span className="text-xs text-slate-500">{formatDate(proposal.departure_at)}</span><b className="text-lg">{formatMoney(proposal.price_minor,proposal.currency)}</b></div>{proposal.last_comment&&<p className="mt-2 rounded-xl bg-slate-50 p-3 text-xs text-slate-600">{proposal.last_comment}</p>}
      <button onClick={()=>void loadProposalHistory(proposal.id)} className="mt-3 text-[11px] font-bold text-blue-600">Історія переговорів</button>
      {proposalRevisions[proposal.id]&&<div className="mt-2 space-y-1 border-l-2 border-blue-100 pl-3">{proposalRevisions[proposal.id].map(revision=><p key={revision.revision_number} className="text-[10px] text-slate-500">{revision.actor_role==='driver'?'Водій':'Пасажир'} · {formatMoney(revision.price_minor,'UAH')} · {formatDate(revision.created_at,{hour:'2-digit',minute:'2-digit'})}{revision.comment?` · ${revision.comment}`:''}</p>)}</div>}
      {proposal.status==='pending'&&<div className="mt-3 grid grid-cols-1 gap-2">{isMyTurn&&<button onClick={()=>{setCounterTarget(proposal);setCounterPrice(String((proposal.price_minor/100).toFixed(2)));setCounterDeparture(formatKyivDateTimeInput(proposal.departure_at));setCounterComment('');}} className="rounded-xl border border-blue-200 py-2.5 text-xs font-bold text-blue-700">Змінити ціну або час</button>}{needsDriverAgreement&&<button disabled={busy} onClick={()=>void agreeProposal(proposal)} className="rounded-xl bg-emerald-600 py-2.5 text-xs font-bold text-white">Погодити зустрічну ціну</button>}{passengerCanConfirm&&<button disabled={busy} onClick={()=>void confirmProposal(proposal)} className="rounded-xl bg-blue-600 py-3 text-xs font-bold text-white">Підтвердити домовленість і бронювання</button>}</div>}</article>;
  };

  const demandDetailScreen = (owned: boolean) => selectedDemand ? <div className="mx-auto w-full max-w-xl px-5 pb-5"><div className="mb-4 flex items-center gap-3"><button onClick={()=>setSelectedDemand(null)} className="grid h-10 w-10 place-items-center rounded-full bg-white"><ArrowLeft size={18}/></button><div><p className="text-xs text-slate-500">{owned?'Моя заявка':'Заявка пасажира'}</p><h1 className="font-extrabold">{selectedDemand.origin_name.split(',')[0]} → {selectedDemand.destination_name.split(',')[0]}</h1></div></div><div className="mb-3 rounded-2xl bg-white p-4 shadow-sm"><p className="text-sm font-bold">{formatDate(selectedDemand.earliest_departure)} – {formatDate(selectedDemand.latest_departure,{hour:'2-digit',minute:'2-digit'})}</p><p className="mt-1 text-xs text-slate-500">{passengersLabel(selectedDemand.passenger_count)} · {selectedDemand.budget_minor===null?'Бюджет не вказано':`${formatMoney(selectedDemand.budget_minor,'UAH')} ${selectedDemand.budget_type==='per_seat'?'за місце':'за всіх'}`}</p>{selectedDemand.notes&&<p className="mt-2 text-xs text-slate-600">{selectedDemand.notes}</p>}{owned&&selectedDemand.status==='open'&&<button onClick={()=>void cancelDemand(selectedDemand)} className="mt-3 text-xs font-bold text-rose-600">Скасувати заявку</button>}</div><div className="mb-2 flex items-center justify-between"><h2 className="font-extrabold">Пропозиції водіїв</h2><span className="text-xs text-slate-500">{proposals.length}</span></div>{proposals.length?<div className="space-y-3">{proposals.map(proposalCard)}</div>:<p className="rounded-2xl bg-white p-4 text-sm text-slate-500">Пропозицій поки немає.</p>}</div> : null;

  const myDemandsScreen = selectedDemand && selectedDemandIsOwned ? demandDetailScreen(true) : <div className="mx-auto w-full max-w-xl px-5 pb-5"><div className="mb-4 flex items-center justify-between"><div><p className="text-xs font-bold uppercase tracking-[.16em] text-blue-600">Пасажир</p><h1 className="text-2xl font-extrabold">Мої заявки</h1></div><div className="flex gap-2"><button onClick={()=>void refreshPassengerNavigationMatches().catch(error=>setStatusMessage(error instanceof Error?error.message:'Підбір недоступний.'))} className="rounded-xl bg-white px-3 py-2 text-xs font-bold text-blue-700">Оновити</button><button onClick={()=>{setSelectedDemand(null);setTab('demand');}} className="grid h-10 w-10 place-items-center rounded-full bg-blue-600 text-white"><Plus size={20}/></button></div></div>{passengerNavigationMatches.length>0&&<section className="mb-4 space-y-2"><h2 className="px-1 text-sm font-extrabold">Водії поруч із маршрутом</h2>{passengerNavigationMatches.map(match=><article key={match.candidate_id} className="rounded-2xl border border-blue-100 bg-white p-4 shadow-sm"><div className="flex items-start justify-between gap-3"><div><b className="text-sm">{match.origin_name.split(',')[0]} → {match.destination_name.split(',')[0]}</b><p className="mt-1 text-xs text-slate-500">Забір орієнтовно {formatDate(match.pickup_eta,{hour:'2-digit',minute:'2-digit'})} · відхилення +{(match.detour_distance_m/1000).toFixed(1)} км / +{Math.round(match.detour_duration_s/60)} хв</p></div><span className="rounded-full bg-emerald-50 px-2 py-1 text-[10px] font-bold text-emerald-700">{match.status==='passenger_confirmed'?'Взаємний інтерес':'Є інтерес водія'}</span></div>{match.status==='driver_interested'?<><p className="mt-2 text-xs text-slate-500">Підтвердьте, якщо цей маршрут і час вам підходять. Це ще не бронювання.</p><button disabled={busy} onClick={()=>void confirmNavigationMatch(match.candidate_id)} className="mt-3 w-full rounded-xl bg-blue-600 py-2.5 text-xs font-bold text-white disabled:opacity-50">Підтвердити взаємний інтерес</button></>:<p className="mt-2 rounded-xl bg-amber-50 p-3 text-xs leading-5 text-amber-900">Взаємний інтерес підтверджено. Водій може надіслати ціну у пропозиції до цієї заявки; бронювання ще немає.</p>}</article>)}</section>}{myDemands.length?<div className="space-y-3">{myDemands.map(demand=><button key={demand.id} data-testid={`owned-demand-${demand.id}`} onClick={()=>void viewDemand(demand,true)} className="w-full rounded-2xl bg-white p-4 text-left shadow-sm"><div className="flex items-center justify-between"><b>{demand.origin_name.split(',')[0]} → {demand.destination_name.split(',')[0]}</b><span className="text-[10px] text-slate-400">{({open:'Відкрита',cancelled:'Скасована',accepted:'Прийнята',expired:'Прострочена',closed:'Закрита',matched:'Є збіг'} as Record<string,string>)[demand.status] ?? demand.status}</span></div><p className="mt-1 text-xs text-slate-500">{formatDate(demand.earliest_departure)} · {passengersLabel(demand.passenger_count)}</p><p className="mt-2 text-xs font-bold text-blue-600">{demand.budget_minor===null?'Без вказаного бюджету':`${formatMoney(demand.budget_minor,'UAH')} ${demand.budget_type==='per_seat'?'за місце':'за всіх'}`} · {demand.proposal_count ?? 0} пропозицій</p></button>)}</div>:<div className="rounded-2xl bg-white p-6 text-center"><Compass className="mx-auto text-slate-300"/><p className="mt-2 font-bold">Ви ще не публікували запитів</p><button onClick={()=>setTab('demand')} className="mt-3 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-bold text-white">Створити заявку</button></div>}</div>;

  const requestsScreen = selectedDemand && !selectedDemandIsOwned ? demandDetailScreen(false) : (
    <div className="mx-auto w-full max-w-xl px-5 pb-5">
      <div className="mb-4 flex items-center justify-between">
        <div><p className="text-xs font-bold uppercase tracking-[.16em] text-blue-600">Для водія</p><h1 className="text-2xl font-extrabold">Заявки пасажирів</h1></div>
        <button onClick={() => { void refreshOpenDemands().catch((error: unknown) => setStatusMessage(error instanceof Error ? error.message : 'Заявки недоступні.')); }} className="rounded-xl bg-white px-3 py-2 text-xs font-bold text-blue-700">Оновити</button>
      </div>
      {statusMessage && <p role="status" className="mb-3 rounded-xl border border-emerald-100 bg-emerald-50 p-3 text-xs leading-5 text-emerald-800">{statusMessage}</p>}
      <p className="mb-3 rounded-xl bg-amber-50 p-3 text-[11px] leading-4 text-amber-800">Список показує відкриті заявки. Автоматичне географічне ранжування за маршрутом ще не підключено.</p>
      {openDemands.length ? <div className="space-y-3">
        {openDemands.map((demand) => <article key={demand.id} data-testid={`open-demand-${demand.id}`} className="rounded-2xl bg-white p-4 shadow-sm">
          <button onClick={() => { void viewDemand(demand, false); }} className="w-full text-left">
            <div className="flex items-start justify-between gap-2"><b>{demand.origin_name.split(',')[0]} → {demand.destination_name.split(',')[0]}</b><ChevronRight size={17} className="shrink-0 text-slate-400"/></div>
            <p className="mt-1 text-xs text-slate-500">{formatDate(demand.earliest_departure)} – {formatDate(demand.latest_departure, { hour: '2-digit', minute: '2-digit' })}</p>
            <p className="mt-1 text-xs text-slate-500">{passengersLabel(demand.passenger_count)} · {demand.budget_minor === null ? 'Бюджет не вказано' : `${formatMoney(demand.budget_minor, 'UAH')} ${demand.budget_type === 'per_seat' ? 'за місце' : 'за всіх'}`}</p>
            {demand.notes && <p className="mt-2 line-clamp-2 text-xs text-slate-600">{demand.notes}</p>}
            {Object.entries(demand.requirements ?? {}).some(([, enabled]) => enabled === true) && <p className="mt-2 text-[10px] font-semibold text-blue-700">{Object.entries(demand.requirements ?? {}).filter(([, enabled]) => enabled === true).map(([key]) => demandRequirementLabels[key] ?? key).join(' · ')}</p>}
          </button>
          <button disabled={!vehicles.some((vehicle) => vehicleUsable(vehicle)) || busy} onClick={() => {
            setProposalNavigationCandidateId(null);
            setProposalTarget(demand);
            setProposalDeparture(formatKyivDateTimeInput(demand.earliest_departure));
            const proposedTotal = demand.budget_minor === null ? null : demand.budget_minor / 100 * (demand.budget_type === 'per_seat' ? demand.passenger_count : 1);
            setProposalPrice(proposedTotal === null ? '' : String(proposedTotal.toFixed(2)));
            const verified = vehicles.find((vehicle) => vehicleUsable(vehicle) && vehicle.is_active) ?? vehicles.find((vehicle) => vehicleUsable(vehicle));
            setProposalVehicleId(verified?.id ?? '');
          }} className="mt-3 w-full rounded-xl bg-blue-600 py-2.5 text-xs font-bold text-white disabled:bg-slate-200 disabled:text-slate-500">
            {vehicles.some((vehicle) => vehicleUsable(vehicle)) ? 'Запропонувати ціну' : 'Потрібне перевірене авто'}
          </button>
        </article>)}
      </div> : <p className="rounded-2xl bg-white p-5 text-sm text-slate-500">Відкритих заявок зараз немає.</p>}
    </div>
  );

  const createMenu = showCreateMenu ? (
    <div
      className="fixed inset-0 z-40 flex items-end justify-center bg-slate-950/40 p-3 sm:items-center backdrop-blur-xs"
      onClick={(e) => { if (e.target === e.currentTarget) setShowCreateMenu(false); }}
    >
      <div className="w-full max-w-md rounded-3xl border border-[#E3EBF4] bg-white p-5 shadow-2xl dark:border-slate-800 dark:bg-[#101E38]">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-extrabold text-[#142642] dark:text-white">Створити</h2>
            <p className="text-xs text-[#6A7F98] dark:text-slate-400">Оберіть послугу або тип поїздки</p>
          </div>
          <button
            onClick={() => setShowCreateMenu(false)}
            aria-label="Закрити"
            className="grid h-8 w-8 place-items-center rounded-full bg-[#F5F8FC] text-[#6A7F98] hover:bg-slate-100 dark:bg-slate-800 dark:text-slate-300"
          >
            <X size={18} />
          </button>
        </div>

        <p className="mb-2 px-1 text-[10px] font-extrabold uppercase tracking-wider text-[#6A7F98] dark:text-slate-400">
          Пасажир
        </p>
        <button
          onClick={() => {
            setShowCreateMenu(false);
            setSelectedDemand(null);
            setSelectedDemandIsOwned(false);
            setProposals([]);
            setTab('demand');
          }}
          className="mb-2 flex w-full items-center gap-3.5 rounded-2xl border border-[#E3EBF4] bg-[#F5F8FC] p-3.5 text-left transition hover:border-[#1769ED]/40 dark:border-slate-800 dark:bg-slate-800/60"
        >
          <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-blue-100 text-[#1769ED] dark:bg-blue-950/60 dark:text-blue-400">
            <Compass size={20} />
          </div>
          <div className="min-w-0 flex-1">
            <b className="block text-sm font-extrabold text-[#142642] dark:text-white">Шукаю поїздку</b>
            <small className="block text-xs text-[#6A7F98] dark:text-slate-400">Запит із маршрутом і вашим бюджетом</small>
          </div>
          <ChevronRight size={16} className="text-[#6A7F98]" />
        </button>

        <p className="mb-2 mt-4 px-1 text-[10px] font-extrabold uppercase tracking-wider text-[#6A7F98] dark:text-slate-400">
          Водій
        </p>
        <button
          onClick={() => {
            setShowCreateMenu(false);
            if (!authenticatedUser.roles.includes('driver')) {
              setStatusMessage('Спершу активуйте роль водія у профілі.');
              setTab('profile');
              return;
            }
            setTab('offer-new');
            void refreshVehicles().catch((e) => setStatusMessage(e instanceof Error ? e.message : 'Автомобілі недоступні.'));
          }}
          className="mb-2 flex w-full items-center gap-3.5 rounded-2xl border border-[#E3EBF4] bg-[#F5F8FC] p-3.5 text-left transition hover:border-emerald-300 dark:border-slate-800 dark:bg-slate-800/60"
        >
          <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-emerald-100 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400">
            <CarFront size={20} />
          </div>
          <div className="min-w-0 flex-1">
            <b className="block text-sm font-extrabold text-[#142642] dark:text-white">Опублікувати поїздку</b>
            <small className="block text-xs text-[#6A7F98] dark:text-slate-400">Власне авто, маршрут і ціна</small>
          </div>
          <ChevronRight size={16} className="text-[#6A7F98]" />
        </button>

        <button
          onClick={() => {
            setShowCreateMenu(false);
            if (!authenticatedUser.roles.includes('driver')) {
              setStatusMessage('Спершу активуйте роль водія у профілі.');
              setTab('profile');
              return;
            }
            setTab('navigation');
          }}
          className="mb-2 flex w-full items-center gap-3.5 rounded-2xl border border-[#E3EBF4] bg-[#F5F8FC] p-3.5 text-left transition hover:border-indigo-300 dark:border-slate-800 dark:bg-slate-800/60"
        >
          <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-indigo-100 text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-400">
            <Navigation size={20} />
          </div>
          <div className="min-w-0 flex-1">
            <b className="block text-sm font-extrabold text-[#142642] dark:text-white">Почати навігацію</b>
            <small className="block text-xs text-[#6A7F98] dark:text-slate-400">Почати поїздку · автопідбір попутників уздовж маршруту</small>
          </div>
          <ChevronRight size={16} className="text-[#6A7F98]" />
        </button>

        <button
          onClick={() => {
            setShowCreateMenu(false);
            if (!authenticatedUser.roles.includes('driver')) {
              setStatusMessage('Спершу активуйте роль водія у профілі.');
              setTab('profile');
              return;
            }
            setSelectedDemand(null);
            setSelectedDemandIsOwned(false);
            setProposals([]);
            setTab('requests');
            void refreshOpenDemands().catch((e) => setStatusMessage(e instanceof Error ? e.message : 'Заявки недоступні.'));
          }}
          className="flex w-full items-center gap-3.5 rounded-2xl border border-[#E3EBF4] bg-[#F5F8FC] p-3.5 text-left transition hover:border-blue-300 dark:border-slate-800 dark:bg-slate-800/60"
        >
          <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-blue-100 text-[#1769ED] dark:bg-blue-950/60 dark:text-blue-400">
            <Users size={20} />
          </div>
          <div className="min-w-0 flex-1">
            <b className="block text-sm font-extrabold text-[#142642] dark:text-white">Знайти пасажира</b>
            <small className="block text-xs text-[#6A7F98] dark:text-slate-400">Переглянути відкриті заявки пасажирів</small>
          </div>
          <ChevronRight size={16} className="text-[#6A7F98]" />
        </button>
      </div>
    </div>
  ) : null;

  const journeyDetailScreen = selectedJourney ? <section className="mx-auto w-full max-w-xl px-5 pb-8"><button onClick={() => { setSelectedJourney(null); setTab('trips'); }} className="mb-4 flex items-center gap-2 rounded-xl bg-white px-3 py-2 text-sm font-bold"><ArrowLeft size={17}/>Мої поїздки</button><article className="rounded-3xl bg-white p-5 shadow-sm"><p className="text-xs font-bold uppercase tracking-widest text-blue-600">Збережений Journey · {selectedJourney.state}</p><h1 className="mt-2 text-2xl font-extrabold">{selectedJourney.origin_name} → {selectedJourney.destination_name}</h1><p className="mt-2 text-sm text-slate-500">{formatDate(selectedJourney.requested_departure_at)} · {passengersLabel(selectedJourney.passenger_count)} · {selectedJourney.strategy}</p><p className="mt-3 font-bold text-blue-700">{selectedJourney.confirmed_price_minor !== null ? `Підтверджена ціна ${formatMoney(selectedJourney.confirmed_price_minor, 'UAH')}` : selectedJourney.total_price_minor !== null ? `Розрахункова ціна ${formatMoney(selectedJourney.total_price_minor, 'UAH')}` : 'Ціна ще не визначена'}</p><ol className="mt-5 space-y-3">{selectedJourney.legs.map((leg, index) => <li key={leg.id} className="flex items-start gap-3 rounded-2xl bg-slate-50 p-3"><span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-blue-100 text-xs font-bold text-blue-700">{index + 1}</span><span className="min-w-0 flex-1"><b className="block">{leg.mode === 'COMMUNITY' ? 'Попутка MARSHGO Community' : leg.mode}</b><small className="text-slate-500">{leg.state} · {leg.priceMinor === null ? 'ціна не вказана' : formatMoney(leg.priceMinor, 'UAH')}</small></span></li>)}</ol></article></section> : null;

  const chatScreen = <div className="mx-auto flex min-h-[65svh] w-full max-w-xl flex-col px-5 pb-5"><div className="mb-4 flex items-center gap-3"><button onClick={()=>{setSelectedBooking(null);setTab('trips');}} aria-label="Повернутися до поїздок" className="grid h-10 w-10 place-items-center rounded-full bg-white"><ArrowLeft size={18}/></button><div className="min-w-0 flex-1"><h1 className="truncate font-extrabold">{selectedBooking ? (selectedBooking.current_user_is_driver ? selectedBooking.passenger_name : selectedBooking.driver_name) : 'Чати'}</h1><p className="truncate text-xs text-slate-500">{selectedBooking ? `${selectedBooking.origin_name} → ${selectedBooking.destination_name}` : 'Повідомлення за бронюваннями'}</p></div>{selectedBooking&&<><button disabled={busy} onClick={()=>{setReportCategory('safety');setReportDetails('');setShowReportForm(true);}} aria-label="Поскаржитися на співрозмовника" title="Поскаржитися" className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-amber-50 text-amber-700 disabled:opacity-50"><Flag size={18}/></button><button disabled={busy} onClick={()=>void blockBookingContact()} aria-label="Заблокувати співрозмовника" title="Заблокувати співрозмовника" className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-rose-50 text-rose-600 disabled:opacity-50"><Ban size={18}/></button></>}</div>
    {!selectedBooking ? <div className="space-y-3">{bookings.length ? bookings.map(booking=><button key={booking.id} onClick={()=>void openChat(booking)} className="flex w-full items-center gap-3 rounded-2xl bg-white p-4 text-left"><span className="grid h-10 w-10 place-items-center rounded-full bg-blue-50 text-blue-600"><MessageCircle size={18}/></span><span className="min-w-0 flex-1"><b className="block text-sm">{booking.origin_name} → {booking.destination_name}</b><small className="text-slate-500">{booking.driver_name} · {formatDate(booking.departure_at,{day:'numeric',month:'short'})}</small></span>{(unreadConversations[booking.id]??0)>0&&<span aria-label={`${unreadConversations[booking.id]} непрочитаних повідомлень`} className="grid h-6 min-w-6 place-items-center rounded-full bg-blue-600 px-1.5 text-[10px] font-bold text-white">{unreadConversations[booking.id]}</span>}<ChevronRight size={17} className="text-slate-400"/></button>) : <p className="rounded-2xl bg-white p-5 text-sm text-slate-500">Чат з’явиться після підтвердження бронювання.</p>}</div> : <>
      <div className="mb-3 rounded-xl bg-white px-3 py-2 text-center text-[11px] text-slate-500">Бронювання · {selectedBooking.origin_name} → {selectedBooking.destination_name}<span className={`ml-2 font-semibold ${realtimeConnected?'text-emerald-600':'text-slate-400'}`}>{realtimeConnected?'· онлайн':'· офлайн, історія збережена'}</span></div>
      {olderMessagesAvailable&&<button type="button" onClick={()=>void loadOlderMessages()} disabled={loadingOlderMessages} className="mb-2 self-center rounded-full bg-white px-4 py-2 text-xs font-semibold text-blue-700 shadow-sm disabled:opacity-50">{loadingOlderMessages?'Завантажуємо…':'Завантажити попередні повідомлення'}</button>}
      <div className="flex-1 space-y-3 overflow-y-auto rounded-2xl bg-white/60 p-3">{messages.length ? messages.map((item)=><div key={item.id} className={`max-w-[84%] rounded-2xl px-3 py-2.5 text-sm ${item.sender_id===user?.id?'ml-auto rounded-br-md bg-blue-600 text-white':'rounded-bl-md bg-white shadow-sm'}`}><p>{item.body}</p><small className={`mt-1 block text-[10px] ${item.sender_id===user?.id?'text-blue-100':'text-slate-400'}`}>{formatDate(item.created_at,{hour:'2-digit',minute:'2-digit'})}</small></div>) : <div className="py-10 text-center text-sm text-slate-500">Почніть розмову з водієм або пасажиром.</div>}</div>
      <form onSubmit={sendMessage} className="mt-3 flex gap-2 rounded-full bg-white p-2 shadow-sm"><input value={messageDraft} onChange={event=>setMessageDraft(event.target.value)} className="min-w-0 flex-1 bg-transparent px-3 text-sm outline-none" placeholder="Напишіть повідомлення…" maxLength={4000}/><button disabled={busy||!messageDraft.trim()} className="grid h-10 w-10 place-items-center rounded-full bg-blue-600 text-white disabled:opacity-50"><ArrowRight size={18}/></button></form>
    </>}
  </div>;

  const pickerPlace = !picker ? null : picker.form === 'search' ? (picker.field === 'origin' ? searchOriginPlace : searchDestinationPlace)
    : picker.form === 'offer' ? (picker.field === 'origin' ? offerOrigin : offerDestination) : (picker.field === 'origin' ? demandOrigin : demandDestination);
  const pointPicker = picker ? <Suspense fallback={null}><MapPointPicker title={picker.field === 'origin' ? 'Звідки' : 'Куди'} initial={pickerPlace ? { latitude: pickerPlace.latitude, longitude: pickerPlace.longitude } : null} onConfirm={choosePickedPlace} onClose={() => setPicker(null)}/></Suspense> : null;

  const screen = selectedJourney ? journeyDetailScreen : selectedOffer ? <div className="mx-auto w-full max-w-xl px-5 pb-5"><div className="mb-4 flex items-center gap-3"><button onClick={()=>{setSelectedOffer(null);setJourneyBookingLink(null);setTab('search');}} className="grid h-10 w-10 place-items-center rounded-full bg-white shadow-sm"><ArrowLeft size={18}/></button><div><p className="text-xs text-slate-500">Деталі поїздки</p><h1 className="font-extrabold">{selectedOffer.origin_name.split(',')[0]} → {selectedOffer.destination_name.split(',')[0]}</h1></div></div><div className="mb-3"><Suspense fallback={null}><OfferRoutePreview offer={selectedOffer}/></Suspense></div><div className="mb-3 overflow-hidden rounded-[1.4rem]"><VehiclePhoto url={selectedOffer.vehicle_photo_url} alt={`Авто водія ${selectedOffer.driver_name}`}/></div><div className="rounded-[1.5rem] bg-white p-5 shadow-sm"><span className="rounded-full bg-emerald-50 px-3 py-1 text-[10px] font-bold text-emerald-700">COMMUNITY · Попутка</span><div className="mt-5 grid grid-cols-2 gap-4"><div><small className="text-slate-400">Відправлення</small><p className="mt-1 text-xl font-extrabold">{formatDate(selectedOffer.departure_at,{hour:'2-digit',minute:'2-digit'})}</p><b>{selectedOffer.origin_name.split(',')[0]}</b></div><div className="text-right"><small className="text-slate-400">Прибуття</small><p className="mt-1 text-xl font-extrabold">{selectedOffer.arrival_at?formatDate(selectedOffer.arrival_at,{hour:'2-digit',minute:'2-digit'}):'—'}</p><b>{selectedOffer.destination_name.split(',')[0]}</b></div></div><div className="my-4 border-t border-slate-100"/><ol aria-label="Маршрут поїздки" className="relative ml-1 space-y-5 border-l-2 border-dashed border-[#BBD7FB] pl-5"><li className="relative"><span className="absolute -left-[1.72rem] top-1 h-3 w-3 rounded-full border-2 border-white bg-[#1789F4] shadow"/><p className="text-sm font-extrabold text-[#0E1F35]">{formatDate(selectedOffer.departure_at,{hour:'2-digit',minute:'2-digit'})} · {selectedOffer.origin_name.split(',')[0]}</p><p className="text-[11px] text-slate-400">Посадка</p></li>{selectedOffer.distance_m&&selectedOffer.duration_s?<li className="text-[11px] font-semibold text-slate-500">{(selectedOffer.distance_m/1000).toFixed(0)} км · {Math.floor(selectedOffer.duration_s/3600)} год {Math.round((selectedOffer.duration_s%3600)/60)} хв дорогою</li>:null}<li className="relative"><span className="absolute -left-[1.72rem] top-1 h-3 w-3 rounded-full border-2 border-white bg-[#EF4444] shadow"/><p className="text-sm font-extrabold text-[#0E1F35]">{selectedOffer.arrival_at?formatDate(selectedOffer.arrival_at,{hour:'2-digit',minute:'2-digit'}):'—'} · {selectedOffer.destination_name.split(',')[0]}</p><p className="text-[11px] text-slate-400">Висадка</p></li></ol><div className="my-4 border-t border-slate-100"/><p className="flex items-center gap-3 text-sm"><span className="grid h-12 w-12 shrink-0 place-items-center overflow-hidden rounded-full bg-blue-100 font-bold text-blue-700">{selectedOffer.driver_photo_url?<img src={selectedOffer.driver_photo_url} alt={`Фото водія ${selectedOffer.driver_name}`} className="h-full w-full object-cover"/>:selectedOffer.driver_name.slice(0,1)}</span><span><b>{selectedOffer.driver_name}</b><small className="block text-slate-500">{selectedOffer.review_count?`★ ${Number(selectedOffer.average_rating).toFixed(1)} · ${selectedOffer.review_count} відгуків`:'Новий водій'}</small></span></p><div className="mt-5 flex justify-between text-sm"><span className="text-slate-500">Вільні місця</span><b>{selectedOffer.available_seats}</b></div>{!journeyBookingLink&&<div className="mt-4 flex items-center justify-between rounded-xl bg-[#f6f8fc] px-3 py-2.5"><span className="text-sm font-semibold text-slate-600">Скільки місць бронюємо</span><span className="flex items-center gap-3"><button type="button" aria-label="Менше місць" disabled={bookSeats<=1||busy} onClick={()=>setBookSeats(bookSeats-1)} className="grid h-9 w-9 place-items-center rounded-full bg-white shadow-sm disabled:opacity-30"><Minus size={16}/></button><b data-testid="book-seats" className="w-5 text-center text-lg">{bookSeats}</b><button type="button" aria-label="Більше місць" disabled={bookSeats>=Math.min(selectedOffer.available_seats,8)||busy} onClick={()=>setBookSeats(bookSeats+1)} className="grid h-9 w-9 place-items-center rounded-full bg-white shadow-sm disabled:opacity-30"><Plus size={16}/></button></span></div>}<div className="mt-3 flex justify-between text-sm"><span className="text-slate-500">Вартість за {journeyBookingLink?seats:bookSeats} {(journeyBookingLink?seats:bookSeats)===1?'місце':'місця'}</span><b className="text-lg">{formatMoney(selectedOffer.price_per_seat_minor*(journeyBookingLink?seats:bookSeats),selectedOffer.currency)}</b></div><p className="mt-1 text-right text-[10px] text-slate-400">MARSHGO Community · комісія платформи 0%</p>{myOffers.some((own)=>own.id===selectedOffer.id)&&<p className="mt-4 rounded-xl bg-slate-50 p-3 text-xs text-slate-600">Це ваша поїздка: водій не може бронювати місця в ній.</p>}{bookError&&<p role="alert" data-testid="book-error" className="mt-4 rounded-xl bg-rose-50 p-3 text-xs leading-5 text-rose-700">{bookError}</p>}<button data-testid="offer-book-button" data-offer-id={selectedOffer.id} disabled={busy||selectedOffer.available_seats<(journeyBookingLink?seats:bookSeats)||myOffers.some((own)=>own.id===selectedOffer.id)} onClick={()=>void book(selectedOffer)} className="mt-5 flex w-full items-center justify-center gap-2 rounded-2xl bg-blue-600 py-4 font-bold text-white disabled:opacity-50">{busy?'Обробляємо…':'Забронювати місце'}<ArrowRight size={17}/></button></div></div> : tab==='navigation' ? <Suspense fallback={<main className="grid min-h-[100svh] place-items-center bg-[#f5f8fd] text-sm text-slate-500">Завантажуємо навігацію…</main>}><ProductionNavigation autoStart={navAutoStart} onAddVehicle={()=>{setNavAutoStart(false);setTab('profile');}} onBack={()=>{setNavAutoStart(false);setTab('home')}} onOpenDemand={(demandId,candidateId)=>void openNavigationDemand(demandId,candidateId)}/></Suspense> : tab==='map' ? <Suspense fallback={<main className="grid min-h-[100svh] place-items-center bg-[#f5f8fd] text-sm text-slate-500">Завантажуємо карту…</main>}><TransportMapView onBack={()=>setTab('search')}/></Suspense> : tab==='plan' ? planScreen : tab==='home' ? (showResults ? resultsScreen : homeScreen) : tab==='search' ? (journeyResult ? resultsScreen : searchScreen) : tab==='trips' ? tripsScreen : tab==='chat' ? chatScreen : tab==='profile' ? (profileSection ? <Suspense fallback={null}><ProfileSections section={profileSection} onBack={()=>setProfileSection(null)} vehicles={vehicles} records={verificationRecords} onLogoutAll={logoutAllDevices} onDownloadData={downloadPersonalData} onRequestDeletion={()=>setConfirmDeletion(true)} deletionRequest={deletionRequest} onCancelDeletion={()=>void cancelDeletion()} onLogout={logout}/></Suspense> : profileScreen) : tab==='admin' ? adminDashboard : tab==='demand' ? demandFormScreen : tab==='offer-new' ? offerFormScreen : tab==='requests' ? requestsScreen : myDemandsScreen;

  if (tab === 'navigation' && !selectedOffer) return screen;

  return <main className="production-app min-h-[100svh] bg-[#f5f8fd] dark:bg-[#08121f] pb-[calc(5.3rem+env(safe-area-inset-bottom))] text-[#17243a] dark:text-white">
    {header}
    {status}
    <div className="pt-1">{screen}</div>
    {pointPicker}
    <nav aria-label="Основна навігація" className="app-tabbar fixed inset-x-0 bottom-0 z-30 border-t border-[#E3EBF4] bg-white/95 pt-1.5 backdrop-blur-xl dark:border-slate-800 dark:bg-[#0B1730]/95"><div className="app-tabbar-inner mx-auto flex max-w-md items-center justify-between px-3">{tabItems.map((item,index)=>{const Icon=item.icon;const active=tab===item.id;return <span key={item.id} className="contents">{index===2&&<button type="button" onClick={()=>{setSelectedJourney(null);setSelectedOffer(null);setShowCreateMenu(true);}} aria-label="Створити поїздку чи запит" className="app-create-button -mt-6 grid h-12 w-12 shrink-0 place-items-center rounded-full bg-[#0066FF] text-white shadow-[0_8px_22px_rgba(0,102,255,0.4)] transition-transform hover:scale-105 active:scale-95 border-4 border-[#F5F8FC] dark:border-[#0B1730]"><Plus size={24} strokeWidth={2.8}/><span className="desktop-create-label">Створити</span></button>}<button aria-current={active?'page':undefined} onClick={()=>{setTab(item.id);if(item.id==='home')setShowResults(false);setSelectedOffer(null);setSelectedJourney(null);setSelectedBooking(null);setJourneyBookingLink(null);}} className={`flex flex-1 min-w-0 max-w-[68px] flex-col items-center gap-0.5 px-1 py-1 transition-colors ${active?'text-[#0066FF] dark:text-blue-400':'text-[#6A7F98] dark:text-slate-400'}`}><Icon size={20} strokeWidth={active?2.5:2}/><span className={`truncate text-[10px] ${active?'font-bold':'font-semibold'}`}>{item.label}</span>{active&&item.id==='home'&&<span className="h-1 w-1 rounded-full bg-[#0066FF] dark:bg-blue-400 -mt-0.5"></span>}</button></span>})}</div></nav>
    {createMenu}
    {showNotifications&&<div className="fixed inset-0 z-[55] flex items-end justify-center bg-slate-950/40 p-3 sm:items-center" onMouseDown={event=>{if(event.target===event.currentTarget)setShowNotifications(false);}}><section aria-labelledby="notification-heading" className="max-h-[78svh] w-full max-w-md overflow-hidden rounded-[1.7rem] bg-white shadow-2xl"><div className="flex items-center justify-between border-b border-slate-100 px-5 py-4"><div><h2 id="notification-heading" className="font-extrabold">Сповіщення</h2><p className="mt-0.5 text-xs text-slate-500">Збережені оновлення ваших поїздок</p></div><div className="flex items-center gap-3"><button disabled={!notificationPage.unreadCount} onClick={()=>void markAllNotificationsRead()} className="text-[11px] font-bold text-blue-700 disabled:text-slate-300">Прочитати все</button><button onClick={()=>setShowNotifications(false)} aria-label="Закрити сповіщення"><X size={20}/></button></div></div><div className="max-h-[68svh] overflow-y-auto p-3">{notificationsLoading&&notificationPage.items.length===0?<p className="p-6 text-center text-sm text-slate-500">Завантажуємо…</p>:notificationPage.items.length===0?<p className="p-6 text-center text-sm text-slate-500">Поки що сповіщень немає.</p>:<div className="space-y-2">{notificationPage.items.map(notification=><button key={notification.id} onClick={()=>void markNotificationRead(notification)} className={`flex w-full items-start gap-3 rounded-2xl p-3 text-left ${notification.read_at?'bg-slate-50':'bg-blue-50'}`}><span className={`mt-1 h-2 w-2 shrink-0 rounded-full ${notification.read_at?'bg-slate-300':'bg-blue-600'}`}></span><span className="min-w-0 flex-1"><b className="block text-sm">{notification.title}</b><span className="mt-0.5 block text-xs leading-5 text-slate-600">{notification.body}</span><time className="mt-1 block text-[10px] text-slate-400">{formatDate(notification.created_at,{dateStyle:'medium',timeStyle:'short'})}</time></span></button>)}</div>}{notificationPage.nextCursor&&<button disabled={notificationsLoading} onClick={()=>void loadMoreNotifications()} className="mt-3 w-full rounded-xl bg-slate-100 py-3 text-xs font-bold text-slate-600 disabled:opacity-50">{notificationsLoading?'Завантажуємо…':'Завантажити раніші'}</button>}</div></section></div>}
    {proposalTarget&&<div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/40 p-3 sm:items-center"><form onSubmit={sendProposal} className="w-full max-w-md rounded-[1.7rem] bg-white p-5 shadow-xl"><div className="mb-3 flex items-center justify-between"><div><p className="text-xs text-slate-500">Ваша ціна для пасажира</p>{proposalNavigationCandidateId&&<p className="mt-1 text-[10px] text-emerald-700">Пропозиція прив’язана до підтвердженого збігу навігації; це ще не бронювання.</p>}<h2 className="font-extrabold">{proposalTarget.origin_name.split(',')[0]} → {proposalTarget.destination_name.split(',')[0]}</h2></div><button type="button" onClick={()=>{setProposalTarget(null);setProposalNavigationCandidateId(null);}} aria-label="Закрити"><X size={20}/></button></div><label className="mb-3 block text-xs font-bold text-slate-600">Перевірене авто<select required value={proposalVehicleId} onChange={event=>setProposalVehicleId(event.target.value)} className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm"><option value="">Оберіть авто</option>{vehicles.filter(v=>v.verification_status==='verified').map(v=><option key={v.id} value={v.id}>{v.make} {v.model} · {v.seat_count} місць</option>)}</select></label>{!vehicles.some(v=>v.verification_status==='verified')&&<p className="mb-3 text-xs leading-5 text-amber-700">Немає перевіреного авто. Спершу потрібно пройти перевірку перевізника.</p>}<div className="grid grid-cols-2 gap-3"><label className="text-xs font-bold text-slate-600">Ціна, грн<input required inputMode="decimal" value={proposalPrice} onChange={event=>setProposalPrice(event.target.value)} className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-3 text-sm" placeholder="Загальна сума"/></label><label className="text-xs font-bold text-slate-600">Час виїзду<input required type="datetime-local" value={proposalDeparture} onChange={event=>setProposalDeparture(event.target.value)} className="mt-1.5 w-full rounded-xl border border-slate-200 px-2 py-3 text-xs"/></label></div><label className="mt-3 block text-xs font-bold text-slate-600">Коментар<input value={proposalComment} onChange={event=>setProposalComment(event.target.value)} maxLength={1000} className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-3 text-sm" placeholder="Коротко про поїздку"/></label><button disabled={busy||!vehicles.some(v=>v.verification_status==='verified')} className="mt-4 w-full rounded-xl bg-blue-600 py-3.5 font-bold text-white disabled:opacity-50">Надіслати пропозицію</button></form></div>}
    {counterTarget&&<div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/40 p-3 sm:items-center"><form onSubmit={sendCounter} className="w-full max-w-md rounded-[1.7rem] bg-white p-5 shadow-xl"><div className="mb-4 flex items-center justify-between"><div><p className="text-xs text-slate-500">Зустрічна пропозиція</p><h2 className="font-extrabold">Змінити суму або час</h2></div><button type="button" onClick={()=>setCounterTarget(null)} aria-label="Закрити"><X size={20}/></button></div><label className="mb-3 block text-xs font-bold text-slate-600">Загальна сума, грн<input required inputMode="decimal" value={counterPrice} onChange={event=>setCounterPrice(event.target.value)} className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-3 text-sm"/></label><label className="mb-3 block text-xs font-bold text-slate-600">Час відправлення<input required type="datetime-local" value={counterDeparture} onChange={event=>setCounterDeparture(event.target.value)} className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-3 text-sm"/></label><label className="block text-xs font-bold text-slate-600">Коментар<input value={counterComment} onChange={event=>setCounterComment(event.target.value)} maxLength={1000} className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-3 text-sm"/></label><button disabled={busy} className="mt-4 w-full rounded-xl bg-blue-600 py-3.5 font-bold text-white">Надіслати зустрічну</button></form></div>}
    {showVehicleForm && <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/40 p-3 sm:items-center"><form onSubmit={createVehicle} className="w-full max-w-md rounded-[1.7rem] bg-white p-5 shadow-xl"><div className="mb-4 flex items-center justify-between"><h2 className="text-lg font-extrabold">Додати автомобіль</h2><button type="button" onClick={()=>setShowVehicleForm(false)} aria-label="Закрити"><X size={20}/></button></div>{([['make','Марка'],['model','Модель']] as const).map(([key,label])=><label key={key} className="mb-3 block text-xs font-bold text-slate-600">{label}<input required value={vehicleForm[key]} onChange={event=>setVehicleForm({...vehicleForm,[key]:event.target.value})} className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-3 text-sm outline-none focus:border-blue-500"/></label>)}<label className="mb-3 block text-xs font-bold text-slate-600">Номерний знак<input required value={vehicleForm.plate} onChange={event=>setVehicleForm({...vehicleForm,plate:event.target.value.toUpperCase()})} placeholder="AA1234BB" autoCapitalize="characters" className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-3 text-sm uppercase outline-none focus:border-blue-500"/></label><label className="mb-3 block text-xs font-bold text-slate-600">Фото автомобіля (за бажанням)<input type="file" accept="image/jpeg,image/png,image/webp" onChange={event=>setVehicleFormPhoto(event.target.files?.[0] ?? null)} className="mt-1.5 block w-full text-xs"/></label><div className="grid grid-cols-2 gap-3"><label className="text-xs font-bold text-slate-600">Рік<input required type="number" min="1950" max={new Date().getFullYear()+1} value={vehicleForm.modelYear} onChange={event=>setVehicleForm({...vehicleForm,modelYear:Number(event.target.value)})} className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-3 text-sm"/></label><label className="text-xs font-bold text-slate-600">Місця<input required type="number" min="1" max="20" value={vehicleForm.seats} onChange={event=>setVehicleForm({...vehicleForm,seats:Number(event.target.value)})} className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-3 text-sm"/></label></div><p className="my-3 text-xs leading-5 text-amber-700">Після додавання завантажте техпаспорт і посвідчення водія. Фото авто можна буде додати після підключення сховища.</p><button disabled={busy} className="w-full rounded-xl bg-blue-600 py-3.5 font-bold text-white">{busy?'Зберігаємо…':'Зберегти автомобіль'}</button></form></div>}
    {showReportForm&&selectedBooking&&<div className="fixed inset-0 z-[55] flex items-end justify-center bg-slate-950/50 p-3 sm:items-center"><form onSubmit={submitSafetyReport} className="w-full max-w-md rounded-[1.7rem] bg-white p-5 shadow-2xl"><div className="mb-4 flex items-center justify-between"><div><p className="text-xs font-bold uppercase tracking-wide text-amber-700">Безпека спільноти</p><h2 className="text-lg font-extrabold">Поскаржитися</h2></div><button type="button" onClick={()=>setShowReportForm(false)} aria-label="Закрити"><X size={20}/></button></div><p className="mb-3 text-xs text-slate-500">Скарга стосується учасника поїздки {selectedBooking.origin_name} → {selectedBooking.destination_name}. Не додавайте платіжні дані чи сторонні персональні відомості.</p><label className="mb-3 block text-xs font-bold text-slate-600">Категорія<select value={reportCategory} onChange={event=>setReportCategory(event.target.value as ApiModerationCase['category'])} className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm"><option value="safety">Питання безпеки</option><option value="harassment">Домагання або образи</option><option value="fraud">Підозра на шахрайство</option><option value="service">Якість поїздки</option><option value="other">Інше</option></select></label><label className="block text-xs font-bold text-slate-600">Опишіть ситуацію<textarea required minLength={10} maxLength={2000} value={reportDetails} onChange={event=>setReportDetails(event.target.value)} className="mt-1.5 min-h-28 w-full rounded-xl border border-slate-200 p-3 text-sm font-normal" placeholder="Що сталося? (10–2000 символів)"/></label><div className="mt-3 flex justify-end text-[10px] text-slate-400">{reportDetails.length}/2000</div><button disabled={busy||reportDetails.trim().length<10} className="mt-3 w-full rounded-xl bg-amber-600 py-3.5 font-bold text-white disabled:opacity-50">{busy?'Надсилаємо…':'Надіслати приватну скаргу'}</button></form></div>}
    {verificationTarget&&<div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/40 p-3 sm:items-center"><form onSubmit={submitVerification} className="w-full max-w-md rounded-[1.7rem] bg-white p-5 shadow-xl"><div className="mb-3 flex items-center justify-between"><div><p className="text-xs text-slate-500">Перевірка автомобіля</p><h2 className="font-extrabold">{verificationTarget.make} {verificationTarget.model}</h2></div><button type="button" onClick={()=>{setVerificationTarget(null);setRegistrationEvidence(null);setDriverLicenseEvidence(null);}} aria-label="Закрити"><X size={20}/></button></div><p className="mb-4 rounded-xl bg-blue-50 p-3 text-xs leading-5 text-blue-900">Завантажте техпаспорт і посвідчення водія. Маршрути не показують ці документи; рішення ухвалює уповноважений модератор.</p><label className="mb-3 block text-xs font-bold text-slate-600">Свідоцтво про реєстрацію<input required type="file" accept="image/jpeg,image/png,application/pdf" onChange={event=>setRegistrationEvidence(event.target.files?.[0]??null)} className="mt-1.5 block w-full rounded-xl border border-slate-200 p-2 text-xs"/></label><label className="block text-xs font-bold text-slate-600">Посвідчення водія<input required type="file" accept="image/jpeg,image/png,application/pdf" onChange={event=>setDriverLicenseEvidence(event.target.files?.[0]??null)} className="mt-1.5 block w-full rounded-xl border border-slate-200 p-2 text-xs"/></label><p className="mt-2 text-[10px] text-slate-500">JPEG, PNG або PDF · до 8 МБ на файл</p><button disabled={busy} className="mt-4 w-full rounded-xl bg-blue-600 py-3.5 font-bold text-white disabled:opacity-50">{busy?'Завантажуємо…':'Передати на перевірку'}</button></form></div>}
    {reviewingRecord&&<div className="fixed inset-0 z-[60] flex items-end justify-center bg-slate-950/50 p-3 sm:items-center"><section className="w-full max-w-lg rounded-[1.7rem] bg-white p-4 shadow-2xl"><div className="mb-3 flex items-center justify-between"><div><p className="text-[10px] font-bold uppercase tracking-wide text-blue-600">Перегляд документа</p><h2 className="font-extrabold">{reviewingRecord.display_name} · {reviewingRecord.verification_type==='vehicle'?'Техпаспорт':reviewingRecord.verification_type==='driver_license'?'Посвідчення водія':'Документ'}</h2></div><button onClick={()=>{setReviewingRecord(null);setReviewEvidenceUrl('');}} aria-label="Закрити"><X size={20}/></button></div><iframe title="Документ водія для перевірки" src={reviewEvidenceUrl} className="h-[48svh] w-full rounded-xl border border-slate-200 bg-slate-50"/><label className="mt-3 block text-xs font-bold text-slate-600">Причина відмови — обов’язкова для відхилення<textarea value={reviewNote} onChange={event=>setReviewNote(event.target.value)} maxLength={1000} className="mt-1.5 min-h-16 w-full rounded-xl border border-slate-200 p-3 text-sm font-normal" placeholder="Коротко опишіть невідповідність"/></label><div className="mt-3 grid grid-cols-2 gap-2"><button disabled={busy} onClick={()=>void decideVerification('rejected')} className="rounded-xl border border-rose-200 py-3 text-xs font-bold text-rose-700 disabled:opacity-50">Відхилити</button><button disabled={busy} onClick={()=>void decideVerification('approved')} className="rounded-xl bg-emerald-600 py-3 text-xs font-bold text-white disabled:opacity-50">Схвалити документ</button></div></section></div>}
    {meetingBookingId&&rendezvousSessions[meetingBookingId]&&bookings.find((item)=>item.id===meetingBookingId)&&<Suspense fallback={null}><MeetingMapView booking={bookings.find((item)=>item.id===meetingBookingId)!} initial={rendezvousSessions[meetingBookingId]} onClose={()=>{setMeetingBookingId(null);void loadRendezvous(bookings.find((item)=>item.id===meetingBookingId)!);}}/></Suspense>}
    {vehicleToDelete&&<div className="fixed inset-0 z-[70] flex items-end justify-center bg-slate-950/50 p-3 sm:items-center"><section role="alertdialog" aria-modal="true" aria-labelledby="delete-vehicle-title" aria-describedby="delete-vehicle-description" className="w-full max-w-md rounded-[1.7rem] bg-white p-5 shadow-2xl"><h2 id="delete-vehicle-title" className="text-lg font-extrabold">Видалити {vehicleToDelete.make} {vehicleToDelete.model}?</h2><p id="delete-vehicle-description" className="mt-2 text-sm leading-6 text-slate-600">{vehicleToDelete.is_active?'Це активне авто: активним стане інше ваше авто, якщо воно є. ':''}Минулі поїздки збережуть інформацію про це авто. Якщо воно вже в майбутній поїздці, видалення не буде виконано.</p><div className="mt-5 grid grid-cols-2 gap-2"><button type="button" autoFocus onClick={()=>setVehicleToDelete(null)} className="rounded-xl border border-slate-200 px-4 py-3 text-sm font-bold text-slate-700">Залишити</button><button type="button" disabled={busy} onClick={()=>void confirmDeleteVehicle(vehicleToDelete)} className="rounded-xl bg-rose-600 px-4 py-3 text-sm font-bold text-white disabled:opacity-50">{busy?'Видаляємо…':'Так, видалити'}</button></div></section></div>}
    {editingOffer&&<OfferEditSheet offer={editingOffer} vehicles={vehicles.filter(vehicleUsable)} onClose={()=>setEditingOffer(null)} onDone={(message)=>{setEditingOffer(null);setStatusMessage(message);void Promise.all([refreshMyOffers(),refreshBookings()]).catch(()=>undefined);}}/>}
    {confirmDeletion&&<div className="fixed inset-0 z-[70] flex items-end justify-center bg-slate-950/50 p-3 sm:items-center"><section role="alertdialog" aria-modal="true" aria-labelledby="delete-account-title" aria-describedby="delete-account-description" className="w-full max-w-md rounded-[1.7rem] bg-white p-5 shadow-2xl"><h2 id="delete-account-title" className="text-lg font-extrabold">Подати запит на видалення акаунта?</h2><p id="delete-account-description" className="mt-2 text-sm leading-6 text-slate-600">Дані не видаляться одразу: запит можна скасувати протягом періоду очікування.</p><div className="mt-5 grid grid-cols-2 gap-2"><button type="button" autoFocus onClick={()=>setConfirmDeletion(false)} className="rounded-xl border border-slate-200 px-4 py-3 text-sm font-bold text-slate-700">Залишити акаунт</button><button type="button" disabled={deletionBusy} onClick={()=>void requestDeletion()} className="rounded-xl bg-rose-600 px-4 py-3 text-sm font-bold text-white disabled:opacity-50">Так, подати запит</button></div></section></div>}
    {reviewBookingId && bookings.find((booking) => booking.id === reviewBookingId) && <div className="fixed inset-0 z-[65] flex items-end justify-center bg-slate-950/50 p-3 sm:items-center"><form onSubmit={(event) => { event.preventDefault(); const booking = bookings.find((item) => item.id === reviewBookingId); if (booking) void submitBookingReview(booking); }} className="w-full max-w-md rounded-[1.7rem] bg-white p-5 shadow-2xl"><div className="mb-4 flex items-center justify-between"><div><p className="text-xs font-bold uppercase tracking-wide text-amber-700">Завершена поїздка</p><h2 className="text-lg font-extrabold">Залишити відгук</h2></div><button type="button" onClick={() => setReviewBookingId(null)} aria-label="Закрити"><X size={20}/></button></div><label className="block text-xs font-bold text-slate-700">Оцінка<select value={reviewRating} onChange={(event) => setReviewRating(Number(event.target.value))} className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm"><option value={5}>5 — чудово</option><option value={4}>4 — добре</option><option value={3}>3 — задовільно</option><option value={2}>2 — погано</option><option value={1}>1 — дуже погано</option></select></label><label className="mt-3 block text-xs font-bold text-slate-700">Коментар (необов’язково)<textarea value={reviewComment} onChange={(event) => setReviewComment(event.target.value)} maxLength={1000} className="mt-1.5 min-h-24 w-full rounded-xl border border-slate-200 p-3 text-sm font-normal" placeholder="Як пройшла поїздка?"/></label><button disabled={reviewSubmitting} className="mt-4 w-full rounded-xl bg-amber-600 py-3.5 text-sm font-bold text-white disabled:opacity-50">{reviewSubmitting ? 'Зберігаємо…' : 'Надіслати відгук'}</button></form></div>}
    {bookingToCancel&&<div className="fixed inset-0 z-[70] flex items-end justify-center bg-slate-950/50 p-3 sm:items-center"><section role="alertdialog" aria-modal="true" aria-labelledby="cancel-booking-title" aria-describedby="cancel-booking-description" className="w-full max-w-md rounded-[1.7rem] bg-white p-5 shadow-2xl"><h2 id="cancel-booking-title" className="text-lg font-extrabold">Скасувати бронювання?</h2><p id="cancel-booking-description" className="mt-2 text-sm leading-6 text-slate-600">Місця буде повернено поїздці. {bookingToCancel.current_user_is_driver?'Пасажира буде сповіщено.':'Після скасування можна буде перевірити інші поїздки за маршрутом.'}</p><div className="mt-5 grid grid-cols-2 gap-2"><button type="button" disabled={busy} autoFocus onClick={()=>setBookingToCancel(null)} className="rounded-xl border border-slate-200 px-4 py-3 text-sm font-bold text-slate-700 disabled:opacity-50">Залишити бронювання</button><button type="button" disabled={busy} onClick={()=>void confirmCancelTrip(bookingToCancel)} className="rounded-xl bg-rose-600 px-4 py-3 text-sm font-bold text-white disabled:opacity-50">{busy?'Скасовуємо…':'Так, скасувати'}</button></div></section></div>}
  </main>;
}

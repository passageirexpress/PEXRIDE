import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { MapPin, Clock, Star, Music, Thermometer, VolumeX, Crown, Navigation, CheckCircle2, ChevronLeft, ChevronRight, User, AlertCircle, MessageCircle, Send, X, Search, RefreshCw, CreditCard, History, ArrowRight, Shield, Globe, Award } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { motion, AnimatePresence } from 'motion/react';
import { useFirebase, handleFirestoreError, OperationType } from '../FirebaseProvider';
import { db } from '../firebase';
import { collection, query, where, onSnapshot, orderBy, addDoc, Timestamp, doc, updateDoc, getDocs, limit, setDoc, serverTimestamp } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import { ADDRESS_COORDS, ADDRESS_SUGGESTIONS } from '../constants';

export default function PassengerApp() {
  const { user } = useFirebase();
  const navigate = useNavigate();
  const [tripType, setTripType] = useState('experience');
  const [silentMode, setSilentMode] = useState(false);
  const [temperature, setTemperature] = useState([22]);
  const [selectedPlaylist, setSelectedPlaylist] = useState('Lounge & Jazz');
  const [selectedVehicleIdx, setSelectedVehicleIdx] = useState(0);
  const [showSummary, setShowSummary] = useState(false);
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [bookingStatus, setBookingStatus] = useState<'idle' | 'booking' | 'success' | 'error'>('idle');
  const [pois, setPois] = useState<any[]>([]);
  const [vehicleTypes, setVehicleTypes] = useState<any[]>([
    { id: 'business', name: 'Business Class', description: 'Mercedes E-Class, BMW 5 Series', capacity: 3, basePrice: 45, multiplier: 1, pricePerKm: 2.2, pricePerMin: 0.6, minFare: 50, hourlyRate: 65 },
    { id: 'business_van', name: 'Business Van/SUV', description: 'Mercedes V-Class, Cadillac Escalade', capacity: 5, basePrice: 65, multiplier: 1.5, pricePerKm: 3.0, pricePerMin: 0.8, minFare: 75, hourlyRate: 85 },
    { id: 'first_class', name: 'First Class', description: 'Mercedes S-Class, BMW 7 Series', capacity: 3, basePrice: 90, multiplier: 2, pricePerKm: 4.0, pricePerMin: 1.2, minFare: 100, hourlyRate: 120 }
  ]);
  const [selectedPois, setSelectedPois] = useState<string[]>([]);
  const [globalSettings, setGlobalSettings] = useState({ normal_price_per_km: 1.5, base_fare: 5.0, price_per_min: 0.5, min_fare: 15.0 });
  const [rideHistory, setRideHistory] = useState<any[]>([]);
  
  // Chat States
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const typingTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);
  const typingTimerRef = React.useRef<NodeJS.Timeout | null>(null);
  const scrollRef = React.useRef<HTMLDivElement>(null);

  const [pickup, setPickup] = useState('Four Seasons Hotel Ritz, Lisbon');
  const [dropoff, setDropoff] = useState('The Yeatman, Porto');
  const [pickupCoords, setPickupCoords] = useState<{lat: number, lon: number} | null>(null);
  const [dropoffCoords, setDropoffCoords] = useState<{lat: number, lon: number} | null>(null);
  const [distance, setDistance] = useState<number | null>(null);
  const [duration, setDuration] = useState<number | null>(null);
  const [poiSearch, setPoiSearch] = useState('');
  const [isRefreshingPois, setIsRefreshingPois] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [pickupSuggestions, setPickupSuggestions] = useState<any[]>([]);
  const [dropoffSuggestions, setDropoffSuggestions] = useState<any[]>([]);
  const addNotification = (message: string, type: 'success' | 'warning' | 'info' | 'error' = 'info') => {
    const id = Date.now().toString();
    setNotifications(prev => [{ id, message, type }, ...prev]);
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id));
    }, 5000);
  };

  const [widgetPickup, setWidgetPickup] = useState('');
  const [widgetDropoff, setWidgetDropoff] = useState('');
  const [widgetDate, setWidgetDate] = useState('');
  const [widgetTime, setWidgetTime] = useState('');
  const [widgetTripType, setWidgetTripType] = useState('one-way');
  const [widgetDuration, setWidgetDuration] = useState('4');
  const [widgetPickupSuggestions, setWidgetPickupSuggestions] = useState<any[]>([]);
  const [widgetDropoffSuggestions, setWidgetDropoffSuggestions] = useState<any[]>([]);

  useEffect(() => {
    const fetchPickup = async () => {
      if (widgetPickup.length < 2) {
        setWidgetPickupSuggestions([]);
        return;
      }
      
      const hardcoded = ADDRESS_SUGGESTIONS
        .filter(s => s.toLowerCase().includes(widgetPickup.toLowerCase()))
        .map(s => ({ display_name: s, isHardcoded: true }));

      if (widgetPickup.length > 2) {
        try {
          const res = await fetch(`/api/maps/autocomplete?input=${encodeURIComponent(widgetPickup)}`);
          if (!res.ok) throw new Error(`Server error: ${res.status}`);
          const data = await res.json();
          const suggestions = (data.predictions || []).map((p: any) => ({
            display_name: p.description,
            place_id: p.place_id,
            isGoogle: true
          }));
          const filteredHardcoded = hardcoded.filter(h => !suggestions.some((s: any) => s.display_name.includes(h.display_name)));
          setWidgetPickupSuggestions([...filteredHardcoded, ...suggestions]);
        } catch (err) {
          setWidgetPickupSuggestions(hardcoded);
        }
      } else {
        setWidgetPickupSuggestions(hardcoded);
      }
    };
    const timeoutId = setTimeout(fetchPickup, 500);
    return () => clearTimeout(timeoutId);
  }, [widgetPickup]);

  useEffect(() => {
    const fetchDropoff = async () => {
      if (widgetDropoff.length < 2) {
        setWidgetDropoffSuggestions([]);
        return;
      }
      
      const hardcoded = ADDRESS_SUGGESTIONS
        .filter(s => s.toLowerCase().includes(widgetDropoff.toLowerCase()))
        .map(s => ({ display_name: s, isHardcoded: true }));

      if (widgetDropoff.length > 2) {
        try {
          const res = await fetch(`/api/maps/autocomplete?input=${encodeURIComponent(widgetDropoff)}`);
          if (!res.ok) throw new Error(`Server error: ${res.status}`);
          const data = await res.json();
          const suggestions = (data.predictions || []).map((p: any) => ({
            display_name: p.description,
            place_id: p.place_id,
            isGoogle: true
          }));
          const filteredHardcoded = hardcoded.filter(h => !suggestions.some((s: any) => s.display_name.includes(h.display_name)));
          setWidgetDropoffSuggestions([...filteredHardcoded, ...suggestions]);
        } catch (err) {
          setWidgetDropoffSuggestions(hardcoded);
        }
      } else {
        setWidgetDropoffSuggestions(hardcoded);
      }
    };
    const timeoutId = setTimeout(fetchDropoff, 500);
    return () => clearTimeout(timeoutId);
  }, [widgetDropoff]);

  const handleSearchRides = () => {
    navigate('/booking', {
      state: {
        pickup: widgetPickup,
        dropoff: widgetDropoff,
        date: widgetDate,
        time: widgetTime,
        tripType: widgetTripType,
        duration: widgetDuration
      }
    });
  };

  const fetchPois = async () => {
    setIsRefreshingPois(true);
    try {
      const snapshot = await getDocs(query(collection(db, 'pois'), where('status', '==', 'Active')));
      setPois(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    } catch (err) {
      handleFirestoreError(err, OperationType.GET, 'pois');
    } finally {
      setIsRefreshingPois(false);
    }
  };
  const MOCK_DRIVERS = [
    { name: 'João Silva', rating: 4.9, trips: 1240, photo: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&q=80&w=150&h=150' },
    { name: 'Miguel Santos', rating: 5.0, trips: 850, photo: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=150&h=150' },
    { name: 'Ricardo Pereira', rating: 4.8, trips: 620, photo: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=150&h=150' }
  ];

  const MOCK_IMAGES = [
    'https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?auto=format&fit=crop&q=80&w=400&h=200',
    'https://images.unsplash.com/photo-1605559424843-9e4c228bf1c2?auto=format&fit=crop&q=80&w=400&h=200',
    'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&q=80&w=400&h=200'
  ];

  const dynamicVehicles = vehicleTypes.map((vt, i) => ({
    id: vt.id,
    name: vt.name === 'Business' ? 'Mercedes S-Class' : vt.name === 'SUV' ? 'Range Rover' : 'Mercedes V-Class',
    type: vt.name,
    capacity: vt.capacity || '3 Pax • 2 Bags',
    basePrice: vt.basePrice || vt.base_price || 0,
    multiplier: vt.multiplier || 1,
    pricePerKm: vt.pricePerKm || 0,
    pricePerMin: vt.pricePerMin || 0,
    minFare: vt.minFare || 0,
    hourlyRate: vt.hourlyRate || 0,
    rating: 4.8 + (Math.random() * 0.2),
    image: MOCK_IMAGES[i % MOCK_IMAGES.length],
    driver: MOCK_DRIVERS[i % MOCK_DRIVERS.length]
  }));

  const vehiclesToDisplay = dynamicVehicles.length > 0 ? dynamicVehicles : [
    {
      id: 'business',
      name: 'Mercedes S-Class',
      type: 'Business',
      capacity: '3 Pax • 2 Bags',
      basePrice: 50,
      multiplier: 1.2,
      rating: 4.9,
      image: 'https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?auto=format&fit=crop&q=80&w=400&h=200',
      driver: MOCK_DRIVERS[0]
    }
  ];

  useEffect(() => {
    if (!user) return;

    // Fetch messages from Firestore
    const messagesQuery = query(
      collection(db, 'chats', user.uid, 'messages'),
      orderBy('createdAt', 'asc')
    );

    const unsubMessages = onSnapshot(messagesQuery, (snapshot) => {
      const msgs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setMessages(msgs);
      setTimeout(() => {
        if (scrollRef.current) {
          scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
      }, 100);
    }, (err) => {
      handleFirestoreError(err, OperationType.GET, `chats/${user.uid}/messages`);
    });

    // Fetch POIs from Firestore
    const poisQuery = query(collection(db, 'pois'), where('status', '==', 'Active'));
    const unsubPois = onSnapshot(poisQuery, (snapshot) => {
      setPois(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, (err) => {
      handleFirestoreError(err, OperationType.GET, 'pois');
    });

    // Fetch Global Settings from Firestore
    const settingsQuery = collection(db, 'settings');
    const unsubSettings = onSnapshot(settingsQuery, (snapshot) => {
      snapshot.docs.forEach(doc => {
        if (doc.id === 'pricing') {
          setGlobalSettings(doc.data().value);
        }
      });
    }, (err) => {
      handleFirestoreError(err, OperationType.GET, 'settings');
    });

    // Fetch Vehicle Types from Firestore
    const vehicleTypesQuery = collection(db, 'vehicle_types');
    const unsubVehicleTypes = onSnapshot(vehicleTypesQuery, (snapshot) => {
      if (!snapshot.empty) {
        setVehicleTypes(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      }
    }, (err) => {
      handleFirestoreError(err, OperationType.GET, 'vehicle_types');
    });

    // Fetch Ride History from Firestore
    const rideHistoryQuery = query(
      collection(db, 'rides'),
      where('passengerId', '==', user.uid)
    );
    const unsubRideHistory = onSnapshot(rideHistoryQuery, (snapshot) => {
      const rides = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      rides.sort((a: any, b: any) => {
        const dateA = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(0);
        const dateB = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(0);
        return dateB.getTime() - dateA.getTime();
      });
      setRideHistory(rides);
    }, (err) => {
      handleFirestoreError(err, OperationType.GET, 'rides');
    });

    return () => {
      unsubMessages();
      unsubPois();
      unsubSettings();
      unsubVehicleTypes();
      unsubRideHistory();
    };
  }, [user, isChatOpen]);

  const togglePoi = (poiId: string) => {
    setSelectedPois(prev => 
      prev.includes(poiId) ? prev.filter(id => id !== poiId) : [...prev, poiId]
    );
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !newMessage.trim()) return;

    try {
      await addDoc(collection(db, 'chats', user.uid, 'messages'), {
        senderId: user.uid,
        senderName: user.displayName || 'Passenger',
        text: newMessage,
        createdAt: Timestamp.now(),
      });
      setNewMessage('');
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `chats/${user.uid}/messages`);
    }
  };

  const handleTyping = async (typing: boolean) => {
    if (user) {
      try {
        const typingRef = doc(db, 'typing', user.uid);
        await setDoc(typingRef, {
          [user.uid]: typing,
          updatedAt: serverTimestamp()
        }, { merge: true });
      } catch (err) {
        // Silent error for typing
      }
    }
  };

  const onInputChange = (val: string) => {
    setNewMessage(val);
    handleTyping(true);
    
    if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
    typingTimerRef.current = setTimeout(() => {
      handleTyping(false);
    }, 2000);
  };

  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371; // km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  const calculateRoute = async (pCoords: {lat: number, lon: number}, dCoords: {lat: number, lon: number}) => {
    setIsGeocoding(true);
    console.log('Calculating route from', pCoords, 'to', dCoords);
    try {
      const res = await fetch(`/api/maps/distance?origins=${pCoords.lat},${pCoords.lon}&destinations=${dCoords.lat},${dCoords.lon}`);
      const data = await res.json();
      console.log('Google Distance Matrix response:', data);
      
      if (data.rows && data.rows[0] && data.rows[0].elements && data.rows[0].elements[0]) {
        const element = data.rows[0].elements[0];
        if (element.status === 'OK') {
          const distKm = element.distance.value / 1000;
          const durMin = element.duration.value / 60;
          console.log('Route calculated (Google):', distKm, 'km,', durMin, 'mins');
          setDistance(distKm);
          setDuration(durMin);
          setIsGeocoding(false);
          return { distance: distKm, duration: durMin };
        } else {
          console.warn('Google Distance Matrix element status:', element.status);
        }
      }
      
      console.log('Falling back to OSRM...');
      // Fallback to OSRM
      const osrmRes = await fetch(`/api/osrm/route?coordinates=${pCoords.lon},${pCoords.lat};${dCoords.lon},${dCoords.lat}`);
      if (!osrmRes.ok) throw new Error(`OSRM error: ${osrmRes.status}`);
      const osrmData = await osrmRes.json();
      console.log('OSRM response:', osrmData);
      if (osrmData.routes && osrmData.routes[0]) {
        const route = osrmData.routes[0];
        const distKm = route.distance / 1000;
        const durMin = route.duration / 60;
        console.log('Route calculated (OSRM):', distKm, 'km,', durMin, 'mins');
        setDistance(distKm);
        setDuration(durMin);
        setIsGeocoding(false);
        return { distance: distKm, duration: durMin };
      }
    } catch (err) {
      console.error('Error fetching route:', err);
      // Fallback to Haversine
      const dist = calculateDistance(pCoords.lat, pCoords.lon, dCoords.lat, dCoords.lon);
      const dur = dist * 2 + 5;
      console.log('Route calculated (Haversine):', dist, 'km,', dur, 'mins');
      setDistance(dist);
      setDuration(dur);
      setIsGeocoding(false);
      return { distance: dist, duration: dur };
    }
    console.warn('Route calculation failed all methods');
    setIsGeocoding(false);
    return null;
  };

  useEffect(() => {
    if (pickupCoords && dropoffCoords) {
      calculateRoute(pickupCoords, dropoffCoords);
    }
  }, [pickupCoords, dropoffCoords]);

  const selectedVehicle = vehiclesToDisplay[selectedVehicleIdx];
  
  // Dynamic Price Calculation
  const estimatedDistance = distance || 0; 
  const estimatedTime = duration || 0; // minutes
  
  const calculateBaseFare = () => {
    const base = Number(selectedVehicle?.basePrice) || 0;
    const kmPrice = (Number(selectedVehicle?.pricePerKm) || globalSettings.normal_price_per_km) * estimatedDistance;
    const minPrice = (Number(selectedVehicle?.pricePerMin) || globalSettings.price_per_min) * estimatedTime;
    
    let total = (base + kmPrice + minPrice) * (Number(selectedVehicle?.multiplier) || 1);
    const minFare = Number(selectedVehicle?.minFare) || globalSettings.min_fare;
    
    return Math.max(total, minFare);
  };

  const baseRidePrice = calculateBaseFare();
  
  const poiCost = selectedPois.reduce((sum, id) => {
    const poi = pois.find(p => p.id === id);
    const price = poi ? (tripType === 'experience' ? parseFloat(poi.tour_price) : parseFloat(poi.price)) : 0;
    return sum + price;
  }, 0);

  const totalPrice = Math.round((baseRidePrice + poiCost) * 1.23); // Add 23% IVA

  const handleNextVehicle = () => {
    setSelectedVehicleIdx((prev) => (prev + 1) % vehiclesToDisplay.length);
  };

  const handlePrevVehicle = () => {
    setSelectedVehicleIdx((prev) => (prev - 1 + vehiclesToDisplay.length) % vehiclesToDisplay.length);
  };

  const handleConfirmBooking = async () => {
    if (!user) {
      navigate('/login');
      return;
    }

    setBookingStatus('booking');
    setIsGeocoding(true);
    
    try {
      // Geocode pickup if missing
      let currentPickupCoords = pickupCoords;
      if (!currentPickupCoords) {
        if (ADDRESS_COORDS[pickup]) {
          currentPickupCoords = ADDRESS_COORDS[pickup];
          setPickupCoords(currentPickupCoords);
        } else {
          const res = await fetch(`/api/maps/geocode?address=${encodeURIComponent(pickup)}`);
          const data = await res.json();
          if (data.results && data.results[0]) {
            currentPickupCoords = { 
              lat: data.results[0].geometry.location.lat, 
              lon: data.results[0].geometry.location.lng 
            };
            setPickupCoords(currentPickupCoords);
          } else {
            // Fallback to Nominatim
            const nomRes = await fetch(`/api/nominatim/search?q=${encodeURIComponent(pickup)}`);
            if (!nomRes.ok) throw new Error(`Nominatim error: ${nomRes.status}`);
            const nomData = await nomRes.json();
            if (nomData && nomData[0]) {
              currentPickupCoords = { lat: parseFloat(nomData[0].lat), lon: parseFloat(nomData[0].lon) };
              setPickupCoords(currentPickupCoords);
            }
          }
        }
      }

      // Geocode dropoff if missing
      let currentDropoffCoords = dropoffCoords;
      if (!currentDropoffCoords) {
        if (ADDRESS_COORDS[dropoff]) {
          currentDropoffCoords = ADDRESS_COORDS[dropoff];
          setDropoffCoords(currentDropoffCoords);
        } else {
          const res = await fetch(`/api/maps/geocode?address=${encodeURIComponent(dropoff)}`);
          const data = await res.json();
          if (data.results && data.results[0]) {
            currentDropoffCoords = { 
              lat: data.results[0].geometry.location.lat, 
              lon: data.results[0].geometry.location.lng 
            };
            setDropoffCoords(currentDropoffCoords);
          } else {
            // Fallback to Nominatim
            const nomRes = await fetch(`/api/nominatim/search?q=${encodeURIComponent(dropoff)}`);
            if (!nomRes.ok) throw new Error(`Nominatim error: ${nomRes.status}`);
            const nomData = await nomRes.json();
            if (nomData && nomData[0]) {
              currentDropoffCoords = { lat: parseFloat(nomData[0].lat), lon: parseFloat(nomData[0].lon) };
              setDropoffCoords(currentDropoffCoords);
            }
          }
        }
      }

      if (!currentPickupCoords || !currentDropoffCoords) {
        throw new Error('Could not find coordinates for the selected addresses. Please try a more specific address or select from the suggestions.');
      }

      setIsGeocoding(false);

      // Recalculate distance and duration using OSRM
      let finalDistance = distance;
      let finalDuration = duration;
      
      const routeData = await calculateRoute(currentPickupCoords, currentDropoffCoords);
      if (routeData) {
        finalDistance = routeData.distance;
        finalDuration = routeData.duration;
      }

      if (!finalDistance || !finalDuration) {
        throw new Error('Could not calculate distance and time for the selected route.');
      }

      // Recalculate price with final distance/duration
      const calculateFinalBaseFare = () => {
        const base = Number(selectedVehicle?.basePrice) || 0;
        const kmPrice = (Number(selectedVehicle?.pricePerKm) || globalSettings.normal_price_per_km) * finalDistance;
        const minPrice = (Number(selectedVehicle?.pricePerMin) || globalSettings.price_per_min) * finalDuration;
        
        let total = (base + kmPrice + minPrice) * (Number(selectedVehicle?.multiplier) || 1);
        const minFare = Number(selectedVehicle?.minFare) || globalSettings.min_fare;
        
        return Math.max(total, minFare);
      };

      const finalBaseRidePrice = calculateFinalBaseFare();
      const finalTotalPrice = Math.round((finalBaseRidePrice + poiCost) * 1.23);

      await addDoc(collection(db, 'rides'), {
        passengerId: user.uid,
        passengerName: user.displayName,
        pickupLocation: pickup,
        dropoffLocation: dropoff,
        rideType: selectedVehicle.type,
        vehicleName: selectedVehicle.name,
        price: finalTotalPrice,
        preferences: {
          silentMode,
          temperature: temperature[0],
          playlist: selectedPlaylist,
          selectedPois,
          tripType
        },
        status: 'requested',
        createdAt: serverTimestamp(),
      });
      setBookingStatus('success');
      setIsBookingModalOpen(false);
    } catch (error) {
      console.error('Error booking ride:', error);
      setBookingStatus('error');
    }
  };

  const [isGeocoding, setIsGeocoding] = useState(false);

  const ADDRESS_COORDS: Record<string, {lat: number, lon: number}> = {
    'Rua Ilha de Santa Maria 4, 2840-426, Seixal': { lat: 38.627, lon: -9.102 },
    'Rua Ilha de Santa Maria, Seixal': { lat: 38.627, lon: -9.102 },
    'Colombo Shopping Centre, Lisbon': { lat: 38.755, lon: -9.189 },
    'Vasco da Gama Shopping, Lisbon': { lat: 38.767, lon: -9.097 },
    'Amoreiras Shopping Center, Lisbon': { lat: 38.723, lon: -9.162 },
    'CascaiShopping, Cascais': { lat: 38.721, lon: -9.398 },
    'NorteShopping, Porto': { lat: 41.180, lon: -8.654 },
    'Arrábida Shopping, Vila Nova de Gaia': { lat: 41.140, lon: -8.638 },
    '2840-426, Seixal': { lat: 38.627, lon: -9.102 },
    'Lisbon Airport (LIS), Lisbon': { lat: 38.774, lon: -9.134 },
    'Lisbon Airport': { lat: 38.774, lon: -9.134 },
    'Porto Airport (OPO), Porto': { lat: 41.242, lon: -8.678 },
    'Four Seasons Hotel Ritz, Lisbon': { lat: 38.725, lon: -9.155 },
    'The Yeatman, Porto': { lat: 41.133, lon: -8.613 },
    'Sintra National Palace, Sintra': { lat: 38.797, lon: -9.390 },
    'Cascais Marina, Cascais': { lat: 38.691, lon: -9.419 },
    'Algarve Luxury Resort, Faro': { lat: 37.017, lon: -7.930 }
  };

  const ADDRESS_SUGGESTIONS = [
    'Four Seasons Hotel Ritz, Lisbon', 'The Yeatman, Porto', 'Sintra National Palace, Sintra', 'Cascais Marina, Cascais', 'Algarve Luxury Resort, Faro', 'Lisbon Airport (LIS), Lisbon', 'Porto Airport (OPO), Porto', 'Avenida da Liberdade, Lisbon', 'Ribeira District, Porto', 'Torre de Belém, Lisbon', 'Benagil Cave, Algarve', 'University of Coimbra, Coimbra', 'Évora Roman Temple, Évora', 'Fatima Sanctuary, Fatima', 'Óbidos Medieval Village, Óbidos',
    'Eiffel Tower, Paris', 'Louvre Museum, Paris', 'Mont Saint-Michel, Normandy', 'Palace of Versailles, Versailles', 'Promenade des Anglais, Nice', 'Carcassonne Fortress, Carcassonne', 'Chamonix-Mont-Blanc, Alps', 'Verdon Gorge, Provence', 'Notre-Dame de Paris, Paris', 'Arc de Triomphe, Paris', 'Sacré-Cœur, Paris', 'Musée d\'Orsay, Paris',
    'Sagrada Família, Barcelona', 'Alhambra, Granada', 'Prado Museum, Madrid', 'Seville Cathedral, Seville', 'Park Güell, Barcelona', 'Guggenheim Museum, Bilbao', 'Santiago de Compostela Cathedral, Galicia', 'Toledo Old City, Toledo',
    'Rua Augusta, Lisbon', 'Chiado, Lisbon', 'Alfama, Lisbon', 'Bairro Alto, Lisbon', 'Belém, Lisbon', 'Parque das Nações, Lisbon', 'Cais do Sodré, Lisbon', 'Principe Real, Lisbon', 'Rua Garrett, Lisbon', 'Rua do Ouro, Lisbon', 'Rua da Prata, Lisbon', 'Avenida de Roma, Lisbon', 'Avenida Almirante Reis, Lisbon',
    'Rua Ilha de Santa Maria 4, 2840-426, Seixal', 'Rua Ilha de Santa Maria, Seixal', 'Colombo Shopping Centre, Lisbon', 'Vasco da Gama Shopping, Lisbon', 'Amoreiras Shopping Center, Lisbon', 'CascaiShopping, Cascais', 'NorteShopping, Porto', 'Arrábida Shopping, Vila Nova de Gaia', '2840-426, Seixal', 'Lisbon Airport',
    'Rua de Santa Catarina, Porto', 'Rua das Flores, Porto', 'Avenida dos Aliados, Porto', 'Foz do Douro, Porto', 'Vila Nova de Gaia, Porto', 'Matosinhos, Porto', 'Boavista, Porto', 'Campanhã, Porto', 'Cedofeita, Porto',
    'Vilamoura, Algarve', 'Albufeira, Algarve', 'Lagos, Algarve', 'Tavira, Algarve', 'Portimão, Algarve', 'Sagres, Algarve', 'Quarteira, Algarve', 'Vale do Lobo, Algarve'
  ];

  const handlePickupChange = (val: string) => {
    setPickup(val);
  };

  const handleDropoffChange = (val: string) => {
    setDropoff(val);
  };

  useEffect(() => {
    const fetchPickup = async () => {
      if (pickup.length > 2) {
        try {
          const res = await fetch(`/api/maps/autocomplete?input=${encodeURIComponent(pickup)}`);
          if (!res.ok) throw new Error(`Server error: ${res.status}`);
          const data = await res.json();
          const suggestions = (data.predictions || []).map((p: any) => ({
            display_name: p.description,
            place_id: p.place_id,
            isGoogle: true
          }));
          setPickupSuggestions(suggestions);
        } catch (err) {
          console.error('Error fetching suggestions:', err);
        }
      } else {
        setPickupSuggestions([]);
      }
    };
    const timeoutId = setTimeout(fetchPickup, 500);
    return () => clearTimeout(timeoutId);
  }, [pickup]);

  useEffect(() => {
    const fetchDropoff = async () => {
      if (dropoff.length > 2) {
        try {
          const res = await fetch(`/api/maps/autocomplete?input=${encodeURIComponent(dropoff)}`);
          if (!res.ok) throw new Error(`Server error: ${res.status}`);
          const data = await res.json();
          const suggestions = (data.predictions || []).map((p: any) => ({
            display_name: p.description,
            place_id: p.place_id,
            isGoogle: true
          }));
          setDropoffSuggestions(suggestions);
        } catch (err) {
          console.error('Error fetching suggestions:', err);
        }
      } else {
        setDropoffSuggestions([]);
      }
    };
    const timeoutId = setTimeout(fetchDropoff, 500);
    return () => clearTimeout(timeoutId);
  }, [dropoff]);

  const BookingConfirmationModal = () => (
    <Dialog open={isBookingModalOpen} onOpenChange={setIsBookingModalOpen}>
      <DialogContent className="sm:max-w-[500px] p-0 overflow-hidden border-none shadow-2xl">
        <div className="bg-pex-blue p-6 text-white">
          <DialogHeader>
            <DialogTitle className="text-2xl font-light tracking-wide text-white">Confirm Your Journey</DialogTitle>
            <DialogDescription className="text-white/70">
              Please review your booking details and select a payment method.
            </DialogDescription>
          </DialogHeader>
        </div>
        
        <div className="p-6 space-y-6 bg-white">
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="mt-1 p-2 bg-pex-blue/10 rounded-full">
                <MapPin size={18} className="text-pex-blue" />
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-widest text-gray-400 font-bold">Pickup</p>
                <p className="text-sm font-medium text-pex-blue">{pickup}</p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <div className="mt-1 p-2 bg-pex-gold/10 rounded-full">
                <MapPin size={18} className="text-pex-gold" />
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-widest text-gray-400 font-bold">Dropoff</p>
                <p className="text-sm font-medium text-pex-blue">{dropoff}</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 py-4 border-y border-gray-100">
            <div>
              <p className="text-[10px] uppercase tracking-widest text-gray-400 font-bold">Vehicle</p>
              <p className="text-sm font-bold text-pex-blue">{selectedVehicle?.name}</p>
              <p className="text-[10px] text-gray-500">{selectedVehicle?.type}</p>
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-widest text-gray-400 font-bold">Chauffeur</p>
              <p className="text-sm font-bold text-pex-blue">{selectedVehicle?.driver.name}</p>
              <div className="flex items-center gap-1 text-[10px] text-gray-500">
                <Star size={10} className="fill-pex-gold text-pex-gold" />
                <span>{selectedVehicle?.driver.rating}</span>
              </div>
            </div>
          </div>

          <div className="bg-gray-50 p-4 rounded-xl space-y-3">
            <p className="text-[10px] uppercase tracking-widest text-gray-400 font-bold">In-Car Preferences</p>
            <div className="grid grid-cols-3 gap-2">
              <div className="flex flex-col items-center gap-1 p-2 bg-white rounded-lg border border-gray-100">
                <VolumeX size={14} className={silentMode ? 'text-pex-gold' : 'text-gray-300'} />
                <span className="text-[9px] font-bold">{silentMode ? 'Silent' : 'Normal'}</span>
              </div>
              <div className="flex flex-col items-center gap-1 p-2 bg-white rounded-lg border border-gray-100">
                <Thermometer size={14} className="text-pex-gold" />
                <span className="text-[9px] font-bold">{temperature}°C</span>
              </div>
              <div className="flex flex-col items-center gap-1 p-2 bg-white rounded-lg border border-gray-100">
                <Music size={14} className="text-pex-gold" />
                <span className="text-[9px] font-bold truncate w-full text-center">{selectedPlaylist}</span>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <p className="text-[10px] uppercase tracking-widest text-gray-400 font-bold">Payment Method</p>
            <div className="grid grid-cols-2 gap-3">
              <Button 
                variant="outline" 
                className="h-16 flex flex-col gap-1 border-2 border-pex-blue/10 hover:border-pex-blue/30 hover:bg-pex-blue/5"
                onClick={() => handleConfirmBooking()}
              >
                <CreditCard size={20} className="text-pex-blue" />
                <span className="text-[10px] font-bold">Credit Card</span>
              </Button>
              <Button 
                variant="outline" 
                className="h-16 flex flex-col gap-1 border-2 border-pex-gold/20 hover:border-pex-gold/40 hover:bg-pex-gold/5"
                onClick={() => {
                  addNotification('Redirecting to Viva.com...', 'info');
                  setTimeout(handleConfirmBooking, 1500);
                }}
              >
                <div className="flex items-center gap-1">
                  <span className="text-xs font-black italic text-pex-blue">viva</span>
                  <span className="text-xs font-black italic text-pex-gold">.com</span>
                </div>
                <span className="text-[10px] font-bold">Checkout</span>
              </Button>
            </div>
          </div>

          <div className="bg-gray-50 p-4 rounded-xl space-y-2">
            <div className="flex justify-between items-center text-xs text-gray-500">
              <span>Base Fare</span>
              <span>€{(Number(selectedVehicle?.basePrice || 0) * (Number(selectedVehicle?.multiplier) || 1)).toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center text-xs text-gray-500">
              <span>Distance ({estimatedDistance.toFixed(1)} km)</span>
              <span>€{(estimatedDistance * (Number(selectedVehicle?.pricePerKm) || globalSettings.normal_price_per_km) * (Number(selectedVehicle?.multiplier) || 1)).toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center text-xs text-gray-500">
              <span>Time ({estimatedTime.toFixed(0)} min)</span>
              <span>€{(estimatedTime * (Number(selectedVehicle?.pricePerMin) || globalSettings.price_per_min) * (Number(selectedVehicle?.multiplier) || 1)).toFixed(2)}</span>
            </div>
            {poiCost > 0 && (
              <div className="flex justify-between items-center text-xs text-gray-500">
                <span>Experiences / POIs</span>
                <span>€{poiCost.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between items-center text-sm pt-2 border-t border-gray-100">
              <span className="text-gray-500">Subtotal</span>
              <span className="font-medium text-pex-blue">€{(Number(totalPrice) / 1.23).toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-500">IVA (23%)</span>
              <span className="font-medium text-pex-blue">€{(Number(totalPrice) - (Number(totalPrice) / 1.23)).toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center pt-2 border-t border-gray-200">
              <span className="text-gray-700 font-bold">Total Amount</span>
              <span className="text-2xl font-bold text-pex-blue">€{totalPrice}</span>
            </div>
          </div>
        </div>

        <DialogFooter className="p-6 bg-gray-50 border-t border-gray-100 sm:justify-between items-center gap-4">
          <Button variant="ghost" onClick={() => setIsBookingModalOpen(false)} className="text-gray-500">Cancel</Button>
          <Button 
            className="bg-pex-blue hover:bg-pex-blue/90 text-white px-8 font-bold" 
            onClick={handleConfirmBooking}
            disabled={bookingStatus === 'booking'}
          >
            {bookingStatus === 'booking' ? 'Processing...' : 'Confirm Booking'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );

  if (bookingStatus === 'success') {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-50 p-6">
        <motion.div 
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="max-w-md w-full bg-white p-8 rounded-2xl shadow-2xl text-center space-y-6"
        >
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto">
            <CheckCircle2 size={40} className="text-green-600" />
          </div>
          <h2 className="text-3xl font-bold text-pex-blue">Booking Confirmed!</h2>
          <p className="text-gray-600">Your chauffeur is being assigned. You will receive a notification shortly.</p>
          <div className="bg-gray-50 p-4 rounded-xl text-left space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Booking ID</span>
              <span className="font-mono font-bold">PEX-{Math.random().toString(36).substr(2, 9).toUpperCase()}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Vehicle</span>
              <span className="font-bold">{selectedVehicle?.name}</span>
            </div>
          </div>
          <Button 
            className="w-full bg-pex-blue hover:bg-pex-blue/90 text-white"
            onClick={() => {
              setBookingStatus('idle');
              setShowSummary(false);
            }}
          >
            Done
          </Button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-white overflow-x-hidden">
      {/* Test comment */}
      {/* Premium Hero Section with Booking Widget */}
      <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden bg-pex-blue pt-20">
        <div className="absolute inset-0 z-0">
          <motion.div 
            initial={{ scale: 1.05, opacity: 0 }}
            animate={{ scale: 1, opacity: 0.8 }}
            transition={{ duration: 1.5 }}
            className="w-full h-full"
          >
            <img 
              src="https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?auto=format&fit=crop&q=80&w=2000" 
              alt="Luxury Car" 
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
          </motion.div>
          <div className="absolute inset-0 bg-gradient-to-t from-pex-blue/80 via-pex-blue/20 to-transparent" />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-6 w-full grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          
          {/* Left Side: Text */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="lg:col-span-7 space-y-6 hidden md:block"
          >
            <h1 className="text-5xl md:text-7xl font-light text-white leading-[1.1] tracking-tight">
              Your Premium <br />
              <span className="font-serif italic text-pex-gold">Chauffeur Service</span>
            </h1>
            <p className="text-xl text-white/80 font-light max-w-lg">
              Experience the pinnacle of private transportation. Safety, comfort, and punctuality across Portugal's most exclusive destinations.
            </p>
          </motion.div>

          {/* Right Side: Booking Widget (Blacklane Style) */}
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.8 }}
            className="lg:col-span-5 w-full"
          >
            <Card className="bg-white rounded-2xl shadow-2xl border-0 overflow-hidden">
              <div className="flex border-b border-gray-100">
                <button 
                  className={`flex-1 py-4 text-sm font-bold transition-colors ${widgetTripType === 'one-way' ? 'text-pex-blue border-b-2 border-pex-gold' : 'text-gray-500 hover:text-gray-700'}`}
                  onClick={() => setWidgetTripType('one-way')}
                >
                  ONE WAY
                </button>
                <button 
                  className={`flex-1 py-4 text-sm font-bold transition-colors ${widgetTripType === 'hourly' ? 'text-pex-blue border-b-2 border-pex-gold' : 'text-gray-500 hover:text-gray-700'}`}
                  onClick={() => setWidgetTripType('hourly')}
                >
                  BY THE HOUR
                </button>
              </div>
              
              <CardContent className="p-6 space-y-4">
                <div className="relative space-y-4">
                  {/* Timeline line */}
                  <div className="absolute left-3.5 top-5 bottom-5 w-0.5 bg-gray-200 z-0"></div>
                  
                  <div className="relative z-10 flex items-center gap-3">
                    <div className="w-7 h-7 rounded-full bg-pex-blue/10 flex items-center justify-center flex-shrink-0">
                      <div className="w-2 h-2 rounded-full bg-pex-blue"></div>
                    </div>
                    <div className="flex-1 relative">
                      <Input 
                        placeholder="Pick-up location" 
                        className="h-12 bg-white border-gray-200 focus-visible:ring-pex-gold text-gray-900 text-base"
                        value={widgetPickup}
                        onChange={(e) => setWidgetPickup(e.target.value)}
                      />
                      <AnimatePresence>
                        {widgetPickupSuggestions.length > 0 && (
                          <motion.div 
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="absolute z-[100] w-full mt-1 bg-white border border-gray-100 rounded-lg shadow-xl overflow-hidden"
                          >
                            {widgetPickupSuggestions.map((s, i) => (
                              <button 
                                key={i}
                                className="w-full text-left px-4 py-3 text-sm hover:bg-gray-50 transition-colors border-b border-gray-50 last:border-none text-gray-900"
                                onClick={() => {
                                  setWidgetPickup(s.display_name);
                                  setWidgetPickupSuggestions([]);
                                }}
                              >
                                {s.display_name}
                              </button>
                            ))}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>

                  {widgetTripType === 'one-way' ? (
                    <div className="relative z-10 flex items-center gap-3">
                      <div className="w-7 h-7 rounded-full bg-pex-gold/10 flex items-center justify-center flex-shrink-0">
                        <MapPin size={14} className="text-pex-gold" />
                      </div>
                      <div className="flex-1 relative">
                        <Input 
                          placeholder="Drop-off location" 
                          className="h-12 bg-white border-gray-200 focus-visible:ring-pex-gold text-gray-900 text-base"
                          value={widgetDropoff}
                          onChange={(e) => setWidgetDropoff(e.target.value)}
                        />
                        <AnimatePresence>
                          {widgetDropoffSuggestions.length > 0 && (
                            <motion.div 
                              initial={{ opacity: 0, y: -10 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: -10 }}
                              className="absolute z-[100] w-full mt-1 bg-white border border-gray-100 rounded-lg shadow-xl overflow-hidden"
                            >
                              {widgetDropoffSuggestions.map((s, i) => (
                                <button 
                                  key={i}
                                  className="w-full text-left px-4 py-3 text-sm hover:bg-gray-50 transition-colors border-b border-gray-50 last:border-none text-gray-900"
                                  onClick={() => {
                                    setWidgetDropoff(s.display_name);
                                    setWidgetDropoffSuggestions([]);
                                  }}
                                >
                                  {s.display_name}
                                </button>
                              ))}
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    </div>
                  ) : (
                    <div className="relative z-10 flex items-center gap-3">
                      <div className="w-7 h-7 rounded-full bg-pex-gold/10 flex items-center justify-center flex-shrink-0">
                        <Clock size={14} className="text-pex-gold" />
                      </div>
                      <select 
                        className="flex h-12 w-full items-center justify-between rounded-md border border-gray-200 bg-white px-3 py-2 text-base text-gray-900 ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-pex-gold disabled:cursor-not-allowed disabled:opacity-50"
                        value={widgetDuration}
                        onChange={(e) => setWidgetDuration(e.target.value)}
                      >
                        {[2, 3, 4, 5, 6, 8, 10, 12, 24].map(h => (
                          <option key={h} value={h}>{h} hours</option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4 pt-2">
                  <div className="space-y-1.5">
                    <Label className="text-xs text-gray-500 font-semibold uppercase tracking-wider">Date</Label>
                    <Input 
                      type="date" 
                      className="h-12 bg-white border-gray-200 focus-visible:ring-pex-gold text-gray-900"
                      value={widgetDate}
                      onChange={(e) => setWidgetDate(e.target.value)}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs text-gray-500 font-semibold uppercase tracking-wider">Time</Label>
                    <Input 
                      type="time" 
                      className="h-12 bg-white border-gray-200 focus-visible:ring-pex-gold text-gray-900"
                      value={widgetTime}
                      onChange={(e) => setWidgetTime(e.target.value)}
                    />
                  </div>
                </div>

                <Button 
                  className="w-full h-14 mt-4 bg-pex-blue hover:bg-pex-blue/90 text-white text-lg font-bold rounded-xl"
                  onClick={handleSearchRides}
                >
                  Search Rides
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features-section" className="py-24 bg-white">
            <div className="max-w-7xl mx-auto px-6">
              <div className="text-center max-w-3xl mx-auto mb-20">
                <h2 className="text-4xl font-light text-pex-blue mb-6">Uncompromising Standards</h2>
                <p className="text-gray-500 leading-relaxed">We redefine the art of travel through meticulous attention to detail and a commitment to excellence that goes beyond transportation.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
                {[
                  { icon: Shield, title: 'Safety First', desc: 'Our chauffeurs undergo rigorous background checks and advanced driving training.' },
                  { icon: Globe, title: 'Global Reach', desc: 'Seamless coordination across major European cities with local expertise.' },
                  { icon: Award, title: 'Premium Fleet', desc: 'Only the latest models of Mercedes-Benz and Range Rover, maintained to perfection.' }
                ].map((feature, i) => (
                  <motion.div 
                    key={i}
                    whileHover={{ y: -10 }}
                    className="p-8 rounded-3xl bg-gray-50 border border-gray-100 space-y-4"
                  >
                    <div className="w-14 h-14 bg-pex-gold/10 rounded-2xl flex items-center justify-center">
                      <feature.icon className="text-pex-gold" size={28} />
                    </div>
                    <h3 className="text-xl font-bold text-pex-blue">{feature.title}</h3>
                    <p className="text-gray-500 leading-relaxed text-sm">{feature.desc}</p>
                  </motion.div>
                ))}
              </div>
            </div>
          </section>

          {/* Premium Fleet Gallery */}
          <section className="py-24 bg-gray-50 overflow-hidden">
            <div className="max-w-7xl mx-auto px-6">
              <div className="flex flex-col md:flex-row justify-between items-end mb-16 gap-8">
                <div className="max-w-2xl">
                  <Badge className="bg-pex-gold/10 text-pex-gold border-none mb-4">The Collection</Badge>
                  <h2 className="text-4xl md:text-5xl font-light text-pex-blue">A Fleet Beyond <span className="italic font-serif">Comparison</span></h2>
                </div>
                <p className="text-gray-500 max-w-sm text-right hidden md:block">Every vehicle in our collection is selected for its uncompromising comfort and technological sophistication.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  { name: 'Mercedes S-Class', type: 'Business Elite', img: 'https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?auto=format&fit=crop&q=80&w=800' },
                  { name: 'Range Rover Vogue', type: 'Luxury SUV', img: 'https://images.unsplash.com/photo-1605559424843-9e4c228bf1c2?auto=format&fit=crop&q=80&w=800' },
                  { name: 'Mercedes V-Class', type: 'Executive Van', img: 'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&q=80&w=800' },
                  { name: 'Bentley Flying Spur', type: 'Ultra Luxury', img: 'https://images.unsplash.com/photo-1580273916550-e323be2ae537?auto=format&fit=crop&q=80&w=800' }
                ].map((car, i) => (
                  <motion.div 
                    key={i}
                    whileHover={{ scale: 1.02 }}
                    className="group relative aspect-[4/5] overflow-hidden rounded-3xl bg-pex-blue"
                  >
                    <img 
                      src={car.img} 
                      alt={car.name} 
                      className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-all duration-700"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-pex-blue via-transparent to-transparent opacity-60" />
                    <div className="absolute bottom-0 left-0 p-8 w-full">
                      <p className="text-pex-gold text-[10px] uppercase tracking-widest font-bold mb-2">{car.type}</p>
                      <h3 className="text-white text-xl font-light">{car.name}</h3>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </section>

          {/* Concierge Section */}
          <section className="py-24 bg-pex-blue relative overflow-hidden">
            <div className="absolute top-0 right-0 w-1/2 h-full opacity-10 pointer-events-none">
              <svg viewBox="0 0 100 100" className="w-full h-full">
                <path d="M0,50 Q25,0 50,50 T100,50" fill="none" stroke="white" strokeWidth="0.1" />
                <path d="M0,60 Q25,10 50,60 T100,60" fill="none" stroke="white" strokeWidth="0.1" />
              </svg>
            </div>
            
            <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-24 items-center">
              <div className="space-y-8">
                <Badge className="bg-white/10 text-white border-white/20">Personalized Service</Badge>
                <h2 className="text-4xl md:text-6xl font-light text-white leading-tight">Your Personal <span className="italic font-serif text-pex-gold">Concierge</span> on Wheels</h2>
                <p className="text-white/60 text-lg leading-relaxed">
                  Our service extends far beyond the drive. From restaurant reservations to event access, our chauffeurs act as your local experts, ensuring every detail of your stay is perfect.
                </p>
                <div className="space-y-4">
                  {[
                    'Multi-lingual professional chauffeurs',
                    'Real-time flight and traffic monitoring',
                    'Customized in-car amenities',
                    'Seamless corporate account management'
                  ].map((item, i) => (
                    <div key={i} className="flex items-center gap-3 text-white/80">
                      <CheckCircle2 className="text-pex-gold" size={20} />
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="relative">
                <div className="aspect-square rounded-full border border-white/10 p-12 flex items-center justify-center">
                  <div className="aspect-square rounded-full border border-white/20 p-12 flex items-center justify-center">
                    <motion.div 
                      animate={{ rotate: 360 }}
                      transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                      className="w-full h-full rounded-full border-t-2 border-pex-gold"
                    />
                  </div>
                </div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <p className="text-5xl font-light text-white mb-2">24/7</p>
                    <p className="text-pex-gold text-xs uppercase tracking-[0.3em] font-bold">Availability</p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Testimonials */}
          <section className="py-24 bg-white">
            <div className="max-w-7xl mx-auto px-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
                <div className="space-y-6">
                  <h2 className="text-4xl font-light text-pex-blue">What Our <span className="italic font-serif">Elite</span> Clients Say</h2>
                  <div className="space-y-8">
                    {[
                      { name: 'Alexander V.', role: 'CEO, Tech Ventures', text: 'The level of professionalism and attention to detail is unmatched. Passageiro Express is my only choice in Portugal.' },
                      { name: 'Elena R.', role: 'Fashion Consultant', text: 'Impeccable service. The chauffeurs are discreet, knowledgeable, and the cars are always in pristine condition.' }
                    ].map((t, i) => (
                      <div key={i} className="space-y-4">
                        <p className="text-xl text-gray-600 italic font-serif">"{t.text}"</p>
                        <div>
                          <p className="font-bold text-pex-blue">{t.name}</p>
                          <p className="text-xs text-gray-400 uppercase tracking-widest">{t.role}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="relative aspect-video rounded-3xl overflow-hidden shadow-2xl">
                  <img 
                    src="https://images.unsplash.com/photo-1517457373958-b7bdd4587205?auto=format&fit=crop&q=80&w=1200" 
                    alt="Luxury Event" 
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute inset-0 bg-pex-blue/20" />
                </div>
              </div>
            </div>
          </section>

      {/* Booking section removed */}

      {/* Chat Widget */}
      <div className="fixed bottom-6 right-6 z-50">
        <AnimatePresence>
          {isChatOpen && (
            <motion.div initial={{ opacity: 0, y: 20, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 20, scale: 0.95 }} className="absolute bottom-16 right-0 w-80 h-96 bg-white rounded-2xl shadow-2xl border border-gray-100 flex flex-col overflow-hidden">
              <div className="p-4 bg-pex-blue text-white flex justify-between items-center">
                <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" /><span className="font-medium">Support</span></div>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-white hover:bg-white/10" onClick={() => setIsChatOpen(false)}><X size={18} /></Button>
              </div>
              <ScrollArea className="flex-1 p-4" ref={scrollRef}>
                <div className="space-y-4">
                  {messages.map((m, i) => (
                    <div key={i} className={`flex ${m.sender_id === user?.uid ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[80%] p-3 rounded-2xl text-sm ${m.sender_id === user?.uid ? 'bg-pex-blue text-white rounded-tr-none' : 'bg-gray-100 text-gray-800 rounded-tl-none'}`}>
                        {m.text}
                        <div className={`text-[9px] mt-1 opacity-50 flex items-center gap-1 ${m.sender_id === user?.uid ? 'justify-end' : 'justify-start'}`}>
                          {new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          {m.sender_id === user?.uid && m.read_at && <CheckCircle2 size={8} />}
                        </div>
                      </div>
                    </div>
                  ))}
                  {isTyping && <div className="flex justify-start"><div className="bg-gray-100 p-2 rounded-xl rounded-tl-none flex gap-1"><div className="w-1 h-1 bg-gray-400 rounded-full animate-bounce" /><div className="w-1 h-1 bg-gray-400 rounded-full animate-bounce [animation-delay:0.2s]" /><div className="w-1 h-1 bg-gray-400 rounded-full animate-bounce [animation-delay:0.4s]" /></div></div>}
                </div>
              </ScrollArea>
              <form onSubmit={handleSendMessage} className="p-3 border-t border-gray-100 flex gap-2">
                <Input placeholder="Type a message..." value={newMessage} onChange={(e) => onInputChange(e.target.value)} className="flex-1 h-9 text-sm bg-gray-50 border-none focus-visible:ring-pex-gold" />
                <Button type="submit" size="icon" className="h-9 w-9 bg-pex-blue hover:bg-pex-blue/90 text-white"><Send size={16} /></Button>
              </form>
            </motion.div>
          )}
        </AnimatePresence>
        <Button size="icon" className={`h-14 w-14 rounded-full shadow-2xl transition-all duration-300 ${isChatOpen ? 'bg-pex-gold text-pex-blue rotate-90' : 'bg-pex-blue text-white hover:scale-110'}`} onClick={() => setIsChatOpen(!isChatOpen)}>{isChatOpen ? <X size={24} /> : <MessageCircle size={24} />}</Button>
      </div>

      {/* Notifications */}
      <div className="fixed top-6 right-6 z-[100] space-y-2">
        <AnimatePresence>
          {notifications.map(n => (
            <motion.div key={n.id} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className={`p-4 rounded-xl shadow-lg border-l-4 flex items-center gap-3 min-w-[300px] ${n.type === 'success' ? 'bg-green-50 border-green-500 text-green-800' : n.type === 'error' ? 'bg-red-50 border-red-500 text-red-800' : n.type === 'warning' ? 'bg-yellow-50 border-yellow-500 text-yellow-800' : 'bg-blue-50 border-blue-500 text-blue-800'}`}>
              {n.type === 'success' ? <CheckCircle2 size={20} /> : n.type === 'error' ? <AlertCircle size={20} /> : <Clock size={20} />}
              <p className="text-sm font-medium">{n.message}</p>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}

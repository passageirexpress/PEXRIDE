import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { 
  MapPin, 
  Clock, 
  Car, 
  DollarSign, 
  ChevronRight, 
  CheckCircle2, 
  Navigation, 
  Thermometer, 
  VolumeX, 
  Music,
  Search,
  ArrowRight,
  Shield,
  Star,
  Users,
  RefreshCw,
  ArrowLeft
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useFirebase, handleFirestoreError, OperationType } from '../FirebaseProvider';
import { db } from '../firebase';
import { collection, addDoc, Timestamp, query, where, onSnapshot, orderBy } from 'firebase/firestore';
import { useNavigate, useLocation } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import { ADDRESS_COORDS, ADDRESS_SUGGESTIONS } from '../constants';

// Fix Leaflet's default icon path issues
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

function MapUpdater({ center, bounds }: { center?: [number, number], bounds?: [number, number][] }) {
  const map = useMap();
  useEffect(() => {
    if (bounds && bounds.length > 0) {
      map.fitBounds(bounds as L.LatLngBoundsExpression, { padding: [20, 20] });
    } else if (center) {
      map.setView(center, 13);
    }
  }, [center, bounds, map]);
  return null;
}

export default function BookingPage() {
  const { user, profile } = useFirebase();
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state as any;
  
  const [pickup, setPickup] = useState(state?.pickup || '');
  const [dropoff, setDropoff] = useState(state?.dropoff || '');
  const [pickupSuggestions, setPickupSuggestions] = useState<any[]>([]);
  const [dropoffSuggestions, setDropoffSuggestions] = useState<any[]>([]);
  const [pickupCoords, setPickupCoords] = useState<{lat: number, lon: number} | null>(state?.pickupCoords || null);
  const [dropoffCoords, setDropoffCoords] = useState<{lat: number, lon: number} | null>(state?.dropoffCoords || null);
  const [distance, setDistance] = useState<number | null>(null);
  const [duration, setDuration] = useState<number | null>(null);
  const [routeCoordinates, setRouteCoordinates] = useState<[number, number][]>([]);
  
  const [selectedVehicleIdx, setSelectedVehicleIdx] = useState(0);
  const [vehicleTypes, setVehicleTypes] = useState<any[]>([
    { 
      id: 'economy', 
      name: 'Economy', 
      description: 'Mercedes C-Class, Audi A4', 
      capacity: 3, 
      pricing: { fixed: 17.65, tier1: 1.20, tier2: 1.00, tier3: 1.00 },
      exampleVehicle: 'Mercedes C-Class'
    },
    { 
      id: 'business_elite', 
      name: 'Business Elite', 
      description: 'Mercedes E-Class, BMW 5 Series', 
      capacity: 3, 
      pricing: { fixed: 20.00, tier1: 1.20, tier2: 1.10, tier3: 1.00 },
      exampleVehicle: 'Mercedes E-Class'
    },
    { 
      id: 'first_class', 
      name: 'First Class', 
      description: 'Mercedes S-Class, BMW 7 Series', 
      capacity: 3, 
      pricing: { fixed: 29.41, tier1: 1.70, tier2: 1.60, tier3: 1.50 },
      exampleVehicle: 'Mercedes S-Class'
    },
    { 
      id: 'luxury_suv', 
      name: 'Luxury SUV', 
      description: 'Range Rover, Cadillac Escalade', 
      capacity: 5, 
      pricing: { fixed: 20.00, tier1: 1.30, tier2: 1.20, tier3: 1.10 },
      exampleVehicle: 'Range Rover'
    },
    { 
      id: 'executive_van', 
      name: 'Executive Van', 
      description: 'Mercedes V-Class', 
      capacity: 7, 
      pricing: { fixed: 29.41, tier1: 1.70, tier2: 1.60, tier3: 1.50 },
      exampleVehicle: 'Mercedes V-Class'
    }
  ]);
  const [tripType, setTripType] = useState(state?.tripType || 'one-way');
  const [selectedPOI, setSelectedPOI] = useState<string | null>(state?.selectedPOI || null);
  const [durationHours, setDurationHours] = useState(state?.duration || '4');
  const [reservationTime, setReservationTime] = useState('');
  const [paxCount, setPaxCount] = useState(1);
  const [luggageCount, setLuggageCount] = useState(0);

  useEffect(() => {
    if (state?.selectedPOI) {
      setTripType('tour');
      setSelectedPOI(state.selectedPOI);
    } else if (state?.tripType === 'tour' && state?.dropoff) {
      setTripType('tour');
      setSelectedPOI(state.dropoff);
    }
  }, [state]);
  
  const filteredVehicleTypes = vehicleTypes.filter(vt => (vt.capacity || 4) >= paxCount);

  useEffect(() => {
    if (selectedVehicleIdx >= filteredVehicleTypes.length && filteredVehicleTypes.length > 0) {
      setSelectedVehicleIdx(0);
    }
  }, [paxCount, filteredVehicleTypes]);
  const [silentMode, setSilentMode] = useState(false);
  const [temperature, setTemperature] = useState([22]);
  const [selectedPlaylist, setSelectedPlaylist] = useState('Lounge & Jazz');
  
  const [passengerName, setPassengerName] = useState('');
  const [passengerPhone, setPassengerPhone] = useState('');
  
  const [isBooking, setIsBooking] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentUrl, setPaymentUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [isGeocoding, setIsGeocoding] = useState(false);
  const [bookingStep, setBookingStep] = useState<'selection' | 'confirmation' | 'searching' | 'tracking' | 'completed'>('selection');
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'mbway' | 'cash'>('card');
  const [driver, setDriver] = useState<any | null>(null);
  const [eta, setEta] = useState<number | null>(null);
  const [rideId, setRideId] = useState<string | null>(null);
  
  // Payment Form State
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvc, setCardCvc] = useState('');
  const [cardName, setCardName] = useState('');
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);

  const [pickupError, setPickupError] = useState(false);
  const [dropoffError, setDropoffError] = useState(false);
  const [tours, setTours] = useState<any[]>([]);

  useEffect(() => {
    if (profile) {
      setPassengerName(profile.displayName || user?.displayName || '');
      setPassengerPhone(profile.phoneNumber || '');
    }
  }, [profile, user]);

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = () => {
      setPickupSuggestions([]);
      setDropoffSuggestions([]);
    };
    window.addEventListener('click', handleClickOutside);
    return () => window.removeEventListener('click', handleClickOutside);
  }, []);

  useEffect(() => {
    const unsubVehicleTypes = onSnapshot(collection(db, 'vehicle_types'), (snapshot) => {
      if (!snapshot.empty) {
        const types = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        console.log('Fetched vehicle types from Firestore:', types);
        setVehicleTypes(types);
      }
    }, (err) => {
      handleFirestoreError(err, OperationType.GET, 'vehicle_types');
    });

    const unsubTours = onSnapshot(collection(db, 'tours'), (snapshot) => {
      if (!snapshot.empty) {
        setTours(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      }
    }, (err) => {
      handleFirestoreError(err, OperationType.GET, 'tours');
    });

    return () => {
      unsubVehicleTypes();
      unsubTours();
    };
  }, []);

  const isSelectingPickup = React.useRef(false);
  const isSelectingDropoff = React.useRef(false);

  useEffect(() => {
    const fetchPickup = async () => {
      if (isSelectingPickup.current) {
        isSelectingPickup.current = false;
        return;
      }
      
      const hardcoded = ADDRESS_SUGGESTIONS
        .filter(s => pickup.length > 1 && s.toLowerCase().includes(pickup.toLowerCase()))
        .map(s => ({ display_name: s, lat: '0', lon: '0', isHardcoded: true }));

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
          // Filter out duplicates from hardcoded
          const filteredHardcoded = hardcoded.filter(h => !suggestions.some((s: any) => s.display_name.includes(h.display_name)));
          setPickupSuggestions([...filteredHardcoded, ...suggestions]);
        } catch (err) {
          console.error('Error fetching suggestions:', err);
          setPickupSuggestions(hardcoded);
        }
      } else {
        setPickupSuggestions(hardcoded);
      }
    };
    const timeoutId = setTimeout(fetchPickup, 500);
    return () => clearTimeout(timeoutId);
  }, [pickup]);

  useEffect(() => {
    const fetchDropoff = async () => {
      if (isSelectingDropoff.current) {
        isSelectingDropoff.current = false;
        return;
      }

      const hardcoded = ADDRESS_SUGGESTIONS
        .filter(s => dropoff.length > 1 && s.toLowerCase().includes(dropoff.toLowerCase()))
        .map(s => ({ display_name: s, lat: '0', lon: '0', isHardcoded: true }));

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
          // Filter out duplicates from hardcoded
          const filteredHardcoded = hardcoded.filter(h => !suggestions.some((s: any) => s.display_name.includes(h.display_name)));
          setDropoffSuggestions([...filteredHardcoded, ...suggestions]);
        } catch (err) {
          console.error('Error fetching suggestions:', err);
          setDropoffSuggestions(hardcoded);
        }
      } else {
        setDropoffSuggestions(hardcoded);
      }
    };
    const timeoutId = setTimeout(fetchDropoff, 500);
    return () => clearTimeout(timeoutId);
  }, [dropoff]);

  const handlePickupChange = (val: string) => {
    setPickup(val);
  };

  const handleDropoffChange = (val: string) => {
    setDropoff(val);
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
          setRouteCoordinates([[pCoords.lat, pCoords.lon], [dCoords.lat, dCoords.lon]]);
          setDistance(distKm);
          setDuration(durMin);
          setIsGeocoding(false);
          return { distance: distKm, duration: durMin };
        } else {
          console.warn('Google Distance Matrix element status:', element.status);
        }
      }
      
      console.log('Falling back to OSRM...');
      // Fallback to OSRM if Google fails or returns no results
      const osrmRes = await fetch(`/api/osrm/route?coordinates=${pCoords.lon},${pCoords.lat};${dCoords.lon},${dCoords.lat}`);
      if (!osrmRes.ok) throw new Error(`OSRM error: ${osrmRes.status}`);
      const osrmData = await osrmRes.json();
      console.log('OSRM response:', osrmData);
      if (osrmData.routes && osrmData.routes[0]) {
        const route = osrmData.routes[0];
        const distKm = route.distance / 1000;
        const durMin = route.duration / 60;
        console.log('Route calculated (OSRM):', distKm, 'km,', durMin, 'mins');
        
        if (route.geometry) {
          const decodedCoords = decodePolyline(route.geometry);
          setRouteCoordinates(decodedCoords);
        } else {
          setRouteCoordinates([[pCoords.lat, pCoords.lon], [dCoords.lat, dCoords.lon]]);
        }
        
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
      setRouteCoordinates([[pCoords.lat, pCoords.lon], [dCoords.lat, dCoords.lon]]);
      setDistance(dist);
      setDuration(dur);
      setIsGeocoding(false);
      return { distance: dist, duration: dur };
    }
    console.warn('Route calculation failed all methods');
    setRouteCoordinates([[pCoords.lat, pCoords.lon], [dCoords.lat, dCoords.lon]]);
    setIsGeocoding(false);
    return null;
  };

  // Simple polyline decoder for OSRM geometry
  const decodePolyline = (str: string, precision = 5) => {
    let index = 0, lat = 0, lng = 0, coordinates: [number, number][] = [], shift = 0, result = 0, byte = null, latitude_change, longitude_change, factor = Math.pow(10, precision);
    while (index < str.length) {
      byte = null; shift = 0; result = 0;
      do { byte = str.charCodeAt(index++) - 63; result |= (byte & 0x1f) << shift; shift += 5; } while (byte >= 0x20);
      latitude_change = ((result & 1) ? ~(result >> 1) : (result >> 1));
      shift = result = 0;
      do { byte = str.charCodeAt(index++) - 63; result |= (byte & 0x1f) << shift; shift += 5; } while (byte >= 0x20);
      longitude_change = ((result & 1) ? ~(result >> 1) : (result >> 1));
      lat += latitude_change; lng += longitude_change;
      coordinates.push([lat / factor, lng / factor]);
    }
    return coordinates;
  };

  useEffect(() => {
    const geocodeInitial = async () => {
      if (state?.pickup && !pickupCoords) {
        if (ADDRESS_COORDS[state.pickup]) {
          setPickupCoords(ADDRESS_COORDS[state.pickup]);
        } else {
          try {
            const res = await fetch(`/api/maps/geocode?address=${encodeURIComponent(state.pickup)}`);
            const data = await res.json();
            if (data.results && data.results[0]) {
              setPickupCoords({ 
                lat: data.results[0].geometry.location.lat, 
                lon: data.results[0].geometry.location.lng 
              });
            }
          } catch (err) {
            console.error('Initial pickup geocoding error:', err);
          }
        }
      }
      
      if (state?.dropoff && !dropoffCoords && state?.tripType !== 'hourly') {
        if (ADDRESS_COORDS[state.dropoff]) {
          setDropoffCoords(ADDRESS_COORDS[state.dropoff]);
        } else {
          try {
            const res = await fetch(`/api/maps/geocode?address=${encodeURIComponent(state.dropoff)}`);
            const data = await res.json();
            if (data.results && data.results[0]) {
              setDropoffCoords({ 
                lat: data.results[0].geometry.location.lat, 
                lon: data.results[0].geometry.location.lng 
              });
            }
          } catch (err) {
            console.error('Initial dropoff geocoding error:', err);
          }
        }
      }
    };
    geocodeInitial();
  }, []);

  useEffect(() => {
    if (pickupCoords && dropoffCoords && tripType !== 'hourly') {
      calculateRoute(pickupCoords, dropoffCoords);
    }
  }, [pickupCoords, dropoffCoords, tripType]);

  const selectedVehicle = filteredVehicleTypes[selectedVehicleIdx] || { name: 'Business', basePrice: 15, multiplier: 1.5, pricePerKm: 0, pricePerMin: 0, minFare: 0, hourlyRate: 45 };
  
  const handleCalculateRoute = async () => {
    setIsGeocoding(true);
    setError(null);
    try {
      let currentPickupCoords = pickupCoords;
      if (!currentPickupCoords && pickup) {
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
            const nomRes = await fetch(`/api/nominatim/search?q=${encodeURIComponent(pickup)}`);
            if (nomRes.ok) {
              const nomData = await nomRes.json();
              if (nomData && nomData[0]) {
                currentPickupCoords = { lat: parseFloat(nomData[0].lat), lon: parseFloat(nomData[0].lon) };
                setPickupCoords(currentPickupCoords);
              }
            }
          }
        }
      }

      let currentDropoffCoords = dropoffCoords;
      if (tripType !== 'hourly' && !currentDropoffCoords && dropoff) {
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
            const nomRes = await fetch(`/api/nominatim/search?q=${encodeURIComponent(dropoff)}`);
            if (nomRes.ok) {
              const nomData = await nomRes.json();
              if (nomData && nomData[0]) {
                currentDropoffCoords = { lat: parseFloat(nomData[0].lat), lon: parseFloat(nomData[0].lon) };
                setDropoffCoords(currentDropoffCoords);
              }
            }
          }
        }
      }

      if (currentPickupCoords && currentDropoffCoords && tripType !== 'hourly') {
        await calculateRoute(currentPickupCoords, currentDropoffCoords);
      }
    } catch (err: any) {
      setError('Failed to calculate route. Please check the addresses.');
    } finally {
      setIsGeocoding(false);
    }
  };

  const calculateTotalPrice = () => {
    const selectedVehicle = filteredVehicleTypes[selectedVehicleIdx];
    if (!selectedVehicle) return 0;

    if (tripType === 'tour' && selectedPOI) {
      const tour = tours.find(t => t.name === selectedPOI);
      if (tour) {
        const basePrice = Number(tour.basePrice) || 0;
        const subtotal = basePrice * (Number(selectedVehicle.multiplier) || 1);
        return subtotal * 1.23; // Add 23% IVA
      }
    }

    if (tripType === 'hourly') {
      const basePrice = Number(selectedVehicle.basePrice) || Number(selectedVehicle.base_price) || 0;
      const hourlyRate = (Number(selectedVehicle.hourlyRate) || (basePrice * 3)) * (Number(selectedVehicle.multiplier) || 1);
      const subtotal = hourlyRate * Number(durationHours);
      return subtotal * 1.23; // Add 23% IVA
    }

    // New pricing logic for one-way/round-trip
    const dist = distance || 0;
    const pricing = selectedVehicle.pricing;
    if (!pricing) return 0;
    
    let price = 0;

    if (dist <= 10) {
      price = pricing.fixed;
    } else if (dist <= 100) {
      price = pricing.fixed + (dist - 10) * pricing.tier1;
    } else if (dist <= 200) {
      price = pricing.fixed + (90 * pricing.tier1) + (dist - 100) * pricing.tier2;
    } else {
      price = pricing.fixed + (90 * pricing.tier1) + (100 * pricing.tier2) + (dist - 200) * pricing.tier3;
    }

    // Add time component (keeping it same as before)
    const minPrice = (Number(selectedVehicle.pricePerMin) || 0.5) * (duration || 0);
    const subtotal = price + minPrice;
    
    return subtotal * 1.23; // Add 23% IVA
  };

  const totalPrice = calculateTotalPrice();

  const handleConfirmBooking = async () => {
    if (!user) {
      navigate('/login');
      return;
    }
    if (!pickup) {
      setPickupError(true);
      setError('Please select a pickup location.');
      return;
    }
    if (tripType !== 'hourly' && !dropoff) {
      setDropoffError(true);
      setError('Please select a dropoff location.');
      return;
    }

    setBookingStep('confirmation');
  };

  const startDriverSearch = async () => {
    setBookingStep('searching');
    setIsGeocoding(true);
    setError(null);
    
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
      if (tripType !== 'hourly') {
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
      } else {
        if (!currentPickupCoords) {
          throw new Error('Could not find coordinates for the pickup address.');
        }
      }

      setIsGeocoding(false);

      // Recalculate distance and duration using OSRM
      let finalDistance = distance;
      let finalDuration = duration;
      
      if (tripType !== 'hourly') {
        const routeData = await calculateRoute(currentPickupCoords, currentDropoffCoords!);
        if (routeData) {
          finalDistance = routeData.distance;
          finalDuration = routeData.duration;
        }

        if (!finalDistance || !finalDuration) {
          throw new Error('Could not calculate distance and time for the selected route.');
        }
      }

      const selectedVehicle = filteredVehicleTypes[selectedVehicleIdx];
      const finalTotalPrice = totalPrice;

      // Save ride to Firestore
      const docRef = await addDoc(collection(db, 'rides'), {
        passengerId: user.uid,
        passengerName: passengerName || user.displayName || profile?.displayName || 'Anonymous',
        passengerPhone: passengerPhone || '',
        pickupLocation: pickup,
        dropoffLocation: tripType === 'hourly' ? `Hourly Booking (${durationHours}h)` : dropoff,
        rideType: selectedVehicle.name,
        vehicleName: selectedVehicle.exampleVehicle,
        status: 'pending',
        price: finalTotalPrice,
        distance: finalDistance,
        duration: finalDuration,
        tripType,
        selectedPOI: selectedPOI || null,
        durationHours: tripType === 'hourly' ? durationHours : null,
        createdAt: Timestamp.now(),
        paymentMethod,
        silentMode,
        temperature: temperature[0],
        playlist: selectedPlaylist
      });

      setRideId(docRef.id);

      // Simulate driver search
      setTimeout(() => {
        const mockDriver = {
          id: 'd1',
          name: 'Carlos Oliveira',
          photo: 'https://i.pravatar.cc/150?u=d1',
          vehicle: selectedVehicle.exampleVehicle,
          plate: 'AA-00-BB',
          rating: 4.9,
          phone: '+351912345678'
        };
        setDriver(mockDriver);
        setBookingStep('tracking');
        setEta(5); // 5 minutes away
      }, 4000);

    } catch (err: any) {
      console.error('Booking error:', err);
      setError(err.message || 'Failed to complete booking. Please try again.');
      setBookingStep('selection');
    } finally {
      setIsBooking(false);
    }
  };

  const handleCancelRide = async () => {
    if (rideId) {
      // Update status in Firestore
      // ...
    }
    setBookingStep('selection');
    setDriver(null);
    setRideId(null);
  };

  const handleProcessPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessingPayment(true);
    
    // Simulate payment processing
    setTimeout(() => {
      setIsProcessingPayment(false);
      setShowPaymentModal(false);
      setBookingSuccess(true);
    }, 2000);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex justify-center">
      <div className="w-full max-w-md bg-white shadow-2xl min-h-screen flex flex-col relative pb-20">
        {/* Header */}
        <div className="bg-pex-blue text-white py-8 px-6 rounded-b-3xl shadow-lg z-10 relative">
          <div className="flex items-center gap-4 mb-4">
            <button onClick={() => navigate(-1)} className="p-2 -ml-2 hover:bg-white/10 rounded-full transition-colors">
              <ArrowRight className="rotate-180" size={24} />
            </button>
            <h1 className="text-2xl font-light tracking-tight">Book Journey</h1>
          </div>
          <p className="text-white/80 font-light text-sm">Experience the pinnacle of private transportation.</p>
        </div>

        <div className="flex-1 overflow-y-auto px-4 -mt-4 pt-8 pb-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 max-w-7xl mx-auto w-full">
            {/* Left Column: Locations & Preferences */}
            <div className="lg:col-span-2 space-y-6">
              {/* Passenger Information */}
            <Card className="shadow-xl border border-gray-100 overflow-hidden">
              <CardHeader className="bg-white border-b border-gray-100">
                <CardTitle className="text-lg font-medium text-pex-blue flex items-center gap-2">
                  <Users size={20} className="text-pex-gold" />
                  Passenger Information
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="grid grid-cols-1 gap-4">
                  <div className="space-y-2">
                    <Label className="text-xs uppercase tracking-widest text-gray-700 font-semibold">Full Name</Label>
                    <Input 
                      placeholder="Enter your name..." 
                      className="h-12 bg-white border border-gray-200 focus-visible:ring-pex-gold text-gray-900"
                      value={passengerName}
                      onChange={(e) => setPassengerName(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs uppercase tracking-widest text-gray-700 font-semibold">Phone Number</Label>
                    <Input 
                      placeholder="Enter your phone..." 
                      className="h-12 bg-white border border-gray-200 focus-visible:ring-pex-gold text-gray-900"
                      value={passengerPhone}
                      onChange={(e) => setPassengerPhone(e.target.value)}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Location Selection */}
            <Card className="shadow-xl border border-gray-100 overflow-hidden">
              <CardHeader className="bg-white border-b border-gray-100">
                <CardTitle className="text-lg font-medium text-pex-blue flex items-center gap-2">
                  <Navigation size={20} className="text-pex-gold" />
                  Journey Details
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-6">
                <div className="grid grid-cols-1 gap-4">
                  <div className="space-y-2">
                    <Label className="text-xs uppercase tracking-widest text-gray-700 font-semibold">Pickup Date & Time</Label>
                    <div className="relative">
                      <Clock className="absolute left-3 top-1/2 -translate-y-1/2 text-pex-gold" size={18} />
                      <Input 
                        type="datetime-local" 
                        className="pl-10 h-12 bg-white border border-gray-200 focus-visible:ring-pex-gold text-gray-900"
                        value={reservationTime}
                        onChange={(e) => setReservationTime(e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-xs uppercase tracking-widest text-gray-700 font-semibold">Passengers</Label>
                      <div className="relative">
                        <Users className="absolute left-3 top-1/2 -translate-y-1/2 text-pex-gold" size={18} />
                        <Input 
                          type="number" 
                          min={1} 
                          max={8}
                          className="pl-10 h-12 bg-white border border-gray-200 focus-visible:ring-pex-gold text-gray-900"
                          value={paxCount}
                          onChange={(e) => setPaxCount(parseInt(e.target.value))}
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs uppercase tracking-widest text-gray-700 font-semibold">Luggage</Label>
                      <div className="relative">
                        <Car className="absolute left-3 top-1/2 -translate-y-1/2 text-pex-gold" size={18} />
                        <Input 
                          type="number" 
                          min={0} 
                          max={8}
                          className="pl-10 h-12 bg-white border border-gray-200 focus-visible:ring-pex-gold text-gray-900"
                          value={luggageCount}
                          onChange={(e) => setLuggageCount(parseInt(e.target.value))}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="relative">
                  <Label className="text-xs uppercase tracking-widest text-gray-700 font-semibold mb-2 block">Pickup Location</Label>
                  <div className="relative" onClick={(e) => e.stopPropagation()}>
                    <MapPin className={`absolute left-3 top-1/2 -translate-y-1/2 ${pickupError ? 'text-red-500' : 'text-pex-gold'}`} size={18} />
                    <Input 
                      placeholder="Enter pickup address..." 
                      className={`pl-10 h-12 bg-white border focus-visible:ring-pex-gold text-gray-900 truncate pr-4 ${pickupError ? 'border-red-500' : 'border-gray-200'}`}
                      value={pickup}
                      onChange={(e) => {
                        handlePickupChange(e.target.value);
                        if (e.target.value) setPickupError(false);
                      }}
                      onFocus={() => {
                        if (pickup.length > 1) {
                          handlePickupChange(pickup);
                        }
                      }}
                    />
                  </div>
                  <AnimatePresence>
                    {pickupSuggestions.length > 0 && (
                      <motion.div 
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="absolute z-50 w-full mt-1 bg-white border border-gray-100 rounded-lg shadow-xl overflow-hidden"
                      >
                        {pickupSuggestions.map((s, i) => (
                          <button 
                            key={i}
                            className="w-full text-left px-4 py-3 text-sm hover:bg-gray-50 transition-colors border-b border-gray-50 last:border-none text-gray-900"
                            onClick={async () => { 
                              isSelectingPickup.current = true;
                              setPickup(s.display_name); 
                              if (ADDRESS_COORDS[s.display_name]) {
                                setPickupCoords(ADDRESS_COORDS[s.display_name]);
                              } else if (s.isGoogle && s.place_id) {
                                try {
                                  const res = await fetch(`/api/maps/geocode?address=place_id:${s.place_id}`);
                                  const data = await res.json();
                                  if (data.results && data.results[0]) {
                                    setPickupCoords({ 
                                      lat: data.results[0].geometry.location.lat, 
                                      lon: data.results[0].geometry.location.lng 
                                    });
                                  }
                                } catch (err) {
                                  console.error('Error fetching google coords:', err);
                                }
                              } else if (s.isHardcoded) {
                                try {
                                  const res = await fetch(`/api/nominatim/search?q=${encodeURIComponent(s.display_name)}`);
                                  if (!res.ok) throw new Error(`Nominatim error: ${res.status}`);
                                  const data = await res.json();
                                  if (data && data[0]) {
                                    setPickupCoords({ lat: parseFloat(data[0].lat), lon: parseFloat(data[0].lon) });
                                  }
                                } catch (err) {
                                  console.error('Error fetching hardcoded coords:', err);
                                }
                              } else {
                                setPickupCoords({ lat: parseFloat(s.lat), lon: parseFloat(s.lon) });
                              }
                              setPickupSuggestions([]); 
                            }}
                          >
                            {s.display_name}
                          </button>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                <div className="relative">
                  <Label className="text-xs uppercase tracking-widest text-gray-700 font-semibold mb-2 block">
                    {tripType === 'hourly' ? 'Duration' : 'Dropoff Location'}
                  </Label>
                  {tripType === 'hourly' ? (
                    <div className="relative">
                      <Clock className="absolute left-3 top-1/2 -translate-y-1/2 text-pex-blue" size={18} />
                      <select 
                        className="pl-10 h-12 w-full bg-white border border-gray-200 focus-visible:ring-pex-gold rounded-md text-sm text-gray-900"
                        value={durationHours}
                        onChange={(e) => setDurationHours(e.target.value)}
                      >
                        {[2, 3, 4, 5, 6, 8, 10, 12, 24].map(h => (
                          <option key={h} value={h}>{h} hours</option>
                        ))}
                      </select>
                    </div>
                  ) : (
                    <>
                      <div className="relative" onClick={(e) => e.stopPropagation()}>
                        <MapPin className={`absolute left-3 top-1/2 -translate-y-1/2 ${dropoffError ? 'text-red-500' : 'text-pex-blue'}`} size={18} />
                        <Input 
                          placeholder="Enter destination..." 
                          className={`pl-10 h-12 bg-white border focus-visible:ring-pex-gold text-gray-900 truncate pr-4 ${dropoffError ? 'border-red-500' : 'border-gray-200'}`}
                          value={dropoff}
                          onChange={(e) => {
                            handleDropoffChange(e.target.value);
                            if (e.target.value) setDropoffError(false);
                          }}
                          onFocus={() => {
                            if (dropoff.length > 1) {
                              handleDropoffChange(dropoff);
                            }
                          }}
                        />
                      </div>
                      <AnimatePresence>
                        {dropoffSuggestions.length > 0 && (
                          <motion.div 
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="absolute z-50 w-full mt-1 bg-white border border-gray-100 rounded-lg shadow-xl overflow-hidden"
                          >
                            {dropoffSuggestions.map((s, i) => (
                              <button 
                                key={i}
                                className="w-full text-left px-4 py-3 text-sm hover:bg-gray-50 transition-colors border-b border-gray-50 last:border-none text-gray-900"
                                onClick={async () => { 
                                  isSelectingDropoff.current = true;
                                  setDropoff(s.display_name); 
                                  if (ADDRESS_COORDS[s.display_name]) {
                                    setDropoffCoords(ADDRESS_COORDS[s.display_name]);
                                  } else if (s.isGoogle && s.place_id) {
                                    try {
                                      const res = await fetch(`/api/maps/geocode?address=place_id:${s.place_id}`);
                                      const data = await res.json();
                                      if (data.results && data.results[0]) {
                                        setDropoffCoords({ 
                                          lat: data.results[0].geometry.location.lat, 
                                          lon: data.results[0].geometry.location.lng 
                                        });
                                      }
                                    } catch (err) {
                                      console.error('Error fetching google coords:', err);
                                    }
                                  } else if (s.isHardcoded) {
                                    try {
                                      const res = await fetch(`/api/nominatim/search?q=${encodeURIComponent(s.display_name)}`);
                                      if (!res.ok) throw new Error(`Nominatim error: ${res.status}`);
                                      const data = await res.json();
                                      if (data && data[0]) {
                                        setDropoffCoords({ lat: parseFloat(data[0].lat), lon: parseFloat(data[0].lon) });
                                      }
                                    } catch (err) {
                                      console.error('Error fetching hardcoded coords:', err);
                                    }
                                  } else {
                                    setDropoffCoords({ lat: parseFloat(s.lat), lon: parseFloat(s.lon) });
                                  }
                                  setDropoffSuggestions([]); 
                                }}
                              >
                                {s.display_name}
                              </button>
                            ))}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </>
                  )}
                </div>
                <div className="flex justify-end mt-4">
                  <Button 
                    onClick={handleCalculateRoute} 
                    disabled={isGeocoding || !pickup || (tripType !== 'hourly' && !dropoff)}
                    className="bg-pex-blue hover:bg-pex-blue/90 text-white"
                  >
                    {isGeocoding ? (
                      <span className="flex items-center gap-2"><RefreshCw className="animate-spin" size={16} /> Calculating...</span>
                    ) : (
                      <span className="flex items-center gap-2"><Navigation size={16} /> Calculate Route & Price</span>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Vehicle Selection */}
            <Card className="shadow-xl border border-gray-100 overflow-hidden">
              <CardHeader className="bg-white border-b border-gray-100 flex flex-row items-center justify-between">
                <CardTitle className="text-lg font-medium text-pex-blue flex items-center gap-2">
                  <Car size={20} className="text-pex-gold" />
                  Select Vehicle
                </CardTitle>
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    size="icon" 
                    className="h-8 w-8 rounded-full border-gray-200"
                    onClick={() => {
                      const container = document.getElementById('vehicle-carousel');
                      if (container) container.scrollBy({ left: -200, behavior: 'smooth' });
                    }}
                  >
                    <ArrowLeft size={14} />
                  </Button>
                  <Button 
                    variant="outline" 
                    size="icon" 
                    className="h-8 w-8 rounded-full border-gray-200"
                    onClick={() => {
                      const container = document.getElementById('vehicle-carousel');
                      if (container) container.scrollBy({ left: 200, behavior: 'smooth' });
                    }}
                  >
                    <ArrowRight size={14} />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-6">
                <div 
                  id="vehicle-carousel"
                  className="flex overflow-x-auto gap-4 pb-4 snap-x no-scrollbar"
                  style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                >
                  {filteredVehicleTypes.map((vt, i) => {
                    // Calculate estimated price for this vehicle
                    const pricing = vt.pricing;
                    let estPrice = 0;
                    if (pricing) {
                      const dist = distance || 0;
                      if (dist <= 10) estPrice = pricing.fixed;
                      else if (dist <= 100) estPrice = pricing.fixed + (dist - 10) * pricing.tier1;
                      else if (dist <= 200) estPrice = pricing.fixed + (90 * pricing.tier1) + (dist - 100) * pricing.tier2;
                      else estPrice = pricing.fixed + (90 * pricing.tier1) + (100 * pricing.tier2) + (dist - 200) * pricing.tier3;
                      
                      const minPrice = (Number(vt.pricePerMin) || 0.5) * (duration || 0);
                      estPrice = (estPrice + minPrice) * 1.23;
                    }

                    return (
                      <button
                        key={vt.id}
                        onClick={() => setSelectedVehicleIdx(i)}
                        className={`relative flex-shrink-0 w-64 p-5 rounded-2xl border-2 transition-all text-left snap-start ${
                          selectedVehicleIdx === i 
                            ? 'border-pex-gold bg-pex-gold/5 shadow-lg scale-[1.02]' 
                            : 'border-gray-100 bg-white hover:border-pex-gold/30'
                        }`}
                      >
                        {selectedVehicleIdx === i && (
                          <div className="absolute top-3 right-3 text-pex-gold">
                            <CheckCircle2 size={20} />
                          </div>
                        )}
                        <div className="text-[10px] uppercase tracking-[0.2em] text-gray-400 font-bold mb-2">{vt.name}</div>
                        <div className="font-bold text-pex-blue text-lg mb-1">
                          {vt.exampleVehicle}
                        </div>
                        <div className="text-xs text-gray-500 mb-4 line-clamp-1">
                          {vt.description}
                        </div>
                        
                        <div className="flex items-center gap-4 text-xs text-gray-600 mb-6">
                          <span className="flex items-center gap-1.5"><Users size={14} className="text-pex-gold" /> {vt.capacity}</span>
                          <span className="flex items-center gap-1.5"><Clock size={14} className="text-pex-gold" /> 5-8 min</span>
                        </div>

                        <div className="flex items-end justify-between">
                          <div className="flex flex-col">
                            <span className="text-[10px] text-gray-400 uppercase font-bold">Estimated</span>
                            <span className="text-xl font-bold text-pex-blue">
                              €{estPrice > 0 ? estPrice.toFixed(2) : '---'}
                            </span>
                          </div>
                          <Badge className={selectedVehicleIdx === i ? 'bg-pex-gold text-pex-blue' : 'bg-gray-100 text-gray-500'}>
                            {selectedVehicleIdx === i ? 'Selected' : 'Select'}
                          </Badge>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Preferences */}
            <Card className="shadow-xl border border-gray-100 overflow-hidden">
              <CardHeader className="bg-white border-b border-gray-100">
                <CardTitle className="text-lg font-medium text-pex-blue flex items-center gap-2">
                  <Shield size={20} className="text-pex-gold" />
                  Ride Preferences
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-8">
                <div className="grid grid-cols-1 gap-8">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label className="text-sm font-medium text-pex-blue">Silent Mode</Label>
                        <p className="text-xs text-gray-700 italic">No conversation unless requested</p>
                      </div>
                      <Switch checked={silentMode} onCheckedChange={setSilentMode} />
                    </div>
                    
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <Label className="text-sm font-medium text-pex-blue">Cabin Temperature</Label>
                        <span className="text-pex-gold font-bold text-sm">{temperature[0]}°C</span>
                      </div>
                      <Slider 
                        value={temperature} 
                        onValueChange={setTemperature} 
                        max={28} 
                        min={18} 
                        step={1} 
                        className="py-4"
                      />
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-pex-blue">Trip Type</Label>
                      <div className="grid grid-cols-2 gap-2">
                        {['one-way', 'hourly'].map((type) => (
                          <button
                            key={type}
                            onClick={() => setTripType(type)}
                            className={`px-4 py-2 rounded-lg text-xs font-medium transition-all ${
                              tripType === type 
                                ? 'bg-pex-blue text-white shadow-md' 
                                : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'
                            }`}
                          >
                            {type === 'one-way' ? 'One Way' : 'By the Hour'}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-pex-blue">Ambient Music</Label>
                      <select 
                        className="w-full h-10 rounded-lg border border-gray-200 bg-white px-3 text-xs focus:ring-1 focus:ring-pex-gold outline-none text-gray-900"
                        value={selectedPlaylist}
                        onChange={(e) => setSelectedPlaylist(e.target.value)}
                      >
                        <option>Lounge & Jazz</option>
                        <option>Classical Masterpieces</option>
                        <option>Modern Ambient</option>
                        <option>Silence</option>
                      </select>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

            {/* Right Column: Summary & Confirmation */}
            <div className="lg:col-span-1 space-y-6">
            {/* Map Placeholder */}
            <Card className="shadow-xl border-none overflow-hidden h-64 relative">
              {(pickupCoords || dropoffCoords) ? (
                <MapContainer 
                  center={pickupCoords ? [pickupCoords.lat, pickupCoords.lon] : [38.7223, -9.1393]} 
                  zoom={12} 
                  style={{ height: '100%', width: '100%' }}
                  zoomControl={false}
                >
                  <MapUpdater 
                    center={pickupCoords ? [pickupCoords.lat, pickupCoords.lon] : undefined}
                    bounds={routeCoordinates.length > 0 ? routeCoordinates : undefined}
                  />
                  <TileLayer
                    url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
                  />
                  {pickupCoords && <Marker position={[pickupCoords.lat, pickupCoords.lon]} />}
                  {dropoffCoords && <Marker position={[dropoffCoords.lat, dropoffCoords.lon]} />}
                  {routeCoordinates.length > 0 && (
                    <Polyline positions={routeCoordinates} color="#D4AF37" weight={4} opacity={0.8} />
                  )}
                </MapContainer>
              ) : (
                <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                  <div className="text-center space-y-2">
                    <Navigation size={24} className="mx-auto text-gray-300" />
                    <p className="text-xs text-gray-400 uppercase tracking-widest">Map Preview</p>
                  </div>
                </div>
              )}
            </Card>

            <Card className="shadow-xl border-none overflow-hidden sticky top-24">
              <CardHeader className="bg-pex-blue text-white">
                <CardTitle className="text-lg font-light tracking-widest uppercase">Summary</CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-6">
                <div className="space-y-4">
                  <div className="flex justify-between items-start">
                    <div className="space-y-1">
                      <p className="text-[10px] uppercase tracking-widest text-gray-600">Vehicle</p>
                      <p className="font-bold text-pex-blue">{selectedVehicle.name === 'Business' ? 'Mercedes S-Class' : selectedVehicle.name === 'SUV' ? 'Range Rover' : 'Mercedes V-Class'}</p>
                    </div>
                    <Badge variant="outline" className="text-[10px] border-pex-gold text-pex-gold">{selectedVehicle.name}</Badge>
                  </div>

                  <div className="space-y-2">
                    <p className="text-[10px] uppercase tracking-widest text-gray-600">Route Details</p>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm text-pex-blue">
                        <div className="w-2 h-2 rounded-full bg-pex-gold" />
                        <span className="truncate">{pickup || 'Not selected'}</span>
                      </div>
                      {tripType !== 'hourly' && (
                        <>
                          <div className="w-px h-4 bg-gray-200 ml-1" />
                          <div className="flex items-center gap-2 text-sm text-pex-blue">
                            <div className="w-2 h-2 rounded-full bg-pex-blue" />
                            <span className="truncate">{dropoff || 'Not selected'}</span>
                          </div>
                        </>
                      )}
                    </div>
                    {tripType === 'hourly' ? (
                      <div className="flex gap-4 mt-2 text-[10px] text-gray-500 uppercase tracking-widest">
                        <div className="flex items-center gap-1">
                          <Clock size={10} className="text-pex-gold" />
                          {durationHours} hours
                        </div>
                      </div>
                    ) : distance !== null ? (
                      <div className="flex gap-4 mt-2 text-[10px] text-gray-500 uppercase tracking-widest">
                        <div className="flex items-center gap-1">
                          <Navigation size={10} className="text-pex-gold" />
                          {distance.toFixed(1)} km
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock size={10} className="text-pex-gold" />
                          {Math.round(duration || 0)} mins
                        </div>
                      </div>
                    ) : isGeocoding ? (
                      <div className="mt-2 text-[10px] text-pex-gold animate-pulse uppercase tracking-widest">
                        Calculating distance...
                      </div>
                    ) : (
                      <div className="mt-2 text-[10px] text-gray-600 italic uppercase tracking-widest">
                        Distance will be calculated upon booking
                      </div>
                    )}
                  </div>

                    <div className="pt-4 border-t border-gray-100">
                      {tripType === 'hourly' ? (
                        <>
                          <div className="flex justify-between items-center mb-1">
                            <span className="text-sm text-gray-500">Hourly Rate</span>
                            <span className="text-sm font-medium">€{((Number(selectedVehicle.hourlyRate) || ((Number(selectedVehicle.basePrice) || Number(selectedVehicle.base_price) || 0) * 3)) * (Number(selectedVehicle.multiplier) || 1)).toFixed(2)}/h</span>
                          </div>
                          <div className="flex justify-between items-center mb-1">
                            <span className="text-sm text-gray-500">Duration</span>
                            <span className="text-sm font-medium">{durationHours} hours</span>
                          </div>
                        </>
                      ) : (
                        <>
                          <div className="flex justify-between items-center mb-1">
                            <span className="text-sm text-gray-500">Base Fare</span>
                            <span className="text-sm font-medium">€{(Number(selectedVehicle.basePrice || selectedVehicle.base_price || 0) * (Number(selectedVehicle.multiplier) || 1)).toFixed(2)}</span>
                          </div>
                          {distance !== null && (
                            <div className="flex justify-between items-center mb-1">
                              <span className="text-sm text-gray-500">Distance ({distance.toFixed(1)} km)</span>
                              <span className="text-sm font-medium">€{(distance * (Number(selectedVehicle.pricePerKm) || 1.5) * (Number(selectedVehicle.multiplier) || 1)).toFixed(2)}</span>
                            </div>
                          )}
                          {duration !== null && (
                            <div className="flex justify-between items-center mb-1">
                              <span className="text-sm text-gray-500">Duration ({Math.round(duration)} min)</span>
                              <span className="text-sm font-medium">€{(duration * (Number(selectedVehicle.pricePerMin) || 0.5) * (Number(selectedVehicle.multiplier) || 1)).toFixed(2)}</span>
                            </div>
                          )}
                        </>
                      )}
                      <div className="flex justify-between items-center mb-1 pt-2 border-t border-gray-100">
                        <span className="text-sm text-gray-500">Subtotal (Excl. IVA)</span>
                        <span className="text-sm font-medium">€{(totalPrice / 1.23).toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-sm text-gray-500">IVA (23%)</span>
                        <span className="text-sm font-medium">€{(totalPrice - (totalPrice / 1.23)).toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between items-center mb-4">
                        <span className="text-sm text-gray-500">Service Multiplier</span>
                        <span className="text-sm font-medium">x{selectedVehicle.multiplier}</span>
                      </div>
                      {Number(selectedVehicle.minFare) > 0 && (totalPrice / 1.23) === Number(selectedVehicle.minFare) && (
                        <div className="text-[10px] text-pex-gold uppercase tracking-widest mb-2 text-right">
                          Minimum Fare Applied
                        </div>
                      )}
                      <div className="flex justify-between items-center">
                        <span className="text-lg font-bold text-pex-blue">Total</span>
                        <span className="text-2xl font-light text-pex-gold">€{totalPrice.toFixed(2)}</span>
                      </div>
                    </div>
                </div>

                {error && (
                  <div className="p-3 bg-red-50 text-red-600 text-xs rounded-lg flex items-center gap-2">
                    <Shield size={14} />
                    {error}
                  </div>
                )}

                <Button 
                  className="w-full h-14 bg-pex-gold text-pex-blue font-bold text-lg hover:bg-pex-blue hover:text-white transition-all shadow-lg group"
                  onClick={handleConfirmBooking}
                  disabled={isBooking}
                >
                  {isBooking ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-pex-blue border-t-transparent rounded-full animate-spin" />
                      Processing...
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      Confirm Journey
                      <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                    </div>
                  )}
                </Button>

                <p className="text-[10px] text-center text-gray-600 mt-4">
                  By confirming, you agree to our Terms of Service and Privacy Policy.
                </p>
                <div className="mt-6 p-4 bg-gray-50 rounded-lg border border-gray-100">
                  <h4 className="text-[10px] font-bold uppercase tracking-widest text-pex-blue mb-2">Cancellation Policy</h4>
                  <ul className="text-xs text-gray-500 space-y-1">
                    <li>• Free cancellation up to 24 hours before pickup.</li>
                    <li>• 50% penalty for cancellations between 12 and 24 hours.</li>
                    <li>• 100% penalty for cancellations within 12 hours.</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Payment Modal */}
      <Dialog open={showPaymentModal} onOpenChange={setShowPaymentModal}>
        <DialogContent className="sm:max-w-[400px] p-6">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-pex-blue mb-2">Secure Checkout</DialogTitle>
            <DialogDescription className="text-gray-500">
              Enter your payment details to confirm your booking.
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleProcessPayment} className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label className="text-xs font-bold uppercase tracking-widest text-gray-500">Name on Card</Label>
              <Input 
                required
                placeholder="John Doe" 
                value={cardName}
                onChange={(e) => setCardName(e.target.value)}
                className="h-12 bg-gray-50 border-gray-200 focus-visible:ring-pex-gold"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-bold uppercase tracking-widest text-gray-500">Card Number</Label>
              <Input 
                required
                placeholder="0000 0000 0000 0000" 
                value={cardNumber}
                onChange={(e) => setCardNumber(e.target.value)}
                maxLength={19}
                className="h-12 bg-gray-50 border-gray-200 focus-visible:ring-pex-gold"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase tracking-widest text-gray-500">Expiry</Label>
                <Input 
                  required
                  placeholder="MM/YY" 
                  value={cardExpiry}
                  onChange={(e) => setCardExpiry(e.target.value)}
                  maxLength={5}
                  className="h-12 bg-gray-50 border-gray-200 focus-visible:ring-pex-gold"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase tracking-widest text-gray-500">CVC</Label>
                <Input 
                  required
                  placeholder="123" 
                  value={cardCvc}
                  onChange={(e) => setCardCvc(e.target.value)}
                  maxLength={4}
                  className="h-12 bg-gray-50 border-gray-200 focus-visible:ring-pex-gold"
                />
              </div>
            </div>
            
            <Button 
              type="submit"
              disabled={isProcessingPayment}
              className="w-full bg-pex-blue text-white font-bold h-14 rounded-xl mt-6 hover:bg-pex-blue/90 transition-colors"
            >
              {isProcessingPayment ? (
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Processing...
                </div>
              ) : (
                `Pay €${(
                  tripType === 'hourly' 
                    ? ((Number(selectedVehicle?.basePrice || 0) * 3) * (Number(selectedVehicle?.multiplier || 1)) * Number(durationHours) * 1.23)
                    : (Math.max(
                        ((Number(selectedVehicle?.basePrice || 0) + 
                        ((Number(selectedVehicle?.pricePerKm || 1.5) * (distance || 0))) + 
                        ((Number(selectedVehicle?.pricePerMin || 0.5) * (duration || 0)))) * 
                        (Number(selectedVehicle?.multiplier || 1))),
                        (Number(selectedVehicle?.minFare || 0))
                      ) * 1.23)
                ).toFixed(2)}`
              )}
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* Success Dialog */}
      <Dialog open={bookingSuccess} onOpenChange={setBookingSuccess}>
        <DialogContent className="sm:max-w-[400px] text-center p-12">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 size={40} className="text-green-600" />
          </div>
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-pex-blue mb-2">
              Booking Confirmed!
            </DialogTitle>
            <DialogDescription className="text-gray-500">
              Your payment was successful. Your chauffeur has been notified and is preparing for your journey. You can track your ride in the dashboard.
            </DialogDescription>
          </DialogHeader>
          <div className="mt-8 space-y-3">
            <Button 
              className="w-full h-12 bg-pex-blue text-white hover:bg-pex-blue/90" 
              onClick={() => navigate('/')}
            >
              Return to Home
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
    </div>
  );
}

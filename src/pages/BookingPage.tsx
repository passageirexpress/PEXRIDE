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
  Users
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useFirebase } from '../FirebaseProvider';
import { useNavigate } from 'react-router-dom';

export default function BookingPage() {
  const { user, profile } = useFirebase();
  const navigate = useNavigate();
  
  const [pickup, setPickup] = useState('');
  const [dropoff, setDropoff] = useState('');
  const [pickupSuggestions, setPickupSuggestions] = useState<any[]>([]);
  const [dropoffSuggestions, setDropoffSuggestions] = useState<any[]>([]);
  const [pickupCoords, setPickupCoords] = useState<{lat: number, lon: number} | null>(null);
  const [dropoffCoords, setDropoffCoords] = useState<{lat: number, lon: number} | null>(null);
  const [distance, setDistance] = useState<number | null>(null);
  const [duration, setDuration] = useState<number | null>(null);
  
  const [selectedVehicleIdx, setSelectedVehicleIdx] = useState(0);
  const [vehicleTypes, setVehicleTypes] = useState<any[]>([]);
  const [tripType, setTripType] = useState('one-way');
  const [silentMode, setSilentMode] = useState(false);
  const [temperature, setTemperature] = useState([22]);
  const [selectedPlaylist, setSelectedPlaylist] = useState('Lounge & Jazz');
  
  const [isBooking, setIsBooking] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
    const fetchData = async () => {
      try {
        const res = await fetch('/api/vehicle-types');
        const data = await res.json();
        console.log('Fetched vehicle types:', data);
        setVehicleTypes(data);
      } catch (err) {
        console.error('Error fetching vehicle types:', err);
      }
    };
    fetchData();
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
      const osrmRes = await fetch(`https://router.project-osrm.org/route/v1/driving/${pCoords.lon},${pCoords.lat};${dCoords.lon},${dCoords.lat}?overview=false`, {
        headers: { 'User-Agent': 'PassageiroExpressLuxury/1.0' }
      });
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

  const selectedVehicle = vehicleTypes[selectedVehicleIdx] || { name: 'Business', basePrice: 15, multiplier: 1.5, pricePerKm: 0, pricePerMin: 0, minFare: 0 };
  
  const calculateTotalPrice = () => {
    const base = (Number(selectedVehicle.basePrice) || 0);
    const kmPrice = (Number(selectedVehicle.pricePerKm) || 1.5) * (distance || 0);
    const minPrice = (Number(selectedVehicle.pricePerMin) || 0.5) * (duration || 0);
    
    let total = (base + kmPrice + minPrice) * (Number(selectedVehicle.multiplier) || 1);
    
    const minFare = (Number(selectedVehicle.minFare) || 0);
    const subtotal = Math.max(total, minFare);
    return subtotal * 1.23; // Add 23% IVA
  };

  const totalPrice = calculateTotalPrice();

  const handleConfirmBooking = async () => {
    if (!user) {
      navigate('/login');
      return;
    }
    if (!pickup || !dropoff) {
      setError('Please select both pickup and dropoff locations.');
      return;
    }

    setIsBooking(true);
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
            const nomRes = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(pickup)}&limit=1`, {
              headers: { 'User-Agent': 'PassageiroExpressLuxury/1.0' }
            });
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
            const nomRes = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(dropoff)}&limit=1`, {
              headers: { 'User-Agent': 'PassageiroExpressLuxury/1.0' }
            });
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
      const base = (Number(selectedVehicle.basePrice) || 0);
      const kmPrice = (Number(selectedVehicle.pricePerKm) || 1.5) * (finalDistance || 0);
      const minPrice = (Number(selectedVehicle.pricePerMin) || 0.5) * (finalDuration || 0);
      
      let total = (base + kmPrice + minPrice) * (Number(selectedVehicle.multiplier) || 1);
      
      const minFare = (Number(selectedVehicle.minFare) || 0);
      const subtotal = Math.max(total, minFare);
      const finalTotalPrice = subtotal * 1.23;

      const response = await fetch('/api/rides', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          passengerId: user.uid,
          passengerName: user.displayName || profile?.displayName || 'Anonymous',
          pickupLocation: pickup,
          dropoffLocation: dropoff,
          rideType: selectedVehicle.name,
          vehicleName: selectedVehicle.name === 'Business' ? 'Mercedes S-Class' : selectedVehicle.name === 'SUV' ? 'Range Rover' : 'Mercedes V-Class',
          price: finalTotalPrice,
          preferences: {
            silentMode,
            temperature: temperature[0],
            playlist: selectedPlaylist,
            tripType
          }
        }),
      });

      if (!response.ok) throw new Error('Failed to book ride');
      
      setBookingSuccess(true);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsBooking(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <div className="bg-pex-blue text-white py-12 px-6">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-light tracking-tight mb-2">Book Your Journey</h1>
          <p className="text-white/60 font-light">Experience the pinnacle of private transportation.</p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 -mt-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column: Locations & Preferences */}
          <div className="lg:col-span-2 space-y-6">
            {/* Location Selection */}
            <Card className="shadow-xl border-none">
              <CardHeader className="bg-white border-b border-gray-100">
                <CardTitle className="text-lg font-medium text-pex-blue flex items-center gap-2">
                  <Navigation size={20} className="text-pex-gold" />
                  Route Details
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-6">
                <div className="relative">
                  <Label className="text-xs uppercase tracking-widest text-gray-400 mb-2 block">Pickup Location</Label>
                  <div className="relative" onClick={(e) => e.stopPropagation()}>
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-pex-gold" size={18} />
                    <Input 
                      placeholder="Enter pickup address..." 
                      className="pl-10 h-12 bg-gray-50 border-none focus-visible:ring-pex-gold"
                      value={pickup}
                      onChange={(e) => handlePickupChange(e.target.value)}
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
                            className="w-full text-left px-4 py-3 text-sm hover:bg-gray-50 transition-colors border-b border-gray-50 last:border-none"
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
                                  const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(s.display_name)}&limit=1`, {
                                    headers: { 'User-Agent': 'PassageiroExpressLuxury/1.0' }
                                  });
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
                  <Label className="text-xs uppercase tracking-widest text-gray-400 mb-2 block">Dropoff Location</Label>
                  <div className="relative" onClick={(e) => e.stopPropagation()}>
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-pex-blue" size={18} />
                    <Input 
                      placeholder="Enter destination..." 
                      className="pl-10 h-12 bg-gray-50 border-none focus-visible:ring-pex-gold"
                      value={dropoff}
                      onChange={(e) => handleDropoffChange(e.target.value)}
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
                            className="w-full text-left px-4 py-3 text-sm hover:bg-gray-50 transition-colors border-b border-gray-50 last:border-none"
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
                                  const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(s.display_name)}&limit=1`, {
                                    headers: { 'User-Agent': 'PassageiroExpressLuxury/1.0' }
                                  });
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
                </div>
              </CardContent>
            </Card>

            {/* Vehicle Selection */}
            <Card className="shadow-xl border-none overflow-hidden">
              <CardHeader className="bg-white border-b border-gray-100">
                <CardTitle className="text-lg font-medium text-pex-blue flex items-center gap-2">
                  <Car size={20} className="text-pex-gold" />
                  Select Vehicle
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {vehicleTypes.map((vt, i) => (
                    <button
                      key={vt.id}
                      onClick={() => setSelectedVehicleIdx(i)}
                      className={`relative p-4 rounded-xl border-2 transition-all text-left ${
                        selectedVehicleIdx === i 
                          ? 'border-pex-gold bg-pex-gold/5 shadow-md' 
                          : 'border-gray-100 hover:border-pex-gold/30'
                      }`}
                    >
                      {selectedVehicleIdx === i && (
                        <div className="absolute top-2 right-2 text-pex-gold">
                          <CheckCircle2 size={16} />
                        </div>
                      )}
                      <div className="text-xs uppercase tracking-widest text-gray-400 mb-1">{vt.name}</div>
                      <div className="font-bold text-pex-blue mb-2">
                        {vt.description || vt.name}
                      </div>
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        <Users size={12} /> {vt.capacity} Pax
                      </div>
                      <div className="mt-4 text-lg font-light text-pex-gold">
                        €{(vt.base_price * vt.multiplier).toFixed(2)}
                      </div>
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Preferences */}
            <Card className="shadow-xl border-none overflow-hidden">
              <CardHeader className="bg-white border-b border-gray-100">
                <CardTitle className="text-lg font-medium text-pex-blue flex items-center gap-2">
                  <Shield size={20} className="text-pex-gold" />
                  Ride Preferences
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label className="text-sm font-medium text-pex-blue">Silent Mode</Label>
                        <p className="text-xs text-gray-400 italic">No conversation unless requested</p>
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
                        {['one-way', 'round-trip'].map((type) => (
                          <button
                            key={type}
                            onClick={() => setTripType(type)}
                            className={`px-4 py-2 rounded-lg text-xs font-medium transition-all ${
                              tripType === type 
                                ? 'bg-pex-blue text-white shadow-md' 
                                : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                            }`}
                          >
                            {type === 'one-way' ? 'One Way' : 'Round Trip'}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-pex-blue">Ambient Music</Label>
                      <select 
                        className="w-full h-10 rounded-lg border-none bg-gray-100 px-3 text-xs focus:ring-1 focus:ring-pex-gold outline-none"
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
          <div className="space-y-6">
            <Card className="shadow-xl border-none overflow-hidden sticky top-24">
              <CardHeader className="bg-pex-blue text-white">
                <CardTitle className="text-lg font-light tracking-widest uppercase">Summary</CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-6">
                <div className="space-y-4">
                  <div className="flex justify-between items-start">
                    <div className="space-y-1">
                      <p className="text-[10px] uppercase tracking-widest text-gray-400">Vehicle</p>
                      <p className="font-bold text-pex-blue">{selectedVehicle.name === 'Business' ? 'Mercedes S-Class' : selectedVehicle.name === 'SUV' ? 'Range Rover' : 'Mercedes V-Class'}</p>
                    </div>
                    <Badge variant="outline" className="text-[10px] border-pex-gold text-pex-gold">{selectedVehicle.name}</Badge>
                  </div>

                  <div className="space-y-2">
                    <p className="text-[10px] uppercase tracking-widest text-gray-400">Route Details</p>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm text-pex-blue">
                        <div className="w-2 h-2 rounded-full bg-pex-gold" />
                        <span className="truncate">{pickup || 'Not selected'}</span>
                      </div>
                      <div className="w-px h-4 bg-gray-200 ml-1" />
                      <div className="flex items-center gap-2 text-sm text-pex-blue">
                        <div className="w-2 h-2 rounded-full bg-pex-blue" />
                        <span className="truncate">{dropoff || 'Not selected'}</span>
                      </div>
                    </div>
                    {distance !== null ? (
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
                      <div className="mt-2 text-[10px] text-gray-400 italic uppercase tracking-widest">
                        Distance will be calculated upon booking
                      </div>
                    )}
                  </div>

                    <div className="pt-4 border-t border-gray-100">
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

                <p className="text-[10px] text-center text-gray-400 mt-4">
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

      {/* Success Dialog */}
      <Dialog open={bookingSuccess} onOpenChange={setBookingSuccess}>
        <DialogContent className="sm:max-w-[400px] text-center p-12">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 size={40} className="text-green-600" />
          </div>
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-pex-blue mb-2">Booking Confirmed!</DialogTitle>
            <DialogDescription className="text-gray-500">
              Your chauffeur has been notified and is preparing for your journey. You can track your ride in the dashboard.
            </DialogDescription>
          </DialogHeader>
          <div className="mt-8">
            <Button className="w-full bg-pex-blue text-white h-12" onClick={() => navigate('/')}>
              Return to Home
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

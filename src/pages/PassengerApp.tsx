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
import { MapPin, Clock, Star, Music, Thermometer, VolumeX, Crown, Navigation, CheckCircle2, ChevronLeft, ChevronRight, User, AlertCircle, MessageCircle, Send, X, Search, RefreshCw, CreditCard, History } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { motion, AnimatePresence } from 'motion/react';
import { useFirebase } from '../FirebaseProvider';
import { socket } from '../lib/socket';

export default function PassengerApp() {
  const { user, signIn } = useFirebase();
  const [tripType, setTripType] = useState('experience');
  const [silentMode, setSilentMode] = useState(false);
  const [temperature, setTemperature] = useState([22]);
  const [selectedPlaylist, setSelectedPlaylist] = useState('Lounge & Jazz');
  const [selectedVehicleIdx, setSelectedVehicleIdx] = useState(0);
  const [showSummary, setShowSummary] = useState(false);
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [bookingStatus, setBookingStatus] = useState<'idle' | 'booking' | 'success' | 'error'>('idle');
  const [pois, setPois] = useState<any[]>([]);
  const [vehicleTypes, setVehicleTypes] = useState<any[]>([]);
  const [selectedPois, setSelectedPois] = useState<string[]>([]);
  const [globalSettings, setGlobalSettings] = useState({ normal_price_per_km: 1.5, base_fare: 5.0 });
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
  const [poiSearch, setPoiSearch] = useState('');
  const [isRefreshingPois, setIsRefreshingPois] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [pickupSuggestions, setPickupSuggestions] = useState<string[]>([]);
  const [dropoffSuggestions, setDropoffSuggestions] = useState<string[]>([]);
  const addNotification = (message: string, type: 'success' | 'warning' | 'info' | 'error' = 'info') => {
    const id = Date.now().toString();
    setNotifications(prev => [{ id, message, type }, ...prev]);
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id));
    }, 5000);
  };

  const fetchPois = async () => {
    setIsRefreshingPois(true);
    try {
      const res = await fetch('/api/pois');
      const data = await res.json();
      setPois(data.filter((p: any) => p.status === 'Active'));
    } catch (err) {
      console.error('Error fetching POIs:', err);
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
    basePrice: vt.base_price,
    multiplier: vt.multiplier,
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

    // Join chat room
    socket.emit('join:chat', user.uid);

    // Fetch messages
    fetch(`/api/chats/${user.uid}/messages`)
      .then(res => res.json())
      .then(data => {
        setMessages(data);
        setTimeout(() => {
          if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
          }
        }, 100);
      })
      .catch(err => console.error('Error fetching messages:', err));

    // Listen for new messages
    const handleNewMessage = (message: any) => {
      if (message.chat_id === user.uid) {
        setMessages(prev => [...prev, message]);
        
        // Mark as read if we are the recipient
        if (message.sender_id !== user.uid) {
          fetch(`/api/chats/${user.uid}/read`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId: user.uid }),
          });
        }

        setTimeout(() => {
          if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
          }
        }, 100);
      }
    };

    const handleChatRead = (data: { chatId: string, userId: string }) => {
      if (data.chatId === user.uid) {
        setMessages(prev => prev.map(m => m.sender_id === data.userId ? m : { ...m, read_at: m.read_at || new Date().toISOString() }));
      }
    };

    socket.on('chat:message', handleNewMessage);
    socket.on('chat:read', handleChatRead);
    
    socket.on('chat:typing', (data: { chatId: string, isTyping: boolean }) => {
      if (data.chatId === user?.uid) {
        setIsTyping(data.isTyping);
        
        // Auto-clear typing status after 3 seconds if no new event
        if (data.isTyping) {
          if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
          typingTimeoutRef.current = setTimeout(() => {
            setIsTyping(false);
          }, 3000);
        }
      }
    });

    // Fetch POIs
    fetch('/api/pois')
      .then(res => res.json())
      .then(data => setPois(data.filter((p: any) => p.status === 'Active')))
      .catch(err => console.error('Error fetching POIs:', err));

    // Fetch Global Settings
    fetch('/api/settings/pricing')
      .then(res => res.json())
      .then(data => {
        if (!data.error) setGlobalSettings(data);
      })
      .catch(err => console.error('Error fetching settings:', err));

    // Fetch Vehicle Types
    fetch('/api/vehicle-types')
      .then(res => res.json())
      .then(data => setVehicleTypes(data))
      .catch(err => console.error('Error fetching vehicle types:', err));

    // Fetch Ride History
    if (user) {
      fetch(`/api/rides?passengerId=${user.uid}`)
        .then(res => res.json())
        .then(data => setRideHistory(data))
        .catch(err => console.error('Error fetching ride history:', err));
    }

    return () => {
      socket.off('chat:message', handleNewMessage);
      socket.off('chat:read', handleChatRead);
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
      await fetch(`/api/chats/${user.uid}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          senderId: user.uid,
          senderName: user.displayName,
          text: newMessage,
        }),
      });
      setNewMessage('');
      handleTyping(false);
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  const handleTyping = (typing: boolean) => {
    if (user) {
      socket.emit('chat:typing', { chatId: user.uid, isTyping: typing });
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

  const selectedVehicle = vehiclesToDisplay[selectedVehicleIdx];
  
  // Dynamic Price Calculation
  const estimatedDistance = 50; 
  const baseRidePrice = (selectedVehicle?.basePrice || globalSettings.base_fare) + (estimatedDistance * globalSettings.normal_price_per_km);
  
  const poiCost = selectedPois.reduce((sum, id) => {
    const poi = pois.find(p => p.id === id);
    const price = poi ? (tripType === 'experience' ? parseFloat(poi.tour_price) : parseFloat(poi.price)) : 0;
    return sum + price;
  }, 0);

  const vehicleMultiplier = selectedVehicle?.multiplier || 1.0;
  const totalPrice = Math.round((baseRidePrice + poiCost) * vehicleMultiplier);

  const handleNextVehicle = () => {
    setSelectedVehicleIdx((prev) => (prev + 1) % vehiclesToDisplay.length);
  };

  const handlePrevVehicle = () => {
    setSelectedVehicleIdx((prev) => (prev - 1 + vehiclesToDisplay.length) % vehiclesToDisplay.length);
  };

  const handleConfirmBooking = async () => {
    if (!user) {
      signIn();
      return;
    }

    setBookingStatus('booking');
    try {
      await fetch('/api/rides', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          passengerId: user.uid,
          passengerName: user.displayName,
          pickupLocation: pickup,
          dropoffLocation: dropoff,
          rideType: selectedVehicle.type,
          vehicleName: selectedVehicle.name,
          price: totalPrice,
          preferences: {
            silentMode,
            temperature: temperature[0],
            playlist: selectedPlaylist,
            selectedPois,
            tripType
          }
        }),
      });
      setBookingStatus('success');
      setIsBookingModalOpen(false);
    } catch (error) {
      console.error('Error booking ride:', error);
      setBookingStatus('error');
    }
  };

  const ADDRESS_SUGGESTIONS = [
    'Four Seasons Hotel Ritz, Lisbon', 'The Yeatman, Porto', 'Sintra National Palace, Sintra', 'Cascais Marina, Cascais', 'Algarve Luxury Resort, Faro', 'Lisbon Airport (LIS), Lisbon', 'Porto Airport (OPO), Porto', 'Avenida da Liberdade, Lisbon', 'Ribeira District, Porto', 'Torre de Belém, Lisbon', 'Benagil Cave, Algarve', 'University of Coimbra, Coimbra', 'Évora Roman Temple, Évora', 'Fatima Sanctuary, Fatima', 'Óbidos Medieval Village, Óbidos',
    'Eiffel Tower, Paris', 'Louvre Museum, Paris', 'Mont Saint-Michel, Normandy', 'Palace of Versailles, Versailles', 'Promenade des Anglais, Nice', 'Carcassonne Fortress, Carcassonne', 'Chamonix-Mont-Blanc, Alps', 'Verdon Gorge, Provence', 'Notre-Dame de Paris, Paris', 'Arc de Triomphe, Paris', 'Sacré-Cœur, Paris', 'Musée d\'Orsay, Paris',
    'Sagrada Família, Barcelona', 'Alhambra, Granada', 'Prado Museum, Madrid', 'Seville Cathedral, Seville', 'Park Güell, Barcelona', 'Guggenheim Museum, Bilbao', 'Santiago de Compostela Cathedral, Galicia', 'Toledo Old City, Toledo'
  ];

  const handlePickupChange = (val: string) => {
    setPickup(val);
    if (val.length > 2) {
      setPickupSuggestions(ADDRESS_SUGGESTIONS.filter(s => s.toLowerCase().includes(val.toLowerCase())));
    } else {
      setPickupSuggestions([]);
    }
  };

  const handleDropoffChange = (val: string) => {
    setDropoff(val);
    if (val.length > 2) {
      setDropoffSuggestions(ADDRESS_SUGGESTIONS.filter(s => s.toLowerCase().includes(val.toLowerCase())));
    } else {
      setDropoffSuggestions([]);
    }
  };

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

          <div className="bg-gray-50 p-4 rounded-xl flex justify-between items-center">
            <span className="text-gray-500 font-medium">Total Amount</span>
            <span className="text-2xl font-bold text-pex-blue">€{totalPrice}</span>
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
    <div className="flex-1 flex flex-col md:flex-row bg-gray-50 overflow-hidden">
      <div className="w-full md:w-[450px] bg-white shadow-xl z-10 flex flex-col h-full overflow-y-auto border-r border-gray-200">
        <div className="p-6 bg-pex-blue text-white">
          <div className="flex justify-between items-center mb-4">
            <h1 className="text-2xl font-light tracking-wide">Book a Ride</h1>
            <Badge variant="outline" className="text-pex-gold border-pex-gold bg-pex-blue">
              <Crown size={12} className="mr-1" /> PEX Priority
            </Badge>
          </div>
          
          <Tabs defaultValue="experience" className="w-full" onValueChange={setTripType}>
            <TabsList className="grid w-full grid-cols-3 bg-white/10 text-white">
              <TabsTrigger value="transfer" className="data-[state=active]:bg-pex-gold data-[state=active]:text-pex-blue">Quick Transfer</TabsTrigger>
              <TabsTrigger value="experience" className="data-[state=active]:bg-pex-gold data-[state=active]:text-pex-blue">Experience</TabsTrigger>
              <TabsTrigger value="history" className="data-[state=active]:bg-pex-gold data-[state=active]:text-pex-blue">History</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        <div className="p-6 flex-1 flex flex-col gap-6">
          {tripType === 'history' ? (
            <div className="space-y-4">
              <h3 className="font-semibold text-pex-blue uppercase tracking-wider text-sm">Your Journeys</h3>
              <ScrollArea className="h-[calc(100vh-300px)] pr-4">
                <div className="space-y-4">
                  {rideHistory.length === 0 ? (
                    <div className="text-center py-12 text-gray-400">
                      <History size={48} className="mx-auto mb-2 opacity-20" />
                      <p>No rides yet. Start your first journey!</p>
                    </div>
                  ) : (
                    rideHistory.map((ride) => (
                      <Card key={ride.id} className="border-gray-100 hover:border-pex-gold/30 transition-all">
                        <CardContent className="p-4">
                          <div className="flex justify-between items-start mb-3">
                            <div>
                              <Badge className={ride.status === 'completed' ? 'bg-green-100 text-green-800' : ride.status === 'cancelled' ? 'bg-red-100 text-red-800' : 'bg-pex-gold/10 text-pex-gold'}>
                                {ride.status.toUpperCase()}
                              </Badge>
                              <p className="text-[10px] text-gray-400 mt-1">
                                {new Date(ride.createdAt).toLocaleDateString()} • {new Date(ride.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </p>
                            </div>
                            <p className="font-bold text-pex-blue">€{ride.price}</p>
                          </div>
                          <div className="space-y-2 relative pl-4 border-l-2 border-dashed border-gray-100">
                            <div className="relative">
                              <div className="absolute -left-[21px] top-1 w-2 h-2 rounded-full bg-pex-blue" />
                              <p className="text-xs font-medium text-gray-700 truncate">{ride.pickupLocation}</p>
                            </div>
                            <div className="relative">
                              <div className="absolute -left-[21px] top-1 w-2 h-2 rounded-full bg-pex-gold" />
                              <p className="text-xs font-medium text-gray-700 truncate">{ride.dropoffLocation}</p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  )}
                </div>
              </ScrollArea>
            </div>
          ) : (
            <>
              <div className="space-y-4">
                <div className="flex items-center gap-3 relative">
                  <div className="w-2 h-2 rounded-full bg-pex-blue" />
                  <div className="flex-1 border-b border-gray-200 pb-2">
                    <p className="text-sm text-gray-500 uppercase tracking-wider">Pickup</p>
                    <Input value={pickup} onChange={(e) => handlePickupChange(e.target.value)} className="border-none p-0 h-auto font-medium focus-visible:ring-0 bg-transparent" />
                    {pickupSuggestions.length > 0 && (
                      <Card className="absolute top-full left-0 right-0 z-50 mt-1 shadow-xl border-gray-100">
                        <ScrollArea className="h-48">
                          {pickupSuggestions.map(s => (
                            <div key={s} className="p-3 hover:bg-gray-50 cursor-pointer text-sm border-b last:border-0" onClick={() => { setPickup(s); setPickupSuggestions([]); }}>{s}</div>
                          ))}
                        </ScrollArea>
                      </Card>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-3 relative">
                  <div className="w-2 h-2 rounded-full bg-pex-gold" />
                  <div className="flex-1 border-b border-gray-200 pb-2">
                    <p className="text-sm text-gray-500 uppercase tracking-wider">Dropoff</p>
                    <Input value={dropoff} onChange={(e) => handleDropoffChange(e.target.value)} className="border-none p-0 h-auto font-medium focus-visible:ring-0 bg-transparent" />
                    {dropoffSuggestions.length > 0 && (
                      <Card className="absolute top-full left-0 right-0 z-50 mt-1 shadow-xl border-gray-100">
                        <ScrollArea className="h-48">
                          {dropoffSuggestions.map(s => (
                            <div key={s} className="p-3 hover:bg-gray-50 cursor-pointer text-sm border-b last:border-0" onClick={() => { setDropoff(s); setDropoffSuggestions([]); }}>{s}</div>
                          ))}
                        </ScrollArea>
                      </Card>
                    )}
                  </div>
                </div>
              </div>

              {tripType === 'experience' && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-pex-blue uppercase tracking-wider text-sm">Curated Side Trips</h3>
                    <Button variant="ghost" size="icon" className={`h-8 w-8 rounded-full ${isRefreshingPois ? 'animate-spin' : ''}`} onClick={fetchPois} disabled={isRefreshingPois}><RefreshCw size={14} /></Button>
                  </div>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
                    <Input placeholder="Filter side trips..." className="pl-9 h-9 text-xs bg-gray-50 border-none focus-visible:ring-pex-gold" value={poiSearch} onChange={(e) => setPoiSearch(e.target.value)} />
                  </div>
                  <div className="grid gap-3">
                    {pois.filter(p => p.name.toLowerCase().includes(poiSearch.toLowerCase())).map((poi) => (
                      <Card key={poi.id} className={`cursor-pointer transition-all ${selectedPois.includes(poi.id) ? 'border-pex-gold bg-pex-gold/5 shadow-sm' : 'hover:bg-gray-50'}`} onClick={() => togglePoi(poi.id)}>
                        <CardContent className="p-4 flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-full ${selectedPois.includes(poi.id) ? 'bg-pex-gold/20' : 'bg-gray-100'}`}><MapPin size={18} className={selectedPois.includes(poi.id) ? 'text-pex-gold' : 'text-gray-500'} /></div>
                            <div>
                              <p className={`font-medium ${selectedPois.includes(poi.id) ? 'text-pex-blue' : 'text-gray-700'}`}>{poi.name}</p>
                              <p className="text-[10px] text-gray-500">{poi.duration} • Experience</p>
                            </div>
                          </div>
                          <div className="flex flex-col items-end gap-1">
                            <div className="flex items-center gap-2"><span className="text-[10px] text-gray-400">Normal:</span><span className="text-xs font-bold text-pex-blue">€{poi.price}</span></div>
                            <div className="flex items-center gap-2"><span className="text-[10px] text-gray-400">Tour:</span><span className="text-xs font-bold text-pex-gold">€{poi.tour_price}</span></div>
                            {selectedPois.includes(poi.id) && <CheckCircle2 size={16} className="text-pex-gold mt-1" />}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </motion.div>
              )}

              <div className="space-y-4 relative">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-pex-blue uppercase tracking-wider text-sm">Select Vehicle</h3>
                  <div className="flex gap-2">
                    <Button variant="outline" size="icon" className="h-8 w-8 rounded-full" onClick={handlePrevVehicle}><ChevronLeft size={16} /></Button>
                    <Button variant="outline" size="icon" className="h-8 w-8 rounded-full" onClick={handleNextVehicle}><ChevronRight size={16} /></Button>
                  </div>
                </div>
                <div className="relative overflow-hidden rounded-xl pb-2">
                  <motion.div className="flex" animate={{ x: `-${selectedVehicleIdx * 100}%` }} transition={{ type: 'spring', stiffness: 300, damping: 30 }}>
                    {vehiclesToDisplay.map((vehicle, idx) => (
                      <div key={vehicle.id} className="min-w-full px-1">
                        <Card className={`border-2 cursor-pointer transition-all duration-300 relative overflow-hidden ${selectedVehicleIdx === idx ? 'border-pex-blue shadow-md scale-100' : 'border-transparent opacity-70 scale-95 hover:opacity-100'}`} onClick={() => setSelectedVehicleIdx(idx)}>
                          <div className={`absolute top-0 right-0 text-white text-xs px-3 py-1 rounded-bl-lg z-10 ${selectedVehicleIdx === idx ? 'bg-pex-blue' : 'bg-gray-800'}`}>{vehicle.type}</div>
                          <CardContent className="p-4">
                            <div className="h-32 bg-gray-100 rounded-md mb-3 flex items-center justify-center overflow-hidden relative">
                              <img src={vehicle.image} alt={vehicle.name} className="object-cover w-full h-full" referrerPolicy="no-referrer" />
                            </div>
                            <h4 className="font-bold text-lg">{vehicle.name}</h4>
                            <p className="text-sm text-gray-500 mb-3">{vehicle.capacity}</p>
                            <div className="flex items-center justify-between">
                              <span className="font-bold text-xl">€{Math.round((baseRidePrice + poiCost) * vehicle.multiplier)}</span>
                              <div className="flex items-center gap-1 text-xs text-gray-500"><Star size={12} className="fill-pex-gold text-pex-gold" /><span>{vehicle.rating.toFixed(1)} (Vehicle)</span></div>
                            </div>
                          </CardContent>
                        </Card>
                      </div>
                    ))}
                  </motion.div>
                </div>
                {selectedVehicle && (
                  <AnimatePresence mode="wait">
                    <motion.div key={selectedVehicle.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }} className="bg-white border border-gray-100 p-4 rounded-xl shadow-sm flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full overflow-hidden bg-gray-200 border-2 border-pex-gold">
                        <img src={selectedVehicle.driver.photo} alt={selectedVehicle.driver.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold text-pex-blue">{selectedVehicle.driver.name}</h4>
                        <div className="flex items-center gap-2 text-xs text-gray-500"><span className="flex items-center gap-1"><Star size={12} className="fill-pex-gold text-pex-gold" /> {selectedVehicle.driver.rating}</span><span>•</span><span>{selectedVehicle.driver.trips} trips</span></div>
                      </div>
                      <Badge variant="secondary" className="bg-pex-gold/10 text-pex-gold">Chauffeur</Badge>
                    </motion.div>
                  </AnimatePresence>
                )}
              </div>

              <div className="space-y-4 bg-gray-50 p-4 rounded-xl border border-gray-100">
                <h3 className="font-semibold text-pex-blue uppercase tracking-wider text-sm flex items-center gap-2"><Crown size={16} className="text-pex-gold" />In-Car Preferences</h3>
                <div className="space-y-5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3"><VolumeX size={18} className="text-gray-500" /><Label htmlFor="silent-mode" className="text-sm font-medium">Silent Mode</Label></div>
                    <Switch id="silent-mode" checked={silentMode} onCheckedChange={setSilentMode} />
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between"><div className="flex items-center gap-3"><Thermometer size={18} className="text-gray-500" /><Label className="text-sm font-medium">Temperature</Label></div><span className="text-sm font-bold text-pex-blue">{temperature}°C</span></div>
                    <Slider defaultValue={[22]} max={28} min={18} step={1} value={temperature} onValueChange={setTemperature} className="w-full" />
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3"><Music size={18} className="text-gray-500" /><span className="text-sm font-medium">In-Car Playlist</span></div>
                    <div className="grid grid-cols-2 gap-2">
                      {['Lounge & Jazz', 'Classical', 'Modern Pop', 'Deep House'].map((p) => (
                        <Button key={p} variant="outline" size="sm" className={`text-[10px] h-8 ${selectedPlaylist === p ? 'border-pex-gold bg-pex-gold/5 text-pex-blue' : 'text-gray-500'}`} onClick={() => setSelectedPlaylist(p)}>{p}</Button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {showSummary ? (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="space-y-4 pt-4 border-t border-gray-100">
                  <div className="flex justify-between text-sm"><span className="text-gray-500">Vehicle</span><span className="font-medium">{selectedVehicle?.name} ({selectedVehicle?.type})</span></div>
                  <div className="flex justify-between text-sm"><span className="text-gray-500">Chauffeur</span><span className="font-medium">{selectedVehicle?.driver.name}</span></div>
                  <div className="flex justify-between text-sm font-bold pt-2 border-t"><span>Total</span><span className="text-pex-blue">€{totalPrice}</span></div>
                  <div className="flex gap-2 pt-4">
                    <Button variant="outline" className="flex-1" onClick={() => setShowSummary(false)} disabled={bookingStatus === 'booking'}>Back</Button>
                    <div className="flex-1 flex flex-col gap-2">
                      <Button className="w-full bg-pex-blue hover:bg-pex-blue/90 text-white" onClick={() => setIsBookingModalOpen(true)} disabled={bookingStatus === 'booking'}>{bookingStatus === 'booking' ? 'Processing...' : 'Confirm & Pay'}</Button>
                      <Button variant="outline" className="w-full border-pex-gold text-pex-blue hover:bg-pex-gold/10 flex items-center justify-center gap-2" onClick={() => setIsBookingModalOpen(true)}><CreditCard size={16} className="text-pex-gold" />Pay with Viva.com</Button>
                    </div>
                  </div>
                </motion.div>
              ) : (
                <>
                  <div className="flex justify-between items-center mb-4"><span className="text-gray-500">Total (Fixed Price)</span><span className="text-2xl font-bold text-pex-blue">€{totalPrice}</span></div>
                  <Button className="w-full bg-pex-blue hover:bg-pex-blue/90 text-white h-12 text-lg" onClick={() => { if (!user) { signIn(); } else { setShowSummary(true); } }}>{user ? 'Review Booking' : 'Login to Book'}</Button>
                </>
              )}
            </>
          )}
        </div>
      </div>

      <BookingConfirmationModal />

      <div className="hidden md:flex flex-1 relative bg-gray-200 items-center justify-center overflow-hidden">
        <div className="absolute inset-0 opacity-40" style={{ backgroundImage: 'url("https://images.unsplash.com/photo-1524661135-423995f22d0b?auto=format&fit=crop&q=80&w=2000&h=2000")', backgroundSize: 'cover', backgroundPosition: 'center' }} />
        <div className="relative z-10 text-center space-y-4 p-12 bg-white/80 backdrop-blur-md rounded-3xl shadow-2xl border border-white max-w-lg">
          <div className="w-20 h-20 bg-pex-blue rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg"><Navigation size={40} className="text-pex-gold animate-pulse" /></div>
          <h2 className="text-4xl font-light text-pex-blue tracking-tight">Premium Experience</h2>
          <p className="text-gray-600 leading-relaxed">Your exclusive chauffeur service across Portugal, Spain, and France. Luxury, comfort, and safety in every mile.</p>
          <div className="grid grid-cols-3 gap-4 pt-6">
            <div className="space-y-1"><p className="text-2xl font-bold text-pex-blue">500+</p><p className="text-[10px] uppercase tracking-widest text-gray-400 font-bold">Vehicles</p></div>
            <div className="space-y-1"><p className="text-2xl font-bold text-pex-blue">1.2k</p><p className="text-[10px] uppercase tracking-widest text-gray-400 font-bold">Chauffeurs</p></div>
            <div className="space-y-1"><p className="text-2xl font-bold text-pex-blue">50k+</p><p className="text-[10px] uppercase tracking-widest text-gray-400 font-bold">Rides</p></div>
          </div>
        </div>
      </div>

      {/* Chat Widget */}
      <div className="fixed bottom-6 right-6 z-50">
        <AnimatePresence>
          {isChatOpen && (
            <motion.div initial={{ opacity: 0, y: 20, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 20, scale: 0.95 }} className="absolute bottom-16 right-0 w-80 h-96 bg-white rounded-2xl shadow-2xl border border-gray-100 flex flex-col overflow-hidden">
              <div className="p-4 bg-pex-blue text-white flex justify-between items-center">
                <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" /><span className="font-medium">PEX Support</span></div>
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

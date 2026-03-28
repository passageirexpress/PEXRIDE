import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { MapPin, Clock, Star, Music, Thermometer, VolumeX, Crown, Navigation, CheckCircle2, ChevronLeft, ChevronRight, User, AlertCircle, MessageCircle, Send, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useFirebase } from '../FirebaseProvider';
import { socket } from '../lib/socket';

const VEHICLES = [
  {
    id: 'business',
    name: 'Mercedes S-Class',
    type: 'Business',
    capacity: '3 Pax • 2 Bags',
    price: 380,
    rating: 4.9,
    image: 'https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?auto=format&fit=crop&q=80&w=400&h=200',
    driver: {
      name: 'João Silva',
      rating: 4.9,
      trips: 1240,
      photo: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&q=80&w=150&h=150'
    }
  },
  {
    id: 'first-class',
    name: 'Mercedes V-Class',
    type: 'First Class',
    capacity: '6 Pax • 6 Bags',
    price: 450,
    rating: 5.0,
    image: 'https://images.unsplash.com/photo-1605559424843-9e4c228bf1c2?auto=format&fit=crop&q=80&w=400&h=200',
    driver: {
      name: 'Miguel Santos',
      rating: 5.0,
      trips: 850,
      photo: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=150&h=150'
    }
  }
];

export default function PassengerApp() {
  const { user, signIn } = useFirebase();
  const [tripType, setTripType] = useState('experience');
  const [silentMode, setSilentMode] = useState(false);
  const [temperature, setTemperature] = useState([22]);
  const [selectedVehicleIdx, setSelectedVehicleIdx] = useState(0);
  const [showSummary, setShowSummary] = useState(false);
  const [bookingStatus, setBookingStatus] = useState<'idle' | 'booking' | 'success' | 'error'>('idle');
  const [pois, setPois] = useState<any[]>([]);
  const [selectedPois, setSelectedPois] = useState<string[]>([]);
  
  // Chat States
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (!user || !isChatOpen) return;

    // Join the chat room
    socket.emit('join:chat', user.uid);

    // Fetch initial messages
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
        setTimeout(() => {
          if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
          }
        }, 100);
      }
    };

    socket.on('chat:message', handleNewMessage);
    
    socket.on('chat:typing', (data: { chatId: string, isTyping: boolean }) => {
      if (data.chatId === user?.uid) {
        setIsTyping(data.isTyping);
      }
    });

    // Fetch POIs
    fetch('/api/pois')
      .then(res => res.json())
      .then(data => setPois(data.filter((p: any) => p.status === 'Active')))
      .catch(err => console.error('Error fetching POIs:', err));

    return () => {
      socket.off('chat:message', handleNewMessage);
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

  const selectedVehicle = VEHICLES[selectedVehicleIdx];
  const poiCost = selectedPois.reduce((sum, id) => {
    const poi = pois.find(p => p.id === id);
    return sum + (poi ? parseFloat(poi.price) : 0);
  }, 0);
  const totalPrice = selectedVehicle.price + (tripType === 'experience' ? poiCost : 0);

  const handleNextVehicle = () => {
    setSelectedVehicleIdx((prev) => (prev + 1) % VEHICLES.length);
  };

  const handlePrevVehicle = () => {
    setSelectedVehicleIdx((prev) => (prev - 1 + VEHICLES.length) % VEHICLES.length);
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
          pickupLocation: 'Four Seasons Hotel Ritz, Lisbon',
          dropoffLocation: 'The Yeatman, Porto',
          rideType: selectedVehicle.type,
          vehicleName: selectedVehicle.name,
          price: totalPrice,
          preferences: {
            silentMode,
            temperature: temperature[0],
            tripType
          }
        }),
      });
      setBookingStatus('success');
    } catch (error) {
      console.error('Error booking ride:', error);
      setBookingStatus('error');
    }
  };

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
              <span className="font-bold">{selectedVehicle.name}</span>
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
      {/* Left Panel - Booking & Options */}
      <div className="w-full md:w-[450px] bg-white shadow-xl z-10 flex flex-col h-full overflow-y-auto border-r border-gray-200">
        <div className="p-6 bg-pex-blue text-white">
          <div className="flex justify-between items-center mb-4">
            <h1 className="text-2xl font-light tracking-wide">Book a Ride</h1>
            <Badge variant="outline" className="text-pex-gold border-pex-gold bg-pex-blue">
              <Crown size={12} className="mr-1" /> PEX Priority
            </Badge>
          </div>
          
          <Tabs defaultValue="experience" className="w-full" onValueChange={setTripType}>
            <TabsList className="grid w-full grid-cols-2 bg-white/10 text-white">
              <TabsTrigger value="transfer" className="data-[state=active]:bg-pex-gold data-[state=active]:text-pex-blue">
                Quick Transfer
              </TabsTrigger>
              <TabsTrigger value="experience" className="data-[state=active]:bg-pex-gold data-[state=active]:text-pex-blue">
                Experience
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        <div className="p-6 flex-1 flex flex-col gap-6">
          {/* Route Selection */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-pex-blue" />
              <div className="flex-1 border-b border-gray-200 pb-2">
                <p className="text-sm text-gray-500 uppercase tracking-wider">Pickup</p>
                <p className="font-medium">Four Seasons Hotel Ritz, Lisbon</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-pex-gold" />
              <div className="flex-1 border-b border-gray-200 pb-2">
                <p className="text-sm text-gray-500 uppercase tracking-wider">Dropoff</p>
                <p className="font-medium">The Yeatman, Porto</p>
              </div>
            </div>
          </div>

          {/* Experience Specifics */}
          {tripType === 'experience' && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-4"
            >
              <h3 className="font-semibold text-pex-blue uppercase tracking-wider text-sm">Curated Side Trips</h3>
              <div className="grid gap-3">
                {pois.length === 0 ? (
                  <p className="text-xs text-gray-400 italic">No side trips available at the moment.</p>
                ) : (
                  pois.map((poi) => (
                    <Card 
                      key={poi.id}
                      className={`cursor-pointer transition-all ${selectedPois.includes(poi.id) ? 'border-pex-gold bg-pex-gold/5 shadow-sm' : 'hover:bg-gray-50'}`}
                      onClick={() => togglePoi(poi.id)}
                    >
                      <CardContent className="p-4 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-full ${selectedPois.includes(poi.id) ? 'bg-pex-gold/20' : 'bg-gray-100'}`}>
                            <MapPin size={18} className={selectedPois.includes(poi.id) ? 'text-pex-gold' : 'text-gray-500'} />
                          </div>
                          <div>
                            <p className={`font-medium ${selectedPois.includes(poi.id) ? 'text-pex-blue' : 'text-gray-700'}`}>{poi.name}</p>
                            <p className="text-xs text-gray-500">{poi.duration} • Experience</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-pex-blue">€{poi.price}</span>
                          {selectedPois.includes(poi.id) && <CheckCircle2 size={20} className="text-pex-gold" />}
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </motion.div>
          )}

          {/* Fleet Selector */}
          <div className="space-y-4 relative">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-pex-blue uppercase tracking-wider text-sm">Select Vehicle</h3>
              <div className="flex gap-2">
                <Button variant="outline" size="icon" className="h-8 w-8 rounded-full" onClick={handlePrevVehicle}>
                  <ChevronLeft size={16} />
                </Button>
                <Button variant="outline" size="icon" className="h-8 w-8 rounded-full" onClick={handleNextVehicle}>
                  <ChevronRight size={16} />
                </Button>
              </div>
            </div>
            
            <div className="relative overflow-hidden rounded-xl pb-2">
              <motion.div 
                className="flex"
                animate={{ x: `-${selectedVehicleIdx * 100}%` }}
                transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              >
                {VEHICLES.map((vehicle, idx) => (
                  <div key={vehicle.id} className="min-w-full px-1">
                    <Card 
                      className={`border-2 cursor-pointer transition-all duration-300 relative overflow-hidden ${selectedVehicleIdx === idx ? 'border-pex-blue shadow-md scale-100' : 'border-transparent opacity-70 scale-95 hover:opacity-100'}`}
                      onClick={() => setSelectedVehicleIdx(idx)}
                    >
                      <div className={`absolute top-0 right-0 text-white text-xs px-3 py-1 rounded-bl-lg z-10 ${selectedVehicleIdx === idx ? 'bg-pex-blue' : 'bg-gray-800'}`}>
                        {vehicle.type}
                      </div>
                      <CardContent className="p-4">
                        <div className="h-32 bg-gray-100 rounded-md mb-3 flex items-center justify-center overflow-hidden relative">
                          <img src={vehicle.image} alt={vehicle.name} className="object-cover w-full h-full" referrerPolicy="no-referrer" />
                        </div>
                        <h4 className="font-bold text-lg">{vehicle.name}</h4>
                        <p className="text-sm text-gray-500 mb-3">{vehicle.capacity}</p>
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-xl">€{vehicle.price}</span>
                          <div className="flex items-center gap-1 text-xs text-gray-500">
                            <Star size={12} className="fill-pex-gold text-pex-gold" />
                            <span>{vehicle.rating} (Vehicle)</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                ))}
              </motion.div>
            </div>

            {/* Driver Info */}
            <AnimatePresence mode="wait">
              <motion.div 
                key={selectedVehicle.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="bg-white border border-gray-100 p-4 rounded-xl shadow-sm flex items-center gap-4"
              >
                <div className="w-12 h-12 rounded-full overflow-hidden bg-gray-200 border-2 border-pex-gold">
                  <img src={selectedVehicle.driver.photo} alt={selectedVehicle.driver.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-pex-blue">{selectedVehicle.driver.name}</h4>
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <span className="flex items-center gap-1"><Star size={12} className="fill-pex-gold text-pex-gold" /> {selectedVehicle.driver.rating}</span>
                    <span>•</span>
                    <span>{selectedVehicle.driver.trips} trips</span>
                  </div>
                </div>
                <Badge variant="secondary" className="bg-pex-gold/10 text-pex-gold">Chauffeur</Badge>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* In-Car Personalization */}
          <div className="space-y-4 bg-gray-50 p-4 rounded-xl border border-gray-100">
            <h3 className="font-semibold text-pex-blue uppercase tracking-wider text-sm flex items-center gap-2">
              <Crown size={16} className="text-pex-gold" />
              In-Car Preferences
            </h3>
            
            <div className="space-y-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <VolumeX size={18} className="text-gray-500" />
                  <Label htmlFor="silent-mode" className="text-sm font-medium">Silent Mode</Label>
                </div>
                <Switch id="silent-mode" checked={silentMode} onCheckedChange={setSilentMode} />
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Thermometer size={18} className="text-gray-500" />
                    <Label className="text-sm font-medium">Temperature</Label>
                  </div>
                  <span className="text-sm font-bold text-pex-blue">{temperature}°C</span>
                </div>
                <Slider 
                  defaultValue={[22]} 
                  max={28} 
                  min={18} 
                  step={1} 
                  value={temperature}
                  onValueChange={setTemperature}
                  className="w-full"
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Music size={18} className="text-gray-500" />
                  <Label className="text-sm font-medium">Playlist</Label>
                </div>
                <Badge variant="secondary" className="bg-green-100 text-green-800 hover:bg-green-200 cursor-pointer">
                  Jazz & Blues
                </Badge>
              </div>
            </div>
          </div>
        </div>

        <div className="p-6 bg-white border-t border-gray-200 mt-auto">
          {showSummary ? (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="mb-4 space-y-3 bg-gray-50 p-4 rounded-lg border border-gray-100">
              <h4 className="font-semibold text-pex-blue border-b pb-2">Trip Summary</h4>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Ride Type</span>
                <span className="font-medium">{tripType === 'experience' ? 'Experience (with side trips)' : 'Quick Transfer'}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Vehicle</span>
                <span className="font-medium">{selectedVehicle.name} ({selectedVehicle.type})</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Chauffeur</span>
                <span className="font-medium">{selectedVehicle.driver.name}</span>
              </div>
              <div className="flex justify-between text-sm font-bold pt-2 border-t">
                <span>Total</span>
                <span className="text-pex-blue">€{totalPrice}</span>
              </div>
              {bookingStatus === 'error' && (
                <div className="flex items-center gap-2 text-red-600 text-xs bg-red-50 p-2 rounded">
                  <AlertCircle size={14} />
                  <span>Error processing booking. Please try again.</span>
                </div>
              )}
              <div className="flex gap-2 pt-4">
                <Button variant="outline" className="flex-1" onClick={() => setShowSummary(false)} disabled={bookingStatus === 'booking'}>Back</Button>
                <Button 
                  className="flex-1 bg-pex-blue hover:bg-pex-blue/90 text-white" 
                  onClick={handleConfirmBooking}
                  disabled={bookingStatus === 'booking'}
                >
                  {bookingStatus === 'booking' ? 'Processing...' : 'Confirm & Pay'}
                </Button>
              </div>
            </motion.div>
          ) : (
            <>
              <div className="flex justify-between items-center mb-4">
                <span className="text-gray-500">Total (Fixed Price)</span>
                <span className="text-2xl font-bold text-pex-blue">€{totalPrice}</span>
              </div>
              <Button 
                className="w-full bg-pex-blue hover:bg-pex-blue/90 text-white h-12 text-lg"
                onClick={() => {
                  if (!user) {
                    signIn();
                  } else {
                    setShowSummary(true);
                  }
                }}
              >
                {user ? 'Review Booking' : 'Login to Book'}
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Right Panel - Visual Route Builder (Map Mockup) */}
      <div className="hidden md:flex flex-1 relative bg-gray-200 items-center justify-center overflow-hidden">
        {/* Simulated Map Background */}
        <div className="absolute inset-0 opacity-40" style={{
          backgroundImage: 'url("https://images.unsplash.com/photo-1524661135-423995f22d0b?auto=format&fit=crop&q=80&w=2000&h=2000")',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          filter: 'grayscale(100%) contrast(120%)'
        }} />
        
        {/* Map Overlay for "Quiet Luxury" feel */}
        <div className="absolute inset-0 bg-pex-blue/10 mix-blend-multiply" />

        {/* Route Visualization */}
        <div className="relative z-10 w-full max-w-2xl p-8">
          <div className="relative h-[400px] w-full">
            {/* Route Line */}
            <svg className="absolute inset-0 w-full h-full" style={{ overflow: 'visible' }}>
              <path 
                d="M 100,350 C 200,300 300,100 500,50" 
                fill="none" 
                stroke="#0A1128" 
                strokeWidth="4" 
                strokeDasharray="8 8" 
                className="opacity-50"
              />
              <path 
                d="M 100,350 C 150,320 180,250 250,200 C 320,150 400,100 500,50" 
                fill="none" 
                stroke="#D4AF37" 
                strokeWidth="6" 
                className="drop-shadow-md"
              />
            </svg>

            {/* Points */}
            <motion.div 
              initial={{ scale: 0 }} animate={{ scale: 1 }}
              className="absolute left-[100px] top-[350px] -translate-x-1/2 -translate-y-1/2 flex flex-col items-center"
            >
              <div className="w-6 h-6 rounded-full bg-pex-blue border-4 border-white shadow-lg z-10" />
              <div className="mt-2 bg-white px-3 py-1 rounded-md shadow-md text-sm font-bold whitespace-nowrap">Lisbon</div>
            </motion.div>

            {tripType === 'experience' && (
              <motion.div 
                initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.2 }}
                className="absolute left-[250px] top-[200px] -translate-x-1/2 -translate-y-1/2 flex flex-col items-center cursor-pointer group"
              >
                <div className="w-8 h-8 rounded-full bg-pex-gold border-4 border-white shadow-lg z-10 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Star size={14} className="text-white fill-white" />
                </div>
                <div className="mt-2 bg-pex-blue text-white px-3 py-1 rounded-md shadow-md text-sm font-bold whitespace-nowrap">
                  Óbidos
                </div>
              </motion.div>
            )}

            <motion.div 
              initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.4 }}
              className="absolute left-[500px] top-[50px] -translate-x-1/2 -translate-y-1/2 flex flex-col items-center"
            >
              <div className="w-6 h-6 rounded-full bg-pex-blue border-4 border-white shadow-lg z-10" />
              <div className="mt-2 bg-white px-3 py-1 rounded-md shadow-md text-sm font-bold whitespace-nowrap">Porto</div>
            </motion.div>
          </div>
        </div>

        {/* Floating Info */}
        <div className="absolute bottom-8 right-8 bg-white/90 backdrop-blur-md p-4 rounded-xl shadow-xl border border-white/20">
          <div className="flex items-center gap-4">
            <div className="bg-pex-blue/10 p-3 rounded-full">
              <Navigation className="text-pex-blue" size={24} />
            </div>
            <div>
              <p className="text-sm text-gray-500 uppercase tracking-wider font-semibold">Est. Duration</p>
              <p className="text-2xl font-bold text-pex-blue">
                {tripType === 'experience' ? '4h 30m' : '3h 00m'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Support Chat Overlay */}
      <div className="fixed bottom-6 right-6 z-50">
        <AnimatePresence>
          {isChatOpen && (
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.95 }}
              className="bg-white rounded-2xl shadow-2xl w-80 md:w-96 border border-gray-200 flex flex-col mb-4 overflow-hidden"
              style={{ height: '450px' }}
            >
              <div className="bg-pex-blue p-4 text-white flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                  <span className="font-semibold">PEX Support</span>
                </div>
                <Button variant="ghost" size="icon" className="text-white hover:bg-white/10 h-8 w-8" onClick={() => setIsChatOpen(false)}>
                  <X size={18} />
                </Button>
              </div>

              <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
                {messages.length === 0 ? (
                  <div className="text-center py-10 text-gray-400">
                    <MessageCircle size={32} className="mx-auto mb-2 opacity-20" />
                    <p className="text-sm">How can we help you today?</p>
                  </div>
                ) : (
                  messages.map((msg) => (
                    <div key={msg.id} className={`flex ${msg.sender_id === user?.uid ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[80%] p-3 rounded-2xl text-sm ${msg.sender_id === user?.uid ? 'bg-pex-blue text-white rounded-tr-none' : 'bg-white text-gray-800 shadow-sm border border-gray-100 rounded-tl-none'}`}>
                        {msg.text}
                        <div className={`flex items-center justify-between gap-4 mt-1 ${msg.sender_id === user?.uid ? 'text-white/60' : 'text-gray-400'}`}>
                          <p className="text-[10px]">
                            {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </p>
                          {msg.sender_id === user?.uid && (
                            <CheckCircle2 size={10} className="text-pex-gold" />
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                )}
                {isTyping && (
                  <div className="flex justify-start">
                    <div className="bg-white text-gray-400 p-2 rounded-2xl rounded-tl-none shadow-sm text-[10px] italic flex items-center gap-2 border border-gray-100">
                      <div className="flex gap-1">
                        <span className="w-1 h-1 bg-gray-300 rounded-full animate-bounce" />
                        <span className="w-1 h-1 bg-gray-300 rounded-full animate-bounce [animation-delay:0.2s]" />
                        <span className="w-1 h-1 bg-gray-300 rounded-full animate-bounce [animation-delay:0.4s]" />
                      </div>
                      Support is typing...
                    </div>
                  </div>
                )}
              </div>

              <form onSubmit={handleSendMessage} className="p-4 border-t bg-white flex gap-2">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => {
                    setNewMessage(e.target.value);
                    handleTyping(e.target.value.length > 0);
                  }}
                  onBlur={() => handleTyping(false)}
                  placeholder="Type your message..."
                  className="flex-1 bg-gray-100 border-none rounded-full px-4 py-2 text-sm focus:ring-2 focus:ring-pex-blue/20 outline-none"
                />
                <Button type="submit" size="icon" className="bg-pex-blue hover:bg-pex-blue/90 text-white rounded-full h-9 w-9 shrink-0">
                  <Send size={16} />
                </Button>
              </form>
            </motion.div>
          )}
        </AnimatePresence>

        <Button
          onClick={() => {
            if (!user) {
              signIn();
            } else {
              setIsChatOpen(!isChatOpen);
            }
          }}
          className="w-14 h-14 rounded-full bg-pex-blue hover:bg-pex-blue/90 text-white shadow-2xl flex items-center justify-center p-0"
        >
          {isChatOpen ? <X size={24} /> : <MessageCircle size={24} />}
        </Button>
      </div>
    </div>
  );
}

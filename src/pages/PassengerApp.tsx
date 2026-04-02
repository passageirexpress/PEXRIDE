import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";
import { MapPin, Clock, Car, Navigation, CheckCircle2, User, AlertCircle, MessageSquare, MessageCircle } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { motion, AnimatePresence } from 'motion/react';
import { useFirebase } from '../FirebaseProvider';
import { useNavigate } from 'react-router-dom';
import { ADDRESS_SUGGESTIONS } from '../constants';
import Chat from '../components/Chat';

export default function PassengerApp() {
  const { user } = useFirebase();
  const navigate = useNavigate();
  const [activeRide, setActiveRide] = useState<any | null>(null);
  
  // Chat States
  const [isChatOpen, setIsChatOpen] = useState(false);

  const [notifications, setNotifications] = useState<any[]>([]);
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
  const [tours, setTours] = useState<any[]>([]);

  useEffect(() => {
    import('firebase/firestore').then(({ collection, onSnapshot, getFirestore }) => {
      const db = getFirestore();
      const unsubTours = onSnapshot(collection(db, 'tours'), (snapshot) => {
        setTours(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      });
      return () => unsubTours();
    });
  }, []);

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
    navigate('/book', {
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

  return (
    <div className="flex-1 flex flex-col bg-gray-50 overflow-x-hidden relative min-h-screen">
      {/* Mobile App Style Booking Interface */}
      <div className="flex-1 flex flex-col relative max-w-md mx-auto w-full bg-white shadow-2xl min-h-screen">
        
        {/* Header */}
        <div className="bg-pex-blue text-white px-6 py-8 rounded-b-[2.5rem] shadow-lg relative z-10">
          <div className="flex justify-between items-center mb-6">
            <div className="w-10 h-10 rounded-full bg-pex-gold flex items-center justify-center">
              <span className="text-pex-blue font-bold text-sm">PR</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-sm font-medium">{user?.displayName || 'Guest'}</span>
              <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center">
                <User size={18} className="text-white" />
              </div>
            </div>
          </div>
          <h1 className="text-3xl font-light tracking-tight">Where would you <br/><span className="font-bold">like to go?</span></h1>
        </div>

        {/* Booking Widget */}
        <div className="flex-1 px-6 pt-6 pb-24 -mt-6 relative z-20">
          <Card className="bg-white rounded-3xl shadow-xl border-0 overflow-hidden">
            <div className="flex border-b border-gray-100">
              <button 
                className={`flex-1 py-4 text-xs sm:text-sm font-bold transition-colors ${widgetTripType === 'one-way' ? 'text-pex-blue border-b-2 border-pex-gold' : 'text-gray-400 hover:text-gray-700'}`}
                onClick={() => setWidgetTripType('one-way')}
              >
                ONE WAY
              </button>
              <button 
                className={`flex-1 py-4 text-xs sm:text-sm font-bold transition-colors ${widgetTripType === 'hourly' ? 'text-pex-blue border-b-2 border-pex-gold' : 'text-gray-400 hover:text-gray-700'}`}
                onClick={() => setWidgetTripType('hourly')}
              >
                BY THE HOUR
              </button>
              <button 
                className={`flex-1 py-4 text-xs sm:text-sm font-bold transition-colors ${widgetTripType === 'tour' ? 'text-pex-blue border-b-2 border-pex-gold' : 'text-gray-400 hover:text-gray-700'}`}
                onClick={() => setWidgetTripType('tour')}
              >
                TOUR
              </button>
            </div>
            
            <CardContent className="p-6 space-y-5">
              <div className="relative space-y-5">
                {/* Timeline line */}
                <div className="absolute left-3.5 top-5 bottom-5 w-0.5 bg-gray-100 z-0"></div>
                
                <div className="relative z-10 flex items-center gap-4">
                  <div className="w-7 h-7 rounded-full bg-pex-blue/10 flex items-center justify-center flex-shrink-0">
                    <div className="w-2 h-2 rounded-full bg-pex-blue"></div>
                  </div>
                  <div className="flex-1 relative">
                    <Input 
                      placeholder="Pick-up location" 
                      className="h-14 bg-gray-50 border-transparent focus-visible:ring-pex-gold text-gray-900 text-base rounded-xl font-medium truncate pr-4"
                      value={widgetPickup}
                      onChange={(e) => setWidgetPickup(e.target.value)}
                    />
                    <AnimatePresence>
                      {widgetPickupSuggestions.length > 0 && (
                        <motion.div 
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          className="absolute z-[100] w-full mt-2 bg-white border border-gray-100 rounded-xl shadow-2xl overflow-hidden"
                        >
                          {widgetPickupSuggestions.map((s, i) => (
                            <button 
                              key={i}
                              className="w-full text-left px-5 py-4 text-sm hover:bg-gray-50 transition-colors border-b border-gray-50 last:border-none text-gray-900 font-medium truncate"
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
                  <div className="relative z-10 flex items-center gap-4">
                    <div className="w-7 h-7 rounded-full bg-pex-gold/20 flex items-center justify-center flex-shrink-0">
                      <MapPin size={14} className="text-pex-gold" />
                    </div>
                    <div className="flex-1 relative">
                      <Input 
                        placeholder="Drop-off location" 
                        className="h-14 bg-gray-50 border-transparent focus-visible:ring-pex-gold text-gray-900 text-base rounded-xl font-medium truncate pr-4"
                        value={widgetDropoff}
                        onChange={(e) => setWidgetDropoff(e.target.value)}
                      />
                      <AnimatePresence>
                        {widgetDropoffSuggestions.length > 0 && (
                          <motion.div 
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="absolute z-[100] w-full mt-2 bg-white border border-gray-100 rounded-xl shadow-2xl overflow-hidden"
                          >
                            {widgetDropoffSuggestions.map((s, i) => (
                              <button 
                                key={i}
                                className="w-full text-left px-5 py-4 text-sm hover:bg-gray-50 transition-colors border-b border-gray-50 last:border-none text-gray-900 font-medium truncate"
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
                ) : widgetTripType === 'hourly' ? (
                  <div className="relative z-10 flex items-center gap-4">
                    <div className="w-7 h-7 rounded-full bg-pex-gold/20 flex items-center justify-center flex-shrink-0">
                      <Clock size={14} className="text-pex-gold" />
                    </div>
                    <select 
                      className="flex h-14 w-full items-center justify-between rounded-xl border-transparent bg-gray-50 px-4 py-2 text-base font-medium text-gray-900 focus:outline-none focus:ring-2 focus:ring-pex-gold"
                      value={widgetDuration}
                      onChange={(e) => setWidgetDuration(e.target.value)}
                    >
                      {[2, 3, 4, 5, 6, 8, 10, 12, 24].map(h => (
                        <option key={h} value={h}>{h} hours</option>
                      ))}
                    </select>
                  </div>
                ) : (
                  <div className="relative z-10 flex items-center gap-4">
                    <div className="w-7 h-7 rounded-full bg-pex-gold/20 flex items-center justify-center flex-shrink-0">
                      <MapPin size={14} className="text-pex-gold" />
                    </div>
                    <select 
                      className="flex h-14 w-full items-center justify-between rounded-xl border-transparent bg-gray-50 px-4 py-2 text-base font-medium text-gray-900 focus:outline-none focus:ring-2 focus:ring-pex-gold truncate"
                      value={widgetDropoff}
                      onChange={(e) => setWidgetDropoff(e.target.value)}
                    >
                      <option value="">Select a Tour</option>
                      {tours.filter(t => t.isActive).map(tour => (
                        <option key={tour.id} value={tour.name}>{tour.name} ({tour.durationHours}h)</option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4 pt-4">
                <div className="space-y-2">
                  <Label className="text-[10px] text-gray-400 font-bold uppercase tracking-widest pl-1">Date</Label>
                  <Input 
                    type="date" 
                    className="h-14 bg-gray-50 border-transparent focus-visible:ring-pex-gold text-gray-900 rounded-xl font-medium"
                    value={widgetDate}
                    onChange={(e) => setWidgetDate(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] text-gray-400 font-bold uppercase tracking-widest pl-1">Time</Label>
                  <Input 
                    type="time" 
                    className="h-14 bg-gray-50 border-transparent focus-visible:ring-pex-gold text-gray-900 rounded-xl font-medium"
                    value={widgetTime}
                    onChange={(e) => setWidgetTime(e.target.value)}
                  />
                </div>
              </div>

              <Button 
                className="w-full h-14 mt-6 bg-pex-blue hover:bg-pex-blue/90 text-white text-lg font-bold rounded-xl shadow-lg shadow-pex-blue/20"
                onClick={handleSearchRides}
              >
                Search Rides
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Active Ride Banner */}
        <AnimatePresence>
          {activeRide && (
            <motion.div 
              initial={{ y: 100, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 100, opacity: 0 }}
              className="fixed bottom-0 left-0 right-0 z-50 p-4 bg-white border-t border-gray-200 shadow-[0_-10px_40px_rgba(0,0,0,0.1)] rounded-t-3xl max-w-md mx-auto"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-pex-blue rounded-full flex items-center justify-center">
                    <Car className="text-pex-gold" size={24} />
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-900">Active Journey</h4>
                    <p className="text-sm text-gray-500 capitalize">{activeRide.status.replace('-', ' ')}</p>
                  </div>
                </div>
                <Badge className="bg-green-100 text-green-800 border-none">
                  {activeRide.status === 'searching' ? 'Finding Driver' : 
                   activeRide.status === 'accepted' ? 'Driver En Route' :
                   activeRide.status === 'arrived' ? 'Driver Arrived' :
                   activeRide.status === 'picked-up' ? 'In Transit' : 'Active'}
                </Badge>
              </div>
              
              <div className="flex gap-2">
                <Button 
                  className="flex-1 bg-gray-100 text-gray-900 hover:bg-gray-200 font-semibold rounded-xl h-12"
                  onClick={() => {
                    navigate('/book', { state: { activeRideId: activeRide.id } })
                  }}
                >
                  Details
                </Button>
                {activeRide.driverId && (
                  <Button 
                    className="flex-1 bg-pex-blue text-white hover:bg-pex-blue/90 font-semibold rounded-xl h-12"
                    onClick={() => setIsChatOpen(true)}
                  >
                    <MessageSquare size={18} className="mr-2" />
                    Chat
                  </Button>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Chat Modal */}
        <Dialog open={isChatOpen} onOpenChange={setIsChatOpen}>
          <DialogContent className="sm:max-w-[450px] p-0 h-[600px] flex flex-col overflow-hidden rounded-3xl">
            <Chat 
              chatId={activeRide?.id || 'general'} 
              recipientName={activeRide?.driverName || 'Chauffeur'} 
              recipientRole="driver" 
            />
          </DialogContent>
        </Dialog>

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
    </div>
  );
}

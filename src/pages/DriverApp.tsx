import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { useFirebase, handleFirestoreError, OperationType } from '../FirebaseProvider';
import { db } from '../firebase';
import { collection, query, where, onSnapshot, doc, updateDoc, setDoc, serverTimestamp, orderBy, limit, addDoc, Timestamp } from 'firebase/firestore';
import { Map, Users, DollarSign, MessageSquare, CheckCircle2, Clock, AlertCircle, Car, Navigation, ChevronRight, LogOut, Phone, Camera, X, Send, Globe } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import Chat from '../components/Chat';

export default function DriverApp() {
  const { user: currentUser, profile, logout, loading: authLoading } = useFirebase();
  const navigate = useNavigate();
  const [activeRides, setActiveRides] = useState<any[]>([]);
  const [availableRides, setAvailableRides] = useState<any[]>([]);
  const [status, setStatus] = useState<'available' | 'busy' | 'offline'>('offline');
  const [location, setLocation] = useState({ lat: 38.7223, lng: -9.1393 }); // Lisbon default
  const [activeChat, setActiveChat] = useState<any>(null);
  const [showNoShowModal, setShowNoShowModal] = useState(false);
  const [noShowRideId, setNoShowRideId] = useState<string | null>(null);
  const [noShowProof, setNoShowProof] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !currentUser) {
      navigate('/driver/login');
      return;
    }
    if (!currentUser) return;

    // Fetch assigned rides
    const assignedRidesQuery = query(
      collection(db, 'rides'),
      where('driverId', '==', currentUser.uid),
      where('status', 'not-in', ['completed', 'cancelled'])
    );

    const unsubAssigned = onSnapshot(assignedRidesQuery, (snapshot) => {
      setActiveRides(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, (err) => handleFirestoreError(err, OperationType.GET, 'rides'));

    // Fetch available rides (searching)
    const availableRidesQuery = query(
      collection(db, 'rides'),
      where('status', '==', 'searching'),
      orderBy('createdAt', 'desc'),
      limit(10)
    );

    const unsubAvailable = onSnapshot(availableRidesQuery, (snapshot) => {
      setAvailableRides(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, (err) => handleFirestoreError(err, OperationType.GET, 'rides'));

    // Update location periodically
    const interval = setInterval(async () => {
      if (status !== 'offline') {
        // Simulate movement
        const newLat = location.lat + (Math.random() - 0.5) * 0.0005;
        const newLng = location.lng + (Math.random() - 0.5) * 0.0005;
        setLocation({ lat: newLat, lng: newLng });
        
        try {
          await setDoc(doc(db, 'driver_locations', currentUser.uid), {
            driverId: currentUser.uid,
            driverName: profile?.displayName || 'Driver',
            lat: newLat,
            lng: newLng,
            status: status,
            updatedAt: serverTimestamp()
          });
        } catch (err) {
          console.error('Location update error:', err);
        }
      }
    }, 15000);

    return () => {
      unsubAssigned();
      unsubAvailable();
      clearInterval(interval);
    };
  }, [currentUser, status, profile, authLoading, navigate]);

  const handleAcceptRide = async (rideId: string) => {
    if (!currentUser) return;
    try {
      await updateDoc(doc(db, 'rides', rideId), {
        driverId: currentUser.uid,
        driverName: profile?.displayName || 'Driver',
        status: 'accepted',
        acceptedAt: serverTimestamp()
      });
      // Create chat
      await setDoc(doc(db, 'chats', rideId), {
        rideId,
        participants: [currentUser.uid, availableRides.find(r => r.id === rideId)?.passengerId],
        updatedAt: serverTimestamp()
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `rides/${rideId}`);
    }
  };

  const updateRideStatus = async (rideId: string, newStatus: string) => {
    try {
      const updateData: any = {
        status: newStatus,
        updatedAt: serverTimestamp()
      };
      if (newStatus === 'in-progress') updateData.startedAt = serverTimestamp();
      if (newStatus === 'completed') updateData.completedAt = serverTimestamp();
      
      await updateDoc(doc(db, 'rides', rideId), updateData);
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `rides/${rideId}`);
    }
  };

  const handleNoShow = async () => {
    if (!noShowRideId || !noShowProof) return;
    try {
      await updateDoc(doc(db, 'rides', noShowRideId), {
        status: 'cancelled',
        cancellationReason: 'no-show',
        noShowProof: noShowProof,
        updatedAt: serverTimestamp()
      });
      setShowNoShowModal(false);
      setNoShowRideId(null);
      setNoShowProof(null);
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `rides/${noShowRideId}`);
    }
  };

  const [isAddingVehicle, setIsAddingVehicle] = useState(false);
  const [newVehicle, setNewVehicle] = useState({ make: '', model: '', year: new Date().getFullYear(), licensePlate: '' });
  const [driverVehicles, setDriverVehicles] = useState<any[]>([
    { id: '1', make: 'Mercedes-Benz', model: 'E-Class', year: 2022, licensePlate: 'ABC-1234', status: 'active', age: 4 }
  ]);

  const handleAddVehicle = () => {
    const currentYear = new Date().getFullYear();
    const age = currentYear - newVehicle.year;
    const status = age > 10 ? 'deactivated' : 'active';
    
    const vehicle = {
      ...newVehicle,
      id: Date.now().toString(),
      status,
      age
    };
    
    setDriverVehicles([...driverVehicles, vehicle]);
    setIsAddingVehicle(false);
    setNewVehicle({ make: '', model: '', year: currentYear, licensePlate: '' });
  };

  const [documents, setDocuments] = useState([
    { id: 'license', name: 'Driver\'s License', status: 'missing' },
    { id: 'professional', name: 'Professional License (VTC/TVDE)', status: 'missing' },
    { id: 'background', name: 'Criminal Record Certificate', status: 'missing' },
    { id: 'insurance', name: 'Commercial Insurance', status: 'missing' },
    { id: 'registration', name: 'Vehicle Registration', status: 'missing' },
    { id: 'photo', name: 'Professional Profile Photo', status: 'missing' }
  ]);

  const [invoices, setInvoices] = useState([
    { id: '1', number: 'INV-2026-001', date: 'March 11, 2026', rides: 5, amount: 450.00 },
    { id: '2', number: 'INV-2026-002', date: 'March 12, 2026', rides: 3, amount: 275.50 },
    { id: '3', number: 'INV-2026-003', date: 'March 13, 2026', rides: 4, amount: 380.00 }
  ]);

  if (authLoading) return <div className="min-h-screen flex items-center justify-center bg-gray-50"><div className="animate-spin rounded-full h-12 w-12 border-t-2 border-pex-gold"></div></div>;
  if (!currentUser) return null;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col pb-20">
      {/* Header */}
      <header className="bg-pex-blue text-white p-4 shadow-lg flex justify-between items-center sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-pex-gold flex items-center justify-center font-bold text-pex-blue">
            {profile?.displayName?.charAt(0) || 'D'}
          </div>
          <div>
            <h1 className="font-bold text-sm">{profile?.displayName}</h1>
            <p className="text-[10px] text-pex-gold uppercase tracking-widest">Elite Chauffeur</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <select 
            value={status} 
            onChange={(e) => setStatus(e.target.value as any)}
            className={`text-xs font-bold px-3 py-1.5 rounded-full border-none outline-none ${
              status === 'available' ? 'bg-green-500 text-white' : status === 'busy' ? 'bg-yellow-500 text-white' : 'bg-gray-500 text-white'
            }`}
          >
            <option value="available">Available</option>
            <option value="busy">Busy</option>
            <option value="offline">Offline</option>
          </select>
          <Button variant="ghost" size="icon" onClick={logout}>
            <LogOut size={18} />
          </Button>
        </div>
      </header>

      <main className="flex-1 p-4 max-w-4xl mx-auto w-full space-y-6">
        <Tabs defaultValue="dashboard" className="w-full">
          <TabsList className="grid w-full grid-cols-4 mb-6 sticky top-20 z-40 bg-gray-50/80 backdrop-blur-md">
            <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
            <TabsTrigger value="available">Market</TabsTrigger>
            <TabsTrigger value="vehicles">Vehicles</TabsTrigger>
            <TabsTrigger value="invoices">Finance</TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard" className="space-y-6">
            {/* Stats */}
            <div className="grid grid-cols-3 gap-4">
              <Card className="bg-white border-none shadow-sm">
                <CardContent className="p-4 text-center">
                  <p className="text-[10px] text-gray-400 uppercase font-bold mb-1">Earnings</p>
                  <p className="text-xl font-bold text-pex-blue">€342</p>
                </CardContent>
              </Card>
              <Card className="bg-white border-none shadow-sm">
                <CardContent className="p-4 text-center">
                  <p className="text-[10px] text-gray-400 uppercase font-bold mb-1">Rides</p>
                  <p className="text-xl font-bold text-pex-blue">8</p>
                </CardContent>
              </Card>
              <Card className="bg-white border-none shadow-sm">
                <CardContent className="p-4 text-center">
                  <p className="text-[10px] text-gray-400 uppercase font-bold mb-1">Rating</p>
                  <p className="text-xl font-bold text-pex-gold">4.98</p>
                </CardContent>
              </Card>
            </div>

            {/* Active Assignments */}
            <div className="space-y-4">
              <h2 className="text-sm font-bold text-gray-400 uppercase tracking-widest px-1">Active Assignments</h2>
              {activeRides.length === 0 ? (
                <div className="bg-white p-12 rounded-2xl text-center border-2 border-dashed border-gray-100">
                  <Car size={48} className="mx-auto text-gray-200 mb-4" />
                  <p className="text-gray-400 font-medium">No active rides.</p>
                </div>
              ) : (
                activeRides.map((ride) => (
                  <Card key={ride.id} className="overflow-hidden border-none shadow-md">
                    <CardHeader className="bg-pex-blue text-white p-4 flex flex-row justify-between items-center">
                      <div>
                        <CardTitle className="text-sm font-bold">Ride #{ride.id.slice(0, 8)}</CardTitle>
                        <p className="text-[10px] text-pex-gold uppercase tracking-widest">{ride.rideType}</p>
                      </div>
                      <Badge className="bg-white/20 text-white border-none uppercase text-[10px]">{ride.status}</Badge>
                    </CardHeader>
                    <CardContent className="p-4 space-y-4">
                      <div className="space-y-3">
                        <div className="flex items-start gap-3">
                          <div className="w-2 h-2 rounded-full bg-green-500 mt-1.5" />
                          <div className="flex-1">
                            <p className="text-[10px] text-gray-400 uppercase font-bold">Pickup</p>
                            <p className="text-sm font-medium leading-tight">{ride.pickupLocation}</p>
                          </div>
                        </div>
                        <div className="flex items-start gap-3">
                          <div className="w-2 h-2 rounded-full bg-pex-gold mt-1.5" />
                          <div className="flex-1">
                            <p className="text-[10px] text-gray-400 uppercase font-bold">Dropoff</p>
                            <p className="text-sm font-medium leading-tight">{ride.dropoffLocation}</p>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-4 border-t">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
                            <Users size={20} className="text-pex-blue" />
                          </div>
                          <div>
                            <p className="text-sm font-bold">{ride.passengerName || 'Passenger'}</p>
                            <p className="text-[10px] text-gray-400">Verified Client</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-bold text-pex-blue">€{ride.price}</p>
                          <p className="text-[10px] text-gray-400">Fixed Fare</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3 pt-2">
                        {ride.status === 'accepted' && (
                          <Button className="w-full bg-pex-blue text-white" onClick={() => updateRideStatus(ride.id, 'arrived')}>
                            I'm at Pickup
                          </Button>
                        )}
                        {ride.status === 'arrived' && (
                          <Button className="w-full bg-pex-gold text-pex-blue font-bold" onClick={() => updateRideStatus(ride.id, 'picked-up')}>
                            Customer Picked
                          </Button>
                        )}
                        {ride.status === 'picked-up' && (
                          <Button className="w-full bg-green-600 text-white" onClick={() => updateRideStatus(ride.id, 'completed')}>
                            Drop-off / Complete
                          </Button>
                        )}
                        {ride.status === 'arrived' && (
                          <Button 
                            variant="destructive" 
                            className="w-full"
                            onClick={() => { setNoShowRideId(ride.id); setShowNoShowModal(true); }}
                          >
                            No-Show
                          </Button>
                        )}
                        <Button 
                          variant="outline" 
                          className="w-full" 
                          onClick={() => {
                            setActiveChat({ id: ride.id, name: ride.passengerName || 'Passenger' });
                          }}
                        >
                          <MessageSquare size={14} className="mr-2" />
                          Chat
                        </Button>
                        <Button variant="outline" className="w-full">
                          <Navigation size={14} className="mr-2" />
                          Navigate
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </TabsContent>

          <TabsContent value="available" className="space-y-4">
            <h2 className="text-sm font-bold text-gray-400 uppercase tracking-widest px-1">Available Marketplace</h2>
            {availableRides.length === 0 ? (
              <div className="bg-white p-12 rounded-2xl text-center border-2 border-dashed border-gray-100">
                <Clock size={48} className="mx-auto text-gray-200 mb-4" />
                <p className="text-gray-400 font-medium">No rides available right now.</p>
                <p className="text-xs text-gray-300 mt-1">New requests will appear here in real-time.</p>
              </div>
            ) : (
              availableRides.map((ride) => (
                <Card key={ride.id} className="overflow-hidden border-none shadow-md">
                  <CardContent className="p-4 space-y-4">
                    <div className="flex justify-between items-start">
                      <div className="space-y-1">
                        <Badge className="bg-pex-gold/20 text-pex-blue border-none uppercase text-[10px]">{ride.rideType}</Badge>
                        <p className="text-xs text-gray-400">{ride.distance} km • {ride.estimatedDuration} min</p>
                      </div>
                      <p className="text-xl font-bold text-pex-blue font-serif">€{ride.price}</p>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
                        <p className="text-xs truncate">{ride.pickupLocation}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-pex-gold" />
                        <p className="text-xs truncate">{ride.dropoffLocation}</p>
                      </div>
                    </div>

                    <Button className="w-full bg-pex-blue text-white font-bold" onClick={() => handleAcceptRide(ride.id)}>
                      Accept Ride
                    </Button>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>

          <TabsContent value="vehicles" className="space-y-6">
            <div className="bg-white p-6 rounded-2xl shadow-sm">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-lg font-bold text-pex-blue">My Fleet</h2>
                <Button size="sm" className="bg-pex-blue text-white" onClick={() => setIsAddingVehicle(true)}>Add Vehicle</Button>
              </div>
              <div className="space-y-4">
                {driverVehicles.map(vehicle => (
                  <div key={vehicle.id} className="p-4 border rounded-xl flex justify-between items-center">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                        <Car className="text-pex-blue" />
                      </div>
                      <div>
                        <p className="font-bold text-pex-blue">{vehicle.make} {vehicle.model}</p>
                        <p className="text-xs text-gray-500">{vehicle.year} • {vehicle.licensePlate}</p>
                      </div>
                    </div>
                    <Badge className="bg-green-100 text-green-800 border-none">ACTIVE</Badge>
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="invoices" className="space-y-6">
            <div className="bg-white p-6 rounded-2xl shadow-sm">
              <h2 className="text-lg font-bold text-pex-blue mb-6">Earnings History</h2>
              <div className="space-y-4">
                {invoices.map(invoice => (
                  <div key={invoice.id} className="flex items-center justify-between p-4 border rounded-xl">
                    <div>
                      <p className="font-bold text-sm text-pex-blue">Invoice #{invoice.number}</p>
                      <p className="text-xs text-gray-400 mt-1">{invoice.date} • {invoice.rides} Rides</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-pex-blue">€{invoice.amount.toFixed(2)}</p>
                      <Button size="sm" variant="link" className="text-pex-gold p-0 h-auto text-xs">Download PDF</Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </main>

      {/* Chat Modal */}
      <AnimatePresence>
        {activeChat && (
          <motion.div 
            initial={{ opacity: 0, y: 100 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 100 }}
            className="fixed inset-0 z-[100] bg-white flex flex-col"
          >
            <div className="bg-pex-blue text-white p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Button variant="ghost" size="icon" onClick={() => setActiveChat(null)}>
                  <X size={20} />
                </Button>
                <h2 className="font-bold">Chat with {activeChat.name}</h2>
              </div>
              <Badge className="bg-pex-gold text-pex-blue">Ride #{activeChat.id.slice(0, 6)}</Badge>
            </div>
            <div className="flex-1 overflow-hidden">
              <Chat 
                chatId={activeChat.id} 
                recipientName={activeChat.name} 
                recipientRole="passenger" 
                targetLanguage={profile?.language || 'en'}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* No-Show Modal */}
      <AnimatePresence>
        {showNoShowModal && (
          <div className="fixed inset-0 z-[110] bg-black/60 backdrop-blur-sm flex items-center justify-center p-6">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-white rounded-3xl p-8 max-w-md w-full space-y-6 shadow-2xl"
            >
              <div className="text-center space-y-2">
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Camera size={32} className="text-red-600" />
                </div>
                <h2 className="text-2xl font-bold text-pex-blue">No-Show Proof</h2>
                <p className="text-gray-500 text-sm">To cancel as a no-show, you must provide a photo proof of your location at the pickup point.</p>
              </div>

              <div className="space-y-4">
                {!noShowProof ? (
                  <div 
                    className="h-48 border-2 border-dashed border-gray-200 rounded-2xl flex flex-col items-center justify-center gap-2 hover:border-pex-gold transition-colors cursor-pointer"
                    onClick={() => setNoShowProof('https://picsum.photos/seed/noshow/800/600')}
                  >
                    <Camera size={40} className="text-gray-300" />
                    <p className="text-sm text-gray-400 font-medium">Tap to take photo</p>
                  </div>
                ) : (
                  <div className="relative h-48 rounded-2xl overflow-hidden">
                    <img src={noShowProof} alt="Proof" className="w-full h-full object-cover" />
                    <Button 
                      variant="destructive" 
                      size="icon" 
                      className="absolute top-2 right-2 rounded-full h-8 w-8"
                      onClick={() => setNoShowProof(null)}
                    >
                      <X size={16} />
                    </Button>
                  </div>
                )}

                <div className="flex gap-3">
                  <Button variant="outline" className="flex-1" onClick={() => setShowNoShowModal(false)}>Cancel</Button>
                  <Button 
                    className="flex-1 bg-red-600 text-white font-bold" 
                    disabled={!noShowProof}
                    onClick={handleNoShow}
                  >
                    Submit No-Show
                  </Button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Chat Modal */}
      <Dialog open={!!activeChat} onOpenChange={(open) => !open && setActiveChat(null)}>
        <DialogContent className="sm:max-w-[450px] p-0 h-[600px] flex flex-col overflow-hidden">
          <Chat 
            chatId={activeChat?.id || 'general'} 
            recipientName={activeChat?.name || 'Passenger'} 
            recipientRole="passenger" 
          />
        </DialogContent>
      </Dialog>

      {/* Bottom Nav */}
      <footer className="bg-white border-t p-4 flex justify-around items-center fixed bottom-0 w-full z-50">
        <button className="flex flex-col items-center gap-1 text-pex-blue">
          <Car size={20} />
          <span className="text-[10px] font-bold uppercase">Rides</span>
        </button>
        <button className="flex flex-col items-center gap-1 text-gray-400">
          <MessageSquare size={20} />
          <span className="text-[10px] font-bold uppercase">Chat</span>
        </button>
        <button className="flex flex-col items-center gap-1 text-gray-400">
          <DollarSign size={20} />
          <span className="text-[10px] font-bold uppercase">Earnings</span>
        </button>
      </footer>
    </div>
  );
}

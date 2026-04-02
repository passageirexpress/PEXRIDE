import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Map, Users, DollarSign, MessageSquare, Plus, Search, Filter, MoreVertical, CheckCircle2, Clock, AlertCircle, Trash2, ShieldCheck, Shield, Bell, Send, Car, UserPlus, X, VolumeX, Thermometer, History, LayoutDashboard, Navigation, ChevronRight, RefreshCw, Settings, CreditCard, MapPin, User, Info } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useFirebase, handleFirestoreError, OperationType } from '../FirebaseProvider';
import { collection, query, onSnapshot, orderBy, doc, updateDoc, deleteDoc, limit, addDoc, serverTimestamp, setDoc, getDocs, where, Timestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate } from 'react-router-dom';

const revenueData = [
  { name: 'Mon', revenue: 4000 },
  { name: 'Tue', revenue: 3000 },
  { name: 'Wed', revenue: 2000 },
  { name: 'Thu', revenue: 2780 },
  { name: 'Fri', revenue: 1890 },
  { name: 'Sat', revenue: 2390 },
  { name: 'Sun', revenue: 3490 },
];

interface Ride {
  id: string | number;
  passengerId: string;
  passengerName?: string;
  driverId?: string;
  driverName?: string;
  pickupLocation: string;
  dropoffLocation: string;
  status: 'requested' | 'assigned' | 'in-progress' | 'completed' | 'cancelled';
  rideType: string;
  vehicleName?: string;
  price: number;
  preferences?: any;
  createdAt: any;
}

interface DriverLocation {
  id: string;
  driverId: string;
  driverName: string;
  lat: number;
  lng: number;
  status: 'available' | 'busy' | 'offline';
  updatedAt: string;
}

interface Vehicle {
  id: string;
  make: string;
  model: string;
  type: string;
  licensePlate: string;
  capacity: number;
  status: 'active' | 'maintenance' | 'retired';
}

interface POI {
  id: string | number;
  name: string;
  price: number;
  tour_price: number;
  duration: string;
  image_url: string;
  status: string;
}

interface UserProfile {
  id: string;
  uid: string;
  email: string;
  displayName: string;
  role: 'passenger' | 'driver' | 'admin';
  photoURL?: string;
}

export default function AdminDashboard() {
  const { profile, user: currentUser, loading: authLoading, logout } = useFirebase();
  const navigate = useNavigate();
  const [adminAuthenticated, setAdminAuthenticated] = useState(false);
  const [adminPassword, setAdminPassword] = useState('');
  const [adminEmail, setAdminEmail] = useState('');
  const [loginError, setLoginError] = useState('');
  const [activeTab, setActiveTab] = useState('live-map');
  const [rides, setRides] = useState<Ride[]>([]);
  const [driverLocations, setDriverLocations] = useState<DriverLocation[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [pois, setPois] = useState<POI[]>([]);
  const [tours, setTours] = useState<any[]>([]);
  const [isAddingTour, setIsAddingTour] = useState(false);
  const [newTour, setNewTour] = useState({ name: '', durationHours: 4, basePrice: 100, description: '', isActive: true });
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Support Chat States
  const [chats, setChats] = useState<UserProfile[]>([]);
  const [selectedChat, setSelectedChat] = useState<UserProfile | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  // Vehicle Management States
  const [isAddingVehicle, setIsAddingVehicle] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState<any>(null);
  const [newVehicle, setNewVehicle] = useState({ make: '', model: '', type: 'Business', licensePlate: '', capacity: 4, status: 'active' });

  // Vehicle Type States
  const [vehicleTypes, setVehicleTypes] = useState<any[]>([]);
  const [isAddingVehicleType, setIsAddingVehicleType] = useState(false);
  const [newVehicleType, setNewVehicleType] = useState({ name: '', basePrice: 0, multiplier: 1.0, pricePerKm: 0, pricePerMin: 0, minFare: 0, hourlyRate: 0, capacity: 4, description: '' });
  const [editingVehicleType, setEditingVehicleType] = useState<any>(null);

  // POI Management States
  const [drivers, setDrivers] = useState<any[]>([]);

  useEffect(() => {
    if (profile?.role !== 'admin') return;

    const unsubRides = onSnapshot(
      query(collection(db, 'rides'), orderBy('createdAt', 'desc'), limit(100)),
      (snapshot) => {
        setRides(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Ride)));
        setLoading(false);
      },
      (err) => handleFirestoreError(err, OperationType.GET, 'rides')
    );

    const unsubLocations = onSnapshot(
      collection(db, 'driver_locations'),
      (snapshot) => {
        setDriverLocations(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as DriverLocation)));
      },
      (err) => handleFirestoreError(err, OperationType.GET, 'driver_locations')
    );

    const unsubVehicles = onSnapshot(
      collection(db, 'vehicles'),
      (snapshot) => {
        setVehicles(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Vehicle)));
      },
      (err) => handleFirestoreError(err, OperationType.GET, 'vehicles')
    );

    const unsubPois = onSnapshot(
      collection(db, 'pois'),
      (snapshot) => {
        setPois(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as POI)));
      },
      (err) => handleFirestoreError(err, OperationType.GET, 'pois')
    );

    const unsubTours = onSnapshot(
      collection(db, 'tours'),
      (snapshot) => {
        setTours(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      },
      (err) => handleFirestoreError(err, OperationType.GET, 'tours')
    );

    const unsubVehicleTypes = onSnapshot(
      collection(db, 'vehicle_types'),
      (snapshot) => {
        setVehicleTypes(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      },
      (err) => handleFirestoreError(err, OperationType.GET, 'vehicle_types')
    );

    const unsubSettings = onSnapshot(
      collection(db, 'settings'),
      (snapshot) => {
        snapshot.docs.forEach(doc => {
          if (doc.id === 'pricing') {
            setGlobalSettings(doc.data().value);
          } else if (doc.id === 'footer') {
            setFooterSettings(prev => ({ ...prev, ...doc.data() }));
          }
        });
      },
      (err) => handleFirestoreError(err, OperationType.GET, 'settings')
    );

    const unsubUsers = onSnapshot(
      collection(db, 'users'),
      (snapshot) => {
        const allUsers = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as UserProfile));
        setChats(allUsers.filter(u => u.role === 'passenger'));
        setDrivers(allUsers.filter(u => u.role === 'driver'));
      },
      (err) => handleFirestoreError(err, OperationType.GET, 'users')
    );

    return () => {
      unsubRides();
      unsubLocations();
      unsubVehicles();
      unsubPois();
      unsubTours();
      unsubVehicleTypes();
      unsubSettings();
      unsubUsers();
    };
  }, [profile]);

  useEffect(() => {
    if (selectedChat && currentUser) {
      const messagesQuery = query(
        collection(db, 'chats', selectedChat.uid, 'messages'),
        orderBy('createdAt', 'asc')
      );

      const unsubMessages = onSnapshot(messagesQuery, (snapshot) => {
        setMessages(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        setTimeout(() => {
          if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
          }
        }, 100);
      }, (err) => {
        handleFirestoreError(err, OperationType.GET, `chats/${selectedChat.uid}/messages`);
      });

      return () => unsubMessages();
    }
  }, [selectedChat, currentUser]);

  const handleTyping = async (isTyping: boolean) => {
    if (selectedChat && currentUser) {
      try {
        const typingRef = doc(db, 'typing', selectedChat.uid);
        await setDoc(typingRef, {
          [currentUser.uid]: isTyping,
          updatedAt: serverTimestamp()
        }, { merge: true });
      } catch (err) {
        // Silent error
      }
    }
  };

  const typingTimerRef = useRef<NodeJS.Timeout | null>(null);
  const onInputChange = (val: string) => {
    setNewMessage(val);
    handleTyping(true);
    
    if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
    typingTimerRef.current = setTimeout(() => {
      handleTyping(false);
    }, 2000);
  };

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const addNotification = (message: string, type: 'info' | 'success' | 'warning' | 'error') => {
    const id = Date.now();
    setNotifications(prev => [{ id, message, type }, ...prev].slice(0, 5));
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id));
    }, 5000);
  };

  const updateRideStatus = async (rideId: string | number, newStatus: string, driverId?: string) => {
    try {
      const rideRef = doc(db, 'rides', String(rideId));
      await updateDoc(rideRef, { 
        status: newStatus, 
        driverId: driverId || null,
        updatedAt: serverTimestamp()
      });
      addNotification(`Ride updated to ${newStatus}`, 'success');
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `rides/${rideId}`);
    }
  };

  const fetchDriverHistory = async (driverId: string) => {
    if (showHistory === driverId) {
      setShowHistory(null);
      setHistoryData([]);
      return;
    }
    try {
      const historyQuery = query(
        collection(db, 'driver_locations', driverId, 'history'),
        orderBy('timestamp', 'desc'),
        limit(100)
      );
      const snapshot = await getDocs(historyQuery);
      setHistoryData(snapshot.docs.map(doc => doc.data() as {lat: number, lng: number}));
      setShowHistory(driverId);
    } catch (err) {
      handleFirestoreError(err, OperationType.GET, `driver_locations/${driverId}/history`);
    }
  };

  const deleteRide = async (rideId: string | number) => {
    try {
      await deleteDoc(doc(db, 'rides', String(rideId)));
      setRideToCancel(null);
      addNotification('Ride cancelled successfully', 'success');
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `rides/${rideId}`);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedChat || !currentUser) return;
    try {
      await addDoc(collection(db, 'chats', selectedChat.uid, 'messages'), {
        senderId: currentUser.uid,
        senderName: profile?.displayName || 'Admin',
        text: newMessage,
        createdAt: Timestamp.now(),
      });
      setNewMessage('');
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `chats/${selectedChat.uid}/messages`);
    }
  };

  const handleAddVehicle = async () => {
    try {
      await addDoc(collection(db, 'vehicles'), {
        ...newVehicle,
        createdAt: serverTimestamp()
      });
      setIsAddingVehicle(false);
      setNewVehicle({ make: '', model: '', type: 'Business', licensePlate: '', capacity: 4, status: 'active' });
      addNotification('Vehicle added successfully', 'success');
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, 'vehicles');
    }
  };

  const handleUpdateVehicle = async () => {
    if (!editingVehicle) return;
    try {
      const { id, ...data } = editingVehicle;
      await updateDoc(doc(db, 'vehicles', id), {
        ...data,
        updatedAt: serverTimestamp()
      });
      setEditingVehicle(null);
      addNotification('Vehicle updated successfully', 'success');
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `vehicles/${editingVehicle.id}`);
    }
  };

  const handleAddVehicleType = async () => {
    try {
      await addDoc(collection(db, 'vehicle_types'), {
        ...newVehicleType,
        createdAt: serverTimestamp()
      });
      setIsAddingVehicleType(false);
      setNewVehicleType({ name: '', basePrice: 0, multiplier: 1.0, pricePerKm: 0, pricePerMin: 0, minFare: 0, hourlyRate: 0, capacity: 4, description: '' });
      addNotification('Vehicle type added', 'success');
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, 'vehicle_types');
    }
  };

  const handleUpdateVehicleType = async () => {
    if (!editingVehicleType) return;
    try {
      const { id, ...data } = editingVehicleType;
      await updateDoc(doc(db, 'vehicle_types', id), {
        ...data,
        updatedAt: serverTimestamp()
      });
      setEditingVehicleType(null);
      addNotification('Vehicle type updated', 'success');
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `vehicle_types/${editingVehicleType.id}`);
    }
  };

  const handleDeleteVehicleType = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'vehicle_types', id));
      addNotification('Vehicle type deleted', 'warning');
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `vehicle_types/${id}`);
    }
  };

  const handleDeleteVehicle = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'vehicles', id));
      addNotification('Vehicle deleted', 'warning');
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `vehicles/${id}`);
    }
  };

  const [isAddingPOI, setIsAddingPOI] = useState(false);
  const [newPOI, setNewPOI] = useState({ name: '', price: 0, tourPrice: 0, duration: '', imageUrl: '', status: 'Active' });
  const [globalSettings, setGlobalSettings] = useState({ normal_price_per_km: 1.5, base_fare: 5.0, price_per_min: 0.5, min_fare: 15.0 });
  const [footerSettings, setFooterSettings] = useState({
    address: 'Av. da Liberdade 110, 1269-042 Lisboa, Portugal',
    phone: '+351 213 811 400',
    email: 'concierge@pex-ride.com',
    instagram: 'https://instagram.com',
    twitter: 'https://twitter.com',
    facebook: 'https://facebook.com'
  });

  // Driver Registration States
  const [isAddingDriver, setIsAddingDriver] = useState(false);
  const [newDriver, setNewDriver] = useState({ displayName: '', email: '', phoneNumber: '', licenseNumber: '' });

  const handleAdminLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (adminEmail.toLowerCase() === 'michaelsouzaxt21@gmail.com' && adminPassword === 'teste1234') {
      setAdminAuthenticated(true);
      setLoginError('');
    } else {
      setLoginError('Invalid credentials. Please try again.');
    }
  };
  
  // Filtering & History States
  const [driverStatusFilter, setDriverStatusFilter] = useState<'all' | 'available' | 'busy' | 'offline'>('all');
  const [driverManagementFilter, setDriverManagementFilter] = useState<'all' | 'active' | 'pending' | 'rejected'>('all');
  const [viewingDriverDocs, setViewingDriverDocs] = useState<string | null>(null);
  const [showHistory, setShowHistory] = useState<string | null>(null);
  const [historyData, setHistoryData] = useState<{lat: number, lng: number}[]>([]);
  const [typingUsers, setTypingUsers] = useState<{[key: string]: boolean}>({});
  const typingTimeoutRef = useRef<{[key: string]: NodeJS.Timeout}>({});
  const [rideToCancel, setRideToCancel] = useState<string | number | null>(null);
  const [selectedDriverForHistory, setSelectedDriverForHistory] = useState<string | null>(null);
  const [isEditingPricing, setIsEditingPricing] = useState(false);
  const [pricingData, setPricingData] = useState<{ type: string, price: number }[]>([]);

  const handleRegisterDriver = async () => {
    try {
      // In a real app, we'd use Firebase Auth to create the user
      // For now, we'll just create the profile in Firestore
      const driverId = `driver_${Date.now()}`;
      await setDoc(doc(db, 'users', driverId), {
        uid: driverId,
        displayName: newDriver.displayName,
        email: newDriver.email,
        phoneNumber: newDriver.phoneNumber,
        licenseNumber: newDriver.licenseNumber,
        role: 'driver',
        status: 'pending',
        createdAt: serverTimestamp()
      });

      // Simulated Email Notification
      try {
        await fetch('/api/drivers/notify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: newDriver.email, name: newDriver.displayName })
        });
      } catch (err) {
        console.error('Failed to send simulated email:', err);
      }

      setNewDriver({ displayName: '', email: '', phoneNumber: '', licenseNumber: '' });
      addNotification('Driver registration submitted for approval', 'success');
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, 'users');
    }
  };

  const handleApproveDriver = async (uid: string, status: 'active' | 'rejected') => {
    try {
      await updateDoc(doc(db, 'users', uid), { 
        status,
        updatedAt: serverTimestamp()
      });
      addNotification(`Driver ${status === 'active' ? 'approved' : 'rejected'}`, status === 'active' ? 'success' : 'warning');
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `users/${uid}`);
    }
  };

  const handleAddPOI = async () => {
    try {
      await addDoc(collection(db, 'pois'), {
        ...newPOI,
        createdAt: serverTimestamp()
      });
      setIsAddingPOI(false);
      setNewPOI({ name: '', price: 0, tourPrice: 0, duration: '', imageUrl: '', status: 'Active' });
      addNotification('POI added successfully', 'success');
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, 'pois');
    }
  };

  const handleDeletePOI = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'pois', id));
      addNotification('POI deleted', 'warning');
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `pois/${id}`);
    }
  };

  const handleAddTour = async () => {
    try {
      await addDoc(collection(db, 'tours'), {
        ...newTour,
        createdAt: serverTimestamp()
      });
      setIsAddingTour(false);
      setNewTour({ name: '', durationHours: 4, basePrice: 100, description: '', isActive: true });
      addNotification('Tour added successfully', 'success');
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, 'tours');
    }
  };

  const handleDeleteTour = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'tours', id));
      addNotification('Tour deleted', 'warning');
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `tours/${id}`);
    }
  };

  const handleSaveSettings = async () => {
    try {
      await setDoc(doc(db, 'settings', 'pricing'), {
        value: globalSettings,
        updatedAt: serverTimestamp()
      });
      await setDoc(doc(db, 'settings', 'footer'), {
        ...footerSettings,
        updatedAt: serverTimestamp()
      });
      addNotification('Settings saved successfully', 'success');
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, 'settings');
    }
  };

  if (authLoading || (currentUser && !profile)) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-100 p-6 min-h-screen">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-pex-gold"></div>
          <p className="text-pex-blue font-medium">Verifying administrative privileges...</p>
        </div>
      </div>
    );
  }

  if (!adminAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-pex-blue p-6">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-md w-full"
        >
          <div className="text-center mb-12">
            <div className="inline-block p-4 bg-pex-gold/10 rounded-full mb-4">
              <Shield size={48} className="text-pex-gold" />
            </div>
            <h1 className="text-3xl font-light text-white tracking-widest uppercase">PEX <span className="text-pex-gold font-bold">ADMIN</span></h1>
            <p className="text-white/40 text-sm mt-2">Secure Administrative Gateway</p>
          </div>

          <Card className="bg-white/5 border-white/10 backdrop-blur-xl p-8 rounded-3xl shadow-2xl">
            <form onSubmit={handleAdminLogin} className="space-y-6">
              <div className="space-y-2">
                <Label className="text-xs uppercase tracking-widest text-white/60 ml-1">Admin Email</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 text-pex-gold/50" size={18} />
                  <Input 
                    type="email"
                    placeholder="admin@pexride.com"
                    className="bg-white/5 border-white/10 text-white pl-10 h-12 rounded-xl focus:ring-pex-gold"
                    value={adminEmail}
                    onChange={(e) => setAdminEmail(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-xs uppercase tracking-widest text-white/60 ml-1">Password</Label>
                <div className="relative">
                  <ShieldCheck className="absolute left-3 top-1/2 -translate-y-1/2 text-pex-gold/50" size={18} />
                  <Input 
                    type="password"
                    placeholder="••••••••"
                    className="bg-white/5 border-white/10 text-white pl-10 h-12 rounded-xl focus:ring-pex-gold"
                    value={adminPassword}
                    onChange={(e) => setAdminPassword(e.target.value)}
                    required
                  />
                </div>
              </div>

              {loginError && (
                <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-3 text-red-500 text-sm">
                  <AlertCircle size={16} />
                  {loginError}
                </div>
              )}

              <Button 
                type="submit"
                className="w-full bg-pex-gold hover:bg-white text-pex-blue font-bold h-12 rounded-xl transition-all"
              >
                Authenticate
                <ChevronRight className="ml-2" size={18} />
              </Button>
            </form>
          </Card>
          
          <p className="text-center text-white/20 text-[10px] mt-8 uppercase tracking-[0.2em]">
            Authorized Personnel Only • Encrypted Session
          </p>
        </motion.div>
      </div>
    );
  }

  const isAdmin = profile?.role === 'admin' || currentUser?.email?.toLowerCase() === 'michaelsouzaxt21@gmail.com';

  if (!currentUser || !isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 p-6">
        <Card className="max-w-md w-full p-8 text-center space-y-6 shadow-2xl border-none rounded-3xl">
          <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto">
            <Shield size={40} className="text-red-600" />
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-bold text-pex-blue">Access Denied</h2>
            <p className="text-gray-600">You do not have administrative privileges to access this dashboard.</p>
          </div>
          
          <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100 text-left space-y-3">
            <div>
              <p className="text-[10px] uppercase tracking-widest text-gray-400 font-bold">Current User</p>
              <p className="text-sm font-medium text-pex-blue truncate">{currentUser?.email || 'No email found'}</p>
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-widest text-gray-400 font-bold">Assigned Role</p>
              <Badge variant="outline" className="mt-1 text-pex-gold border-pex-gold/30 bg-pex-gold/5">
                {profile?.role || 'None'}
              </Badge>
            </div>
          </div>

          <div className="space-y-3 pt-4">
            <Button 
              className="w-full bg-pex-blue hover:bg-pex-blue/90 text-white rounded-xl h-12 font-medium"
              onClick={() => navigate('/')}
            >
              Return to Home
            </Button>
            <Button 
              variant="ghost"
              className="w-full text-gray-400 hover:text-pex-blue hover:bg-transparent"
              onClick={() => logout()}
            >
              Sign Out & Try Another Account
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  // Helper to format duration
  const formatDuration = (start: string | null, end: string | null) => {
    if (!start) return null;
    const startTime = new Date(start).getTime();
    const endTime = end ? new Date(end).getTime() : Date.now();
    const diffMs = endTime - startTime;
    const diffMins = Math.floor(diffMs / 60000);
    const hours = Math.floor(diffMins / 60);
    const mins = diffMins % 60;
    if (hours > 0) return `${hours}h ${mins}m`;
    return `${mins}m`;
  };

  const totalRevenue = rides
    .filter(r => r.status === 'completed')
    .reduce((sum, r) => sum + (r.price || 0), 0);

  return (
    <div className="flex-1 flex flex-col md:flex-row bg-gray-100 overflow-hidden relative">
      {/* Notifications Overlay */}
      <div className="fixed top-20 right-4 z-[100] space-y-2 pointer-events-none">
        <AnimatePresence>
          {notifications.map((n) => (
            <motion.div
              key={n.id}
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 50 }}
              className={`p-4 rounded-lg shadow-lg flex items-center gap-3 pointer-events-auto min-w-[300px] ${
                n.type === 'success' ? 'bg-green-600' : n.type === 'warning' ? 'bg-red-600' : 'bg-pex-blue'
              } text-white`}
            >
              <Bell size={18} />
              <span className="text-sm font-medium">{n.message}</span>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Cancellation Dialog */}
      <Dialog open={!!rideToCancel} onOpenChange={() => setRideToCancel(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancel Ride</DialogTitle>
            <DialogDescription>
              Are you sure you want to cancel this ride? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRideToCancel(null)}>Keep Ride</Button>
            <Button variant="destructive" onClick={() => {
              if (rideToCancel) {
                updateRideStatus(rideToCancel, 'cancelled');
                setRideToCancel(null);
              }
            }}>Cancel Ride</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Sidebar */}
      <div className="w-full md:w-64 bg-pex-blue text-white flex flex-col">
        <div className="p-6">
          <h2 className="text-xs uppercase tracking-widest text-pex-gold font-bold mb-4">Command Center</h2>
          <nav className="space-y-2">
            <button 
              onClick={() => setActiveTab('live-map')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${activeTab === 'live-map' ? 'bg-white/10 text-pex-gold' : 'hover:bg-white/5'}`}
            >
              <Map size={18} />
              <span className="text-sm font-medium">Live Map</span>
            </button>
            <button 
              onClick={() => setActiveTab('ride-history')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${activeTab === 'ride-history' ? 'bg-white/10 text-pex-gold' : 'hover:bg-white/5'}`}
            >
              <Map size={18} />
              <span className="text-sm font-medium">Ride History</span>
            </button>
            <button 
              onClick={() => setActiveTab('poi-manager')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${activeTab === 'poi-manager' ? 'bg-white/10 text-pex-gold' : 'hover:bg-white/5'}`}
            >
              <Map size={18} />
              <span className="text-sm font-medium">POI Manager</span>
            </button>
            <button 
              onClick={() => setActiveTab('tours-manager')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${activeTab === 'tours-manager' ? 'bg-white/10 text-pex-gold' : 'hover:bg-white/5'}`}
            >
              <Map size={18} />
              <span className="text-sm font-medium">Tours Manager</span>
            </button>
            <button 
              onClick={() => setActiveTab('drivers')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${activeTab === 'drivers' ? 'bg-white/10 text-pex-gold' : 'hover:bg-white/5'}`}
            >
              <UserPlus size={18} />
              <span className="text-sm font-medium">Drivers</span>
            </button>
            <button 
              onClick={() => setActiveTab('fleet')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${activeTab === 'fleet' ? 'bg-white/10 text-pex-gold' : 'hover:bg-white/5'}`}
            >
              <Car size={18} />
              <span className="text-sm font-medium">Fleet Management</span>
            </button>
            <button 
              onClick={() => setActiveTab('financial')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${activeTab === 'financial' ? 'bg-white/10 text-pex-gold' : 'hover:bg-white/5'}`}
            >
              <DollarSign size={18} />
              <span className="text-sm font-medium">Financial Suite</span>
            </button>
            <button 
              onClick={() => setActiveTab('pricing')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${activeTab === 'pricing' ? 'bg-white/10 text-pex-gold' : 'hover:bg-white/5'}`}
            >
              <CreditCard size={18} />
              <span className="text-sm font-medium">Pricing Management</span>
            </button>
            <button 
              onClick={() => setActiveTab('support')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${activeTab === 'support' ? 'bg-white/10 text-pex-gold' : 'hover:bg-white/5'}`}
            >
              <MessageSquare size={18} />
              <span className="text-sm font-medium">Concierge</span>
            </button>
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto p-8">
        {activeTab === 'live-map' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center bg-white p-4 rounded-xl shadow-sm border border-gray-100">
              <h1 className="text-2xl font-bold text-pex-blue">Live Fleet Tracking</h1>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-3 bg-gray-100 p-1 rounded-lg">
                  <Select value={driverStatusFilter} onValueChange={(v: any) => setDriverStatusFilter(v)}>
                    <SelectTrigger className="w-[140px] h-8 text-xs bg-white border-none shadow-sm">
                      <SelectValue placeholder="Filter Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Drivers</SelectItem>
                      <SelectItem value="available">Available</SelectItem>
                      <SelectItem value="busy">Busy</SelectItem>
                      <SelectItem value="offline">Offline</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                  <Input placeholder="Search driver or ride ID..." className="pl-10 w-64 bg-gray-50 border-none focus-visible:ring-pex-gold" />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Map Placeholder */}
              <Card className="lg:col-span-2 h-[600px] relative overflow-hidden bg-gray-200">
                <div className="absolute inset-0 opacity-40" style={{
                  backgroundImage: 'url("https://images.unsplash.com/photo-1524661135-423995f22d0b?auto=format&fit=crop&q=80&w=2000&h=2000")',
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                  filter: 'grayscale(80%)'
                }} />
                
                {/* Real-time Driver Markers */}
                {driverLocations
                  .filter(loc => driverStatusFilter === 'all' || loc.status === driverStatusFilter)
                  .map((loc) => (
                  <div
                    key={loc.id}
                    className="absolute -translate-x-1/2 -translate-y-1/2 z-20"
                    style={{ left: `${loc.lng}%`, top: `${loc.lat}%` }}
                  >
                    <Popover>
                      <PopoverTrigger asChild>
                        <motion.div
                          initial={false}
                          animate={{ scale: 1 }}
                          whileHover={{ scale: 1.1 }}
                          className="cursor-pointer"
                        >
                          <div className={`w-8 h-8 rounded-full border-2 border-white shadow-xl flex items-center justify-center ${
                            loc.status === 'available' ? 'bg-green-500' : loc.status === 'busy' ? 'bg-yellow-500' : 'bg-gray-500'
                          }`}>
                            <Car size={16} className="text-white" />
                          </div>
                        </motion.div>
                      </PopoverTrigger>
                      <PopoverContent className="w-64 p-4">
                        <div className="space-y-3">
                          <div className="flex justify-between items-start">
                            <div>
                              <h4 className="font-bold text-sm text-pex-blue">{loc.driverName}</h4>
                              <p className="text-[10px] text-gray-500">ID: {loc.driverId}</p>
                            </div>
                            <Badge variant={loc.status === 'available' ? 'default' : 'secondary'} className={loc.status === 'available' ? 'bg-green-500' : ''}>
                              {loc.status}
                            </Badge>
                          </div>
                          
                          {/* Current Ride Info if Busy */}
                          {loc.status === 'busy' && (
                            <div className="p-2 bg-gray-50 rounded-lg border border-gray-100 space-y-2">
                              {rides.find(r => r.driverId === loc.driverId && r.status === 'in-progress') && (
                                <>
                                  <div className="flex items-center gap-2">
                                    <User size={12} className="text-pex-blue" />
                                    <span className="text-[10px] font-medium">
                                      {rides.find(r => r.driverId === loc.driverId && r.status === 'in-progress')?.passengerName}
                                    </span>
                                  </div>
                                  <div className="space-y-1">
                                    <div className="flex items-start gap-2">
                                      <div className="w-1.5 h-1.5 rounded-full bg-green-500 mt-1" />
                                      <span className="text-[9px] text-gray-600 line-clamp-1">
                                        {rides.find(r => r.driverId === loc.driverId && r.status === 'in-progress')?.pickupLocation}
                                      </span>
                                    </div>
                                    <div className="flex items-start gap-2">
                                      <div className="w-1.5 h-1.5 rounded-full bg-pex-gold mt-1" />
                                      <span className="text-[9px] text-gray-600 line-clamp-1">
                                        {rides.find(r => r.driverId === loc.driverId && r.status === 'in-progress')?.dropoffLocation}
                                      </span>
                                    </div>
                                  </div>
                                </>
                              )}
                            </div>
                          )}
                          
                          <div className="flex items-center gap-2 text-[10px] text-gray-400">
                            <Clock size={12} />
                            <span>Last updated: {new Date(loc.updatedAt).toLocaleTimeString()}</span>
                          </div>

                          <div className="pt-2 flex flex-col gap-2">
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="w-full text-xs h-8"
                              onClick={() => {
                                fetchDriverHistory(loc.driverId);
                              }}
                            >
                              <History size={14} className="mr-2" />
                              {showHistory === loc.driverId ? 'Hide History' : 'Show History'}
                            </Button>
                            <Button 
                              variant="secondary" 
                              size="sm" 
                              className="w-full text-xs h-8"
                              onClick={() => {
                                // Mock ride history view
                                addNotification(`Viewing ride history for ${loc.driverName}`, 'info');
                              }}
                            >
                              <Navigation size={14} className="mr-2" />
                              View Ride History
                            </Button>
                          </div>
                        </div>
                      </PopoverContent>
                    </Popover>
                  </div>
                ))}

                {/* Real-time Ride Markers */}
                {rides
                  .filter(r => r.status === 'requested' || r.status === 'in-progress')
                  .map((ride) => (
                  <div
                    key={ride.id}
                    className="absolute -translate-x-1/2 -translate-y-1/2 z-10"
                    style={{ 
                      left: `${30 + (Math.random() * 40)}%`, 
                      top: `${30 + (Math.random() * 40)}%` 
                    }}
                  >
                    <Popover>
                      <PopoverTrigger asChild>
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          whileHover={{ scale: 1.2 }}
                          className="cursor-pointer"
                        >
                          <div className={`w-6 h-6 rounded-full border-2 border-white shadow-lg flex items-center justify-center ${
                            ride.status === 'requested' ? 'bg-pex-gold' : 'bg-pex-blue'
                          }`}>
                            <MapPin size={12} className="text-white" />
                          </div>
                        </motion.div>
                      </PopoverTrigger>
                      <PopoverContent className="w-64 p-4">
                        <div className="space-y-3">
                          <div className="flex justify-between items-start">
                            <div>
                              <h4 className="font-bold text-sm text-pex-blue">{ride.passengerName || 'Anonymous'}</h4>
                              <p className="text-[10px] text-gray-500">Ride ID: {String(ride.id).slice(0, 8)}</p>
                            </div>
                            <Badge variant={ride.status === 'requested' ? 'secondary' : 'default'} className={ride.status === 'requested' ? 'bg-pex-gold text-pex-blue' : 'bg-pex-blue text-white'}>
                              {ride.status}
                            </Badge>
                          </div>
                          <div className="space-y-2">
                            <div className="flex items-start gap-2">
                              <div className="w-2 h-2 rounded-full bg-green-500 mt-1" />
                              <div className="flex-1">
                                <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Pickup</p>
                                <p className="text-xs text-gray-700">{ride.pickupLocation}</p>
                              </div>
                            </div>
                            <div className="flex items-start gap-2">
                              <div className="w-2 h-2 rounded-full bg-pex-gold mt-1" />
                              <div className="flex-1">
                                <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Dropoff</p>
                                <p className="text-xs text-gray-700">{ride.dropoffLocation}</p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </PopoverContent>
                    </Popover>
                  </div>
                ))}

                {/* Driver History Path */}
                {showHistory && historyData.length > 1 && (
                  <svg className="absolute inset-0 w-full h-full pointer-events-none overflow-visible">
                    <polyline
                      points={historyData.map(p => `${p.lng}%,${p.lat}%`).join(' ')}
                      fill="none"
                      stroke="#D4AF37"
                      strokeWidth="2"
                      strokeDasharray="4 2"
                      className="opacity-60"
                    />
                    {historyData.map((point, idx) => (
                      <circle
                        key={idx}
                        cx={`${point.lng}%`}
                        cy={`${point.lat}%`}
                        r="2"
                        fill="#D4AF37"
                        className="opacity-40"
                      />
                    ))}
                  </svg>
                )}

                {/* Ride Markers */}
                {rides.filter(r => r.status === 'requested' || r.status === 'in_progress').map((ride, idx) => {
                  const seed = ride.id * 10;
                  const lat1 = 30 + (seed % 40);
                  const lng1 = 20 + ((seed * 3) % 60);
                  const lat2 = 35 + ((seed * 2) % 35);
                  const lng2 = 25 + ((seed * 5) % 55);
                  
                  return (
                  <div key={ride.id}>
                    {/* Pickup Marker */}
                    <div 
                      className={`absolute w-4 h-4 rounded-full border-2 border-white shadow-lg group cursor-pointer ${ride.status === 'requested' ? 'bg-red-500 animate-bounce' : 'bg-blue-500'}`}
                      style={{ left: `${lng1}%`, top: `${lat1}%` }}
                    >
                      <div className={`absolute bottom-full left-1/2 -translate-x-1/2 mb-1 text-white text-[8px] px-2 py-0.5 rounded whitespace-nowrap ${ride.status === 'requested' ? 'bg-red-600' : 'bg-blue-600'}`}>
                        {ride.status === 'requested' ? 'New Request' : 'Pickup'}
                      </div>
                      
                      {/* Tooltip */}
                      <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-48 bg-white text-pex-blue p-3 rounded-lg shadow-2xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 border border-gray-100">
                        <p className="font-bold text-xs mb-1">Ride {ride.status === 'requested' ? 'Request' : 'In Progress'}</p>
                        <p className="text-[10px] text-pex-blue font-bold mb-1">Passenger: {ride.passengerName || 'Anonymous'}</p>
                        <p className="text-[10px] text-gray-500 mb-1">From: {ride.pickupLocation}</p>
                        <p className="text-[10px] text-gray-500 mb-2">To: {ride.dropoffLocation}</p>
                        <div className="flex justify-between items-center text-[10px] font-bold text-pex-gold">
                          <span>€{ride.price}</span>
                          <span>{ride.rideType}</span>
                        </div>
                      </div>
                    </div>

                    {/* Dropoff Marker (only for in_progress) */}
                    {ride.status === 'in_progress' && (
                      <>
                        <div 
                          className="absolute w-4 h-4 bg-green-500 rounded-full border-2 border-white shadow-lg group cursor-pointer"
                          style={{ left: `${lng2}%`, top: `${lat2}%` }}
                        >
                          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 bg-green-600 text-white text-[8px] px-2 py-0.5 rounded whitespace-nowrap">
                            Dropoff
                          </div>
                          
                          {/* Tooltip */}
                          <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-48 bg-white text-pex-blue p-3 rounded-lg shadow-2xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 border border-gray-100">
                            <p className="font-bold text-xs mb-1">Ride Dropoff</p>
                            <p className="text-[10px] text-pex-blue font-bold mb-1">Passenger: {ride.passengerName || 'Anonymous'}</p>
                            <p className="text-[10px] text-gray-500 mb-1">To: {ride.dropoffLocation}</p>
                          </div>
                        </div>
                        {/* Connecting Line */}
                        <svg className="absolute inset-0 w-full h-full pointer-events-none overflow-visible z-10">
                          <line
                            x1={`${lng1}%`} y1={`${lat1}%`}
                            x2={`${lng2}%`} y2={`${lat2}%`}
                            stroke="#3B82F6" strokeWidth="2" strokeDasharray="4 4" className="opacity-50"
                          />
                        </svg>
                      </>
                    )}
                  </div>
                )})}
              </Card>

              {/* Active Rides List */}
              <Card className="h-[600px] flex flex-col">
                <CardHeader className="pb-3 border-b border-gray-100">
                  <CardTitle className="text-lg">Recent Rides ({rides.length})</CardTitle>
                </CardHeader>
                <CardContent className="flex-1 overflow-y-auto p-0">
                  <div className="divide-y divide-gray-100">
                    {rides.length === 0 ? (
                      <div className="p-8 text-center text-gray-400">No rides found</div>
                    ) : (
                      rides.map((ride) => (
                        <div key={ride.id} className="p-4 hover:bg-gray-50 transition-colors group">
                          <div className="flex justify-between items-start mb-2">
                            <span className="font-bold text-pex-blue text-xs uppercase tracking-tighter">ID: {String(ride.id).slice(0, 8)}</span>
                            <div className="flex gap-1">
                              <Badge variant={ride.status === 'completed' ? 'default' : ride.status === 'requested' ? 'secondary' : 'destructive'} 
                                     className={ride.status === 'completed' ? 'bg-green-100 text-green-800 hover:bg-green-200' : ''}>
                                {ride.status}
                              </Badge>
                              {ride.status !== 'completed' && ride.status !== 'cancelled' && (
                                <Button variant="ghost" size="icon" className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => setRideToCancel(ride)}>
                                  <X size={12} className="text-red-500" />
                                </Button>
                              )}
                            </div>
                          </div>
                            <div className="text-sm text-gray-600 space-y-1">
                              <div className="flex justify-between items-center">
                                <p className="flex items-center gap-2 font-medium text-pex-blue"><Users size={14} /> {ride.passengerName || 'Anonymous'}</p>
                                {(ride.status === 'completed' || ride.status === 'in_progress') && ride.estimatedDuration && (
                                  <div className="flex items-center gap-1 text-[10px] text-gray-400">
                                    <Clock size={10} />
                                    <span>Est. {Math.round(ride.estimatedDuration)} min</span>
                                  </div>
                                )}
                              </div>
                              {ride.driverName && (
                                <p className="flex items-center gap-2 text-xs font-semibold text-green-600"><Car size={14} /> Driver: {ride.driverName}</p>
                              )}
                              <p className="flex items-center gap-2"><Map size={14} /> {ride.rideType} - {ride.vehicleName}</p>
                              {ride.preferences && (
                                <div className="flex flex-wrap gap-2 mt-2">
                                  {ride.preferences.silentMode && (
                                    <Badge variant="outline" className="text-[10px] border-pex-gold/30 text-pex-gold bg-pex-gold/5">
                                      <VolumeX size={10} className="mr-1" /> Silent Mode
                                    </Badge>
                                  )}
                                  <Badge variant="outline" className="text-[10px] border-pex-blue/30 text-pex-blue bg-pex-blue/5">
                                    <Thermometer size={10} className="mr-1" /> {ride.preferences.temperature}°C
                                  </Badge>
                                  <Badge variant="outline" className="text-[10px] border-pex-gold/30 text-pex-gold bg-pex-gold/5 uppercase">
                                    {ride.preferences.tripType}
                                  </Badge>
                                </div>
                              )}
                              <p className="flex items-center justify-between">
                                <span className="flex items-center gap-2"><DollarSign size={14} /> €{ride.price}</span>
                                <div className="flex flex-col items-end">
                                  <span className="text-[10px] text-gray-400">{ride.createdAt ? new Date(ride.createdAt).toLocaleTimeString() : 'Just now'}</span>
                                  {(ride.status === 'in_progress' || ride.status === 'completed') && ride.estimatedDuration && (
                                    <Badge variant="outline" className="mt-1 text-[10px] border-pex-gold/30 text-pex-gold bg-pex-gold/5 font-bold">
                                      <Clock size={10} className="mr-1" />
                                      Est. {Math.round(ride.estimatedDuration)} min
                                    </Badge>
                                  )}
                                </div>
                              </p>
                            </div>
                          <div className="mt-4 space-y-3 bg-gray-50 p-3 rounded-lg border border-gray-100">
                            <div className="flex flex-col gap-2">
                              <Label className="text-[10px] uppercase text-gray-400 font-bold">Update Status</Label>
                              <select 
                                className="w-full h-8 text-xs rounded-md border border-gray-200 bg-white px-2 focus:ring-1 focus:ring-pex-gold outline-none"
                                value={ride.status}
                                onChange={(e) => {
                                  if (e.target.value === 'cancelled') {
                                    setRideToCancel(ride.id);
                                  } else {
                                    updateRideStatus(ride.id, e.target.value);
                                  }
                                }}
                              >
                                <option value="requested">Requested</option>
                                <option value="assigned">Assigned</option>
                                <option value="in-progress">In Progress</option>
                                <option value="completed">Completed</option>
                                <option value="cancelled">Cancelled</option>
                              </select>
                            </div>
                            
                            {ride.status === 'requested' && (
                              <div className="flex flex-col gap-2">
                                <Label className="text-[10px] uppercase text-gray-400 font-bold">Assign Available Driver</Label>
                                <select 
                                  className="w-full h-8 text-xs rounded-md border border-gray-200 bg-white px-2 focus:ring-1 focus:ring-pex-gold outline-none"
                                  onChange={(e) => updateRideStatus(ride.id, 'assigned', e.target.value)}
                                  defaultValue=""
                                >
                                  <option value="" disabled>Select Driver...</option>
                                  {driverLocations
                                    .filter(d => d.status === 'available')
                                    .map(d => (
                                      <option key={d.driverId} value={d.driverId}>{d.driverName}</option>
                                    ))
                                  }
                                </select>
                              </div>
                            )}
                            
                            <div className="flex gap-2 pt-1 border-t border-gray-200 mt-2">
                              {ride.status === 'requested' && (
                                <>
                                  <Button 
                                    size="sm" 
                                    className="flex-1 h-8 text-[10px] bg-green-600 hover:bg-green-700 text-white font-bold" 
                                    onClick={() => {
                                      const availableDriver = driverLocations.find(d => d.status === 'available');
                                      if (availableDriver) {
                                        updateRideStatus(ride.id, 'assigned', availableDriver.driverId);
                                      } else {
                                        addNotification('No available drivers found', 'warning');
                                      }
                                    }}
                                  >
                                    Quick Assign
                                  </Button>
                                  <Button size="sm" variant="outline" className="flex-1 h-8 text-[10px] border-red-200 text-red-600 hover:bg-red-50" onClick={() => setRideToCancel(ride.id)}>Cancel Ride</Button>
                                </>
                              )}
                              {ride.status === 'assigned' && (
                                <Button size="sm" className="w-full h-8 text-[10px] bg-pex-blue hover:bg-pex-blue/90 text-white font-bold" onClick={() => updateRideStatus(ride.id, 'completed')}>Mark as Completed</Button>
                              )}
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {activeTab === 'fleet' && (
          <div className="space-y-6">
            <Tabs defaultValue="vehicles" className="w-full">
              <TabsList className="grid w-[400px] grid-cols-2 mb-8">
                <TabsTrigger value="vehicles">Vehicles</TabsTrigger>
                <TabsTrigger value="vehicle-types">Categories & Pricing</TabsTrigger>
              </TabsList>

              <TabsContent value="vehicles" className="space-y-6">
                <div className="flex justify-between items-center">
                  <h1 className="text-2xl font-bold text-pex-blue">Fleet Management</h1>
                  <Button className="bg-pex-blue text-white" onClick={() => setIsAddingVehicle(true)}>
                    <Plus size={16} className="mr-2" /> Add Vehicle
                  </Button>
                </div>

            {isAddingVehicle && (
              <Card className="p-6 bg-white border-pex-gold/30">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-bold text-pex-blue">New Vehicle Details</h3>
                  <Button variant="ghost" size="icon" onClick={() => setIsAddingVehicle(false)}><X size={18} /></Button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>Make</Label>
                    <Input value={newVehicle.make} onChange={e => setNewVehicle({...newVehicle, make: e.target.value})} placeholder="e.g. Mercedes-Benz" />
                  </div>
                  <div className="space-y-2">
                    <Label>Model</Label>
                    <Input value={newVehicle.model} onChange={e => setNewVehicle({...newVehicle, model: e.target.value})} placeholder="e.g. S-Class" />
                  </div>
                  <div className="space-y-2">
                    <Label>License Plate</Label>
                    <Input value={newVehicle.licensePlate} onChange={e => setNewVehicle({...newVehicle, licensePlate: e.target.value})} placeholder="ABC-1234" />
                  </div>
                  <div className="space-y-2">
                    <Label>Type</Label>
                    <select className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm" value={newVehicle.type} onChange={e => setNewVehicle({...newVehicle, type: e.target.value})}>
                      {vehicleTypes.map(type => (
                        <option key={type.id} value={type.name}>{type.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label>Capacity</Label>
                    <Input type="number" value={newVehicle.capacity} onChange={e => setNewVehicle({...newVehicle, capacity: parseInt(e.target.value)})} />
                  </div>
                  <div className="space-y-2">
                    <Label>Status</Label>
                    <select className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm" value={newVehicle.status} onChange={e => setNewVehicle({...newVehicle, status: e.target.value})}>
                      <option value="active">Active</option>
                      <option value="maintenance">Maintenance</option>
                      <option value="retired">Retired</option>
                    </select>
                  </div>
                  <div className="flex items-end">
                    <Button className="w-full bg-pex-gold text-pex-blue font-bold" onClick={handleAddVehicle}>Save Vehicle</Button>
                  </div>
                </div>
              </Card>
            )}

            {editingVehicle && (
              <Card className="p-6 bg-white border-pex-blue/30 mb-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-bold text-pex-blue">Edit Vehicle: {editingVehicle.make} {editingVehicle.model}</h3>
                  <Button variant="ghost" size="icon" onClick={() => setEditingVehicle(null)}><X size={18} /></Button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>Make</Label>
                    <Input value={editingVehicle.make} onChange={e => setEditingVehicle({...editingVehicle, make: e.target.value})} />
                  </div>
                  <div className="space-y-2">
                    <Label>Model</Label>
                    <Input value={editingVehicle.model} onChange={e => setEditingVehicle({...editingVehicle, model: e.target.value})} />
                  </div>
                  <div className="space-y-2">
                    <Label>License Plate</Label>
                    <Input value={editingVehicle.licensePlate} onChange={e => setEditingVehicle({...editingVehicle, licensePlate: e.target.value})} />
                  </div>
                  <div className="space-y-2">
                    <Label>Type</Label>
                    <select className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm" value={editingVehicle.type} onChange={e => setEditingVehicle({...editingVehicle, type: e.target.value})}>
                      {vehicleTypes.map(type => (
                        <option key={type.id} value={type.name}>{type.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label>Capacity</Label>
                    <Input type="number" value={editingVehicle.capacity} onChange={e => setEditingVehicle({...editingVehicle, capacity: parseInt(e.target.value)})} />
                  </div>
                  <div className="space-y-2">
                    <Label>Status</Label>
                    <select className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm" value={editingVehicle.status} onChange={e => setEditingVehicle({...editingVehicle, status: e.target.value})}>
                      <option value="active">Active</option>
                      <option value="maintenance">Maintenance</option>
                      <option value="retired">Retired</option>
                    </select>
                  </div>
                  <div className="flex items-end">
                    <Button className="w-full bg-pex-blue text-white font-bold" onClick={handleUpdateVehicle}>Update Vehicle</Button>
                  </div>
                </div>
              </Card>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {vehicles.map((v) => (
                <Card key={v.id} className="overflow-hidden">
                  <div className="p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="font-bold text-lg text-pex-blue">{v.make} {v.model}</h3>
                        <p className="text-xs text-gray-500 font-mono">{v.licensePlate}</p>
                      </div>
                      <Badge className={v.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}>
                        {v.status}
                      </Badge>
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-sm mb-4">
                      <div className="text-gray-500">Type: <span className="text-pex-blue font-medium">{v.type}</span></div>
                      <div className="text-gray-500">Capacity: <span className="text-pex-blue font-medium">{v.capacity} pax</span></div>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" className="flex-1" onClick={() => setEditingVehicle(v)}>Edit</Button>
                      <Button variant="outline" size="sm" className="text-red-500 hover:bg-red-50" onClick={() => handleDeleteVehicle(v.id)}>Delete</Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="vehicle-types" className="space-y-6">
            <div className="flex justify-between items-center">
              <h1 className="text-2xl font-bold text-pex-blue">Categories & Pricing</h1>
              <Button className="bg-pex-blue text-white" onClick={() => setIsAddingVehicleType(true)}>
                <Plus size={16} className="mr-2" /> Add Category
              </Button>
            </div>

            {isAddingVehicleType && (
              <Card className="p-6 bg-white border-pex-gold/30">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-bold text-pex-blue">New Vehicle Type</h3>
                  <Button variant="ghost" size="icon" onClick={() => setIsAddingVehicleType(false)}><X size={18} /></Button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>Name</Label>
                    <Input value={newVehicleType.name} onChange={e => setNewVehicleType({...newVehicleType, name: e.target.value})} placeholder="e.g. Business" />
                  </div>
                  <div className="space-y-2">
                    <Label>Base Price (€)</Label>
                    <Input type="number" value={newVehicleType.basePrice} onChange={e => setNewVehicleType({...newVehicleType, basePrice: parseFloat(e.target.value)})} />
                  </div>
                  <div className="space-y-2">
                    <Label>Price Multiplier</Label>
                    <Input type="number" step="0.1" value={newVehicleType.multiplier} onChange={e => setNewVehicleType({...newVehicleType, multiplier: parseFloat(e.target.value)})} />
                  </div>
                  <div className="space-y-2">
                    <Label>Price per KM (€)</Label>
                    <Input type="number" step="0.01" value={newVehicleType.pricePerKm} onChange={e => setNewVehicleType({...newVehicleType, pricePerKm: parseFloat(e.target.value)})} />
                  </div>
                  <div className="space-y-2">
                    <Label>Price per Min (€)</Label>
                    <Input type="number" step="0.01" value={newVehicleType.pricePerMin} onChange={e => setNewVehicleType({...newVehicleType, pricePerMin: parseFloat(e.target.value)})} />
                  </div>
                  <div className="space-y-2">
                    <Label>Min Fare (€)</Label>
                    <Input type="number" step="0.01" value={newVehicleType.minFare} onChange={e => setNewVehicleType({...newVehicleType, minFare: parseFloat(e.target.value)})} />
                  </div>
                  <div className="space-y-2">
                    <Label>Hourly Rate (€)</Label>
                    <Input type="number" step="0.01" value={newVehicleType.hourlyRate || 0} onChange={e => setNewVehicleType({...newVehicleType, hourlyRate: parseFloat(e.target.value)})} />
                  </div>
                  <div className="space-y-2">
                    <Label>Capacity</Label>
                    <Input type="number" value={newVehicleType.capacity} onChange={e => setNewVehicleType({...newVehicleType, capacity: parseInt(e.target.value)})} />
                  </div>
                  <div className="md:col-span-2 space-y-2">
                    <Label>Description</Label>
                    <Input value={newVehicleType.description} onChange={e => setNewVehicleType({...newVehicleType, description: e.target.value})} placeholder="Brief description of the service level" />
                  </div>
                  <div className="flex items-end">
                    <Button className="w-full bg-pex-gold text-pex-blue font-bold" onClick={handleAddVehicleType}>Save Type</Button>
                  </div>
                </div>
              </Card>
            )}

            {editingVehicleType && (
              <Card className="p-6 bg-white border-pex-blue/30 mb-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-bold text-pex-blue">Edit Vehicle Type: {editingVehicleType.name}</h3>
                  <Button variant="ghost" size="icon" onClick={() => setEditingVehicleType(null)}><X size={18} /></Button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>Name</Label>
                    <Input value={editingVehicleType.name} onChange={e => setEditingVehicleType({...editingVehicleType, name: e.target.value})} />
                  </div>
                  <div className="space-y-2">
                    <Label>Base Price (€)</Label>
                    <Input type="number" value={editingVehicleType.basePrice} onChange={e => setEditingVehicleType({...editingVehicleType, basePrice: parseFloat(e.target.value)})} />
                  </div>
                  <div className="space-y-2">
                    <Label>Price Multiplier</Label>
                    <Input type="number" step="0.1" value={editingVehicleType.multiplier} onChange={e => setEditingVehicleType({...editingVehicleType, multiplier: parseFloat(e.target.value)})} />
                  </div>
                  <div className="space-y-2">
                    <Label>Price per KM (€)</Label>
                    <Input type="number" step="0.01" value={editingVehicleType.pricePerKm} onChange={e => setEditingVehicleType({...editingVehicleType, pricePerKm: parseFloat(e.target.value)})} />
                  </div>
                  <div className="space-y-2">
                    <Label>Price per Min (€)</Label>
                    <Input type="number" step="0.01" value={editingVehicleType.pricePerMin} onChange={e => setEditingVehicleType({...editingVehicleType, pricePerMin: parseFloat(e.target.value)})} />
                  </div>
                  <div className="space-y-2">
                    <Label>Min Fare (€)</Label>
                    <Input type="number" step="0.01" value={editingVehicleType.minFare} onChange={e => setEditingVehicleType({...editingVehicleType, minFare: parseFloat(e.target.value)})} />
                  </div>
                  <div className="space-y-2">
                    <Label>Hourly Rate (€)</Label>
                    <Input type="number" step="0.01" value={editingVehicleType.hourlyRate || 0} onChange={e => setEditingVehicleType({...editingVehicleType, hourlyRate: parseFloat(e.target.value)})} />
                  </div>
                  <div className="space-y-2">
                    <Label>Capacity</Label>
                    <Input type="number" value={editingVehicleType.capacity} onChange={e => setEditingVehicleType({...editingVehicleType, capacity: parseInt(e.target.value)})} />
                  </div>
                  <div className="md:col-span-2 space-y-2">
                    <Label>Description</Label>
                    <Input value={editingVehicleType.description} onChange={e => setEditingVehicleType({...editingVehicleType, description: e.target.value})} />
                  </div>
                  <div className="flex items-end">
                    <Button className="w-full bg-pex-blue text-white font-bold" onClick={handleUpdateVehicleType}>Update Type</Button>
                  </div>
                </div>
              </Card>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {vehicleTypes.map((type) => (
                <Card key={type.id} className="overflow-hidden border-none shadow-md hover:shadow-lg transition-shadow bg-white group">
                  <div className="p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="font-bold text-lg text-pex-blue">{type.name}</h3>
                        <p className="text-xs text-gray-500">{type.description}</p>
                      </div>
                      <Badge className="bg-pex-gold/20 text-pex-blue border-none">
                        x{type.multiplier}
                      </Badge>
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-sm mb-4">
                      <div className="text-gray-500">Base Price: <span className="text-pex-blue font-medium">€{type.basePrice}</span></div>
                      <div className="text-gray-500">Price/KM: <span className="text-pex-blue font-medium">€{type.pricePerKm}</span></div>
                      <div className="text-gray-500">Price/Min: <span className="text-pex-blue font-medium">€{type.pricePerMin}</span></div>
                      <div className="text-gray-500">Min Fare: <span className="text-pex-blue font-medium">€{type.minFare}</span></div>
                      <div className="text-gray-500">Hourly Rate: <span className="text-pex-blue font-medium">€{type.hourlyRate || (type.basePrice * 3)}</span></div>
                      <div className="text-gray-500">Capacity: <span className="text-pex-blue font-medium">{type.capacity} pax</span></div>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" className="flex-1" onClick={() => setEditingVehicleType(type)}>Edit</Button>
                      <Button variant="outline" size="sm" className="text-red-500 hover:bg-red-50" onClick={() => handleDeleteVehicleType(type.id)}>Delete</Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    )}

        {activeTab === 'drivers' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h1 className="text-2xl font-bold text-pex-blue">Driver Management</h1>
              <div className="flex gap-3">
                <select 
                  className="h-10 rounded-md border border-gray-200 bg-white px-3 text-sm focus:ring-1 focus:ring-pex-gold outline-none"
                  value={driverManagementFilter}
                  onChange={(e) => setDriverManagementFilter(e.target.value as any)}
                >
                  <option value="all">All Status</option>
                  <option value="active">Active</option>
                  <option value="pending">Pending</option>
                  <option value="rejected">Rejected</option>
                </select>
                <Button className="bg-pex-blue text-white" onClick={() => setIsAddingDriver(true)}>
                  <Plus size={16} className="mr-2" /> Register New Driver
                </Button>
              </div>
            </div>

            {isAddingDriver && (
              <Card className="p-8 max-w-2xl mx-auto relative">
                <Button variant="ghost" size="icon" className="absolute top-4 right-4" onClick={() => setIsAddingDriver(false)}><X size={18} /></Button>
                <div className="space-y-6">
                  <h3 className="text-xl font-bold text-pex-blue">Driver Onboarding</h3>
                  <div className="grid grid-cols-1 gap-4">
                    <div className="space-y-2">
                      <Label>Full Name</Label>
                      <Input value={newDriver.displayName} onChange={e => setNewDriver({...newDriver, displayName: e.target.value})} placeholder="John Doe" />
                    </div>
                    <div className="space-y-2">
                      <Label>Email Address</Label>
                      <Input type="email" value={newDriver.email} onChange={e => setNewDriver({...newDriver, email: e.target.value})} placeholder="john@example.com" />
                    </div>
                    <div className="space-y-2">
                      <Label>Phone Number</Label>
                      <Input value={newDriver.phoneNumber} onChange={e => setNewDriver({...newDriver, phoneNumber: e.target.value})} placeholder="+351 912 345 678" />
                    </div>
                    <div className="space-y-2">
                      <Label>Driver's License</Label>
                      <Input value={newDriver.licenseNumber} onChange={e => setNewDriver({...newDriver, licenseNumber: e.target.value})} placeholder="AB123456" />
                    </div>
                  </div>
                  <div className="pt-4">
                    <Button className="w-full bg-pex-blue text-white h-12 text-lg" onClick={() => {
                      handleRegisterDriver();
                      setIsAddingDriver(false);
                    }}>
                      Register Driver
                    </Button>
                  </div>
                </div>
              </Card>
            )}

            <div className="grid grid-cols-1 gap-4">
              {drivers
                .filter(d => driverManagementFilter === 'all' || d.status === driverManagementFilter)
                .map((driver) => {
                  const availability = driverLocations.find(l => l.driverId === driver.uid)?.status || 'offline';
                  return (
                    <Card key={driver.uid} className="p-4">
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-pex-blue/10 rounded-full flex items-center justify-center relative">
                            <User size={24} className="text-pex-blue" />
                            <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white ${
                              availability === 'available' ? 'bg-green-500' : 
                              availability === 'busy' ? 'bg-yellow-500' : 'bg-gray-400'
                            }`} title={`Availability: ${availability}`} />
                          </div>
                          <div>
                            <h3 className="font-bold text-pex-blue">{driver.displayName}</h3>
                            <div className="flex items-center gap-2">
                              <p className="text-sm text-gray-500">{driver.email}</p>
                              <span className="text-xs text-gray-300">|</span>
                              <span className={`text-[10px] font-bold uppercase ${
                                availability === 'available' ? 'text-green-600' : 
                                availability === 'busy' ? 'text-yellow-600' : 'text-gray-400'
                              }`}>
                                {availability}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <Badge className={
                            driver.status === 'active' ? 'bg-green-100 text-green-800' :
                            driver.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-red-100 text-red-800'
                          }>
                            {driver.status?.toUpperCase() || 'PENDING'}
                          </Badge>
                          {driver.status === 'pending' && (
                            <div className="flex gap-2">
                              <Button size="sm" variant="outline" className="border-pex-blue text-pex-blue" onClick={() => setViewingDriverDocs(driver.uid)}>View Docs</Button>
                              <Button size="sm" className="bg-green-600 hover:bg-green-700 text-white" onClick={() => handleApproveDriver(driver.uid, 'active')}>Approve</Button>
                              <Button size="sm" variant="destructive" onClick={() => handleApproveDriver(driver.uid, 'rejected')}>Reject</Button>
                            </div>
                          )}
                          {driver.status !== 'pending' && (
                            <Button size="sm" variant="outline" className="border-pex-blue text-pex-blue" onClick={() => setViewingDriverDocs(driver.uid)}>View Docs</Button>
                          )}
                        </div>
                      </div>
                    </Card>
                  );
                })}
              {drivers.length === 0 && (
                <div className="text-center py-12 text-gray-400">
                  <Users size={48} className="mx-auto mb-2 opacity-20" />
                  <p>No drivers registered yet.</p>
                </div>
              )}
            </div>

            {viewingDriverDocs && (
              <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                <Card className="w-full max-w-2xl bg-white p-6 max-h-[90vh] overflow-y-auto">
                  <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-bold text-pex-blue">Driver Documents Verification</h2>
                    <Button variant="ghost" size="icon" onClick={() => setViewingDriverDocs(null)}><X size={18} /></Button>
                  </div>
                  
                  <div className="space-y-4">
                    {[
                      { id: 'license', name: 'Driver\'s License', status: 'pending' },
                      { id: 'professional', name: 'Professional License (VTC/TVDE)', status: 'pending' },
                      { id: 'background', name: 'Criminal Record Certificate', status: 'pending' },
                      { id: 'insurance', name: 'Commercial Insurance', status: 'pending' },
                      { id: 'registration', name: 'Vehicle Registration', status: 'pending' },
                      { id: 'photo', name: 'Professional Profile Photo', status: 'pending' }
                    ].map(doc => (
                      <div key={doc.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div>
                          <p className="font-bold text-sm text-pex-blue">{doc.name}</p>
                          <p className="text-xs text-gray-400 mt-1">Uploaded on: {new Date().toLocaleDateString()}</p>
                        </div>
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline" className="border-pex-blue text-pex-blue">View File</Button>
                          <Button size="sm" className="bg-green-600 text-white">Verify</Button>
                          <Button size="sm" variant="destructive">Reject</Button>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  <div className="mt-8 flex justify-end gap-4 border-t pt-4">
                    <Button variant="outline" onClick={() => setViewingDriverDocs(null)}>Close</Button>
                    <Button className="bg-pex-blue text-white" onClick={() => {
                      handleApproveDriver(viewingDriverDocs, 'active');
                      setViewingDriverDocs(null);
                    }}>Approve Driver</Button>
                  </div>
                </Card>
              </div>
            )}
          </div>
        )}

        {activeTab === 'pricing' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center bg-white p-4 rounded-xl shadow-sm border border-gray-100">
              <h1 className="text-2xl font-bold text-pex-blue">Pricing Management</h1>
              <Button className="bg-pex-gold text-pex-blue font-bold" onClick={handleSaveSettings}>
                Save Changes
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Car size={20} className="text-pex-gold" />
                    Global Ride Pricing
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Base Fare (€)</Label>
                      <Input 
                        type="number" 
                        value={globalSettings.base_fare} 
                        onChange={e => setGlobalSettings({...globalSettings, base_fare: parseFloat(e.target.value)})}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Min Fare (€)</Label>
                      <Input 
                        type="number" 
                        value={globalSettings.min_fare} 
                        onChange={e => setGlobalSettings({...globalSettings, min_fare: parseFloat(e.target.value)})}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Price per KM (€)</Label>
                      <Input 
                        type="number" 
                        value={globalSettings.normal_price_per_km} 
                        onChange={e => setGlobalSettings({...globalSettings, normal_price_per_km: parseFloat(e.target.value)})}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Price per Min (€)</Label>
                      <Input 
                        type="number" 
                        value={globalSettings.price_per_min} 
                        onChange={e => setGlobalSettings({...globalSettings, price_per_min: parseFloat(e.target.value)})}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <MapPin size={20} className="text-pex-gold" />
                    Tour Experience Multipliers
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-gray-500">
                    Tour experience prices are set per POI in the POI Manager.
                    These base rates are for quick reference.
                  </p>
                  {[
                    { name: 'Lisbon - Porto', price: 450 },
                    { name: 'Lisbon - Algarve', price: 550 },
                    { name: 'Porto - Douro Valley', price: 350 },
                    { name: 'Lisbon - Sintra', price: 150 }
                  ].map((t) => (
                    <div key={t.name} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <span className="font-medium">{t.name}</span>
                      <span className="font-bold text-pex-gold">€{t.price}</span>
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card className="md:col-span-2">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Info size={20} className="text-pex-gold" />
                    Footer & Contact Settings
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label>Address</Label>
                      <Input value={footerSettings.address} onChange={e => setFooterSettings({...footerSettings, address: e.target.value})} />
                    </div>
                    <div className="space-y-2">
                      <Label>Phone</Label>
                      <Input value={footerSettings.phone} onChange={e => setFooterSettings({...footerSettings, phone: e.target.value})} />
                    </div>
                    <div className="space-y-2">
                      <Label>Email</Label>
                      <Input value={footerSettings.email} onChange={e => setFooterSettings({...footerSettings, email: e.target.value})} />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label>Instagram URL</Label>
                      <Input value={footerSettings.instagram} onChange={e => setFooterSettings({...footerSettings, instagram: e.target.value})} />
                    </div>
                    <div className="space-y-2">
                      <Label>X (Twitter) URL</Label>
                      <Input value={footerSettings.twitter} onChange={e => setFooterSettings({...footerSettings, twitter: e.target.value})} />
                    </div>
                    <div className="space-y-2">
                      <Label>Facebook URL</Label>
                      <Input value={footerSettings.facebook} onChange={e => setFooterSettings({...footerSettings, facebook: e.target.value})} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Car size={20} className="text-pex-gold" />
                  Vehicle Types & Pricing
                </CardTitle>
                <Button size="sm" className="bg-pex-blue text-white" onClick={() => {
                  const newType = { name: 'New Type', basePrice: 15, multiplier: 1, capacity: 4, description: 'Luxury Sedan', hourlyRate: 45, pricePerKm: 1.5, pricePerMin: 0.5, minFare: 15 };
                  addDoc(collection(db, 'vehicle_types'), newType);
                }}>
                  <Plus size={16} className="mr-2" /> Add Vehicle Type
                </Button>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {vehicleTypes.map((vt) => (
                    <div key={vt.id} className="p-4 border rounded-xl space-y-3 relative group">
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => deleteDoc(doc(db, 'vehicle_types', vt.id))}
                      >
                        <X size={14} className="text-red-500" />
                      </Button>
                      <div className="grid grid-cols-2 gap-2">
                        <div className="space-y-1">
                          <Label className="text-[10px] uppercase text-gray-400">Name</Label>
                          <Input 
                            value={vt.name} 
                            onChange={e => updateDoc(doc(db, 'vehicle_types', vt.id), { name: e.target.value })}
                            className="h-8 text-sm font-bold"
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-[10px] uppercase text-gray-400">Example Vehicle (e.g. Mercedes S-Class)</Label>
                          <Input 
                            value={vt.exampleVehicle || ''} 
                            onChange={e => updateDoc(doc(db, 'vehicle_types', vt.id), { exampleVehicle: e.target.value })}
                            className="h-8 text-sm"
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div className="space-y-1">
                          <Label className="text-[10px] uppercase text-gray-400">Base Price (€)</Label>
                          <Input 
                            type="number"
                            value={vt.basePrice || vt.base_price || 0} 
                            onChange={e => updateDoc(doc(db, 'vehicle_types', vt.id), { basePrice: parseFloat(e.target.value) })}
                            className="h-8 text-sm"
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-[10px] uppercase text-gray-400">Multiplier</Label>
                          <Input 
                            type="number"
                            step="0.1"
                            value={vt.multiplier || 1} 
                            onChange={e => updateDoc(doc(db, 'vehicle_types', vt.id), { multiplier: parseFloat(e.target.value) })}
                            className="h-8 text-sm"
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div className="space-y-1">
                          <Label className="text-[10px] uppercase text-gray-400">Price per KM (€)</Label>
                          <Input 
                            type="number"
                            step="0.1"
                            value={vt.pricePerKm || 0} 
                            onChange={e => updateDoc(doc(db, 'vehicle_types', vt.id), { pricePerKm: parseFloat(e.target.value) })}
                            className="h-8 text-sm"
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-[10px] uppercase text-gray-400">Price per Min (€)</Label>
                          <Input 
                            type="number"
                            step="0.1"
                            value={vt.pricePerMin || 0} 
                            onChange={e => updateDoc(doc(db, 'vehicle_types', vt.id), { pricePerMin: parseFloat(e.target.value) })}
                            className="h-8 text-sm"
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        <div className="space-y-1">
                          <Label className="text-[10px] uppercase text-gray-400">Min Fare (€)</Label>
                          <Input 
                            type="number"
                            value={vt.minFare || 0} 
                            onChange={e => updateDoc(doc(db, 'vehicle_types', vt.id), { minFare: parseFloat(e.target.value) })}
                            className="h-8 text-sm"
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-[10px] uppercase text-gray-400">Hourly (€/h)</Label>
                          <Input 
                            type="number"
                            value={vt.hourlyRate || 0} 
                            onChange={e => updateDoc(doc(db, 'vehicle_types', vt.id), { hourlyRate: parseFloat(e.target.value) })}
                            className="h-8 text-sm"
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-[10px] uppercase text-gray-400">Capacity</Label>
                          <Input 
                            type="number"
                            value={vt.capacity || 1} 
                            onChange={e => updateDoc(doc(db, 'vehicle_types', vt.id), { capacity: parseInt(e.target.value) })}
                            className="h-8 text-sm"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === 'support' && (
          <div className="h-[calc(100vh-160px)] flex gap-6">
            {/* Chat List */}
            <Card className="w-80 flex flex-col">
              <CardHeader className="border-b">
                <CardTitle className="text-lg">Active Chats</CardTitle>
              </CardHeader>
              <div className="flex-1 overflow-y-auto">
                {chats.map(chat => (
                  <div 
                    key={chat.id} 
                    onClick={() => setSelectedChat(chat)}
                    className={`p-4 border-b cursor-pointer transition-colors ${selectedChat?.id === chat.id ? 'bg-pex-blue/5 border-l-4 border-l-pex-gold' : 'hover:bg-gray-50'}`}
                  >
                    <p className="font-bold text-pex-blue text-sm">{chat.displayName || 'Anonymous User'}</p>
                    <p className="text-xs text-gray-500 truncate">{chat.email}</p>
                  </div>
                ))}
              </div>
            </Card>

            {/* Chat Window */}
            <Card className="flex-1 flex flex-col">
              {selectedChat ? (
                <>
                  <CardHeader className="border-b flex flex-row items-center justify-between">
                    <div>
                      <CardTitle className="text-lg">{selectedChat.displayName}</CardTitle>
                      <p className="text-xs text-gray-400">Support Session: {selectedChat.id}</p>
                    </div>
                    <Badge className="bg-green-500">Live</Badge>
                  </CardHeader>
                    <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-4 bg-gray-50">
                      {messages.map((msg, idx) => {
                        const prevMsg = messages[idx - 1];
                        const showDate = !prevMsg || new Date(msg.created_at).toDateString() !== new Date(prevMsg.created_at).toDateString();
                        
                        return (
                          <React.Fragment key={msg.id}>
                            {showDate && (
                              <div className="flex justify-center my-4">
                                <span className="px-3 py-1 bg-gray-200 text-gray-500 text-[10px] rounded-full uppercase tracking-wider font-bold">
                                  {new Date(msg.created_at).toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' })}
                                </span>
                              </div>
                            )}
                            <div className={`flex ${msg.sender_id === currentUser?.uid ? 'justify-end' : 'justify-start'}`}>
                              <div className={`max-w-[70%] p-3 rounded-2xl shadow-sm ${
                                msg.sender_id === currentUser?.uid ? 'bg-pex-blue text-white rounded-tr-none' : 'bg-white text-gray-800 rounded-tl-none'
                              }`}>
                                <p className="text-sm">{msg.text}</p>
                                <div className={`flex items-center justify-between gap-4 mt-1 ${msg.sender_id === currentUser?.uid ? 'text-white/60' : 'text-gray-400'}`}>
                                  <p className="text-[10px]">
                                    {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                  </p>
                                  {msg.sender_id === currentUser?.uid && (
                                    <div className="flex">
                                      <CheckCircle2 size={10} className={`${msg.read_at ? 'text-pex-gold' : 'text-white/40'}`} />
                                      {msg.read_at && <CheckCircle2 size={10} className="text-pex-gold -ml-1" />}
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          </React.Fragment>
                        );
                      })}
                      {typingUsers[selectedChat.uid] && (
                        <div className="flex justify-start">
                          <div className="bg-white text-gray-400 p-2 rounded-2xl rounded-tl-none shadow-sm text-[10px] italic flex items-center gap-2">
                            <div className="flex gap-1">
                              <span className="w-1 h-1 bg-gray-300 rounded-full animate-bounce" />
                              <span className="w-1 h-1 bg-gray-300 rounded-full animate-bounce [animation-delay:0.2s]" />
                              <span className="w-1 h-1 bg-gray-300 rounded-full animate-bounce [animation-delay:0.4s]" />
                            </div>
                            {selectedChat.displayName} is typing...
                          </div>
                        </div>
                      )}
                    </div>
                    <div className="p-4 border-t bg-white">
                      <div className="flex gap-2">
                        <Input 
                          value={newMessage} 
                          onChange={e => onInputChange(e.target.value)}
                          onBlur={() => handleTyping(false)}
                          onKeyPress={e => e.key === 'Enter' && sendMessage()}
                          placeholder="Type your message..." 
                          className="flex-1"
                        />
                        <Button onClick={sendMessage} className="bg-pex-blue text-white">
                          <Send size={18} />
                        </Button>
                      </div>
                    </div>
                </>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-gray-400">
                  <MessageSquare size={48} className="mb-4 opacity-20" />
                  <p>Select a chat to start messaging</p>
                </div>
              )}
            </Card>
          </div>
        )}

        {activeTab === 'financial' && (
          <div className="space-y-6">
            <h1 className="text-2xl font-bold text-pex-blue">Financial Suite</h1>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card>
                <CardContent className="p-6">
                  <p className="text-sm text-gray-500 uppercase tracking-wider font-semibold mb-1">Real-time Revenue</p>
                  <p className="text-3xl font-bold text-pex-blue">€{totalRevenue.toLocaleString()}</p>
                  <p className="text-sm text-green-600 mt-2 flex items-center gap-1"><CheckCircle2 size={14} /> From completed rides</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6">
                  <p className="text-sm text-gray-500 uppercase tracking-wider font-semibold mb-1">Driver Commissions</p>
                  <p className="text-3xl font-bold text-pex-blue">€{(totalRevenue * 0.7).toLocaleString()}</p>
                  <p className="text-sm text-gray-500 mt-2">70% average split</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6">
                  <p className="text-sm text-gray-500 uppercase tracking-wider font-semibold mb-1">Net Profit</p>
                  <p className="text-3xl font-bold text-pex-blue">€{(totalRevenue * 0.3).toLocaleString()}</p>
                  <p className="text-sm text-pex-gold mt-2">30% of total revenue</p>
                </CardContent>
              </Card>
            </div>

            <Card className="h-[400px]">
              <CardHeader>
                <CardTitle>Revenue Trend (Mockup)</CardTitle>
              </CardHeader>
              <CardContent className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={revenueData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#6B7280' }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fill: '#6B7280' }} tickFormatter={(value) => `€${value}`} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#0A1128', color: '#fff', borderRadius: '8px', border: 'none' }}
                      itemStyle={{ color: '#D4AF37' }}
                    />
                    <Line type="monotone" dataKey="revenue" stroke="#D4AF37" strokeWidth={3} dot={{ r: 4, fill: '#0A1128', strokeWidth: 2 }} activeDot={{ r: 6, fill: '#D4AF37' }} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === 'ride-history' && (
          <div className="space-y-6">
            <h1 className="text-2xl font-bold text-pex-blue">Ride History</h1>
            <Card className="p-6 bg-white border-pex-blue/30">
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="text-xs text-gray-500 uppercase bg-gray-50">
                    <tr>
                      <th className="px-4 py-3">ID</th>
                      <th className="px-4 py-3">Date</th>
                      <th className="px-4 py-3">Passenger</th>
                      <th className="px-4 py-3">Driver</th>
                      <th className="px-4 py-3">Route</th>
                      <th className="px-4 py-3">Price</th>
                      <th className="px-4 py-3">Duration</th>
                      <th className="px-4 py-3">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rides.filter(r => r.status === 'completed' || r.status === 'cancelled').map((ride) => (
                      <tr key={ride.id} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="px-4 py-3 font-mono text-xs">{String(ride.id).slice(0, 8)}</td>
                        <td className="px-4 py-3">{new Date(ride.createdAt).toLocaleDateString()}</td>
                        <td className="px-4 py-3 font-medium text-pex-blue">{ride.passengerName || 'Anonymous'}</td>
                        <td className="px-4 py-3">{ride.driverName || '-'}</td>
                        <td className="px-4 py-3">
                          <div className="flex flex-col gap-1 text-xs">
                            <span className="text-gray-500 truncate max-w-[200px]">From: {ride.pickupLocation}</span>
                            <span className="text-gray-500 truncate max-w-[200px]">To: {ride.dropoffLocation}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 font-medium text-pex-gold">€{ride.price}</td>
                        <td className="px-4 py-3 text-gray-500">{formatDuration(ride.startedAt, ride.completedAt) || '-'}</td>
                        <td className="px-4 py-3">
                          <Badge variant={ride.status === 'completed' ? 'default' : 'destructive'} 
                                 className={ride.status === 'completed' ? 'bg-green-100 text-green-800' : ''}>
                            {ride.status}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                    {rides.filter(r => r.status === 'completed' || r.status === 'cancelled').length === 0 && (
                      <tr>
                        <td colSpan={8} className="px-4 py-8 text-center text-gray-400">No ride history found</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>
        )}

        {activeTab === 'poi-manager' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h1 className="text-2xl font-bold text-pex-blue">POI Manager</h1>
              <Button className="bg-pex-blue hover:bg-pex-blue/90 text-white" onClick={() => setIsAddingPOI(true)}>
                <Plus size={16} className="mr-2" /> Add New POI
              </Button>
            </div>

            {isAddingPOI && (
              <Card className="p-6 bg-white border-pex-gold/30">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-bold text-pex-blue">New POI Details</h3>
                  <Button variant="ghost" size="icon" onClick={() => setIsAddingPOI(false)}><X size={18} /></Button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="space-y-2">
                    <Label>Name</Label>
                    <Input value={newPOI.name} onChange={e => setNewPOI({...newPOI, name: e.target.value})} placeholder="e.g. Óbidos Castle" />
                  </div>
                  <div className="space-y-2">
                    <Label>Normal Price (€)</Label>
                    <Input type="number" value={newPOI.price} onChange={e => setNewPOI({...newPOI, price: parseFloat(e.target.value)})} />
                  </div>
                  <div className="space-y-2">
                    <Label>Tour Price (€)</Label>
                    <Input type="number" value={newPOI.tourPrice} onChange={e => setNewPOI({...newPOI, tourPrice: parseFloat(e.target.value)})} />
                  </div>
                  <div className="space-y-2">
                    <Label>Duration</Label>
                    <Input value={newPOI.duration} onChange={e => setNewPOI({...newPOI, duration: e.target.value})} placeholder="e.g. +1.5 hrs" />
                  </div>
                  <div className="space-y-2 md:col-span-3">
                    <Label>Image URL</Label>
                    <Input value={newPOI.imageUrl} onChange={e => setNewPOI({...newPOI, imageUrl: e.target.value})} placeholder="https://..." />
                  </div>
                  <div className="flex items-end">
                    <Button className="w-full bg-pex-gold text-pex-blue font-bold" onClick={handleAddPOI}>Save POI</Button>
                  </div>
                </div>
              </Card>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {pois.map((poi) => (
                <Card key={poi.id} className="overflow-hidden">
                  <div className="h-32 bg-gray-200 relative">
                    <img src={poi.image_url || `https://images.unsplash.com/photo-1524661135-423995f22d0b?auto=format&fit=crop&q=80&w=400&h=200&sig=${poi.id}`} alt={poi.name} className="object-cover w-full h-full" referrerPolicy="no-referrer" />
                    <div className="absolute top-2 right-2">
                      <Badge variant={poi.status === 'Active' ? 'default' : 'secondary'} className={poi.status === 'Active' ? 'bg-green-500 hover:bg-green-600' : ''}>
                        {poi.status}
                      </Badge>
                    </div>
                  </div>
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-bold text-lg text-pex-blue">{poi.name}</h3>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500 hover:bg-red-50" onClick={() => handleDeletePOI(poi.id)}>
                          <Trash2 size={16} />
                        </Button>
                      </div>
                    </div>
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <span className="flex items-center gap-1"><Clock size={12} /> {poi.duration}</span>
                      <div className="flex flex-col items-end">
                        <span className="font-bold text-pex-blue">Normal: €{poi.price}</span>
                        <span className="font-bold text-pex-gold">Tour: €{poi.tour_price}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'tours-manager' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h1 className="text-2xl font-bold text-pex-blue">Tours Manager</h1>
              <Button className="bg-pex-blue hover:bg-pex-blue/90 text-white" onClick={() => setIsAddingTour(true)}>
                <Plus size={16} className="mr-2" /> Add New Tour
              </Button>
            </div>

            {isAddingTour && (
              <Card className="p-6 bg-white border-pex-gold/30">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-bold text-pex-blue">New Tour Details</h3>
                  <Button variant="ghost" size="icon" onClick={() => setIsAddingTour(false)}><X size={18} /></Button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="space-y-2">
                    <Label>Tour Name</Label>
                    <Input value={newTour.name} onChange={e => setNewTour({...newTour, name: e.target.value})} placeholder="e.g. Sintra & Cascais Tour" />
                  </div>
                  <div className="space-y-2">
                    <Label>Duration (Hours)</Label>
                    <Input type="number" value={newTour.durationHours} onChange={e => setNewTour({...newTour, durationHours: parseFloat(e.target.value)})} />
                  </div>
                  <div className="space-y-2">
                    <Label>Base Price (€)</Label>
                    <Input type="number" value={newTour.basePrice} onChange={e => setNewTour({...newTour, basePrice: parseFloat(e.target.value)})} />
                  </div>
                  <div className="space-y-2">
                    <Label>Status</Label>
                    <select 
                      className="w-full h-10 px-3 rounded-md border border-input bg-background"
                      value={newTour.isActive ? 'active' : 'inactive'} 
                      onChange={e => setNewTour({...newTour, isActive: e.target.value === 'active'})}
                    >
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                    </select>
                  </div>
                  <div className="space-y-2 md:col-span-3">
                    <Label>Description</Label>
                    <Input value={newTour.description} onChange={e => setNewTour({...newTour, description: e.target.value})} placeholder="Tour description..." />
                  </div>
                  <div className="flex items-end">
                    <Button className="w-full bg-pex-gold text-pex-blue font-bold" onClick={handleAddTour}>Save Tour</Button>
                  </div>
                </div>
              </Card>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {tours.map((tour) => (
                <Card key={tour.id} className="overflow-hidden">
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-bold text-lg text-pex-blue">{tour.name}</h3>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500 hover:bg-red-50" onClick={() => handleDeleteTour(tour.id)}>
                          <Trash2 size={16} />
                        </Button>
                      </div>
                    </div>
                    <p className="text-sm text-gray-500 mb-4 line-clamp-2">{tour.description}</p>
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <span className="flex items-center gap-1"><Clock size={12} /> {tour.durationHours} hours</span>
                      <div className="flex flex-col items-end">
                        <span className="font-bold text-pex-gold text-lg">€{tour.basePrice}</span>
                      </div>
                    </div>
                    <div className="mt-2 text-right">
                      <Badge variant={tour.isActive ? 'default' : 'secondary'} className={tour.isActive ? 'bg-green-500 hover:bg-green-600' : ''}>
                        {tour.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useFirebase } from '../FirebaseProvider';
import { Map, Users, DollarSign, MessageSquare, CheckCircle2, Clock, AlertCircle, Car, Navigation, ChevronRight, LogOut } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { socket } from '../lib/socket';

export default function DriverApp() {
  const { user: currentUser, profile, signOut } = useFirebase();
  const [activeRides, setActiveRides] = useState<any[]>([]);
  const [status, setStatus] = useState<'available' | 'busy' | 'offline'>('offline');
  const [location, setLocation] = useState({ lat: 38.7223, lng: -9.1393 }); // Lisbon default

  useEffect(() => {
    if (!currentUser) return;

    // Fetch assigned rides
    const fetchRides = async () => {
      try {
        const res = await fetch(`/api/rides?driverId=${currentUser.uid}`);
        const data = await res.json();
        setActiveRides(data.filter((r: any) => r.status !== 'completed' && r.status !== 'cancelled'));
      } catch (err) {
        console.error('Error fetching rides:', err);
      }
    };

    fetchRides();

    // Update location periodically
    const interval = setInterval(() => {
      if (status !== 'offline') {
        const newLat = location.lat + (Math.random() - 0.5) * 0.001;
        const newLng = location.lng + (Math.random() - 0.5) * 0.001;
        setLocation({ lat: newLat, lng: newLng });
        
        fetch('/api/driver-locations', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            driverId: currentUser.uid,
            driverName: profile?.displayName || 'Driver',
            lat: newLat,
            lng: newLng,
            status: status
          })
        });
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [currentUser, status, location, profile]);

  const updateRideStatus = async (rideId: string | number, newStatus: string) => {
    try {
      await fetch(`/api/rides/${rideId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      setActiveRides(prev => prev.map(r => r.id === rideId ? { ...r, status: newStatus } : r));
    } catch (err) {
      console.error('Error updating ride status:', err);
    }
  };

  if (profile?.role !== 'driver') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <Card className="max-w-md w-full text-center p-8">
          <AlertCircle size={48} className="mx-auto text-red-500 mb-4" />
          <h2 className="text-2xl font-bold mb-2">Access Denied</h2>
          <p className="text-gray-500 mb-6">This panel is only accessible to approved drivers.</p>
          <Button onClick={() => window.location.href = '/'}>Go to Home</Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-pex-blue text-white p-4 shadow-lg flex justify-between items-center">
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
          <Button variant="ghost" size="icon" onClick={signOut}>
            <LogOut size={18} />
          </Button>
        </div>
      </header>

      <main className="flex-1 p-4 max-w-4xl mx-auto w-full space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          <Card className="bg-white border-none shadow-sm">
            <CardContent className="p-4 text-center">
              <p className="text-[10px] text-gray-400 uppercase font-bold mb-1">Today's Earnings</p>
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

        {/* Assigned Rides */}
        <div className="space-y-4">
          <h2 className="text-sm font-bold text-gray-400 uppercase tracking-widest px-1">Active Assignments</h2>
          {activeRides.length === 0 ? (
            <div className="bg-white p-12 rounded-2xl text-center border-2 border-dashed border-gray-100">
              <Car size={48} className="mx-auto text-gray-200 mb-4" />
              <p className="text-gray-400 font-medium">No active rides assigned to you.</p>
              <p className="text-xs text-gray-300 mt-1">Stay available to receive new requests.</p>
            </div>
          ) : (
            activeRides.map((ride) => (
              <Card key={ride.id} className="overflow-hidden border-none shadow-md">
                <CardHeader className="bg-pex-blue text-white p-4 flex flex-row justify-between items-center">
                  <div>
                    <CardTitle className="text-sm font-bold">Ride #{String(ride.id).slice(0, 8)}</CardTitle>
                    <p className="text-[10px] text-pex-gold uppercase tracking-widest">{ride.rideType}</p>
                  </div>
                  <Badge className="bg-white/20 text-white border-none">{ride.status}</Badge>
                </CardHeader>
                <CardContent className="p-4 space-y-4">
                  <div className="space-y-3">
                    <div className="flex items-start gap-3">
                      <div className="w-2 h-2 rounded-full bg-green-500 mt-1.5" />
                      <div>
                        <p className="text-[10px] text-gray-400 uppercase font-bold">Pickup</p>
                        <p className="text-sm font-medium">{ride.pickupLocation}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-2 h-2 rounded-full bg-pex-gold mt-1.5" />
                      <div>
                        <p className="text-[10px] text-gray-400 uppercase font-bold">Dropoff</p>
                        <p className="text-sm font-medium">{ride.dropoffLocation}</p>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
                        <Users size={16} className="text-pex-blue" />
                      </div>
                      <div>
                        <p className="text-xs font-bold">{ride.passengerName || 'Anonymous'}</p>
                        <p className="text-[10px] text-gray-400">Passenger</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-pex-blue">€{ride.price}</p>
                      <p className="text-[10px] text-gray-400">Fixed Fare</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 pt-2">
                    {ride.status === 'assigned' && (
                      <Button className="w-full bg-pex-blue text-white" onClick={() => updateRideStatus(ride.id, 'in-progress')}>
                        Start Ride
                      </Button>
                    )}
                    {ride.status === 'in-progress' && (
                      <Button className="w-full bg-green-600 text-white" onClick={() => updateRideStatus(ride.id, 'completed')}>
                        Complete Ride
                      </Button>
                    )}
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
      </main>

      {/* Bottom Nav Mockup */}
      <footer className="bg-white border-t p-4 flex justify-around items-center">
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

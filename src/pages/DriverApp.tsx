import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MapPin, Navigation, CheckCircle2, Clock, User, Car, Power, AlertCircle } from 'lucide-react';
import { useFirebase } from '../FirebaseProvider';
import { motion, AnimatePresence } from 'motion/react';

interface Ride {
  id: string;
  passenger_id: string;
  passenger_name?: string;
  pickup_location: string;
  dropoff_location: string;
  status: string;
  ride_type: string;
  price: number;
}

export default function DriverApp() {
  const { user, profile } = useFirebase();
  const [status, setStatus] = useState<'available' | 'busy' | 'offline'>('offline');
  const [assignedRides, setAssignedRides] = useState<Ride[]>([]);
  const [loading, setLoading] = useState(true);
  const [location, setLocation] = useState({ lat: 38.7223, lng: -9.1393 }); // Lisbon coordinates

  useEffect(() => {
    if (!user) return;

    const fetchRides = async () => {
      try {
        const res = await fetch('/api/rides');
        const data = await res.json();
        // Filter rides assigned to this driver
        setAssignedRides(data.filter((r: any) => r.driver_id === user.uid && r.status !== 'completed' && r.status !== 'cancelled'));
        setLoading(false);
      } catch (err) {
        console.error('Error fetching rides:', err);
      }
    };

    fetchRides();
    const interval = setInterval(fetchRides, 10000); // Poll every 10s

    return () => clearInterval(interval);
  }, [user]);

  useEffect(() => {
    if (!user || status === 'offline') return;

    const updateLocation = async () => {
      // Simulate movement
      const newLat = location.lat + (Math.random() - 0.5) * 0.001;
      const newLng = location.lng + (Math.random() - 0.5) * 0.001;
      setLocation({ lat: newLat, lng: newLng });

      try {
        await fetch('/api/driver-locations', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            driverId: user.uid,
            driverName: profile?.displayName || user.displayName || 'Driver',
            lat: newLat,
            lng: newLng,
            status: status
          }),
        });
      } catch (err) {
        console.error('Error updating location:', err);
      }
    };

    const interval = setInterval(updateLocation, 5000);
    return () => clearInterval(interval);
  }, [user, status, location, profile]);

  const handleStatusChange = async (newStatus: 'available' | 'busy' | 'offline') => {
    setStatus(newStatus);
    if (user) {
      try {
        await fetch('/api/driver-locations', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            driverId: user.uid,
            driverName: profile?.displayName || user.displayName || 'Driver',
            lat: location.lat,
            lng: location.lng,
            status: newStatus
          }),
        });
      } catch (err) {
        console.error('Error updating status:', err);
      }
    }
  };

  const completeRide = async (rideId: string) => {
    try {
      await fetch(`/api/rides/${rideId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'completed' }),
      });
      setAssignedRides(prev => prev.filter(r => r.id !== rideId));
      setStatus('available');
    } catch (err) {
      console.error('Error completing ride:', err);
    }
  };

  if (!user) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-50 p-6">
        <Card className="max-w-md w-full p-8 text-center space-y-4">
          <div className="w-16 h-16 bg-pex-blue/10 rounded-full flex items-center justify-center mx-auto">
            <User size={32} className="text-pex-blue" />
          </div>
          <h2 className="text-2xl font-bold text-pex-blue">Driver Access</h2>
          <p className="text-gray-600">Please log in to access your driver dashboard.</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex-1 bg-gray-50 p-4 md:p-8 overflow-y-auto">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-pex-blue">Driver Dashboard</h1>
            <p className="text-gray-500">Welcome back, {profile?.displayName || user.displayName}</p>
          </div>
          <div className="flex gap-2">
            <Button 
              variant={status === 'available' ? 'default' : 'outline'}
              className={status === 'available' ? 'bg-green-600 hover:bg-green-700' : ''}
              onClick={() => handleStatusChange('available')}
            >
              Available
            </Button>
            <Button 
              variant={status === 'busy' ? 'default' : 'outline'}
              className={status === 'busy' ? 'bg-yellow-600 hover:bg-yellow-700' : ''}
              onClick={() => handleStatusChange('busy')}
            >
              Busy
            </Button>
            <Button 
              variant={status === 'offline' ? 'default' : 'outline'}
              className={status === 'offline' ? 'bg-red-600 hover:bg-red-700' : ''}
              onClick={() => handleStatusChange('offline')}
            >
              Offline
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Navigation size={20} className="text-pex-blue" />
                Assigned Rides
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {loading ? (
                <div className="text-center py-8 text-gray-400">Loading rides...</div>
              ) : assignedRides.length === 0 ? (
                <div className="text-center py-8 text-gray-400">
                  <Car size={48} className="mx-auto mb-2 opacity-20" />
                  <p>No active rides assigned to you.</p>
                </div>
              ) : (
                assignedRides.map((ride) => (
                  <Card key={ride.id} className="border-pex-gold/30 bg-pex-gold/5">
                    <CardContent className="p-6">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <Badge className="bg-pex-blue text-white mb-2">{ride.ride_type}</Badge>
                          <h3 className="font-bold text-lg text-pex-blue">{ride.passenger_name || 'Passenger'}</h3>
                        </div>
                        <span className="text-xl font-bold text-pex-blue">€{ride.price}</span>
                      </div>
                      
                      <div className="space-y-3 mb-6">
                        <div className="flex items-start gap-3">
                          <div className="w-2 h-2 rounded-full bg-pex-blue mt-1.5 shrink-0" />
                          <div>
                            <p className="text-xs text-gray-500 uppercase">Pickup</p>
                            <p className="text-sm font-medium">{ride.pickup_location}</p>
                          </div>
                        </div>
                        <div className="flex items-start gap-3">
                          <div className="w-2 h-2 rounded-full bg-pex-gold mt-1.5 shrink-0" />
                          <div>
                            <p className="text-xs text-gray-500 uppercase">Dropoff</p>
                            <p className="text-sm font-medium">{ride.dropoff_location}</p>
                          </div>
                        </div>
                      </div>

                      <div className="flex gap-3">
                        <Button className="flex-1 bg-pex-blue hover:bg-pex-blue/90 text-white" onClick={() => completeRide(ride.id)}>
                          <CheckCircle2 size={18} className="mr-2" /> Complete Ride
                        </Button>
                        <Button variant="outline" className="flex-1">
                          Navigate
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </CardContent>
          </Card>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Your Status</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-gray-500">Current Status</span>
                  <Badge className={
                    status === 'available' ? 'bg-green-100 text-green-800' :
                    status === 'busy' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-red-100 text-red-800'
                  }>
                    {status.toUpperCase()}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-500">Location</span>
                  <span className="text-xs font-mono">{location.lat.toFixed(4)}, {location.lng.toFixed(4)}</span>
                </div>
                <div className="pt-4 border-t">
                  <p className="text-xs text-gray-400 flex items-center gap-1">
                    <Clock size={12} /> Last updated: {new Date().toLocaleTimeString()}
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-pex-blue text-white">
              <CardContent className="p-6 text-center space-y-4">
                <div className="w-12 h-12 bg-white/10 rounded-full flex items-center justify-center mx-auto">
                  <Power size={24} className="text-pex-gold" />
                </div>
                <div>
                  <h3 className="font-bold">End Shift</h3>
                  <p className="text-xs text-white/60">Set status to offline and stop location tracking.</p>
                </div>
                <Button 
                  variant="outline" 
                  className="w-full border-white/20 hover:bg-white/10 text-white"
                  onClick={() => handleStatusChange('offline')}
                >
                  Go Offline
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

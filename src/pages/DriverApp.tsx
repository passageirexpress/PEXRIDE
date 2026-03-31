import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useFirebase } from '../FirebaseProvider';
import { Map, Users, DollarSign, MessageSquare, CheckCircle2, Clock, AlertCircle, Car, Navigation, ChevronRight, LogOut, Phone } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { socket } from '../lib/socket';

import { useNavigate } from 'react-router-dom';

export default function DriverApp() {
  const { user: currentUser, profile, logout, loading: authLoading } = useFirebase();
  const navigate = useNavigate();
  const [activeRides, setActiveRides] = useState<any[]>([]);
  const [status, setStatus] = useState<'available' | 'busy' | 'offline'>('offline');
  const [location, setLocation] = useState({ lat: 38.7223, lng: -9.1393 }); // Lisbon default

  useEffect(() => {
    if (!authLoading && !currentUser) {
      navigate('/driver/login');
      return;
    }
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
    
    if (status === 'deactivated') {
      alert('Vehicle added but automatically deactivated because it is older than 10 years.');
    }
  };

  const [documents, setDocuments] = useState([
    { id: 'license', name: 'Driver\'s License', status: 'missing' },
    { id: 'professional', name: 'Professional License (VTC/TVDE)', status: 'missing' },
    { id: 'background', name: 'Criminal Record Certificate', status: 'missing' },
    { id: 'insurance', name: 'Commercial Insurance', status: 'missing' },
    { id: 'registration', name: 'Vehicle Registration', status: 'missing' },
    { id: 'photo', name: 'Professional Profile Photo', status: 'missing' }
  ]);
  const [isSubmittingDocs, setIsSubmittingDocs] = useState(false);

  const handleUploadDoc = (id: string) => {
    // Simulate upload
    setDocuments(docs => docs.map(d => d.id === id ? { ...d, status: 'uploaded' } : d));
  };

  const handleSubmitDocs = () => {
    setIsSubmittingDocs(true);
    setTimeout(() => {
      setDocuments(docs => docs.map(d => d.status === 'uploaded' ? { ...d, status: 'pending' } : d));
      setIsSubmittingDocs(false);
      alert('Documents submitted successfully. They are now under review by an admin.');
    }, 1500);
  };

  const [invoices, setInvoices] = useState([
    { id: '1', number: 'INV-2026-001', date: 'March 11, 2026', rides: 5, amount: 450.00 },
    { id: '2', number: 'INV-2026-002', date: 'March 12, 2026', rides: 3, amount: 275.50 },
    { id: '3', number: 'INV-2026-003', date: 'March 13, 2026', rides: 4, amount: 380.00 }
  ]);

  const handleGenerateInvoice = () => {
    const newInvoice = {
      id: Date.now().toString(),
      number: `INV-2026-00${invoices.length + 1}`,
      date: new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }),
      rides: Math.floor(Math.random() * 5) + 1,
      amount: Math.floor(Math.random() * 300) + 100
    };
    setInvoices([newInvoice, ...invoices]);
    alert('New invoice generated successfully.');
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-pex-gold"></div>
      </div>
    );
  }

  if (!currentUser) {
    return null; // Will redirect in useEffect
  }

  if (profile?.role !== 'driver' && profile?.role !== 'admin') {
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
          <Button variant="ghost" size="icon" onClick={logout}>
            <LogOut size={18} />
          </Button>
        </div>
      </header>

      <main className="flex-1 p-4 max-w-4xl mx-auto w-full space-y-6">
        <Tabs defaultValue="dashboard" className="w-full">
          <TabsList className="grid w-full grid-cols-4 mb-6">
            <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
            <TabsTrigger value="documents">Documents</TabsTrigger>
            <TabsTrigger value="vehicles">Vehicles</TabsTrigger>
            <TabsTrigger value="invoices">Invoices</TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard" className="space-y-6">
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
          </TabsContent>

          <TabsContent value="documents" className="space-y-6">
            <div className="bg-white p-6 rounded-2xl shadow-sm">
              <h2 className="text-lg font-bold text-pex-blue mb-4">Document Verification</h2>
              <p className="text-sm text-gray-500 mb-6">Please upload the following required documents. Your account will be reviewed by an admin once all documents are submitted.</p>
              
              <div className="space-y-4 mb-6">
                {documents.map(doc => (
                  <div key={doc.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <p className="font-bold text-sm text-pex-blue">{doc.name}</p>
                      <p className="text-xs text-gray-400 mt-1">
                        {doc.status === 'missing' ? 'Not uploaded' : doc.status === 'uploaded' ? 'Ready to submit' : doc.status === 'pending' ? 'Under review' : 'Verified'}
                      </p>
                    </div>
                    <div>
                      {doc.status === 'missing' ? (
                        <Button size="sm" variant="outline" className="border-pex-blue text-pex-blue" onClick={() => handleUploadDoc(doc.id)}>Upload</Button>
                      ) : doc.status === 'uploaded' ? (
                        <Badge className="bg-blue-100 text-blue-800 border-none">Uploaded</Badge>
                      ) : doc.status === 'pending' ? (
                        <Badge className="bg-yellow-100 text-yellow-800 border-none">Pending</Badge>
                      ) : (
                        <Badge className="bg-green-100 text-green-800 border-none">Verified</Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              
              {documents.some(d => d.status === 'uploaded') && (
                <Button 
                  className="w-full bg-pex-gold text-pex-blue font-bold" 
                  onClick={handleSubmitDocs}
                  disabled={isSubmittingDocs}
                >
                  {isSubmittingDocs ? 'Submitting...' : 'Submit Documents for Review'}
                </Button>
              )}
            </div>
          </TabsContent>

          <TabsContent value="vehicles" className="space-y-6">
            <div className="bg-white p-6 rounded-2xl shadow-sm">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-lg font-bold text-pex-blue">My Vehicles</h2>
                <Button size="sm" className="bg-pex-blue text-white" onClick={() => setIsAddingVehicle(true)}>Add Vehicle</Button>
              </div>
              <p className="text-sm text-gray-500 mb-6">Note: Vehicles older than 10 years are automatically deactivated per our quality standards.</p>
              
              {isAddingVehicle && (
                <Card className="p-4 mb-6 border-pex-gold/30">
                  <h3 className="font-bold text-pex-blue mb-4">New Vehicle Details</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-gray-500">Make</label>
                      <input 
                        className="w-full p-2 border rounded-md text-sm" 
                        placeholder="e.g. Mercedes-Benz"
                        value={newVehicle.make}
                        onChange={e => setNewVehicle({...newVehicle, make: e.target.value})}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-gray-500">Model</label>
                      <input 
                        className="w-full p-2 border rounded-md text-sm" 
                        placeholder="e.g. S-Class"
                        value={newVehicle.model}
                        onChange={e => setNewVehicle({...newVehicle, model: e.target.value})}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-gray-500">Year</label>
                      <input 
                        type="number"
                        className="w-full p-2 border rounded-md text-sm" 
                        value={newVehicle.year}
                        onChange={e => setNewVehicle({...newVehicle, year: parseInt(e.target.value)})}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-gray-500">License Plate</label>
                      <input 
                        className="w-full p-2 border rounded-md text-sm" 
                        placeholder="ABC-1234"
                        value={newVehicle.licensePlate}
                        onChange={e => setNewVehicle({...newVehicle, licensePlate: e.target.value})}
                      />
                    </div>
                  </div>
                  <div className="flex justify-end gap-2 mt-4">
                    <Button variant="outline" onClick={() => setIsAddingVehicle(false)}>Cancel</Button>
                    <Button className="bg-pex-blue text-white" onClick={handleAddVehicle}>Save Vehicle</Button>
                  </div>
                </Card>
              )}

              <div className="space-y-4">
                {driverVehicles.map(vehicle => (
                  <div key={vehicle.id} className={`p-4 border rounded-lg flex justify-between items-center ${vehicle.status === 'deactivated' ? 'opacity-60 bg-gray-50' : ''}`}>
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                        <Car className="text-pex-blue" />
                      </div>
                      <div>
                        <p className="font-bold text-pex-blue">{vehicle.make} {vehicle.model}</p>
                        <p className="text-xs text-gray-500">{vehicle.year} • {vehicle.licensePlate}</p>
                        {vehicle.status === 'deactivated' && (
                          <p className="text-xs text-red-500 mt-1 font-medium">Deactivated: Vehicle older than 10 years ({vehicle.age} years old)</p>
                        )}
                      </div>
                    </div>
                    <Badge className={vehicle.status === 'active' ? 'bg-green-100 text-green-800 border-none' : 'bg-red-100 text-red-800 border-none'}>
                      {vehicle.status.toUpperCase()}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="invoices" className="space-y-6">
            <div className="bg-white p-6 rounded-2xl shadow-sm">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-lg font-bold text-pex-blue">Invoices & Earnings</h2>
                <Button size="sm" className="bg-pex-blue text-white" onClick={handleGenerateInvoice}>Generate Invoice</Button>
              </div>
              
              <div className="space-y-4">
                {invoices.map(invoice => (
                  <div key={invoice.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <p className="font-bold text-sm text-pex-blue">Invoice #{invoice.number}</p>
                      <p className="text-xs text-gray-400 mt-1">{invoice.date} • {invoice.rides} Rides</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-pex-blue">€{invoice.amount.toFixed(2)}</p>
                      <Button size="sm" variant="link" className="text-pex-gold p-0 h-auto text-xs" onClick={() => alert(`Downloading ${invoice.number}.pdf...`)}>Download PDF</Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>
        </Tabs>
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

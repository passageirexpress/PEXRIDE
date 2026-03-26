import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Map, Users, DollarSign, MessageSquare, Plus, Search, Filter, MoreVertical, CheckCircle2, Clock, AlertCircle } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const revenueData = [
  { name: 'Mon', revenue: 4000 },
  { name: 'Tue', revenue: 3000 },
  { name: 'Wed', revenue: 2000 },
  { name: 'Thu', revenue: 2780 },
  { name: 'Fri', revenue: 1890 },
  { name: 'Sat', revenue: 2390 },
  { name: 'Sun', revenue: 3490 },
];

const activeRides = [
  { id: 'R-1042', driver: 'Carlos Silva', status: 'In Progress', type: 'Experience', eta: '15 min', vehicle: 'Mercedes S-Class' },
  { id: 'R-1043', driver: 'Ana Costa', status: 'Waiting', type: 'Transfer', eta: '5 min', vehicle: 'Mercedes V-Class' },
  { id: 'R-1044', driver: 'João Santos', status: 'Delayed', type: 'Experience', eta: '45 min', vehicle: 'BMW 7 Series' },
];

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('live-map');

  return (
    <div className="flex-1 flex flex-col md:flex-row bg-gray-100 overflow-hidden">
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
              onClick={() => setActiveTab('poi-manager')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${activeTab === 'poi-manager' ? 'bg-white/10 text-pex-gold' : 'hover:bg-white/5'}`}
            >
              <Map size={18} />
              <span className="text-sm font-medium">POI Manager</span>
            </button>
            <button 
              onClick={() => setActiveTab('drivers')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${activeTab === 'drivers' ? 'bg-white/10 text-pex-gold' : 'hover:bg-white/5'}`}
            >
              <Users size={18} />
              <span className="text-sm font-medium">Driver Onboarding</span>
            </button>
            <button 
              onClick={() => setActiveTab('financial')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${activeTab === 'financial' ? 'bg-white/10 text-pex-gold' : 'hover:bg-white/5'}`}
            >
              <DollarSign size={18} />
              <span className="text-sm font-medium">Financial Suite</span>
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
            <div className="flex justify-between items-center">
              <h1 className="text-2xl font-bold text-pex-blue">Live Fleet Tracking</h1>
              <div className="flex gap-2">
                <Button variant="outline" className="bg-white"><Filter size={16} className="mr-2" /> Filters</Button>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                  <Input placeholder="Search driver or ride ID..." className="pl-10 w-64 bg-white" />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Map Placeholder */}
              <Card className="lg:col-span-2 h-[500px] relative overflow-hidden">
                <div className="absolute inset-0 opacity-60" style={{
                  backgroundImage: 'url("https://images.unsplash.com/photo-1524661135-423995f22d0b?auto=format&fit=crop&q=80&w=2000&h=2000")',
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                  filter: 'grayscale(80%)'
                }} />
                <div className="absolute inset-0 bg-pex-blue/5" />
                
                {/* Simulated Markers */}
                <div className="absolute top-1/4 left-1/3 w-4 h-4 rounded-full bg-green-500 border-2 border-white shadow-lg animate-pulse" />
                <div className="absolute top-1/2 left-1/2 w-4 h-4 rounded-full bg-yellow-500 border-2 border-white shadow-lg animate-pulse" />
                <div className="absolute bottom-1/3 right-1/4 w-4 h-4 rounded-full bg-red-500 border-2 border-white shadow-lg animate-pulse" />
              </Card>

              {/* Active Rides List */}
              <Card className="h-[500px] flex flex-col">
                <CardHeader className="pb-3 border-b border-gray-100">
                  <CardTitle className="text-lg">Active Rides</CardTitle>
                </CardHeader>
                <CardContent className="flex-1 overflow-y-auto p-0">
                  <div className="divide-y divide-gray-100">
                    {activeRides.map((ride) => (
                      <div key={ride.id} className="p-4 hover:bg-gray-50 transition-colors cursor-pointer">
                        <div className="flex justify-between items-start mb-2">
                          <span className="font-bold text-pex-blue">{ride.id}</span>
                          <Badge variant={ride.status === 'In Progress' ? 'default' : ride.status === 'Waiting' ? 'secondary' : 'destructive'} 
                                 className={ride.status === 'In Progress' ? 'bg-green-100 text-green-800 hover:bg-green-200' : ''}>
                            {ride.status}
                          </Badge>
                        </div>
                        <div className="text-sm text-gray-600 space-y-1">
                          <p className="flex items-center gap-2"><Users size={14} /> {ride.driver}</p>
                          <p className="flex items-center gap-2"><Map size={14} /> {ride.type}</p>
                          <p className="flex items-center gap-2"><Clock size={14} /> ETA: {ride.eta}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {activeTab === 'financial' && (
          <div className="space-y-6">
            <h1 className="text-2xl font-bold text-pex-blue">Financial Suite</h1>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card>
                <CardContent className="p-6">
                  <p className="text-sm text-gray-500 uppercase tracking-wider font-semibold mb-1">Total Revenue (Week)</p>
                  <p className="text-3xl font-bold text-pex-blue">€19,550</p>
                  <p className="text-sm text-green-600 mt-2 flex items-center gap-1"><CheckCircle2 size={14} /> +12% vs last week</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6">
                  <p className="text-sm text-gray-500 uppercase tracking-wider font-semibold mb-1">Driver Commissions</p>
                  <p className="text-3xl font-bold text-pex-blue">€13,685</p>
                  <p className="text-sm text-gray-500 mt-2">70% average split</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6">
                  <p className="text-sm text-gray-500 uppercase tracking-wider font-semibold mb-1">Corporate B2B</p>
                  <p className="text-3xl font-bold text-pex-blue">€5,865</p>
                  <p className="text-sm text-pex-gold mt-2">30% of total revenue</p>
                </CardContent>
              </Card>
            </div>

            <Card className="h-[400px]">
              <CardHeader>
                <CardTitle>Revenue Trend</CardTitle>
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

        {activeTab === 'poi-manager' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h1 className="text-2xl font-bold text-pex-blue">POI Manager</h1>
              <Button className="bg-pex-blue hover:bg-pex-blue/90 text-white"><Plus size={16} className="mr-2" /> Add New POI</Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[
                { name: 'Óbidos Castle', price: '€45', duration: '+1.5 hrs', status: 'Active' },
                { name: 'Nazaré Waves', price: '€60', duration: '+2.0 hrs', status: 'Active' },
                { name: 'Sintra Palaces', price: '€80', duration: '+3.0 hrs', status: 'Active' },
                { name: 'Fátima Sanctuary', price: '€50', duration: '+1.5 hrs', status: 'Review' },
              ].map((poi, i) => (
                <Card key={i} className="overflow-hidden">
                  <div className="h-32 bg-gray-200 relative">
                    <img src={`https://images.unsplash.com/photo-1524661135-423995f22d0b?auto=format&fit=crop&q=80&w=400&h=200&sig=${i}`} alt={poi.name} className="object-cover w-full h-full" />
                    <div className="absolute top-2 right-2">
                      <Badge variant={poi.status === 'Active' ? 'default' : 'secondary'} className={poi.status === 'Active' ? 'bg-green-500 hover:bg-green-600' : ''}>
                        {poi.status}
                      </Badge>
                    </div>
                  </div>
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-bold text-lg text-pex-blue">{poi.name}</h3>
                      <Button variant="ghost" size="icon" className="h-8 w-8"><MoreVertical size={16} /></Button>
                    </div>
                    <div className="flex items-center justify-between text-sm text-gray-500">
                      <span className="flex items-center gap-1"><Clock size={14} /> {poi.duration}</span>
                      <span className="font-bold text-pex-gold">{poi.price}</span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Placeholders for other tabs */}
        {(activeTab === 'drivers' || activeTab === 'support') && (
          <div className="flex flex-col items-center justify-center h-[60vh] text-center">
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 max-w-md">
              <div className="w-16 h-16 bg-pex-gold/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <Clock size={32} className="text-pex-gold" />
              </div>
              <h2 className="text-xl font-bold text-pex-blue mb-2">Module in Development</h2>
              <p className="text-gray-500">
                The {activeTab.replace('-', ' ')} module is scheduled for Phase {activeTab === 'drivers' ? '2' : '3'} of the roadmap.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

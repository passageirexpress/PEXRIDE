import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { MapPin, Clock, Star, Music, Thermometer, VolumeX, Crown, Navigation, CheckCircle2 } from 'lucide-react';
import { motion } from 'motion/react';

export default function PassengerApp() {
  const [tripType, setTripType] = useState('experience');
  const [silentMode, setSilentMode] = useState(false);
  const [temperature, setTemperature] = useState([22]);

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
                <Card className="border-pex-gold/30 bg-pex-gold/5 cursor-pointer hover:bg-pex-gold/10 transition-colors">
                  <CardContent className="p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="bg-pex-gold/20 p-2 rounded-full">
                        <MapPin size={18} className="text-pex-gold" />
                      </div>
                      <div>
                        <p className="font-medium text-pex-blue">Óbidos Castle</p>
                        <p className="text-xs text-gray-500">+1.5 hrs • Medieval Village</p>
                      </div>
                    </div>
                    <CheckCircle2 size={20} className="text-pex-gold" />
                  </CardContent>
                </Card>
                <Card className="cursor-pointer hover:bg-gray-50 transition-colors">
                  <CardContent className="p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="bg-gray-100 p-2 rounded-full">
                        <MapPin size={18} className="text-gray-500" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-700">Nazaré Waves</p>
                        <p className="text-xs text-gray-500">+1.0 hrs • Coastal View</p>
                      </div>
                    </div>
                    <div className="text-sm font-medium text-gray-500">+€45</div>
                  </CardContent>
                </Card>
              </div>
            </motion.div>
          )}

          {/* Fleet Selector */}
          <div className="space-y-4">
            <h3 className="font-semibold text-pex-blue uppercase tracking-wider text-sm">Select Vehicle</h3>
            <div className="flex overflow-x-auto pb-4 gap-4 snap-x">
              <Card className="min-w-[240px] snap-center border-pex-blue border-2 relative overflow-hidden">
                <div className="absolute top-0 right-0 bg-pex-blue text-white text-xs px-2 py-1 rounded-bl-lg">
                  Business
                </div>
                <CardContent className="p-4">
                  <div className="h-24 bg-gray-200 rounded-md mb-3 flex items-center justify-center overflow-hidden">
                    <img src="https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?auto=format&fit=crop&q=80&w=400&h=200" alt="Mercedes E-Class" className="object-cover w-full h-full" />
                  </div>
                  <h4 className="font-bold text-lg">Mercedes S-Class</h4>
                  <p className="text-sm text-gray-500 mb-3">3 Pax • 2 Bags</p>
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xl">€380</span>
                    <div className="flex items-center gap-1 text-xs text-gray-500">
                      <Star size={12} className="fill-pex-gold text-pex-gold" />
                      <span>4.9 (Chauffeur)</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="min-w-[240px] snap-center opacity-70 hover:opacity-100 transition-opacity cursor-pointer">
                <div className="absolute top-0 right-0 bg-gray-800 text-white text-xs px-2 py-1 rounded-bl-lg">
                  First Class
                </div>
                <CardContent className="p-4">
                  <div className="h-24 bg-gray-200 rounded-md mb-3 flex items-center justify-center overflow-hidden">
                    <img src="https://images.unsplash.com/photo-1605559424843-9e4c228bf1c2?auto=format&fit=crop&q=80&w=400&h=200" alt="Mercedes V-Class" className="object-cover w-full h-full" />
                  </div>
                  <h4 className="font-bold text-lg">Mercedes V-Class</h4>
                  <p className="text-sm text-gray-500 mb-3">6 Pax • 6 Bags</p>
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xl">€450</span>
                    <div className="flex items-center gap-1 text-xs text-gray-500">
                      <Star size={12} className="fill-pex-gold text-pex-gold" />
                      <span>5.0 (Chauffeur)</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
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
          <div className="flex justify-between items-center mb-4">
            <span className="text-gray-500">Total (Fixed Price)</span>
            <span className="text-2xl font-bold text-pex-blue">€380</span>
          </div>
          <Button className="w-full bg-pex-blue hover:bg-pex-blue/90 text-white h-12 text-lg">
            Confirm Booking
          </Button>
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
    </div>
  );
}

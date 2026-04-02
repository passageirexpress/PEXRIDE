import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { MapPin, Camera, Star, Users, Clock, Euro } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link, useNavigate } from 'react-router-dom';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '../../firebase';

interface POI {
  id: string;
  name: string;
  price: number;
  tourPrice: number;
  duration: string;
  image_url?: string;
  imageUrl?: string;
  status: string;
  description?: string;
}

export default function CuratedTours() {
  const [pois, setPois] = useState<POI[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'pois'), (snapshot) => {
      const poiList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as POI));
      setPois(poiList.filter(p => p.status === 'Active'));
    });
    return () => unsub();
  }, []);

  const handleBookTour = (poi: POI) => {
    navigate('/book', { 
      state: { 
        pickup: poi.name,
        tripType: 'one-way',
        selectedPOI: poi.id
      } 
    });
  };

  return (
    <div className="min-h-screen bg-white">
      <div className="relative h-[60vh] flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img 
            src="https://images.unsplash.com/photo-1513581166391-887a96ddeafd?auto=format&fit=crop&q=80&w=2000" 
            alt="Tours" 
            className="w-full h-full object-cover opacity-60"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-pex-blue/80 to-white" />
        </div>
        
        <div className="relative z-10 text-center px-6 max-w-4xl">
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-5xl md:text-7xl font-light text-pex-blue tracking-tight mb-6"
          >
            Curated Tours
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-xl text-gray-600 font-light leading-relaxed"
          >
            Discover the hidden gems of Portugal and beyond. Our bespoke tours are tailored to your interests, from wine tasting to historic landmarks.
          </motion.p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-24">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 mb-24">
          <div className="space-y-4">
            <div className="w-12 h-12 bg-pex-gold/10 rounded-full flex items-center justify-center">
              <MapPin className="text-pex-gold" />
            </div>
            <h3 className="text-xl font-bold text-pex-blue">Bespoke Itineraries</h3>
            <p className="text-gray-500 leading-relaxed">Work with our concierge to design a tour that matches your passions and pace.</p>
          </div>
          <div className="space-y-4">
            <div className="w-12 h-12 bg-pex-gold/10 rounded-full flex items-center justify-center">
              <Camera className="text-pex-gold" />
            </div>
            <h3 className="text-xl font-bold text-pex-blue">Expert Local Knowledge</h3>
            <p className="text-gray-500 leading-relaxed">Our chauffeurs are knowledgeable about the history, culture, and best-kept secrets of every destination.</p>
          </div>
          <div className="space-y-4">
            <div className="w-12 h-12 bg-pex-gold/10 rounded-full flex items-center justify-center">
              <Star className="text-pex-gold" />
            </div>
            <h3 className="text-xl font-bold text-pex-blue">Exclusive Access</h3>
            <p className="text-gray-500 leading-relaxed">Enjoy VIP access to private estates, wineries, and historic sites not open to the general public.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {pois.map((poi) => (
            <motion.div 
              key={poi.id}
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              className="group bg-white rounded-2xl overflow-hidden shadow-lg border border-gray-100 hover:shadow-2xl transition-all"
            >
              <div className="relative h-64 overflow-hidden">
                <img 
                  src={poi.imageUrl || poi.image_url || "https://images.unsplash.com/photo-1555881400-74d7acaacd8b?auto=format&fit=crop&q=80&w=800"} 
                  alt={poi.name}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full text-pex-blue font-bold text-sm flex items-center gap-1">
                  <Euro size={14} /> {poi.tourPrice || poi.price}
                </div>
              </div>
              <div className="p-6 space-y-4">
                <h3 className="text-xl font-bold text-pex-blue">{poi.name}</h3>
                <p className="text-gray-500 text-sm line-clamp-2">{poi.description || "Experience the beauty and history of this unique destination with our expert chauffeurs."}</p>
                <div className="flex items-center justify-between text-xs text-gray-400 font-medium uppercase tracking-wider">
                  <div className="flex items-center gap-1">
                    <Clock size={14} className="text-pex-gold" />
                    {poi.duration}
                  </div>
                  <div className="flex items-center gap-1">
                    <Users size={14} className="text-pex-gold" />
                    Up to 7 people
                  </div>
                </div>
                <Button 
                  onClick={() => handleBookTour(poi)}
                  className="w-full bg-pex-blue hover:bg-pex-blue/90 text-white font-bold"
                >
                  Book This Tour
                </Button>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      <div className="bg-pex-blue py-24 text-center text-white">
        <h2 className="text-3xl font-light mb-8">Embark on an unforgettable journey.</h2>
        <Link to="/">
          <Button size="lg" className="bg-pex-gold text-pex-blue hover:bg-white font-bold px-12">
            Book Now
          </Button>
        </Link>
      </div>
    </div>
  );
}

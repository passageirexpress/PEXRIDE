import React from 'react';
import { motion } from 'motion/react';
import { Calendar, Users, Shield, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';

export default function EventLogistics() {
  return (
    <div className="min-h-screen bg-white">
      <div className="relative h-[60vh] flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img 
            src="https://images.unsplash.com/photo-1511795409834-ef04bbd61622?auto=format&fit=crop&q=80&w=2000" 
            alt="Events" 
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
            Event Logistics
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-xl text-gray-600 font-light leading-relaxed"
          >
            Coordinated transportation for weddings, galas, and high-profile events. We manage the logistics so you can focus on the celebration.
          </motion.p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-24 grid grid-cols-1 md:grid-cols-3 gap-12">
        <div className="space-y-4">
          <div className="w-12 h-12 bg-pex-gold/10 rounded-full flex items-center justify-center">
            <Calendar className="text-pex-gold" />
          </div>
          <h3 className="text-xl font-bold text-pex-blue">Event Coordination</h3>
          <p className="text-gray-500 leading-relaxed">Dedicated logistics experts to manage arrivals and departures for your guests.</p>
        </div>
        <div className="space-y-4">
          <div className="w-12 h-12 bg-pex-gold/10 rounded-full flex items-center justify-center">
            <Users className="text-pex-gold" />
          </div>
          <h3 className="text-xl font-bold text-pex-blue">Large Fleet Capacity</h3>
          <p className="text-gray-500 leading-relaxed">Access to a wide range of luxury vehicles, from sedans to spacious vans for group transport.</p>
        </div>
        <div className="space-y-4">
          <div className="w-12 h-12 bg-pex-gold/10 rounded-full flex items-center justify-center">
            <Shield className="text-pex-gold" />
          </div>
          <h3 className="text-xl font-bold text-pex-blue">VIP Security</h3>
          <p className="text-gray-500 leading-relaxed">Discreet and professional security services for high-profile guests and celebrities.</p>
        </div>
      </div>

      <div className="bg-pex-blue py-24 text-center text-white">
        <h2 className="text-3xl font-light mb-8">Make your event a success from start to finish.</h2>
        <Link to="/">
          <Button size="lg" className="bg-pex-gold text-pex-blue hover:bg-white font-bold px-12">
            Book Now
          </Button>
        </Link>
      </div>
    </div>
  );
}

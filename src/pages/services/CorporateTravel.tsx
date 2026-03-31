import React from 'react';
import { motion } from 'motion/react';
import { Briefcase, Calendar, Shield, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';

export default function CorporateTravel() {
  return (
    <div className="min-h-screen bg-white">
      <div className="relative h-[60vh] flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img 
            src="https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&q=80&w=2000" 
            alt="Corporate" 
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
            Corporate Travel
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-xl text-gray-600 font-light leading-relaxed"
          >
            Reliable transportation for your business needs. We provide a professional environment for executives to work or relax between meetings.
          </motion.p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-24 grid grid-cols-1 md:grid-cols-3 gap-12">
        <div className="space-y-4">
          <div className="w-12 h-12 bg-pex-gold/10 rounded-full flex items-center justify-center">
            <Briefcase className="text-pex-gold" />
          </div>
          <h3 className="text-xl font-bold text-pex-blue">Executive Management</h3>
          <p className="text-gray-500 leading-relaxed">Dedicated account managers to handle complex schedules and multiple bookings.</p>
        </div>
        <div className="space-y-4">
          <div className="w-12 h-12 bg-pex-gold/10 rounded-full flex items-center justify-center">
            <Calendar className="text-pex-gold" />
          </div>
          <h3 className="text-xl font-bold text-pex-blue">Flexible Scheduling</h3>
          <p className="text-gray-500 leading-relaxed">Change your plans on the fly. Our chauffeurs are flexible and ready for last-minute adjustments.</p>
        </div>
        <div className="space-y-4">
          <div className="w-12 h-12 bg-pex-gold/10 rounded-full flex items-center justify-center">
            <Users className="text-pex-gold" />
          </div>
          <h3 className="text-xl font-bold text-pex-blue">Group Logistics</h3>
          <p className="text-gray-500 leading-relaxed">Coordinated transportation for large groups, conferences, and corporate events.</p>
        </div>
      </div>

      <div className="bg-pex-blue py-24 text-center text-white">
        <h2 className="text-3xl font-light mb-8">Elevate your business travel experience.</h2>
        <Link to="/">
          <Button size="lg" className="bg-pex-gold text-pex-blue hover:bg-white font-bold px-12">
            Book Now
          </Button>
        </Link>
      </div>
    </div>
  );
}

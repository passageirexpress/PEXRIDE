import React from 'react';
import { motion } from 'motion/react';

export default function TermsOfService() {
  return (
    <div className="min-h-screen bg-white py-24 px-6">
      <div className="max-w-4xl mx-auto space-y-12">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <h1 className="text-4xl font-light text-pex-blue tracking-tight mb-4">Terms of Service</h1>
          <p className="text-gray-500 font-medium uppercase tracking-widest text-xs">Last updated: March 2026</p>
        </motion.div>

        <div className="prose prose-pex max-w-none text-gray-600 leading-relaxed space-y-8">
          <section className="space-y-4">
            <h2 className="text-2xl font-bold text-pex-blue">1. Acceptance of Terms</h2>
            <p>By accessing or using Passageiro Express's website and chauffeur services, you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use our services.</p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-bold text-pex-blue">2. Booking and Payments</h2>
            <p>All bookings are subject to availability and confirmation. Prices are fixed at the time of booking. Payments must be made through our authorized payment methods, including credit cards and Viva.com.</p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-bold text-pex-blue">3. Cancellations and Refunds</h2>
            <p>Cancellations made within 24 hours of the scheduled pickup time may be subject to a cancellation fee. Refunds will be processed according to our cancellation policy, which is available upon request.</p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-bold text-pex-blue">4. Passenger Conduct</h2>
            <p>Passengers are expected to behave in a respectful and safe manner. We reserve the right to refuse service to any passenger who is disruptive, intoxicated, or poses a safety risk to our chauffeurs or other passengers.</p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-bold text-pex-blue">5. Limitation of Liability</h2>
            <p>Passageiro Express is not liable for any indirect, incidental, or consequential damages arising from the use of our services, including delays caused by traffic, weather, or other unforeseen circumstances.</p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-bold text-pex-blue">6. Governing Law</h2>
            <p>These Terms of Service are governed by the laws of Portugal. Any disputes arising from these terms will be resolved in the courts of Lisbon, Portugal.</p>
          </section>
        </div>
      </div>
    </div>
  );
}

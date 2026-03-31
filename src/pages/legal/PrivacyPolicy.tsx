import React from 'react';
import { motion } from 'motion/react';

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-white py-24 px-6">
      <div className="max-w-4xl mx-auto space-y-12">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <h1 className="text-4xl font-light text-pex-blue tracking-tight mb-4">Privacy Policy</h1>
          <p className="text-gray-500 font-medium uppercase tracking-widest text-xs">Last updated: March 2026</p>
        </motion.div>

        <div className="prose prose-pex max-w-none text-gray-600 leading-relaxed space-y-8">
          <section className="space-y-4">
            <h2 className="text-2xl font-bold text-pex-blue">1. Introduction</h2>
            <p>Passageiro Express ("we," "our," or "us") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our website and chauffeur services.</p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-bold text-pex-blue">2. Information We Collect</h2>
            <p>We collect information that you provide directly to us, such as when you create an account, book a ride, or contact our support team. This may include your name, email address, phone number, payment information, and pickup/dropoff locations.</p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-bold text-pex-blue">3. How We Use Your Information</h2>
            <p>We use the information we collect to provide, maintain, and improve our services, process your bookings, communicate with you, and ensure the safety and security of our passengers and chauffeurs.</p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-bold text-pex-blue">4. Sharing of Information</h2>
            <p>We do not sell your personal information. We may share your information with third-party service providers who perform services on our behalf, such as payment processing and data analysis, or when required by law.</p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-bold text-pex-blue">5. Your Choices</h2>
            <p>You have the right to access, correct, or delete your personal information. You can manage your account settings through our website or by contacting our concierge team.</p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-bold text-pex-blue">6. Contact Us</h2>
            <p>If you have any questions about this Privacy Policy, please contact us at concierge@pex-ride.com.</p>
          </section>
        </div>
      </div>
    </div>
  );
}

import React from 'react';
import { motion } from 'motion/react';

export default function CookiePolicy() {
  return (
    <div className="min-h-screen bg-white py-24 px-6">
      <div className="max-w-4xl mx-auto space-y-12">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <h1 className="text-4xl font-light text-pex-blue tracking-tight mb-4">Cookie Policy</h1>
          <p className="text-gray-500 font-medium uppercase tracking-widest text-xs">Last updated: March 2026</p>
        </motion.div>

        <div className="prose prose-pex max-w-none text-gray-600 leading-relaxed space-y-8">
          <section className="space-y-4">
            <h2 className="text-2xl font-bold text-pex-blue">1. What are Cookies?</h2>
            <p>Cookies are small text files that are stored on your device when you visit our website. They help us provide a better user experience by remembering your preferences and analyzing how you use our site.</p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-bold text-pex-blue">2. How We Use Cookies</h2>
            <p>We use cookies for essential website functions, such as authentication and booking. We also use third-party cookies for analytics and marketing purposes, which help us improve our services and reach new customers.</p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-bold text-pex-blue">3. Types of Cookies We Use</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Essential Cookies:</strong> Required for the website to function correctly.</li>
              <li><strong>Performance Cookies:</strong> Help us understand how visitors interact with our site.</li>
              <li><strong>Functional Cookies:</strong> Remember your preferences and settings.</li>
              <li><strong>Targeting Cookies:</strong> Used for marketing and advertising purposes.</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-bold text-pex-blue">4. Managing Your Cookies</h2>
            <p>You can manage your cookie preferences through your browser settings. Most browsers allow you to block or delete cookies, but this may affect your experience on our website.</p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-bold text-pex-blue">5. Updates to this Policy</h2>
            <p>We may update this Cookie Policy from time to time to reflect changes in our practices or legal requirements. We will notify you of any significant changes by posting the updated policy on our website.</p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-bold text-pex-blue">6. Contact Us</h2>
            <p>If you have any questions about this Cookie Policy, please contact us at concierge@pex-ride.com.</p>
          </section>
        </div>
      </div>
    </div>
  );
}

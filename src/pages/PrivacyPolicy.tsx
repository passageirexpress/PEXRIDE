import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Shield } from 'lucide-react';

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-gray-50 pt-24 pb-12 px-6">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-12 h-12 bg-pex-blue rounded-full flex items-center justify-center">
            <Shield className="text-pex-gold" size={24} />
          </div>
          <h1 className="text-3xl font-light text-pex-blue">Privacy Policy</h1>
        </div>
        
        <Card className="border-none shadow-xl">
          <CardContent className="p-8 space-y-6 text-gray-600">
            <section>
              <h2 className="text-xl font-bold text-pex-blue mb-3">1. Information We Collect</h2>
              <p>We collect information you provide directly to us, such as when you create or modify your account, request on-demand services, contact customer support, or otherwise communicate with us. This information may include: name, email, phone number, postal address, profile picture, payment method, items requested (for delivery services), delivery notes, and other information you choose to provide.</p>
            </section>
            
            <section>
              <h2 className="text-xl font-bold text-pex-blue mb-3">2. How We Use Your Information</h2>
              <p>We may use the information we collect about you to:</p>
              <ul className="list-disc pl-5 mt-2 space-y-1">
                <li>Provide, maintain, and improve our Services.</li>
                <li>Perform internal operations, including, for example, to prevent fraud and abuse of our Services.</li>
                <li>Send or facilitate communications between you and a Chauffeur.</li>
                <li>Send you communications we think will be of interest to you.</li>
                <li>Personalize and improve the Services.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-bold text-pex-blue mb-3">3. Sharing of Information</h2>
              <p>We may share the information we collect about you as described in this Statement or as described at the time of collection or sharing, including as follows:</p>
              <ul className="list-disc pl-5 mt-2 space-y-1">
                <li>With Chauffeurs to enable them to provide the Services you request.</li>
                <li>With third parties to provide you a service you requested through a partnership or promotional offering made by a third party or us.</li>
                <li>With the general public if you submit content in a public forum.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-bold text-pex-blue mb-3">4. Security</h2>
              <p>We take reasonable measures to help protect information about you from loss, theft, misuse and unauthorized access, disclosure, alteration and destruction.</p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-pex-blue mb-3">5. Contact Us</h2>
              <p>If you have any questions about this Privacy Statement, please contact us at privacy@pexride.com.</p>
            </section>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

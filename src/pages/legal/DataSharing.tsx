import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Share2 } from 'lucide-react';

export default function DataSharing() {
  return (
    <div className="min-h-screen bg-gray-50 pt-24 pb-12 px-6">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-12 h-12 bg-pex-blue rounded-full flex items-center justify-center">
            <Share2 className="text-pex-gold" size={24} />
          </div>
          <h1 className="text-3xl font-light text-pex-blue">Data Sharing Policy</h1>
        </div>
        
        <Card className="border-none shadow-xl">
          <CardContent className="p-8 space-y-6 text-gray-600">
            <section>
              <h2 className="text-xl font-bold text-pex-blue mb-3">1. How We Share Your Data</h2>
              <p>Pex Ride is committed to protecting your privacy. We only share your personal data with third parties when it is necessary to provide our services, comply with the law, or protect our rights.</p>
            </section>
            
            <section>
              <h2 className="text-xl font-bold text-pex-blue mb-3">2. Sharing with Chauffeurs</h2>
              <p>When you request a ride, we share your name, pickup location, dropoff location, and any special requests with the assigned chauffeur to ensure a smooth and personalized experience. We do not share your phone number directly; all communication is routed through our secure platform.</p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-pex-blue mb-3">3. Service Providers</h2>
              <p>We may share your data with third-party service providers who perform services on our behalf, such as payment processing, data analysis, email delivery, hosting services, customer service, and marketing assistance. These providers are bound by strict confidentiality agreements.</p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-pex-blue mb-3">4. Legal Requirements</h2>
              <p>We may disclose your information if required to do so by law or in the good faith belief that such action is necessary to comply with legal obligations, protect and defend our rights or property, act in urgent circumstances to protect the personal safety of users of the service or the public, or protect against legal liability.</p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-pex-blue mb-3">5. Your Choices</h2>
              <p>You have the right to request access to, correction of, or deletion of your personal data. You can also object to or restrict the processing of your data. To exercise these rights, please contact our privacy team.</p>
            </section>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

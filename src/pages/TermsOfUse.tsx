import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { FileText } from 'lucide-react';

export default function TermsOfUse() {
  return (
    <div className="min-h-screen bg-gray-50 pt-24 pb-12 px-6">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-12 h-12 bg-pex-blue rounded-full flex items-center justify-center">
            <FileText className="text-pex-gold" size={24} />
          </div>
          <h1 className="text-3xl font-light text-pex-blue">Terms of Use</h1>
        </div>
        
        <Card className="border-none shadow-xl">
          <CardContent className="p-8 space-y-6 text-gray-600">
            <section>
              <h2 className="text-xl font-bold text-pex-blue mb-3">1. Acceptance of Terms</h2>
              <p>By accessing or using the Pex Ride application and services, you agree to comply with and be bound by these Terms of Use. If you do not agree to these terms, please do not use our services.</p>
            </section>
            
            <section>
              <h2 className="text-xl font-bold text-pex-blue mb-3">2. Description of Service</h2>
              <p>Pex Ride provides a technology platform that enables users to arrange and schedule transportation and/or logistics services with independent third-party providers of such services, including independent third-party transportation providers.</p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-pex-blue mb-3">3. User Accounts</h2>
              <p>In order to use most aspects of the Services, you must register for and maintain an active personal user Services account. You must be at least 18 years of age to obtain an Account. Account registration requires you to submit certain personal information, such as your name, address, mobile phone number and age, as well as at least one valid payment method.</p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-pex-blue mb-3">4. Payment</h2>
              <p>You understand that use of the Services may result in charges to you for the services or goods you receive from a Third Party Provider. After you have received services or goods obtained through your use of the Service, Pex Ride will facilitate your payment of the applicable Charges on behalf of the Third Party Provider as such Third Party Provider's limited payment collection agent.</p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-pex-blue mb-3">5. Limitation of Liability</h2>
              <p>Pex Ride shall not be liable for indirect, incidental, special, exemplary, punitive or consequential damages, including lost profits, lost data, personal injury or property damage related to, in connection with, or otherwise resulting from any use of the services.</p>
            </section>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

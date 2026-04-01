import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { HelpCircle } from 'lucide-react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

export default function FAQ() {
  return (
    <div className="min-h-screen bg-gray-50 pt-24 pb-12 px-6">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-12 h-12 bg-pex-blue rounded-full flex items-center justify-center">
            <HelpCircle className="text-pex-gold" size={24} />
          </div>
          <h1 className="text-3xl font-light text-pex-blue">Frequently Asked Questions</h1>
        </div>
        
        <Card className="border-none shadow-xl">
          <CardContent className="p-8">
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="item-1">
                <AccordionTrigger className="text-pex-blue font-bold">How do I book a ride?</AccordionTrigger>
                <AccordionContent className="text-gray-600">
                  You can book a ride through our website or mobile app. Simply enter your pickup and dropoff locations, select your preferred vehicle class, and confirm your booking. You can also schedule rides in advance.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="item-2">
                <AccordionTrigger className="text-pex-blue font-bold">What vehicle classes do you offer?</AccordionTrigger>
                <AccordionContent className="text-gray-600">
                  We offer a range of premium vehicles, including Business Class (e.g., Mercedes-Benz E-Class), Business Van/SUV (e.g., Mercedes-Benz V-Class), and First Class (e.g., Mercedes-Benz S-Class).
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="item-3">
                <AccordionTrigger className="text-pex-blue font-bold">Are your prices fixed?</AccordionTrigger>
                <AccordionContent className="text-gray-600">
                  Yes, our prices are fixed and all-inclusive. The price you see when you book is the final price you will pay, including taxes, tolls, and gratuity. There are no hidden fees.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="item-4">
                <AccordionTrigger className="text-pex-blue font-bold">Can I cancel my booking?</AccordionTrigger>
                <AccordionContent className="text-gray-600">
                  Yes, you can cancel your booking for free up to 1 hour before the scheduled pickup time for one-way rides, and up to 24 hours before for hourly bookings.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="item-5">
                <AccordionTrigger className="text-pex-blue font-bold">How do I contact my chauffeur?</AccordionTrigger>
                <AccordionContent className="text-gray-600">
                  You will receive your chauffeur's contact details via SMS and email shortly before your scheduled pickup time. You can also contact them directly through the app.
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

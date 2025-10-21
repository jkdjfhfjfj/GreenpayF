import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { ArrowRight } from "lucide-react";
import { SEO } from "@/components/seo";

export default function HelpLanding() {
  const faqData = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": [
      {
        "@type": "Question",
        "name": "How do I send money to Kenya with GreenPay?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Sign up for a free GreenPay account, add funds in USD, select Kenya as the destination, enter the recipient details, and confirm your transfer. Money arrives instantly."
        }
      },
      {
        "@type": "Question",
        "name": "What is the USD to KES exchange rate?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "GreenPay offers live exchange rates updated in real-time. Current rate is approximately 129 KES per 1 USD. Check our app for the latest rates."
        }
      }
    ]
  };

  return (
    <>
      <SEO
        title="Help Center & FAQ | GreenPay Support - Money Transfer Questions"
        description="Find answers to common questions about sending money to Kenya, USD to KES rates, virtual cards, and airtime. Get help with GreenPay international transfers."
        keywords="GreenPay help, money transfer FAQ, Kenya transfer questions, USD to KES help, virtual card support"
        canonical="https://greenpay.world/help"
        structuredData={faqData}
      />
      <div className="min-h-screen bg-white">
      <div className="max-w-4xl mx-auto px-4 py-12">
        <header className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Help Center & FAQ
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            Find answers to common questions about GreenPay
          </p>
        </header>

        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Frequently Asked Questions</CardTitle>
          </CardHeader>
          <CardContent>
            <Accordion type="single" collapsible>
              <AccordionItem value="item-1">
                <AccordionTrigger>How do I send money to Kenya with GreenPay?</AccordionTrigger>
                <AccordionContent>
                  Sign up for a free GreenPay account, add funds in USD, select Kenya as the destination, 
                  enter the recipient details, and confirm your transfer. Money arrives instantly.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-2">
                <AccordionTrigger>What is the USD to KES exchange rate?</AccordionTrigger>
                <AccordionContent>
                  GreenPay offers live exchange rates updated in real-time. Current rate is approximately 
                  129 KES per 1 USD. Check our app for the latest rates.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-3">
                <AccordionTrigger>How long does it take to send money to Kenya?</AccordionTrigger>
                <AccordionContent>
                  Transfers to Kenya are instant. Once you confirm your transaction, the recipient receives 
                  the money immediately in their digital wallet or M-Pesa account.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-4">
                <AccordionTrigger>Are virtual cards included?</AccordionTrigger>
                <AccordionContent>
                  Yes! GreenPay offers virtual Mastercard cards that you can use for online shopping worldwide. 
                  Purchase a virtual card from your dashboard.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-5">
                <AccordionTrigger>What fees does GreenPay charge?</AccordionTrigger>
                <AccordionContent>
                  GreenPay offers transparent pricing with no hidden fees. You see the exact fees before 
                  confirming any transaction. Typically fees are 2-3% for international transfers.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-6">
                <AccordionTrigger>Is GreenPay secure?</AccordionTrigger>
                <AccordionContent>
                  Yes. GreenPay uses bank-level encryption and security measures to protect your money and 
                  personal information. We comply with all financial regulations and use secure payment 
                  processing partners.
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </CardContent>
        </Card>

        <div className="text-center">
          <Link href="/support">
            <Button variant="outline" className="mr-4">Contact Support</Button>
          </Link>
          <Link href="/signup">
            <Button className="bg-green-600 hover:bg-green-700">
              Get Started <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </Link>
        </div>
      </div>
    </div>
    </>
  );
}

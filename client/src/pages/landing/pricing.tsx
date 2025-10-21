import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Check, ArrowRight } from "lucide-react";
import { SEO } from "@/components/seo";

export default function PricingLanding() {
  return (
    <>
      <SEO
        title="Pricing & Fees | Transparent Money Transfer Costs | GreenPay"
        description="Clear, transparent pricing for money transfers to Kenya. 2-3% transfer fees, $5 virtual cards, no hidden costs. See exactly what you'll pay before you send."
        keywords="GreenPay pricing, money transfer fees, Kenya transfer cost, virtual card price, remittance fees"
        canonical="https://greenpay.world/pricing"
      />
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <div className="max-w-6xl mx-auto px-4 py-12">
        <header className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Transparent Pricing & Fees</h1>
          <p className="text-xl text-gray-600 mb-8">
            No hidden fees. Pay exactly what you see. Simple and transparent.
          </p>
        </header>

        <div className="grid md:grid-cols-2 gap-8 mb-12">
          <Card className="border-2 border-green-200">
            <CardHeader>
              <CardTitle className="text-2xl">Money Transfers</CardTitle>
              <CardDescription>Send money to Kenya</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="mb-6">
                <div className="text-4xl font-bold text-green-600 mb-2">2-3%</div>
                <div className="text-gray-600">Transaction Fee</div>
              </div>
              <ul className="space-y-3">
                <li className="flex items-start gap-2">
                  <Check className="h-5 w-5 text-green-600 mt-0.5" />
                  <span>Live USD to KES exchange rates</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="h-5 w-5 text-green-600 mt-0.5" />
                  <span>Instant delivery to M-Pesa or bank account</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="h-5 w-5 text-green-600 mt-0.5" />
                  <span>No minimum transfer amount</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="h-5 w-5 text-green-600 mt-0.5" />
                  <span>24/7 customer support</span>
                </li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">Virtual Cards</CardTitle>
              <CardDescription>For online shopping</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="mb-6">
                <div className="text-4xl font-bold text-blue-600 mb-2">$5</div>
                <div className="text-gray-600">One-time Purchase Fee</div>
              </div>
              <ul className="space-y-3">
                <li className="flex items-start gap-2">
                  <Check className="h-5 w-5 text-blue-600 mt-0.5" />
                  <span>Instant virtual Mastercard</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="h-5 w-5 text-blue-600 mt-0.5" />
                  <span>Use on any website worldwide</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="h-5 w-5 text-blue-600 mt-0.5" />
                  <span>No monthly fees</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="h-5 w-5 text-blue-600 mt-0.5" />
                  <span>Freeze/unfreeze anytime</span>
                </li>
              </ul>
            </CardContent>
          </Card>
        </div>

        <Card className="bg-gray-50">
          <CardHeader>
            <CardTitle>Other Services</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-3 gap-6">
              <div>
                <h3 className="font-semibold mb-2">Currency Exchange</h3>
                <p className="text-sm text-gray-600">Live rates, minimal spread</p>
              </div>
              <div>
                <h3 className="font-semibold mb-2">Airtime Top-Up</h3>
                <p className="text-sm text-gray-600">Face value + small service fee</p>
              </div>
              <div>
                <h3 className="font-semibold mb-2">Withdrawals</h3>
                <p className="text-sm text-gray-600">Standard processing fees apply</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="text-center mt-12">
          <Link href="/signup">
            <Button size="lg" className="bg-green-600 hover:bg-green-700">
              Get Started Free <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </Link>
        </div>
      </div>
    </div>
    </>
  );
}

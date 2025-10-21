import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Check, ArrowRight, CreditCard, Lock, Globe } from "lucide-react";
import { SEO } from "@/components/seo";

export default function VirtualCardsLanding() {
  return (
    <>
      <SEO
        title="Virtual Mastercard for Online Shopping | GreenPay Digital Wallet"
        description="Get instant virtual Mastercard for online shopping worldwide. Use on Amazon, Netflix, any website. Secure, instant issuance. Purchase your virtual card today!"
        keywords="virtual card, virtual Mastercard, online shopping, digital card, international payments, virtual debit card"
        canonical="https://greenpay.world/features/virtual-cards"
      />
      <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      <div className="max-w-6xl mx-auto px-4 py-12">
        <header className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Virtual Mastercard for Online Shopping
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            Get instant virtual cards for secure online payments worldwide
          </p>
          <div className="flex gap-4 justify-center">
            <Link href="/signup">
              <Button size="lg" className="bg-blue-600 hover:bg-blue-700">
                Get Your Card Now <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Link href="/login">
              <Button size="lg" variant="outline">
                Sign In
              </Button>
            </Link>
          </div>
        </header>

        <div className="grid md:grid-cols-3 gap-6 mb-12">
          <Card>
            <CardHeader>
              <CreditCard className="h-10 w-10 text-blue-600 mb-2" />
              <CardTitle>Instant Issuance</CardTitle>
              <CardDescription>
                Get your virtual Mastercard instantly. No waiting for physical cards.
              </CardDescription>
            </CardHeader>
          </Card>
          
          <Card>
            <CardHeader>
              <Globe className="h-10 w-10 text-blue-600 mb-2" />
              <CardTitle>Shop Worldwide</CardTitle>
              <CardDescription>
                Use on any website that accepts Mastercard. Perfect for international purchases.
              </CardDescription>
            </CardHeader>
          </Card>
          
          <Card>
            <CardHeader>
              <Lock className="h-10 w-10 text-blue-600 mb-2" />
              <CardTitle>Secure Payments</CardTitle>
              <CardDescription>
                Protected by Mastercard security. Freeze or cancel anytime from your app.
              </CardDescription>
            </CardHeader>
          </Card>
        </div>

        <Card className="bg-blue-50 border-blue-200 mb-12">
          <CardHeader>
            <CardTitle className="text-2xl">Perfect For</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="grid md:grid-cols-2 gap-4">
              <li className="flex items-start gap-2">
                <Check className="h-5 w-5 text-blue-600 mt-0.5" />
                <span>Online shopping (Amazon, eBay, AliExpress)</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="h-5 w-5 text-blue-600 mt-0.5" />
                <span>Subscription services (Netflix, Spotify)</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="h-5 w-5 text-blue-600 mt-0.5" />
                <span>Digital products and software</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="h-5 w-5 text-blue-600 mt-0.5" />
                <span>International payments</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="h-5 w-5 text-blue-600 mt-0.5" />
                <span>Travel bookings</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="h-5 w-5 text-blue-600 mt-0.5" />
                <span>App stores and gaming</span>
              </li>
            </ul>
          </CardContent>
        </Card>

        <div className="text-center">
          <Link href="/signup">
            <Button size="lg" className="bg-blue-600 hover:bg-blue-700">
              Get Your Virtual Card <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </Link>
        </div>
      </div>
    </div>
    </>
  );
}

import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Check, ArrowRight, Shield, Zap, DollarSign } from "lucide-react";
import { SEO } from "@/components/seo";

export default function SendMoneyLanding() {
  return (
    <>
      <SEO
        title="Send Money to Kenya Instantly | GreenPay - Best USD to KES Rates"
        description="Send money to Kenya instantly with GreenPay. Best USD to KES exchange rates, low fees, instant M-Pesa delivery. Join thousands sending money home today!"
        keywords="send money to Kenya, USD to KES, international money transfer, Kenya remittance, M-Pesa, send money home, Kenya diaspora"
        canonical="https://greenpay.world/features/send-money"
      />
      <div className="min-h-screen bg-gradient-to-b from-green-50 to-white">
      <div className="max-w-6xl mx-auto px-4 py-12">
        <header className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Send Money to Kenya Instantly
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            Fast, secure, and affordable international money transfers with the best USD to KES exchange rates
          </p>
          <div className="flex gap-4 justify-center">
            <Link href="/signup">
              <Button size="lg" className="bg-green-600 hover:bg-green-700">
                Get Started Free <ArrowRight className="ml-2 h-5 w-5" />
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
              <Zap className="h-10 w-10 text-green-600 mb-2" />
              <CardTitle>Instant Transfers</CardTitle>
              <CardDescription>
                Money arrives in seconds, not days. Send to M-Pesa or bank accounts instantly.
              </CardDescription>
            </CardHeader>
          </Card>
          
          <Card>
            <CardHeader>
              <DollarSign className="h-10 w-10 text-green-600 mb-2" />
              <CardTitle>Best Exchange Rates</CardTitle>
              <CardDescription>
                Live USD to KES rates updated in real-time. No hidden fees or markups.
              </CardDescription>
            </CardHeader>
          </Card>
          
          <Card>
            <CardHeader>
              <Shield className="h-10 w-10 text-green-600 mb-2" />
              <CardTitle>100% Secure</CardTitle>
              <CardDescription>
                Bank-level encryption and security. Your money is always protected.
              </CardDescription>
            </CardHeader>
          </Card>
        </div>

        <Card className="mb-12">
          <CardHeader>
            <CardTitle className="text-2xl">How It Works</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-4 gap-6">
              <div className="text-center">
                <div className="w-12 h-12 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-3 font-bold text-lg">1</div>
                <h3 className="font-semibold mb-2">Create Account</h3>
                <p className="text-sm text-gray-600">Sign up for free in under 2 minutes</p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-3 font-bold text-lg">2</div>
                <h3 className="font-semibold mb-2">Add Money</h3>
                <p className="text-sm text-gray-600">Deposit USD to your wallet</p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-3 font-bold text-lg">3</div>
                <h3 className="font-semibold mb-2">Enter Details</h3>
                <p className="text-sm text-gray-600">Add recipient phone or account</p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-3 font-bold text-lg">4</div>
                <h3 className="font-semibold mb-2">Send Instantly</h3>
                <p className="text-sm text-gray-600">Money arrives in seconds</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-green-50 border-green-200">
          <CardHeader>
            <CardTitle className="text-2xl">Why Choose GreenPay?</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              <li className="flex items-start gap-2">
                <Check className="h-5 w-5 text-green-600 mt-0.5" />
                <span><strong>Live Exchange Rates:</strong> Real-time USD to KES conversion rates, updated every minute</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="h-5 w-5 text-green-600 mt-0.5" />
                <span><strong>No Hidden Fees:</strong> Transparent pricing with no surprises</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="h-5 w-5 text-green-600 mt-0.5" />
                <span><strong>24/7 Support:</strong> Live chat support whenever you need help</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="h-5 w-5 text-green-600 mt-0.5" />
                <span><strong>Trusted by Thousands:</strong> Join the Kenyan diaspora sending money home</span>
              </li>
            </ul>
          </CardContent>
        </Card>

        <div className="text-center mt-12">
          <Link href="/signup">
            <Button size="lg" className="bg-green-600 hover:bg-green-700">
              Start Sending Money Now <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </Link>
        </div>
      </div>
    </div>
    </>
  );
}

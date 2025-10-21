import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Check, ArrowRight, Smartphone, Zap } from "lucide-react";
import { SEO } from "@/components/seo";

export default function AirtimeLanding() {
  return (
    <>
      <SEO
        title="Buy Airtime for Kenya | Safaricom, Airtel, Telkom Top-Up | GreenPay"
        description="Top up mobile airtime for Kenya instantly. Support for Safaricom, Airtel Kenya, and Telkom. Fast delivery, transparent pricing. Buy airtime now!"
        keywords="Kenya airtime, Safaricom airtime, Airtel Kenya top-up, Telkom Kenya, mobile airtime, buy airtime Kenya"
        canonical="https://greenpay.world/features/airtime"
      />
      <div className="min-h-screen bg-gradient-to-b from-purple-50 to-white">
      <div className="max-w-6xl mx-auto px-4 py-12">
        <header className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Buy Airtime for Kenya
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            Top up mobile airtime instantly for Safaricom, Airtel, and Telkom Kenya
          </p>
          <Link href="/signup">
            <Button size="lg" className="bg-purple-600 hover:bg-purple-700">
              Buy Airtime Now <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </Link>
        </header>

        <div className="grid md:grid-cols-3 gap-6 mb-12">
          <Card>
            <CardHeader>
              <Zap className="h-10 w-10 text-purple-600 mb-2" />
              <CardTitle>Instant Delivery</CardTitle>
              <CardDescription>
                Airtime delivered in seconds directly to any Kenyan mobile number
              </CardDescription>
            </CardHeader>
          </Card>
          
          <Card>
            <CardHeader>
              <Smartphone className="h-10 w-10 text-purple-600 mb-2" />
              <CardTitle>All Networks</CardTitle>
              <CardDescription>
                Support for Safaricom, Airtel Kenya, and Telkom Kenya
              </CardDescription>
            </CardHeader>
          </Card>
          
          <Card>
            <CardHeader>
              <Check className="h-10 w-10 text-purple-600 mb-2" />
              <CardTitle>No Hidden Fees</CardTitle>
              <CardDescription>
                Transparent pricing. Pay exactly what you see with no surprises.
              </CardDescription>
            </CardHeader>
          </Card>
        </div>

        <Card className="bg-purple-50 border-purple-200">
          <CardHeader>
            <CardTitle>Supported Networks</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              <li className="flex items-center gap-2">
                <Check className="h-5 w-5 text-purple-600" />
                <span><strong>Safaricom</strong> - Kenya's largest mobile network</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="h-5 w-5 text-purple-600" />
                <span><strong>Airtel Kenya</strong> - Fast and reliable service</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="h-5 w-5 text-purple-600" />
                <span><strong>Telkom Kenya</strong> - Great coverage nationwide</span>
              </li>
            </ul>
          </CardContent>
        </Card>

        <div className="text-center mt-12">
          <Link href="/signup">
            <Button size="lg" className="bg-purple-600 hover:bg-purple-700">
              Top Up Airtime <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </Link>
        </div>
      </div>
    </div>
    </>
  );
}

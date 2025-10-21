import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowRight, TrendingUp } from "lucide-react";
import { SEO } from "@/components/seo";

export default function ExchangeLanding() {
  return (
    <>
      <SEO
        title="USD to KES Exchange Rate - Live Rates | GreenPay Currency Exchange"
        description="Convert USD to KES with live exchange rates. Current rate: 129.27 KES per USD. No hidden fees. Fast, secure currency exchange for Kenya."
        keywords="USD to KES, currency exchange, exchange rate, Kenya shilling, US dollar to Kenyan shilling, forex Kenya"
        canonical="https://greenpay.world/features/exchange"
      />
      <div className="min-h-screen bg-gradient-to-b from-green-50 to-white">
      <div className="max-w-4xl mx-auto px-4 py-12">
        <header className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            USD to KES Exchange - Best Rates
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            Convert between USD and KES with live exchange rates. No hidden fees.
          </p>
          <Link href="/signup">
            <Button size="lg" className="bg-green-600 hover:bg-green-700">
              Start Exchanging <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </Link>
        </header>

        <Card className="mb-8">
          <CardHeader>
            <div className="flex items-center gap-2">
              <TrendingUp className="h-6 w-6 text-green-600" />
              <CardTitle>Live Exchange Rate</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-center p-8 bg-green-50 rounded-lg">
              <div className="text-5xl font-bold text-green-600 mb-2">129.27</div>
              <div className="text-gray-600">KES per 1 USD</div>
              <div className="text-sm text-gray-500 mt-2">Updated in real-time</div>
            </div>
          </CardContent>
        </Card>

        <div className="text-center">
          <Link href="/signup">
            <Button size="lg" className="bg-green-600 hover:bg-green-700">
              Get Started <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </Link>
        </div>
      </div>
    </div>
    </>
  );
}

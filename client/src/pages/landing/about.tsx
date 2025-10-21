import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowRight, Users, Target, Heart } from "lucide-react";
import { SEO } from "@/components/seo";

export default function AboutLanding() {
  return (
    <>
      <SEO
        title="About GreenPay | Empowering Kenya Diaspora with Fast Money Transfers"
        description="Learn about GreenPay's mission to make international money transfers to Kenya simple and affordable. Join thousands sending money home with transparency and speed."
        keywords="about GreenPay, Kenya diaspora, international remittance company, money transfer service, about us"
        canonical="https://greenpay.world/about"
      />
      <div className="min-h-screen bg-white">
      <div className="max-w-4xl mx-auto px-4 py-12">
        <header className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">About GreenPay</h1>
          <p className="text-xl text-gray-600 mb-8">
            Empowering the Kenyan diaspora to send money home with speed, security, and transparency
          </p>
        </header>

        <Card className="mb-8">
          <CardHeader>
            <Target className="h-8 w-8 text-green-600 mb-2" />
            <CardTitle>Our Mission</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-700">
              GreenPay was founded to make international money transfers to Kenya simple, affordable, and instant. 
              We believe everyone deserves access to fast, transparent financial services without hidden fees or 
              complicated processes. Our mission is to connect families and support economic growth in Kenya through 
              reliable remittance services.
            </p>
          </CardContent>
        </Card>

        <Card className="mb-8">
          <CardHeader>
            <Heart className="h-8 w-8 text-green-600 mb-2" />
            <CardTitle>Why GreenPay?</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3 text-gray-700">
              <li><strong>Built for Kenya:</strong> Optimized specifically for USD to KES transfers and M-Pesa integration</li>
              <li><strong>Transparent Pricing:</strong> No hidden fees. What you see is what you pay</li>
              <li><strong>Instant Transfers:</strong> Money arrives in seconds, not days</li>
              <li><strong>24/7 Support:</strong> Our team is always here to help you</li>
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <Users className="h-8 w-8 text-green-600 mb-2" />
            <CardTitle>Join Thousands of Users</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-700 mb-4">
              GreenPay is trusted by thousands of people in the Kenyan diaspora who send money home regularly. 
              Whether it's supporting family, investing in property, or managing business operations, GreenPay 
              makes it easy and affordable.
            </p>
            <Link href="/signup">
              <Button className="bg-green-600 hover:bg-green-700">
                Get Started Today <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
    </>
  );
}

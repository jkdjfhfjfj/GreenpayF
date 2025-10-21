import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Mail, MessageCircle, Phone, ArrowRight } from "lucide-react";
import { SEO } from "@/components/seo";

export default function ContactLanding() {
  return (
    <>
      <SEO
        title="Contact Support | Get Help with Money Transfers | GreenPay"
        description="Contact GreenPay support via live chat, email, or phone. 24/7 customer service for money transfers, virtual cards, and account help. support@greenpay.world"
        keywords="GreenPay contact, customer support, live chat, help desk, contact support"
        canonical="https://greenpay.world/contact"
      />
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <div className="max-w-4xl mx-auto px-4 py-12">
        <header className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Contact Support</h1>
          <p className="text-xl text-gray-600 mb-8">
            We're here to help. Get in touch with our support team.
          </p>
        </header>

        <div className="grid md:grid-cols-3 gap-6 mb-12">
          <Card>
            <CardHeader>
              <MessageCircle className="h-10 w-10 text-green-600 mb-2" />
              <CardTitle>Live Chat</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700 mb-4">
                Chat with our support team in real-time. Available 24/7 for account holders.
              </p>
              <Link href="/login">
                <Button variant="outline" className="w-full">
                  Sign In to Chat
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <Mail className="h-10 w-10 text-green-600 mb-2" />
              <CardTitle>Email Support</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700 mb-4">
                Send us an email and we'll respond within 24 hours.
              </p>
              <a href="mailto:support@greenpay.world">
                <Button variant="outline" className="w-full">
                  support@greenpay.world
                </Button>
              </a>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <Phone className="h-10 w-10 text-green-600 mb-2" />
              <CardTitle>Phone Support</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700 mb-4">
                Call us for urgent assistance. International rates apply.
              </p>
              <a href="tel:+18006737729">
                <Button variant="outline" className="w-full">
                  +1-800-GREENPAY
                </Button>
              </a>
            </CardContent>
          </Card>
        </div>

        <Card className="bg-blue-50 border-blue-200 mb-8">
          <CardHeader>
            <CardTitle>Need Help?</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-700 mb-4">
              Before contacting support, check our Help Center for answers to common questions about 
              transfers, virtual cards, and account management.
            </p>
            <Link href="/help">
              <Button variant="outline">Visit Help Center</Button>
            </Link>
          </CardContent>
        </Card>

        <div className="text-center">
          <p className="text-gray-600 mb-4">Don't have an account yet?</p>
          <Link href="/signup">
            <Button size="lg" className="bg-green-600 hover:bg-green-700">
              Sign Up Free <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </Link>
        </div>
      </div>
    </div>
    </>
  );
}

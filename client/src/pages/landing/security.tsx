import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield, Lock, Eye, FileCheck, ArrowRight } from "lucide-react";
import { SEO } from "@/components/seo";

export default function SecurityLanding() {
  return (
    <>
      <SEO
        title="Security & Compliance | Bank-Level Protection | GreenPay"
        description="Your money is protected with 256-bit encryption, two-factor authentication, KYC verification, and AML compliance. Trust GreenPay for secure transfers."
        keywords="GreenPay security, money transfer safety, encryption, KYC verification, AML compliance, secure remittance"
        canonical="https://greenpay.world/security"
      />
      <div className="min-h-screen bg-white">
      <div className="max-w-6xl mx-auto px-4 py-12">
        <header className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Security & Compliance</h1>
          <p className="text-xl text-gray-600 mb-8">
            Your money and data are protected with bank-level security
          </p>
        </header>

        <div className="grid md:grid-cols-2 gap-6 mb-12">
          <Card>
            <CardHeader>
              <Lock className="h-10 w-10 text-green-600 mb-2" />
              <CardTitle>Bank-Level Encryption</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700">
                All data is encrypted using industry-standard 256-bit SSL encryption. Your personal information 
                and financial data are protected both in transit and at rest.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <Shield className="h-10 w-10 text-green-600 mb-2" />
              <CardTitle>Two-Factor Authentication</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700">
                Protect your account with multi-factor authentication via SMS or WhatsApp. Every transaction 
                requires verification to ensure it's really you.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <FileCheck className="h-10 w-10 text-green-600 mb-2" />
              <CardTitle>KYC Verification</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700">
                We verify all users through a secure Know Your Customer (KYC) process to prevent fraud and 
                comply with international financial regulations.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <Eye className="h-10 w-10 text-green-600 mb-2" />
              <CardTitle>Transaction Monitoring</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700">
                Our advanced fraud detection system monitors all transactions in real-time to identify and 
                prevent suspicious activity before it affects you.
              </p>
            </CardContent>
          </Card>
        </div>

        <Card className="bg-green-50 border-green-200 mb-8">
          <CardHeader>
            <CardTitle>Compliance & Regulations</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3 text-gray-700">
              <li><strong>AML/CTF Compliance:</strong> We follow strict Anti-Money Laundering and Counter-Terrorism Financing protocols</li>
              <li><strong>Data Protection:</strong> Full compliance with international data protection regulations</li>
              <li><strong>Financial Licensing:</strong> Authorized and regulated to provide money transfer services</li>
              <li><strong>Regular Audits:</strong> Independent security audits and penetration testing</li>
            </ul>
          </CardContent>
        </Card>

        <div className="text-center">
          <Link href="/signup">
            <Button size="lg" className="bg-green-600 hover:bg-green-700">
              Create Secure Account <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </Link>
        </div>
      </div>
    </div>
    </>
  );
}

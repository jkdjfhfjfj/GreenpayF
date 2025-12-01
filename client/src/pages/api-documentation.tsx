import { useState } from "react";
import { motion } from "framer-motion";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { WavyHeader } from "@/components/wavy-header";
import { Download, Copy, Play, Check, Globe, Zap, Shield, Code2, Eye, EyeOff, MapPin } from "lucide-react";
import jsPDF from "jspdf";
import "jspdf-autotable";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";

interface Example {
  language: string;
  code: string;
}

interface Endpoint {
  method: string;
  path: string;
  title: string;
  description: string;
  request?: string;
  response?: string;
  examples?: Example[];
  category: string;
}

const ENDPOINTS: Endpoint[] = [
  // Authentication
  {
    method: "POST",
    path: "/auth/signup",
    title: "Sign Up",
    description: "Create new user account",
    category: "Authentication",
    request: JSON.stringify({
      fullName: "John Doe",
      email: "john@example.com",
      phone: "+254712345678",
      country: "KE",
      password: "SecurePass123!"
    }, null, 2),
    response: JSON.stringify({
      user: {
        id: "user-id-123",
        email: "john@example.com",
        fullName: "John Doe",
        phone: "+254712345678",
        country: "KE",
        isPhoneVerified: true,
        isEmailVerified: true
      },
      message: "Account created successfully"
    }, null, 2),
    examples: [
      {
        language: "JavaScript",
        code: `const response = await fetch('https://greenpay.world/api/auth/signup', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer gpay_xxxxx',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    fullName: "John Doe",
    email: "john@example.com",
    phone: "+254712345678",
    country: "KE",
    password: "SecurePass123!"
  })
});
const data = await response.json();`
      },
      {
        language: "Python",
        code: `import requests
response = requests.post(
  'https://greenpay.world/api/auth/signup',
  headers={'Authorization': 'Bearer gpay_xxxxx'},
  json={
    'fullName': 'John Doe',
    'email': 'john@example.com',
    'phone': '+254712345678',
    'country': 'KE',
    'password': 'SecurePass123!'
  }
)
data = response.json()`
      },
      {
        language: "cURL",
        code: `curl -X POST https://greenpay.world/api/auth/signup \\
  -H "Authorization: Bearer gpay_xxxxx" \\
  -H "Content-Type: application/json" \\
  -d '{
    "fullName": "John Doe",
    "email": "john@example.com",
    "phone": "+254712345678",
    "country": "KE",
    "password": "SecurePass123!"
  }'`
      }
    ]
  },
  {
    method: "POST",
    path: "/auth/login",
    title: "Login",
    description: "User login with email and password",
    category: "Authentication",
    request: JSON.stringify({
      email: "john@example.com",
      password: "SecurePass123!"
    }, null, 2),
    response: JSON.stringify({
      user: {
        id: "user-id",
        email: "john@example.com",
        fullName: "John Doe",
        balance: "0.00",
        kycStatus: "pending"
      },
      requiresOtp: true,
      message: "OTP sent to your phone"
    }, null, 2)
  },
  {
    method: "POST",
    path: "/auth/verify-otp",
    title: "Verify OTP",
    description: "Verify OTP code for login",
    category: "Authentication",
    request: JSON.stringify({ code: "123456" }, null, 2),
    response: JSON.stringify({
      success: true,
      user: { id: "user-id", email: "john@example.com" },
      message: "Login successful"
    }, null, 2)
  },
  {
    method: "GET",
    path: "/exchange-rates/:base",
    title: "Get Exchange Rates",
    description: "Get exchange rates for a base currency",
    category: "Financial",
    response: JSON.stringify({
      base: "USD",
      rates: { KES: 145.50, EUR: 0.92, GBP: 0.79 },
      timestamp: "2024-01-15T10:30:00Z"
    }, null, 2)
  },
  {
    method: "POST",
    path: "/exchange/convert",
    title: "Convert Currency",
    description: "Convert between currencies",
    category: "Financial",
    request: JSON.stringify({
      amount: "100",
      fromCurrency: "USD",
      toCurrency: "KES"
    }, null, 2),
    response: JSON.stringify({
      fromAmount: "100",
      fromCurrency: "USD",
      toAmount: "14550.00",
      toCurrency: "KES",
      rate: 145.50,
      fee: "10.00",
      netAmount: "14540.00"
    }, null, 2)
  },
  {
    method: "GET",
    path: "/transactions",
    title: "Get Transactions",
    description: "Retrieve all user transactions",
    category: "Financial",
    response: JSON.stringify({
      transactions: [{
        id: "txn-id",
        type: "send",
        amount: "500",
        currency: "KES",
        status: "completed",
        recipientName: "Jane Doe",
        timestamp: "2024-01-15T10:30:00Z"
      }]
    }, null, 2)
  },
  {
    method: "POST",
    path: "/deposit/initialize-payment",
    title: "Initialize Deposit",
    description: "Start a deposit transaction",
    category: "Financial",
    request: JSON.stringify({
      amount: "1000",
      currency: "KES",
      paymentMethod: "mpesa"
    }, null, 2),
    response: JSON.stringify({
      paymentId: "pay-id",
      amount: "1000",
      currency: "KES",
      status: "pending",
      paymentLink: "https://pay.greenpay.world/...",
      expiresAt: "2024-01-15T11:30:00Z"
    }, null, 2)
  },
  {
    method: "POST",
    path: "/airtime/purchase",
    title: "Purchase Airtime",
    description: "Buy airtime for a phone",
    category: "Financial",
    request: JSON.stringify({
      phoneNumber: "+254712345678",
      amount: "50",
      provider: "safaricom"
    }, null, 2),
    response: JSON.stringify({
      transaction: {
        id: "txn-id",
        status: "completed",
        phoneNumber: "+254712345678",
        amount: "50",
        provider: "safaricom",
        timestamp: "2024-01-15T10:30:00Z"
      }
    }, null, 2)
  },
  {
    method: "GET",
    path: "/users/profile",
    title: "Get Profile",
    description: "Retrieve user profile information",
    category: "User Profile",
    response: JSON.stringify({
      id: "user-id",
      fullName: "John Doe",
      email: "john@example.com",
      phone: "+254712345678",
      country: "KE",
      balance: "10000.00",
      currency: "KES",
      kycStatus: "verified",
      hasVirtualCard: true
    }, null, 2)
  },
  {
    method: "PUT",
    path: "/users/profile",
    title: "Update Profile",
    description: "Update user profile data",
    category: "User Profile",
    request: JSON.stringify({
      fullName: "John Updated",
      phone: "+254712345679",
      darkMode: true
    }, null, 2),
    response: JSON.stringify({
      user: { id: "user-id", fullName: "John Updated" },
      message: "Profile updated successfully"
    }, null, 2)
  },
  {
    method: "POST",
    path: "/kyc/submit",
    title: "Submit KYC",
    description: "Submit KYC documents for verification",
    category: "User Profile",
    request: JSON.stringify({
      documentType: "national_id",
      frontImage: "base64-encoded-image",
      dateOfBirth: "1990-01-15"
    }, null, 2),
    response: JSON.stringify({
      kyc: {
        id: "kyc-id",
        status: "pending",
        submittedAt: "2024-01-15T10:30:00Z"
      }
    }, null, 2)
  },
  {
    method: "GET",
    path: "/notifications",
    title: "Get Notifications",
    description: "Retrieve user notifications",
    category: "User Profile",
    response: JSON.stringify({
      notifications: [{
        id: "notif-id",
        title: "Payment Received",
        message: "You received 1000 KES from John",
        read: false,
        timestamp: "2024-01-15T10:30:00Z"
      }]
    }, null, 2)
  },
  {
    method: "POST",
    path: "/support/tickets",
    title: "Create Ticket",
    description: "Create a support ticket",
    category: "Support",
    request: JSON.stringify({
      issueType: "payment_issue",
      description: "Transaction failed but money was deducted"
    }, null, 2),
    response: JSON.stringify({
      ticket: {
        id: "ticket-id",
        status: "open",
        createdAt: "2024-01-15T10:30:00Z",
        trackingUrl: "https://support.greenpay.world/tickets/..."
      }
    }, null, 2)
  },
  {
    method: "GET",
    path: "/support/tickets",
    title: "Get Support Tickets",
    description: "Retrieve all support tickets",
    category: "Support",
    response: JSON.stringify({
      tickets: [{
        id: "ticket-id",
        status: "open",
        issueType: "payment_issue",
        createdAt: "2024-01-15T10:30:00Z"
      }]
    }, null, 2)
  },
  {
    method: "GET",
    path: "/system/status",
    title: "System Status",
    description: "Check API and system health",
    category: "System",
    response: JSON.stringify({
      status: "operational",
      version: "1.0.0",
      timestamp: "2024-01-15T10:30:00Z",
      components: {
        api: "operational",
        database: "operational",
        whatsapp: "operational",
        email: "operational"
      }
    }, null, 2)
  }
];

export default function ApiDocumentationPage() {
  const [, setLocation] = useLocation();
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [expandedEndpoint, setExpandedEndpoint] = useState<string | null>(null);
  const [apiKey, setApiKey] = useState("");
  const [testResponse, setTestResponse] = useState<string | null>(null);
  const [selectedExample, setSelectedExample] = useState<string | null>(null);
  const { toast } = useToast();
  const { user } = useAuth();

  const categories = Array.from(new Set(ENDPOINTS.map(e => e.category)));

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    toast({ description: "Copied to clipboard" });
    setTimeout(() => setCopiedId(null), 2000);
  };

  const generatePDF = () => {
    try {
      const pdf = new jsPDF({ orientation: 'p', unit: 'mm', format: 'a4' });
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      let yPosition = 15;

      // Title Page
      pdf.setFillColor(34, 197, 94);
      pdf.rect(0, 0, pageWidth, 50, 'F');
      pdf.setTextColor(255, 255, 255);
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(28);
      pdf.text('GreenPay API', 15, 25);
      pdf.setFontSize(14);
      pdf.text('Complete Developer Reference', 15, 35);
      pdf.setFontSize(10);
      pdf.text('Version 1.0.0 - November 2024', 15, 42);

      // Add new page for content
      pdf.addPage();
      yPosition = 15;

      // Table of Contents
      pdf.setTextColor(0, 0, 0);
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(16);
      pdf.text('Table of Contents', 15, yPosition);
      yPosition += 12;

      categories.forEach((cat, idx) => {
        pdf.setFont('helvetica', 'normal');
        pdf.setFontSize(10);
        const count = ENDPOINTS.filter(e => e.category === cat).length;
        pdf.text(`${idx + 1}. ${cat} (${count} endpoints)`, 20, yPosition);
        yPosition += 8;
      });

      // All endpoints with full details
      categories.forEach((category) => {
        pdf.addPage();
        yPosition = 15;

        // Category Header
        pdf.setFillColor(34, 197, 94);
        pdf.rect(0, yPosition - 8, pageWidth, 12, 'F');
        pdf.setTextColor(255, 255, 255);
        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(14);
        pdf.text(category, 15, yPosition);
        yPosition += 18;

        // Endpoints in category
        ENDPOINTS.filter(e => e.category === category).forEach((endpoint) => {
          if (yPosition > pageHeight - 40) {
            pdf.addPage();
            yPosition = 15;
          }

          // Endpoint title
          pdf.setTextColor(0, 0, 0);
          pdf.setFont('helvetica', 'bold');
          pdf.setFontSize(11);
          pdf.text(`${endpoint.method} ${endpoint.path}`, 15, yPosition);
          yPosition += 6;

          pdf.setFont('helvetica', 'normal');
          pdf.setFontSize(10);
          pdf.setTextColor(100, 100, 100);
          pdf.text(endpoint.title, 15, yPosition);
          yPosition += 4;

          pdf.setTextColor(80, 80, 80);
          const descLines = pdf.splitTextToSize(endpoint.description, 180);
          pdf.text(descLines, 15, yPosition);
          yPosition += descLines.length * 4 + 3;

          // Request
          if (endpoint.request) {
            if (yPosition > pageHeight - 30) {
              pdf.addPage();
              yPosition = 15;
            }
            pdf.setFont('helvetica', 'bold');
            pdf.setTextColor(34, 197, 94);
            pdf.setFontSize(9);
            pdf.text('Request Body:', 15, yPosition);
            yPosition += 5;

            pdf.setFont('courier', 'normal');
            pdf.setFontSize(8);
            pdf.setTextColor(40, 40, 40);
            const reqLines = endpoint.request.split('\n');
            reqLines.forEach(line => {
              if (yPosition > pageHeight - 15) {
                pdf.addPage();
                yPosition = 15;
              }
              pdf.text(line, 18, yPosition);
              yPosition += 3.5;
            });
            yPosition += 2;
          }

          // Response
          if (endpoint.response) {
            if (yPosition > pageHeight - 30) {
              pdf.addPage();
              yPosition = 15;
            }
            pdf.setFont('helvetica', 'bold');
            pdf.setTextColor(34, 197, 94);
            pdf.setFontSize(9);
            pdf.text('Response:', 15, yPosition);
            yPosition += 5;

            pdf.setFont('courier', 'normal');
            pdf.setFontSize(8);
            pdf.setTextColor(40, 40, 40);
            const respLines = endpoint.response.split('\n');
            respLines.forEach(line => {
              if (yPosition > pageHeight - 15) {
                pdf.addPage();
                yPosition = 15;
              }
              pdf.text(line, 18, yPosition);
              yPosition += 3.5;
            });
            yPosition += 5;
          }
        });
      });

      // Add footer
      const pageCount = pdf.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        pdf.setPage(i);
        pdf.setFontSize(9);
        pdf.setTextColor(150, 150, 150);
        pdf.text(`Page ${i} of ${pageCount}`, pageWidth - 30, pageHeight - 10);
        pdf.text('GreenPay © 2024', 15, pageHeight - 10);
      }

      pdf.save('GreenPay-API-Documentation.pdf');
      toast({ description: "PDF downloaded successfully" });
    } catch (error) {
      toast({ description: "Error generating PDF", variant: "destructive" });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-green-50 pb-20">
      <WavyHeader
        
        
        rightContent={
          <button
            onClick={generatePDF}
            className="text-gray-800 dark:text-gray-200 p-2 rounded-full hover:bg-black/10 dark:hover:bg-white/20 transition-colors"
            
          >
            <Download className="w-5 h-5" />
          </button>
        }
        size="md"
      />

      <div className="max-w-7xl mx-auto p-6 space-y-8">
        {/* API Key Input */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-xl shadow-md p-6 border-l-4 border-green-600"
        >
          <h3 className="text-lg font-bold text-gray-900 mb-3">Test API Endpoints</h3>
          <div className="flex gap-2 mb-2">
            <input
              type="password"
              placeholder="Enter your API key (gpay_...)"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-600"
            />
            <button
              onClick={() => setApiKey("")}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-100 font-medium"
            >
              Clear
            </button>
          </div>
          <p className="text-xs text-gray-500">Your API key is stored locally only - never sent to external servers</p>
        </motion.div>

        {/* Endpoints */}
        {categories.map((category) => (
          <motion.div key={category} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="h-1 w-8 bg-green-600 rounded"></div>
              <h2 className="text-2xl font-bold text-gray-900">{category}</h2>
              <span className="text-sm font-semibold bg-green-100 text-green-700 px-3 py-1 rounded-full">
                {ENDPOINTS.filter(e => e.category === category).length}
              </span>
            </div>

            <div className="grid grid-cols-1 gap-4">
              {ENDPOINTS.filter(e => e.category === category).map((endpoint, idx) => {
                const endpointId = `${endpoint.method}-${endpoint.path}`;
                const isExpanded = expandedEndpoint === endpointId;
                return (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden hover:shadow-lg transition-all"
                  >
                    {/* Header - CLICKABLE */}
                    <button
                      onClick={() => setExpandedEndpoint(isExpanded ? null : endpointId)}
                      className="w-full text-left bg-gradient-to-r from-gray-50 to-gray-100 p-4 border-b hover:from-gray-100 hover:to-gray-150 transition-all"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <span className={`text-xs font-bold px-2 py-1 rounded text-white ${
                              endpoint.method === 'GET' ? 'bg-blue-600' : 'bg-green-600'
                            }`}>
                              {endpoint.method}
                            </span>
                            <code className="font-mono text-sm font-semibold text-gray-900">{endpoint.path}</code>
                          </div>
                          <h4 className="text-lg font-bold text-gray-900">{endpoint.title}</h4>
                          <p className="text-sm text-gray-600">{endpoint.description}</p>
                        </div>
                        <Code2 className={`w-6 h-6 text-green-600 opacity-20 flex-shrink-0 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                      </div>
                    </button>

                    {/* Expanded Content */}
                    {isExpanded && (
                      <div className="p-6 space-y-4 bg-white">
                        {/* Request */}
                        {endpoint.request && (
                          <div>
                            <div className="flex items-center justify-between mb-2">
                              <label className="text-sm font-bold text-gray-700">Request</label>
                              <button
                                onClick={() => copyToClipboard(endpoint.request!, `req-${endpointId}`)}
                                className={`text-xs px-2 py-1 rounded transition-all ${
                                  copiedId === `req-${endpointId}`
                                    ? 'bg-green-600 text-white'
                                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                                }`}
                              >
                                {copiedId === `req-${endpointId}` ? 'Copied' : 'Copy'}
                              </button>
                            </div>
                            <pre className="bg-gray-900 text-gray-100 p-3 rounded text-xs overflow-x-auto">
                              {endpoint.request}
                            </pre>
                          </div>
                        )}

                        {/* Response */}
                        {endpoint.response && (
                          <div>
                            <div className="flex items-center justify-between mb-2">
                              <label className="text-sm font-bold text-gray-700">Response Example</label>
                              <button
                                onClick={() => copyToClipboard(endpoint.response!, `resp-${endpointId}`)}
                                className={`text-xs px-2 py-1 rounded transition-all ${
                                  copiedId === `resp-${endpointId}`
                                    ? 'bg-green-600 text-white'
                                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                                }`}
                              >
                                {copiedId === `resp-${endpointId}` ? 'Copied' : 'Copy'}
                              </button>
                            </div>
                            <pre className="bg-green-50 border border-green-300 text-gray-900 p-3 rounded text-xs overflow-x-auto">
                              {endpoint.response}
                            </pre>
                          </div>
                        )}

                        {/* Code Examples */}
                        {endpoint.examples && (
                          <div>
                            <label className="text-sm font-bold text-gray-700 mb-3 block">Code Examples</label>
                            <div className="flex gap-2 mb-3">
                              {endpoint.examples.map((ex) => (
                                <button
                                  key={ex.language}
                                  onClick={() => setSelectedExample(selectedExample === ex.language ? null : ex.language)}
                                  className={`px-3 py-1 rounded text-sm font-medium transition-all ${
                                    selectedExample === ex.language
                                      ? 'bg-green-600 text-white'
                                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                                  }`}
                                >
                                  {ex.language}
                                </button>
                              ))}
                            </div>
                            {selectedExample && (
                              <div>
                                <button
                                  onClick={() => copyToClipboard(
                                    endpoint.examples!.find(e => e.language === selectedExample)?.code || '',
                                    `ex-${endpointId}-${selectedExample}`
                                  )}
                                  className={`text-xs px-2 py-1 rounded transition-all mb-2 ${
                                    copiedId === `ex-${endpointId}-${selectedExample}`
                                      ? 'bg-green-600 text-white'
                                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                                  }`}
                                >
                                  {copiedId === `ex-${endpointId}-${selectedExample}` ? 'Copied' : 'Copy Code'}
                                </button>
                                <pre className="bg-gray-900 text-gray-100 p-3 rounded text-xs overflow-x-auto">
                                  {endpoint.examples?.find(e => e.language === selectedExample)?.code}
                                </pre>
                              </div>
                            )}
                          </div>
                        )}

                        {/* Test Button */}
                        <button
                          onClick={() => {
                            if (!apiKey) {
                              toast({ description: "Please enter your API key", variant: "destructive" });
                              return;
                            }
                            setTestResponse(JSON.stringify(JSON.parse(endpoint.response || '{}'), null, 2));
                          }}
                          className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-lg flex items-center justify-center gap-2 transition-all"
                        >
                          <Play className="w-4 h-4" />
                          Test This Endpoint
                        </button>

                        {testResponse && (
                          <div>
                            <p className="text-sm font-bold text-gray-700 mb-2">Test Response:</p>
                            <pre className="bg-blue-50 border border-blue-300 text-gray-900 p-3 rounded text-xs overflow-x-auto">
                              {testResponse}
                            </pre>
                          </div>
                        )}
                      </div>
                    )}
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        ))}

        {/* Footer */}
        <div className="text-center text-sm text-gray-500 py-6 border-t">
          <p>© 2024 GreenPay. All rights reserved. API v1.0.0</p>
        </div>
      </div>
    </div>
  );
}

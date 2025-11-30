import { useState } from "react";
import { motion } from "framer-motion";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Download, Copy, Play, Check, Globe, Zap, Shield, BookOpen, Code2, Eye, EyeOff } from "lucide-react";
import jsPDF from "jspdf";
import "jspdf-autotable";
import { useToast } from "@/hooks/use-toast";

interface Endpoint {
  method: string;
  path: string;
  title: string;
  description: string;
  request?: string;
  response?: string;
  category: string;
}

const ENDPOINTS: Endpoint[] = [
  // Authentication
  { method: "POST", path: "/auth/signup", title: "Sign Up", description: "Create new user account", category: "Authentication", request: '{\n  "fullName": "John Doe",\n  "email": "john@example.com",\n  "phone": "+254712345678",\n  "country": "KE",\n  "password": "SecurePass123!"\n}', response: '{\n  "user": {\n    "id": "user-id",\n    "email": "john@example.com",\n    "fullName": "John Doe"\n  }\n}' },
  { method: "POST", path: "/auth/login", title: "Login", description: "User login with email and password", category: "Authentication", request: '{\n  "email": "john@example.com",\n  "password": "SecurePass123!"\n}', response: '{\n  "user": {...},\n  "requiresTwoFactor": false\n}' },
  { method: "POST", path: "/auth/verify-otp", title: "Verify OTP", description: "Verify OTP code for login", category: "Authentication", request: '{\n  "code": "123456"\n}', response: '{\n  "success": true,\n  "user": {...}\n}' },
  { method: "POST", path: "/auth/setup-2fa", title: "Setup 2FA", description: "Setup two-factor authentication", category: "Authentication", response: '{\n  "qrCode": "data:image/png;base64,...",\n  "secret": "JBSWY3DPEBLW64TMMQ====="\n}' },
  
  // Financial
  { method: "GET", path: "/exchange-rates/:base", title: "Get Exchange Rates", description: "Get exchange rates for a base currency", category: "Financial", response: '{\n  "base": "USD",\n  "rates": {"KES": 145.50, "EUR": 0.92}\n}' },
  { method: "POST", path: "/exchange/convert", title: "Convert Currency", description: "Convert between currencies", category: "Financial", request: '{\n  "amount": "100",\n  "fromCurrency": "USD",\n  "toCurrency": "KES"\n}', response: '{\n  "fromAmount": "100",\n  "toAmount": "14550.00",\n  "rate": 145.50\n}' },
  { method: "GET", path: "/transactions", title: "Get Transactions", description: "Retrieve user transactions", category: "Financial", response: '{\n  "transactions": [{\n    "id": "txn-id",\n    "type": "send",\n    "amount": "500",\n    "status": "completed"\n  }]\n}' },
  { method: "POST", path: "/deposit/initialize-payment", title: "Initialize Deposit", description: "Start a deposit transaction", category: "Financial", request: '{\n  "amount": "1000",\n  "currency": "KES",\n  "paymentMethod": "mpesa"\n}', response: '{\n  "paymentId": "pay-id",\n  "status": "pending"\n}' },
  { method: "POST", path: "/airtime/purchase", title: "Purchase Airtime", description: "Buy airtime for a phone", category: "Financial", request: '{\n  "phoneNumber": "+254712345678",\n  "amount": "50",\n  "provider": "safaricom"\n}', response: '{\n  "transaction": {...},\n  "status": "completed"\n}' },
  
  // User Profile
  { method: "GET", path: "/users/profile", title: "Get Profile", description: "Retrieve user profile information", category: "User Profile", response: '{\n  "id": "user-id",\n  "fullName": "John Doe",\n  "email": "john@example.com",\n  "balance": "10000.00"\n}' },
  { method: "PUT", path: "/users/profile", title: "Update Profile", description: "Update user profile data", category: "User Profile", request: '{\n  "fullName": "John Updated",\n  "phone": "+254712345679"\n}', response: '{\n  "user": {...},\n  "message": "Profile updated"\n}' },
  { method: "POST", path: "/kyc/submit", title: "Submit KYC", description: "Submit KYC documents for verification", category: "User Profile", request: '{\n  "documentType": "national_id",\n  "frontImage": "base64-image",\n  "dateOfBirth": "1990-01-15"\n}', response: '{\n  "kyc": {...},\n  "status": "pending"\n}' },
  { method: "GET", path: "/notifications", title: "Get Notifications", description: "Retrieve user notifications", category: "User Profile", response: '{\n  "notifications": [{\n    "id": "notif-id",\n    "title": "Payment Received",\n    "read": false\n  }]\n}' },
  
  // Support
  { method: "POST", path: "/support/tickets", title: "Create Ticket", description: "Create a support ticket", category: "Support", request: '{\n  "issueType": "payment_issue",\n  "description": "Transaction failed"\n}', response: '{\n  "ticket": {...},\n  "status": "open"\n}' },
  { method: "GET", path: "/support/tickets", title: "Get Tickets", description: "Retrieve all support tickets", category: "Support", response: '{\n  "tickets": [{\n    "id": "ticket-id",\n    "status": "open"\n  }]\n}' },
  
  // System
  { method: "GET", path: "/system/status", title: "System Status", description: "Check API and system health", category: "System", response: '{\n  "status": "operational",\n  "version": "1.0.0",\n  "components": {...}\n}' },
];

export default function ApiDocumentationPage() {
  const [, setLocation] = useLocation();
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [showResponse, setShowResponse] = useState<string | null>(null);
  const [apiKey, setApiKey] = useState("");
  const { toast } = useToast();

  const categories = Array.from(new Set(ENDPOINTS.map(e => e.category)));

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    toast({ description: "Copied to clipboard" });
    setTimeout(() => setCopiedId(null), 2000);
  };

  const generateCurlCommand = (endpoint: Endpoint): string => {
    const url = `https://greenpay.world/api${endpoint.path}`;
    let cmd = `curl -X ${endpoint.method} "${url}"`;
    cmd += '\n  -H "Authorization: Bearer YOUR_API_KEY"';
    cmd += '\n  -H "Content-Type: application/json"';
    if (endpoint.request) {
      cmd += `\n  -d '${endpoint.request}'`;
    }
    return cmd;
  };

  const testEndpoint = async (endpoint: Endpoint) => {
    if (!apiKey) {
      toast({ description: "Please enter your API key first", variant: "destructive" });
      return;
    }
    try {
      const url = `https://greenpay.world/api${endpoint.path}`;
      const response = await fetch(url, {
        method: endpoint.method,
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        body: endpoint.request ? JSON.parse(endpoint.request) : undefined
      });
      const data = await response.json();
      setShowResponse(JSON.stringify(data, null, 2));
      toast({ description: "Endpoint tested successfully" });
    } catch (error) {
      toast({ description: "Error testing endpoint", variant: "destructive" });
    }
  };

  const downloadAllPDFs = () => {
    try {
      const pdf = new jsPDF();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const pageWidth = pdf.internal.pageSize.getWidth();
      let yPosition = 20;

      // Title Page
      pdf.setFillColor(34, 197, 94);
      pdf.rect(0, 0, pageWidth, 60, 'F');
      pdf.setTextColor(255, 255, 255);
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(24);
      pdf.text('GreenPay API', 20, 30);
      pdf.setFontSize(14);
      pdf.text('Complete Developer Documentation', 20, 45);
      
      pdf.addPage();
      yPosition = 20;
      pdf.setTextColor(0, 0, 0);
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(16);
      pdf.text('Table of Contents', 20, yPosition);
      yPosition += 15;
      
      categories.forEach(cat => {
        pdf.setFont('helvetica', 'normal');
        pdf.setTextColor(34, 197, 94);
        pdf.text(`• ${cat}`, 25, yPosition);
        yPosition += 7;
      });

      // Endpoints by category
      categories.forEach(category => {
        pdf.addPage();
        yPosition = 20;
        
        pdf.setTextColor(255, 255, 255);
        pdf.setFillColor(34, 197, 94);
        pdf.rect(0, yPosition - 8, pageWidth, 12, 'F');
        pdf.setFont('helvetica', 'bold');
        pdf.text(category, 20, yPosition);
        yPosition += 20;

        ENDPOINTS.filter(e => e.category === category).forEach(endpoint => {
          if (yPosition > pageHeight - 40) {
            pdf.addPage();
            yPosition = 20;
          }

          pdf.setTextColor(0, 0, 0);
          pdf.setFont('helvetica', 'bold');
          pdf.setFontSize(11);
          pdf.text(`${endpoint.method} ${endpoint.path}`, 20, yPosition);
          yPosition += 7;

          pdf.setFont('helvetica', 'normal');
          pdf.setFontSize(10);
          pdf.setTextColor(100, 100, 100);
          pdf.text(endpoint.title, 20, yPosition);
          yPosition += 5;
          
          const desc = pdf.splitTextToSize(endpoint.description, 170);
          pdf.text(desc, 20, yPosition);
          yPosition += desc.length * 4 + 5;

          if (endpoint.request) {
            pdf.setFont('helvetica', 'bold');
            pdf.setTextColor(34, 197, 94);
            pdf.text('Request:', 20, yPosition);
            yPosition += 5;
            
            pdf.setFont('courier', 'normal');
            pdf.setFontSize(9);
            pdf.setTextColor(50, 50, 50);
            const reqLines = endpoint.request.split('\n');
            reqLines.forEach(line => {
              if (yPosition > pageHeight - 20) {
                pdf.addPage();
                yPosition = 20;
              }
              pdf.text(line, 25, yPosition);
              yPosition += 4;
            });
            yPosition += 3;
          }

          if (endpoint.response) {
            pdf.setFont('helvetica', 'bold');
            pdf.setTextColor(34, 197, 94);
            pdf.text('Response:', 20, yPosition);
            yPosition += 5;
            
            pdf.setFont('courier', 'normal');
            pdf.setFontSize(9);
            pdf.setTextColor(50, 50, 50);
            const respLines = endpoint.response.split('\n');
            respLines.forEach(line => {
              if (yPosition > pageHeight - 20) {
                pdf.addPage();
                yPosition = 20;
              }
              pdf.text(line, 25, yPosition);
              yPosition += 4;
            });
          }
          
          yPosition += 10;
        });
      });

      // Add footer to all pages
      const pageCount = pdf.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        pdf.setPage(i);
        pdf.setFontSize(9);
        pdf.setTextColor(150, 150, 150);
        pdf.text(`Page ${i} of ${pageCount}`, pageWidth - 30, pageHeight - 10);
        pdf.text('GreenPay © 2024', 20, pageHeight - 10);
      }

      pdf.save('GreenPay-API-Complete-Documentation.pdf');
      toast({ description: "PDF downloaded successfully" });
    } catch (error) {
      console.error('PDF generation error:', error);
      toast({ description: "Error generating PDF", variant: "destructive" });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-green-50 pb-20">
      {/* Green Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-green-600 to-green-700 shadow-lg p-6 sticky top-0 z-50"
      >
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => setLocation("/api-service")}
              className="text-white hover:bg-green-700 p-2 rounded-lg transition-colors"
            >
              ← Back
            </motion.button>
            <div>
              <h1 className="text-2xl font-bold text-white">GreenPay API</h1>
              <p className="text-green-100 text-sm">Complete Developer Documentation & Reference</p>
            </div>
          </div>
          <Button
            onClick={downloadAllPDFs}
            className="bg-white text-green-600 hover:bg-green-50"
          >
            <Download className="w-4 h-4 mr-2" />
            Download Full PDF
          </Button>
        </div>
      </motion.div>

      <div className="max-w-7xl mx-auto p-6 space-y-8">
        {/* API Key Input */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-xl shadow-md p-6 border-l-4 border-green-600"
        >
          <h3 className="text-lg font-bold text-gray-900 mb-3">Test Endpoints</h3>
          <div className="flex gap-2">
            <input
              type="password"
              placeholder="Enter your API key (gpay_...)"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-green-600"
            />
            <Button
              variant="outline"
              size="sm"
              onClick={() => setApiKey("")}
            >
              Clear
            </Button>
          </div>
          <p className="text-xs text-gray-500 mt-2">Your API key is never stored or sent to servers - all tests run locally</p>
        </motion.div>

        {/* Endpoints by Category */}
        {categories.map((category, catIdx) => (
          <motion.div
            key={category}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 * catIdx }}
            className="space-y-4"
          >
            <div className="flex items-center gap-3">
              <div className="h-1 w-8 bg-green-600 rounded"></div>
              <h2 className="text-2xl font-bold text-gray-900">{category}</h2>
              <span className="text-sm font-semibold bg-green-100 text-green-700 px-3 py-1 rounded-full">
                {ENDPOINTS.filter(e => e.category === category).length} endpoints
              </span>
            </div>

            <div className="grid grid-cols-1 gap-4">
              {ENDPOINTS.filter(e => e.category === category).map((endpoint, idx) => {
                const endpointId = `${endpoint.method}-${endpoint.path}`;
                const curlCmd = generateCurlCommand(endpoint);
                return (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.05 * idx }}
                    className="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden hover:shadow-lg transition-all"
                  >
                    {/* Header */}
                    <div className="bg-gradient-to-r from-gray-50 to-gray-100 p-4 border-b">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <span className={`text-xs font-bold px-2 py-1 rounded text-white ${
                              endpoint.method === 'GET' ? 'bg-blue-600' :
                              endpoint.method === 'POST' ? 'bg-green-600' :
                              endpoint.method === 'PUT' ? 'bg-orange-600' : 'bg-red-600'
                            }`}>
                              {endpoint.method}
                            </span>
                            <code className="font-mono text-sm font-semibold text-gray-900">{endpoint.path}</code>
                          </div>
                          <h4 className="text-lg font-bold text-gray-900">{endpoint.title}</h4>
                          <p className="text-sm text-gray-600">{endpoint.description}</p>
                        </div>
                        <Code2 className="w-6 h-6 text-green-600 opacity-20 flex-shrink-0" />
                      </div>
                    </div>

                    {/* Content */}
                    <div className="p-4 space-y-4">
                      {/* cURL Example */}
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <label className="text-sm font-semibold text-gray-700">cURL Example</label>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => copyToClipboard(curlCmd, `curl-${endpointId}`)}
                            className="h-6"
                          >
                            {copiedId === `curl-${endpointId}` ? (
                              <>
                                <Check className="w-3 h-3 mr-1" /> Copied
                              </>
                            ) : (
                              <>
                                <Copy className="w-3 h-3 mr-1" /> Copy
                              </>
                            )}
                          </Button>
                        </div>
                        <pre className="bg-gray-900 text-gray-100 p-3 rounded text-xs overflow-x-auto">
                          {curlCmd}
                        </pre>
                      </div>

                      {/* Request Body */}
                      {endpoint.request && (
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <label className="text-sm font-semibold text-gray-700">Request</label>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => copyToClipboard(endpoint.request!, `req-${endpointId}`)}
                              className="h-6"
                            >
                              {copiedId === `req-${endpointId}` ? (
                                <>
                                  <Check className="w-3 h-3 mr-1" /> Copied
                                </>
                              ) : (
                                <>
                                  <Copy className="w-3 h-3 mr-1" /> Copy
                                </>
                              )}
                            </Button>
                          </div>
                          <pre className="bg-gray-50 border border-gray-300 text-gray-900 p-3 rounded text-xs overflow-x-auto">
                            {endpoint.request}
                          </pre>
                        </div>
                      )}

                      {/* Test Button */}
                      <Button
                        onClick={() => testEndpoint(endpoint)}
                        className="w-full bg-green-600 hover:bg-green-700 text-white"
                        size="sm"
                      >
                        <Play className="w-4 h-4 mr-2" />
                        Test Endpoint
                      </Button>

                      {/* Response */}
                      {endpoint.response && (
                        <div>
                          <button
                            onClick={() => setShowResponse(showResponse === endpointId ? null : endpointId)}
                            className="text-sm font-semibold text-gray-700 flex items-center gap-2 hover:text-green-600"
                          >
                            {showResponse === endpointId ? (
                              <>
                                <EyeOff className="w-4 h-4" /> Hide Response
                              </>
                            ) : (
                              <>
                                <Eye className="w-4 h-4" /> Show Response Example
                              </>
                            )}
                          </button>
                          {showResponse === endpointId && (
                            <pre className="bg-green-50 border border-green-300 text-gray-900 p-3 rounded text-xs overflow-x-auto mt-2">
                              {endpoint.response}
                            </pre>
                          )}
                        </div>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        ))}

        {/* Quick Reference */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-gradient-to-r from-green-600 to-green-700 rounded-xl shadow-lg p-8 text-white"
        >
          <h3 className="text-2xl font-bold mb-6">Quick Reference</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <h4 className="font-bold mb-3 flex items-center gap-2">
                <Zap className="w-5 h-5" /> Base URL
              </h4>
              <code className="bg-white/10 p-3 rounded text-sm">https://greenpay.world/api</code>
            </div>
            <div>
              <h4 className="font-bold mb-3 flex items-center gap-2">
                <Shield className="w-5 h-5" /> Authentication
              </h4>
              <code className="bg-white/10 p-3 rounded text-sm">Bearer YOUR_API_KEY</code>
            </div>
            <div>
              <h4 className="font-bold mb-3 flex items-center gap-2">
                <Globe className="w-5 h-5" /> Rate Limit
              </h4>
              <p className="text-sm text-green-100">100-10,000 req/min by tier</p>
            </div>
          </div>
        </motion.div>

        {/* Support */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="bg-white rounded-xl shadow-md p-8 text-center border-t-4 border-green-600"
        >
          <h3 className="text-2xl font-bold text-gray-900 mb-3">Need Help?</h3>
          <p className="text-gray-600 mb-6">Our API team is ready to help you build amazing integrations</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button
              onClick={() => setLocation("/support")}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              Support Tickets
            </Button>
            <Button
              variant="outline"
              onClick={() => window.open("mailto:api-support@greenpay.world", "_blank")}
              className="border-green-600 text-green-600 hover:bg-green-50"
            >
              Email Support
            </Button>
          </div>
        </motion.div>

        {/* Footer */}
        <div className="text-center text-sm text-gray-500 py-6 border-t">
          <p>© 2024 GreenPay. All rights reserved. API v1.0.0</p>
        </div>
      </div>
    </div>
  );
}

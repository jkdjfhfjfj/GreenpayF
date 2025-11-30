import { motion } from "framer-motion";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Download, FileText, Globe, Zap, Shield, BookOpen } from "lucide-react";
import jsPDF from "jspdf";
import "jspdf-autotable";

export default function ApiDocumentationPage() {
  const [, setLocation] = useLocation();

  const downloadPDF = (docType: string) => {
    try {
      const pdf = new jsPDF();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const pageWidth = pdf.internal.pageSize.getWidth();
      let yPosition = 20;

      // Add GreenPay branding
      pdf.setFillColor(34, 197, 94); // Green
      pdf.rect(0, 0, pageWidth, 30, 'F');
      
      pdf.setTextColor(255, 255, 255);
      pdf.setFont('helvetica', 'bold');
      pdf.text('GreenPay API Documentation', 20, 18);
      
      // Reset colors
      pdf.setTextColor(0, 0, 0);
      pdf.setFont('helvetica', 'normal');
      
      yPosition = 45;

      if (docType === 'api-reference') {
        pdf.setFontSize(16);
        pdf.setFont('helvetica', 'bold');
        pdf.text('API Reference', 20, yPosition);
        
        yPosition += 15;
        pdf.setFontSize(11);
        pdf.setFont('helvetica', 'normal');
        
        const content = [
          { title: '1. Authentication', desc: 'All API requests require Bearer token authentication in the Authorization header.' },
          { title: '2. Financial Operations', desc: 'Transfer funds, check balances, and manage transactions securely.' },
          { title: '3. User Profile', desc: 'Retrieve and update user information, KYC status, and preferences.' },
          { title: '4. Virtual Cards', desc: 'Create, manage, and monitor virtual payment cards.' },
          { title: '5. Support Tickets', desc: 'Create and track customer support tickets programmatically.' },
          { title: '6. System Status', desc: 'Check API health and system status in real-time.' },
        ];

        content.forEach((section, idx) => {
          if (yPosition > pageHeight - 30) {
            pdf.addPage();
            yPosition = 20;
          }
          
          pdf.setFont('helvetica', 'bold');
          pdf.setTextColor(34, 197, 94);
          pdf.text(section.title, 20, yPosition);
          yPosition += 7;
          
          pdf.setFont('helvetica', 'normal');
          pdf.setTextColor(0, 0, 0);
          const wrapped = pdf.splitTextToSize(section.desc, 170);
          pdf.text(wrapped, 20, yPosition);
          yPosition += wrapped.length * 5 + 8;
        });
      } else if (docType === 'key-management') {
        pdf.setFontSize(16);
        pdf.setFont('helvetica', 'bold');
        pdf.text('API Key Management Guide', 20, yPosition);
        
        yPosition += 15;
        pdf.setFontSize(11);
        pdf.setFont('helvetica', 'normal');
        
        const sections = [
          { title: 'Generate API Keys', desc: 'Create new API keys with specific scopes and rate limits for your applications.' },
          { title: 'Key Scopes & Permissions', desc: 'Control access levels: read_only, write, admin. Each key can have multiple scopes.' },
          { title: 'Rate Limiting', desc: 'Standard limit: 1000 requests/hour. Premium: 10000 requests/hour.' },
          { title: 'Key Rotation', desc: 'Rotate keys every 90 days for security. Old keys can be revoked immediately.' },
          { title: 'Webhook Verification', desc: 'Validate webhook signatures using HMAC-SHA256 for security.' },
          { title: 'Troubleshooting', desc: 'Common issues: expired keys, insufficient scopes, rate limit exceeded.' },
        ];

        sections.forEach((section) => {
          if (yPosition > pageHeight - 30) {
            pdf.addPage();
            yPosition = 20;
          }
          
          pdf.setFont('helvetica', 'bold');
          pdf.setTextColor(34, 197, 94);
          pdf.text(section.title, 20, yPosition);
          yPosition += 7;
          
          pdf.setFont('helvetica', 'normal');
          pdf.setTextColor(0, 0, 0);
          const wrapped = pdf.splitTextToSize(section.desc, 170);
          pdf.text(wrapped, 20, yPosition);
          yPosition += wrapped.length * 5 + 8;
        });
      }

      // Add footer on all pages
      const pageCount = pdf.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        pdf.setPage(i);
        pdf.setFontSize(9);
        pdf.setTextColor(150, 150, 150);
        pdf.text(`Page ${i} of ${pageCount}`, pageWidth - 30, pageHeight - 10);
        pdf.text('GreenPay © 2024', 20, pageHeight - 10);
      }

      pdf.save(`GreenPay-${docType}.pdf`);
    } catch (error) {
      console.error('PDF generation error:', error);
    }
  };

  const docs = [
    {
      title: "API Reference",
      description: "Complete API documentation with all 30+ endpoints, request/response examples, and code samples",
      icon: FileText,
      docType: "api-reference",
      features: ["Authentication", "Financial Ops", "User Profile", "Virtual Cards", "Support", "System Status"]
    },
    {
      title: "API Key Management",
      description: "Security best practices, key rotation, rate limiting, and webhook verification",
      icon: Shield,
      docType: "key-management",
      features: ["Generate Keys", "Scopes", "Rate Limits", "Rotation", "Webhooks", "Troubleshooting"]
    }
  ];

  const languages = [
    { name: "English", flag: "🇬🇧" },
    { name: "Español", flag: "🇪🇸" },
    { name: "Français", flag: "🇫🇷" },
    { name: "Kiswahili", flag: "🇰🇪" },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-green-50 pb-20">
      {/* Green Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-green-600 to-green-700 shadow-lg p-6 sticky top-0 z-50"
      >
        <div className="max-w-6xl mx-auto flex items-center justify-between">
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
              <p className="text-green-100 text-sm">Complete Developer Documentation</p>
            </div>
          </div>
          <Globe className="w-10 h-10 text-green-200 opacity-50" />
        </div>
      </motion.div>

      <div className="max-w-6xl mx-auto p-6 space-y-8">
        {/* Hero Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-xl shadow-md border-l-4 border-green-600 p-8"
        >
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-3">Build with GreenPay</h2>
              <p className="text-gray-600 text-lg mb-4">
                Integrate powerful payment and financial services into your application with our comprehensive REST API
              </p>
              <div className="flex items-center gap-2 text-sm text-green-600 font-semibold">
                <Zap className="w-4 h-4" />
                Fast • Secure • Reliable
              </div>
            </div>
            <BookOpen className="w-24 h-24 text-green-100" />
          </div>
        </motion.div>

        {/* Language Selector */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-xl shadow-md p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold text-gray-900">Available Languages</h3>
            <Globe className="w-5 h-5 text-green-600" />
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {languages.map((lang) => (
              <div
                key={lang.name}
                className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-4 border border-green-200 text-center hover:shadow-md transition-shadow cursor-pointer"
              >
                <span className="text-3xl mb-2 block">{lang.flag}</span>
                <span className="text-sm font-semibold text-gray-800">{lang.name}</span>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Documentation Cards */}
        <div className="space-y-4">
          <h3 className="text-2xl font-bold text-gray-900 mb-6">Documentation</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {docs.map((doc, idx) => {
              const IconComponent = doc.icon;
              return (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.15 * (idx + 1) }}
                  className="bg-white rounded-xl shadow-md hover:shadow-xl transition-all border border-green-100 overflow-hidden"
                >
                  <div className="bg-gradient-to-r from-green-50 to-green-100 p-6 border-b border-green-200">
                    <div className="flex items-center justify-between mb-3">
                      <IconComponent className="w-10 h-10 text-green-600" />
                      <span className="text-xs font-bold text-green-700 bg-green-200 px-3 py-1 rounded-full">
                        {doc.features.length} Topics
                      </span>
                    </div>
                    <h4 className="text-xl font-bold text-gray-900">{doc.title}</h4>
                  </div>

                  <div className="p-6 space-y-4">
                    <p className="text-gray-600 text-sm leading-relaxed">{doc.description}</p>

                    <div className="flex flex-wrap gap-2">
                      {doc.features.map((feature, i) => (
                        <span
                          key={i}
                          className="text-xs bg-green-100 text-green-700 px-3 py-1 rounded-full font-semibold"
                        >
                          {feature}
                        </span>
                      ))}
                    </div>

                    <button
                      onClick={() => downloadPDF(doc.docType)}
                      className="w-full mt-4 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white font-bold py-3 px-4 rounded-lg flex items-center justify-center gap-2 transition-all shadow-md hover:shadow-lg"
                    >
                      <Download className="w-4 h-4" />
                      Download PDF
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* Quick Start Guide */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-gradient-to-r from-green-600 to-green-700 rounded-xl shadow-lg p-8 text-white"
        >
          <h3 className="text-2xl font-bold mb-6">Quick Start Guide</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[
              { num: "1", title: "Generate Key", desc: "Create API key in dashboard" },
              { num: "2", title: "Add Token", desc: "Include Bearer in header" },
              { num: "3", title: "Make Request", desc: "Call any endpoint" },
              { num: "4", title: "Handle Response", desc: "Process the result" },
            ].map((step, i) => (
              <div key={i} className="bg-white/10 rounded-lg p-4 backdrop-blur-sm border border-white/20">
                <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center font-bold text-lg mb-3">
                  {step.num}
                </div>
                <h4 className="font-bold mb-1">{step.title}</h4>
                <p className="text-sm text-green-100">{step.desc}</p>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Support Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-white rounded-xl shadow-md p-8 text-center border-t-4 border-green-600"
        >
          <h3 className="text-2xl font-bold text-gray-900 mb-3">Need Help?</h3>
          <p className="text-gray-600 mb-6 max-w-2xl mx-auto">
            Our dedicated API support team is ready to help you integrate and optimize your implementation
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button
              onClick={() => setLocation("/support")}
              className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg font-bold transition-all"
            >
              Support Tickets
            </Button>
            <Button
              variant="outline"
              onClick={() => window.open("mailto:api-support@greenpay.world", "_blank")}
              className="border-green-600 text-green-600 hover:bg-green-50 px-6 py-2 rounded-lg font-bold transition-all"
            >
              Email Support
            </Button>
          </div>
        </motion.div>

        {/* Footer Info */}
        <div className="text-center text-sm text-gray-500 py-6 border-t">
          <p>© 2024 GreenPay. All documentation is provided under our Developer License Agreement.</p>
        </div>
      </div>
    </div>
  );
}

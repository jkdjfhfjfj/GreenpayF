import { motion } from "framer-motion";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Download, ExternalLink } from "lucide-react";

export default function ApiDocumentationPage() {
  const [, setLocation] = useLocation();

  const docs = [
    {
      title: "API Reference",
      description: "Complete API documentation with all 30+ endpoints, request/response examples, and code samples",
      link: "#api-reference",
      features: ["Authentication", "Financial Operations", "User Profile", "Support Tickets", "System Status"]
    },
    {
      title: "API Key Management",
      description: "Security best practices, key rotation, rate limiting, and webhook verification",
      link: "#key-management",
      features: ["Generate Keys", "Scopes & Permissions", "Rate Limits", "Troubleshooting"]
    }
  ];

  const languages = [
    { name: "English", flag: "🇬🇧", url: "/docs/api" },
    { name: "Español", flag: "🇪🇸", url: "/docs/api-es" },
    { name: "Français", flag: "🇫🇷", url: "/docs/api-fr" },
    { name: "Kiswahili", flag: "🇰🇪", url: "/docs/api-sw" },
  ];

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-card shadow-sm p-4 flex items-center justify-between elevation-1 sticky top-0 z-50"
      >
        <div className="flex items-center">
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => setLocation("/api-service")}
            className="material-icons text-muted-foreground mr-3 p-2 rounded-full hover:bg-muted transition-colors"
          >
            arrow_back
          </motion.button>
          <h1 className="text-lg font-semibold">API Documentation</h1>
        </div>
      </motion.div>

      <div className="p-6 space-y-6">
        {/* Language Selector */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-card rounded-lg border border-border p-4"
        >
          <h2 className="font-semibold mb-3">Available Languages</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {languages.map((lang) => (
              <Button
                key={lang.name}
                variant="outline"
                className="w-full justify-start"
                onClick={() => window.open(lang.url, "_blank")}
              >
                <span className="text-xl mr-2">{lang.flag}</span>
                <span className="text-sm">{lang.name}</span>
              </Button>
            ))}
          </div>
        </motion.div>

        {/* Documentation Sections */}
        <div className="space-y-4">
          <h2 className="font-semibold text-lg">Documentation Sections</h2>
          {docs.map((doc, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 * (idx + 1) }}
              className="bg-card rounded-lg border border-border p-6 hover:shadow-lg transition-shadow"
            >
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold mb-2">{doc.title}</h3>
                  <p className="text-muted-foreground text-sm mb-4">{doc.description}</p>
                </div>
                <ExternalLink className="w-5 h-5 text-muted-foreground flex-shrink-0" />
              </div>

              <div className="flex flex-wrap gap-2 mb-4">
                {doc.features.map((feature, i) => (
                  <span
                    key={i}
                    className="text-xs bg-primary/10 text-primary px-2 py-1 rounded"
                  >
                    {feature}
                  </span>
                ))}
              </div>

              <div className="flex gap-2">
                <Button
                  size="sm"
                  onClick={() => window.open(doc.link, "_blank")}
                >
                  View Online
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                >
                  <Download className="w-4 h-4 mr-2" />
                  PDF
                </Button>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Quick Links */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-gradient-to-br from-primary/10 to-secondary/10 rounded-lg border border-primary/20 p-6"
        >
          <h3 className="font-semibold mb-4">Quick Start</h3>
          <div className="space-y-3">
            <div className="flex items-center gap-3 text-sm">
              <span className="w-6 h-6 rounded-full bg-primary text-white flex items-center justify-center text-xs">1</span>
              <span>Generate an API key from the API Services dashboard</span>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <span className="w-6 h-6 rounded-full bg-primary text-white flex items-center justify-center text-xs">2</span>
              <span>Include Authorization header: Bearer your_api_key</span>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <span className="w-6 h-6 rounded-full bg-primary text-white flex items-center justify-center text-xs">3</span>
              <span>Make requests to any of the 30+ public endpoints</span>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <span className="w-6 h-6 rounded-full bg-primary text-white flex items-center justify-center text-xs">4</span>
              <span>Handle rate limits using X-RateLimit-* headers</span>
            </div>
          </div>
        </motion.div>

        {/* Support */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-card rounded-lg border border-border p-6 text-center"
        >
          <h3 className="font-semibold mb-2">Need Help?</h3>
          <p className="text-muted-foreground text-sm mb-4">
            Check the FAQ section or contact our API support team
          </p>
          <div className="flex gap-2 justify-center">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setLocation("/support")}
            >
              Support Tickets
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.open("mailto:api-support@greenpay.world", "_blank")}
            >
              Email Support
            </Button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

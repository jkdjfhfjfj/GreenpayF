import { motion } from "framer-motion";
import { useLocation } from "wouter";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { Zap, Clock, CheckCircle } from "lucide-react";

export default function APIServicePage() {
  const [, setLocation] = useLocation();
  const [showModal, setShowModal] = useState(true);

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-br from-blue-500 to-indigo-600 p-6 text-white"
      >
        <button
          onClick={() => setLocation("/dashboard")}
          className="material-icons mb-4 p-2 hover:bg-white/10 rounded-full transition-colors"
        >
          arrow_back
        </button>
        <h1 className="text-2xl font-bold">API Services</h1>
        <p className="text-white/80 text-sm mt-1">Integrate GreenPay with your applications</p>
      </motion.div>

      {/* Coming Soon Modal */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-blue-600" />
              Coming Soon
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-6">
            <div className="text-center space-y-2">
              <Zap className="w-12 h-12 text-blue-600 mx-auto" />
              <p className="font-semibold">API Integration Coming Soon</p>
              <p className="text-sm text-muted-foreground">
                We're building powerful APIs to let you integrate GreenPay's payment services with your applications.
              </p>
            </div>

            <div className="bg-blue-50 dark:bg-blue-950/20 rounded-lg p-4 space-y-2">
              <p className="font-semibold text-sm flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-600" />
                RESTful API
              </p>
              <p className="font-semibold text-sm flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-600" />
                Webhook Support
              </p>
              <p className="font-semibold text-sm flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-600" />
                Developer Dashboard
              </p>
            </div>

            <Button
              onClick={() => setShowModal(false)}
              className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700"
            >
              Got it, notify me
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Main Content */}
      <div className="p-6 space-y-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-card rounded-2xl border border-border p-6 text-center"
        >
          <Clock className="w-16 h-16 text-blue-600 mx-auto mb-4" />
          <h2 className="text-xl font-bold mb-2">API Services Launch</h2>
          <p className="text-muted-foreground mb-6">
            We're working on comprehensive API documentation and endpoints to power your integrations.
          </p>
          <Button
            onClick={() => setLocation("/dashboard")}
            variant="outline"
          >
            Back to Dashboard
          </Button>
        </motion.div>
      </div>
    </div>
  );
}

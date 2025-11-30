import { motion } from "framer-motion";
import { useLocation } from "wouter";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { Zap, Clock, CheckCircle, Zap as ZapIcon } from "lucide-react";

export default function APIServicePage() {
  const [, setLocation] = useLocation();
  const [showModal, setShowModal] = useState(true);

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-card shadow-sm p-4 flex items-center elevation-1"
      >
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={() => setLocation("/dashboard")}
          className="material-icons text-muted-foreground mr-3 p-2 rounded-full hover:bg-muted transition-colors"
        >
          arrow_back
        </motion.button>
        <h1 className="text-lg font-semibold">API Services</h1>
      </motion.div>

      {/* Coming Soon Modal */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-primary" />
              Coming Soon
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-6">
            <div className="text-center space-y-2">
              <ZapIcon className="w-12 h-12 text-primary mx-auto" />
              <p className="font-semibold">API Integration Coming Soon</p>
              <p className="text-sm text-muted-foreground">
                We're building powerful APIs to let you integrate GreenPay's payment services with your applications.
              </p>
            </div>

            <div className="bg-gradient-to-br from-primary/10 to-secondary/10 rounded-lg p-4 space-y-2">
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
              className="w-full bg-gradient-to-r from-primary via-primary to-secondary hover:opacity-90"
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
          <Clock className="w-16 h-16 text-primary mx-auto mb-4" />
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

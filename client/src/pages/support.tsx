import { motion } from "framer-motion";
import { useLocation } from "wouter";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { mockFAQs } from "@/lib/mock-data";
import LiveChat from "@/components/live-chat";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { X, Upload } from "lucide-react";
import { WavyHeader } from "@/components/wavy-header";

const issueReportSchema = z.object({
  issueType: z.string().min(1, "Please select an issue type"),
  description: z.string().min(10, "Please provide a detailed description"),
  file: z.any().optional(),
});

type IssueReportForm = z.infer<typeof issueReportSchema>;

export default function SupportPage() {
  const [, setLocation] = useLocation();
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);
  const [showLiveChat, setShowLiveChat] = useState(false);
  const { toast } = useToast();

  const form = useForm<IssueReportForm>({
    resolver: zodResolver(issueReportSchema),
    defaultValues: {
      issueType: "",
      description: "",
      file: undefined,
    },
  });

  const submitTicketMutation = useMutation({
    mutationFn: async (data: IssueReportForm) => {
      const formData = new FormData();
      formData.append('issueType', data.issueType);
      formData.append('description', data.description);
      if (data.file) {
        formData.append('file', data.file);
      }
      
      const response = await fetch('/api/support/tickets', {
        method: 'POST',
        credentials: 'include',
        body: formData,
      });
      if (!response.ok) throw new Error('Failed to submit');
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Report submitted successfully!",
        description: "Our support team will get back to you within 24 hours.",
      });
      form.reset();
    },
    onError: (error) => {
      toast({
        title: "Submission failed",
        description: "Please try again or contact support directly.",
        variant: "destructive",
      });
      console.error('Ticket submission error:', error);
    },
  });

  const onSubmit = (data: IssueReportForm) => {
    submitTicketMutation.mutate(data);
  };

  const handleStartLiveChat = () => {
    setLocation('/live-chat');
  };

  const handleCloseLiveChat = () => {
    setShowLiveChat(false);
  };

  const handleViewTickets = () => {
    setLocation('/support/tickets');
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Top Navigation */}
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
        <h1 className="text-lg font-semibold">Support</h1>
      </motion.div>

      <div className="p-6 space-y-6">
        {/* Quick Help */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-gradient-to-r from-primary to-secondary p-6 rounded-xl text-white elevation-2"
        >
          <h3 className="font-bold text-lg mb-2">Need Help?</h3>
          <p className="text-green-100 mb-4">Our support team is available 24/7 to assist you</p>
          <div className="flex gap-2">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleStartLiveChat}
              className="bg-white/20 backdrop-blur-sm px-4 py-2 rounded-lg font-medium hover:bg-white/30 transition-colors"
              data-testid="button-start-chat"
            >
              <span className="material-icons text-sm mr-1">chat</span>
              Start Live Chat
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleViewTickets}
              className="bg-white/20 backdrop-blur-sm px-4 py-2 rounded-lg font-medium hover:bg-white/30 transition-colors"
            >
              <span className="material-icons text-sm mr-1">confirmation_number</span>
              My Tickets
            </motion.button>
          </div>
        </motion.div>

        {/* FAQ Categories */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="grid grid-cols-2 gap-4"
        >
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="bg-card p-4 rounded-xl border border-border text-left hover:bg-muted transition-colors elevation-1"
            data-testid="category-sending"
          >
            <span className="material-icons text-primary text-2xl mb-2">send</span>
            <h3 className="font-semibold mb-1">Sending Money</h3>
            <p className="text-sm text-muted-foreground">Transfer guides</p>
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="bg-card p-4 rounded-xl border border-border text-left hover:bg-muted transition-colors elevation-1"
            data-testid="category-banking"
          >
            <span className="material-icons text-secondary text-2xl mb-2">account_balance</span>
            <h3 className="font-semibold mb-1">Banking</h3>
            <p className="text-sm text-muted-foreground">Account help</p>
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="bg-card p-4 rounded-xl border border-border text-left hover:bg-muted transition-colors elevation-1"
            data-testid="category-security"
          >
            <span className="material-icons text-accent text-2xl mb-2">security</span>
            <h3 className="font-semibold mb-1">Security</h3>
            <p className="text-sm text-muted-foreground">Safety tips</p>
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="bg-card p-4 rounded-xl border border-border text-left hover:bg-muted transition-colors elevation-1"
            data-testid="category-virtual-card"
          >
            <span className="material-icons text-muted-foreground text-2xl mb-2">credit_card</span>
            <h3 className="font-semibold mb-1">Virtual Card</h3>
            <p className="text-sm text-muted-foreground">Card management</p>
          </motion.button>
        </motion.div>

        {/* Common Questions */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-card rounded-xl border border-border elevation-1"
        >
          <div className="p-4 border-b border-border">
            <h3 className="font-semibold">Frequently Asked Questions</h3>
          </div>
          <div className="divide-y divide-border">
            {mockFAQs.map((faq, index) => (
              <div key={index} className="p-4">
                <motion.button
                  whileTap={{ scale: 0.99 }}
                  onClick={() => setExpandedFaq(expandedFaq === index ? null : index)}
                  className="w-full text-left hover:bg-muted/50 transition-colors rounded-lg p-2 -m-2"
                  data-testid={`faq-${index}`}
                >
                  <div className="flex items-center justify-between">
                    <p className="font-medium">{faq.question}</p>
                    <span className={`material-icons text-muted-foreground transition-transform ${
                      expandedFaq === index ? 'rotate-180' : ''
                    }`}>
                      keyboard_arrow_down
                    </span>
                  </div>
                </motion.button>
                
                <motion.div
                  initial={false}
                  animate={{ 
                    height: expandedFaq === index ? "auto" : 0,
                    opacity: expandedFaq === index ? 1 : 0
                  }}
                  transition={{ duration: 0.3 }}
                  className="overflow-hidden"
                >
                  <div className="pt-3 pb-1">
                    <p className="text-sm text-muted-foreground">{faq.answer}</p>
                  </div>
                </motion.div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Contact Options */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="space-y-3"
        >
          <h3 className="font-semibold text-sm text-muted-foreground">CONTACT US</h3>
          
          <motion.button
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
            onClick={handleStartLiveChat}
            className="w-full bg-card p-4 rounded-xl border border-border flex items-center justify-between hover:bg-muted transition-colors elevation-1"
            data-testid="contact-live-chat"
          >
            <div className="flex items-center">
              <span className="material-icons text-primary mr-3">chat</span>
              <div className="text-left">
                <p className="font-medium">Live Chat</p>
                <p className="text-sm text-muted-foreground">Get instant help from our team</p>
              </div>
            </div>
            <span className="text-xs text-green-500 bg-green-100 px-2 py-1 rounded-full">Online</span>
          </motion.button>

        </motion.div>

        {/* Live Chat Interface */}
        {showLiveChat && (
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -30 }}
            className="bg-card rounded-xl border border-border elevation-2"
          >
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="font-semibold">Live Support Chat</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleCloseLiveChat}
                className="h-8 w-8 p-0"
                data-testid="button-close-chat"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
            <div className="p-4">
              <LiveChat />
            </div>
          </motion.div>
        )}

        {/* Report Issue */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-card p-4 rounded-xl border border-border elevation-1"
        >
          <h3 className="font-semibold mb-4">Report an Issue</h3>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="issueType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Issue Type</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-issue-type">
                          <SelectValue placeholder="Select issue type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="transaction">Transaction Problem</SelectItem>
                        <SelectItem value="account">Account Access</SelectItem>
                        <SelectItem value="bug">App Bug</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea
                        {...field}
                        placeholder="Describe your issue in detail"
                        className="h-24"
                        data-testid="textarea-issue-description"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="file"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      <Upload className="w-4 h-4" />
                      Attach Media (Optional)
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="file"
                        accept="image/*,video/*,.pdf,.doc,.docx"
                        onChange={(e) => field.onChange(e.target.files?.[0])}
                        data-testid="input-file-upload"
                      />
                    </FormControl>
                    <p className="text-xs text-muted-foreground">Images, videos, PDFs, or documents</p>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button
                type="submit"
                className="w-full ripple"
                disabled={submitTicketMutation.isPending}
                data-testid="button-submit-report"
              >
                {submitTicketMutation.isPending ? "Submitting..." : "Submit Report"}
              </Button>
            </form>
          </Form>
        </motion.div>
      </div>
    </div>
  );
}

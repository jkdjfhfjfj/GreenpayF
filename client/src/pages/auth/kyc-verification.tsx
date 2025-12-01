import { motion } from "framer-motion";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest } from "@/lib/queryClient";
import { WavyHeader } from "@/components/wavy-header";

const kycSchema = z.object({
  dateOfBirth: z.string().min(1, "Date of birth is required"),
  address: z.string().min(10, "Please enter your full address"),
  documentType: z.string().min(1, "Please select a document type"),
});

type KycForm = z.infer<typeof kycSchema>;

export default function KycVerificationPage() {
  const [, setLocation] = useLocation();
  const [uploadedFiles, setUploadedFiles] = useState({
    frontImage: null as File | null,
    backImage: null as File | null,
    selfie: null as File | null,
  });
  const { toast } = useToast();
  const { user } = useAuth();

  // Fetch existing KYC status
  const { data: kycData, isLoading: kycLoading } = useQuery({
    queryKey: [`/api/kyc/${user?.id}`],
    queryFn: async () => {
      if (!user?.id) return null;
      const response = await apiRequest("GET", `/api/kyc/${user.id}`);
      return response.json();
    },
    enabled: !!user?.id,
  });

  const existingKyc = kycData?.kyc;

  const form = useForm<KycForm>({
    resolver: zodResolver(kycSchema),
    defaultValues: {
      dateOfBirth: "",
      address: "",
      documentType: "",
    },
  });

  const kycMutation = useMutation({
    mutationFn: async (data: KycForm) => {
      // Validate that all files are uploaded
      if (!uploadedFiles.frontImage || !uploadedFiles.backImage || !uploadedFiles.selfie) {
        throw new Error("Please upload all required documents");
      }

      const formData = new FormData();
      formData.append('userId', user?.id?.toString() || '');
      formData.append('documentType', data.documentType);
      formData.append('dateOfBirth', data.dateOfBirth);
      formData.append('address', data.address);
      formData.append('frontImage', uploadedFiles.frontImage);
      formData.append('backImage', uploadedFiles.backImage);
      formData.append('selfie', uploadedFiles.selfie);

      const response = await fetch("/api/kyc/submit", {
        method: "POST",
        credentials: "include",
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Submission failed");
      }

      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Documents submitted!",
        description: "Your documents have been submitted for verification.",
      });
      setLocation("/virtual-card-purchase");
    },
    onError: (error: Error) => {
      toast({
        title: "Submission failed",
        description: error.message || "Unable to submit documents. Please try again.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: KycForm) => {
    kycMutation.mutate(data);
  };

  const handleFileUpload = (type: keyof typeof uploadedFiles) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setUploadedFiles(prev => ({ ...prev, [type]: file }));
      toast({
        title: "File uploaded",
        description: `${file.name} has been uploaded successfully.`,
      });
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background pb-20">
      <WavyHeader
        title="Identity Verification"
        onBack={() => setLocation("/otp-verification")}
        size="md"
      />

      <div className="flex-1 p-6">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="max-w-sm mx-auto"
        >
          <div className="text-center mb-8">
            <motion.div
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2 }}
              className="w-16 h-16 bg-accent rounded-full flex items-center justify-center mx-auto mb-4"
            >
              <span className="material-icons text-accent-foreground text-2xl">verified_user</span>
            </motion.div>
            <h2 className="text-2xl font-bold mb-2">Verify Your Identity</h2>
            <p className="text-muted-foreground">Complete your profile to ensure secure transactions</p>
          </div>

          {/* KYC Status Display */}
          {kycLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          ) : existingKyc?.status === 'pending' ? (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-6 mb-6">
              <div className="flex items-start gap-3">
                <span className="material-icons text-amber-600 text-3xl">pending</span>
                <div>
                  <h3 className="font-semibold text-amber-900 mb-1">Documents Under Review</h3>
                  <p className="text-sm text-amber-700">
                    Your KYC documents have been submitted and are currently being reviewed by our team. 
                    You will be notified once the verification is complete. Please wait for admin approval.
                  </p>
                  <Button
                    onClick={() => setLocation("/dashboard")}
                    variant="outline"
                    className="mt-4"
                  >
                    Return to Dashboard
                  </Button>
                </div>
              </div>
            </div>
          ) : existingKyc?.status === 'verified' ? (
            <div className="bg-green-50 border border-green-200 rounded-xl p-6 mb-6">
              <div className="flex items-start gap-3">
                <span className="material-icons text-green-600 text-3xl">check_circle</span>
                <div>
                  <h3 className="font-semibold text-green-900 mb-1">Verification Complete</h3>
                  <p className="text-sm text-green-700">
                    Your identity has been successfully verified. You can now access all features of your account.
                  </p>
                  <Button
                    onClick={() => setLocation("/virtual-card-purchase")}
                    className="mt-4"
                  >
                    Continue to Virtual Card
                  </Button>
                </div>
              </div>
            </div>
          ) : existingKyc?.status === 'rejected' ? (
            <div className="bg-red-50 border border-red-200 rounded-xl p-6 mb-6">
              <div className="flex items-start gap-3">
                <span className="material-icons text-red-600 text-3xl">cancel</span>
                <div className="flex-1">
                  <h3 className="font-semibold text-red-900 mb-1">Verification Rejected</h3>
                  <p className="text-sm text-red-700 mb-2">
                    Your previous KYC submission was rejected. {existingKyc.verificationNotes && `Reason: ${existingKyc.verificationNotes}`}
                  </p>
                  <p className="text-sm text-red-700">
                    Please upload clear, valid documents and resubmit your verification below.
                  </p>
                </div>
              </div>
            </div>
          ) : null}

          {/* Only show form if not pending or verified */}
          {!existingKyc || existingKyc.status === 'rejected' ? (
          <div className="space-y-6">
            {/* Personal Details */}
            <div className="bg-card p-4 rounded-xl border border-border elevation-1">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold">Personal Details</h3>
                <span className="text-xs text-primary bg-primary/10 px-2 py-1 rounded-full">Required</span>
              </div>
              <Form {...form}>
                <div className="space-y-3">
                  <FormField
                    control={form.control}
                    name="dateOfBirth"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <Input
                            {...field}
                            type="date"
                            placeholder="Date of Birth"
                            data-testid="input-dob"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="address"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <Input
                            {...field}
                            placeholder="Full Address"
                            data-testid="input-address"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </Form>
            </div>

            {/* Document Upload */}
            <div className="bg-card p-4 rounded-xl border border-border elevation-1">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold">Identity Document</h3>
                <span className="text-xs text-primary bg-primary/10 px-2 py-1 rounded-full">Required</span>
              </div>
              <div className="space-y-3">
                <Form {...form}>
                  <FormField
                    control={form.control}
                    name="documentType"
                    render={({ field }) => (
                      <FormItem>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-document-type">
                              <SelectValue placeholder="Select document type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="national_id">National ID</SelectItem>
                            <SelectItem value="passport">Passport</SelectItem>
                            <SelectItem value="drivers_license">Driver's License</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </Form>

                <div className="border-2 border-dashed border-border rounded-xl p-6 text-center hover:border-primary transition-colors cursor-pointer">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload('frontImage')}
                    className="hidden"
                    id="front-upload"
                  />
                  <label htmlFor="front-upload" className="cursor-pointer" data-testid="upload-front">
                    <span className="material-icons text-3xl text-muted-foreground mb-2">cloud_upload</span>
                    <p className="text-sm text-muted-foreground">
                      {uploadedFiles.frontImage ? uploadedFiles.frontImage.name : "Tap to upload front side"}
                    </p>
                  </label>
                </div>

                <div className="border-2 border-dashed border-border rounded-xl p-6 text-center hover:border-primary transition-colors cursor-pointer">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload('backImage')}
                    className="hidden"
                    id="back-upload"
                  />
                  <label htmlFor="back-upload" className="cursor-pointer" data-testid="upload-back">
                    <span className="material-icons text-3xl text-muted-foreground mb-2">cloud_upload</span>
                    <p className="text-sm text-muted-foreground">
                      {uploadedFiles.backImage ? uploadedFiles.backImage.name : "Tap to upload back side"}
                    </p>
                  </label>
                </div>
              </div>
            </div>

            {/* Selfie Verification */}
            <div className="bg-card p-4 rounded-xl border border-border elevation-1">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold">Selfie Verification</h3>
                <span className="text-xs text-primary bg-primary/10 px-2 py-1 rounded-full">Required</span>
              </div>
              <div className="border-2 border-dashed border-border rounded-xl p-6 text-center hover:border-primary transition-colors cursor-pointer">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload('selfie')}
                  className="hidden"
                  id="selfie-upload"
                />
                <label htmlFor="selfie-upload" className="cursor-pointer" data-testid="upload-selfie">
                  <span className="material-icons text-3xl text-muted-foreground mb-2">camera_alt</span>
                  <p className="text-sm text-muted-foreground">
                    {uploadedFiles.selfie ? uploadedFiles.selfie.name : "Take a selfie"}
                  </p>
                </label>
              </div>
            </div>

            <Button
              onClick={form.handleSubmit(onSubmit)}
              className="w-full ripple"
              disabled={kycMutation.isPending}
              data-testid="button-continue-verification"
            >
              {kycMutation.isPending ? "Submitting..." : existingKyc?.status === 'rejected' ? "Resubmit Verification" : "Continue Verification"}
            </Button>
          </div>
          ) : null}
        </motion.div>
      </div>
    </div>
  );
}

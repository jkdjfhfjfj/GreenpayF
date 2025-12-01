import { motion } from "framer-motion";
import { useLocation } from "wouter";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { WavyHeader } from "@/components/wavy-header";

export default function KYCPage() {
  const [, setLocation] = useLocation();
  const { user, login } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    documentType: "national_id",
    dateOfBirth: "",
    address: "",
    frontImage: null as File | null,
    backImage: null as File | null,
    selfie: null as File | null,
  });

  // Get existing KYC data
  const { data: kycData, isLoading: kycLoading } = useQuery<{ kyc: any }>({
    queryKey: ["/api/kyc", user?.id],
    enabled: !!user?.id,
  });

  const submitKYCMutation = useMutation({
    mutationFn: async (data: FormData) => {
      const response = await fetch("/api/kyc/submit", {
        method: "POST",
        body: data,
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to submit KYC");
      }
      
      return response.json();
    },
    onSuccess: (data) => {
      if (user) {
        login({ ...user, kycStatus: "pending" });
      }
      queryClient.invalidateQueries({ queryKey: ["/api/kyc", user?.id] });
      toast({
        title: "KYC Submitted Successfully!",
        description: "Your documents have been submitted for review. You will be notified once verified.",
      });
      setLocation("/dashboard");
    },
    onError: (error: any) => {
      toast({
        title: "KYC Submission Failed",
        description: error.message || "Unable to submit KYC documents",
        variant: "destructive",
      });
    },
  });

  const handleFileUpload = (field: string, file: File | null) => {
    setFormData({ ...formData, [field]: file });
  };

  const handleSubmit = () => {
    // Validate personal information
    if (!formData.dateOfBirth || !formData.address) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    // Validate all required files are uploaded
    if (!formData.frontImage || !formData.backImage || !formData.selfie) {
      toast({
        title: "Missing Documents",
        description: "Please upload all required documents: front of document, back of document, and selfie",
        variant: "destructive",
      });
      return;
    }

    const submitData = new FormData();
    submitData.append("userId", user?.id || "");
    submitData.append("documentType", formData.documentType);
    submitData.append("dateOfBirth", formData.dateOfBirth);
    submitData.append("address", formData.address);
    submitData.append("frontImage", formData.frontImage);
    submitData.append("backImage", formData.backImage);
    submitData.append("selfie", formData.selfie);

    submitKYCMutation.mutate(submitData);
  };

  const nextStep = () => {
    // Validate step 2 - ensure documents are uploaded before moving to step 3
    if (currentStep === 2) {
      if (!formData.frontImage || !formData.backImage) {
        toast({
          title: "Missing Documents",
          description: "Please upload both front and back of your document before continuing",
          variant: "destructive",
        });
        return;
      }
    }
    
    if (currentStep < 3) setCurrentStep(currentStep + 1);
  };

  const prevStep = () => {
    if (currentStep > 1) setCurrentStep(currentStep - 1);
  };

  // Loading state
  if (kycLoading) {
    return (
      <div className="min-h-screen bg-background pb-20 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading KYC status...</p>
        </div>
      </div>
    );
  }

  // Handle verified status
  if (user?.kycStatus === "verified") {
    return (
      <div className="min-h-screen bg-background pb-20">
        <WavyHeader
          
          
          size="sm"
        />

        <div className="p-6 flex flex-col items-center justify-center min-h-[60vh]">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 200 }}
            className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mb-6"
          >
            <span className="material-icons text-4xl text-green-600">verified_user</span>
          </motion.div>
          <h2 className="text-2xl font-bold text-center mb-4">Identity Verified!</h2>
          <p className="text-muted-foreground text-center mb-8 max-w-sm">
            Your identity has been successfully verified. You now have full access to all GreenPay features.
          </p>
          <Button onClick={() => setLocation("/dashboard")} className="px-8">
            Continue to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  // Handle users who have submitted documents and are awaiting review (only show if actual submission exists)
  if (kycData?.kyc && user?.kycStatus === "pending") {
    return (
      <div className="min-h-screen bg-background pb-20">
        <WavyHeader
          
          
          size="sm"
        />

        <div className="p-6 flex flex-col items-center justify-center min-h-[60vh]">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 200 }}
            className="w-24 h-24 bg-blue-100 rounded-full flex items-center justify-center mb-6"
          >
            <span className="material-icons text-4xl text-blue-600">hourglass_empty</span>
          </motion.div>
          <h2 className="text-2xl font-bold text-center mb-4">Documents Under Review</h2>
          <p className="text-muted-foreground text-center mb-8 max-w-sm">
            Your KYC documents have been submitted and are currently under review. 
            You'll be notified once the verification is complete.
          </p>
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 p-4 rounded-lg mb-6 max-w-sm w-full">
            <h3 className="font-medium text-blue-800 dark:text-blue-100 mb-2 flex items-center">
              <span className="material-icons text-sm mr-2">info</span>
              What happens next?
            </h3>
            <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
              <li>• Our team will review your documents</li>
              <li>• Verification typically takes 1-2 business days</li>
              <li>• You'll receive an email notification</li>
              <li>• Cannot resubmit while review is pending</li>
            </ul>
          </div>
          <div className="flex gap-3 w-full max-w-sm">
            <Button onClick={() => setLocation("/settings")} variant="outline" className="flex-1">
              Back to Settings
            </Button>
            <Button onClick={() => setLocation("/dashboard")} className="flex-1">
              Dashboard
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Show rejection notice if rejected - but still allow form access below
  const showRejectionNotice = kycData?.kyc && user?.kycStatus === "rejected";

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
          onClick={() => setLocation("/settings")}
          className="material-icons text-muted-foreground mr-3 p-2 rounded-full hover:bg-muted transition-colors"
          data-testid="button-back"
        >
          arrow_back
        </motion.button>
        <h1 className="text-lg font-semibold">Identity Verification</h1>
      </motion.div>

      <div className="p-6">
        {/* Rejection Notice - Show if documents were rejected */}
        {showRejectionNotice && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-4 rounded-xl mb-6"
          >
            <div className="flex items-start">
              <span className="material-icons text-red-600 mr-3 mt-0.5">error_outline</span>
              <div className="flex-1">
                <h3 className="font-semibold text-red-900 dark:text-red-200 mb-1">
                  Previous Verification Unsuccessful
                </h3>
                <p className="text-sm text-red-700 dark:text-red-300 mb-2">
                  {kycData?.kyc?.rejectionReason || "Your previous documents did not meet verification requirements. Please ensure they are clear and valid."}
                </p>
                <p className="text-xs text-red-600 dark:text-red-400 font-medium">
                  Please resubmit new documents below
                </p>
              </div>
            </div>
          </motion.div>
        )}

        {/* Progress Bar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm text-muted-foreground">Step {currentStep} of 3</span>
            <span className="text-sm text-muted-foreground">{Math.round((currentStep / 3) * 100)}%</span>
          </div>
          <Progress value={(currentStep / 3) * 100} className="h-2" />
        </motion.div>

        {/* Step 1: Document Type & Personal Info */}
        {currentStep === 1 && (
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-6"
          >
            <div className="bg-card p-6 rounded-xl border border-border elevation-1">
              <h2 className="text-xl font-semibold mb-4">Personal Information</h2>
              
              <div className="space-y-4">
                <div>
                  <Label htmlFor="documentType">Document Type</Label>
                  <Select
                    value={formData.documentType}
                    onValueChange={(value) => setFormData({ ...formData, documentType: value })}
                  >
                    <SelectTrigger data-testid="select-document-type">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="national_id">National ID</SelectItem>
                      <SelectItem value="passport">Passport</SelectItem>
                      <SelectItem value="drivers_license">Driver's License</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="dateOfBirth">Date of Birth</Label>
                  <Input
                    id="dateOfBirth"
                    type="date"
                    value={formData.dateOfBirth}
                    onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
                    data-testid="input-date-of-birth"
                  />
                </div>

                <div>
                  <Label htmlFor="address">Home Address</Label>
                  <Textarea
                    id="address"
                    placeholder="Enter your full address"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    data-testid="textarea-address"
                  />
                </div>
              </div>
            </div>

            <Button onClick={nextStep} className="w-full" data-testid="button-next-step1">
              Continue
            </Button>
          </motion.div>
        )}

        {/* Step 2: Document Upload */}
        {currentStep === 2 && (
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-6"
          >
            <div className="bg-card p-6 rounded-xl border border-border elevation-1">
              <h2 className="text-xl font-semibold mb-4">Document Upload</h2>
              
              <div className="space-y-6">
                {/* Front Image */}
                <div>
                  <Label>Front of Document</Label>
                  <div className="mt-2 border-2 border-dashed border-muted rounded-lg p-6 text-center">
                    {formData.frontImage ? (
                      <div className="space-y-2">
                        <span className="material-icons text-4xl text-green-500">check_circle</span>
                        <p className="text-sm font-medium">{formData.frontImage.name}</p>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleFileUpload("frontImage", null)}
                        >
                          Remove
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <span className="material-icons text-4xl text-muted-foreground">cloud_upload</span>
                        <p className="text-sm text-muted-foreground">Upload front of your document</p>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => handleFileUpload("frontImage", e.target.files?.[0] || null)}
                          className="hidden"
                          id="front-upload"
                        />
                        <Button variant="outline" asChild>
                          <label htmlFor="front-upload" data-testid="button-upload-front">
                            Choose File
                          </label>
                        </Button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Back Image */}
                <div>
                  <Label>Back of Document</Label>
                  <div className="mt-2 border-2 border-dashed border-muted rounded-lg p-6 text-center">
                    {formData.backImage ? (
                      <div className="space-y-2">
                        <span className="material-icons text-4xl text-green-500">check_circle</span>
                        <p className="text-sm font-medium">{formData.backImage.name}</p>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleFileUpload("backImage", null)}
                        >
                          Remove
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <span className="material-icons text-4xl text-muted-foreground">cloud_upload</span>
                        <p className="text-sm text-muted-foreground">Upload back of your document</p>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => handleFileUpload("backImage", e.target.files?.[0] || null)}
                          className="hidden"
                          id="back-upload"
                        />
                        <Button variant="outline" asChild>
                          <label htmlFor="back-upload" data-testid="button-upload-back">
                            Choose File
                          </label>
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="flex space-x-4">
              <Button variant="outline" onClick={prevStep} className="flex-1">
                Back
              </Button>
              <Button onClick={nextStep} className="flex-1" data-testid="button-next-step2">
                Continue
              </Button>
            </div>
          </motion.div>
        )}

        {/* Step 3: Selfie & Review */}
        {currentStep === 3 && (
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-6"
          >
            <div className="bg-card p-6 rounded-xl border border-border elevation-1">
              <h2 className="text-xl font-semibold mb-4">Selfie Verification</h2>
              
              <div className="space-y-4">
                <div>
                  <Label>Take a Selfie</Label>
                  <div className="mt-2 border-2 border-dashed border-muted rounded-lg p-6 text-center">
                    {formData.selfie ? (
                      <div className="space-y-2">
                        <span className="material-icons text-4xl text-green-500">check_circle</span>
                        <p className="text-sm font-medium">{formData.selfie.name}</p>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleFileUpload("selfie", null)}
                        >
                          Retake
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <span className="material-icons text-4xl text-muted-foreground">face</span>
                        <p className="text-sm text-muted-foreground">Take a clear photo of yourself</p>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => handleFileUpload("selfie", e.target.files?.[0] || null)}
                          className="hidden"
                          id="selfie-upload"
                        />
                        <Button variant="outline" asChild>
                          <label htmlFor="selfie-upload" data-testid="button-upload-selfie">
                            Take Selfie
                          </label>
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
              <div className="flex items-start">
                <span className="material-icons text-blue-600 mr-2 mt-1">security</span>
                <div>
                  <h3 className="font-medium text-blue-800">Verification Process</h3>
                  <p className="text-sm text-blue-700 mt-1">
                    Your documents will be securely reviewed by our verification team. You'll receive a notification once the review is complete.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex space-x-4">
              <Button variant="outline" onClick={prevStep} className="flex-1">
                Back
              </Button>
              <Button
                onClick={handleSubmit}
                className="flex-1"
                disabled={submitKYCMutation.isPending}
                data-testid="button-submit-kyc"
              >
                {submitKYCMutation.isPending ? "Verifying..." : "Submit for Verification"}
              </Button>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
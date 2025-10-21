import { motion } from "framer-motion";
import { useLocation } from "wouter";
import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { ObjectUploader } from "@/components/ObjectUploader";
import { HelpCircle, ChevronRight, LogOut } from "lucide-react";

export default function SettingsPage() {
  const [, setLocation] = useLocation();
  const { user, logout, login } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Profile editing states
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [profileData, setProfileData] = useState({
    fullName: user?.fullName || "",
    email: user?.email || "",
    phone: user?.phone || "",
    country: user?.country || "",
  });

  // Password change states
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  // Settings states
  const [settings, setSettings] = useState({
    defaultCurrency: user?.defaultCurrency || "KES",
    pushNotificationsEnabled: user?.pushNotificationsEnabled !== false,
    twoFactorEnabled: user?.twoFactorEnabled || false,
    biometricEnabled: user?.biometricEnabled || false,
  });

  // Profile editing states
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [is2FASetup, setIs2FASetup] = useState(false);
  const [qrCodeUrl, setQrCodeUrl] = useState<string | null>(null);
  const [fingerprintSetup, setFingerprintSetup] = useState(false);
  
  // Photo upload states
  const [selectedPhoto, setSelectedPhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(user?.profilePhotoUrl || null);
  const photoInputRef = useRef<HTMLInputElement>(null);

  const updateProfileMutation = useMutation({
    mutationFn: async (data: typeof profileData) => {
      const response = await apiRequest("PUT", `/api/users/${user?.id}/profile`, data);
      return response.json();
    },
    onSuccess: (data) => {
      login(data.user); // Update user context
      setIsEditingProfile(false);
      toast({
        title: "Profile Updated",
        description: "Your profile has been updated successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Update Failed",
        description: error.message || "Unable to update profile",
        variant: "destructive",
      });
    },
  });

  const changePasswordMutation = useMutation({
    mutationFn: async (data: typeof passwordData) => {
      const response = await apiRequest("POST", `/api/users/${user?.id}/change-password`, {
        currentPassword: data.currentPassword,
        newPassword: data.newPassword,
      });
      return response.json();
    },
    onSuccess: () => {
      setIsChangingPassword(false);
      setPasswordData({ currentPassword: "", newPassword: "", confirmPassword: "" });
      toast({
        title: "Password Changed",
        description: "Your password has been updated successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Password Change Failed",
        description: error.message || "Unable to change password",
        variant: "destructive",
      });
    },
  });

  const uploadPhotoMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append("photo", file);
      
      const response = await fetch(`/api/users/${user?.id}/profile-photo`, {
        method: "POST",
        credentials: "include",
        body: formData,
      });
      
      if (!response.ok) {
        throw new Error("Failed to upload photo");
      }
      
      return response.json();
    },
    onSuccess: (data) => {
      login(data.user); // Update user context with new photo URL
      setPhotoPreview(data.user.profilePhotoUrl);
      setSelectedPhoto(null);
      toast({
        title: "Photo Updated",
        description: "Your profile photo has been updated successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Upload Failed",
        description: error.message || "Unable to upload photo",
        variant: "destructive",
      });
    },
  });

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        toast({
          title: "Invalid File",
          description: "Please select an image file",
          variant: "destructive",
        });
        return;
      }
      
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "File Too Large",
          description: "Please select an image under 5MB",
          variant: "destructive",
        });
        return;
      }
      
      setSelectedPhoto(file);
      
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
      
      // Upload immediately
      uploadPhotoMutation.mutate(file);
    }
  };

  const updateSettingsMutation = useMutation({
    mutationFn: async (data: typeof settings) => {
      const response = await apiRequest("PUT", `/api/users/${user?.id}/settings`, data);
      return response.json();
    },
    onSuccess: (data) => {
      login(data.user); // Update user context
      toast({
        title: "Settings Updated",
        description: "Your preferences have been saved",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Settings Update Failed",
        description: error.message || "Unable to update settings",
        variant: "destructive",
      });
    },
  });

  const handleProfileUpdate = () => {
    if (!profileData.fullName || !profileData.email || !profileData.phone || !profileData.country) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }
    updateProfileMutation.mutate(profileData);
  };

  const handlePasswordChange = () => {
    if (!passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword) {
      toast({
        title: "Missing Information",
        description: "Please fill in all password fields",
        variant: "destructive",
      });
      return;
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast({
        title: "Password Mismatch",
        description: "New password and confirmation do not match",
        variant: "destructive",
      });
      return;
    }

    if (passwordData.newPassword.length < 8) {
      toast({
        title: "Weak Password",
        description: "Password must be at least 8 characters long",
        variant: "destructive",
      });
      return;
    }

    changePasswordMutation.mutate(passwordData);
  };

  const handleSettingUpdate = (key: string, value: any) => {
    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);
    updateSettingsMutation.mutate(newSettings);
  };

  const setup2FAMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", `/api/auth/setup-2fa`, { userId: user?.id });
      return response.json();
    },
    onSuccess: (data) => {
      setQrCodeUrl(data.qrCodeUrl);
      setIs2FASetup(true);
    },
    onError: (error: any) => {
      toast({
        title: "Setup Failed",
        description: error.message || "Unable to setup 2FA",
        variant: "destructive",
      });
    },
  });

  const setupFingerprintMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", `/api/auth/setup-biometric`, { userId: user?.id });
      return response.json();
    },
    onSuccess: () => {
      setFingerprintSetup(true);
      handleSettingUpdate('biometricEnabled', true);
      toast({
        title: "Fingerprint Setup Complete",
        description: "You can now use fingerprint to authenticate",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Setup Failed",
        description: error.message || "Unable to setup fingerprint",
        variant: "destructive",
      });
    },
  });

  const requestNotificationPermission = async () => {
    if ('Notification' in window) {
      const permission = await Notification.requestPermission();
      
      if (permission === 'granted') {
        handleSettingUpdate('pushNotificationsEnabled', true);
        toast({
          title: "Notifications Enabled",
          description: "You'll receive push notifications for transactions",
        });
        
        // Register for push notifications
        await apiRequest("POST", `/api/notifications/register`, { 
          userId: user?.id,
          endpoint: 'browser-notification'
        });
      }
    }
  };

  const handleLogout = () => {
    // Clear all local storage and session data
    localStorage.clear();
    sessionStorage.clear();
    logout();
    setLocation("/");
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Top Navigation */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-card shadow-sm p-4 flex items-center elevation-1"
      >
        <h1 className="text-lg font-semibold">Settings</h1>
      </motion.div>

      <div className="p-6 space-y-6">
        {/* Profile Section */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-card p-4 rounded-xl border border-border elevation-1"
        >
          <div className="flex items-center mb-4">
            {user?.profilePhotoUrl ? (
              <img 
                src={user.profilePhotoUrl} 
                alt="Profile" 
                className="w-16 h-16 rounded-full object-cover mr-4 border-2 border-primary/20"
              />
            ) : (
              <div className="w-16 h-16 bg-gradient-to-br from-primary to-secondary rounded-full flex items-center justify-center mr-4">
                <span className="text-white font-bold text-xl">
                  {user?.fullName?.split(' ').map(n => n[0]).join('') || 'JD'}
                </span>
              </div>
            )}
            <div className="flex-1">
              <h3 className="font-semibold text-lg">{user?.fullName || 'John Doe'}</h3>
              <p className="text-muted-foreground text-sm">{user?.email}</p>
              <p className={`text-xs px-2 py-1 rounded-full inline-block mt-1 ${
                user?.kycStatus === 'verified' 
                  ? 'text-green-600 bg-green-100 dark:text-green-400 dark:bg-green-950' 
                  : 'text-yellow-600 bg-yellow-100 dark:text-yellow-400 dark:bg-yellow-950'
              }`}>
                {user?.kycStatus === 'verified' ? 'KYC Verified' : 'KYC Pending'}
              </p>
            </div>
          </div>
          
          <Dialog open={isEditingProfile} onOpenChange={setIsEditingProfile}>
            <DialogTrigger asChild>
              <Button
                variant="outline"
                className="w-full mt-4 flex items-center justify-center gap-2 hover:bg-primary/10 hover:text-primary hover:border-primary transition-all"
                data-testid="button-edit-profile"
              >
                <span className="material-icons text-sm">edit</span>
                Update Profile
              </Button>
            </DialogTrigger>
              <DialogContent className="sm:max-w-md w-[calc(100%-2rem)] max-h-[70vh] top-[50%] left-[50%] translate-x-[-50%] translate-y-[-50%] bg-gradient-to-b from-background to-muted/20 p-5 overflow-y-auto">
                <div className="pb-20">
                <DialogHeader className="mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-primary to-secondary rounded-full flex items-center justify-center">
                      <span className="material-icons text-white text-base">person</span>
                    </div>
                    <div>
                      <DialogTitle className="text-xl font-bold">Update Profile</DialogTitle>
                      <p className="text-sm text-muted-foreground">Keep your info up to date</p>
                    </div>
                  </div>
                </DialogHeader>
                <div className="space-y-4">
                  {/* Profile Picture Section */}
                  <div className="flex flex-col items-center space-y-3 pb-4 border-b border-border/50">
                    <div className="relative group">
                      {photoPreview ? (
                        <img 
                          src={photoPreview} 
                          alt="Profile" 
                          className="w-24 h-24 rounded-full object-cover border-4 border-primary/20 shadow-lg transition-transform group-hover:scale-105"
                        />
                      ) : (
                        <div className="w-24 h-24 bg-gradient-to-br from-primary to-secondary rounded-full flex items-center justify-center shadow-lg transition-transform group-hover:scale-105">
                          <span className="text-white font-bold text-3xl">
                            {user?.fullName?.split(' ').map(n => n[0]).join('') || 'JD'}
                          </span>
                        </div>
                      )}
                      <button 
                        type="button"
                        onClick={() => photoInputRef.current?.click()}
                        disabled={uploadPhotoMutation.isPending}
                        className="absolute bottom-0 right-0 w-10 h-10 bg-primary rounded-full flex items-center justify-center shadow-xl hover:bg-primary/90 transition-all hover:scale-110 disabled:opacity-50 border-4 border-background"
                      >
                        {uploadPhotoMutation.isPending ? (
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <span className="material-icons text-white text-base">photo_camera</span>
                        )}
                      </button>
                    </div>
                    <input
                      ref={photoInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handlePhotoSelect}
                      className="hidden"
                    />
                    <div className="text-center space-y-1">
                      <p className="text-sm font-medium text-foreground">
                        {uploadPhotoMutation.isPending ? "Uploading..." : "Profile Photo"}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Click camera icon to update
                      </p>
                    </div>
                  </div>

                  {/* Personal Information */}
                  <div className="space-y-4 bg-muted/30 p-4 rounded-xl">
                    <h4 className="font-semibold text-sm text-foreground flex items-center gap-2">
                      <span className="material-icons text-sm text-primary">badge</span>
                      Personal Information
                    </h4>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="fullName" className="text-sm font-medium">Full Name *</Label>
                        <Input
                          id="fullName"
                          placeholder="e.g., John Doe"
                          value={profileData.fullName}
                          onChange={(e) => setProfileData({ ...profileData, fullName: e.target.value })}
                          data-testid="input-full-name"
                          className="mt-1.5"
                        />
                      </div>
                      <div>
                        <Label htmlFor="email" className="text-sm font-medium">Email Address *</Label>
                        <Input
                          id="email"
                          type="email"
                          placeholder="your.email@example.com"
                          value={profileData.email}
                          onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
                          data-testid="input-email"
                          className="mt-1.5"
                        />
                        <p className="text-xs text-muted-foreground mt-1.5">Used for account notifications</p>
                      </div>
                      <div>
                        <Label htmlFor="phone" className="text-sm font-medium">Phone Number *</Label>
                        <Input
                          id="phone"
                          type="tel"
                          placeholder="07XXXXXXXX"
                          value={profileData.phone}
                          onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
                          data-testid="input-phone"
                          className="mt-1.5"
                        />
                        <p className="text-xs text-muted-foreground mt-1.5">Used for M-Pesa payments and 2FA</p>
                      </div>
                      <div>
                        <Label htmlFor="country" className="text-sm font-medium">Country *</Label>
                        <Select 
                          value={profileData.country}
                          onValueChange={(value) => setProfileData({ ...profileData, country: value })}
                        >
                          <SelectTrigger data-testid="select-country" className="mt-1.5">
                            <SelectValue placeholder="Select your country" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Kenya">🇰🇪 Kenya</SelectItem>
                            <SelectItem value="Nigeria">🇳🇬 Nigeria</SelectItem>
                            <SelectItem value="Ghana">🇬🇭 Ghana</SelectItem>
                            <SelectItem value="South Africa">🇿🇦 South Africa</SelectItem>
                            <SelectItem value="Uganda">🇺🇬 Uganda</SelectItem>
                            <SelectItem value="Tanzania">🇹🇿 Tanzania</SelectItem>
                            <SelectItem value="United States">🇺🇸 United States</SelectItem>
                            <SelectItem value="United Kingdom">🇬🇧 United Kingdom</SelectItem>
                            <SelectItem value="Canada">🇨🇦 Canada</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>

                  {/* Password Change Section */}
                  <div className="border-t border-border pt-4">
                    <button
                      onClick={() => setIsChangingPassword(!isChangingPassword)}
                      className="flex items-center justify-between w-full text-sm font-medium text-foreground hover:text-primary transition-colors"
                    >
                      <span className="flex items-center gap-2">
                        <span className="material-icons text-sm">lock</span>
                        Change Password
                      </span>
                      <span className={`material-icons text-sm transition-transform ${isChangingPassword ? 'rotate-180' : ''}`}>
                        expand_more
                      </span>
                    </button>
                    
                    {isChangingPassword && (
                      <div className="mt-4 space-y-3">
                        <div>
                          <Label htmlFor="currentPassword" className="text-sm">Current Password</Label>
                          <Input
                            id="currentPassword"
                            type="password"
                            placeholder="Enter current password"
                            value={passwordData.currentPassword}
                            onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                            className="mt-1.5"
                          />
                        </div>
                        <div>
                          <Label htmlFor="newPassword" className="text-sm">New Password</Label>
                          <Input
                            id="newPassword"
                            type="password"
                            placeholder="Min. 8 characters"
                            value={passwordData.newPassword}
                            onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                            className="mt-1.5"
                          />
                        </div>
                        <div>
                          <Label htmlFor="confirmPassword" className="text-sm">Confirm New Password</Label>
                          <Input
                            id="confirmPassword"
                            type="password"
                            placeholder="Re-enter new password"
                            value={passwordData.confirmPassword}
                            onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                            className="mt-1.5"
                          />
                        </div>
                        <Button
                          onClick={handlePasswordChange}
                          className="w-full"
                          disabled={changePasswordMutation.isPending}
                        >
                          {changePasswordMutation.isPending ? (
                            <>
                              <span className="material-icons animate-spin text-sm mr-2">sync</span>
                              Updating...
                            </>
                          ) : (
                            <>
                              <span className="material-icons text-sm mr-2">check</span>
                              Update Password
                            </>
                          )}
                        </Button>
                      </div>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-3 pt-6 pb-2">
                    <Button
                      variant="outline"
                      onClick={() => setIsEditingProfile(false)}
                      className="flex-1 hover:bg-muted transition-all"
                    >
                      <span className="material-icons text-sm mr-2">close</span>
                      Cancel
                    </Button>
                    <Button
                      onClick={handleProfileUpdate}
                      className="flex-1 bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90 text-white shadow-lg hover:shadow-xl transition-all"
                      disabled={updateProfileMutation.isPending}
                      data-testid="button-save-profile"
                    >
                      {updateProfileMutation.isPending ? (
                        <>
                          <span className="material-icons animate-spin text-sm mr-2">sync</span>
                          Saving...
                        </>
                      ) : (
                        <>
                          <span className="material-icons text-sm mr-2">check_circle</span>
                          Save Changes
                        </>
                      )}
                    </Button>
                  </div>
                </div>
                </div>
              </DialogContent>
            </Dialog>
        </motion.div>

        {/* Account Settings */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="space-y-3"
        >
          <h3 className="font-semibold text-sm text-muted-foreground">ACCOUNT</h3>
          
          {/* Default Currency */}
          <motion.div
            whileHover={{ scale: 1.01 }}
            className="bg-card p-4 rounded-xl border border-border flex items-center justify-between elevation-1"
          >
            <div className="flex items-center">
              <span className="material-icons text-primary mr-3">account_balance</span>
              <div>
                <p className="font-medium">Default Currency</p>
                <p className="text-sm text-muted-foreground">Choose your preferred currency</p>
              </div>
            </div>
            <Select 
              value={settings.defaultCurrency}
              onValueChange={(value) => handleSettingUpdate('defaultCurrency', value)}
            >
              <SelectTrigger className="w-32" data-testid="select-default-currency">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="USD">$ USD</SelectItem>
                <SelectItem value="KES">KSh KES</SelectItem>
                <SelectItem value="NGN">₦ NGN</SelectItem>
                <SelectItem value="GHS">₵ GHS</SelectItem>
                <SelectItem value="ZAR">R ZAR</SelectItem>
                <SelectItem value="EUR">€ EUR</SelectItem>
                <SelectItem value="GBP">£ GBP</SelectItem>
              </SelectContent>
            </Select>
          </motion.div>

          {/* KYC Management */}
          <motion.button
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
            onClick={() => setLocation("/kyc")}
            className="w-full bg-card p-4 rounded-xl border border-border flex items-center justify-between hover:bg-muted transition-colors elevation-1"
            data-testid="button-kyc"
          >
            <div className="flex items-center">
              <span className="material-icons text-secondary mr-3">verified_user</span>
              <div className="text-left">
                <p className="font-medium">Identity Verification</p>
                <p className="text-sm text-muted-foreground">Manage your KYC documents</p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5" />
          </motion.button>

          {/* Virtual Card */}
          <motion.button
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
            onClick={() => setLocation("/virtual-card")}
            className="w-full bg-card p-4 rounded-xl border border-border flex items-center justify-between hover:bg-muted transition-colors elevation-1"
            data-testid="button-virtual-card-settings"
          >
            <div className="flex items-center">
              <span className="material-icons text-primary mr-3">credit_card</span>
              <div className="text-left">
                <p className="font-medium">Virtual Card</p>
                <p className="text-sm text-muted-foreground">
                  {user?.hasVirtualCard ? 'Manage your card' : 'Purchase virtual card'}
                </p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5" />
          </motion.button>
        </motion.div>

        {/* Security Settings */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="space-y-3"
        >
          <h3 className="font-semibold text-sm text-muted-foreground">SECURITY</h3>
          
          {/* 2FA */}
          <motion.div
            whileHover={{ scale: 1.01 }}
            className="bg-card p-4 rounded-xl border border-border flex items-center justify-between elevation-1"
          >
            <div className="flex items-center">
              <span className="material-icons text-secondary mr-3">security</span>
              <div>
                <p className="font-medium">Two-Factor Authentication</p>
                <p className="text-sm text-muted-foreground">Add extra security to your account</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                checked={settings.twoFactorEnabled}
                onCheckedChange={(checked) => {
                  if (checked && !settings.twoFactorEnabled) {
                    setup2FAMutation.mutate();
                  } else {
                    handleSettingUpdate('twoFactorEnabled', checked);
                  }
                }}
                data-testid="switch-2fa"
              />
              {setup2FAMutation.isPending && <span className="text-xs">Setting up...</span>}
            </div>
          </motion.div>

          {/* Biometric */}
          <motion.div
            whileHover={{ scale: 1.01 }}
            className="bg-card p-4 rounded-xl border border-border flex items-center justify-between elevation-1"
          >
            <div className="flex items-center">
              <span className="material-icons text-accent mr-3">fingerprint</span>
              <div>
                <p className="font-medium">Biometric Login</p>
                <p className="text-sm text-muted-foreground">Use fingerprint or face ID</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                checked={settings.biometricEnabled}
                onCheckedChange={(checked) => {
                  if (checked && !settings.biometricEnabled) {
                    setupFingerprintMutation.mutate();
                  } else {
                    handleSettingUpdate('biometricEnabled', checked);
                  }
                }}
                data-testid="switch-biometric"
              />
              {setupFingerprintMutation.isPending && <span className="text-xs">Setting up...</span>}
            </div>
          </motion.div>
        </motion.div>

        {/* 2FA QR Code Dialog */}
        {qrCodeUrl && (
          <Dialog open={is2FASetup} onOpenChange={setIs2FASetup}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Setup Authenticator</DialogTitle>
              </DialogHeader>
              <div className="text-center space-y-4">
                <div className="w-48 h-48 bg-muted rounded-lg flex items-center justify-center mx-auto">
                  <img src={qrCodeUrl} alt="2FA QR Code" className="w-full h-full" />
                </div>
                <div>
                  <h3 className="font-medium mb-2">Scan with your authenticator app</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Use Google Authenticator, Authy, or any TOTP app to scan this QR code.
                  </p>
                  <Button 
                    onClick={() => {
                      setIs2FASetup(false);
                      handleSettingUpdate('twoFactorEnabled', true);
                    }}
                    className="w-full"
                  >
                    Complete Setup
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}

        {/* Notifications */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="space-y-3"
        >
          <h3 className="font-semibold text-sm text-muted-foreground">NOTIFICATIONS</h3>
          
          <motion.div
            whileHover={{ scale: 1.01 }}
            className="bg-card p-4 rounded-xl border border-border flex items-center justify-between elevation-1"
          >
            <div className="flex items-center">
              <span className="material-icons text-primary mr-3">notifications</span>
              <div>
                <p className="font-medium">Push Notifications</p>
                <p className="text-sm text-muted-foreground">Transaction alerts and updates</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                checked={settings.pushNotificationsEnabled}
                onCheckedChange={(checked) => {
                  if (checked && !settings.pushNotificationsEnabled) {
                    requestNotificationPermission();
                  } else {
                    handleSettingUpdate('pushNotificationsEnabled', checked);
                  }
                }}
                data-testid="switch-notifications"
              />
            </div>
          </motion.div>
        </motion.div>

        {/* Support & Legal */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="space-y-3"
        >
          <h3 className="font-semibold text-sm text-muted-foreground">SUPPORT & LEGAL</h3>
          
          <motion.button
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
            onClick={() => setLocation("/support")}
            className="w-full bg-card p-4 rounded-xl border border-border flex items-center justify-between hover:bg-muted transition-colors elevation-1"
            data-testid="button-support"
          >
            <div className="flex items-center">
              <HelpCircle className="w-5 h-5 text-primary mr-3" />
              <div className="text-left">
                <p className="font-medium">Help & Support</p>
                <p className="text-sm text-muted-foreground">Get help and contact support</p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5" />
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
            onClick={handleLogout}
            className="w-full bg-destructive/10 p-4 rounded-xl border border-destructive/20 flex items-center justify-between hover:bg-destructive/20 transition-colors elevation-1"
            data-testid="button-logout"
          >
            <div className="flex items-center">
              <LogOut className="w-5 h-5 text-destructive mr-3" />
              <span className="font-medium text-destructive">Sign Out</span>
            </div>
          </motion.button>
        </motion.div>

        <div className="text-center pt-6 pb-4">
          <p className="text-sm text-muted-foreground">GreenPay v2.1.0</p>
        </div>
      </div>
    </div>
  );
}
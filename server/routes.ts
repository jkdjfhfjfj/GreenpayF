# Appending verification settings endpoints after line 4355

Add this after the messaging-settings PUT endpoint (around line 4355):

  // Verification settings endpoints
  app.get("/api/admin/verification-settings", requireAdminAuth, async (req, res) => {
    try {
      const enableOtpSetting = await storage.getSystemSetting("verification", "enable_phone_otp_login");
      const enableEmailVerifySetting = await storage.getSystemSetting("verification", "enable_email_verification");
      const enableLoginAlertSetting = await storage.getSystemSetting("verification", "enable_login_alert");
      
      res.json({
        enablePhoneOtpLogin: enableOtpSetting?.value !== 'false',
        enableEmailVerification: enableEmailVerifySetting?.value !== 'false',
        enableLoginAlert: enableLoginAlertSetting?.value !== 'false'
      });
    } catch (error) {
      console.error('Error fetching verification settings:', error);
      res.status(500).json({ message: "Error fetching verification settings" });
    }
  });

  app.put("/api/admin/verification-settings", requireAdminAuth, async (req, res) => {
    try {
      const { enablePhoneOtpLogin, enableEmailVerification, enableLoginAlert } = req.body;
      
      await storage.setSystemSetting({
        category: "verification",
        key: "enable_phone_otp_login",
        value: enablePhoneOtpLogin ? 'true' : 'false',
        description: "Require phone OTP for login"
      });
      
      await storage.setSystemSetting({
        category: "verification",
        key: "enable_email_verification",
        value: enableEmailVerification ? 'true' : 'false',
        description: "Require email verification during signup"
      });
      
      await storage.setSystemSetting({
        category: "verification",
        key: "enable_login_alert",
        value: enableLoginAlert ? 'true' : 'false',
        description: "Send login alerts to user"
      });
      
      console.log('Verification settings updated:', { enablePhoneOtpLogin, enableEmailVerification, enableLoginAlert });
      
      res.json({
        success: true,
        message: "Verification settings updated successfully"
      });
    } catch (error) {
      console.error('Error updating verification settings:', error);
      res.status(500).json({ message: "Error updating verification settings" });
    }
  });

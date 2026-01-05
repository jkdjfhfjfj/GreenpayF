import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import path from "path";
import { storage } from "./storage";
import { db } from "./db";
import { insertUserSchema, insertKycDocumentSchema, insertTransactionSchema, insertPaymentRequestSchema, insertRecipientSchema, insertSupportTicketSchema, insertConversationSchema, insertMessageSchema, users, systemLogs, admins, kycDocuments, virtualCards, recipients, transactions, paymentRequests, chatMessages, notifications, supportTickets, conversations, messages, adminLogs, systemSettings, apiConfigurations } from "@shared/schema";
import { desc, eq } from "drizzle-orm";
import { z } from "zod";
import bcrypt from "bcrypt";
import multer from "multer";
import * as speakeasy from 'speakeasy';
import * as QRCode from 'qrcode';
import { fileTypeFromBuffer } from 'file-type';
import { whatsappService } from "./services/whatsapp";
import { createExchangeRateService } from "./services/exchange-rate";
import { payHeroService } from "./services/payhero";
import { paystackService } from "./services/paystack";
import { twoFactorService } from "./services/2fa";
import { biometricService } from "./services/biometric";
import { notificationService } from "./services/notifications";
import { CloudinaryStorageService, ObjectNotFoundError } from "./cloudinaryStorage";
import { statumService } from "./statumService";
import { ActivityLogger } from "./services/activity-logger";
import { validateApiKey, optionalApiKey } from "./middleware/api-key";
import { openaiService } from "./services/ai";
import { aiRateLimiter } from "./services/ai-rate-limiter";

const cloudinaryStorage = new CloudinaryStorageService();

// Configure multer for file uploads with memory storage (for cloud upload)
const upload = multer({
  storage: multer.memoryStorage(), // Store files in memory buffer for cloud upload
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    // Allow common file types including videos
    const allowedMimeTypes = [
      'image/jpeg', 'image/png', 'image/gif', 'image/webp',
      'application/pdf', 'text/plain', 'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'video/mp4', 'video/quicktime', 'video/x-msvideo', 'video/webm'
    ];
    
    if (allowedMimeTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Images, PDFs, documents, and videos are allowed.'));
    }
  }
});

// Configure multer for database backup files
const backupUpload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB limit for backups
  },
  fileFilter: (req, file, cb) => {
    const allowedMimeTypes = [
      'application/json',
      'application/sql',
      'application/gzip',
      'application/x-gzip',
      'text/plain', // Some systems send .json as text/plain
    ];
    
    const allowedExtensions = ['.json', '.sql', '.gz', '.gzip'];
    const hasValidExtension = allowedExtensions.some((ext) => file.originalname.toLowerCase().endsWith(ext));
    
    if (allowedMimeTypes.includes(file.mimetype) || hasValidExtension) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only JSON, SQL, and GZ backup files are allowed.'));
    }
  }
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

const otpSchema = z.object({
  code: z.string().length(6),
});

const transferSchema = z.object({
  fromUserId: z.string(),
  toUserId: z.string(),
  amount: z.string(),
  currency: z.string(),
  description: z.string().optional(),
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Maintenance mode middleware - APPLIED AT END
  const checkMaintenanceMode = async (req: any, res: any, next: any) => {
    try {
      const maintenanceSetting = await storage.getSystemSetting("general", "maintenance_mode");
      const maintenanceEnabled = maintenanceSetting?.value === true || maintenanceSetting?.value === 'true';
      
      // Allow only login/logout/static during maintenance
      const allowedPaths = ['/api/auth/login', '/api/auth/logout', '/api/auth/verify-otp', '/'];
      const isAllowedPath = allowedPaths.some(path => req.path.startsWith(path));
      
      if (maintenanceEnabled && !isAllowedPath && !req.session?.admin) {
        const messageSetting = await storage.getSystemSetting("general", "maintenance_message");
        return res.status(503).json({ 
          message: messageSetting?.value || "System is under maintenance. Please try again later."
        });
      }
    } catch (error) {
      console.error('Maintenance check error:', error);
    }
    next();
  };

  // Authentication and authorization middleware
  const requireAuth = (req: any, res: any, next: any) => {
    const userId = req.session?.userId;
    
    if (!userId) {
      return res.status(401).json({ 
        message: "Authentication required. Please log in."
      });
    }
    
    next();
  };

  const requireAdminAuth = (req: any, res: any, next: any) => {
    // Check if admin is authenticated (has valid session)
    const adminId = req.session?.admin?.id;
    
    console.log(`[ADMIN AUTH] Session check - hasSession: ${!!req.session}, hasAdminId: ${!!adminId}`);
    
    if (!adminId) {
      console.log(`[ADMIN AUTH] FAILED - No admin ID in session`);
      return res.status(401).json({ 
        message: "Authentication required. Please log in as an administrator."
      });
    }
    
    // Check if the session admin has admin role
    if (!req.session.admin.role || req.session.admin.role !== 'admin') {
      console.log(`[ADMIN AUTH] FAILED - Invalid role:`, req.session.admin.role);
      return res.status(403).json({ 
        message: "Access denied. Administrator privileges required."
      });
    }
    
    console.log(`[ADMIN AUTH] SUCCESS - Admin ${req.session.admin.email} authenticated`);
    next();
  };

  // Apply maintenance mode middleware globally
  app.use(checkMaintenanceMode);

  // Health check endpoint - must be defined early to avoid catch-all routes
  app.get("/health", (_req, res) => {
    res.status(200).json({ 
      status: "healthy", 
      timestamp: new Date().toISOString(),
      env: process.env.NODE_ENV,
      uptime: process.uptime()
    });
  });

  // Serve private objects from object storage (profile photos, KYC documents, chat files)
  app.get("/objects/:objectPath(*)", async (req, res) => {
    try {
      console.log(`📥 File request received: /objects/${req.params.objectPath}`);
      const userId = (req.session as any)?.userId;
      const adminId = (req.session as any)?.admin?.id;
      console.log(`🔐 Auth check - userId: ${userId}, adminId: ${adminId}`);
      
      // Require authentication to access private objects
      if (!userId && !adminId) {
        console.warn('⚠️ Unauthorized file access attempt:', req.params.objectPath);
        console.log('Session data:', JSON.stringify(req.session, null, 2));
        return res.status(401).json({ message: "Authentication required" });
      }

      // Extract the object key from the path
      // The path comes in as /objects/kyc/uuid.jpg, we need just kyc/uuid.jpg
      let objectKey = req.params.objectPath;
      
      // Remove leading slash if present
      if (objectKey.startsWith('/')) {
        objectKey = objectKey.substring(1);
      }
      
      console.log(`✅ Authenticated - downloading: ${objectKey} for ${adminId ? 'admin' : 'user'} ${adminId || userId}`);
      
      // Download and stream the file
      // Note: Cloudinary serves files via URLs
      // File keys use UUIDs making them non-guessable
      await cloudinaryStorage.downloadToResponse(objectKey, res);
    } catch (error) {
      if (error instanceof ObjectNotFoundError) {
        console.warn(`⚠️ File not found: ${req.params.objectPath}`);
        return res.status(404).json({ message: "File not found" });
      }
      console.error('❌ File download error:', error);
      return res.status(500).json({ message: "Failed to serve file" });
    }
  });

  // Create default admin account if none exists
  try {
    const existingAdmin = await storage.getAdminByEmail("admin@greenpay.com");
    if (!existingAdmin) {
      await storage.createAdmin({
        email: "admin@greenpay.com",
        password: "Admin123!@#",
        fullName: "GreenPay Administrator",
        role: "admin",
        twoFactorEnabled: false
      });
      console.log("✅ Default admin account created");
    }
  } catch (error) {
    console.error("Failed to create default admin:", error);
  }
  // Authentication routes with real WhatsApp integration
  app.post("/api/auth/signup", optionalApiKey, async (req, res) => {
    try {
      const userData = insertUserSchema.parse(req.body);
      
      // Format phone number consistently (+254XXXXXXXXX)
      const { messagingService } = await import('./services/messaging');
      userData.phone = messagingService.formatPhoneNumber(userData.phone);
      
      // Check if user already exists
      const existingUser = await storage.getUserByEmail(userData.email);
      if (existingUser) {
        return res.status(400).json({ message: "User already exists" });
      }

      // Create user with hashed password (now handled in storage)
      const user = await storage.createUser(userData);
      
      // Auto-verify phone and email for smoother onboarding
      await storage.updateUser(user.id, { 
        isPhoneVerified: true, 
        isEmailVerified: true
      });

      // Send welcome SMS/WhatsApp/Email with instructions
      if (user.phone || user.email) {
        const { messagingService } = await import('./services/messaging');
        const { whatsappService } = await import('./services/whatsapp');
        const domain = process.env.REPLIT_DOMAINS || 'greenpay.app';
        const loginUrl = `https://${domain.split(',')[0]}/login`;
        
        if (user.phone) {
          // Send WhatsApp create_acc template if WhatsApp is configured
          whatsappService.sendAccountCreation(user.phone, user.fullName || 'User')
            .catch(err => console.error('[Signup] WhatsApp account creation error:', err));
          
          // Also send fallback SMS message
          messagingService.sendMessage(
            user.phone,
            `Welcome to GreenPay! To send and receive money, you need to: 1) Purchase a virtual card 2) Verify your KYC. Login here: ${loginUrl}`
          ).catch(err => console.error('Welcome message error:', err));
        }
        
        if (user.email) {
          // Send welcome email
          const { mailtrapService } = await import('./services/mailtrap');
          mailtrapService.sendWelcome(user.email, user.fullName?.split(' ')[0] || 'User', user.fullName?.split(' ')[1] || '')
            .catch(err => console.error('[Signup] Email welcome error:', err));
        }
      }
      
      // Remove password from response
      const { password, ...userResponse } = user;
      
      // Redirect to login after signup
      // (req.session as any).userId = user.id;
      // (req.session as any).user = { id: user.id, email: user.email };
      
      // Force session save to ensure it's written if needed later
      req.session.save((saveErr) => {
        if (saveErr) {
          console.error('Session save error after signup:', saveErr);
          return res.status(500).json({ message: "Failed to create session" });
        }
        console.log(`[Signup] Account created successfully for user ${user.id}`);
        res.json({ 
          user: { ...userResponse, isPhoneVerified: true, isEmailVerified: true },
          success: true,
          redirectToLogin: true
        });
      });
    } catch (error) {
      console.error('Signup error:', error);
      res.status(400).json({ message: "Invalid user data" });
    }
  });

  app.post("/api/auth/login", optionalApiKey, async (req, res) => {
    try {
      // Check maintenance mode FIRST - block all login attempts
      const maintenanceSetting = await storage.getSystemSetting('platform', 'maintenance_mode');
      if (maintenanceSetting?.value === 'true') {
        return res.status(503).json({ 
          message: "System is under maintenance",
          maintenanceMode: true,
          maintenanceMessage: (await storage.getSystemSetting('platform', 'maintenance_message'))?.value || "System maintenance in progress"
        });
      }

      const { email, password } = loginSchema.parse(req.body);
      
      const user = await storage.getUserByEmail(email);
      if (!user) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      // Verify password using bcrypt FIRST - before any session manipulation
      const isValidPassword = await bcrypt.compare(password, user.password);
      if (!isValidPassword) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      // Check admin-enforced security requirements
      const twoFactorRequiredSetting = await storage.getSystemSetting("security", "two_factor_required");
      const twoFactorRequired = twoFactorRequiredSetting?.value === 'true';
      
      const kycRequiredSetting = await storage.getSystemSetting("security", "kyc_auto_approval");
      const kycRequired = kycRequiredSetting?.value === 'false'; // false means KYC is REQUIRED
      
      // Check if OTP is required (based on admin toggle)
      const enableOtpSetting = await storage.getSystemSetting("messaging", "enable_otp_messages");
      const otpRequired = enableOtpSetting?.value !== 'false'; // Default to true if not set
      
      // Check which OTP methods are enabled
      const otpEmailSetting = await storage.getSystemSetting("messaging", "otp_email_enabled");
      const otpSmsSetting = await storage.getSystemSetting("messaging", "otp_sms_enabled");
      const otpWhatsappSetting = await storage.getSystemSetting("messaging", "otp_whatsapp_enabled");
      
      const emailEnabled = otpEmailSetting?.value !== 'false'; // Default to true
      const smsEnabled = otpSmsSetting?.value !== 'false'; // Default to true
      const whatsappEnabled = otpWhatsappSetting?.value !== 'false'; // Default to true
      
      // Check PIN requirement
      const pinRequiredSetting = await storage.getSystemSetting("security", "pin_required");
      const pinRequired = pinRequiredSetting?.value === 'true';
      
      // Check if messaging credentials are configured (SMS or WhatsApp)
      const apiKeySetting = await storage.getSystemSetting("messaging", "api_key");
      const emailSetting = await storage.getSystemSetting("messaging", "account_email");
      const senderIdSetting = await storage.getSystemSetting("messaging", "sender_id");
      const whatsappTokenSetting = await storage.getSystemSetting("messaging", "whatsapp_access_token");
      const whatsappPhoneSetting = await storage.getSystemSetting("messaging", "whatsapp_phone_number_id");
      
      // SMS is configured if we have api_key, account_email, and sender_id
      const smsConfigured = !!(apiKeySetting?.value && emailSetting?.value && senderIdSetting?.value);
      
      // WhatsApp is configured if we have access_token and phone_number_id (from db or env)
      const whatsappConfigured = !!(
        (whatsappTokenSetting?.value || process.env.WHATSAPP_ACCESS_TOKEN) && 
        (whatsappPhoneSetting?.value || process.env.WHATSAPP_PHONE_NUMBER_ID)
      );
      
      // At least one messaging channel must be configured for OTP
      const messagesConfigured = smsConfigured || whatsappConfigured;
      
      // Check enforcement requirements
      if (kycRequired && user.kycStatus !== 'verified') {
        return res.status(403).json({
          message: "KYC verification required",
          requiresKYC: true,
          userId: user.id
        });
      }
      
      if (twoFactorRequired && !user.twoFactorEnabled) {
        return res.status(403).json({
          message: "2FA must be enabled",
          requires2FA: true,
          userId: user.id
        });
      }
      
      if (pinRequired && !user.pinEnabled) {
        return res.status(403).json({
          message: "PIN setup required",
          requiresPINSetup: true,
          userId: user.id
        });
      }
      
      // If OTP is disabled by admin, allow direct login (or check PIN if required)
      if (!otpRequired) {
        console.log('OTP disabled by admin');
        
        // Check both admin PIN requirement AND user PIN setting
        if ((pinRequired || user.pinEnabled) && user.pinCode) {
          return res.status(200).json({
            message: "PIN verification required",
            requiresPin: true,
            userId: user.id
          });
        }
        
        // Direct login without OTP
        req.session.regenerate((err) => {
          if (err) {
            console.error('Session regeneration error:', err);
            return res.status(500).json({ message: "Session error" });
          }

          (req.session as any).userId = user.id;
          (req.session as any).user = { id: user.id, email: user.email };

          storage.createLoginHistory({
            userId: user.id,
            ipAddress: req.ip || (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || 'Unknown',
            userAgent: req.headers['user-agent'] || 'Unknown',
            deviceType: req.headers['user-agent']?.includes('Mobile') ? 'mobile' : 'desktop',
            browser: req.headers['user-agent']?.split('/')[0] || 'Unknown',
            location: (req.headers['cf-ipcountry'] as string) || 'Unknown',
            status: 'success',
          }).catch(err => console.error('Login history error:', err));

          notificationService.sendSecurityNotification(
            user.id,
            "New login detected from your account"
          ).catch(err => console.error('Notification error:', err));

          const { password: _, ...userResponse } = user;
          
          req.session.save((saveErr) => {
            if (saveErr) {
              console.error('Session save error:', saveErr);
              return res.status(500).json({ message: "Session save error" });
            }
            res.json({ user: userResponse });
          });
        });
        return;
      }

      // OTP is required - check if at least one messaging channel is configured
      if (!messagesConfigured) {
        console.error('OTP is required but no messaging channels configured (SMS or WhatsApp)');
        return res.status(500).json({ 
          message: "Verification service not configured. Please contact support." 
        });
      }

      // OTP is required and messaging is configured - send OTP
      const { messagingService } = await import('./services/messaging');
      const { mailtrapService } = await import('./services/mailtrap');
      const otpCode = messagingService.generateOTP();
      const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

      // Store OTP in user record
      await storage.updateUserOtp(user.id, otpCode, otpExpiry);

      // Send OTP via SMS, WhatsApp, and Email concurrently
      const [smsWhatsappResult, emailResult] = await Promise.all([
        messagingService.sendOTP(user.phone, otpCode),
        user.email ? mailtrapService.sendOTP(user.email, user.firstName || 'User', user.lastName || '', otpCode) : Promise.resolve(false)
      ]);
      
      const result = { ...smsWhatsappResult, email: emailResult };

      // When messaging is configured, OTP delivery failure is an error (don't bypass)
      if (!result.sms && !result.whatsapp && !result.email) {
        console.error('OTP delivery failed - messaging configured but delivery failed');
        return res.status(500).json({ 
          message: "Failed to send verification code. Please try again or contact support." 
        });
      }

      // OTP was sent successfully - require verification
      req.session.regenerate((err) => {
        if (err) {
          console.error('Session regeneration error:', err);
          return res.status(500).json({ message: "Session error" });
        }

        // Store pending login data (user not authenticated yet)
        (req.session as any).pendingLoginUserId = user.id;
        (req.session as any).loginIp = req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress;
        (req.session as any).loginLocation = req.headers['cf-ipcountry'] || 'Unknown Location';

        req.session.save((saveErr) => {
          if (saveErr) {
            console.error('Session save error:', saveErr);
            return res.status(500).json({ message: "Session save error" });
          }

          const sentMethods = [];
          if (result.sms) sentMethods.push('SMS');
          if (result.whatsapp) sentMethods.push('WhatsApp');
          if (result.email) sentMethods.push('Email');

          res.json({ 
            requiresOtp: true,
            userId: user.id,
            phone: user.phone,
            sentVia: sentMethods.length > 0 ? sentMethods.join(' and ') : 'SMS, WhatsApp or Email',
            message: `Verification code sent to ${sentMethods.length > 0 ? sentMethods.join(', ') : 'SMS, WhatsApp or Email'}`
          });
        });
      });
    } catch (error) {
      console.error('Login error:', error);
      res.status(400).json({ message: "Invalid login data" });
    }
  });

  app.post("/api/auth/verify-otp", optionalApiKey, async (req, res) => {
    try {
      const { code } = otpSchema.parse(req.body);
      const { userId } = req.body;
      
      // Get pending login user ID from session
      const pendingUserId = (req.session as any).pendingLoginUserId || userId;
      const loginIp = (req.session as any).loginIp || req.ip;
      const loginLocation = (req.session as any).loginLocation || 'Unknown Location';
      
      if (!pendingUserId) {
        return res.status(401).json({ message: "Session expired. Please login again." });
      }
      
      // Verify OTP against stored code
      const isValid = await storage.verifyUserOtp(pendingUserId, code);
      
      if (isValid) {
        const user = await storage.getUser(pendingUserId);
        if (!user) {
          return res.status(404).json({ message: "User not found" });
        }
        
        // Complete login - set session data
        (req.session as any).userId = user.id;
        (req.session as any).user = { id: user.id, email: user.email };
        
        // Save login history
        storage.createLoginHistory({
          userId: user.id,
          ipAddress: loginIp || 'Unknown',
          userAgent: req.headers['user-agent'] || 'Unknown',
          deviceType: req.headers['user-agent']?.includes('Mobile') ? 'mobile' : 'desktop',
          browser: req.headers['user-agent']?.split('/')[0] || 'Unknown',
          location: loginLocation,
          status: 'success',
        }).catch(err => console.error('Login history error:', err));
        
        // Clear pending login data
        delete (req.session as any).pendingLoginUserId;
        delete (req.session as any).loginIp;
        delete (req.session as any).loginLocation;
        
        // Send login alert via SMS, WhatsApp, and Email
        const { messagingService } = await import('./services/messaging');
        const { mailtrapService } = await import('./services/mailtrap');
        
        Promise.all([
          messagingService.sendLoginAlert(user.phone, loginLocation, loginIp || 'Unknown IP'),
          user.email ? mailtrapService.sendLoginAlert(
            user.email,
            user.firstName || 'User',
            user.lastName || '',
            loginLocation,
            loginIp || 'Unknown IP',
            req.headers['user-agent'] || 'Unknown Device'
          ) : Promise.resolve(false)
        ]).catch(err => console.error('Login alert error:', err));
        
        // Send in-app notification
        notificationService.sendSecurityNotification(
          user.id,
          "New login detected from your account"
        ).catch(err => console.error('Notification error:', err));
        
        const { password, ...userResponse } = user;
        
        // Save session before responding
        req.session.save((saveErr) => {
          if (saveErr) {
            console.error('Session save error:', saveErr);
            return res.status(500).json({ message: "Session save error" });
          }
          res.json({ success: true, user: userResponse });
        });
      } else {
        res.status(400).json({ message: "Invalid or expired OTP code" });
      }
    } catch (error) {
      console.error('OTP verification error:', error);
      res.status(400).json({ message: "Invalid OTP data" });
    }
  });

  // Resend OTP
  app.post("/api/auth/resend-otp", optionalApiKey, async (req, res) => {
    try {
      const { userId } = req.body;
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const { messagingService } = await import('./services/messaging');
      const { mailtrapService } = await import('./services/mailtrap');
      const otpCode = messagingService.generateOTP();
      const otpExpiry = new Date(Date.now() + 10 * 60 * 1000);
      
      await storage.updateUserOtp(user.id, otpCode, otpExpiry);
      
      // Send OTP via SMS, WhatsApp, and Email concurrently
      const [smsWhatsappResult, emailResult] = await Promise.all([
        messagingService.sendOTP(user.phone, otpCode),
        user.email ? mailtrapService.sendOTP(user.email, user.firstName || 'User', user.lastName || '', otpCode) : Promise.resolve(false)
      ]);
      
      const result = { ...smsWhatsappResult, email: emailResult };
      
      if (!result.sms && !result.whatsapp && !result.email) {
        return res.status(500).json({ message: "Failed to resend verification code" });
      }
      
      const sentMethods = [];
      if (result.sms) sentMethods.push('SMS');
      if (result.whatsapp) sentMethods.push('WhatsApp');
      if (result.email) sentMethods.push('Email');
      
      res.json({ 
        message: `New OTP sent via ${sentMethods.join(', ')}`
      });
    } catch (error) {
      console.error('Resend OTP error:', error);
      res.status(500).json({ message: "Failed to resend OTP" });
    }
  });

  // Forgot password - Send reset code (by phone or email)
  app.post("/api/auth/forgot-password", async (req, res) => {
    try {
      const { contact } = req.body;
      
      if (!contact) {
        return res.status(400).json({ message: "Phone number or email address is required" });
      }

      // Import services upfront
      const { messagingService } = await import('./services/messaging');
      const { mailtrapService } = await import('./services/mailtrap');

      // Detect if input is email or phone
      const isEmail = contact.includes('@');
      let user;

      if (isEmail) {
        // Find user by email
        user = await storage.getUserByEmail(contact.toLowerCase().trim());
        if (!user) {
          return res.status(404).json({ message: "No account found with this email address" });
        }
      } else {
        // Find user by phone number
        const formattedPhone = messagingService.formatPhoneNumber(contact);
        user = await storage.getUserByPhone(formattedPhone);
        if (!user) {
          return res.status(404).json({ message: "No account found with this phone number" });
        }
      }

      // Generate reset code (6-digit OTP)
      const resetCode = messagingService.generateOTP();
      const resetExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
      
      // Store reset code in user's OTP field
      await storage.updateUserOtp(user.id, resetCode, resetExpiry);
      
      // Send reset code via SMS, WhatsApp, and Email concurrently
      const [smsWhatsappResult, emailResult] = await Promise.all([
        messagingService.sendPasswordReset(user.phone, resetCode),
        user.email ? mailtrapService.sendPasswordReset(user.email, user.firstName || 'User', user.lastName || '', resetCode) : Promise.resolve(false)
      ]);
      
      const result = { ...smsWhatsappResult, email: emailResult };
      
      if (!result.sms && !result.whatsapp && !result.email) {
        return res.status(500).json({ message: "Failed to send reset code" });
      }
      
      const sentMethods = [];
      if (result.sms) sentMethods.push('SMS');
      if (result.whatsapp) sentMethods.push('WhatsApp');
      if (result.email) sentMethods.push('Email');
      
      res.json({ 
        phone: user.phone,
        sentVia: sentMethods.join(', ')
      });
    } catch (error) {
      console.error('Forgot password error:', error);
      res.status(500).json({ message: "Failed to send reset code" });
    }
  });

  // Forgot password - Send reset code (by email)
  app.post("/api/auth/forgot-password-email", async (req, res) => {
    try {
      const { email } = req.body;
      
      if (!email) {
        return res.status(400).json({ message: "Email address is required" });
      }

      // Find user by email
      const user = await storage.getUserByEmail(email.toLowerCase().trim());
      
      if (!user) {
        return res.status(404).json({ message: "No account found with this email address" });
      }

      // Generate reset code (6-digit OTP)
      const { messagingService } = await import('./services/messaging');
      const resetCode = messagingService.generateOTP();
      const resetExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
      
      // Store reset code in user's OTP field
      await storage.updateUserOtp(user.id, resetCode, resetExpiry);
      
      // Send reset code via SMS, WhatsApp, and Email concurrently
      const [smsWhatsappResult, emailResult] = await Promise.all([
        messagingService.sendPasswordReset(user.phone, resetCode),
        user.email ? mailtrapService.sendPasswordReset(user.email, user.firstName || 'User', user.lastName || '', resetCode) : Promise.resolve(false)
      ]);
      
      const result = { ...smsWhatsappResult, email: emailResult };
      
      if (!result.sms && !result.whatsapp && !result.email) {
        return res.status(500).json({ message: "Failed to send reset code" });
      }
      
      const sentMethods = [];
      if (result.sms) sentMethods.push('SMS');
      if (result.whatsapp) sentMethods.push('WhatsApp');
      if (result.email) sentMethods.push('Email');
      
      res.json({ 
        email: user.email,
        sentVia: sentMethods.join(', ')
      });
    } catch (error) {
      console.error('Forgot password by email error:', error);
      res.status(500).json({ message: "Failed to send reset code" });
    }
  });

  app.post("/api/auth/reset-password-email", async (req, res) => {
    try {
      const { email, code, newPassword } = req.body;
      
      if (!email || !code || !newPassword) {
        return res.status(400).json({ message: "Email, code, and new password are required" });
      }

      if (newPassword.length < 6) {
        return res.status(400).json({ message: "Password must be at least 6 characters" });
      }

      // Find user by email
      const user = await storage.getUserByEmail(email.toLowerCase().trim());
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Verify reset code
      const isValid = await storage.verifyUserOtp(user.id, code);
      
      if (!isValid) {
        return res.status(400).json({ message: "Invalid or expired reset code" });
      }

      // Hash new password
      const hashedPassword = await bcrypt.hash(newPassword, 10);
      
      // Update password
      await storage.updateUserPassword(user.id, hashedPassword);
      
      // Clear OTP
      await storage.updateUserOtp(user.id, null, null);
      
      const { mailtrapService } = await import('./services/mailtrap');
      
      // Send confirmation email
      Promise.all([
        messagingService.sendMessage(
          user.phone,
          "Your password has been reset successfully. You can now log in with your new password."
        ),
        user.email ? mailtrapService.sendTemplate(user.email, '7711c72e-431b-4fb9-bea9-9738d4d8bfe7', {
          first_name: user.firstName || 'User',
          last_name: user.lastName || '',
          message: 'Your password has been reset successfully. You can now log in.'
        }) : Promise.resolve(false)
      ]).catch(err => console.error('Password reset notification error:', err));
      
      res.json({ 
        success: true,
        message: "Password reset successful" 
      });
    } catch (error) {
      console.error('Reset password by email error:', error);
      res.status(500).json({ message: "Failed to reset password" });
    }
  });

  app.post("/api/auth/forgot-password", async (req, res) => {
    try {
      const { contact } = req.body;
      if (!contact) {
        return res.status(400).json({ message: "Phone number or email is required" });
      }

      const { messagingService } = await import('./services/messaging');
      
      let user;
      if (contact.includes('@')) {
        user = await storage.getUserByEmail(contact);
      } else {
        const formattedPhone = messagingService.formatPhoneNumber(contact);
        user = await storage.getUserByPhone(formattedPhone);
      }
      
      if (!user) {
        // Return 200 even if user not found for security
        return res.json({ 
          success: true, 
          message: "If an account exists, a reset code has been sent." 
        });
      }

      const otpCode = messagingService.generateOTP();
      const otpExpiry = new Date(Date.now() + 15 * 60 * 1000); // 15 mins

      // Store OTP in database
      await storage.updateUserOtp(user.id, otpCode, otpExpiry);

      // Send via messaging services
      const { mailtrapService } = await import('./services/mailtrap');
      const { whatsappService } = await import('./services/whatsapp');

      // Attempt multi-channel delivery
      const results = await Promise.allSettled([
        user.phone ? messagingService.sendMessage(user.phone, `Your GreenPay password reset code is: ${otpCode}`) : Promise.resolve(false),
        user.phone ? whatsappService.sendOTP(user.phone, otpCode) : Promise.resolve(false),
        user.email ? mailtrapService.sendTemplate(user.email, 'b54e3d3c-9a2c-4b6e-8e8e-8a9e9a9e9a9e', {
          first_name: user.firstName || 'User',
          otp_code: otpCode
        }) : Promise.resolve(false)
      ]);

      console.log(`[ForgotPassword] Reset code sent to user ${user.id}`);

      res.json({ 
        success: true, 
        message: "Reset code sent successfully",
        sentVia: user.email && contact.includes('@') ? 'email' : 'phone'
      });
    } catch (error) {
      console.error('Forgot password error:', error);
      res.status(500).json({ message: "Failed to process request" });
    }
  });

  // Reset password - Verify code and update password
  app.post("/api/auth/reset-password", async (req, res) => {
    try {
      const { phone, code, newPassword } = req.body;
      
      if (!phone || !code || !newPassword) {
        return res.status(400).json({ message: "Phone, code, and new password are required" });
      }

      if (newPassword.length < 6) {
        return res.status(400).json({ message: "Password must be at least 6 characters" });
      }

      // Find user by phone
      const { messagingService } = await import('./services/messaging');
      const formattedPhone = messagingService.formatPhoneNumber(phone);
      const user = await storage.getUserByPhone(formattedPhone);
      
      if (!user) {
        console.error(`[ResetPassword] User not found for phone: ${formattedPhone}`);
        return res.status(404).json({ message: "User not found" });
      }

      // Verify reset code directly from database (no session check)
      const isValid = await storage.verifyUserOtp(user.id, code);
      if (!isValid) {
        console.error(`[ResetPassword] Invalid or expired code for user ${user.id}`);
        return res.status(400).json({ message: "Invalid or expired reset code" });
      }

      // Hash new password
      const hashedPassword = await bcrypt.hash(newPassword, 10);
      
      // Update password
      await storage.updateUserPassword(user.id, hashedPassword);
      
      // Clear OTP
      await storage.updateUserOtp(user.id, null, null);
      
      // Send confirmation message
      const { mailtrapService } = await import('./services/mailtrap');
      Promise.all([
        messagingService.sendMessage(
          user.phone,
          "Your password has been reset successfully. You can now log in with your new password."
        ),
        user.email ? mailtrapService.sendTemplate(user.email, '7711c72e-431b-4fb9-bea9-9738d4d8bfe7', {
          first_name: user.firstName || 'User',
          last_name: user.lastName || '',
          message: 'Your password has been reset successfully. You can now log in.'
        }) : Promise.resolve(false)
      ]).catch(err => console.error('Password reset notification error:', err));
      
      console.log(`[ResetPassword] Success for user ${user.id}`);
      res.json({ 
        success: true,
        message: "Password reset successful" 
      });
    } catch (error) {
      console.error('Reset password error:', error);
      res.status(500).json({ message: "Failed to reset password" });
    }
  });

  // Conversation endpoints
  app.get("/api/conversations/user-conversation", requireAuth, async (req, res) => {
    try {
      const userId = (req.session as any)?.userId;
      
      if (!userId) {
        console.log(`[CONVERSATION AUTH] FAILED - No userId in session for conversation request`);
        return res.status(401).json({ message: "Authentication required" });
      }

      console.log(`[CONVERSATION PRIVACY] User ${userId.substring(0, 8)}... requesting conversation`);

      // Check if user already has an active conversation
      const existingConversations = await storage.getConversationsByUserId(userId);
      console.log(`[CONVERSATION PRIVACY] User ${userId.substring(0, 8)}... has ${existingConversations.length} existing conversations`);
      
      const activeConversation = existingConversations.find(c => c.status === "active");

      if (activeConversation) {
        console.log(`[CONVERSATION PRIVACY] Returning conversation ${activeConversation.id.substring(0, 8)}... for user ${userId.substring(0, 8)}...`);
        return res.json(activeConversation);
      }

      // Create new conversation if none exists
      const newConversation = await storage.createConversation({
        userId,
        title: "Support Chat",
        adminId: null
      });

      // Notify admin about new live chat request via SMS
      try {
        const { messagingService } = await import('./services/messaging');
        await messagingService.sendAdminChatNotification(userId);
      } catch (smsError) {
        console.error('Failed to send admin chat notification:', smsError);
      }

      console.log(`[CONVERSATION PRIVACY] Created new conversation ${newConversation.id.substring(0, 8)}... for user ${userId.substring(0, 8)}...`);
      res.json(newConversation);
    } catch (error) {
      console.error('Get/Create conversation error:', error);
      res.status(500).json({ message: "Failed to get or create conversation" });
    }
  });

  app.get("/api/messages/:conversationId", async (req, res) => {
    try {
      const { conversationId } = req.params;
      const userId = (req.session as any)?.userId;
      const adminId = (req.session as any)?.admin?.id;
      
      console.log(`[MESSAGES PRIVACY] User ${userId?.substring(0, 8) || 'none'}... requesting messages for conversation ${conversationId.substring(0, 8)}...`);
      
      if (!userId && !adminId) {
        console.log(`[MESSAGES AUTH] FAILED - No userId or adminId in session`);
        return res.status(401).json({ message: "Authentication required" });
      }

      // CRITICAL: Verify user or admin has access to this conversation
      const conversation = await storage.getConversation(conversationId);
      if (!conversation) {
        console.log(`[MESSAGES PRIVACY] Conversation ${conversationId.substring(0, 8)}... not found`);
        return res.status(404).json({ message: "Conversation not found" });
      }
      
      console.log(`[MESSAGES PRIVACY] Conversation ${conversationId.substring(0, 8)}... belongs to user ${conversation.userId.substring(0, 8)}...`);
      
      // Allow access if user owns conversation OR if user is an admin
      if (conversation.userId !== userId && !adminId) {
        console.log(`[MESSAGES PRIVACY] ACCESS DENIED - User ${userId?.substring(0, 8)}... tried to access conversation owned by ${conversation.userId.substring(0, 8)}...`);
        return res.status(403).json({ message: "Access denied" });
      }

      const messages = await storage.getMessagesByConversationId(conversationId);
      console.log(`[MESSAGES PRIVACY] Returning ${messages.length} messages for conversation ${conversationId.substring(0, 8)}...`);
      res.json(messages);
    } catch (error) {
      console.error('Get messages error:', error);
      res.status(500).json({ message: "Failed to get messages" });
    }
  });

  app.post("/api/messages", async (req, res) => {
    try {
      const userId = (req.session as any)?.userId;
      const adminId = (req.session as any)?.admin?.id;
      
      console.log(`[MESSAGES PRIVACY] User ${userId?.substring(0, 8) || 'none'}... sending message`);
      
      if (!userId && !adminId) {
        console.log(`[MESSAGES AUTH] FAILED - No userId or adminId in session`);
        return res.status(401).json({ message: "Authentication required" });
      }

      const messageData = insertMessageSchema.parse(req.body);
      console.log(`[MESSAGES PRIVACY] Message for conversation ${messageData.conversationId.substring(0, 8)}...`);
      
      // CRITICAL: Verify user or admin has access to this conversation
      const conversation = await storage.getConversation(messageData.conversationId);
      if (!conversation) {
        console.log(`[MESSAGES PRIVACY] Conversation ${messageData.conversationId.substring(0, 8)}... not found for message`);
        return res.status(404).json({ message: "Conversation not found" });
      }
      
      console.log(`[MESSAGES PRIVACY] Conversation ${messageData.conversationId.substring(0, 8)}... belongs to user ${conversation.userId.substring(0, 8)}...`);
      
      // Allow access if user owns conversation OR if user is an admin
      if (conversation.userId !== userId && !adminId) {
        console.log(`[MESSAGES PRIVACY] ACCESS DENIED - User ${userId?.substring(0, 8)}... tried to send message to conversation owned by ${conversation.userId.substring(0, 8)}...`);
        return res.status(403).json({ message: "Access denied" });
      }

      // Determine sender type and ID based on who is authenticated
      const senderId = adminId || userId;
      const senderType = adminId ? "admin" : "user";

      console.log(`[MESSAGES PRIVACY] Creating message from ${senderType} ${senderId?.substring(0, 8)}... in conversation ${messageData.conversationId.substring(0, 8)}...`);

      // Create the message
      const message = await storage.createMessage({
        ...messageData,
        senderId: senderId!,
        senderType
      } as any);

      // If sender is admin, notify user via SMS
      if (senderType === 'admin') {
        try {
          const { messagingService } = await import('./services/messaging');
          const user = await storage.getUser(conversation.userId);
          if (user && user.phone) {
            const domain = process.env.REPLIT_DOMAINS || 'greenpay.app';
            const loginUrl = `https://${domain.split(',')[0]}/login`;
            const notification = `You have a new message from GreenPay support. Login to reply: ${loginUrl}`;
            await messagingService.sendMessage(user.phone, notification);
          }
        } catch (smsError) {
          console.error('Failed to send user chat notification:', smsError);
        }
      }

      res.json({ message });
    } catch (error) {
      console.error('Create message error:', error);
      res.status(400).json({ message: "Invalid message data" });
    }
  });

  app.put("/api/messages/:id/read", async (req, res) => {
    try {
      const { id } = req.params;
      const userId = (req.session as any)?.userId;
      const adminId = (req.session as any)?.admin?.id;
      
      if (!userId && !adminId) {
        return res.status(401).json({ message: "Authentication required" });
      }

      const message = await storage.markMessageAsRead(id);
      if (!message) {
        return res.status(404).json({ message: "Message not found" });
      }

      res.json({ message });
    } catch (error) {
      console.error('Mark message read error:', error);
      res.status(500).json({ message: "Failed to mark message as read" });
    }
  });

  // File upload for chat messages
  app.post("/api/upload", upload.single('file'), async (req, res) => {
    try {
      const userId = (req.session as any)?.userId;
      const adminId = (req.session as any)?.admin?.id;
      
      console.log('[Upload] Request received:', { hasFile: !!req.file, userId, adminId });
      
      if (!userId && !adminId) {
        return res.status(401).json({ message: "Authentication required" });
      }

      if (!req.file) {
        console.error('[Upload] No file in request');
        return res.status(400).json({ message: "No file uploaded" });
      }

      console.log('[Upload] File details:', { 
        filename: req.file.originalname, 
        size: req.file.size, 
        mimetype: req.file.mimetype,
        hasBuffer: !!req.file.buffer
      });

      // Upload to Cloudinary
      try {
        const url = await cloudinaryStorage.uploadChatFile(
          req.file.buffer,
          req.file.originalname,
          req.file.mimetype
        );
        
        console.log('[Upload] Successfully uploaded to Cloudinary:', { url });
        
        res.json({ 
          url,
          fileUrl: url,
          fileName: req.file.originalname,
          fileSize: req.file.size,
          mimeType: req.file.mimetype,
          message: "File uploaded successfully"
        });
      } catch (uploadError) {
        console.error('[Upload] Cloudinary upload error:', uploadError);
        return res.status(500).json({ message: "Failed to upload file to storage", error: String(uploadError) });
      }
    } catch (error) {
      console.error('[Upload] Request error:', error);
      res.status(500).json({ message: "Failed to upload file", error: String(error) });
    }
  });

  // Note: Chat files are now served via /objects/ endpoint (using object storage)

  // KYC routes with file upload
  app.post("/api/kyc/submit", upload.fields([
    { name: 'frontImage', maxCount: 1 },
    { name: 'backImage', maxCount: 1 },
    { name: 'selfie', maxCount: 1 }
  ]), async (req, res) => {
    try {
      const files = req.files as { [fieldname: string]: Express.Multer.File[] };
      const { userId, documentType, dateOfBirth, address } = req.body;
      
      if (!userId || !documentType || !dateOfBirth || !address) {
        return res.status(400).json({ message: "Missing required fields" });
      }

      if (!files?.frontImage || !files?.backImage || !files?.selfie) {
        return res.status(400).json({ message: "All document images are required" });
      }

      // Check if user has already submitted KYC documents
      const existingKyc = await storage.getKycByUserId(userId);
      
      if (existingKyc) {
        // If status is pending or verified, don't allow resubmission
        if (existingKyc.status === 'pending') {
          return res.status(409).json({ 
            message: "Your KYC documents are currently under review. Please wait for admin verification.",
            status: existingKyc.status
          });
        }
        
        if (existingKyc.status === 'verified') {
          return res.status(409).json({ 
            message: "Your KYC documents have already been verified.",
            status: existingKyc.status
          });
        }
        
        // If status is rejected, allow resubmission by updating the existing record
        if (existingKyc.status === 'rejected') {
          // Upload new files to cloud storage
          let frontImageUrl: string | null = null;
          let backImageUrl: string | null = null;
          let selfieUrl: string | null = null;

          try {
            [frontImageUrl, backImageUrl, selfieUrl] = await Promise.all([
              cloudinaryStorage.uploadKycDocument(
                files.frontImage[0].buffer,
                files.frontImage[0].originalname,
                files.frontImage[0].mimetype
              ),
              cloudinaryStorage.uploadKycDocument(
                files.backImage[0].buffer,
                files.backImage[0].originalname,
                files.backImage[0].mimetype
              ),
              cloudinaryStorage.uploadKycDocument(
                files.selfie[0].buffer,
                files.selfie[0].originalname,
                files.selfie[0].mimetype
              )
            ]);
          } catch (uploadError) {
            console.error('❌ KYC document upload error:', uploadError);
            return res.status(500).json({ message: "Failed to upload documents to storage" });
          }

          // Update existing KYC document
          const updatedKyc = await storage.updateKycDocument(existingKyc.id, {
            documentType,
            dateOfBirth,
            address,
            frontImageUrl,
            backImageUrl,
            selfieUrl,
            status: 'pending',
            verificationNotes: null,
            updatedAt: new Date()
          });

          // Update user KYC status to pending
          await storage.updateUser(userId, { kycStatus: "pending" });

          // Send notification
          await notificationService.sendNotification({
            title: "KYC Documents Resubmitted",
            body: "Your updated documents have been submitted for review. You will be notified once verified.",
            userId,
            type: "general"
          });

          // Send SMS/WhatsApp notification about 48hr wait
          const user = await storage.getUser(userId);
          if (user?.phone) {
            const { messagingService } = await import('./services/messaging');
            messagingService.sendMessage(
              user.phone,
              "Your KYC documents have been resubmitted. Our team will review them within 48 hours. You'll be notified once verified."
            ).catch(err => console.error('KYC resubmission message error:', err));
          }

          return res.json({ kyc: updatedKyc, message: "KYC documents resubmitted successfully" });
        }
      }

      // First time submission - upload files to cloud storage
      let frontImageUrl: string | null = null;
      let backImageUrl: string | null = null;
      let selfieUrl: string | null = null;

      try {
        [frontImageUrl, backImageUrl, selfieUrl] = await Promise.all([
          cloudinaryStorage.uploadKycDocument(
            files.frontImage[0].buffer,
            files.frontImage[0].originalname,
            files.frontImage[0].mimetype
          ),
          cloudinaryStorage.uploadKycDocument(
            files.backImage[0].buffer,
            files.backImage[0].originalname,
            files.backImage[0].mimetype
          ),
          cloudinaryStorage.uploadKycDocument(
            files.selfie[0].buffer,
            files.selfie[0].originalname,
            files.selfie[0].mimetype
          )
        ]);
      } catch (uploadError) {
        console.error('❌ KYC document upload error:', uploadError);
        return res.status(500).json({ message: "Failed to upload documents to storage" });
      }
      
      const kycData = {
        userId,
        documentType,
        dateOfBirth,
        address,
        frontImageUrl,
        backImageUrl,
        selfieUrl
      };
      
      const kyc = await storage.createKycDocument(kycData);
      
      // Update user KYC status to pending for admin review
      await storage.updateUser(userId, { kycStatus: "pending" });
      
      // Send notification
      await notificationService.sendNotification({
        title: "KYC Documents Submitted",
        body: "Your documents have been submitted for review. You will be notified once verified.",
        userId,
        type: "general"
      });

      // Send SMS/WhatsApp notification about 48hr wait
      const user = await storage.getUser(userId);
      if (user?.phone) {
        const { messagingService } = await import('./services/messaging');
        messagingService.sendMessage(
          user.phone,
          "Your KYC documents have been submitted successfully. Our team will review them within 48 hours. You'll be notified once verified."
        ).catch(err => console.error('KYC submission message error:', err));
      }
      
      res.json({ kyc, message: "KYC documents submitted successfully" });
    } catch (error) {
      console.error('KYC submission error:', error);
      res.status(500).json({ message: "Failed to submit KYC documents" });
    }
  });

  app.get("/api/kyc/:userId", async (req, res) => {
    try {
      const kyc = await storage.getKycByUserId(req.params.userId);
      res.json({ kyc });
    } catch (error) {
      res.status(500).json({ message: "Error fetching KYC data" });
    }
  });

  // Virtual Card routes with Paystack integration
  app.post("/api/virtual-card/initialize-payment", async (req, res) => {
    try {
      const { userId } = req.body;
      console.log('Card payment request - userId:', userId, 'type:', typeof userId);
      
      if (!userId) {
        return res.status(400).json({ message: "User ID is required" });
      }
      
      const user = await storage.getUser(userId);
      console.log('Card payment - Found user:', !!user, user?.email);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Check if user already has a card
      const existingCard = await storage.getVirtualCardByUserId(userId);
      if (existingCard) {
        return res.status(400).json({ message: "User already has a virtual card" });
      }

      // Allow card purchase for production - KYC verification can be added later
      // Note: In production environment, additional KYC verification may be required

      // Generate unique reference
      const reference = payHeroService.generateReference();
      
      // Validate user email
      if (!user.email || !user.email.includes('@') || !user.email.includes('.')) {
        return res.status(400).json({ message: "Invalid user email. Please update your profile with a valid email address." });
      }

      // Validate user phone number for M-Pesa
      if (!user.phone) {
        return res.status(400).json({ message: "Phone number is required for M-Pesa payments. Please update your profile." });
      }

      // Get current card price from system settings
      const cardPriceSetting = await storage.getSystemSetting("virtual_card", "price");
      const usdAmount = parseFloat(cardPriceSetting?.value || "60.00");
      const kesAmount = await payHeroService.convertUSDtoKES(usdAmount);
      
      console.log(`Converting $${usdAmount} USD to ${kesAmount} KES for card purchase`);

      // Initialize payment with PayHero M-Pesa STK Push  
      const callbackUrl = `${req.protocol}://${req.get('host')}/payment-processing?reference=${reference}&type=virtual-card`;
      
      const paymentData = await payHeroService.initiateMpesaPayment(
        kesAmount, // Amount in KES
        user.phone, // Phone number for M-Pesa STK Push
        reference, // External reference
        user.fullName, // Customer name
        callbackUrl // Callback URL for tracking
      );
      
      if (!paymentData.success) {
        // Handle specific error types
        if (paymentData.status === 'INVALID_PHONE_NUMBER' || paymentData.status === 'INVALID_PHONE_FORMAT') {
          return res.status(400).json({ 
            message: 'Invalid phone number format. Please update your profile with a valid Kenyan phone number (e.g., +254712345678 or 0712345678)',
            status: paymentData.status 
          });
        }
        return res.status(400).json({ 
          message: 'Payment initiation failed. Please try again or contact support.', 
          status: paymentData.status 
        });
      }
      
      res.json({ 
        success: true,
        reference: paymentData.reference,
        checkoutRequestId: paymentData.CheckoutRequestID,
        status: paymentData.status,
        message: 'STK Push sent to your phone. Please enter your M-Pesa PIN to complete payment.'
      });

      // Create a transaction record for tracking
      await storage.createTransaction({
        userId,
        type: "card_purchase",
        amount: usdAmount.toString(),
        currency: "USD",
        status: "pending",
        paystackReference: paymentData.reference || paymentData.CheckoutRequestID,
        description: "Virtual Card Purchase",
        metadata: { 
          phoneNumber: user.phone,
          status_reason: "Awaiting M-Pesa payment confirmation"
        }
      });
    } catch (error) {
      console.error('Card payment initialization error:', error);
      res.status(500).json({ message: "Error initializing card payment" });
    }
  });

  // PayHero callback to handle card activation and transaction status
  app.post("/api/payments/payhero/callback", async (req, res) => {
    try {
      const { CheckoutRequestID, ResultCode, ResultDesc, ExternalReference } = req.body;
      
      const transaction = await db.query.transactions.findFirst({
        where: eq(transactions.paystackReference, ExternalReference || CheckoutRequestID)
      });

      if (!transaction) {
        console.error(`[PayHero] Transaction not found for ref: ${ExternalReference || CheckoutRequestID}`);
        return res.sendStatus(200);
      }

      if (ResultCode === 0) {
        await storage.updateTransactionStatus(transaction.id, "completed");
        await storage.updateTransactionMetadata(transaction.id, {
          ...((transaction.metadata as object) || {}),
          status_reason: "M-Pesa payment successful",
          checkoutRequestId: CheckoutRequestID
        });

        if (transaction.type === 'card_purchase') {
          const { virtualCardService } = await import('./services/virtual-card');
          await virtualCardService.generateCard(transaction.userId);
          await storage.updateUser(transaction.userId, { hasVirtualCard: true });
          
          notificationService.sendNotification({
            userId: transaction.userId,
            title: "Virtual Card Activated",
            message: "Your virtual card has been successfully generated and is ready for use.",
            type: "success"
          }).catch(err => console.error('Notification error:', err));
        }
      } else {
        await storage.updateTransactionStatus(transaction.id, "failed");
        await storage.updateTransactionMetadata(transaction.id, {
          ...((transaction.metadata as object) || {}),
          status_reason: ResultDesc || "M-Pesa payment failed or cancelled",
          resultCode: ResultCode
        });

        notificationService.sendNotification({
          userId: transaction.userId,
          title: "Payment Failed",
          message: `Your card purchase payment failed: ${ResultDesc}`,
          type: "error"
        }).catch(err => console.error('Notification error:', err));
      }

      res.sendStatus(200);
    } catch (error) {
      console.error('[PayHero Callback Error]:', error);
      res.sendStatus(500);
    }
  });

  // User profile management endpoints
  app.put("/api/users/:id/profile", async (req, res) => {
    try {
      const { id } = req.params;
      const userId = (req.session as any)?.userId;
      
      console.log('Profile update request:', { 
        urlId: id, 
        sessionUserId: userId,
        hasSession: !!req.session,
        sessionKeys: Object.keys(req.session || {})
      });
      
      // Verify user is updating their own profile
      if (!userId) {
        return res.status(401).json({ message: "Please log in to update your profile" });
      }
      
      if (userId !== id) {
        return res.status(403).json({ message: "You can only update your own profile" });
      }

      const { fullName, email, phone, country, profilePhotoUrl } = req.body;

      // Check if email is already taken by another user
      if (email) {
        const existingUser = await storage.getUserByEmail(email);
        if (existingUser && existingUser.id !== id) {
          return res.status(400).json({ message: "Email already in use" });
        }
      }
      
      // Check if phone is already taken by another user
      if (phone) {
        const existingUser = await storage.getUserByPhone(phone);
        if (existingUser && existingUser.id !== id) {
          return res.status(400).json({ message: "Phone number already in use" });
        }
      }

      const updateData: any = {
        fullName,
        email,
        phone,
        country,
      };

      // Only update profile photo if provided
      if (profilePhotoUrl !== undefined) {
        updateData.profilePhotoUrl = profilePhotoUrl;
      }

      const updatedUser = await storage.updateUser(id, updateData);

      if (!updatedUser) {
        return res.status(404).json({ message: "User not found" });
      }

      // Update session with new user data
      (req.session as any).userId = updatedUser.id;

      const { password, ...userResponse } = updatedUser;
      res.json({ user: userResponse, message: "Profile updated successfully" });
    } catch (error) {
      console.error('Profile update error:', error);
      res.status(400).json({ message: "Failed to update profile" });
    }
  });

  app.put("/api/users/:id/settings", async (req, res) => {
    try {
      const { id } = req.params;
      const settings = req.body;

      const updatedUser = await storage.updateUser(id, settings);

      if (!updatedUser) {
        return res.status(404).json({ message: "User not found" });
      }

      const { password, ...userResponse } = updatedUser;
      res.json({ user: userResponse });
    } catch (error) {
      console.error('Settings update error:', error);
      res.status(400).json({ message: "Failed to update settings" });
    }
  });

  // Profile photo upload endpoint
  app.post("/api/users/:id/profile-photo", requireAuth, upload.single('photo'), async (req, res) => {
    try {
      const { id } = req.params;
      const file = req.file;

      if (!file) {
        return res.status(400).json({ message: "No photo file provided" });
      }

      // Validate file type
      if (!file.mimetype.startsWith('image/')) {
        return res.status(400).json({ message: "File must be an image" });
      }

      // Upload profile picture to Cloudinary
      const photoUrl = await cloudinaryStorage.uploadProfilePicture(
        file.buffer,
        file.originalname,
        file.mimetype
      );

      // Update user's profile photo URL
      const updatedUser = await storage.updateUser(id, { 
        profilePhotoUrl: photoUrl 
      });

      if (!updatedUser) {
        return res.status(404).json({ message: "User not found" });
      }

      const { password, ...userResponse } = updatedUser;
      res.json({ 
        user: userResponse,
        message: "Profile photo uploaded successfully" 
      });
    } catch (error) {
      console.error('Profile photo upload error:', error);
      res.status(500).json({ message: "Failed to upload profile photo" });
    }
  });

  // Password change endpoint
  app.post("/api/users/:id/change-password", requireAuth, async (req, res) => {
    try {
      const { id } = req.params;
      const { currentPassword, newPassword } = req.body;

      if (!currentPassword || !newPassword) {
        return res.status(400).json({ message: "Current and new password are required" });
      }

      // Validate new password strength (server-side)
      if (newPassword.length < 8) {
        return res.status(400).json({ message: "New password must be at least 8 characters long" });
      }

      // Get user
      const user = await storage.getUser(id);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Verify current password
      const isPasswordValid = await bcrypt.compare(currentPassword, user.password);
      if (!isPasswordValid) {
        return res.status(401).json({ message: "Current password is incorrect" });
      }

      // Hash new password
      const hashedPassword = await bcrypt.hash(newPassword, 10);

      // Update password
      await storage.updateUser(id, { password: hashedPassword });

      res.json({ message: "Password changed successfully" });
    } catch (error) {
      console.error('Password change error:', error);
      res.status(500).json({ message: "Failed to change password" });
    }
  });

  // KYC endpoints
  app.get("/api/kyc/:userId", async (req, res) => {
    try {
      const { userId } = req.params;
      const kyc = await storage.getKycByUserId(userId);
      res.json({ kyc });
    } catch (error) {
      console.error('KYC fetch error:', error);
      res.status(500).json({ message: "Failed to fetch KYC data" });
    }
  });

  // 2FA setup endpoint
  app.post("/api/auth/setup-2fa", async (req, res) => {
    try {
      const { userId } = req.body;
      
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Generate proper 2FA secret and QR code
      const secret = speakeasy.generateSecret({
        name: `GreenPay (${user.email})`,
        issuer: 'GreenPay'
      });
      
      const qrCodeUrl = await QRCode.toDataURL(secret.otpauth_url!);
      
      // Save secret to user (in production, save encrypted)
      await storage.updateUser(userId, { twoFactorSecret: secret.base32 });
      
      res.json({ 
        qrCodeUrl,
        secret: secret.base32, // Don't send in production
        message: "Scan QR code with your authenticator app"
      });
    } catch (error) {
      console.error('2FA setup error:', error);
      res.status(500).json({ message: "Failed to setup 2FA" });
    }
  });

  // Biometric setup endpoint
  app.post("/api/auth/setup-biometric", async (req, res) => {
    try {
      const { userId } = req.body;
      
      // In production, use WebAuthn for proper biometric authentication
      await storage.updateUser(userId, { biometricEnabled: true });
      
      res.json({ message: "Biometric authentication enabled" });
    } catch (error) {
      console.error('Biometric setup error:', error);
      res.status(500).json({ message: "Failed to setup biometric authentication" });
    }
  });

  // Push notification registration endpoint
  app.post("/api/notifications/register", async (req, res) => {
    try {
      const { userId, endpoint } = req.body;
      
      // Register user for push notifications
      await storage.updateUser(userId, { pushNotificationsEnabled: true });
      
      // In production, save the push subscription endpoint
      res.json({ message: "Push notifications registered" });
    } catch (error) {
      console.error('Notification registration error:', error);
      res.status(500).json({ message: "Failed to register for notifications" });
    }
  });

  app.post("/api/virtual-card/verify-payment", async (req, res) => {
    try {
      const { reference, userId } = req.body;
      
      if (!reference || !userId) {
        return res.status(400).json({ message: "Reference and user ID are required" });
      }

      console.log('PayHero payment verification not supported - using callback method');

      // PayHero uses callbacks for payment verification, not manual verification
      return res.status(400).json({ 
        message: "Payment verification not supported with PayHero. Payments are processed via callbacks.",
        success: false
      });
    } catch (error) {
      console.error('Card payment verification error:', error);
      res.status(500).json({ 
        message: "Error verifying card payment",
        success: false
      });
    }
  });

  // Payment callback handler for Paystack
  app.get("/api/payment-callback", async (req, res) => {
    try {
      const { reference, trxref, type } = req.query;
      const actualReference = reference || trxref;
      
      console.log('Payment callback received:', { reference: actualReference, type });

      if (!actualReference) {
        return res.status(400).json({ message: "Payment reference is required" });
      }

      // Verify the payment with Paystack
      const verificationResult = await paystackService.verifyPayment(actualReference as string);
      
      if (!verificationResult.status) {
        console.error('Callback payment verification failed:', verificationResult.message);
        return res.redirect(`/payment-failed?reference=${actualReference}&error=${encodeURIComponent(verificationResult.message)}`);
      }

      const paymentData = verificationResult.data;
      
      if (paymentData.status === 'success') {
        // Payment successful - redirect to success page
        if (type === 'virtual-card') {
          return res.redirect(`/payment-success?reference=${actualReference}&type=virtual-card`);
        } else {
          return res.redirect(`/payment-success?reference=${actualReference}&type=deposit`);
        }
      } else {
        // Payment failed - redirect to failure page
        return res.redirect(`/payment-failed?reference=${actualReference}&status=${paymentData.status}`);
      }
    } catch (error) {
      console.error('Payment callback error:', error);
      return res.redirect(`/payment-failed?error=${encodeURIComponent('Payment verification failed')}`);
    }
  });

  // Paystack webhook handler for real-time payment updates
  app.post("/api/webhook/paystack", async (req, res) => {
    try {
      const event = req.body;
      console.log('Paystack webhook received:', event.event, event.data?.reference);

      // Verify webhook authenticity (in production, verify signature)
      if (event.event === 'charge.success') {
        const { reference, status, amount, currency } = event.data;
        
        console.log('Webhook payment success:', { reference, status, amount, currency });
        
        // Handle successful payment here if needed
        // This is a backup to the callback URL method
        
      } else if (event.event === 'charge.failed') {
        const { reference, status } = event.data;
        console.log('Webhook payment failed:', { reference, status });
      }

      // Always respond with 200 to acknowledge webhook
      res.status(200).json({ received: true });
    } catch (error) {
      console.error('Webhook error:', error);
      res.status(500).json({ error: 'Webhook processing failed' });
    }
  });

  // Deposit payment initialization
  app.post("/api/deposit/initialize-payment", async (req, res) => {
    try {
      const { userId, amount, currency } = req.body;
      console.log('Deposit payment request - userId:', userId, 'amount:', amount, 'currency:', currency);
      
      if (!userId) {
        return res.status(400).json({ message: "User ID is required" });
      }
      
      const user = await storage.getUser(userId);
      console.log('Deposit payment - Found user:', !!user, user?.email);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Generate unique reference
      const reference = paystackService.generateReference();
      
      // Validate user email
      if (!user.email || !user.email.includes('@') || !user.email.includes('.')) {
        return res.status(400).json({ message: "Invalid user email. Please update your profile with a valid email address." });
      }

      // Validate user phone number for M-Pesa
      if (!user.phone) {
        return res.status(400).json({ message: "Phone number is required for M-Pesa payments. Please update your profile." });
      }

      // Validate amount
      const depositAmount = parseFloat(amount);
      if (isNaN(depositAmount) || depositAmount <= 0) {
        return res.status(400).json({ message: "Invalid deposit amount" });
      }

      // Initialize payment with Paystack in KES currency
      const callbackUrl = `${req.protocol}://${req.get('host')}/api/payment-callback?reference=${reference}&type=deposit`;
      
      const paymentData = await paystackService.initializePayment(
        user.email,
        depositAmount,
        reference,
        'KES', // Use KES currency
        user.phone, // Use registered phone number for M-Pesa
        callbackUrl // Callback URL for tracking
      );
      
      if (!paymentData.status) {
        return res.status(400).json({ message: paymentData.message });
      }
      
      res.json({ 
        authorizationUrl: paymentData.data.authorization_url,
        reference: reference
      });
    } catch (error) {
      console.error('Deposit payment initialization error:', error);
      res.status(500).json({ message: "Error initializing deposit payment" });
    }
  });

  // Verify deposit payment
  app.post("/api/deposit/verify-payment", async (req, res) => {
    try {
      const { reference, userId, amount, currency } = req.body;
      
      // Verify payment with Paystack
      const verification = await paystackService.verifyPayment(reference);
      
      if (!verification.status || verification.data.status !== 'success') {
        return res.status(400).json({ message: "Payment verification failed" });
      }
      
      // Create transaction record
      const transaction = await storage.createTransaction({
        userId,
        type: 'deposit',
        amount: amount.toString(),
        currency: currency || 'USD',
        status: 'completed',
        description: `Deposit via Paystack - ${reference}`,
        fee: '0.00',
        paystackReference: reference
      });

      // Get user again to ensure balance is current
      const updatedUser = await storage.getUser(userId);
      if (!updatedUser) {
        return res.status(404).json({ message: "User not found" });
      }

      // Update user balance
      const currentBalance = parseFloat(updatedUser.balance || "0");
      const newBalance = currentBalance + depositAmount;
      await storage.updateUser(userId, { balance: newBalance.toFixed(2) });
      
      res.json({ 
        message: "Deposit successful",
        transaction
      });
    } catch (error) {
      console.error('Deposit verification error:', error);
      res.status(500).json({ message: "Error verifying deposit" });
    }
  });

  // Airtime purchase endpoint - uses KES balance and Statum API
  app.post("/api/airtime/purchase", optionalApiKey, async (req, res) => {
    try {
      const { userId, phoneNumber, amount, currency, provider, pin } = req.body;

      console.log(`📱 Airtime purchase request - User: ${userId}, Phone: ${phoneNumber}, Amount: ${amount} ${currency}, Provider: ${provider}`);

      if (!userId || !phoneNumber || !amount || !currency || !provider) {
        console.warn(`⚠️ Missing required fields in airtime purchase request`);
        return res.status(400).json({ message: "Missing required fields" });
      }

      // Get user
      const user = await storage.getUser(userId);
      if (!user) {
        console.error(`❌ User not found: ${userId}`);
        return res.status(404).json({ message: "User not found" });
      }

      console.log(`👤 User ${user.fullName} (${user.email}) - KES Balance: ${user.kesBalance}`);

      // Check PIN if required by admin settings
      const settings = await storage.getSystemSettings();
      const pinRequired = settings.some(s => s.key === "pin_required" && s.value === "true");
      
      if (pinRequired && user.pinEnabled) {
        if (!pin) {
          return res.status(400).json({ message: "PIN required", requiresPin: true });
        }
        
        // Verify PIN
        const isPinValid = await bcrypt.compare(pin, user.pinCode || "");
        if (!isPinValid) {
          return res.status(401).json({ message: "Invalid PIN", success: false });
        }
      }

      // Airtime purchases require KES balance
      const kesBalance = parseFloat(user.kesBalance || "0");
      const purchaseAmount = parseFloat(amount);
      
      if (kesBalance < purchaseAmount) {
        console.warn(`⚠️ Insufficient balance - Required: ${purchaseAmount}, Available: ${kesBalance}`);
        return res.status(400).json({ 
          message: "Insufficient KES balance. Please convert USD to KES using the Exchange feature." 
        });
      }

      // Call Statum API to purchase airtime
      console.log(`📞 Calling Statum API for airtime purchase...`);
      const statumResponse = await statumService.purchaseAirtime(phoneNumber, purchaseAmount);
      
      console.log(`✅ Statum API response:`, statumResponse);

      // Create transaction record
      const transaction = await storage.createTransaction({
        userId,
        type: "airtime",
        amount: amount.toString(),
        currency: "KES",
        status: "completed",
        fee: "0.00",
        description: `Airtime purchase for ${phoneNumber} (${provider})`,
        reference: statumResponse.transaction_id || undefined,
        recipientDetails: {
          phoneNumber,
          provider
        },
        metadata: {
          statumResponse
        }
      });

      console.log(`💾 Transaction created: ${transaction.id}`);

      // Update user KES balance
      const newKesBalance = kesBalance - purchaseAmount;
      await storage.updateUser(userId, { kesBalance: newKesBalance.toFixed(2) });
      
      console.log(`✅ Updated user balance: ${kesBalance} -> ${newKesBalance}`);
      console.log(`🎉 Airtime purchase completed successfully`);

      res.json({ 
        success: true,
        message: "Airtime purchased successfully",
        transaction,
        statumResponse
      });
    } catch (error) {
      console.error('❌ Airtime purchase error:', error);
      const errorMessage = error instanceof Error ? error.message : "Error purchasing airtime";
      res.status(500).json({ message: errorMessage });
    }
  });

  // Claim airtime bonus endpoint
  app.post("/api/airtime/claim-bonus", optionalApiKey, async (req, res) => {
    try {
      const { userId } = req.body;

      console.log(`🎁 Airtime bonus claim request - User: ${userId}`);

      if (!userId) {
        console.warn(`⚠️ Missing userId in bonus claim request`);
        return res.status(400).json({ message: "Missing userId" });
      }

      const user = await storage.getUser(userId);
      if (!user) {
        console.error(`❌ User not found: ${userId}`);
        return res.status(404).json({ message: "User not found" });
      }

      console.log(`👤 User ${user.fullName} - Already claimed: ${user.hasClaimedAirtimeBonus}`);

      // Check if user has already claimed the bonus
      if (user.hasClaimedAirtimeBonus) {
        console.warn(`⚠️ User ${userId} has already claimed airtime bonus`);
        return res.status(400).json({ message: "You have already claimed your airtime bonus" });
      }

      // Add KES 15 to user's KES balance
      const currentKesBalance = parseFloat(user.kesBalance || "0");
      const bonusAmount = 15;
      const newKesBalance = currentKesBalance + bonusAmount;

      await storage.updateUser(userId, { 
        kesBalance: newKesBalance.toFixed(2),
        hasClaimedAirtimeBonus: true
      });

      console.log(`💰 Bonus credited: ${currentKesBalance} -> ${newKesBalance} KES`);

      // Create transaction record for the bonus
      const transaction = await storage.createTransaction({
        userId,
        type: "deposit",
        amount: bonusAmount.toString(),
        currency: "KES",
        status: "completed",
        fee: "0.00",
        description: "One-time airtime bonus - KES 15"
      });

      console.log(`💾 Bonus transaction created: ${transaction.id}`);
      console.log(`✅ Airtime bonus claimed successfully`);

      res.json({
        success: true,
        message: "Airtime bonus claimed successfully! KES 15 has been added to your balance.",
        newBalance: newKesBalance.toFixed(2),
        bonusAmount,
        transaction
      });
    } catch (error) {
      console.error('❌ Claim bonus error:', error);
      res.status(500).json({ message: "Error claiming airtime bonus" });
    }
  });

  // Bill payment endpoint - KPLC, Zuku, StartimesTV, Nairobi Water, etc
  app.post("/api/bills/pay", optionalApiKey, async (req, res) => {
    try {
      const { userId, provider, meterNumber, accountNumber, amount } = req.body;

      console.log(`💳 Bill payment request - User: ${userId}, Provider: ${provider}, Amount: ${amount} KES`);

      if (!userId || !provider || !amount || (!meterNumber && !accountNumber)) {
        console.warn(`⚠️ Missing required fields in bill payment request`);
        return res.status(400).json({ message: "Missing required fields" });
      }

      const user = await storage.getUser(userId);
      if (!user) {
        console.error(`❌ User not found: ${userId}`);
        return res.status(404).json({ message: "User not found" });
      }

      console.log(`👤 User ${user.fullName} - KES Balance: ${user.kesBalance}`);

      const kesBalance = parseFloat(user.kesBalance || "0");
      const paymentAmount = parseFloat(amount);
      
      if (kesBalance < paymentAmount) {
        console.warn(`⚠️ Insufficient balance - Required: ${paymentAmount}, Available: ${kesBalance}`);
        return res.status(400).json({ 
          message: "Insufficient KES balance. Please convert USD to KES using the Exchange feature." 
        });
      }

      // Create bill payment record
      const billPayment = await storage.createBillPayment({
        userId,
        provider,
        meterNumber: meterNumber || null,
        accountNumber: accountNumber || null,
        amount: amount.toString(),
        currency: "KES",
        status: "completed",
        fee: "0.00",
        description: `Bill payment for ${provider}${meterNumber ? ` (${meterNumber})` : accountNumber ? ` (${accountNumber})` : ''}`,
        reference: `BP-${Date.now()}`,
        metadata: { meterNumber, accountNumber, provider }
      });

      console.log(`💾 Bill payment created: ${billPayment.id}`);

      // Create transaction record
      await storage.createTransaction({
        userId,
        type: "bill_payment",
        amount: amount.toString(),
        currency: "KES",
        status: "completed",
        fee: "0.00",
        description: `Bill payment - ${provider}`,
        reference: billPayment.reference,
        metadata: { billPaymentId: billPayment.id, provider }
      });

      // Update user KES balance
      const newKesBalance = kesBalance - paymentAmount;
      await storage.updateUser(userId, { kesBalance: newKesBalance.toFixed(2) });
      
      console.log(`✅ Updated user balance: ${kesBalance} -> ${newKesBalance}`);
      console.log(`🎉 Bill payment completed successfully`);

      res.json({ 
        success: true,
        message: "Bill payment successful",
        billPayment,
        newBalance: newKesBalance.toFixed(2)
      });
    } catch (error) {
      console.error('❌ Bill payment error:', error);
      const errorMessage = error instanceof Error ? error.message : "Error processing bill payment";
      res.status(500).json({ message: errorMessage });
    }
  });

  // Get bill payments history
  app.get("/api/bills/history/:userId", requireAuth, async (req, res) => {
    try {
      const payments = await storage.getBillPaymentsByUserId(req.params.userId);
      res.json({ payments });
    } catch (error) {
      console.error('Error fetching bill payments:', error);
      res.status(500).json({ message: "Error fetching bill payments" });
    }
  });

  app.get("/api/virtual-card/:userId", requireAuth, async (req, res) => {
    try {
      const card = await storage.getVirtualCardByUserId(req.params.userId);
      res.json({ card });
    } catch (error) {
      res.status(500).json({ message: "Error fetching virtual card" });
    }
  });

  // Exchange rates API
  // Create exchange rate service with storage for database-backed configuration
  const exchangeRateService = createExchangeRateService(storage);
  
  app.get("/api/exchange-rates/:from/:to", optionalApiKey, async (req, res) => {
    try {
      const { from, to } = req.params;
      const rate = await exchangeRateService.getExchangeRate(from.toUpperCase(), to.toUpperCase());
      
      res.json({ 
        from: from.toUpperCase(),
        to: to.toUpperCase(),
        rate,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Exchange rate error:', error);
      res.status(500).json({ message: "Error fetching exchange rate" });
    }
  });

  app.get("/api/exchange-rates/:base", optionalApiKey, async (req, res) => {
    try {
      const { base } = req.params;
      // Support bidirectional USD ↔ KES conversions
      const targets = base.toUpperCase() === 'USD' ? ['KES'] : ['USD'];
      const rates = await exchangeRateService.getMultipleRates(base.toUpperCase(), targets);
      
      res.json({ 
        base: base.toUpperCase(),
        rates,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Multiple exchange rates error:', error);
      res.status(500).json({ message: "Error fetching exchange rates" });
    }
  });


  // Real-time Transaction routes
  app.post("/api/transactions/send", optionalApiKey, async (req, res) => {
    try {
      const { userId, amount, currency, recipientDetails, targetCurrency } = req.body;
      
      // Verify user has virtual card
      const user = await storage.getUser(userId);
      if (!user?.hasVirtualCard) {
        return res.status(400).json({ message: "Virtual card required for transactions" });
      }

      // Get real-time exchange rate
      const exchangeRate = await exchangeRateService.getExchangeRate(currency, targetCurrency);
      const convertedAmount = (parseFloat(amount) * exchangeRate).toFixed(2);
      const fee = (parseFloat(amount) * 0.02).toFixed(2); // 2% fee
      
      // Create transaction
      const transaction = await storage.createTransaction({
        userId,
        type: "send",
        amount,
        currency,
        recipientDetails,
        status: "processing",
        fee,
        exchangeRate: exchangeRate.toString(),
        description: `Sent to ${recipientDetails.name}`,
        metadata: {
          convertedAmount,
          targetCurrency,
          processingStarted: new Date().toISOString()
        }
      });

      // Simulate processing time (in real app, this would be async)
      setTimeout(async () => {
        try {
          await storage.updateTransaction(transaction.id, { 
            status: "completed",
            completedAt: new Date()
          });
          
          // Send notification
          await notificationService.sendTransactionNotification(userId, {
            ...transaction,
            status: "completed"
          });
          
          // Send transaction notification via SMS and WhatsApp
          const { messagingService } = await import('./services/messaging');
          messagingService.sendTransactionNotification(user.phone, 'send', amount, currency, 'completed')
            .catch(err => console.error('Transaction notification error:', err));
        } catch (error) {
          console.error('Transaction completion error:', error);
        }
      }, 5000); // 5 second delay
      
      res.json({ 
        transaction,
        convertedAmount,
        exchangeRate,
        message: "Transaction initiated successfully"
      });
    } catch (error) {
      console.error('Send transaction error:', error);
      res.status(400).json({ message: "Transaction failed" });
    }
  });

  app.post("/api/transactions/receive", optionalApiKey, async (req, res) => {
    try {
      const { userId, amount, currency, senderDetails } = req.body;
      
      const transaction = await storage.createTransaction({
        userId,
        type: "receive",
        amount,
        currency,
        recipientDetails: senderDetails,
        status: "completed",
        fee: "0.00",
        description: `Received from ${senderDetails.name}`
      });

      // Update user balance
      const user = await storage.getUser(userId);
      const newBalance = (parseFloat(user?.balance || "0") + parseFloat(amount)).toFixed(2);
      await storage.updateUser(userId, { balance: newBalance });
      
      // Send notification
      await notificationService.sendTransactionNotification(userId, transaction);
      
      // Send fund receipt notification via SMS, WhatsApp, and Email
      if (user) {
        const { messagingService } = await import('./services/messaging');
        const { mailtrapService } = await import('./services/mailtrap');
        messagingService.sendFundReceipt(user.phone, amount, currency, senderDetails.name)
          .catch(err => console.error('Fund receipt notification error:', err));
        if (user.email) {
          mailtrapService.sendFundReceipt(user.email, user.fullName?.split(' ')[0] || 'User', user.fullName?.split(' ')[1] || '', amount, currency, senderDetails.name)
            .catch(err => console.error('Fund receipt email error:', err));
        }
      }
      
      res.json({ transaction, message: "Payment received successfully" });
    } catch (error) {
      console.error('Receive transaction error:', error);
      res.status(400).json({ message: "Transaction failed" });
    }
  });

  app.get("/api/transactions/:userId", requireAuth, async (req, res) => {
    try {
      const transactions = await storage.getTransactionsByUserId(req.params.userId);
      res.json({ transactions });
    } catch (error) {
      res.status(500).json({ message: "Error fetching transactions" });
    }
  });

  app.get("/api/transactions/status/:transactionId", optionalApiKey, async (req, res) => {
    try {
      const transaction = await storage.getTransaction(req.params.transactionId);
      if (!transaction) {
        return res.status(404).json({ message: "Transaction not found" });
      }
      res.json({ transaction });
    } catch (error) {
      res.status(500).json({ message: "Error fetching transaction status" });
    }
  });

  // Export transactions to email with PDF attachment
  app.post("/api/transactions/export-email", requireAuth, async (req, res) => {
    try {
      const { transactions } = req.body;
      const userId = (req.session as any).userId;

      if (!transactions || !Array.isArray(transactions)) {
        return res.status(400).json({ message: "Transactions array required" });
      }

      if (transactions.length === 0) {
        return res.status(400).json({ message: "No transactions to export" });
      }

      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Build transaction summary
      let totalSent = 0;
      let totalReceived = 0;
      let transactionCount = transactions.length;

      transactions.forEach((txn: any) => {
        const amount = parseFloat(txn.amount);
        if (txn.type === 'send' || txn.type === 'withdraw') {
          totalSent += amount;
        } else if (txn.type === 'receive' || txn.type === 'deposit') {
          totalReceived += amount;
        }
      });

      // Generate PDF
      const { generateTransactionPDF } = await import('./lib/pdf-export');
      const pdfBuffer = await generateTransactionPDF(transactions, {
        fullName: user.fullName,
        email: user.email,
        phone: user.phone
      });

      const pdfBase64 = Buffer.from(pdfBuffer).toString('base64');

      const generatedOn = new Date().toLocaleString('en-US', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      });

      const templateVariables: any = {
        user_name: user.fullName || user.email,
        total_transactions: transactionCount.toString(),
        total_sent: totalSent.toFixed(2),
        total_received: totalReceived.toFixed(2),
        generated_on: generatedOn,
        account_email: user.email,
      };

      const attachments = [
        {
          filename: `transactions-${new Date().toISOString().split('T')[0]}.pdf`,
          content: pdfBase64,
          disposition: 'attachment'
        }
      ];

      // Send via Mailtrap
      const { MailtrapService } = await import('./services/mailtrap');
      const mailtrapService = new MailtrapService();
      
      const success = await mailtrapService.sendTemplate(
        user.email,
        '307e5609-66bb-4235-8653-27f0d5d74a39',
        templateVariables,
        attachments
      );

      if (success) {
        console.log(`✅ Transaction export email sent to ${user.email} - ${transactionCount} transactions with PDF`);
        res.json({
          success: true,
          message: "Transaction report sent successfully to your email",
          summary: {
            transactionCount,
            totalSent,
            totalReceived
          }
        });
      } else {
        res.status(500).json({ message: "Failed to send export email" });
      }
    } catch (error) {
      console.error('Transaction export error:', error);
      res.status(500).json({ message: "Error exporting transactions to email" });
    }
  });

  // 2FA routes
  app.post("/api/auth/2fa/setup", async (req, res) => {
    try {
      const { userId } = req.body;
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const { secret, qrCodeUrl, backupCodes } = twoFactorService.generateSecret(user.email);
      
      // Store secret and backup codes temporarily (user needs to verify before enabling)
      await storage.updateUser(userId, { 
        twoFactorSecret: secret,
        twoFactorBackupCodes: JSON.stringify(backupCodes)
      });
      
      res.json({ qrCodeUrl, backupCodes, secret });
    } catch (error) {
      console.error('2FA setup error:', error);
      res.status(500).json({ message: "Error setting up 2FA" });
    }
  });

  app.post("/api/auth/2fa/verify", async (req, res) => {
    try {
      const { userId, token } = req.body;
      const user = await storage.getUser(userId);
      
      if (!user?.twoFactorSecret) {
        return res.status(400).json({ message: "2FA not set up" });
      }

      const isValid = twoFactorService.verifyToken(user.twoFactorSecret, token);
      
      if (isValid) {
        await storage.updateUser(userId, { 
          twoFactorEnabled: true,
          twoFactorBackupCodes: user.twoFactorBackupCodes || JSON.stringify([])
        });
        res.json({ success: true, message: "2FA enabled successfully" });
      } else {
        res.status(400).json({ message: "Invalid 2FA token" });
      }
    } catch (error) {
      console.error('2FA verification error:', error);
      res.status(500).json({ message: "Error verifying 2FA" });
    }
  });

  app.post("/api/users/:userId/disable-2fa", requireAuth, async (req, res) => {
    try {
      const { userId } = req.params;
      const { password } = req.body;
      
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      if (password) {
        const isPasswordValid = await bcrypt.compare(password, user.passwordHash || '');
        if (!isPasswordValid) {
          return res.status(401).json({ message: "Invalid password" });
        }
      }

      await storage.updateUser(userId, { 
        twoFactorEnabled: false,
        twoFactorSecret: null,
        twoFactorBackupCodes: null
      });
      
      const updatedUser = await storage.getUser(userId);
      res.json({ success: true, message: "2FA disabled", user: updatedUser });
    } catch (error) {
      console.error('Disable 2FA error:', error);
      res.status(500).json({ message: "Error disabling 2FA" });
    }
  });

  // Biometric authentication routes
  app.post("/api/auth/biometric/setup", async (req, res) => {
    try {
      const { userId, credentialId } = req.body;
      
      if (!credentialId) {
        return res.status(400).json({ message: "Invalid credential" });
      }

      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Store biometric credential as JSON string
      await storage.updateUser(userId, { 
        biometricEnabled: true,
        biometricCredentialId: JSON.stringify({ credentialId })
      });
      
      res.json({ success: true, message: "Biometric authentication enabled" });
    } catch (error) {
      console.error('Biometric setup error:', error);
      res.status(500).json({ message: "Error setting up biometric authentication" });
    }
  });

  app.post("/api/auth/biometric/verify", async (req, res) => {
    try {
      const { userId, credentialId } = req.body;
      
      const user = await storage.getUser(userId);
      if (!user || !user.biometricEnabled) {
        return res.status(400).json({ message: "Biometric not enabled" });
      }

      // Verify the credential matches
      const storedCred = user.biometricCredentialId ? JSON.parse(user.biometricCredentialId) : null;
      if (storedCred && storedCred.credentialId === credentialId) {
        res.json({ success: true, verified: true });
      } else {
        res.status(401).json({ success: false, verified: false });
      }
    } catch (error) {
      console.error('Biometric verification error:', error);
      res.status(500).json({ message: "Error verifying biometric" });
    }
  });

  app.post("/api/users/:userId/disable-biometric", async (req, res) => {
    try {
      const { userId } = req.params;
      
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      await storage.updateUser(userId, { 
        biometricEnabled: false,
        biometricCredentialId: null
      });
      
      const updatedUser = await storage.getUser(userId);
      const { password, ...userResponse } = updatedUser || {};
      res.json({ success: true, message: "Biometric disabled", user: userResponse });
    } catch (error) {
      console.error('Disable biometric error:', error);
      res.status(500).json({ message: "Error disabling biometric" });
    }
  });

  app.post("/api/auth/biometric/login", async (req, res) => {
    try {
      const { credentialId } = req.body;
      
      if (!credentialId) {
        return res.status(400).json({ message: "Invalid credential" });
      }

      // Find user with matching biometric credential
      const allUsers = await storage.getAllUsers({ limit: 1000 });
      const users = Array.isArray(allUsers) ? allUsers : (allUsers?.users || []);
      
      const user = users.find((u: any) => {
        try {
          const stored = u.biometricCredentialId ? (
            typeof u.biometricCredentialId === 'string'
              ? JSON.parse(u.biometricCredentialId)
              : u.biometricCredentialId
          ) : null;
          return stored && stored.credentialId === credentialId && u.biometricEnabled;
        } catch {
          return false;
        }
      });
      
      if (!user) {
        return res.status(401).json({ message: "Biometric credential not found" });
      }

      // Create session
      const tokenData = { userId: user.id };
      const token = Buffer.from(JSON.stringify(tokenData)).toString("base64");
      
      const { password, ...userResponse } = user;
      res.json({ success: true, user: userResponse, token });
    } catch (error) {
      console.error('Biometric login error:', error);
      res.status(500).json({ message: "Error during biometric login" });
    }
  });

  // Middleware to verify biometric for crucial activities
  async function verifyBiometricForActivity(req: any, res: any, next: any) {
    try {
      const userId = req.user?.id || req.body?.userId;
      if (!userId) return next();

      const user = await storage.getUser(userId);
      if (!user || !user.biometricEnabled) return next(); // Skip if not enabled

      // For crucial activities when biometric is enabled, require verification
      if (req.headers['x-require-biometric'] === 'true') {
        const { biometricVerified } = req.body;
        if (!biometricVerified) {
          return res.status(401).json({ message: "Biometric verification required" });
        }
      }
      
      next();
    } catch (error) {
      next();
    }
  }

  app.use(verifyBiometricForActivity);

  // Push notifications
  app.post("/api/notifications/register", async (req, res) => {
    try {
      const { userId, token } = req.body;
      
      const success = await notificationService.registerPushToken(userId, token);
      
      if (success) {
        res.json({ success: true, message: "Push notifications registered" });
      } else {
        res.status(400).json({ message: "Failed to register push notifications" });
      }
    } catch (error) {
      console.error('Push notification registration error:', error);
      res.status(500).json({ message: "Error registering push notifications" });
    }
  });

  // Recipient management routes
  app.post("/api/recipients", optionalApiKey, async (req, res) => {
    try {
      const recipientData = insertRecipientSchema.parse(req.body);
      const recipient = await storage.createRecipient(recipientData);
      res.json({ recipient, message: "Recipient added successfully" });
    } catch (error) {
      console.error('Create recipient error:', error);
      res.status(400).json({ message: "Invalid recipient data" });
    }
  });

  app.get("/api/recipients/:userId", optionalApiKey, async (req, res) => {
    try {
      const recipients = await storage.getRecipientsByUserId(req.params.userId);
      res.json({ recipients });
    } catch (error) {
      res.status(500).json({ message: "Error fetching recipients" });
    }
  });

  app.put("/api/recipients/:id", async (req, res) => {
    try {
      const recipient = await storage.updateRecipient(req.params.id, req.body);
      if (recipient) {
        res.json({ recipient, message: "Recipient updated successfully" });
      } else {
        res.status(404).json({ message: "Recipient not found" });
      }
    } catch (error) {
      console.error('Update recipient error:', error);
      res.status(500).json({ message: "Error updating recipient" });
    }
  });

  app.delete("/api/recipients/:id", async (req, res) => {
    try {
      await storage.deleteRecipient(req.params.id);
      res.json({ message: "Recipient deleted successfully" });
    } catch (error) {
      console.error('Delete recipient error:', error);
      res.status(500).json({ message: "Error deleting recipient" });
    }
  });

  // User settings and profile updates
  app.put("/api/users/:userId/settings", async (req, res) => {
    try {
      const { userId } = req.params;
      const { defaultCurrency, pushNotificationsEnabled, twoFactorEnabled, biometricEnabled, ...settings } = req.body;
      
      // Save settings to user profile
      const updateData = { ...settings };
      if (defaultCurrency) updateData.defaultCurrency = defaultCurrency;
      if (pushNotificationsEnabled !== undefined) updateData.pushNotificationsEnabled = pushNotificationsEnabled;
      if (twoFactorEnabled !== undefined) updateData.twoFactorEnabled = twoFactorEnabled;
      if (biometricEnabled !== undefined) updateData.biometricEnabled = biometricEnabled;
      if (darkMode !== undefined) updateData.darkMode = darkMode;
      
      const user = await storage.updateUser(userId, updateData);
      
      if (user) {
        const { password, ...userResponse } = user;
        res.json({ user: userResponse, message: "Settings updated successfully" });
      } else {
        res.status(404).json({ message: "User not found" });
      }
    } catch (error) {
      console.error('Settings update error:', error);
      res.status(500).json({ message: "Error updating settings" });
    }
  });

  // Real-time exchange and currency conversion - supports dual wallet (USD/KES)
  app.post("/api/exchange/convert", optionalApiKey, async (req, res) => {
    try {
      const { amount, fromCurrency, toCurrency, userId } = req.body;
      
      // Get user
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Verify user has virtual card for exchanges
      if (!user.hasVirtualCard) {
        return res.status(400).json({ message: "Virtual card required for currency exchanges" });
      }

      const exchangeAmount = parseFloat(amount);
      const fee = (exchangeAmount * 0.015).toFixed(2); // 1.5% exchange fee
      const totalDeducted = exchangeAmount + parseFloat(fee);

      // Get exchange rate
      const exchangeRate = await exchangeRateService.getExchangeRate(fromCurrency, toCurrency);
      const convertedAmount = (exchangeAmount * exchangeRate).toFixed(2);

      // Handle dual wallet balance updates (USD <-> KES)
      const currentUsdBalance = parseFloat(user.balance || "0");
      const currentKesBalance = parseFloat(user.kesBalance || "0");
      
      let newUsdBalance = currentUsdBalance;
      let newKesBalance = currentKesBalance;

      // Check balance and update appropriate wallet
      if (fromCurrency === 'USD' && toCurrency === 'KES') {
        // Converting USD to KES
        if (currentUsdBalance < totalDeducted) {
          return res.status(400).json({ message: "Insufficient USD balance" });
        }
        newUsdBalance = currentUsdBalance - totalDeducted;
        newKesBalance = currentKesBalance + parseFloat(convertedAmount);
      } else if (fromCurrency === 'KES' && toCurrency === 'USD') {
        // Converting KES to USD
        if (currentKesBalance < totalDeducted) {
          return res.status(400).json({ message: "Insufficient KES balance" });
        }
        newKesBalance = currentKesBalance - totalDeducted;
        newUsdBalance = currentUsdBalance + parseFloat(convertedAmount);
      } else {
        // For other currency pairs, use USD balance
        if (currentUsdBalance < totalDeducted) {
          return res.status(400).json({ message: "Insufficient USD balance" });
        }
        newUsdBalance = currentUsdBalance - totalDeducted;
      }

      // Update user balances
      await storage.updateUser(userId, {
        balance: newUsdBalance.toFixed(2),
        kesBalance: newKesBalance.toFixed(2)
      });
      
      // Create exchange transaction
      const transaction = await storage.createTransaction({
        userId,
        type: "exchange",
        amount: amount.toString(),
        currency: fromCurrency,
        status: "completed",
        fee,
        exchangeRate: exchangeRate.toString(),
        description: `Exchanged ${amount} ${fromCurrency} to ${convertedAmount} ${toCurrency}`,
        metadata: {
          targetCurrency: toCurrency,
          convertedAmount,
          exchangeType: "instant"
        }
      });
      
      res.json({ 
        transaction,
        convertedAmount,
        exchangeRate,
        fee,
        message: "Currency exchanged successfully"
      });
    } catch (error) {
      console.error('Exchange error:', error);
      res.status(400).json({ message: "Exchange failed" });
    }
  });

  // Payment Request routes with working payment links
  app.post("/api/payment-requests", async (req, res) => {
    try {
      const requestData = insertPaymentRequestSchema.parse(req.body);
      
      // Generate unique payment link
      const paymentId = Math.random().toString(36).substring(2, 15);
      const paymentLink = `${req.protocol}://${req.get('host')}/pay/${paymentId}`;
      
      const request = await storage.createPaymentRequest({
        ...requestData,
        paymentLink,
      });
      
      // Send notification if recipient has account
      if (requestData.toEmail || requestData.toPhone) {
        await notificationService.sendNotification({
          title: "Payment Request",
          body: `You have received a payment request for ${requestData.currency} ${requestData.amount}`,
          userId: requestData.fromUserId,
          type: "general",
          metadata: { paymentRequestId: request.id }
        });
      }
      
      res.json({ request, message: "Payment request created successfully" });
    } catch (error) {
      console.error('Payment request error:', error);
      res.status(400).json({ message: "Invalid payment request data" });
    }
  });

  app.get("/api/payment-requests/:userId", async (req, res) => {
    try {
      const requests = await storage.getPaymentRequestsByUserId(req.params.userId);
      res.json({ requests });
    } catch (error) {
      res.status(500).json({ message: "Error fetching payment requests" });
    }
  });

  app.post("/api/payment-requests/:id/pay", async (req, res) => {
    try {
      const { id } = req.params;
      const { payerUserId } = req.body;
      
      const paymentRequest = await storage.getPaymentRequest(id);
      if (!paymentRequest) {
        return res.status(404).json({ message: "Payment request not found" });
      }

      if (paymentRequest.status !== 'pending') {
        return res.status(400).json({ message: "Payment request already processed" });
      }

      // Process payment
      const transaction = await storage.createTransaction({
        userId: payerUserId,
        type: "send",
        amount: paymentRequest.amount.toString(),
        currency: paymentRequest.currency,
        recipientDetails: { paymentRequestId: id },
        status: "completed",
        fee: "0.00",
        description: `Payment for request: ${paymentRequest.message || 'Payment request'}`
      });

      // Mark payment request as paid
      await storage.updatePaymentRequest(id, { status: 'paid' });
      
      // Notify requester
      await notificationService.sendNotification({
        title: "Payment Received",
        body: `Your payment request for ${paymentRequest.currency} ${paymentRequest.amount} has been paid`,
        userId: paymentRequest.fromUserId,
        type: "transaction"
      });
      
      res.json({ transaction, message: "Payment completed successfully" });
    } catch (error) {
      console.error('Payment processing error:', error);
      res.status(500).json({ message: "Error processing payment" });
    }
  });

  // Admin Authentication Routes
  app.post("/api/admin/login", async (req, res) => {
    try {
      const { email, password, twoFactorCode } = req.body;
      
      const admin = await storage.getAdminByEmail(email);
      if (!admin || !admin.isActive) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      const validPassword = await bcrypt.compare(password, admin.password);
      if (!validPassword) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      // Check 2FA if enabled
      if (admin.twoFactorEnabled && admin.twoFactorSecret) {
        if (!twoFactorCode) {
          return res.status(401).json({ 
            message: "2FA code required", 
            requiresTwoFactor: true 
          });
        }

        const verified = speakeasy.totp.verify({
          secret: admin.twoFactorSecret,
          encoding: 'ascii',
          token: twoFactorCode,
          window: 2
        });

        if (!verified) {
          return res.status(401).json({ message: "Invalid 2FA code" });
        }
      }

      // Only after ALL authentication checks pass - regenerate session to prevent fixation
      req.session.regenerate((err) => {
        if (err) {
          console.error('Admin session regeneration error:', err);
          return res.status(500).json({ message: "Session error" });
        }

        // Update last login
        storage.updateAdmin(admin.id, { lastLoginAt: new Date() }).catch(updateErr => {
          console.error('Admin update error:', updateErr);
        });

        // Set admin session data only after successful authentication
        req.session.admin = {
          id: admin.id,
          email: admin.email,
          fullName: admin.fullName,
          role: admin.role,
          isActive: admin.isActive
        };

        // Log admin login
        storage.createAdminLog({
          adminId: admin.id,
          action: "LOGIN",
          ipAddress: req.ip,
          userAgent: req.get('User-Agent') || null
        }).catch(logErr => {
          console.error('Admin log error:', logErr);
        });

        // Save session before responding
        req.session.save((saveErr) => {
          if (saveErr) {
            console.error('Admin session save error:', saveErr);
            return res.status(500).json({ message: "Session save error" });
          }
          
          const { password: _, ...adminData } = admin;
          res.json({ 
            admin: adminData,
            message: "Login successful"
          });
        });
      });
    } catch (error) {
      console.error('Admin login error:', error);
      res.status(500).json({ message: "Login failed" });
    }
  });

  // Admin Dashboard Data
  app.get("/api/admin/dashboard", async (req, res) => {
    try {
      const [
        usersCount,
        transactionsCount,
        { volume, revenue },
        allUsers,
        allTransactions,
        kycDocuments
      ] = await Promise.all([
        storage.getUsersCount(),
        storage.getTransactionsCount(),
        storage.getTotalVolume(),
        storage.getAllUsers(),
        storage.getAllTransactions(),
        storage.getAllKycDocuments()
      ]);

      const activeUsers = allUsers.filter(u => u.isEmailVerified || u.isPhoneVerified).length;
      const pendingKyc = kycDocuments.filter(d => d.status === 'pending').length;
      const completedTransactions = allTransactions.filter(t => t.status === 'completed').length;
      const pendingTransactions = allTransactions.filter(t => t.status === 'pending').length;

      // Calculate daily transaction trends (last 7 days)
      const today = new Date();
      const last7Days = Array.from({ length: 7 }, (_, i) => {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        return date.toISOString().split('T')[0];
      }).reverse();

      const transactionTrends = last7Days.map(date => {
        const dayTransactions = allTransactions.filter(t => 
          t.createdAt && t.createdAt.toISOString().split('T')[0] === date
        );
        return {
          date,
          count: dayTransactions.length,
          volume: dayTransactions.reduce((sum, t) => sum + parseFloat(t.amount), 0)
        };
      });

      res.json({
        metrics: {
          totalUsers: usersCount,
          activeUsers,
          blockedUsers: allUsers.filter(u => !u.isEmailVerified && !u.isPhoneVerified).length,
          totalTransactions: transactionsCount,
          completedTransactions,
          pendingTransactions,
          totalVolume: volume,
          totalRevenue: revenue,
          pendingKyc
        },
        transactionTrends,
        recentTransactions: allTransactions.slice(0, 10)
      });
    } catch (error) {
      console.error('Dashboard data error:', error);
      res.status(500).json({ message: "Failed to load dashboard data" });
    }
  });

  // Admin User Management
  app.get("/api/admin/users", async (req, res) => {
    try {
      const { page = 1, limit = 20, status, search } = req.query;
      let users = await storage.getAllUsers();

      // Filter by status
      if (status) {
        users = users.filter(user => {
          switch (status) {
            case 'active': return user.isEmailVerified || user.isPhoneVerified;
            case 'pending': return user.kycStatus === 'pending';
            case 'verified': return user.kycStatus === 'verified';
            case 'blocked': return !user.isEmailVerified && !user.isPhoneVerified;
            default: return true;
          }
        });
      }

      // Search filter
      if (search) {
        const searchTerm = search.toString().toLowerCase();
        users = users.filter(user => 
          user.fullName.toLowerCase().includes(searchTerm) ||
          user.email.toLowerCase().includes(searchTerm) ||
          user.phone.includes(searchTerm)
        );
      }

      // Pagination
      const startIndex = (Number(page) - 1) * Number(limit);
      const paginatedUsers = users.slice(startIndex, startIndex + Number(limit));

      res.json({
        users: paginatedUsers,
        total: users.length,
        page: Number(page),
        totalPages: Math.ceil(users.length / Number(limit))
      });
    } catch (error) {
      console.error('Users fetch error:', error);
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });

  // Admin KYC Management
  app.get("/api/admin/kyc", async (req, res) => {
    try {
      const kycDocuments = await storage.getAllKycDocuments();
      res.json({ kycDocuments });
    } catch (error) {
      console.error('KYC fetch error:', error);
      res.status(500).json({ message: "Failed to fetch KYC documents" });
    }
  });

  app.put("/api/admin/kyc/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const { status, verificationNotes } = req.body;
      
      const updatedKyc = await storage.updateKycDocument(id, {
        status,
        verificationNotes,
        verifiedAt: status === 'verified' ? new Date() : null
      });

      if (updatedKyc) {
        // Update user KYC status
        await storage.updateUser(updatedKyc.userId, { kycStatus: status });
        
        // Send KYC verified notification via SMS, WhatsApp, and Email
        if (status === 'verified') {
          const user = await storage.getUser(updatedKyc.userId);
          if (user) {
            const { messagingService } = await import('./services/messaging');
            const { mailtrapService } = await import('./services/mailtrap');
            
            Promise.all([
              messagingService.sendKYCVerified(user.phone),
              user.email ? mailtrapService.sendKYCVerified(
                user.email,
                user.firstName || 'User',
                user.lastName || ''
              ) : Promise.resolve(false)
            ]).catch(err => console.error('KYC notification error:', err));
          }
        }
      }

      res.json({ kyc: updatedKyc });
    } catch (error) {
      console.error('KYC update error:', error);
      res.status(500).json({ message: "Failed to update KYC" });
    }
  });

  // Admin Transaction Management
  app.get("/api/admin/transactions", async (req, res) => {
    try {
      const { page = 1, limit = 20, status, type } = req.query;
      let transactions = await storage.getAllTransactions();

      // Filters
      if (status) {
        transactions = transactions.filter(t => t.status === status);
      }
      if (type) {
        transactions = transactions.filter(t => t.type === type);
      }

      // Pagination
      const startIndex = (Number(page) - 1) * Number(limit);
      const paginatedTransactions = transactions.slice(startIndex, startIndex + Number(limit));

      res.json({
        transactions: paginatedTransactions,
        total: transactions.length,
        page: Number(page),
        totalPages: Math.ceil(transactions.length / Number(limit))
      });
    } catch (error) {
      console.error('Transactions fetch error:', error);
      res.status(500).json({ message: "Failed to fetch transactions" });
    }
  });

  // Admin Virtual Cards Management
  app.get("/api/admin/virtual-cards", async (req, res) => {
    try {
      const cards = await storage.getAllVirtualCards();
      res.json({ cards });
    } catch (error) {
      console.error('Virtual cards fetch error:', error);
      res.status(500).json({ message: "Failed to fetch virtual cards" });
    }
  });

  // Admin Logs
  app.get("/api/admin/logs", async (req, res) => {
    try {
      const logs = await storage.getAdminLogs();
      res.json({ logs });
    } catch (error) {
      console.error('Admin logs fetch error:', error);
      res.status(500).json({ message: "Failed to fetch admin logs" });
    }
  });

  // Admin User Actions
  app.put("/api/admin/users/:id/block", async (req, res) => {
    try {
      const { id } = req.params;
      
      await storage.updateUser(id, {
        isEmailVerified: false,
        isPhoneVerified: false
      });

      res.json({ message: "User blocked successfully" });
    } catch (error) {
      console.error('Block user error:', error);
      res.status(500).json({ message: "Failed to block user" });
    }
  });

  app.put("/api/admin/users/:id/unblock", async (req, res) => {
    try {
      const { id } = req.params;
      
      await storage.updateUser(id, {
        isEmailVerified: true,
        isPhoneVerified: true
      });

      res.json({ message: "User unblocked successfully" });
    } catch (error) {
      console.error('Unblock user error:', error);
      res.status(500).json({ message: "Failed to unblock user" });
    }
  });

  // Admin User Account Management
  app.put("/api/admin/users/:id/account", async (req, res) => {
    try {
      const { id } = req.params;
      const { action } = req.body;

      const user = await storage.getUser(id);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      let updateData: any = {};
      let logMessage = "";

      switch (action) {
        case "block":
          updateData = { isEmailVerified: false, isPhoneVerified: false };
          logMessage = `Admin blocked user account: ${user.email}`;
          break;
        case "unblock":
          updateData = { isEmailVerified: true, isPhoneVerified: true };
          logMessage = `Admin unblocked user account: ${user.email}`;
          break;
        case "force_logout":
          // In a real app, you'd invalidate all user sessions
          logMessage = `Admin forced logout for user: ${user.email}`;
          break;
        case "reset_password":
          // In a real app, you'd generate and send a reset token
          logMessage = `Admin initiated password reset for user: ${user.email}`;
          break;
        default:
          return res.status(400).json({ message: "Invalid action" });
      }

      if (Object.keys(updateData).length > 0) {
        await storage.updateUser(id, updateData);
      }

      // Log admin action
      await storage.createAdminLog({
        adminId: req.session.admin?.id || null,
        action: `user_account_${action}`,
        details: logMessage,
        targetId: id,
      });

      res.json({ message: "Account action completed successfully" });
    } catch (error) {
      console.error('Admin account action error:', error);
      res.status(500).json({ message: "Failed to perform account action" });
    }
  });

  // Admin User Security Management
  app.put("/api/admin/users/:id/security", async (req, res) => {
    try {
      const { id } = req.params;
      const { action } = req.body;

      const user = await storage.getUser(id);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      let updateData: any = {};
      let logMessage = "";

      switch (action) {
        case "reset_2fa":
          updateData = { twoFactorSecret: null, twoFactorEnabled: false };
          logMessage = `Admin reset 2FA for user: ${user.email}`;
          break;
        case "verify_email":
          updateData = { isEmailVerified: true };
          logMessage = `Admin manually verified email for user: ${user.email}`;
          break;
        case "verify_phone":
          updateData = { isPhoneVerified: true };
          logMessage = `Admin manually verified phone for user: ${user.email}`;
          break;
        default:
          return res.status(400).json({ message: "Invalid security action" });
      }

      await storage.updateUser(id, updateData);

      // Log admin action
      await storage.createAdminLog({
        adminId: req.session.admin?.id || null,
        action: `user_security_${action}`,
        details: logMessage,
        targetId: id,
      });

      res.json({ message: "Security action completed successfully" });
    } catch (error) {
      console.error('Admin security action error:', error);
      res.status(500).json({ message: "Failed to perform security action" });
    }
  });

  // Admin User Notification Settings
  app.put("/api/admin/users/:id/notifications", async (req, res) => {
    try {
      const { id } = req.params;
      const { action } = req.body;

      const user = await storage.getUser(id);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      let updateData: any = {};
      let logMessage = "";

      switch (action) {
        case "enable_notifications":
          updateData = { pushNotificationsEnabled: true };
          logMessage = `Admin enabled notifications for user: ${user.email}`;
          break;
        case "disable_notifications":
          updateData = { pushNotificationsEnabled: false };
          logMessage = `Admin disabled notifications for user: ${user.email}`;
          break;
        default:
          return res.status(400).json({ message: "Invalid notification action" });
      }

      await storage.updateUser(id, updateData);

      // Log admin action
      await storage.createAdminLog({
        adminId: req.session.admin?.id || null,
        action: `user_notifications_${action}`,
        details: logMessage,
        targetId: id,
      });

      res.json({ message: "Notification settings updated successfully" });
    } catch (error) {
      console.error('Admin notification action error:', error);
      res.status(500).json({ message: "Failed to update notification settings" });
    }
  });

  // Export User Data
  app.get("/api/admin/users/:id/export", async (req, res) => {
    try {
      const { id } = req.params;

      const user = await storage.getUser(id);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Get all related data
      const kyc = await storage.getKycByUserId(id);
      const virtualCard = await storage.getVirtualCardByUserId(id);
      const transactions = await storage.getTransactionsByUserId(id);
      const recipients = await storage.getRecipientsByUserId(id);
      const paymentRequests = await storage.getPaymentRequestsByUserId(id);

      // Create export data object (excluding sensitive information)
      const exportData = {
        user: {
          id: user.id,
          fullName: user.fullName,
          email: user.email,
          phone: user.phone,
          country: user.country,
          kycStatus: user.kycStatus,
          isEmailVerified: user.isEmailVerified,
          isPhoneVerified: user.isPhoneVerified,
          hasVirtualCard: user.hasVirtualCard,
          balance: user.balance,
          twoFactorEnabled: user.twoFactorEnabled,
          createdAt: user.createdAt,
        },
        kyc: kyc ? {
          status: kyc.status,
          documentType: kyc.documentType,
          verifiedAt: kyc.verifiedAt,
          createdAt: kyc.createdAt,
        } : null,
        virtualCard: virtualCard ? {
          status: virtualCard.status,
          balance: virtualCard.balance,
          purchaseAmount: virtualCard.purchaseAmount,
          purchaseDate: virtualCard.purchaseDate,
        } : null,
        transactions: transactions.map(tx => ({
          id: tx.id,
          type: tx.type,
          amount: tx.amount,
          currency: tx.currency,
          status: tx.status,
          description: tx.description,
          createdAt: tx.createdAt,
        })),
        recipients: recipients.map(recipient => ({
          id: recipient.id,
          name: recipient.name,
          country: recipient.country,
          currency: recipient.currency,
          recipientType: recipient.recipientType,
          createdAt: recipient.createdAt,
        })),
        paymentRequests: paymentRequests.map(req => ({
          id: req.id,
          amount: req.amount,
          currency: req.currency,
          status: req.status,
          createdAt: req.createdAt,
        })),
        exportedAt: new Date().toISOString(),
      };

      // Log admin action
      await storage.createAdminLog({
        adminId: req.session.admin?.id || null,
        action: "user_data_export",
        details: `Admin exported data for user: ${user.email}`,
        targetId: id,
      });

      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename="user-data-${id}.json"`);
      res.send(JSON.stringify(exportData, null, 2));
    } catch (error) {
      console.error('User data export error:', error);
      res.status(500).json({ message: "Failed to export user data" });
    }
  });

  // Send Custom Notification to User
  app.post("/api/admin/users/:id/notification", async (req, res) => {
    try {
      const { id } = req.params;
      const { title, message, type = "info" } = req.body;

      const user = await storage.getUser(id);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      if (!title || !message) {
        return res.status(400).json({ message: "Title and message are required" });
      }

      // Create notification
      const notification = await storage.createNotification({
        title,
        message,
        type,
        userId: id,
        isGlobal: false,
      });

      // Log admin action
      await storage.createAdminLog({
        adminId: req.session.admin?.id || null,
        action: "send_custom_notification",
        details: `Admin sent custom notification to user: ${user.email} - Title: ${title}`,
        targetId: id,
      });

      res.json({ 
        message: "Notification sent successfully",
        notification: {
          id: notification.id,
          title: notification.title,
          message: notification.message,
          type: notification.type,
        }
      });
    } catch (error) {
      console.error('Send custom notification error:', error);
      res.status(500).json({ message: "Failed to send notification" });
    }
  });

  // Support Ticket API endpoints
  
  // Submit support ticket (user facing)
  app.post("/api/support/tickets", upload.single('file'), async (req, res) => {
    try {
      const userId = (req.session as any)?.user?.id;
      if (!userId) {
        return res.status(401).json({ message: "Authentication required" });
      }

      const { issueType, description } = req.body;
      if (!issueType || !description) {
        return res.status(400).json({ message: "Issue type and description required" });
      }

      let fileUrl = undefined;
      let fileName = undefined;
      if (req.file) {
        try {
          fileUrl = await cloudinaryStorage.uploadFile(
            `support-tickets/${userId}/${Date.now()}-${req.file.originalname}`,
            req.file.buffer,
            req.file.mimetype
          );
          fileName = req.file.originalname;
        } catch (error) {
          console.error('Error uploading support ticket file:', error);
          return res.status(400).json({ message: "File upload failed" });
        }
      }

      const ticket = await storage.createSupportTicket({
        issueType,
        description,
        userId,
        status: 'open',
        priority: 'normal',
        fileUrl,
        fileName,
      });

      res.json({ 
        message: "Support ticket submitted successfully",
        ticket: {
          id: ticket.id,
          issueType: ticket.issueType,
          status: ticket.status,
          createdAt: ticket.createdAt,
        }
      });
    } catch (error) {
      console.error('Submit support ticket error:', error);
      res.status(500).json({ message: "Failed to submit support ticket" });
    }
  });

  // Get user's support tickets (NEW user API)
  app.get("/api/user/support-tickets", async (req, res) => {
    try {
      const userId = (req.session as any)?.user?.id;
      
      if (!userId) {
        return res.status(401).json({ message: "Authentication required" });
      }

      const tickets = await storage.getSupportTicketsByUserId(userId);
      const ticketsWithReplies = await Promise.all(
        tickets.map(async (ticket) => {
          try {
            const replies = await storage.getTicketReplies(ticket.id);
            return { ...ticket, replies };
          } catch (e) {
            // Replies table might not exist yet
            return { ...ticket, replies: [] };
          }
        })
      );
      res.json({ tickets: ticketsWithReplies });
    } catch (error) {
      console.error('Get user tickets error:', error);
      res.status(500).json({ message: "Failed to fetch support tickets" });
    }
  });

  // Create support ticket (user facing)
  app.post("/api/user/support-tickets", upload.single('file'), async (req, res) => {
    try {
      const userId = (req.session as any)?.user?.id;
      if (!userId) return res.status(401).json({ message: "Authentication required" });

      const { issueType, description } = req.body;
      if (!issueType || !description) {
        return res.status(400).json({ message: "Missing required fields" });
      }

      const ticket = await storage.createSupportTicket({ userId, issueType, description, status: 'open', priority: 'medium' });
      res.json({ message: "Ticket created", ticket });
    } catch (error) {
      console.error('Create user ticket error:', error);
      res.status(500).json({ message: "Failed to create ticket" });
    }
  });

  // Send reply on user ticket
  app.post("/api/user/support-tickets/:id/reply", upload.single('file'), async (req, res) => {
    try {
      const userId = (req.session as any)?.user?.id;
      if (!userId) return res.status(401).json({ message: "Authentication required" });

      const { content } = req.body;
      if (!content) return res.status(400).json({ message: "Reply content required" });

      let fileUrl = undefined;
      let fileName = undefined;
      if (req.file) {
        try {
          fileUrl = await cloudinaryStorage.uploadFile(
            `support-tickets/${req.params.id}/${Date.now()}-${req.file.originalname}`,
            req.file.buffer,
            req.file.mimetype
          );
          fileName = req.file.originalname;
        } catch (error) {
          console.error('Error uploading reply file:', error);
          return res.status(400).json({ message: "File upload failed" });
        }
      }

      const reply = await storage.createTicketReply({
        ticketId: req.params.id,
        userId,
        senderType: 'user',
        content,
        fileUrl,
        fileName,
      });
      res.json({ message: "Reply sent", reply });
    } catch (error) {
      console.error('Send reply error:', error);
      res.status(500).json({ message: "Failed to send reply" });
    }
  });

  // Get user's support tickets (legacy)
  app.get("/api/support/tickets", async (req, res) => {
    try {
      const userId = (req.session as any)?.user?.id;
      
      if (!userId) {
        return res.status(401).json({ message: "Authentication required" });
      }

      const tickets = await storage.getSupportTicketsByUserId(userId);
      res.json({ tickets });
    } catch (error) {
      console.error('Get user tickets error:', error);
      res.status(500).json({ message: "Failed to fetch support tickets" });
    }
  });

  // Admin: Get all support tickets
  app.get("/api/admin/support/tickets", requireAdminAuth, async (req, res) => {
    try {
      const { status, priority, page, limit } = req.query;
      
      const result = await storage.getAllSupportTickets({
        status: status as string,
        priority: priority as string, 
        page: page ? parseInt(page as string) : undefined,
        limit: limit ? parseInt(limit as string) : undefined,
      });

      // Add user details and replies to each ticket (with error handling)
      const ticketsWithDetails = await Promise.all(
        result.tickets.map(async (ticket) => {
          try {
            const user = await storage.getUser(ticket.userId);
            let replies = [];
            try {
              replies = await storage.getTicketReplies(ticket.id);
            } catch (e) {
              // Replies table might not exist yet, continue without them
              replies = [];
            }
            return {
              ...ticket,
              user: user ? { fullName: user.fullName, email: user.email, phone: user.phone } : undefined,
              replies,
            };
          } catch (e) {
            return {
              ...ticket,
              user: undefined,
              replies: [],
            };
          }
        })
      );

      res.json({ ...result, tickets: ticketsWithDetails });
    } catch (error) {
      console.error('Get admin tickets error:', error);
      res.status(500).json({ message: "Failed to fetch support tickets" });
    }
  });

  // Admin: Get specific support ticket
  app.get("/api/admin/support/tickets/:id", requireAdminAuth, async (req, res) => {
    try {
      const ticket = await storage.getSupportTicket(req.params.id);
      
      if (!ticket) {
        return res.status(404).json({ message: "Support ticket not found" });
      }

      res.json({ ticket });
    } catch (error) {
      console.error('Get ticket error:', error);
      res.status(500).json({ message: "Failed to fetch support ticket" });
    }
  });

  // Admin: Update support ticket
  app.put("/api/admin/support/tickets/:id", requireAdminAuth, async (req, res) => {
    try {
      const { status, priority, adminNotes } = req.body;
      const updates: any = {};
      
      if (status) updates.status = status;
      if (priority) updates.priority = priority;
      if (adminNotes) updates.adminNotes = adminNotes;
      if (status === 'resolved') updates.resolvedAt = new Date();

      const ticket = await storage.updateSupportTicket(req.params.id, updates);
      
      if (!ticket) {
        return res.status(404).json({ message: "Support ticket not found" });
      }

      // Log admin action
      await storage.createAdminLog({
        adminId: (req.session as any)?.admin?.id || null,
        action: "update_support_ticket", 
        details: `Admin updated support ticket ${req.params.id} - Status: ${status}`,
        targetId: req.params.id,
      });

      res.json({ 
        message: "Support ticket updated successfully",
        ticket 
      });
    } catch (error) {
      console.error('Update ticket error:', error);
      res.status(500).json({ message: "Failed to update support ticket" });
    }
  });

  // Admin: Delete support ticket
  app.delete("/api/admin/support/tickets/:id", requireAdminAuth, async (req, res) => {
    try {
      const ticket = await storage.getSupportTicket(req.params.id);
      
      if (!ticket) {
        return res.status(404).json({ message: "Support ticket not found" });
      }

      await storage.deleteSupportTicket(req.params.id);

      // Log admin action
      await storage.createAdminLog({
        adminId: (req.session as any)?.admin?.id || null,
        action: "delete_support_ticket", 
        details: `Admin deleted support ticket ${req.params.id}`,
        targetId: req.params.id,
      });

      res.json({ 
        message: "Support ticket deleted successfully"
      });
    } catch (error) {
      console.error('Delete ticket error:', error);
      res.status(500).json({ message: "Failed to delete support ticket" });
    }
  });

  // Admin: Cleanup ticket notifications
  app.post("/api/admin/cleanup-ticket-notifications", requireAdminAuth, async (req, res) => {
    try {
      // Get all users to check their notifications
      const allUsers = await storage.getAllUsers();
      let deletedCount = 0;
      
      for (const user of allUsers) {
        const notifications = await storage.getNotificationsByUserId(user.id);
        
        for (const notification of notifications) {
          // Check if notification is ticket-related (by title, message, or metadata)
          const isTicketNotification = 
            notification.title.toLowerCase().includes('ticket') ||
            notification.title.toLowerCase().includes('support') ||
            notification.message.toLowerCase().includes('ticket') ||
            notification.message.toLowerCase().includes('support') ||
            (notification.metadata && typeof notification.metadata === 'object' && 
             (notification.metadata as any)?.type === 'ticket') ||
            (notification.actionUrl && notification.actionUrl.includes('ticket'));
            
          if (isTicketNotification) {
            await storage.deleteNotification(notification.id);
            deletedCount++;
          }
        }
      }
      
      // Also check global notifications
      const globalNotifications = await storage.getGlobalNotifications();
      for (const notification of globalNotifications) {
        const isTicketNotification = 
          notification.title.toLowerCase().includes('ticket') ||
          notification.title.toLowerCase().includes('support') ||
          notification.message.toLowerCase().includes('ticket') ||
          notification.message.toLowerCase().includes('support') ||
          (notification.metadata && typeof notification.metadata === 'object' && 
           (notification.metadata as any)?.type === 'ticket') ||
          (notification.actionUrl && notification.actionUrl.includes('ticket'));
          
        if (isTicketNotification) {
          await storage.deleteNotification(notification.id);
          deletedCount++;
        }
      }

      // Log admin action
      await storage.createAdminLog({
        adminId: (req.session as any)?.admin?.id || null,
        action: "cleanup_ticket_notifications", 
        details: `Admin cleaned up ${deletedCount} ticket-related notifications`,
        targetId: null,
      });

      res.json({ 
        message: `Successfully deleted ${deletedCount} ticket-related notifications`,
        deletedCount
      });
    } catch (error) {
      console.error('Cleanup ticket notifications error:', error);
      res.status(500).json({ message: "Failed to cleanup ticket notifications" });
    }
  });

  // Admin: Reply to support ticket
  app.post("/api/admin/support-tickets/:id/reply", requireAdminAuth, upload.single('file'), async (req, res) => {
    try {
      const { content } = req.body;
      if (!content) return res.status(400).json({ message: "Reply content required" });

      let fileUrl = undefined;
      let fileName = undefined;
      if (req.file) {
        try {
          fileUrl = await cloudinaryStorage.uploadFile(
            `support-tickets/${req.params.id}/${Date.now()}-${req.file.originalname}`,
            req.file.buffer,
            req.file.mimetype
          );
          fileName = req.file.originalname;
        } catch (error) {
          console.error('Error uploading reply file:', error);
          return res.status(400).json({ message: "File upload failed" });
        }
      }

      const reply = await storage.createTicketReply({
        ticketId: req.params.id,
        userId: (req.session as any)?.admin?.id || '',
        senderType: 'admin',
        content,
        fileUrl,
        fileName,
      });

      await storage.createAdminLog({
        adminId: (req.session as any)?.admin?.id || null,
        action: "reply_support_ticket",
        details: `Admin replied to ticket ${req.params.id}`,
        targetId: req.params.id,
      });

      res.json({ message: "Reply sent", reply });
    } catch (error) {
      console.error('Send admin reply error:', error);
      res.status(500).json({ message: "Failed to send reply" });
    }
  });

  // Admin: Assign support ticket
  app.put("/api/admin/support/tickets/:id/assign", requireAdminAuth, async (req, res) => {
    try {
      const { adminId } = req.body;
      
      const ticket = await storage.assignSupportTicket(req.params.id, adminId);
      
      if (!ticket) {
        return res.status(404).json({ message: "Support ticket not found" });
      }

      // Log admin action  
      await storage.createAdminLog({
        adminId: (req.session as any)?.admin?.id || null,
        action: "assign_support_ticket",
        details: `Admin assigned support ticket ${req.params.id} to admin ${adminId}`,
        targetId: req.params.id,
      });

      res.json({ 
        message: "Support ticket assigned successfully",
        ticket 
      });
    } catch (error) {
      console.error('Assign ticket error:', error);
      res.status(500).json({ message: "Failed to assign support ticket" });
    }
  });


  // Admin Delete Functionality
  app.delete("/api/admin/users/:id", requireAdminAuth, async (req, res) => {
    try {
      const { id } = req.params;
      const adminId = (req.session as any)?.admin?.id;
      
      // Get user before deletion for logging
      const user = await storage.getUser(id);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Delete user's conversations and messages first
      const userConversations = await storage.getConversationsByUserId(id);
      for (const conversation of userConversations) {
        const messages = await storage.getMessagesByConversationId(conversation.id);
        for (const message of messages) {
          await storage.deleteMessage(message.id);
        }
        await storage.deleteConversation(conversation.id);
      }
      
      // Delete the user
      await storage.deleteUser(id);
      
      // Log admin action
      await storage.createAdminLog({
        adminId,
        action: "delete_user",
        details: `Admin deleted user ${user.email} (${user.fullName}) and all associated data`,
        targetId: id,
      });
      
      res.json({ message: "User and all associated data deleted successfully" });
    } catch (error) {
      console.error('Delete user error:', error);
      res.status(500).json({ message: "Failed to delete user" });
    }
  });

  app.delete("/api/admin/messages/:id", requireAdminAuth, async (req, res) => {
    try {
      const { id } = req.params;
      const adminId = (req.session as any)?.admin?.id;
      
      // Get message before deletion for logging
      const message = await storage.getMessage(id);
      if (!message) {
        return res.status(404).json({ message: "Message not found" });
      }
      
      // Delete the message
      await storage.deleteMessage(id);
      
      // Log admin action
      await storage.createAdminLog({
        adminId,
        action: "delete_message",
        details: `Admin deleted message in conversation ${message.conversationId}`,
        targetId: id,
      });
      
      res.json({ message: "Message deleted successfully" });
    } catch (error) {
      console.error('Delete message error:', error);
      res.status(500).json({ message: "Failed to delete message" });
    }
  });

  app.delete("/api/admin/conversations/:id", requireAdminAuth, async (req, res) => {
    try {
      const { id } = req.params;
      const adminId = (req.session as any)?.admin?.id;
      
      // Get conversation before deletion for logging
      const conversation = await storage.getConversation(id);
      if (!conversation) {
        return res.status(404).json({ message: "Conversation not found" });
      }
      
      // Delete all messages in the conversation first
      const messages = await storage.getMessagesByConversationId(id);
      for (const message of messages) {
        await storage.deleteMessage(message.id);
      }
      
      // Delete the conversation
      await storage.deleteConversation(id);
      
      // Log admin action
      await storage.createAdminLog({
        adminId,
        action: "delete_conversation",
        details: `Admin deleted conversation and ${messages.length} messages for user ${conversation.userId}`,
        targetId: id,
      });
      
      res.json({ message: "Conversation and all messages deleted successfully" });
    } catch (error) {
      console.error('Delete conversation error:', error);
      res.status(500).json({ message: "Failed to delete conversation" });
    }
  });

  // Admin Conversation Management
  app.get("/api/admin/conversations", requireAdminAuth, async (req, res) => {
    try {
      const conversations = await storage.getAllActiveConversations();
      
      // Get detailed info including user details
      const conversationsWithDetails = await Promise.all(
        conversations.map(async (conversation) => {
          const user = await storage.getUser(conversation.userId);
          const messageCount = await storage.getUnreadMessagesCount(conversation.id, conversation.userId);
          return {
            ...conversation,
            user: user ? { id: user.id, fullName: user.fullName, email: user.email } : null,
            unreadCount: messageCount
          };
        })
      );

      res.json(conversationsWithDetails);
    } catch (error) {
      console.error('Get admin conversations error:', error);
      res.status(500).json({ message: "Failed to fetch conversations" });
    }
  });

  // Admin: Assign conversation to admin
  app.put("/api/admin/conversations/:id/assign", requireAdminAuth, async (req, res) => {
    try {
      const { adminId } = req.body;
      const conversationId = req.params.id;
      
      const conversation = await storage.updateConversation(conversationId, { 
        adminId,
        status: "active"
      });
      
      if (!conversation) {
        return res.status(404).json({ message: "Conversation not found" });
      }

      // Log admin action  
      await storage.createAdminLog({
        adminId: (req.session as any)?.admin?.id || null,
        action: "assign_conversation",
        details: `Admin assigned conversation ${conversationId} to admin ${adminId}`,
        targetId: conversationId,
      });

      res.json({ 
        message: "Conversation assigned successfully",
        conversation
      });
    } catch (error) {
      console.error('Assign conversation error:', error);
      res.status(500).json({ message: "Failed to assign conversation" });
    }
  });

  // Admin user balance management
  app.put("/api/admin/users/:id/balance", async (req, res) => {
    try {
      const user = await storage.getUser(req.params.id);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      
      const { amount, type, details, currency } = req.body;
      
      // Determine which wallet to update based on currency (default to USD for backward compatibility)
      const targetCurrency = currency?.toUpperCase() || 'USD';
      const isKes = targetCurrency === 'KES';
      const currentBalance = parseFloat(isKes ? (user.kesBalance || "0") : (user.balance || "0"));
      const updateAmount = parseFloat(amount);
      
      let newBalance: number;
      let transactionType: 'receive' | 'send' | 'deposit';
      
      switch (type) {
        case "add":
          newBalance = currentBalance + updateAmount;
          transactionType = 'deposit'; // Admin deposits should be labeled as 'deposit'
          break;
        case "subtract":
          newBalance = Math.max(0, currentBalance - updateAmount);
          transactionType = 'send';
          break;
        case "set":
          newBalance = updateAmount;
          transactionType = updateAmount > currentBalance ? 'deposit' : 'send';
          break;
        default:
          return res.status(400).json({ error: "Invalid update type" });
      }
      
      // Update the appropriate wallet balance
      const balanceUpdate = isKes 
        ? { kesBalance: newBalance.toFixed(2) } 
        : { balance: newBalance.toFixed(2) };
      
      const updatedUser = await storage.updateUser(req.params.id, balanceUpdate);
      
      // Create transaction record for history with correct currency
      const transactionAmount = type === 'set' ? Math.abs(newBalance - currentBalance) : updateAmount;
      const transactionData = {
        userId: req.params.id,
        type: transactionType,
        amount: transactionAmount.toFixed(2),
        currency: targetCurrency,
        status: 'completed' as const,
        description: details || `Admin ${type} ${targetCurrency} balance adjustment`,
        recipientId: null,
        recipientName: 'System Admin',
        fee: '0.00',
        exchangeRate: 1,
        sourceAmount: transactionAmount.toFixed(2),
        sourceCurrency: targetCurrency
      };
      
      await storage.createTransaction(transactionData);
      
      res.json({ user: updatedUser, newBalance, currency: targetCurrency });
    } catch (error) {
      console.error('Admin balance update error:', error);
      res.status(500).json({ error: "Failed to update user balance" });
    }
  });

  // Admin virtual card management (action in URL param)
  app.put("/api/admin/users/:id/card/:action", async (req, res) => {
    try {
      const user = await storage.getUser(req.params.id);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      
      const { action } = req.params;
      let updateData: any = {};
      
      switch (action) {
        case "issue":
          updateData = { hasVirtualCard: true, cardStatus: "active" };
          
          // Create virtual card record when issuing
          const cardData = {
            userId: req.params.id,
            cardNumber: `4567${Math.random().toString().slice(2, 14)}`,
            expiryMonth: String(new Date().getMonth() + 1).padStart(2, '0'),
            expiryYear: String(new Date().getFullYear() + 5).slice(-2),
            cvv: Math.floor(Math.random() * 900 + 100).toString(),
            cardholderName: user.fullName || user.username,
            status: "active",
            balance: "0.00",
            cardType: "virtual",
            provider: "Mastercard",
            currency: user.defaultCurrency || "USD",
            pin: Math.floor(Math.random() * 9000 + 1000).toString()
          };
          
          try {
            await storage.createVirtualCard(cardData);
          } catch (error) {
            console.error('Error creating virtual card:', error);
            return res.status(500).json({ error: "Failed to create virtual card" });
          }
          break;
        case "activate":
          if (!user.hasVirtualCard) {
            return res.status(400).json({ error: "User has no virtual card" });
          }
          updateData = { cardStatus: "active" };
          break;
        case "deactivate":
          if (!user.hasVirtualCard) {
            return res.status(400).json({ error: "User has no virtual card" });
          }
          updateData = { cardStatus: "blocked" };
          break;
        default:
          return res.status(400).json({ error: "Invalid action" });
      }
      
      const updatedUser = await storage.updateUser(req.params.id, updateData);
      res.json({ user: updatedUser });
    } catch (error) {
      console.error('Admin card management error:', error);
      res.status(500).json({ error: "Failed to update card status" });
    }
  });

  // Admin virtual card management (action in body)
  app.put("/api/admin/users/:id/virtual-card", async (req, res) => {
    try {
      const { id } = req.params;
      const { action } = req.body;
      
      const user = await storage.getUser(id);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      
      let result;
      switch (action) {
        case "issue":
          // Issue new virtual card
          result = await storage.createVirtualCard({
            userId: id,
            purchaseAmount: "60.00"
          });
          
          // Update user to reflect they have a card
          await storage.updateUser(id, { hasVirtualCard: true });
          
          // Send card activation notification via SMS, WhatsApp, and Email
          const { messagingService: issueMessaging } = await import('./services/messaging');
          const { mailtrapService: issueMailtrap } = await import('./services/mailtrap');
          const cardLastFour = result.cardNumber.slice(-4);
          issueMessaging.sendCardActivation(user.phone, cardLastFour)
            .catch(err => console.error('Card activation notification error:', err));
          if (user.email) {
            issueMailtrap.sendCardActivation(user.email, user.fullName?.split(' ')[0] || 'User', user.fullName?.split(' ')[1] || '', cardLastFour)
              .catch(err => console.error('Card activation email error:', err));
          }
          break;
          
        case "activate":
        case "freeze":
          // Find and update existing card for reactivation/freezing
          const card = await storage.getVirtualCardByUserId(id);
          if (!card) {
            return res.status(404).json({ error: "Virtual card not found" });
          }
          
          // Don't allow reactivation of inactive cards - they need a new purchase
          if (card.status === "inactive" && action === "activate") {
            return res.status(400).json({ 
              error: "Cannot reactivate an inactive card. User must purchase a new card.",
              requiresPurchase: true
            });
          }
          
          const newStatus = action === "activate" ? "active" : "frozen";
          result = await storage.updateVirtualCard(card.id, { status: newStatus });
          
          // Send card activation notification if activating
          if (action === "activate") {
            const { messagingService: activateMessaging } = await import('./services/messaging');
            const { mailtrapService: activateMailtrap } = await import('./services/mailtrap');
            const activateCardLastFour = card.cardNumber.slice(-4);
            activateMessaging.sendCardActivation(user.phone, activateCardLastFour)
              .catch(err => console.error('Card activation notification error:', err));
            if (user.email) {
              activateMailtrap.sendCardActivation(user.email, user.fullName?.split(' ')[0] || 'User', user.fullName?.split(' ')[1] || '', activateCardLastFour)
                .catch(err => console.error('Card activation email error:', err));
            }
          }
          
          // Log admin action
          await storage.createAdminLog({
            adminId: req.session.admin?.id || null,
            action: `virtual_card_${action}`,
            details: `Admin ${action}d virtual card for user: ${user.email}`,
            targetId: id,
          });
          break;
          
        case "inactive":
          // Find and deactivate card completely
          const inactiveCard = await storage.getVirtualCardByUserId(id);
          if (!inactiveCard) {
            return res.status(404).json({ error: "Virtual card not found" });
          }
          
          // Set card to inactive and remove from user
          result = await storage.updateVirtualCard(inactiveCard.id, { status: "inactive" });
          await storage.updateUser(id, { hasVirtualCard: false });
          
          // Log admin action
          await storage.createAdminLog({
            adminId: req.session.admin?.id || null,
            action: "virtual_card_deactivate",
            details: `Admin permanently deactivated virtual card for user: ${user.email}. User must purchase new card to reactivate.`,
            targetId: id,
          });
          break;
          
        default:
          return res.status(400).json({ error: "Invalid action" });
      }
      
      res.json({ success: true, result });
    } catch (error) {
      console.error('Virtual card update error:', error);
      res.status(500).json({ error: "Failed to update virtual card" });
    }
  });

  // Admin KYC Management
  app.get("/api/admin/kyc", async (req, res) => {
    try {
      const kycDocuments = await storage.getAllKycDocuments();
      res.json({ kycDocuments });
    } catch (error) {
      console.error('KYC fetch error:', error);
      res.status(500).json({ message: "Failed to fetch KYC documents" });
    }
  });

  app.put("/api/admin/kyc/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const { status, verificationNotes } = req.body;
      
      const updatedKyc = await storage.updateKycDocument(id, {
        status,
        verificationNotes,
        verifiedAt: status === "verified" ? new Date() : null
      });

      if (!updatedKyc) {
        return res.status(404).json({ message: "KYC document not found" });
      }

      res.json({ kycDocument: updatedKyc });
    } catch (error) {
      console.error('KYC update error:', error);
      res.status(500).json({ message: "Failed to update KYC document" });
    }
  });

  // Admin Transaction Management  
  app.get("/api/admin/transactions", async (req, res) => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const status = req.query.status as string;
      
      const result = await storage.getAllTransactions({ status, page, limit });
      res.json(result);
    } catch (error) {
      console.error('Transactions fetch error:', error);
      res.status(500).json({ message: "Failed to fetch transactions" });
    }
  });

  app.put("/api/admin/transactions/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const updates = req.body;
      
      const updatedTransaction = await storage.updateTransaction(id, updates);
      
      if (!updatedTransaction) {
        return res.status(404).json({ message: "Transaction not found" });
      }

      res.json({ transaction: updatedTransaction });
    } catch (error) {
      console.error('Transaction update error:', error);
      res.status(500).json({ message: "Failed to update transaction" });
    }
  });

  app.put("/api/admin/transactions/:id/date", async (req, res) => {
    try {
      const { id } = req.params;
      const { createdAt } = req.body;
      
      if (!createdAt) {
        return res.status(400).json({ message: "createdAt is required" });
      }

      const updatedTransaction = await storage.updateTransaction(id, { 
        createdAt: new Date(createdAt),
        updatedAt: new Date()
      });
      
      if (!updatedTransaction) {
        return res.status(404).json({ message: "Transaction not found" });
      }

      res.json({ transaction: updatedTransaction });
    } catch (error) {
      console.error('Transaction date update error:', error);
      res.status(500).json({ message: "Failed to update transaction date" });
    }
  });

  // Admin Virtual Cards Management
  app.get("/api/admin/virtual-cards", async (req, res) => {
    try {
      const virtualCards = await storage.getAllVirtualCards();
      res.json({ virtualCards });
    } catch (error) {
      console.error('Virtual cards fetch error:', error);
      res.status(500).json({ message: "Failed to fetch virtual cards" });
    }
  });

  app.put("/api/admin/virtual-cards/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const updates = req.body;
      
      const updatedCard = await storage.updateVirtualCard(id, updates);
      
      if (!updatedCard) {
        return res.status(404).json({ message: "Virtual card not found" });
      }

      res.json({ virtualCard: updatedCard });
    } catch (error) {
      console.error('Virtual card update error:', error);
      res.status(500).json({ message: "Failed to update virtual card" });
    }
  });

  // System Settings Management
  app.get("/api/admin/settings", async (req, res) => {
    try {
      const settings = await storage.getSystemSettings();
      res.json({ settings });
    } catch (error) {
      console.error('Settings fetch error:', error);
      res.status(500).json({ message: "Failed to fetch system settings" });
    }
  });

  app.put("/api/admin/settings/:key", requireAdminAuth, async (req, res) => {
    try {
      const { key } = req.params;
      const { value } = req.body;
      
      // Convert value to string if it's a boolean
      const stringValue = typeof value === 'string' ? value : String(value);
      
      // Determine category based on key
      let category = "messaging";
      if (key.startsWith("maintenance_") || key === "maintenance_mode" || key === "maintenance_message") {
        category = "general";
      } else if (key.includes("fee") || key.includes("limit") || key.includes("amount")) {
        category = "fees";
      }
      
      // Try to update existing setting
      let updatedSetting = await storage.updateSystemSetting(key, stringValue);
      
      // If setting doesn't exist, create it
      if (!updatedSetting) {
        updatedSetting = await storage.createSystemSetting({
          category: category,
          key: key,
          value: stringValue
        });
      }

      res.json({ setting: updatedSetting });
    } catch (error) {
      console.error('Setting update error:', error);
      res.status(500).json({ message: "Failed to update setting" });
    }
  });

  app.post("/api/admin/settings", async (req, res) => {
    try {
      const settingData = req.body;
      const newSetting = await storage.createSystemSetting(settingData);
      res.json({ setting: newSetting });
    } catch (error) {
      console.error('Setting creation error:', error);
      res.status(500).json({ message: "Failed to create setting" });
    }
  });

  // API Configuration endpoints
  app.get("/api/admin/api-configurations", requireAdminAuth, async (req, res) => {
    try {
      const configurations = await storage.getAllApiConfigurations();
      res.json({ configurations });
    } catch (error) {
      console.error('API configurations fetch error:', error);
      res.status(500).json({ message: "Failed to fetch API configurations" });
    }
  });

  app.get("/api/admin/api-configurations/:provider", requireAdminAuth, async (req, res) => {
    try {
      const { provider } = req.params;
      const configuration = await storage.getApiConfiguration(provider);
      
      if (!configuration) {
        return res.status(404).json({ message: "Configuration not found" });
      }
      
      res.json({ configuration });
    } catch (error) {
      console.error('API configuration fetch error:', error);
      res.status(500).json({ message: "Failed to fetch API configuration" });
    }
  });

  app.post("/api/admin/api-configurations", requireAdminAuth, async (req, res) => {
    try {
      const configData = req.body;
      const configuration = await storage.createApiConfiguration(configData);
      res.json({ configuration, message: "API configuration created successfully" });
    } catch (error) {
      console.error('API configuration creation error:', error);
      res.status(500).json({ message: "Failed to create API configuration" });
    }
  });

  app.put("/api/admin/api-configurations/:provider", requireAdminAuth, async (req, res) => {
    try {
      const { provider } = req.params;
      const updates = req.body;
      
      const configuration = await storage.updateApiConfiguration(provider, updates);
      
      if (!configuration) {
        return res.status(404).json({ message: "Configuration not found" });
      }
      
      res.json({ configuration, message: "API configuration updated successfully" });
    } catch (error) {
      console.error('API configuration update error:', error);
      res.status(500).json({ message: "Failed to update API configuration" });
    }
  });

  app.delete("/api/admin/api-configurations/:provider", requireAdminAuth, async (req, res) => {
    try {
      const { provider } = req.params;
      await storage.deleteApiConfiguration(provider);
      res.json({ message: "API configuration deleted successfully" });
    } catch (error) {
      console.error('API configuration deletion error:', error);
      res.status(500).json({ message: "Failed to delete API configuration" });
    }
  });

  // User search endpoint for transfers (MUST come before /api/users/:id)
  app.get("/api/users/search", requireAuth, async (req, res) => {
    try {
      const { q: searchQuery } = req.query;
      const currentUserId = req.session?.userId;
      
      console.log('=== USER SEARCH DEBUG ===');
      console.log('Search Query:', { q: searchQuery, type: typeof searchQuery });
      console.log('Current User ID:', currentUserId);
      console.log('Query Parameter received:', req.query);
      
      if (!searchQuery || typeof searchQuery !== 'string' || searchQuery.length < 2) {
        console.log('Query too short or invalid, returning empty array');
        return res.json({ users: [] });
      }
      
      const allUsers = await storage.getAllUsers();
      console.log(`[Search] Total users in database: ${allUsers.length}`);
      
      if (allUsers.length === 0) {
        console.warn('[Search] ⚠️ No users found in database!');
      } else {
        console.log('[Search] Sample users:', allUsers.slice(0, 3).map(u => ({ 
          id: u.id, 
          fullName: u.fullName, 
          email: u.email 
        })));
      }
      
      const query = searchQuery.toLowerCase().trim();
      console.log(`[Search] Searching for: "${query}"`);
      
      // Search by email, full name, or phone number, excluding the current user
      const filteredUsers = allUsers
        .filter((user, idx) => {
          // Skip current user and admin users
          if (user.id === currentUserId) {
            console.log(`[Search] Skipping current user: ${user.email}`);
            return false;
          }
          if (user.isAdmin) {
            console.log(`[Search] Skipping admin user: ${user.email}`);
            return false;
          }
          
          const fullName = (user.fullName || '').toLowerCase().trim();
          const email = (user.email || '').toLowerCase().trim();
          const phone = (user.phone || '').trim();
          
          // Normalize phone numbers to standard format for comparison
          const normalizeToStandardPhone = (p: string) => {
            if (!p) return '';
            const cleaned = p.replace(/[\+\-\s()]/g, '');
            
            // Handle different Kenyan formats
            if (cleaned.startsWith('254')) {
              return cleaned.substring(3); // Remove 254 prefix -> 7xxx
            } else if (cleaned.startsWith('0')) {
              return cleaned.substring(1); // Remove 0 prefix -> 7xxx
            }
            return cleaned; // Already in 7xxx format or other
          };
          
          const normalizedUserPhone = normalizeToStandardPhone(phone);
          const normalizedSearchPhone = normalizeToStandardPhone(searchQuery.trim());
          
          // Check for matches
          const emailMatch = email.includes(query);
          const nameMatch = fullName.includes(query) || 
                           fullName.split(' ').some(part => part.toLowerCase().startsWith(query));
          
          // Enhanced phone matching
          const phoneMatch = normalizedUserPhone && normalizedSearchPhone && (
            normalizedUserPhone === normalizedSearchPhone ||
            normalizedUserPhone.includes(normalizedSearchPhone) ||
            normalizedSearchPhone.includes(normalizedUserPhone)
          );
          
          const isMatch = emailMatch || nameMatch || phoneMatch;
          if (isMatch) {
            console.log(`[Search] ✓ Match found: ${email} | fullName: ${fullName} | emailMatch: ${emailMatch} | nameMatch: ${nameMatch} | phoneMatch: ${phoneMatch}`);
          }
          
          return isMatch;
        })
        .slice(0, 10) // Limit to 10 results
        .map(user => ({
          id: user.id,
          fullName: user.fullName,
          email: user.email,
          phone: user.phone
        }));
      
      console.log(`[Search] Final results: found ${filteredUsers.length} matching users`);
      console.log('[Search] Filtered users:', filteredUsers);
      res.json({ users: filteredUsers });
    } catch (error) {
      console.error('[Search] Error searching users:', error);
      res.status(500).json({ message: "Error searching users" });
    }
  });

  // Get user by ID (for refreshing user data)
  app.get("/api/users/:id", requireAuth, async (req, res) => {
    try {
      const user = await storage.getUser(req.params.id);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      res.json({ user });
    } catch (error) {
      console.error("Error retrieving user:", error);
      res.status(500).json({ error: "Failed to retrieve user data" });
    }
  });

  // Get login history for a user
  app.get("/api/users/:id/login-history", requireAuth, async (req, res) => {
    try {
      const { id } = req.params;
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
      
      const history = await storage.getLoginHistoryByUserId(id, limit);
      res.json({ loginHistory: history });
    } catch (error) {
      console.error("Error retrieving login history:", error);
      res.status(500).json({ error: "Failed to retrieve login history" });
    }
  });

  // Transaction Analytics API
  app.get("/api/analytics/:userId/spending", requireAuth, async (req, res) => {
    try {
      const { userId } = req.params;
      const { period = "month" } = req.query;
      
      const transactions = await storage.getTransactionsByUserId(userId);
      const now = new Date();
      let startDate: Date;
      
      switch (period) {
        case "week":
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case "month":
          startDate = new Date(now.getFullYear(), now.getMonth(), 1);
          break;
        case "year":
          startDate = new Date(now.getFullYear(), 0, 1);
          break;
        default:
          startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      }
      
      const filteredTransactions = transactions.filter(tx => 
        new Date(tx.createdAt!) >= startDate && tx.status === "completed"
      );
      
      const spending = filteredTransactions
        .filter(tx => tx.type === "send")
        .reduce((sum, tx) => sum + parseFloat(tx.amount), 0);
        
      const income = filteredTransactions
        .filter(tx => tx.type === "receive")
        .reduce((sum, tx) => sum + parseFloat(tx.amount), 0);
      
      const categorySpending = filteredTransactions
        .filter(tx => tx.type === "send")
        .reduce((acc, tx) => {
          const category = tx.description?.includes("Virtual Card") ? "Virtual Card" :
                          tx.description?.includes("Transfer") ? "Transfer" :
                          tx.description?.includes("Payment") ? "Payment" : "Other";
          acc[category] = (acc[category] || 0) + parseFloat(tx.amount);
          return acc;
        }, {} as Record<string, number>);
      
      const dailySpending = filteredTransactions
        .filter(tx => tx.type === "send")
        .reduce((acc, tx) => {
          const day = new Date(tx.createdAt!).toISOString().split('T')[0];
          acc[day] = (acc[day] || 0) + parseFloat(tx.amount);
          return acc;
        }, {} as Record<string, number>);
      
      res.json({
        period,
        totalSpending: spending,
        totalIncome: income,
        netFlow: income - spending,
        transactionCount: filteredTransactions.length,
        categoryBreakdown: categorySpending,
        dailySpending,
        averageTransaction: filteredTransactions.length > 0 ? 
          (spending + income) / filteredTransactions.length : 0
      });
    } catch (error) {
      console.error('Analytics error:', error);
      res.status(500).json({ message: "Failed to fetch analytics" });
    }
  });

  // Payment Requests API
  app.post("/api/payment-requests", async (req, res) => {
    try {
      const { fromUserId, toUserId, amount, currency, description, dueDate } = req.body;
      
      const paymentRequest = await storage.createPaymentRequest({
        fromUserId,
        toUserId, 
        amount: parseFloat(amount).toFixed(2),
        currency: currency || "USD",
        description: description || "Payment request",
        dueDate: dueDate ? new Date(dueDate) : null,
        status: "pending"
      });
      
      // Send notification to recipient
      await notificationService.sendPaymentRequestNotification(toUserId, fromUserId, amount, currency);
      
      res.json({ paymentRequest });
    } catch (error) {
      console.error('Payment request creation error:', error);
      res.status(500).json({ message: "Failed to create payment request" });
    }
  });

  app.get("/api/payment-requests/:userId", async (req, res) => {
    try {
      const { userId } = req.params;
      const { type = "all" } = req.query;
      
      const allRequests = await storage.getPaymentRequestsByUserId(userId);
      
      let filteredRequests = allRequests;
      if (type === "sent") {
        filteredRequests = allRequests.filter(req => req.fromUserId === userId);
      } else if (type === "received") {
        filteredRequests = allRequests.filter(req => req.toUserId === userId);
      }
      
      res.json({ paymentRequests: filteredRequests });
    } catch (error) {
      console.error('Payment requests fetch error:', error);
      res.status(500).json({ message: "Failed to fetch payment requests" });
    }
  });

  app.put("/api/payment-requests/:id/:action", async (req, res) => {
    try {
      const { id, action } = req.params;
      const { userId } = req.body;
      
      const paymentRequest = await storage.getPaymentRequest(id);
      if (!paymentRequest) {
        return res.status(404).json({ message: "Payment request not found" });
      }
      
      if (action === "accept" && paymentRequest.toUserId === userId) {
        // Process payment from recipient to sender
        const recipient = await storage.getUser(paymentRequest.toUserId!);
        const sender = await storage.getUser(paymentRequest.fromUserId!);
        
        if (!recipient || !sender) {
          return res.status(404).json({ message: "User not found" });
        }
        
        const recipientBalance = parseFloat(recipient.balance || "0");
        const amount = parseFloat(paymentRequest.amount);
        
        if (recipientBalance < amount) {
          return res.status(400).json({ message: "Insufficient balance" });
        }
        
        // Update balances
        await storage.updateUser(recipient.id, { 
          balance: (recipientBalance - amount).toFixed(2) 
        });
        await storage.updateUser(sender.id, { 
          balance: (parseFloat(sender.balance || "0") + amount).toFixed(2) 
        });
        
        // Create transaction records
        await storage.createTransaction({
          userId: recipient.id,
          type: "send",
          amount: amount.toFixed(2),
          currency: paymentRequest.currency,
          status: "completed",
          description: `Payment to ${sender.fullName}`,
          recipientId: sender.id,
          recipientName: sender.fullName,
          fee: "0.00",
          exchangeRate: "1",
          sourceAmount: amount.toFixed(2),
          sourceCurrency: paymentRequest.currency
        });
        
        await storage.createTransaction({
          userId: sender.id,
          type: "receive", 
          amount: amount.toFixed(2),
          currency: paymentRequest.currency,
          status: "completed",
          description: `Payment from ${recipient.fullName}`,
          recipientId: recipient.id,
          recipientName: recipient.fullName,
          fee: "0.00",
          exchangeRate: "1",
          sourceAmount: amount.toFixed(2),
          sourceCurrency: paymentRequest.currency
        });
        
        // Update payment request status
        await storage.updatePaymentRequest(id, { status: "completed" });
        
        // Send notifications
        await notificationService.sendPaymentNotification(sender.id, "received", amount, paymentRequest.currency);
        await notificationService.sendPaymentNotification(recipient.id, "sent", amount, paymentRequest.currency);
        
        res.json({ message: "Payment completed successfully" });
      } else if (action === "decline" && paymentRequest.toUserId === userId) {
        await storage.updatePaymentRequest(id, { status: "declined" });
        res.json({ message: "Payment request declined" });
      } else if (action === "cancel" && paymentRequest.fromUserId === userId) {
        await storage.updatePaymentRequest(id, { status: "cancelled" });
        res.json({ message: "Payment request cancelled" });
      } else {
        res.status(403).json({ message: "Not authorized to perform this action" });
      }
    } catch (error) {
      console.error('Payment request action error:', error);
      res.status(500).json({ message: "Failed to process payment request" });
    }
  });

  // Savings Goals API
  app.post("/api/savings-goals", async (req, res) => {
    try {
      const { userId, title, targetAmount, targetDate, description } = req.body;
      
      const savingsGoal = await storage.createSavingsGoal({
        userId,
        title,
        targetAmount: parseFloat(targetAmount).toFixed(2),
        currentAmount: "0.00",
        targetDate: targetDate ? new Date(targetDate) : null,
        description: description || "",
        isActive: true
      });
      
      res.json({ savingsGoal });
    } catch (error) {
      console.error('Savings goal creation error:', error);
      res.status(500).json({ message: "Failed to create savings goal" });
    }
  });

  app.get("/api/savings-goals/:userId", async (req, res) => {
    try {
      const savingsGoals = await storage.getSavingsGoalsByUserId(req.params.userId);
      res.json({ savingsGoals });
    } catch (error) {
      console.error('Savings goals fetch error:', error);
      res.status(500).json({ message: "Failed to fetch savings goals" });
    }
  });

  app.put("/api/savings-goals/:id/contribute", async (req, res) => {
    try {
      const { id } = req.params;
      const { amount, userId } = req.body;
      
      const savingsGoal = await storage.getSavingsGoal(id);
      if (!savingsGoal) {
        return res.status(404).json({ message: "Savings goal not found" });
      }
      
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      const userBalance = parseFloat(user.balance || "0");
      const contributionAmount = parseFloat(amount);
      
      if (userBalance < contributionAmount) {
        return res.status(400).json({ message: "Insufficient balance" });
      }
      
      // Update user balance
      await storage.updateUser(userId, {
        balance: (userBalance - contributionAmount).toFixed(2)
      });
      
      // Update savings goal
      const newAmount = parseFloat(savingsGoal.currentAmount || "0") + contributionAmount;
      await storage.updateSavingsGoal(id, {
        currentAmount: newAmount.toFixed(2)
      });
      
      // Create transaction record
      await storage.createTransaction({
        userId,
        type: "send",
        amount: contributionAmount.toFixed(2),
        currency: "USD",
        status: "completed",
        description: `Savings contribution: ${savingsGoal.title}`,
        recipientId: null,
        recipientName: "Savings Goal",
        fee: "0.00",
        exchangeRate: "1",
        sourceAmount: contributionAmount.toFixed(2),
        sourceCurrency: "USD"
      });
      
      res.json({ message: "Contribution added successfully", newAmount: newAmount.toFixed(2) });
    } catch (error) {
      console.error('Savings contribution error:', error);
      res.status(500).json({ message: "Failed to add contribution" });
    }
  });

  // QR Code Payment API  
  app.post("/api/qr-payments/generate", async (req, res) => {
    try {
      const { userId, amount, currency, description } = req.body;
      
      const paymentCode = `GP${Date.now()}${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
      
      const qrPayment = await storage.createQRPayment({
        userId,
        paymentCode,
        amount: parseFloat(amount).toFixed(2),
        currency: currency || "USD",
        description: description || "QR Payment",
        isActive: true,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
      });
      
      res.json({ qrPayment, paymentCode });
    } catch (error) {
      console.error('QR payment generation error:', error);
      res.status(500).json({ message: "Failed to generate QR payment" });
    }
  });

  app.post("/api/qr-payments/process", async (req, res) => {
    try {
      const { paymentCode, payerUserId } = req.body;
      
      const qrPayment = await storage.getQRPaymentByCode(paymentCode);
      if (!qrPayment || !qrPayment.isActive || new Date() > new Date(qrPayment.expiresAt!)) {
        return res.status(400).json({ message: "Invalid or expired payment code" });
      }
      
      const payer = await storage.getUser(payerUserId);
      const recipient = await storage.getUser(qrPayment.userId);
      
      if (!payer || !recipient) {
        return res.status(404).json({ message: "User not found" });
      }
      
      const amount = parseFloat(qrPayment.amount);
      const payerBalance = parseFloat(payer.balance || "0");
      
      if (payerBalance < amount) {
        return res.status(400).json({ message: "Insufficient balance" });
      }
      
      // Process payment
      await storage.updateUser(payerUserId, {
        balance: (payerBalance - amount).toFixed(2)
      });
      await storage.updateUser(recipient.id, {
        balance: (parseFloat(recipient.balance || "0") + amount).toFixed(2)
      });
      
      // Create transactions
      await storage.createTransaction({
        userId: payerUserId,
        type: "send",
        amount: amount.toFixed(2),
        currency: qrPayment.currency,
        status: "completed",
        description: `QR Payment to ${recipient.fullName}`,
        recipientId: recipient.id,
        recipientName: recipient.fullName,
        fee: "0.00",
        exchangeRate: "1",
        sourceAmount: amount.toFixed(2),
        sourceCurrency: qrPayment.currency
      });
      
      await storage.createTransaction({
        userId: recipient.id,
        type: "receive",
        amount: amount.toFixed(2),
        currency: qrPayment.currency,
        status: "completed",
        description: `QR Payment from ${payer.fullName}`,
        recipientId: payerUserId,
        recipientName: payer.fullName,
        fee: "0.00",
        exchangeRate: "1",
        sourceAmount: amount.toFixed(2),
        sourceCurrency: qrPayment.currency
      });
      
      // Deactivate QR code
      await storage.updateQRPayment(qrPayment.id, { isActive: false });
      
      res.json({ message: "Payment processed successfully" });
    } catch (error) {
      console.error('QR payment processing error:', error);
      res.status(500).json({ message: "Failed to process QR payment" });
    }
  });

  // PayHero admin settings endpoints
  app.get("/api/admin/payhero-settings", async (req, res) => {
    try {
      // Get settings from database first, fallback to environment
      const channelIdSetting = await storage.getSystemSetting("payhero", "channel_id");
      const providerSetting = await storage.getSystemSetting("payhero", "provider");
      const cardPriceSetting = await storage.getSystemSetting("virtual_card", "price");
      
      // Parse JSON values from database and prioritize database over env variables
      const channelId = channelIdSetting?.value 
        ? (typeof channelIdSetting.value === 'string' ? channelIdSetting.value : JSON.stringify(channelIdSetting.value)).replace(/"/g, '')
        : "3407"; // Default to 3407, not env variable
      
      const settings = {
        channelId,
        provider: providerSetting?.value || "m-pesa",
        cardPrice: cardPriceSetting?.value || "60.00",
        username: process.env.PAYHERO_USERNAME ? "****" : "",
        password: process.env.PAYHERO_PASSWORD ? "****" : "",
      };
      
      res.json(settings);
    } catch (error) {
      console.error('Error fetching PayHero settings:', error);
      res.status(500).json({ message: "Error fetching PayHero settings" });
    }
  });

  app.put("/api/admin/payhero-settings", async (req, res) => {
    try {
      const { channelId, provider, cardPrice } = req.body;
      
      console.log('Admin updated PayHero settings:', { channelId, provider, cardPrice });
      
      // Save settings to database for persistence
      await storage.setSystemSetting({
        category: "payhero",
        key: "channel_id",
        value: channelId,
        description: "PayHero payment channel ID"
      });
      
      await storage.setSystemSetting({
        category: "payhero",
        key: "provider",
        value: provider,
        description: "PayHero payment provider"
      });
      
      if (cardPrice) {
        await storage.setSystemSetting({
          category: "virtual_card",
          key: "price",
          value: cardPrice,
          description: "Virtual card purchase price in USD"
        });
      }
      
      // Update the PayHero service channel ID in memory using the proper setter
      payHeroService.updateSettings(parseInt(channelId));
      
      res.json({ 
        success: true, 
        message: "PayHero settings updated successfully",
        channelId,
        provider,
        cardPrice 
      });
    } catch (error) {
      console.error('Error updating PayHero settings:', error);
      res.status(500).json({ message: "Error updating PayHero settings" });
    }
  });

  app.post("/api/admin/test-payhero", async (req, res) => {
    try {
      const { amount, phone, reference } = req.body;
      
      console.log('Admin testing PayHero connection:', { amount, phone, reference });
      
      // Test PayHero connection with minimal transaction
      const testResult = await payHeroService.initiateMpesaPayment(
        amount || 1,
        phone || "0700000000", 
        reference || `TEST-${Date.now()}`,
        "Test User",
        null // No callback for test
      );
      
      res.json({
        success: testResult.success,
        status: testResult.status,
        reference: testResult.reference,
        message: testResult.success 
          ? "PayHero connection test successful" 
          : `Connection test failed: ${testResult.status}`
      });
    } catch (error) {
      console.error('PayHero connection test error:', error);
      res.status(500).json({ 
        success: false,
        message: "Connection test failed: " + error.message 
      });
    }
  });

  // Manual M-Pesa payment settings endpoints
  app.get("/api/admin/manual-payment-settings", async (req, res) => {
    try {
      // Get settings from database, fallback to defaults
      const paybillSetting = await storage.getSystemSetting("manual_mpesa", "paybill");
      const accountSetting = await storage.getSystemSetting("manual_mpesa", "account");
      
      const settings = {
        paybill: paybillSetting?.value || "247",
        account: accountSetting?.value || "4664",
      };
      
      res.json(settings);
    } catch (error) {
      console.error('Error fetching manual payment settings:', error);
      res.status(500).json({ message: "Error fetching manual payment settings" });
    }
  });

  app.put("/api/admin/manual-payment-settings", async (req, res) => {
    try {
      const { paybill, account } = req.body;
      
      console.log('Admin updated manual M-Pesa payment settings:', { paybill, account });
      
      // Save settings to database for persistence
      await storage.setSystemSetting({
        category: "manual_mpesa",
        key: "paybill",
        value: paybill,
        description: "Manual M-Pesa paybill number for card purchases"
      });
      
      await storage.setSystemSetting({
        category: "manual_mpesa",
        key: "account",
        value: account,
        description: "Manual M-Pesa account number for card purchases"
      });
      
      res.json({ 
        success: true, 
        message: "Manual payment settings updated successfully",
        paybill,
        account
      });
    } catch (error) {
      console.error('Error updating manual payment settings:', error);
      res.status(500).json({ message: "Error updating manual payment settings" });
    }
  });

  // Public endpoint for getting manual payment settings (for users)
  app.get("/api/manual-payment-settings", async (req, res) => {
    try {
      const paybillSetting = await storage.getSystemSetting("manual_mpesa", "paybill");
      const accountSetting = await storage.getSystemSetting("manual_mpesa", "account");
      
      res.json({
        paybill: paybillSetting?.value || "247",
        account: accountSetting?.value || "4664",
      });
    } catch (error) {
      console.error('Error fetching manual payment settings:', error);
      res.status(500).json({ message: "Error fetching manual payment settings" });
    }
  });

  // Messaging settings endpoints
  app.get("/api/admin/messaging-settings", async (req, res) => {
    try {
      const apiKeySetting = await storage.getSystemSetting("messaging", "api_key");
      const emailSetting = await storage.getSystemSetting("messaging", "account_email");
      const senderIdSetting = await storage.getSystemSetting("messaging", "sender_id");
      const whatsappAccessTokenSetting = await storage.getSystemSetting("messaging", "whatsapp_access_token");
      const whatsappPhoneNumberIdSetting = await storage.getSystemSetting("messaging", "whatsapp_phone_number_id");
      const whatsappWabaIdSetting = await storage.getSystemSetting("messaging", "whatsapp_business_account_id");
      
      const settings = {
        apiKey: apiKeySetting?.value || "",
        accountEmail: emailSetting?.value || "",
        senderId: senderIdSetting?.value || "",
        whatsappAccessToken: whatsappAccessTokenSetting?.value || "",
        whatsappPhoneNumberId: String(whatsappPhoneNumberIdSetting?.value || ""),
        whatsappBusinessAccountId: String(whatsappWabaIdSetting?.value || ""),
      };
      
      console.log('[Messaging Settings] Retrieved:', {
        sms: !!settings.apiKey && !!settings.accountEmail && !!settings.senderId,
        whatsapp: !!settings.whatsappAccessToken && !!settings.whatsappPhoneNumberId,
        wabaId: !!settings.whatsappBusinessAccountId
      });
      
      res.json(settings);
    } catch (error) {
      console.error('Error fetching messaging settings:', error);
      res.status(500).json({ message: "Error fetching messaging settings" });
    }
  });

  app.put("/api/admin/messaging-settings", async (req, res) => {
    try {
      const { apiKey, accountEmail, senderId, whatsappAccessToken, whatsappPhoneNumberId, whatsappBusinessAccountId } = req.body;
      
      console.log('Admin updated messaging settings (SMS via TalkNTalk, WhatsApp via Meta)');
      
      // SMS Settings (TalkNTalk)
      await storage.setSystemSetting({
        category: "messaging",
        key: "api_key",
        value: (apiKey || '').trim(),
        description: "TalkNTalk API key for SMS"
      });
      
      await storage.setSystemSetting({
        category: "messaging",
        key: "account_email",
        value: (accountEmail || '').trim(),
        description: "TalkNTalk account email"
      });
      
      await storage.setSystemSetting({
        category: "messaging",
        key: "sender_id",
        value: (senderId || '').trim(),
        description: "SMS sender ID"
      });
      
      // WhatsApp Settings (Meta Business API)
      await storage.setSystemSetting({
        category: "messaging",
        key: "whatsapp_access_token",
        value: (whatsappAccessToken || '').trim(),
        description: "Meta WhatsApp Business API access token"
      });
      
      await storage.setSystemSetting({
        category: "messaging",
        key: "whatsapp_phone_number_id",
        value: String(whatsappPhoneNumberId || '').trim(),
        description: "Meta WhatsApp Business phone number ID"
      });

      await storage.setSystemSetting({
        category: "messaging",
        key: "whatsapp_business_account_id",
        value: String(whatsappBusinessAccountId || '').trim(),
        description: "Meta WhatsApp Business Account ID (WABA ID)"
      });
      
      // Update WhatsApp service with new credentials
      process.env.WHATSAPP_ACCESS_TOKEN = (whatsappAccessToken || '').trim();
      process.env.WHATSAPP_PHONE_NUMBER_ID = String(whatsappPhoneNumberId || '').trim();
      process.env.WHATSAPP_BUSINESS_ACCOUNT_ID = String(whatsappBusinessAccountId || '').trim();
      
      console.log('[Messaging Settings] Updated:', {
        sms: !!apiKey && !!accountEmail && !!senderId,
        whatsapp: !!whatsappAccessToken && !!whatsappPhoneNumberId,
        wabaId: !!whatsappBusinessAccountId
      });
      
      // Refresh WhatsApp service credentials after update
      if (whatsappAccessToken && whatsappPhoneNumberId) {
        const { whatsappService } = await import('./services/whatsapp');
        await whatsappService.refreshCredentials();
        console.log('[WhatsApp] Credentials refreshed after admin update');
      }
      
      res.json({ 
        success: true, 
        message: "Messaging settings updated successfully"
      });
    } catch (error) {
      console.error('Error updating messaging settings:', error);
      res.status(500).json({ message: "Error updating messaging settings" });
    }
  });

  // Message type toggles endpoints
  app.get("/api/admin/message-toggles", requireAdminAuth, async (req, res) => {
    try {
      const enableOtpSetting = await storage.getSystemSetting("messaging", "enable_otp_messages");
      const enablePasswordSetting = await storage.getSystemSetting("messaging", "enable_password_reset_messages");
      const enableFundSetting = await storage.getSystemSetting("messaging", "enable_fund_receipt_messages");
      const enableKycSetting = await storage.getSystemSetting("messaging", "enable_kyc_verified_messages");
      const enableCardSetting = await storage.getSystemSetting("messaging", "enable_card_activation_messages");
      const enableLoginAlertSetting = await storage.getSystemSetting("messaging", "enable_login_alert_messages");

      res.json({
        enableOtpMessages: enableOtpSetting?.value !== 'false',
        enablePasswordResetMessages: enablePasswordSetting?.value !== 'false',
        enableFundReceiptMessages: enableFundSetting?.value !== 'false',
        enableKycVerifiedMessages: enableKycSetting?.value !== 'false',
        enableCardActivationMessages: enableCardSetting?.value !== 'false',
        enableLoginAlertMessages: enableLoginAlertSetting?.value !== 'false'
      });
    } catch (error) {
      console.error('Error fetching message toggles:', error);
      res.status(500).json({ message: "Error fetching message toggles" });
    }
  });

  app.put("/api/admin/message-toggles", requireAdminAuth, async (req, res) => {
    try {
      const { enableOtpMessages, enablePasswordResetMessages, enableFundReceiptMessages, enableKycVerifiedMessages, enableCardActivationMessages, enableLoginAlertMessages } = req.body;

      await storage.setSystemSetting({
        category: "messaging",
        key: "enable_otp_messages",
        value: enableOtpMessages ? 'true' : 'false',
        description: "Send OTP verification messages"
      });

      await storage.setSystemSetting({
        category: "messaging",
        key: "enable_password_reset_messages",
        value: enablePasswordResetMessages ? 'true' : 'false',
        description: "Send password reset messages"
      });

      await storage.setSystemSetting({
        category: "messaging",
        key: "enable_fund_receipt_messages",
        value: enableFundReceiptMessages ? 'true' : 'false',
        description: "Send fund receipt notifications"
      });

      await storage.setSystemSetting({
        category: "messaging",
        key: "enable_kyc_verified_messages",
        value: enableKycVerifiedMessages ? 'true' : 'false',
        description: "Send KYC verified notifications"
      });

      await storage.setSystemSetting({
        category: "messaging",
        key: "enable_card_activation_messages",
        value: enableCardActivationMessages ? 'true' : 'false',
        description: "Send card activation messages"
      });

      await storage.setSystemSetting({
        category: "messaging",
        key: "enable_login_alert_messages",
        value: enableLoginAlertMessages ? 'true' : 'false',
        description: "Send login alert notifications"
      });

      console.log('Message toggles updated:', { enableOtpMessages, enablePasswordResetMessages, enableFundReceiptMessages, enableKycVerifiedMessages, enableCardActivationMessages, enableLoginAlertMessages });

      res.json({
        success: true,
        message: "Message toggles updated successfully"
      });
    } catch (error) {
      console.error('Error updating message toggles:', error);
      res.status(500).json({ message: "Error updating message toggles" });
    }
  });

  // Create WhatsApp templates via Meta API
  app.post("/api/admin/whatsapp/create-templates", requireAdminAuth, async (req, res) => {
    try {
      const { whatsappService } = await import('./services/whatsapp');
      
      console.log('[Admin] Creating WhatsApp templates...');
      const results = await whatsappService.createAllTemplates();
      
      const response = {
        message: "WhatsApp template creation completed",
        success: results.success,
        failed: results.failed,
        successCount: results.success.length,
        failedCount: results.failed.length,
        timestamp: new Date().toISOString()
      };
      
      console.log('[Admin] Template creation results:', response);
      res.json(response);
    } catch (error) {
      console.error('[Admin] Create templates error:', error);
      res.status(500).json({ 
        message: "Failed to create templates",
        error: String(error),
        timestamp: new Date().toISOString()
      });
    }
  });

  // Fetch templates from Meta
  app.get("/api/admin/whatsapp/templates", requireAdminAuth, async (req, res) => {
    try {
      const { whatsappService } = await import('./services/whatsapp');
      const templates = await whatsappService.fetchTemplatesFromMeta();
      
      res.json({
        templates: templates,
        count: templates.length,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('[Admin] Fetch templates error:', error);
      res.status(500).json({ 
        message: "Failed to fetch templates from Meta",
        error: String(error),
        timestamp: new Date().toISOString()
      });
    }
  });

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

  app.post("/api/admin/send-message", async (req, res) => {
    try {
      const { userId, message } = req.body;
      
      if (!userId || !message) {
        return res.status(400).json({ message: "User ID and message are required" });
      }
      
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      const { messagingService } = await import('./services/messaging');
      const result = await messagingService.sendMessage(user.phone, message);
      
      console.log(`Admin sent message to ${user.fullName} (${user.phone}):`, { sms: result.sms, whatsapp: result.whatsapp });
      
      res.json({
        success: true,
        message: "Message sent successfully",
        sms: result.sms,
        whatsapp: result.whatsapp
      });
    } catch (error) {
      console.error('Error sending message:', error);
      res.status(500).json({ message: "Error sending message" });
    }
  });

  // Email settings endpoints
  app.get("/api/admin/email-settings", requireAdminAuth, async (req, res) => {
    try {
      const smtpHostSetting = await storage.getSystemSetting("email", "smtp_host");
      const smtpPortSetting = await storage.getSystemSetting("email", "smtp_port");
      const smtpSecureSetting = await storage.getSystemSetting("email", "smtp_secure");
      const smtpUsernameSetting = await storage.getSystemSetting("email", "smtp_username");
      const smtpPasswordSetting = await storage.getSystemSetting("email", "smtp_password");
      const fromEmailSetting = await storage.getSystemSetting("email", "from_email");
      const fromNameSetting = await storage.getSystemSetting("email", "from_name");
      
      const settings = {
        smtpHost: smtpHostSetting?.value || "",
        smtpPort: smtpPortSetting?.value || "465",
        smtpSecure: smtpSecureSetting?.value || "true",
        smtpUsername: smtpUsernameSetting?.value || "",
        smtpPassword: smtpPasswordSetting?.value || "",
        fromEmail: fromEmailSetting?.value || "",
        fromName: fromNameSetting?.value || "GreenPay",
      };
      
      res.json(settings);
    } catch (error) {
      console.error('Error fetching email settings:', error);
      res.status(500).json({ message: "Error fetching email settings" });
    }
  });

  app.put("/api/admin/email-settings", requireAdminAuth, async (req, res) => {
    try {
      const { smtpHost, smtpPort, smtpSecure, smtpUsername, smtpPassword, fromEmail, fromName } = req.body;
      
      console.log('Admin updated email settings');
      
      await storage.setSystemSetting({
        category: "email",
        key: "smtp_host",
        value: (smtpHost || '').trim(),
        description: "SMTP server hostname"
      });
      
      await storage.setSystemSetting({
        category: "email",
        key: "smtp_port",
        value: (smtpPort || '465').toString(),
        description: "SMTP server port"
      });
      
      await storage.setSystemSetting({
        category: "email",
        key: "smtp_secure",
        value: smtpSecure ? 'true' : 'false',
        description: "Use SSL/TLS for SMTP"
      });
      
      await storage.setSystemSetting({
        category: "email",
        key: "smtp_username",
        value: (smtpUsername || '').trim(),
        description: "SMTP username"
      });
      
      await storage.setSystemSetting({
        category: "email",
        key: "smtp_password",
        value: (smtpPassword || '').trim(),
        description: "SMTP password"
      });
      
      await storage.setSystemSetting({
        category: "email",
        key: "from_email",
        value: (fromEmail || '').trim(),
        description: "From email address"
      });
      
      await storage.setSystemSetting({
        category: "email",
        key: "from_name",
        value: (fromName || 'GreenPay').trim(),
        description: "From name"
      });
      
      res.json({ 
        success: true, 
        message: "Email settings updated successfully"
      });
    } catch (error) {
      console.error('Error updating email settings:', error);
      res.status(500).json({ message: "Error updating email settings" });
    }
  });

  // Send test email endpoint
  app.post("/api/admin/send-test-email", requireAdminAuth, async (req, res) => {
    try {
      const { email } = req.body;
      
      if (!email) {
        return res.status(400).json({ message: "Email address is required" });
      }
      
      const { emailService } = await import('./services/email');
      const result = await emailService.sendTestEmail(email);
      
      if (result) {
        console.log(`Admin sent test email to ${email}`);
        res.json({
          success: true,
          message: "Test email sent successfully"
        });
      } else {
        res.status(500).json({ 
          success: false,
          message: "Failed to send test email. Please check your email configuration." 
        });
      }
    } catch (error) {
      console.error('Error sending test email:', error);
      res.status(500).json({ message: "Error sending test email" });
    }
  });

  // Send custom email to specific user
  app.post("/api/admin/send-custom-email", requireAdminAuth, async (req, res) => {
    try {
      const { email, subject, message, imageUrl, linkText, linkUrl } = req.body;
      
      if (!email || !subject || !message) {
        return res.status(400).json({ message: "Email, subject, and message are required" });
      }
      
      const { emailService } = await import('./services/email');
      const { emailTemplates } = await import('./services/email-templates');
      
      const html = emailTemplates.custom({
        message,
        imageUrl: imageUrl || undefined,
        linkText: linkText || undefined,
        linkUrl: linkUrl || undefined,
      });
      
      const result = await emailService.sendEmail(email, subject, html);
      
      if (result) {
        console.log(`Admin sent custom email to ${email} with subject: ${subject}`);
        res.json({
          success: true,
          message: "Custom email sent successfully"
        });
      } else {
        res.status(500).json({ 
          success: false,
          message: "Failed to send custom email. Please check your email configuration." 
        });
      }
    } catch (error) {
      console.error('Error sending custom email:', error);
      res.status(500).json({ message: "Error sending custom email" });
    }
  });

  // User-to-user transfer endpoint with real-time balance updates
  app.post("/api/transfer", requireAuth, async (req, res) => {
    try {
      const { fromUserId, toUserId, amount, currency, description, pin } = req.body;
      
      console.log('=== TRANSFER DEBUG ===');
      console.log('Request Body:', { fromUserId, toUserId, amount, currency });
      
      if (!fromUserId || !toUserId || !amount || !currency) {
        console.error('[Transfer] Missing required fields:', { fromUserId: !!fromUserId, toUserId: !!toUserId, amount: !!amount, currency: !!currency });
        return res.status(400).json({ message: "Missing required fields" });
      }

      const transferAmount = parseFloat(amount);
      if (transferAmount <= 0) {
        console.error('[Transfer] Invalid amount:', transferAmount);
        return res.status(400).json({ message: "Invalid transfer amount" });
      }

      // Get both users
      console.log('[Transfer] Fetching users...');
      const fromUser = await storage.getUser(fromUserId);
      const toUser = await storage.getUser(toUserId);
      
      console.log('[Transfer] From User:', { found: !!fromUser, balance: fromUser?.balance, email: fromUser?.email });
      console.log('[Transfer] To User:', { found: !!toUser, balance: toUser?.balance, email: toUser?.email });

      if (!fromUser || !toUser) {
        console.error('[Transfer] User not found - fromUser:', !!fromUser, 'toUser:', !!toUser);
        return res.status(404).json({ message: "User not found" });
      }

      // Check PIN if required by admin settings OR if user has it enabled
      const settings = await storage.getSystemSettings();
      const pinRequiredByAdmin = settings.some(s => s.key === "pin_required" && s.value === "true");
      
      if ((pinRequiredByAdmin || fromUser.pinEnabled) && fromUser.pinCode) {
        if (!pin) {
          return res.status(400).json({ message: "PIN required", requiresPin: true });
        }
        
        // Verify PIN
        const isPinValid = await bcrypt.compare(pin, fromUser.pinCode);
        if (!isPinValid) {
          return res.status(401).json({ message: "Invalid PIN", success: false });
        }
      }

      // Use balance field directly (it's already the current state!)
      const senderBalance = parseFloat(fromUser.balance || '0');
      const recipientBalance = parseFloat(toUser.balance || '0');

      if (senderBalance < transferAmount) {
        console.error('[Transfer] Insufficient balance:', { senderBalance, transferAmount });
        return res.status(400).json({ message: "Insufficient balance" });
      }

      // Calculate new balances - simple arithmetic
      const senderNewBalance = senderBalance - transferAmount;
      const recipientNewBalance = recipientBalance + transferAmount;
      
      console.log('[Transfer] Balance calculation:', { 
        senderOld: senderBalance, 
        senderNew: senderNewBalance, 
        recipientOld: recipientBalance, 
        recipientNew: recipientNewBalance,
        transferAmount 
      });

      // Create transfer transactions
      const now = new Date().toISOString();
      const transferId = storage.generateTransactionReference();

      // Sender transaction (debit)
      const senderTransaction = await storage.createTransaction({
        userId: fromUserId,
        type: 'send',
        amount: amount,
        currency: currency,
        status: 'completed',
        description: description || `Transfer to ${toUser.fullName}`,
        recipient: toUser.fullName,
        recipientEmail: toUser.email,
        transferId: transferId,
        fee: '0'
      });

      // Recipient transaction (credit)
      const recipientTransaction = await storage.createTransaction({
        userId: toUserId,
        type: 'receive',
        amount: amount,
        currency: currency,
        status: 'completed',
        description: description || `Transfer from ${fromUser.fullName}`,
        sender: fromUser.fullName,
        senderEmail: fromUser.email,
        transferId: transferId,
        fee: '0'
      });

      // UPDATE BALANCES IN DATABASE
      console.log('[Transfer] Updating balances - Sender:', senderNewBalance, 'Recipient:', recipientNewBalance);
      await storage.updateUser(fromUserId, { balance: senderNewBalance.toFixed(2) });
      await storage.updateUser(toUserId, { balance: recipientNewBalance.toFixed(2) });

      // Send email to recipient with fund receipt using Mailtrap
      const { MailtrapService } = await import('./services/mailtrap');
      const mailtrapService = new MailtrapService();
      const transactionDate = new Date().toISOString();
      
      mailtrapService.sendTemplate(
        toUser.email,
        '5e2a2ec4-37fb-4178-96c4-598977065f9c',
        {
          sender: fromUser.fullName,
          amount: amount,
          currency: currency,
          date: transactionDate,
          transaction_id: recipientTransaction.id
        }
      ).then(success => {
        if (success) {
          console.log(`✅ Fund receipt email sent to ${toUser.email} - Transaction ID: ${recipientTransaction.id}, Sender: ${fromUser.fullName}, Amount: ${amount} ${currency}, Date: ${transactionDate}`);
        } else {
          console.warn(`⚠️ Failed to send fund receipt email to ${toUser.email}`);
        }
      }).catch(err => {
        console.error('Email sending error:', err);
      });

      // Send notifications to both users
      const { messagingService } = await import('./services/messaging');
      
      // Send SMS/WhatsApp to sender
      messagingService.sendMessage(
        fromUser.phone,
        `You sent $${transferAmount} to ${toUser.fullName}. Your new balance: $${senderNewBalance.toFixed(2)}`
      ).catch(err => console.error('Notification error:', err));

      // Send SMS/WhatsApp to recipient
      messagingService.sendMessage(
        toUser.phone,
        `You received $${transferAmount} from ${fromUser.fullName}. Your new balance: $${recipientNewBalance.toFixed(2)}`
      ).catch(err => console.error('Notification error:', err));

      console.log(`[Transfer] Completed: $${transferAmount} from ${fromUser.fullName} (${fromUserId}) to ${toUser.fullName} (${toUserId})`);

      res.json({ 
        success: true, 
        transferId,
        message: "Transfer completed successfully",
        senderNewBalance: senderNewBalance.toFixed(2),
        recipientNewBalance: recipientNewBalance.toFixed(2)
      });
    } catch (error) {
      console.error('Transfer error:', error);
      res.status(500).json({ message: "Error processing transfer" });
    }
  });

  app.post("/api/auth/reset-pin", async (req, res) => {
    try {
      const { phone, code, newPin } = req.body;
      
      if (!phone || !code || !newPin) {
        return res.status(400).json({ message: "Phone, code, and new PIN are required" });
      }

      if (!/^\d{4}$/.test(newPin)) {
        return res.status(400).json({ message: "PIN must be 4 digits" });
      }

      const { messagingService } = await import('./services/messaging');
      const formattedPhone = messagingService.formatPhoneNumber(phone);
      const user = await storage.getUserByPhone(formattedPhone);

      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Verify reset code
      const isValid = await storage.verifyUserOtp(user.id, code);
      if (!isValid) {
        return res.status(400).json({ message: "Invalid or expired reset code" });
      }

      // Hash and update PIN
      const hashedPin = await bcrypt.hash(newPin, 10);
      await storage.updateUser(user.id, { 
        pinCode: hashedPin,
        pinEnabled: true 
      });

      // Clear OTP
      await storage.updateUserOtp(user.id, null, null);

      // Log activity
      console.log(`[ResetPIN] Success for user ${user.id}`);
      
      res.json({ success: true, message: "PIN reset successful" });
    } catch (error) {
      console.error('Reset PIN error:', error);
      res.status(500).json({ message: "Failed to reset PIN" });
    }
  });

  // Login PIN verification endpoint
  app.post("/api/auth/verify-pin", async (req, res) => {
    try {
      const { userId, pin } = req.body;

      if (!userId || !pin) {
        return res.status(400).json({ message: "User ID and PIN are required" });
      }

      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Verify PIN
      if (!user.pinEnabled || !user.pinCode) {
        return res.status(400).json({ message: "PIN not set up" });
      }

      const isPinValid = await bcrypt.compare(pin, user.pinCode);
      if (!isPinValid) {
        return res.status(401).json({ message: "Invalid PIN" });
      }

      // Complete login session
      req.session.regenerate((err) => {
        if (err) {
          console.error('Session regeneration error:', err);
          return res.status(500).json({ message: "Session error" });
        }

        (req.session as any).userId = user.id;
        (req.session as any).user = { id: user.id, email: user.email };

        storage.createLoginHistory({
          userId: user.id,
          ipAddress: req.ip || (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || 'Unknown',
          userAgent: req.headers['user-agent'] || 'Unknown',
          deviceType: req.headers['user-agent']?.includes('Mobile') ? 'mobile' : 'desktop',
          browser: req.headers['user-agent']?.split('/')[0] || 'Unknown',
          location: (req.headers['cf-ipcountry'] as string) || 'Unknown',
          status: 'success',
        }).catch(err => console.error('Login history error:', err));

        const { password: _, ...userResponse } = user;

        req.session.save((saveErr) => {
          if (saveErr) {
            console.error('Session save error:', saveErr);
            return res.status(500).json({ message: "Session save error" });
          }
          res.json({ user: userResponse });
        });
      });
    } catch (error) {
      console.error('PIN login verification error:', error);
      res.status(500).json({ message: "PIN verification failed" });
    }
  });

  // PIN disable/reset endpoint
  app.post("/api/users/:id/pin/disable", requireAuth, async (req, res) => {
    try {
      const { id } = req.params;
      const { password } = req.body;

      if (!password) {
        return res.status(400).json({ message: "Password is required to disable PIN" });
      }

      const user = await storage.getUser(id);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Verify password
      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
        return res.status(401).json({ message: "Invalid password" });
      }

      // Disable PIN
      const { db } = await import('./db');
      const { users } = await import('@/shared/schema');
      const { eq } = await import('drizzle-orm');
      
      await db.update(users).set({
        pinEnabled: false,
        pinCode: null
      }).where(eq(users.id, id));

      // Get updated user
      const updatedUser = await storage.getUser(id);
      
      // Update session if it exists
      if (req.session.user) {
        req.session.user.pinEnabled = false;
      }

      const { password: _, ...userResponse } = updatedUser;
      res.json({ success: true, message: "PIN disabled successfully", user: userResponse });
    } catch (error) {
      console.error('PIN disable error:', error);
      res.status(500).json({ message: "Failed to disable PIN" });
    }
  });

  // Get system settings for admin-to-user sync
  app.get("/api/system-settings", async (req, res) => {
    try {
      const settings = await storage.getSystemSettings();
      const settingsMap: any = {};
      
      settings.forEach(setting => {
        if (!settingsMap[setting.category]) {
          settingsMap[setting.category] = {};
        }
        settingsMap[setting.category][setting.key] = {
          value: setting.value,
          description: setting.description
        };
      });

      res.json(settingsMap);
    } catch (error) {
      console.error('System settings error:', error);
      res.status(500).json({ message: "Failed to load system settings" });
    }
  });

  // Notification endpoints
  app.get("/api/notifications/:userId", async (req, res) => {
    try {
      const { userId } = req.params;
      
      // Get user-specific notifications and global notifications
      const userNotifications = await storage.getNotificationsByUserId(userId);
      const globalNotifications = await storage.getGlobalNotifications();
      
      // Combine and sort by created date
      const allNotifications = [...userNotifications, ...globalNotifications]
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      
      res.json({ notifications: allNotifications });
    } catch (error) {
      console.error('Error fetching notifications:', error);
      res.status(500).json({ message: "Error fetching notifications" });
    }
  });

  app.post("/api/notifications/:id/read", async (req, res) => {
    try {
      const { id } = req.params;
      await storage.markNotificationAsRead(id);
      res.json({ success: true });
    } catch (error) {
      console.error('Error marking notification as read:', error);
      res.status(500).json({ message: "Error updating notification" });
    }
  });

  // Admin withdrawal management endpoints
  app.get("/api/admin/withdrawals", async (req, res) => {
    try {
      const transactions = await storage.getAllTransactions();
      const withdrawals = transactions.filter(t => t.type === 'withdraw');
      
      // Get user info for each withdrawal
      const withdrawalsWithUserInfo = await Promise.all(
        withdrawals.map(async (withdrawal) => {
          const user = await storage.getUser(withdrawal.userId);
          return {
            ...withdrawal,
            userInfo: {
              fullName: user?.fullName || 'Unknown',
              email: user?.email || 'Unknown',
              phone: user?.phone || 'Unknown'
            }
          };
        })
      );
      
      res.json({ withdrawals: withdrawalsWithUserInfo });
    } catch (error) {
      console.error('Error fetching withdrawals:', error);
      res.status(500).json({ message: "Error fetching withdrawal requests" });
    }
  });

  app.post("/api/admin/withdrawals/:id/approve", async (req, res) => {
    try {
      const { id } = req.params;
      const { adminNotes } = req.body;
      
      const transaction = await storage.updateTransaction(id, {
        status: 'completed',
        adminNotes: adminNotes || 'Approved by admin',
        processedAt: new Date()
      });
      
      if (transaction) {
        // Deduct balance from user's account (correct wallet based on currency)
        const user = await storage.getUser(transaction.userId);
        if (user) {
          const withdrawalAmount = parseFloat(transaction.amount);
          const withdrawalFee = parseFloat(transaction.fee || '0');
          const totalDeduction = withdrawalAmount + withdrawalFee;
          
          // Check currency and deduct from correct wallet
          const isKesWithdrawal = transaction.currency?.toUpperCase() === 'KES';
          const currentBalance = parseFloat(isKesWithdrawal ? (user.kesBalance || '0') : (user.balance || '0'));
          const newBalance = (currentBalance - totalDeduction).toFixed(2);
          
          // Update the correct wallet balance
          const balanceUpdate = isKesWithdrawal 
            ? { kesBalance: newBalance } 
            : { balance: newBalance };
          
          await storage.updateUser(user.id, balanceUpdate);
          
          await notificationService.sendNotification({
            title: "Withdrawal Approved",
            body: `Your withdrawal of ${transaction.currency} ${transaction.amount} has been approved and processed.`,
            userId: user.id,
            type: "transaction"
          });
        }
      }
      
      res.json({ transaction, message: "Withdrawal approved successfully" });
    } catch (error) {
      console.error('Error approving withdrawal:', error);
      res.status(500).json({ message: "Error approving withdrawal" });
    }
  });

  app.post("/api/admin/withdrawals/:id/reject", async (req, res) => {
    try {
      const { id } = req.params;
      const { adminNotes } = req.body;
      
      const transaction = await storage.updateTransaction(id, {
        status: 'failed',
        adminNotes: adminNotes || 'Rejected by admin',
        processedAt: new Date()
      });
      
      if (transaction) {
        // Notify user
        const user = await storage.getUser(transaction.userId);
        if (user) {
          await notificationService.sendNotification({
            title: "Withdrawal Rejected",
            body: `Your withdrawal request has been rejected. ${adminNotes || 'Please contact support for details.'}`,
            userId: user.id,
            type: "transaction"
          });
        }
      }
      
      res.json({ transaction, message: "Withdrawal rejected" });
    } catch (error) {
      console.error('Error rejecting withdrawal:', error);
      res.status(500).json({ message: "Error rejecting withdrawal" });
    }
  });

  // Admin notification broadcast
  app.post("/api/admin/broadcast-notification", async (req, res) => {
    try {
      const { title, message, type, actionUrl, expiresIn } = req.body;
      
      if (!title || !message) {
        return res.status(400).json({ message: "Title and message are required" });
      }
      
      const expiresAt = expiresIn ? new Date(Date.now() + expiresIn * 60 * 1000) : null;
      
      const notification = await storage.createNotification({
        title,
        message,
        type: type || "info",
        isGlobal: true,
        actionUrl,
        expiresAt
      });
      
      res.json({ 
        success: true, 
        notification,
        message: "Notification broadcast successfully" 
      });
    } catch (error) {
      console.error('Error broadcasting notification:', error);
      res.status(500).json({ message: "Error broadcasting notification" });
    }
  });

  app.get("/api/admin/notifications", async (req, res) => {
    try {
      const globalNotifications = await storage.getGlobalNotifications();
      res.json({ notifications: globalNotifications });
    } catch (error) {
      console.error('Error fetching admin notifications:', error);
      res.status(500).json({ message: "Error fetching notifications" });
    }
  });

  // Delete notification
  app.delete("/api/admin/notifications/:id", async (req, res) => {
    try {
      const { id } = req.params;
      
      await storage.deleteNotification(id);
      
      res.json({ 
        success: true, 
        message: "Notification deleted successfully" 
      });
    } catch (error) {
      console.error('Error deleting notification:', error);
      res.status(500).json({ message: "Error deleting notification" });
    }
  });

  // System logs endpoints
  app.get("/api/admin/system-logs", async (req, res) => {
    try {
      const minutes = req.query.minutes ? parseInt(req.query.minutes as string) : 30;
      const logs = await storage.getSystemLogs(minutes);
      res.json({ logs });
    } catch (error) {
      console.error('Error fetching system logs:', error);
      res.status(500).json({ message: "Error fetching system logs" });
    }
  });

  // Update withdrawal status
  app.put("/api/admin/withdrawals/:id/status", async (req, res) => {
    try {
      const { id } = req.params;
      const { status, adminNotes } = req.body;
      
      if (!status || !['pending', 'completed', 'failed'].includes(status)) {
        return res.status(400).json({ message: "Invalid status. Must be pending, completed, or failed." });
      }
      
      const updatedWithdrawal = await storage.updateWithdrawalRequest(id, {
        status,
        adminNotes,
        processedAt: status !== 'pending' ? new Date() : null
      });
      
      if (!updatedWithdrawal) {
        return res.status(404).json({ message: "Withdrawal request not found" });
      }
      
      res.json({ 
        withdrawal: updatedWithdrawal,
        message: `Withdrawal status updated to ${status}` 
      });
    } catch (error) {
      console.error('Error updating withdrawal status:', error);
      res.status(500).json({ message: "Error updating withdrawal status" });
    }
  });

  // System settings endpoint for card price
  app.get("/api/system-settings/card-price", async (req, res) => {
    try {
      const cardPriceSetting = await storage.getSystemSetting("virtual_card", "price");
      const cardPrice = cardPriceSetting?.value || "60.00";
      res.json({ price: cardPrice });
    } catch (error) {
      console.error('Error fetching card price:', error);
      res.status(500).json({ message: "Error fetching card price" });
    }
  });

  // Update system settings card price endpoint
  app.put("/api/system-settings/card-price", async (req, res) => {
    try {
      const { price } = req.body;
      
      if (!price || isNaN(parseFloat(price)) || parseFloat(price) <= 0) {
        return res.status(400).json({ message: "Valid price is required" });
      }
      
      const formattedPrice = parseFloat(price).toFixed(2);
      
      // Check if setting exists
      const existingSetting = await storage.getSystemSetting("virtual_card", "price");
      
      if (existingSetting) {
        // Update existing setting
        await storage.updateSystemSetting(existingSetting.id, { value: formattedPrice });
      } else {
        // Create new setting
        await storage.setSystemSetting({
          category: "virtual_card",
          key: "price", 
          value: formattedPrice
        });
      }
      
      res.json({ 
        success: true, 
        price: formattedPrice,
        message: "Card price updated successfully" 
      });
    } catch (error) {
      console.error('Error updating card price:', error);
      res.status(500).json({ message: "Error updating card price" });
    }
  });

  // Convert USD to KES endpoint
  app.post("/api/convert-to-kes", async (req, res) => {
    try {
      const { usdAmount } = req.body;
      
      if (!usdAmount || isNaN(parseFloat(usdAmount)) || parseFloat(usdAmount) <= 0) {
        return res.status(400).json({ message: "Valid USD amount is required" });
      }
      
      const kesAmount = await payHeroService.convertUSDtoKES(parseFloat(usdAmount));
      
      res.json({ 
        usdAmount: parseFloat(usdAmount),
        kesAmount: kesAmount,
        exchangeRate: 129
      });
    } catch (error) {
      console.error('Error converting USD to KES:', error);
      res.status(500).json({ message: "Error converting currency" });
    }
  });

  // LOG USER ACTIVITY - Frontend calls this to track pages, actions, attempts
  app.post("/api/log-activity", requireAuth, async (req, res) => {
    try {
      const userId = (req.session as any).userId;
      const { activityType, page, action, description, status, metadata } = req.body;

      if (!userId || !activityType) {
        return res.status(400).json({ message: "userId and activityType required" });
      }

      const activity = await storage.createUserActivity({
        userId,
        activityType,
        page: page || null,
        action: action || null,
        description: description || null,
        status: status || 'success',
        metadata: metadata || null,
        ipAddress: req.ip || null,
        userAgent: req.headers['user-agent'] || null
      });

      res.json({ success: true, activity });
    } catch (error) {
      console.error('Error logging activity:', error);
      res.status(500).json({ message: "Error logging activity" });
    }
  });

  // USER ACTIVITY TIMELINE - Get all user activities from last 48 hours
  app.get("/api/admin/users/:userId/activity", async (req, res) => {
    try {
      const { userId } = req.params;
      const hours = req.query.hours ? parseInt(req.query.hours as string) : 48;
      
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const now = new Date();
      const timeWindowMs = hours * 60 * 60 * 1000;
      const cutoffTime = new Date(now.getTime() - timeWindowMs);

      // Fetch all data for this user
      const transactions = await storage.getTransactionsByUserId(userId);
      const loginHistory = await storage.getLoginHistoryByUserId(userId, 100);
      const kyc = await storage.getKycByUserId(userId);
      const virtualCard = await storage.getVirtualCardByUserId(userId);
      const userActivities = await storage.getUserActivitiesByUserId(userId, 200);

      // Build unified activity timeline
      const activities: any[] = [];

      // Add page visits and user actions
      userActivities.forEach(act => {
        const actDate = new Date(act.createdAt);
        if (actDate >= cutoffTime) {
          const typeIcons: any = {
            page_visit: '📄',
            action: '⚡',
            attempt: '🔄',
            form_submission: '📝'
          };
          activities.push({
            id: act.id,
            type: act.activityType,
            action: act.description || `${act.action} on ${act.page}`,
            details: {
              page: act.page,
              action: act.action,
              status: act.status,
              metadata: act.metadata,
              ipAddress: act.ipAddress,
              userAgent: act.userAgent
            },
            timestamp: actDate,
            icon: typeIcons[act.activityType as string] || '✓'
          });
        }
      });

      // Add transactions
      transactions.forEach(txn => {
        const txnDate = new Date(txn.createdAt);
        if (txnDate >= cutoffTime) {
          activities.push({
            id: txn.id,
            type: txn.type === 'send' ? 'transfer_sent' : txn.type === 'receive' ? 'transfer_received' : txn.type,
            action: txn.type === 'send' ? `Sent $${txn.amount} ${txn.currency}` : txn.type === 'receive' ? `Received $${txn.amount} ${txn.currency}` : `${txn.type}: $${txn.amount}`,
            details: {
              amount: txn.amount,
              currency: txn.currency,
              recipient: txn.recipient || txn.sender,
              status: txn.status,
              description: txn.description
            },
            timestamp: txnDate,
            icon: txn.type === 'send' ? '📤' : txn.type === 'receive' ? '📥' : '💳'
          });
        }
      });

      // Add login history
      loginHistory.forEach(login => {
        const loginDate = new Date(login.createdAt);
        if (loginDate >= cutoffTime) {
          activities.push({
            id: login.id,
            type: 'login',
            action: `Login from ${login.location || 'Unknown Location'}`,
            details: {
              device: login.deviceType,
              browser: login.browser,
              ipAddress: login.ipAddress,
              location: login.location,
              status: login.status
            },
            timestamp: loginDate,
            icon: '🔐'
          });
        }
      });

      // Add KYC updates
      if (kyc) {
        const kycDate = new Date(kyc.updatedAt || kyc.createdAt);
        if (kycDate >= cutoffTime) {
          activities.push({
            id: kyc.id,
            type: 'kyc',
            action: `KYC Status: ${kyc.status}`,
            details: {
              documentType: kyc.documentType,
              status: kyc.status,
              verificationNotes: kyc.verificationNotes
            },
            timestamp: kycDate,
            icon: '📋'
          });
        }
      }

      // Add virtual card activities
      if (virtualCard) {
        const cardDate = new Date(virtualCard.purchaseDate || virtualCard.updatedAt);
        if (cardDate >= cutoffTime) {
          activities.push({
            id: virtualCard.id,
            type: 'card_purchase',
            action: `Virtual Card Purchase - $${virtualCard.purchaseAmount}`,
            details: {
              cardNumber: virtualCard.cardNumber,
              status: virtualCard.status,
              balance: virtualCard.balance
            },
            timestamp: cardDate,
            icon: '💳'
          });
        }
      }

      // Sort by timestamp descending (newest first)
      activities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

      res.json({
        userId,
        user: {
          id: user.id,
          email: user.email,
          fullName: user.fullName,
          phone: user.phone
        },
        timeWindow: `${hours} hours`,
        totalActivities: activities.length,
        activities
      });
    } catch (error) {
      console.error('Error fetching user activity:', error);
      res.status(500).json({ message: "Error fetching user activity" });
    }
  });

  // Admin login as user endpoint
  app.post("/api/admin/login-as-user", async (req, res) => {
    try {
      const { userId } = req.body;
      
      if (!userId) {
        return res.status(400).json({ message: "User ID is required" });
      }
      
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      console.log('Admin logging in as user:', user.email);
      
      // Create session for the user (simulate login)
      res.json({
        success: true,
        user: {
          id: user.id,
          fullName: user.fullName,
          email: user.email,
          phone: user.phone,
          country: user.country,
          balance: user.balance || "0.00",
          hasVirtualCard: user.hasVirtualCard || false,
          kycStatus: user.kycStatus || "pending",
          isEmailVerified: user.isEmailVerified,
          isPhoneVerified: user.isPhoneVerified
        },
        message: "Admin logged in as user successfully"
      });
    } catch (error) {
      console.error('Admin login as user error:', error);
      res.status(500).json({ message: "Error logging in as user" });
    }
  });

  // PayHero transaction status endpoint
  app.get("/api/transaction-status/:reference", async (req, res) => {
    try {
      const { reference } = req.params;
      
      if (!reference) {
        return res.status(400).json({ message: "Transaction reference is required" });
      }

      console.log('Checking transaction status for reference:', reference);
      
      const statusResult = await payHeroService.checkTransactionStatus(reference);
      
      res.json({
        success: statusResult.success,
        status: statusResult.status,
        data: statusResult.data,
        message: statusResult.message
      });
    } catch (error) {
      console.error('Transaction status check error:', error);
      res.status(500).json({ message: "Error checking transaction status" });
    }
  });

  // Withdrawal endpoint
  app.post("/api/transactions", async (req, res) => {
    try {
      const { userId, type, amount, currency, description, fee, recipientDetails } = req.body;
      
      if (type !== 'withdraw') {
        return res.status(400).json({ message: "This endpoint only handles withdrawal requests" });
      }
      
      const withdrawAmount = parseFloat(amount);
      const withdrawFee = parseFloat(fee || '0');
      
      if (withdrawAmount <= 0) {
        return res.status(400).json({ message: "Invalid withdrawal amount" });
      }
      
      // Get user
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Calculate real-time balance based on withdrawal currency
      const userTransactions = await storage.getTransactionsByUserId(userId);
      const isKesWithdrawal = currency?.toUpperCase() === 'KES';
      
      // For KES withdrawals, check KES balance; for USD withdrawals, check USD balance
      const realTimeBalance = userTransactions.reduce((balance: number, txn: any) => {
        if (txn.status === 'completed') {
          // Only count transactions matching the withdrawal currency
          const txnCurrency = txn.currency?.toUpperCase();
          const matchesCurrency = isKesWithdrawal ? txnCurrency === 'KES' : txnCurrency !== 'KES';
          
          if (matchesCurrency) {
            if (txn.type === 'receive' || txn.type === 'deposit') {
              return balance + parseFloat(txn.amount);
            } else if (txn.type === 'send' || txn.type === 'withdraw') {
              return balance - parseFloat(txn.amount) - parseFloat(txn.fee || '0');
            }
          }
          // card_purchase not deducted from balance (paid via M-Pesa)
        }
        return balance;
      }, parseFloat(isKesWithdrawal ? (user.kesBalance || '0') : (user.balance || '0')));
      
      // Check sufficient balance
      if (realTimeBalance < withdrawAmount + withdrawFee) {
        return res.status(400).json({ 
          message: "Insufficient balance",
          currency: currency,
          available: realTimeBalance.toFixed(2),
          required: (withdrawAmount + withdrawFee).toFixed(2)
        });
      }
      
      // Create withdrawal transaction with pending status
      const transaction = await storage.createTransaction({
        userId,
        type: 'withdraw' as const,
        amount: amount,
        currency,
        status: 'pending' as const, // Withdrawals start as pending for admin approval
        description,
        fee: fee || '0.00',
        recipientDetails,
        reference: storage.generateTransactionReference()
      });
      
      // Send notification to admins about new withdrawal request
      await notificationService.sendNotification({
        title: "Withdrawal Request",
        body: `New withdrawal request: ${currency} ${amount} from ${user.fullName}`,
        userId: userId, // This will be extended to notify admins too
        type: "transaction"
      });
      
      res.json({ 
        transaction,
        message: "Withdrawal request submitted successfully. It will be processed within 1-3 business days."
      });
    } catch (error) {
      console.error('Withdrawal error:', error);
      res.status(500).json({ message: "Error processing withdrawal request" });
    }
  });

  // PayHero callback endpoint
  app.post("/api/payhero-callback", async (req, res) => {
    try {
      console.log('PayHero callback received:', JSON.stringify(req.body, null, 2));
      
      const callbackData = req.body;
      const { reference, type } = req.query;
      
      if (!callbackData.response) {
        console.error('Invalid PayHero callback data - missing response');
        return res.status(400).json({ message: "Invalid callback data" });
      }

      const paymentResult = payHeroService.processCallback(callbackData);
      console.log('Processed payment result:', paymentResult);
      
      if (paymentResult.success) {
        if (type === 'virtual-card') {
          // Find the user by phone number from the callback data
          let userId = null;
          let userPhone = null;
          
          // Extract phone from callback data if available
          if (callbackData.response && callbackData.response.phoneNumber) {
            userPhone = callbackData.response.phoneNumber;
          } else if (callbackData.phone) {
            userPhone = callbackData.phone;
          }
          
          // Find user by phone number
          if (userPhone) {
            const users = await storage.getAllUsers();
            const user = users.find(u => u.phone === userPhone);
            if (user) {
              userId = user.id;
            }
          }
          
          // Fallback: find by payment reference in existing transactions (for existing users)
          if (!userId) {
            const transactions = await storage.getAllTransactions();
            for (const transaction of transactions) {
              if (transaction.reference === paymentResult.reference) {
                userId = transaction.userId;
                break;
              }
            }
          }
          
          if (!userId) {
            console.error('Could not find user for payment reference:', paymentResult.reference, 'phone:', userPhone);
            return res.status(200).json({ message: "Payment processed but user not found" });
          }

          // Create virtual card for the user
          const cardData = {
            userId: userId,
            cardNumber: `5399 ${Math.floor(1000 + Math.random() * 9000)} ${Math.floor(1000 + Math.random() * 9000)} ${Math.floor(1000 + Math.random() * 9000)}`,
            expiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000 * 3), // 3 years from now
            cvv: Math.floor(100 + Math.random() * 900).toString(),
            balance: 0,
            status: 'active' as const,
            type: 'virtual' as const
          };

          const newCard = await storage.createVirtualCard(cardData);
          console.log('Virtual card created successfully:', newCard.id);

          // Create a transaction record for the card purchase
          const transactionData = {
            userId: userId,
            amount: paymentResult.amount.toString(),
            currency: 'KES',
            status: 'completed' as const,
            type: 'card_purchase' as const,
            description: `Virtual card purchase - Payment via M-Pesa (${paymentResult.mpesaReceiptNumber})`,
            fee: '0.00',
            reference: paymentResult.reference,
            recipientDetails: null
          };

          await storage.createTransaction(transactionData);
          console.log('Card purchase transaction recorded for user:', userId);
        }
        
        console.log('PayHero payment completed successfully');
        res.status(200).json({ message: "Payment processed successfully" });
      } else {
        console.log('PayHero payment failed:', paymentResult.status);
        res.status(200).json({ message: "Payment failed", status: paymentResult.status });
      }
    } catch (error) {
      console.error('PayHero callback processing error:', error);
      res.status(500).json({ message: "Error processing payment callback" });
    }
  });

  // System status endpoint - checks app features health
  app.get("/api/system/status", async (req, res) => {
    try {
      console.log('🔍 System status check initiated');
      
      const statusChecks: any = {
        timestamp: new Date().toISOString(),
        features: {},
        overall: 'healthy'
      };

      // Check if users can access their account
      try {
        await storage.getAllUsers();
        statusChecks.features.accountAccess = { 
          status: 'healthy', 
          message: 'You can log in and access your account',
          icon: '👤'
        };
        console.log('✅ Account Access: Healthy');
      } catch (error) {
        statusChecks.features.accountAccess = { 
          status: 'unhealthy', 
          message: 'Account access is currently unavailable',
          icon: '👤'
        };
        statusChecks.overall = 'degraded';
        console.error('❌ Account Access: Unhealthy', error);
      }

      // Check if file uploads/downloads work with Cloudinary
      try {
        // Just check if Cloudinary is configured
        if (process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY) {
          statusChecks.features.fileUploads = { 
            status: 'healthy', 
            message: 'Document uploads and profile photos working',
            icon: '📁'
          };
          console.log('✅ File Uploads: Healthy');
        } else {
          statusChecks.features.fileUploads = { 
            status: 'degraded', 
            message: 'File storage not configured - uploads won\'t work',
            icon: '📁'
          };
          console.warn('⚠️ File Uploads: Not configured');
        }
      } catch (error) {
        statusChecks.features.fileUploads = { 
          status: 'degraded', 
          message: 'Document uploads may have issues',
          icon: '📁'
        };
        console.warn('⚠️ File Uploads: Degraded', error);
      }

      // Check if currency exchange works
      try {
        const rate = await exchangeRateService.getExchangeRate('USD', 'KES');
        statusChecks.features.currencyExchange = { 
          status: 'healthy', 
          message: `You can exchange USD to KES (rate: ${rate})`,
          icon: '💱'
        };
        console.log('✅ Currency Exchange: Healthy');
      } catch (error) {
        statusChecks.features.currencyExchange = { 
          status: 'degraded', 
          message: 'Using backup exchange rates',
          icon: '💱'
        };
        console.warn('⚠️ Currency Exchange: Degraded', error);
      }

      // Check if airtime purchase is available
      const statumConfigured = statumService.isConfigured();
      if (statumConfigured) {
        statusChecks.features.airtimePurchase = { 
          status: 'healthy', 
          message: 'You can buy airtime for all networks',
          icon: '📱'
        };
        console.log('✅ Airtime Purchase: Healthy');
      } else {
        statusChecks.features.airtimePurchase = { 
          status: 'unhealthy', 
          message: 'Airtime purchases are temporarily unavailable',
          icon: '📱'
        };
        statusChecks.overall = 'degraded';
        console.warn('⚠️ Airtime Purchase: Unhealthy');
      }

      // Check money transfers
      try {
        const transactions = await storage.getAllTransactions();
        statusChecks.features.moneyTransfers = { 
          status: 'healthy', 
          message: 'You can send and receive money',
          icon: '💸'
        };
        console.log('✅ Money Transfers: Healthy');
      } catch (error) {
        statusChecks.features.moneyTransfers = { 
          status: 'unhealthy', 
          message: 'Money transfers are currently unavailable',
          icon: '💸'
        };
        statusChecks.overall = 'degraded';
        console.warn('⚠️ Money Transfers: Unhealthy', error);
      }

      // Check virtual cards
      try {
        const cards = await storage.getAllVirtualCards();
        statusChecks.features.virtualCards = { 
          status: 'healthy', 
          message: 'You can purchase and manage virtual cards',
          icon: '💳'
        };
        console.log('✅ Virtual Cards: Healthy');
      } catch (error) {
        statusChecks.features.virtualCards = { 
          status: 'unhealthy', 
          message: 'Virtual card services are unavailable',
          icon: '💳'
        };
        console.warn('⚠️ Virtual Cards: Unhealthy', error);
      }

      // Check notifications
      try {
        statusChecks.features.notifications = { 
          status: 'healthy', 
          message: 'You will receive notifications for transactions',
          icon: '🔔'
        };
        console.log('✅ Notifications: Healthy');
      } catch (error) {
        statusChecks.features.notifications = { 
          status: 'degraded', 
          message: 'Notifications may be delayed',
          icon: '🔔'
        };
        console.warn('⚠️ Notifications: Degraded', error);
      }

      console.log(`🏁 System status check completed - Overall: ${statusChecks.overall}`);
      res.json(statusChecks);
    } catch (error) {
      console.error('❌ Status check error:', error);
      res.status(500).json({ 
        overall: 'unhealthy',
        error: 'Failed to perform status check',
        timestamp: new Date().toISOString()
      });
    }
  });

  // Database Connection Check
  app.get("/api/admin/database/check", requireAdminAuth, async (req, res) => {
    try {
      const result = await db.select().from(users).limit(1);
      res.json({ connected: true, message: "Database connection successful" });
    } catch (error) {
      console.error("Database connection check failed:", error);
      res.status(500).json({ 
        connected: false, 
        error: "Failed to connect to database",
        message: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  // User Console Logs Endpoint - Get system logs tied to specific users
  app.get("/api/admin/user-activities", requireAdminAuth, async (req, res) => {
    try {
      const { userId } = req.query;
      
      let query = db.select().from(systemLogs);
      
      // If userId provided, filter by that user's logs
      if (userId && typeof userId === "string") {
        query = query.where((logs) => logs.source.like(`%:${userId}%`));
      }
      
      const activities = await query
        .orderBy(desc(systemLogs.timestamp))
        .limit(500);

      const formattedActivities = activities.map((log) => {
        const data = log.data as any;
        const source = log.source || "";
        const userId = source.split(":")[1] || "system";
        
        return {
          id: log.id,
          userId,
          level: log.level,
          message: log.message,
          source: log.source,
          timestamp: log.timestamp,
          data,
        };
      });

      res.json(formattedActivities);
    } catch (error) {
      console.error("Failed to fetch user activities:", error);
      res.status(500).json({ error: "Failed to fetch activities" });
    }
  });

  // Database Backup & Restore Endpoints
  interface BackupFile {
    id: string;
    filename: string;
    data: Buffer;
    createdAt: Date;
  }
  
  const backups = new Map<string, BackupFile>();

  // Export database backup
  app.post("/api/admin/database/backup", requireAdminAuth, async (req, res) => {
    try {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const backupId = `backup_${timestamp}_${Math.random().toString(36).substr(2, 9)}`;
      
      const tables = {
        users: await db.select().from(users),
        admins: await db.select().from(admins),
        kycDocuments: await db.select().from(kycDocuments),
        virtualCards: await db.select().from(virtualCards),
        recipients: await db.select().from(recipients),
        transactions: await db.select().from(transactions),
        paymentRequests: await db.select().from(paymentRequests),
        chatMessages: await db.select().from(chatMessages),
        notifications: await db.select().from(notifications),
        supportTickets: await db.select().from(supportTickets),
        conversations: await db.select().from(conversations),
        messages: await db.select().from(messages),
        adminLogs: await db.select().from(adminLogs),
        systemLogs: await db.select().from(systemLogs),
        systemSettings: await db.select().from(systemSettings),
        apiConfigurations: await db.select().from(apiConfigurations),
      };

      const backup = {
        timestamp: new Date().toISOString(),
        version: "1.0",
        tables: Object.keys(tables).reduce((acc, table) => {
          acc[table] = {
            recordCount: tables[table as keyof typeof tables].length,
            columns: Object.keys(tables[table as keyof typeof tables][0] || {})
          };
          return acc;
        }, {} as any),
        data: tables
      };

      const jsonData = JSON.stringify(backup, null, 2);
      const buffer = Buffer.from(jsonData);
      const filename = `greenpay_backup_${timestamp}.json`;

      backups.set(backupId, {
        id: backupId,
        filename,
        data: buffer,
        createdAt: new Date()
      });

      const totalRecords = Object.values(tables).reduce((sum, arr) => sum + arr.length, 0);
      
      res.json({
        success: true,
        backup: {
          id: backupId,
          filename,
          createdAt: new Date().toISOString(),
          size: buffer.length,
          tablesCount: Object.keys(tables).length,
          recordsCount: totalRecords
        }
      });
    } catch (error) {
      console.error("Database backup error:", error);
      res.status(500).json({ 
        success: false, 
        error: error instanceof Error ? error.message : "Failed to create backup" 
      });
    }
  });

  // Download backup file
  app.get("/api/admin/database/backup/:id/download", requireAdminAuth, async (req, res) => {
    try {
      const backup = backups.get(req.params.id);
      if (!backup) {
        return res.status(404).json({ error: "Backup not found" });
      }

      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename="${backup.filename}"`);
      res.send(backup.data);
    } catch (error) {
      console.error("Download backup error:", error);
      res.status(500).json({ error: "Failed to download backup" });
    }
  });

  // Helper function for database restore logic (shared between authenticated and unauthenticated endpoints)
  const performDatabaseRestore = async (fileBuffer: Buffer) => {
    const backup = JSON.parse(fileBuffer.toString());
    
    if (!backup.data || !backup.version) {
      throw new Error("Invalid backup file format");
    }

    const recordsRestored: { [key: string]: number } = {};

    // Restore users
    if (backup.data.users?.length > 0) {
      for (const user of backup.data.users) {
        try {
          await db.insert(users).values(user).onConflictDoUpdate({
            target: users.id,
            set: user
          });
        } catch (err) {
          console.log("User insert/update skipped (may already exist)");
        }
      }
      recordsRestored.users = backup.data.users.length;
    }

    // Restore other tables
    const tableMap: { [key: string]: any } = {
      admins, kycDocuments, virtualCards, recipients, transactions,
      paymentRequests, chatMessages, notifications, supportTickets,
      conversations, messages, adminLogs, systemLogs, systemSettings, apiConfigurations
    };

    for (const [tableName, tableData] of Object.entries(backup.data)) {
      if (tableName === 'users' || !Array.isArray(tableData)) continue;
      
      const table = tableMap[tableName];
      if (!table || tableData.length === 0) continue;

      try {
        for (const record of tableData) {
          try {
            await db.insert(table).values(record).onConflictDoUpdate({
              target: table.id,
              set: record
            });
          } catch (err) {
            console.log(`Record insert/update skipped for ${tableName}`);
          }
        }
        recordsRestored[tableName] = tableData.length;
      } catch (err) {
        console.warn(`Failed to restore ${tableName}:`, err);
      }
    }

    return recordsRestored;
  };

  // Restore database from backup (AUTHENTICATED - admin panel)
  app.post("/api/admin/database/restore", requireAdminAuth, backupUpload.single("file"), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No file provided" });
      }

      const recordsRestored = await performDatabaseRestore(req.file.buffer);

      res.json({
        success: true,
        message: "Database restored successfully",
        recordsRestored
      });
    } catch (error) {
      console.error("Database restore error:", error);
      res.status(500).json({ 
        success: false,
        error: error instanceof Error ? error.message : "Failed to restore database" 
      });
    }
  });

  // Restore database from backup (UNAUTHENTICATED - login page only)
  app.post("/api/admin/database/restore-public", backupUpload.single("file"), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No file provided" });
      }

      const recordsRestored = await performDatabaseRestore(req.file.buffer);

      res.json({
        success: true,
        message: "Database restored successfully",
        recordsRestored
      });
    } catch (error) {
      console.error("Database restore error (public):", error);
      res.status(500).json({ 
        success: false,
        error: error instanceof Error ? error.message : "Failed to restore database" 
      });
    }
  });

  // SEO - XML Sitemap for Google Search Console
  app.get('/sitemap.xml', async (req, res) => {
    try {
      const baseUrl = 'https://greenpay.world';
      const today = new Date().toISOString().split('T')[0];

      // Define all public pages that should be indexed by Google
      // Only include pages accessible without authentication
      const publicPages = [
        // Core marketing pages
        { url: '/', priority: '1.0', changefreq: 'daily', desc: 'Homepage - International Money Transfer to Kenya' },
        { url: '/login', priority: '0.9', changefreq: 'monthly', desc: 'Login to GreenPay Account' },
        { url: '/signup', priority: '0.9', changefreq: 'monthly', desc: 'Sign Up for GreenPay' },
        { url: '/status', priority: '0.8', changefreq: 'daily', desc: 'System Status & Service Health' },
        
        // Auth flow pages (public but lower priority)
        { url: '/auth/forgot-password', priority: '0.5', changefreq: 'monthly', desc: 'Reset Password' },
        { url: '/auth/reset-password', priority: '0.5', changefreq: 'monthly', desc: 'Create New Password' },
        { url: '/auth/otp-verification', priority: '0.4', changefreq: 'monthly', desc: 'OTP Verification' },
        
        // Feature landing pages (for SEO targeting)
        { url: '/features/send-money', priority: '0.9', changefreq: 'weekly', desc: 'Send Money to Kenya - Fast & Secure' },
        { url: '/features/virtual-cards', priority: '0.9', changefreq: 'weekly', desc: 'Virtual Cards for Online Payments' },
        { url: '/features/exchange', priority: '0.8', changefreq: 'weekly', desc: 'USD to KES Exchange - Best Rates' },
        { url: '/features/airtime', priority: '0.7', changefreq: 'weekly', desc: 'Buy Airtime for Kenya' },
        
        // Information pages
        { url: '/about', priority: '0.7', changefreq: 'monthly', desc: 'About GreenPay' },
        { url: '/pricing', priority: '0.8', changefreq: 'weekly', desc: 'Pricing & Fees' },
        { url: '/security', priority: '0.7', changefreq: 'monthly', desc: 'Security & Compliance' },
        { url: '/help', priority: '0.6', changefreq: 'weekly', desc: 'Help Center & FAQ' },
        { url: '/contact', priority: '0.6', changefreq: 'monthly', desc: 'Contact Support' },
      ];

      // Generate XML sitemap with comments
      const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
  <!-- GreenPay - International Money Transfer & Digital Wallet -->
  <!-- Target Keywords: send money to Kenya, USD to KES, international remittance, virtual cards -->
${publicPages.map(page => `  <url>
    <loc>${baseUrl}${page.url}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>
  </url>`).join('\n')}
</urlset>`;

      res.header('Content-Type', 'application/xml');
      res.header('Cache-Control', 'public, max-age=3600'); // Cache for 1 hour
      res.send(sitemap);
    } catch (error) {
      console.error('Error generating sitemap:', error);
      res.status(500).send('Error generating sitemap');
    }
  });

  // Robots.txt for search engines
  app.get('/robots.txt', (req, res) => {
    const robotsTxt = `User-agent: *
Disallow: /admin/
Disallow: /api/

Sitemap: https://greenpay.world/sitemap.xml`;

    res.header('Content-Type', 'text/plain');
    res.send(robotsTxt);
  });

  const httpServer = createServer(app);

  // Set up WebSocket server for real-time log streaming
  const wss = new WebSocketServer({ server: httpServer, path: '/ws/logs' });
  
  // Store for connected log clients
  const logClients = new Set<WebSocket>();
  
  // Log streaming service
  class LogStreamService {
    static broadcast(logEntry: any) {
      const message = JSON.stringify(logEntry);
      logClients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
          try {
            client.send(message);
          } catch (error) {
            console.error('Error sending log to client:', error);
            logClients.delete(client);
          }
        } else {
          logClients.delete(client);
        }
      });
    }

    static createLogEntry(level: string, message: string, source?: string, data?: any) {
      return {
        id: `log_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        timestamp: new Date().toISOString(),
        level,
        message,
        source,
        data
      };
    }
  }

  // Handle WebSocket connections for logs
  wss.on('connection', (ws) => {
    console.log('Log client connected');
    logClients.add(ws);
    
    // Send welcome message
    ws.send(JSON.stringify(
      LogStreamService.createLogEntry('info', 'Connected to log stream', 'websocket')
    ));

    ws.on('close', () => {
      console.log('Log client disconnected');
      logClients.delete(ws);
    });

    ws.on('error', (error) => {
      console.error('WebSocket error:', error);
      logClients.delete(ws);
    });
  });

  // Override console methods to capture logs
  const originalConsoleLog = console.log;
  const originalConsoleError = console.error;
  const originalConsoleWarn = console.warn;
  const originalConsoleInfo = console.info;

  console.log = (...args: any[]) => {
    originalConsoleLog(...args);
    const message = args.map(arg => typeof arg === 'object' ? JSON.stringify(arg) : String(arg)).join(' ');
    LogStreamService.broadcast(LogStreamService.createLogEntry('info', message, 'console'));
  };

  console.error = (...args: any[]) => {
    originalConsoleError(...args);
    const message = args.map(arg => typeof arg === 'object' ? JSON.stringify(arg) : String(arg)).join(' ');
    LogStreamService.broadcast(LogStreamService.createLogEntry('error', message, 'console'));
  };

  console.warn = (...args: any[]) => {
    originalConsoleWarn(...args);
    const message = args.map(arg => typeof arg === 'object' ? JSON.stringify(arg) : String(arg)).join(' ');
    LogStreamService.broadcast(LogStreamService.createLogEntry('warn', message, 'console'));
  };

  console.info = (...args: any[]) => {
    originalConsoleInfo(...args);
    const message = args.map(arg => typeof arg === 'object' ? JSON.stringify(arg) : String(arg)).join(' ');
    LogStreamService.broadcast(LogStreamService.createLogEntry('info', message, 'console'));
  };

  // Integrate log streaming with existing middleware (handled in index.ts)
  // Export LogStreamService globally for use by existing middleware
  (global as any).LogStreamService = LogStreamService;

  // DISABLED: Legacy WebSocket chat system that was causing message leakage between users
  // The main chat system now uses REST API with proper user isolation
  
  // Set up WebSocket server for admin monitoring only (not for chat messages)
  const chatWss = new WebSocketServer({ server: httpServer, path: '/ws' });
  console.log('✅ Live support chat WebSocket server initialized on /ws (admin monitoring only)');

  // Track active admin connections only
  const activeAdminConnections = new Map<string, { socket: WebSocket, adminId: string }>();

  chatWss.on('connection', (ws, req) => {
    console.log('New WebSocket connection established');
    
    // Determine if this is an admin connection
    const session = (req as any).session;
    const isAdmin = !!session?.admin?.id;
    const userId = isAdmin ? 'admin' : session?.userId;

    ws.on('message', async (data) => {
      try {
        const parsed = JSON.parse(data.toString());
        if (parsed.type === 'register') {
          (ws as any).userId = parsed.userId || userId;
          (ws as any).isAdmin = parsed.isAdmin || isAdmin;
          console.log(`Registered connection: ${(ws as any).userId} (Admin: ${(ws as any).isAdmin})`);
          
          if ((ws as any).isAdmin) {
             activeAdminConnections.set((ws as any).userId, {
                socket: ws,
                adminId: (ws as any).userId
              });
          }
          return;
        }
        
        switch (parsed.type) {
          case 'admin_register':
            if (parsed.isAdmin && parsed.adminId) {
              activeAdminConnections.set(parsed.adminId, {
                socket: ws,
                adminId: parsed.adminId
              });
              console.log(`Admin ${parsed.adminId} registered for live chat monitoring`);
            }
            break;
            
          default:
            console.log(`WebSocket message type '${parsed.type}' ignored - use REST API instead`);
            break;
        }
      } catch (error) {
        console.error('WebSocket message error:', error);
      }
    });

    ws.on('close', () => {
      // Remove admin connection when client disconnects
      for (const [adminId, connection] of activeAdminConnections.entries()) {
        if (connection.socket === ws) {
          activeAdminConnections.delete(adminId);
          console.log(`Admin ${adminId} disconnected from live chat monitoring`);
          break;
        }
      }
    });
  });

  // Get template parameter requirements from Meta
  app.get("/api/admin/whatsapp/template-parameters/:templateName", requireAdminAuth, async (req, res) => {
    try {
      const { templateName } = req.params;
      const { whatsappService } = await import('./services/whatsapp');
      
      const paramInfo = await whatsappService.getTemplateParameters(templateName);
      const template = await whatsappService.getTemplateDetails(templateName);
      
      res.json({
        templateName,
        status: template?.status || 'UNKNOWN',
        language: paramInfo.language,
        requiredParameters: paramInfo.required,
        parameterCount: paramInfo.paramCount,
        parameterLabels: paramInfo.required.map((p, i) => `${p} (position ${i + 1})`),
        description: `Template requires ${paramInfo.paramCount} parameters: ${paramInfo.required.join(', ') || 'none'}`,
        components: paramInfo.components,
        source: 'meta'
      });
    } catch (error) {
      console.error('[Admin] Get template parameters error:', error);
      res.status(500).json({ message: "Failed to get template parameters from Meta" });
    }
  });

  // Send template to individual user - Dynamic for any Meta template
  app.post("/api/admin/whatsapp/send-template", requireAdminAuth, async (req, res) => {
    try {
      const { userId, templateName, parameters } = req.body;
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const { whatsappService } = await import('./services/whatsapp');
      const { messagingService } = await import('./services/messaging');

      // Get available templates from Meta to verify it exists
      const templates = await whatsappService.fetchTemplatesFromMeta();
      const template = templates.find((t: any) => t.name === templateName);
      
      if (!template) {
        return res.status(404).json({ message: `Template "${templateName}" not found in Meta` });
      }

      if (template.status !== 'APPROVED') {
        return res.status(400).json({ 
          message: `Template "${templateName}" is not approved. Status: ${template.status}`,
          status: template.status
        });
      }

      // Special handling for templates with known handlers
      let success = false;
      let errorMsg: string | undefined;

      switch (templateName) {
        case 'otp':
          const otpCode = parameters?.code || messagingService.generateOTP();
          success = await whatsappService.sendOTP(user.phone, otpCode);
          console.log('[Admin] OTP template sent', { userId, templateName, success });
          break;

        case 'password_reset':
          const pwdCode = parameters?.code || messagingService.generateOTP();
          success = await whatsappService.sendPasswordReset(user.phone, pwdCode);
          console.log('[Admin] Password reset template sent', { userId, templateName, success });
          break;

        case 'create_acc':
          success = await whatsappService.sendAccountCreation(user.phone, user.fullName || 'User');
          console.log('[Admin] Create account template sent', { userId, templateName, success });
          break;

        case 'kyc_verified':
          success = await whatsappService.sendKYCVerified(user.phone);
          console.log('[Admin] KYC verified template sent', { userId, templateName, success });
          break;

        case 'card_activation':
          success = await whatsappService.sendCardActivation(user.phone, parameters?.lastFour || '0000');
          console.log('[Admin] Card activation template sent', { userId, templateName, success });
          break;

        case 'fund_receipt':
          success = await whatsappService.sendFundReceipt(
            user.phone,
            parameters?.currency || 'KES',
            parameters?.amount || '0',
            parameters?.sender || 'Unknown Sender'
          );
          console.log('[Admin] Fund receipt template sent', { userId, templateName, success });
          break;

        case 'login_alert':
          success = await whatsappService.sendLoginAlert(
            user.phone,
            parameters?.location || 'Unknown',
            parameters?.ip || 'Unknown IP'
          );
          console.log('[Admin] Login alert template sent', { userId, templateName, success });
          break;

        // Generic handler for any other approved template
        default:
          // Validate parameters before sending
          const validation = await whatsappService.validateTemplateParameters(templateName, parameters || {});
          if (!validation.valid) {
            return res.status(400).json({ 
              message: validation.error || 'Parameter validation failed',
              templateName,
              required: validation.required,
              provided: validation.provided,
              hint: `Provide ${validation.required} parameters for this template`
            });
          }
          
          // Send the template
          const result = await whatsappService.sendTemplateGeneric(user.phone, templateName, parameters || {});
          success = result.success;
          errorMsg = result.error;
          
          if (!success && result.error) {
            console.error('[Admin] Generic template send error:', { userId, templateName, error: result.error });
          } else {
            console.log('[Admin] Generic template sent', { userId, templateName, success });
          }
          break;
      }

      // Return appropriate response based on success/failure
      if (success) {
        return res.json({ 
          success: true, 
          templateName, 
          userId, 
          message: 'Template delivered to WhatsApp',
          templateStatus: template.status,
          timestamp: new Date().toISOString()
        });
      } else {
        // If failed, return error with details
        return res.status(400).json({ 
          success: false, 
          templateName, 
          userId, 
          message: errorMsg || 'Template delivery failed',
          templateStatus: template.status,
          timestamp: new Date().toISOString()
        });
      }
    } catch (error) {
      console.error('[Admin] Send template error:', error);
      res.status(500).json({ message: "Failed to send template", error: String(error) });
    }
  });

  // Get Mailtrap settings
  app.get("/api/admin/mailtrap-settings", requireAdminAuth, async (req, res) => {
    try {
      const setting = await storage.getSystemSetting("email", "mailtrap_api_key");
      const apiKey = setting?.value || process.env.MAILTRAP_API_KEY || '';
      const isConfigured = !!apiKey;
      res.json({
        apiKey: isConfigured ? '●●●●●●●●' : '',
        isConfigured
      });
    } catch (error) {
      res.status(500).json({ message: "Error fetching Mailtrap settings" });
    }
  });

  // Save Mailtrap API key
  app.post("/api/admin/mailtrap-settings", requireAdminAuth, async (req, res) => {
    try {
      const { apiKey } = req.body;
      if (!apiKey) {
        return res.status(400).json({ message: "API key is required" });
      }

      const trimmedKey = apiKey.trim();

      // Save API key to database (secure storage)
      await storage.setSystemSetting({
        category: "email",
        key: "mailtrap_api_key",
        value: trimmedKey,
        description: "Mailtrap API key for email sending"
      });

      // Also set in environment for current session
      process.env.MAILTRAP_API_KEY = trimmedKey;

      const { mailtrapService } = await import('./services/mailtrap');
      await mailtrapService.refreshApiKey();

      res.json({ success: true, message: "Mailtrap API key saved successfully" });
    } catch (error) {
      console.error('Error saving Mailtrap settings:', error);
      res.status(500).json({ message: "Error saving Mailtrap settings" });
    }
  });

  // Send test email via Mailtrap
  app.post("/api/admin/mailtrap-test", requireAdminAuth, async (req, res) => {
    try {
      const { email } = req.body;
      if (!email) {
        return res.status(400).json({ message: "Email is required" });
      }

      const { mailtrapService } = await import('./services/mailtrap');
      const success = await mailtrapService.sendCustomTemplate(email, 'placeholder-test', {
        first_name: 'Test',
        last_name: 'User'
      });

      if (success) {
        res.json({ success: true, message: "Test email sent successfully" });
      } else {
        res.status(500).json({ message: "Failed to send test email" });
      }
    } catch (error) {
      console.error('Error sending test email:', error);
      res.status(500).json({ message: "Error sending test email" });
    }
  });

  // Test Mailtrap template by UUID
  app.post("/api/admin/send-template-test", requireAdminAuth, async (req, res) => {
    try {
      const { email, templateUuid, parameters } = req.body;
      if (!email || !templateUuid) {
        return res.status(400).json({ message: "Email and template UUID are required" });
      }

      const { mailtrapService } = await import('./services/mailtrap');
      const success = await mailtrapService.sendTemplate(email, templateUuid, parameters || {});

      res.json({ 
        success,
        message: success ? 'Template sent successfully' : 'Failed to send template'
      });
    } catch (error) {
      console.error('[Admin] Send template test error:', error);
      res.status(500).json({ message: "Failed to send template" });
    }
  });

  // Get list of users for admin dropdown
  app.get("/api/admin/users-list", requireAdminAuth, async (req, res) => {
    try {
      const users = await storage.getAllUsers();
      const formattedUsers = users.map((user: any) => ({
        id: user.id,
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        name: `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email || 'Unknown User',
        email: user.email,
        phone: user.phone
      }));
      res.json(formattedUsers);
    } catch (error) {
      console.error('[Admin] Get users list error:', error);
      res.status(500).json({ message: "Failed to fetch users list" });
    }
  });

  // Send Mailtrap template to specific user (email only)
  app.post("/api/admin/send-template-to-user", requireAdminAuth, async (req, res) => {
    try {
      const { userId, templateUuid, parameters } = req.body;
      if (!userId || !templateUuid) {
        return res.status(400).json({ message: "User ID and template UUID are required" });
      }

      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      if (!user.email) {
        return res.status(400).json({ message: "User does not have an email address" });
      }

      const { mailtrapService } = await import('./services/mailtrap');
      const success = await mailtrapService.sendTemplate(user.email, templateUuid, parameters || {});

      res.json({ 
        success,
        message: success ? 'Template email sent to user successfully' : 'Failed to send template to user'
      });
    } catch (error) {
      console.error('[Admin] Send template to user error:', error);
      res.status(500).json({ message: "Failed to send template to user" });
    }
  });

  // WhatsApp webhook - verification endpoint
  app.get("/api/whatsapp/webhook", async (req, res) => {
    const verifyToken = process.env.WHATSAPP_VERIFY_TOKEN || "greenpay_verify_token_2024";
    const mode = req.query["hub.mode"];
    const token = req.query["hub.verify_token"];
    const challenge = req.query["hub.challenge"];

    if (mode === "subscribe" && token === verifyToken) {
      console.log("[WhatsApp] ✓ Webhook verified");
      res.status(200).send(challenge);
    } else {
      console.error("[WhatsApp] ✗ Webhook verification failed");
      res.status(403).send("Forbidden");
    }
  });

  // WhatsApp webhook - receive messages and status updates
  app.post("/api/whatsapp/webhook", async (req, res) => {
    try {
      const body = req.body;
      
      if (body.object === "whatsapp_business_account") {
        const entries = body.entry || [];
        for (const entry of entries) {
          const changes = entry.changes || [];
          for (const change of changes) {
            // Handle message status updates (delivered, read, sent, failed)
            if (change.field === "message_status") {
              const statuses = change.value?.statuses || [];
              for (const status of statuses) {
                const messageId = status.id;
                const statusType = status.status; // sent, delivered, read, failed
                console.log('[WhatsApp] Message status update:', { messageId, status: statusType, timestamp: status.timestamp });
                
                // Update message status in database
                const messages = await storage.getWhatsappMessageByMessageId(messageId);
                if (messages && messages.length > 0) {
                  await storage.updateWhatsappMessageStatus(messages[0].id, statusType);
                  console.log('[WhatsApp] Updated message status to:', statusType);
                }
              }
            }
            
            // Handle typing indicator and online status
            if (change.field === "message_template_status_update") {
              const statuses = change.value?.statuses || [];
              for (const status of statuses) {
                console.log('[WhatsApp] Template status:', { status: status.status });
              }
            }
            
            // Handle messaging product status (includes typing_on, typing_off, read)
            if (change.field === "message_template_status_update" || change.field === "messaging_product") {
              const phoneNumber = change.value?.contacts?.[0]?.wa_id;
              
              // Check for typing indicators in the webhook
              if (change.value?.messages) {
                for (const msg of change.value.messages) {
                  if (msg.type === 'typing') {
                    console.log('[WhatsApp] User typing indicator received from:', phoneNumber);
                  } else if (msg.type === 'read') {
                    console.log('[WhatsApp] User read receipt received from:', phoneNumber);
                  }
                }
              }
            }
            
            // Handle read receipts and online status
            if (change.field === "messages") {
              const messages = change.value?.messages || [];
              for (const message of messages) {
                // Track when messages are read
                if (message.type === 'message_read') {
                  console.log('[WhatsApp] Message read:', { messageId: message.id });
                }
              }
            }
            
            // Handle messages
            if (change.field === "messages") {
              const messages = change.value?.messages || [];
              for (const message of messages) {
                const phoneNumber = change.value?.contacts?.[0]?.wa_id;
                const type = message.type; // text, image, video, file, audio
                
                let content = '';
                let mediaUrl = '';

                // Get access token for fetching media URLs
                const [accessTokenSetting] = await Promise.all([
                  storage.getSystemSetting("messaging", "whatsapp_access_token")
                ]);
                const accessToken = accessTokenSetting?.value;

                // Handle different message types - download to Cloudinary
                let messageType = 'text';
                let fileName = '';
                let fileSize = 0;

                if (type === 'text' && message.text?.body) {
                  content = message.text.body;
                } else if (type === 'image' && message.image?.id) {
                  messageType = 'image';
                  const mediaId = message.image.id;
                  const caption = message.image.caption || 'Sent an image';
                  if (accessToken) {
                    try {
                      // Fetch download URL from Meta
                      const mediaResponse = await fetch(`https://graph.facebook.com/v20.0/${mediaId}?fields=url`, {
                        headers: { 'Authorization': `Bearer ${accessToken}` }
                      });
                      if (mediaResponse.ok) {
                        const mediaData = await mediaResponse.json();
                        const downloadUrl = mediaData.url;
                        if (downloadUrl) {
                          // Download from Meta and upload to Cloudinary
                          const imgResponse = await fetch(downloadUrl);
                          const buffer = await imgResponse.arrayBuffer();
                          const bufferObj = Buffer.from(buffer);
                          
                          // Detect actual MIME type from file content
                          const fileTypeInfo = await fileTypeFromBuffer(bufferObj);
                          const actualMimeType = fileTypeInfo?.mime || 'image/jpeg';
                          const ext = fileTypeInfo?.ext || 'jpg';
                          
                          mediaUrl = await cloudinaryStorage.uploadChatFile(
                            bufferObj,
                            `whatsapp-image-${mediaId}.${ext}`,
                            actualMimeType
                          );
                          fileName = `whatsapp-image-${mediaId}.${ext}`;
                          fileSize = buffer.byteLength;
                          console.log('[WhatsApp] Image stored in Cloudinary:', { mediaUrl, size: fileSize, mimeType: actualMimeType });
                        }
                      }
                    } catch (err) {
                      console.error('[WhatsApp] Failed to process image:', err);
                    }
                  }
                  content = caption;
                } else if (type === 'video' && message.video?.id) {
                  messageType = 'video';
                  const mediaId = message.video.id;
                  const caption = message.video.caption || 'Sent a video';
                  if (accessToken) {
                    try {
                      const mediaResponse = await fetch(`https://graph.facebook.com/v20.0/${mediaId}?fields=url`, {
                        headers: { 'Authorization': `Bearer ${accessToken}` }
                      });
                      if (mediaResponse.ok) {
                        const mediaData = await mediaResponse.json();
                        const downloadUrl = mediaData.url;
                        if (downloadUrl) {
                          const vidResponse = await fetch(downloadUrl);
                          const buffer = await vidResponse.arrayBuffer();
                          const bufferObj = Buffer.from(buffer);
                          
                          // Detect actual MIME type from file content
                          const fileTypeInfo = await fileTypeFromBuffer(bufferObj);
                          const actualMimeType = fileTypeInfo?.mime || 'video/mp4';
                          const ext = fileTypeInfo?.ext || 'mp4';
                          
                          mediaUrl = await cloudinaryStorage.uploadChatFile(
                            bufferObj,
                            `whatsapp-video-${mediaId}.${ext}`,
                            actualMimeType
                          );
                          fileName = `whatsapp-video-${mediaId}.${ext}`;
                          fileSize = buffer.byteLength;
                          console.log('[WhatsApp] Video stored in Cloudinary:', { mediaUrl, size: fileSize, mimeType: actualMimeType });
                        }
                      }
                    } catch (err) {
                      console.error('[WhatsApp] Failed to process video:', err);
                    }
                  }
                  content = caption;
                } else if (type === 'file' && message.document?.id) {
                  messageType = 'file';
                  const mediaId = message.document.id;
                  const filename = message.document.filename || 'document';
                  fileName = filename;
                  if (accessToken) {
                    try {
                      const mediaResponse = await fetch(`https://graph.facebook.com/v20.0/${mediaId}?fields=url`, {
                        headers: { 'Authorization': `Bearer ${accessToken}` }
                      });
                      if (mediaResponse.ok) {
                        const mediaData = await mediaResponse.json();
                        const downloadUrl = mediaData.url;
                        if (downloadUrl) {
                          const fileResponse = await fetch(downloadUrl);
                          const buffer = await fileResponse.arrayBuffer();
                          mediaUrl = await cloudinaryStorage.uploadChatFile(
                            Buffer.from(buffer),
                            filename,
                            'application/octet-stream'
                          );
                          fileSize = buffer.byteLength;
                        }
                      }
                    } catch (err) {
                      console.error('[WhatsApp] Failed to process file:', err);
                    }
                  }
                  content = filename;
                } else if (type === 'audio' && message.audio?.id) {
                  const mediaId = message.audio.id;
                  if (accessToken) {
                    try {
                      const mediaResponse = await fetch(`https://graph.facebook.com/v20.0/${mediaId}?fields=url`, {
                        headers: { 'Authorization': `Bearer ${accessToken}` }
                      });
                      if (mediaResponse.ok) {
                        const mediaData = await mediaResponse.json();
                        const downloadUrl = mediaData.url;
                        if (downloadUrl) {
                          const audioResponse = await fetch(downloadUrl);
                          const buffer = await audioResponse.arrayBuffer();
                          mediaUrl = await cloudinaryStorage.uploadChatFile(
                            Buffer.from(buffer),
                            `whatsapp-audio-${mediaId}.ogg`,
                            'audio/ogg'
                          );
                        }
                      }
                    } catch (err) {
                      console.error('[WhatsApp] Failed to process audio:', err);
                    }
                  }
                  content = '[Audio message]';
                } else {
                  continue; // Skip unknown types
                }

                if (phoneNumber && content) {
                  let conversation = await storage.getWhatsappConversation(phoneNumber);
                  if (!conversation) {
                    conversation = await storage.createWhatsappConversation({
                      phoneNumber,
                      displayName: change.value?.contacts?.[0]?.profile?.name || phoneNumber,
                      lastMessageAt: new Date(),
                      status: 'active'
                    });
                  } else {
                    await storage.updateWhatsappConversation(conversation.id, { lastMessageAt: new Date() });
                  }

                  await storage.createWhatsappMessage({
                    conversationId: conversation.id,
                    phoneNumber,
                    content: content,
                    isFromAdmin: false,
                    status: 'received',
                    messageId: message.id,
                    messageType: messageType,
                    fileUrl: mediaUrl || undefined,
                    fileName: fileName || undefined,
                    fileSize: fileSize || undefined
                  });

                  console.log(`[WhatsApp] Received ${type} message from ${phoneNumber}: ${content}`, mediaUrl ? `URL: ${mediaUrl}` : '');
                }
              }
            }
          }
        }
        res.status(200).json({ status: "ok" });
      } else {
        res.status(400).send("Bad Request");
      }
    } catch (error) {
      console.error("[WhatsApp] Webhook error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Get WhatsApp conversations (admin)
  app.get("/api/admin/whatsapp/conversations", requireAdminAuth, async (req, res) => {
    try {
      console.log('[WhatsApp] Fetching conversations');
      const conversations = await storage.getWhatsappConversations();
      console.log('[WhatsApp] Found conversations:', { count: conversations?.length || 0 });
      res.json(conversations || []);
    } catch (error) {
      console.error("[WhatsApp] Get conversations error:", error);
      res.status(500).json({ message: "Failed to fetch conversations", error: String(error) });
    }
  });

  // Get WhatsApp messages for conversation (admin)
  app.get("/api/admin/whatsapp/messages/:conversationId", requireAdminAuth, async (req, res) => {
    try {
      const messages = await storage.getWhatsappMessages(req.params.conversationId);
      res.json(messages);
    } catch (error) {
      console.error("[Admin] Get WhatsApp messages error:", error);
      res.status(500).json({ message: "Failed to fetch messages" });
    }
  });

  // Send typing indicator
  app.post("/api/admin/whatsapp/typing", requireAdminAuth, async (req, res) => {
    try {
      const { phoneNumber } = req.body;
      
      if (!phoneNumber) {
        return res.status(400).json({ message: "Phone number is required" });
      }

      const [accessTokenSetting, phoneIdSetting] = await Promise.all([
        storage.getSystemSetting("messaging", "whatsapp_access_token"),
        storage.getSystemSetting("messaging", "whatsapp_phone_number_id")
      ]);

      const accessToken = accessTokenSetting?.value;
      const phoneNumberId = String(phoneIdSetting?.value || '').trim();

      if (!accessToken?.trim() || !phoneNumberId) {
        return res.status(400).json({ message: "WhatsApp not configured" });
      }

      const cleanPhone = phoneNumber.replace(/\D/g, '');
      const finalPhone = cleanPhone.startsWith('254') ? cleanPhone : '254' + cleanPhone.slice(-9);

      const apiUrl = `https://graph.facebook.com/v20.0/${phoneNumberId}/messages`;
      const payload = {
        messaging_product: "whatsapp",
        recipient_type: "individual",
        to: finalPhone,
        type: "typing"
      };

      const apiResponse = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      if (apiResponse.ok) {
        console.log('[WhatsApp] Typing indicator sent to:', finalPhone);
        res.json({ success: true, message: "Typing indicator sent" });
      } else {
        const error = await apiResponse.json();
        console.error('[WhatsApp] Failed to send typing indicator:', error);
        res.status(apiResponse.status).json({ success: false, error });
      }
    } catch (error) {
      console.error("[WhatsApp] Typing indicator error:", error);
      res.status(500).json({ message: "Failed to send typing indicator" });
    }
  });

  // Send WhatsApp message (admin)
  app.post("/api/admin/whatsapp/send", requireAdminAuth, async (req, res) => {
    try {
      const { conversationId, phoneNumber, message, mediaUrl, mediaType } = req.body;
      console.log('[WhatsApp Send] Received request:', { conversationId, phoneNumber, hasMedia: !!mediaUrl, mediaType });
      
      if (!conversationId || !phoneNumber || !message) {
        console.error('[WhatsApp Send] Missing fields');
        return res.status(400).json({ message: "Missing required fields" });
      }

      // Get credentials from messaging settings
      const [accessTokenSetting, phoneIdSetting] = await Promise.all([
        storage.getSystemSetting("messaging", "whatsapp_access_token"),
        storage.getSystemSetting("messaging", "whatsapp_phone_number_id")
      ]);

      const accessToken = accessTokenSetting?.value;
      const phoneNumberId = String(phoneIdSetting?.value || '').trim();
      
      console.log('[WhatsApp Send] Credentials retrieved:', { hasToken: !!accessToken, hasPhoneId: !!phoneNumberId });
      
      if (!accessToken?.trim() || !phoneNumberId) {
        console.error('[WhatsApp Send] Credentials incomplete');
        return res.status(400).json({ message: "WhatsApp not configured in Messaging Settings. Please configure credentials first." });
      }

      // Clean phone number - ensure it starts with country code
      const cleanPhone = phoneNumber.replace(/\D/g, '');
      const finalPhone = cleanPhone.startsWith('254') ? cleanPhone : '254' + cleanPhone.slice(-9);
      
      const apiUrl = `https://graph.facebook.com/v20.0/${phoneNumberId}/messages`;
      let payload: any = {
        messaging_product: "whatsapp",
        recipient_type: "individual",
        to: finalPhone,
      };

      if (mediaUrl && mediaType) {
        // Send media message
        const typeMap: any = { 'image': 'image', 'video': 'video', 'file': 'document', 'audio': 'audio' };
        const waType = typeMap[mediaType] || 'document';
        
        payload.type = waType;
        payload[waType] = { link: mediaUrl };
        if (message) {
          payload[waType].caption = message;
        }
        console.log('[WhatsApp Send] Sending media:', { type: waType, phone: finalPhone });
      } else {
        // Send text message
        payload.type = "text";
        payload.text = { body: message };
        console.log('[WhatsApp Send] Sending text:', { phone: finalPhone });
      }

      const apiResponse = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      const apiData = await apiResponse.json();
      console.log('[WhatsApp Send] Meta API response:', { status: apiResponse.status, msgId: apiData.messages?.[0]?.id, error: apiData.error });

      if (apiResponse.ok && apiData.messages?.[0]?.id) {
        // Extract filename from URL if available
        let fileName = 'media';
        if (mediaUrl) {
          const urlParts = new URL(mediaUrl).pathname.split('/');
          fileName = urlParts[urlParts.length - 1] || 'media';
        }

        const msgRecord = await storage.createWhatsappMessage({
          conversationId,
          phoneNumber,
          content: message || `[${mediaType?.toUpperCase() || 'FILE'}]`,
          isFromAdmin: true,
          status: 'sent',
          messageId: apiData.messages[0].id,
          messageType: mediaUrl ? mediaType || 'file' : 'text',
          fileUrl: mediaUrl,
          fileName: mediaUrl ? fileName : null,
          fileSize: null // We don't have file size on send, but DB can store it
        });

        await storage.updateWhatsappConversation(conversationId, { lastMessageAt: new Date() });
        console.log('[WhatsApp Send] Message saved successfully:', { msgId: msgRecord.id, hasMedia: !!mediaUrl });
        res.json({ success: true, message: msgRecord });
      } else {
        const errorMsg = apiData.error?.message || 'Unknown error from Meta API';
        console.error('[WhatsApp Send] API error:', { status: apiResponse.status, error: errorMsg, data: apiData });
        res.status(500).json({ message: `Failed to send message: ${errorMsg}` });
      }
    } catch (error) {
      console.error("[WhatsApp Send] Error:", error);
      res.status(500).json({ message: "Failed to send message", error: String(error) });
    }
  });

  // Get/Update WhatsApp config (admin)
  app.get("/api/admin/whatsapp/config", requireAdminAuth, async (req, res) => {
    try {
      let config = await storage.getWhatsappConfig();
      console.log('[WhatsApp Config] Get request - config exists:', !!config, 'has token:', !!config?.accessToken);
      if (!config) {
        config = await storage.initWhatsappConfig();
        console.log('[WhatsApp Config] Initialized new config');
      }
      res.json({
        phoneNumberId: config.phoneNumberId || '',
        businessAccountId: config.businessAccountId || '',
        verifyToken: config.verifyToken,
        webhookUrl: process.env.REPLIT_DOMAINS ? `https://${process.env.REPLIT_DOMAINS}/api/whatsapp/webhook` : config.webhookUrl,
        isActive: config.isActive
      });
    } catch (error) {
      console.error("[Admin] Get WhatsApp config error:", error);
      res.status(500).json({ message: "Failed to fetch config" });
    }
  });

  app.post("/api/admin/whatsapp/config", requireAdminAuth, async (req, res) => {
    try {
      const { phoneNumberId, businessAccountId, accessToken, isActive } = req.body;
      console.log('[WhatsApp Config] Saving config:', { phoneNumberId: !!phoneNumberId, businessAccountId: !!businessAccountId, accessToken: !!accessToken, isActive });
      
      const updated = await storage.updateWhatsappConfig({
        phoneNumberId,
        businessAccountId,
        accessToken,
        isActive
      });
      
      console.log('[WhatsApp Config] Saved successfully:', { hasToken: !!updated?.accessToken, hasPhoneId: !!updated?.phoneNumberId });
      
      if (updated) {
        res.json({ success: true, config: updated });
      } else {
        res.status(500).json({ message: "Failed to update config" });
      }
    } catch (error) {
      console.error("[Admin] Update WhatsApp config error:", error);
      res.status(500).json({ message: "Failed to update config" });
    }
  });

  // API Key Management Endpoints
  app.post("/api/admin/api-keys/generate", requireAuth, async (req, res) => {
    try {
      const { name, scope, rateLimit } = req.body;
      
      if (!name || !scope || !Array.isArray(scope)) {
        return res.status(400).json({ error: "Missing required fields: name, scope" });
      }

      const { apiKeyService } = await import('./services/api-key');
      const key = await apiKeyService.generateApiKey(name, scope, rateLimit || 1000);
      
      res.json({ 
        success: true, 
        key,
        name,
        scope,
        rateLimit: rateLimit || 1000,
        message: "API key generated successfully. Copy it now - you won't see it again!"
      });
    } catch (error) {
      console.error("[API Keys] Generate error:", error);
      res.status(500).json({ error: "Failed to generate API key" });
    }
  });

  app.get("/api/admin/api-keys", requireAuth, async (req, res) => {
    try {
      const settings = await storage.getSystemSettingsByCategory('api_keys');
      const apiKeys = settings.map(s => {
        const keyData = JSON.parse(typeof s.value === 'string' ? s.value : JSON.stringify(s.value));
        return {
          id: s.key,
          name: keyData.name,
          isActive: keyData.isActive,
          scope: keyData.scope,
          rateLimit: keyData.rateLimit,
          createdAt: keyData.createdAt,
          lastUsedAt: keyData.lastUsedAt
        };
      });
      
      res.json({ keys: apiKeys });
    } catch (error) {
      console.error("[API Keys] List error:", error);
      res.status(500).json({ error: "Failed to fetch API keys" });
    }
  });

  app.post("/api/admin/api-keys/:keyId/revoke", requireAuth, async (req, res) => {
    try {
      const { keyId } = req.params;
      const { apiKeyService } = await import('./services/api-key');
      
      const success = await apiKeyService.revokeApiKey(keyId);
      
      if (success) {
        res.json({ success: true, message: "API key revoked successfully" });
      } else {
        res.status(404).json({ error: "API key not found" });
      }
    } catch (error) {
      console.error("[API Keys] Revoke error:", error);
      res.status(500).json({ error: "Failed to revoke API key" });
    }
  });

  // Get AI Remaining Requests
  app.get("/api/ai/remaining-requests", async (req, res) => {
    try {
      const userId = req.user?.id || null;
      const ipAddress = req.ip || req.connection.remoteAddress || '';
      const remaining = await aiRateLimiter.getRemainingRequests(userId, ipAddress);
      res.json({ remainingRequests: remaining });
    } catch (error: any) {
      console.error('Get remaining requests error:', error);
      res.status(500).json({ error: 'Failed to get remaining requests' });
    }
  });

  // AI Chat Endpoint
  app.post("/api/ai/chat", async (req, res) => {
    try {
      const { messages } = req.body;
      const user = req.user;
      
      if (!messages || !Array.isArray(messages)) {
        return res.status(400).json({ error: "Messages array required" });
      }

      // Check rate limits using database persistence
      const userId = user?.id || null;
      const ipAddress = req.ip || req.connection.remoteAddress || '';
      const limitCheck = await aiRateLimiter.checkAndUpdateLimit(userId, ipAddress);

      if (!limitCheck.allowed) {
        return res.status(429).json({ error: limitCheck.error, remainingRequests: limitCheck.remainingRequests });
      }

      const response = await openaiService.generateResponse(messages);
      res.json({ response, remainingRequests: limitCheck.remainingRequests });
    } catch (error: any) {
      console.error('AI chat error:', error);
      res.status(500).json({ error: error.message || "Failed to generate AI response" });
    }
  });

  // Export Environment Variables as .env file
  app.get("/api/admin/export-env", async (req, res) => {
    try {
      // Check admin authentication or session
      const isAdmin = req.session?.admin?.id || req.user?.id;
      if (!isAdmin) {
        return res.status(401).json({ message: "Authentication required. Please log in as an administrator." });
      }

      const envVars = process.env;
      let envContent = '';

      // Collect all environment variables and format as KEY=VALUE
      for (const [key, value] of Object.entries(envVars)) {
        if (value !== undefined && value !== null) {
          // Escape values that contain special characters
          const escapedValue = typeof value === 'string' && value.includes('"') 
            ? `'${value}'` 
            : `${value}`;
          envContent += `${key}=${escapedValue}\n`;
        }
      }

      // Set response headers for file download
      res.setHeader('Content-Type', 'text/plain');
      res.setHeader('Content-Disposition', `attachment; filename=".env-${new Date().toISOString().split('T')[0]}"`);
      res.send(envContent);
      
      console.log('[Admin] Environment variables exported by admin');
    } catch (error: any) {
      console.error('Export env error:', error);
      res.status(500).json({ error: 'Failed to export environment variables' });
    }
  });

  // Direct .env export for development (saves to file)
  app.get("/api/dev/export-env-file", async (req, res) => {
    try {
      const envVars = process.env;
      let envContent = '';

      // Collect all environment variables and format as KEY=VALUE
      for (const [key, value] of Object.entries(envVars)) {
        if (value !== undefined && value !== null) {
          // Escape values that contain special characters
          const escapedValue = typeof value === 'string' && value.includes('"') 
            ? `'${value}'` 
            : `${value}`;
          envContent += `${key}=${escapedValue}\n`;
        }
      }

      res.json({ 
        success: true, 
        content: envContent,
        fileName: `.env-${new Date().toISOString().split('T')[0]}`,
        count: Object.keys(envVars).length 
      });
      
      console.log('[Dev] Environment variables exported');
    } catch (error: any) {
      console.error('Export env error:', error);
      res.status(500).json({ error: 'Failed to export environment variables' });
    }
  });

  // Send initial system info
  setTimeout(() => {
    LogStreamService.broadcast(
      LogStreamService.createLogEntry('info', `GreenPay server started on port ${process.env.PORT || 5000}`, 'system')
    );
  }, 1000);

  return httpServer;
}

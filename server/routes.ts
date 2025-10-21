import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import path from "path";
import { storage } from "./storage";
import { insertUserSchema, insertKycDocumentSchema, insertTransactionSchema, insertPaymentRequestSchema, insertRecipientSchema, insertSupportTicketSchema, insertConversationSchema, insertMessageSchema } from "@shared/schema";
import { z } from "zod";
import bcrypt from "bcrypt";
import multer from "multer";
import * as speakeasy from 'speakeasy';
import * as QRCode from 'qrcode';
import { whatsappService } from "./services/whatsapp";
import { createExchangeRateService } from "./services/exchange-rate";
import { payHeroService } from "./services/payhero";
import { paystackService } from "./services/paystack";
import { twoFactorService } from "./services/2fa";
import { biometricService } from "./services/biometric";
import { notificationService } from "./services/notifications";
import { ObjectStorageService, ObjectNotFoundError } from "./objectStorage";
import { ObjectPermission } from "./objectAcl";

const objectStorage = new ObjectStorageService();

// Configure multer for file uploads with memory storage (for cloud upload)
const upload = multer({
  storage: multer.memoryStorage(), // Store files in memory buffer for cloud upload
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    // Allow common file types
    const allowedMimeTypes = [
      'image/jpeg', 'image/png', 'image/gif', 'image/webp',
      'application/pdf', 'text/plain', 'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ];
    
    if (allowedMimeTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only images, PDFs, and documents are allowed.'));
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
  // Authentication and authorization middleware
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

  // Health check endpoint - must be defined early to avoid catch-all routes
  app.get("/health", (_req, res) => {
    res.status(200).json({ 
      status: "healthy", 
      timestamp: new Date().toISOString(),
      env: process.env.NODE_ENV,
      uptime: process.uptime()
    });
  });

  // Serve private objects from object storage (profile photos, KYC documents)
  app.get("/objects/:objectPath(*)", async (req, res) => {
    try {
      const userId = (req.session as any)?.userId;
      const adminId = (req.session as any)?.admin?.id;
      
      // Require authentication to access private objects
      if (!userId && !adminId) {
        return res.status(401).json({ message: "Authentication required" });
      }

      const objectFile = await objectStorage.getObjectEntityFile(req.path);
      
      // Admins have superuser access to all files
      if (adminId) {
        await objectStorage.downloadObject(objectFile, res);
        return;
      }
      
      // For regular users, check ACL permissions
      const canAccess = await objectStorage.canAccessObjectEntity({
        objectFile,
        userId: userId,
        requestedPermission: ObjectPermission.READ,
      });
      
      if (!canAccess) {
        return res.status(403).json({ message: "Access denied" });
      }

      // Serve the file from object storage
      await objectStorage.downloadObject(objectFile, res);
    } catch (error) {
      console.error('Object serving error:', error);
      if (error instanceof ObjectNotFoundError) {
        return res.status(404).json({ message: "File not found" });
      }
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
  app.post("/api/auth/signup", async (req, res) => {
    try {
      const userData = insertUserSchema.parse(req.body);
      
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

      // Send welcome SMS/WhatsApp with instructions
      if (user.phone) {
        const { messagingService } = await import('./services/messaging');
        const domain = process.env.REPLIT_DOMAINS || 'greenpay.app';
        const loginUrl = `https://${domain.split(',')[0]}/login`;
        
        messagingService.sendMessage(
          user.phone,
          `Welcome to GreenPay! To send and receive money, you need to: 1) Purchase a virtual card 2) Verify your KYC. Login here: ${loginUrl}`
        ).catch(err => console.error('Welcome message error:', err));
      }
      
      // Remove password from response
      const { password, ...userResponse } = user;
      res.json({ user: { ...userResponse, isPhoneVerified: true, isEmailVerified: true } });
    } catch (error) {
      console.error('Signup error:', error);
      res.status(400).json({ message: "Invalid user data" });
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    try {
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

      // Check if messaging credentials are configured
      const apiKeySetting = await storage.getSystemSetting("messaging", "api_key");
      const emailSetting = await storage.getSystemSetting("messaging", "account_email");
      const senderIdSetting = await storage.getSystemSetting("messaging", "sender_id");
      const whatsappSessionSetting = await storage.getSystemSetting("messaging", "whatsapp_session_id");
      
      const credentialsConfigured = !!(apiKeySetting?.value && emailSetting?.value && senderIdSetting?.value && whatsappSessionSetting?.value);
      
      // If messaging credentials are not configured, allow direct login
      if (!credentialsConfigured) {
        console.warn('Messaging credentials not configured - allowing direct login');
        
        // Direct login without OTP (only when messaging is not configured)
        req.session.regenerate((err) => {
          if (err) {
            console.error('Session regeneration error:', err);
            return res.status(500).json({ message: "Session error" });
          }

          // Set session data for direct login
          (req.session as any).userId = user.id;
          (req.session as any).user = { id: user.id, email: user.email };

          // Save login history
          storage.createLoginHistory({
            userId: user.id,
            ipAddress: req.ip || (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || 'Unknown',
            userAgent: req.headers['user-agent'] || 'Unknown',
            deviceType: req.headers['user-agent']?.includes('Mobile') ? 'mobile' : 'desktop',
            browser: req.headers['user-agent']?.split('/')[0] || 'Unknown',
            location: (req.headers['cf-ipcountry'] as string) || 'Unknown',
            status: 'success',
          }).catch(err => console.error('Login history error:', err));

          // Send security notification
          notificationService.sendSecurityNotification(
            user.id,
            "New login detected from your account"
          ).catch(err => console.error('Notification error:', err));

          // Remove password from response
          const { password: _, ...userResponse } = user;
          
          // Save session before responding
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

      // Messaging is configured - OTP is REQUIRED
      const { messagingService } = await import('./services/messaging');
      const otpCode = messagingService.generateOTP();
      const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

      // Store OTP in user record
      await storage.updateUserOtp(user.id, otpCode, otpExpiry);

      // Send OTP via SMS and WhatsApp concurrently
      const result = await messagingService.sendOTP(user.phone, otpCode);

      // When messaging is configured, OTP delivery failure is an error (don't bypass)
      if (!result.sms && !result.whatsapp) {
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

          res.json({ 
            requiresOtp: true,
            userId: user.id,
            phone: user.phone,
            sentVia: sentMethods.join(' and ')
          });
        });
      });
    } catch (error) {
      console.error('Login error:', error);
      res.status(400).json({ message: "Invalid login data" });
    }
  });

  app.post("/api/auth/verify-otp", async (req, res) => {
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
        
        // Send login alert via SMS and WhatsApp
        const { messagingService } = await import('./services/messaging');
        messagingService.sendLoginAlert(user.phone, loginLocation, loginIp || 'Unknown IP')
          .catch(err => console.error('Login alert error:', err));
        
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
  app.post("/api/auth/resend-otp", async (req, res) => {
    try {
      const { userId } = req.body;
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const { messagingService } = await import('./services/messaging');
      const otpCode = messagingService.generateOTP();
      const otpExpiry = new Date(Date.now() + 10 * 60 * 1000);
      
      await storage.updateUserOtp(user.id, otpCode, otpExpiry);
      
      // Send OTP via SMS and WhatsApp
      const result = await messagingService.sendOTP(user.phone, otpCode);
      
      if (!result.sms && !result.whatsapp) {
        return res.status(500).json({ message: "Failed to resend verification code" });
      }
      
      const sentMethods = [];
      if (result.sms) sentMethods.push('SMS');
      if (result.whatsapp) sentMethods.push('WhatsApp');
      
      res.json({ 
        message: `New OTP sent via ${sentMethods.join(' and ')}`
      });
    } catch (error) {
      console.error('Resend OTP error:', error);
      res.status(500).json({ message: "Failed to resend OTP" });
    }
  });

  // Conversation endpoints
  app.get("/api/conversations/user-conversation", async (req, res) => {
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
      
      if (!userId && !adminId) {
        return res.status(401).json({ message: "Authentication required" });
      }

      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      // Upload to object storage
      try {
        const uploadUrl = await objectStorage.getObjectEntityUploadURL();
        
        await fetch(uploadUrl, {
          method: 'PUT',
          body: req.file.buffer,
          headers: { 'Content-Type': req.file.mimetype }
        });

        // Set ACL policy and get the actual object path
        const fileUrl = await objectStorage.trySetObjectEntityAclPolicy(uploadUrl, {
          visibility: 'private',
          owner: userId || adminId
        });

        console.log('File uploaded to object storage:', req.file.originalname, fileUrl);
        
        res.json({ 
          fileUrl,
          fileName: req.file.originalname,
          fileSize: req.file.size,
          mimeType: req.file.mimetype,
          message: "File uploaded successfully"
        });
      } catch (uploadError) {
        console.error('Object storage upload error:', uploadError);
        return res.status(500).json({ message: "Failed to upload file to storage" });
      }
    } catch (error) {
      console.error('File upload error:', error);
      res.status(500).json({ message: "Failed to upload file" });
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
            const frontUploadUrl = await objectStorage.getObjectEntityUploadURL();
            const backUploadUrl = await objectStorage.getObjectEntityUploadURL();
            const selfieUploadUrl = await objectStorage.getObjectEntityUploadURL();

            await Promise.all([
              fetch(frontUploadUrl, {
                method: 'PUT',
                body: files.frontImage[0].buffer,
                headers: { 'Content-Type': files.frontImage[0].mimetype }
              }),
              fetch(backUploadUrl, {
                method: 'PUT',
                body: files.backImage[0].buffer,
                headers: { 'Content-Type': files.backImage[0].mimetype }
              }),
              fetch(selfieUploadUrl, {
                method: 'PUT',
                body: files.selfie[0].buffer,
                headers: { 'Content-Type': files.selfie[0].mimetype }
              })
            ]);

            frontImageUrl = await objectStorage.trySetObjectEntityAclPolicy(frontUploadUrl, {
              visibility: 'private',
              allowedUserIds: [userId]
            });
            backImageUrl = await objectStorage.trySetObjectEntityAclPolicy(backUploadUrl, {
              visibility: 'private',
              allowedUserIds: [userId]
            });
            selfieUrl = await objectStorage.trySetObjectEntityAclPolicy(selfieUploadUrl, {
              visibility: 'private',
              allowedUserIds: [userId]
            });
          } catch (uploadError) {
            console.error('Cloud storage upload error:', uploadError);
            return res.status(500).json({ message: "Failed to upload documents to cloud storage" });
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
        const frontUploadUrl = await objectStorage.getObjectEntityUploadURL();
        const backUploadUrl = await objectStorage.getObjectEntityUploadURL();
        const selfieUploadUrl = await objectStorage.getObjectEntityUploadURL();

        await Promise.all([
          fetch(frontUploadUrl, {
            method: 'PUT',
            body: files.frontImage[0].buffer,
            headers: { 'Content-Type': files.frontImage[0].mimetype }
          }),
          fetch(backUploadUrl, {
            method: 'PUT',
            body: files.backImage[0].buffer,
            headers: { 'Content-Type': files.backImage[0].mimetype }
          }),
          fetch(selfieUploadUrl, {
            method: 'PUT',
            body: files.selfie[0].buffer,
            headers: { 'Content-Type': files.selfie[0].mimetype }
          })
        ]);

        frontImageUrl = await objectStorage.trySetObjectEntityAclPolicy(frontUploadUrl, {
          visibility: 'private',
          allowedUserIds: [userId]
        });
        backImageUrl = await objectStorage.trySetObjectEntityAclPolicy(backUploadUrl, {
          visibility: 'private',
          allowedUserIds: [userId]
        });
        selfieUrl = await objectStorage.trySetObjectEntityAclPolicy(selfieUploadUrl, {
          visibility: 'private',
          allowedUserIds: [userId]
        });
      } catch (uploadError) {
        console.error('Cloud storage upload error:', uploadError);
        return res.status(500).json({ message: "Failed to upload documents to cloud storage" });
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
    } catch (error) {
      console.error('Card payment initialization error:', error);
      res.status(500).json({ message: "Error initializing card payment" });
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
  app.post("/api/users/:id/profile-photo", upload.single('photo'), async (req, res) => {
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

      // Upload to object storage using signed URL
      const uploadUrl = await objectStorage.getObjectEntityUploadURL();
      
      await fetch(uploadUrl, {
        method: 'PUT',
        body: file.buffer,
        headers: { 'Content-Type': file.mimetype }
      });

      // Normalize the URL to get the entity path
      const photoUrl = objectStorage.normalizeObjectEntityPath(uploadUrl);

      // Set ACL policy for private access
      await objectStorage.trySetObjectEntityAclPolicy(photoUrl, { 
        owner: id,
        visibility: 'private' 
      });

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
  app.post("/api/users/:id/change-password", async (req, res) => {
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

  // Airtime purchase endpoint - uses KES balance
  app.post("/api/airtime/purchase", async (req, res) => {
    try {
      const { userId, phoneNumber, amount, currency, provider } = req.body;

      if (!userId || !phoneNumber || !amount || !currency || !provider) {
        return res.status(400).json({ message: "Missing required fields" });
      }

      // Get user
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Airtime purchases require KES balance
      const kesBalance = parseFloat(user.kesBalance || "0");
      const purchaseAmount = parseFloat(amount);
      
      if (kesBalance < purchaseAmount) {
        return res.status(400).json({ 
          message: "Insufficient KES balance. Please convert USD to KES using the Exchange feature." 
        });
      }

      // Create transaction
      const transaction = await storage.createTransaction({
        userId,
        type: "airtime",
        amount: amount.toString(),
        currency: "KES", // Airtime is always in KES
        status: "completed",
        fee: "0.00",
        description: `Airtime purchase for ${phoneNumber} (${provider})`,
        recipientDetails: {
          phoneNumber,
          provider
        }
      });

      // Update user KES balance
      const newKesBalance = kesBalance - purchaseAmount;
      await storage.updateUser(userId, { kesBalance: newKesBalance.toFixed(2) });
      
      res.json({ 
        success: true,
        message: "Airtime purchased successfully",
        transaction
      });
    } catch (error) {
      console.error('Airtime purchase error:', error);
      res.status(500).json({ message: "Error purchasing airtime" });
    }
  });

  app.get("/api/virtual-card/:userId", async (req, res) => {
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
  
  app.get("/api/exchange-rates/:from/:to", async (req, res) => {
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

  app.get("/api/exchange-rates/:base", async (req, res) => {
    try {
      const { base } = req.params;
      const targets = ['NGN', 'GHS', 'KES', 'ZAR', 'EGP', 'XOF', 'XAF'];
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

  // Inter-account transfer route (NEW)
  app.post("/api/transfer", async (req, res) => {
    try {
      const { fromUserId, toUserId, amount, currency, description } = transferSchema.parse(req.body);
      
      const fromUser = await storage.getUser(fromUserId);
      const toUser = await storage.getUser(toUserId);
      
      if (!fromUser || !toUser) {
        return res.status(404).json({ message: "User not found" });
      }

      // Check balance
      const currentBalance = parseFloat(fromUser.balance || "0");
      const transferAmount = parseFloat(amount);
      
      if (currentBalance < transferAmount) {
        return res.status(400).json({ message: "Insufficient balance" });
      }

      // Create transactions for both users
      const sendTransaction = await storage.createTransaction({
        userId: fromUserId,
        type: "send",
        amount,
        currency,
        recipientId: toUserId,
        recipientDetails: { name: toUser.fullName, id: toUserId },
        status: "completed",
        fee: "0.00",
        description: description || `Transfer to ${toUser.fullName}`
      });

      const receiveTransaction = await storage.createTransaction({
        userId: toUserId,
        type: "receive",
        amount,
        currency,
        recipientId: fromUserId,
        recipientDetails: { name: fromUser.fullName, id: fromUserId },
        status: "completed",
        fee: "0.00",
        description: description || `Transfer from ${fromUser.fullName}`
      });

      // Update balances
      await storage.updateUser(fromUserId, { 
        balance: (currentBalance - transferAmount).toFixed(2) 
      });
      
      const toBalance = parseFloat(toUser.balance || "0");
      await storage.updateUser(toUserId, { 
        balance: (toBalance + transferAmount).toFixed(2) 
      });

      // Send notifications
      await notificationService.sendTransactionNotification(fromUserId, sendTransaction);
      await notificationService.sendTransactionNotification(toUserId, receiveTransaction);
      
      res.json({ 
        sendTransaction, 
        receiveTransaction, 
        message: "Transfer completed successfully" 
      });
    } catch (error) {
      console.error('Transfer error:', error);
      res.status(400).json({ message: "Transfer failed" });
    }
  });

  // Real-time Transaction routes
  app.post("/api/transactions/send", async (req, res) => {
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

  app.post("/api/transactions/receive", async (req, res) => {
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
      
      // Send fund receipt notification via SMS and WhatsApp
      if (user) {
        const { messagingService } = await import('./services/messaging');
        messagingService.sendFundReceipt(user.phone, amount, currency, senderDetails.name)
          .catch(err => console.error('Fund receipt notification error:', err));
      }
      
      res.json({ transaction, message: "Payment received successfully" });
    } catch (error) {
      console.error('Receive transaction error:', error);
      res.status(400).json({ message: "Transaction failed" });
    }
  });

  app.get("/api/transactions/:userId", async (req, res) => {
    try {
      const transactions = await storage.getTransactionsByUserId(req.params.userId);
      res.json({ transactions });
    } catch (error) {
      res.status(500).json({ message: "Error fetching transactions" });
    }
  });

  app.get("/api/transactions/status/:transactionId", async (req, res) => {
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

  // 2FA routes
  app.post("/api/auth/2fa/setup", async (req, res) => {
    try {
      const { userId } = req.body;
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const { secret, qrCodeUrl, backupCodes } = twoFactorService.generateSecret(user.email);
      const qrCode = await twoFactorService.generateQRCode(secret, user.email);
      
      // Store secret temporarily (user needs to verify before enabling)
      await storage.updateUser(userId, { twoFactorSecret: secret });
      
      res.json({ qrCode, backupCodes, secret });
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
        await storage.updateUser(userId, { twoFactorEnabled: true });
        res.json({ success: true, message: "2FA enabled successfully" });
      } else {
        res.status(400).json({ message: "Invalid 2FA token" });
      }
    } catch (error) {
      console.error('2FA verification error:', error);
      res.status(500).json({ message: "Error verifying 2FA" });
    }
  });

  // Biometric authentication routes
  app.post("/api/auth/biometric/setup", async (req, res) => {
    try {
      const { userId } = req.body;
      const challenge = await biometricService.generateChallenge(userId);
      
      res.json({ challenge });
    } catch (error) {
      console.error('Biometric setup error:', error);
      res.status(500).json({ message: "Error setting up biometric authentication" });
    }
  });

  app.post("/api/auth/biometric/register", async (req, res) => {
    try {
      const { userId, credential, challenge } = req.body;
      
      const success = await biometricService.registerBiometric(userId, credential);
      
      if (success) {
        await storage.updateUser(userId, { biometricEnabled: true });
        res.json({ success: true, message: "Biometric authentication enabled" });
      } else {
        res.status(400).json({ message: "Failed to register biometric" });
      }
    } catch (error) {
      console.error('Biometric registration error:', error);
      res.status(500).json({ message: "Error registering biometric" });
    }
  });

  app.post("/api/auth/biometric/verify", async (req, res) => {
    try {
      const { userId, challenge, response } = req.body;
      
      const isValid = await biometricService.verifyBiometric(userId, challenge, response);
      
      if (isValid) {
        res.json({ success: true, message: "Biometric verification successful" });
      } else {
        res.status(400).json({ message: "Biometric verification failed" });
      }
    } catch (error) {
      console.error('Biometric verification error:', error);
      res.status(500).json({ message: "Error verifying biometric" });
    }
  });

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
  app.post("/api/recipients", async (req, res) => {
    try {
      const recipientData = insertRecipientSchema.parse(req.body);
      const recipient = await storage.createRecipient(recipientData);
      res.json({ recipient, message: "Recipient added successfully" });
    } catch (error) {
      console.error('Create recipient error:', error);
      res.status(400).json({ message: "Invalid recipient data" });
    }
  });

  app.get("/api/recipients/:userId", async (req, res) => {
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
  app.post("/api/exchange/convert", async (req, res) => {
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
        
        // Send KYC verified notification via SMS and WhatsApp
        if (status === 'verified') {
          const user = await storage.getUser(updatedKyc.userId);
          if (user) {
            const { messagingService } = await import('./services/messaging');
            messagingService.sendKYCVerified(user.phone)
              .catch(err => console.error('KYC notification error:', err));
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
  app.post("/api/support/tickets", async (req, res) => {
    try {
      const ticketData = insertSupportTicketSchema.parse(req.body);
      const userId = (req.session as any)?.user?.id;
      
      if (!userId) {
        return res.status(401).json({ message: "Authentication required" });
      }

      const ticket = await storage.createSupportTicket({
        ...ticketData,
        userId,
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

  // Get user's support tickets
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

      res.json(result);
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
      
      const { amount, type, details } = req.body;
      const currentBalance = parseFloat(user.balance || "0");
      const updateAmount = parseFloat(amount);
      
      let newBalance: number;
      let transactionType: 'receive' | 'send';
      
      switch (type) {
        case "add":
          newBalance = currentBalance + updateAmount;
          transactionType = 'receive';
          break;
        case "subtract":
          newBalance = Math.max(0, currentBalance - updateAmount);
          transactionType = 'send';
          break;
        case "set":
          newBalance = updateAmount;
          transactionType = updateAmount > currentBalance ? 'receive' : 'send';
          break;
        default:
          return res.status(400).json({ error: "Invalid update type" });
      }
      
      // Update user balance
      const updatedUser = await storage.updateUser(req.params.id, { 
        balance: newBalance.toFixed(2) 
      });
      
      // Create transaction record for history
      const transactionAmount = type === 'set' ? Math.abs(newBalance - currentBalance) : updateAmount;
      const transactionData = {
        userId: req.params.id,
        type: transactionType,
        amount: transactionAmount.toFixed(2),
        currency: user.defaultCurrency || 'USD',
        status: 'completed' as const,
        description: details || `Admin ${type} balance adjustment`,
        recipientId: null,
        recipientName: 'System Admin',
        fee: '0.00',
        exchangeRate: 1,
        sourceAmount: transactionAmount.toFixed(2),
        sourceCurrency: user.defaultCurrency || 'USD'
      };
      
      await storage.createTransaction(transactionData);
      
      res.json({ user: updatedUser, newBalance });
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
          
          // Send card activation notification via SMS and WhatsApp
          const { messagingService: issueMessaging } = await import('./services/messaging');
          const cardLastFour = result.cardNumber.slice(-4);
          issueMessaging.sendCardActivation(user.phone, cardLastFour)
            .catch(err => console.error('Card activation notification error:', err));
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
            const activateCardLastFour = card.cardNumber.slice(-4);
            activateMessaging.sendCardActivation(user.phone, activateCardLastFour)
              .catch(err => console.error('Card activation notification error:', err));
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

  app.put("/api/admin/settings/:key", async (req, res) => {
    try {
      const { key } = req.params;
      const { value } = req.body;
      
      const updatedSetting = await storage.updateSystemSetting(key, value);
      
      if (!updatedSetting) {
        return res.status(404).json({ message: "Setting not found" });
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

  // Get user by ID (for refreshing user data)
  app.get("/api/users/:id", async (req, res) => {
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
  app.get("/api/users/:id/login-history", async (req, res) => {
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
  app.get("/api/analytics/:userId/spending", async (req, res) => {
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
      const whatsappSessionSetting = await storage.getSystemSetting("messaging", "whatsapp_session_id");
      
      const settings = {
        apiKey: apiKeySetting?.value || "",
        accountEmail: emailSetting?.value || "",
        senderId: senderIdSetting?.value || "",
        whatsappSessionId: whatsappSessionSetting?.value || "",
      };
      
      res.json(settings);
    } catch (error) {
      console.error('Error fetching messaging settings:', error);
      res.status(500).json({ message: "Error fetching messaging settings" });
    }
  });

  app.put("/api/admin/messaging-settings", async (req, res) => {
    try {
      const { apiKey, accountEmail, senderId, whatsappSessionId } = req.body;
      
      console.log('Admin updated messaging settings');
      
      await storage.setSystemSetting({
        category: "messaging",
        key: "api_key",
        value: (apiKey || '').trim(),
        description: "TalkNTalk API key for SMS and WhatsApp"
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
      
      await storage.setSystemSetting({
        category: "messaging",
        key: "whatsapp_session_id",
        value: (whatsappSessionId || '').trim(),
        description: "WhatsApp business session ID"
      });
      
      res.json({ 
        success: true, 
        message: "Messaging settings updated successfully"
      });
    } catch (error) {
      console.error('Error updating messaging settings:', error);
      res.status(500).json({ message: "Error updating messaging settings" });
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

  // User search endpoint for transfers
  app.get("/api/users/search", async (req, res) => {
    try {
      const { q: searchQuery } = req.query;
      
      if (!searchQuery || typeof searchQuery !== 'string' || searchQuery.length < 2) {
        return res.json({ users: [] });
      }
      
      const users = await storage.getAllUsers();
      
      // Search by email, full name, or phone number, excluding the current user making the request
      // Use more flexible search logic to handle case sensitivity and partial matches
      const filteredUsers = users
        .filter(user => {
          const query = searchQuery.toLowerCase().trim();
          const fullName = (user.fullName || '').toLowerCase().trim();
          const email = (user.email || '').toLowerCase().trim();
          const phone = (user.phone || '').trim();
          
          // Normalize phone numbers to standard format for comparison
          // Converts all formats (+254xxx, 0xxx, 254xxx, 7xxx) to 7xxx format
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
          
          // Check for exact email match first, then partial matches
          const emailMatch = email === query || email.includes(query);
          const nameMatch = fullName.includes(query) || 
                           fullName.split(' ').some(part => part.startsWith(query));
          
          // Enhanced phone matching: compare normalized formats
          const phoneMatch = normalizedUserPhone && normalizedSearchPhone && (
            normalizedUserPhone === normalizedSearchPhone ||
            normalizedUserPhone.includes(normalizedSearchPhone) ||
            normalizedSearchPhone.includes(normalizedUserPhone)
          );
          
          return (emailMatch || nameMatch || phoneMatch) && user.id !== req.session?.userId;
        })
        .slice(0, 10) // Limit to 10 results
        .map(user => ({
          id: user.id,
          fullName: user.fullName,
          email: user.email,
          phone: user.phone
        }));
      
      console.log(`User search for "${searchQuery}": found ${filteredUsers.length} users`);
      res.json({ users: filteredUsers });
    } catch (error) {
      console.error('User search error:', error);
      res.status(500).json({ message: "Error searching users" });
    }
  });

  // User-to-user transfer endpoint
  app.post("/api/transfer", async (req, res) => {
    try {
      const { fromUserId, toUserId, amount, currency, description } = req.body;
      
      if (!fromUserId || !toUserId || !amount || !currency) {
        return res.status(400).json({ message: "Missing required fields" });
      }

      const transferAmount = parseFloat(amount);
      if (transferAmount <= 0) {
        return res.status(400).json({ message: "Invalid transfer amount" });
      }

      // Get both users
      const fromUser = await storage.getUser(fromUserId);
      const toUser = await storage.getUser(toUserId);

      if (!fromUser || !toUser) {
        return res.status(404).json({ message: "User not found" });
      }

      // Check sender's balance
      const senderTransactions = await storage.getTransactionsByUserId(fromUserId);
      const senderBalance = senderTransactions.reduce((balance, txn) => {
        if (txn.status === 'completed') {
          if (txn.type === 'receive' || txn.type === 'deposit') {
            return balance + parseFloat(txn.amount);
          } else if (txn.type === 'send' || txn.type === 'withdraw') {
            return balance - parseFloat(txn.amount) - parseFloat(txn.fee || '0');
          }
          // card_purchase not deducted from balance (paid via M-Pesa)
        }
        return balance;
      }, parseFloat(fromUser.balance || '0'));

      if (senderBalance < transferAmount) {
        return res.status(400).json({ message: "Insufficient balance" });
      }

      // Create transfer transactions
      const now = new Date().toISOString();
      const transferId = storage.generateTransactionReference();

      // Sender transaction (debit)
      const senderTransaction = {
        id: storage.generateTransactionReference(),
        userId: fromUserId,
        type: 'send' as const,
        amount: amount,
        currency: currency,
        status: 'completed' as const,
        description: description || `Transfer to ${toUser.fullName}`,
        recipient: toUser.fullName,
        recipientEmail: toUser.email,
        transferId: transferId,
        createdAt: now,
        fee: '0' // Free transfers between GreenPay users
      };

      // Recipient transaction (credit)
      const recipientTransaction = {
        id: storage.generateTransactionReference(),
        userId: toUserId,
        type: 'receive' as const,
        amount: amount,
        currency: currency,
        status: 'completed' as const,
        description: description || `Transfer from ${fromUser.fullName}`,
        sender: fromUser.fullName,
        senderEmail: fromUser.email,
        transferId: transferId,
        createdAt: now,
        fee: '0'
      };

      // Save both transactions
      await storage.createTransaction(senderTransaction);
      await storage.createTransaction(recipientTransaction);

      res.json({ 
        success: true, 
        transferId,
        message: "Transfer completed successfully" 
      });
    } catch (error) {
      console.error('Transfer error:', error);
      res.status(500).json({ message: "Error processing transfer" });
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
        // Deduct balance from user's account
        const user = await storage.getUser(transaction.userId);
        if (user) {
          const withdrawalAmount = parseFloat(transaction.amount);
          const withdrawalFee = parseFloat(transaction.fee || '0');
          const totalDeduction = withdrawalAmount + withdrawalFee;
          const currentBalance = parseFloat(user.balance || '0');
          const newBalance = (currentBalance - totalDeduction).toFixed(2);
          
          await storage.updateUser(user.id, {
            balance: newBalance
          });
          
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
      
      // Calculate real-time balance (same logic as frontend)
      const userTransactions = await storage.getTransactionsByUserId(userId);
      const realTimeBalance = userTransactions.reduce((balance: number, txn: any) => {
        if (txn.status === 'completed') {
          if (txn.type === 'receive' || txn.type === 'deposit') {
            return balance + parseFloat(txn.amount);
          } else if (txn.type === 'send' || txn.type === 'withdraw') {
            return balance - parseFloat(txn.amount) - parseFloat(txn.fee || '0');
          }
          // card_purchase not deducted from balance (paid via M-Pesa)
        }
        return balance;
      }, parseFloat(user.balance || '0'));
      
      // Check sufficient balance
      if (realTimeBalance < withdrawAmount + withdrawFee) {
        return res.status(400).json({ 
          message: "Insufficient balance",
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

  chatWss.on('connection', (ws, request) => {
    console.log('New WebSocket connection established');
    
    ws.on('message', async (data) => {
      try {
        const message = JSON.parse(data.toString());
        
        switch (message.type) {
          case 'admin_register':
            // Only allow admin registration for monitoring
            if (message.isAdmin && message.adminId) {
              activeAdminConnections.set(message.adminId, {
                socket: ws,
                adminId: message.adminId
              });
              console.log(`Admin ${message.adminId} registered for live chat monitoring`);
            }
            break;
            
          default:
            // All other message types are handled by REST API
            console.log(`WebSocket message type '${message.type}' ignored - use REST API instead`);
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

  // Send initial system info
  setTimeout(() => {
    LogStreamService.broadcast(
      LogStreamService.createLogEntry('info', `GreenPay server started on port ${process.env.PORT || 5000}`, 'system')
    );
  }, 1000);

  return httpServer;
}
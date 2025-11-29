var __defProp = Object.defineProperty;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __esm = (fn, res) => function __init() {
  return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
};
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};

// shared/schema.ts
var schema_exports = {};
__export(schema_exports, {
  adminLogs: () => adminLogs,
  admins: () => admins,
  apiConfigurations: () => apiConfigurations,
  budgets: () => budgets,
  chatMessages: () => chatMessages,
  conversations: () => conversations,
  insertAdminLogSchema: () => insertAdminLogSchema,
  insertAdminSchema: () => insertAdminSchema,
  insertApiConfigurationSchema: () => insertApiConfigurationSchema,
  insertBudgetSchema: () => insertBudgetSchema,
  insertChatMessageSchema: () => insertChatMessageSchema,
  insertConversationSchema: () => insertConversationSchema,
  insertKycDocumentSchema: () => insertKycDocumentSchema,
  insertLoginHistorySchema: () => insertLoginHistorySchema,
  insertMessageSchema: () => insertMessageSchema,
  insertNotificationSchema: () => insertNotificationSchema,
  insertPaymentRequestSchema: () => insertPaymentRequestSchema,
  insertQRPaymentSchema: () => insertQRPaymentSchema,
  insertRecipientSchema: () => insertRecipientSchema,
  insertSavingsGoalSchema: () => insertSavingsGoalSchema,
  insertScheduledPaymentSchema: () => insertScheduledPaymentSchema,
  insertSupportTicketSchema: () => insertSupportTicketSchema,
  insertSystemLogSchema: () => insertSystemLogSchema,
  insertSystemSettingSchema: () => insertSystemSettingSchema,
  insertTransactionSchema: () => insertTransactionSchema,
  insertUserPreferencesSchema: () => insertUserPreferencesSchema,
  insertUserSchema: () => insertUserSchema,
  insertVirtualCardSchema: () => insertVirtualCardSchema,
  kycDocuments: () => kycDocuments,
  loginHistory: () => loginHistory,
  messages: () => messages,
  notifications: () => notifications,
  paymentRequests: () => paymentRequests,
  qrPayments: () => qrPayments,
  recipients: () => recipients,
  savingsGoals: () => savingsGoals,
  scheduledPayments: () => scheduledPayments,
  supportTickets: () => supportTickets,
  systemLogs: () => systemLogs,
  systemSettings: () => systemSettings,
  transactions: () => transactions,
  userPreferences: () => userPreferences,
  users: () => users,
  virtualCards: () => virtualCards
});
import { sql } from "drizzle-orm";
import { pgTable, text, varchar, decimal, timestamp, boolean, jsonb, json, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
var users, kycDocuments, virtualCards, transactions, recipients, paymentRequests, chatMessages, notifications, supportTickets, conversations, messages, insertUserSchema, insertKycDocumentSchema, insertVirtualCardSchema, insertTransactionSchema, insertRecipientSchema, insertPaymentRequestSchema, insertSupportTicketSchema, insertConversationSchema, insertMessageSchema, insertChatMessageSchema, insertNotificationSchema, admins, adminLogs, systemLogs, systemSettings, apiConfigurations, insertAdminSchema, insertAdminLogSchema, insertSystemSettingSchema, insertSystemLogSchema, insertApiConfigurationSchema, savingsGoals, qrPayments, scheduledPayments, budgets, userPreferences, loginHistory, insertSavingsGoalSchema, insertQRPaymentSchema, insertScheduledPaymentSchema, insertBudgetSchema, insertUserPreferencesSchema, insertLoginHistorySchema;
var init_schema = __esm({
  "shared/schema.ts"() {
    "use strict";
    users = pgTable("users", {
      id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
      fullName: text("full_name").notNull(),
      email: text("email").notNull().unique(),
      phone: text("phone").notNull().unique(),
      country: text("country").notNull(),
      password: text("password").notNull(),
      profilePhotoUrl: text("profile_photo_url"),
      isEmailVerified: boolean("is_email_verified").default(false),
      isPhoneVerified: boolean("is_phone_verified").default(false),
      kycStatus: text("kyc_status").default("not_submitted"),
      // not_submitted, pending, verified, rejected
      hasVirtualCard: boolean("has_virtual_card").default(false),
      twoFactorSecret: text("two_factor_secret"),
      twoFactorEnabled: boolean("two_factor_enabled").default(false),
      biometricEnabled: boolean("biometric_enabled").default(false),
      pushNotificationsEnabled: boolean("push_notifications_enabled").default(true),
      balance: decimal("balance", { precision: 10, scale: 2 }).default("0.00"),
      // USD balance
      kesBalance: decimal("kes_balance", { precision: 10, scale: 2 }).default("0.00"),
      // KES balance
      hasReceivedWelcomeBonus: boolean("has_received_welcome_bonus").default(false),
      hasClaimedAirtimeBonus: boolean("has_claimed_airtime_bonus").default(false),
      otpCode: text("otp_code"),
      otpExpiry: timestamp("otp_expiry"),
      paystackCustomerId: text("paystack_customer_id"),
      defaultCurrency: text("default_currency").default("KES"),
      createdAt: timestamp("created_at").defaultNow(),
      updatedAt: timestamp("updated_at").defaultNow()
    });
    kycDocuments = pgTable("kyc_documents", {
      id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
      userId: varchar("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
      documentType: text("document_type").notNull(),
      // national_id, passport, drivers_license
      frontImageUrl: text("front_image_url"),
      backImageUrl: text("back_image_url"),
      selfieUrl: text("selfie_url"),
      dateOfBirth: text("date_of_birth"),
      address: text("address"),
      status: text("status").default("pending"),
      verificationNotes: text("verification_notes"),
      verifiedAt: timestamp("verified_at"),
      createdAt: timestamp("created_at").defaultNow(),
      updatedAt: timestamp("updated_at").defaultNow()
    });
    virtualCards = pgTable("virtual_cards", {
      id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
      userId: varchar("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
      cardNumber: text("card_number").notNull(),
      expiryDate: text("expiry_date").notNull(),
      cvv: text("cvv").notNull(),
      balance: decimal("balance", { precision: 10, scale: 2 }).default("0.00"),
      status: text("status").default("active"),
      // active, frozen, expired
      purchaseAmount: decimal("purchase_amount", { precision: 10, scale: 2 }).default("60.00"),
      paystackReference: text("paystack_reference"),
      purchaseDate: timestamp("purchase_date").defaultNow(),
      updatedAt: timestamp("updated_at").defaultNow()
    });
    transactions = pgTable("transactions", {
      id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
      userId: varchar("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
      type: text("type").notNull(),
      // send, receive, deposit, withdraw, card_purchase
      amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
      currency: text("currency").notNull(),
      recipientId: varchar("recipient_id").references(() => users.id),
      recipientDetails: jsonb("recipient_details"),
      // name, phone, email, bank details
      status: text("status").default("pending"),
      // pending, processing, completed, failed, cancelled
      fee: decimal("fee", { precision: 10, scale: 2 }).default("0.00"),
      exchangeRate: decimal("exchange_rate", { precision: 10, scale: 4 }),
      description: text("description"),
      reference: text("reference"),
      paystackReference: text("paystack_reference"),
      metadata: jsonb("metadata"),
      completedAt: timestamp("completed_at"),
      createdAt: timestamp("created_at").defaultNow(),
      updatedAt: timestamp("updated_at").defaultNow()
    });
    recipients = pgTable("recipients", {
      id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
      userId: varchar("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
      name: text("name").notNull(),
      phone: text("phone"),
      email: text("email"),
      accountNumber: text("account_number"),
      bankName: text("bank_name"),
      bankCode: text("bank_code"),
      country: text("country").notNull(),
      currency: text("currency").notNull().default("KES"),
      recipientType: text("recipient_type").default("mobile_wallet"),
      // bank, mobile_wallet, cash_pickup
      createdAt: timestamp("created_at").defaultNow(),
      updatedAt: timestamp("updated_at").defaultNow()
    });
    paymentRequests = pgTable("payment_requests", {
      id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
      fromUserId: varchar("from_user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
      recipientId: varchar("recipient_id").references(() => recipients.id),
      toEmail: text("to_email"),
      toPhone: text("to_phone"),
      amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
      currency: text("currency").notNull().default("KES"),
      message: text("message"),
      paymentLink: text("payment_link"),
      status: text("status").default("pending"),
      // pending, paid, expired
      createdAt: timestamp("created_at").defaultNow()
    });
    chatMessages = pgTable("chat_messages", {
      id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
      userId: varchar("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
      message: text("message").notNull(),
      isFromAdmin: boolean("is_from_admin").default(false),
      adminId: varchar("admin_id").references(() => users.id, { onDelete: "cascade" }),
      conversationId: varchar("conversation_id").notNull(),
      // Groups messages by support session
      status: text("status").default("sent"),
      // sent, delivered, read
      createdAt: timestamp("created_at").defaultNow()
    });
    notifications = pgTable("notifications", {
      id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
      title: text("title").notNull(),
      message: text("message").notNull(),
      type: text("type").default("info"),
      // info, success, warning, error
      isGlobal: boolean("is_global").default(false),
      // true for admin broadcasts
      userId: varchar("user_id").references(() => users.id, { onDelete: "cascade" }),
      // null for global notifications
      isRead: boolean("is_read").default(false),
      actionUrl: text("action_url"),
      metadata: jsonb("metadata"),
      expiresAt: timestamp("expires_at"),
      createdAt: timestamp("created_at").defaultNow()
    });
    supportTickets = pgTable("support_tickets", {
      id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
      userId: varchar("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
      issueType: text("issue_type").notNull(),
      description: text("description").notNull(),
      status: text("status").default("open"),
      // open, in_progress, resolved, closed
      priority: text("priority").default("medium"),
      // low, medium, high, urgent
      assignedAdminId: varchar("assigned_admin_id").references(() => users.id, { onDelete: "set null" }),
      adminNotes: text("admin_notes"),
      resolvedAt: timestamp("resolved_at"),
      createdAt: timestamp("created_at").defaultNow(),
      updatedAt: timestamp("updated_at").defaultNow()
    });
    conversations = pgTable("conversations", {
      id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
      userId: varchar("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
      adminId: varchar("admin_id").references(() => admins.id),
      status: text("status").default("active"),
      // active, closed
      title: text("title"),
      lastMessageAt: timestamp("last_message_at"),
      createdAt: timestamp("created_at").defaultNow(),
      updatedAt: timestamp("updated_at").defaultNow()
    });
    messages = pgTable("messages", {
      id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
      conversationId: varchar("conversation_id").references(() => conversations.id).notNull(),
      senderId: varchar("sender_id").notNull(),
      senderType: text("sender_type").notNull(),
      // user, admin
      content: text("content").notNull(),
      messageType: text("message_type").default("text"),
      // text, file, image
      fileUrl: text("file_url"),
      fileName: text("file_name"),
      fileSize: integer("file_size"),
      readAt: timestamp("read_at"),
      createdAt: timestamp("created_at").defaultNow()
    });
    insertUserSchema = createInsertSchema(users).omit({
      id: true,
      isEmailVerified: true,
      isPhoneVerified: true,
      kycStatus: true,
      hasVirtualCard: true,
      createdAt: true
    });
    insertKycDocumentSchema = createInsertSchema(kycDocuments).omit({
      id: true,
      status: true,
      createdAt: true
    });
    insertVirtualCardSchema = createInsertSchema(virtualCards).omit({
      id: true,
      cardNumber: true,
      expiryDate: true,
      cvv: true,
      balance: true,
      status: true,
      purchaseDate: true
    });
    insertTransactionSchema = createInsertSchema(transactions).omit({
      id: true,
      createdAt: true
    });
    insertRecipientSchema = createInsertSchema(recipients).omit({
      id: true,
      createdAt: true,
      updatedAt: true
    });
    insertPaymentRequestSchema = createInsertSchema(paymentRequests).omit({
      id: true,
      status: true,
      createdAt: true
    });
    insertSupportTicketSchema = createInsertSchema(supportTickets).omit({
      id: true,
      userId: true,
      // userId comes from session, not request body
      status: true,
      priority: true,
      resolvedAt: true,
      createdAt: true,
      updatedAt: true
    });
    insertConversationSchema = createInsertSchema(conversations).omit({
      id: true,
      status: true,
      lastMessageAt: true,
      createdAt: true,
      updatedAt: true
    });
    insertMessageSchema = createInsertSchema(messages).omit({
      id: true,
      senderId: true,
      // senderId comes from session, not request body
      senderType: true,
      // senderType comes from session, not request body
      readAt: true,
      createdAt: true
    });
    insertChatMessageSchema = createInsertSchema(chatMessages).omit({
      id: true,
      createdAt: true
    });
    insertNotificationSchema = createInsertSchema(notifications).omit({
      id: true,
      createdAt: true
    });
    admins = pgTable("admins", {
      id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
      email: text("email").notNull().unique(),
      password: text("password").notNull(),
      fullName: text("full_name").notNull(),
      role: text("role").notNull().default("admin"),
      twoFactorSecret: text("two_factor_secret"),
      twoFactorEnabled: boolean("two_factor_enabled").default(false),
      lastLoginAt: timestamp("last_login_at"),
      isActive: boolean("is_active").default(true),
      createdAt: timestamp("created_at").defaultNow(),
      updatedAt: timestamp("updated_at").defaultNow()
    });
    adminLogs = pgTable("admin_logs", {
      id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
      adminId: varchar("admin_id").references(() => admins.id),
      action: text("action").notNull(),
      targetType: text("target_type"),
      // user, transaction, kyc, etc.
      targetId: text("target_id"),
      details: json("details"),
      ipAddress: text("ip_address"),
      userAgent: text("user_agent"),
      createdAt: timestamp("created_at").defaultNow()
    });
    systemLogs = pgTable("system_logs", {
      id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
      level: text("level").notNull(),
      // info, warn, error, debug, api
      message: text("message").notNull(),
      source: text("source"),
      data: json("data"),
      timestamp: timestamp("timestamp").defaultNow()
    });
    systemSettings = pgTable("system_settings", {
      id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
      category: text("category").notNull(),
      // fees, limits, currencies, etc.
      key: text("key").notNull(),
      value: json("value").notNull(),
      description: text("description"),
      updatedBy: varchar("updated_by").references(() => admins.id),
      updatedAt: timestamp("updated_at").defaultNow()
    });
    apiConfigurations = pgTable("api_configurations", {
      id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
      provider: text("provider").notNull().unique(),
      // 'exchange_rate', 'paystack', 'payhero'
      displayName: text("display_name").notNull(),
      apiKey: text("api_key"),
      apiSecret: text("api_secret"),
      baseUrl: text("base_url"),
      webhookSecret: text("webhook_secret"),
      isEnabled: boolean("is_enabled").default(true),
      configuration: jsonb("configuration"),
      // Additional provider-specific settings
      lastTested: timestamp("last_tested"),
      testStatus: text("test_status"),
      // 'success', 'failed', 'pending'
      testMessage: text("test_message"),
      updatedBy: varchar("updated_by").references(() => admins.id),
      createdAt: timestamp("created_at").defaultNow(),
      updatedAt: timestamp("updated_at").defaultNow()
    });
    insertAdminSchema = createInsertSchema(admins).omit({
      id: true,
      createdAt: true,
      updatedAt: true
    });
    insertAdminLogSchema = createInsertSchema(adminLogs).omit({
      id: true,
      createdAt: true
    });
    insertSystemSettingSchema = createInsertSchema(systemSettings).omit({
      id: true,
      updatedAt: true
    });
    insertSystemLogSchema = createInsertSchema(systemLogs).omit({
      id: true,
      timestamp: true
    });
    insertApiConfigurationSchema = createInsertSchema(apiConfigurations).omit({
      id: true,
      createdAt: true,
      updatedAt: true
    });
    savingsGoals = pgTable("savings_goals", {
      id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
      userId: varchar("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
      title: text("title").notNull(),
      targetAmount: decimal("target_amount", { precision: 10, scale: 2 }).notNull(),
      currentAmount: decimal("current_amount", { precision: 10, scale: 2 }).default("0.00"),
      targetDate: timestamp("target_date"),
      description: text("description"),
      isActive: boolean("is_active").notNull().default(true),
      createdAt: timestamp("created_at").defaultNow(),
      updatedAt: timestamp("updated_at").defaultNow()
    });
    qrPayments = pgTable("qr_payments", {
      id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
      userId: varchar("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
      paymentCode: text("payment_code").notNull().unique(),
      amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
      currency: text("currency").notNull().default("USD"),
      description: text("description"),
      isActive: boolean("is_active").notNull().default(true),
      expiresAt: timestamp("expires_at").notNull(),
      createdAt: timestamp("created_at").defaultNow(),
      processedAt: timestamp("processed_at")
    });
    scheduledPayments = pgTable("scheduled_payments", {
      id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
      userId: varchar("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
      recipientId: varchar("recipient_id").references(() => recipients.id),
      amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
      currency: text("currency").notNull().default("USD"),
      frequency: text("frequency").notNull(),
      // daily, weekly, monthly, yearly
      nextPaymentDate: timestamp("next_payment_date").notNull(),
      description: text("description"),
      isActive: boolean("is_active").notNull().default(true),
      createdAt: timestamp("created_at").defaultNow(),
      lastPaymentAt: timestamp("last_payment_at"),
      totalPaymentsMade: text("total_payments_made").notNull().default("0")
    });
    budgets = pgTable("budgets", {
      id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
      userId: varchar("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
      category: text("category").notNull(),
      budgetAmount: decimal("budget_amount", { precision: 10, scale: 2 }).notNull(),
      spentAmount: decimal("spent_amount", { precision: 10, scale: 2 }).default("0.00"),
      period: text("period").notNull(),
      // monthly, weekly, yearly
      startDate: timestamp("start_date").notNull(),
      endDate: timestamp("end_date").notNull(),
      isActive: boolean("is_active").notNull().default(true),
      alertThreshold: text("alert_threshold").default("80"),
      // Alert when 80% of budget is spent
      createdAt: timestamp("created_at").defaultNow(),
      updatedAt: timestamp("updated_at").defaultNow()
    });
    userPreferences = pgTable("user_preferences", {
      id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
      userId: varchar("user_id").references(() => users.id, { onDelete: "cascade" }).notNull().unique(),
      theme: text("theme").default("light"),
      // light, dark, auto
      language: text("language").default("en"),
      biometricEnabled: boolean("biometric_enabled").default(false),
      transactionLimit: decimal("transaction_limit", { precision: 10, scale: 2 }).default("1000.00"),
      dailyLimit: decimal("daily_limit", { precision: 10, scale: 2 }).default("5000.00"),
      monthlyLimit: decimal("monthly_limit", { precision: 10, scale: 2 }).default("50000.00"),
      emailNotifications: boolean("email_notifications").default(true),
      smsNotifications: boolean("sms_notifications").default(true),
      marketingEmails: boolean("marketing_emails").default(false),
      createdAt: timestamp("created_at").defaultNow(),
      updatedAt: timestamp("updated_at").defaultNow()
    });
    loginHistory = pgTable("login_history", {
      id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
      userId: varchar("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
      ipAddress: text("ip_address"),
      userAgent: text("user_agent"),
      deviceType: text("device_type"),
      // mobile, desktop, tablet
      browser: text("browser"),
      location: text("location"),
      // City, Country
      status: text("status").default("success"),
      // success, failed
      createdAt: timestamp("created_at").defaultNow()
    });
    insertSavingsGoalSchema = createInsertSchema(savingsGoals).omit({
      id: true,
      currentAmount: true,
      createdAt: true,
      updatedAt: true
    });
    insertQRPaymentSchema = createInsertSchema(qrPayments).omit({
      id: true,
      paymentCode: true,
      createdAt: true,
      processedAt: true
    });
    insertScheduledPaymentSchema = createInsertSchema(scheduledPayments).omit({
      id: true,
      createdAt: true,
      lastPaymentAt: true,
      totalPaymentsMade: true
    });
    insertBudgetSchema = createInsertSchema(budgets).omit({
      id: true,
      spentAmount: true,
      createdAt: true,
      updatedAt: true
    });
    insertUserPreferencesSchema = createInsertSchema(userPreferences).omit({
      id: true,
      createdAt: true,
      updatedAt: true
    });
    insertLoginHistorySchema = createInsertSchema(loginHistory).omit({
      id: true,
      createdAt: true
    });
  }
});

// server/db.ts
import { Pool, neonConfig } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-serverless";
import ws from "ws";
var pool, db;
var init_db = __esm({
  "server/db.ts"() {
    "use strict";
    init_schema();
    neonConfig.webSocketConstructor = ws;
    if (!process.env.DATABASE_URL) {
      throw new Error(
        "DATABASE_URL must be set. Did you forget to provision a database?"
      );
    }
    pool = new Pool({ connectionString: process.env.DATABASE_URL });
    db = drizzle({ client: pool, schema: schema_exports });
  }
});

// server/storage.ts
import { randomUUID } from "crypto";
import { eq, desc, count, sum, or, isNull, gte, lt } from "drizzle-orm";
import bcrypt from "bcrypt";
var MemStorage, DatabaseStorage, storage, memStorage;
var init_storage = __esm({
  "server/storage.ts"() {
    "use strict";
    init_schema();
    init_db();
    MemStorage = class {
      users = /* @__PURE__ */ new Map();
      kycDocuments = /* @__PURE__ */ new Map();
      virtualCards = /* @__PURE__ */ new Map();
      transactions = /* @__PURE__ */ new Map();
      paymentRequests = /* @__PURE__ */ new Map();
      recipients = /* @__PURE__ */ new Map();
      conversations = /* @__PURE__ */ new Map();
      messages = /* @__PURE__ */ new Map();
      chatMessages = /* @__PURE__ */ new Map();
      notifications = /* @__PURE__ */ new Map();
      admins = /* @__PURE__ */ new Map();
      supportTickets = /* @__PURE__ */ new Map();
      systemSettings = /* @__PURE__ */ new Map();
      adminLogs = /* @__PURE__ */ new Map();
      systemLogs = /* @__PURE__ */ new Map();
      constructor() {
        this.initMockData();
      }
      initMockData() {
        const demoUser = {
          id: "demo-user-1",
          fullName: "John Doe",
          email: "john.doe@email.com",
          phone: "+15551234567",
          country: "United States",
          password: "hashedpassword",
          isEmailVerified: true,
          isPhoneVerified: true,
          kycStatus: "verified",
          hasVirtualCard: true,
          twoFactorSecret: null,
          twoFactorEnabled: false,
          biometricEnabled: false,
          pushNotificationsEnabled: true,
          balance: "0.00",
          otpCode: null,
          otpExpiry: null,
          paystackCustomerId: null,
          defaultCurrency: "USD",
          createdAt: /* @__PURE__ */ new Date(),
          updatedAt: /* @__PURE__ */ new Date()
        };
        this.users.set(demoUser.id, demoUser);
        const demoCard = {
          id: "demo-card-1",
          userId: demoUser.id,
          cardNumber: "4567123456784567",
          expiryDate: "12/27",
          cvv: "123",
          balance: "2847.65",
          status: "active",
          purchaseAmount: "60.00",
          paystackReference: null,
          purchaseDate: /* @__PURE__ */ new Date(),
          updatedAt: /* @__PURE__ */ new Date()
        };
        this.virtualCards.set(demoCard.id, demoCard);
        const transactions2 = [
          {
            id: "txn-1",
            userId: demoUser.id,
            type: "send",
            amount: "150.00",
            currency: "USD",
            recipientId: null,
            recipientDetails: { name: "Mary Okafor", phone: "+2348031234567", country: "Nigeria" },
            status: "completed",
            fee: "2.99",
            exchangeRate: "820.0000",
            description: "Sent to Mary Okafor",
            reference: null,
            paystackReference: null,
            metadata: null,
            completedAt: /* @__PURE__ */ new Date(),
            createdAt: /* @__PURE__ */ new Date(),
            updatedAt: /* @__PURE__ */ new Date()
          },
          {
            id: "txn-2",
            userId: demoUser.id,
            type: "receive",
            amount: "85.50",
            currency: "USD",
            recipientId: null,
            recipientDetails: { name: "James Kone", email: "james@email.com", country: "Ghana" },
            status: "completed",
            fee: "0.00",
            exchangeRate: null,
            description: "Received from James Kone",
            reference: null,
            paystackReference: null,
            metadata: null,
            completedAt: new Date(Date.now() - 864e5),
            createdAt: new Date(Date.now() - 864e5),
            // Yesterday
            updatedAt: new Date(Date.now() - 864e5)
          },
          {
            id: "txn-3",
            userId: demoUser.id,
            type: "deposit",
            amount: "500.00",
            currency: "USD",
            recipientId: null,
            recipientDetails: null,
            status: "completed",
            fee: "0.00",
            exchangeRate: null,
            description: "Card Top-up",
            reference: null,
            paystackReference: null,
            metadata: null,
            completedAt: new Date(Date.now() - 432e6),
            createdAt: new Date(Date.now() - 432e6),
            // 5 days ago
            updatedAt: new Date(Date.now() - 432e6)
          }
        ];
        transactions2.forEach((txn) => this.transactions.set(txn.id, txn));
      }
      // User operations
      async getUser(id) {
        return this.users.get(id);
      }
      async getUserByEmail(email) {
        return Array.from(this.users.values()).find((user) => user.email === email);
      }
      async getUserByPhone(phone) {
        return Array.from(this.users.values()).find((user) => user.phone === phone);
      }
      async createUser(insertUser) {
        const id = randomUUID();
        const user = {
          ...insertUser,
          id,
          isEmailVerified: false,
          isPhoneVerified: false,
          kycStatus: "not_submitted",
          hasVirtualCard: false,
          twoFactorSecret: insertUser.twoFactorSecret ?? null,
          twoFactorEnabled: insertUser.twoFactorEnabled ?? false,
          biometricEnabled: insertUser.biometricEnabled ?? false,
          pushNotificationsEnabled: insertUser.pushNotificationsEnabled ?? true,
          balance: insertUser.balance ?? "0.00",
          otpCode: insertUser.otpCode ?? null,
          otpExpiry: insertUser.otpExpiry ?? null,
          paystackCustomerId: insertUser.paystackCustomerId ?? null,
          defaultCurrency: insertUser.defaultCurrency ?? "KES",
          createdAt: /* @__PURE__ */ new Date(),
          updatedAt: /* @__PURE__ */ new Date()
        };
        this.users.set(id, user);
        return user;
      }
      async updateUser(id, updates) {
        const user = this.users.get(id);
        if (!user) return void 0;
        const updatedUser = { ...user, ...updates };
        this.users.set(id, updatedUser);
        return updatedUser;
      }
      async deleteUser(id) {
        this.users.delete(id);
        const kyc = Array.from(this.kycDocuments.values()).find((doc) => doc.userId === id);
        if (kyc) {
          this.kycDocuments.delete(kyc.id);
        }
        const card = Array.from(this.virtualCards.values()).find((c) => c.userId === id);
        if (card) {
          this.virtualCards.delete(card.id);
        }
        Array.from(this.transactions.entries()).forEach(([txId, tx]) => {
          if (tx.userId === id) {
            this.transactions.delete(txId);
          }
        });
        Array.from(this.paymentRequests.entries()).forEach(([reqId, req]) => {
          if (req.fromUserId === id) {
            this.paymentRequests.delete(reqId);
          }
        });
        Array.from(this.recipients.entries()).forEach(([recipientId, recipient]) => {
          if (recipient.userId === id) {
            this.recipients.delete(recipientId);
          }
        });
      }
      // KYC operations
      async createKycDocument(insertKyc) {
        const id = randomUUID();
        const kyc = {
          ...insertKyc,
          id,
          status: "pending",
          frontImageUrl: insertKyc.frontImageUrl ?? null,
          backImageUrl: insertKyc.backImageUrl ?? null,
          selfieUrl: insertKyc.selfieUrl ?? null,
          dateOfBirth: insertKyc.dateOfBirth ?? null,
          address: insertKyc.address ?? null,
          verificationNotes: insertKyc.verificationNotes ?? null,
          verifiedAt: insertKyc.verifiedAt ?? null,
          createdAt: /* @__PURE__ */ new Date(),
          updatedAt: /* @__PURE__ */ new Date()
        };
        this.kycDocuments.set(id, kyc);
        return kyc;
      }
      async getKycByUserId(userId) {
        return Array.from(this.kycDocuments.values()).find((kyc) => kyc.userId === userId);
      }
      async updateKycDocument(id, updates) {
        const kyc = this.kycDocuments.get(id);
        if (!kyc) return void 0;
        const updatedKyc = { ...kyc, ...updates };
        this.kycDocuments.set(id, updatedKyc);
        return updatedKyc;
      }
      // Virtual Card operations
      async createVirtualCard(insertCard) {
        const id = randomUUID();
        const card = {
          ...insertCard,
          id,
          cardNumber: this.generateCardNumber(),
          expiryDate: "12/27",
          cvv: this.generateCVV(),
          balance: "0.00",
          status: "active",
          purchaseAmount: insertCard.purchaseAmount ?? "60.00",
          paystackReference: insertCard.paystackReference ?? null,
          purchaseDate: /* @__PURE__ */ new Date(),
          updatedAt: /* @__PURE__ */ new Date()
        };
        this.virtualCards.set(id, card);
        return card;
      }
      async getVirtualCardByUserId(userId) {
        return Array.from(this.virtualCards.values()).find((card) => card.userId === userId);
      }
      async updateVirtualCard(id, updates) {
        const card = this.virtualCards.get(id);
        if (!card) return void 0;
        const updatedCard = { ...card, ...updates };
        this.virtualCards.set(id, updatedCard);
        return updatedCard;
      }
      // Transaction operations
      async createTransaction(insertTransaction) {
        const id = randomUUID();
        const transaction = {
          ...insertTransaction,
          id,
          status: insertTransaction.status ?? "pending",
          recipientId: insertTransaction.recipientId ?? null,
          recipientDetails: insertTransaction.recipientDetails ?? null,
          description: insertTransaction.description ?? null,
          reference: insertTransaction.reference ?? null,
          paystackReference: insertTransaction.paystackReference ?? null,
          metadata: insertTransaction.metadata ?? null,
          fee: insertTransaction.fee ?? "0.00",
          exchangeRate: insertTransaction.exchangeRate ?? null,
          completedAt: insertTransaction.completedAt ?? null,
          createdAt: /* @__PURE__ */ new Date(),
          updatedAt: /* @__PURE__ */ new Date()
        };
        this.transactions.set(id, transaction);
        return transaction;
      }
      async getTransactionsByUserId(userId) {
        return Array.from(this.transactions.values()).filter((txn) => txn.userId === userId).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      }
      async getTransaction(id) {
        return this.transactions.get(id);
      }
      async updateTransaction(id, updates) {
        const transaction = this.transactions.get(id);
        if (!transaction) return void 0;
        const updatedTransaction = { ...transaction, ...updates };
        this.transactions.set(id, updatedTransaction);
        return updatedTransaction;
      }
      async updateWithdrawalRequest(id, updates) {
        return this.updateTransaction(id, updates);
      }
      // Payment Request operations
      async createPaymentRequest(insertRequest) {
        const id = randomUUID();
        const request = {
          ...insertRequest,
          id,
          status: "pending",
          message: insertRequest.message ?? null,
          currency: insertRequest.currency ?? "KES",
          recipientId: insertRequest.recipientId ?? null,
          toEmail: insertRequest.toEmail ?? null,
          toPhone: insertRequest.toPhone ?? null,
          paymentLink: insertRequest.paymentLink ?? null,
          createdAt: /* @__PURE__ */ new Date()
        };
        this.paymentRequests.set(id, request);
        return request;
      }
      async getPaymentRequestsByUserId(userId) {
        return Array.from(this.paymentRequests.values()).filter((req) => req.fromUserId === userId).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      }
      async updatePaymentRequest(id, updates) {
        const request = this.paymentRequests.get(id);
        if (!request) return void 0;
        const updatedRequest = { ...request, ...updates };
        this.paymentRequests.set(id, updatedRequest);
        return updatedRequest;
      }
      generateCardNumber() {
        return "4567" + Math.random().toString().slice(2, 14);
      }
      generateCVV() {
        return Math.floor(Math.random() * 900 + 100).toString();
      }
      // Recipient operations
      async createRecipient(insertRecipient) {
        const id = randomUUID();
        const recipient = {
          ...insertRecipient,
          id,
          email: insertRecipient.email ?? null,
          phone: insertRecipient.phone ?? null,
          accountNumber: insertRecipient.accountNumber ?? null,
          bankName: insertRecipient.bankName ?? null,
          bankCode: insertRecipient.bankCode ?? null,
          currency: insertRecipient.currency ?? "KES",
          recipientType: insertRecipient.recipientType ?? "mobile_wallet",
          createdAt: /* @__PURE__ */ new Date(),
          updatedAt: /* @__PURE__ */ new Date()
        };
        this.recipients.set(id, recipient);
        return recipient;
      }
      async getRecipientsByUserId(userId) {
        return Array.from(this.recipients.values()).filter((r) => r.userId === userId);
      }
      async getRecipient(id) {
        return this.recipients.get(id);
      }
      async updateRecipient(id, updates) {
        const recipient = this.recipients.get(id);
        if (!recipient) return void 0;
        const updatedRecipient = { ...recipient, ...updates, updatedAt: /* @__PURE__ */ new Date() };
        this.recipients.set(id, updatedRecipient);
        return updatedRecipient;
      }
      async deleteRecipient(id) {
        this.recipients.delete(id);
      }
      // Conversation operations
      async createConversation(insertConversation) {
        const id = randomUUID();
        const conversation = {
          ...insertConversation,
          id,
          status: "active",
          adminId: insertConversation.adminId ?? null,
          title: insertConversation.title ?? null,
          lastMessageAt: null,
          createdAt: /* @__PURE__ */ new Date(),
          updatedAt: /* @__PURE__ */ new Date()
        };
        this.conversations.set(id, conversation);
        return conversation;
      }
      async getConversationsByUserId(userId) {
        return Array.from(this.conversations.values()).filter((c) => c.userId === userId).sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
      }
      async getConversationsByAdminId(adminId) {
        return Array.from(this.conversations.values()).filter((c) => c.adminId === adminId).sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
      }
      async getAllActiveConversations() {
        return Array.from(this.conversations.values()).filter((c) => c.status === "active").sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
      }
      async getConversation(id) {
        return this.conversations.get(id);
      }
      async updateConversation(id, updates) {
        const conversation = this.conversations.get(id);
        if (!conversation) return void 0;
        const updatedConversation = { ...conversation, ...updates, updatedAt: /* @__PURE__ */ new Date() };
        this.conversations.set(id, updatedConversation);
        return updatedConversation;
      }
      async deleteConversation(id) {
        this.conversations.delete(id);
      }
      // Message operations
      async createMessage(insertMessage) {
        const id = randomUUID();
        const message = {
          ...insertMessage,
          id,
          senderId: insertMessage.senderId,
          senderType: insertMessage.senderType,
          messageType: insertMessage.messageType ?? "text",
          fileUrl: insertMessage.fileUrl ?? null,
          fileName: insertMessage.fileName ?? null,
          fileSize: insertMessage.fileSize ?? null,
          readAt: null,
          createdAt: /* @__PURE__ */ new Date()
        };
        this.messages.set(id, message);
        await this.updateConversation(insertMessage.conversationId, {
          lastMessageAt: message.createdAt
        });
        return message;
      }
      async getMessagesByConversationId(conversationId) {
        return Array.from(this.messages.values()).filter((m) => m.conversationId === conversationId).sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
      }
      async getMessage(id) {
        return this.messages.get(id);
      }
      async deleteMessage(id) {
        this.messages.delete(id);
      }
      async markMessageAsRead(id) {
        const message = this.messages.get(id);
        if (!message) return void 0;
        const updatedMessage = { ...message, readAt: /* @__PURE__ */ new Date() };
        this.messages.set(id, updatedMessage);
        return updatedMessage;
      }
      async getUnreadMessagesCount(conversationId, userId) {
        return Array.from(this.messages.values()).filter(
          (m) => m.conversationId === conversationId && m.senderId !== userId && !m.readAt
        ).length;
      }
      // Chat message operations (legacy support)
      async createChatMessage(insertChatMessage) {
        const id = randomUUID();
        const chatMessage = {
          ...insertChatMessage,
          id,
          status: insertChatMessage.status ?? "sent",
          isFromAdmin: insertChatMessage.isFromAdmin ?? false,
          adminId: insertChatMessage.adminId ?? null,
          createdAt: /* @__PURE__ */ new Date()
        };
        this.chatMessages.set(id, chatMessage);
        return chatMessage;
      }
      async getChatMessagesByConversation(conversationId) {
        return Array.from(this.chatMessages.values()).filter((m) => m.conversationId === conversationId).sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
      }
      async getChatMessagesByUserId(userId) {
        return Array.from(this.chatMessages.values()).filter((m) => m.userId === userId).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      }
      async updateChatMessageStatus(id, status) {
        const message = this.chatMessages.get(id);
        if (!message) return void 0;
        const updatedMessage = { ...message, status };
        this.chatMessages.set(id, updatedMessage);
        return updatedMessage;
      }
      // Notification operations
      async createNotification(insertNotification) {
        const id = randomUUID();
        const notification = {
          ...insertNotification,
          id,
          type: insertNotification.type ?? "info",
          isGlobal: insertNotification.isGlobal ?? false,
          userId: insertNotification.userId ?? null,
          actionUrl: insertNotification.actionUrl ?? null,
          metadata: insertNotification.metadata ?? null,
          expiresAt: insertNotification.expiresAt ?? null,
          isRead: false,
          createdAt: /* @__PURE__ */ new Date()
        };
        this.notifications.set(id, notification);
        return notification;
      }
      async getNotificationsByUserId(userId) {
        return Array.from(this.notifications.values()).filter((n) => n.userId === userId).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      }
      async getGlobalNotifications() {
        return Array.from(this.notifications.values()).filter((n) => n.isGlobal).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      }
      async markNotificationAsRead(id) {
        const notification = this.notifications.get(id);
        if (notification) {
          const updatedNotification = { ...notification, isRead: true };
          this.notifications.set(id, updatedNotification);
        }
      }
      async deleteNotification(id) {
        this.notifications.delete(id);
      }
      // Admin operations (basic stubs)
      async getAdminByEmail(email) {
        return Array.from(this.admins.values()).find((admin) => admin.email === email);
      }
      async createAdmin(insertAdmin) {
        const id = randomUUID();
        const hashedPassword = await bcrypt.hash(insertAdmin.password, 10);
        const admin = {
          ...insertAdmin,
          id,
          password: hashedPassword,
          role: insertAdmin.role || "admin",
          twoFactorSecret: insertAdmin.twoFactorSecret ?? null,
          twoFactorEnabled: insertAdmin.twoFactorEnabled ?? false,
          lastLoginAt: insertAdmin.lastLoginAt ?? null,
          isActive: true,
          createdAt: /* @__PURE__ */ new Date(),
          updatedAt: /* @__PURE__ */ new Date()
        };
        this.admins.set(id, admin);
        return admin;
      }
      // Admin operations with proper return types
      async getAllUsers(filters) {
        const users2 = Array.from(this.users.values());
        return {
          users: users2,
          total: users2.length,
          page: filters?.page || 1,
          totalPages: Math.ceil(users2.length / (filters?.limit || 10))
        };
      }
      async getAllKycDocuments() {
        return Array.from(this.kycDocuments.values());
      }
      async getAllTransactions(filters) {
        const transactions2 = Array.from(this.transactions.values());
        return {
          transactions: transactions2,
          total: transactions2.length,
          page: filters?.page || 1,
          totalPages: Math.ceil(transactions2.length / (filters?.limit || 10))
        };
      }
      async getAllVirtualCards() {
        return Array.from(this.virtualCards.values());
      }
      async getUsersCount() {
        return this.users.size;
      }
      async getTransactionsCount() {
        return this.transactions.size;
      }
      async getTotalVolume() {
        return { volume: 0, revenue: 0 };
      }
      async getDashboardMetrics() {
        return {};
      }
      async createAdminLog(log2) {
        const id = randomUUID();
        const adminLog = {
          ...log2,
          id,
          adminId: log2.adminId ?? null,
          targetType: log2.targetType ?? null,
          targetId: log2.targetId ?? null,
          details: log2.details ?? null,
          ipAddress: log2.ipAddress ?? null,
          userAgent: log2.userAgent ?? null,
          createdAt: /* @__PURE__ */ new Date()
        };
        this.adminLogs.set(id, adminLog);
        return adminLog;
      }
      async getAdminLogs() {
        return [];
      }
      async createSystemLog(log2) {
        const id = randomUUID();
        const systemLog = {
          ...log2,
          id,
          data: log2.data ?? {},
          source: log2.source ?? null,
          timestamp: /* @__PURE__ */ new Date()
        };
        this.systemLogs.set(id, systemLog);
        return systemLog;
      }
      async getSystemLogs() {
        return [];
      }
      async deleteOldSystemLogs() {
      }
      async getSystemSettings() {
        return Array.from(this.systemSettings.values());
      }
      async updateSystemSetting(keyOrId, valueOrUpdates) {
        if (typeof valueOrUpdates === "string") {
          const setting = Array.from(this.systemSettings.values()).find((s) => s.key === keyOrId);
          if (setting) {
            const updated = { ...setting, value: JSON.parse(valueOrUpdates), updatedAt: /* @__PURE__ */ new Date() };
            this.systemSettings.set(setting.id, updated);
            return updated;
          }
          return void 0;
        } else {
          const setting = this.systemSettings.get(keyOrId);
          if (!setting) return void 0;
          const updatedSetting = {
            ...setting,
            ...valueOrUpdates,
            description: valueOrUpdates.description ?? setting.description,
            updatedBy: valueOrUpdates.updatedBy ?? setting.updatedBy,
            updatedAt: /* @__PURE__ */ new Date()
          };
          this.systemSettings.set(keyOrId, updatedSetting);
          return updatedSetting;
        }
      }
      async createSystemSetting(setting) {
        const id = randomUUID();
        const systemSetting = {
          ...setting,
          id,
          description: setting.description ?? null,
          updatedBy: setting.updatedBy ?? null,
          updatedAt: /* @__PURE__ */ new Date()
        };
        this.systemSettings.set(id, systemSetting);
        return systemSetting;
      }
      async updateAdmin(id, updates) {
        const admin = this.admins.get(id);
        if (admin) {
          const updated = { ...admin, ...updates, updatedAt: /* @__PURE__ */ new Date() };
          this.admins.set(id, updated);
          return updated;
        }
        return void 0;
      }
      async createSupportTicket() {
        throw new Error("Not implemented");
      }
      async getSupportTicketsByUserId() {
        return [];
      }
      async getAllSupportTickets() {
        return { tickets: [], total: 0, page: 1, totalPages: 1 };
      }
      async getSupportTicket() {
        return void 0;
      }
      async updateSupportTicket() {
        return void 0;
      }
      async deleteSupportTicket(id) {
        this.supportTickets.delete(id);
      }
      async assignSupportTicket() {
        return void 0;
      }
      async getSystemSetting() {
        return void 0;
      }
      async getSystemSettingsByCategory() {
        return [];
      }
      async setSystemSetting() {
        throw new Error("Not implemented");
      }
      async updateUserOtp(id, otpCode, otpExpiry) {
        const user = this.users.get(id);
        if (user) {
          const updated = { ...user, otpCode, otpExpiry, updatedAt: /* @__PURE__ */ new Date() };
          this.users.set(id, updated);
          return updated;
        }
        return void 0;
      }
      async verifyUserOtp(id, otpCode) {
        const user = this.users.get(id);
        if (!user || !user.otpCode || !user.otpExpiry) return false;
        const now = /* @__PURE__ */ new Date();
        const isExpired = now > user.otpExpiry;
        const isValid = user.otpCode === otpCode;
        if (isValid && !isExpired) {
          const updated = { ...user, otpCode: null, otpExpiry: null, isPhoneVerified: true, updatedAt: /* @__PURE__ */ new Date() };
          this.users.set(id, updated);
          return true;
        }
        return false;
      }
      async updateUserPassword(id, hashedPassword) {
        const user = this.users.get(id);
        if (user) {
          const updated = { ...user, password: hashedPassword, updatedAt: /* @__PURE__ */ new Date() };
          this.users.set(id, updated);
          return updated;
        }
        return void 0;
      }
      async getPaymentRequest(id) {
        return this.paymentRequests.get(id);
      }
      // Savings Goals operations (stubs for MemStorage)
      async createSavingsGoal() {
        throw new Error("Not implemented");
      }
      async getSavingsGoalsByUserId() {
        return [];
      }
      async getSavingsGoal() {
        return void 0;
      }
      async updateSavingsGoal() {
        return void 0;
      }
      // QR Payment operations (stubs for MemStorage)  
      async createQRPayment() {
        throw new Error("Not implemented");
      }
      async getQRPaymentByCode() {
        return void 0;
      }
      async updateQRPayment() {
        return void 0;
      }
      // Login History operations (stubs for MemStorage)
      async createLoginHistory() {
        throw new Error("Not implemented");
      }
      async getLoginHistoryByUserId() {
        return [];
      }
      // API Configuration operations (stubs for MemStorage)
      async getApiConfiguration() {
        return void 0;
      }
      async getAllApiConfigurations() {
        return [];
      }
      async createApiConfiguration() {
        throw new Error("Not implemented");
      }
      async updateApiConfiguration() {
        return void 0;
      }
      async deleteApiConfiguration() {
      }
    };
    DatabaseStorage = class {
      async getUser(id) {
        const [user] = await db.select().from(users).where(eq(users.id, id));
        return user || void 0;
      }
      async getUserByEmail(email) {
        const [user] = await db.select().from(users).where(eq(users.email, email));
        return user || void 0;
      }
      async getUserByPhone(phone) {
        const [user] = await db.select().from(users).where(eq(users.phone, phone));
        return user || void 0;
      }
      async createUser(insertUser) {
        const hashedPassword = await bcrypt.hash(insertUser.password, 10);
        const [user] = await db.insert(users).values({ ...insertUser, password: hashedPassword }).returning();
        return user;
      }
      async updateUser(id, updates) {
        const [user] = await db.update(users).set({ ...updates, updatedAt: /* @__PURE__ */ new Date() }).where(eq(users.id, id)).returning();
        return user || void 0;
      }
      async updateUserOtp(id, otpCode, otpExpiry) {
        const [user] = await db.update(users).set({ otpCode, otpExpiry, updatedAt: /* @__PURE__ */ new Date() }).where(eq(users.id, id)).returning();
        return user || void 0;
      }
      async verifyUserOtp(id, otpCode) {
        const [user] = await db.select().from(users).where(eq(users.id, id));
        if (!user || !user.otpCode || !user.otpExpiry) return false;
        const now = /* @__PURE__ */ new Date();
        const isExpired = now > user.otpExpiry;
        const isValid = user.otpCode === otpCode;
        if (isValid && !isExpired) {
          await db.update(users).set({ otpCode: null, otpExpiry: null, isPhoneVerified: true, updatedAt: /* @__PURE__ */ new Date() }).where(eq(users.id, id));
          return true;
        }
        return false;
      }
      async updateUserPassword(id, hashedPassword) {
        const [user] = await db.update(users).set({ password: hashedPassword, updatedAt: /* @__PURE__ */ new Date() }).where(eq(users.id, id)).returning();
        return user || void 0;
      }
      async deleteUser(id) {
        const userConversations = await db.select().from(conversations).where(eq(conversations.userId, id));
        for (const conversation of userConversations) {
          await db.delete(messages).where(eq(messages.conversationId, conversation.id));
          await db.delete(conversations).where(eq(conversations.id, conversation.id));
        }
        await db.delete(kycDocuments).where(eq(kycDocuments.userId, id));
        await db.delete(virtualCards).where(eq(virtualCards.userId, id));
        await db.delete(transactions).where(eq(transactions.userId, id));
        await db.delete(transactions).where(eq(transactions.recipientId, id));
        await db.delete(paymentRequests).where(eq(paymentRequests.fromUserId, id));
        await db.delete(recipients).where(eq(recipients.userId, id));
        await db.delete(notifications).where(eq(notifications.userId, id));
        await db.delete(supportTickets).where(eq(supportTickets.userId, id));
        await db.delete(supportTickets).where(eq(supportTickets.assignedAdminId, id));
        await db.delete(chatMessages).where(eq(chatMessages.userId, id));
        await db.delete(chatMessages).where(eq(chatMessages.adminId, id));
        await db.delete(savingsGoals).where(eq(savingsGoals.userId, id));
        await db.delete(qrPayments).where(eq(qrPayments.userId, id));
        await db.delete(scheduledPayments).where(eq(scheduledPayments.userId, id));
        await db.delete(budgets).where(eq(budgets.userId, id));
        await db.delete(userPreferences).where(eq(userPreferences.userId, id));
        await db.delete(users).where(eq(users.id, id));
      }
      // KYC operations
      async createKycDocument(insertKyc) {
        const [kyc] = await db.insert(kycDocuments).values(insertKyc).returning();
        return kyc;
      }
      async getKycByUserId(userId) {
        const [kyc] = await db.select().from(kycDocuments).where(eq(kycDocuments.userId, userId));
        return kyc || void 0;
      }
      async updateKycDocument(id, updates) {
        const [kyc] = await db.update(kycDocuments).set({ ...updates, updatedAt: /* @__PURE__ */ new Date() }).where(eq(kycDocuments.id, id)).returning();
        return kyc || void 0;
      }
      // Virtual Card operations
      async createVirtualCard(insertCard) {
        const cardNumber = this.generateCardNumber();
        const cvv = this.generateCVV();
        const expiryDate = this.generateExpiryDate();
        const [card] = await db.insert(virtualCards).values({
          ...insertCard,
          cardNumber,
          cvv,
          expiryDate,
          purchaseAmount: "60.00"
        }).returning();
        return card;
      }
      async getVirtualCardByUserId(userId) {
        const [card] = await db.select().from(virtualCards).where(eq(virtualCards.userId, userId));
        return card || void 0;
      }
      async updateVirtualCard(id, updates) {
        const [card] = await db.update(virtualCards).set({ ...updates, updatedAt: /* @__PURE__ */ new Date() }).where(eq(virtualCards.id, id)).returning();
        return card || void 0;
      }
      // Transaction operations
      async createTransaction(insertTransaction) {
        const reference = this.generateTransactionReference();
        const [transaction] = await db.insert(transactions).values({ ...insertTransaction, reference }).returning();
        return transaction;
      }
      async getTransactionsByUserId(userId) {
        return await db.select().from(transactions).where(eq(transactions.userId, userId)).orderBy(desc(transactions.createdAt));
      }
      async getTransaction(id) {
        const [transaction] = await db.select().from(transactions).where(eq(transactions.id, id));
        return transaction || void 0;
      }
      async updateTransaction(id, updates) {
        const [transaction] = await db.update(transactions).set({ ...updates, updatedAt: /* @__PURE__ */ new Date() }).where(eq(transactions.id, id)).returning();
        return transaction || void 0;
      }
      async updateWithdrawalRequest(id, updates) {
        return this.updateTransaction(id, updates);
      }
      // Payment Request operations
      async createPaymentRequest(insertRequest) {
        const [request] = await db.insert(paymentRequests).values(insertRequest).returning();
        return request;
      }
      async getPaymentRequestsByUserId(userId) {
        return await db.select().from(paymentRequests).where(eq(paymentRequests.fromUserId, userId)).orderBy(desc(paymentRequests.createdAt));
      }
      async updatePaymentRequest(id, updates) {
        const [request] = await db.update(paymentRequests).set(updates).where(eq(paymentRequests.id, id)).returning();
        return request || void 0;
      }
      async getPaymentRequest(id) {
        const [request] = await db.select().from(paymentRequests).where(eq(paymentRequests.id, id));
        return request || void 0;
      }
      // Recipient operations
      async createRecipient(data) {
        const [recipient] = await db.insert(recipients).values(data).returning();
        return recipient;
      }
      async getRecipientsByUserId(userId) {
        return db.select().from(recipients).where(eq(recipients.userId, userId)).orderBy(desc(recipients.createdAt));
      }
      async getRecipient(id) {
        const [recipient] = await db.select().from(recipients).where(eq(recipients.id, id));
        return recipient;
      }
      async updateRecipient(id, data) {
        const [recipient] = await db.update(recipients).set({ ...data, updatedAt: /* @__PURE__ */ new Date() }).where(eq(recipients.id, id)).returning();
        return recipient;
      }
      async deleteRecipient(id) {
        await db.delete(recipients).where(eq(recipients.id, id));
      }
      // Chat message operations
      async createChatMessage(message) {
        const [chatMessage] = await db.insert(chatMessages).values({
          ...message,
          id: randomUUID()
        }).returning();
        return chatMessage;
      }
      async getChatMessagesByConversation(conversationId) {
        return await db.select().from(chatMessages).where(eq(chatMessages.conversationId, conversationId)).orderBy(chatMessages.createdAt);
      }
      async getChatMessagesByUserId(userId) {
        return await db.select().from(chatMessages).where(eq(chatMessages.userId, userId)).orderBy(desc(chatMessages.createdAt));
      }
      async updateChatMessageStatus(id, status) {
        const [chatMessage] = await db.update(chatMessages).set({ status }).where(eq(chatMessages.id, id)).returning();
        return chatMessage;
      }
      generateCardNumber() {
        return "4567" + Math.random().toString().slice(2, 14);
      }
      generateCVV() {
        return Math.floor(Math.random() * 900 + 100).toString();
      }
      generateExpiryDate() {
        const currentYear = (/* @__PURE__ */ new Date()).getFullYear();
        const expiryYear = currentYear + 4;
        return `12/${expiryYear.toString().slice(-2)}`;
      }
      generateTransactionReference() {
        return "GP" + Date.now().toString() + Math.random().toString(36).substr(2, 5).toUpperCase();
      }
      // Admin operations
      async getAdminByEmail(email) {
        const [admin] = await db.select().from(admins).where(eq(admins.email, email));
        return admin || void 0;
      }
      async createAdmin(insertAdmin) {
        const hashedPassword = await bcrypt.hash(insertAdmin.password, 10);
        const [admin] = await db.insert(admins).values({ ...insertAdmin, password: hashedPassword }).returning();
        return admin;
      }
      async updateAdmin(id, updates) {
        const [admin] = await db.update(admins).set({ ...updates, updatedAt: /* @__PURE__ */ new Date() }).where(eq(admins.id, id)).returning();
        return admin || void 0;
      }
      async createAdminLog(insertLog) {
        const [log2] = await db.insert(adminLogs).values(insertLog).returning();
        return log2;
      }
      async getAdminLogs() {
        return await db.select().from(adminLogs).orderBy(desc(adminLogs.createdAt));
      }
      async createSystemLog(insertLog) {
        const [log2] = await db.insert(systemLogs).values(insertLog).returning();
        return log2;
      }
      async getSystemLogs(minutes = 30) {
        const timeAgo = new Date(Date.now() - minutes * 60 * 1e3);
        return await db.select().from(systemLogs).where(gte(systemLogs.timestamp, timeAgo)).orderBy(desc(systemLogs.timestamp));
      }
      async deleteOldSystemLogs(minutes = 30) {
        const timeAgo = new Date(Date.now() - minutes * 60 * 1e3);
        await db.delete(systemLogs).where(lt(systemLogs.timestamp, timeAgo));
      }
      // Admin data operations
      async getAllUsers() {
        return await db.select().from(users).orderBy(desc(users.createdAt));
      }
      async getAllTransactions() {
        return await db.select().from(transactions).orderBy(desc(transactions.createdAt));
      }
      async getAllKycDocuments() {
        return await db.select().from(kycDocuments).orderBy(desc(kycDocuments.createdAt));
      }
      async getAllVirtualCards() {
        return await db.select().from(virtualCards).orderBy(desc(virtualCards.purchaseDate));
      }
      async getUsersCount() {
        const result = await db.select({ count: count() }).from(users);
        return result[0].count;
      }
      async getTransactionsCount() {
        const result = await db.select({ count: count() }).from(transactions);
        return result[0].count;
      }
      async getTotalVolume() {
        const volumeResult = await db.select({
          totalVolume: sum(transactions.amount).mapWith(Number),
          totalFees: sum(transactions.fee).mapWith(Number)
        }).from(transactions).where(eq(transactions.status, "completed"));
        return {
          volume: volumeResult[0].totalVolume || 0,
          revenue: volumeResult[0].totalFees || 0
        };
      }
      // System settings
      async getSystemSetting(category, key) {
        const [setting] = await db.select().from(systemSettings).where(eq(systemSettings.category, category)).where(eq(systemSettings.key, key)).orderBy(desc(systemSettings.updatedAt)).limit(1);
        return setting || void 0;
      }
      async setSystemSetting(insertSetting) {
        const existing = await this.getSystemSetting(insertSetting.category, insertSetting.key);
        if (existing) {
          const [updated] = await db.update(systemSettings).set({
            value: insertSetting.value,
            description: insertSetting.description,
            updatedAt: /* @__PURE__ */ new Date()
          }).where(eq(systemSettings.id, existing.id)).returning();
          return updated;
        } else {
          const [setting] = await db.insert(systemSettings).values(insertSetting).returning();
          return setting;
        }
      }
      async updateSystemSetting(id, updates) {
        const [setting] = await db.update(systemSettings).set({ ...updates, updatedAt: /* @__PURE__ */ new Date() }).where(eq(systemSettings.id, id)).returning();
        return setting || void 0;
      }
      async getSystemSettingsByCategory(category) {
        return await db.select().from(systemSettings).where(eq(systemSettings.category, category)).orderBy(systemSettings.key);
      }
      async getSystemSettings() {
        return await db.select().from(systemSettings).orderBy(systemSettings.category, systemSettings.key);
      }
      async createSystemSetting(setting) {
        return await this.setSystemSetting(setting);
      }
      // API Configuration operations
      async getApiConfiguration(provider) {
        const [config] = await db.select().from(apiConfigurations).where(eq(apiConfigurations.provider, provider));
        return config || void 0;
      }
      async getAllApiConfigurations() {
        return await db.select().from(apiConfigurations).orderBy(apiConfigurations.provider);
      }
      async createApiConfiguration(insertConfig) {
        const [config] = await db.insert(apiConfigurations).values(insertConfig).returning();
        return config;
      }
      async updateApiConfiguration(provider, updates) {
        const [config] = await db.update(apiConfigurations).set({ ...updates, updatedAt: /* @__PURE__ */ new Date() }).where(eq(apiConfigurations.provider, provider)).returning();
        return config || void 0;
      }
      async deleteApiConfiguration(provider) {
        await db.delete(apiConfigurations).where(eq(apiConfigurations.provider, provider));
      }
      // Notification operations
      async createNotification(notification) {
        const [newNotification] = await db.insert(notifications).values(notification).returning();
        return newNotification;
      }
      async getNotificationsByUserId(userId) {
        return await db.select().from(notifications).where(eq(notifications.userId, userId)).orderBy(desc(notifications.createdAt));
      }
      async getGlobalNotifications() {
        return await db.select().from(notifications).where(eq(notifications.isGlobal, true)).orderBy(desc(notifications.createdAt));
      }
      async markNotificationAsRead(id) {
        await db.update(notifications).set({ isRead: true }).where(eq(notifications.id, id));
      }
      async deleteNotification(id) {
        await db.delete(notifications).where(eq(notifications.id, id));
      }
      // Support Ticket operations
      async createSupportTicket(ticket) {
        const [newTicket] = await db.insert(supportTickets).values(ticket).returning();
        return newTicket;
      }
      async getSupportTicketsByUserId(userId) {
        return await db.select().from(supportTickets).where(eq(supportTickets.userId, userId)).orderBy(desc(supportTickets.createdAt));
      }
      async getAllSupportTickets(filters = {}) {
        const { status, priority, page = 1, limit = 20 } = filters;
        const offset = (page - 1) * limit;
        let query = db.select().from(supportTickets);
        let countQuery = db.select({ count: count() }).from(supportTickets);
        const conditions = [];
        if (status) {
          conditions.push(eq(supportTickets.status, status));
        }
        if (priority) {
          conditions.push(eq(supportTickets.priority, priority));
        }
        if (conditions.length > 0) {
          query = query.where(or(...conditions));
          countQuery = countQuery.where(or(...conditions));
        }
        const [tickets, totalResult] = await Promise.all([
          query.orderBy(desc(supportTickets.createdAt)).limit(limit).offset(offset),
          countQuery
        ]);
        const total = totalResult[0]?.count || 0;
        const totalPages = Math.ceil(Number(total) / limit);
        return { tickets, total: Number(total), page, totalPages };
      }
      async getSupportTicket(id) {
        const [ticket] = await db.select().from(supportTickets).where(eq(supportTickets.id, id));
        return ticket;
      }
      async updateSupportTicket(id, updates) {
        const [updatedTicket] = await db.update(supportTickets).set({ ...updates, updatedAt: /* @__PURE__ */ new Date() }).where(eq(supportTickets.id, id)).returning();
        return updatedTicket;
      }
      async deleteSupportTicket(id) {
        await db.delete(supportTickets).where(eq(supportTickets.id, id));
      }
      async assignSupportTicket(id, adminId) {
        const [updatedTicket] = await db.update(supportTickets).set({
          assignedAdminId: adminId,
          status: "in_progress",
          updatedAt: /* @__PURE__ */ new Date()
        }).where(eq(supportTickets.id, id)).returning();
        return updatedTicket;
      }
      // Conversation operations
      async createConversation(insertConversation) {
        const [conversation] = await db.insert(conversations).values(insertConversation).returning();
        return conversation;
      }
      async getConversationsByUserId(userId) {
        return await db.select().from(conversations).where(eq(conversations.userId, userId)).orderBy(desc(conversations.updatedAt));
      }
      async getConversationsByAdminId(adminId) {
        return await db.select().from(conversations).where(eq(conversations.adminId, adminId)).orderBy(desc(conversations.updatedAt));
      }
      async getAllActiveConversations() {
        return await db.select().from(conversations).where(eq(conversations.status, "active")).orderBy(desc(conversations.updatedAt));
      }
      async getConversation(id) {
        const [conversation] = await db.select().from(conversations).where(eq(conversations.id, id));
        return conversation;
      }
      async updateConversation(id, updates) {
        const [conversation] = await db.update(conversations).set({ ...updates, updatedAt: /* @__PURE__ */ new Date() }).where(eq(conversations.id, id)).returning();
        return conversation;
      }
      async deleteConversation(id) {
        await db.delete(messages).where(eq(messages.conversationId, id));
        await db.delete(conversations).where(eq(conversations.id, id));
      }
      // Message operations
      async createMessage(insertMessage) {
        const [message] = await db.insert(messages).values(insertMessage).returning();
        await this.updateConversation(insertMessage.conversationId, {
          lastMessageAt: message.createdAt
        });
        return message;
      }
      async getMessagesByConversationId(conversationId) {
        return await db.select().from(messages).where(eq(messages.conversationId, conversationId)).orderBy(messages.createdAt);
      }
      async getMessage(id) {
        const [message] = await db.select().from(messages).where(eq(messages.id, id));
        return message;
      }
      async deleteMessage(id) {
        await db.delete(messages).where(eq(messages.id, id));
      }
      async markMessageAsRead(id) {
        const [message] = await db.update(messages).set({ readAt: /* @__PURE__ */ new Date() }).where(eq(messages.id, id)).returning();
        return message;
      }
      async getUnreadMessagesCount(conversationId, userId) {
        const result = await db.select({ count: count() }).from(messages).where(
          eq(messages.conversationId, conversationId)
        ).where(
          isNull(messages.readAt)
        );
        const unreadMessages = await db.select().from(messages).where(
          eq(messages.conversationId, conversationId)
        ).where(
          isNull(messages.readAt)
        );
        return unreadMessages.filter((m) => m.senderId !== userId).length;
      }
      // Savings Goals operations
      async createSavingsGoal(goal) {
        const [savingsGoal] = await db.insert(savingsGoals).values(goal).returning();
        return savingsGoal;
      }
      async getSavingsGoalsByUserId(userId) {
        return await db.select().from(savingsGoals).where(eq(savingsGoals.userId, userId)).orderBy(desc(savingsGoals.createdAt));
      }
      async getSavingsGoal(id) {
        const [goal] = await db.select().from(savingsGoals).where(eq(savingsGoals.id, id));
        return goal || void 0;
      }
      async updateSavingsGoal(id, updates) {
        const [goal] = await db.update(savingsGoals).set({ ...updates, updatedAt: /* @__PURE__ */ new Date() }).where(eq(savingsGoals.id, id)).returning();
        return goal || void 0;
      }
      // QR Payment operations
      async createQRPayment(payment) {
        const [qrPayment] = await db.insert(qrPayments).values(payment).returning();
        return qrPayment;
      }
      async getQRPaymentByCode(paymentCode) {
        const [payment] = await db.select().from(qrPayments).where(eq(qrPayments.paymentCode, paymentCode));
        return payment || void 0;
      }
      async updateQRPayment(id, updates) {
        const [payment] = await db.update(qrPayments).set(updates).where(eq(qrPayments.id, id)).returning();
        return payment || void 0;
      }
      // Login History operations
      async createLoginHistory(history) {
        const [loginRecord] = await db.insert(loginHistory).values(history).returning();
        return loginRecord;
      }
      async getLoginHistoryByUserId(userId, limit = 10) {
        const history = await db.select().from(loginHistory).where(eq(loginHistory.userId, userId)).orderBy(desc(loginHistory.createdAt)).limit(limit);
        return history;
      }
    };
    storage = new DatabaseStorage();
    memStorage = new MemStorage();
  }
});

// server/services/exchange-rate.ts
var exchange_rate_exports = {};
__export(exchange_rate_exports, {
  ExchangeRateService: () => ExchangeRateService,
  createExchangeRateService: () => createExchangeRateService,
  exchangeRateService: () => exchangeRateService
});
import fetch2 from "node-fetch";
var ExchangeRateService, createExchangeRateService, exchangeRateService;
var init_exchange_rate = __esm({
  "server/services/exchange-rate.ts"() {
    "use strict";
    ExchangeRateService = class {
      apiKey;
      baseUrl = "https://v6.exchangerate-api.com/v6";
      storage;
      constructor(storage2) {
        this.storage = storage2;
        this.apiKey = process.env.EXCHANGERATE_API_KEY;
        if (!this.apiKey) {
          console.warn("Exchange rate API key not configured - using fallback rates");
        }
      }
      async getApiKey() {
        if (this.storage) {
          try {
            const config = await this.storage.getApiConfiguration("exchange_rate");
            if (config && config.isEnabled && config.apiKey) {
              return config.apiKey;
            }
          } catch (error) {
            console.error("Error fetching exchange rate config from database:", error);
          }
        }
        return this.apiKey;
      }
      async hasApiKey() {
        const key = await this.getApiKey();
        return !!key;
      }
      async getExchangeRate(from, to) {
        const apiKey = await this.getApiKey();
        if (!apiKey) {
          return this.getFallbackRate(from, to);
        }
        try {
          const url = `${this.baseUrl}/${apiKey}/pair/${from}/${to}`;
          const response = await fetch2(url);
          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }
          const data = await response.json();
          if (data.result !== "success") {
            throw new Error(`API error: ${data["error-type"]}`);
          }
          return data.conversion_rate;
        } catch (error) {
          console.error("Exchange rate fetch error:", error);
          return this.getFallbackRate(from, to);
        }
      }
      getFallbackRate(from, to) {
        const fallbackRates = {
          "USD": {
            "KES": 129
          },
          "KES": {
            "USD": 77e-4
          }
        };
        return fallbackRates[from]?.[to] || 1;
      }
      async getMultipleRates(base, targets) {
        const apiKey = await this.getApiKey();
        if (!apiKey) {
          return this.getMultipleFallbackRates(base, targets);
        }
        try {
          const url = `${this.baseUrl}/${apiKey}/latest/${base}`;
          const response = await fetch2(url);
          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }
          const data = await response.json();
          if (data.result !== "success") {
            throw new Error(`API error: ${data["error-type"]}`);
          }
          const rates = {};
          targets.forEach((target) => {
            rates[target] = data.conversion_rates[target] || 1;
          });
          return rates;
        } catch (error) {
          console.error("Multiple exchange rates fetch error:", error);
          return this.getMultipleFallbackRates(base, targets);
        }
      }
      getMultipleFallbackRates(base, targets) {
        const fallbackRates = {
          "KES": 129,
          "USD": 77e-4
        };
        return Object.fromEntries(
          targets.map((target) => [target, fallbackRates[target] || 1])
        );
      }
    };
    createExchangeRateService = (storage2) => new ExchangeRateService(storage2);
    exchangeRateService = new ExchangeRateService();
  }
});

// server/services/email-templates.ts
var email_templates_exports = {};
__export(email_templates_exports, {
  emailTemplates: () => emailTemplates
});
var baseTemplate, emailTemplates;
var init_email_templates = __esm({
  "server/services/email-templates.ts"() {
    "use strict";
    baseTemplate = (content) => `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>GreenPay</title>
  <style>
    body {
      margin: 0;
      padding: 0;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      background-color: #f5f5f5;
    }
    .email-wrapper {
      max-width: 600px;
      margin: 0 auto;
      background-color: #ffffff;
    }
    .header {
      background: linear-gradient(135deg, #10b981 0%, #059669 100%);
      padding: 40px 20px;
      text-align: center;
    }
    .logo {
      width: 60px;
      height: 60px;
      background-color: #ffffff;
      border-radius: 50%;
      margin: 0 auto 16px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 32px;
      font-weight: bold;
      color: #10b981;
    }
    .header-title {
      color: #ffffff;
      font-size: 24px;
      font-weight: bold;
      margin: 0;
    }
    .content {
      padding: 40px 30px;
    }
    .greeting {
      font-size: 18px;
      color: #1f2937;
      margin-bottom: 20px;
    }
    .text {
      font-size: 16px;
      color: #4b5563;
      line-height: 1.6;
      margin-bottom: 20px;
    }
    .otp-box {
      background: linear-gradient(135deg, #10b981 0%, #059669 100%);
      border-radius: 12px;
      padding: 24px;
      text-align: center;
      margin: 30px 0;
    }
    .otp-code {
      font-size: 36px;
      font-weight: bold;
      color: #ffffff;
      letter-spacing: 8px;
      margin: 0;
    }
    .otp-label {
      color: #ffffff;
      font-size: 14px;
      margin-top: 12px;
      opacity: 0.9;
    }
    .info-box {
      background-color: #f0fdf4;
      border-left: 4px solid #10b981;
      border-radius: 8px;
      padding: 20px;
      margin: 20px 0;
    }
    .warning-box {
      background-color: #fef2f2;
      border-left: 4px solid #ef4444;
      border-radius: 8px;
      padding: 20px;
      margin: 20px 0;
    }
    .transaction-box {
      background-color: #f9fafb;
      border-radius: 12px;
      padding: 24px;
      margin: 20px 0;
    }
    .transaction-row {
      display: flex;
      justify-content: space-between;
      padding: 12px 0;
      border-bottom: 1px solid #e5e7eb;
    }
    .transaction-row:last-child {
      border-bottom: none;
    }
    .transaction-label {
      color: #6b7280;
      font-size: 14px;
    }
    .transaction-value {
      color: #1f2937;
      font-weight: 600;
      font-size: 14px;
    }
    .amount {
      font-size: 32px;
      font-weight: bold;
      color: #10b981;
      text-align: center;
      margin: 20px 0;
    }
    .button {
      display: inline-block;
      background: linear-gradient(135deg, #10b981 0%, #059669 100%);
      color: #ffffff !important;
      padding: 14px 32px;
      border-radius: 8px;
      text-decoration: none;
      font-weight: 600;
      text-align: center;
      margin: 20px 0;
    }
    .button-secondary {
      display: inline-block;
      background-color: #f3f4f6;
      color: #1f2937 !important;
      padding: 12px 24px;
      border-radius: 8px;
      text-decoration: none;
      font-weight: 500;
      margin: 10px 5px;
    }
    .footer {
      background-color: #f9fafb;
      padding: 30px 20px;
      text-align: center;
      border-top: 1px solid #e5e7eb;
    }
    .footer-text {
      color: #6b7280;
      font-size: 14px;
      line-height: 1.6;
      margin: 8px 0;
    }
    .footer-links {
      margin: 20px 0;
    }
    .footer-link {
      color: #10b981;
      text-decoration: none;
      margin: 0 10px;
      font-size: 14px;
    }
    .social-icons {
      margin: 20px 0;
    }
    .social-icon {
      display: inline-block;
      width: 36px;
      height: 36px;
      background-color: #10b981;
      border-radius: 50%;
      margin: 0 8px;
      color: #ffffff;
      text-decoration: none;
      line-height: 36px;
      font-size: 18px;
    }
    .divider {
      height: 1px;
      background-color: #e5e7eb;
      margin: 30px 0;
    }
    @media only screen and (max-width: 600px) {
      .content {
        padding: 30px 20px;
      }
      .otp-code {
        font-size: 28px;
        letter-spacing: 6px;
      }
      .amount {
        font-size: 28px;
      }
    }
  </style>
</head>
<body>
  <div class="email-wrapper">
    <div class="header">
      <div class="logo">$</div>
      <h1 class="header-title">GreenPay</h1>
    </div>
    ${content}
    <div class="footer">
      <p class="footer-text"><strong>GreenPay</strong></p>
      <p class="footer-text">Send money to Africa safely, quickly, and affordably</p>
      
      <div class="footer-links">
        <a href="https://greenpay.world/help" class="footer-link">Help Center</a>
        <a href="https://greenpay.world/security" class="footer-link">Security</a>
        <a href="https://greenpay.world/contact" class="footer-link">Contact Us</a>
      </div>
      
      <div class="divider"></div>
      
      <p class="footer-text">This email was sent from GreenPay. Please do not reply to this email.</p>
      <p class="footer-text">If you didn't request this email, please contact our support team.</p>
      
      <p class="footer-text" style="margin-top: 20px;">
        \xA9 ${(/* @__PURE__ */ new Date()).getFullYear()} GreenPay. All rights reserved.
      </p>
    </div>
  </div>
</body>
</html>
`;
    emailTemplates = {
      /**
       * OTP Verification Email
       */
      otp: (otpCode, userName) => {
        const content = `
      <div class="content">
        <p class="greeting">Hello${userName ? ` ${userName}` : ""}! \u{1F44B}</p>
        
        <p class="text">
          We received a request to verify your GreenPay account. Use the verification code below to complete the process.
        </p>
        
        <div class="otp-box">
          <p class="otp-code">${otpCode}</p>
          <p class="otp-label">Enter this code to verify your account</p>
        </div>
        
        <div class="info-box">
          <p class="text" style="margin: 0;">
            <strong>\u23F0 This code expires in 10 minutes</strong><br>
            For your security, do not share this code with anyone.
          </p>
        </div>
        
        <p class="text">
          If you didn't request this code, please ignore this email or contact our support team if you have concerns.
        </p>
      </div>
    `;
        return baseTemplate(content);
      },
      /**
       * Password Reset Email
       */
      passwordReset: (resetCode, userName) => {
        const content = `
      <div class="content">
        <p class="greeting">Hello${userName ? ` ${userName}` : ""}! \u{1F510}</p>
        
        <p class="text">
          We received a request to reset your GreenPay account password. Use the code below to create a new password.
        </p>
        
        <div class="otp-box">
          <p class="otp-code">${resetCode}</p>
          <p class="otp-label">Password Reset Code</p>
        </div>
        
        <div class="warning-box">
          <p class="text" style="margin: 0;">
            <strong>\u26A0\uFE0F Security Alert</strong><br>
            This code expires in 10 minutes. If you didn't request a password reset, please secure your account immediately by contacting our support team.
          </p>
        </div>
        
        <p class="text">
          After entering this code, you'll be able to create a new secure password for your account.
        </p>
      </div>
    `;
        return baseTemplate(content);
      },
      /**
       * Welcome Email
       */
      welcome: (userName) => {
        const content = `
      <div class="content">
        <p class="greeting">Welcome to GreenPay, ${userName}! \u{1F389}</p>
        
        <p class="text">
          We're thrilled to have you join our community! GreenPay makes sending money to Africa simple, secure, and affordable.
        </p>
        
        <div class="info-box">
          <p class="text" style="margin: 0;">
            <strong>\u{1F680} Get Started:</strong><br>
            \u2022 Complete your profile verification<br>
            \u2022 Add funds to your account<br>
            \u2022 Send money to friends and family<br>
            \u2022 Get your virtual card for online payments
          </p>
        </div>
        
        <div style="text-align: center;">
          <a href="https://greenpay.world/dashboard" class="button">Go to Dashboard</a>
        </div>
        
        <p class="text">
          Need help? Our support team is available 24/7 to assist you with any questions.
        </p>
        
        <div style="text-align: center; margin-top: 30px;">
          <a href="https://greenpay.world/help" class="button-secondary">Visit Help Center</a>
          <a href="https://greenpay.world/contact" class="button-secondary">Contact Support</a>
        </div>
      </div>
    `;
        return baseTemplate(content);
      },
      /**
       * Fund Receipt Email
       */
      fundReceipt: (amount, currency, sender, userName) => {
        const content = `
      <div class="content">
        <p class="greeting">Hello${userName ? ` ${userName}` : ""}! \u{1F4B0}</p>
        
        <p class="text">
          Great news! You've received money in your GreenPay account.
        </p>
        
        <div class="amount">${currency} ${amount}</div>
        
        <div class="transaction-box">
          <div class="transaction-row">
            <span class="transaction-label">From</span>
            <span class="transaction-value">${sender}</span>
          </div>
          <div class="transaction-row">
            <span class="transaction-label">Amount</span>
            <span class="transaction-value">${currency} ${amount}</span>
          </div>
          <div class="transaction-row">
            <span class="transaction-label">Status</span>
            <span class="transaction-value" style="color: #10b981;">\u2713 Completed</span>
          </div>
          <div class="transaction-row">
            <span class="transaction-label">Date</span>
            <span class="transaction-value">${(/* @__PURE__ */ new Date()).toLocaleDateString("en-US", {
          year: "numeric",
          month: "long",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit"
        })}</span>
          </div>
        </div>
        
        <div style="text-align: center;">
          <a href="https://greenpay.world/transactions" class="button">View Transaction Details</a>
        </div>
        
        <p class="text">
          Your new balance is now available in your account and ready to use.
        </p>
      </div>
    `;
        return baseTemplate(content);
      },
      /**
       * Transaction Notification Email
       */
      transaction: (type, amount, currency, status, transactionId, userName) => {
        const action = type === "withdraw" ? "Withdrawal" : type === "send" ? "Transfer" : "Transaction";
        const statusColor = status === "completed" ? "#10b981" : status === "pending" ? "#f59e0b" : "#ef4444";
        const statusIcon = status === "completed" ? "\u2713" : status === "pending" ? "\u23F3" : "\u2717";
        const content = `
      <div class="content">
        <p class="greeting">Hello${userName ? ` ${userName}` : ""}!</p>
        
        <p class="text">
          Your ${action.toLowerCase()} has been ${status}.
        </p>
        
        <div class="amount">${currency} ${amount}</div>
        
        <div class="transaction-box">
          <div class="transaction-row">
            <span class="transaction-label">Type</span>
            <span class="transaction-value">${action}</span>
          </div>
          <div class="transaction-row">
            <span class="transaction-label">Amount</span>
            <span class="transaction-value">${currency} ${amount}</span>
          </div>
          <div class="transaction-row">
            <span class="transaction-label">Status</span>
            <span class="transaction-value" style="color: ${statusColor};">${statusIcon} ${status.charAt(0).toUpperCase() + status.slice(1)}</span>
          </div>
          <div class="transaction-row">
            <span class="transaction-label">Transaction ID</span>
            <span class="transaction-value">${transactionId}</span>
          </div>
          <div class="transaction-row">
            <span class="transaction-label">Date</span>
            <span class="transaction-value">${(/* @__PURE__ */ new Date()).toLocaleDateString("en-US", {
          year: "numeric",
          month: "long",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit"
        })}</span>
          </div>
        </div>
        
        <div style="text-align: center;">
          <a href="https://greenpay.world/transactions" class="button">View All Transactions</a>
        </div>
      </div>
    `;
        return baseTemplate(content);
      },
      /**
       * Login Alert Email
       */
      loginAlert: (location, ip, timestamp2, userName) => {
        const content = `
      <div class="content">
        <p class="greeting">Hello${userName ? ` ${userName}` : ""}! \u{1F510}</p>
        
        <p class="text">
          We detected a new login to your GreenPay account. If this was you, you can safely ignore this email.
        </p>
        
        <div class="transaction-box">
          <div class="transaction-row">
            <span class="transaction-label">Location</span>
            <span class="transaction-value">${location}</span>
          </div>
          <div class="transaction-row">
            <span class="transaction-label">IP Address</span>
            <span class="transaction-value">${ip}</span>
          </div>
          <div class="transaction-row">
            <span class="transaction-label">Time</span>
            <span class="transaction-value">${timestamp2}</span>
          </div>
        </div>
        
        <div class="warning-box">
          <p class="text" style="margin: 0;">
            <strong>\u26A0\uFE0F Was this you?</strong><br>
            If you don't recognize this login activity, please secure your account immediately by changing your password and enabling two-factor authentication.
          </p>
        </div>
        
        <div style="text-align: center;">
          <a href="https://greenpay.world/settings/security" class="button">Secure My Account</a>
        </div>
        
        <p class="text">
          For your security, we recommend using strong, unique passwords and enabling two-factor authentication.
        </p>
      </div>
    `;
        return baseTemplate(content);
      },
      /**
       * KYC Verified Email
       */
      kycVerified: (userName) => {
        const content = `
      <div class="content">
        <p class="greeting">Congratulations, ${userName}! \u2705</p>
        
        <p class="text">
          Your GreenPay account has been successfully verified! You now have full access to all our features.
        </p>
        
        <div class="info-box">
          <p class="text" style="margin: 0;">
            <strong>\u{1F389} What's now available:</strong><br>
            \u2022 Send money internationally without limits<br>
            \u2022 Request and receive payments<br>
            \u2022 Order virtual cards for online shopping<br>
            \u2022 Access premium features and lower fees
          </p>
        </div>
        
        <div style="text-align: center;">
          <a href="https://greenpay.world/dashboard" class="button">Explore Your Account</a>
        </div>
        
        <p class="text">
          Thank you for completing the verification process. We're excited to help you with all your money transfer needs!
        </p>
      </div>
    `;
        return baseTemplate(content);
      },
      /**
       * Card Activation Email
       */
      cardActivation: (cardLastFour, userName) => {
        const content = `
      <div class="content">
        <p class="greeting">Hello${userName ? ` ${userName}` : ""}! \u{1F4B3}</p>
        
        <p class="text">
          Great news! Your GreenPay virtual card is now active and ready to use.
        </p>
        
        <div class="transaction-box">
          <div style="text-align: center; padding: 20px 0;">
            <div style="font-size: 48px; margin-bottom: 12px;">\u{1F4B3}</div>
            <p class="transaction-value" style="font-size: 18px;">Card ending in \u2022\u2022\u2022\u2022 ${cardLastFour}</p>
            <p class="transaction-label">Status: <span style="color: #10b981; font-weight: 600;">Active</span></p>
          </div>
        </div>
        
        <div class="info-box">
          <p class="text" style="margin: 0;">
            <strong>\u{1F6E1}\uFE0F Security Tips:</strong><br>
            \u2022 Never share your card details with anyone<br>
            \u2022 Enable transaction notifications<br>
            \u2022 Set spending limits for extra security<br>
            \u2022 Review transactions regularly
          </p>
        </div>
        
        <div style="text-align: center;">
          <a href="https://greenpay.world/cards" class="button">View Card Details</a>
        </div>
        
        <p class="text">
          Your card can be used for online purchases anywhere that accepts virtual cards. Happy shopping!
        </p>
      </div>
    `;
        return baseTemplate(content);
      },
      /**
       * Test Email
       */
      test: () => {
        const content = `
      <div class="content">
        <p class="greeting">Email Configuration Test \u2705</p>
        
        <p class="text">
          This is a test email to verify that your GreenPay email configuration is working correctly.
        </p>
        
        <div class="info-box">
          <p class="text" style="margin: 0;">
            <strong>\u2713 Success!</strong><br>
            If you're reading this, your SMTP settings are configured correctly and emails are being sent successfully.
          </p>
        </div>
        
        <p class="text">
          Your email service is now ready to send notifications to your users for:
        </p>
        
        <ul class="text">
          <li>OTP verification codes</li>
          <li>Password reset requests</li>
          <li>Transaction notifications</li>
          <li>Login alerts</li>
          <li>Account updates</li>
        </ul>
        
        <p class="text">
          You can close this test email. Everything is working perfectly!
        </p>
      </div>
    `;
        return baseTemplate(content);
      },
      /**
       * Custom Admin Email
       */
      custom: (params) => {
        const formatMessage = (text2) => {
          return text2.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>").replace(/\*(.*?)\*/g, "<em>$1</em>").replace(/\n• /g, "<br>\u2022 ").replace(/\n/g, "<br>");
        };
        const imageSection = params.imageUrl ? `
      <div style="text-align: center; margin: 30px 0;">
        <img src="${params.imageUrl}" alt="Email Image" style="max-width: 100%; height: auto; border-radius: 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
      </div>
    ` : "";
        const linkSection = params.linkText && params.linkUrl ? `
      <div style="text-align: center; margin: 30px 0;">
        <a href="${params.linkUrl}" class="button" style="display: inline-block; background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: #ffffff; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 16px;">
          ${params.linkText}
        </a>
      </div>
    ` : "";
        const content = `
      <div class="content">
        <p class="greeting">Message from GreenPay Team</p>
        
        <p class="text">
          ${formatMessage(params.message)}
        </p>

        ${imageSection}
        ${linkSection}
        
        <div class="info-box">
          <p class="text" style="margin: 0;">
            If you have any questions or need assistance, please don't hesitate to contact our support team.
          </p>
        </div>
      </div>
    `;
        return baseTemplate(content);
      }
    };
  }
});

// server/services/email.ts
var email_exports = {};
__export(email_exports, {
  EmailService: () => EmailService,
  emailService: () => emailService
});
import nodemailer from "nodemailer";
var EmailService, emailService;
var init_email = __esm({
  "server/services/email.ts"() {
    "use strict";
    init_storage();
    init_email_templates();
    EmailService = class {
      transporter = null;
      credentials = null;
      /**
       * Get email credentials from system settings
       */
      async getCredentials() {
        try {
          const settings = await storage.getSystemSettingsByCategory("email");
          const host = settings.find((s) => s.key === "smtp_host")?.value;
          const port = parseInt(settings.find((s) => s.key === "smtp_port")?.value || "465");
          const secure = settings.find((s) => s.key === "smtp_secure")?.value === "true";
          const username = settings.find((s) => s.key === "smtp_username")?.value || "smtp.zoho.com";
          const password = settings.find((s) => s.key === "smtp_password")?.value || "Kitondosch.6639";
          const fromEmail = settings.find((s) => s.key === "from_email")?.value || "support@greenpay.world";
          const fromName = settings.find((s) => s.key === "from_name")?.value || "GreenPay";
          if (!host || !username || !password || !fromEmail) {
            console.warn("Email credentials not fully configured");
            return null;
          }
          return { host, port, secure, username, password, fromEmail, fromName };
        } catch (error) {
          console.error("Error fetching email credentials:", error);
          return null;
        }
      }
      /**
       * Initialize or refresh the SMTP transporter
       */
      async initializeTransporter() {
        try {
          this.credentials = await this.getCredentials();
          if (!this.credentials) {
            return false;
          }
          this.transporter = nodemailer.createTransport({
            host: this.credentials.host,
            port: this.credentials.port,
            secure: this.credentials.secure,
            auth: {
              user: this.credentials.username,
              pass: this.credentials.password
            }
          });
          await this.transporter.verify();
          console.log("\u2705 Email service initialized successfully");
          return true;
        } catch (error) {
          console.error("Email service initialization failed:", error);
          this.transporter = null;
          return false;
        }
      }
      /**
       * Send an email
       */
      async sendEmail(to, subject, html) {
        try {
          if (!this.transporter) {
            const initialized = await this.initializeTransporter();
            if (!initialized || !this.transporter || !this.credentials) {
              console.warn("Email not sent: Service not configured");
              return false;
            }
          }
          if (!this.credentials) {
            this.credentials = await this.getCredentials();
            if (!this.credentials) {
              return false;
            }
          }
          const mailOptions = {
            from: `${this.credentials.fromName} <${this.credentials.fromEmail}>`,
            to,
            subject,
            html
          };
          const info = await this.transporter.sendMail(mailOptions);
          console.log(`\u2705 Email sent successfully to ${to} - MessageId: ${info.messageId}`);
          return true;
        } catch (error) {
          if (error.code === "EAUTH" || error.responseCode === 535) {
            console.log("Email auth failed, reinitializing transporter...");
            const initialized = await this.initializeTransporter();
            if (initialized && this.transporter) {
              try {
                const mailOptions = {
                  from: `${this.credentials?.fromName} <${this.credentials?.fromEmail}>`,
                  to,
                  subject,
                  html
                };
                await this.transporter.sendMail(mailOptions);
                console.log(`\u2705 Email sent successfully to ${to} (after reinit)`);
                return true;
              } catch (retryError) {
                console.error("Email sending error after reinit:", retryError);
                return false;
              }
            }
          }
          console.error("Email sending error:", error);
          return false;
        }
      }
      /**
       * Send OTP verification code
       */
      async sendOTP(email, otpCode, userName) {
        const subject = "Your GreenPay Verification Code";
        const html = emailTemplates.otp(otpCode, userName);
        return this.sendEmail(email, subject, html);
      }
      /**
       * Send password reset code
       */
      async sendPasswordReset(email, resetCode, userName) {
        const subject = "Reset Your GreenPay Password";
        const html = emailTemplates.passwordReset(resetCode, userName);
        return this.sendEmail(email, subject, html);
      }
      /**
       * Send welcome email
       */
      async sendWelcome(email, userName) {
        const subject = "Welcome to GreenPay! \u{1F389}";
        const html = emailTemplates.welcome(userName);
        return this.sendEmail(email, subject, html);
      }
      /**
       * Send fund receipt notification
       */
      async sendFundReceipt(email, amount, currency, sender, userName) {
        const subject = `You've Received ${currency} ${amount}`;
        const html = emailTemplates.fundReceipt(amount, currency, sender, userName);
        return this.sendEmail(email, subject, html);
      }
      /**
       * Send transaction notification
       */
      async sendTransactionNotification(email, type, amount, currency, status, transactionId, userName) {
        const action = type === "withdraw" ? "Withdrawal" : type === "send" ? "Transfer" : "Transaction";
        const subject = `${action} ${status === "completed" ? "Completed" : "Update"}: ${currency} ${amount}`;
        const html = emailTemplates.transaction(type, amount, currency, status, transactionId, userName);
        return this.sendEmail(email, subject, html);
      }
      /**
       * Send login alert
       */
      async sendLoginAlert(email, location, ip, timestamp2, userName) {
        const subject = "\u{1F510} New Login to Your GreenPay Account";
        const html = emailTemplates.loginAlert(location, ip, timestamp2, userName);
        return this.sendEmail(email, subject, html);
      }
      /**
       * Send KYC verified notification
       */
      async sendKYCVerified(email, userName) {
        const subject = "\u2705 Your Account is Now Verified!";
        const html = emailTemplates.kycVerified(userName);
        return this.sendEmail(email, subject, html);
      }
      /**
       * Send card activation notification
       */
      async sendCardActivation(email, cardLastFour, userName) {
        const subject = "\u{1F4B3} Your Virtual Card is Active!";
        const html = emailTemplates.cardActivation(cardLastFour, userName);
        return this.sendEmail(email, subject, html);
      }
      /**
       * Send test email (for admin configuration testing)
       */
      async sendTestEmail(email) {
        const subject = "Test Email from GreenPay";
        const html = emailTemplates.test();
        return this.sendEmail(email, subject, html);
      }
      /**
       * Verify email configuration
       */
      async verifyConfiguration() {
        return await this.initializeTransporter();
      }
    };
    emailService = new EmailService();
  }
});

// server/services/whatsapp.ts
import fetch6 from "node-fetch";
var WhatsAppService, whatsappService;
var init_whatsapp = __esm({
  "server/services/whatsapp.ts"() {
    "use strict";
    WhatsAppService = class {
      accessToken;
      phoneNumberId;
      apiVersion = "v18.0";
      graphApiUrl = "https://graph.instagram.com";
      constructor() {
        this.accessToken = process.env.WHATSAPP_ACCESS_TOKEN;
        this.phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
      }
      checkCredentials() {
        return !!(this.accessToken && this.phoneNumberId);
      }
      /**
       * Format phone number to international format (without +)
       * WhatsApp API requires: 1XXXXXXXXXX (no + prefix)
       */
      formatPhoneNumber(phone) {
        let cleaned = phone.replace(/[\s-()]/g, "");
        if (cleaned.startsWith("+")) {
          cleaned = cleaned.substring(1);
        }
        if (cleaned.startsWith("00")) {
          cleaned = cleaned.substring(2);
        }
        return cleaned;
      }
      /**
       * Send text message via WhatsApp Business API
       */
      async sendTextMessage(phoneNumber, message) {
        if (!this.checkCredentials()) {
          console.warn("WhatsApp credentials not configured - message not sent");
          return false;
        }
        try {
          const formattedPhone = this.formatPhoneNumber(phoneNumber);
          const url = `${this.graphApiUrl}/${this.apiVersion}/${this.phoneNumberId}/messages`;
          const payload = {
            messaging_product: "whatsapp",
            to: formattedPhone,
            type: "text",
            text: {
              body: message
            }
          };
          const response = await fetch6(url, {
            method: "POST",
            headers: {
              "Authorization": `Bearer ${this.accessToken}`,
              "Content-Type": "application/json"
            },
            body: JSON.stringify(payload)
          });
          const responseData = await response.json();
          if (response.ok && responseData.messages) {
            console.log(`\u2713 WhatsApp text message sent to ${phoneNumber}`);
            return true;
          } else {
            const errorMsg = responseData.error?.message || "Unknown error";
            console.error(`\u2717 WhatsApp message failed: ${errorMsg}`);
            return false;
          }
        } catch (error) {
          console.error("WhatsApp text message error:", error);
          return false;
        }
      }
      /**
       * Send OTP via template message
       * Requires template to be created in WhatsApp Business Manager first
       */
      async sendOTP(phoneNumber, otpCode) {
        if (!this.checkCredentials()) {
          console.warn("WhatsApp credentials not configured - OTP not sent");
          return false;
        }
        try {
          const formattedPhone = this.formatPhoneNumber(phoneNumber);
          const url = `${this.graphApiUrl}/${this.apiVersion}/${this.phoneNumberId}/messages`;
          const payload = {
            messaging_product: "whatsapp",
            to: formattedPhone,
            type: "template",
            template: {
              name: "otp_verification",
              language: {
                code: "en"
              },
              components: [
                {
                  type: "body",
                  parameters: [
                    {
                      type: "text",
                      text: otpCode
                    }
                  ]
                }
              ]
            }
          };
          const response = await fetch6(url, {
            method: "POST",
            headers: {
              "Authorization": `Bearer ${this.accessToken}`,
              "Content-Type": "application/json"
            },
            body: JSON.stringify(payload)
          });
          const responseData = await response.json();
          if (response.ok && responseData.messages) {
            console.log(`\u2713 WhatsApp OTP sent to ${phoneNumber}`);
            return true;
          } else {
            const errorMsg = responseData.error?.message || "Unknown error";
            console.error(`\u2717 WhatsApp OTP failed: ${errorMsg}`);
            return false;
          }
        } catch (error) {
          console.error("WhatsApp OTP error:", error);
          return false;
        }
      }
      /**
       * Check if WhatsApp is properly configured
       */
      isConfigured() {
        return this.checkCredentials();
      }
      /**
       * Generate 6-digit OTP code
       */
      generateOTP() {
        return Math.floor(1e5 + Math.random() * 9e5).toString();
      }
    };
    whatsappService = new WhatsAppService();
  }
});

// server/services/messaging.ts
var messaging_exports = {};
__export(messaging_exports, {
  MessagingService: () => MessagingService,
  messagingService: () => messagingService
});
import fetch7 from "node-fetch";
var MessagingService, messagingService;
var init_messaging = __esm({
  "server/services/messaging.ts"() {
    "use strict";
    init_storage();
    init_email();
    init_whatsapp();
    MessagingService = class {
      SMS_URL = "https://talkntalk.africa/api/v1/sms/send";
      MAX_MESSAGE_LENGTH = 160;
      MESSAGE_PREFIX = "[Greenpay] ";
      /**
       * Get messaging credentials from system settings
       */
      async getCredentials() {
        try {
          const settings = await storage.getSystemSettingsByCategory("messaging");
          const apiKey = settings.find((s) => s.key === "api_key")?.value;
          const accountEmail = settings.find((s) => s.key === "account_email")?.value;
          const senderId = settings.find((s) => s.key === "sender_id")?.value;
          if (!apiKey || !accountEmail || !senderId) {
            console.warn("SMS messaging credentials not fully configured");
            return null;
          }
          return { apiKey, accountEmail, senderId };
        } catch (error) {
          console.error("Error fetching messaging credentials:", error);
          return null;
        }
      }
      /**
       * Format phone number to Kenya format (+254XXXXXXXXX)
       * Handles: +254xxx, 00254xxx, 0xxx, 254xxx, 7xxx, 1xxx
       * Always returns phone with + prefix for database consistency
       */
      formatPhoneNumber(phone) {
        let cleaned = phone.replace(/[\s-()]/g, "");
        if (cleaned.startsWith("00")) {
          cleaned = cleaned.substring(2);
        }
        if (cleaned.startsWith("+")) {
          cleaned = cleaned.substring(1);
        }
        if (cleaned.startsWith("254")) {
          return "+" + cleaned;
        } else if (cleaned.startsWith("0")) {
          return "+254" + cleaned.substring(1);
        } else if (cleaned.length === 9 && (cleaned.startsWith("7") || cleaned.startsWith("1"))) {
          return "+254" + cleaned;
        }
        return "+" + cleaned;
      }
      /**
       * Truncate message to fit within character limit (including prefix)
       */
      formatMessage(message) {
        const fullMessage = this.MESSAGE_PREFIX + message;
        if (fullMessage.length > this.MAX_MESSAGE_LENGTH) {
          const availableLength = this.MAX_MESSAGE_LENGTH - this.MESSAGE_PREFIX.length - 3;
          return this.MESSAGE_PREFIX + message.substring(0, availableLength) + "...";
        }
        return fullMessage;
      }
      /**
       * Send SMS message
       */
      async sendSMS(phone, message, credentials) {
        try {
          const formattedPhone = this.formatPhoneNumber(phone);
          const formattedMessage = this.formatMessage(message);
          const response = await fetch7(this.SMS_URL, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "X-API-Key": credentials.apiKey,
              "X-Account-Email": credentials.accountEmail
            },
            body: JSON.stringify({
              sender_id: credentials.senderId,
              recipient: formattedPhone,
              message: formattedMessage
            })
          });
          const result = await response.json();
          if (result.status_code === 200) {
            console.log(`SMS sent successfully to ${formattedPhone}`);
            return true;
          } else {
            console.error(`SMS send failed: ${result.message}`);
            return false;
          }
        } catch (error) {
          console.error("SMS sending error:", error);
          return false;
        }
      }
      /**
       * Send WhatsApp message via Meta WhatsApp Business API
       */
      async sendWhatsApp(phone, message) {
        try {
          if (!whatsappService.isConfigured()) {
            console.warn("WhatsApp Business API not configured");
            return false;
          }
          const formattedMessage = this.formatMessage(message);
          return await whatsappService.sendTextMessage(phone, formattedMessage);
        } catch (error) {
          console.error("WhatsApp sending error:", error);
          return false;
        }
      }
      /**
       * Send message concurrently via SMS and WhatsApp
       */
      async sendMessage(phone, message) {
        const credentials = await this.getCredentials();
        let smsResult = false;
        let whatsappResult = false;
        if (credentials) {
          smsResult = await this.sendSMS(phone, message, credentials);
        } else {
          console.warn("SMS credentials not configured, skipping SMS");
        }
        whatsappResult = await this.sendWhatsApp(phone, message);
        return { sms: smsResult, whatsapp: whatsappResult };
      }
      /**
       * Send message to all channels (SMS, WhatsApp, and Email)
       */
      async sendMultiChannelMessage(phone, email, message) {
        const credentials = await this.getCredentials();
        const results = {
          sms: false,
          whatsapp: false,
          email: false
        };
        if (credentials) {
          results.sms = await this.sendSMS(phone, message, credentials);
        } else {
          console.warn("SMS credentials not configured, skipping SMS");
        }
        results.whatsapp = await this.sendWhatsApp(phone, message);
        if (email) {
          console.log("Email will be sent via specialized emailService methods");
          results.email = true;
        }
        return results;
      }
      /**
       * Send OTP verification code via SMS, WhatsApp, and Email
       */
      async sendOTP(phone, otpCode, email, userName) {
        const message = `Your verification code is ${otpCode}. Valid for 10 minutes.`;
        const mobileResult = await this.sendMessage(phone, message);
        let emailResult = false;
        if (email) {
          emailResult = await emailService.sendOTP(email, otpCode, userName);
        }
        return {
          sms: mobileResult.sms,
          whatsapp: mobileResult.whatsapp,
          email: emailResult
        };
      }
      /**
       * Send password reset code via SMS, WhatsApp, and Email
       */
      async sendPasswordReset(phone, resetCode, email, userName) {
        const message = `Your password reset code is ${resetCode}. Valid for 10 minutes.`;
        const mobileResult = await this.sendMessage(phone, message);
        let emailResult = false;
        if (email) {
          emailResult = await emailService.sendPasswordReset(email, resetCode, userName);
        }
        return {
          sms: mobileResult.sms,
          whatsapp: mobileResult.whatsapp,
          email: emailResult
        };
      }
      /**
       * Send fund receipt notification via SMS, WhatsApp, and Email
       */
      async sendFundReceipt(phone, amount, currency, sender, email, userName) {
        const message = `You received ${currency} ${amount} from ${sender}. Check your account.`;
        const mobileResult = await this.sendMessage(phone, message);
        let emailResult = false;
        if (email) {
          emailResult = await emailService.sendFundReceipt(email, amount, currency, sender, userName);
        }
        return {
          sms: mobileResult.sms,
          whatsapp: mobileResult.whatsapp,
          email: emailResult
        };
      }
      /**
       * Send login alert with location and IP via SMS, WhatsApp, and Email
       */
      async sendLoginAlert(phone, location, ip, email, userName) {
        const message = `New login from ${location} (IP: ${ip}). Not you? Contact support.`;
        const timestamp2 = (/* @__PURE__ */ new Date()).toLocaleString("en-US", {
          dateStyle: "long",
          timeStyle: "short"
        });
        const mobileResult = await this.sendMessage(phone, message);
        let emailResult = false;
        if (email) {
          emailResult = await emailService.sendLoginAlert(email, location, ip, timestamp2, userName);
        }
        return {
          sms: mobileResult.sms,
          whatsapp: mobileResult.whatsapp,
          email: emailResult
        };
      }
      /**
       * Send KYC verified notification via SMS, WhatsApp, and Email
       */
      async sendKYCVerified(phone, email, userName) {
        const message = `Your account is now verified! You can now access all features.`;
        const mobileResult = await this.sendMessage(phone, message);
        let emailResult = false;
        if (email && userName) {
          emailResult = await emailService.sendKYCVerified(email, userName);
        }
        return {
          sms: mobileResult.sms,
          whatsapp: mobileResult.whatsapp,
          email: emailResult
        };
      }
      /**
       * Send card activation notification via SMS, WhatsApp, and Email
       */
      async sendCardActivation(phone, cardLastFour, email, userName) {
        const message = `Your virtual card ending in ${cardLastFour} is now active!`;
        const mobileResult = await this.sendMessage(phone, message);
        let emailResult = false;
        if (email) {
          emailResult = await emailService.sendCardActivation(email, cardLastFour, userName);
        }
        return {
          sms: mobileResult.sms,
          whatsapp: mobileResult.whatsapp,
          email: emailResult
        };
      }
      /**
       * Send transaction notification via SMS, WhatsApp, and Email
       */
      async sendTransactionNotification(phone, type, amount, currency, status, transactionId, email, userName) {
        const action = type === "withdraw" ? "Withdrawal" : type === "send" ? "Transfer" : "Transaction";
        const message = `${action} of ${currency} ${amount} ${status}. Check your account for details.`;
        const mobileResult = await this.sendMessage(phone, message);
        let emailResult = false;
        if (email && transactionId) {
          emailResult = await emailService.sendTransactionNotification(
            email,
            type,
            amount,
            currency,
            status,
            transactionId,
            userName
          );
        }
        return {
          sms: mobileResult.sms,
          whatsapp: mobileResult.whatsapp,
          email: emailResult
        };
      }
      /**
       * Generate 6-digit OTP code
       */
      generateOTP() {
        return Math.floor(1e5 + Math.random() * 9e5).toString();
      }
    };
    messagingService = new MessagingService();
  }
});

// server/index.ts
import express2 from "express";
import session from "express-session";
import ConnectPgSimple from "connect-pg-simple";
import { Pool as Pool2 } from "pg";

// server/routes.ts
init_storage();
init_schema();
init_exchange_rate();
import { createServer } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { z } from "zod";
import bcrypt2 from "bcrypt";
import multer from "multer";
import * as speakeasy2 from "speakeasy";
import * as QRCode2 from "qrcode";

// server/services/payhero.ts
init_storage();
import fetch3 from "node-fetch";
var PayHeroService = class {
  username;
  password;
  channelId;
  baseUrl = "https://backend.payhero.co.ke/api/v2";
  constructor() {
    const username = process.env.PAYHERO_USERNAME;
    const password = process.env.PAYHERO_PASSWORD;
    const channelId = process.env.PAYHERO_CHANNEL_ID;
    this.username = username;
    this.password = password;
    this.channelId = channelId ? parseInt(channelId) : 3407;
    this.loadCredentialsFromDatabase();
  }
  /**
   * Load credentials from database settings
   */
  async loadCredentialsFromDatabase() {
    try {
      const settings = await storage.getSystemSettingsByCategory("payhero");
      const username = settings.find((s) => s.key === "username")?.value;
      const password = settings.find((s) => s.key === "password")?.value;
      const channelId = settings.find((s) => s.key === "channel_id")?.value;
      if (username) this.username = this.parseValue(username);
      if (password) this.password = this.parseValue(password);
      if (channelId) this.channelId = parseInt(this.parseValue(channelId));
      if (this.hasCredentials()) {
        console.log("PayHero credentials loaded from database:", {
          hasUsername: !!this.username,
          hasPassword: !!this.password,
          channelId: this.channelId
        });
      } else {
        console.warn("PayHero credentials not fully configured - payment processing may not be available");
      }
    } catch (error) {
      console.error("Error loading PayHero credentials from database:", error);
      console.warn("Using environment variable credentials as fallback");
    }
  }
  /**
   * Parse database value that might have extra quotes from JSON
   */
  parseValue(value) {
    if (!value) return "";
    let parsed = String(value).trim();
    while (parsed.startsWith('"') && parsed.endsWith('"')) {
      parsed = parsed.slice(1, -1);
    }
    return parsed;
  }
  hasCredentials() {
    return !!(this.username && this.password && this.channelId);
  }
  /**
   * Get credentials (fetches from database if needed)
   */
  async getCredentials() {
    await this.loadCredentialsFromDatabase();
    return {
      username: this.username,
      password: this.password,
      channelId: this.channelId
    };
  }
  /**
   * Update PayHero settings (for admin configuration)
   */
  updateSettings(channelId, username, password) {
    if (channelId !== void 0) this.channelId = channelId;
    if (username !== void 0) this.username = username;
    if (password !== void 0) this.password = password;
  }
  /**
   * Get current channel ID
   */
  getChannelId() {
    return this.channelId;
  }
  /**
   * Generate a unique reference for PayHero transactions
   */
  generateReference() {
    const timestamp2 = Date.now().toString();
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    return `GPY${timestamp2.slice(-8)}${random}`;
  }
  /**
   * Initiate M-Pesa STK Push payment
   */
  async initiateMpesaPayment(amount, phoneNumber, externalReference, customerName, callbackUrl) {
    try {
      await this.getCredentials();
      if (!this.hasCredentials()) {
        console.error("PayHero credentials not available");
        return {
          success: false,
          status: "CREDENTIALS_MISSING",
          reference: "",
          CheckoutRequestID: ""
        };
      }
      const url = `${this.baseUrl}/payments`;
      let cleanPhone = phoneNumber.replace(/\+/g, "").replace(/\s/g, "").replace(/-/g, "");
      if (cleanPhone.startsWith("254")) {
        cleanPhone = "0" + cleanPhone.substring(3);
      } else if (cleanPhone.startsWith("7") || cleanPhone.startsWith("1")) {
        cleanPhone = "0" + cleanPhone;
      } else if (!cleanPhone.startsWith("0")) {
        console.error("Invalid phone number format for PayHero:", phoneNumber);
        return {
          success: false,
          status: "INVALID_PHONE_FORMAT",
          reference: "",
          CheckoutRequestID: ""
        };
      }
      if (cleanPhone.length !== 10 || !cleanPhone.match(/^0[17]\d{8}$/)) {
        console.error("PayHero phone validation failed:", {
          original: phoneNumber,
          formatted: cleanPhone,
          length: cleanPhone.length,
          expected: "10 digits starting with 07 or 01"
        });
        return {
          success: false,
          status: "INVALID_PHONE_NUMBER",
          reference: "",
          CheckoutRequestID: ""
        };
      }
      const payload = {
        amount: Math.round(amount),
        // PayHero expects integer amounts
        phone_number: cleanPhone,
        channel_id: this.channelId,
        provider: "m-pesa",
        external_reference: externalReference,
        customer_name: customerName,
        callback_url: callbackUrl
      };
      const credentials = Buffer.from(`${this.username}:${this.password}`).toString("base64");
      const authHeader = `Basic ${credentials}`;
      console.log("PayHero payment request:", {
        amount: payload.amount,
        phone: payload.phone_number,
        reference: externalReference,
        channel_id: payload.channel_id,
        url
      });
      const response = await fetch3(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": authHeader
        },
        body: JSON.stringify(payload)
      });
      const data = await response.json();
      console.log("PayHero HTTP response:", {
        httpStatus: response.status,
        success: data.success,
        status: data.status,
        reference: data.reference,
        error: data.error || data.message
      });
      if (!response.ok) {
        console.error("PayHero HTTP error:", response.status, data);
        return {
          success: false,
          status: `HTTP_${response.status}`,
          reference: "",
          CheckoutRequestID: ""
        };
      }
      return {
        success: data.success || false,
        status: data.status || "FAILED",
        reference: data.reference || "",
        CheckoutRequestID: data.CheckoutRequestID || ""
      };
    } catch (error) {
      console.error("PayHero payment initiation error:", error);
      return {
        success: false,
        status: "ERROR",
        reference: "",
        CheckoutRequestID: ""
      };
    }
  }
  /**
   * Check transaction status using PayHero's transaction-status endpoint
   */
  async checkTransactionStatus(reference) {
    try {
      const url = `${this.baseUrl}/transaction-status?reference=${reference}`;
      const credentials = Buffer.from(`${this.username}:${this.password}`).toString("base64");
      const authHeader = `Basic ${credentials}`;
      console.log("Checking PayHero transaction status:", { reference, url });
      const response = await fetch3(url, {
        method: "GET",
        headers: {
          "Authorization": authHeader
        }
      });
      const data = await response.json();
      console.log("PayHero transaction status response:", {
        httpStatus: response.status,
        reference,
        status: data.status,
        success: data.success
      });
      if (!response.ok) {
        console.error("PayHero transaction status HTTP error:", response.status, data);
        return {
          success: false,
          status: "ERROR",
          message: data.message || "Failed to check transaction status"
        };
      }
      return {
        success: true,
        status: data.status || "UNKNOWN",
        data,
        message: data.message
      };
    } catch (error) {
      console.error("PayHero transaction status check error:", error);
      return {
        success: false,
        status: "ERROR",
        message: "Failed to check transaction status"
      };
    }
  }
  /**
   * Process PayHero callback response
   */
  processCallback(callbackData) {
    const { response } = callbackData;
    return {
      success: response.ResultCode === 0 && response.Status === "Success",
      amount: response.Amount,
      reference: response.ExternalReference,
      mpesaReceiptNumber: response.MpesaReceiptNumber,
      status: response.Status
    };
  }
  /**
   * Convert USD to KES (using a fixed rate for now, could be improved with real-time rates)
   */
  async convertUSDtoKES(usdAmount) {
    const exchangeRate = 129;
    return Math.round(usdAmount * exchangeRate);
  }
};
var payHeroService = new PayHeroService();

// server/services/paystack.ts
import fetch4 from "node-fetch";
var PaystackService = class {
  secretKey;
  baseUrl = "https://api.paystack.co";
  isConfigured;
  constructor() {
    const secretKey = process.env.PAYSTACK_SECRET_KEY_KES || process.env.PAYSTACK_SECRET_KEY;
    if (!secretKey) {
      console.warn("Paystack secret key not provided - payment features will be disabled");
      this.isConfigured = false;
      this.secretKey = "";
    } else {
      this.isConfigured = true;
      this.secretKey = secretKey;
    }
  }
  async initializePayment(email, amount, reference, currency = "KES", phoneNumber, callbackUrl) {
    if (!this.isConfigured) {
      return {
        status: false,
        message: "Paystack is not configured. Please add PAYSTACK_SECRET_KEY to environment variables."
      };
    }
    try {
      const url = `${this.baseUrl}/transaction/initialize`;
      const payload = {
        email,
        amount: Math.round(amount * 100),
        // Convert to kobo for USD or cents for KES
        reference,
        currency,
        channels: ["card", "bank", "ussd", "qr", "mobile_money", "bank_transfer"]
      };
      if (callbackUrl) {
        payload.callback_url = callbackUrl;
      }
      if (currency === "KES" && phoneNumber) {
        payload.mobile_money = {
          phone: phoneNumber,
          provider: "mpesa"
        };
      }
      const response = await fetch4(url, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${this.secretKey}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      });
      const data = await response.json();
      return data;
    } catch (error) {
      console.error("Paystack initialization error:", error);
      return {
        status: false,
        message: "Payment initialization failed"
      };
    }
  }
  async verifyPayment(reference) {
    try {
      const url = `${this.baseUrl}/transaction/verify/${reference}`;
      const response = await fetch4(url, {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${this.secretKey}`
        }
      });
      const data = await response.json();
      return data;
    } catch (error) {
      console.error("Paystack verification error:", error);
      return {
        status: false,
        message: "Payment verification failed"
      };
    }
  }
  async createCustomer(email, firstName, lastName, phone) {
    try {
      const url = `${this.baseUrl}/customer`;
      const payload = {
        email,
        first_name: firstName,
        last_name: lastName,
        phone
      };
      const response = await fetch4(url, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${this.secretKey}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      });
      const data = await response.json();
      return data;
    } catch (error) {
      console.error("Paystack customer creation error:", error);
      return {
        status: false,
        message: "Customer creation failed"
      };
    }
  }
  async convertUSDtoKES(usdAmount) {
    try {
      const { exchangeRateService: exchangeRateService2 } = await Promise.resolve().then(() => (init_exchange_rate(), exchange_rate_exports));
      const rate = await exchangeRateService2.getExchangeRate("USD", "KES");
      return usdAmount * rate;
    } catch (error) {
      console.error("Currency conversion error:", error);
      return usdAmount * 129;
    }
  }
  generateReference() {
    return "GP_" + Date.now().toString() + "_" + Math.random().toString(36).substr(2, 9);
  }
};
var paystackService = new PaystackService();

// server/services/2fa.ts
import speakeasy from "speakeasy";
import QRCode from "qrcode";
var TwoFactorService = class {
  generateSecret(userEmail) {
    const secret = speakeasy.generateSecret({
      name: `GreenPay (${userEmail})`,
      issuer: "GreenPay"
    });
    const backupCodes = this.generateBackupCodes();
    return {
      secret: secret.base32,
      qrCodeUrl: secret.otpauth_url || "",
      backupCodes
    };
  }
  async generateQRCode(secret, userEmail) {
    const otpAuthUrl = speakeasy.otpauthURL({
      secret,
      label: userEmail,
      issuer: "GreenPay",
      encoding: "base32"
    });
    return await QRCode.toDataURL(otpAuthUrl);
  }
  verifyToken(secret, token) {
    return speakeasy.totp.verify({
      secret,
      encoding: "base32",
      token,
      window: 2
      // Allow 60 second window
    });
  }
  generateBackupCodes() {
    const codes = [];
    for (let i = 0; i < 10; i++) {
      codes.push(Math.random().toString(36).substr(2, 8).toUpperCase());
    }
    return codes;
  }
};
var twoFactorService = new TwoFactorService();

// server/services/biometric.ts
var BiometricService = class {
  async generateChallenge(userId) {
    const challenge = Buffer.from(Math.random().toString()).toString("base64url");
    return challenge;
  }
  async verifyBiometric(userId, challenge, response) {
    if (challenge && response) {
      console.log(`Biometric verification attempted for user ${userId}`);
      return true;
    }
    return false;
  }
  async registerBiometric(userId, credential) {
    console.log(`Biometric registration for user ${userId}`);
    return true;
  }
};
var biometricService = new BiometricService();

// server/services/notifications.ts
var NotificationService = class {
  subscriptions = /* @__PURE__ */ new Map();
  async sendNotification(payload) {
    try {
      console.log(`Sending notification to user ${payload.userId}:`, payload);
      const success = Math.random() > 0.1;
      if (success) {
        console.log(`Notification sent successfully to ${payload.userId}`);
        return true;
      } else {
        console.log(`Failed to send notification to ${payload.userId}`);
        return false;
      }
    } catch (error) {
      console.error("Notification sending error:", error);
      return false;
    }
  }
  async registerPushToken(userId, token) {
    try {
      this.subscriptions.set(userId, token);
      console.log(`Push token registered for user ${userId}`);
      return true;
    } catch (error) {
      console.error("Push token registration error:", error);
      return false;
    }
  }
  async sendTransactionNotification(userId, transaction) {
    const payload = {
      title: "Transaction Update",
      body: `Your ${transaction.type} of $${transaction.amount} has been ${transaction.status}`,
      userId,
      type: "transaction",
      metadata: { transactionId: transaction.id }
    };
    await this.sendNotification(payload);
  }
  async sendSecurityNotification(userId, message) {
    const payload = {
      title: "Security Alert",
      body: message,
      userId,
      type: "security"
    };
    await this.sendNotification(payload);
  }
};
var notificationService = new NotificationService();

// server/cloudinaryStorage.ts
import { v2 as cloudinary } from "cloudinary";
import { randomUUID as randomUUID2 } from "crypto";
var ObjectNotFoundError = class _ObjectNotFoundError extends Error {
  constructor() {
    super("Object not found");
    this.name = "ObjectNotFoundError";
    Object.setPrototypeOf(this, _ObjectNotFoundError.prototype);
  }
};
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});
var CloudinaryStorageService = class {
  constructor() {
    if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
      console.warn("\u26A0\uFE0F  Cloudinary credentials not configured. File uploads will fail.");
      console.warn("   Please set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET");
    } else {
      console.log(`\u2705 Cloudinary Storage initialized for: ${process.env.CLOUDINARY_CLOUD_NAME}`);
    }
  }
  /**
   * Upload a file to Cloudinary
   * @param key The storage key/path for the file (e.g., "kyc/uuid.pdf")
   * @param buffer The file buffer to upload
   * @param contentType The MIME type of the file
   * @returns The Cloudinary public URL
   */
  async uploadFile(key, buffer, contentType) {
    try {
      console.log(`\u{1F4E4} Uploading file to Cloudinary: ${key} (${contentType})`);
      const publicId = `greenpay/${key}`;
      return new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          {
            public_id: publicId,
            resource_type: this.getResourceType(contentType)
            // Don't use folder parameter - public_id already contains the path
          },
          (error, result) => {
            if (error) {
              console.error(`\u274C Cloudinary upload error:`, error);
              reject(new Error(`Failed to upload file: ${error.message}`));
            } else if (result) {
              console.log(`\u2705 File uploaded to: ${result.secure_url}`);
              console.log(`   Public ID: ${result.public_id}`);
              resolve(result.secure_url);
            } else {
              reject(new Error("Upload failed: No result returned"));
            }
          }
        );
        uploadStream.end(buffer);
      });
    } catch (error) {
      console.error(`\u274C Error uploading file to Cloudinary:`, error);
      throw new Error(`Failed to upload file: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  }
  /**
   * Download a file from Cloudinary (fetch the image/file)
   * Note: Cloudinary serves files via URLs, so this fetches from the URL
   * @param keyOrUrl The storage key/path (public_id) or full Cloudinary URL
   * @returns The file buffer and metadata
   */
  async downloadFile(keyOrUrl) {
    try {
      console.log(`\u{1F4E5} Downloading file from Cloudinary: ${keyOrUrl}`);
      const url = keyOrUrl.startsWith("http://") || keyOrUrl.startsWith("https://") ? keyOrUrl : this.constructCloudinaryUrl(keyOrUrl);
      console.log(`\u{1F517} Fetching from URL: ${url}`);
      const response = await fetch(url);
      if (!response.ok) {
        if (response.status === 404) {
          throw new ObjectNotFoundError();
        }
        throw new Error(`Failed to download file: ${response.statusText}`);
      }
      const arrayBuffer = await response.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      const contentType = response.headers.get("content-type") || "application/octet-stream";
      console.log(`\u2705 File downloaded successfully: ${keyOrUrl} (${contentType})`);
      return {
        buffer,
        contentType
      };
    } catch (error) {
      if (error instanceof ObjectNotFoundError) {
        throw error;
      }
      console.error(`\u274C Error downloading file from Cloudinary:`, error);
      throw new Error(`Failed to download file: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  }
  /**
   * Delete a file from Cloudinary
   * @param keyOrUrl The storage key (e.g., "kyc/uuid.pdf") or full Cloudinary URL
   */
  async deleteFile(keyOrUrl) {
    try {
      console.log(`\u{1F5D1}\uFE0F Deleting file from Cloudinary: ${keyOrUrl}`);
      const publicId = keyOrUrl.startsWith("http://") || keyOrUrl.startsWith("https://") ? this.extractPublicIdFromUrl(keyOrUrl) : `greenpay/${keyOrUrl}`;
      const resourceType = this.guessResourceTypeFromKey(keyOrUrl);
      console.log(`\u{1F5D1}\uFE0F Deleting public_id: ${publicId} (type: ${resourceType})`);
      await cloudinary.uploader.destroy(publicId, { resource_type: resourceType });
      console.log(`\u2705 File deleted successfully: ${keyOrUrl}`);
    } catch (error) {
      console.error(`\u274C Error deleting file from Cloudinary:`, error);
      throw new Error(`Failed to delete file: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  }
  /**
   * Check if a file exists in Cloudinary
   * @param keyOrUrl The storage key (e.g., "kyc/uuid.pdf") or full Cloudinary URL
   * @returns True if the file exists, false otherwise
   */
  async fileExists(keyOrUrl) {
    try {
      const publicId = keyOrUrl.startsWith("http://") || keyOrUrl.startsWith("https://") ? this.extractPublicIdFromUrl(keyOrUrl) : `greenpay/${keyOrUrl}`;
      const resourceType = this.guessResourceTypeFromKey(keyOrUrl);
      const result = await cloudinary.api.resource(publicId, { resource_type: resourceType });
      return !!result;
    } catch (error) {
      if (error.error?.http_code === 404) {
        return false;
      }
      console.error(`\u274C Error checking file existence:`, error);
      return false;
    }
  }
  /**
   * Generate a unique upload key for a file
   * @param folder The folder to upload to (e.g., 'kyc', 'chat', 'profile')
   * @param filename The original filename
   * @returns A unique storage key
   */
  generateUploadKey(folder, filename) {
    const uuid = randomUUID2();
    const extension = filename.split(".").pop() || "bin";
    return `${folder}/${uuid}.${extension}`;
  }
  /**
   * Upload a KYC document
   * @returns Cloudinary URL
   */
  async uploadKycDocument(buffer, filename, contentType) {
    const key = this.generateUploadKey("kyc", filename);
    console.log(`\u{1F4CB} Uploading KYC document: ${filename} -> ${key}`);
    return await this.uploadFile(key, buffer, contentType);
  }
  /**
   * Upload a chat file
   * @returns Cloudinary URL
   */
  async uploadChatFile(buffer, filename, contentType) {
    const key = this.generateUploadKey("chat", filename);
    console.log(`\u{1F4AC} Uploading chat file: ${filename} -> ${key}`);
    return await this.uploadFile(key, buffer, contentType);
  }
  /**
   * Upload a profile picture
   * @returns Cloudinary URL
   */
  async uploadProfilePicture(buffer, filename, contentType) {
    const key = this.generateUploadKey("profile", filename);
    console.log(`\u{1F464} Uploading profile picture: ${filename} -> ${key}`);
    return await this.uploadFile(key, buffer, contentType);
  }
  /**
   * Download a file and stream it to Express response
   * For Cloudinary, we redirect to the Cloudinary URL for direct download
   */
  async downloadToResponse(keyOrUrl, res) {
    try {
      if (keyOrUrl.startsWith("http://") || keyOrUrl.startsWith("https://")) {
        console.log(`\u{1F517} Redirecting to Cloudinary URL: ${keyOrUrl}`);
        res.redirect(keyOrUrl);
      } else {
        const cloudinaryUrl = this.constructCloudinaryUrl(keyOrUrl);
        console.log(`\u{1F517} Redirecting to constructed URL: ${cloudinaryUrl}`);
        res.redirect(cloudinaryUrl);
      }
    } catch (error) {
      console.error(`\u274C Error streaming file to response:`, error);
      if (!res.headersSent) {
        if (error instanceof ObjectNotFoundError) {
          res.status(404).json({ error: "File not found" });
        } else {
          res.status(500).json({ error: "Error downloading file" });
        }
      }
    }
  }
  /**
   * List all files in a folder (Cloudinary folder)
   */
  async listFiles(prefix) {
    try {
      console.log(`\u{1F4CB} Listing files with prefix: ${prefix}`);
      const result = await cloudinary.api.resources({
        type: "upload",
        prefix,
        max_results: 500
      });
      const files = result.resources.map((resource) => resource.secure_url);
      console.log(`\u2705 Found ${files.length} files`);
      return files;
    } catch (error) {
      console.error(`\u274C Error listing files:`, error);
      return [];
    }
  }
  // Helper methods
  getResourceType(contentType) {
    if (contentType.startsWith("image/")) return "image";
    if (contentType.startsWith("video/")) return "video";
    return "raw";
  }
  getFolderFromKey(key) {
    const parts = key.split("/");
    return parts.length > 1 ? parts[0] : "greenpay";
  }
  getFormatFromContentType(contentType) {
    const match = contentType.match(/\/(\w+)/);
    return match ? match[1] : void 0;
  }
  extractPublicIdFromUrl(url) {
    if (!url.includes("cloudinary.com")) {
      return url;
    }
    try {
      const greenpayIndex = url.indexOf("/greenpay/");
      if (greenpayIndex !== -1) {
        const publicIdWithSlash = url.substring(greenpayIndex + 1);
        const publicId2 = publicIdWithSlash.split("?")[0];
        console.log(`\u{1F4DD} Extracted public_id from URL: ${publicId2}`);
        return publicId2;
      }
      const parts = url.split("/");
      const uploadIndex = parts.indexOf("upload");
      if (uploadIndex === -1) return url;
      let startIndex = uploadIndex + 1;
      while (startIndex < parts.length) {
        const part = parts[startIndex];
        if (part.includes(",") || part.includes("_") || /^v\d+$/.test(part)) {
          startIndex++;
        } else {
          break;
        }
      }
      const publicId = parts.slice(startIndex).join("/").split("?")[0];
      console.log(`\u{1F4DD} Extracted public_id from URL: ${publicId}`);
      return publicId;
    } catch (error) {
      console.error(`\u274C Error extracting public_id from URL:`, error);
      return url;
    }
  }
  guessResourceTypeFromUrl(url) {
    if (url.includes("/image/upload/")) return "image";
    if (url.includes("/video/upload/")) return "video";
    if (url.includes("/raw/upload/")) return "raw";
    return this.guessResourceTypeFromKey(url);
  }
  guessResourceTypeFromKey(keyOrUrl) {
    const extension = keyOrUrl.split(".").pop()?.toLowerCase();
    if (["jpg", "jpeg", "png", "gif", "webp", "svg"].includes(extension || "")) return "image";
    if (["mp4", "mov", "avi", "webm"].includes(extension || "")) return "video";
    return "raw";
  }
  /**
   * Construct a Cloudinary URL from a storage key (public_id)
   * @param key Storage key like "kyc/uuid.pdf" or "profile/uuid.jpg"
   * @returns Full Cloudinary URL
   */
  constructCloudinaryUrl(key) {
    if (!process.env.CLOUDINARY_CLOUD_NAME) {
      throw new Error("CLOUDINARY_CLOUD_NAME not configured");
    }
    const publicId = `greenpay/${key}`;
    const extension = key.split(".").pop()?.toLowerCase();
    let resourceType = "raw";
    if (["jpg", "jpeg", "png", "gif", "webp", "svg"].includes(extension || "")) {
      resourceType = "image";
    } else if (["mp4", "mov", "avi", "webm"].includes(extension || "")) {
      resourceType = "video";
    }
    const url = cloudinary.url(publicId, {
      resource_type: resourceType,
      secure: true
    });
    console.log(`\u{1F517} Constructed Cloudinary URL: ${url} (from key: ${key})`);
    return url;
  }
};
var cloudinaryStorage = new CloudinaryStorageService();

// server/statumService.ts
import fetch5 from "node-fetch";
var StatumService = class {
  consumerKey;
  consumerSecret;
  apiUrl;
  constructor() {
    this.consumerKey = process.env.STATUM_CONSUMER_KEY || "";
    this.consumerSecret = process.env.STATUM_CONSUMER_SECRET || "";
    this.apiUrl = "https://api.statum.co.ke/api/v2/airtime";
    if (this.isConfigured()) {
      console.log("\u2705 Statum Service initialized and configured");
    } else {
      console.warn("\u26A0\uFE0F Statum Service initialized but NOT configured - credentials missing");
    }
  }
  /**
   * Generate Basic Auth header
   */
  getAuthHeader() {
    const credentials = `${this.consumerKey}:${this.consumerSecret}`;
    const base64Credentials = Buffer.from(credentials).toString("base64");
    return `Basic ${base64Credentials}`;
  }
  /**
   * Format phone number to 254 format (remove leading 0, add 254)
   */
  formatPhoneNumber(phone) {
    let cleaned = phone.replace(/\D/g, "");
    if (cleaned.startsWith("0")) {
      cleaned = cleaned.substring(1);
    }
    if (!cleaned.startsWith("254")) {
      cleaned = "254" + cleaned;
    }
    console.log(`\u{1F4DE} Formatted phone number: ${phone} -> ${cleaned}`);
    return cleaned;
  }
  /**
   * Purchase airtime via Statum API
   */
  async purchaseAirtime(phoneNumber, amount) {
    try {
      const formattedPhone = this.formatPhoneNumber(phoneNumber);
      console.log(`\u{1F4F1} Statum API Request: Purchasing KES ${amount} airtime for ${formattedPhone}`);
      console.log(`\u{1F517} Endpoint: ${this.apiUrl}`);
      const requestBody = {
        phone_number: formattedPhone,
        amount
      };
      console.log(`\u{1F4E4} Request body:`, JSON.stringify(requestBody, null, 2));
      const response = await fetch5(this.apiUrl, {
        method: "POST",
        headers: {
          "Authorization": this.getAuthHeader(),
          "Content-Type": "application/json",
          "Accept": "application/json"
        },
        body: JSON.stringify(requestBody)
      });
      console.log(`\u{1F4E5} Statum API Response Status: ${response.status} ${response.statusText}`);
      const responseData = await response.json();
      console.log(`\u{1F4E5} Response data:`, JSON.stringify(responseData, null, 2));
      if (!response.ok) {
        console.error(`\u274C Statum API Error: ${response.status}`, responseData);
        throw new Error(responseData.message || `Statum API request failed with status ${response.status}`);
      }
      console.log(`\u2705 Airtime purchase successful for ${formattedPhone}`);
      return responseData;
    } catch (error) {
      console.error("\u274C Statum API Error:", error);
      if (error instanceof Error) {
        throw new Error(`Airtime purchase failed: ${error.message}`);
      }
      throw new Error("Airtime purchase failed: Unknown error");
    }
  }
  /**
   * Check if Statum credentials are configured
   */
  isConfigured() {
    const configured = !!(this.consumerKey && this.consumerSecret);
    if (!configured) {
      console.warn("\u26A0\uFE0F Statum credentials not configured - airtime purchases will fail");
    }
    return configured;
  }
};
var statumService = new StatumService();

// server/routes.ts
var cloudinaryStorage2 = new CloudinaryStorageService();
var upload = multer({
  storage: multer.memoryStorage(),
  // Store files in memory buffer for cloud upload
  limits: {
    fileSize: 10 * 1024 * 1024
    // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedMimeTypes = [
      "image/jpeg",
      "image/png",
      "image/gif",
      "image/webp",
      "application/pdf",
      "text/plain",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    ];
    if (allowedMimeTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Invalid file type. Only images, PDFs, and documents are allowed."));
    }
  }
});
var loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1)
});
var otpSchema = z.object({
  code: z.string().length(6)
});
var transferSchema = z.object({
  fromUserId: z.string(),
  toUserId: z.string(),
  amount: z.string(),
  currency: z.string(),
  description: z.string().optional()
});
async function registerRoutes(app2) {
  const requireAuth = (req, res, next) => {
    const userId = req.session?.userId;
    if (!userId) {
      return res.status(401).json({
        message: "Authentication required. Please log in."
      });
    }
    next();
  };
  const requireAdminAuth = (req, res, next) => {
    const adminId = req.session?.admin?.id;
    console.log(`[ADMIN AUTH] Session check - hasSession: ${!!req.session}, hasAdminId: ${!!adminId}`);
    if (!adminId) {
      console.log(`[ADMIN AUTH] FAILED - No admin ID in session`);
      return res.status(401).json({
        message: "Authentication required. Please log in as an administrator."
      });
    }
    if (!req.session.admin.role || req.session.admin.role !== "admin") {
      console.log(`[ADMIN AUTH] FAILED - Invalid role:`, req.session.admin.role);
      return res.status(403).json({
        message: "Access denied. Administrator privileges required."
      });
    }
    console.log(`[ADMIN AUTH] SUCCESS - Admin ${req.session.admin.email} authenticated`);
    next();
  };
  app2.get("/health", (_req, res) => {
    res.status(200).json({
      status: "healthy",
      timestamp: (/* @__PURE__ */ new Date()).toISOString(),
      env: process.env.NODE_ENV,
      uptime: process.uptime()
    });
  });
  app2.get("/objects/:objectPath(*)", async (req, res) => {
    try {
      console.log(`\u{1F4E5} File request received: /objects/${req.params.objectPath}`);
      const userId = req.session?.userId;
      const adminId = req.session?.admin?.id;
      console.log(`\u{1F510} Auth check - userId: ${userId}, adminId: ${adminId}`);
      if (!userId && !adminId) {
        console.warn("\u26A0\uFE0F Unauthorized file access attempt:", req.params.objectPath);
        console.log("Session data:", JSON.stringify(req.session, null, 2));
        return res.status(401).json({ message: "Authentication required" });
      }
      let objectKey = req.params.objectPath;
      if (objectKey.startsWith("/")) {
        objectKey = objectKey.substring(1);
      }
      console.log(`\u2705 Authenticated - downloading: ${objectKey} for ${adminId ? "admin" : "user"} ${adminId || userId}`);
      await cloudinaryStorage2.downloadToResponse(objectKey, res);
    } catch (error) {
      if (error instanceof ObjectNotFoundError) {
        console.warn(`\u26A0\uFE0F File not found: ${req.params.objectPath}`);
        return res.status(404).json({ message: "File not found" });
      }
      console.error("\u274C File download error:", error);
      return res.status(500).json({ message: "Failed to serve file" });
    }
  });
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
      console.log("\u2705 Default admin account created");
    }
  } catch (error) {
    console.error("Failed to create default admin:", error);
  }
  app2.post("/api/auth/signup", async (req, res) => {
    try {
      const userData = insertUserSchema.parse(req.body);
      const { messagingService: messagingService2 } = await Promise.resolve().then(() => (init_messaging(), messaging_exports));
      userData.phone = messagingService2.formatPhoneNumber(userData.phone);
      const existingUser = await storage.getUserByEmail(userData.email);
      if (existingUser) {
        return res.status(400).json({ message: "User already exists" });
      }
      const user = await storage.createUser(userData);
      await storage.updateUser(user.id, {
        isPhoneVerified: true,
        isEmailVerified: true
      });
      if (user.phone) {
        const { messagingService: messagingService3 } = await Promise.resolve().then(() => (init_messaging(), messaging_exports));
        const domain = process.env.REPLIT_DOMAINS || "greenpay.app";
        const loginUrl = `https://${domain.split(",")[0]}/login`;
        messagingService3.sendMessage(
          user.phone,
          `Welcome to GreenPay! To send and receive money, you need to: 1) Purchase a virtual card 2) Verify your KYC. Login here: ${loginUrl}`
        ).catch((err) => console.error("Welcome message error:", err));
      }
      const { password, ...userResponse } = user;
      res.json({ user: { ...userResponse, isPhoneVerified: true, isEmailVerified: true } });
    } catch (error) {
      console.error("Signup error:", error);
      res.status(400).json({ message: "Invalid user data" });
    }
  });
  app2.post("/api/auth/login", async (req, res) => {
    try {
      const { email, password } = loginSchema.parse(req.body);
      const user = await storage.getUserByEmail(email);
      if (!user) {
        return res.status(401).json({ message: "Invalid credentials" });
      }
      const isValidPassword = await bcrypt2.compare(password, user.password);
      if (!isValidPassword) {
        return res.status(401).json({ message: "Invalid credentials" });
      }
      const apiKeySetting = await storage.getSystemSetting("messaging", "api_key");
      const emailSetting = await storage.getSystemSetting("messaging", "account_email");
      const senderIdSetting = await storage.getSystemSetting("messaging", "sender_id");
      const whatsappSessionSetting = await storage.getSystemSetting("messaging", "whatsapp_session_id");
      const credentialsConfigured = !!(apiKeySetting?.value && emailSetting?.value && senderIdSetting?.value && whatsappSessionSetting?.value);
      if (!credentialsConfigured) {
        console.warn("Messaging credentials not configured - allowing direct login");
        req.session.regenerate((err) => {
          if (err) {
            console.error("Session regeneration error:", err);
            return res.status(500).json({ message: "Session error" });
          }
          req.session.userId = user.id;
          req.session.user = { id: user.id, email: user.email };
          storage.createLoginHistory({
            userId: user.id,
            ipAddress: req.ip || req.headers["x-forwarded-for"] || req.socket.remoteAddress || "Unknown",
            userAgent: req.headers["user-agent"] || "Unknown",
            deviceType: req.headers["user-agent"]?.includes("Mobile") ? "mobile" : "desktop",
            browser: req.headers["user-agent"]?.split("/")[0] || "Unknown",
            location: req.headers["cf-ipcountry"] || "Unknown",
            status: "success"
          }).catch((err2) => console.error("Login history error:", err2));
          notificationService.sendSecurityNotification(
            user.id,
            "New login detected from your account"
          ).catch((err2) => console.error("Notification error:", err2));
          const { password: _, ...userResponse } = user;
          req.session.save((saveErr) => {
            if (saveErr) {
              console.error("Session save error:", saveErr);
              return res.status(500).json({ message: "Session save error" });
            }
            res.json({ user: userResponse });
          });
        });
        return;
      }
      const { messagingService: messagingService2 } = await Promise.resolve().then(() => (init_messaging(), messaging_exports));
      const otpCode = messagingService2.generateOTP();
      const otpExpiry = new Date(Date.now() + 10 * 60 * 1e3);
      await storage.updateUserOtp(user.id, otpCode, otpExpiry);
      const result = await messagingService2.sendOTP(user.phone, otpCode);
      if (!result.sms && !result.whatsapp) {
        console.error("OTP delivery failed - messaging configured but delivery failed");
        return res.status(500).json({
          message: "Failed to send verification code. Please try again or contact support."
        });
      }
      req.session.regenerate((err) => {
        if (err) {
          console.error("Session regeneration error:", err);
          return res.status(500).json({ message: "Session error" });
        }
        req.session.pendingLoginUserId = user.id;
        req.session.loginIp = req.ip || req.headers["x-forwarded-for"] || req.socket.remoteAddress;
        req.session.loginLocation = req.headers["cf-ipcountry"] || "Unknown Location";
        req.session.save((saveErr) => {
          if (saveErr) {
            console.error("Session save error:", saveErr);
            return res.status(500).json({ message: "Session save error" });
          }
          const sentMethods = [];
          if (result.sms) sentMethods.push("SMS");
          if (result.whatsapp) sentMethods.push("WhatsApp");
          res.json({
            requiresOtp: true,
            userId: user.id,
            phone: user.phone,
            sentVia: sentMethods.join(" and ")
          });
        });
      });
    } catch (error) {
      console.error("Login error:", error);
      res.status(400).json({ message: "Invalid login data" });
    }
  });
  app2.post("/api/auth/verify-otp", async (req, res) => {
    try {
      const { code } = otpSchema.parse(req.body);
      const { userId } = req.body;
      const pendingUserId = req.session.pendingLoginUserId || userId;
      const loginIp = req.session.loginIp || req.ip;
      const loginLocation = req.session.loginLocation || "Unknown Location";
      if (!pendingUserId) {
        return res.status(401).json({ message: "Session expired. Please login again." });
      }
      const isValid = await storage.verifyUserOtp(pendingUserId, code);
      if (isValid) {
        const user = await storage.getUser(pendingUserId);
        if (!user) {
          return res.status(404).json({ message: "User not found" });
        }
        req.session.userId = user.id;
        req.session.user = { id: user.id, email: user.email };
        storage.createLoginHistory({
          userId: user.id,
          ipAddress: loginIp || "Unknown",
          userAgent: req.headers["user-agent"] || "Unknown",
          deviceType: req.headers["user-agent"]?.includes("Mobile") ? "mobile" : "desktop",
          browser: req.headers["user-agent"]?.split("/")[0] || "Unknown",
          location: loginLocation,
          status: "success"
        }).catch((err) => console.error("Login history error:", err));
        delete req.session.pendingLoginUserId;
        delete req.session.loginIp;
        delete req.session.loginLocation;
        const { messagingService: messagingService2 } = await Promise.resolve().then(() => (init_messaging(), messaging_exports));
        messagingService2.sendLoginAlert(user.phone, loginLocation, loginIp || "Unknown IP").catch((err) => console.error("Login alert error:", err));
        notificationService.sendSecurityNotification(
          user.id,
          "New login detected from your account"
        ).catch((err) => console.error("Notification error:", err));
        const { password, ...userResponse } = user;
        req.session.save((saveErr) => {
          if (saveErr) {
            console.error("Session save error:", saveErr);
            return res.status(500).json({ message: "Session save error" });
          }
          res.json({ success: true, user: userResponse });
        });
      } else {
        res.status(400).json({ message: "Invalid or expired OTP code" });
      }
    } catch (error) {
      console.error("OTP verification error:", error);
      res.status(400).json({ message: "Invalid OTP data" });
    }
  });
  app2.post("/api/auth/resend-otp", async (req, res) => {
    try {
      const { userId } = req.body;
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      const { messagingService: messagingService2 } = await Promise.resolve().then(() => (init_messaging(), messaging_exports));
      const otpCode = messagingService2.generateOTP();
      const otpExpiry = new Date(Date.now() + 10 * 60 * 1e3);
      await storage.updateUserOtp(user.id, otpCode, otpExpiry);
      const result = await messagingService2.sendOTP(
        user.phone,
        otpCode,
        user.email || void 0,
        user.fullName || void 0
      );
      if (!result.sms && !result.whatsapp && !result.email) {
        return res.status(500).json({ message: "Failed to resend verification code" });
      }
      const sentMethods = [];
      if (result.sms) sentMethods.push("SMS");
      if (result.whatsapp) sentMethods.push("WhatsApp");
      if (result.email) sentMethods.push("Email");
      res.json({
        message: `New OTP sent via ${sentMethods.join(", ")}`
      });
    } catch (error) {
      console.error("Resend OTP error:", error);
      res.status(500).json({ message: "Failed to resend OTP" });
    }
  });
  app2.post("/api/auth/forgot-password", async (req, res) => {
    try {
      const { phone } = req.body;
      if (!phone) {
        return res.status(400).json({ message: "Phone number is required" });
      }
      const { messagingService: messagingService2 } = await Promise.resolve().then(() => (init_messaging(), messaging_exports));
      const formattedPhone = messagingService2.formatPhoneNumber(phone);
      const user = await storage.getUserByPhone(formattedPhone);
      if (!user) {
        return res.status(404).json({ message: "No account found with this phone number" });
      }
      const resetCode = messagingService2.generateOTP();
      const resetExpiry = new Date(Date.now() + 10 * 60 * 1e3);
      await storage.updateUserOtp(user.id, resetCode, resetExpiry);
      const result = await messagingService2.sendPasswordReset(
        user.phone,
        resetCode,
        user.email || void 0,
        user.fullName || void 0
      );
      if (!result.sms && !result.whatsapp && !result.email) {
        return res.status(500).json({ message: "Failed to send reset code" });
      }
      const sentMethods = [];
      if (result.sms) sentMethods.push("SMS");
      if (result.whatsapp) sentMethods.push("WhatsApp");
      if (result.email) sentMethods.push("Email");
      res.json({
        phone: user.phone,
        sentVia: sentMethods.join(", ")
      });
    } catch (error) {
      console.error("Forgot password error:", error);
      res.status(500).json({ message: "Failed to send reset code" });
    }
  });
  app2.post("/api/auth/reset-password", async (req, res) => {
    try {
      const { phone, code, newPassword } = req.body;
      if (!phone || !code || !newPassword) {
        return res.status(400).json({ message: "Phone, code, and new password are required" });
      }
      if (newPassword.length < 6) {
        return res.status(400).json({ message: "Password must be at least 6 characters" });
      }
      const { messagingService: messagingService2 } = await Promise.resolve().then(() => (init_messaging(), messaging_exports));
      const formattedPhone = messagingService2.formatPhoneNumber(phone);
      const user = await storage.getUserByPhone(formattedPhone);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      const isValid = await storage.verifyUserOtp(user.id, code);
      if (!isValid) {
        return res.status(400).json({ message: "Invalid or expired reset code" });
      }
      const hashedPassword = await bcrypt2.hash(newPassword, 10);
      await storage.updateUserPassword(user.id, hashedPassword);
      await storage.updateUserOtp(user.id, null, null);
      messagingService2.sendMessage(
        user.phone,
        "Your password has been reset successfully. You can now log in with your new password."
      ).catch((err) => console.error("Password reset notification error:", err));
      res.json({
        success: true,
        message: "Password reset successful"
      });
    } catch (error) {
      console.error("Reset password error:", error);
      res.status(500).json({ message: "Failed to reset password" });
    }
  });
  app2.get("/api/conversations/user-conversation", async (req, res) => {
    try {
      const userId = req.session?.userId;
      if (!userId) {
        console.log(`[CONVERSATION AUTH] FAILED - No userId in session for conversation request`);
        return res.status(401).json({ message: "Authentication required" });
      }
      console.log(`[CONVERSATION PRIVACY] User ${userId.substring(0, 8)}... requesting conversation`);
      const existingConversations = await storage.getConversationsByUserId(userId);
      console.log(`[CONVERSATION PRIVACY] User ${userId.substring(0, 8)}... has ${existingConversations.length} existing conversations`);
      const activeConversation = existingConversations.find((c) => c.status === "active");
      if (activeConversation) {
        console.log(`[CONVERSATION PRIVACY] Returning conversation ${activeConversation.id.substring(0, 8)}... for user ${userId.substring(0, 8)}...`);
        return res.json(activeConversation);
      }
      const newConversation = await storage.createConversation({
        userId,
        title: "Support Chat",
        adminId: null
      });
      console.log(`[CONVERSATION PRIVACY] Created new conversation ${newConversation.id.substring(0, 8)}... for user ${userId.substring(0, 8)}...`);
      res.json(newConversation);
    } catch (error) {
      console.error("Get/Create conversation error:", error);
      res.status(500).json({ message: "Failed to get or create conversation" });
    }
  });
  app2.get("/api/messages/:conversationId", async (req, res) => {
    try {
      const { conversationId } = req.params;
      const userId = req.session?.userId;
      const adminId = req.session?.admin?.id;
      console.log(`[MESSAGES PRIVACY] User ${userId?.substring(0, 8) || "none"}... requesting messages for conversation ${conversationId.substring(0, 8)}...`);
      if (!userId && !adminId) {
        console.log(`[MESSAGES AUTH] FAILED - No userId or adminId in session`);
        return res.status(401).json({ message: "Authentication required" });
      }
      const conversation = await storage.getConversation(conversationId);
      if (!conversation) {
        console.log(`[MESSAGES PRIVACY] Conversation ${conversationId.substring(0, 8)}... not found`);
        return res.status(404).json({ message: "Conversation not found" });
      }
      console.log(`[MESSAGES PRIVACY] Conversation ${conversationId.substring(0, 8)}... belongs to user ${conversation.userId.substring(0, 8)}...`);
      if (conversation.userId !== userId && !adminId) {
        console.log(`[MESSAGES PRIVACY] ACCESS DENIED - User ${userId?.substring(0, 8)}... tried to access conversation owned by ${conversation.userId.substring(0, 8)}...`);
        return res.status(403).json({ message: "Access denied" });
      }
      const messages2 = await storage.getMessagesByConversationId(conversationId);
      console.log(`[MESSAGES PRIVACY] Returning ${messages2.length} messages for conversation ${conversationId.substring(0, 8)}...`);
      res.json(messages2);
    } catch (error) {
      console.error("Get messages error:", error);
      res.status(500).json({ message: "Failed to get messages" });
    }
  });
  app2.post("/api/messages", async (req, res) => {
    try {
      const userId = req.session?.userId;
      const adminId = req.session?.admin?.id;
      console.log(`[MESSAGES PRIVACY] User ${userId?.substring(0, 8) || "none"}... sending message`);
      if (!userId && !adminId) {
        console.log(`[MESSAGES AUTH] FAILED - No userId or adminId in session`);
        return res.status(401).json({ message: "Authentication required" });
      }
      const messageData = insertMessageSchema.parse(req.body);
      console.log(`[MESSAGES PRIVACY] Message for conversation ${messageData.conversationId.substring(0, 8)}...`);
      const conversation = await storage.getConversation(messageData.conversationId);
      if (!conversation) {
        console.log(`[MESSAGES PRIVACY] Conversation ${messageData.conversationId.substring(0, 8)}... not found for message`);
        return res.status(404).json({ message: "Conversation not found" });
      }
      console.log(`[MESSAGES PRIVACY] Conversation ${messageData.conversationId.substring(0, 8)}... belongs to user ${conversation.userId.substring(0, 8)}...`);
      if (conversation.userId !== userId && !adminId) {
        console.log(`[MESSAGES PRIVACY] ACCESS DENIED - User ${userId?.substring(0, 8)}... tried to send message to conversation owned by ${conversation.userId.substring(0, 8)}...`);
        return res.status(403).json({ message: "Access denied" });
      }
      const senderId = adminId || userId;
      const senderType = adminId ? "admin" : "user";
      console.log(`[MESSAGES PRIVACY] Creating message from ${senderType} ${senderId?.substring(0, 8)}... in conversation ${messageData.conversationId.substring(0, 8)}...`);
      const message = await storage.createMessage({
        ...messageData,
        senderId,
        senderType
      });
      res.json({ message });
    } catch (error) {
      console.error("Create message error:", error);
      res.status(400).json({ message: "Invalid message data" });
    }
  });
  app2.put("/api/messages/:id/read", async (req, res) => {
    try {
      const { id } = req.params;
      const userId = req.session?.userId;
      const adminId = req.session?.admin?.id;
      if (!userId && !adminId) {
        return res.status(401).json({ message: "Authentication required" });
      }
      const message = await storage.markMessageAsRead(id);
      if (!message) {
        return res.status(404).json({ message: "Message not found" });
      }
      res.json({ message });
    } catch (error) {
      console.error("Mark message read error:", error);
      res.status(500).json({ message: "Failed to mark message as read" });
    }
  });
  app2.post("/api/upload", upload.single("file"), async (req, res) => {
    try {
      const userId = req.session?.userId;
      const adminId = req.session?.admin?.id;
      if (!userId && !adminId) {
        return res.status(401).json({ message: "Authentication required" });
      }
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }
      try {
        const fileUrl = await cloudinaryStorage2.uploadChatFile(
          req.file.buffer,
          req.file.originalname,
          req.file.mimetype
        );
        res.json({
          fileUrl,
          fileName: req.file.originalname,
          fileSize: req.file.size,
          mimeType: req.file.mimetype,
          message: "File uploaded successfully"
        });
      } catch (uploadError) {
        console.error("\u274C Object storage upload error:", uploadError);
        return res.status(500).json({ message: "Failed to upload file to storage" });
      }
    } catch (error) {
      console.error("File upload error:", error);
      res.status(500).json({ message: "Failed to upload file" });
    }
  });
  app2.post("/api/kyc/submit", upload.fields([
    { name: "frontImage", maxCount: 1 },
    { name: "backImage", maxCount: 1 },
    { name: "selfie", maxCount: 1 }
  ]), async (req, res) => {
    try {
      const files = req.files;
      const { userId, documentType, dateOfBirth, address } = req.body;
      if (!userId || !documentType || !dateOfBirth || !address) {
        return res.status(400).json({ message: "Missing required fields" });
      }
      if (!files?.frontImage || !files?.backImage || !files?.selfie) {
        return res.status(400).json({ message: "All document images are required" });
      }
      const existingKyc = await storage.getKycByUserId(userId);
      if (existingKyc) {
        if (existingKyc.status === "pending") {
          return res.status(409).json({
            message: "Your KYC documents are currently under review. Please wait for admin verification.",
            status: existingKyc.status
          });
        }
        if (existingKyc.status === "verified") {
          return res.status(409).json({
            message: "Your KYC documents have already been verified.",
            status: existingKyc.status
          });
        }
        if (existingKyc.status === "rejected") {
          let frontImageUrl2 = null;
          let backImageUrl2 = null;
          let selfieUrl2 = null;
          try {
            [frontImageUrl2, backImageUrl2, selfieUrl2] = await Promise.all([
              cloudinaryStorage2.uploadKycDocument(
                files.frontImage[0].buffer,
                files.frontImage[0].originalname,
                files.frontImage[0].mimetype
              ),
              cloudinaryStorage2.uploadKycDocument(
                files.backImage[0].buffer,
                files.backImage[0].originalname,
                files.backImage[0].mimetype
              ),
              cloudinaryStorage2.uploadKycDocument(
                files.selfie[0].buffer,
                files.selfie[0].originalname,
                files.selfie[0].mimetype
              )
            ]);
          } catch (uploadError) {
            console.error("\u274C KYC document upload error:", uploadError);
            return res.status(500).json({ message: "Failed to upload documents to storage" });
          }
          const updatedKyc = await storage.updateKycDocument(existingKyc.id, {
            documentType,
            dateOfBirth,
            address,
            frontImageUrl: frontImageUrl2,
            backImageUrl: backImageUrl2,
            selfieUrl: selfieUrl2,
            status: "pending",
            verificationNotes: null,
            updatedAt: /* @__PURE__ */ new Date()
          });
          await storage.updateUser(userId, { kycStatus: "pending" });
          await notificationService.sendNotification({
            title: "KYC Documents Resubmitted",
            body: "Your updated documents have been submitted for review. You will be notified once verified.",
            userId,
            type: "general"
          });
          const user2 = await storage.getUser(userId);
          if (user2?.phone) {
            const { messagingService: messagingService2 } = await Promise.resolve().then(() => (init_messaging(), messaging_exports));
            messagingService2.sendMessage(
              user2.phone,
              "Your KYC documents have been resubmitted. Our team will review them within 48 hours. You'll be notified once verified."
            ).catch((err) => console.error("KYC resubmission message error:", err));
          }
          return res.json({ kyc: updatedKyc, message: "KYC documents resubmitted successfully" });
        }
      }
      let frontImageUrl = null;
      let backImageUrl = null;
      let selfieUrl = null;
      try {
        [frontImageUrl, backImageUrl, selfieUrl] = await Promise.all([
          cloudinaryStorage2.uploadKycDocument(
            files.frontImage[0].buffer,
            files.frontImage[0].originalname,
            files.frontImage[0].mimetype
          ),
          cloudinaryStorage2.uploadKycDocument(
            files.backImage[0].buffer,
            files.backImage[0].originalname,
            files.backImage[0].mimetype
          ),
          cloudinaryStorage2.uploadKycDocument(
            files.selfie[0].buffer,
            files.selfie[0].originalname,
            files.selfie[0].mimetype
          )
        ]);
      } catch (uploadError) {
        console.error("\u274C KYC document upload error:", uploadError);
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
      await storage.updateUser(userId, { kycStatus: "pending" });
      await notificationService.sendNotification({
        title: "KYC Documents Submitted",
        body: "Your documents have been submitted for review. You will be notified once verified.",
        userId,
        type: "general"
      });
      const user = await storage.getUser(userId);
      if (user?.phone) {
        const { messagingService: messagingService2 } = await Promise.resolve().then(() => (init_messaging(), messaging_exports));
        messagingService2.sendMessage(
          user.phone,
          "Your KYC documents have been submitted successfully. Our team will review them within 48 hours. You'll be notified once verified."
        ).catch((err) => console.error("KYC submission message error:", err));
      }
      res.json({ kyc, message: "KYC documents submitted successfully" });
    } catch (error) {
      console.error("KYC submission error:", error);
      res.status(500).json({ message: "Failed to submit KYC documents" });
    }
  });
  app2.get("/api/kyc/:userId", async (req, res) => {
    try {
      const kyc = await storage.getKycByUserId(req.params.userId);
      res.json({ kyc });
    } catch (error) {
      res.status(500).json({ message: "Error fetching KYC data" });
    }
  });
  app2.post("/api/virtual-card/initialize-payment", async (req, res) => {
    try {
      const { userId } = req.body;
      console.log("Card payment request - userId:", userId, "type:", typeof userId);
      if (!userId) {
        return res.status(400).json({ message: "User ID is required" });
      }
      const user = await storage.getUser(userId);
      console.log("Card payment - Found user:", !!user, user?.email);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      const existingCard = await storage.getVirtualCardByUserId(userId);
      if (existingCard) {
        return res.status(400).json({ message: "User already has a virtual card" });
      }
      const reference = payHeroService.generateReference();
      if (!user.email || !user.email.includes("@") || !user.email.includes(".")) {
        return res.status(400).json({ message: "Invalid user email. Please update your profile with a valid email address." });
      }
      if (!user.phone) {
        return res.status(400).json({ message: "Phone number is required for M-Pesa payments. Please update your profile." });
      }
      const cardPriceSetting = await storage.getSystemSetting("virtual_card", "price");
      const usdAmount = parseFloat(cardPriceSetting?.value || "60.00");
      const kesAmount = await payHeroService.convertUSDtoKES(usdAmount);
      console.log(`Converting $${usdAmount} USD to ${kesAmount} KES for card purchase`);
      const callbackUrl = `${req.protocol}://${req.get("host")}/payment-processing?reference=${reference}&type=virtual-card`;
      const paymentData = await payHeroService.initiateMpesaPayment(
        kesAmount,
        // Amount in KES
        user.phone,
        // Phone number for M-Pesa STK Push
        reference,
        // External reference
        user.fullName,
        // Customer name
        callbackUrl
        // Callback URL for tracking
      );
      if (!paymentData.success) {
        if (paymentData.status === "INVALID_PHONE_NUMBER" || paymentData.status === "INVALID_PHONE_FORMAT") {
          return res.status(400).json({
            message: "Invalid phone number format. Please update your profile with a valid Kenyan phone number (e.g., +254712345678 or 0712345678)",
            status: paymentData.status
          });
        }
        return res.status(400).json({
          message: "Payment initiation failed. Please try again or contact support.",
          status: paymentData.status
        });
      }
      res.json({
        success: true,
        reference: paymentData.reference,
        checkoutRequestId: paymentData.CheckoutRequestID,
        status: paymentData.status,
        message: "STK Push sent to your phone. Please enter your M-Pesa PIN to complete payment."
      });
    } catch (error) {
      console.error("Card payment initialization error:", error);
      res.status(500).json({ message: "Error initializing card payment" });
    }
  });
  app2.put("/api/users/:id/profile", async (req, res) => {
    try {
      const { id } = req.params;
      const userId = req.session?.userId;
      console.log("Profile update request:", {
        urlId: id,
        sessionUserId: userId,
        hasSession: !!req.session,
        sessionKeys: Object.keys(req.session || {})
      });
      if (!userId) {
        return res.status(401).json({ message: "Please log in to update your profile" });
      }
      if (userId !== id) {
        return res.status(403).json({ message: "You can only update your own profile" });
      }
      const { fullName, email, phone, country, profilePhotoUrl } = req.body;
      if (email) {
        const existingUser = await storage.getUserByEmail(email);
        if (existingUser && existingUser.id !== id) {
          return res.status(400).json({ message: "Email already in use" });
        }
      }
      if (phone) {
        const existingUser = await storage.getUserByPhone(phone);
        if (existingUser && existingUser.id !== id) {
          return res.status(400).json({ message: "Phone number already in use" });
        }
      }
      const updateData = {
        fullName,
        email,
        phone,
        country
      };
      if (profilePhotoUrl !== void 0) {
        updateData.profilePhotoUrl = profilePhotoUrl;
      }
      const updatedUser = await storage.updateUser(id, updateData);
      if (!updatedUser) {
        return res.status(404).json({ message: "User not found" });
      }
      req.session.userId = updatedUser.id;
      const { password, ...userResponse } = updatedUser;
      res.json({ user: userResponse, message: "Profile updated successfully" });
    } catch (error) {
      console.error("Profile update error:", error);
      res.status(400).json({ message: "Failed to update profile" });
    }
  });
  app2.put("/api/users/:id/settings", async (req, res) => {
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
      console.error("Settings update error:", error);
      res.status(400).json({ message: "Failed to update settings" });
    }
  });
  app2.post("/api/users/:id/profile-photo", upload.single("photo"), async (req, res) => {
    try {
      const { id } = req.params;
      const file = req.file;
      if (!file) {
        return res.status(400).json({ message: "No photo file provided" });
      }
      if (!file.mimetype.startsWith("image/")) {
        return res.status(400).json({ message: "File must be an image" });
      }
      const photoUrl = await cloudinaryStorage2.uploadProfilePicture(
        file.buffer,
        file.originalname,
        file.mimetype
      );
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
      console.error("Profile photo upload error:", error);
      res.status(500).json({ message: "Failed to upload profile photo" });
    }
  });
  app2.post("/api/users/:id/change-password", async (req, res) => {
    try {
      const { id } = req.params;
      const { currentPassword, newPassword } = req.body;
      if (!currentPassword || !newPassword) {
        return res.status(400).json({ message: "Current and new password are required" });
      }
      if (newPassword.length < 8) {
        return res.status(400).json({ message: "New password must be at least 8 characters long" });
      }
      const user = await storage.getUser(id);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      const isPasswordValid = await bcrypt2.compare(currentPassword, user.password);
      if (!isPasswordValid) {
        return res.status(401).json({ message: "Current password is incorrect" });
      }
      const hashedPassword = await bcrypt2.hash(newPassword, 10);
      await storage.updateUser(id, { password: hashedPassword });
      res.json({ message: "Password changed successfully" });
    } catch (error) {
      console.error("Password change error:", error);
      res.status(500).json({ message: "Failed to change password" });
    }
  });
  app2.get("/api/kyc/:userId", async (req, res) => {
    try {
      const { userId } = req.params;
      const kyc = await storage.getKycByUserId(userId);
      res.json({ kyc });
    } catch (error) {
      console.error("KYC fetch error:", error);
      res.status(500).json({ message: "Failed to fetch KYC data" });
    }
  });
  app2.post("/api/auth/setup-2fa", async (req, res) => {
    try {
      const { userId } = req.body;
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      const secret = speakeasy2.generateSecret({
        name: `GreenPay (${user.email})`,
        issuer: "GreenPay"
      });
      const qrCodeUrl = await QRCode2.toDataURL(secret.otpauth_url);
      await storage.updateUser(userId, { twoFactorSecret: secret.base32 });
      res.json({
        qrCodeUrl,
        secret: secret.base32,
        // Don't send in production
        message: "Scan QR code with your authenticator app"
      });
    } catch (error) {
      console.error("2FA setup error:", error);
      res.status(500).json({ message: "Failed to setup 2FA" });
    }
  });
  app2.post("/api/auth/setup-biometric", async (req, res) => {
    try {
      const { userId } = req.body;
      await storage.updateUser(userId, { biometricEnabled: true });
      res.json({ message: "Biometric authentication enabled" });
    } catch (error) {
      console.error("Biometric setup error:", error);
      res.status(500).json({ message: "Failed to setup biometric authentication" });
    }
  });
  app2.post("/api/notifications/register", async (req, res) => {
    try {
      const { userId, endpoint } = req.body;
      await storage.updateUser(userId, { pushNotificationsEnabled: true });
      res.json({ message: "Push notifications registered" });
    } catch (error) {
      console.error("Notification registration error:", error);
      res.status(500).json({ message: "Failed to register for notifications" });
    }
  });
  app2.post("/api/virtual-card/verify-payment", async (req, res) => {
    try {
      const { reference, userId } = req.body;
      if (!reference || !userId) {
        return res.status(400).json({ message: "Reference and user ID are required" });
      }
      console.log("PayHero payment verification not supported - using callback method");
      return res.status(400).json({
        message: "Payment verification not supported with PayHero. Payments are processed via callbacks.",
        success: false
      });
    } catch (error) {
      console.error("Card payment verification error:", error);
      res.status(500).json({
        message: "Error verifying card payment",
        success: false
      });
    }
  });
  app2.get("/api/payment-callback", async (req, res) => {
    try {
      const { reference, trxref, type } = req.query;
      const actualReference = reference || trxref;
      console.log("Payment callback received:", { reference: actualReference, type });
      if (!actualReference) {
        return res.status(400).json({ message: "Payment reference is required" });
      }
      const verificationResult = await paystackService.verifyPayment(actualReference);
      if (!verificationResult.status) {
        console.error("Callback payment verification failed:", verificationResult.message);
        return res.redirect(`/payment-failed?reference=${actualReference}&error=${encodeURIComponent(verificationResult.message)}`);
      }
      const paymentData = verificationResult.data;
      if (paymentData.status === "success") {
        if (type === "virtual-card") {
          return res.redirect(`/payment-success?reference=${actualReference}&type=virtual-card`);
        } else {
          return res.redirect(`/payment-success?reference=${actualReference}&type=deposit`);
        }
      } else {
        return res.redirect(`/payment-failed?reference=${actualReference}&status=${paymentData.status}`);
      }
    } catch (error) {
      console.error("Payment callback error:", error);
      return res.redirect(`/payment-failed?error=${encodeURIComponent("Payment verification failed")}`);
    }
  });
  app2.post("/api/webhook/paystack", async (req, res) => {
    try {
      const event = req.body;
      console.log("Paystack webhook received:", event.event, event.data?.reference);
      if (event.event === "charge.success") {
        const { reference, status, amount, currency } = event.data;
        console.log("Webhook payment success:", { reference, status, amount, currency });
      } else if (event.event === "charge.failed") {
        const { reference, status } = event.data;
        console.log("Webhook payment failed:", { reference, status });
      }
      res.status(200).json({ received: true });
    } catch (error) {
      console.error("Webhook error:", error);
      res.status(500).json({ error: "Webhook processing failed" });
    }
  });
  app2.post("/api/deposit/initialize-payment", async (req, res) => {
    try {
      const { userId, amount, currency } = req.body;
      console.log("Deposit payment request - userId:", userId, "amount:", amount, "currency:", currency);
      if (!userId) {
        return res.status(400).json({ message: "User ID is required" });
      }
      const user = await storage.getUser(userId);
      console.log("Deposit payment - Found user:", !!user, user?.email);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      const reference = paystackService.generateReference();
      if (!user.email || !user.email.includes("@") || !user.email.includes(".")) {
        return res.status(400).json({ message: "Invalid user email. Please update your profile with a valid email address." });
      }
      if (!user.phone) {
        return res.status(400).json({ message: "Phone number is required for M-Pesa payments. Please update your profile." });
      }
      const depositAmount2 = parseFloat(amount);
      if (isNaN(depositAmount2) || depositAmount2 <= 0) {
        return res.status(400).json({ message: "Invalid deposit amount" });
      }
      const callbackUrl = `${req.protocol}://${req.get("host")}/api/payment-callback?reference=${reference}&type=deposit`;
      const paymentData = await paystackService.initializePayment(
        user.email,
        depositAmount2,
        reference,
        "KES",
        // Use KES currency
        user.phone,
        // Use registered phone number for M-Pesa
        callbackUrl
        // Callback URL for tracking
      );
      if (!paymentData.status) {
        return res.status(400).json({ message: paymentData.message });
      }
      res.json({
        authorizationUrl: paymentData.data.authorization_url,
        reference
      });
    } catch (error) {
      console.error("Deposit payment initialization error:", error);
      res.status(500).json({ message: "Error initializing deposit payment" });
    }
  });
  app2.post("/api/deposit/verify-payment", async (req, res) => {
    try {
      const { reference, userId, amount, currency } = req.body;
      const verification = await paystackService.verifyPayment(reference);
      if (!verification.status || verification.data.status !== "success") {
        return res.status(400).json({ message: "Payment verification failed" });
      }
      const transaction = await storage.createTransaction({
        userId,
        type: "deposit",
        amount: amount.toString(),
        currency: currency || "USD",
        status: "completed",
        description: `Deposit via Paystack - ${reference}`,
        fee: "0.00",
        paystackReference: reference
      });
      const updatedUser = await storage.getUser(userId);
      if (!updatedUser) {
        return res.status(404).json({ message: "User not found" });
      }
      const currentBalance = parseFloat(updatedUser.balance || "0");
      const newBalance = currentBalance + depositAmount;
      await storage.updateUser(userId, { balance: newBalance.toFixed(2) });
      res.json({
        message: "Deposit successful",
        transaction
      });
    } catch (error) {
      console.error("Deposit verification error:", error);
      res.status(500).json({ message: "Error verifying deposit" });
    }
  });
  app2.post("/api/airtime/purchase", async (req, res) => {
    try {
      const { userId, phoneNumber, amount, currency, provider } = req.body;
      console.log(`\u{1F4F1} Airtime purchase request - User: ${userId}, Phone: ${phoneNumber}, Amount: ${amount} ${currency}, Provider: ${provider}`);
      if (!userId || !phoneNumber || !amount || !currency || !provider) {
        console.warn(`\u26A0\uFE0F Missing required fields in airtime purchase request`);
        return res.status(400).json({ message: "Missing required fields" });
      }
      const user = await storage.getUser(userId);
      if (!user) {
        console.error(`\u274C User not found: ${userId}`);
        return res.status(404).json({ message: "User not found" });
      }
      console.log(`\u{1F464} User ${user.fullName} (${user.email}) - KES Balance: ${user.kesBalance}`);
      const kesBalance = parseFloat(user.kesBalance || "0");
      const purchaseAmount = parseFloat(amount);
      if (kesBalance < purchaseAmount) {
        console.warn(`\u26A0\uFE0F Insufficient balance - Required: ${purchaseAmount}, Available: ${kesBalance}`);
        return res.status(400).json({
          message: "Insufficient KES balance. Please convert USD to KES using the Exchange feature."
        });
      }
      console.log(`\u{1F4DE} Calling Statum API for airtime purchase...`);
      const statumResponse = await statumService.purchaseAirtime(phoneNumber, purchaseAmount);
      console.log(`\u2705 Statum API response:`, statumResponse);
      const transaction = await storage.createTransaction({
        userId,
        type: "airtime",
        amount: amount.toString(),
        currency: "KES",
        status: "completed",
        fee: "0.00",
        description: `Airtime purchase for ${phoneNumber} (${provider})`,
        reference: statumResponse.transaction_id || void 0,
        recipientDetails: {
          phoneNumber,
          provider
        },
        metadata: {
          statumResponse
        }
      });
      console.log(`\u{1F4BE} Transaction created: ${transaction.id}`);
      const newKesBalance = kesBalance - purchaseAmount;
      await storage.updateUser(userId, { kesBalance: newKesBalance.toFixed(2) });
      console.log(`\u2705 Updated user balance: ${kesBalance} -> ${newKesBalance}`);
      console.log(`\u{1F389} Airtime purchase completed successfully`);
      res.json({
        success: true,
        message: "Airtime purchased successfully",
        transaction,
        statumResponse
      });
    } catch (error) {
      console.error("\u274C Airtime purchase error:", error);
      const errorMessage = error instanceof Error ? error.message : "Error purchasing airtime";
      res.status(500).json({ message: errorMessage });
    }
  });
  app2.post("/api/airtime/claim-bonus", async (req, res) => {
    try {
      const { userId } = req.body;
      console.log(`\u{1F381} Airtime bonus claim request - User: ${userId}`);
      if (!userId) {
        console.warn(`\u26A0\uFE0F Missing userId in bonus claim request`);
        return res.status(400).json({ message: "Missing userId" });
      }
      const user = await storage.getUser(userId);
      if (!user) {
        console.error(`\u274C User not found: ${userId}`);
        return res.status(404).json({ message: "User not found" });
      }
      console.log(`\u{1F464} User ${user.fullName} - Already claimed: ${user.hasClaimedAirtimeBonus}`);
      if (user.hasClaimedAirtimeBonus) {
        console.warn(`\u26A0\uFE0F User ${userId} has already claimed airtime bonus`);
        return res.status(400).json({ message: "You have already claimed your airtime bonus" });
      }
      const currentKesBalance = parseFloat(user.kesBalance || "0");
      const bonusAmount = 15;
      const newKesBalance = currentKesBalance + bonusAmount;
      await storage.updateUser(userId, {
        kesBalance: newKesBalance.toFixed(2),
        hasClaimedAirtimeBonus: true
      });
      console.log(`\u{1F4B0} Bonus credited: ${currentKesBalance} -> ${newKesBalance} KES`);
      const transaction = await storage.createTransaction({
        userId,
        type: "deposit",
        amount: bonusAmount.toString(),
        currency: "KES",
        status: "completed",
        fee: "0.00",
        description: "One-time airtime bonus - KES 15"
      });
      console.log(`\u{1F4BE} Bonus transaction created: ${transaction.id}`);
      console.log(`\u2705 Airtime bonus claimed successfully`);
      res.json({
        success: true,
        message: "Airtime bonus claimed successfully! KES 15 has been added to your balance.",
        newBalance: newKesBalance.toFixed(2),
        bonusAmount,
        transaction
      });
    } catch (error) {
      console.error("\u274C Claim bonus error:", error);
      res.status(500).json({ message: "Error claiming airtime bonus" });
    }
  });
  app2.get("/api/virtual-card/:userId", async (req, res) => {
    try {
      const card = await storage.getVirtualCardByUserId(req.params.userId);
      res.json({ card });
    } catch (error) {
      res.status(500).json({ message: "Error fetching virtual card" });
    }
  });
  const exchangeRateService2 = createExchangeRateService(storage);
  app2.get("/api/exchange-rates/:from/:to", async (req, res) => {
    try {
      const { from, to } = req.params;
      const rate = await exchangeRateService2.getExchangeRate(from.toUpperCase(), to.toUpperCase());
      res.json({
        from: from.toUpperCase(),
        to: to.toUpperCase(),
        rate,
        timestamp: (/* @__PURE__ */ new Date()).toISOString()
      });
    } catch (error) {
      console.error("Exchange rate error:", error);
      res.status(500).json({ message: "Error fetching exchange rate" });
    }
  });
  app2.get("/api/exchange-rates/:base", async (req, res) => {
    try {
      const { base } = req.params;
      const targets = base.toUpperCase() === "USD" ? ["KES"] : ["USD"];
      const rates = await exchangeRateService2.getMultipleRates(base.toUpperCase(), targets);
      res.json({
        base: base.toUpperCase(),
        rates,
        timestamp: (/* @__PURE__ */ new Date()).toISOString()
      });
    } catch (error) {
      console.error("Multiple exchange rates error:", error);
      res.status(500).json({ message: "Error fetching exchange rates" });
    }
  });
  app2.post("/api/transfer", async (req, res) => {
    try {
      const { fromUserId, toUserId, amount, currency, description } = transferSchema.parse(req.body);
      const fromUser = await storage.getUser(fromUserId);
      const toUser = await storage.getUser(toUserId);
      if (!fromUser || !toUser) {
        return res.status(404).json({ message: "User not found" });
      }
      const currentBalance = parseFloat(fromUser.balance || "0");
      const transferAmount = parseFloat(amount);
      if (currentBalance < transferAmount) {
        return res.status(400).json({ message: "Insufficient balance" });
      }
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
      await storage.updateUser(fromUserId, {
        balance: (currentBalance - transferAmount).toFixed(2)
      });
      const toBalance = parseFloat(toUser.balance || "0");
      await storage.updateUser(toUserId, {
        balance: (toBalance + transferAmount).toFixed(2)
      });
      await notificationService.sendTransactionNotification(fromUserId, sendTransaction);
      await notificationService.sendTransactionNotification(toUserId, receiveTransaction);
      res.json({
        sendTransaction,
        receiveTransaction,
        message: "Transfer completed successfully"
      });
    } catch (error) {
      console.error("Transfer error:", error);
      res.status(400).json({ message: "Transfer failed" });
    }
  });
  app2.post("/api/transactions/send", async (req, res) => {
    try {
      const { userId, amount, currency, recipientDetails, targetCurrency } = req.body;
      const user = await storage.getUser(userId);
      if (!user?.hasVirtualCard) {
        return res.status(400).json({ message: "Virtual card required for transactions" });
      }
      const exchangeRate = await exchangeRateService2.getExchangeRate(currency, targetCurrency);
      const convertedAmount = (parseFloat(amount) * exchangeRate).toFixed(2);
      const fee = (parseFloat(amount) * 0.02).toFixed(2);
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
          processingStarted: (/* @__PURE__ */ new Date()).toISOString()
        }
      });
      setTimeout(async () => {
        try {
          await storage.updateTransaction(transaction.id, {
            status: "completed",
            completedAt: /* @__PURE__ */ new Date()
          });
          await notificationService.sendTransactionNotification(userId, {
            ...transaction,
            status: "completed"
          });
          const { messagingService: messagingService2 } = await Promise.resolve().then(() => (init_messaging(), messaging_exports));
          messagingService2.sendTransactionNotification(user.phone, "send", amount, currency, "completed").catch((err) => console.error("Transaction notification error:", err));
        } catch (error) {
          console.error("Transaction completion error:", error);
        }
      }, 5e3);
      res.json({
        transaction,
        convertedAmount,
        exchangeRate,
        message: "Transaction initiated successfully"
      });
    } catch (error) {
      console.error("Send transaction error:", error);
      res.status(400).json({ message: "Transaction failed" });
    }
  });
  app2.post("/api/transactions/receive", async (req, res) => {
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
      const user = await storage.getUser(userId);
      const newBalance = (parseFloat(user?.balance || "0") + parseFloat(amount)).toFixed(2);
      await storage.updateUser(userId, { balance: newBalance });
      await notificationService.sendTransactionNotification(userId, transaction);
      if (user) {
        const { messagingService: messagingService2 } = await Promise.resolve().then(() => (init_messaging(), messaging_exports));
        messagingService2.sendFundReceipt(user.phone, amount, currency, senderDetails.name).catch((err) => console.error("Fund receipt notification error:", err));
      }
      res.json({ transaction, message: "Payment received successfully" });
    } catch (error) {
      console.error("Receive transaction error:", error);
      res.status(400).json({ message: "Transaction failed" });
    }
  });
  app2.get("/api/transactions/:userId", async (req, res) => {
    try {
      const transactions2 = await storage.getTransactionsByUserId(req.params.userId);
      res.json({ transactions: transactions2 });
    } catch (error) {
      res.status(500).json({ message: "Error fetching transactions" });
    }
  });
  app2.get("/api/transactions/status/:transactionId", async (req, res) => {
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
  app2.post("/api/auth/2fa/setup", async (req, res) => {
    try {
      const { userId } = req.body;
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      const { secret, qrCodeUrl, backupCodes } = twoFactorService.generateSecret(user.email);
      const qrCode = await twoFactorService.generateQRCode(secret, user.email);
      await storage.updateUser(userId, { twoFactorSecret: secret });
      res.json({ qrCode, backupCodes, secret });
    } catch (error) {
      console.error("2FA setup error:", error);
      res.status(500).json({ message: "Error setting up 2FA" });
    }
  });
  app2.post("/api/auth/2fa/verify", async (req, res) => {
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
      console.error("2FA verification error:", error);
      res.status(500).json({ message: "Error verifying 2FA" });
    }
  });
  app2.post("/api/auth/biometric/setup", async (req, res) => {
    try {
      const { userId } = req.body;
      const challenge = await biometricService.generateChallenge(userId);
      res.json({ challenge });
    } catch (error) {
      console.error("Biometric setup error:", error);
      res.status(500).json({ message: "Error setting up biometric authentication" });
    }
  });
  app2.post("/api/auth/biometric/register", async (req, res) => {
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
      console.error("Biometric registration error:", error);
      res.status(500).json({ message: "Error registering biometric" });
    }
  });
  app2.post("/api/auth/biometric/verify", async (req, res) => {
    try {
      const { userId, challenge, response } = req.body;
      const isValid = await biometricService.verifyBiometric(userId, challenge, response);
      if (isValid) {
        res.json({ success: true, message: "Biometric verification successful" });
      } else {
        res.status(400).json({ message: "Biometric verification failed" });
      }
    } catch (error) {
      console.error("Biometric verification error:", error);
      res.status(500).json({ message: "Error verifying biometric" });
    }
  });
  app2.post("/api/notifications/register", async (req, res) => {
    try {
      const { userId, token } = req.body;
      const success = await notificationService.registerPushToken(userId, token);
      if (success) {
        res.json({ success: true, message: "Push notifications registered" });
      } else {
        res.status(400).json({ message: "Failed to register push notifications" });
      }
    } catch (error) {
      console.error("Push notification registration error:", error);
      res.status(500).json({ message: "Error registering push notifications" });
    }
  });
  app2.post("/api/recipients", async (req, res) => {
    try {
      const recipientData = insertRecipientSchema.parse(req.body);
      const recipient = await storage.createRecipient(recipientData);
      res.json({ recipient, message: "Recipient added successfully" });
    } catch (error) {
      console.error("Create recipient error:", error);
      res.status(400).json({ message: "Invalid recipient data" });
    }
  });
  app2.get("/api/recipients/:userId", async (req, res) => {
    try {
      const recipients2 = await storage.getRecipientsByUserId(req.params.userId);
      res.json({ recipients: recipients2 });
    } catch (error) {
      res.status(500).json({ message: "Error fetching recipients" });
    }
  });
  app2.put("/api/recipients/:id", async (req, res) => {
    try {
      const recipient = await storage.updateRecipient(req.params.id, req.body);
      if (recipient) {
        res.json({ recipient, message: "Recipient updated successfully" });
      } else {
        res.status(404).json({ message: "Recipient not found" });
      }
    } catch (error) {
      console.error("Update recipient error:", error);
      res.status(500).json({ message: "Error updating recipient" });
    }
  });
  app2.delete("/api/recipients/:id", async (req, res) => {
    try {
      await storage.deleteRecipient(req.params.id);
      res.json({ message: "Recipient deleted successfully" });
    } catch (error) {
      console.error("Delete recipient error:", error);
      res.status(500).json({ message: "Error deleting recipient" });
    }
  });
  app2.put("/api/users/:userId/settings", async (req, res) => {
    try {
      const { userId } = req.params;
      const { defaultCurrency, pushNotificationsEnabled, twoFactorEnabled, biometricEnabled, ...settings } = req.body;
      const updateData = { ...settings };
      if (defaultCurrency) updateData.defaultCurrency = defaultCurrency;
      if (pushNotificationsEnabled !== void 0) updateData.pushNotificationsEnabled = pushNotificationsEnabled;
      if (twoFactorEnabled !== void 0) updateData.twoFactorEnabled = twoFactorEnabled;
      if (biometricEnabled !== void 0) updateData.biometricEnabled = biometricEnabled;
      const user = await storage.updateUser(userId, updateData);
      if (user) {
        const { password, ...userResponse } = user;
        res.json({ user: userResponse, message: "Settings updated successfully" });
      } else {
        res.status(404).json({ message: "User not found" });
      }
    } catch (error) {
      console.error("Settings update error:", error);
      res.status(500).json({ message: "Error updating settings" });
    }
  });
  app2.post("/api/exchange/convert", async (req, res) => {
    try {
      const { amount, fromCurrency, toCurrency, userId } = req.body;
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      if (!user.hasVirtualCard) {
        return res.status(400).json({ message: "Virtual card required for currency exchanges" });
      }
      const exchangeAmount = parseFloat(amount);
      const fee = (exchangeAmount * 0.015).toFixed(2);
      const totalDeducted = exchangeAmount + parseFloat(fee);
      const exchangeRate = await exchangeRateService2.getExchangeRate(fromCurrency, toCurrency);
      const convertedAmount = (exchangeAmount * exchangeRate).toFixed(2);
      const currentUsdBalance = parseFloat(user.balance || "0");
      const currentKesBalance = parseFloat(user.kesBalance || "0");
      let newUsdBalance = currentUsdBalance;
      let newKesBalance = currentKesBalance;
      if (fromCurrency === "USD" && toCurrency === "KES") {
        if (currentUsdBalance < totalDeducted) {
          return res.status(400).json({ message: "Insufficient USD balance" });
        }
        newUsdBalance = currentUsdBalance - totalDeducted;
        newKesBalance = currentKesBalance + parseFloat(convertedAmount);
      } else if (fromCurrency === "KES" && toCurrency === "USD") {
        if (currentKesBalance < totalDeducted) {
          return res.status(400).json({ message: "Insufficient KES balance" });
        }
        newKesBalance = currentKesBalance - totalDeducted;
        newUsdBalance = currentUsdBalance + parseFloat(convertedAmount);
      } else {
        if (currentUsdBalance < totalDeducted) {
          return res.status(400).json({ message: "Insufficient USD balance" });
        }
        newUsdBalance = currentUsdBalance - totalDeducted;
      }
      await storage.updateUser(userId, {
        balance: newUsdBalance.toFixed(2),
        kesBalance: newKesBalance.toFixed(2)
      });
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
      console.error("Exchange error:", error);
      res.status(400).json({ message: "Exchange failed" });
    }
  });
  app2.post("/api/payment-requests", async (req, res) => {
    try {
      const requestData = insertPaymentRequestSchema.parse(req.body);
      const paymentId = Math.random().toString(36).substring(2, 15);
      const paymentLink = `${req.protocol}://${req.get("host")}/pay/${paymentId}`;
      const request = await storage.createPaymentRequest({
        ...requestData,
        paymentLink
      });
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
      console.error("Payment request error:", error);
      res.status(400).json({ message: "Invalid payment request data" });
    }
  });
  app2.get("/api/payment-requests/:userId", async (req, res) => {
    try {
      const requests = await storage.getPaymentRequestsByUserId(req.params.userId);
      res.json({ requests });
    } catch (error) {
      res.status(500).json({ message: "Error fetching payment requests" });
    }
  });
  app2.post("/api/payment-requests/:id/pay", async (req, res) => {
    try {
      const { id } = req.params;
      const { payerUserId } = req.body;
      const paymentRequest = await storage.getPaymentRequest(id);
      if (!paymentRequest) {
        return res.status(404).json({ message: "Payment request not found" });
      }
      if (paymentRequest.status !== "pending") {
        return res.status(400).json({ message: "Payment request already processed" });
      }
      const transaction = await storage.createTransaction({
        userId: payerUserId,
        type: "send",
        amount: paymentRequest.amount.toString(),
        currency: paymentRequest.currency,
        recipientDetails: { paymentRequestId: id },
        status: "completed",
        fee: "0.00",
        description: `Payment for request: ${paymentRequest.message || "Payment request"}`
      });
      await storage.updatePaymentRequest(id, { status: "paid" });
      await notificationService.sendNotification({
        title: "Payment Received",
        body: `Your payment request for ${paymentRequest.currency} ${paymentRequest.amount} has been paid`,
        userId: paymentRequest.fromUserId,
        type: "transaction"
      });
      res.json({ transaction, message: "Payment completed successfully" });
    } catch (error) {
      console.error("Payment processing error:", error);
      res.status(500).json({ message: "Error processing payment" });
    }
  });
  app2.post("/api/admin/login", async (req, res) => {
    try {
      const { email, password, twoFactorCode } = req.body;
      const admin = await storage.getAdminByEmail(email);
      if (!admin || !admin.isActive) {
        return res.status(401).json({ message: "Invalid credentials" });
      }
      const validPassword = await bcrypt2.compare(password, admin.password);
      if (!validPassword) {
        return res.status(401).json({ message: "Invalid credentials" });
      }
      if (admin.twoFactorEnabled && admin.twoFactorSecret) {
        if (!twoFactorCode) {
          return res.status(401).json({
            message: "2FA code required",
            requiresTwoFactor: true
          });
        }
        const verified = speakeasy2.totp.verify({
          secret: admin.twoFactorSecret,
          encoding: "ascii",
          token: twoFactorCode,
          window: 2
        });
        if (!verified) {
          return res.status(401).json({ message: "Invalid 2FA code" });
        }
      }
      req.session.regenerate((err) => {
        if (err) {
          console.error("Admin session regeneration error:", err);
          return res.status(500).json({ message: "Session error" });
        }
        storage.updateAdmin(admin.id, { lastLoginAt: /* @__PURE__ */ new Date() }).catch((updateErr) => {
          console.error("Admin update error:", updateErr);
        });
        req.session.admin = {
          id: admin.id,
          email: admin.email,
          fullName: admin.fullName,
          role: admin.role,
          isActive: admin.isActive
        };
        storage.createAdminLog({
          adminId: admin.id,
          action: "LOGIN",
          ipAddress: req.ip,
          userAgent: req.get("User-Agent") || null
        }).catch((logErr) => {
          console.error("Admin log error:", logErr);
        });
        req.session.save((saveErr) => {
          if (saveErr) {
            console.error("Admin session save error:", saveErr);
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
      console.error("Admin login error:", error);
      res.status(500).json({ message: "Login failed" });
    }
  });
  app2.get("/api/admin/dashboard", async (req, res) => {
    try {
      const [
        usersCount,
        transactionsCount,
        { volume, revenue },
        allUsers,
        allTransactions,
        kycDocuments2
      ] = await Promise.all([
        storage.getUsersCount(),
        storage.getTransactionsCount(),
        storage.getTotalVolume(),
        storage.getAllUsers(),
        storage.getAllTransactions(),
        storage.getAllKycDocuments()
      ]);
      const activeUsers = allUsers.filter((u) => u.isEmailVerified || u.isPhoneVerified).length;
      const pendingKyc = kycDocuments2.filter((d) => d.status === "pending").length;
      const completedTransactions = allTransactions.filter((t) => t.status === "completed").length;
      const pendingTransactions = allTransactions.filter((t) => t.status === "pending").length;
      const today = /* @__PURE__ */ new Date();
      const last7Days = Array.from({ length: 7 }, (_, i) => {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        return date.toISOString().split("T")[0];
      }).reverse();
      const transactionTrends = last7Days.map((date) => {
        const dayTransactions = allTransactions.filter(
          (t) => t.createdAt && t.createdAt.toISOString().split("T")[0] === date
        );
        return {
          date,
          count: dayTransactions.length,
          volume: dayTransactions.reduce((sum2, t) => sum2 + parseFloat(t.amount), 0)
        };
      });
      res.json({
        metrics: {
          totalUsers: usersCount,
          activeUsers,
          blockedUsers: allUsers.filter((u) => !u.isEmailVerified && !u.isPhoneVerified).length,
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
      console.error("Dashboard data error:", error);
      res.status(500).json({ message: "Failed to load dashboard data" });
    }
  });
  app2.get("/api/admin/users", async (req, res) => {
    try {
      const { page = 1, limit = 20, status, search } = req.query;
      let users2 = await storage.getAllUsers();
      if (status) {
        users2 = users2.filter((user) => {
          switch (status) {
            case "active":
              return user.isEmailVerified || user.isPhoneVerified;
            case "pending":
              return user.kycStatus === "pending";
            case "verified":
              return user.kycStatus === "verified";
            case "blocked":
              return !user.isEmailVerified && !user.isPhoneVerified;
            default:
              return true;
          }
        });
      }
      if (search) {
        const searchTerm = search.toString().toLowerCase();
        users2 = users2.filter(
          (user) => user.fullName.toLowerCase().includes(searchTerm) || user.email.toLowerCase().includes(searchTerm) || user.phone.includes(searchTerm)
        );
      }
      const startIndex = (Number(page) - 1) * Number(limit);
      const paginatedUsers = users2.slice(startIndex, startIndex + Number(limit));
      res.json({
        users: paginatedUsers,
        total: users2.length,
        page: Number(page),
        totalPages: Math.ceil(users2.length / Number(limit))
      });
    } catch (error) {
      console.error("Users fetch error:", error);
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });
  app2.get("/api/admin/kyc", async (req, res) => {
    try {
      const kycDocuments2 = await storage.getAllKycDocuments();
      res.json({ kycDocuments: kycDocuments2 });
    } catch (error) {
      console.error("KYC fetch error:", error);
      res.status(500).json({ message: "Failed to fetch KYC documents" });
    }
  });
  app2.put("/api/admin/kyc/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const { status, verificationNotes } = req.body;
      const updatedKyc = await storage.updateKycDocument(id, {
        status,
        verificationNotes,
        verifiedAt: status === "verified" ? /* @__PURE__ */ new Date() : null
      });
      if (updatedKyc) {
        await storage.updateUser(updatedKyc.userId, { kycStatus: status });
        if (status === "verified") {
          const user = await storage.getUser(updatedKyc.userId);
          if (user) {
            const { messagingService: messagingService2 } = await Promise.resolve().then(() => (init_messaging(), messaging_exports));
            messagingService2.sendKYCVerified(user.phone).catch((err) => console.error("KYC notification error:", err));
          }
        }
      }
      res.json({ kyc: updatedKyc });
    } catch (error) {
      console.error("KYC update error:", error);
      res.status(500).json({ message: "Failed to update KYC" });
    }
  });
  app2.get("/api/admin/transactions", async (req, res) => {
    try {
      const { page = 1, limit = 20, status, type } = req.query;
      let transactions2 = await storage.getAllTransactions();
      if (status) {
        transactions2 = transactions2.filter((t) => t.status === status);
      }
      if (type) {
        transactions2 = transactions2.filter((t) => t.type === type);
      }
      const startIndex = (Number(page) - 1) * Number(limit);
      const paginatedTransactions = transactions2.slice(startIndex, startIndex + Number(limit));
      res.json({
        transactions: paginatedTransactions,
        total: transactions2.length,
        page: Number(page),
        totalPages: Math.ceil(transactions2.length / Number(limit))
      });
    } catch (error) {
      console.error("Transactions fetch error:", error);
      res.status(500).json({ message: "Failed to fetch transactions" });
    }
  });
  app2.get("/api/admin/virtual-cards", async (req, res) => {
    try {
      const cards = await storage.getAllVirtualCards();
      res.json({ cards });
    } catch (error) {
      console.error("Virtual cards fetch error:", error);
      res.status(500).json({ message: "Failed to fetch virtual cards" });
    }
  });
  app2.get("/api/admin/logs", async (req, res) => {
    try {
      const logs = await storage.getAdminLogs();
      res.json({ logs });
    } catch (error) {
      console.error("Admin logs fetch error:", error);
      res.status(500).json({ message: "Failed to fetch admin logs" });
    }
  });
  app2.put("/api/admin/users/:id/block", async (req, res) => {
    try {
      const { id } = req.params;
      await storage.updateUser(id, {
        isEmailVerified: false,
        isPhoneVerified: false
      });
      res.json({ message: "User blocked successfully" });
    } catch (error) {
      console.error("Block user error:", error);
      res.status(500).json({ message: "Failed to block user" });
    }
  });
  app2.put("/api/admin/users/:id/unblock", async (req, res) => {
    try {
      const { id } = req.params;
      await storage.updateUser(id, {
        isEmailVerified: true,
        isPhoneVerified: true
      });
      res.json({ message: "User unblocked successfully" });
    } catch (error) {
      console.error("Unblock user error:", error);
      res.status(500).json({ message: "Failed to unblock user" });
    }
  });
  app2.put("/api/admin/users/:id/account", async (req, res) => {
    try {
      const { id } = req.params;
      const { action } = req.body;
      const user = await storage.getUser(id);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      let updateData = {};
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
          logMessage = `Admin forced logout for user: ${user.email}`;
          break;
        case "reset_password":
          logMessage = `Admin initiated password reset for user: ${user.email}`;
          break;
        default:
          return res.status(400).json({ message: "Invalid action" });
      }
      if (Object.keys(updateData).length > 0) {
        await storage.updateUser(id, updateData);
      }
      await storage.createAdminLog({
        adminId: req.session.admin?.id || null,
        action: `user_account_${action}`,
        details: logMessage,
        targetId: id
      });
      res.json({ message: "Account action completed successfully" });
    } catch (error) {
      console.error("Admin account action error:", error);
      res.status(500).json({ message: "Failed to perform account action" });
    }
  });
  app2.put("/api/admin/users/:id/security", async (req, res) => {
    try {
      const { id } = req.params;
      const { action } = req.body;
      const user = await storage.getUser(id);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      let updateData = {};
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
      await storage.createAdminLog({
        adminId: req.session.admin?.id || null,
        action: `user_security_${action}`,
        details: logMessage,
        targetId: id
      });
      res.json({ message: "Security action completed successfully" });
    } catch (error) {
      console.error("Admin security action error:", error);
      res.status(500).json({ message: "Failed to perform security action" });
    }
  });
  app2.put("/api/admin/users/:id/notifications", async (req, res) => {
    try {
      const { id } = req.params;
      const { action } = req.body;
      const user = await storage.getUser(id);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      let updateData = {};
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
      await storage.createAdminLog({
        adminId: req.session.admin?.id || null,
        action: `user_notifications_${action}`,
        details: logMessage,
        targetId: id
      });
      res.json({ message: "Notification settings updated successfully" });
    } catch (error) {
      console.error("Admin notification action error:", error);
      res.status(500).json({ message: "Failed to update notification settings" });
    }
  });
  app2.get("/api/admin/users/:id/export", async (req, res) => {
    try {
      const { id } = req.params;
      const user = await storage.getUser(id);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      const kyc = await storage.getKycByUserId(id);
      const virtualCard = await storage.getVirtualCardByUserId(id);
      const transactions2 = await storage.getTransactionsByUserId(id);
      const recipients2 = await storage.getRecipientsByUserId(id);
      const paymentRequests2 = await storage.getPaymentRequestsByUserId(id);
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
          createdAt: user.createdAt
        },
        kyc: kyc ? {
          status: kyc.status,
          documentType: kyc.documentType,
          verifiedAt: kyc.verifiedAt,
          createdAt: kyc.createdAt
        } : null,
        virtualCard: virtualCard ? {
          status: virtualCard.status,
          balance: virtualCard.balance,
          purchaseAmount: virtualCard.purchaseAmount,
          purchaseDate: virtualCard.purchaseDate
        } : null,
        transactions: transactions2.map((tx) => ({
          id: tx.id,
          type: tx.type,
          amount: tx.amount,
          currency: tx.currency,
          status: tx.status,
          description: tx.description,
          createdAt: tx.createdAt
        })),
        recipients: recipients2.map((recipient) => ({
          id: recipient.id,
          name: recipient.name,
          country: recipient.country,
          currency: recipient.currency,
          recipientType: recipient.recipientType,
          createdAt: recipient.createdAt
        })),
        paymentRequests: paymentRequests2.map((req2) => ({
          id: req2.id,
          amount: req2.amount,
          currency: req2.currency,
          status: req2.status,
          createdAt: req2.createdAt
        })),
        exportedAt: (/* @__PURE__ */ new Date()).toISOString()
      };
      await storage.createAdminLog({
        adminId: req.session.admin?.id || null,
        action: "user_data_export",
        details: `Admin exported data for user: ${user.email}`,
        targetId: id
      });
      res.setHeader("Content-Type", "application/json");
      res.setHeader("Content-Disposition", `attachment; filename="user-data-${id}.json"`);
      res.send(JSON.stringify(exportData, null, 2));
    } catch (error) {
      console.error("User data export error:", error);
      res.status(500).json({ message: "Failed to export user data" });
    }
  });
  app2.post("/api/admin/users/:id/notification", async (req, res) => {
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
      const notification = await storage.createNotification({
        title,
        message,
        type,
        userId: id,
        isGlobal: false
      });
      await storage.createAdminLog({
        adminId: req.session.admin?.id || null,
        action: "send_custom_notification",
        details: `Admin sent custom notification to user: ${user.email} - Title: ${title}`,
        targetId: id
      });
      res.json({
        message: "Notification sent successfully",
        notification: {
          id: notification.id,
          title: notification.title,
          message: notification.message,
          type: notification.type
        }
      });
    } catch (error) {
      console.error("Send custom notification error:", error);
      res.status(500).json({ message: "Failed to send notification" });
    }
  });
  app2.post("/api/support/tickets", async (req, res) => {
    try {
      const ticketData = insertSupportTicketSchema.parse(req.body);
      const userId = req.session?.user?.id;
      if (!userId) {
        return res.status(401).json({ message: "Authentication required" });
      }
      const ticket = await storage.createSupportTicket({
        ...ticketData,
        userId
      });
      res.json({
        message: "Support ticket submitted successfully",
        ticket: {
          id: ticket.id,
          issueType: ticket.issueType,
          status: ticket.status,
          createdAt: ticket.createdAt
        }
      });
    } catch (error) {
      console.error("Submit support ticket error:", error);
      res.status(500).json({ message: "Failed to submit support ticket" });
    }
  });
  app2.get("/api/support/tickets", async (req, res) => {
    try {
      const userId = req.session?.user?.id;
      if (!userId) {
        return res.status(401).json({ message: "Authentication required" });
      }
      const tickets = await storage.getSupportTicketsByUserId(userId);
      res.json({ tickets });
    } catch (error) {
      console.error("Get user tickets error:", error);
      res.status(500).json({ message: "Failed to fetch support tickets" });
    }
  });
  app2.get("/api/admin/support/tickets", requireAdminAuth, async (req, res) => {
    try {
      const { status, priority, page, limit } = req.query;
      const result = await storage.getAllSupportTickets({
        status,
        priority,
        page: page ? parseInt(page) : void 0,
        limit: limit ? parseInt(limit) : void 0
      });
      res.json(result);
    } catch (error) {
      console.error("Get admin tickets error:", error);
      res.status(500).json({ message: "Failed to fetch support tickets" });
    }
  });
  app2.get("/api/admin/support/tickets/:id", requireAdminAuth, async (req, res) => {
    try {
      const ticket = await storage.getSupportTicket(req.params.id);
      if (!ticket) {
        return res.status(404).json({ message: "Support ticket not found" });
      }
      res.json({ ticket });
    } catch (error) {
      console.error("Get ticket error:", error);
      res.status(500).json({ message: "Failed to fetch support ticket" });
    }
  });
  app2.put("/api/admin/support/tickets/:id", requireAdminAuth, async (req, res) => {
    try {
      const { status, priority, adminNotes } = req.body;
      const updates = {};
      if (status) updates.status = status;
      if (priority) updates.priority = priority;
      if (adminNotes) updates.adminNotes = adminNotes;
      if (status === "resolved") updates.resolvedAt = /* @__PURE__ */ new Date();
      const ticket = await storage.updateSupportTicket(req.params.id, updates);
      if (!ticket) {
        return res.status(404).json({ message: "Support ticket not found" });
      }
      await storage.createAdminLog({
        adminId: req.session?.admin?.id || null,
        action: "update_support_ticket",
        details: `Admin updated support ticket ${req.params.id} - Status: ${status}`,
        targetId: req.params.id
      });
      res.json({
        message: "Support ticket updated successfully",
        ticket
      });
    } catch (error) {
      console.error("Update ticket error:", error);
      res.status(500).json({ message: "Failed to update support ticket" });
    }
  });
  app2.delete("/api/admin/support/tickets/:id", requireAdminAuth, async (req, res) => {
    try {
      const ticket = await storage.getSupportTicket(req.params.id);
      if (!ticket) {
        return res.status(404).json({ message: "Support ticket not found" });
      }
      await storage.deleteSupportTicket(req.params.id);
      await storage.createAdminLog({
        adminId: req.session?.admin?.id || null,
        action: "delete_support_ticket",
        details: `Admin deleted support ticket ${req.params.id}`,
        targetId: req.params.id
      });
      res.json({
        message: "Support ticket deleted successfully"
      });
    } catch (error) {
      console.error("Delete ticket error:", error);
      res.status(500).json({ message: "Failed to delete support ticket" });
    }
  });
  app2.post("/api/admin/cleanup-ticket-notifications", requireAdminAuth, async (req, res) => {
    try {
      const allUsers = await storage.getAllUsers();
      let deletedCount = 0;
      for (const user of allUsers) {
        const notifications2 = await storage.getNotificationsByUserId(user.id);
        for (const notification of notifications2) {
          const isTicketNotification = notification.title.toLowerCase().includes("ticket") || notification.title.toLowerCase().includes("support") || notification.message.toLowerCase().includes("ticket") || notification.message.toLowerCase().includes("support") || notification.metadata && typeof notification.metadata === "object" && notification.metadata?.type === "ticket" || notification.actionUrl && notification.actionUrl.includes("ticket");
          if (isTicketNotification) {
            await storage.deleteNotification(notification.id);
            deletedCount++;
          }
        }
      }
      const globalNotifications = await storage.getGlobalNotifications();
      for (const notification of globalNotifications) {
        const isTicketNotification = notification.title.toLowerCase().includes("ticket") || notification.title.toLowerCase().includes("support") || notification.message.toLowerCase().includes("ticket") || notification.message.toLowerCase().includes("support") || notification.metadata && typeof notification.metadata === "object" && notification.metadata?.type === "ticket" || notification.actionUrl && notification.actionUrl.includes("ticket");
        if (isTicketNotification) {
          await storage.deleteNotification(notification.id);
          deletedCount++;
        }
      }
      await storage.createAdminLog({
        adminId: req.session?.admin?.id || null,
        action: "cleanup_ticket_notifications",
        details: `Admin cleaned up ${deletedCount} ticket-related notifications`,
        targetId: null
      });
      res.json({
        message: `Successfully deleted ${deletedCount} ticket-related notifications`,
        deletedCount
      });
    } catch (error) {
      console.error("Cleanup ticket notifications error:", error);
      res.status(500).json({ message: "Failed to cleanup ticket notifications" });
    }
  });
  app2.put("/api/admin/support/tickets/:id/assign", requireAdminAuth, async (req, res) => {
    try {
      const { adminId } = req.body;
      const ticket = await storage.assignSupportTicket(req.params.id, adminId);
      if (!ticket) {
        return res.status(404).json({ message: "Support ticket not found" });
      }
      await storage.createAdminLog({
        adminId: req.session?.admin?.id || null,
        action: "assign_support_ticket",
        details: `Admin assigned support ticket ${req.params.id} to admin ${adminId}`,
        targetId: req.params.id
      });
      res.json({
        message: "Support ticket assigned successfully",
        ticket
      });
    } catch (error) {
      console.error("Assign ticket error:", error);
      res.status(500).json({ message: "Failed to assign support ticket" });
    }
  });
  app2.delete("/api/admin/users/:id", requireAdminAuth, async (req, res) => {
    try {
      const { id } = req.params;
      const adminId = req.session?.admin?.id;
      const user = await storage.getUser(id);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      const userConversations = await storage.getConversationsByUserId(id);
      for (const conversation of userConversations) {
        const messages2 = await storage.getMessagesByConversationId(conversation.id);
        for (const message of messages2) {
          await storage.deleteMessage(message.id);
        }
        await storage.deleteConversation(conversation.id);
      }
      await storage.deleteUser(id);
      await storage.createAdminLog({
        adminId,
        action: "delete_user",
        details: `Admin deleted user ${user.email} (${user.fullName}) and all associated data`,
        targetId: id
      });
      res.json({ message: "User and all associated data deleted successfully" });
    } catch (error) {
      console.error("Delete user error:", error);
      res.status(500).json({ message: "Failed to delete user" });
    }
  });
  app2.delete("/api/admin/messages/:id", requireAdminAuth, async (req, res) => {
    try {
      const { id } = req.params;
      const adminId = req.session?.admin?.id;
      const message = await storage.getMessage(id);
      if (!message) {
        return res.status(404).json({ message: "Message not found" });
      }
      await storage.deleteMessage(id);
      await storage.createAdminLog({
        adminId,
        action: "delete_message",
        details: `Admin deleted message in conversation ${message.conversationId}`,
        targetId: id
      });
      res.json({ message: "Message deleted successfully" });
    } catch (error) {
      console.error("Delete message error:", error);
      res.status(500).json({ message: "Failed to delete message" });
    }
  });
  app2.delete("/api/admin/conversations/:id", requireAdminAuth, async (req, res) => {
    try {
      const { id } = req.params;
      const adminId = req.session?.admin?.id;
      const conversation = await storage.getConversation(id);
      if (!conversation) {
        return res.status(404).json({ message: "Conversation not found" });
      }
      const messages2 = await storage.getMessagesByConversationId(id);
      for (const message of messages2) {
        await storage.deleteMessage(message.id);
      }
      await storage.deleteConversation(id);
      await storage.createAdminLog({
        adminId,
        action: "delete_conversation",
        details: `Admin deleted conversation and ${messages2.length} messages for user ${conversation.userId}`,
        targetId: id
      });
      res.json({ message: "Conversation and all messages deleted successfully" });
    } catch (error) {
      console.error("Delete conversation error:", error);
      res.status(500).json({ message: "Failed to delete conversation" });
    }
  });
  app2.get("/api/admin/conversations", requireAdminAuth, async (req, res) => {
    try {
      const conversations2 = await storage.getAllActiveConversations();
      const conversationsWithDetails = await Promise.all(
        conversations2.map(async (conversation) => {
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
      console.error("Get admin conversations error:", error);
      res.status(500).json({ message: "Failed to fetch conversations" });
    }
  });
  app2.put("/api/admin/conversations/:id/assign", requireAdminAuth, async (req, res) => {
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
      await storage.createAdminLog({
        adminId: req.session?.admin?.id || null,
        action: "assign_conversation",
        details: `Admin assigned conversation ${conversationId} to admin ${adminId}`,
        targetId: conversationId
      });
      res.json({
        message: "Conversation assigned successfully",
        conversation
      });
    } catch (error) {
      console.error("Assign conversation error:", error);
      res.status(500).json({ message: "Failed to assign conversation" });
    }
  });
  app2.put("/api/admin/users/:id/balance", async (req, res) => {
    try {
      const user = await storage.getUser(req.params.id);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      const { amount, type, details, currency } = req.body;
      const targetCurrency = currency?.toUpperCase() || "USD";
      const isKes = targetCurrency === "KES";
      const currentBalance = parseFloat(isKes ? user.kesBalance || "0" : user.balance || "0");
      const updateAmount = parseFloat(amount);
      let newBalance;
      let transactionType;
      switch (type) {
        case "add":
          newBalance = currentBalance + updateAmount;
          transactionType = "deposit";
          break;
        case "subtract":
          newBalance = Math.max(0, currentBalance - updateAmount);
          transactionType = "send";
          break;
        case "set":
          newBalance = updateAmount;
          transactionType = updateAmount > currentBalance ? "deposit" : "send";
          break;
        default:
          return res.status(400).json({ error: "Invalid update type" });
      }
      const balanceUpdate = isKes ? { kesBalance: newBalance.toFixed(2) } : { balance: newBalance.toFixed(2) };
      const updatedUser = await storage.updateUser(req.params.id, balanceUpdate);
      const transactionAmount = type === "set" ? Math.abs(newBalance - currentBalance) : updateAmount;
      const transactionData = {
        userId: req.params.id,
        type: transactionType,
        amount: transactionAmount.toFixed(2),
        currency: targetCurrency,
        status: "completed",
        description: details || `Admin ${type} ${targetCurrency} balance adjustment`,
        recipientId: null,
        recipientName: "System Admin",
        fee: "0.00",
        exchangeRate: 1,
        sourceAmount: transactionAmount.toFixed(2),
        sourceCurrency: targetCurrency
      };
      await storage.createTransaction(transactionData);
      res.json({ user: updatedUser, newBalance, currency: targetCurrency });
    } catch (error) {
      console.error("Admin balance update error:", error);
      res.status(500).json({ error: "Failed to update user balance" });
    }
  });
  app2.put("/api/admin/users/:id/card/:action", async (req, res) => {
    try {
      const user = await storage.getUser(req.params.id);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      const { action } = req.params;
      let updateData = {};
      switch (action) {
        case "issue":
          updateData = { hasVirtualCard: true, cardStatus: "active" };
          const cardData = {
            userId: req.params.id,
            cardNumber: `4567${Math.random().toString().slice(2, 14)}`,
            expiryMonth: String((/* @__PURE__ */ new Date()).getMonth() + 1).padStart(2, "0"),
            expiryYear: String((/* @__PURE__ */ new Date()).getFullYear() + 5).slice(-2),
            cvv: Math.floor(Math.random() * 900 + 100).toString(),
            cardholderName: user.fullName || user.username,
            status: "active",
            balance: "0.00",
            cardType: "virtual",
            provider: "Mastercard",
            currency: user.defaultCurrency || "USD",
            pin: Math.floor(Math.random() * 9e3 + 1e3).toString()
          };
          try {
            await storage.createVirtualCard(cardData);
          } catch (error) {
            console.error("Error creating virtual card:", error);
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
      console.error("Admin card management error:", error);
      res.status(500).json({ error: "Failed to update card status" });
    }
  });
  app2.put("/api/admin/users/:id/virtual-card", async (req, res) => {
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
          result = await storage.createVirtualCard({
            userId: id,
            purchaseAmount: "60.00"
          });
          await storage.updateUser(id, { hasVirtualCard: true });
          const { messagingService: issueMessaging } = await Promise.resolve().then(() => (init_messaging(), messaging_exports));
          const cardLastFour = result.cardNumber.slice(-4);
          issueMessaging.sendCardActivation(user.phone, cardLastFour).catch((err) => console.error("Card activation notification error:", err));
          break;
        case "activate":
        case "freeze":
          const card = await storage.getVirtualCardByUserId(id);
          if (!card) {
            return res.status(404).json({ error: "Virtual card not found" });
          }
          if (card.status === "inactive" && action === "activate") {
            return res.status(400).json({
              error: "Cannot reactivate an inactive card. User must purchase a new card.",
              requiresPurchase: true
            });
          }
          const newStatus = action === "activate" ? "active" : "frozen";
          result = await storage.updateVirtualCard(card.id, { status: newStatus });
          if (action === "activate") {
            const { messagingService: activateMessaging } = await Promise.resolve().then(() => (init_messaging(), messaging_exports));
            const activateCardLastFour = card.cardNumber.slice(-4);
            activateMessaging.sendCardActivation(user.phone, activateCardLastFour).catch((err) => console.error("Card activation notification error:", err));
          }
          await storage.createAdminLog({
            adminId: req.session.admin?.id || null,
            action: `virtual_card_${action}`,
            details: `Admin ${action}d virtual card for user: ${user.email}`,
            targetId: id
          });
          break;
        case "inactive":
          const inactiveCard = await storage.getVirtualCardByUserId(id);
          if (!inactiveCard) {
            return res.status(404).json({ error: "Virtual card not found" });
          }
          result = await storage.updateVirtualCard(inactiveCard.id, { status: "inactive" });
          await storage.updateUser(id, { hasVirtualCard: false });
          await storage.createAdminLog({
            adminId: req.session.admin?.id || null,
            action: "virtual_card_deactivate",
            details: `Admin permanently deactivated virtual card for user: ${user.email}. User must purchase new card to reactivate.`,
            targetId: id
          });
          break;
        default:
          return res.status(400).json({ error: "Invalid action" });
      }
      res.json({ success: true, result });
    } catch (error) {
      console.error("Virtual card update error:", error);
      res.status(500).json({ error: "Failed to update virtual card" });
    }
  });
  app2.get("/api/admin/kyc", async (req, res) => {
    try {
      const kycDocuments2 = await storage.getAllKycDocuments();
      res.json({ kycDocuments: kycDocuments2 });
    } catch (error) {
      console.error("KYC fetch error:", error);
      res.status(500).json({ message: "Failed to fetch KYC documents" });
    }
  });
  app2.put("/api/admin/kyc/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const { status, verificationNotes } = req.body;
      const updatedKyc = await storage.updateKycDocument(id, {
        status,
        verificationNotes,
        verifiedAt: status === "verified" ? /* @__PURE__ */ new Date() : null
      });
      if (!updatedKyc) {
        return res.status(404).json({ message: "KYC document not found" });
      }
      res.json({ kycDocument: updatedKyc });
    } catch (error) {
      console.error("KYC update error:", error);
      res.status(500).json({ message: "Failed to update KYC document" });
    }
  });
  app2.get("/api/admin/transactions", async (req, res) => {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 20;
      const status = req.query.status;
      const result = await storage.getAllTransactions({ status, page, limit });
      res.json(result);
    } catch (error) {
      console.error("Transactions fetch error:", error);
      res.status(500).json({ message: "Failed to fetch transactions" });
    }
  });
  app2.put("/api/admin/transactions/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const updates = req.body;
      const updatedTransaction = await storage.updateTransaction(id, updates);
      if (!updatedTransaction) {
        return res.status(404).json({ message: "Transaction not found" });
      }
      res.json({ transaction: updatedTransaction });
    } catch (error) {
      console.error("Transaction update error:", error);
      res.status(500).json({ message: "Failed to update transaction" });
    }
  });
  app2.put("/api/admin/transactions/:id/date", async (req, res) => {
    try {
      const { id } = req.params;
      const { createdAt } = req.body;
      if (!createdAt) {
        return res.status(400).json({ message: "createdAt is required" });
      }
      const updatedTransaction = await storage.updateTransaction(id, {
        createdAt: new Date(createdAt),
        updatedAt: /* @__PURE__ */ new Date()
      });
      if (!updatedTransaction) {
        return res.status(404).json({ message: "Transaction not found" });
      }
      res.json({ transaction: updatedTransaction });
    } catch (error) {
      console.error("Transaction date update error:", error);
      res.status(500).json({ message: "Failed to update transaction date" });
    }
  });
  app2.get("/api/admin/virtual-cards", async (req, res) => {
    try {
      const virtualCards2 = await storage.getAllVirtualCards();
      res.json({ virtualCards: virtualCards2 });
    } catch (error) {
      console.error("Virtual cards fetch error:", error);
      res.status(500).json({ message: "Failed to fetch virtual cards" });
    }
  });
  app2.put("/api/admin/virtual-cards/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const updates = req.body;
      const updatedCard = await storage.updateVirtualCard(id, updates);
      if (!updatedCard) {
        return res.status(404).json({ message: "Virtual card not found" });
      }
      res.json({ virtualCard: updatedCard });
    } catch (error) {
      console.error("Virtual card update error:", error);
      res.status(500).json({ message: "Failed to update virtual card" });
    }
  });
  app2.get("/api/admin/settings", async (req, res) => {
    try {
      const settings = await storage.getSystemSettings();
      res.json({ settings });
    } catch (error) {
      console.error("Settings fetch error:", error);
      res.status(500).json({ message: "Failed to fetch system settings" });
    }
  });
  app2.put("/api/admin/settings/:key", async (req, res) => {
    try {
      const { key } = req.params;
      const { value } = req.body;
      const updatedSetting = await storage.updateSystemSetting(key, value);
      if (!updatedSetting) {
        return res.status(404).json({ message: "Setting not found" });
      }
      res.json({ setting: updatedSetting });
    } catch (error) {
      console.error("Setting update error:", error);
      res.status(500).json({ message: "Failed to update setting" });
    }
  });
  app2.post("/api/admin/settings", async (req, res) => {
    try {
      const settingData = req.body;
      const newSetting = await storage.createSystemSetting(settingData);
      res.json({ setting: newSetting });
    } catch (error) {
      console.error("Setting creation error:", error);
      res.status(500).json({ message: "Failed to create setting" });
    }
  });
  app2.get("/api/admin/api-configurations", requireAdminAuth, async (req, res) => {
    try {
      const configurations = await storage.getAllApiConfigurations();
      res.json({ configurations });
    } catch (error) {
      console.error("API configurations fetch error:", error);
      res.status(500).json({ message: "Failed to fetch API configurations" });
    }
  });
  app2.get("/api/admin/api-configurations/:provider", requireAdminAuth, async (req, res) => {
    try {
      const { provider } = req.params;
      const configuration = await storage.getApiConfiguration(provider);
      if (!configuration) {
        return res.status(404).json({ message: "Configuration not found" });
      }
      res.json({ configuration });
    } catch (error) {
      console.error("API configuration fetch error:", error);
      res.status(500).json({ message: "Failed to fetch API configuration" });
    }
  });
  app2.post("/api/admin/api-configurations", requireAdminAuth, async (req, res) => {
    try {
      const configData = req.body;
      const configuration = await storage.createApiConfiguration(configData);
      res.json({ configuration, message: "API configuration created successfully" });
    } catch (error) {
      console.error("API configuration creation error:", error);
      res.status(500).json({ message: "Failed to create API configuration" });
    }
  });
  app2.put("/api/admin/api-configurations/:provider", requireAdminAuth, async (req, res) => {
    try {
      const { provider } = req.params;
      const updates = req.body;
      const configuration = await storage.updateApiConfiguration(provider, updates);
      if (!configuration) {
        return res.status(404).json({ message: "Configuration not found" });
      }
      res.json({ configuration, message: "API configuration updated successfully" });
    } catch (error) {
      console.error("API configuration update error:", error);
      res.status(500).json({ message: "Failed to update API configuration" });
    }
  });
  app2.delete("/api/admin/api-configurations/:provider", requireAdminAuth, async (req, res) => {
    try {
      const { provider } = req.params;
      await storage.deleteApiConfiguration(provider);
      res.json({ message: "API configuration deleted successfully" });
    } catch (error) {
      console.error("API configuration deletion error:", error);
      res.status(500).json({ message: "Failed to delete API configuration" });
    }
  });
  app2.get("/api/users/:id", async (req, res) => {
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
  app2.get("/api/users/:id/login-history", async (req, res) => {
    try {
      const { id } = req.params;
      const limit = req.query.limit ? parseInt(req.query.limit) : 10;
      const history = await storage.getLoginHistoryByUserId(id, limit);
      res.json({ loginHistory: history });
    } catch (error) {
      console.error("Error retrieving login history:", error);
      res.status(500).json({ error: "Failed to retrieve login history" });
    }
  });
  app2.get("/api/analytics/:userId/spending", async (req, res) => {
    try {
      const { userId } = req.params;
      const { period = "month" } = req.query;
      const transactions2 = await storage.getTransactionsByUserId(userId);
      const now = /* @__PURE__ */ new Date();
      let startDate;
      switch (period) {
        case "week":
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1e3);
          break;
        case "month":
          startDate = new Date(now.getFullYear(), now.getMonth(), 1);
          break;
        case "year":
          startDate = new Date(now.getFullYear(), 0, 1);
          break;
        default:
          startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1e3);
      }
      const filteredTransactions = transactions2.filter(
        (tx) => new Date(tx.createdAt) >= startDate && tx.status === "completed"
      );
      const spending = filteredTransactions.filter((tx) => tx.type === "send").reduce((sum2, tx) => sum2 + parseFloat(tx.amount), 0);
      const income = filteredTransactions.filter((tx) => tx.type === "receive").reduce((sum2, tx) => sum2 + parseFloat(tx.amount), 0);
      const categorySpending = filteredTransactions.filter((tx) => tx.type === "send").reduce((acc, tx) => {
        const category = tx.description?.includes("Virtual Card") ? "Virtual Card" : tx.description?.includes("Transfer") ? "Transfer" : tx.description?.includes("Payment") ? "Payment" : "Other";
        acc[category] = (acc[category] || 0) + parseFloat(tx.amount);
        return acc;
      }, {});
      const dailySpending = filteredTransactions.filter((tx) => tx.type === "send").reduce((acc, tx) => {
        const day = new Date(tx.createdAt).toISOString().split("T")[0];
        acc[day] = (acc[day] || 0) + parseFloat(tx.amount);
        return acc;
      }, {});
      res.json({
        period,
        totalSpending: spending,
        totalIncome: income,
        netFlow: income - spending,
        transactionCount: filteredTransactions.length,
        categoryBreakdown: categorySpending,
        dailySpending,
        averageTransaction: filteredTransactions.length > 0 ? (spending + income) / filteredTransactions.length : 0
      });
    } catch (error) {
      console.error("Analytics error:", error);
      res.status(500).json({ message: "Failed to fetch analytics" });
    }
  });
  app2.post("/api/payment-requests", async (req, res) => {
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
      await notificationService.sendPaymentRequestNotification(toUserId, fromUserId, amount, currency);
      res.json({ paymentRequest });
    } catch (error) {
      console.error("Payment request creation error:", error);
      res.status(500).json({ message: "Failed to create payment request" });
    }
  });
  app2.get("/api/payment-requests/:userId", async (req, res) => {
    try {
      const { userId } = req.params;
      const { type = "all" } = req.query;
      const allRequests = await storage.getPaymentRequestsByUserId(userId);
      let filteredRequests = allRequests;
      if (type === "sent") {
        filteredRequests = allRequests.filter((req2) => req2.fromUserId === userId);
      } else if (type === "received") {
        filteredRequests = allRequests.filter((req2) => req2.toUserId === userId);
      }
      res.json({ paymentRequests: filteredRequests });
    } catch (error) {
      console.error("Payment requests fetch error:", error);
      res.status(500).json({ message: "Failed to fetch payment requests" });
    }
  });
  app2.put("/api/payment-requests/:id/:action", async (req, res) => {
    try {
      const { id, action } = req.params;
      const { userId } = req.body;
      const paymentRequest = await storage.getPaymentRequest(id);
      if (!paymentRequest) {
        return res.status(404).json({ message: "Payment request not found" });
      }
      if (action === "accept" && paymentRequest.toUserId === userId) {
        const recipient = await storage.getUser(paymentRequest.toUserId);
        const sender = await storage.getUser(paymentRequest.fromUserId);
        if (!recipient || !sender) {
          return res.status(404).json({ message: "User not found" });
        }
        const recipientBalance = parseFloat(recipient.balance || "0");
        const amount = parseFloat(paymentRequest.amount);
        if (recipientBalance < amount) {
          return res.status(400).json({ message: "Insufficient balance" });
        }
        await storage.updateUser(recipient.id, {
          balance: (recipientBalance - amount).toFixed(2)
        });
        await storage.updateUser(sender.id, {
          balance: (parseFloat(sender.balance || "0") + amount).toFixed(2)
        });
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
        await storage.updatePaymentRequest(id, { status: "completed" });
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
      console.error("Payment request action error:", error);
      res.status(500).json({ message: "Failed to process payment request" });
    }
  });
  app2.post("/api/savings-goals", async (req, res) => {
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
      console.error("Savings goal creation error:", error);
      res.status(500).json({ message: "Failed to create savings goal" });
    }
  });
  app2.get("/api/savings-goals/:userId", async (req, res) => {
    try {
      const savingsGoals2 = await storage.getSavingsGoalsByUserId(req.params.userId);
      res.json({ savingsGoals: savingsGoals2 });
    } catch (error) {
      console.error("Savings goals fetch error:", error);
      res.status(500).json({ message: "Failed to fetch savings goals" });
    }
  });
  app2.put("/api/savings-goals/:id/contribute", async (req, res) => {
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
      await storage.updateUser(userId, {
        balance: (userBalance - contributionAmount).toFixed(2)
      });
      const newAmount = parseFloat(savingsGoal.currentAmount || "0") + contributionAmount;
      await storage.updateSavingsGoal(id, {
        currentAmount: newAmount.toFixed(2)
      });
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
      console.error("Savings contribution error:", error);
      res.status(500).json({ message: "Failed to add contribution" });
    }
  });
  app2.post("/api/qr-payments/generate", async (req, res) => {
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
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1e3)
        // 24 hours
      });
      res.json({ qrPayment, paymentCode });
    } catch (error) {
      console.error("QR payment generation error:", error);
      res.status(500).json({ message: "Failed to generate QR payment" });
    }
  });
  app2.post("/api/qr-payments/process", async (req, res) => {
    try {
      const { paymentCode, payerUserId } = req.body;
      const qrPayment = await storage.getQRPaymentByCode(paymentCode);
      if (!qrPayment || !qrPayment.isActive || /* @__PURE__ */ new Date() > new Date(qrPayment.expiresAt)) {
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
      await storage.updateUser(payerUserId, {
        balance: (payerBalance - amount).toFixed(2)
      });
      await storage.updateUser(recipient.id, {
        balance: (parseFloat(recipient.balance || "0") + amount).toFixed(2)
      });
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
      await storage.updateQRPayment(qrPayment.id, { isActive: false });
      res.json({ message: "Payment processed successfully" });
    } catch (error) {
      console.error("QR payment processing error:", error);
      res.status(500).json({ message: "Failed to process QR payment" });
    }
  });
  app2.get("/api/admin/payhero-settings", async (req, res) => {
    try {
      const channelIdSetting = await storage.getSystemSetting("payhero", "channel_id");
      const providerSetting = await storage.getSystemSetting("payhero", "provider");
      const cardPriceSetting = await storage.getSystemSetting("virtual_card", "price");
      const channelId = channelIdSetting?.value ? (typeof channelIdSetting.value === "string" ? channelIdSetting.value : JSON.stringify(channelIdSetting.value)).replace(/"/g, "") : "3407";
      const settings = {
        channelId,
        provider: providerSetting?.value || "m-pesa",
        cardPrice: cardPriceSetting?.value || "60.00",
        username: process.env.PAYHERO_USERNAME ? "****" : "",
        password: process.env.PAYHERO_PASSWORD ? "****" : ""
      };
      res.json(settings);
    } catch (error) {
      console.error("Error fetching PayHero settings:", error);
      res.status(500).json({ message: "Error fetching PayHero settings" });
    }
  });
  app2.put("/api/admin/payhero-settings", async (req, res) => {
    try {
      const { channelId, provider, cardPrice } = req.body;
      console.log("Admin updated PayHero settings:", { channelId, provider, cardPrice });
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
      payHeroService.updateSettings(parseInt(channelId));
      res.json({
        success: true,
        message: "PayHero settings updated successfully",
        channelId,
        provider,
        cardPrice
      });
    } catch (error) {
      console.error("Error updating PayHero settings:", error);
      res.status(500).json({ message: "Error updating PayHero settings" });
    }
  });
  app2.post("/api/admin/test-payhero", async (req, res) => {
    try {
      const { amount, phone, reference } = req.body;
      console.log("Admin testing PayHero connection:", { amount, phone, reference });
      const testResult = await payHeroService.initiateMpesaPayment(
        amount || 1,
        phone || "0700000000",
        reference || `TEST-${Date.now()}`,
        "Test User",
        null
        // No callback for test
      );
      res.json({
        success: testResult.success,
        status: testResult.status,
        reference: testResult.reference,
        message: testResult.success ? "PayHero connection test successful" : `Connection test failed: ${testResult.status}`
      });
    } catch (error) {
      console.error("PayHero connection test error:", error);
      res.status(500).json({
        success: false,
        message: "Connection test failed: " + error.message
      });
    }
  });
  app2.get("/api/admin/manual-payment-settings", async (req, res) => {
    try {
      const paybillSetting = await storage.getSystemSetting("manual_mpesa", "paybill");
      const accountSetting = await storage.getSystemSetting("manual_mpesa", "account");
      const settings = {
        paybill: paybillSetting?.value || "247",
        account: accountSetting?.value || "4664"
      };
      res.json(settings);
    } catch (error) {
      console.error("Error fetching manual payment settings:", error);
      res.status(500).json({ message: "Error fetching manual payment settings" });
    }
  });
  app2.put("/api/admin/manual-payment-settings", async (req, res) => {
    try {
      const { paybill, account } = req.body;
      console.log("Admin updated manual M-Pesa payment settings:", { paybill, account });
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
      console.error("Error updating manual payment settings:", error);
      res.status(500).json({ message: "Error updating manual payment settings" });
    }
  });
  app2.get("/api/manual-payment-settings", async (req, res) => {
    try {
      const paybillSetting = await storage.getSystemSetting("manual_mpesa", "paybill");
      const accountSetting = await storage.getSystemSetting("manual_mpesa", "account");
      res.json({
        paybill: paybillSetting?.value || "247",
        account: accountSetting?.value || "4664"
      });
    } catch (error) {
      console.error("Error fetching manual payment settings:", error);
      res.status(500).json({ message: "Error fetching manual payment settings" });
    }
  });
  app2.get("/api/admin/messaging-settings", async (req, res) => {
    try {
      const apiKeySetting = await storage.getSystemSetting("messaging", "api_key");
      const emailSetting = await storage.getSystemSetting("messaging", "account_email");
      const senderIdSetting = await storage.getSystemSetting("messaging", "sender_id");
      const whatsappAccessTokenSetting = await storage.getSystemSetting("messaging", "whatsapp_access_token");
      const whatsappPhoneNumberIdSetting = await storage.getSystemSetting("messaging", "whatsapp_phone_number_id");
      const settings = {
        apiKey: apiKeySetting?.value || "",
        accountEmail: emailSetting?.value || "",
        senderId: senderIdSetting?.value || "",
        whatsappAccessToken: whatsappAccessTokenSetting?.value || "",
        whatsappPhoneNumberId: whatsappPhoneNumberIdSetting?.value || ""
      };
      res.json(settings);
    } catch (error) {
      console.error("Error fetching messaging settings:", error);
      res.status(500).json({ message: "Error fetching messaging settings" });
    }
  });
  app2.put("/api/admin/messaging-settings", async (req, res) => {
    try {
      const { apiKey, accountEmail, senderId, whatsappAccessToken, whatsappPhoneNumberId } = req.body;
      console.log("Admin updated messaging settings (SMS via TalkNTalk, WhatsApp via Meta)");
      await storage.setSystemSetting({
        category: "messaging",
        key: "api_key",
        value: (apiKey || "").trim(),
        description: "TalkNTalk API key for SMS"
      });
      await storage.setSystemSetting({
        category: "messaging",
        key: "account_email",
        value: (accountEmail || "").trim(),
        description: "TalkNTalk account email"
      });
      await storage.setSystemSetting({
        category: "messaging",
        key: "sender_id",
        value: (senderId || "").trim(),
        description: "SMS sender ID"
      });
      await storage.setSystemSetting({
        category: "messaging",
        key: "whatsapp_access_token",
        value: (whatsappAccessToken || "").trim(),
        description: "Meta WhatsApp Business API access token"
      });
      await storage.setSystemSetting({
        category: "messaging",
        key: "whatsapp_phone_number_id",
        value: (whatsappPhoneNumberId || "").trim(),
        description: "Meta WhatsApp Business phone number ID"
      });
      process.env.WHATSAPP_ACCESS_TOKEN = (whatsappAccessToken || "").trim();
      process.env.WHATSAPP_PHONE_NUMBER_ID = (whatsappPhoneNumberId || "").trim();
      res.json({
        success: true,
        message: "Messaging settings updated successfully"
      });
    } catch (error) {
      console.error("Error updating messaging settings:", error);
      res.status(500).json({ message: "Error updating messaging settings" });
    }
  });
  app2.post("/api/admin/send-message", async (req, res) => {
    try {
      const { userId, message } = req.body;
      if (!userId || !message) {
        return res.status(400).json({ message: "User ID and message are required" });
      }
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      const { messagingService: messagingService2 } = await Promise.resolve().then(() => (init_messaging(), messaging_exports));
      const result = await messagingService2.sendMessage(user.phone, message);
      console.log(`Admin sent message to ${user.fullName} (${user.phone}):`, { sms: result.sms, whatsapp: result.whatsapp });
      res.json({
        success: true,
        message: "Message sent successfully",
        sms: result.sms,
        whatsapp: result.whatsapp
      });
    } catch (error) {
      console.error("Error sending message:", error);
      res.status(500).json({ message: "Error sending message" });
    }
  });
  app2.get("/api/admin/email-settings", requireAdminAuth, async (req, res) => {
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
        fromName: fromNameSetting?.value || "GreenPay"
      };
      res.json(settings);
    } catch (error) {
      console.error("Error fetching email settings:", error);
      res.status(500).json({ message: "Error fetching email settings" });
    }
  });
  app2.put("/api/admin/email-settings", requireAdminAuth, async (req, res) => {
    try {
      const { smtpHost, smtpPort, smtpSecure, smtpUsername, smtpPassword, fromEmail, fromName } = req.body;
      console.log("Admin updated email settings");
      await storage.setSystemSetting({
        category: "email",
        key: "smtp_host",
        value: (smtpHost || "").trim(),
        description: "SMTP server hostname"
      });
      await storage.setSystemSetting({
        category: "email",
        key: "smtp_port",
        value: (smtpPort || "465").toString(),
        description: "SMTP server port"
      });
      await storage.setSystemSetting({
        category: "email",
        key: "smtp_secure",
        value: smtpSecure ? "true" : "false",
        description: "Use SSL/TLS for SMTP"
      });
      await storage.setSystemSetting({
        category: "email",
        key: "smtp_username",
        value: (smtpUsername || "").trim(),
        description: "SMTP username"
      });
      await storage.setSystemSetting({
        category: "email",
        key: "smtp_password",
        value: (smtpPassword || "").trim(),
        description: "SMTP password"
      });
      await storage.setSystemSetting({
        category: "email",
        key: "from_email",
        value: (fromEmail || "").trim(),
        description: "From email address"
      });
      await storage.setSystemSetting({
        category: "email",
        key: "from_name",
        value: (fromName || "GreenPay").trim(),
        description: "From name"
      });
      res.json({
        success: true,
        message: "Email settings updated successfully"
      });
    } catch (error) {
      console.error("Error updating email settings:", error);
      res.status(500).json({ message: "Error updating email settings" });
    }
  });
  app2.post("/api/admin/send-test-email", requireAdminAuth, async (req, res) => {
    try {
      const { email } = req.body;
      if (!email) {
        return res.status(400).json({ message: "Email address is required" });
      }
      const { emailService: emailService2 } = await Promise.resolve().then(() => (init_email(), email_exports));
      const result = await emailService2.sendTestEmail(email);
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
      console.error("Error sending test email:", error);
      res.status(500).json({ message: "Error sending test email" });
    }
  });
  app2.post("/api/admin/send-custom-email", requireAdminAuth, async (req, res) => {
    try {
      const { email, subject, message, imageUrl, linkText, linkUrl } = req.body;
      if (!email || !subject || !message) {
        return res.status(400).json({ message: "Email, subject, and message are required" });
      }
      const { emailService: emailService2 } = await Promise.resolve().then(() => (init_email(), email_exports));
      const { emailTemplates: emailTemplates2 } = await Promise.resolve().then(() => (init_email_templates(), email_templates_exports));
      const html = emailTemplates2.custom({
        message,
        imageUrl: imageUrl || void 0,
        linkText: linkText || void 0,
        linkUrl: linkUrl || void 0
      });
      const result = await emailService2.sendEmail(email, subject, html);
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
      console.error("Error sending custom email:", error);
      res.status(500).json({ message: "Error sending custom email" });
    }
  });
  app2.get("/api/users/search", requireAuth, async (req, res) => {
    try {
      const { q: searchQuery } = req.query;
      if (!searchQuery || typeof searchQuery !== "string" || searchQuery.length < 2) {
        return res.json({ users: [] });
      }
      const users2 = await storage.getAllUsers();
      const currentUserId = req.session.userId;
      console.log(`User search initiated by ${currentUserId} for query: "${searchQuery}"`);
      console.log(`Total users in database: ${users2.length}`);
      const filteredUsers = users2.filter((user) => {
        if (user.id === currentUserId || user.isAdmin) {
          return false;
        }
        const query = searchQuery.toLowerCase().trim();
        const fullName = (user.fullName || "").toLowerCase().trim();
        const email = (user.email || "").toLowerCase().trim();
        const phone = (user.phone || "").trim();
        const normalizeToStandardPhone = (p) => {
          if (!p) return "";
          const cleaned = p.replace(/[\+\-\s()]/g, "");
          if (cleaned.startsWith("254")) {
            return cleaned.substring(3);
          } else if (cleaned.startsWith("0")) {
            return cleaned.substring(1);
          }
          return cleaned;
        };
        const normalizedUserPhone = normalizeToStandardPhone(phone);
        const normalizedSearchPhone = normalizeToStandardPhone(searchQuery.trim());
        const emailMatch = email.includes(query);
        const nameMatch = fullName.includes(query) || fullName.split(" ").some((part) => part.toLowerCase().startsWith(query));
        const phoneMatch = normalizedUserPhone && normalizedSearchPhone && (normalizedUserPhone === normalizedSearchPhone || normalizedUserPhone.includes(normalizedSearchPhone) || normalizedSearchPhone.includes(normalizedUserPhone));
        return emailMatch || nameMatch || phoneMatch;
      }).slice(0, 10).map((user) => ({
        id: user.id,
        fullName: user.fullName,
        email: user.email,
        phone: user.phone
      }));
      console.log(`User search for "${searchQuery}": found ${filteredUsers.length} matching users`);
      res.json({ users: filteredUsers });
    } catch (error) {
      console.error("User search error:", error);
      res.status(500).json({ message: "Error searching users" });
    }
  });
  app2.post("/api/transfer", async (req, res) => {
    try {
      const { fromUserId, toUserId, amount, currency, description } = req.body;
      if (!fromUserId || !toUserId || !amount || !currency) {
        return res.status(400).json({ message: "Missing required fields" });
      }
      const transferAmount = parseFloat(amount);
      if (transferAmount <= 0) {
        return res.status(400).json({ message: "Invalid transfer amount" });
      }
      const fromUser = await storage.getUser(fromUserId);
      const toUser = await storage.getUser(toUserId);
      if (!fromUser || !toUser) {
        return res.status(404).json({ message: "User not found" });
      }
      const senderTransactions = await storage.getTransactionsByUserId(fromUserId);
      const senderBalance = senderTransactions.reduce((balance, txn) => {
        if (txn.status === "completed") {
          if (txn.type === "receive" || txn.type === "deposit") {
            return balance + parseFloat(txn.amount);
          } else if (txn.type === "send" || txn.type === "withdraw") {
            return balance - parseFloat(txn.amount) - parseFloat(txn.fee || "0");
          }
        }
        return balance;
      }, parseFloat(fromUser.balance || "0"));
      if (senderBalance < transferAmount) {
        return res.status(400).json({ message: "Insufficient balance" });
      }
      const now = (/* @__PURE__ */ new Date()).toISOString();
      const transferId = storage.generateTransactionReference();
      const senderTransaction = {
        id: storage.generateTransactionReference(),
        userId: fromUserId,
        type: "send",
        amount,
        currency,
        status: "completed",
        description: description || `Transfer to ${toUser.fullName}`,
        recipient: toUser.fullName,
        recipientEmail: toUser.email,
        transferId,
        createdAt: now,
        fee: "0"
        // Free transfers between GreenPay users
      };
      const recipientTransaction = {
        id: storage.generateTransactionReference(),
        userId: toUserId,
        type: "receive",
        amount,
        currency,
        status: "completed",
        description: description || `Transfer from ${fromUser.fullName}`,
        sender: fromUser.fullName,
        senderEmail: fromUser.email,
        transferId,
        createdAt: now,
        fee: "0"
      };
      await storage.createTransaction(senderTransaction);
      await storage.createTransaction(recipientTransaction);
      res.json({
        success: true,
        transferId,
        message: "Transfer completed successfully"
      });
    } catch (error) {
      console.error("Transfer error:", error);
      res.status(500).json({ message: "Error processing transfer" });
    }
  });
  app2.get("/api/notifications/:userId", async (req, res) => {
    try {
      const { userId } = req.params;
      const userNotifications = await storage.getNotificationsByUserId(userId);
      const globalNotifications = await storage.getGlobalNotifications();
      const allNotifications = [...userNotifications, ...globalNotifications].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      res.json({ notifications: allNotifications });
    } catch (error) {
      console.error("Error fetching notifications:", error);
      res.status(500).json({ message: "Error fetching notifications" });
    }
  });
  app2.post("/api/notifications/:id/read", async (req, res) => {
    try {
      const { id } = req.params;
      await storage.markNotificationAsRead(id);
      res.json({ success: true });
    } catch (error) {
      console.error("Error marking notification as read:", error);
      res.status(500).json({ message: "Error updating notification" });
    }
  });
  app2.get("/api/admin/withdrawals", async (req, res) => {
    try {
      const transactions2 = await storage.getAllTransactions();
      const withdrawals = transactions2.filter((t) => t.type === "withdraw");
      const withdrawalsWithUserInfo = await Promise.all(
        withdrawals.map(async (withdrawal) => {
          const user = await storage.getUser(withdrawal.userId);
          return {
            ...withdrawal,
            userInfo: {
              fullName: user?.fullName || "Unknown",
              email: user?.email || "Unknown",
              phone: user?.phone || "Unknown"
            }
          };
        })
      );
      res.json({ withdrawals: withdrawalsWithUserInfo });
    } catch (error) {
      console.error("Error fetching withdrawals:", error);
      res.status(500).json({ message: "Error fetching withdrawal requests" });
    }
  });
  app2.post("/api/admin/withdrawals/:id/approve", async (req, res) => {
    try {
      const { id } = req.params;
      const { adminNotes } = req.body;
      const transaction = await storage.updateTransaction(id, {
        status: "completed",
        adminNotes: adminNotes || "Approved by admin",
        processedAt: /* @__PURE__ */ new Date()
      });
      if (transaction) {
        const user = await storage.getUser(transaction.userId);
        if (user) {
          const withdrawalAmount = parseFloat(transaction.amount);
          const withdrawalFee = parseFloat(transaction.fee || "0");
          const totalDeduction = withdrawalAmount + withdrawalFee;
          const isKesWithdrawal = transaction.currency?.toUpperCase() === "KES";
          const currentBalance = parseFloat(isKesWithdrawal ? user.kesBalance || "0" : user.balance || "0");
          const newBalance = (currentBalance - totalDeduction).toFixed(2);
          const balanceUpdate = isKesWithdrawal ? { kesBalance: newBalance } : { balance: newBalance };
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
      console.error("Error approving withdrawal:", error);
      res.status(500).json({ message: "Error approving withdrawal" });
    }
  });
  app2.post("/api/admin/withdrawals/:id/reject", async (req, res) => {
    try {
      const { id } = req.params;
      const { adminNotes } = req.body;
      const transaction = await storage.updateTransaction(id, {
        status: "failed",
        adminNotes: adminNotes || "Rejected by admin",
        processedAt: /* @__PURE__ */ new Date()
      });
      if (transaction) {
        const user = await storage.getUser(transaction.userId);
        if (user) {
          await notificationService.sendNotification({
            title: "Withdrawal Rejected",
            body: `Your withdrawal request has been rejected. ${adminNotes || "Please contact support for details."}`,
            userId: user.id,
            type: "transaction"
          });
        }
      }
      res.json({ transaction, message: "Withdrawal rejected" });
    } catch (error) {
      console.error("Error rejecting withdrawal:", error);
      res.status(500).json({ message: "Error rejecting withdrawal" });
    }
  });
  app2.post("/api/admin/broadcast-notification", async (req, res) => {
    try {
      const { title, message, type, actionUrl, expiresIn } = req.body;
      if (!title || !message) {
        return res.status(400).json({ message: "Title and message are required" });
      }
      const expiresAt = expiresIn ? new Date(Date.now() + expiresIn * 60 * 1e3) : null;
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
      console.error("Error broadcasting notification:", error);
      res.status(500).json({ message: "Error broadcasting notification" });
    }
  });
  app2.get("/api/admin/notifications", async (req, res) => {
    try {
      const globalNotifications = await storage.getGlobalNotifications();
      res.json({ notifications: globalNotifications });
    } catch (error) {
      console.error("Error fetching admin notifications:", error);
      res.status(500).json({ message: "Error fetching notifications" });
    }
  });
  app2.delete("/api/admin/notifications/:id", async (req, res) => {
    try {
      const { id } = req.params;
      await storage.deleteNotification(id);
      res.json({
        success: true,
        message: "Notification deleted successfully"
      });
    } catch (error) {
      console.error("Error deleting notification:", error);
      res.status(500).json({ message: "Error deleting notification" });
    }
  });
  app2.get("/api/admin/system-logs", async (req, res) => {
    try {
      const minutes = req.query.minutes ? parseInt(req.query.minutes) : 30;
      const logs = await storage.getSystemLogs(minutes);
      res.json({ logs });
    } catch (error) {
      console.error("Error fetching system logs:", error);
      res.status(500).json({ message: "Error fetching system logs" });
    }
  });
  app2.put("/api/admin/withdrawals/:id/status", async (req, res) => {
    try {
      const { id } = req.params;
      const { status, adminNotes } = req.body;
      if (!status || !["pending", "completed", "failed"].includes(status)) {
        return res.status(400).json({ message: "Invalid status. Must be pending, completed, or failed." });
      }
      const updatedWithdrawal = await storage.updateWithdrawalRequest(id, {
        status,
        adminNotes,
        processedAt: status !== "pending" ? /* @__PURE__ */ new Date() : null
      });
      if (!updatedWithdrawal) {
        return res.status(404).json({ message: "Withdrawal request not found" });
      }
      res.json({
        withdrawal: updatedWithdrawal,
        message: `Withdrawal status updated to ${status}`
      });
    } catch (error) {
      console.error("Error updating withdrawal status:", error);
      res.status(500).json({ message: "Error updating withdrawal status" });
    }
  });
  app2.get("/api/system-settings/card-price", async (req, res) => {
    try {
      const cardPriceSetting = await storage.getSystemSetting("virtual_card", "price");
      const cardPrice = cardPriceSetting?.value || "60.00";
      res.json({ price: cardPrice });
    } catch (error) {
      console.error("Error fetching card price:", error);
      res.status(500).json({ message: "Error fetching card price" });
    }
  });
  app2.put("/api/system-settings/card-price", async (req, res) => {
    try {
      const { price } = req.body;
      if (!price || isNaN(parseFloat(price)) || parseFloat(price) <= 0) {
        return res.status(400).json({ message: "Valid price is required" });
      }
      const formattedPrice = parseFloat(price).toFixed(2);
      const existingSetting = await storage.getSystemSetting("virtual_card", "price");
      if (existingSetting) {
        await storage.updateSystemSetting(existingSetting.id, { value: formattedPrice });
      } else {
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
      console.error("Error updating card price:", error);
      res.status(500).json({ message: "Error updating card price" });
    }
  });
  app2.post("/api/convert-to-kes", async (req, res) => {
    try {
      const { usdAmount } = req.body;
      if (!usdAmount || isNaN(parseFloat(usdAmount)) || parseFloat(usdAmount) <= 0) {
        return res.status(400).json({ message: "Valid USD amount is required" });
      }
      const kesAmount = await payHeroService.convertUSDtoKES(parseFloat(usdAmount));
      res.json({
        usdAmount: parseFloat(usdAmount),
        kesAmount,
        exchangeRate: 129
      });
    } catch (error) {
      console.error("Error converting USD to KES:", error);
      res.status(500).json({ message: "Error converting currency" });
    }
  });
  app2.post("/api/admin/login-as-user", async (req, res) => {
    try {
      const { userId } = req.body;
      if (!userId) {
        return res.status(400).json({ message: "User ID is required" });
      }
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      console.log("Admin logging in as user:", user.email);
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
      console.error("Admin login as user error:", error);
      res.status(500).json({ message: "Error logging in as user" });
    }
  });
  app2.get("/api/transaction-status/:reference", async (req, res) => {
    try {
      const { reference } = req.params;
      if (!reference) {
        return res.status(400).json({ message: "Transaction reference is required" });
      }
      console.log("Checking transaction status for reference:", reference);
      const statusResult = await payHeroService.checkTransactionStatus(reference);
      res.json({
        success: statusResult.success,
        status: statusResult.status,
        data: statusResult.data,
        message: statusResult.message
      });
    } catch (error) {
      console.error("Transaction status check error:", error);
      res.status(500).json({ message: "Error checking transaction status" });
    }
  });
  app2.post("/api/transactions", async (req, res) => {
    try {
      const { userId, type, amount, currency, description, fee, recipientDetails } = req.body;
      if (type !== "withdraw") {
        return res.status(400).json({ message: "This endpoint only handles withdrawal requests" });
      }
      const withdrawAmount = parseFloat(amount);
      const withdrawFee = parseFloat(fee || "0");
      if (withdrawAmount <= 0) {
        return res.status(400).json({ message: "Invalid withdrawal amount" });
      }
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      const userTransactions = await storage.getTransactionsByUserId(userId);
      const isKesWithdrawal = currency?.toUpperCase() === "KES";
      const realTimeBalance = userTransactions.reduce((balance, txn) => {
        if (txn.status === "completed") {
          const txnCurrency = txn.currency?.toUpperCase();
          const matchesCurrency = isKesWithdrawal ? txnCurrency === "KES" : txnCurrency !== "KES";
          if (matchesCurrency) {
            if (txn.type === "receive" || txn.type === "deposit") {
              return balance + parseFloat(txn.amount);
            } else if (txn.type === "send" || txn.type === "withdraw") {
              return balance - parseFloat(txn.amount) - parseFloat(txn.fee || "0");
            }
          }
        }
        return balance;
      }, parseFloat(isKesWithdrawal ? user.kesBalance || "0" : user.balance || "0"));
      if (realTimeBalance < withdrawAmount + withdrawFee) {
        return res.status(400).json({
          message: "Insufficient balance",
          currency,
          available: realTimeBalance.toFixed(2),
          required: (withdrawAmount + withdrawFee).toFixed(2)
        });
      }
      const transaction = await storage.createTransaction({
        userId,
        type: "withdraw",
        amount,
        currency,
        status: "pending",
        // Withdrawals start as pending for admin approval
        description,
        fee: fee || "0.00",
        recipientDetails,
        reference: storage.generateTransactionReference()
      });
      await notificationService.sendNotification({
        title: "Withdrawal Request",
        body: `New withdrawal request: ${currency} ${amount} from ${user.fullName}`,
        userId,
        // This will be extended to notify admins too
        type: "transaction"
      });
      res.json({
        transaction,
        message: "Withdrawal request submitted successfully. It will be processed within 1-3 business days."
      });
    } catch (error) {
      console.error("Withdrawal error:", error);
      res.status(500).json({ message: "Error processing withdrawal request" });
    }
  });
  app2.post("/api/payhero-callback", async (req, res) => {
    try {
      console.log("PayHero callback received:", JSON.stringify(req.body, null, 2));
      const callbackData = req.body;
      const { reference, type } = req.query;
      if (!callbackData.response) {
        console.error("Invalid PayHero callback data - missing response");
        return res.status(400).json({ message: "Invalid callback data" });
      }
      const paymentResult = payHeroService.processCallback(callbackData);
      console.log("Processed payment result:", paymentResult);
      if (paymentResult.success) {
        if (type === "virtual-card") {
          let userId = null;
          let userPhone = null;
          if (callbackData.response && callbackData.response.phoneNumber) {
            userPhone = callbackData.response.phoneNumber;
          } else if (callbackData.phone) {
            userPhone = callbackData.phone;
          }
          if (userPhone) {
            const users2 = await storage.getAllUsers();
            const user = users2.find((u) => u.phone === userPhone);
            if (user) {
              userId = user.id;
            }
          }
          if (!userId) {
            const transactions2 = await storage.getAllTransactions();
            for (const transaction of transactions2) {
              if (transaction.reference === paymentResult.reference) {
                userId = transaction.userId;
                break;
              }
            }
          }
          if (!userId) {
            console.error("Could not find user for payment reference:", paymentResult.reference, "phone:", userPhone);
            return res.status(200).json({ message: "Payment processed but user not found" });
          }
          const cardData = {
            userId,
            cardNumber: `5399 ${Math.floor(1e3 + Math.random() * 9e3)} ${Math.floor(1e3 + Math.random() * 9e3)} ${Math.floor(1e3 + Math.random() * 9e3)}`,
            expiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1e3 * 3),
            // 3 years from now
            cvv: Math.floor(100 + Math.random() * 900).toString(),
            balance: 0,
            status: "active",
            type: "virtual"
          };
          const newCard = await storage.createVirtualCard(cardData);
          console.log("Virtual card created successfully:", newCard.id);
          const transactionData = {
            userId,
            amount: paymentResult.amount.toString(),
            currency: "KES",
            status: "completed",
            type: "card_purchase",
            description: `Virtual card purchase - Payment via M-Pesa (${paymentResult.mpesaReceiptNumber})`,
            fee: "0.00",
            reference: paymentResult.reference,
            recipientDetails: null
          };
          await storage.createTransaction(transactionData);
          console.log("Card purchase transaction recorded for user:", userId);
        }
        console.log("PayHero payment completed successfully");
        res.status(200).json({ message: "Payment processed successfully" });
      } else {
        console.log("PayHero payment failed:", paymentResult.status);
        res.status(200).json({ message: "Payment failed", status: paymentResult.status });
      }
    } catch (error) {
      console.error("PayHero callback processing error:", error);
      res.status(500).json({ message: "Error processing payment callback" });
    }
  });
  app2.get("/api/system/status", async (req, res) => {
    try {
      console.log("\u{1F50D} System status check initiated");
      const statusChecks = {
        timestamp: (/* @__PURE__ */ new Date()).toISOString(),
        features: {},
        overall: "healthy"
      };
      try {
        await storage.getAllUsers();
        statusChecks.features.accountAccess = {
          status: "healthy",
          message: "You can log in and access your account",
          icon: "\u{1F464}"
        };
        console.log("\u2705 Account Access: Healthy");
      } catch (error) {
        statusChecks.features.accountAccess = {
          status: "unhealthy",
          message: "Account access is currently unavailable",
          icon: "\u{1F464}"
        };
        statusChecks.overall = "degraded";
        console.error("\u274C Account Access: Unhealthy", error);
      }
      try {
        if (process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY) {
          statusChecks.features.fileUploads = {
            status: "healthy",
            message: "Document uploads and profile photos working",
            icon: "\u{1F4C1}"
          };
          console.log("\u2705 File Uploads: Healthy");
        } else {
          statusChecks.features.fileUploads = {
            status: "degraded",
            message: "File storage not configured - uploads won't work",
            icon: "\u{1F4C1}"
          };
          console.warn("\u26A0\uFE0F File Uploads: Not configured");
        }
      } catch (error) {
        statusChecks.features.fileUploads = {
          status: "degraded",
          message: "Document uploads may have issues",
          icon: "\u{1F4C1}"
        };
        console.warn("\u26A0\uFE0F File Uploads: Degraded", error);
      }
      try {
        const rate = await exchangeRateService2.getExchangeRate("USD", "KES");
        statusChecks.features.currencyExchange = {
          status: "healthy",
          message: `You can exchange USD to KES (rate: ${rate})`,
          icon: "\u{1F4B1}"
        };
        console.log("\u2705 Currency Exchange: Healthy");
      } catch (error) {
        statusChecks.features.currencyExchange = {
          status: "degraded",
          message: "Using backup exchange rates",
          icon: "\u{1F4B1}"
        };
        console.warn("\u26A0\uFE0F Currency Exchange: Degraded", error);
      }
      const statumConfigured = statumService.isConfigured();
      if (statumConfigured) {
        statusChecks.features.airtimePurchase = {
          status: "healthy",
          message: "You can buy airtime for all networks",
          icon: "\u{1F4F1}"
        };
        console.log("\u2705 Airtime Purchase: Healthy");
      } else {
        statusChecks.features.airtimePurchase = {
          status: "unhealthy",
          message: "Airtime purchases are temporarily unavailable",
          icon: "\u{1F4F1}"
        };
        statusChecks.overall = "degraded";
        console.warn("\u26A0\uFE0F Airtime Purchase: Unhealthy");
      }
      try {
        const transactions2 = await storage.getAllTransactions();
        statusChecks.features.moneyTransfers = {
          status: "healthy",
          message: "You can send and receive money",
          icon: "\u{1F4B8}"
        };
        console.log("\u2705 Money Transfers: Healthy");
      } catch (error) {
        statusChecks.features.moneyTransfers = {
          status: "unhealthy",
          message: "Money transfers are currently unavailable",
          icon: "\u{1F4B8}"
        };
        statusChecks.overall = "degraded";
        console.warn("\u26A0\uFE0F Money Transfers: Unhealthy", error);
      }
      try {
        const cards = await storage.getAllVirtualCards();
        statusChecks.features.virtualCards = {
          status: "healthy",
          message: "You can purchase and manage virtual cards",
          icon: "\u{1F4B3}"
        };
        console.log("\u2705 Virtual Cards: Healthy");
      } catch (error) {
        statusChecks.features.virtualCards = {
          status: "unhealthy",
          message: "Virtual card services are unavailable",
          icon: "\u{1F4B3}"
        };
        console.warn("\u26A0\uFE0F Virtual Cards: Unhealthy", error);
      }
      try {
        statusChecks.features.notifications = {
          status: "healthy",
          message: "You will receive notifications for transactions",
          icon: "\u{1F514}"
        };
        console.log("\u2705 Notifications: Healthy");
      } catch (error) {
        statusChecks.features.notifications = {
          status: "degraded",
          message: "Notifications may be delayed",
          icon: "\u{1F514}"
        };
        console.warn("\u26A0\uFE0F Notifications: Degraded", error);
      }
      console.log(`\u{1F3C1} System status check completed - Overall: ${statusChecks.overall}`);
      res.json(statusChecks);
    } catch (error) {
      console.error("\u274C Status check error:", error);
      res.status(500).json({
        overall: "unhealthy",
        error: "Failed to perform status check",
        timestamp: (/* @__PURE__ */ new Date()).toISOString()
      });
    }
  });
  app2.get("/sitemap.xml", async (req, res) => {
    try {
      const baseUrl = "https://greenpay.world";
      const today = (/* @__PURE__ */ new Date()).toISOString().split("T")[0];
      const publicPages = [
        // Core marketing pages
        { url: "/", priority: "1.0", changefreq: "daily", desc: "Homepage - International Money Transfer to Kenya" },
        { url: "/login", priority: "0.9", changefreq: "monthly", desc: "Login to GreenPay Account" },
        { url: "/signup", priority: "0.9", changefreq: "monthly", desc: "Sign Up for GreenPay" },
        { url: "/status", priority: "0.8", changefreq: "daily", desc: "System Status & Service Health" },
        // Auth flow pages (public but lower priority)
        { url: "/auth/forgot-password", priority: "0.5", changefreq: "monthly", desc: "Reset Password" },
        { url: "/auth/reset-password", priority: "0.5", changefreq: "monthly", desc: "Create New Password" },
        { url: "/auth/otp-verification", priority: "0.4", changefreq: "monthly", desc: "OTP Verification" },
        // Feature landing pages (for SEO targeting)
        { url: "/features/send-money", priority: "0.9", changefreq: "weekly", desc: "Send Money to Kenya - Fast & Secure" },
        { url: "/features/virtual-cards", priority: "0.9", changefreq: "weekly", desc: "Virtual Cards for Online Payments" },
        { url: "/features/exchange", priority: "0.8", changefreq: "weekly", desc: "USD to KES Exchange - Best Rates" },
        { url: "/features/airtime", priority: "0.7", changefreq: "weekly", desc: "Buy Airtime for Kenya" },
        // Information pages
        { url: "/about", priority: "0.7", changefreq: "monthly", desc: "About GreenPay" },
        { url: "/pricing", priority: "0.8", changefreq: "weekly", desc: "Pricing & Fees" },
        { url: "/security", priority: "0.7", changefreq: "monthly", desc: "Security & Compliance" },
        { url: "/help", priority: "0.6", changefreq: "weekly", desc: "Help Center & FAQ" },
        { url: "/contact", priority: "0.6", changefreq: "monthly", desc: "Contact Support" }
      ];
      const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
  <!-- GreenPay - International Money Transfer & Digital Wallet -->
  <!-- Target Keywords: send money to Kenya, USD to KES, international remittance, virtual cards -->
${publicPages.map((page) => `  <url>
    <loc>${baseUrl}${page.url}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>
  </url>`).join("\n")}
</urlset>`;
      res.header("Content-Type", "application/xml");
      res.header("Cache-Control", "public, max-age=3600");
      res.send(sitemap);
    } catch (error) {
      console.error("Error generating sitemap:", error);
      res.status(500).send("Error generating sitemap");
    }
  });
  app2.get("/robots.txt", (req, res) => {
    const robotsTxt = `User-agent: *
Disallow: /admin/
Disallow: /api/

Sitemap: https://greenpay.world/sitemap.xml`;
    res.header("Content-Type", "text/plain");
    res.send(robotsTxt);
  });
  const httpServer = createServer(app2);
  const wss = new WebSocketServer({ server: httpServer, path: "/ws/logs" });
  const logClients = /* @__PURE__ */ new Set();
  class LogStreamService {
    static broadcast(logEntry) {
      const message = JSON.stringify(logEntry);
      logClients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
          try {
            client.send(message);
          } catch (error) {
            console.error("Error sending log to client:", error);
            logClients.delete(client);
          }
        } else {
          logClients.delete(client);
        }
      });
    }
    static createLogEntry(level, message, source, data) {
      return {
        id: `log_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        timestamp: (/* @__PURE__ */ new Date()).toISOString(),
        level,
        message,
        source,
        data
      };
    }
  }
  wss.on("connection", (ws2) => {
    console.log("Log client connected");
    logClients.add(ws2);
    ws2.send(JSON.stringify(
      LogStreamService.createLogEntry("info", "Connected to log stream", "websocket")
    ));
    ws2.on("close", () => {
      console.log("Log client disconnected");
      logClients.delete(ws2);
    });
    ws2.on("error", (error) => {
      console.error("WebSocket error:", error);
      logClients.delete(ws2);
    });
  });
  const originalConsoleLog = console.log;
  const originalConsoleError = console.error;
  const originalConsoleWarn = console.warn;
  const originalConsoleInfo = console.info;
  console.log = (...args) => {
    originalConsoleLog(...args);
    const message = args.map((arg) => typeof arg === "object" ? JSON.stringify(arg) : String(arg)).join(" ");
    LogStreamService.broadcast(LogStreamService.createLogEntry("info", message, "console"));
  };
  console.error = (...args) => {
    originalConsoleError(...args);
    const message = args.map((arg) => typeof arg === "object" ? JSON.stringify(arg) : String(arg)).join(" ");
    LogStreamService.broadcast(LogStreamService.createLogEntry("error", message, "console"));
  };
  console.warn = (...args) => {
    originalConsoleWarn(...args);
    const message = args.map((arg) => typeof arg === "object" ? JSON.stringify(arg) : String(arg)).join(" ");
    LogStreamService.broadcast(LogStreamService.createLogEntry("warn", message, "console"));
  };
  console.info = (...args) => {
    originalConsoleInfo(...args);
    const message = args.map((arg) => typeof arg === "object" ? JSON.stringify(arg) : String(arg)).join(" ");
    LogStreamService.broadcast(LogStreamService.createLogEntry("info", message, "console"));
  };
  global.LogStreamService = LogStreamService;
  const chatWss = new WebSocketServer({ server: httpServer, path: "/ws" });
  console.log("\u2705 Live support chat WebSocket server initialized on /ws (admin monitoring only)");
  const activeAdminConnections = /* @__PURE__ */ new Map();
  chatWss.on("connection", (ws2, request) => {
    console.log("New WebSocket connection established");
    ws2.on("message", async (data) => {
      try {
        const message = JSON.parse(data.toString());
        switch (message.type) {
          case "admin_register":
            if (message.isAdmin && message.adminId) {
              activeAdminConnections.set(message.adminId, {
                socket: ws2,
                adminId: message.adminId
              });
              console.log(`Admin ${message.adminId} registered for live chat monitoring`);
            }
            break;
          default:
            console.log(`WebSocket message type '${message.type}' ignored - use REST API instead`);
            break;
        }
      } catch (error) {
        console.error("WebSocket message error:", error);
      }
    });
    ws2.on("close", () => {
      for (const [adminId, connection] of activeAdminConnections.entries()) {
        if (connection.socket === ws2) {
          activeAdminConnections.delete(adminId);
          console.log(`Admin ${adminId} disconnected from live chat monitoring`);
          break;
        }
      }
    });
  });
  setTimeout(() => {
    LogStreamService.broadcast(
      LogStreamService.createLogEntry("info", `GreenPay server started on port ${process.env.PORT || 5e3}`, "system")
    );
  }, 1e3);
  return httpServer;
}

// server/vite.ts
import express from "express";
import fs from "fs";
import path2 from "path";
import { createServer as createViteServer, createLogger } from "vite";

// vite.config.ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import runtimeErrorOverlay from "@replit/vite-plugin-runtime-error-modal";
var vite_config_default = defineConfig({
  plugins: [
    react(),
    runtimeErrorOverlay(),
    ...process.env.NODE_ENV !== "production" && process.env.REPL_ID !== void 0 ? [
      await import("@replit/vite-plugin-cartographer").then(
        (m) => m.cartographer()
      )
    ] : []
  ],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "client", "src"),
      "@shared": path.resolve(import.meta.dirname, "shared"),
      "@assets": path.resolve(import.meta.dirname, "attached_assets")
    }
  },
  root: path.resolve(import.meta.dirname, "client"),
  build: {
    outDir: path.resolve(import.meta.dirname, "dist/public"),
    emptyOutDir: true
  },
  server: {
    middlewareMode: false,
    hmr: {
      host: process.env.REPL_SLUG ? `${process.env.REPL_SLUG}.${process.env.REPL_OWNER}.repl.co` : "localhost",
      port: 443,
      protocol: process.env.REPL_SLUG ? "wss" : "ws"
    },
    fs: {
      strict: true,
      deny: ["**/.*"]
    },
    headers: {
      "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
      "Pragma": "no-cache",
      "Expires": "0",
      "Surrogate-Control": "no-store"
    }
  }
});

// server/vite.ts
import { nanoid } from "nanoid";
var viteLogger = createLogger();
function log(message, source = "express") {
  const formattedTime = (/* @__PURE__ */ new Date()).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true
  });
  console.log(`${formattedTime} [${source}] ${message}`);
}
async function setupVite(app2, server) {
  const serverOptions = {
    middlewareMode: true,
    hmr: { server },
    allowedHosts: true
  };
  const vite = await createViteServer({
    ...vite_config_default,
    configFile: false,
    customLogger: {
      ...viteLogger,
      error: (msg, options) => {
        viteLogger.error(msg, options);
        process.exit(1);
      }
    },
    server: serverOptions,
    appType: "custom"
  });
  app2.use(vite.middlewares);
  app2.use("*", async (req, res, next) => {
    const url = req.originalUrl;
    try {
      const clientTemplate = path2.resolve(
        import.meta.dirname,
        "..",
        "client",
        "index.html"
      );
      let template = await fs.promises.readFile(clientTemplate, "utf-8");
      template = template.replace(
        `src="/src/main.tsx"`,
        `src="/src/main.tsx?v=${nanoid()}"`
      );
      const page = await vite.transformIndexHtml(url, template);
      res.status(200).set({ "Content-Type": "text/html" }).end(page);
    } catch (e) {
      vite.ssrFixStacktrace(e);
      next(e);
    }
  });
}
function serveStatic(app2) {
  const distPath = path2.resolve(import.meta.dirname, "public");
  if (!fs.existsSync(distPath)) {
    throw new Error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`
    );
  }
  app2.use(express.static(distPath));
  app2.use("*", (_req, res) => {
    res.sendFile(path2.resolve(distPath, "index.html"));
  });
}

// server/services/system-logger.ts
init_storage();
var SystemLogger = class _SystemLogger {
  static instance;
  originalConsole = {};
  static getInstance() {
    if (!_SystemLogger.instance) {
      _SystemLogger.instance = new _SystemLogger();
    }
    return _SystemLogger.instance;
  }
  init() {
    this.originalConsole.log = console.log;
    this.originalConsole.warn = console.warn;
    this.originalConsole.error = console.error;
    this.originalConsole.info = console.info;
    console.log = (...args) => {
      this.saveLog("info", args.join(" "));
      this.originalConsole.log(...args);
    };
    console.warn = (...args) => {
      this.saveLog("warn", args.join(" "));
      this.originalConsole.warn(...args);
    };
    console.error = (...args) => {
      this.saveLog("error", args.join(" "));
      this.originalConsole.error(...args);
    };
    console.info = (...args) => {
      this.saveLog("info", args.join(" "));
      this.originalConsole.info(...args);
    };
    setInterval(() => {
      this.cleanupOldLogs();
    }, 10 * 60 * 1e3);
  }
  async saveLog(level, message, source, data) {
    try {
      await storage.createSystemLog({
        level,
        message,
        source,
        data
      });
    } catch (error) {
      this.originalConsole.error("Failed to save system log:", error);
    }
  }
  async logAPIRequest(method, url, statusCode, responseTime) {
    const message = `${method} ${url} ${statusCode}${responseTime ? ` in ${responseTime}ms` : ""}`;
    await this.saveLog("api", message, "express", {
      method,
      url,
      statusCode,
      responseTime
    });
  }
  async cleanupOldLogs() {
    try {
      await storage.deleteOldSystemLogs(30);
    } catch (error) {
      this.originalConsole.error("Failed to cleanup old logs:", error);
    }
  }
};
var systemLogger = SystemLogger.getInstance();

// server/index.ts
if (!process.env.NODE_ENV) {
  process.env.NODE_ENV = "production";
}
var requiredEnvVars = ["PORT"];
var missingVars = requiredEnvVars.filter((varName) => !process.env[varName]);
if (missingVars.length > 0) {
  console.warn(`Warning: Missing environment variables: ${missingVars.join(", ")}`);
}
var app = express2();
app.use(express2.json({ limit: "50mb" }));
app.use(express2.urlencoded({ extended: true, limit: "50mb" }));
var pgSession = ConnectPgSimple(session);
var sessionStore;
if (process.env.DATABASE_URL) {
  const pgPool = new Pool2({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === "production" ? { rejectUnauthorized: false } : false
  });
  sessionStore = new pgSession({
    pool: pgPool,
    tableName: "user_sessions",
    createTableIfMissing: true
  });
  console.log("Using PostgreSQL session store for production");
} else {
  console.warn("DATABASE_URL not found - falling back to MemoryStore (not recommended for production)");
}
var isReplitEnvironment = process.env.REPLIT_DEPLOYMENT === "1" || !!process.env.REPL_ID || !!process.env.REPLIT_DOMAINS;
var isProduction = process.env.NODE_ENV === "production";
var shouldTrustProxy = isReplitEnvironment || isProduction;
if (shouldTrustProxy) {
  app.set("trust proxy", 1);
}
if (isProduction && !process.env.SESSION_SECRET) {
  console.error("SESSION_SECRET environment variable is required in production");
  process.exit(1);
}
var getSecureCookieSetting = () => {
  if (isProduction && shouldTrustProxy) {
    return "auto";
  }
  return isProduction;
};
var sessionConfig = {
  store: sessionStore,
  secret: process.env.SESSION_SECRET || "greenpay-secret-key-change-in-production-" + Math.random(),
  resave: false,
  saveUninitialized: false,
  cookie: {
    // Use secure cookies appropriately for the environment
    secure: getSecureCookieSetting(),
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1e3,
    // 24 hours
    sameSite: "lax"
    // More permissive for cross-site navigation compatibility
  }
};
app.use(session(sessionConfig));
if (process.env.NODE_ENV === "development") {
  app.use((req, res, next) => {
    res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
    res.setHeader("Pragma", "no-cache");
    res.setHeader("Expires", "0");
    res.setHeader("Surrogate-Control", "no-store");
    next();
  });
}
app.use((req, res, next) => {
  const start = Date.now();
  const path3 = req.path;
  let capturedJsonResponse = void 0;
  const originalResJson = res.json;
  res.json = function(bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };
  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path3.startsWith("/api")) {
      let logLine = `${req.method} ${path3} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }
      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "\u2026";
      }
      log(logLine);
      const LogStreamService = global.LogStreamService;
      if (LogStreamService && !path3.includes("/ws")) {
        LogStreamService.broadcast(LogStreamService.createLogEntry(
          res.statusCode >= 400 ? "error" : "api",
          `${req.method} ${path3} ${res.statusCode} in ${duration}ms`,
          "api",
          {
            method: req.method,
            path: path3,
            statusCode: res.statusCode,
            duration,
            response: capturedJsonResponse
          }
        ));
      }
    }
  });
  next();
});
(async () => {
  try {
    systemLogger.init();
    console.log("\u2705 System logger initialized - capturing console output to database");
    const server = await registerRoutes(app);
    app.use((err, _req, res, _next) => {
      const status = err.status || err.statusCode || 500;
      const message = err.message || "Internal Server Error";
      console.error("Server error:", {
        message: err.message,
        stack: err.stack,
        status
      });
      res.status(status).json({ message });
      if (process.env.NODE_ENV !== "production") {
        throw err;
      }
    });
    if (app.get("env") === "development") {
      await setupVite(app, server);
    } else {
      serveStatic(app);
    }
    const port = parseInt(process.env.PORT || "5000", 10);
    server.listen({
      port,
      host: "0.0.0.0",
      reusePort: true
    }, () => {
      log(`serving on port ${port}`);
    });
    server.on("error", (error) => {
      console.error("Server startup error:", error);
      if (error.code === "EADDRINUSE") {
        console.error(`Port ${port} is already in use`);
      }
      process.exit(1);
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
})();

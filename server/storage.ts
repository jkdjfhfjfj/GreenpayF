import {
  type User,
  type InsertUser,
  type KycDocument,
  type InsertKycDocument,
  type VirtualCard,
  type InsertVirtualCard,
  type Transaction,
  type InsertTransaction,
  type PaymentRequest,
  type InsertPaymentRequest,
  type Recipient,
  type InsertRecipient,
  type Notification,
  type InsertNotification,
  type ChatMessage,
  type InsertChatMessage,
  type Conversation,
  type InsertConversation,
  type Message,
  type InsertMessage,
  type Admin,
  type InsertAdmin,
  type AdminLog,
  type InsertAdminLog,
  type SystemSetting,
  type InsertSystemSetting,
  type SystemLog,
  type InsertSystemLog,
  type ApiConfiguration,
  type InsertApiConfiguration,
  type SupportTicket,
  type InsertSupportTicket,
  type SavingsGoal,
  type InsertSavingsGoal,
  type QRPayment,
  type InsertQRPayment,
  type LoginHistory,
  type InsertLoginHistory,
  type WhatsappConversation,
  type InsertWhatsappConversation,
  type WhatsappMessage,
  type InsertWhatsappMessage,
  type WhatsappConfig,
  type InsertWhatsappConfig,
  users,
  kycDocuments,
  virtualCards,
  transactions,
  paymentRequests,
  recipients,
  notifications,
  chatMessages,
  conversations,
  messages,
  admins,
  adminLogs,
  systemSettings,
  systemLogs,
  apiConfigurations,
  supportTickets,
  savingsGoals,
  qrPayments,
  scheduledPayments,
  budgets,
  userPreferences,
  loginHistory,
  whatsappConversations,
  whatsappMessages,
  whatsappConfig,
} from "@shared/schema";
import { randomUUID } from "crypto";
import { db } from "./db";
import { eq, desc, count, sum, or, isNull, gte, lt } from "drizzle-orm";
import bcrypt from "bcrypt";

export interface IStorage {
  // User operations
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUserByPhone(phone: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: string, updates: Partial<User>): Promise<User | undefined>;
  deleteUser(id: string): Promise<void>;
  updateUserOtp(id: string, otpCode: string | null, otpExpiry: Date | null): Promise<User | undefined>;
  verifyUserOtp(id: string, otpCode: string): Promise<boolean>;
  updateUserPassword(id: string, hashedPassword: string): Promise<User | undefined>;

  // KYC operations
  createKycDocument(kyc: InsertKycDocument): Promise<KycDocument>;
  getKycByUserId(userId: string): Promise<KycDocument | undefined>;
  updateKycDocument(id: string, updates: Partial<KycDocument>): Promise<KycDocument | undefined>;

  // Virtual Card operations
  createVirtualCard(card: InsertVirtualCard): Promise<VirtualCard>;
  getVirtualCardByUserId(userId: string): Promise<VirtualCard | undefined>;
  updateVirtualCard(id: string, updates: Partial<VirtualCard>): Promise<VirtualCard | undefined>;

  // Transaction operations
  createTransaction(transaction: InsertTransaction): Promise<Transaction>;
  getTransactionsByUserId(userId: string): Promise<Transaction[]>;
  getTransaction(id: string): Promise<Transaction | undefined>;
  updateTransaction(id: string, updates: Partial<Transaction>): Promise<Transaction | undefined>;
  updateWithdrawalRequest(id: string, updates: Partial<Transaction>): Promise<Transaction | undefined>;

  // Recipient operations
  createRecipient(recipient: InsertRecipient): Promise<Recipient>;
  getRecipientsByUserId(userId: string): Promise<Recipient[]>;
  getRecipient(id: string): Promise<Recipient | undefined>;
  updateRecipient(id: string, updates: Partial<Recipient>): Promise<Recipient | undefined>;
  deleteRecipient(id: string): Promise<void>;

  // Chat message operations  
  createChatMessage(message: InsertChatMessage): Promise<ChatMessage>;
  getChatMessagesByConversation(conversationId: string): Promise<ChatMessage[]>;
  getChatMessagesByUserId(userId: string): Promise<ChatMessage[]>;
  updateChatMessageStatus(id: string, status: string): Promise<ChatMessage | undefined>;

  // Payment Request operations
  createPaymentRequest(request: InsertPaymentRequest): Promise<PaymentRequest>;
  getPaymentRequestsByUserId(userId: string): Promise<PaymentRequest[]>;
  getPaymentRequest(id: string): Promise<PaymentRequest | undefined>;
  updatePaymentRequest(id: string, updates: Partial<PaymentRequest>): Promise<PaymentRequest | undefined>;

  // Admin operations
  getAdminByEmail(email: string): Promise<Admin | undefined>;
  createAdmin(admin: InsertAdmin): Promise<Admin>;
  getAllUsers(filters?: { status?: string; search?: string; page?: number; limit?: number }): Promise<{ users: User[]; total: number; page: number; totalPages: number }>;
  getAllKycDocuments(): Promise<KycDocument[]>;
  getAllTransactions(filters?: { status?: string; page?: number; limit?: number }): Promise<{ transactions: Transaction[]; total: number; page: number; totalPages: number }>;
  getAllVirtualCards(): Promise<VirtualCard[]>;
  getDashboardMetrics(): Promise<{
    totalUsers: number;
    activeUsers: number;
    pendingKyc: number;
    totalTransactions: number;
    totalVolume: string;
    monthlyGrowth: number;
  }>;
  createAdminLog(log: InsertAdminLog): Promise<AdminLog>;
  getAdminLogs(): Promise<AdminLog[]>;

  // System logs
  createSystemLog(log: InsertSystemLog): Promise<SystemLog>;
  getSystemLogs(minutes?: number): Promise<SystemLog[]>;
  deleteOldSystemLogs(minutes?: number): Promise<void>;
  
  // System Settings operations
  getSystemSettings(): Promise<SystemSetting[]>;
  updateSystemSetting(key: string, value: string): Promise<SystemSetting | undefined>;
  createSystemSetting(setting: InsertSystemSetting): Promise<SystemSetting>;
  updateAdmin(id: string, updates: Partial<Admin>): Promise<Admin | undefined>;
  
  // Admin data operations
  getUsersCount(): Promise<number>;
  getTransactionsCount(): Promise<number>;
  getTotalVolume(): Promise<{ volume: number; revenue: number }>;
  
  // Notification operations
  createNotification(notification: InsertNotification): Promise<Notification>;
  getNotificationsByUserId(userId: string): Promise<Notification[]>;
  getGlobalNotifications(): Promise<Notification[]>;
  markNotificationAsRead(id: string): Promise<void>;
  deleteNotification(id: string): Promise<void>;

  // Support Ticket operations
  createSupportTicket(ticket: InsertSupportTicket): Promise<SupportTicket>;
  getSupportTicketsByUserId(userId: string): Promise<SupportTicket[]>;
  getAllSupportTickets(filters?: { status?: string; priority?: string; page?: number; limit?: number }): Promise<{ tickets: SupportTicket[]; total: number; page: number; totalPages: number }>;
  getSupportTicket(id: string): Promise<SupportTicket | undefined>;
  updateSupportTicket(id: string, updates: Partial<SupportTicket>): Promise<SupportTicket | undefined>;
  deleteSupportTicket(id: string): Promise<void>;
  assignSupportTicket(id: string, adminId: string): Promise<SupportTicket | undefined>;

  // Conversation operations
  createConversation(conversation: InsertConversation): Promise<Conversation>;
  getConversationsByUserId(userId: string): Promise<Conversation[]>;
  getConversationsByAdminId(adminId: string): Promise<Conversation[]>;
  getAllActiveConversations(): Promise<Conversation[]>;
  getConversation(id: string): Promise<Conversation | undefined>;
  updateConversation(id: string, updates: Partial<Conversation>): Promise<Conversation | undefined>;
  deleteConversation(id: string): Promise<void>;

  // Message operations
  createMessage(message: InsertMessage): Promise<Message>;
  getMessagesByConversationId(conversationId: string): Promise<Message[]>;
  getMessage(id: string): Promise<Message | undefined>;
  markMessageAsRead(id: string): Promise<Message | undefined>;
  deleteMessage(id: string): Promise<void>;
  getUnreadMessagesCount(conversationId: string, userId: string): Promise<number>;
  
  // System settings
  getSystemSetting(category: string, key: string): Promise<SystemSetting | undefined>;
  getSystemSettingsByCategory(category: string): Promise<SystemSetting[]>;
  setSystemSetting(setting: InsertSystemSetting): Promise<SystemSetting>;
  updateSystemSetting(id: string, updates: Partial<SystemSetting>): Promise<SystemSetting | undefined>;

  // API Configuration operations
  getApiConfiguration(provider: string): Promise<ApiConfiguration | undefined>;
  getAllApiConfigurations(): Promise<ApiConfiguration[]>;
  createApiConfiguration(config: InsertApiConfiguration): Promise<ApiConfiguration>;
  updateApiConfiguration(provider: string, updates: Partial<ApiConfiguration>): Promise<ApiConfiguration | undefined>;
  deleteApiConfiguration(provider: string): Promise<void>;

  // Savings Goals operations
  createSavingsGoal(goal: InsertSavingsGoal): Promise<SavingsGoal>;
  getSavingsGoalsByUserId(userId: string): Promise<SavingsGoal[]>;
  getSavingsGoal(id: string): Promise<SavingsGoal | undefined>;
  updateSavingsGoal(id: string, updates: Partial<SavingsGoal>): Promise<SavingsGoal | undefined>;

  // QR Payment operations
  createQRPayment(payment: InsertQRPayment): Promise<QRPayment>;
  getQRPaymentByCode(paymentCode: string): Promise<QRPayment | undefined>;
  updateQRPayment(id: string, updates: Partial<QRPayment>): Promise<QRPayment | undefined>;

  // Login History operations
  createLoginHistory(history: InsertLoginHistory): Promise<LoginHistory>;
  getLoginHistoryByUserId(userId: string, limit?: number): Promise<LoginHistory[]>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User> = new Map();
  private kycDocuments: Map<string, KycDocument> = new Map();
  private virtualCards: Map<string, VirtualCard> = new Map();
  private transactions: Map<string, Transaction> = new Map();
  private paymentRequests: Map<string, PaymentRequest> = new Map();
  private recipients: Map<string, Recipient> = new Map();
  private conversations: Map<string, Conversation> = new Map();
  private messages: Map<string, Message> = new Map();
  private chatMessages: Map<string, ChatMessage> = new Map();
  private notifications: Map<string, Notification> = new Map();
  private admins: Map<string, Admin> = new Map();
  private supportTickets: Map<string, SupportTicket> = new Map();
  private systemSettings: Map<string, SystemSetting> = new Map();
  private adminLogs: Map<string, AdminLog> = new Map();
  private systemLogs: Map<string, SystemLog> = new Map();

  constructor() {
    // Initialize with mock data for demo
    this.initMockData();
  }

  private initMockData() {
    // Create demo user
    const demoUser: User = {
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
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.users.set(demoUser.id, demoUser);

    // Create demo virtual card
    const demoCard: VirtualCard = {
      id: "demo-card-1",
      userId: demoUser.id,
      cardNumber: "4567123456784567",
      expiryDate: "12/27",
      cvv: "123",
      balance: "2847.65",
      status: "active",
      purchaseAmount: "60.00",
      paystackReference: null,
      purchaseDate: new Date(),
      updatedAt: new Date(),
    };
    this.virtualCards.set(demoCard.id, demoCard);

    // Create demo transactions
    const transactions: Transaction[] = [
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
        completedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
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
        completedAt: new Date(Date.now() - 86400000),
        createdAt: new Date(Date.now() - 86400000), // Yesterday
        updatedAt: new Date(Date.now() - 86400000),
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
        completedAt: new Date(Date.now() - 432000000),
        createdAt: new Date(Date.now() - 432000000), // 5 days ago
        updatedAt: new Date(Date.now() - 432000000),
      },
    ];

    transactions.forEach(txn => this.transactions.set(txn.id, txn));
  }

  // User operations
  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.email === email);
  }

  async getUserByPhone(phone: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.phone === phone);
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = {
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
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.users.set(id, user);
    return user;
  }

  async updateUser(id: string, updates: Partial<User>): Promise<User | undefined> {
    const user = this.users.get(id);
    if (!user) return undefined;
    
    const updatedUser = { ...user, ...updates };
    this.users.set(id, updatedUser);
    return updatedUser;
  }

  async deleteUser(id: string): Promise<void> {
    // Delete user and related data
    this.users.delete(id);
    
    // Delete related KYC documents
    const kyc = Array.from(this.kycDocuments.values()).find(doc => doc.userId === id);
    if (kyc) {
      this.kycDocuments.delete(kyc.id);
    }
    
    // Delete related virtual cards
    const card = Array.from(this.virtualCards.values()).find(c => c.userId === id);
    if (card) {
      this.virtualCards.delete(card.id);
    }
    
    // Delete related transactions
    Array.from(this.transactions.entries()).forEach(([txId, tx]) => {
      if (tx.userId === id) {
        this.transactions.delete(txId);
      }
    });
    
    // Delete related payment requests
    Array.from(this.paymentRequests.entries()).forEach(([reqId, req]) => {
      if (req.fromUserId === id) {
        this.paymentRequests.delete(reqId);
      }
    });
    
    // Delete related recipients
    Array.from(this.recipients.entries()).forEach(([recipientId, recipient]) => {
      if (recipient.userId === id) {
        this.recipients.delete(recipientId);
      }
    });
  }

  // KYC operations
  async createKycDocument(insertKyc: InsertKycDocument): Promise<KycDocument> {
    const id = randomUUID();
    const kyc: KycDocument = {
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
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.kycDocuments.set(id, kyc);
    return kyc;
  }

  async getKycByUserId(userId: string): Promise<KycDocument | undefined> {
    return Array.from(this.kycDocuments.values()).find(kyc => kyc.userId === userId);
  }

  async updateKycDocument(id: string, updates: Partial<KycDocument>): Promise<KycDocument | undefined> {
    const kyc = this.kycDocuments.get(id);
    if (!kyc) return undefined;
    
    const updatedKyc = { ...kyc, ...updates };
    this.kycDocuments.set(id, updatedKyc);
    return updatedKyc;
  }

  // Virtual Card operations
  async createVirtualCard(insertCard: InsertVirtualCard): Promise<VirtualCard> {
    const id = randomUUID();
    const card: VirtualCard = {
      ...insertCard,
      id,
      cardNumber: this.generateCardNumber(),
      expiryDate: "12/27",
      cvv: this.generateCVV(),
      balance: "0.00",
      status: "active",
      purchaseAmount: insertCard.purchaseAmount ?? "60.00",
      paystackReference: insertCard.paystackReference ?? null,
      purchaseDate: new Date(),
      updatedAt: new Date(),
    };
    this.virtualCards.set(id, card);
    return card;
  }

  async getVirtualCardByUserId(userId: string): Promise<VirtualCard | undefined> {
    return Array.from(this.virtualCards.values()).find(card => card.userId === userId);
  }

  async updateVirtualCard(id: string, updates: Partial<VirtualCard>): Promise<VirtualCard | undefined> {
    const card = this.virtualCards.get(id);
    if (!card) return undefined;
    
    const updatedCard = { ...card, ...updates };
    this.virtualCards.set(id, updatedCard);
    return updatedCard;
  }

  // Transaction operations
  async createTransaction(insertTransaction: InsertTransaction): Promise<Transaction> {
    const id = randomUUID();
    const transaction: Transaction = {
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
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.transactions.set(id, transaction);
    return transaction;
  }

  async getTransactionsByUserId(userId: string): Promise<Transaction[]> {
    return Array.from(this.transactions.values())
      .filter(txn => txn.userId === userId)
      .sort((a, b) => new Date(b.createdAt!).getTime() - new Date(a.createdAt!).getTime());
  }

  async getTransaction(id: string): Promise<Transaction | undefined> {
    return this.transactions.get(id);
  }

  async updateTransaction(id: string, updates: Partial<Transaction>): Promise<Transaction | undefined> {
    const transaction = this.transactions.get(id);
    if (!transaction) return undefined;
    
    const updatedTransaction = { ...transaction, ...updates };
    this.transactions.set(id, updatedTransaction);
    return updatedTransaction;
  }

  async updateWithdrawalRequest(id: string, updates: Partial<Transaction>): Promise<Transaction | undefined> {
    // Withdrawal requests are stored as transactions with type "withdraw"
    return this.updateTransaction(id, updates);
  }

  // Payment Request operations
  async createPaymentRequest(insertRequest: InsertPaymentRequest): Promise<PaymentRequest> {
    const id = randomUUID();
    const request: PaymentRequest = {
      ...insertRequest,
      id,
      status: "pending",
      message: insertRequest.message ?? null,
      currency: insertRequest.currency ?? "KES",
      recipientId: insertRequest.recipientId ?? null,
      toEmail: insertRequest.toEmail ?? null,
      toPhone: insertRequest.toPhone ?? null,
      paymentLink: insertRequest.paymentLink ?? null,
      createdAt: new Date(),
    };
    this.paymentRequests.set(id, request);
    return request;
  }

  async getPaymentRequestsByUserId(userId: string): Promise<PaymentRequest[]> {
    return Array.from(this.paymentRequests.values())
      .filter(req => req.fromUserId === userId)
      .sort((a, b) => new Date(b.createdAt!).getTime() - new Date(a.createdAt!).getTime());
  }

  async updatePaymentRequest(id: string, updates: Partial<PaymentRequest>): Promise<PaymentRequest | undefined> {
    const request = this.paymentRequests.get(id);
    if (!request) return undefined;
    
    const updatedRequest = { ...request, ...updates };
    this.paymentRequests.set(id, updatedRequest);
    return updatedRequest;
  }

  private generateCardNumber(): string {
    return "4567" + Math.random().toString().slice(2, 14);
  }

  private generateCVV(): string {
    return Math.floor(Math.random() * 900 + 100).toString();
  }

  // Recipient operations
  async createRecipient(insertRecipient: InsertRecipient): Promise<Recipient> {
    const id = randomUUID();
    const recipient: Recipient = {
      ...insertRecipient,
      id,
      email: insertRecipient.email ?? null,
      phone: insertRecipient.phone ?? null,
      accountNumber: insertRecipient.accountNumber ?? null,
      bankName: insertRecipient.bankName ?? null,
      bankCode: insertRecipient.bankCode ?? null,
      currency: insertRecipient.currency ?? "KES",
      recipientType: insertRecipient.recipientType ?? "mobile_wallet",
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.recipients.set(id, recipient);
    return recipient;
  }

  async getRecipientsByUserId(userId: string): Promise<Recipient[]> {
    return Array.from(this.recipients.values()).filter(r => r.userId === userId);
  }

  async getRecipient(id: string): Promise<Recipient | undefined> {
    return this.recipients.get(id);
  }

  async updateRecipient(id: string, updates: Partial<Recipient>): Promise<Recipient | undefined> {
    const recipient = this.recipients.get(id);
    if (!recipient) return undefined;
    const updatedRecipient = { ...recipient, ...updates, updatedAt: new Date() };
    this.recipients.set(id, updatedRecipient);
    return updatedRecipient;
  }

  async deleteRecipient(id: string): Promise<void> {
    this.recipients.delete(id);
  }

  // Conversation operations
  async createConversation(insertConversation: InsertConversation): Promise<Conversation> {
    const id = randomUUID();
    const conversation: Conversation = {
      ...insertConversation,
      id,
      status: "active",
      adminId: insertConversation.adminId ?? null,
      title: insertConversation.title ?? null,
      lastMessageAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.conversations.set(id, conversation);
    return conversation;
  }

  async getConversationsByUserId(userId: string): Promise<Conversation[]> {
    return Array.from(this.conversations.values())
      .filter(c => c.userId === userId)
      .sort((a, b) => new Date(b.updatedAt!).getTime() - new Date(a.updatedAt!).getTime());
  }

  async getConversationsByAdminId(adminId: string): Promise<Conversation[]> {
    return Array.from(this.conversations.values())
      .filter(c => c.adminId === adminId)
      .sort((a, b) => new Date(b.updatedAt!).getTime() - new Date(a.updatedAt!).getTime());
  }

  async getAllActiveConversations(): Promise<Conversation[]> {
    return Array.from(this.conversations.values())
      .filter(c => c.status === "active")
      .sort((a, b) => new Date(b.updatedAt!).getTime() - new Date(a.updatedAt!).getTime());
  }

  async getConversation(id: string): Promise<Conversation | undefined> {
    return this.conversations.get(id);
  }

  async updateConversation(id: string, updates: Partial<Conversation>): Promise<Conversation | undefined> {
    const conversation = this.conversations.get(id);
    if (!conversation) return undefined;
    const updatedConversation = { ...conversation, ...updates, updatedAt: new Date() };
    this.conversations.set(id, updatedConversation);
    return updatedConversation;
  }

  async deleteConversation(id: string): Promise<void> {
    this.conversations.delete(id);
  }

  // Message operations
  async createMessage(insertMessage: InsertMessage): Promise<Message> {
    const id = randomUUID();
    const message: Message = {
      ...insertMessage,
      id,
      senderId: insertMessage.senderId,
      senderType: insertMessage.senderType,
      messageType: insertMessage.messageType ?? "text",
      fileUrl: insertMessage.fileUrl ?? null,
      fileName: insertMessage.fileName ?? null,
      fileSize: insertMessage.fileSize ?? null,
      readAt: null,
      createdAt: new Date(),
    };
    this.messages.set(id, message);
    
    // Update conversation's last message time
    await this.updateConversation(insertMessage.conversationId, {
      lastMessageAt: message.createdAt
    });
    
    return message;
  }

  async getMessagesByConversationId(conversationId: string): Promise<Message[]> {
    return Array.from(this.messages.values())
      .filter(m => m.conversationId === conversationId)
      .sort((a, b) => new Date(a.createdAt!).getTime() - new Date(b.createdAt!).getTime());
  }

  async getMessage(id: string): Promise<Message | undefined> {
    return this.messages.get(id);
  }

  async deleteMessage(id: string): Promise<void> {
    this.messages.delete(id);
  }

  async markMessageAsRead(id: string): Promise<Message | undefined> {
    const message = this.messages.get(id);
    if (!message) return undefined;
    const updatedMessage = { ...message, readAt: new Date() };
    this.messages.set(id, updatedMessage);
    return updatedMessage;
  }

  async getUnreadMessagesCount(conversationId: string, userId: string): Promise<number> {
    return Array.from(this.messages.values())
      .filter(m => 
        m.conversationId === conversationId && 
        m.senderId !== userId && 
        !m.readAt
      ).length;
  }

  // Chat message operations (legacy support)
  async createChatMessage(insertChatMessage: InsertChatMessage): Promise<ChatMessage> {
    const id = randomUUID();
    const chatMessage: ChatMessage = {
      ...insertChatMessage,
      id,
      status: insertChatMessage.status ?? "sent",
      isFromAdmin: insertChatMessage.isFromAdmin ?? false,
      adminId: insertChatMessage.adminId ?? null,
      createdAt: new Date(),
    };
    this.chatMessages.set(id, chatMessage);
    return chatMessage;
  }

  async getChatMessagesByConversation(conversationId: string): Promise<ChatMessage[]> {
    return Array.from(this.chatMessages.values())
      .filter(m => m.conversationId === conversationId)
      .sort((a, b) => new Date(a.createdAt!).getTime() - new Date(b.createdAt!).getTime());
  }

  async getChatMessagesByUserId(userId: string): Promise<ChatMessage[]> {
    return Array.from(this.chatMessages.values())
      .filter(m => m.userId === userId)
      .sort((a, b) => new Date(b.createdAt!).getTime() - new Date(a.createdAt!).getTime());
  }

  async updateChatMessageStatus(id: string, status: string): Promise<ChatMessage | undefined> {
    const message = this.chatMessages.get(id);
    if (!message) return undefined;
    const updatedMessage = { ...message, status };
    this.chatMessages.set(id, updatedMessage);
    return updatedMessage;
  }

  // Notification operations
  async createNotification(insertNotification: InsertNotification): Promise<Notification> {
    const id = randomUUID();
    const notification: Notification = {
      ...insertNotification,
      id,
      type: insertNotification.type ?? "info",
      isGlobal: insertNotification.isGlobal ?? false,
      userId: insertNotification.userId ?? null,
      actionUrl: insertNotification.actionUrl ?? null,
      metadata: insertNotification.metadata ?? null,
      expiresAt: insertNotification.expiresAt ?? null,
      isRead: false,
      createdAt: new Date(),
    };
    this.notifications.set(id, notification);
    return notification;
  }

  async getNotificationsByUserId(userId: string): Promise<Notification[]> {
    return Array.from(this.notifications.values())
      .filter(n => n.userId === userId)
      .sort((a, b) => new Date(b.createdAt!).getTime() - new Date(a.createdAt!).getTime());
  }

  async getGlobalNotifications(): Promise<Notification[]> {
    return Array.from(this.notifications.values())
      .filter(n => n.isGlobal)
      .sort((a, b) => new Date(b.createdAt!).getTime() - new Date(a.createdAt!).getTime());
  }

  async markNotificationAsRead(id: string): Promise<void> {
    const notification = this.notifications.get(id);
    if (notification) {
      const updatedNotification = { ...notification, isRead: true };
      this.notifications.set(id, updatedNotification);
    }
  }

  async deleteNotification(id: string): Promise<void> {
    this.notifications.delete(id);
  }

  // Admin operations (basic stubs)
  async getAdminByEmail(email: string): Promise<Admin | undefined> {
    return Array.from(this.admins.values()).find(admin => admin.email === email);
  }

  async createAdmin(insertAdmin: InsertAdmin): Promise<Admin> {
    const id = randomUUID();
    const hashedPassword = await bcrypt.hash(insertAdmin.password, 10);
    const admin: Admin = {
      ...insertAdmin,
      id,
      password: hashedPassword,
      role: insertAdmin.role || "admin",
      twoFactorSecret: insertAdmin.twoFactorSecret ?? null,
      twoFactorEnabled: insertAdmin.twoFactorEnabled ?? false,
      lastLoginAt: insertAdmin.lastLoginAt ?? null,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.admins.set(id, admin);
    return admin;
  }

  // Admin operations with proper return types
  async getAllUsers(filters?: { status?: string; search?: string; page?: number; limit?: number }): Promise<{ users: User[]; total: number; page: number; totalPages: number }> {
    const users = Array.from(this.users.values());
    return {
      users,
      total: users.length,
      page: filters?.page || 1,
      totalPages: Math.ceil(users.length / (filters?.limit || 10))
    };
  }
  async getAllKycDocuments(): Promise<KycDocument[]> { return Array.from(this.kycDocuments.values()); }
  async getAllTransactions(filters?: { status?: string; page?: number; limit?: number }): Promise<{ transactions: Transaction[]; total: number; page: number; totalPages: number }> {
    const transactions = Array.from(this.transactions.values());
    return {
      transactions,
      total: transactions.length,
      page: filters?.page || 1,
      totalPages: Math.ceil(transactions.length / (filters?.limit || 10))
    };
  }
  async getAllVirtualCards(): Promise<VirtualCard[]> { return Array.from(this.virtualCards.values()); }
  async getUsersCount(): Promise<number> { return this.users.size; }
  async getTransactionsCount(): Promise<number> { return this.transactions.size; }
  async getTotalVolume(): Promise<{ volume: number; revenue: number }> { return { volume: 0, revenue: 0 }; }
  async getDashboardMetrics(): Promise<any> { return {}; }
  async createAdminLog(log: InsertAdminLog): Promise<AdminLog> {
    const id = randomUUID();
    const adminLog: AdminLog = {
      ...log,
      id,
      adminId: log.adminId ?? null,
      targetType: log.targetType ?? null,
      targetId: log.targetId ?? null,
      details: log.details ?? null,
      ipAddress: log.ipAddress ?? null,
      userAgent: log.userAgent ?? null,
      createdAt: new Date()
    };
    this.adminLogs.set(id, adminLog);
    return adminLog;
  }
  async getAdminLogs(): Promise<AdminLog[]> { return []; }
  async createSystemLog(log: InsertSystemLog): Promise<SystemLog> {
    const id = randomUUID();
    const systemLog: SystemLog = {
      ...log,
      id,
      data: log.data ?? {},
      source: log.source ?? null,
      timestamp: new Date()
    };
    this.systemLogs.set(id, systemLog);
    return systemLog;
  }
  async getSystemLogs(): Promise<SystemLog[]> { return []; }
  async deleteOldSystemLogs(): Promise<void> {}
  async getSystemSettings(): Promise<SystemSetting[]> { return Array.from(this.systemSettings.values()); }
  async updateSystemSetting(key: string, value: string): Promise<SystemSetting | undefined>;
  async updateSystemSetting(id: string, updates: Partial<SystemSetting>): Promise<SystemSetting | undefined>;
  async updateSystemSetting(keyOrId: string, valueOrUpdates: string | Partial<SystemSetting>): Promise<SystemSetting | undefined> {
    if (typeof valueOrUpdates === 'string') {
      // Update by key and value
      const setting = Array.from(this.systemSettings.values()).find(s => s.key === keyOrId);
      if (setting) {
        const updated = { ...setting, value: JSON.parse(valueOrUpdates), updatedAt: new Date() };
        this.systemSettings.set(setting.id, updated);
        return updated;
      }
      return undefined;
    } else {
      // Update by id and partial updates
      const setting = this.systemSettings.get(keyOrId);
      if (!setting) return undefined;
      
      const updatedSetting: SystemSetting = {
        ...setting,
        ...valueOrUpdates,
        description: valueOrUpdates.description ?? setting.description,
        updatedBy: valueOrUpdates.updatedBy ?? setting.updatedBy,
        updatedAt: new Date(),
      };
      this.systemSettings.set(keyOrId, updatedSetting);
      return updatedSetting;
    }
  }
  async createSystemSetting(setting: InsertSystemSetting): Promise<SystemSetting> {
    const id = randomUUID();
    const systemSetting: SystemSetting = {
      ...setting,
      id,
      description: setting.description ?? null,
      updatedBy: setting.updatedBy ?? null,
      updatedAt: new Date()
    };
    this.systemSettings.set(id, systemSetting);
    return systemSetting;
  }
  async updateAdmin(id: string, updates: Partial<Admin>): Promise<Admin | undefined> {
    const admin = this.admins.get(id);
    if (admin) {
      const updated = { ...admin, ...updates, updatedAt: new Date() };
      this.admins.set(id, updated);
      return updated;
    }
    return undefined;
  }
  async createSupportTicket(): Promise<SupportTicket> { throw new Error('Not implemented'); }
  async getSupportTicketsByUserId(): Promise<SupportTicket[]> { return []; }
  async getAllSupportTickets(): Promise<any> { return { tickets: [], total: 0, page: 1, totalPages: 1 }; }
  async getSupportTicket(): Promise<SupportTicket | undefined> { return undefined; }
  async updateSupportTicket(): Promise<SupportTicket | undefined> { return undefined; }
  async deleteSupportTicket(id: string): Promise<void> {
    this.supportTickets.delete(id);
  }
  async assignSupportTicket(): Promise<SupportTicket | undefined> { return undefined; }
  async getSystemSetting(): Promise<SystemSetting | undefined> { return undefined; }
  async getSystemSettingsByCategory(): Promise<SystemSetting[]> { return []; }
  async setSystemSetting(): Promise<SystemSetting> { throw new Error('Not implemented'); }
  async updateUserOtp(id: string, otpCode: string | null, otpExpiry: Date | null): Promise<User | undefined> {
    const user = this.users.get(id);
    if (user) {
      const updated = { ...user, otpCode, otpExpiry, updatedAt: new Date() };
      this.users.set(id, updated);
      return updated;
    }
    return undefined;
  }
  async verifyUserOtp(id: string, otpCode: string): Promise<boolean> {
    const user = this.users.get(id);
    if (!user || !user.otpCode || !user.otpExpiry) return false;
    
    const now = new Date();
    const isExpired = now > user.otpExpiry;
    const isValid = user.otpCode === otpCode;
    
    if (isValid && !isExpired) {
      const updated = { ...user, otpCode: null, otpExpiry: null, isPhoneVerified: true, updatedAt: new Date() };
      this.users.set(id, updated);
      return true;
    }
    
    return false;
  }
  async updateUserPassword(id: string, hashedPassword: string): Promise<User | undefined> {
    const user = this.users.get(id);
    if (user) {
      const updated = { ...user, password: hashedPassword, updatedAt: new Date() };
      this.users.set(id, updated);
      return updated;
    }
    return undefined;
  }
  async getPaymentRequest(id: string): Promise<PaymentRequest | undefined> { return this.paymentRequests.get(id); }

  // Savings Goals operations (stubs for MemStorage)
  async createSavingsGoal(): Promise<SavingsGoal> { throw new Error('Not implemented'); }
  async getSavingsGoalsByUserId(): Promise<SavingsGoal[]> { return []; }
  async getSavingsGoal(): Promise<SavingsGoal | undefined> { return undefined; }
  async updateSavingsGoal(): Promise<SavingsGoal | undefined> { return undefined; }

  // QR Payment operations (stubs for MemStorage)  
  async createQRPayment(): Promise<QRPayment> { throw new Error('Not implemented'); }
  async getQRPaymentByCode(): Promise<QRPayment | undefined> { return undefined; }
  async updateQRPayment(): Promise<QRPayment | undefined> { return undefined; }

  // Login History operations (stubs for MemStorage)
  async createLoginHistory(): Promise<LoginHistory> { throw new Error('Not implemented'); }
  async getLoginHistoryByUserId(): Promise<LoginHistory[]> { return []; }

  // API Configuration operations (stubs for MemStorage)
  async getApiConfiguration(): Promise<ApiConfiguration | undefined> { return undefined; }
  async getAllApiConfigurations(): Promise<ApiConfiguration[]> { return []; }
  async createApiConfiguration(): Promise<ApiConfiguration> { throw new Error('Not implemented'); }
  async updateApiConfiguration(): Promise<ApiConfiguration | undefined> { return undefined; }
  async deleteApiConfiguration(): Promise<void> {}
}

// Database Storage Implementation
export class DatabaseStorage implements IStorage {
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user || undefined;
  }

  async getUserByPhone(phone: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.phone, phone));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const hashedPassword = await bcrypt.hash(insertUser.password, 10);
    const [user] = await db
      .insert(users)
      .values({ ...insertUser, password: hashedPassword })
      .returning();
    return user;
  }

  async updateUser(id: string, updates: Partial<User>): Promise<User | undefined> {
    const [user] = await db
      .update(users)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    return user || undefined;
  }

  async updateUserOtp(id: string, otpCode: string | null, otpExpiry: Date | null): Promise<User | undefined> {
    const [user] = await db
      .update(users)
      .set({ otpCode, otpExpiry, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    return user || undefined;
  }

  async verifyUserOtp(id: string, otpCode: string): Promise<boolean> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    if (!user || !user.otpCode || !user.otpExpiry) return false;
    
    const now = new Date();
    const isExpired = now > user.otpExpiry;
    const isValid = user.otpCode === otpCode;
    
    if (isValid && !isExpired) {
      // Clear OTP after successful verification
      await db
        .update(users)
        .set({ otpCode: null, otpExpiry: null, isPhoneVerified: true, updatedAt: new Date() })
        .where(eq(users.id, id));
      return true;
    }
    
    return false;
  }

  async updateUserPassword(id: string, hashedPassword: string): Promise<User | undefined> {
    const [user] = await db
      .update(users)
      .set({ password: hashedPassword, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    return user || undefined;
  }

  async deleteUser(id: string): Promise<void> {
    // Delete ALL related data first (due to foreign key constraints)
    
    // Delete conversations and their messages
    const userConversations = await db.select().from(conversations).where(eq(conversations.userId, id));
    for (const conversation of userConversations) {
      await db.delete(messages).where(eq(messages.conversationId, conversation.id));
      await db.delete(conversations).where(eq(conversations.id, conversation.id));
    }
    
    // Delete other related data
    await db.delete(kycDocuments).where(eq(kycDocuments.userId, id));
    await db.delete(virtualCards).where(eq(virtualCards.userId, id));
    
    // Delete transactions where user is sender OR recipient
    await db.delete(transactions).where(eq(transactions.userId, id));
    await db.delete(transactions).where(eq(transactions.recipientId, id));
    
    await db.delete(paymentRequests).where(eq(paymentRequests.fromUserId, id));
    await db.delete(recipients).where(eq(recipients.userId, id));
    await db.delete(notifications).where(eq(notifications.userId, id));
    
    // Delete support tickets where user is creator OR assigned admin
    await db.delete(supportTickets).where(eq(supportTickets.userId, id));
    await db.delete(supportTickets).where(eq(supportTickets.assignedAdminId, id));
    
    // Delete chat messages where user is sender OR admin
    await db.delete(chatMessages).where(eq(chatMessages.userId, id));
    await db.delete(chatMessages).where(eq(chatMessages.adminId, id));
    
    await db.delete(savingsGoals).where(eq(savingsGoals.userId, id));
    await db.delete(qrPayments).where(eq(qrPayments.userId, id));
    await db.delete(scheduledPayments).where(eq(scheduledPayments.userId, id));
    await db.delete(budgets).where(eq(budgets.userId, id));
    await db.delete(userPreferences).where(eq(userPreferences.userId, id));
    
    // Finally delete the user
    await db.delete(users).where(eq(users.id, id));
  }

  // KYC operations
  async createKycDocument(insertKyc: InsertKycDocument): Promise<KycDocument> {
    const [kyc] = await db
      .insert(kycDocuments)
      .values(insertKyc)
      .returning();
    return kyc;
  }

  async getKycByUserId(userId: string): Promise<KycDocument | undefined> {
    const [kyc] = await db.select().from(kycDocuments).where(eq(kycDocuments.userId, userId));
    return kyc || undefined;
  }

  async updateKycDocument(id: string, updates: Partial<KycDocument>): Promise<KycDocument | undefined> {
    const [kyc] = await db
      .update(kycDocuments)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(kycDocuments.id, id))
      .returning();
    return kyc || undefined;
  }

  // Virtual Card operations
  async createVirtualCard(insertCard: InsertVirtualCard): Promise<VirtualCard> {
    const cardNumber = this.generateCardNumber();
    const cvv = this.generateCVV();
    const expiryDate = this.generateExpiryDate();
    
    const [card] = await db
      .insert(virtualCards)
      .values({ 
        ...insertCard, 
        cardNumber, 
        cvv, 
        expiryDate,
        purchaseAmount: "60.00"
      })
      .returning();
    return card;
  }

  async getVirtualCardByUserId(userId: string): Promise<VirtualCard | undefined> {
    const [card] = await db.select().from(virtualCards).where(eq(virtualCards.userId, userId));
    return card || undefined;
  }

  async updateVirtualCard(id: string, updates: Partial<VirtualCard>): Promise<VirtualCard | undefined> {
    const [card] = await db
      .update(virtualCards)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(virtualCards.id, id))
      .returning();
    return card || undefined;
  }

  // Transaction operations
  async createTransaction(insertTransaction: InsertTransaction): Promise<Transaction> {
    const reference = this.generateTransactionReference();
    const [transaction] = await db
      .insert(transactions)
      .values({ ...insertTransaction, reference })
      .returning();
    return transaction;
  }

  async getTransactionsByUserId(userId: string): Promise<Transaction[]> {
    return await db
      .select()
      .from(transactions)
      .where(eq(transactions.userId, userId))
      .orderBy(desc(transactions.createdAt));
  }

  async getTransaction(id: string): Promise<Transaction | undefined> {
    const [transaction] = await db.select().from(transactions).where(eq(transactions.id, id));
    return transaction || undefined;
  }

  async updateTransaction(id: string, updates: Partial<Transaction>): Promise<Transaction | undefined> {
    const [transaction] = await db
      .update(transactions)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(transactions.id, id))
      .returning();
    return transaction || undefined;
  }

  async updateWithdrawalRequest(id: string, updates: Partial<Transaction>): Promise<Transaction | undefined> {
    // Withdrawal requests are stored as transactions with type "withdraw"
    return this.updateTransaction(id, updates);
  }

  // Payment Request operations
  async createPaymentRequest(insertRequest: InsertPaymentRequest): Promise<PaymentRequest> {
    const [request] = await db
      .insert(paymentRequests)
      .values(insertRequest)
      .returning();
    return request;
  }

  async getPaymentRequestsByUserId(userId: string): Promise<PaymentRequest[]> {
    return await db
      .select()
      .from(paymentRequests)
      .where(eq(paymentRequests.fromUserId, userId))
      .orderBy(desc(paymentRequests.createdAt));
  }

  async updatePaymentRequest(id: string, updates: Partial<PaymentRequest>): Promise<PaymentRequest | undefined> {
    const [request] = await db
      .update(paymentRequests)
      .set(updates)
      .where(eq(paymentRequests.id, id))
      .returning();
    return request || undefined;
  }

  async getPaymentRequest(id: string): Promise<PaymentRequest | undefined> {
    const [request] = await db
      .select()
      .from(paymentRequests)
      .where(eq(paymentRequests.id, id));
    return request || undefined;
  }

  // Recipient operations
  async createRecipient(data: InsertRecipient): Promise<Recipient> {
    const [recipient] = await db
      .insert(recipients)
      .values(data)
      .returning();
    return recipient;
  }

  async getRecipientsByUserId(userId: string): Promise<Recipient[]> {
    return db
      .select()
      .from(recipients)
      .where(eq(recipients.userId, userId))
      .orderBy(desc(recipients.createdAt));
  }

  async getRecipient(id: string): Promise<Recipient | undefined> {
    const [recipient] = await db
      .select()
      .from(recipients)
      .where(eq(recipients.id, id));
    return recipient;
  }

  async updateRecipient(id: string, data: Partial<Recipient>): Promise<Recipient | undefined> {
    const [recipient] = await db
      .update(recipients)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(recipients.id, id))
      .returning();
    return recipient;
  }

  async deleteRecipient(id: string): Promise<void> {
    await db.delete(recipients).where(eq(recipients.id, id));
  }

  // Chat message operations
  async createChatMessage(message: InsertChatMessage): Promise<ChatMessage> {
    const [chatMessage] = await db
      .insert(chatMessages)
      .values({
        ...message,
        id: randomUUID(),
      })
      .returning();
    return chatMessage;
  }

  async getChatMessagesByConversation(conversationId: string): Promise<ChatMessage[]> {
    return await db
      .select()
      .from(chatMessages)
      .where(eq(chatMessages.conversationId, conversationId))
      .orderBy(chatMessages.createdAt);
  }

  async getChatMessagesByUserId(userId: string): Promise<ChatMessage[]> {
    return await db
      .select()
      .from(chatMessages)
      .where(eq(chatMessages.userId, userId))
      .orderBy(desc(chatMessages.createdAt));
  }

  async updateChatMessageStatus(id: string, status: string): Promise<ChatMessage | undefined> {
    const [chatMessage] = await db
      .update(chatMessages)
      .set({ status })
      .where(eq(chatMessages.id, id))
      .returning();
    return chatMessage;
  }

  private generateCardNumber(): string {
    return "4567" + Math.random().toString().slice(2, 14);
  }

  private generateCVV(): string {
    return Math.floor(Math.random() * 900 + 100).toString();
  }

  private generateExpiryDate(): string {
    const currentYear = new Date().getFullYear();
    const expiryYear = currentYear + 4;
    return `12/${expiryYear.toString().slice(-2)}`;
  }

  generateTransactionReference(): string {
    return 'GP' + Date.now().toString() + Math.random().toString(36).substr(2, 5).toUpperCase();
  }

  // Admin operations
  async getAdminByEmail(email: string): Promise<Admin | undefined> {
    const [admin] = await db.select().from(admins).where(eq(admins.email, email));
    return admin || undefined;
  }

  async createAdmin(insertAdmin: InsertAdmin): Promise<Admin> {
    const hashedPassword = await bcrypt.hash(insertAdmin.password, 10);
    const [admin] = await db
      .insert(admins)
      .values({ ...insertAdmin, password: hashedPassword })
      .returning();
    return admin;
  }

  async updateAdmin(id: string, updates: Partial<Admin>): Promise<Admin | undefined> {
    const [admin] = await db
      .update(admins)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(admins.id, id))
      .returning();
    return admin || undefined;
  }

  async createAdminLog(insertLog: InsertAdminLog): Promise<AdminLog> {
    const [log] = await db
      .insert(adminLogs)
      .values(insertLog)
      .returning();
    return log;
  }

  async getAdminLogs(): Promise<AdminLog[]> {
    return await db
      .select()
      .from(adminLogs)
      .orderBy(desc(adminLogs.createdAt));
  }

  async createSystemLog(insertLog: InsertSystemLog): Promise<SystemLog> {
    const [log] = await db
      .insert(systemLogs)
      .values(insertLog)
      .returning();
    return log;
  }

  async getSystemLogs(minutes: number = 30): Promise<SystemLog[]> {
    const timeAgo = new Date(Date.now() - minutes * 60 * 1000);
    return await db
      .select()
      .from(systemLogs)
      .where(gte(systemLogs.timestamp, timeAgo))
      .orderBy(desc(systemLogs.timestamp));
  }

  async deleteOldSystemLogs(minutes: number = 30): Promise<void> {
    const timeAgo = new Date(Date.now() - minutes * 60 * 1000);
    await db
      .delete(systemLogs)
      .where(lt(systemLogs.timestamp, timeAgo));
  }

  // Admin data operations
  async getAllUsers(): Promise<User[]> {
    return await db
      .select()
      .from(users)
      .orderBy(desc(users.createdAt));
  }

  async getAllTransactions(): Promise<Transaction[]> {
    return await db
      .select()
      .from(transactions)
      .orderBy(desc(transactions.createdAt));
  }

  async getAllKycDocuments(): Promise<KycDocument[]> {
    return await db
      .select()
      .from(kycDocuments)
      .orderBy(desc(kycDocuments.createdAt));
  }

  async getAllVirtualCards(): Promise<VirtualCard[]> {
    return await db
      .select()
      .from(virtualCards)
      .orderBy(desc(virtualCards.purchaseDate));
  }

  async getUsersCount(): Promise<number> {
    const result = await db.select({ count: count() }).from(users);
    return result[0].count;
  }

  async getTransactionsCount(): Promise<number> {
    const result = await db.select({ count: count() }).from(transactions);
    return result[0].count;
  }

  async getTotalVolume(): Promise<{ volume: number; revenue: number }> {
    const volumeResult = await db
      .select({ 
        totalVolume: sum(transactions.amount).mapWith(Number),
        totalFees: sum(transactions.fee).mapWith(Number)
      })
      .from(transactions)
      .where(eq(transactions.status, 'completed'));

    return {
      volume: volumeResult[0].totalVolume || 0,
      revenue: volumeResult[0].totalFees || 0
    };
  }

  // System settings
  async getSystemSetting(category: string, key: string): Promise<SystemSetting | undefined> {
    const [setting] = await db
      .select()
      .from(systemSettings)
      .where(eq(systemSettings.category, category))
      .where(eq(systemSettings.key, key))
      .orderBy(desc(systemSettings.updatedAt))
      .limit(1);
    return setting || undefined;
  }

  async setSystemSetting(insertSetting: InsertSystemSetting): Promise<SystemSetting> {
    const existing = await this.getSystemSetting(insertSetting.category, insertSetting.key);
    
    if (existing) {
      const [updated] = await db
        .update(systemSettings)
        .set({ 
          value: insertSetting.value, 
          description: insertSetting.description,
          updatedAt: new Date() 
        })
        .where(eq(systemSettings.id, existing.id))
        .returning();
      return updated;
    } else {
      const [setting] = await db
        .insert(systemSettings)
        .values(insertSetting)
        .returning();
      return setting;
    }
  }

  async updateSystemSetting(id: string, updates: Partial<SystemSetting>): Promise<SystemSetting | undefined> {
    const [setting] = await db
      .update(systemSettings)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(systemSettings.id, id))
      .returning();
    return setting || undefined;
  }

  async getSystemSettingsByCategory(category: string): Promise<SystemSetting[]> {
    return await db
      .select()
      .from(systemSettings)
      .where(eq(systemSettings.category, category))
      .orderBy(systemSettings.key);
  }

  async getSystemSettings(): Promise<SystemSetting[]> {
    return await db
      .select()
      .from(systemSettings)
      .orderBy(systemSettings.category, systemSettings.key);
  }

  async createSystemSetting(setting: InsertSystemSetting): Promise<SystemSetting> {
    return await this.setSystemSetting(setting);
  }

  // API Configuration operations
  async getApiConfiguration(provider: string): Promise<ApiConfiguration | undefined> {
    const [config] = await db
      .select()
      .from(apiConfigurations)
      .where(eq(apiConfigurations.provider, provider));
    return config || undefined;
  }

  async getAllApiConfigurations(): Promise<ApiConfiguration[]> {
    return await db
      .select()
      .from(apiConfigurations)
      .orderBy(apiConfigurations.provider);
  }

  async createApiConfiguration(insertConfig: InsertApiConfiguration): Promise<ApiConfiguration> {
    const [config] = await db
      .insert(apiConfigurations)
      .values(insertConfig)
      .returning();
    return config;
  }

  async updateApiConfiguration(provider: string, updates: Partial<ApiConfiguration>): Promise<ApiConfiguration | undefined> {
    const [config] = await db
      .update(apiConfigurations)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(apiConfigurations.provider, provider))
      .returning();
    return config || undefined;
  }

  async deleteApiConfiguration(provider: string): Promise<void> {
    await db
      .delete(apiConfigurations)
      .where(eq(apiConfigurations.provider, provider));
  }

  // Notification operations
  async createNotification(notification: InsertNotification): Promise<Notification> {
    const [newNotification] = await db
      .insert(notifications)
      .values(notification)
      .returning();
    return newNotification;
  }

  async getNotificationsByUserId(userId: string): Promise<Notification[]> {
    return await db
      .select()
      .from(notifications)
      .where(eq(notifications.userId, userId))
      .orderBy(desc(notifications.createdAt));
  }

  async getGlobalNotifications(): Promise<Notification[]> {
    return await db
      .select()
      .from(notifications)
      .where(eq(notifications.isGlobal, true))
      .orderBy(desc(notifications.createdAt));
  }

  async markNotificationAsRead(id: string): Promise<void> {
    await db
      .update(notifications)
      .set({ isRead: true })
      .where(eq(notifications.id, id));
  }

  async deleteNotification(id: string): Promise<void> {
    await db
      .delete(notifications)
      .where(eq(notifications.id, id));
  }

  // Support Ticket operations
  async createSupportTicket(ticket: InsertSupportTicket): Promise<SupportTicket> {
    const [newTicket] = await db
      .insert(supportTickets)
      .values(ticket)
      .returning();
    return newTicket;
  }

  async getSupportTicketsByUserId(userId: string): Promise<SupportTicket[]> {
    return await db
      .select()
      .from(supportTickets)
      .where(eq(supportTickets.userId, userId))
      .orderBy(desc(supportTickets.createdAt));
  }

  async getAllSupportTickets(filters: { status?: string; priority?: string; page?: number; limit?: number } = {}): Promise<{ tickets: SupportTicket[]; total: number; page: number; totalPages: number }> {
    const { status, priority, page = 1, limit = 20 } = filters;
    const offset = (page - 1) * limit;

    let query = db.select().from(supportTickets);
    let countQuery = db.select({ count: count() }).from(supportTickets);

    // Apply filters
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
      query
        .orderBy(desc(supportTickets.createdAt))
        .limit(limit)
        .offset(offset),
      countQuery
    ]);

    const total = totalResult[0]?.count || 0;
    const totalPages = Math.ceil(Number(total) / limit);

    return { tickets, total: Number(total), page, totalPages };
  }

  async getSupportTicket(id: string): Promise<SupportTicket | undefined> {
    const [ticket] = await db
      .select()
      .from(supportTickets)
      .where(eq(supportTickets.id, id));
    return ticket;
  }

  async updateSupportTicket(id: string, updates: Partial<SupportTicket>): Promise<SupportTicket | undefined> {
    const [updatedTicket] = await db
      .update(supportTickets)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(supportTickets.id, id))
      .returning();
    return updatedTicket;
  }

  async deleteSupportTicket(id: string): Promise<void> {
    await db
      .delete(supportTickets)
      .where(eq(supportTickets.id, id));
  }

  async assignSupportTicket(id: string, adminId: string): Promise<SupportTicket | undefined> {
    const [updatedTicket] = await db
      .update(supportTickets)
      .set({ 
        assignedAdminId: adminId, 
        status: 'in_progress', 
        updatedAt: new Date() 
      })
      .where(eq(supportTickets.id, id))
      .returning();
    return updatedTicket;
  }

  // Conversation operations
  async createConversation(insertConversation: InsertConversation): Promise<Conversation> {
    const [conversation] = await db
      .insert(conversations)
      .values(insertConversation)
      .returning();
    return conversation;
  }

  async getConversationsByUserId(userId: string): Promise<Conversation[]> {
    return await db
      .select()
      .from(conversations)
      .where(eq(conversations.userId, userId))
      .orderBy(desc(conversations.updatedAt));
  }

  async getConversationsByAdminId(adminId: string): Promise<Conversation[]> {
    return await db
      .select()
      .from(conversations)
      .where(eq(conversations.adminId, adminId))
      .orderBy(desc(conversations.updatedAt));
  }

  async getAllActiveConversations(): Promise<Conversation[]> {
    return await db
      .select()
      .from(conversations)
      .where(eq(conversations.status, "active"))
      .orderBy(desc(conversations.updatedAt));
  }

  async getConversation(id: string): Promise<Conversation | undefined> {
    const [conversation] = await db
      .select()
      .from(conversations)
      .where(eq(conversations.id, id));
    return conversation;
  }

  async updateConversation(id: string, updates: Partial<Conversation>): Promise<Conversation | undefined> {
    const [conversation] = await db
      .update(conversations)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(conversations.id, id))
      .returning();
    return conversation;
  }

  async deleteConversation(id: string): Promise<void> {
    // Delete all messages in the conversation first (due to foreign key constraints)
    await db.delete(messages).where(eq(messages.conversationId, id));
    // Then delete the conversation
    await db.delete(conversations).where(eq(conversations.id, id));
  }

  // Message operations
  async createMessage(insertMessage: InsertMessage): Promise<Message> {
    const [message] = await db
      .insert(messages)
      .values(insertMessage)
      .returning();
    
    // Update conversation's last message time
    await this.updateConversation(insertMessage.conversationId, {
      lastMessageAt: message.createdAt
    });
    
    return message;
  }

  async getMessagesByConversationId(conversationId: string): Promise<Message[]> {
    return await db
      .select()
      .from(messages)
      .where(eq(messages.conversationId, conversationId))
      .orderBy(messages.createdAt);
  }

  async getMessage(id: string): Promise<Message | undefined> {
    const [message] = await db
      .select()
      .from(messages)
      .where(eq(messages.id, id));
    return message;
  }

  async deleteMessage(id: string): Promise<void> {
    await db.delete(messages).where(eq(messages.id, id));
  }

  async markMessageAsRead(id: string): Promise<Message | undefined> {
    const [message] = await db
      .update(messages)
      .set({ readAt: new Date() })
      .where(eq(messages.id, id))
      .returning();
    return message;
  }

  async getUnreadMessagesCount(conversationId: string, userId: string): Promise<number> {
    const result = await db
      .select({ count: count() })
      .from(messages)
      .where(
        eq(messages.conversationId, conversationId)
      )
      .where(
        isNull(messages.readAt)
      );
    
    // Filter out messages from the current user
    const unreadMessages = await db
      .select()
      .from(messages)
      .where(
        eq(messages.conversationId, conversationId)
      )
      .where(
        isNull(messages.readAt)
      );
      
    return unreadMessages.filter(m => m.senderId !== userId).length;
  }

  // Savings Goals operations
  async createSavingsGoal(goal: InsertSavingsGoal): Promise<SavingsGoal> {
    const [savingsGoal] = await db
      .insert(savingsGoals)
      .values(goal)
      .returning();
    return savingsGoal;
  }

  async getSavingsGoalsByUserId(userId: string): Promise<SavingsGoal[]> {
    return await db
      .select()
      .from(savingsGoals)
      .where(eq(savingsGoals.userId, userId))
      .orderBy(desc(savingsGoals.createdAt));
  }

  async getSavingsGoal(id: string): Promise<SavingsGoal | undefined> {
    const [goal] = await db
      .select()
      .from(savingsGoals)
      .where(eq(savingsGoals.id, id));
    return goal || undefined;
  }

  async updateSavingsGoal(id: string, updates: Partial<SavingsGoal>): Promise<SavingsGoal | undefined> {
    const [goal] = await db
      .update(savingsGoals)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(savingsGoals.id, id))
      .returning();
    return goal || undefined;
  }

  // QR Payment operations
  async createQRPayment(payment: InsertQRPayment): Promise<QRPayment> {
    const [qrPayment] = await db
      .insert(qrPayments)
      .values(payment)
      .returning();
    return qrPayment;
  }

  async getQRPaymentByCode(paymentCode: string): Promise<QRPayment | undefined> {
    const [payment] = await db
      .select()
      .from(qrPayments)
      .where(eq(qrPayments.paymentCode, paymentCode));
    return payment || undefined;
  }

  async updateQRPayment(id: string, updates: Partial<QRPayment>): Promise<QRPayment | undefined> {
    const [payment] = await db
      .update(qrPayments)
      .set(updates)
      .where(eq(qrPayments.id, id))
      .returning();
    return payment || undefined;
  }

  // Login History operations
  async createLoginHistory(history: InsertLoginHistory): Promise<LoginHistory> {
    const [loginRecord] = await db
      .insert(loginHistory)
      .values(history)
      .returning();
    return loginRecord;
  }

  async getLoginHistoryByUserId(userId: string, limit: number = 10): Promise<LoginHistory[]> {
    const history = await db
      .select()
      .from(loginHistory)
      .where(eq(loginHistory.userId, userId))
      .orderBy(desc(loginHistory.createdAt))
      .limit(limit);
    return history;
  }
}

// Use DatabaseStorage instead of MemStorage
export const storage = new DatabaseStorage();

// Keep MemStorage for fallback if needed
export const memStorage = new MemStorage();

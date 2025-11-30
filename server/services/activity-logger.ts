import { db } from "../db";
import { systemLogs } from "@shared/schema";

export interface ActivityLog {
  userId: string;
  action: string;
  type: "login" | "logout" | "transaction" | "kyc" | "card" | "security" | "account";
  description: string;
  ipAddress?: string;
  metadata?: any;
}

export class ActivityLogger {
  static async logActivity(log: ActivityLog) {
    try {
      const logEntry = {
        level: "info",
        message: `[${log.type.toUpperCase()}] ${log.action}`,
        source: `user_activity:${log.userId}`,
        data: {
          userId: log.userId,
          action: log.action,
          type: log.type,
          description: log.description,
          ipAddress: log.ipAddress,
          metadata: log.metadata,
          timestamp: new Date().toISOString(),
        },
      };

      await db.insert(systemLogs).values(logEntry);
      console.log(`✅ Activity logged: ${log.type} - ${log.action}`);
    } catch (error) {
      console.error("Failed to log activity:", error);
    }
  }

  static async logLogin(userId: string, ipAddress?: string) {
    await this.logActivity({
      userId,
      action: "User login",
      type: "login",
      description: `User ${userId} logged in successfully`,
      ipAddress,
    });
  }

  static async logLogout(userId: string, ipAddress?: string) {
    await this.logActivity({
      userId,
      action: "User logout",
      type: "logout",
      description: `User ${userId} logged out`,
      ipAddress,
    });
  }

  static async logTransaction(userId: string, txnId: string, amount: string, type: string, status: string) {
    await this.logActivity({
      userId,
      action: `Transaction ${type}`,
      type: "transaction",
      description: `${type} of ${amount} - Status: ${status}`,
      metadata: { transactionId: txnId, amount, status },
    });
  }

  static async logKYC(userId: string, status: string, docType: string) {
    await this.logActivity({
      userId,
      action: `KYC ${status}`,
      type: "kyc",
      description: `${docType} document ${status.toLowerCase()}`,
      metadata: { docType, status },
    });
  }

  static async logCardActivity(userId: string, action: string, cardId: string) {
    await this.logActivity({
      userId,
      action: `Card ${action}`,
      type: "card",
      description: `Virtual card ${action.toLowerCase()}`,
      metadata: { cardId },
    });
  }

  static async logSecurityChange(userId: string, action: string, details: string) {
    await this.logActivity({
      userId,
      action: `Security: ${action}`,
      type: "security",
      description: details,
    });
  }

  static async logAccountChange(userId: string, action: string, details: string) {
    await this.logActivity({
      userId,
      action: `Account: ${action}`,
      type: "account",
      description: details,
    });
  }
}

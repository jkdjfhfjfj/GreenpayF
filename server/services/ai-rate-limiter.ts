import { db } from "../db";
import { aiUsage } from "@shared/schema";
import { eq } from "drizzle-orm";

const DAILY_LIMIT = 5;
const ONE_DAY_MS = 86400000;

export class AIRateLimiter {
  async checkAndUpdateLimit(userId: string | null, ipAddress?: string): Promise<{
    allowed: boolean;
    error?: string;
    remainingRequests: number;
  }> {
    // Use user ID if available, otherwise use IP for guest tracking
    const trackingId = userId || ipAddress || 'anonymous';
    if (!trackingId || trackingId === 'anonymous') {
      return { allowed: true, remainingRequests: 5 };
    }

    const now = new Date();
    const oneDayAgo = new Date(Date.now() - ONE_DAY_MS);

    // For guest users, create a virtual user ID based on IP
    const finalUserId = userId || `guest-${ipAddress}`;

    // Get or create user's AI usage record
    let usage = await db.query.aiUsage.findFirst({
      where: eq(aiUsage.userId, finalUserId),
    });

    if (!usage) {
      // Create new usage record
      const newUsage = await db
        .insert(aiUsage)
        .values({
          userId: finalUserId,
          dailyCount: 0,
          lastResetDate: now,
        })
        .returning();
      usage = newUsage[0];
    }

    // Check if we need to reset (more than 24 hours passed)
    if (usage.lastResetDate && new Date(usage.lastResetDate) < oneDayAgo) {
      // Reset the counter
      await db
        .update(aiUsage)
        .set({ dailyCount: 0, lastResetDate: now })
        .where(eq(aiUsage.userId, finalUserId));
      usage.dailyCount = 0;
    }

    // Check if user exceeded limit
    if (usage.dailyCount >= DAILY_LIMIT) {
      return {
        allowed: false,
        error: `You've used all 5 daily requests. Please try again tomorrow.`,
        remainingRequests: 0,
      };
    }

    // Increment the counter
    const newCount = (usage.dailyCount || 0) + 1;
    await db
      .update(aiUsage)
      .set({ dailyCount: newCount, updatedAt: new Date() })
      .where(eq(aiUsage.userId, finalUserId));

    const remainingRequests = DAILY_LIMIT - newCount;

    return { allowed: true, remainingRequests };
  }

  async getRemainingRequests(userId: string | null, ipAddress?: string): Promise<number> {
    const trackingId = userId || ipAddress;
    if (!trackingId) {
      return DAILY_LIMIT;
    }

    const oneDayAgo = new Date(Date.now() - ONE_DAY_MS);
    const finalUserId = userId || `guest-${ipAddress}`;

    let usage = await db.query.aiUsage.findFirst({
      where: eq(aiUsage.userId, finalUserId),
    });

    if (!usage) {
      return DAILY_LIMIT;
    }

    // Check if we need to reset
    if (usage.lastResetDate && new Date(usage.lastResetDate) < oneDayAgo) {
      await db
        .update(aiUsage)
        .set({ dailyCount: 0, lastResetDate: new Date() })
        .where(eq(aiUsage.userId, finalUserId));
      return DAILY_LIMIT;
    }

    return Math.max(0, DAILY_LIMIT - (usage.dailyCount || 0));
  }
}

export const aiRateLimiter = new AIRateLimiter();

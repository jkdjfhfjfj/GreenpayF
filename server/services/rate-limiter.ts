interface RateLimitConfig {
  minuteLimit: number;
  dailyLimit: number;
}

interface UserUsage {
  minuteCount: number;
  minuteResetTime: number;
  dailyCount: number;
  dailyResetTime: number;
}

const DEFAULT_CONFIG: RateLimitConfig = {
  minuteLimit: 10, // 10 requests per minute
  dailyLimit: 5, // 5 requests per day
};

class RateLimiter {
  private userUsage: Map<string, UserUsage> = new Map();
  private config: RateLimitConfig;

  constructor(config: Partial<RateLimitConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  checkLimit(userId: string): { allowed: boolean; error?: string; remainingRequests?: number } {
    const now = Date.now();
    let usage = this.userUsage.get(userId);

    if (!usage) {
      usage = {
        minuteCount: 0,
        minuteResetTime: now + 60000,
        dailyCount: 0,
        dailyResetTime: now + 86400000,
      };
      this.userUsage.set(userId, usage);
    }

    // Reset minute counter if needed
    if (now >= usage.minuteResetTime) {
      usage.minuteCount = 0;
      usage.minuteResetTime = now + 60000;
    }

    // Reset daily counter if needed
    if (now >= usage.dailyResetTime) {
      usage.dailyCount = 0;
      usage.dailyResetTime = now + 86400000;
    }

    // Check minute limit
    if (usage.minuteCount >= this.config.minuteLimit) {
      return {
        allowed: false,
        error: `Minute limit reached. Please try again in a moment.`,
        remainingRequests: this.config.dailyLimit - usage.dailyCount,
      };
    }

    // Check daily limit
    if (usage.dailyCount >= this.config.dailyLimit) {
      return {
        allowed: false,
        error: `You've used all 5 daily requests. Please try again tomorrow.`,
        remainingRequests: 0,
      };
    }

    // Increment counters
    usage.minuteCount++;
    usage.dailyCount++;

    // Calculate remaining requests
    const remainingRequests = this.config.dailyLimit - usage.dailyCount;

    return { allowed: true, remainingRequests };
  }
}

export const rateLimiter = new RateLimiter({
  minuteLimit: 10,
  dailyLimit: 5,
});

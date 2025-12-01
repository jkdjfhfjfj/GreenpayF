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
  dailyLimit: 100, // 100 requests per day
};

class RateLimiter {
  private userUsage: Map<string, UserUsage> = new Map();
  private config: RateLimitConfig;

  constructor(config: Partial<RateLimitConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  checkLimit(userId: string): { allowed: boolean; error?: string } {
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
        error: `Minute limit reached (${this.config.minuteLimit} requests/minute). Please try again in a moment.`,
      };
    }

    // Check daily limit
    if (usage.dailyCount >= this.config.dailyLimit) {
      return {
        allowed: false,
        error: `Daily limit reached (${this.config.dailyLimit} requests/day). Please try again tomorrow.`,
      };
    }

    // Increment counters
    usage.minuteCount++;
    usage.dailyCount++;

    return { allowed: true };
  }
}

export const rateLimiter = new RateLimiter({
  minuteLimit: 10,
  dailyLimit: 100,
});

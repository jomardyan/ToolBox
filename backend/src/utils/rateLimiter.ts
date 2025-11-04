// backend/src/utils/rateLimiter.ts

import Redis from 'ioredis';

export interface RateLimitConfig {
  windowMs: number; // Time window in ms
  maxRequests: number; // Max requests per window
}

export class RateLimiter {
  private redis: Redis;
  
  constructor(redisUrl?: string) {
    this.redis = new Redis(redisUrl || process.env.REDIS_URL || 'redis://localhost:6379');
  }

  /**
   * Check if request is within rate limit
   * Uses sliding window log algorithm
   */
  async isAllowed(
    key: string,
    config: RateLimitConfig
  ): Promise<{ allowed: boolean; remaining: number; resetAt: number }> {
    const now = Date.now();
    const windowStart = now - config.windowMs;
    const redisKey = `rate_limit:${key}`;

    // Remove old entries outside the window
    await this.redis.zremrangebyscore(redisKey, 0, windowStart);

    // Count current requests
    const requestCount = await this.redis.zcard(redisKey);
    const allowed = requestCount < config.maxRequests;

    if (allowed) {
      // Add current request
      await this.redis.zadd(redisKey, now, `${now}-${Math.random()}`);
      // Set expiration
      await this.redis.expire(redisKey, Math.ceil(config.windowMs / 1000) + 1);
    }

    const resetAt = now + config.windowMs;
    const remaining = Math.max(0, config.maxRequests - requestCount - 1);

    return {
      allowed,
      remaining,
      resetAt
    };
  }

  /**
   * Get current usage
   */
  async getUsage(key: string, windowMs: number): Promise<number> {
    const now = Date.now();
    const windowStart = now - windowMs;
    const redisKey = `rate_limit:${key}`;

    await this.redis.zremrangebyscore(redisKey, 0, windowStart);
    return await this.redis.zcard(redisKey);
  }

  /**
   * Reset rate limit for a key
   */
  async reset(key: string): Promise<void> {
    await this.redis.del(`rate_limit:${key}`);
  }

  /**
   * Close Redis connection
   */
  async close(): Promise<void> {
    await this.redis.quit();
  }
}

export default RateLimiter;

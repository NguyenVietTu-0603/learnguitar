import Redis from 'ioredis';

class InMemoryRedisFallback {
  constructor() {
    this.store = new Map();
  }

  async get(key) {
    const item = this.store.get(key);
    if (!item) return null;
    if (item.expireAt && Date.now() > item.expireAt) {
      this.store.delete(key);
      return null;
    }
    return item.value;
  }

  async set(key, value, mode, ttlSeconds) {
    let expireAt = null;
    if (mode === 'EX' && Number.isFinite(ttlSeconds)) {
      expireAt = Date.now() + ttlSeconds * 1000;
    }
    this.store.set(key, { value, expireAt });
    return 'OK';
  }

  async del(...keys) {
    keys.forEach((key) => this.store.delete(key));
    return keys.length;
  }

  async keys(pattern) {
    if (!pattern.includes('*')) {
      return this.store.has(pattern) ? [pattern] : [];
    }

    const escaped = pattern
      .replace(/[.+?^${}()|[\]\\]/g, '\\$&')
      .replace(/\*/g, '.*');
    const regex = new RegExp(`^${escaped}$`);
    return [...this.store.keys()].filter((key) => regex.test(key));
  }
}

let redisClient;

if (process.env.REDIS_URL) {
  redisClient = new Redis(process.env.REDIS_URL, {
    maxRetriesPerRequest: 1,
    enableReadyCheck: true,
    lazyConnect: true,
  });

  redisClient.connect().catch((error) => {
    console.warn('Redis connection failed, fallback cache will be used:', error.message);
    redisClient = new InMemoryRedisFallback();
  });
} else {
  redisClient = new InMemoryRedisFallback();
}

export const redis = redisClient;
export default redis;

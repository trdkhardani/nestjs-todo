import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Inject, Injectable } from '@nestjs/common';
import { type Cache } from 'cache-manager';

@Injectable()
export class CacheService {
  constructor(@Inject(CACHE_MANAGER) private cacheManager: Cache) {}

  async get(key: string): Promise<unknown> {
    return this.cacheManager.get(key);
  }

  async set(key: string, value: unknown, ttl?: number): Promise<boolean> {
    await this.cacheManager.set(key, value, ttl);
    return true;
  }

  async delete(key: string): Promise<void> {
    await this.cacheManager.del(key);
  }
}

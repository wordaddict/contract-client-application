const cacheService = require('./cacheService');

describe('CacheService', () => {
    beforeEach(() => {
        cacheService.clear();
    });

    it('should set and get values', () => {
        const key = 'test-key';
        const value = { data: 'test-value' };

        cacheService.set(key, value);
        const result = cacheService.get(key);

        expect(result).toEqual(value);
    });

    it('should return null for non-existent keys', () => {
        const result = cacheService.get('non-existent');
        expect(result).toBeNull();
    });

    it('should delete values', () => {
        const key = 'test-key';
        const value = { data: 'test-value' };

        cacheService.set(key, value);
        cacheService.delete(key);
        const result = cacheService.get(key);

        expect(result).toBeNull();
    });

    it('should clear all values', () => {
        cacheService.set('key1', 'value1');
        cacheService.set('key2', 'value2');

        cacheService.clear();
        const stats = cacheService.getStats();

        expect(stats.size).toBe(0);
    });

    it('should clear values by pattern', () => {
        cacheService.set('user:1', 'value1');
        cacheService.set('user:2', 'value2');
        cacheService.set('other:1', 'value3');

        cacheService.clearByPattern('user:');
        const stats = cacheService.getStats();

        expect(stats.size).toBe(1);
        expect(stats.keys).toContain('other:1');
    });

    it('should expire values after TTL', async () => {
        const shortTTL = 100; // 100ms
        const shortCache = new (require('./cacheService').constructor)(shortTTL);
        
        shortCache.set('key', 'value');
        
        // Wait for TTL to expire
        await new Promise(resolve => setTimeout(resolve, shortTTL + 50));
        
        const result = shortCache.get('key');
        expect(result).toBeNull();
    });

    it('should return correct cache statistics', () => {
        cacheService.set('key1', 'value1');
        cacheService.set('key2', 'value2');

        const stats = cacheService.getStats();

        expect(stats.size).toBe(2);
        expect(stats.keys).toContain('key1');
        expect(stats.keys).toContain('key2');
    });
}); 
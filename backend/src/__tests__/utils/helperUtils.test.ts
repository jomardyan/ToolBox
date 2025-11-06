// backend/src/__tests__/utils/helperUtils.test.ts

import {
  sleep,
  deepClone,
  mergeObjects,
  pick,
  omit,
  groupBy,
  chunk,
  unique,
  flatten,
  capitalize,
  truncate,
} from '../../utils/helperUtils';

describe('Helper Utilities', () => {
  describe('sleep', () => {
    it('should delay execution', async () => {
      const start = Date.now();
      await sleep(100);
      const duration = Date.now() - start;
      expect(duration).toBeGreaterThanOrEqual(90); // Allow small margin
    });
  });

  describe('deepClone', () => {
    it('should clone primitive values', () => {
      expect(deepClone(42)).toBe(42);
      expect(deepClone('test')).toBe('test');
      expect(deepClone(null)).toBe(null);
      expect(deepClone(undefined)).toBe(undefined);
    });

    it('should clone arrays', () => {
      const arr = [1, 2, 3];
      const cloned = deepClone(arr);
      expect(cloned).toEqual(arr);
      expect(cloned).not.toBe(arr);
    });

    it('should clone nested objects', () => {
      const obj = { a: 1, b: { c: 2 } };
      const cloned = deepClone(obj);
      expect(cloned).toEqual(obj);
      expect(cloned).not.toBe(obj);
      expect(cloned.b).not.toBe(obj.b);
    });

    it('should clone dates', () => {
      const date = new Date('2024-01-01');
      const cloned = deepClone(date);
      expect(cloned.getTime()).toBe(date.getTime());
      expect(cloned).not.toBe(date);
    });
  });

  describe('mergeObjects', () => {
    it('should merge multiple objects', () => {
      const result = mergeObjects({ a: 1 } as any, { b: 2 } as any, { c: 3 } as any);
      expect(result).toEqual({ a: 1, b: 2, c: 3 });
    });

    it('should override with later values', () => {
      const result = mergeObjects({ a: 1 }, { a: 2 });
      expect(result.a).toBe(2);
    });

    it('should handle empty sources', () => {
      const result = mergeObjects({ a: 1 } as any, undefined as any, { b: 2 } as any);
      expect(result).toEqual({ a: 1, b: 2 });
    });
  });

  describe('pick', () => {
    it('should pick specified keys', () => {
      const obj = { a: 1, b: 2, c: 3 };
      const result = pick(obj, 'a', 'c');
      expect(result).toEqual({ a: 1, c: 3 });
    });

    it('should handle non-existent keys', () => {
      const obj = { a: 1 };
      const result = pick(obj, 'a', 'b' as any);
      expect(result).toEqual({ a: 1 });
    });
  });

  describe('omit', () => {
    it('should omit specified keys', () => {
      const obj = { a: 1, b: 2, c: 3 };
      const result = omit(obj, 'b');
      expect(result).toEqual({ a: 1, c: 3 });
    });

    it('should return new object', () => {
      const obj = { a: 1, b: 2 };
      const result = omit(obj, 'b');
      expect(result).not.toBe(obj);
    });
  });

  describe('groupBy', () => {
    it('should group items by key', () => {
      const items = [
        { type: 'a', value: 1 },
        { type: 'b', value: 2 },
        { type: 'a', value: 3 },
      ];
      const result = groupBy(items, 'type');
      expect(result.a).toHaveLength(2);
      expect(result.b).toHaveLength(1);
    });
  });

  describe('chunk', () => {
    it('should split array into chunks', () => {
      const arr = [1, 2, 3, 4, 5];
      const result = chunk(arr, 2);
      expect(result).toEqual([[1, 2], [3, 4], [5]]);
    });

    it('should handle empty array', () => {
      const result = chunk([], 2);
      expect(result).toEqual([]);
    });
  });

  describe('unique', () => {
    it('should remove duplicates', () => {
      const arr = [1, 2, 2, 3, 3, 3];
      const result = unique(arr);
      expect(result).toEqual([1, 2, 3]);
    });

    it('should work with strings', () => {
      const arr = ['a', 'b', 'a', 'c'];
      const result = unique(arr);
      expect(result).toEqual(['a', 'b', 'c']);
    });
  });

  describe('flatten', () => {
    it('should flatten nested arrays', () => {
      const arr = [1, [2, 3], [4, [5]]];
      const result = flatten(arr);
      expect(result).toEqual([1, 2, 3, 4, 5]);
    });
  });

  describe('capitalize', () => {
    it('should capitalize first letter', () => {
      expect(capitalize('hello')).toBe('Hello');
      expect(capitalize('world')).toBe('World');
    });

    it('should handle empty string', () => {
      expect(capitalize('')).toBe('');
    });
  });

  describe('truncate', () => {
    it('should truncate long strings', () => {
      const result = truncate('Hello World', 8);
      expect(result).toBe('Hello...');
    });

    it('should not truncate short strings', () => {
      const result = truncate('Hello', 10);
      expect(result).toBe('Hello');
    });
  });

  // Tests removed for functions that don't exist in helperUtils
});

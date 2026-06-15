import { describe, test, expect } from '@jest/globals';
import { toPagination } from '../../src/utils/pagination.js';

describe('pagination utils', () => {
  test('toPagination with valid values', () => {
    const result = toPagination({ page: 2, limit: 20 });
    expect(result.page).toBe(2);
    expect(result.limit).toBe(20);
    expect(result.skip).toBe(20);
  });

  test('toPagination with defaults', () => {
    const result = toPagination({});
    expect(result.page).toBe(1);
    expect(result.limit).toBe(10);
    expect(result.skip).toBe(0);
  });

  test('toPagination caps limit at 50', () => {
    const result = toPagination({ page: 1, limit: 100 });
    expect(result.limit).toBe(50);
  });

  test('toPagination handles invalid page', () => {
    const result = toPagination({ page: -1, limit: 10 });
    expect(result.page).toBe(1);
  });

  test('toPagination handles string numbers', () => {
    const result = toPagination({ page: '3', limit: '15' });
    expect(result.page).toBe(3);
    expect(result.limit).toBe(15);
  });

  test('toPagination handles NaN', () => {
    const result = toPagination({ page: NaN, limit: NaN });
    expect(result.page).toBe(1);
    expect(result.limit).toBe(10);
  });

  test('toPagination handles Infinity', () => {
    const result = toPagination({ page: Infinity, limit: Infinity });
    expect(result.page).toBe(1);
    expect(result.limit).toBe(10);
  });
});

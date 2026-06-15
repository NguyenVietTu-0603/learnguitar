import { describe, test, expect } from '@jest/globals';
import { AppError } from '../../src/exceptions/AppError.js';

describe('AppError', () => {
  test('creates error with default values', () => {
    const error = new AppError('Something went wrong');
    expect(error.message).toBe('Something went wrong');
    expect(error.statusCode).toBe(400);
    expect(error.details).toBeNull();
    expect(error.name).toBe('AppError');
    expect(error).toBeInstanceOf(Error);
    expect(error).toBeInstanceOf(AppError);
  });

  test('creates error with custom statusCode', () => {
    const error = new AppError('Not found', 404);
    expect(error.statusCode).toBe(404);
  });

  test('creates error with details', () => {
    const details = [{ field: 'email', message: 'Invalid email' }];
    const error = new AppError('Validation failed', 400, details);
    expect(error.details).toEqual(details);
  });
});

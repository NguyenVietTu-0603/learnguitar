import { describe, test, expect } from '@jest/globals';
import { asyncHandler, authorize } from '../../src/middleware/auth.middleware.js';

describe('Auth Middleware', () => {
  describe('asyncHandler', () => {
    test('passes resolved value through', async () => {
      const next = jest.fn();
      const mockReq = {};
      const mockRes = {};
      const mockFn = jest.fn(() => Promise.resolve('result'));
      const handler = asyncHandler(mockFn);
      await handler(mockReq, mockRes, next);
      expect(mockFn).toHaveBeenCalledWith(mockReq, mockRes, next);
    });

    test('passes errors to next', async () => {
      const error = new Error('test error');
      const next = jest.fn();
      const mockReq = {};
      const mockRes = {};
      const mockFn = jest.fn(() => Promise.reject(error));
      const handler = asyncHandler(mockFn);
      await handler(mockReq, mockRes, next);
      expect(next).toHaveBeenCalledWith(error);
    });
  });

  describe('authorize', () => {
    test('calls next for allowed role', () => {
      const middleware = authorize('admin');
      const req = { user: { role: 'admin' } };
      const res = {};
      const next = jest.fn();
      middleware(req, res, next);
      expect(next).toHaveBeenCalled();
    });

    test('returns 401 when no user', () => {
      const middleware = authorize('admin');
      const req = {};
      const res = { status: jest.fn(() => res), json: jest.fn() };
      const next = jest.fn();
      middleware(req, res, next);
      expect(res.status).toHaveBeenCalledWith(401);
      expect(next).not.toHaveBeenCalled();
    });

    test('returns 403 for unauthorized role', () => {
      const middleware = authorize('admin');
      const req = { user: { role: 'user' } };
      const res = { status: jest.fn(() => res), json: jest.fn() };
      const next = jest.fn();
      middleware(req, res, next);
      expect(res.status).toHaveBeenCalledWith(403);
      expect(next).not.toHaveBeenCalled();
    });
  });
});

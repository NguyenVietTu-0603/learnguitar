import { describe, test, expect } from '@jest/globals';
import { successResponse, errorResponse } from '../../src/utils/apiResponse.js';

describe('apiResponse utils', () => {
  const mockRes = {
    status: jest.fn(() => mockRes),
    json: jest.fn(() => mockRes),
  };

  beforeEach(() => {
    mockRes.status.mockClear();
    mockRes.json.mockClear();
  });

  describe('successResponse', () => {
    test('returns res with default status 200', () => {
      const result = successResponse(mockRes, {});
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(result).toBe(mockRes);
    });

    test('returns res with custom statusCode', () => {
      successResponse(mockRes, { statusCode: 201 });
      expect(mockRes.status).toHaveBeenCalledWith(201);
    });

    test('includes message in payload', () => {
      successResponse(mockRes, { message: 'Created' });
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({ success: true, message: 'Created' })
      );
    });

    test('includes data in payload', () => {
      successResponse(mockRes, { data: { id: 1 } });
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({ data: { id: 1 } })
      );
    });

    test('includes meta in payload', () => {
      successResponse(mockRes, { meta: { total: 100 } });
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({ meta: { total: 100 } })
      );
    });

    test('includes all fields together', () => {
      successResponse(mockRes, { statusCode: 200, message: 'OK', data: { x: 1 }, meta: { y: 2 } });
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        message: 'OK',
        data: { x: 1 },
        meta: { y: 2 },
      });
    });
  });

  describe('errorResponse', () => {
    test('returns res with default status 400', () => {
      errorResponse(mockRes, { message: 'Error' });
      expect(mockRes.status).toHaveBeenCalledWith(400);
    });

    test('returns res with custom statusCode', () => {
      errorResponse(mockRes, { statusCode: 404, message: 'Not found' });
      expect(mockRes.status).toHaveBeenCalledWith(404);
    });

    test('includes message in payload', () => {
      errorResponse(mockRes, { message: 'Bad request' });
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: 'Bad request',
      });
    });

    test('includes errors in payload', () => {
      errorResponse(mockRes, { message: 'Validation failed', errors: ['field required'] });
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: 'Validation failed',
        errors: ['field required'],
      });
    });
  });
});

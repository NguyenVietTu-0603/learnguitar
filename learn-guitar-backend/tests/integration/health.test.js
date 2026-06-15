import { describe, test, expect, beforeAll } from '@jest/globals';
import request from 'supertest';
import express from 'express';

const createApp = () => {
  const app = express();
  app.use(express.json());
  app.get('/api/v1/health', (req, res) => {
    res.status(200).json({
      success: true,
      message: 'Learn Guitar Backend is running!',
      timestamp: new Date().toISOString()
    });
  });
  return app;
};

describe('Health Check API', () => {
  let app;
  beforeAll(() => { app = createApp(); });

  test('GET /api/v1/health returns 200 and success response', async () => {
    const res = await request(app).get('/api/v1/health');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.message).toBe('Learn Guitar Backend is running!');
    expect(res.body.timestamp).toBeDefined();
  });
});

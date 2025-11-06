// backend/src/__tests__/routes/conversionRoutes.test.ts

import request from 'supertest';
import express, { Express } from 'express';
import conversionRoutes from '../../routes/conversionRoutes';

jest.mock('../../utils/logger');

describe('Conversion Routes', () => {
  let app: Express;

  beforeAll(() => {
    app = express();
    app.use(express.json({ limit: '10mb' })); // Allow up to 10MB for testing
    app.use('/api', conversionRoutes);
  });

  describe('POST /api/convert', () => {
    it('should convert CSV to JSON successfully', async () => {
      const response = await request(app)
        .post('/api/convert')
        .send({
          data: 'name,age\nJohn,30\nJane,25',
          sourceFormat: 'csv',
          targetFormat: 'json',
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
    });

    it('should reject request without data', async () => {
      const response = await request(app)
        .post('/api/convert')
        .send({
          sourceFormat: 'csv',
          targetFormat: 'json',
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Data is required');
    });

    it('should reject request without formats', async () => {
      const response = await request(app)
        .post('/api/convert')
        .send({
          data: 'test data',
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Source and target formats are required');
    });

    it('should reject invalid source format', async () => {
      const response = await request(app)
        .post('/api/convert')
        .send({
          data: 'test data',
          sourceFormat: 'invalid',
          targetFormat: 'json',
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('Invalid format');
    });

    it('should reject invalid target format', async () => {
      const response = await request(app)
        .post('/api/convert')
        .send({
          data: 'name,age\nJohn,30',
          sourceFormat: 'csv',
          targetFormat: 'invalid',
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('Invalid format');
    });

    it('should reject data larger than 5MB', async () => {
      const largeData = 'x'.repeat(6 * 1024 * 1024); // 6MB

      const response = await request(app)
        .post('/api/convert')
        .send({
          data: largeData,
          sourceFormat: 'csv',
          targetFormat: 'json',
        });

      expect(response.status).toBe(413);
      expect(response.body.error).toContain('Data too large');
    });

    it('should convert JSON to XML', async () => {
      const jsonData = '[{"name":"John","age":30}]';

      const response = await request(app)
        .post('/api/convert')
        .send({
          data: jsonData,
          sourceFormat: 'json',
          targetFormat: 'xml',
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toContain('<?xml');
    });

    it('should convert CSV to YAML', async () => {
      const response = await request(app)
        .post('/api/convert')
        .send({
          data: 'name,age\nJohn,30',
          sourceFormat: 'csv',
          targetFormat: 'yaml',
        });

      expect(response.status).toBe(200);
      expect(response.body.data).toBeDefined();
    });
  });

  describe('GET /api/health', () => {
    it('should return health status', async () => {
      const response = await request(app).get('/api/health');

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('ok');
      expect(response.body.service).toBe('conversion-api');
    });
  });
});

// backend/src/__tests__/middleware/apiVersion.test.ts

import { Request, Response, NextFunction } from 'express';
import {
  apiVersionMiddleware,
  requireApiVersion,
  deprecateApiVersion,
} from '../../middleware/apiVersion';

describe('API Version Middleware', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(() => {
    jest.clearAllMocks();

    mockRequest = {
      path: '/api/convert',
      headers: {},
    };

    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
      setHeader: jest.fn(),
    };

    mockNext = jest.fn();
  });

  describe('apiVersionMiddleware', () => {
    it('should extract version from URL path', () => {
      const reqWithPath = { ...mockRequest, path: '/api/v2/convert' } as Request;

      apiVersionMiddleware(
        reqWithPath,
        mockResponse as Response,
        mockNext
      );

      expect(reqWithPath.headers!['x-api-version']).toBe('2');
      expect(mockResponse.setHeader).toHaveBeenCalledWith('X-API-Version', '2');
      expect(mockNext).toHaveBeenCalled();
    });

    it('should extract version from Accept header', () => {
      mockRequest.headers = {
        accept: 'application/vnd.api.v3+json',
      };

      apiVersionMiddleware(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockRequest.headers['x-api-version']).toBe('3');
      expect(mockResponse.setHeader).toHaveBeenCalledWith('X-API-Version', '3');
      expect(mockNext).toHaveBeenCalled();
    });

    it('should default to v1 when no version specified', () => {
      apiVersionMiddleware(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockRequest.headers!['x-api-version']).toBe('1');
      expect(mockResponse.setHeader).toHaveBeenCalledWith('X-API-Version', '1');
      expect(mockNext).toHaveBeenCalled();
    });

    it('should prioritize URL path version over Accept header', () => {
      const reqWithPath = {
        ...mockRequest,
        path: '/api/v2/convert',
        headers: { accept: 'application/vnd.api.v1+json' },
      } as Request;

      apiVersionMiddleware(
        reqWithPath,
        mockResponse as Response,
        mockNext
      );

      expect(reqWithPath.headers!['x-api-version']).toBe('2');
    });
  });

  describe('requireApiVersion', () => {
    beforeEach(() => {
      mockRequest.headers = { 'x-api-version': '2' };
    });

    it('should allow request when version meets minimum', () => {
      const middleware = requireApiVersion(2);

      middleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(mockResponse.status).not.toHaveBeenCalled();
    });

    it('should allow request when version exceeds minimum', () => {
      const middleware = requireApiVersion(1);

      middleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(mockResponse.status).not.toHaveBeenCalled();
    });

    it('should reject request when version is below minimum', () => {
      mockRequest.headers = { 'x-api-version': '1' };
      const middleware = requireApiVersion(2);

      middleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: 'This endpoint requires API version 2 or higher',
        currentVersion: 1,
        requiredVersion: 2,
        statusCode: 400,
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should default to v1 when no version header present', () => {
      mockRequest.headers = {};
      const middleware = requireApiVersion(2);

      middleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
    });
  });

  describe('deprecateApiVersion', () => {
    it('should add deprecation headers for deprecated version', () => {
      mockRequest.headers = { 'x-api-version': '1' };
      const middleware = deprecateApiVersion(1, '2025-12-31');

      middleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.setHeader).toHaveBeenCalledWith('Deprecation', 'true');
      expect(mockResponse.setHeader).toHaveBeenCalledWith('Sunset', '2025-12-31');
      expect(mockResponse.setHeader).toHaveBeenCalledWith(
        'Warning',
        '299 - "API version 1 is deprecated and will be removed on 2025-12-31"'
      );
      expect(mockNext).toHaveBeenCalled();
    });

    it('should not add deprecation headers for non-deprecated versions', () => {
      mockRequest.headers = { 'x-api-version': '2' };
      const middleware = deprecateApiVersion(1, '2025-12-31');

      middleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.setHeader).not.toHaveBeenCalled();
      expect(mockNext).toHaveBeenCalled();
    });
  });
});

// backend/src/__tests__/middleware/requestTracking.test.ts

import { Request, Response, NextFunction } from 'express';
import { requestTrackingMiddleware, TrackedRequest } from '../../middleware/requestTracking';

describe('Request Tracking Middleware', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: NextFunction;
  let finishListener: () => void;

  beforeEach(() => {
    jest.clearAllMocks();

    mockRequest = {
      headers: {},
    };

    mockResponse = {
      setHeader: jest.fn(),
      on: jest.fn((event, callback) => {
        if (event === 'finish') {
          finishListener = callback;
        }
        return mockResponse;
      }) as any,
    };

    mockNext = jest.fn();
  });

  it('should generate request ID when not provided', () => {
    requestTrackingMiddleware(
      mockRequest as Request,
      mockResponse as Response,
      mockNext
    );

    const trackedReq = mockRequest as TrackedRequest;
    expect(trackedReq.requestId).toBeDefined();
    expect(typeof trackedReq.requestId).toBe('string');
    expect(trackedReq.requestId.length).toBeGreaterThan(0);
    expect(mockResponse.setHeader).toHaveBeenCalledWith('X-Request-ID', trackedReq.requestId);
  });

  it('should use existing request ID from header', () => {
    const existingId = 'existing-request-id-123';
    mockRequest.headers = { 'x-request-id': existingId };

    requestTrackingMiddleware(
      mockRequest as Request,
      mockResponse as Response,
      mockNext
    );

    const trackedReq = mockRequest as TrackedRequest;
    expect(trackedReq.requestId).toBe(existingId);
    expect(mockResponse.setHeader).toHaveBeenCalledWith('X-Request-ID', existingId);
  });

  it('should set start time on request', () => {
    const beforeTime = Date.now();

    requestTrackingMiddleware(
      mockRequest as Request,
      mockResponse as Response,
      mockNext
    );

    const afterTime = Date.now();
    const trackedReq = mockRequest as TrackedRequest;

    expect(trackedReq.startTime).toBeGreaterThanOrEqual(beforeTime);
    expect(trackedReq.startTime).toBeLessThanOrEqual(afterTime);
  });

  it('should add response time header on finish', () => {
    requestTrackingMiddleware(
      mockRequest as Request,
      mockResponse as Response,
      mockNext
    );

    // Simulate time passing
    const trackedReq = mockRequest as TrackedRequest;
    trackedReq.startTime = Date.now() - 150; // 150ms ago

    // Trigger finish event
    finishListener();

    expect(mockResponse.setHeader).toHaveBeenCalledWith(
      'X-Response-Time',
      expect.stringMatching(/^\d+ms$/)
    );
  });

  it('should call next middleware', () => {
    requestTrackingMiddleware(
      mockRequest as Request,
      mockResponse as Response,
      mockNext
    );

    expect(mockNext).toHaveBeenCalled();
  });

  it('should handle multiple requests with unique IDs', () => {
    const req1 = { headers: {} } as Request;
    const req2 = { headers: {} } as Request;
    const res = mockResponse as Response;

    requestTrackingMiddleware(req1, res, mockNext);
    requestTrackingMiddleware(req2, res, mockNext);

    const tracked1 = req1 as TrackedRequest;
    const tracked2 = req2 as TrackedRequest;

    expect(tracked1.requestId).not.toBe(tracked2.requestId);
  });
});

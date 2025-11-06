// backend/src/types/express.d.ts

import { JwtPayload } from './auth';

declare global {
  namespace Express {
    interface Request {
      requestId?: string;
      startTime?: number;
      user?: JwtPayload;
      apiKey?: {
        id: string;
        userId: string;
        keyPrefix: string;
      };
    }
  }
}

export {};

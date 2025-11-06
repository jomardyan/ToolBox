// backend/src/routes/oauthRoutes.ts (DISABLED - Stub Only)
//
// NOTE: OAuth routes are currently disabled due to missing Prisma schema
// 
// To re-enable OAuth support, you need to:
// 1. Add OAuthAccount model to prisma/schema.prisma:
//    model OAuthAccount {
//      id        String   @id @default(cuid())
//      userId    String
//      user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
//      provider  String   // google, github, etc
//      providerUserId String
//      email     String?
//      name      String?
//      picture   String?
//      createdAt DateTime @default(now())
//      updatedAt DateTime @updatedAt
//      @@unique([provider, providerUserId])
//      @@index([userId])
//    }
//    
// 2. Update User model to add relation:
//    oauthAccounts  OAuthAccount[]
//
// 3. Run migration:
//    npx prisma migrate dev --name add_oauth_account
//
// 4. The oauthService.ts references to prisma.oauthAccount will work
//
// 5. Uncomment the import and registration in app.ts

import { Router, Request, Response } from 'express';

const router = Router();

// Disabled OAuth endpoints - return 503 Service Unavailable
router.get('/google/auth', (_req: Request, res: Response) => {
  res.status(503).json({
    error: 'OAuth is not currently available. Please use email/password authentication.'
  });
});

router.post('/google/callback', (_req: Request, res: Response) => {
  res.status(503).json({
    error: 'OAuth is not currently available. Please use email/password authentication.'
  });
});

router.get('/github/auth', (_req: Request, res: Response) => {
  res.status(503).json({
    error: 'OAuth is not currently available. Please use email/password authentication.'
  });
});

router.post('/github/callback', (_req: Request, res: Response) => {
  res.status(503).json({
    error: 'OAuth is not currently available. Please use email/password authentication.'
  });
});

router.post('/link', (_req: Request, res: Response) => {
  res.status(503).json({
    error: 'OAuth is not currently available. Please use email/password authentication.'
  });
});

router.get('/accounts', (_req: Request, res: Response) => {
  res.status(503).json({
    error: 'OAuth is not currently available. Please use email/password authentication.'
  });
});

router.delete('/:provider', (_req: Request, res: Response) => {
  res.status(503).json({
    error: 'OAuth is not currently available. Please use email/password authentication.'
  });
});

export default router;

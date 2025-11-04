// backend/src/routes/oauthRoutes.ts

import { Router, Request, Response } from 'express';
import { OAuthService } from '../services/oauthService';
import CryptoUtils from '../utils/cryptoUtils';
import { authenticateToken } from '../middleware/auth';
import logger from '../utils/logger';

const router = Router();

/**
 * GET /oauth/google/auth
 * Generate Google OAuth login URL
 */
router.get('/google/auth', (req: Request, res: Response) => {
  try {
    const state = CryptoUtils.generateRandomString(32);
    (req as any).state = state;

    const url = OAuthService.generateGoogleAuthUrl(state);
    res.json({ url });
  } catch (error: any) {
    logger.error('Google auth URL error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /oauth/google/callback
 * Handle Google OAuth callback
 */
router.post('/google/callback', async (req: Request, res: Response) => {
  try {
    const { token, state } = req.body;

    if (!token || !state) {
      return res.status(400).json({ error: 'Invalid state parameter' });
    }

    const profile = await OAuthService.verifyGoogleToken(token);
    if (!profile) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    const user = await OAuthService.findOrCreateUser(profile);

    const tokens = CryptoUtils.generateTokens({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    res.json({
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
      },
      tokens,
    });
  } catch (error: any) {
    logger.error('Google callback error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /oauth/github/auth
 * Generate GitHub OAuth login URL
 */
router.get('/github/auth', (req: Request, res: Response) => {
  try {
    const state = CryptoUtils.generateRandomString(32);
    (req as any).state = state;

    const url = OAuthService.generateGithubAuthUrl(state);
    res.json({ url });
  } catch (error: any) {
    logger.error('GitHub auth URL error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /oauth/github/callback
 * Handle GitHub OAuth callback
 */
router.post('/github/callback', async (req: Request, res: Response) => {
  try {
    const { code, state } = req.body;

    if (!code || !state) {
      return res.status(400).json({ error: 'Invalid state parameter' });
    }

    const profile = await OAuthService.verifyGithubCode(code);
    if (!profile) {
      return res.status(401).json({ error: 'Invalid authorization code' });
    }

    const user = await OAuthService.findOrCreateUser(profile);

    const tokens = CryptoUtils.generateTokens({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    res.json({
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
      },
      tokens,
    });
  } catch (error: any) {
    logger.error('GitHub callback error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /oauth/link
 * Link OAuth account to authenticated user
 */
router.post('/link', authenticateToken, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;
    const { provider, token, code } = req.body;

    if (!provider || (!token && !code)) {
      return res.status(400).json({ error: 'Provider and token/code required' });
    }

    let profile: any;

    if (provider === 'google') {
      profile = await OAuthService.verifyGoogleToken(token);
    } else if (provider === 'github') {
      profile = await OAuthService.verifyGithubCode(code);
    } else {
      return res.status(400).json({ error: 'Invalid provider' });
    }

    if (!profile) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const linkedAccount = await OAuthService.linkOAuthAccount(userId, profile);

    res.json({
      message: 'OAuth account linked successfully',
      linkedAccount,
    });
  } catch (error: any) {
    logger.error('Link OAuth error:', error);
    res.status(error.message?.includes('already linked') ? 409 : 500).json({
      error: error.message,
    });
  }
});

/**
 * GET /oauth/accounts
 * Get user's linked OAuth accounts
 */
router.get('/accounts', authenticateToken, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;

    const accounts = await OAuthService.getLinkedAccounts(userId);

    res.json({ accounts });
  } catch (error: any) {
    logger.error('Get OAuth accounts error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * DELETE /oauth/:provider
 * Unlink OAuth account from user
 */
router.delete('/:provider', authenticateToken, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;
    const { provider } = req.params;

    const validProviders = ['google', 'github'];
    if (!validProviders.includes(provider)) {
      return res.status(400).json({ error: 'Invalid provider' });
    }

    await OAuthService.unlinkOAuthAccount(userId, provider);

    res.json({ message: `${provider} account unlinked successfully` });
  } catch (error: any) {
    logger.error('Unlink OAuth error:', error);
    res.status(error.message?.includes('Cannot unlink') ? 400 : 500).json({
      error: error.message,
    });
  }
});

export default router;

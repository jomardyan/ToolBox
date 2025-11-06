// backend/src/services/oauthService.ts (Simplified)
//
// OAuth account linking is not available in this version.
// To enable OAuth:
// 1. Add OAuthAccount model to Prisma schema
// 2. The model needs fields: id, userId, provider, providerUserId, email, name, picture
// 3. Add relation: oauthAccounts OAuthAccount[] to User model
// 4. Run: npx prisma migrate dev --name add_oauth_account

import { prisma } from '../config/database';
import { OAuth2Client } from 'google-auth-library';
import axios from 'axios';
import logger from '../utils/logger';

const googleClient = new OAuth2Client(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_CALLBACK_URL
);

interface OAuthProfile {
  id: string;
  email: string;
  name: string;
  picture?: string;
  provider: 'google' | 'github';
}

interface LinkedAccount {
  provider: string;
  providerUserId: string;
  email: string;
  name: string;
  picture?: string;
}

export class OAuthService {
  /**
   * Verify Google ID token and extract user info
   */
  static async verifyGoogleToken(token: string): Promise<OAuthProfile | null> {
    try {
      const ticket = await googleClient.verifyIdToken({
        idToken: token,
        audience: process.env.GOOGLE_CLIENT_ID,
      });

      const payload = ticket.getPayload();
      if (!payload) return null;

      return {
        id: payload.sub,
        email: payload.email || '',
        name: payload.name || '',
        picture: payload.picture,
        provider: 'google',
      };
    } catch (error) {
      logger.error('Google token verification error:', error);
      return null;
    }
  }

  /**
   * Verify GitHub OAuth code and exchange for user info
   */
  static async verifyGithubCode(code: string): Promise<OAuthProfile | null> {
    try {
      // Exchange code for access token
      const tokenResponse = await axios.post(
        'https://github.com/login/oauth/access_token',
        {
          client_id: process.env.GITHUB_CLIENT_ID,
          client_secret: process.env.GITHUB_CLIENT_SECRET,
          code,
        },
        {
          headers: { Accept: 'application/json' },
        }
      );

      const accessToken = tokenResponse.data.access_token;

      // Get user info with access token
      const userResponse = await axios.get('https://api.github.com/user', {
        headers: { Authorization: `token ${accessToken}` },
      });

      const user = userResponse.data;

      return {
        id: user.id.toString(),
        email: user.email || `${user.login}@github.com`,
        name: user.name || user.login,
        picture: user.avatar_url,
        provider: 'github',
      };
    } catch (error) {
      logger.error('GitHub verification error:', error);
      return null;
    }
  }

  /**
   * Generate Google OAuth login URL
   */
  static generateGoogleAuthUrl(state: string): string {
    const params = new URLSearchParams({
      client_id: process.env.GOOGLE_CLIENT_ID || '',
      redirect_uri: process.env.GOOGLE_CALLBACK_URL || '',
      response_type: 'code',
      scope: 'openid email profile',
      state,
    });
    return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
  }

  /**
   * Generate GitHub OAuth login URL
   */
  static generateGithubAuthUrl(state: string): string {
    const params = new URLSearchParams({
      client_id: process.env.GITHUB_CLIENT_ID || '',
      redirect_uri: process.env.GITHUB_CALLBACK_URL || '',
      scope: 'user:email',
      state,
    });
    return `https://github.com/login/oauth/authorize?${params.toString()}`;
  }

  /**
   * Find or create user from OAuth profile
   */
  static async findOrCreateUser(profile: OAuthProfile): Promise<any> {
    try {
      // Check if email exists
      let user = await prisma.user.findUnique({
        where: { email: profile.email },
      });

      if (!user) {
        // Create new user
        user = await prisma.user.create({
          data: {
            email: profile.email,
            firstName: profile.name.split(' ')[0],
            lastName: profile.name.split(' ').slice(1).join(' '),
            avatar: profile.picture,
            emailVerified: true,
            passwordHash: require('crypto').randomBytes(16).toString('hex'),
          },
        });

        logger.info(`New user created from ${profile.provider}: ${user.id}`);
      }

      // Update last login
      await prisma.user.update({
        where: { id: user.id },
        data: { lastLoginAt: new Date() },
      });

      return user;
    } catch (error) {
      logger.error('Find or create user error:', error);
      throw error;
    }
  }

  /**
   * Link OAuth account to existing user
   * Not implemented - oauthAccount model missing from schema
   */
  static async linkOAuthAccount(
    userId: string,
    profile: OAuthProfile
  ): Promise<LinkedAccount> {
    throw new Error('OAuth account linking not available - model not in schema');
  }

  /**
   * Unlink OAuth account from user
   * Not implemented - oauthAccount model missing from schema
   */
  static async unlinkOAuthAccount(userId: string, provider: string): Promise<void> {
    throw new Error('OAuth account unlinking not available - model not in schema');
  }

  /**
   * Get user's linked OAuth accounts
   * Not implemented - oauthAccount model missing from schema
   */
  static async getLinkedAccounts(userId: string): Promise<LinkedAccount[]> {
    return [];
  }
}

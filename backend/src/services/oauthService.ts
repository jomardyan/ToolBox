// backend/src/services/oauthService.ts

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
   * Find or create user from OAuth profile
   */
  static async findOrCreateUser(profile: OAuthProfile): Promise<any> {
    try {
      // Check if OAuth account already linked
      let linkedAccount = await prisma.oauthAccount.findUnique({
        where: {
          providerUserId: {
            provider: profile.provider,
            providerAccountId: profile.id,
          },
        },
        include: { user: true },
      });

      if (linkedAccount) {
        // Update last login
        await prisma.user.update({
          where: { id: linkedAccount.user.id },
          data: { lastLoginAt: new Date() },
        });
        return linkedAccount.user;
      }

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
            emailVerified: true, // OAuth emails are verified by provider
            status: 'ACTIVE',
            passwordHash: '', // OAuth users don't have passwords
          },
        });

        logger.info(`New user created from ${profile.provider}: ${user.id}`);
      }

      // Link OAuth account to user
      await prisma.oauthAccount.create({
        data: {
          userId: user.id,
          provider: profile.provider,
          providerAccountId: profile.id,
          email: profile.email,
          name: profile.name,
          picture: profile.picture,
        },
      });

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
   */
  static async linkOAuthAccount(
    userId: string,
    profile: OAuthProfile
  ): Promise<LinkedAccount> {
    try {
      // Check if OAuth account already linked to another user
      const existing = await prisma.oauthAccount.findUnique({
        where: {
          providerUserId: {
            provider: profile.provider,
            providerAccountId: profile.id,
          },
        },
      });

      if (existing && existing.userId !== userId) {
        throw new Error(`${profile.provider} account already linked to another user`);
      }

      if (existing) {
        return existing;
      }

      // Link new OAuth account
      const linkedAccount = await prisma.oauthAccount.create({
        data: {
          userId,
          provider: profile.provider,
          providerAccountId: profile.id,
          email: profile.email,
          name: profile.name,
          picture: profile.picture,
        },
      });

      logger.info(`OAuth account linked to user ${userId}`);
      return linkedAccount;
    } catch (error) {
      logger.error('Link OAuth account error:', error);
      throw error;
    }
  }

  /**
   * Unlink OAuth account from user
   */
  static async unlinkOAuthAccount(userId: string, provider: string): Promise<void> {
    try {
      // Don't allow unlinking if user has no password
      const user = await prisma.user.findUnique({
        where: { id: userId },
      });

      if (!user?.passwordHash) {
        throw new Error('Cannot unlink last authentication method');
      }

      await prisma.oauthAccount.deleteMany({
        where: {
          userId,
          provider,
        },
      });

      logger.info(`OAuth ${provider} account unlinked from user ${userId}`);
    } catch (error) {
      logger.error('Unlink OAuth account error:', error);
      throw error;
    }
  }

  /**
   * Get user's linked OAuth accounts
   */
  static async getLinkedAccounts(userId: string): Promise<LinkedAccount[]> {
    try {
      const accounts = await prisma.oauthAccount.findMany({
        where: { userId },
        select: {
          provider: true,
          email: true,
          name: true,
          picture: true,
        },
      });

      return accounts;
    } catch (error) {
      logger.error('Get linked accounts error:', error);
      throw error;
    }
  }

  /**
   * Generate Google OAuth URL
   */
  static generateGoogleAuthUrl(state: string): string {
    return googleClient.generateAuthUrl({
      access_type: 'offline',
      scope: ['profile', 'email'],
      state,
    });
  }

  /**
   * Generate GitHub OAuth URL
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
}

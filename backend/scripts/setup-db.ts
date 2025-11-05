#!/usr/bin/env ts-node

import { prisma } from '../src/config/database';
import CryptoUtils from '../src/utils/cryptoUtils';
import logger from '../src/utils/logger';

const setupDatabase = async () => {
  try {
    logger.info('Setting up development database...');

    // Check if demo users already exist
    const existingAdmin = await prisma.user.findUnique({
      where: { email: 'admin@demo.com' }
    });

    if (existingAdmin) {
      logger.info('Demo users already exist, skipping setup');
      return;
    }

    // Create admin user
    const adminPassword = await CryptoUtils.hashPassword('Demo@12345');
    const admin = await prisma.user.create({
      data: {
        email: 'admin@demo.com',
        passwordHash: adminPassword,
        firstName: 'Admin',
        lastName: 'User',
        role: 'ADMIN',
        status: 'ACTIVE',
        emailVerified: true,
        companyName: 'Demo Company'
      }
    });

    logger.info(`✓ Admin user created: ${admin.email}`);

    // Create regular user
    const userPassword = await CryptoUtils.hashPassword('Demo@12345');
    const user = await prisma.user.create({
      data: {
        email: 'user@demo.com',
        passwordHash: userPassword,
        firstName: 'Demo',
        lastName: 'User',
        role: 'USER',
        status: 'ACTIVE',
        emailVerified: true,
        companyName: 'Demo Company'
      }
    });

    logger.info(`✓ Demo user created: ${user.email}`);

    // Note: Plan and Subscription creation can be added later
    // For now, just create demo users to get the system running

    logger.info('✨ Database setup complete!');
    logger.info('Demo credentials:');
    logger.info('  Admin: admin@demo.com / Demo@12345');
    logger.info('  User:  user@demo.com / Demo@12345');
  } catch (error) {
    logger.error('Database setup error:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
};

setupDatabase().catch((error) => {
  logger.error(error);
  process.exit(1);
});

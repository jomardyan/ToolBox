// backend/src/__tests__/setup.ts

// Set test environment variables required for tests
process.env.JWT_SECRET = 'test-jwt-secret-for-testing-minimum-32-characters-long';
process.env.JWT_REFRESH_SECRET = 'test-jwt-refresh-secret-for-testing-different-32-chars';
process.env.JWT_EXPIRATION = '15m';
process.env.JWT_REFRESH_EXPIRATION = '7d';
process.env.DATABASE_URL = 'file:./test.db';
process.env.NODE_ENV = 'test';

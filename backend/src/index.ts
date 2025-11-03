import express from 'express';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import 'dotenv/config';
import apiRoutes from './routes';
import { errorHandler } from './middleware/errorHandler';
import logger from './utils/logger';
import { RATE_LIMIT_CONFIG } from './utils/validation';

const app = express();
const PORT = process.env.PORT || 3000;

// Rate limiters
const generalLimiter = rateLimit(RATE_LIMIT_CONFIG.normal);
const strictLimiter = rateLimit(RATE_LIMIT_CONFIG.strict);
const batchLimiter = rateLimit(RATE_LIMIT_CONFIG.batch);

// Middleware
app.use(cors({
  origin: process.env.CORS_ORIGIN || ['http://localhost:5173', 'http://localhost:3000'],
  credentials: true,
}));

app.use(express.json({ limit: '50mb' }));
app.use(express.text({ limit: '50mb' }));

// Security: Remove powered by header
app.disable('x-powered-by');

// Request logging
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.path}`);
  next();
});

// Rate limiting on specific endpoints
app.use('/api/convert', generalLimiter);
app.use('/api/extract', generalLimiter);
app.use('/api/batch-convert', batchLimiter);
app.use('/api/presets', generalLimiter);

// API Routes
app.use('/api', apiRoutes);

// Health check root endpoint
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'CSV Conversion API Server',
    version: '1.0.0',
    endpoints: {
      convert: 'POST /api/convert',
      batchConvert: 'POST /api/batch-convert',
      extract: 'POST /api/extract/csv-columns',
      presets: 'GET /api/presets',
      health: 'GET /api/health',
    },
  });
});

// Error handling middleware (must be last)
app.use(errorHandler);

// Start server
app.listen(PORT, () => {
  logger.info(`Server running on http://localhost:${PORT}`);
  logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
  logger.info(`CORS enabled for: ${process.env.CORS_ORIGIN || 'localhost'}`);
});

export default app;

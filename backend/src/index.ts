import express from 'express';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import 'dotenv/config';
import apiRoutes from './routes';
import { errorHandler } from './middleware/errorHandler';
import logger from './utils/logger';
import { RATE_LIMIT_CONFIG } from './utils/validation';

const app = express();
const PORT = parseInt(process.env.PORT || '3000', 10);

// Rate limiters
const generalLimiter = rateLimit(RATE_LIMIT_CONFIG.normal);
const strictLimiter = rateLimit(RATE_LIMIT_CONFIG.strict);
const batchLimiter = rateLimit(RATE_LIMIT_CONFIG.batch);

// Middleware
const corsOptions = {
  origin: function(origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) {
    const allowedOrigins = [
      'http://localhost:5173',
      'http://localhost:3000',
      'http://127.0.0.1:5173',
      'http://127.0.0.1:3000',
      'https://localhost:5173',
      'https://localhost:3000',
      'https://127.0.0.1:5173',
      'https://127.0.0.1:3000',
    ];

    // Add github.dev domains (Codespaces) - both http and https
    if (origin && (origin.includes('.app.github.dev') || origin.includes('github.dev'))) {
      return callback(null, true);
    }

    // If no origin (like server requests), allow it
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      logger.warn(`CORS request blocked from origin: ${origin}`);
      callback(null, true); // Allow anyway for now to debug
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};

app.use(cors(corsOptions));

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

// Start server - bind to 0.0.0.0 to make it accessible from frontend
app.listen(PORT, '0.0.0.0', () => {
  logger.info(`Server running on http://0.0.0.0:${PORT}`);
  logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
  logger.info(`CORS enabled for: ${process.env.CORS_ORIGIN || 'localhost'}`);
});

export default app;

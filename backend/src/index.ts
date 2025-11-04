import express from 'express';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import swaggerUi from 'swagger-ui-express';
import 'dotenv/config';
import apiRoutes from './routes';
import { errorHandler } from './middleware/errorHandler';
import logger from './utils/logger';
import { RATE_LIMIT_CONFIG } from './utils/validation';
import { swaggerSpec } from './swagger/swaggerConfig';

const app = express();
const PORT = parseInt(process.env.PORT || '3000', 10);

// Trust proxy - important for GitHub Codespaces and other reverse proxies
app.set('trust proxy', true);

// Rate limiters
const generalLimiter = rateLimit(RATE_LIMIT_CONFIG.normal);
const strictLimiter = rateLimit(RATE_LIMIT_CONFIG.strict);
const batchLimiter = rateLimit(RATE_LIMIT_CONFIG.batch);

// CORS Configuration - Completely permissive in development
if (process.env.NODE_ENV === 'production') {
  // Production: Restricted CORS
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

      // Allow GitHub Codespaces domains
      if (origin && origin.includes('.app.github.dev')) {
        return callback(null, true);
      }

      // If no origin (like server requests), allow it
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        logger.warn(`CORS request blocked from origin: ${origin}`);
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    exposedHeaders: ['Content-Type'],
    optionsSuccessStatus: 200,
  };
  
  app.use(cors(corsOptions));
} else {
  // Development: CORS completely disabled - accept everything
  app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', req.headers.origin || '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
    res.header('Access-Control-Allow-Credentials', 'true');
    res.header('Access-Control-Max-Age', '86400'); // 24 hours
    
    // Handle preflight
    if (req.method === 'OPTIONS') {
      return res.sendStatus(200);
    }
    
    next();
  });
}

app.use(express.json({ limit: '50mb' }));
app.use(express.text({ limit: '50mb' }));

// Security: Remove powered by header
app.disable('x-powered-by');

// Request logging
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.path} - Origin: ${req.headers.origin || 'none'}`);
  next();
});

// Rate limiting on specific endpoints (disabled in development for easier debugging)
if (process.env.NODE_ENV === 'production') {
  app.use('/api/convert', generalLimiter);
  app.use('/api/extract', generalLimiter);
  app.use('/api/batch-convert', batchLimiter);
  app.use('/api/presets', generalLimiter);
} else {
  logger.info('Rate limiting disabled in development mode');
}

// Swagger documentation
app.use('/api-docs', swaggerUi.serve);
app.get('/api-docs', swaggerUi.setup(swaggerSpec, { 
  swaggerOptions: {
    url: '/api-docs/json',
  }
}));

// Swagger JSON specification endpoint
app.get('/api-docs/json', (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.send(swaggerSpec);
});

// API Routes
app.use('/api', apiRoutes);

// Health check root endpoint
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'CSV Conversion API Server',
    version: '1.0.0',
    documentation: 'http://0.0.0.0:3000/api-docs',
    endpoints: {
      convert: 'POST /api/convert',
      batchConvert: 'POST /api/batch-convert',
      extract: 'POST /api/extract/csv-columns',
      presets: 'GET /api/presets',
      health: 'GET /api/health',
      swagger: 'GET /api-docs',
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

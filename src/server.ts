import express, { Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { clerkMiddleware } from '@clerk/express';
import config from './config/env';
import healthRouter from './routes/health.routes';
import apiRoutes from './routes';
import { notFoundHandler, errorHandler } from './middleware/error.middleware';

const app: Application = express();

// 1. Security Headers via Helmet
app.use(helmet());

// 2. Strict CORS Configuration
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin && !config.isProduction) {
        return callback(null, true);
      }
      if (origin === config.frontendUrl || origin === 'http://localhost:3000') {
        return callback(null, true);
      }
      return callback(new Error('Blocked by CORS policy: Origin not allowed'));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-test-user-id', 'x-test-role'],
  })
);

// 3. API Rate Limiting (200 requests per 15 min per IP)
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again after 15 minutes',
  },
});
app.use('/api', apiLimiter);

// 4. Body Parsers
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// 5. Public Health Endpoint (unrestricted by Clerk)
app.use('/api/health', healthRouter);

// 6. Clerk Authentication Middleware for protected routes
if (config.clerk.publishableKey && config.clerk.secretKey) {
  app.use(
    clerkMiddleware({
      publishableKey: config.clerk.publishableKey,
      secretKey: config.clerk.secretKey,
    })
  );
} else {
  app.use(clerkMiddleware());
}

// 7. Mount Core API Routes
app.use('/api', apiRoutes);

// 8. Centralized Error Handlers
app.use(notFoundHandler);
app.use(errorHandler);

// 9. Start Listener
const server = app.listen(config.port, () => {
  console.log(`[IKASLE BACKEND] Server running in ${config.nodeEnv} mode on port ${config.port}`);
  console.log(`[IKASLE BACKEND] Health endpoint: http://localhost:${config.port}/api/health`);
});

export { app, server };

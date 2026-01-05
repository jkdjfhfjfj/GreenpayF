import express, { type Request, Response, NextFunction } from "express";
import session from "express-session";
import ConnectPgSimple from "connect-pg-simple";
import { Pool } from "pg";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { systemLogger } from "./services/system-logger";

// Ensure NODE_ENV is set for deployment
if (!process.env.NODE_ENV) {
  process.env.NODE_ENV = 'production';
}

// Validate required environment variables
const requiredEnvVars = ['PORT'];
const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
if (missingVars.length > 0) {
  console.warn(`Warning: Missing environment variables: ${missingVars.join(', ')}`);
}

const app = express();
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Configure PostgreSQL session store for production
const pgSession = ConnectPgSimple(session);

// Create PostgreSQL connection pool
let sessionStore;
if (process.env.DATABASE_URL) {
  const connectionString = process.env.DATABASE_URL.replace(/^"(.*)"$/, '$1').trim();
  const pgPool = new Pool({
    connectionString,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
  });
  
  sessionStore = new pgSession({
    pool: pgPool,
    tableName: 'user_sessions',
    createTableIfMissing: true
  });
  
  console.log('Using PostgreSQL session store for production');
} else {
  console.warn('DATABASE_URL not found - falling back to MemoryStore (not recommended for production)');
}

// Session configuration for better security
// Configure proxy trust for Replit deployment where HTTPS termination happens at edge
const isReplitEnvironment = process.env.REPLIT_DEPLOYMENT === '1' || !!process.env.REPL_ID || !!process.env.REPLIT_DOMAINS;
const isProduction = process.env.NODE_ENV === 'production';

// For Replit production, we should always trust the proxy since HTTPS termination happens at edge
// This ensures sessions work properly in both development and production on Replit
const shouldTrustProxy = isReplitEnvironment || isProduction;

// Trust proxy when behind Replit's edge or in production
if (shouldTrustProxy) {
  app.set('trust proxy', 1);
}

// Require SESSION_SECRET in production to avoid session invalidation on restart
if (isProduction && !process.env.SESSION_SECRET) {
  console.error('SESSION_SECRET environment variable is required in production');
  process.exit(1);
}

// Determine secure cookie setting based on environment
const getSecureCookieSetting = (): boolean | 'auto' => {
  if (isProduction && shouldTrustProxy) {
    return 'auto'; // Let express-session auto-detect HTTPS via trusted proxy
  }
  return isProduction; // Standard boolean setting
};

// Middleware to prevent caching and handle service worker / white screen issues
app.use((req, res, next) => {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  res.setHeader('Surrogate-Control', 'no-store');
  
  // Force HTTPS if not in development
  if (isProduction && req.headers['x-forwarded-proto'] !== 'https') {
    return res.redirect(`https://${req.headers.host}${req.url}`);
  }

  // Automatic "Clear-Site-Data" for the root path to ensure fresh loads
  // We use a specific cookie-based check to prevent reload loops
  if (req.path === '/' && !req.query.s && !req.cookies?.['cache_cleared']) {
    res.setHeader('Clear-Site-Data', '"cache", "storage", "executionContexts"');
    res.cookie('cache_cleared', '1', { maxAge: 3600000, httpOnly: true, sameSite: 'lax' });
  }

  // Clear site data if a specific query param is present or on certain conditions
  if (req.query.clear_cache === '1') {
    res.setHeader('Clear-Site-Data', '"cache", "storage", "executionContexts"');
  }
  next();
});

const sessionConfig = {
  store: sessionStore,
  secret: process.env.SESSION_SECRET || 'greenpay-secret-key-change-in-production-' + Math.random(),
  resave: false,
  saveUninitialized: false,
  rolling: true,
  cookie: {
    // Use secure cookies appropriately for the environment
    secure: getSecureCookieSetting(),
    httpOnly: true,
    maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
    sameSite: 'lax' as const // More permissive for cross-site navigation compatibility
  }
};

app.use(session(sessionConfig));

// Disable caching in development to ensure preview updates
if (process.env.NODE_ENV === 'development') {
  app.use((req, res, next) => {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    res.setHeader('Surrogate-Control', 'no-store');
    next();
  });
}

// Enable WebAuthn in iframe for biometric authentication
app.use((req, res, next) => {
  res.setHeader('Permissions-Policy', 'publickey-credentials-get=*, publickey-credentials-create=*');
  next();
});

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
      
      // Stream API requests to WebSocket clients if LogStreamService is available
      const LogStreamService = (global as any).LogStreamService;
      if (LogStreamService && !path.includes("/ws")) {
        LogStreamService.broadcast(LogStreamService.createLogEntry(
          res.statusCode >= 400 ? 'error' : 'api',
          `${req.method} ${path} ${res.statusCode} in ${duration}ms`,
          'api',
          {
            method: req.method,
            path,
            statusCode: res.statusCode,
            duration,
            response: capturedJsonResponse
          }
        ));
      }
    }
  });

  next();
});

(async () => {
  try {
    // Initialize system logger to capture console output
    systemLogger.init();
    console.log('✅ System logger initialized - capturing console output to database');
    
    const server = await registerRoutes(app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    // Log error details for debugging
    console.error('Server error:', {
      message: err.message,
      stack: err.stack,
      status
    });

    res.status(status).json({ message });
    
    // Don't throw error in production to prevent crashes
    if (process.env.NODE_ENV !== 'production') {
      throw err;
    }
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }


  // ALWAYS serve the app on the port specified in the environment variable PORT
  // Other ports are firewalled. Default to 5000 if not specified.
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = parseInt(process.env.PORT || '5000', 10);
  
  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true,
  }, () => {
    log(`serving on port ${port}`);
  });

  // Handle server startup errors
  server.on('error', (error: any) => {
    console.error('Server startup error:', error);
    if (error.code === 'EADDRINUSE') {
      console.error(`Port ${port} is already in use`);
    }
    process.exit(1);
  });
  
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
})();

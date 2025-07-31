import express, { type Request, Response, NextFunction } from "express";
import rateLimit from "express-rate-limit";
import slowDown from "express-slow-down";
import helmet from "helmet";
import { registerRoutes } from "./routes";
// Mobile-only API server - no frontend serving needed
import { setupAuth } from "./auth";

const app = express();

// Basic setup for Replit environment
app.set('trust proxy', 1);

// Enhanced JSON parsing with better error handling
app.use(express.json({ 
  limit: '50mb',
  verify: (req: any, res: any, buf: Buffer) => {
    try {
      if (buf && buf.length) {
        const bodyString = buf.toString('utf8');
        // Check if it's trying to send just a string instead of JSON object
        if (bodyString.startsWith('"') && bodyString.endsWith('"') && !bodyString.includes('{')) {
          console.error('Invalid JSON body - received plain string:', bodyString.substring(0, 100) + '...');
          throw new SyntaxError('Request body must be a JSON object, not a plain string');
        }
      }
    } catch (error) {
      console.error('JSON parsing error:', error);
      throw error;
    }
  }
}));
app.use(express.urlencoded({ extended: false, limit: '50mb' }));

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

      console.log(`${new Date().toLocaleTimeString()} [express] ${logLine}`);
    }
  });

  next();
});

(async () => {
  // Setup authentication before registering routes
  setupAuth(app);
  
  const server = await registerRoutes(app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  // Mobile-only API server - no frontend serving needed
  console.log("✅ Mobile-only API server initialized");

  // ALWAYS serve the app on port 5000
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = 5000;
  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true,
  }, () => {
    console.log(`${new Date().toLocaleTimeString()} [express] 🚀 API server running on port ${port}`);
  });
})();

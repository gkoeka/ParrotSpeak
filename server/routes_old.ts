import express, { Express, Request, Response, NextFunction } from "express";
import { createServer, Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import rateLimit from "express-rate-limit";
import slowDown from "express-slow-down";
import helmet from "helmet";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import { translateText } from "./services/translation";
import { storage } from "./storage";
import { requireAuth, requireSubscription } from "./auth";
import * as mfaService from "./services/mfa";
import * as analytics from "./services/analytics";
import * as adminAuth from "./services/admin-authorization";
import { db } from "@db";
import { users } from "@shared/schema";
import { eq } from "drizzle-orm";
import Stripe from "stripe";

// Rate limiting configuration
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // limit each IP to 1000 requests per windowMs
  message: "Too many requests from this IP, please try again later.",
  standardHeaders: true,
  legacyHeaders: false
});

const slowDownMiddleware = slowDown({
  windowMs: 15 * 60 * 1000, // 15 minutes
  delayAfter: 100, // allow 100 requests per 15 minutes, then...
  delayMs: 500 // begin adding 500ms of delay per request above 100
});

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "");

export async function registerRoutes(app: Express): Promise<Server> {
  // Security middleware
  app.use(generalLimiter);
  app.use(slowDownMiddleware);

  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'", "https://js.stripe.com", "https://checkout.stripe.com"],
        styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
        fontSrc: ["'self'", "https://fonts.gstatic.com"],
        imgSrc: ["'self'", "data:", "blob:", "https:"],
        connectSrc: ["'self'", "ws:", "wss:", "https://api.stripe.com"],
        frameSrc: ["'self'", "https://js.stripe.com", "https://hooks.stripe.com"],
        objectSrc: ["'none'"],
        upgradeInsecureRequests: [],
      },
    },
    crossOriginEmbedderPolicy: false,
  }));

  // Static files and uploads
  app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

  // Root route - serve mobile phone emulator by default
  app.get('/', (req: Request, res: Response, next: NextFunction) => {
    // Serve the mobile phone emulator interface by default
    if (!req.query.webapp) {
      const emulatorPath = path.join(process.cwd(), 'mobile-phone-emulator.html');
      if (fs.existsSync(emulatorPath)) {
        return res.sendFile(emulatorPath);
      }
    }
    
    // Continue to React app for webapp requests
    next();
  });

  // Handle webapp routes specifically for iframe content  
  app.get('/webapp*', (req: Request, res: Response, next: NextFunction) => {
    // Rewrite the URL to serve React app for iframe content
    req.url = req.url.replace('/webapp', '');
    if (req.url === '') req.url = '/';
    next();
  });

  // Mobile preview route
  app.get('/mobile-preview', (req: Request, res: Response) => {
    const emulatorPath = path.join(process.cwd(), 'mobile-phone-emulator.html');
    if (fs.existsSync(emulatorPath)) {
      return res.sendFile(emulatorPath);
    }
    res.status(404).send('Mobile emulator not found');
  });

  // Mobile app preview route  
  app.get('/mobile-app-preview', (req: Request, res: Response) => {
    const emulatorPath = path.join(process.cwd(), 'mobile-phone-emulator.html');
    if (fs.existsSync(emulatorPath)) {
      return res.sendFile(emulatorPath);
    }
    res.status(404).send('Mobile emulator not found');
  });

  // BACKUP CODES ROUTE - USING COMPLETELY UNIQUE PATH
  app.post('/api/backup-codes-generate', requireAuth, async (req: Request, res: Response) => {
    console.log('=== BACKUP CODES ROUTE FINALLY HIT ===');
    
    try {
      const user = req.user;
      if (!user) {
        return res.status(401).json({ message: 'Authentication required' });
      }

      const backupCodes = await mfaService.regenerateBackupCodes(user.id);
      console.log('Successfully generated backup codes:', backupCodes);
      
      res.setHeader('Content-Type', 'application/json');
      res.json({ backupCodes });

    } catch (error) {
      console.error('Error in backup codes route:', error);
      res.status(500).json({ message: 'Failed to regenerate backup codes' });
    }
  });
  
  const httpServer = createServer(app);
  
  // Initialize WebSocket server
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });
  
  // Handle WebSocket connections
  wss.on('connection', (ws: WebSocket) => {
    console.log('Client connected to WebSocket');
    
    ws.on('message', async (message: string) => {
      try {
        const data = JSON.parse(message);
        
        if (data.type === 'translate') {
          // Process real-time translation request
          const { conversationId, text, sourceLanguage, targetLanguage, userId } = data;
          
          try {
            // Save the original message with encryption if userId is provided
            const messageId = await storage.saveMessage(
              conversationId,
              text,
              true,
              sourceLanguage,
              targetLanguage,
              userId
            );
            
            // Record start time for performance tracking
            const startTime = Date.now();
            
            // Perform translation
            const translationResult = await translateText(text, sourceLanguage, targetLanguage);
            
            // Calculate response time
            const responseTime = Date.now() - startTime;
            
            // Save the translated message
            const translatedMessageId = await storage.saveMessage(
              conversationId,
              translationResult.translation,
              false,
              sourceLanguage,
              targetLanguage,
              userId
            );
            
            // Send translation result back to client
            ws.send(JSON.stringify({
              type: 'translation_result',
              messageId,
              translatedMessageId,
              translatedText: translationResult.translation,
              responseTime
            }));
            
          } catch (error) {
            console.error('Translation error:', error);
            ws.send(JSON.stringify({
              type: 'translation_error',
              error: 'Translation failed'
            }));
          }
        }
      } catch (error) {
        console.error('WebSocket message error:', error);
      }
    });
    
    ws.on('close', () => {
      console.log('Client disconnected from WebSocket');
    });
  });

  return httpServer;
}
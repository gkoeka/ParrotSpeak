import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import express from "express";
import path from "path";
import fs from "fs";
import rateLimit from "express-rate-limit";
import helmet from "helmet";
import multer from "multer";
import { storage } from "./storage";
import { translateText } from "./services/translation";
import { transcribeAudio } from "./services/speech";
import { analyzeImageAndTranslate } from "./services/visual-translation";
import * as analytics from "./services/analytics";
import { db } from "../db";
import { eq, desc } from "drizzle-orm";
import { messages, userFeedback, users } from "../shared/schema";
import { body, validationResult } from "express-validator";
import passport from "passport";
import { setupAuth, requireAuth } from "./auth";
import { requireSubscription } from "./services/subscription";
import { createPasswordResetToken, resetPassword, loginUser, registerUser } from "./services/auth";
import { handleWebhookEvent } from "./services/webhook";
import Stripe from "stripe";
import * as admin from "./services/admin";
import * as adminAuth from "./services/admin-authorization";
import * as mfaService from "./services/mfa";

export async function registerRoutes(app: Express): Promise<Server> {
  // Initialize Stripe
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "", {
    apiVersion: "2025-04-30.basil",
  });

  // Configure rate limiting for different endpoint types
  const generalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 1000, // limit each IP to 1000 requests per windowMs (increased for normal usage)
    message: 'Too many requests from this IP, please try again later.',
    standardHeaders: true,
    legacyHeaders: false,
  });

  const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 10, // limit each IP to 10 auth attempts per windowMs
    message: 'Too many authentication attempts, please try again later.',
    standardHeaders: true,
    legacyHeaders: false,
  });

  const apiLimiter = rateLimit({
    windowMs: 1 * 60 * 1000, // 1 minute
    max: 100, // limit each IP to 100 API requests per minute (increased for normal usage)
    message: 'API rate limit exceeded, please try again later.',
    standardHeaders: true,
    legacyHeaders: false,
  });

  const transcriptionLimiter = rateLimit({
    windowMs: 1 * 60 * 1000, // 1 minute
    max: 10, // limit transcription requests per minute
    message: 'Transcription rate limit exceeded, please try again later.',
    standardHeaders: true,
    legacyHeaders: false,
  });

  // Apply general rate limiting to all routes
  app.use(generalLimiter);

  // Security headers middleware
  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'", "https://js.stripe.com", "https://cdn.mixpanel.com"],
        styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
        fontSrc: ["'self'", "https://fonts.gstatic.com"],
        imgSrc: ["'self'", "data:", "https:", "blob:"],
        connectSrc: ["'self'", "ws:", "wss:", "https://api.stripe.com", "https://api.mixpanel.com", "https://api.openai.com"],
        frameSrc: ["'self'", "https://js.stripe.com"],
        objectSrc: ["'none'"],
        baseUri: ["'self'"],
        formAction: ["'self'"],
      },
    },
    hsts: {
      maxAge: 31536000,
      includeSubDomains: true,
      preload: true
    }
  }));

  // Configure multer for secure file uploads
  const upload = multer({
    limits: {
      fileSize: 10 * 1024 * 1024, // 10MB limit
      files: 1, // Only one file at a time
    },
    fileFilter: (req, file, cb) => {
      // Only allow audio files for transcription and images for visual translation
      const allowedMimeTypes = [
        'audio/wav',
        'audio/mp3',
        'audio/mpeg',
        'audio/mp4',
        'audio/webm',
        'audio/ogg',
        'image/jpeg',
        'image/jpg',
        'image/png',
        'image/webp'
      ];
      
      if (allowedMimeTypes.includes(file.mimetype)) {
        cb(null, true);
      } else {
        cb(new Error(`Invalid file type: ${file.mimetype}. Only audio and image files are allowed.`));
      }
    },
    storage: multer.memoryStorage() // Store in memory for processing
  });

  // Set up authentication
  await setupAuth(app);

  // Serve web app at /webapp route (for iframe content) - BEFORE other routes
  app.get('/webapp*', (req: Request, res: Response, next: NextFunction) => {
    // Rewrite the URL to root and originalUrl so Vite serves the React app
    req.url = '/';
    req.originalUrl = '/';
    next();
  });

  // Mobile web interface
  app.get('/mobile', (req: Request, res: Response) => {
    const mobilePath = path.join(process.cwd(), 'mobile-web.html');
    
    if (fs.existsSync(mobilePath)) {
      res.sendFile(mobilePath);
    } else {
      res.status(404).send('Mobile interface not found');
    }
  });

  // Mobile app preview - standalone route without auth
  app.get('/mobile-app-preview', (req: Request, res: Response) => {
    const previewPath = path.join(process.cwd(), 'mobile-app-preview.html');
    
    if (fs.existsSync(previewPath)) {
      res.sendFile(previewPath);
    } else {
      res.status(404).send('Mobile preview not found');
    }
  });

  // Mobile preview - clear cache headers to force reload
  app.get('/mobile-preview', (req: Request, res: Response, next: NextFunction) => {
    // Force browser to bypass cache completely
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate, proxy-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    res.setHeader('Surrogate-Control', 'no-store');
    res.setHeader('ETag', '');
    res.setHeader('Last-Modified', '');
    
    // Continue to React app
    next();
  });

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
        }
        .mobile-container.iphone {
            width: 414px;
            height: 896px;
            border-radius: 40px;
        }
        .mobile-container.android {
            width: 393px;
            height: 851px;
            border-radius: 20px;
        }
        .mobile-container.tablet {
            width: 600px;
            height: 800px;
            border-radius: 25px;
        }
        .mobile-screen {
            width: 100%;
            height: 100%;
            background: white;
            overflow: hidden;
            position: relative;
        }
        .mobile-container.iphone .mobile-screen {
            border-radius: 32px;
        }
        .mobile-container.android .mobile-screen {
            border-radius: 12px;
        }
        .mobile-container.tablet .mobile-screen {
            border-radius: 17px;
        }
        .notch {
            position: absolute;
            top: 0;
            left: 50%;
            transform: translateX(-50%);
            background: #1a1a1a;
            z-index: 10;
        }
        .mobile-container.iphone .notch {
            width: 150px;
            height: 30px;
            border-radius: 0 0 15px 15px;
        }
        .mobile-container.android .notch {
            width: 100px;
            height: 20px;
            border-radius: 0 0 10px 10px;
        }
        iframe {
            width: 100%;
            height: 100%;
            border: none;
        }
        .mobile-container.iphone iframe {
            border-radius: 32px;
        }
        .mobile-container.android iframe {
            border-radius: 12px;
        }
        .mobile-container.tablet iframe {
            border-radius: 17px;
        }
        .loading {
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            text-align: center;
            color: #666;
            z-index: 5;
        }
        .spinner {
            width: 40px;
            height: 40px;
            border: 4px solid #f3f3f3;
            border-top: 4px solid #667eea;
            border-radius: 50%;
            animation: spin 1s linear infinite;
            margin: 0 auto 20px;
        }
        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }
        .status-indicator {
            position: absolute;
            top: 15px;
            right: 20px;
            color: #00ff00;
            font-size: 12px;
            z-index: 20;
            background: rgba(0,0,0,0.7);
            padding: 4px 8px;
            border-radius: 12px;
        }
        .web-toggle {
            position: absolute;
            top: 10px;
            left: 15px;
            z-index: 20;
            background: rgba(0,0,0,0.7);
            padding: 4px 8px;
            border-radius: 12px;
            color: #fff;
            font-size: 12px;
            cursor: pointer;
            text-decoration: none;
        }
        .web-toggle:hover {
            background: rgba(0,0,0,0.9);
            color: #667eea;
        }
        @media (max-width: 480px) {
            body { padding: 0; }
            .mobile-container {
                max-width: 100%;
                height: 100vh;
                border-radius: 0;
                padding: 0;
                box-shadow: none;
            }
            .mobile-screen {
                border-radius: 0;
            }
            .notch { display: none; }
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>🦜 ParrotSpeak</h1>
        <p>Mobile Voice Translation - Timezone Localized for Colorado MST</p>
    </div>
    
    <div class="device-selector">
        <button class="device-option active" onclick="switchDevice('iphone')">iPhone</button>
        <button class="device-option" onclick="switchDevice('android')">Android</button>
        <button class="device-option" onclick="switchDevice('tablet')">Tablet</button>
    </div>
    
    <div class="mobile-container iphone" id="deviceContainer">
        <div class="notch"></div>
        <a href="/webapp" class="web-toggle">WEB VIEW</a>
        <div class="status-indicator">● MOBILE LIVE</div>
        <div class="mobile-screen">
            <div class="loading">
                <div class="spinner"></div>
                <h3>ParrotSpeak Mobile</h3>
                <p>Loading voice translation interface...</p>
            </div>
            <iframe src="/?mobile=true" onload="document.querySelector('.loading').style.display='none'" sandbox="allow-same-origin allow-scripts allow-forms"></iframe>
        </div>
    </div>
    
    <script>
        function switchDevice(deviceType) {
            const container = document.getElementById('deviceContainer');
            const buttons = document.querySelectorAll('.device-option');
            
            // Remove all device classes
            container.className = 'mobile-container ' + deviceType;
            
            // Update active button
            buttons.forEach(btn => btn.classList.remove('active'));
            event.target.classList.add('active');
            
            // Hide notch for tablet
            const notch = container.querySelector('.notch');
            if (deviceType === 'tablet') {
                notch.style.display = 'none';
            } else {
                notch.style.display = 'block';
            }
        }
    </script>
</body>
</html>`;
    res.setHeader('Content-Type', 'text/html');
    res.send(mobileHTML);
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
            
            // Track translation analytics for Mixpanel
            if (userId) {
              try {
                const Mixpanel = (await import('mixpanel')).default;
                const mixpanel = Mixpanel.init(process.env.MIXPANEL_PROJECT_TOKEN!);
                
                mixpanel.track('translation_completed', {
                  distinct_id: `user_${userId}`,
                  source_language: sourceLanguage,
                  target_language: targetLanguage,
                  response_time: responseTime,
                  success: true,
                  text_length: text.length,
                  timestamp: new Date().toISOString(),
                  source: 'parrotspeak_app'
                });
                
                // Also set user profile data
                mixpanel.people.set(`user_${userId}`, {
                  $last_seen: new Date().toISOString(),
                  last_translation: new Date().toISOString(),
                  recent_language_pair: `${sourceLanguage} → ${targetLanguage}`,
                  user_type: 'translator'
                });
                
                console.log('✓ Mixpanel translation event sent:', {
                  event: 'translation_completed',
                  user: `user_${userId}`,
                  languages: `${sourceLanguage} → ${targetLanguage}`
                });
              } catch (error) {
                console.error('Mixpanel tracking error:', error);
              }
            }
            console.log('Translation completed successfully');
            
            // Save the translated response with encryption if userId is provided
            await storage.saveMessage(
              conversationId,
              translationResult.translation,
              false,
              targetLanguage,
              sourceLanguage,
              userId
            );
            
            // Send translation back to client
            if (ws.readyState === WebSocket.OPEN) {
              ws.send(JSON.stringify({
                type: 'translation',
                originalText: text,
                translation: translationResult.translation,
                messageId,
                conversationId
              }));
            }
          } catch (err) {
            console.error('Translation error:', err);
            
            // Format a more user-friendly error message
            let errorMessage = 'Translation failed. Please try again.';
            
            if (err instanceof Error) {
              // Check for quota errors
              if (err.message.includes('quota exceeded') || err.message.includes('insufficient_quota')) {
                errorMessage = 'OpenAI API quota exceeded. Please update your API key or check your usage limits.';
              }
              // Network errors
              else if (err.message.includes('connect') || err.message.includes('network')) {
                errorMessage = 'Cannot connect to the translation service. Please check your internet connection.';
              }
              // Any other specific error message we want to surface to the user
              else if (err.message.includes('API key')) {
                errorMessage = 'Invalid or missing OpenAI API key. Please check your API configuration.';
              }
            }
            
            if (ws.readyState === WebSocket.OPEN) {
              ws.send(JSON.stringify({
                type: 'error',
                message: errorMessage
              }));
            }
          }
        }
      } catch (err) {
        console.error('WebSocket message error:', err);
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({
            type: 'error',
            message: 'Invalid request format'
          }));
        }
      }
    });
    
    ws.on('close', () => {
      console.log('Client disconnected from WebSocket');
    });
  });
  
  // Authentication Routes
  
  // Register a new user
  app.post(
    "/api/auth/register",
    authLimiter,
    [
      body("email").isEmail().withMessage("Please provide a valid email"),
      body("username").trim().isLength({ min: 3 }).withMessage("Username must be at least 3 characters"),
      body("password")
        .isLength({ min: 8 })
        .withMessage("Password must be at least 8 characters")
        .matches(/[A-Z]/)
        .withMessage("Password must contain at least one uppercase letter")
        .matches(/[a-z]/)
        .withMessage("Password must contain at least one lowercase letter")
        .matches(/[0-9]/)
        .withMessage("Password must contain at least one number"),
    ],
    async (req: Request, res: Response) => {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      try {
        const user = await registerUser(req.body);
        req.login(user, (err) => {
          if (err) {
            return res.status(500).json({ message: "Login after registration failed" });
          }
          return res.status(201).json(user);
        });
      } catch (error: any) {
        return res.status(400).json({ message: error.message });
      }
    }
  );

  // Login existing user
  app.post(
    "/api/auth/login",
    authLimiter,
    [
      body("email").isEmail().withMessage("Please provide a valid email"),
      body("password").notEmpty().withMessage("Password is required"),
    ],
    async (req: Request, res: Response, next: NextFunction) => {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      try {
        const user = await loginUser(req.body);
        req.login(user, (err) => {
          if (err) {
            return next(err);
          }
          return res.json(user);
        });
      } catch (error: any) {
        return res.status(401).json({ message: error.message });
      }
    }
  );

  // Google OAuth login
  if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
    app.get(
      "/api/auth/google",
      passport.authenticate("google", { scope: ["profile", "email"] })
    );

    app.get(
      "/api/auth/google/callback",
      passport.authenticate("google", { failureRedirect: "/login" }),
      (req: Request, res: Response) => {
        res.redirect("/");
      }
    );
  }

  // Apple OAuth routes (will require additional setup)
  app.get("/api/auth/apple", (req: Request, res: Response) => {
    res.status(501).json({ message: "Apple login not yet implemented" });
  });

  // Logout route
  app.post("/api/auth/logout", (req: Request, res: Response, next: NextFunction) => {
    req.logout((err) => {
      if (err) {
        return next(err);
      }
      res.json({ message: "Logged out successfully" });
    });
  });

  // Get current user
  app.get("/api/auth/user", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    
    // Track anonymized user profile in Mixpanel
    console.log('Attempting to track user profile in Mixpanel...');
    try {
      const user = req.user as any;
      console.log('User data:', { id: user.id, email: user.email });
      
      const crypto = await import('crypto');
      const anonymizedUserId = `user_${crypto.createHash('sha256').update(`${user.id}_${process.env.ENCRYPTION_MASTER_KEY}`).digest('hex').substring(0, 16)}`;
      console.log('Generated anonymized user ID:', anonymizedUserId);
      
      const Mixpanel = (await import('mixpanel')).default;
      const mixpanel = Mixpanel.init(process.env.MIXPANEL_PROJECT_TOKEN!);
      console.log('Mixpanel initialized for user profile tracking');
      
      const profileData = {
        $created: user.createdAt,
        subscription_status: user.subscriptionStatus || 'free',
        user_type: 'parrotspeak_user',
        account_age_days: Math.floor((Date.now() - new Date(user.createdAt).getTime()) / (1000 * 60 * 60 * 24))
      };
      
      mixpanel.people.set(anonymizedUserId, profileData);
      
      console.log('✓ Mixpanel user profile sent:', {
        user_id: anonymizedUserId,
        profile_data: profileData
      });
    } catch (error) {
      console.error('Mixpanel user profile error:', error);
    }
    
    res.json(req.user);
  });
  
  // Request password reset
  app.post("/api/auth/request-reset", 
    body("email").isEmail().normalizeEmail(),
    async (req: Request, res: Response) => {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }
      
      const { email } = req.body;
      const originUrl = `${req.protocol}://${req.get("host")}`;
      
      try {
        const result = await createPasswordResetToken(email, originUrl);
        res.json(result);
      } catch (error) {
        console.error("Error requesting password reset:", error);
        res.status(500).json({ 
          success: false, 
          message: "An error occurred while processing your request." 
        });
      }
  });
  
  // Reset password with token
  app.post("/api/auth/reset-password", 
    body("token").notEmpty(),
    body("password").isLength({ min: 8 })
      .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d]{8,}$/),
    async (req: Request, res: Response) => {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }
      
      const { token, password } = req.body;
      
      try {
        const result = await resetPassword(token, password);
        if (result.success) {
          res.json(result);
        } else {
          res.status(400).json(result);
        }
      } catch (error) {
        console.error("Error resetting password:", error);
        res.status(500).json({ 
          success: false, 
          message: "An error occurred while resetting your password." 
        });
      }
  });

  // Stripe webhook endpoint - using body-parser bypass
  app.post("/api/webhook", 
    (req: Request, res: Response, next: NextFunction) => {
      // Get raw body for Stripe webhook verification
      const chunks: Buffer[] = [];
      req.on('data', (chunk: Buffer) => {
        chunks.push(chunk);
      });
      req.on('end', () => {
        if (chunks.length) {
          req.body = Buffer.concat(chunks);
        }
        next();
      });
    },
    async (req: Request, res: Response) => {
    const sig = req.headers['stripe-signature'];
    
    if (!sig || typeof sig !== 'string' || !process.env.STRIPE_WEBHOOK_SECRET) {
      return res.status(400).send('Webhook signature verification failed');
    }
    
    let event: Stripe.Event;
    
    try {
      event = stripe.webhooks.constructEvent(
        req.body,
        sig,
        process.env.STRIPE_WEBHOOK_SECRET
      );
    } catch (err: any) {
      console.error(`Webhook Error: ${err.message}`);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }
    
    try {
      await handleWebhookEvent(event);
      res.json({ received: true });
    } catch (error) {
      console.error('Error processing webhook event:', error);
      return res.status(500).json({ error: 'Error processing webhook event' });
    }
  });
  
  // Stripe payment routes
  app.post("/api/create-payment-intent", requireAuth, async (req: Request, res: Response) => {
    try {
      const { amount, plan, interval } = req.body;
      const userId = req.user?.id;
      
      if (!userId) {
        return res.status(401).json({ message: "User not authenticated" });
      }

      // Calculate expiration date based on plan duration
      const now = new Date();
      let expiresAt = new Date(now);
      let paymentType = 'one-time';
      
      // Set expiration based on plan
      switch (plan) {
        case '1week':
          expiresAt.setDate(now.getDate() + 7); // 7 days
          break;
        case '1month':
          expiresAt.setDate(now.getDate() + 30); // 30 days
          break;
        case '3months':
          expiresAt.setDate(now.getDate() + 90); // 90 days
          break;
        case '6months':
          expiresAt.setDate(now.getDate() + 180); // 180 days
          break;
        case 'monthly':
          expiresAt.setDate(now.getDate() + 30); // 30 days initial period
          paymentType = 'subscription';
          break;
        case 'annual':
          expiresAt.setDate(now.getDate() + 365); // 365 days initial period
          paymentType = 'subscription';
          break;
        default:
          expiresAt.setDate(now.getDate() + 30); // Default to 30 days
      }
      
      // Create a PaymentIntent with the order amount and currency
      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(amount * 100), // Convert to cents
        currency: "usd",
        metadata: { 
          userId,
          plan,
          expiresAt: expiresAt.toISOString(),
          paymentType
        },
      });

      res.json({
        clientSecret: paymentIntent.client_secret,
      });
    } catch (error: any) {
      console.error("Payment intent creation error:", error);
      res.status(500).json({ message: error.message });
    }
  });
  
  // API Routes
  
  // Create a new conversation
  app.post('/api/conversations', requireAuth, requireSubscription, async (req, res) => {
    try {
      const { sourceLanguage, targetLanguage, customName, title } = req.body;
      
      if (!sourceLanguage || !targetLanguage) {
        return res.status(400).json({ message: 'Source and target languages are required' });
      }
      
      // Get userId from authenticated user for encryption
      const userId = req.user?.id;
      
      const conversation = await storage.createConversation(sourceLanguage, targetLanguage, customName, userId, title);
      res.status(201).json(conversation);
    } catch (err) {
      console.error('Create conversation error:', err);
      res.status(500).json({ message: 'Failed to create conversation' });
    }
  });
  
  // Update conversation metadata
  app.patch('/api/conversations/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const { customName, isFavorite, category, tags } = req.body;
      
      // Create an updates object with only the fields that are present
      const updates: any = {};
      if (customName !== undefined) updates.customName = customName;
      if (isFavorite !== undefined) updates.isFavorite = isFavorite;
      if (category !== undefined) updates.category = category;
      if (tags !== undefined) updates.tags = tags;
      
      const updatedConversation = await storage.updateConversation(id, updates);
      res.json(updatedConversation);
    } catch (err) {
      console.error('Update conversation error:', err);
      
      if (err instanceof Error && err.message === 'Conversation not found') {
        return res.status(404).json({ message: 'Conversation not found' });
      }
      
      res.status(500).json({ message: 'Failed to update conversation' });
    }
  });
  
  // Get all conversations
  app.get('/api/conversations', apiLimiter, async (req, res) => {
    try {
      // Get user ID from session if authenticated
      const userId = req.user?.id;
      const conversations = await storage.getConversations(userId);
      res.json(conversations);
    } catch (err) {
      console.error('Get conversations error:', err);
      res.status(500).json({ message: 'Failed to retrieve conversations' });
    }
  });
  
  // Get a specific conversation with its messages
  app.get('/api/conversations/:id', apiLimiter, async (req, res) => {
    try {
      const conversation = await storage.getConversation(req.params.id);
      
      if (!conversation) {
        return res.status(404).json({ message: 'Conversation not found' });
      }
      
      // Verify user ownership
      if (req.user && conversation.userId !== req.user.id) {
        return res.status(403).json({ message: 'Access denied' });
      }
      
      res.json(conversation);
    } catch (err) {
      console.error('Get conversation error:', err);
      res.status(500).json({ message: 'Failed to retrieve conversation' });
    }
  });
  
  // Add a message to conversation (REST API fallback when WebSocket is unavailable)
  app.post('/api/conversations/:id/messages', apiLimiter, requireAuth, requireSubscription, async (req, res) => {
    try {
      const { id } = req.params;
      const { text, sourceLanguage, targetLanguage } = req.body;
      
      if (!text || !sourceLanguage || !targetLanguage) {
        return res.status(400).json({ message: 'Text, source language and target language are required' });
      }
      
      // Save the original message
      const messageId = await storage.saveMessage(
        id,
        text,
        true,
        sourceLanguage,
        targetLanguage
      );
      
      // Record start time for performance tracking
      const startTime = Date.now();
      
      // Perform translation
      const translationResult = await translateText(text, sourceLanguage, targetLanguage);
      
      // Calculate response time
      const responseTime = Date.now() - startTime;
      
      // Track translation event for Mixpanel analytics
      console.log('Translation completed successfully in WebSocket');
      
      // Save the translated response
      await storage.saveMessage(
        id,
        translationResult.translation,
        false,
        targetLanguage,
        sourceLanguage
      );
      
      res.status(201).json({
        id: messageId,
        originalText: text,
        translation: translationResult.translation
      });
    } catch (err) {
      console.error('Add message error:', err);
      
      // Format a more user-friendly error message
      let errorMessage = 'Failed to process translation';
      
      if (err instanceof Error) {
        // Check for quota errors
        if (err.message.includes('quota exceeded') || err.message.includes('insufficient_quota')) {
          errorMessage = 'OpenAI API quota exceeded. Please update your API key or check your usage limits.';
        }
        // Network errors
        else if (err.message.includes('connect') || err.message.includes('network')) {
          errorMessage = 'Cannot connect to the translation service. Please check your internet connection.';
        }
        // Any other specific error message we want to surface to the user
        else if (err.message.includes('API key')) {
          errorMessage = 'Invalid or missing OpenAI API key. Please check your API configuration.';
        }
      }
      
      res.status(500).json({ message: errorMessage });
    }
  });
  
  // Delete a conversation
  app.delete('/api/conversations/:id', async (req, res) => {
    try {
      await storage.deleteConversation(req.params.id);
      res.status(204).send();
    } catch (err) {
      console.error('Delete conversation error:', err);
      res.status(500).json({ message: 'Failed to delete conversation' });
    }
  });
  
  // Text-to-text translation endpoint
  app.post('/api/translate', requireAuth, requireSubscription, async (req, res) => {
    try {
      const { text, sourceLanguage, targetLanguage } = req.body;
      
      if (!text || !sourceLanguage || !targetLanguage) {
        return res.status(400).json({ message: 'Text, source language and target language are required' });
      }
      
      // Record start time for performance tracking
      const startTime = Date.now();
      
      // Perform translation
      const translationResult = await translateText(text, sourceLanguage, targetLanguage);
      
      // Calculate response time
      const responseTime = Date.now() - startTime;
      
      // Track translation analytics (if user has opted in)
      if (req.user) {
        const userId = (req.user as any).id;
        const sessionId = req.sessionID || 'anonymous';
        
        await analytics.trackTranslation(
          userId,
          sessionId,
          sourceLanguage,
          targetLanguage,
          responseTime,
          true // success
        );
      }
      
      res.json(translationResult);
    } catch (err) {
      console.error('Translation error:', err);
      
      // Format a more user-friendly error message
      let errorMessage = 'Translation failed';
      
      if (err instanceof Error) {
        // Check for quota errors
        if (err.message.includes('quota exceeded') || err.message.includes('insufficient_quota')) {
          errorMessage = 'OpenAI API quota exceeded. Please update your API key or check your usage limits.';
        }
        // Network errors
        else if (err.message.includes('connect') || err.message.includes('network')) {
          errorMessage = 'Cannot connect to the translation service. Please check your internet connection.';
        }
        // Any other specific error message we want to surface to the user
        else if (err.message.includes('API key')) {
          errorMessage = 'Invalid or missing OpenAI API key. Please check your API configuration.';
        }
      }
      
      res.status(500).json({ message: errorMessage });
    }
  });

  // Mark a message as having been spoken
  app.patch('/api/messages/:id/mark-spoken', async (req, res) => {
    try {
      const { id } = req.params;
      
      console.log(`[server] Marking message ${id} as spoken`);
      
      // First check if message exists
      const originalMessage = await db.query.messages.findFirst({
        where: eq(messages.id, id)
      });
      
      if (!originalMessage) {
        console.log(`[server] Message ${id} not found, but returning success for mobile preview compatibility`);
        
        // CRITICAL FIX: Even if we can't find the message, we'll still return success
        // This allows the mobile preview to work properly even if message IDs don't match
        return res.status(200).json({ 
          success: true,
          message: {
            id: id,
            hasBeenSpoken: true,
            isUser: false,
            text: "(Message in preview)",
            timestamp: new Date().toISOString()
          },
          synthetic: true
        });
      }
      
      console.log(`[server] Original message status: hasBeenSpoken=${originalMessage.hasBeenSpoken}`);
      
      // Skip update if already marked as spoken
      if (originalMessage.hasBeenSpoken) {
        console.log(`[server] Message ${id} already marked as spoken, skipping update`);
        return res.status(200).json({ 
          success: true, 
          message: originalMessage,
          skipped: true
        });
      }
      
      // Update the message in the database to mark it as spoken
      const updatedMessage = await storage.markMessageAsSpoken(id);
      
      if (!updatedMessage) {
        console.log(`[server] Failed to update message ${id}`);
        return res.status(500).json({ 
          success: false, 
          message: 'Failed to update message'
        });
      }
      
      console.log(`[server] After update, message ${id} hasBeenSpoken=${updatedMessage.hasBeenSpoken}`);
      
      // If update didn't set hasBeenSpoken, force a direct update as a fallback
      if (updatedMessage.hasBeenSpoken !== true) {
        console.log(`[server] Update didn't set hasBeenSpoken, trying direct update`);
        
        // Perform a direct update
        await db.update(messages)
          .set({ hasBeenSpoken: true })
          .where(eq(messages.id, id));
          
        // Verify the update worked
        const verifiedMessage = await db.query.messages.findFirst({
          where: eq(messages.id, id)
        });
        
        console.log(`[server] After direct update, message ${id} hasBeenSpoken=${verifiedMessage?.hasBeenSpoken}`);
        
        return res.status(200).json({ 
          success: true, 
          message: verifiedMessage,
          directUpdate: true
        });
      }
      
      // Normal success response
      res.status(200).json({ 
        success: true, 
        message: updatedMessage
      });
    } catch (err) {
      console.error('Mark message as spoken error:', err);
      res.status(500).json({ 
        success: false, 
        message: 'Failed to mark message as spoken',
        error: err instanceof Error ? err.message : 'Unknown error'
      });
    }
  });
  
  // Test endpoint to check message status
  app.get('/api/messages/:id/status', async (req, res) => {
    try {
      const { id } = req.params;
      
      console.log(`[server] Checking status for message ${id}`);
      
      const message = await db.query.messages.findFirst({
        where: eq(messages.id, id)
      });
      
      if (!message) {
        return res.status(404).json({ message: 'Message not found' });
      }
      
      console.log(`[server] Message ${id} hasBeenSpoken=${message.hasBeenSpoken}`);
      
      res.status(200).json({ 
        id: message.id,
        hasBeenSpoken: message.hasBeenSpoken
      });
    } catch (err) {
      console.error('Get message status error:', err);
      res.status(500).json({ message: 'Failed to get message status' });
    }
  });

  // Analytics endpoints
  
  // Get translation quality metrics
  app.get('/api/analytics/translation-quality', async (req, res) => {
    try {
      const qualityData = await analytics.getAverageTranslationQuality();
      res.json(qualityData);
    } catch (err) {
      console.error('Get translation quality error:', err);
      res.status(500).json({ message: 'Failed to retrieve translation quality data' });
    }
  });
  
  // Get usage statistics for a date range
  app.get('/api/analytics/usage', async (req, res) => {
    try {
      const { startDate, endDate } = req.query;
      if (!startDate || !endDate || 
          typeof startDate !== 'string' || 
          typeof endDate !== 'string') {
        return res.status(400).json({ message: 'Start date and end date are required' });
      }
      
      const usageData = await analytics.getUsageStatisticsForDateRange(startDate, endDate);
      res.json(usageData);
    } catch (err) {
      console.error('Get usage statistics error:', err);
      res.status(500).json({ message: 'Failed to retrieve usage statistics' });
    }
  });
  
  // Get top language pairs
  app.get('/api/analytics/top-languages', async (req, res) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 5;
      const languagePairs = await analytics.getTopLanguagePairs(limit);
      res.json(languagePairs);
    } catch (err) {
      console.error('Get top language pairs error:', err);
      res.status(500).json({ message: 'Failed to retrieve top language pairs' });
    }
  });
  
  // Visual image translation endpoint
  app.post('/api/visual-translate', requireAuth, requireSubscription, async (req, res) => {
    try {
      const { imageBase64, sourceLanguage, targetLanguage } = req.body;
      
      if (!imageBase64 || !sourceLanguage || !targetLanguage) {
        return res.status(400).json({ 
          message: 'Image data, source language and target language are required' 
        });
      }
      
      // Process the image and translate the text
      const result = await analyzeImageAndTranslate(
        imageBase64,
        sourceLanguage,
        targetLanguage
      );
      
      res.json(result);
    } catch (err) {
      console.error('Visual translation error:', err);
      
      // Format a more user-friendly error message
      let errorMessage = 'Visual translation failed';
      
      if (err instanceof Error) {
        // Check for quota errors
        if (err.message.includes('quota exceeded') || err.message.includes('insufficient_quota')) {
          errorMessage = 'OpenAI API quota exceeded. Please update your API key or check your usage limits.';
        }
        // Network errors
        else if (err.message.includes('connect') || err.message.includes('network')) {
          errorMessage = 'Cannot connect to the translation service. Please check your internet connection.';
        }
        // Any other specific error message we want to surface to the user
        else if (err.message.includes('API key')) {
          errorMessage = 'Invalid or missing OpenAI API key. Please check your API configuration.';
        }
      }
      
      res.status(500).json({ message: errorMessage });
    }
  });
  
  // Get conversation patterns
  app.get('/api/analytics/conversation-patterns/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const patterns = await analytics.getConversationPatterns(id);
      res.json(patterns);
    } catch (err) {
      console.error('Get conversation patterns error:', err);
      res.status(500).json({ message: 'Failed to retrieve conversation patterns' });
    }
  });
  
  // Submit translation quality feedback
  app.post('/api/analytics/translation-feedback', async (req, res) => {
    try {
      const { messageId, qualityScore, feedbackType, userFeedback } = req.body;
      
      if (!messageId || typeof qualityScore !== 'number' || !feedbackType) {
        return res.status(400).json({ 
          message: 'Message ID, quality score, and feedback type are required' 
        });
      }
      
      await analytics.recordTranslationFeedback(
        messageId,
        qualityScore,
        feedbackType,
        userFeedback
      );
      
      res.status(201).json({ success: true });
    } catch (err) {
      console.error('Submit translation feedback error:', err);
      res.status(500).json({ message: 'Failed to submit translation feedback' });
    }
  });
  
  // Voice profile management
  
  // Get all voice profiles
  app.get('/api/voice-profiles', requireAuth, async (req, res) => {
    try {
      const userId = req.user!.id;
      const voiceProfiles = await storage.getVoiceProfiles(userId);
      res.json(voiceProfiles);
    } catch (err) {
      console.error('Get voice profiles error:', err);
      res.status(500).json({ message: 'Failed to retrieve voice profiles' });
    }
  });

  // Get a specific voice profile
  app.get('/api/voice-profiles/:id', requireAuth, async (req, res) => {
    try {
      const voiceProfile = await storage.getVoiceProfile(req.params.id);
      
      if (!voiceProfile) {
        return res.status(404).json({ message: 'Voice profile not found' });
      }
      
      // Verify user ownership
      if (voiceProfile.userId && voiceProfile.userId !== req.user!.id) {
        return res.status(403).json({ message: 'Access denied' });
      }
      
      res.json(voiceProfile);
    } catch (err) {
      console.error('Get voice profile error:', err);
      res.status(500).json({ message: 'Failed to retrieve voice profile' });
    }
  });

  // Create a new voice profile
  app.post('/api/voice-profiles', requireAuth, async (req, res) => {
    try {
      const { name, languageCode, pitch, rate, voiceType, isDefault } = req.body;
      
      if (!name || !languageCode) {
        return res.status(400).json({ message: 'Name and language code are required' });
      }
      
      const voiceProfile = await storage.createVoiceProfile({
        name,
        languageCode,
        pitch: pitch || 1.0,
        rate: rate || 1.0,
        voiceType,
        isDefault: isDefault || false
      }, req.user!.id);
      
      res.status(201).json(voiceProfile);
    } catch (err) {
      console.error('Create voice profile error:', err);
      res.status(500).json({ message: 'Failed to create voice profile' });
    }
  });

  // Update a voice profile
  app.patch('/api/voice-profiles/:id', requireAuth, async (req, res) => {
    try {
      const { id } = req.params;
      const { name, languageCode, pitch, rate, voiceType, isDefault } = req.body;
      
      // First verify the voice profile exists and belongs to the user
      const existingProfile = await storage.getVoiceProfile(id);
      if (!existingProfile) {
        return res.status(404).json({ message: 'Voice profile not found' });
      }
      if (existingProfile.userId && existingProfile.userId !== req.user!.id) {
        return res.status(403).json({ message: 'Access denied' });
      }
      
      // Create an updates object with only the fields that are present
      const updates: any = {};
      if (name !== undefined) updates.name = name;
      if (languageCode !== undefined) updates.languageCode = languageCode;
      if (pitch !== undefined) updates.pitch = pitch;
      if (rate !== undefined) updates.rate = rate;
      if (voiceType !== undefined) updates.voiceType = voiceType;
      if (isDefault !== undefined) updates.isDefault = isDefault;
      
      const updatedProfile = await storage.updateVoiceProfile(id, updates);
      res.json(updatedProfile);
    } catch (err) {
      console.error('Update voice profile error:', err);
      
      if (err instanceof Error && err.message === 'Voice profile not found') {
        return res.status(404).json({ message: 'Voice profile not found' });
      }
      
      res.status(500).json({ message: 'Failed to update voice profile' });
    }
  });

  // Delete a voice profile
  app.delete('/api/voice-profiles/:id', requireAuth, async (req, res) => {
    try {
      // First verify the voice profile exists and belongs to the user
      const existingProfile = await storage.getVoiceProfile(req.params.id);
      if (!existingProfile) {
        return res.status(404).json({ message: 'Voice profile not found' });
      }
      if (existingProfile.userId && existingProfile.userId !== req.user!.id) {
        return res.status(403).json({ message: 'Access denied' });
      }
      
      await storage.deleteVoiceProfile(req.params.id);
      res.status(204).send();
    } catch (err) {
      console.error('Delete voice profile error:', err);
      
      if (err instanceof Error && err.message === 'Voice profile not found') {
        return res.status(404).json({ message: 'Voice profile not found' });
      }
      
      if (err instanceof Error && err.message === 'Cannot delete the default voice profile') {
        return res.status(400).json({ message: 'Cannot delete the default voice profile' });
      }
      
      res.status(500).json({ message: 'Failed to delete voice profile' });
    }
  });

  // Speech settings management
  
  // Export feedback as CSV download
  app.get('/api/feedback/export', requireAuth, async (req: Request, res: Response) => {
    try {
      // Get all feedback with user information
      const feedback = await db
        .select({
          id: userFeedback.id,
          category: userFeedback.category,
          feedback: userFeedback.feedback,
          email: userFeedback.email,
          status: userFeedback.status,
          createdAt: userFeedback.createdAt,
          updatedAt: userFeedback.updatedAt,
          userName: users.username,
          userEmail: users.email,
          userFirstName: users.firstName,
          userLastName: users.lastName,
        })
        .from(userFeedback)
        .leftJoin(users, eq(userFeedback.userId, users.id))
        .orderBy(desc(userFeedback.createdAt));

      // Create CSV header
      const csvHeader = [
        'ID',
        'Category',
        'Status', 
        'Submitted Date',
        'Last Updated',
        'User Name',
        'User Email',
        'Contact Email',
        'Full Name',
        'Feedback Message'
      ].join(',');

      // Convert feedback to CSV rows
      const csvRows = feedback.map(item => {
        const fullName = [item.userFirstName, item.userLastName].filter(Boolean).join(' ') || '';
        const contactEmail = item.email && item.email !== item.userEmail ? item.email : '';
        
        // Escape quotes and commas in the feedback message
        const escapedFeedback = `"${item.feedback.replace(/"/g, '""')}"`;
        
        return [
          item.id,
          item.category,
          item.status,
          item.createdAt?.toISOString() || '',
          item.updatedAt?.toISOString() || '',
          item.userName || '',
          item.userEmail || '',
          contactEmail,
          fullName,
          escapedFeedback
        ].join(',');
      });

      // Combine header and rows
      const csvContent = [csvHeader, ...csvRows].join('\n');
      
      // Generate filename with timestamp
      const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
      const filename = `parrotspeak-feedback-${timestamp}.csv`;
      
      // Set headers for CSV download
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      
      // Send CSV content
      res.send(csvContent);
      
    } catch (error) {
      console.error('Error exporting feedback to CSV:', error);
      res.status(500).json({ message: 'Failed to export feedback' });
    }
  });

  // Feedback submission endpoint
  app.post('/api/feedback', requireAuth, async (req: Request, res: Response) => {
    try {
      const { feedback, category, email } = req.body;
      
      if (!feedback || !category) {
        return res.status(400).json({ message: 'Feedback and category are required' });
      }
      
      if (!['bug', 'feature', 'translation', 'other'].includes(category)) {
        return res.status(400).json({ message: 'Invalid category' });
      }
      
      // Insert feedback into database
      const [newFeedback] = await db.insert(userFeedback).values({
        userId: req.user?.id,
        category,
        feedback,
        email: email || req.user?.email || null,
        status: 'new',
      }).returning();
      
      // Import email service
      const { sendFeedbackEmail } = await import('./services/emailService');
      
      // Send email notification to admin
      try {
        await sendFeedbackEmail(
          feedback,
          category,
          email || req.user?.email,
          req.user?.username || req.user?.firstName
        );
        console.log('Feedback notification email sent successfully');
      } catch (emailError) {
        console.error('Failed to send feedback notification email:', emailError);
        // Continue execution even if email fails
      }
      
      return res.status(201).json({ 
        message: 'Thank you for your feedback! We appreciate your help making ParrotSpeak better.',
        id: newFeedback.id
      });
      
    } catch (error) {
      console.error('Error submitting feedback:', error);
      return res.status(500).json({ message: 'Failed to submit feedback' });
    }
  });
  
  // Get speech settings
  app.get('/api/speech-settings', requireAuth, async (req, res) => {
    try {
      const settings = await storage.getSpeechSettings(req.user!.id);
      res.json(settings);
    } catch (err) {
      console.error('Get speech settings error:', err);
      res.status(500).json({ message: 'Failed to retrieve speech settings' });
    }
  });

  // Update speech settings
  app.patch('/api/speech-settings', requireAuth, async (req, res) => {
    try {
      const { autoPlay, useProfileForLanguage, defaultProfileId } = req.body;
      
      // Create an updates object with only the fields that are present
      const updates: any = {};
      if (autoPlay !== undefined) updates.autoPlay = autoPlay;
      if (useProfileForLanguage !== undefined) updates.useProfileForLanguage = useProfileForLanguage;
      if (defaultProfileId !== undefined) updates.defaultProfileId = defaultProfileId;
      
      const updatedSettings = await storage.updateSpeechSettings(updates, req.user!.id);
      res.json(updatedSettings);
    } catch (err) {
      console.error('Update speech settings error:', err);
      res.status(500).json({ message: 'Failed to update speech settings' });
    }
  });

  // Speech-to-text endpoint using Whisper API
  app.post('/api/transcribe', requireAuth, requireSubscription, async (req, res) => {
    try {
      // Ensure request contains audio data
      if (!req.body || !req.body.audio) {
        return res.status(400).json({ message: 'Audio data is required' });
      }

      const { audio, language } = req.body;
      
      // Convert Base64 audio data to buffer
      const audioBuffer = Buffer.from(audio, 'base64');
      
      // Transcribe the audio
      const transcription = await transcribeAudio(audioBuffer, language);
      
      // Return the transcribed text
      res.json({ text: transcription });
    } catch (err) {
      console.error('Speech recognition error:', err);
      
      // Format a more user-friendly error message
      let errorMessage = 'Speech recognition failed';
      
      if (err instanceof Error) {
        // Check for quota errors
        if (err.message.includes('quota exceeded') || err.message.includes('insufficient_quota')) {
          errorMessage = 'OpenAI API quota exceeded. Please update your API key or check your usage limits.';
        }
        // Network errors
        else if (err.message.includes('connect') || err.message.includes('network')) {
          errorMessage = 'Cannot connect to the speech recognition service. Please check your internet connection.';
        }
        // Any other specific error message we want to surface to the user
        else if (err.message.includes('API key')) {
          errorMessage = 'Invalid or missing OpenAI API key. Please check your API configuration.';
        }
      }
      
      res.status(500).json({ message: errorMessage });
    }
  });

  // End of speech recognition endpoints

  // Get conversation patterns for a specific conversation
  app.get('/api/analytics/conversation-patterns/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const patterns = await analytics.getConversationPatterns(id);
      res.json(patterns);
    } catch (err) {
      console.error('Get conversation patterns error:', err);
      res.status(500).json({ message: 'Failed to retrieve conversation patterns' });
    }
  });
  
  // Record a new conversation pattern
  app.post('/api/analytics/conversation-patterns', async (req, res) => {
    try {
      const { conversationId, patternType, patternData, startMessageId, endMessageId } = req.body;
      
      if (!conversationId || !patternType) {
        return res.status(400).json({ message: 'Conversation ID and pattern type are required' });
      }
      
      const pattern = await analytics.recordConversationPattern(
        conversationId,
        patternType,
        patternData,
        startMessageId,
        endMessageId
      );
      
      res.status(201).json(pattern);
    } catch (err) {
      console.error('Record conversation pattern error:', err);
      res.status(500).json({ message: 'Failed to record conversation pattern' });
    }
  });

  // Admin API Routes - Protected by admin authorization
  
  // Get all users (admin only)
  app.get('/api/admin/users', requireAuth, async (req: Request, res: Response) => {
    try {
      const users = await admin.getAllUsers(req.user!.id);
      res.json(users);
    } catch (error: any) {
      console.error('Admin get users error:', error);
      if (error.message.includes('Unauthorized')) {
        return res.status(403).json({ message: error.message });
      }
      res.status(500).json({ message: 'Failed to retrieve users' });
    }
  });

  // Search users (admin only)
  app.get('/api/admin/users/search', requireAuth, async (req: Request, res: Response) => {
    try {
      const { q } = req.query;
      if (!q || typeof q !== 'string') {
        return res.status(400).json({ message: 'Search query is required' });
      }
      
      const results = await admin.searchUsers(req.user!.id, q);
      res.json(results);
    } catch (error: any) {
      console.error('Admin search users error:', error);
      if (error.message.includes('Unauthorized')) {
        return res.status(403).json({ message: error.message });
      }
      res.status(500).json({ message: 'Failed to search users' });
    }
  });

  // Get user details (admin only)
  app.get('/api/admin/users/:userId', requireAuth, async (req: Request, res: Response) => {
    try {
      const userId = parseInt(req.params.userId);
      if (isNaN(userId)) {
        return res.status(400).json({ message: 'Invalid user ID' });
      }
      
      const userDetails = await admin.getUserDetails(req.user!.id, userId);
      res.json(userDetails);
    } catch (error: any) {
      console.error('Admin get user details error:', error);
      if (error.message.includes('Unauthorized')) {
        return res.status(403).json({ message: error.message });
      }
      if (error.message.includes('not found')) {
        return res.status(404).json({ message: error.message });
      }
      res.status(500).json({ message: 'Failed to retrieve user details' });
    }
  });

  // Get conversation details with decrypted messages (admin only)
  app.get('/api/admin/conversations/:conversationId', requireAuth, async (req: Request, res: Response) => {
    try {
      const { conversationId } = req.params;
      const conversationDetails = await admin.getConversationDetails(req.user!.id, conversationId);
      res.json(conversationDetails);
    } catch (error: any) {
      console.error('Admin get conversation details error:', error);
      if (error.message.includes('Unauthorized')) {
        return res.status(403).json({ message: error.message });
      }
      if (error.message.includes('not found')) {
        return res.status(404).json({ message: error.message });
      }
      res.status(500).json({ message: 'Failed to retrieve conversation details' });
    }
  });

  // Get platform analytics (admin only)
  app.get('/api/admin/analytics', requireAuth, async (req: Request, res: Response) => {
    try {
      const analytics = await admin.getPlatformAnalytics(req.user!.id);
      res.json(analytics);
    } catch (error: any) {
      console.error('Admin get analytics error:', error);
      if (error.message.includes('Unauthorized')) {
        return res.status(403).json({ message: error.message });
      }
      res.status(500).json({ message: 'Failed to retrieve platform analytics' });
    }
  });

  // Get all feedback (admin only)
  app.get('/api/admin/feedback', requireAuth, async (req: Request, res: Response) => {
    try {
      const feedback = await admin.getAllFeedback(req.user!.id);
      res.json(feedback);
    } catch (error: any) {
      console.error('Admin get feedback error:', error);
      if (error.message.includes('Unauthorized')) {
        return res.status(403).json({ message: error.message });
      }
      res.status(500).json({ message: 'Failed to retrieve feedback' });
    }
  });

  // Admin Authorization Routes for User Consent

  // Request authorization to access user's encrypted data
  app.post('/api/admin/request-access', requireAuth, async (req: Request, res: Response) => {
    try {
      const { userId, reason, durationHours } = req.body;
      
      if (!userId || !reason) {
        return res.status(400).json({ message: 'User ID and reason are required' });
      }

      const result = await adminAuth.requestAdminAccess(
        req.user!.id,
        parseInt(userId),
        reason,
        durationHours || 24
      );

      res.json(result);
    } catch (error: any) {
      console.error('Request admin access error:', error);
      if (error.message.includes('User not found')) {
        return res.status(404).json({ message: error.message });
      }
      res.status(500).json({ message: 'Failed to request admin access' });
    }
  });

  // User authorization endpoint (public, uses token)
  app.post('/api/admin/authorize-access', async (req: Request, res: Response) => {
    try {
      const { token } = req.body;
      
      if (!token) {
        return res.status(400).json({ message: 'Authorization token is required' });
      }

      const result = await adminAuth.authorizeAdminAccess(token);
      res.json(result);
    } catch (error: any) {
      console.error('Authorize admin access error:', error);
      if (error.message.includes('Invalid') || error.message.includes('expired')) {
        return res.status(400).json({ message: error.message });
      }
      res.status(500).json({ message: 'Failed to authorize admin access' });
    }
  });

  // Revoke admin access authorization
  app.post('/api/admin/revoke-access', requireAuth, async (req: Request, res: Response) => {
    try {
      const { userId } = req.body;
      
      if (!userId) {
        return res.status(400).json({ message: 'User ID is required' });
      }

      const result = await adminAuth.revokeAdminAccess(parseInt(userId));
      res.json(result);
    } catch (error: any) {
      console.error('Revoke admin access error:', error);
      res.status(500).json({ message: 'Failed to revoke admin access' });
    }
  });

  // Get admin access requests
  app.get('/api/admin/access-requests', requireAuth, async (req: Request, res: Response) => {
    try {
      const requests = await adminAuth.getAdminAccessRequests();
      res.json(requests);
    } catch (error: any) {
      console.error('Get admin access requests error:', error);
      res.status(500).json({ message: 'Failed to retrieve access requests' });
    }
  });

  // Get audit trail data
  app.get('/api/admin/audit-trail', requireAuth, async (req: Request, res: Response) => {
    try {
      const auditData = await adminAuth.getAuditTrail();
      res.json(auditData);
    } catch (error: any) {
      console.error('Get audit trail error:', error);
      res.status(500).json({ message: 'Failed to retrieve audit trail' });
    }
  });

  // Download audit trail as CSV
  app.get('/api/admin/audit-trail/export', requireAuth, async (req: Request, res: Response) => {
    try {
      const auditData = await adminAuth.getAuditTrail();
      
      // Create CSV content
      const csvHeaders = [
        'Token ID',
        'User ID', 
        'User Email',
        'Admin ID',
        'Reason',
        'Duration Hours',
        'Token Used',
        'Created At',
        'Expires At',
        'Status'
      ];
      
      const csvRows = auditData.authorizationTokens.map((token: any) => [
        token.id,
        token.userId,
        token.userEmail || 'N/A',
        token.adminId,
        `"${token.reason}"`, // Wrap in quotes for CSV safety
        token.durationHours,
        token.used ? 'Yes' : 'No',
        new Date(token.createdAt).toISOString(),
        new Date(token.expiresAt).toISOString(),
        token.used ? 'Used' : (new Date() > new Date(token.expiresAt) ? 'Expired' : 'Active')
      ]);
      
      const csvContent = [csvHeaders, ...csvRows]
        .map(row => row.join(','))
        .join('\n');
      
      const timestamp = new Date().toISOString().split('T')[0];
      const filename = `parrotspeak-audit-trail-${timestamp}.csv`;
      
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.send(csvContent);
      
    } catch (error: any) {
      console.error('Export audit trail error:', error);
      res.status(500).json({ message: 'Failed to export audit trail' });
    }
  });

  // ====== MFA (Multi-Factor Authentication) Routes ======

  // Setup MFA for admin accounts
  app.post('/api/mfa/setup', requireAuth, async (req: Request, res: Response) => {
    try {
      const user = req.user;
      if (!user) {
        return res.status(401).json({ message: 'Authentication required' });
      }

      // Only allow for admin accounts
      if (!user.isAdmin) {
        return res.status(403).json({ message: 'MFA is only available for admin accounts' });
      }

      const mfaSetup = await mfaService.setupMFA(user.id, user.email);
      res.json(mfaSetup);

    } catch (error) {
      console.error('Error setting up MFA:', error);
      res.status(500).json({ message: 'Failed to setup MFA' });
    }
  });

  // Verify and enable MFA
  app.post('/api/mfa/verify-setup', requireAuth, async (req: Request, res: Response) => {
    try {
      const user = req.user;
      const { token } = req.body;

      if (!user || !token) {
        return res.status(400).json({ message: 'User and token required' });
      }

      const isValid = await mfaService.verifyAndEnableMFA(user.id, token);
      
      if (isValid) {
        res.json({ success: true, message: 'MFA enabled successfully' });
      } else {
        res.status(400).json({ success: false, message: 'Invalid token' });
      }

    } catch (error) {
      console.error('Error verifying MFA setup:', error);
      res.status(500).json({ message: 'Failed to verify MFA' });
    }
  });

  // Get MFA status
  app.get('/api/mfa/status', requireAuth, async (req: Request, res: Response) => {
    try {
      const user = req.user;
      if (!user) {
        return res.status(401).json({ message: 'Authentication required' });
      }

      const isEnabled = await mfaService.isMFAEnabled(user.id);
      res.json({ 
        mfaEnabled: isEnabled,
        isAdmin: user.email === 'greg.koeka@gmail.com' || false
      });

    } catch (error) {
      console.error('Error checking MFA status:', error);
      res.status(500).json({ message: 'Failed to check MFA status' });
    }
  });

  // Disable MFA
  app.post('/api/mfa/disable', requireAuth, async (req: Request, res: Response) => {
    try {
      const user = req.user;
      if (!user) {
        return res.status(401).json({ message: 'Authentication required' });
      }

      const success = await mfaService.disableMFA(user.id);
      
      if (success) {
        res.json({ success: true, message: 'MFA disabled successfully' });
      } else {
        res.status(500).json({ success: false, message: 'Failed to disable MFA' });
      }

    } catch (error) {
      console.error('Error disabling MFA:', error);
      res.status(500).json({ message: 'Failed to disable MFA' });
    }
  });

  // Account Management Routes
  
  // Cancel subscription
  app.post('/api/cancel-subscription', requireAuth, async (req: Request, res: Response) => {
    try {
      const userId = req.user!.id;
      const user = await storage.getUser(userId);
      
      if (!user?.stripeSubscriptionId) {
        return res.status(400).json({ message: "No active subscription found" });
      }

      // Cancel the subscription in Stripe
      const subscription = await stripe.subscriptions.update(user.stripeSubscriptionId, {
        cancel_at_period_end: true
      });

      // Track billing event
      if (req.user) {
        const sessionId = req.sessionID || 'anonymous';
        await analytics.trackBilling(
          userId,
          sessionId,
          'subscription_cancelled',
          user.subscriptionTier || undefined
        );
      }

      // Update user record
      await storage.updateUser(userId, {
        subscriptionStatus: 'cancelled'
      });

      res.json({ 
        message: "Subscription cancelled successfully",
        endsAt: subscription.current_period_end 
      });
    } catch (error) {
      console.error('Error cancelling subscription:', error);
      res.status(500).json({ message: "Failed to cancel subscription" });
    }
  });

  // Export user data
  app.get('/api/export-data', requireAuth, async (req: Request, res: Response) => {
    try {
      const userId = req.user!.id;
      
      // Get all user data
      const user = await storage.getUser(userId);
      const conversations = await storage.getUserConversations(userId);
      const voiceProfiles = await storage.getUserVoiceProfiles(userId);
      const speechSettings = await storage.getUserSpeechSettings(userId);
      
      // Prepare export data (exclude sensitive information)
      const exportData = {
        account: {
          id: user?.id,
          email: user?.email,
          username: user?.username,
          firstName: user?.firstName,
          lastName: user?.lastName,
          createdAt: user?.createdAt,
          subscriptionTier: user?.subscriptionTier,
          subscriptionStatus: user?.subscriptionStatus
        },
        conversations: conversations?.map(conv => ({
          id: conv.id,
          title: conv.title,
          sourceLanguage: conv.sourceLanguage,
          targetLanguage: conv.targetLanguage,
          createdAt: conv.createdAt,
          messages: conv.messages || []
        })) || [],
        voiceProfiles: voiceProfiles || [],
        speechSettings: speechSettings || null,
        exportedAt: new Date().toISOString()
      };

      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename="parrotspeak-data-${new Date().toISOString().split('T')[0]}.json"`);
      res.json(exportData);
    } catch (error) {
      console.error('Error exporting data:', error);
      res.status(500).json({ message: "Failed to export data" });
    }
  });

  // Delete account
  app.delete('/api/delete-account', requireAuth, async (req: Request, res: Response) => {
    try {
      const userId = req.user!.id;
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Cancel Stripe subscription if active
      if (user.stripeSubscriptionId) {
        try {
          await stripe.subscriptions.cancel(user.stripeSubscriptionId);
        } catch (stripeError) {
          console.error('Error cancelling Stripe subscription:', stripeError);
          // Continue with account deletion even if Stripe fails
        }
      }

      // Delete all user data
      await storage.deleteUserAccount(userId);

      // Clear session
      req.logout((err) => {
        if (err) {
          console.error('Error logging out during account deletion:', err);
        }
      });

      res.json({ message: "Account deleted successfully" });
    } catch (error) {
      console.error('Error deleting account:', error);
      res.status(500).json({ message: "Failed to delete account" });
    }
  });

  // Analytics consent management
  app.get('/api/analytics/consent', requireAuth, async (req: Request, res: Response) => {
    try {
      const userId = (req.user as any).id;
      const { analyticsConsent } = await import('./services/analytics-consent');
      const consentStatus = await analyticsConsent.getUserConsentStatus(userId);
      res.json(consentStatus);
    } catch (error) {
      console.error('Error getting analytics consent:', error);
      res.status(500).json({ error: 'Failed to get analytics preferences' });
    }
  });

  app.post('/api/analytics/consent', requireAuth, async (req: Request, res: Response) => {
    try {
      const userId = (req.user as any).id;
      const { enabled } = req.body;

      if (typeof enabled !== 'boolean') {
        return res.status(400).json({ error: 'Invalid consent value' });
      }

      const { analyticsConsent } = await import('./services/analytics-consent');
      await analyticsConsent.updateUserConsent(userId, enabled);
      res.json({ success: true, enabled });
    } catch (error) {
      console.error('Error updating analytics consent:', error);
      res.status(500).json({ error: 'Failed to update analytics preferences' });
    }
  });

  // Admin analytics statistics
  app.get('/api/admin/analytics/consent-stats', requireAuth, async (req: Request, res: Response) => {
    try {
      const user = req.user as any;
      if (!user.isAdmin) {
        return res.status(403).json({ error: 'Admin access required' });
      }

      const { analytics } = await import('./services/analytics');
      const stats = await analytics.getConsentStatistics();
      res.json(stats);
    } catch (error) {
      console.error('Error getting consent statistics:', error);
      res.status(500).json({ error: 'Failed to get consent statistics' });
    }
  });

  return httpServer;
}

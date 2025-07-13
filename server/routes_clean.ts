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


import express, { Express, Request, Response, NextFunction } from "express";
import { createServer, Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import rateLimit from "express-rate-limit";
import slowDown from "express-slow-down";
import helmet from "helmet";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

// ES module equivalent of __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
import { translateText } from "./services/translation";
import { storage } from "./storage";
import { requireAuth, requireSubscription, checkSubscriptionStatus } from "./auth";
import * as mfaService from "./services/mfa";
import { db } from "@db";
import { users, conversations, messages, userFeedback } from "@shared/schema";
import { InternalAnalyticsService } from "./services/internal-analytics";
import { eq } from "drizzle-orm";
import passport from "passport";
import iapRoutes from "./routes/iap";

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
  delayMs: () => 500, // new v2 syntax for consistent delay
  validate: { delayMs: false } // disable warning
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Security middleware
  app.use(generalLimiter);
  app.use(slowDownMiddleware);

  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'", "https://cdn.mixpanel.com"],
        styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
        fontSrc: ["'self'", "https://fonts.gstatic.com"],
        imgSrc: ["'self'", "data:", "blob:", "https:"],
        connectSrc: ["'self'", "ws:", "wss:", "https://api.mixpanel.com", "https://api.openai.com"],
        frameSrc: ["'self'"],
        objectSrc: ["'none'"],
        upgradeInsecureRequests: [],
      },
    },
    crossOriginEmbedderPolicy: false,
  }));

  // Health check endpoint for network testing
  app.get('/api/health', (req: Request, res: Response) => {
    res.json({ 
      status: 'ok', 
      timestamp: new Date().toISOString(),
      server: 'ParrotSpeak API',
      version: '1.0.0'
    });
  });

  // Static files and uploads
  app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

  // Root route - always redirect to mobile preview
  app.get('/', (req: Request, res: Response, next: NextFunction) => {
    // Always redirect to mobile app preview unless explicitly requesting webapp
    if (req.query.webapp === 'true') {
      next();
      return;
    }
    return res.redirect('/mobile-app-preview');
  });

  // Handle webapp routes specifically for iframe content  
  app.get('/webapp*', (req: Request, res: Response, next: NextFunction) => {
    // Rewrite the URL to serve React app for iframe content
    req.url = req.url.replace('/webapp', '');
    if (req.url === '') req.url = '/';
    next();
  });

  // Mobile preview routes
  app.get('/mobile-preview', (req: Request, res: Response) => {
    const emulatorPath = path.join(process.cwd(), 'mobile-phone-emulator.html');
    if (fs.existsSync(emulatorPath)) {
      return res.sendFile(emulatorPath);
    }
    res.status(404).send('Mobile emulator not found');
  });

  app.get('/mobile-app-preview', (req: Request, res: Response) => {
    const emulatorPath = path.join(process.cwd(), 'mobile-phone-emulator.html');
    console.log(`[Routes] Looking for mobile emulator at: ${emulatorPath}`);
    console.log(`[Routes] File exists: ${fs.existsSync(emulatorPath)}`);
    
    if (fs.existsSync(emulatorPath)) {
      return res.sendFile(emulatorPath);
    }
    res.status(404).send('Mobile emulator not found');
  });

  // Test page for playback controls
  app.get('/test-playback-controls', (req: Request, res: Response) => {
    const testPath = path.join(process.cwd(), 'test-playback-controls.html');
    if (fs.existsSync(testPath)) {
      return res.sendFile(testPath);
    }
    res.status(404).send('Test page not found');
  });

  // Test script for playback controls
  app.get('/verify-playback-test.js', (req: Request, res: Response) => {
    const scriptPath = path.join(process.cwd(), 'verify-playback-test.js');
    if (fs.existsSync(scriptPath)) {
      res.setHeader('Content-Type', 'application/javascript');
      return res.sendFile(scriptPath);
    }
    res.status(404).send('Test script not found');
  });

  // API Routes
  app.get('/api/conversations', async (req: Request, res: Response) => {
    try {
      const userId = req.user?.id;
      
      // For authenticated users, check subscription status
      if (userId) {
        const { hasSubscription } = await checkSubscriptionStatus(userId);
        if (!hasSubscription) {
          // Return empty array for expired/inactive users to hide conversation history
          return res.json([]);
        }
      }
      
      const conversations = await storage.getConversations(userId);
      res.json(conversations);
    } catch (error) {
      console.error('Get conversations error:', error);
      res.status(500).json({ message: 'Failed to retrieve conversations' });
    }
  });

  app.post('/api/conversations', requireAuth, requireSubscription, async (req: Request, res: Response) => {
    try {
      const { sourceLanguage, targetLanguage, title } = req.body;
      const userId = req.user?.id;
      
      const conversation = await storage.createConversation(
        sourceLanguage,
        targetLanguage,
        title,
        userId
      );
      
      // Track conversation start for internal analytics (non-blocking)
      InternalAnalyticsService.startConversationTracking(conversation.id, userId)
        .catch(err => console.error('Analytics tracking failed:', err));
      
      res.status(201).json(conversation);
    } catch (error) {
      console.error('Create conversation error:', error);
      res.status(500).json({ message: 'Failed to create conversation' });
    }
  });

  app.get('/api/conversations/:id', async (req: Request, res: Response) => {
    try {
      const conversation = await storage.getConversation(req.params.id);
      if (!conversation) {
        return res.status(404).json({ message: 'Conversation not found' });
      }
      res.json(conversation);
    } catch (error) {
      console.error('Get conversation error:', error);
      res.status(500).json({ message: 'Failed to retrieve conversation' });
    }
  });

  app.post('/api/conversations/:id/messages', requireAuth, requireSubscription, async (req: Request, res: Response) => {
    try {
      // Validate request body
      if (!req.body || typeof req.body !== 'object') {
        return res.status(400).json({ message: 'Invalid request body. Expected JSON object.' });
      }

      const { text, sourceLanguage, targetLanguage } = req.body;
      
      if (!text || !sourceLanguage || !targetLanguage) {
        return res.status(400).json({ 
          message: 'Missing required fields: text, sourceLanguage, targetLanguage' 
        });
      }

      const conversationId = req.params.id;
      const userId = req.user?.id;
      const startTime = Date.now();

      // Save the original message
      const messageId = await storage.saveMessage(
        conversationId,
        text,
        true,
        sourceLanguage,
        targetLanguage,
        userId
      );

      // Track user message for analytics (non-blocking)
      InternalAnalyticsService.updateConversationMetrics(conversationId, {
        isUser: true
      }).catch(err => console.error('Analytics tracking failed:', err));

      // Perform translation
      const translationResult = await translateText(text, sourceLanguage, targetLanguage);
      const translationTime = Date.now() - startTime;
      
      // Track translation for analytics (non-blocking)
      InternalAnalyticsService.updateConversationMetrics(conversationId, {
        isUser: false,
        translationTime,
        failed: false
      }).catch(err => console.error('Analytics tracking failed:', err));
      
      res.status(201).json({
        id: messageId,
        originalText: text,
        translation: translationResult.translation
      });
    } catch (err) {
      console.error('Add message error:', err);
      
      let errorMessage = 'Failed to process translation';
      
      if (err instanceof Error) {
        if (err.message.includes('quota exceeded') || err.message.includes('insufficient_quota')) {
          errorMessage = 'OpenAI API quota exceeded. Please update your API key or check your usage limits.';
        }
        else if (err.message.includes('connect') || err.message.includes('network')) {
          errorMessage = 'Cannot connect to the translation service. Please check your internet connection.';
        }
        else if (err.message.includes('API key')) {
          errorMessage = 'Invalid or missing OpenAI API key. Please check your API configuration.';
        }
      }
      
      // Track failed translation for analytics
      const conversationId = req.params.id;
      await InternalAnalyticsService.updateConversationMetrics(conversationId, {
        isUser: false,
        failed: true
      });
      
      res.status(500).json({ message: errorMessage });
    }
  });

  app.delete('/api/conversations/:id', async (req: Request, res: Response) => {
    try {
      await storage.deleteConversation(req.params.id);
      res.status(204).send();
    } catch (error) {
      console.error('Delete conversation error:', error);
      res.status(500).json({ message: 'Failed to delete conversation' });
    }
  });

  // Voice profiles routes
  app.get('/api/voice-profiles', async (req: Request, res: Response) => {
    try {
      const userId = req.user?.id;
      const profiles = await storage.getVoiceProfiles(userId);
      res.json(profiles);
    } catch (error) {
      console.error('Get voice profiles error:', error);
      res.status(500).json({ message: 'Failed to retrieve voice profiles' });
    }
  });

  // Speech settings routes
  app.get('/api/speech-settings', async (req: Request, res: Response) => {
    try {
      const userId = req.user?.id;
      const settings = await storage.getSpeechSettings(userId);
      res.json(settings);
    } catch (error) {
      console.error('Get speech settings error:', error);
      res.status(500).json({ message: 'Failed to retrieve speech settings' });
    }
  });

  app.patch('/api/speech-settings', requireAuth, async (req: Request, res: Response) => {
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

  // IAP routes
  app.use('/api/iap', iapRoutes);

  // Languages endpoint with comprehensive support
  app.get('/api/languages', async (req: Request, res: Response) => {
    try {
      // Import language configuration using ES modules
      const { LANGUAGE_CONFIGURATIONS } = await import('../constants/languageConfiguration.js');
      
      const includeAll = req.query.includeAll === 'true';
      const speechOnly = req.query.speechOnly === 'true';
      
      let languages = [...LANGUAGE_CONFIGURATIONS];
      
      // Filter by speech support if requested
      if (speechOnly) {
        languages = languages.filter((lang: any) => lang.speechSupported);
      }
      
      // Sort by popularity (most popular first)
      languages = languages.sort((a: any, b: any) => b.popularity - a.popularity);
      
      const withSpeechSupport = LANGUAGE_CONFIGURATIONS.filter((lang: any) => lang.speechSupported).length;
      const withoutSpeechSupport = LANGUAGE_CONFIGURATIONS.filter((lang: any) => !lang.speechSupported).length;
      
      console.log(`✅ Languages API: ${languages.length} languages loaded (${withSpeechSupport} with speech, ${withoutSpeechSupport} without speech)`);
      
      res.json({
        languages,
        meta: {
          total: LANGUAGE_CONFIGURATIONS.length,
          withSpeechSupport,
          withoutSpeechSupport,
          filtered: languages.length,
          fallback: false
        }
      });
    } catch (error) {
      console.error('Error loading language configurations:', error);
      
      // Fallback to basic language list if configuration fails
      const basicLanguages = [
        { code: 'en', name: 'English', nativeName: 'English', country: 'United States', flag: 'https://flagcdn.com/us.svg', speechSupported: true, speechToTextSupported: true, textToSpeechSupported: true, translationQuality: 'high', popularity: 10 },
        { code: 'es', name: 'Spanish', nativeName: 'Español', country: 'Spain', flag: 'https://flagcdn.com/es.svg', speechSupported: true, speechToTextSupported: true, textToSpeechSupported: true, translationQuality: 'high', popularity: 9 },
        { code: 'fr', name: 'French', nativeName: 'Français', country: 'France', flag: 'https://flagcdn.com/fr.svg', speechSupported: true, speechToTextSupported: true, textToSpeechSupported: true, translationQuality: 'high', popularity: 8 },
        { code: 'de', name: 'German', nativeName: 'Deutsch', country: 'Germany', flag: 'https://flagcdn.com/de.svg', speechSupported: true, speechToTextSupported: true, textToSpeechSupported: true, translationQuality: 'high', popularity: 7 },
        { code: 'it', name: 'Italian', nativeName: 'Italiano', country: 'Italy', flag: 'https://flagcdn.com/it.svg', speechSupported: true, speechToTextSupported: true, textToSpeechSupported: true, translationQuality: 'high', popularity: 6 },
        { code: 'pt', name: 'Portuguese', nativeName: 'Português', country: 'Brazil', flag: 'https://flagcdn.com/br.svg', speechSupported: true, speechToTextSupported: true, textToSpeechSupported: true, translationQuality: 'high', popularity: 6 },
        { code: 'ja', name: 'Japanese', nativeName: '日本語', country: 'Japan', flag: 'https://flagcdn.com/jp.svg', speechSupported: true, speechToTextSupported: true, textToSpeechSupported: true, translationQuality: 'high', popularity: 8 },
        { code: 'ko', name: 'Korean', nativeName: '한국어', country: 'South Korea', flag: 'https://flagcdn.com/kr.svg', speechSupported: true, speechToTextSupported: true, textToSpeechSupported: true, translationQuality: 'high', popularity: 7 },
        { code: 'zh', name: 'Chinese', nativeName: '中文', country: 'China', flag: 'https://flagcdn.com/cn.svg', speechSupported: true, speechToTextSupported: true, textToSpeechSupported: true, translationQuality: 'high', popularity: 9 },
        { code: 'ru', name: 'Russian', nativeName: 'Русский', country: 'Russia', flag: 'https://flagcdn.com/ru.svg', speechSupported: true, speechToTextSupported: true, textToSpeechSupported: true, translationQuality: 'high', popularity: 7 },
        { code: 'ar', name: 'Arabic', nativeName: 'العربية', country: 'Saudi Arabia', flag: 'https://flagcdn.com/sa.svg', speechSupported: true, speechToTextSupported: true, textToSpeechSupported: true, translationQuality: 'high', popularity: 8 },
        { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी', country: 'India', flag: 'https://flagcdn.com/in.svg', speechSupported: true, speechToTextSupported: true, textToSpeechSupported: true, translationQuality: 'high', popularity: 8 },
        { code: 'nl', name: 'Dutch', nativeName: 'Nederlands', country: 'Netherlands', flag: 'https://flagcdn.com/nl.svg', speechSupported: true, speechToTextSupported: true, textToSpeechSupported: true, translationQuality: 'medium', popularity: 5 },
        { code: 'pl', name: 'Polish', nativeName: 'Polski', country: 'Poland', flag: 'https://flagcdn.com/pl.svg', speechSupported: true, speechToTextSupported: true, textToSpeechSupported: true, translationQuality: 'medium', popularity: 5 },
        { code: 'tr', name: 'Turkish', nativeName: 'Türkçe', country: 'Turkey', flag: 'https://flagcdn.com/tr.svg', speechSupported: true, speechToTextSupported: true, textToSpeechSupported: true, translationQuality: 'medium', popularity: 5 }
      ];
      
      res.json({
        languages: basicLanguages,
        meta: {
          total: basicLanguages.length,
          withSpeechSupport: basicLanguages.length,
          withoutSpeechSupport: 0,
          filtered: basicLanguages.length,
          fallback: true
        }
      });
    }
  });

  // Authentication routes
  app.post('/api/auth/login', (req: Request, res: Response, next: NextFunction) => {
    passport.authenticate('local', (err: any, user: any, info: any) => {
      if (err) {
        return res.status(500).json({ message: 'Authentication error' });
      }
      if (!user) {
        return res.status(401).json({ message: info?.message || 'Invalid credentials' });
      }
      
      req.logIn(user, (err) => {
        if (err) {
          return res.status(500).json({ message: 'Login failed' });
        }
        res.json({ 
          user: { 
            id: user.id, 
            email: user.email, 
            firstName: user.firstName,
            lastName: user.lastName,
            subscriptionStatus: user.subscriptionStatus,
            subscriptionTier: user.subscriptionTier,
            subscriptionExpiresAt: user.subscriptionExpiresAt,
            profileImageUrl: user.profileImageUrl,
            emailVerified: user.emailVerified
          }
        });
      });
    })(req, res, next);
  });

  app.post('/api/auth/register', async (req: Request, res: Response) => {
    try {
      const { email, password, firstName, lastName } = req.body;
      
      // Validate password according to NIST guidelines
      const { validatePassword } = await import('@shared/password-validation');
      const passwordValidation = validatePassword(password);
      
      if (!passwordValidation.isValid) {
        return res.status(400).json({ 
          message: 'Invalid password', 
          errors: passwordValidation.errors 
        });
      }
      
      // Check if user already exists by email
      const existingUserByEmail = await db.query.users.findFirst({
        where: eq(users.email, email)
      });
      
      if (existingUserByEmail) {
        return res.status(400).json({ message: 'An account with this email already exists' });
      }


      
      // Hash password and create user
      const bcrypt = await import('bcryptjs');
      const hashedPassword = await bcrypt.hash(password, 12);
      
      const [newUser] = await db.insert(users).values({
        email,
        password: hashedPassword,
        firstName,
        lastName,
        emailVerified: false,
        createdAt: new Date(),
        updatedAt: new Date()
      }).returning();
      
      // Log the user in (remove password for security)
      const { password: _, ...sessionUser } = newUser;
      req.logIn(sessionUser as Express.User, (err) => {
        if (err) {
          return res.status(500).json({ message: 'Registration successful but login failed' });
        }
        res.status(201).json({ 
          user: { 
            id: newUser.id, 
            email: newUser.email, 
            firstName: newUser.firstName,
            lastName: newUser.lastName
          } 
        });
      });
      
    } catch (error: any) {
      console.error('Registration error:', error);
      
      // Handle specific database constraint violations
      if (error.code === '23505') {
        if (error.constraint === 'users_email_unique') {
          return res.status(400).json({ message: 'An account with this email already exists' });
        }

      }
      
      res.status(500).json({ message: 'Registration failed. Please try again.' });
    }
  });

  app.post('/api/auth/logout', (req: Request, res: Response, next: NextFunction) => {
    req.logout((err) => {
      if (err) {
        return next(err);
      }
      res.json({ message: 'Logged out successfully' });
    });
  });

  // OAuth mobile endpoints
  app.post("/api/auth/google/mobile", async (req: Request, res: Response) => {
    try {
      const { idToken, user } = req.body;
      
      if (!idToken || !user) {
        return res.status(400).json({ error: 'Missing required OAuth data' });
      }

      // TODO: Verify Google ID token with Google's servers
      // For now, create/update user with Google data
      const userData = {
        id: user.id,
        email: user.email,
        firstName: user.givenName || user.name?.split(' ')[0] || '',
        lastName: user.familyName || user.name?.split(' ').slice(1).join(' ') || '',
        subscriptionStatus: 'free', // Default for new users
        oauthProvider: 'google',
        oauthId: user.id
      };

      // For demo purposes, return success with user data
      res.json({ 
        success: true, 
        user: userData,
        message: 'Google authentication successful' 
      });
    } catch (error) {
      console.error('Google OAuth error:', error);
      res.status(500).json({ error: 'Google authentication failed' });
    }
  });

  app.post("/api/auth/apple/mobile", async (req: Request, res: Response) => {
    try {
      const { identityToken, user, email, fullName } = req.body;
      
      if (!identityToken) {
        return res.status(400).json({ error: 'Missing Apple identity token' });
      }

      // TODO: Verify Apple identity token with Apple's servers
      // For now, create/update user with Apple data
      const userData = {
        id: user || `apple_${Date.now()}`, // Apple doesn't always provide user ID
        email: email || 'private@privaterelay.appleid.com',
        firstName: fullName?.givenName || '',
        lastName: fullName?.familyName || '',
        subscriptionStatus: 'free', // Default for new users
        oauthProvider: 'apple',
        oauthId: user || identityToken
      };

      // For demo purposes, return success with user data
      res.json({ 
        success: true, 
        user: userData,
        message: 'Apple authentication successful' 
      });
    } catch (error) {
      console.error('Apple OAuth error:', error);
      res.status(500).json({ error: 'Apple authentication failed' });
    }
  });

  // Password reset endpoints
  app.post("/api/auth/request-reset", async (req: Request, res: Response) => {
    try {
      const { email } = req.body;
      
      if (!email) {
        return res.status(400).json({ error: 'Email is required' });
      }

      // TODO: Send actual password reset email via SendGrid
      // For demo purposes, just return success
      console.log(`Password reset requested for: ${email}`);
      
      res.json({ 
        success: true, 
        message: 'Password reset email sent if account exists' 
      });
    } catch (error) {
      console.error('Password reset request error:', error);
      res.status(500).json({ error: 'Failed to process password reset request' });
    }
  });

  app.post("/api/auth/reset-password", async (req: Request, res: Response) => {
    try {
      const { token, newPassword } = req.body;
      
      if (!token || !newPassword) {
        return res.status(400).json({ error: 'Token and new password are required' });
      }

      // TODO: Verify reset token and update password in database
      // For demo purposes, just return success
      console.log(`Password reset completed with token: ${token}`);
      
      res.json({ 
        success: true, 
        message: 'Password reset successful' 
      });
    } catch (error) {
      console.error('Password reset error:', error);
      res.status(500).json({ error: 'Failed to reset password' });
    }
  });

  app.get('/api/auth/user', (req: Request, res: Response) => {
    if (req.user) {
      res.json({ 
        user: { 
          id: req.user.id, 
          email: req.user.email, 
          firstName: req.user.firstName,
          lastName: req.user.lastName,
          subscriptionStatus: req.user.subscriptionStatus,
          subscriptionTier: req.user.subscriptionTier,
          subscriptionExpiresAt: req.user.subscriptionExpiresAt,
          profileImageUrl: req.user.profileImageUrl,
          emailVerified: req.user.emailVerified
        } 
      });
    } else {
      res.status(401).json({ message: 'Not authenticated' });
    }
  });

  app.patch('/api/auth/user', requireAuth, async (req: Request, res: Response) => {
    try {
      const userId = req.user!.id;
      const { firstName, lastName, email } = req.body;

      // Use correct field names for database
      const updateData: any = {};
      if (firstName !== undefined) updateData.firstName = firstName;
      if (lastName !== undefined) updateData.lastName = lastName;
      if (email !== undefined) updateData.email = email;

      updateData.updatedAt = new Date();

      const [updatedUser] = await db
        .update(users)
        .set(updateData)
        .where(eq(users.id, userId))
        .returning();

      if (!updatedUser) {
        return res.status(404).json({ error: 'User not found' });
      }

      res.json({ user: updatedUser });
    } catch (error) {
      console.error('Error updating user profile:', error);
      res.status(500).json({ error: 'Failed to update profile' });
    }
  });

  // Change password endpoint
  app.post('/api/auth/change-password', requireAuth, async (req: Request, res: Response) => {
    try {
      const userId = req.user!.id;
      const { currentPassword, newPassword } = req.body;

      if (!currentPassword || !newPassword) {
        return res.status(400).json({ error: 'Current password and new password are required' });
      }

      // Validate new password according to NIST guidelines
      const { validatePassword } = await import('@shared/password-validation');
      const passwordValidation = validatePassword(newPassword);
      
      if (!passwordValidation.isValid) {
        return res.status(400).json({ 
          error: 'Invalid password', 
          details: passwordValidation.errors 
        });
      }

      // Get current user from database
      const currentUser = await db.query.users.findFirst({
        where: eq(users.id, userId)
      });

      if (!currentUser || !currentUser.password) {
        return res.status(404).json({ error: 'User not found' });
      }

      // Verify current password
      const bcrypt = await import('bcryptjs');
      const isCurrentPasswordValid = await bcrypt.compare(currentPassword, currentUser.password);

      if (!isCurrentPasswordValid) {
        return res.status(400).json({ error: 'Current password is incorrect' });
      }

      // Hash new password
      const hashedNewPassword = await bcrypt.hash(newPassword, 12);

      // Update password in database
      await db
        .update(users)
        .set({ 
          password: hashedNewPassword,
          updatedAt: new Date()
        })
        .where(eq(users.id, userId));

      res.json({ message: 'Password changed successfully' });
    } catch (error) {
      console.error('Error changing password:', error);
      res.status(500).json({ error: 'Failed to change password' });
    }
  });

  // Analytics consent management
  app.get('/api/analytics/consent', requireAuth, async (req: Request, res: Response) => {
    try {
      const userId = req.user!.id;
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
      const userId = req.user!.id;
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

  // Speech-to-text transcription endpoint
  app.post('/api/transcribe', requireAuth, requireSubscription, async (req: Request, res: Response) => {
    try {
      const { audio, language } = req.body;
      
      if (!audio) {
        return res.status(400).json({ message: 'Audio data is required' });
      }
      
      // Import OpenAI service
      const { transcribeAudio } = await import('./services/openai');
      
      // Convert Base64 audio data to buffer
      const audioBuffer = Buffer.from(audio, 'base64');
      
      // Transcribe the audio using OpenAI Whisper
      const transcription = await transcribeAudio(audioBuffer, language);
      
      console.log('Transcription successful:', transcription);
      
      // Return the transcribed text
      res.json({ text: transcription });
      
    } catch (error) {
      console.error('Speech recognition error:', error);
      
      // Format a more user-friendly error message
      let errorMessage = 'Speech recognition failed';
      
      if (error instanceof Error) {
        // Check for quota errors
        if (error.message.includes('quota exceeded') || error.message.includes('insufficient_quota')) {
          errorMessage = 'OpenAI API quota exceeded. Please update your API key or check your usage limits.';
        }
        // Network errors
        else if (error.message.includes('connect') || error.message.includes('network')) {
          errorMessage = 'Cannot connect to the speech recognition service. Please check your internet connection.';
        }
        // API key errors
        else if (error.message.includes('API key') || error.message.includes('Unauthorized')) {
          errorMessage = 'Invalid or missing OpenAI API key. Please check your API configuration.';
        }
        // Any other specific errors
        else if (error.message.includes('audio')) {
          errorMessage = 'Invalid audio format. Please try recording again.';
        }
      }
      
      res.status(500).json({ message: errorMessage });
    }
  });

  // Text translation endpoint
  app.post('/api/translate', requireAuth, requireSubscription, async (req: Request, res: Response) => {
    try {
      const { text, sourceLanguage, targetLanguage } = req.body;
      
      if (!text || !sourceLanguage || !targetLanguage) {
        return res.status(400).json({ 
          message: 'Text, source language, and target language are required' 
        });
      }
      
      // Import translation service
      const { translateText } = await import('./services/translation');
      
      // Translate the text using OpenAI GPT-4
      const translationResult = await translateText(text, sourceLanguage, targetLanguage);
      
      console.log('Translation successful:', translationResult.translation.substring(0, 50) + '...');
      
      // Return the translation in expected format
      res.json({
        translation: translationResult.translation,
        originalText: translationResult.originalText
      });
      
    } catch (error) {
      console.error('Translation error:', error);
      
      // Format user-friendly error message
      let errorMessage = 'Translation failed';
      
      if (error instanceof Error) {
        // Check for quota errors
        if (error.message.includes('quota exceeded') || error.message.includes('insufficient_quota')) {
          errorMessage = 'OpenAI API quota exceeded. Please update your API key or check your usage limits.';
        }
        // Network errors
        else if (error.message.includes('connect') || error.message.includes('network')) {
          errorMessage = 'Cannot connect to the translation service. Please check your internet connection.';
        }
        // API key errors
        else if (error.message.includes('API key') || error.message.includes('Unauthorized')) {
          errorMessage = 'Invalid or missing OpenAI API key. Please check your API configuration.';
        }
      }
      
      res.status(500).json({ message: errorMessage });
    }
  });

  // BACKUP CODES ROUTE
  app.post('/api/backup-codes-generate', requireAuth, async (req: Request, res: Response) => {
    try {
      const user = req.user;
      if (!user) {
        return res.status(401).json({ message: 'Authentication required' });
      }

      const backupCodes = await mfaService.regenerateBackupCodes(user.id);
      res.json({ backupCodes });

    } catch (error) {
      console.error('Error in backup codes route:', error);
      res.status(500).json({ message: 'Failed to regenerate backup codes' });
    }
  });

  // Analytics endpoints
  app.get('/api/analytics/usage', requireAuth, async (req: Request, res: Response) => {
    try {
      const { startDate, endDate } = req.query;
      const userId = req.user!.id;
      
      if (!startDate || !endDate) {
        return res.status(400).json({ message: 'Start date and end date are required' });
      }

      // Get user's conversations first  
      const userConversations = await db.query.conversations.findMany({
        where: eq(conversations.userId, userId)
      });

      if (userConversations.length === 0) {
        return res.json({
          totalTranslations: 0,
          totalMessages: 0,
          dailyAverage: 0
        });
      }

      // Get messages from those conversations within date range
      const conversationIds = userConversations.map(c => c.id);
      const userMessages = await db.query.messages.findMany({
        where: (messages, { and, gte, lte, inArray }) => and(
          inArray(messages.conversationId, conversationIds),
          gte(messages.createdAt, startDate as string),
          lte(messages.createdAt, endDate as string)
        )
      });

      const totalMessages = userMessages.length;
      const totalTranslations = userMessages.filter(m => !m.isUser).length;
      
      res.json({
        totalTranslations,
        totalMessages,
        dailyAverage: Math.round((totalTranslations / 30) * 10) / 10
      });
    } catch (error) {
      console.error('Analytics usage error:', error);
      res.status(500).json({ message: 'Failed to get usage statistics' });
    }
  });

  app.get('/api/analytics/translation-quality', requireAuth, async (req: Request, res: Response) => {
    try {
      const userId = req.user!.id;
      
      // Get user's conversations and messages
      const userConversations = await db.query.conversations.findMany({
        where: eq(conversations.userId, userId),
        with: {
          messages: true
        }
      });

      const totalTranslations = userConversations.reduce((sum, conv) => 
        sum + conv.messages.filter(m => !m.isUser).length, 0
      );

      // Return simple usage metrics without subjective quality ratings
      res.json({
        totalTranslations,
        hasData: totalTranslations > 0
      });
    } catch (error) {
      console.error('Analytics quality error:', error);
      res.status(500).json({ message: 'Failed to get quality statistics' });
    }
  });

  app.get('/api/analytics/top-languages', requireAuth, async (req: Request, res: Response) => {
    try {
      const userId = req.user!.id;
      const limit = parseInt(req.query.limit as string) || 5;
      
      // Get user's conversations
      const userConversations = await db.query.conversations.findMany({
        where: eq(conversations.userId, userId)
      });

      if (userConversations.length === 0) {
        return res.json([]);
      }

      // Get messages from those conversations
      const conversationIds = userConversations.map(c => c.id);
      const userMessages = await db.query.messages.findMany({
        where: (messages, { inArray }) => inArray(messages.conversationId, conversationIds)
      });

      const languagePairs: Record<string, number> = {};
      
      userMessages.forEach(msg => {
        const pair = `${msg.sourceLanguage} → ${msg.targetLanguage}`;
        languagePairs[pair] = (languagePairs[pair] || 0) + 1;
      });

      const topPairs = Object.entries(languagePairs)
        .sort((a, b) => b[1] - a[1])
        .slice(0, limit)
        .map(([pair, count]) => ({ languagePair: pair, count }));

      res.json(topPairs);
    } catch (error) {
      console.error('Analytics languages error:', error);
      res.status(500).json({ message: 'Failed to get language statistics' });
    }
  });

  /* MVP LAUNCH: Visual translation endpoint commented out for initial release
   * TODO: Re-enable when camera functionality is implemented
   * Last modified: August 1, 2025 - Disabled for MVP launch
   * 
  // Visual translation endpoint for camera/image translation
  app.post('/api/visual-translate', requireAuth, requireSubscription, async (req: Request, res: Response) => {
    try {
      const { imageBase64, sourceLanguage, targetLanguage } = req.body;
      
      if (!imageBase64 || !sourceLanguage || !targetLanguage) {
        return res.status(400).json({ message: 'Image, source language, and target language are required' });
      }
      
      // Import visual translation service
      const { analyzeImageAndTranslate } = await import('./services/visual-translation');
      
      // Process the image and translate
      const result = await analyzeImageAndTranslate(imageBase64, sourceLanguage, targetLanguage);
      
      res.json({
        extractedText: result.extractedText,
        translation: result.translation
      });
      
    } catch (error) {
      console.error('Visual translation error:', error);
      res.status(500).json({ 
        message: error instanceof Error ? error.message : 'Visual translation failed' 
      });
    }
  }
  */

  // Feedback submission endpoint
  app.post('/api/feedback', requireAuth, async (req: Request, res: Response) => {
    try {
      const { feedback, category, email } = req.body;
      const userId = req.user!.id;
      
      if (!feedback || !category) {
        return res.status(400).json({ message: 'Feedback and category are required' });
      }

      // Import email service
      const { sendFeedbackEmail } = await import('./services/emailService');
      
      // Store feedback in database
      const [submittedFeedback] = await db.insert(userFeedback).values({
        userId,
        feedback,
        category,
        email,
        status: 'new'
      }).returning();

      // Get user info for email
      const user = await db.query.users.findFirst({
        where: eq(users.id, userId)
      });

      // Send email notification
      try {
        await sendFeedbackEmail(
          feedback,
          category,
          email || user?.email,
          user?.firstName || user?.email
        );
        console.log('Feedback email sent successfully');
      } catch (emailError) {
        console.error('Failed to send feedback email:', emailError);
        // Don't fail the request if email fails
      }

      res.json({ 
        success: true, 
        message: 'Thank you for your feedback!',
        id: submittedFeedback.id 
      });
    } catch (error) {
      console.error('Feedback submission error:', error);
      res.status(500).json({ message: 'Failed to submit feedback' });
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
        console.log('WebSocket message received:', data);
        
        if (data.type === 'translate') {
          const { conversationId, text, sourceLanguage, targetLanguage, userId } = data;
          console.log('Translation request:', { conversationId, text, sourceLanguage, targetLanguage, userId });
          
          try {
            // 🔒 CRITICAL: Check subscription status before allowing translation
            const subscriptionCheck = await checkSubscriptionStatus(userId);
            if (!subscriptionCheck.hasSubscription) {
              console.log(`Translation blocked for user ${userId}: ${subscriptionCheck.error}`);
              ws.send(JSON.stringify({
                type: 'subscription_required',
                error: subscriptionCheck.error || 'Active subscription required',
                message: 'Please upgrade to a premium plan to use translation features'
              }));
              return;
            }
            
            // Save the original message
            const messageId = await storage.saveMessage(
              conversationId,
              text,
              true,
              sourceLanguage,
              targetLanguage,
              userId
            );
            
            console.log('Original message saved:', messageId);
            
            // Perform translation
            console.log('Starting translation...');
            const translationResult = await translateText(text, sourceLanguage, targetLanguage);
            console.log('Translation completed:', translationResult);
            
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
              type: 'translation',
              messageId,
              translatedMessageId,
              translation: translationResult.translation,
              originalText: text,
              conversationId,
              responseTime: Date.now()
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
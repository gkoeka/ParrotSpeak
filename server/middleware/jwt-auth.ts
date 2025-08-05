import { Request, Response, NextFunction } from 'express';
import { verifyToken, extractToken } from '../utils/jwt';
import { getUserById } from '../services/auth';

// Extend Express Request to include JWT user
declare global {
  namespace Express {
    interface Request {
      jwtUser?: any;
    }
  }
}

export async function jwtAuthMiddleware(req: Request, res: Response, next: NextFunction) {
  try {
    // Check for Authorization header
    const token = extractToken(req.headers.authorization);
    
    if (!token) {
      // No JWT token, continue with session auth
      return next();
    }
    
    // Verify JWT token
    const payload = verifyToken(token);
    
    if (!payload) {
      // Invalid token, continue with session auth
      return next();
    }
    
    // Get user from database
    const user = await getUserById(payload.userId);
    
    if (!user) {
      // User not found, continue with session auth
      return next();
    }
    
    // Remove password for security
    const { password: _, ...userWithoutPassword } = user;
    
    // Set user on request for JWT auth
    req.jwtUser = userWithoutPassword;
    
    // If no session user exists, set JWT user as session user
    if (!req.user) {
      req.user = userWithoutPassword as Express.User;
    }
    
    next();
  } catch (error) {
    console.error('JWT auth middleware error:', error);
    // Continue without JWT auth on error
    next();
  }
}
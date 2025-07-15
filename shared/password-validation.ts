/**
 * NIST SP 800-63B Compliant Password Validation
 * 
 * NIST Guidelines:
 * - Minimum 8 characters, maximum 64 characters
 * - No composition rules (no requirements for uppercase, lowercase, numbers, special chars)
 * - No password hints
 * - Check against known breached passwords (future enhancement)
 * - Rate limiting on authentication attempts (handled elsewhere)
 */

export interface PasswordValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * Validates password according to NIST SP 800-63B guidelines
 */
export function validatePassword(password: string): PasswordValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Check minimum length (NIST: 8 characters)
  if (password.length < 8) {
    errors.push('Password must be at least 8 characters long');
  }

  // Check maximum length (NIST: 64 characters)
  if (password.length > 64) {
    errors.push('Password must be no more than 64 characters long');
  }

  // Check for common weak passwords
  const commonWeakPasswords = [
    'password',
    'password123',
    '123456789',
    'qwerty',
    'abc123',
    'letmein',
    'welcome',
    'admin',
    'login',
    'guest',
    'test',
    'user',
    'root',
    'default'
  ];

  if (commonWeakPasswords.includes(password.toLowerCase())) {
    errors.push('Password is too common and easily guessed');
  }

  // Check for sequential or repeated characters
  if (/(.)\1{2,}/.test(password)) {
    warnings.push('Avoid using repeated characters (e.g., "aaa" or "111")');
  }

  // Check for keyboard patterns
  const keyboardPatterns = [
    'qwerty', 'asdf', 'zxcv', 'qwertyui', 'asdfgh', 'zxcvbn',
    '1234', '2345', '3456', '4567', '5678', '6789', '7890',
    '123456', '234567', '345678', '456789', '567890'
  ];

  const lowerPassword = password.toLowerCase();
  for (const pattern of keyboardPatterns) {
    if (lowerPassword.includes(pattern)) {
      warnings.push('Avoid using keyboard patterns');
      break;
    }
  }

  // Strength recommendations (not requirements per NIST)
  if (password.length >= 12) {
    // Good length
  } else if (password.length >= 8) {
    warnings.push('Consider using a longer password for better security');
  }

  // Check for variety in character types (informational, not required)
  const hasLowercase = /[a-z]/.test(password);
  const hasUppercase = /[A-Z]/.test(password);
  const hasNumbers = /\d/.test(password);
  const hasSpecialChars = /[!@#$%^&*(),.?":{}|<>]/.test(password);

  const characterTypes = [hasLowercase, hasUppercase, hasNumbers, hasSpecialChars].filter(Boolean).length;
  
  if (characterTypes < 2) {
    warnings.push('Consider using a mix of different character types for better security');
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}

/**
 * Get password strength level (for UI feedback)
 */
export function getPasswordStrength(password: string): 'weak' | 'fair' | 'good' | 'strong' {
  const validation = validatePassword(password);
  
  if (!validation.isValid) {
    return 'weak';
  }

  let score = 0;
  
  // Length scoring
  if (password.length >= 8) score += 1;
  if (password.length >= 12) score += 1;
  if (password.length >= 16) score += 1;
  
  // Character variety scoring
  const hasLowercase = /[a-z]/.test(password);
  const hasUppercase = /[A-Z]/.test(password);
  const hasNumbers = /\d/.test(password);
  const hasSpecialChars = /[!@#$%^&*(),.?":{}|<>]/.test(password);
  
  if (hasLowercase) score += 1;
  if (hasUppercase) score += 1;
  if (hasNumbers) score += 1;
  if (hasSpecialChars) score += 1;
  
  // Avoid patterns
  if (!/(.)\1{2,}/.test(password)) score += 1;
  
  if (score >= 7) return 'strong';
  if (score >= 5) return 'good';
  if (score >= 3) return 'fair';
  return 'weak';
}

/**
 * Generate password requirements text for UI
 */
export function getPasswordRequirementsText(): string {
  return 'Password must be between 8-64 characters. No other requirements - use a unique password you can remember.';
}

/**
 * Check if password change is needed (for security policies)
 * NIST recommends NOT forcing periodic password changes
 */
export function shouldForcePasswordChange(user: { lastPasswordChange?: Date }): boolean {
  // NIST recommends against periodic forced password changes
  // Only force change if password is known to be compromised
  return false;
}
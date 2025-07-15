/**
 * Enhanced Password Validation for ParrotSpeak
 * 
 * Security Requirements:
 * - Minimum 8 characters, maximum 64 characters
 * - Must contain letters and numbers (alphanumeric)
 * - Must contain at least 1 special character
 * - Check against known weak passwords
 */

export interface PasswordValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * Validates password according to ParrotSpeak security requirements
 */
export function validatePassword(password: string): PasswordValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Check minimum length
  if (password.length < 8) {
    errors.push('Password must be at least 8 characters long');
  }

  // Check maximum length
  if (password.length > 64) {
    errors.push('Password must be no more than 64 characters long');
  }

  // Check for letters (both uppercase and lowercase count)
  const hasLetters = /[a-zA-Z]/.test(password);
  if (!hasLetters) {
    errors.push('Password must contain at least one letter');
  }

  // Check for numbers
  const hasNumbers = /\d/.test(password);
  if (!hasNumbers) {
    errors.push('Password must contain at least one number');
  }

  // Check for special characters
  const hasSpecialChars = /[!@#$%^&*(),.?":{}|<>]/.test(password);
  if (!hasSpecialChars) {
    errors.push('Password must contain at least one special character (!@#$%^&*(),.?":{}|<>)');
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

  // Additional strength recommendations
  const hasLowercase = /[a-z]/.test(password);
  const hasUppercase = /[A-Z]/.test(password);
  
  if (hasLetters && hasNumbers && hasSpecialChars) {
    if (!hasLowercase || !hasUppercase) {
      warnings.push('Consider using both uppercase and lowercase letters for extra security');
    }
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
  
  // Required elements
  if (hasLowercase || hasUppercase) score += 1; // Letters
  if (hasNumbers) score += 1; // Numbers
  if (hasSpecialChars) score += 1; // Special chars
  
  // Bonus for both cases
  if (hasLowercase && hasUppercase) score += 1;
  
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
  return 'Password must be 8-64 characters with letters, numbers, and at least one special character (!@#$%^&*).';
}

/**
 * Get friendly password requirements for UX
 */
export function getPasswordRequirementsArray(): string[] {
  return [
    'At least 8 characters long',
    'Contains letters and numbers',
    'Includes at least one special character (!@#$%^&*)'
  ];
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
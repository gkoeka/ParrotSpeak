import crypto from 'crypto';

// Encryption configuration
const ALGORITHM = 'aes-256-gcm';
const KEY_LENGTH = 32; // 256 bits
const IV_LENGTH = 16; // 128 bits
const TAG_LENGTH = 16; // 128 bits

interface EncryptedData {
  encryptedData: string;
  iv: string;
  tag: string;
  keyDerivationSalt: string;
}

/**
 * Derives a user-specific encryption key from the master key and user ID
 */
function deriveUserKey(masterKey: string, userId: string, salt: string): Buffer {
  return crypto.pbkdf2Sync(
    masterKey + userId,
    salt,
    100000, // iterations
    KEY_LENGTH,
    'sha256'
  );
}

/**
 * Encrypts text data for a specific user
 */
export function encryptUserData(text: string, userId: string): EncryptedData {
  if (!process.env.ENCRYPTION_MASTER_KEY) {
    throw new Error('ENCRYPTION_MASTER_KEY environment variable is required');
  }

  // Generate random salt for key derivation
  const keyDerivationSalt = crypto.randomBytes(16).toString('hex');
  
  // Derive user-specific key
  const userKey = deriveUserKey(process.env.ENCRYPTION_MASTER_KEY, userId, keyDerivationSalt);
  
  // Generate random IV
  const iv = crypto.randomBytes(IV_LENGTH);
  
  // Create cipher
  const cipher = crypto.createCipheriv(ALGORITHM, userKey, iv);
  cipher.setAAD(Buffer.from(userId)); // Additional authenticated data
  
  // Encrypt the data
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  // Get authentication tag
  const tag = cipher.getAuthTag();
  
  return {
    encryptedData: encrypted,
    iv: iv.toString('hex'),
    tag: tag.toString('hex'),
    keyDerivationSalt
  };
}

/**
 * Decrypts text data for a specific user
 */
export function decryptUserData(encryptedData: EncryptedData, userId: string): string {
  if (!process.env.ENCRYPTION_MASTER_KEY) {
    throw new Error('ENCRYPTION_MASTER_KEY environment variable is required');
  }

  try {
    // Derive the same user-specific key
    const userKey = deriveUserKey(
      process.env.ENCRYPTION_MASTER_KEY, 
      userId, 
      encryptedData.keyDerivationSalt
    );
    
    // Create decipher
    const decipher = crypto.createDecipheriv(ALGORITHM, userKey, Buffer.from(encryptedData.iv, 'hex'), { authTagLength: TAG_LENGTH });
    decipher.setAuthTag(Buffer.from(encryptedData.tag, 'hex'));
    decipher.setAAD(Buffer.from(userId)); // Same additional authenticated data
    
    // Decrypt the data
    let decrypted = decipher.update(encryptedData.encryptedData, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  } catch (error) {
    console.error('Decryption failed:', error);
    throw new Error('Failed to decrypt user data');
  }
}

/**
 * Encrypts a message object, returning encrypted and original versions
 */
export function encryptMessage(text: string, translatedText: string, userId: string) {
  const encryptedText = text ? encryptUserData(text, userId) : null;
  const encryptedTranslatedText = translatedText ? encryptUserData(translatedText, userId) : null;
  
  return {
    encryptedText,
    encryptedTranslatedText
  };
}

/**
 * Decrypts a message object for authorized access
 */
export function decryptMessage(
  encryptedText: EncryptedData | null, 
  encryptedTranslatedText: EncryptedData | null, 
  userId: string
) {
  const text = encryptedText ? decryptUserData(encryptedText, userId) : null;
  const translatedText = encryptedTranslatedText ? decryptUserData(encryptedTranslatedText, userId) : null;
  
  return {
    text,
    translatedText
  };
}

/**
 * Encrypts conversation title for privacy
 */
export function encryptConversationTitle(title: string, userId: string): EncryptedData {
  return encryptUserData(title, userId);
}

/**
 * Decrypts conversation title for authorized access
 */
export function decryptConversationTitle(encryptedTitle: EncryptedData, userId: string): string {
  return decryptUserData(encryptedTitle, userId);
}
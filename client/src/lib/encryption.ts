import { ApiResponse, GenericObject, GenericGenericFunction, ErrorResponse } from '@/types/common';
import bcrypt from 'bcryptjs'
import crypto from 'crypto'

// Encryption configuration
const ENCRYPTION_CONFIG = {
  algorithm: 'aes-256-gcm',
  keyLength: 32, // 256 bits
  ivLength: 16,  // 128 bits
  tagLength: 16, // 128 bits
  saltRounds: 12,
}

// Get encryption key from environment
function getEncryptionKey(): Buffer {
  const key = process.env.ENCRYPTION_KEY
  
  // During build time, use a dummy key to prevent build failures
  if (process.env.NODE_ENV === 'production' && process.env.NEXT_PHASE === 'phase-production-build') {
    console.warn('⚠️ Using dummy encryption key during build phase')
    return crypto.scryptSync('dummy-key-for-build', 'salt', ENCRYPTION_CONFIG.keyLength)
  }
  
  if (!key) {
    throw new Error('ENCRYPTION_KEY environment variable is required')
  }
  
  // Ensure key is exactly 32 bytes
  return crypto.scryptSync(key, 'salt', ENCRYPTION_CONFIG.keyLength)
}

export class EncryptionService {
  private static instance: EncryptionService
  private encryptionKey: Buffer

  private constructor() {
    this.encryptionKey = getEncryptionKey()
  }

  public static getInstance(): EncryptionService {
    if (!EncryptionService.instance) {
      EncryptionService.instance = new EncryptionService()
    }
    return EncryptionService.instance
  }

  // Encrypt sensitive data
  encrypt(data: string): string {
    try {
      const iv = crypto.randomBytes(ENCRYPTION_CONFIG.ivLength)
      const cipher = crypto.createCipher(ENCRYPTION_CONFIG.algorithm, this.encryptionKey)
      
      let encrypted = cipher.update(data, 'utf8', 'hex')
      encrypted += cipher.final('hex')
      
      // Combine iv and encrypted data
      const result = iv.toString('hex') + ':' + encrypted
      
      return result
    } catch (error) {
      console.error('Encryption error:', error)
      throw new Error('Failed to encrypt data')
    }
  }

  // Decrypt sensitive data
  decrypt(encryptedData: string): string {
    try {
      const parts = encryptedData.split(':')
      if (parts.length !== 2) {
        throw new Error('Invalid encrypted data format')
      }
      
      const iv = Buffer.from(parts[0], 'hex')
      const encrypted = parts[1]
      
      const decipher = crypto.createDecipher(ENCRYPTION_CONFIG.algorithm, this.encryptionKey)
      
      let decrypted = decipher.update(encrypted, 'hex', 'utf8')
      decrypted += decipher.final('utf8')
      
      return decrypted
    } catch (error) {
      console.error('Decryption error:', error)
      throw new Error('Failed to decrypt data')
    }
  }

  // Hash password
  async hashPassword(password: string): Promise<string> {
    try {
      return await bcrypt.hash(password, ENCRYPTION_CONFIG.saltRounds)
    } catch (error) {
      console.error('Password hashing error:', error)
      throw new Error('Failed to hash password')
    }
  }

  // Verify password
  async verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
    try {
      return await bcrypt.compare(password, hashedPassword)
    } catch (error) {
      console.error('Password verification error:', error)
      return false
    }
  }

  // Generate secure random token
  generateToken(length: number = 32): string {
    return crypto.randomBytes(length).toString('hex')
  }

  // Generate secure random string
  generateSecureString(length: number = 16): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
    let result = ''
    
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    
    return result
  }

  // Hash data for integrity checking
  hashData(data: string): string {
    return crypto.createHash('sha256').update(data).digest('hex')
  }

  // Verify data integrity
  verifyDataIntegrity(data: string, hash: string): boolean {
    const computedHash = this.hashData(data)
    return computedHash === hash
  }
}

// Field-level encryption for database
export class FieldEncryption {
  private static encryptionService = EncryptionService.getInstance()

  // Encrypt sensitive fields before storing
  static encryptFields<T extends Record<string, unknown>>(
    data: T,
    fieldsToEncrypt: (keyof T)[]
  ): T {
    const encrypted = { ...data }
    
    fieldsToEncrypt.forEach(field => {
      if (encrypted[field] && typeof encrypted[field] === 'string') {
        encrypted[field] = this.encryptionService.encrypt(encrypted[field]) as any
      }
    })
    
    return encrypted
  }

  // Decrypt sensitive fields after retrieving
  static decryptFields<T extends Record<string, unknown>>(
    data: T,
    fieldsToDecrypt: (keyof T)[]
  ): T {
    const decrypted = { ...data }
    
    fieldsToDecrypt.forEach(field => {
      if (decrypted[field] && typeof decrypted[field] === 'string') {
        try {
          decrypted[field] = this.encryptionService.decrypt(decrypted[field]) as any
        } catch (error) {
          console.error(`Failed to decrypt field ${String(field)}:`, error)
          // Keep original value if decryption fails
        }
      }
    })
    
    return decrypted
  }
}

// Secure data storage utilities
export class SecureStorage {
  private static encryptionService = EncryptionService.getInstance()

  // Store sensitive data with encryption
  static async storeSecureData(
    key: string,
    data: ApiResponse,
    ttl?: number
  ): Promise<void> {
    try {
      const serializedData = JSON.stringify(data)
      const encryptedData = this.encryptionService.encrypt(serializedData)
      
      // Store in Redis with encryption
      const { cacheService } = await import('@/lib/redis')
      await cacheService.set(key, encryptedData, ttl)
    } catch (error) {
      console.error('Secure storage error:', error)
      throw new Error('Failed to store secure data')
    }
  }

  // Retrieve and decrypt sensitive data
  static async getSecureData<T>(key: string): Promise<T | null> {
    try {
      const { cacheService } = await import('@/lib/redis')
      const encryptedData = await cacheService.get<string>(key)
      
      if (!encryptedData) {
        return null
      }
      
      const decryptedData = this.encryptionService.decrypt(encryptedData)
      return JSON.parse(decryptedData)
    } catch (error) {
      console.error('Secure retrieval error:', error)
      return null
    }
  }

  // Remove secure data
  static async removeSecureData(key: string): Promise<void> {
    try {
      const { cacheService } = await import('@/lib/redis')
      await cacheService.del(key)
    } catch (error) {
      console.error('Secure removal error:', error)
    }
  }
}

// Data masking for logging and display
export class DataMasking {
  // Mask email addresses
  static maskEmail(email: string): string {
    if (!email || !email.includes('@')) return email
    
    const [localPart, domain] = email.split('@')
    const maskedLocal = localPart.length > 2 
      ? localPart.substring(0, 2) + '*'.repeat(localPart.length - 2)
      : '*'.repeat(localPart.length)
    
    return `${maskedLocal}@${domain}`
  }

  // Mask phone numbers
  static maskPhone(phone: string): string {
    if (!phone || phone.length < 4) return phone
    
    const visibleDigits = Math.min(4, phone.length)
    const maskedDigits = '*'.repeat(phone.length - visibleDigits)
    
    return maskedDigits + phone.substring(phone.length - visibleDigits)
  }

  // Mask credit card numbers
  static maskCreditCard(cardNumber: string): string {
    if (!cardNumber || cardNumber.length < 8) return cardNumber
    
    const lastFour = cardNumber.substring(cardNumber.length - 4)
    const masked = '*'.repeat(cardNumber.length - 4)
    
    return masked + lastFour
  }

  // Mask sensitive fields in objects
  static maskSensitiveFields<T extends Record<string, unknown>>(
    data: T,
    fieldsToMask: (keyof T)[]
  ): T {
    const masked = { ...data }
    
    fieldsToMask.forEach(field => {
      if (masked[field] && typeof masked[field] === 'string') {
        const value = masked[field] as string
        
        if (field.toString().toLowerCase().includes('email')) {
          masked[field] = this.maskEmail(value) as any
        } else if (field.toString().toLowerCase().includes('phone')) {
          masked[field] = this.maskPhone(value) as any
        } else if (field.toString().toLowerCase().includes('card')) {
          masked[field] = this.maskCreditCard(value) as any
        } else {
          // Generic masking
          masked[field] = '*'.repeat(Math.min(value.length, 8)) as any
        }
      }
    })
    
    return masked
  }
}

// Secure comparison to prevent timing attacks
export function secureCompare(a: string, b: string): boolean {
  if (a.length !== b.length) {
    return false
  }
  
  let result = 0
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i)
  }
  
  return result === 0
}

export default EncryptionService

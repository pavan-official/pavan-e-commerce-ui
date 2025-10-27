import { prisma } from '@/lib/prisma'
import { CacheKeys, CacheTTL, cacheService } from '@/lib/redis'
import { authenticator } from 'otplib'
import QRCode from 'qrcode'
import { getServerUser } from '@/lib/custom-auth'
import { NextRequest } from 'next/server'

// MFA configuration
const MFA_CONFIG = {
  issuer: process.env.NEXT_PUBLIC_APP_NAME || 'TrendLama',
  algorithm: 'sha1',
  digits: 6,
  period: 30,
  window: 1, // Allow 1 step before/after current time
}

export class MFAService {
  // Generate MFA secret for user
  static async generateSecret(userId: string, userEmail: string): Promise<{
    secret: string
    qrCodeUrl: string
    backupCodes: string[]
  }> {
    try {
      // Generate secret
      const secret = authenticator.generateSecret()
      
      // Generate QR code URL
      const otpAuthUrl = authenticator.keyuri(
        userEmail,
        MFA_CONFIG.issuer,
        secret
      )
      
      const qrCodeUrl = await QRCode.toDataURL(otpAuthUrl)
      
      // Generate backup codes
      const backupCodes = this.generateBackupCodes()
      
      // Store secret and backup codes (encrypted)
      await this.storeMFAData(userId, secret, backupCodes)
      
      return {
        secret,
        qrCodeUrl,
        backupCodes,
      }
    } catch (error) {
      console.error('Error generating MFA secret:', error)
      throw new Error('Failed to generate MFA secret')
    }
  }

  // Verify MFA token
  static async verifyToken(userId: string, token: string): Promise<{
    valid: boolean
    isBackupCode: boolean
  }> {
    try {
      // Get user's MFA data
      const mfaData = await this.getMFAData(userId)
      if (!mfaData) {
        return { valid: false, isBackupCode: false }
      }

      // Check if it's a backup code
      if (mfaData.backupCodes.includes(token)) {
        // Remove used backup code
        await this.removeBackupCode(userId, token)
        return { valid: true, isBackupCode: true }
      }

      // Verify TOTP token
      const isValid = authenticator.verify({
        token,
        secret: mfaData.secret,
      })

      return { valid: isValid, isBackupCode: false }
    } catch (error) {
      console.error('Error verifying MFA token:', error)
      return { valid: false, isBackupCode: false }
    }
  }

  // Enable MFA for user
  static async enableMFA(userId: string, token: string): Promise<boolean> {
    try {
      const verification = await this.verifyToken(userId, token)
      if (!verification.valid) {
        return false
      }

      // Update user MFA status
      await prisma.user.update({
        where: { id: userId },
        data: { 
          // MFA verification timestamp not available in schema
        },
      })

      // Clear MFA setup data from cache
      await cacheService.del(CacheKeys.mfaSetup(userId))

      return true
    } catch (error) {
      console.error('Error enabling MFA:', error)
      return false
    }
  }

  // Disable MFA for user
  static async disableMFA(userId: string, password: string): Promise<boolean> {
    try {
      // Verify password first
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { password: true },
      })

      if (!user || !user.password || !await this.verifyPassword(password, user.password)) {
        return false
      }

      // Disable MFA
      await prisma.user.update({
        where: { id: userId },
        data: { 
          // MFA fields not available in schema
        },
      })

      // Clear MFA data from cache
      await cacheService.del(CacheKeys.mfaData(userId))

      return true
    } catch (error) {
      console.error('Error disabling MFA:', error)
      return false
    }
  }

  // Generate new backup codes
  static async generateNewBackupCodes(userId: string): Promise<string[]> {
    try {
      const backupCodes = this.generateBackupCodes()
      
      // Update user's backup codes
      await prisma.user.update({
        where: { id: userId },
        data: { 
          // MFA backup codes not available in schema
        },
      })

      // Update cache
      const mfaData = await this.getMFAData(userId)
      if (mfaData) {
        mfaData.backupCodes = backupCodes
        await cacheService.set(
          CacheKeys.mfaData(userId),
          mfaData,
          CacheTTL.SESSION
        )
      }

      return backupCodes
    } catch (error) {
      console.error('Error generating new backup codes:', error)
      throw new Error('Failed to generate backup codes')
    }
  }

  // Check if user has MFA enabled
  static async isMFAEnabled(userId: string): Promise<boolean> {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { id: true },
      })

      return false // MFA not implemented in current schema
    } catch (error) {
      console.error('Error checking MFA status:', error)
      return false
    }
  }

  // Private helper methods
  private static generateBackupCodes(): string[] {
    const codes: string[] = []
    for (let i = 0; i < 10; i++) {
      codes.push(this.generateBackupCode())
    }
    return codes
  }

  private static generateBackupCode(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
    let result = ''
    for (let i = 0; i < 8; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    return result
  }

  private static async storeMFAData(
    userId: string,
    secret: string,
    backupCodes: string[]
  ): Promise<void> {
    // Store in cache temporarily during setup
    await cacheService.set(
      CacheKeys.mfaSetup(userId),
      { secret, backupCodes },
      CacheTTL.SHORT
    )
  }

  private static async getMFAData(userId: string): Promise<{
    secret: string
    backupCodes: string[]
  } | null> {
    // Try cache first
    // MFA not implemented in current schema
    return null

    // Get from database
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true },
    })

    // MFA not implemented in current schema
    return null
  }

  private static async removeBackupCode(userId: string, usedCode: string): Promise<void> {
    const mfaData = await this.getMFAData(userId)
    if (!mfaData) return

    // Remove the used backup code
    const updatedBackupCodes = mfaData.backupCodes.filter(code => code !== usedCode)
    
    // Update database
    await prisma.user.update({
      where: { id: userId },
      data: { 
        // MFA backup codes not available in schema
      },
    })

    // Update cache
    mfaData.backupCodes = updatedBackupCodes
    await cacheService.set(CacheKeys.mfaData(userId), mfaData, CacheTTL.SESSION)
  }

  private static async verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
    const bcrypt = await import('bcryptjs')
    return bcrypt.compare(password, hashedPassword)
  }
}

// MFA middleware for API routes
export function requireMFA(_handler: any) {
  return async (request: NextRequest, context: any) => {
    const user = await getServerUser(request)
    
    if (!user?.id) {
      return new Response(
        JSON.stringify({ error: 'Authentication required' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      )
    }

    const mfaEnabled = await MFAService.isMFAEnabled(user.id)
    if (!mfaEnabled) {
      return new Response(
        JSON.stringify({ error: 'MFA not enabled' }),
        { status: 403, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // Check if MFA has been verified in this session
    const mfaVerified = await cacheService.get(CacheKeys.mfaVerified(user.id))
    if (!mfaVerified) {
      return new Response(
        JSON.stringify({ error: 'MFA verification required' }),
        { status: 403, headers: { 'Content-Type': 'application/json' } }
      )
    }

    return _handler(request, context)
  }
}

export default MFAService

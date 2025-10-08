import { MFAService } from '@/lib/mfa'

// Mock dependencies
jest.mock('@/lib/prisma', () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
  },
}))

jest.mock('@/lib/redis', () => ({
  cacheService: {
    set: jest.fn(),
    get: jest.fn(),
    del: jest.fn(),
  },
  CacheKeys: {
    mfaSetup: (userId: string) => `mfa:setup:${userId}`,
    mfaData: (userId: string) => `mfa:data:${userId}`,
    mfaVerified: (userId: string) => `mfa:verified:${userId}`,
  },
  CacheTTL: {
    SHORT: 300,
    SESSION: 7200,
  },
}))

jest.mock('otplib', () => ({
  authenticator: {
    generateSecret: jest.fn(() => 'test-secret'),
    keyuri: jest.fn(() => 'otpauth://totp/test@example.com?secret=test-secret'),
    verify: jest.fn(),
  },
}))

jest.mock('qrcode', () => ({
  toDataURL: jest.fn(() => Promise.resolve('data:image/png;base64,test')),
}))

jest.mock('bcryptjs', () => ({
  compare: jest.fn(() => Promise.resolve(true)),
}))

describe('MFA Service', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('generateSecret', () => {
    it('should generate MFA secret with QR code and backup codes', async () => {
      const { cacheService } = require('@/lib/redis')
      cacheService.set.mockResolvedValue(undefined)

      const result = await MFAService.generateSecret('user-123', 'test@example.com')

      expect(result).toHaveProperty('secret')
      expect(result).toHaveProperty('qrCodeUrl')
      expect(result).toHaveProperty('backupCodes')
      expect(result.backupCodes).toHaveLength(10)
      expect(cacheService.set).toHaveBeenCalled()
    })

    it('should handle errors during secret generation', async () => {
      const { authenticator } = require('otplib')
      authenticator.generateSecret.mockImplementation(() => {
        throw new Error('Generation failed')
      })

      await expect(
        MFAService.generateSecret('user-123', 'test@example.com')
      ).rejects.toThrow('Failed to generate MFA secret')
    })
  })

  describe('verifyToken', () => {
    it('should verify valid TOTP token', async () => {
      const { cacheService } = require('@/lib/redis')
      const { authenticator } = require('otplib')
      
      cacheService.get.mockResolvedValue({
        secret: 'test-secret',
        backupCodes: ['BACKUP123', 'BACKUP456'],
      })
      authenticator.verify.mockReturnValue(true)

      const result = await MFAService.verifyToken('user-123', '123456')

      expect(result.valid).toBe(true)
      expect(result.isBackupCode).toBe(false)
    })

    it('should verify valid backup code', async () => {
      const { cacheService } = require('@/lib/redis')
      
      cacheService.get.mockResolvedValue({
        secret: 'test-secret',
        backupCodes: ['BACKUP123', 'BACKUP456'],
      })

      const result = await MFAService.verifyToken('user-123', 'BACKUP123')

      expect(result.valid).toBe(true)
      expect(result.isBackupCode).toBe(true)
    })

    it('should reject invalid token', async () => {
      const { cacheService } = require('@/lib/redis')
      const { authenticator } = require('otplib')
      
      cacheService.get.mockResolvedValue({
        secret: 'test-secret',
        backupCodes: ['BACKUP123', 'BACKUP456'],
      })
      authenticator.verify.mockReturnValue(false)

      const result = await MFAService.verifyToken('user-123', 'invalid')

      expect(result.valid).toBe(false)
      expect(result.isBackupCode).toBe(false)
    })

    it('should handle missing MFA data', async () => {
      const { cacheService } = require('@/lib/redis')
      cacheService.get.mockResolvedValue(null)

      const result = await MFAService.verifyToken('user-123', '123456')

      expect(result.valid).toBe(false)
    })
  })

  describe('enableMFA', () => {
    it('should enable MFA with valid token', async () => {
      const { prisma } = require('@/lib/prisma')
      const { cacheService } = require('@/lib/redis')
      
      // Mock verifyToken to return valid
      jest.spyOn(MFAService, 'verifyToken').mockResolvedValue({
        valid: true,
        isBackupCode: false,
      })
      
      prisma.user.update.mockResolvedValue({})
      cacheService.del.mockResolvedValue(undefined)

      const result = await MFAService.enableMFA('user-123', '123456')

      expect(result).toBe(true)
      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: 'user-123' },
        data: {
          mfaEnabled: true,
          mfaVerifiedAt: expect.any(Date),
        },
      })
    })

    it('should reject enabling MFA with invalid token', async () => {
      jest.spyOn(MFAService, 'verifyToken').mockResolvedValue({
        valid: false,
        isBackupCode: false,
      })

      const result = await MFAService.enableMFA('user-123', 'invalid')

      expect(result).toBe(false)
    })
  })

  describe('disableMFA', () => {
    it('should disable MFA with correct password', async () => {
      const { prisma } = require('@/lib/prisma')
      const { cacheService } = require('@/lib/redis')
      
      prisma.user.findUnique.mockResolvedValue({
        password: 'hashed-password',
      })
      prisma.user.update.mockResolvedValue({})
      cacheService.del.mockResolvedValue(undefined)

      const result = await MFAService.disableMFA('user-123', 'correct-password')

      expect(result).toBe(true)
      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: 'user-123' },
        data: {
          mfaEnabled: false,
          mfaSecret: null,
          mfaBackupCodes: null,
          mfaVerifiedAt: null,
        },
      })
    })

    it('should reject disabling MFA with incorrect password', async () => {
      const { prisma } = require('@/lib/prisma')
      
      prisma.user.findUnique.mockResolvedValue({
        password: 'hashed-password',
      })

      const result = await MFAService.disableMFA('user-123', 'wrong-password')

      expect(result).toBe(false)
    })
  })

  describe('isMFAEnabled', () => {
    it('should return true when MFA is enabled', async () => {
      const { prisma } = require('@/lib/prisma')
      
      prisma.user.findUnique.mockResolvedValue({
        mfaEnabled: true,
      })

      const result = await MFAService.isMFAEnabled('user-123')

      expect(result).toBe(true)
    })

    it('should return false when MFA is disabled', async () => {
      const { prisma } = require('@/lib/prisma')
      
      prisma.user.findUnique.mockResolvedValue({
        mfaEnabled: false,
      })

      const result = await MFAService.isMFAEnabled('user-123')

      expect(result).toBe(false)
    })

    it('should return false when user not found', async () => {
      const { prisma } = require('@/lib/prisma')
      
      prisma.user.findUnique.mockResolvedValue(null)

      const result = await MFAService.isMFAEnabled('user-123')

      expect(result).toBe(false)
    })
  })

  describe('generateNewBackupCodes', () => {
    it('should generate new backup codes', async () => {
      const { prisma } = require('@/lib/prisma')
      const { cacheService } = require('@/lib/redis')
      
      prisma.user.update.mockResolvedValue({})
      cacheService.get.mockResolvedValue({
        secret: 'test-secret',
        backupCodes: ['old1', 'old2'],
      })
      cacheService.set.mockResolvedValue(undefined)

      const result = await MFAService.generateNewBackupCodes('user-123')

      expect(result).toHaveLength(10)
      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: 'user-123' },
        data: { mfaBackupCodes: result },
      })
    })

    it('should handle errors during backup code generation', async () => {
      const { prisma } = require('@/lib/prisma')
      
      prisma.user.update.mockRejectedValue(new Error('Database error'))

      await expect(
        MFAService.generateNewBackupCodes('user-123')
      ).rejects.toThrow('Failed to generate backup codes')
    })
  })
})

/**
 * Auth Sign-In Tests
 * 
 * Tests the complete sign-in flow including:
 * - Successful sign-in with valid credentials
 * - Rejection of non-existent users
 * - Rejection of wrong passwords
 * - Rejection of inactive accounts
 * - Proper error response format
 * - Redis cache hit/miss scenarios
 * - JWT token generation
 */

// Mock dependencies
const mockFindEmail = jest.fn()
const mockFindFirst = jest.fn()
const mockHgetAll = jest.fn()
const mockHset = jest.fn()
const mockDelCache = jest.fn()

jest.mock('@database', () => ({
  mdUserFindEmail: (...args: any[]) => mockFindEmail(...args),
  mdUserFindFirst: (...args: any[]) => mockFindFirst(...args),
  mdUserAdd: jest.fn(),
  mdUserUpdate: jest.fn(),
  mdOrgMemberAdd: jest.fn(),
  mdPendingInvitationFindByEmail: jest.fn().mockResolvedValue([]),
  mdPendingInvitationDeleteByEmail: jest.fn()
}))

jest.mock('../../../lib/redis', () => ({
  CKEY: { USER: 'USER' },
  hgetAll: (...args: any[]) => mockHgetAll(...args),
  hset: (...args: any[]) => mockHset(...args),
  delCache: (...args: any[]) => mockDelCache(...args),
}))

jest.mock('../../../lib/log', () => ({
  sendDiscordLog: jest.fn()
}))

jest.mock('../../../lib/utils', () => ({
  isDevMode: () => false,
  isEmailVerificationEnabled: () => false
}))

jest.mock('../../../lib/email', () => ({
  sendVerifyEmail: jest.fn().mockResolvedValue(undefined)
}))

// Use bcryptjs for password hashing
import { hashSync, genSaltSync } from 'bcryptjs'

const salt = genSaltSync(10)
const TEST_PASSWORD = 'testPassword123'
const HASHED_PASSWORD = hashSync(TEST_PASSWORD, salt)

// Mock user data
const ACTIVE_USER = {
  id: '507f1f77bcf86cd799439011',
  email: 'active@test.com',
  password: HASHED_PASSWORD,
  name: 'Active User',
  status: 'ACTIVE',
  photo: null,
  country: null,
  bio: null,
  dob: null,
  settings: {},
  isBot: false,
  resetToken: null,
  createdAt: new Date('2025-01-01'),
  createdBy: null,
  updatedAt: null,
  updatedBy: null
}

const INACTIVE_USER = {
  ...ACTIVE_USER,
  id: '507f1f77bcf86cd799439022',
  email: 'inactive@test.com',
  status: 'INACTIVE',
  name: 'Inactive User'
}

describe('Auth Sign-In', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    // By default, no cached data
    mockHgetAll.mockResolvedValue(null)
    mockHset.mockResolvedValue(undefined)
  })

  describe('EmailAuthProvider', () => {
    // Import after mocks are set up
    let EmailAuthProvider: any

    beforeAll(() => {
      EmailAuthProvider = require('../../../providers/auth/EmailAuthProvider').default
    })

    it('should successfully verify a user with correct email and password', async () => {
      mockFindEmail.mockResolvedValue(ACTIVE_USER)

      const provider = new EmailAuthProvider({
        email: ACTIVE_USER.email,
        password: TEST_PASSWORD
      })

      await provider.verify()
      const user = provider.getUser()

      expect(user).toBeDefined()
      expect(user.id).toBe(ACTIVE_USER.id)
      expect(user.email).toBe(ACTIVE_USER.email)
      expect(user.name).toBe(ACTIVE_USER.name)
    })

    it('should throw CredentialInvalidException when user does not exist', async () => {
      mockFindEmail.mockResolvedValue(null)
      mockHgetAll.mockResolvedValue(null)

      const provider = new EmailAuthProvider({
        email: 'nonexistent@test.com',
        password: TEST_PASSWORD
      })

      await expect(provider.verify()).rejects.toThrow()
    })

    it('should throw CredentialInvalidException when password is wrong', async () => {
      mockFindEmail.mockResolvedValue(ACTIVE_USER)

      const provider = new EmailAuthProvider({
        email: ACTIVE_USER.email,
        password: 'wrongPassword123'
      })

      await expect(provider.verify()).rejects.toThrow()
    })

    it('should throw InactiveAccountException when user status is INACTIVE', async () => {
      mockFindEmail.mockResolvedValue(INACTIVE_USER)

      const provider = new EmailAuthProvider({
        email: INACTIVE_USER.email,
        password: TEST_PASSWORD
      })

      await expect(provider.verify()).rejects.toThrow()
    })

    it('should work correctly with cached user data from Redis', async () => {
      // Simulate Redis returning cached user (all values as strings, which is how Redis HSET stores them)
      const cachedUser = {
        id: ACTIVE_USER.id,
        email: ACTIVE_USER.email,
        password: ACTIVE_USER.password,
        name: ACTIVE_USER.name,
        status: 'ACTIVE',
        photo: '',
        country: '',
        bio: '',
      }
      mockHgetAll.mockResolvedValue(cachedUser)

      const provider = new EmailAuthProvider({
        email: ACTIVE_USER.email,
        password: TEST_PASSWORD
      })

      await provider.verify()
      const user = provider.getUser()

      expect(user).toBeDefined()
      expect(user.id).toBe(ACTIVE_USER.id)
      // Verify DB was NOT called since cache had valid data
      expect(mockFindEmail).not.toHaveBeenCalled()
    })

    it('should fall back to DB when Redis cache is corrupted (missing password)', async () => {
      // Corrupted cache — missing password field
      const corruptedCache = {
        id: ACTIVE_USER.id,
        email: ACTIVE_USER.email,
        // password is missing!
        name: ACTIVE_USER.name,
        status: 'ACTIVE',
      }
      mockHgetAll.mockResolvedValue(corruptedCache)
      mockFindEmail.mockResolvedValue(ACTIVE_USER)

      const provider = new EmailAuthProvider({
        email: ACTIVE_USER.email,
        password: TEST_PASSWORD
      })

      await provider.verify()
      const user = provider.getUser()

      expect(user).toBeDefined()
      // Should have fallen through to DB
      expect(mockFindEmail).toHaveBeenCalledWith(ACTIVE_USER.email)
    })

    it('should fall back to DB when Redis returns empty object', async () => {
      mockHgetAll.mockResolvedValue({})
      mockFindEmail.mockResolvedValue(ACTIVE_USER)

      const provider = new EmailAuthProvider({
        email: ACTIVE_USER.email,
        password: TEST_PASSWORD
      })

      await provider.verify()
      const user = provider.getUser()

      expect(user).toBeDefined()
      expect(mockFindEmail).toHaveBeenCalledWith(ACTIVE_USER.email)
    })

    it('should handle Redis connection failure gracefully', async () => {
      mockHgetAll.mockRejectedValue(new Error('Redis connection refused'))
      mockFindEmail.mockResolvedValue(ACTIVE_USER)

      const provider = new EmailAuthProvider({
        email: ACTIVE_USER.email,
        password: TEST_PASSWORD
      })

      await provider.verify()
      const user = provider.getUser()

      expect(user).toBeDefined()
      expect(user.id).toBe(ACTIVE_USER.id)
    })
  })

  describe('Error Response Format', () => {
    it('should ensure CredentialInvalidException has status 400', () => {
      const CredentialInvalidException = require('../../../exceptions/CredentialInvalidException').default
      const err = new CredentialInvalidException()
      expect(err.status).toBe(400)
      expect(err.message).toBeTruthy()
    })

    it('should ensure InactiveAccountException has status 403', () => {
      const InactiveAccountException = require('../../../exceptions/InactiveAccountException').default
      const err = new InactiveAccountException()
      expect(err.status).toBe(403)
      expect(err.message).toBeTruthy()
    })

    it('should ensure error responses always have a numeric status', () => {
      const CredentialInvalidException = require('../../../exceptions/CredentialInvalidException').default
      const InactiveAccountException = require('../../../exceptions/InactiveAccountException').default

      const cred = new CredentialInvalidException()
      const inactive = new InactiveAccountException()

      // These should always be numbers, never undefined
      expect(typeof cred.status).toBe('number')
      expect(typeof inactive.status).toBe('number')
    })
  })

  describe('JWT Token Generation', () => {
    it('should generate valid tokens with required fields', () => {
      // Set env vars for JWT
      process.env.JWT_SECRET_KEY = 'test-secret-key-for-testing-purposes-only'
      process.env.JWT_REFRESH_KEY = 'test-refresh-key-for-testing-purposes-only'
      process.env.JWT_TOKEN_EXPIRED = '30m'
      process.env.JWT_REFRESH_EXPIRED = '4h'

      const JwtProvider = require('../../../providers/JwtProvider').default

      const userData = {
        id: ACTIVE_USER.id,
        email: ACTIVE_USER.email,
        name: ACTIVE_USER.name,
        photo: ACTIVE_USER.photo
      }

      const jwtProvider = new JwtProvider(userData, true)
      const { token, refreshToken } = jwtProvider.generate()

      expect(token).toBeTruthy()
      expect(refreshToken).toBeTruthy()
      expect(typeof token).toBe('string')
      expect(typeof refreshToken).toBe('string')

      // Tokens should have 3 parts (header.payload.signature)
      expect(token.split('.').length).toBe(3)
      expect(refreshToken.split('.').length).toBe(3)
    })

    it('should generate different refresh token expiry for rememberMe=true vs false', () => {
      process.env.JWT_SECRET_KEY = 'test-secret-key-for-testing-purposes-only'
      process.env.JWT_REFRESH_KEY = 'test-refresh-key-for-testing-purposes-only'
      process.env.JWT_TOKEN_EXPIRED = '30m'
      process.env.JWT_REFRESH_EXPIRED = '4h'

      const JwtProvider = require('../../../providers/JwtProvider').default
      const { decode } = require('jsonwebtoken')

      const userData = {
        id: ACTIVE_USER.id,
        email: ACTIVE_USER.email,
        name: ACTIVE_USER.name,
        photo: ACTIVE_USER.photo
      }

      const rememberProvider = new JwtProvider(userData, true)
      const noRememberProvider = new JwtProvider(userData, false)

      const { refreshToken: rememberToken } = rememberProvider.generate()
      const { refreshToken: noRememberToken } = noRememberProvider.generate()

      const rememberDecoded = decode(rememberToken) as any
      const noRememberDecoded = decode(noRememberToken) as any

      // Remember me should have longer expiry (30 days vs 4 hours)
      expect(rememberDecoded.exp - rememberDecoded.iat).toBeGreaterThan(
        noRememberDecoded.exp - noRememberDecoded.iat
      )
    })
  })
})

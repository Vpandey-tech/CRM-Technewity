/**
 * User Service Unit Tests
 * 
 * Verifies:
 * - Redis cache hit with valid user data
 * - Redis cache miss queries DB and caches result
 * - Corrupted cache data (missing id/email/password or Promise artifact) drops cache and fetches from DB
 * - Redis failure / connection error gracefully falls back to DB
 * - Same behavior for serviceGetUserById
 */

const mockMdUserFindEmail = jest.fn()
const mockMdUserFindFirst = jest.fn()
const mockHgetAll = jest.fn()
const mockHset = jest.fn()
const mockDelCache = jest.fn()

jest.mock('@database', () => ({
  mdUserFindEmail: (...args: any[]) => mockMdUserFindEmail(...args),
  mdUserFindFirst: (...args: any[]) => mockMdUserFindFirst(...args)
}))

jest.mock('../../lib/redis', () => ({
  CKEY: { USER: 'USER' },
  hgetAll: (...args: any[]) => mockHgetAll(...args),
  hset: (...args: any[]) => mockHset(...args),
  delCache: (...args: any[]) => mockDelCache(...args)
}))

import { serviceGetUserByEmail, serviceGetUserById } from '../user'

describe('User Service Cache & DB Resiliency', () => {
  const mockDbUser = {
    id: 'user-12345',
    email: 'user@technewity.com',
    password: '$2a$10$abcdefghijklmnopqrstuvwxyz1234567890',
    name: 'Technewity User',
    status: 'ACTIVE'
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('serviceGetUserByEmail', () => {
    it('returns cached user if cache is valid and contains required fields', async () => {
      mockHgetAll.mockResolvedValue({
        id: 'user-12345',
        email: 'user@technewity.com',
        password: '$2a$10$abcdefghijklmnopqrstuvwxyz1234567890',
        name: 'Cached User'
      })

      const result = await serviceGetUserByEmail('user@technewity.com')

      expect(result).toBeDefined()
      expect(result?.id).toBe('user-12345')
      expect(mockMdUserFindEmail).not.toHaveBeenCalled()
    })

    it('falls back to database and sets cache on cache miss', async () => {
      mockHgetAll.mockResolvedValue(null)
      mockMdUserFindEmail.mockResolvedValue(mockDbUser)

      const result = await serviceGetUserByEmail('user@technewity.com')

      expect(result).toEqual(mockDbUser)
      expect(mockMdUserFindEmail).toHaveBeenCalledWith('user@technewity.com')
      expect(mockHset).toHaveBeenCalledWith(['USER', 'user@technewity.com'], mockDbUser)
    })

    it('recovers gracefully from corrupted cache (missing password or id) by clearing cache and fetching from DB', async () => {
      // Corrupted cache: missing password field
      mockHgetAll.mockResolvedValue({
        id: 'user-12345',
        email: 'user@technewity.com'
        // password missing!
      })
      mockMdUserFindEmail.mockResolvedValue(mockDbUser)

      const result = await serviceGetUserByEmail('user@technewity.com')

      expect(mockDelCache).toHaveBeenCalledWith(['USER', 'user@technewity.com'])
      expect(mockMdUserFindEmail).toHaveBeenCalledWith('user@technewity.com')
      expect(result).toEqual(mockDbUser)
    })

    it('gracefully falls back to DB when Redis throws an unexpected error', async () => {
      mockHgetAll.mockRejectedValue(new Error('Redis connection timeout'))
      mockMdUserFindEmail.mockResolvedValue(mockDbUser)

      const result = await serviceGetUserByEmail('user@technewity.com')

      expect(mockMdUserFindEmail).toHaveBeenCalledWith('user@technewity.com')
      expect(result).toEqual(mockDbUser)
    })
  })

  describe('serviceGetUserById', () => {
    it('returns cached user if valid', async () => {
      mockHgetAll.mockResolvedValue({
        id: 'user-12345',
        email: 'user@technewity.com',
        password: '$2a$10$abcdefghijklmnopqrstuvwxyz1234567890'
      })

      const result = await serviceGetUserById('user-12345')

      expect(result?.id).toBe('user-12345')
      expect(mockMdUserFindFirst).not.toHaveBeenCalled()
    })

    it('clears corrupted cache and queries DB on corrupted cache', async () => {
      mockHgetAll.mockResolvedValue({
        someJunk: true
      })
      mockMdUserFindFirst.mockResolvedValue(mockDbUser)

      const result = await serviceGetUserById('user-12345')

      expect(mockDelCache).toHaveBeenCalledWith(['USER', 'user-12345'])
      expect(mockMdUserFindFirst).toHaveBeenCalledWith({ id: 'user-12345' })
      expect(result).toEqual(mockDbUser)
    })
  })
})

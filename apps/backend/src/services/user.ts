import { mdUserFindEmail, mdUserFindFirst } from '@database'
import { CKEY, delCache, hgetAll, hset } from '../lib/redis'

export const serviceGetUserById = async (id: string) => {
  const key = [CKEY.USER, id]
  let cached: any = null

  try {
    cached = await hgetAll(key)
  } catch (redisErr) {
    console.log('Redis get user by id error (falling back to DB):', redisErr)
  }

  if (cached) {
    if (cached.id && cached.email && cached.password) {
      return cached
    }
    // Corrupted cache entry — purge it
    try {
      await delCache(key)
    } catch (_) {}
  }

  // Cache miss or corrupted — fetch from DB
  try {
    const result = await mdUserFindFirst({ id })
    if (!result) {
      console.log('User id not found: ', id)
      return null
    }

    // Update cache with fresh data
    try {
      await hset(key, result)
    } catch (cacheErr) {
      console.log('Failed to cache user by id:', cacheErr)
    }

    return result
  } catch (error) {
    console.log('service get user by id DB error', error)
    return null
  }
}

export const serviceGetUserByEmail = async (email: string) => {
  const key = [CKEY.USER, email]
  let cached: any = null

  try {
    cached = await hgetAll(key)
  } catch (redisErr) {
    console.log('Redis get user by email error (falling back to DB):', redisErr)
  }

  if (cached) {
    // Validate that cached data has essential fields for authentication
    if (cached.id && cached.email && cached.password) {
      return cached
    }
    // Corrupted cache entry — purge it
    try {
      await delCache(key)
    } catch (_) {}
  }

  // Cache miss or corrupted cache entry — fetch fresh from DB
  try {
    const result = await mdUserFindEmail(email)
    if (!result) {
      console.log('Email not found: ', email)
      return null
    }

    // Update cache with fresh, validated data
    try {
      await hset(key, result)
    } catch (cacheErr) {
      console.log('Failed to cache user by email:', cacheErr)
    }

    return result
  } catch (error) {
    console.log('service get user by email DB error', error)
    return null
  }
}


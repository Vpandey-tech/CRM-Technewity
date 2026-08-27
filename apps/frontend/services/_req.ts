import {
  clearAllGoalieToken,
  decodeJwtPayload,
  getGoalieRefreshToken,
  getGoalieToken,
  isSessionExpired,
  saveGoalieRefreshToken,
  saveGoalieToken,
  GOALIE_JWT_TOKEN,
  GOALIE_REFRESH_TOKEN
} from '@auth-client'
import { messageError } from '@ui-components'
import axios from 'axios'

console.log('=================================')
console.log('process.env', process.env.NEXT_PUBLIC_BE_GATEWAY)
console.log('=================================')

const instance = axios.create({
  baseURL: process.env.NEXT_PUBLIC_BE_GATEWAY || ''
})

instance.interceptors.request.use(
  function(config) {
    const authorization = getGoalieToken()
    const refreshToken = getGoalieRefreshToken()

    // console.log('auth toke', authorization)
    // console.log('refresh', refreshToken)

    config.headers.setAuthorization(authorization)
    config.headers.set('refreshtoken', refreshToken)
    return config
  },
  function(error) {
    return Promise.reject(error)
  }
)

const CLIENT_APP_VERSION = process.env.NEXT_PUBLIC_APP_VERSION || '1.0.1'
let isLoggingOutForUpdate = false

function handleVersionMismatch() {
  if (isLoggingOutForUpdate) return
  isLoggingOutForUpdate = true
  messageError('A new version is available. Please log in again to continue.')
  clearAllGoalieToken()
  setTimeout(() => {
    if (typeof window !== 'undefined') {
      window.location.href = '/sign-in'
    }
  }, 1200)
}

function checkVersionHeader(headers: any): boolean {
  if (!headers) return false
  const serverVersion = headers['x-app-version'] || headers['X-App-Version']
  if (serverVersion && CLIENT_APP_VERSION && serverVersion !== CLIENT_APP_VERSION) {
    console.warn(`[App Update Detected] Client: ${CLIENT_APP_VERSION}, Server: ${serverVersion}`)
    handleVersionMismatch()
    return true
  }
  return false
}

instance.interceptors.response.use(
  function(config) {
    if (checkVersionHeader(config.headers)) {
      return config
    }

    const headers = config.headers
    const authorization = headers.authorization
    const refreshtoken = headers.refreshtoken

    // console.log('override token', authorization, refreshtoken)
    if (authorization && refreshtoken) {
      const decoded = decodeJwtPayload<{ rememberMe?: boolean }>(refreshtoken)
      let rememberMe = decoded?.rememberMe
      if (typeof rememberMe === 'undefined' && typeof window !== 'undefined') {
        rememberMe = !!window.localStorage.getItem(GOALIE_JWT_TOKEN) || !!window.localStorage.getItem(GOALIE_REFRESH_TOKEN)
      }

      saveGoalieToken(authorization, rememberMe)
      saveGoalieRefreshToken(refreshtoken, rememberMe)
      // console.log('override done')
    }
    return config
  },
  function(error) {
    const { response } = error

    if (response?.headers && checkVersionHeader(response.headers)) {
      return Promise.reject(error)
    }

    if (response && response.status === 440) {
      messageError('Your session has expired. Please login again!')
      clearAllGoalieToken()
      if (typeof window !== 'undefined') {
        window.location.href = '/sign-in'
      }
      return Promise.reject(error)
    }
    console.log('API Error:', response?.status, response?.data)
    return Promise.reject(error)
  }
)

export const req = instance
export const httpGet = req.get
export const httpPost = req.post
export const httpPut = req.put
export const httpPatch = req.patch
export const httpDel = req.delete

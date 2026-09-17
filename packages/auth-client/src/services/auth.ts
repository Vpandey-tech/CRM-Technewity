import { User } from '@prisma/client'
import { decode } from 'jsonwebtoken'
import {
  saveGoalieRefreshToken,
  saveGoalieToken,
  saveGoalieUser
} from '../lib/util'
import { httpPost } from './_req'

export const signup = (data: Partial<User>) => {
  return httpPost('/api/auth/sign-up', data)
}

export interface ISignin {
  email: string
  password: string
  provider?: 'GOOGLE' | 'EMAIL_PASSWORD'
  rememberMe?: boolean
}

export const signin = ({
  email,
  password,
  provider = 'EMAIL_PASSWORD',
  rememberMe = true
}: ISignin) => {
  return httpPost('/api/auth/sign-in', { email, password, provider, rememberMe })
    .then(res => {
      const { status, data } = res.data

      console.log('sign in response status:', status)

      if (status !== 200) {
        // Handle error responses that came with HTTP 200 (legacy format)
        if (status === 403) {
          return Promise.reject('NOT_ACTIVE')
        }
        return Promise.reject('INVALID_INFORMATION')
      }

      const token = res.headers.authorization
      const refreshToken = res.headers.refreshtoken

      console.log('cache goalie token')
      saveGoalieToken(token, rememberMe)
      console.log('cache goalie refresh token')
      saveGoalieRefreshToken(refreshToken, rememberMe)

      const decodeRefreshToken = decode(refreshToken) as { exp: number }

      console.log('cache goalie user info')
      saveGoalieUser(
        {
          id: data.id,
          email: data.email,
          name: data.name,
          photo: data.photo,
          exp: decodeRefreshToken.exp
        },
        rememberMe
      )

      return Promise.resolve('SUCCESS')
    })
    .catch(error => {
      console.log('error signin', error)

      // Handle Axios HTTP error responses (400, 403, 500)
      if (error?.response) {
        const httpStatus = error.response.status
        const errorData = error.response.data

        if (httpStatus === 403 || errorData?.error === 'NOT_ACTIVE') {
          return Promise.reject('NOT_ACTIVE')
        }

        if (httpStatus === 400 || errorData?.error === 'INVALID_CREDENTIALS') {
          return Promise.reject('INVALID_CREDENTIALS')
        }

        if (httpStatus === 500 || errorData?.error === 'SERVER_ERROR') {
          return Promise.reject('SERVER_ERROR')
        }
      }

      // If error is already a string (from the .then() reject above), pass it through
      if (typeof error === 'string') {
        return Promise.reject(error)
      }

      return Promise.reject('UNKNOWN_ERROR')
    })
}

export const resendVerifyEmail = (email: string) => {
  return httpPost('/api/auth/resend-verify-email', { email })
}

export const forgotPassword = (email: string) => {
  return httpPost('/api/auth/forgot-password', { email })
}

export interface ResetPasswordParams {
  token: string
  password: string
}

export const resetPassword = ({ token, password }: ResetPasswordParams) => {
  return httpPost('/api/auth/reset-password', { token, password })
    .then(res => {
      const { status } = res.data

      if (status !== 200) {
        return Promise.reject('RESET_PASSWORD_FAILED')
      }

      return Promise.resolve('SUCCESS')
    })
    .catch(error => {
      console.error('error reset password', error)
      return Promise.reject(error)
    })
} 

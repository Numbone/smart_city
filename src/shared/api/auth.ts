import { apiService } from "./api"
import { IAuthResponse } from "../types/auth"

export const login = async (email: string, password: string):Promise<IAuthResponse> => {
  const response = await apiService.post('/auth/email/login', { email, password })
  return response.data
}

export const register = async (email: string, password: string) => {
  const response = await apiService.post('/auth/email/register', { email, password })
  return response.data
}

export const logout = async () => {
  const response = await apiService.post('/auth/logout')
  return response.data
}

export const refreshToken = async () => {
  const response = await apiService.post('/auth/refresh')
  return response.data
}

export const authMe = async () => {
  const response = await apiService.get('/auth/me')
  return response.data
}

export const authService = {
  login,
  register,
  logout,
  refreshToken,
  authMe
}
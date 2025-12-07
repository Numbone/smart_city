// shared/types/auth.ts

export interface IUser {
  id: string
  email: string
  firstName?: string
  lastName?: string
  role?: {
    id: string
    name: string
  }
  createdAt?: string
  updatedAt?: string
}

export interface IAuthResponse {
  token: string
  refreshToken: string
  tokenExpires: number
  user: IUser
}

export interface ILoginRequest {
  email: string
  password: string
}

export interface IRegisterRequest {
  email: string
  password: string
  firstName?: string
  lastName?: string
}
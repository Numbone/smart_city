import { User } from "./user"

export interface IAuthResponse {
    token: string
    refreshToken: string
    tokenExpires: number
    user: User
  }
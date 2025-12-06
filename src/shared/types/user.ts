import { Photo, Role, Status } from "./base"

export interface User {
    id: number
    email: string
    provider: string
    socialId: string
    firstName: string
    lastName: string
    photo: Photo
    role: Role
    status: Status
    createdAt: string
    updatedAt: string
    deletedAt: string
  }
export interface IChangePasswordRequest {
  accessToken?: string
  oldPassword: string
  newPassword: string
}
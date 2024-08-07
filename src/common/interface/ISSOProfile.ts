import { ISSORole } from "./ISSORole"

export interface ISSOProfile {
	id: string
  googleID?: string
  cognitoID?: string
  firstName?: string
  lastName?: string
  email: string
  displayName?: string
  cognitoStatus?: string
  isDeleted: boolean
  roles?: ISSORole[]
}
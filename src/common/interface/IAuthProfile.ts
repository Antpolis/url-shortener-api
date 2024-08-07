export interface IAuthProfile {
  email: string;
  email_verified: boolean;
  family_name: string;
  given_name: string;
  name: string;
  sub: string;
  username: string;
  group?: string[];
  id?: number
  'cognito:groups'?: string[]
}

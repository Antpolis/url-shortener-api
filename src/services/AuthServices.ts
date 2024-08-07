import Axios from "axios";
import { IAuthProfile } from "../common/interface/IAuthProfile";
import { Action } from "routing-controllers";
import { decode } from "jsonwebtoken";
import { Request } from "express";
import * as AWS from 'aws-sdk'
import { IChangePasswordRequest } from "../common/interface/IChangePasswordRequest";
import { AWSConfig } from "../../config/aws"
import { CognitoJwtVerifier } from "aws-jwt-verify";

export const authAxios = Axios.create({
  baseURL: AWSConfig.auth.authBaseURL,
  timeout: +AWSConfig.auth.timeout
})

export const ChangeUserPassword = (changePassword: IChangePasswordRequest) => {
  const cognito = new AWS.CognitoIdentityServiceProvider({
    region: AWSConfig.auth.region
  })
  return cognito.changePassword({
    AccessToken: changePassword.accessToken,
    PreviousPassword: changePassword.oldPassword,
    ProposedPassword: changePassword.newPassword
  }).promise()
}


export const GetProfile = async (token: string) => {
  return authAxios.get<IAuthProfile>(AWSConfig.auth.userInfoEndpoint, {
    headers: {
      Authorization: "bearer " +token, 
    }
  })
}

export const VerifyTokenViaAwsJwt = async (token: string) => {

  const verifier = CognitoJwtVerifier.create({
    userPoolId: AWSConfig.auth.userPoolID,
    tokenUse: "access",
    clientId: AWSConfig.auth.clientID,
  });
  
  try {
     return  await verifier.verify(token);
  
  } catch(error) {
    console.log("Error : VerifyToken", error);
  }
  
}

export const hasRole = async  (token: string, role: string) => {
  const decodedProfile = GetUserFromToken(token)
  if(decodedProfile['cognito:groups']?.indexOf(role) !== -1) {
    return true
  }
  return false
}


export const GetAccessToken = (req: Request): string => {
  const token = req.headers["authorization"];
  if(token) {
    const [b, tokenString] = token.split(' ')
    return tokenString
  }
  return ""
}

export const GetUserFromToken = (tokenString: string):IAuthProfile => {
  return decode(tokenString) as IAuthProfile
}

export const GetTokenFromCookie = (req: Request): string => {  
  const cookieLine = req.headers.cookie.split(';')
  for(let i = 0; i<cookieLine.length;i++) {
    const [cookieName, cookieValue] = cookieLine[i].split('=')
    if(cookieName.trim() === AWSConfig.auth.JWTCookieName) {      
      return cookieValue
    }
  }
  return ""
}

export const AuthorizationChecker = async (action: Action, roles: string[]) => {   
  const token = GetAccessToken(action.request) || GetTokenFromCookie(action.request);    
  try { 

    const awsTokenDetails = await VerifyTokenViaAwsJwt(token);
    
    // const userProfile = await GetProfile(token)    
    // const decodedProfile = GetUserFromToken(token)
    if (awsTokenDetails && roles.find(role => awsTokenDetails['cognito:groups']?.indexOf(role) !== -1)) {
      return true;
    }else{
      return false;
    }
  } catch(e) {
    console.log("Error AuthorizationChecker: ",  e)
    return false;
  }
}

export const GetCurrentUser = async (action: Action) => {
  // here you can use request/response objects from action
  // you need to provide a user object that will be injected in controller actions
  // demo code:
  const token = GetAccessToken(action.request);
  try {
    const userProfile = await GetProfile(token)
    return userProfile
  } catch(e) {
    return false;
  }
  return false;
}

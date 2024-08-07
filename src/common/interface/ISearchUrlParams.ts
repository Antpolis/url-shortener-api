import { ICommonSearchRequest } from "."
import { ITag } from "./ITag";
export interface ISearchUrlParams extends ICommonSearchRequest {
    status?:number
    shortUrlIds?:string
    client?:string[]
    clientTag?: ITag
    clientUUIDs?: string[]
    clientIDs?: number[]
    campaign?:string[]
    campaignTag?: ITag
    campaignUUIDs?: string[]
    campaignIDs?: number[]
    links?:string    
    withTGDesc?: string
    domain?:string
    customSearch?:string[]
    ownerID?: number
    ownerEmail?: string
}
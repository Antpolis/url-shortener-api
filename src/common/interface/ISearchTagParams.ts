import { ICommonSearchRequest } from "."
export interface ISearchTagParams extends ICommonSearchRequest {
    id?:number
    name?:string
    key?:string
    searchTags?: string[]
    searchIDs?: number[]
}
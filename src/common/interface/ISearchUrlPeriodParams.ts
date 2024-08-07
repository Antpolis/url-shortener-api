import { ICommonSearchRequest } from "."
export interface ISearchUrlPeriodParams extends ICommonSearchRequest {
    url?: string
    startDate: Date
    endDate: Date
    shortenerURL?: string
}
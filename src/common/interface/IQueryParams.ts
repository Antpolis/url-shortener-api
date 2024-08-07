import { SortDirectionType } from "../../enums/SortDirectionType"

export interface IQueryParams {
    page: number
    take: number
    columnToSort?: string 
    sortDirection?: SortDirectionType
    startDate?:string
    endDate?:string
}

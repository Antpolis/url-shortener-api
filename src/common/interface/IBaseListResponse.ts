import { ResultType } from "../../enums/ResponseResultType";

export interface IBaseListResponse<T> {
  total: number
  data: T[]
  result?: ResultType
}
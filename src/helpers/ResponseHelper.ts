import { Response } from "express"
import { isPromise } from "./isPromise"
import { ResultType } from "../enums/ResponseResultType"
import { IBaseListResponse } from "../common/interface/IBaseListResponse"

export function CommonDataResponse<T>(data: T, result:ResultType='success') {
  return {
    result: result,
    data: data
  }
}

export function CommonMessageResponse(message: string, result:ResultType='success') {
  return {
    result: result,
    message: message
  }
}

export function CommonListResponse<T>(data: [T[], number], res?: Response): Promise<IBaseListResponse<T>> {
  return {
    total: data[1],
    data: data[0]
  }
}
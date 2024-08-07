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

export async function CommonListResponse<T>(data: [T[], number] | Promise<[T[], number]> | any, res?: Response): Promise<IBaseListResponse<T>> {
  if(isPromise(data)) {
    data = await data
  }
  if(res) {
    res.setHeader('X-Total-Length', data[1])
  }
  return {
    total: data[1],
    data: data[0]
  }
}
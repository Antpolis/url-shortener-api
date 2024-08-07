import { ISearchParams } from "./ISearchParams";

export interface ISearchDomain extends ISearchParams {
  system?: number
  active?: number
  domain?: string
}
import { IQuerySearchParams } from './IQueryParams';

export interface IQuerySearchDomain extends IQuerySearchParams {
  system?: number;
  active?: number;
  domain?: string;
}

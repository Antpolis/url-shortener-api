export interface IQuerySearchParams {
  page: number;
  take: number;
  order?: string;
  orderBy?: any;
  offset?: number;
  columnToSort?: string;
  searchText?: string;
  deleted?: boolean;
}

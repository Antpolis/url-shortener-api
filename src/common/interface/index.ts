export interface ICommonSearchRequest {
  page?: number;
  take?: number;
  searchText?: string;
  skip?: number;
  limit?: number;
  include?: string
}

export interface ISearchRequest extends ICommonSearchRequest {}

export const SearchSkipHelper = (searchRequest: ICommonSearchRequest) => {
  if (!searchRequest.page) {
    searchRequest.page = 0;
  }

  if (!searchRequest.take) {
    searchRequest.take = 30;
  }

  searchRequest.skip = searchRequest.page * searchRequest.take;

  return searchRequest;
};
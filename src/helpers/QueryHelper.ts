import { SelectQueryBuilder } from "typeorm";
import { ISearchParams } from "../common/interface/ISearchParams";

export const QueryHelper = <T extends ISearchParams>(params: T) => {
  if(!params.limit)
    params.limit = 15
  if(!params.page) 
    params.page = 0
  if(!params.orderBy) {
    params.orderBy = {}
    if(params.order) {
      for(var order of params.order.split(',')) {
        const orderParts = order.split('|')
        if(orderParts.length==2)
          params.orderBy[orderParts[0]] = orderParts[1]
      }
    }
  }
  

  params.offset = params.page * params.limit
  return params
}

export const ConfigQuery = <T extends ISearchParams>(params: T, query: SelectQueryBuilder<any>, searchTextCol?: string[]) => {
  params = QueryHelper(params)
  if(+params.limit >= 0) {
    query.take(params.limit)
    query.skip(params.offset)
  }
  if(params.orderBy) {
    for(const key in params.orderBy) {
      query.addOrderBy(key, params.orderBy[key] as 'ASC' | 'DESC')
    }
  }
  if(searchTextCol && searchTextCol.length && params.searchText) {
    searchTextCol.forEach((s :any) => {
      let param:any = {}
      param[s] = '%'+params.searchText.trim()+'%'
      query = query
        .andWhere(s + ' like :'+s, param)
    });
  }
  if(params.countryOfOrigin) {
    query.alias
    query = query
      .andWhere(`${query.alias}.originatedISOCountryCode=:originatedISOCountryCode`, {originatedISOCountryCode: params.countryOfOrigin})
  }
  return query
}
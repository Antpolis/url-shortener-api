import { Repository, SelectQueryBuilder } from 'typeorm';
import { IQuerySearchParams } from '../interface/IQueryParams';

export abstract class RepositoryService<T> {
  public readonly repo: Repository<T>;

  abstract listQuery(searchParams?: IQuerySearchParams): SelectQueryBuilder<T>;
  abstract getByPrimaryKeyQuery(id: number | string): SelectQueryBuilder<T>;
  abstract save(): Promise<T>;
  abstract delete(id: number | string): Promise<T | null | undefined>;
}

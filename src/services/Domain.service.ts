import { Repository } from 'typeorm';
import { Injectable } from '@nestjs/common';
import { Domain } from 'src/entities/Domain.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { IQuerySearchDomain } from 'src/common/interface/IQuerySearchDomain';

@Injectable()
export class DomainService {
  constructor(
    @InjectRepository(Domain)
    public readonly repo: Repository<Domain>,
  ) {}

  list(searchParams: IQuerySearchDomain) {
    const query = this.repo.createQueryBuilder('domain');
    if (searchParams.domain) {
      query.andWhere('domain.domain like :domain', {
        domain: searchParams.domain,
      });
    }
    if (searchParams.active) {
      query.andWhere('domain.active = :active', {
        active: searchParams.active,
      });
    }
    if (searchParams.searchText) {
      query.andWhere(
        'domain.domain like :domain or domain.defaultLink like :domain',
        { domain: '%' + searchParams.searchText + '%' },
      );
    }
    return query;
  }

  getDomainById(id: number) {
    const query = this.repo
      .createQueryBuilder('domain')
      .where('domain.id = :id', { id: id });
    return query;
  }

  getDomainByName(domain: string) {
    const query = this.repo
      .createQueryBuilder('domain')
      .where('domain.domain = :domain', {
        domain: domain,
      });
    return query;
  }
}

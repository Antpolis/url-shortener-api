import { Repository } from 'typeorm';
import { ISearchRequest, SearchSkipHelper } from '../common/interface';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Request } from 'src/entities/Request.entity';

@Injectable()
export class RequestService {
  constructor(
    @InjectRepository(Request)
    public readonly repo: Repository<Request>,
  ) {}

  getRequest() {
    const query = this.repo
      .createQueryBuilder('request')
      .leftJoinAndSelect('request.requestLocation', 'requestLocation');
    return query;
  }

  getRequestById(id: number) {
    const query = this.repo
      .createQueryBuilder('request')
      .where('request.id = :id', { id: id });
    return query;
  }

  getRequestByUrlId(id: number) {
    const query = this.repo
      .createQueryBuilder('request')
      .where('request.URLID = :id', { id: id });
    return query;
  }

  getByUrlIDs(id: number[]) {
    const query = this.repo
      .createQueryBuilder('request')
      .where('request.URLID in (:...ids)', { ids: id });
    return query;
  }

  getRequests(search: ISearchRequest) {
    const helper = SearchSkipHelper(search);

    const query = this.repo
      .createQueryBuilder('request')
      .take(helper.take)
      .skip(helper.skip)
      .addOrderBy('request.id', 'DESC');
    return query;
  }

  getRequestWithUrlAndLocation(id: number) {
    const query = this.repo
      .createQueryBuilder('request')
      .leftJoinAndSelect(
        'request.requestLocation',
        'request.locationID = requestLocation.id',
      )
      .where('request.id = :id', { id: id });
    return query;
  }
}

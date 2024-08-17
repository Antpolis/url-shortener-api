import { SearchSkipHelper } from '../common/interface';
import { ISearchUrlParams } from '../common/interface/ISearchUrlParams';
import { removeHttpPrefix } from '../helpers/removeHttpsPrefix';
import { ISearchUrlPeriodParams } from '../common/interface/ISearchUrlPeriodParams';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Url } from 'src/entities/Url.entity';
import { Repository } from 'typeorm';
import { Tag } from 'src/entities/Tag.entity';
import { RequestService } from './Request.service';

@Injectable()
export class UrlService {
  constructor(
    @InjectRepository(Url)
    public readonly repo: Repository<Url>,
    private readonly requestService: RequestService,
  ) {}

  getUrl() {
    const query = this.repo
      .createQueryBuilder('url')
      .leftJoinAndSelect('url.domain', 'domain')
      .leftJoinAndSelect('url.account', 'account')
      .leftJoinAndSelect('url.tags', 'tag');
    return query;
  }

  getUrlById(id: number) {
    const query = this.repo
      .createQueryBuilder('url')
      .leftJoinAndSelect('url.domain', 'domain')
      .leftJoinAndSelect('url.account', 'account')
      .leftJoinAndSelect('url.tags', 'tag')
      .where('url.id = :id', { id: id });
    return query;
  }

  getUrlByHash(hash: string) {
    const query = this.repo
      .createQueryBuilder('url')
      .leftJoinAndSelect('url.domain', 'domain')
      .leftJoinAndSelect('url.account', 'account')
      .leftJoinAndSelect('url.tags', 'tag')
      .where('url.active = 1')
      .andWhere('url.hash = :hash', { hash: hash });
    return query;
  }

  async getUrlByPeriod(searchParams: ISearchUrlPeriodParams) {
    let urlQuery = this.repo.createQueryBuilder('url');

    if (searchParams.url) {
      urlQuery = urlQuery.where('url.redirectURL like :url', {
        url: searchParams.url + '%',
      });
    }

    if (searchParams.shortenerURL) {
      urlQuery = urlQuery.where('url.fullURL in (:...shortenURLs)', {
        shortenURLs: searchParams.shortenerURL
          ?.split(',')
          .map((d) => d.replace('https://', '').trim()),
      });
    }

    if (searchParams?.include != '') {
      const includeRelationship = searchParams?.include
        .split(',')
        ?.map((d) => d.trim());
      if (
        includeRelationship.length > 0 &&
        includeRelationship.findIndex((a) => a === 'client')
      ) {
        urlQuery = urlQuery.leftJoinAndMapOne(
          'client',
          () => Tag,
          'tag',
          'url.clientID = tag.id',
        );
      }
      if (
        includeRelationship.length > 0 &&
        includeRelationship.findIndex((a) => a === 'campaign')
      ) {
        urlQuery = urlQuery.leftJoinAndMapOne(
          'campaign',
          () => Tag,
          'tag',
          'url.campaignID = tag.id',
        );
      }
    }

    const urlData = await urlQuery.getMany();
    if (urlData.length > 0) {
      const requestQuery = this.requestService
        .getByUrlIDs(urlData.map((d) => d.id))
        .select('count(request.id) as clicks, request.URLID')
        .andWhere(
          'request.requestDate >= :startDate and request.requestDate <= :endDate',
          {
            startDate: searchParams.startDate,
            endDate: searchParams.endDate,
          },
        )
        .addGroupBy('request.URLID');

      const requestData = await requestQuery.getRawMany();

      const foundClicksURL = urlData.map((u) => {
        const _requestData = requestData.find((r) => +r['URLID'] == u.id) || {
          clicks: 0,
        };
        return {
          ...u,
          clicks: +_requestData['clicks'],
        };
      });
      return foundClicksURL;
    }
    return [];
  }

  getUrlByOwnerID(ownerID: number) {
    const query = this.repo
      .createQueryBuilder('url')
      .innerJoinAndSelect('url.domain', 'domain')
      .innerJoinAndSelect('url.account', 'account')
      .leftJoinAndSelect('url.tags', 'tag')
      .where('url.ownerID = :ownerID', { ownerID: ownerID });
    return query;
  }

  getUrls(searchParams: ISearchUrlParams) {
    const helper = SearchSkipHelper(searchParams);
    const status = searchParams.status || 1;
    const customSearch = searchParams.customSearch || [];
    const domain = searchParams.domain || '';
    const withTGDesc = searchParams.withTGDesc;
    const email = searchParams.ownerEmail || '';

    let query = this.repo
      .createQueryBuilder('url')
      .innerJoinAndSelect('url.domain', 'domain')
      .innerJoinAndSelect('url.account', 'account')
      .leftJoinAndSelect('url.tags', 'tag');
    if (searchParams.searchText && searchParams.searchText != '') {
      const searchTerm = removeHttpPrefix(searchParams.searchText);
      query = query.andWhere(
        `(url.description like :value or url.fullURL like :value or url.redirectURL like :value or tag.value like :value)`,
        {
          value: '%' + searchTerm + '%',
        },
      );
    }

    if (customSearch.length > 0) {
      for (const term of customSearch) {
        const searchTerm = removeHttpPrefix(term);
        query = query.andWhere(
          `(url.description like :value or url.fullURL like :value or url.redirectURL like :value or tag.value like :value)`,
          {
            value: '%' + searchTerm + '%',
          },
        );
      }
    }

    if (withTGDesc == 'true') {
      query = query.andWhere('url.description like :description', {
        description: '%TG%',
      });
    }

    if (domain != '') {
      query = query.andWhere('url.fullURL like :linkUrl', {
        linkUrl: `%${domain}%`,
      });
    }

    if (searchParams.clientIDs?.length > 0) {
      query = query.andWhere(`url.clientID IN (:...clientIDs)`, {
        clientIDs: searchParams.clientIDs,
      });
    }

    if (searchParams.campaignIDs?.length > 0) {
      query = query.andWhere(`url.campaignID IN (:...campaignIDs)`, {
        campaignIDs: searchParams.campaignIDs,
      });
    }

    if (email != '') {
      query = query.andWhere(`account.contactEmail = :email`, {
        email: searchParams.ownerEmail,
      });
    }

    query = query.andWhere('url.active = :status', { status: status });
    query = query.take(helper.take);
    query = query.skip(helper.skip);
    query = query.addOrderBy('url.id', 'DESC');
    return query;
  }
}

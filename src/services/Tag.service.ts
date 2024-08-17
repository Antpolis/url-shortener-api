import { Repository, Like, Brackets } from 'typeorm';
import { SearchSkipHelper } from '../common/interface';
import { ISearchTagParams } from '../common/interface/ISearchTagParams';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Tag } from 'src/entities/Tag.entity';

@Injectable()
export class TagService {
  constructor(
    @InjectRepository(Tag)
    public readonly repo: Repository<Tag>,
  ) {}

  createTagByKey(key: string, value?: string) {
    return this.repo.create({
      key: key,
      value: value,
    });
  }

  getTag(searchParams: ISearchTagParams) {
    const helper = SearchSkipHelper(searchParams);
    let query = this.repo.createQueryBuilder('tag');

    if (searchParams.name) {
      query = query.andWhere('tag.value = :name', { name: searchParams.name });
    }

    if (searchParams.key) {
      query = query.andWhere('tag.key = :key', { key: searchParams.key });
    }

    query = query.addOrderBy('tag.id', 'DESC');

    query = query.take(helper.take);
    query = query.skip(helper.skip);

    return query;
  }

  list(searchParams: ISearchTagParams) {
    searchParams = SearchSkipHelper(searchParams);
    let query = this.repo.createQueryBuilder('tag');

    if (searchParams.id) {
      query = query.andWhere('tag.id = :id', { id: searchParams.id });
    }

    if (searchParams.name) {
      query = query.andWhere('tag.value = :name', { name: searchParams.name });
    }

    if (searchParams.key) {
      query = query.andWhere('tag.key = :key', { key: searchParams.key });
    }

    if (searchParams.searchText && searchParams.searchText != 'undefined') {
      query = query.andWhere('tag.value like :searchStr', {
        searchStr: '%' + decodeURIComponent(searchParams.searchText) + '%',
      });
    }

    if (searchParams.searchTags && searchParams.searchTags.length > 0) {
      if (!Array.isArray(searchParams.searchTags)) {
        searchParams.searchTags = [searchParams.searchTags];
      }
      query = query.andWhere('UPPER(tag.value) in (:...searchTags)', {
        searchTags: searchParams.searchTags.map((t) => t.toUpperCase()),
      });
    }

    if (searchParams.searchIDs && searchParams.searchIDs.length > 0) {
      if (!Array.isArray(searchParams.searchIDs)) {
        searchParams.searchIDs = [searchParams.searchIDs];
      }
      query = query.andWhere('tag.id in (:...searchIDs)', {
        searchIDs: searchParams.searchIDs,
      });
    }

    query = query.addOrderBy('tag.id', 'DESC');

    query = query.take(searchParams.take);
    query = query.skip(searchParams.skip);
    return query;
  }

  findTag(searchParams: ISearchTagParams) {
    // console.log("searchParams",searchParams);
    const helper = SearchSkipHelper(searchParams);
    let query = this.repo
      .createQueryBuilder('tag')
      .leftJoinAndSelect('tag.urls', 'url');

    if (searchParams.id) {
      query = query.andWhere('tag.id = :id', { id: searchParams.id });
    }

    if (searchParams.name) {
      query = query.andWhere('tag.value = :name', { name: searchParams.name });
    }

    if (searchParams.key) {
      query = query.andWhere('tag.key = :key', { key: searchParams.key });
    }

    if (searchParams.searchText && searchParams.searchText != 'undefined') {
      query = query.andWhere('tag.value like :searchStr', {
        searchStr: '%' + searchParams.searchText + '%',
      });
    }

    query = query.addOrderBy('tag.id', 'DESC');

    query = query.take(helper.take);
    query = query.skip(helper.skip);

    return query;
  }

  async findOrCreate(model: Tag) {
    const findModel = await this.repo.findOne({
      where: {
        key: model.key.trim(),
        value: Like(model.value.trim()),
      },
    });
    if (findModel) return findModel;

    return await this.repo.save(model);
  }

  findByValueOrUUID(tag: string, value?: string[], UUID?: string[]) {
    let query = this.repo.createQueryBuilder('tag');
    query = query.andWhere(
      new Brackets((qb) => {
        qb = qb.andWhere(`tag.key = :tagName`, { tagName: tag });
        qb = qb.andWhere(
          new Brackets((qb) => {
            if (value?.length > 0) {
              qb = qb.orWhere(`tag.value in (:...campaignValue)`, {
                campaignValue: value,
              });
            }
            if (UUID?.length > 0) {
              qb = qb.orWhere(`tag.uuid in (:...campaignUUIDs)`, {
                campaignUUIDs: UUID,
              });
            }
            return qb;
          }),
        );
        return qb;
      }),
    );
    return query;
  }
}

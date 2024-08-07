import { Service } from "typedi";
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  DeleteDateColumn,
  JoinTable,
  ManyToMany,
  Repository,
  EntityRepository,
  SelectQueryBuilder,
  Brackets,
  getCustomRepository,
} from "typeorm";
import { Domain } from "./DomainRepository";
import { Tag, TagRepository } from "./TagRepository";
import { Account } from "./AccountRepository";
import { ISearchRequest, SearchSkipHelper } from "../common/interface";
import { ISearchUrlParams } from "../common/interface/ISearchUrlParams";
import { removeHttpPrefix } from "../helpers/removeHttpsPrefix";
import { ISearchUrlPeriodParams } from "../common/interface/ISearchUrlPeriodParams";
import { RequestRepository } from "./RequestRepository";

@Entity("url")
export class Url {
  @PrimaryGeneratedColumn({ unsigned: true })
  id: number;

  @Column({ type: "int", nullable: true })
  domainID?: number;

  @Column({ type: "text", nullable: true })
  redirectURL?: string;

  @Column({ type: "varchar", length: 255, nullable: true })
  fullURL?: string;

  @Column({ type: "int", nullable: true })
  accountID?: number;

  @Column({ type: "int", nullable: true })
  ownerID?: number;

  @Column({ type: "text", nullable: true })
  description?: string;

  @Column({ type: "varchar", length: 125, nullable: true })
  hash?: string;

  @Column({ type: "datetime", nullable: true })
  lastRequested?: Date;

  @Column({ type: "int", nullable: true })
  totalRequested?: number;

  @Column({ type: "int", nullable: true })
  totalUniqueRequested?: number;

  @Column({ type: "datetime", nullable: true })
  activeOn?: Date;

  @Column({ type: "datetime", nullable: true })
  expiredOn?: Date;

  @Column({ type: "tinyint", nullable: true })
  active?: number;

  @Column({ type: "datetime", nullable: true })
  createdAt?: Date;

  @Column({ type: "datetime", nullable: true })
  updatedAt?: Date;

  @Column({ type: "int", nullable: true })
  campaignID:	number;

  @Column({ type: "int", nullable: true })
	clientID:	number;

  @DeleteDateColumn({ name: "deletedAt", nullable: true })
  public deletedAt?: Date;

  client?: Tag;

  campaign?: Tag;
  
  @JoinColumn({ name: "domainID" })
  @ManyToOne(() => Domain, (domain) => domain.url)
  domain: Domain;

  @JoinColumn({ name: "ownerID" })
  @ManyToOne(() => Account, (account) => account.url)
  account: Account;

  @ManyToMany(() => Tag, (tag) => tag.urls, { cascade: ["insert", "update"] })
  @JoinTable()
  tags: Tag[];
}

export class NewUrlEntity {
  @PrimaryGeneratedColumn({ unsigned: true })
  id?: number;

  @Column({ type: "int", nullable: true })
  domainID?: number;

  @Column({ type: "varchar", length: 255, nullable: true })
  domainName?: string;

  @Column({ type: "text", nullable: false })
  redirectURL?: string;

  @Column({ type: "int", nullable: true })
  accountID?: number;

  @Column({ type: "text", nullable: true })
  ownerName?: string;

  @Column({ type: "text", nullable: true })
  description?: string;

  @Column({ type: "varchar", length: 255, nullable: true })
  fullURL?: string;

  @Column({ type: "varchar", length: 255, nullable: true })
  hash?: string;

  @Column({ type: "tinyint", nullable: true })
  active?: number;

  @Column({ type: "varchar", length: 255, nullable: false })
  clientName: string;

  @Column({ type: "varchar", length: 255, nullable: false })
  campaignName: string;

  @Column({ type: "datetime", nullable: true })
  createdAt?: Date;

  @Column({ type: "datetime", nullable: true })
  updatedAt?: Date;

  @DeleteDateColumn({ name: "deletedAt", nullable: true })
  public deletedAt?: Date;

  

  @ManyToMany(() => Tag, (tag) => tag.urls, { cascade: ["insert", "update"] })
  @JoinTable()
  tags?: Tag[];
}

@Service()
@EntityRepository(Url)
export class UrlRepository extends Repository<Url> {

  get tagRepo() {
    return getCustomRepository(TagRepository);
  }

  get requestRepo() {
    return getCustomRepository(RequestRepository)
  }

  getUrl() {
    const query = this.createQueryBuilder("url")
      .leftJoinAndSelect("url.domain", "domain")
      .leftJoinAndSelect("url.account", "account")
      .leftJoinAndSelect("url.tags", "tag");
    return query;
  }

  getUrlById(id: number) {
    const query = this.createQueryBuilder("url")
      .leftJoinAndSelect("url.domain", "domain")
      .leftJoinAndSelect("url.account", "account")
      .leftJoinAndSelect("url.tags", "tag")
      .where("url.id = :id", { id: id });
    return query;
  }

  getUrlByHash(hash: string) {
    const query = this.createQueryBuilder("url")
      .leftJoinAndSelect("url.domain", "domain")
      .leftJoinAndSelect("url.account", "account")
      .leftJoinAndSelect("url.tags", "tag")
      .where("url.active = 1")
      .andWhere("url.hash = :hash", { hash: hash });
    return query;
  }

  async getUrlByPeriod(searchParams: ISearchUrlPeriodParams) { 
    let urlQuery = this.createQueryBuilder("url")

    if(searchParams.url) {
      urlQuery = urlQuery.where("url.redirectURL like :url", { url: searchParams.url + "%"});
    }

     
    if(searchParams.shortenerURL) {
      urlQuery = urlQuery.where("url.fullURL in (:...shortenURLs)", { shortenURLs: searchParams.shortenerURL?.split(",").map(d=>d.replace("https://", "").trim()) });
    }

    if(searchParams?.include != "") {
      const includeRelationship = searchParams?.include.split(',')?.map(d=>d.trim())
      if(includeRelationship.length>0 && includeRelationship.findIndex(a=>a === 'client')) {
        urlQuery = urlQuery.leftJoinAndMapOne('client', ()=> Tag, 'tag', 'url.clientID = tag.id')
      }
      if(includeRelationship.length>0 && includeRelationship.findIndex(a=>a === 'campaign')) {
        urlQuery = urlQuery.leftJoinAndMapOne('campaign', ()=> Tag, 'tag', 'url.campaignID = tag.id')
      }
    }

    
    
    const urlData = await urlQuery.getMany();
    if(urlData.length > 0) { 
      const requestQuery = this.requestRepo
      .getRequestByUrlIds(urlData.map(d=>d.id))
      .select("count(request.id) as clicks, request.URLID")
      .andWhere('request.requestDate >= :startDate and request.requestDate <= :endDate', {
        startDate: searchParams.startDate,
        endDate: searchParams.endDate
      })
      .addGroupBy('request.URLID')
    
      const requestData = await requestQuery.getRawMany()

      const foundClicksURL = urlData.map(u=> {
        const _requestData = requestData.find(r=>+r['URLID'] == u.id) || {'clicks': 0}
        return {
          ...u,
          clicks: +_requestData['clicks']
        }
      })
      return foundClicksURL
    }
    return [];
  }

  getUrlByOwnerID(ownerID: number) {
    const query = this.createQueryBuilder("url")
      .innerJoinAndSelect("url.domain", "domain")
      .innerJoinAndSelect("url.account", "account")
      .leftJoinAndSelect("url.tags", "tag")
      .where("url.ownerID = :ownerID", { ownerID: ownerID });
    return query;
  }

  getUrls(searchParams: ISearchUrlParams) {

    const helper = SearchSkipHelper(searchParams);
    const status = searchParams.status || 1;
    const customSearch = searchParams.customSearch || [];
    const domain = searchParams.domain || '';
    const withTGDesc = searchParams.withTGDesc;
    const client = searchParams.client || [];
    const campaign = searchParams.campaign || [];
    const email = searchParams.ownerEmail || '';

    let query = this.createQueryBuilder("url")
      .innerJoinAndSelect("url.domain", "domain")
      .innerJoinAndSelect("url.account", "account")
      .leftJoinAndSelect("url.tags", "tag")
    if(searchParams.searchText && searchParams.searchText != '') {
      const searchTerm = removeHttpPrefix(searchParams.searchText);
      query = query.andWhere(`(url.description like :value or url.fullURL like :value or url.redirectURL like :value or tag.value like :value)`,{
        'value': "%"+searchTerm+"%",
      })
    }

    if(customSearch.length>0){
      for(const term of customSearch) {
        const searchTerm = removeHttpPrefix(term);
        query = query.andWhere(`(url.description like :value or url.fullURL like :value or url.redirectURL like :value or tag.value like :value)`,{
          'value': "%"+searchTerm+"%",
        })
      }
    }
  
    if(withTGDesc == 'true'){
      query = query.andWhere('url.description like :description', {
        'description': "%TG%",
      })
    }

    if(domain != ''){
      query = query.andWhere("url.fullURL like :linkUrl", { linkUrl: `%${domain}%` });
    }

    if (searchParams.clientIDs?.length>0) {      
      query = query.andWhere(`url.clientID IN (:...clientIDs)`, { clientIDs: searchParams.clientIDs})
    } 

    if(searchParams.campaignIDs?.length>0) {      
      query = query.andWhere(`url.campaignID IN (:...campaignIDs)`, { campaignIDs: searchParams.campaignIDs})

    }

    if(email != '') {
      query = query.andWhere(`account.contactEmail = :email`,{email: searchParams.ownerEmail})  
    }

    
    query =  query.andWhere("url.active = :status", { status: status })
    query = query.take(helper.take)
    query = query.skip(helper.skip)
    query = query.addOrderBy("url.id", "DESC");
    return query;
  }


}

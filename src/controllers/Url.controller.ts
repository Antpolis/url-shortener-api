import { JsonController, Param, Get, Post, Put, Delete, QueryParams, Body, CurrentUser, UseInterceptor, BadRequestError, NotFoundError, Authorized } from "routing-controllers";
import { Domain, DomainRepository } from "../repositories/DomainRepository";
import { Url, UrlRepository } from "../repositories/UrlRepository";
import { RequestRepository } from "../repositories/RequestRepository";
import { Tag, TagRepository } from "../repositories/TagRepository";
import { getCustomRepository } from "typeorm";
import { restore, softDelete, generateNewHash } from "../helpers";
import { AccountRepository } from "../repositories/AccountRepository";
import { UrlOwnerLogRepository, Url_Owner_Log } from "../repositories/UrlOwnerLogRepository";
import { User, UserRepository } from "../repositories/UserRepository";
import { IQueryParams } from "../common/interface/IQueryParams";
import { ISearchUrlParams } from "../common/interface/ISearchUrlParams";
import { ICreateUrlParams } from "../common/interface/ICreateUrlParams";
import { ListResponseInterceptor } from "../interceptors/ListResponseInterceptor";
import { AWSConfig } from "../../config/aws";
import { ISearchUrlPeriodParams } from "../common/interface/ISearchUrlPeriodParams";

let result: any;
let query: any;

@JsonController("/url")
export class UrlController {
  urlRepo: UrlRepository;
  urlOwnerLogRepo: UrlOwnerLogRepository;
  accountRepo: AccountRepository;
  reqRepo: RequestRepository;
  domainRepo: DomainRepository;
  tagRepo: TagRepository;
  userRepo: UserRepository;

  constructor() {
    this.urlRepo = getCustomRepository(UrlRepository);
    this.urlOwnerLogRepo = getCustomRepository(UrlOwnerLogRepository);
    this.accountRepo = getCustomRepository(AccountRepository);
    this.reqRepo = getCustomRepository(RequestRepository);
    this.domainRepo = getCustomRepository(DomainRepository);
    this.tagRepo = getCustomRepository(TagRepository);
    this.userRepo = getCustomRepository(UserRepository);
  }
  
  @Authorized(AWSConfig.auth.darvisRole)
  @Get("/sortData")
  async getSortedUrlsBasedOnColumn(@QueryParams() req: IQueryParams) {
    // Query Params should be in this format{ page: 0, take: 30, columnToSort: description, sortDirection: DESC }
    const page = req.page;
    const take = req.take;
    const columnToSort = req.columnToSort;
    const sortDirection = req.sortDirection;
    let urls: Url[] = new Array();

    // Check if there is a pre-existing date range
    if (req.startDate && req.endDate) {
      const startDate = req.startDate;
      const endDate = req.endDate;
      const newArr = new Array();

      // Get urls that are between this date
      const scopedUrlsByDateQuery = this.urlRepo
        .getUrls({ page: req.page, take: req.take })
        .where("CAST(url.createdAt AS DATE) >= :startDate", { startDate: startDate })
        .andWhere("CAST(url.createdAt AS DATE) <= :endDate", { endDate: endDate });

      if (columnToSort !== "none") {
        if (columnToSort === "campaignName" || columnToSort === "clientName") {
          let key = "client";
          if (columnToSort === "campaignName") key = "campaign";

          urls = await scopedUrlsByDateQuery
            .andWhere("tag.key = :key", { key: key })
            .addOrderBy(`tag.value`, sortDirection)
            .getMany();
        } else if (columnToSort === "ownerName") {
          urls = await scopedUrlsByDateQuery.addOrderBy(`account.name`, sortDirection).getMany();
        } else {
          urls = await scopedUrlsByDateQuery.addOrderBy(`url.${columnToSort}`, sortDirection).getMany();
        }
      } else {
        urls = await scopedUrlsByDateQuery.getMany();
      }

      for (const u of urls) {
        const totalRequests = await this.reqRepo
          .getRequestByUrlId(u.id)
          .andWhere("CAST(createdAt AS DATE) >= :startDate", { startDate: startDate })
          .andWhere("CAST(createdAt AS DATE) <= :endDate", { endDate: endDate })
          .andWhere("deletedAt IS NULL")
          .getCount();

        const uniqueRequests = await this.reqRepo
          .getRequestByUrlId(u.id)
          .andWhere("CAST(createdAt AS DATE) >= :startDate", { startDate: startDate })
          .andWhere("CAST(createdAt AS DATE) <= :endDate", { endDate: endDate })
          .andWhere("isUnique = 1")
          .andWhere("deletedAt IS NULL")
          .getCount();

        u.totalRequested = totalRequests;
        u.totalUniqueRequested = uniqueRequests;

        newArr.push(u);
      }

      const numberOfURLs = await scopedUrlsByDateQuery.getCount();
      return {
        urls: newArr,
        numberOfURLs,
      };
    } else {
      if (columnToSort === "campaignName" || columnToSort === "clientName") {
        let key = "client";
        if (columnToSort === "campaignName") key = "campaign";

        urls = await this.urlRepo
          .getUrls({ page: page, take: take })
          .where("tag.key = :key", { key: key })
          .addOrderBy(`tag.value`, sortDirection)
          .getMany();
      } else if (columnToSort === "ownerName") {
        urls = await this.urlRepo.getUrls({ page: page, take: take }).addOrderBy(`account.name`, sortDirection).getMany();
      } else {
        urls = await this.urlRepo.getUrls({ page: page, take: take }).addOrderBy(`url.${columnToSort}`, sortDirection).getMany();
      }

      const numberOfURLs = await this.urlRepo.getUrl().getCount();
      return {
        urls,
        numberOfURLs,
      };
    }
  }
  
  @Authorized(AWSConfig.auth.darvisRole)
  @Get("/id=:id")
  async getUrlById(@Param("id") id: number) {
    return await this.urlRepo.getUrlById(id).getOne();
  }

  @Authorized(AWSConfig.auth.darvisRole)
  @Get("/get/:id")
  async get(@Param("id") id: number) {
    return await this.urlRepo.getUrlById(id).getOne();
  }

  @Authorized(AWSConfig.auth.darvisRole)
  @Get("/owner=:ownerID")
  async getUrlByOwnerID(@Param("ownerID") ownerID: number) {
    return await this.urlRepo.getUrlByOwnerID(ownerID).getMany();
  }

  @Authorized(AWSConfig.auth.darvisRole)
  @Get("/ownerEmail=:ownerEmail")
  async getUrlByOwnerEmail(@Param("ownerEmail") ownerEmail: string) {
    let owner = await this.accountRepo.getAccountByEmail(JSON.parse(ownerEmail)).getOne();
    if(owner){
      const result = await this.urlRepo.getUrls({ownerID: owner.id})
      .leftJoinAndSelect("url.client", "client")
      .leftJoinAndSelect("url.campaign", "campaign")
      .getManyAndCount();
    if(result[1]>0) {
      for(var i=0; i<result[0].length; i++) {
        const data = result[0][i]
        if(data.tags === undefined) data.tags = []
        const clientModel = await data.client;
        const campaign = await data.campaign;
        if(clientModel) data.tags.push(clientModel)
        if(campaign) data.tags.push(campaign)
        result[0][i].tags = data.tags.filter((t,i,f)=>f.findIndex(e=>e.id===t.id)===i)
      }
    }
    
    return result
    }
  }

  @Authorized(AWSConfig.auth.darvisRole)
  @Get("/tag")
  @UseInterceptor(ListResponseInterceptor)
  async getUrlByTag(@QueryParams() req: ISearchUrlParams, @CurrentUser() user: User) {
    return this.list(req, user)
  }

  @Authorized(AWSConfig.auth.darvisRole)
  @Get("/list")
  @UseInterceptor(ListResponseInterceptor)
  async list(@QueryParams() req: ISearchUrlParams, @CurrentUser() user: User) {
    if(req.client?.length>0 || req.clientUUIDs?.length>0) {
      const clientModels = await this.tagRepo.findByValueOrUUID("client", req.client, req.clientUUIDs).getMany()
      if(clientModels && clientModels.length>0) {
        req.clientIDs = [].concat(req.clientIDs || [],clientModels.map(m=>m.id))
      }
    }

    if(req.campaign?.length>0 || req.campaignUUIDs?.length>0) {
      const campaignModels = await this.tagRepo.findByValueOrUUID('campaign', req.campaign, req.campaignUUIDs).getMany()
      if(campaignModels && campaignModels.length>0) {
        req.campaignIDs = [].concat(req.campaignIDs || [],campaignModels.map(m=>m.id))
      }
    }

    const result = await this.urlRepo.getUrls(req).getManyAndCount();
    const tagToSearch = [];
    if(result[1]>0) {
      for(var i=0; i<result[0].length; i++) {
        const data = result[0][i]
        
        if(data.tags === undefined) data.tags = []
        const client = data.tags.filter(t=>t).findIndex(t=>t.key==='client')
        if(client<0) {
          tagToSearch.push(data.clientID)
        }
        const campaign = data.tags.filter(t=>t).findIndex(t=>t.key==='campaign')
        if(campaign<0) {
          tagToSearch.push(data.campaignID)
        }
      }
      if(tagToSearch.length>0) {
        const tagResults = await this.tagRepo.createQueryBuilder('tag')
        .where('tag.id IN (:...ids)', {ids: tagToSearch})
        .getMany()
        for(var i=0; i<result[0].length; i++) {
          const data = result[0][i]
          if(data.tags === undefined) data.tags = []          
          const client = data.tags.filter(t=>t).findIndex(t=>t.key==='client')          
          if(client<0) {
            const tag = tagResults.filter(t=>t != null).find(t=>t.id===data.clientID)
            data.tags.push(tag)
          }
          const campaign = data.tags.filter(t=>t).findIndex(t=>t.key==='campaign')
          if(campaign<0) {
            const tag = tagResults.filter(t=>t != null).find(t=>t.id===data.campaignID)
            data.tags.push(tag)
          }
          result[0][i] = data
        }
      }
      
    }
    
    return result
  }

  @Authorized(AWSConfig.auth.darvisRole)
  @Get("/url=:url")
  async checkIfRedirectUrlIsUsed(@Param("url") url: string) {
    let decodedUrl = decodeURI(url);
    if (decodedUrl.charAt(decodedUrl.length - 1) === "/") {
      decodedUrl = decodedUrl.slice(0, -1);
    }
    result = await this.urlRepo.getUrl().where("url.redirectURL = :url", { url: decodedUrl }).getOne();

    if (result != undefined || result != null) {
      return {
        status: "This URL has already been used",
      }
    } else {
      return {
        status: "This URL has not been used",
      };
    }
  }

  @Authorized(AWSConfig.auth.darvisRole)
  @Post("/create")
  async addNewUrl(@Body({ validate: true }) model: ICreateUrlParams, @CurrentUser() user: any) {

    let req = model;
    if (req.accountID == null || req.accountID == 0) {
      try {
        if (user.data !== undefined) {
          //GET the ID of the current-user for the account
          let userDetails = await this.userRepo.findByEmail(user.data).getOne();
          if (userDetails === undefined) {
            userDetails = await this.userRepo.createNewIncognitoUser(user.data);
            req.accountID = userDetails.id
          }
        }
      } catch (error) {
        console.log("Error: getting error ", error);
      }
    }

    let newUrl: Url = new Url();
    const currentDateAndTime: Date = new Date();
    let domainUrl: any;
    let domainID: any;
    let client: any;
    let campaign: any;

    let tagEntity: Tag = new Tag();
    tagEntity.createdAt = currentDateAndTime;

    newUrl.createdAt = currentDateAndTime;
    newUrl.updatedAt = currentDateAndTime;
    newUrl.active = 1;
    newUrl.redirectURL = req.redirectURL;
    newUrl.description = req.description;
    newUrl.accountID = req.accountID;
    newUrl.campaignID = req.campaignID;
    newUrl.clientID = req.clientID;

    if (req.ownerName) {
      try {
        const accountEntity = await this.accountRepo.getAccountByName(req.ownerName).getOne();
        newUrl.ownerID = accountEntity.id;
      } catch (error) {
        console.log("Error get the account by name", error);
      }
    } else newUrl.ownerID = req.accountID;

    if (newUrl.redirectURL.substr(newUrl.redirectURL.length - 1) === "/") {
      newUrl.redirectURL = newUrl.redirectURL.slice(0, -1);
    }

    // Find the domainUrl using domainID
    if(req.domainID) {
      
      const domainModel = await this.domainRepo.findOne(req.domainID);
      if(domainModel) {
        newUrl.domainID = req.domainID;
        domainUrl = domainModel.domain
      }     

    } else if (req.domainName) {
      await this.domainRepo
        .getDomain()
        .where("domain.domain = :domainName", { domainName: req.domainName })
        .getOne()
        .then(function (result: Domain) {
          domainUrl = result.domain;
          domainID = result.id;
        }).catch(function (error: any) {
          console.log("Error: Find domain url ", error)
        });
      newUrl.domainID = domainID;
    }
   

    // Generate hash if req.hash is empty
    if (!req.hash) {
      let generatedHash = generateNewHash(5);
      newUrl.hash = generatedHash;
    } else {
      newUrl.hash = req.hash;
    }

    // Generate the fullUrl, which is domainUrl + Hash
    newUrl.fullURL = domainUrl + "/" + req.hash;

    if(!req.clientID) {
      // Check if the clientName is available in the db
      if (req.clientName) {
        client = await this.tagRepo.getTag({name:req.clientName, key:"client"}).getOne();
        // Create new entry if clientName is not found in tag table
        if (client === undefined) {
          await this.tagRepo.saveNewTag("client", req.clientName);
        }
      }

      let newClient = await this.tagRepo.getTag({name:req.clientName, key:"client"}).getOne();
      newUrl.clientID = newClient.id;
    }
    
    if(!req.campaignID) {
      // Check if the campaignName is available in the db
      if (req.campaignName) {
        campaign = await this.tagRepo.getTag({name:req.campaignName, key:"campaign"}).getOne();
        // Create new entry if campaignName is not found in tag table
        if (campaign === undefined) {
          await this.tagRepo.saveNewTag("campaign", req.campaignName);
        }
      }

      let newCampaign = await this.tagRepo.getTag({name:req.campaignName, key:"campaign"}).getOne();
      newUrl.campaignID = newCampaign.id;
    }

    newUrl.tags = [];
    let clientTag = req.tags?.find(d=>d.key === 'client' && d.id === newUrl.clientID)
    if(!clientTag) {
      clientTag = await this.tagRepo.findOne(newUrl.clientID)
    }
    newUrl.tags.push(clientTag)

    let campaignTag = req.tags?.find(d=>d.key === 'campaign' && d.id === newUrl.campaignID)
    if(!campaignTag) {
      campaignTag = await this.tagRepo.findOne(newUrl.campaignID)
    }
    newUrl.tags.push(campaignTag)

    let newEntry: any;

    // While saving, catch for any errors
    try {
      newEntry = await this.urlRepo.save(newUrl)
      console.log(newEntry)
    }
    catch(err){ 
      throw new BadRequestError(err);
    }

    // Save into url_owner_log table
    let newLogEntity = new Url_Owner_Log();
    newLogEntity.urlID = newEntry.id;
    newLogEntity.ownerID = newUrl.ownerID;
    newLogEntity.createdAt = currentDateAndTime;
    try {
      await this.urlOwnerLogRepo.save(newLogEntity);
    } catch (err) {
      throw new BadRequestError(err);
    }

    return newEntry
  }

  @Authorized(AWSConfig.auth.darvisRole)
  @Put("/archive/:status/:id")
  async archiveUrl(@Param("id") id: number, @Param("status") status: string) {
    const url = await this.urlRepo.getUrlById(id).getOne();
    if(!url) {
      throw new NotFoundError("ID not found")
    }
    if (status != "archive") {
      url.active = 1;
      // Check if hash is being used currently
      const hash = url.hash;
      const result = await this.urlRepo.getUrlByHash(hash).getOne();
      if (result) {
        return "This hash is already being used by another URL";
      }
    } else {
      url.active = 0;
    }
    try {
      await this.urlRepo
        .update(id, {
          active: url.active,
        })
    } catch (err) {
      throw new BadRequestError(err);
    }
    return url
  }

  @Authorized(AWSConfig.auth.darvisRole)
  @Put("/update/:id")
  async updateUrl(@Body({ validate: true }) req: any, @Param("id") id: number) {

    const currentDateAndTime: Date = new Date();
    const originalEntity = await this.urlRepo.getUrlById(id).getOne();
    let newUrlEntity = new Url();

    if(req.domainID) {
      newUrlEntity.domainID = req.domainID;
    } else if (req.domainName) {
      const domain = await this.domainRepo.getDomainByName(req.domainName).getOne();
      if (domain === undefined) {
        return "No such domain exists";
      } else {
        if (newUrlEntity.domainID !== domain.id) {
          newUrlEntity.domainID = domain.id;
        }
      }
    }


    newUrlEntity.hash = req.hash;
    if (newUrlEntity.hash) {
      // Check if hash is being used
      const url = await this.urlRepo.getUrl()
        .andWhere("(url.hash = :hash and url.id <> :id)", { hash: req.hash, id: id })
        .andWhere("url.active = 1").getOne();
      if (url) {
        throw new BadRequestError("This hash is already being used by another URL");
      }
    }

    if (req.hash && req.domainName) newUrlEntity.fullURL = req.domainName + "/" + req.hash;
    else if (req.hash) newUrlEntity.fullURL = (await originalEntity.domain).domain + "/" + req.hash;
    else if (req.domainName) newUrlEntity.fullURL = req.domainName + "/" + originalEntity.hash;

    if (req.redirectURL) {
      const url = await this.urlRepo.getUrl().where("url.redirectURL = :url", { url: req.redirectURL }).getOne();
      if (url === undefined) {
        newUrlEntity.redirectURL = req.redirectURL;
      }
    }

    if (req.description) {
      newUrlEntity.description = req.description;
    }

    newUrlEntity.ownerID = req.ownerID
    newUrlEntity.accountID = req.accountID

    if (req.ownerName && newUrlEntity.ownerID == null) {
      const accountEntity = await this.accountRepo.getAccountByName(req.ownerName).getOne();
      newUrlEntity.ownerID = accountEntity.id;

      let newLogEntity = new Url_Owner_Log();
      newLogEntity.urlID = id;
      newLogEntity.ownerID = accountEntity.id;
      newLogEntity.createdAt = currentDateAndTime;
      try {
        await this.urlOwnerLogRepo.save(newLogEntity)  
      }
      catch(err){
        throw new BadRequestError(err);
      }
      return newLogEntity;
    }
    newUrlEntity.tags = req.tags || [];
    const clientIndex = newUrlEntity.tags.findIndex(t=>t.key==='client')
    if(clientIndex<0) { 
      if(!req.clientID) {
        // Check if the clientName is available in the db
        if (req.clientName) {
          const client = await this.tagRepo.getTag({name:req.clientName, key:"client"}).getOne();
          // Create new entry if clientName is not found in tag table
          if (client === undefined) {
            await this.tagRepo.saveNewTag("client", req.clientName);
          }
        }
  
        let newClient = await this.tagRepo.getTag({name:req.clientName, key:"client"}).getOne();
        newUrlEntity.clientID = newClient.id;
        newUrlEntity.tags.push(newClient)
      }
    } else {
      newUrlEntity.clientID = req.tags[clientIndex].id;
    }   
    
    const campaignIndex = newUrlEntity.tags.findIndex(t=>t.key==='campaign')
    if(campaignIndex<0) {
      if(!req.campaignID) {
        // Check if the campaignName is available in the db
        if (req.campaignName) {
          const campaign = await this.tagRepo.getTag({name:req.campaignName, key:"campaign"}).getOne();
          // Create new entry if campaignName is not found in tag table
          if (campaign === undefined) {
            await this.tagRepo.saveNewTag("campaign", req.campaignName);
          }
        }

        let newCampaign = await this.tagRepo.getTag({name:req.campaignName, key:"campaign"}).getOne();
        newUrlEntity.campaignID = newCampaign.id;
      }
    } else {
      newUrlEntity.campaignID = req.tags[campaignIndex].id;
    }

    newUrlEntity.updatedAt = currentDateAndTime;
    newUrlEntity.id = id;

    return await this.urlRepo.save(newUrlEntity)
  }

  @Authorized(AWSConfig.auth.darvisRole)
  @Put("/resetClicks/:id")
  async resetClicks(@Param("id") id: number) {
    let url: Url = new Url();
    const currentDateAndTime: Date = new Date();

    // Soft delete all requests with this urlID
    query = this.reqRepo.getRequestByUrlId(id);
    result = await softDelete(query);

    if (result.status === "Fail") {
      throw new Error("There is a technical issue with deleting this URL, try again later");
    } else {
      url.lastRequested = null;
      url.totalRequested = null;
      url.totalUniqueRequested = null;
      url.updatedAt = currentDateAndTime;

      return await this.urlRepo
        .getUrlById(id)
        .update()
        .set(url)
        .execute()
        .catch(function (err) {
          if (err) {
            return {
              status: "fail",
            }
          }
        })
        .then(async () => {
          let entity = await this.urlRepo.getUrlById(id).getOne();

          return {
            status: "Success",
            id: entity.id,
            lastModifiedDate: entity.updatedAt,
          }
        });
    }
  }

  @Authorized(AWSConfig.auth.darvisRole)
  @Put("/restore/:id")
  async restoreUrl(@Param("id") id: number) {
    query = this.urlRepo.getUrlById(id);
    result = await restore(query);

    if (result.status === "Fail") {
      throw new Error("There is a technical issue with restoring this URL, try again later");
    } else {
      return result;
    }
  }

  @Authorized(AWSConfig.auth.darvisRole)
  @Delete("/delete/:id")
  async deleteUrl(@Param("id") id: number) {
    query = this.urlRepo.getUrlById(id);
    result = await softDelete(query);

    if (result.status === "Fail") {
      throw new Error("There is a technical issue with deleting this URL, try again later");
    } else {
      return result;
    }
  }

  //TODO: CREATE ROLES that can access the only telegram endpoints.
  @Authorized(AWSConfig.auth.darvisRole)
  @Get("/telegramShortUrlLinksForComparison")
  async getTagsFromLinksForClickComparisonFromTelegram(@QueryParams() req: any, @CurrentUser() user: any) {
    let from = req.from;
    let to = req.to;
    let totalFrom = 0;
    let totalTo = 0;

    if (from !== undefined && from.length > 0) {
      let filteredDataFrom = await this.urlRepo.getUrl()
        .where("url.active = :status", { status: 1 })
        .andWhere("url.fullURL IN (:...urls)", { urls: from }).getMany();

      if (filteredDataFrom.length > 0) {
        let arrayObjtFrom = filteredDataFrom.map(m => { return { "linkUrl": m.fullURL, "clicks": m.totalRequested } }) // Extract linkUrl from each object
        for (let from of arrayObjtFrom) {
          totalFrom += from.clicks;
        }
      }
    }

    if (to !== undefined && to.length > 0) {
      let filteredDataTo = await this.urlRepo.getUrl()
        .where("url.active = :status", { status: 1 })
        .andWhere("url.fullURL IN (:...urls)", { urls: to }).getMany();

      if (filteredDataTo.length > 0) {
        let arrayObjtTo = filteredDataTo.map(m => { return { "linkUrl": m.fullURL, "clicks": m.totalRequested } }) // Extract linkUrl from each object
        for (let to of arrayObjtTo) {
          totalTo += to.clicks;
        }
      }
    }

    return {
      fromTotal: totalFrom,
      toTotal: totalTo
    }



  }

  @Authorized(AWSConfig.auth.darvisRole.concat([AWSConfig.auth.userRole], AWSConfig.auth.darvisRole))
  @Get("/clicks-via-period")
  async clicksViaPeriod(@QueryParams() req: ISearchUrlPeriodParams) {
    let foundClicksURL:any = await this.urlRepo.getUrlByPeriod(req)
    return foundClicksURL
  }
  
  @Authorized(AWSConfig.auth.darvisRole.concat([AWSConfig.auth.userRole], AWSConfig.auth.darvisRole))
  @Get("/getUrls")
  async getUrls(@QueryParams() req: ISearchUrlParams, @CurrentUser() user: User) {

    let data:any = await this.urlRepo.getUrls(req)
                .getManyAndCount()

    if(data[1] > 0){
      for(let d of data){
        if(d.tags && d.tags.length > 0){
          let tagCampaign = d.tags.filter((tag: any) => tag.key === 'campaign');

          if (d.campaignID !== null && tagCampaign.length == 0) {
            d.tags.push(await this.tagRepo.findTag({id: d.campaignID}).getOne())
          }

          let tagClient = d.tags.filter((tag: any) => tag.key === 'client');

          if (d.clientID !== null && tagClient.length == 0) {
            d.tags.push(await this.tagRepo.findTag({id: d.clientID}).getOne())
          }
        }
      }
    }
    return {
      total: data[1],
      data: data[0]
    }
  }

}
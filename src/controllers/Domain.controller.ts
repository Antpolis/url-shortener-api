import { JsonController, Param, Get, Post, Put, Delete, QueryParams, UseInterceptor, Authorized } from "routing-controllers";
import { Domain, DomainRepository } from "../repositories/DomainRepository";
import { getCustomRepository } from "typeorm";
import { restore, softDelete } from "../helpers";
import { ListResponseInterceptor } from "../interceptors/ListResponseInterceptor";
import { ISearchDomain } from "../common/interface/ISearchDomain";
import { AWSConfig } from "../../config/aws";
var result: any;
var res: object = new Object();
var query: any;

@JsonController("/domain")
export class DomainController {
  domainRepo: DomainRepository;

  constructor() {
    this.domainRepo = getCustomRepository(DomainRepository);
  }
  
  @Authorized(AWSConfig.auth.darvisRole)
  @Get("/all")
  async getAllDomains() {
    return await this.domainRepo.getDomain().where("domain.active = 1").getMany();
  }

  @Authorized(AWSConfig.auth.darvisRole)
  @Get('/list')
  @UseInterceptor(ListResponseInterceptor)
  async list(@QueryParams() req: ISearchDomain) {
    return await this.domainRepo.list(req).getManyAndCount();
  }

  @Authorized(AWSConfig.auth.darvisRole)
  @Get("/:id")
  async getDomainById(@Param("id") id: number) {
    return await this.domainRepo.getDomainById(id).getOne();
  }

  @Authorized(AWSConfig.auth.darvisRole)
  @Post("/create")
  async addNewDomain(@QueryParams() domain: Domain) {
    if (!domain.accountID) {
      throw new Error(`Validation failed! Empty Account ID`);
    } else if (!domain.domain) {
      throw new Error(`Validation failed! Empty Domain Text`);
    } else if (!domain.defaultLink) {
      throw new Error(`Validation failed! Empty Default Link`);
    } else {
      // Check if Domain is already in database
      const isAvailable = await this.domainRepo.getDomainByName(domain.domain).getOne();

      if (isAvailable === undefined) {
        const currentDateAndTime: Date = new Date();
        domain.createdAt = currentDateAndTime;
        domain.updatedAt = currentDateAndTime;
        domain.active = 1;
        domain.totalShortenURL = 0;

        // While saving, catch for any errors
        await this.domainRepo
          .getDomain()
          .insert()
          .values(domain)
          .execute()
          .catch(function (err) {
            if (err) {
              return (res = {
                status: "fail",
              });
            }
          });

        // Retrieve the entry from the db to get "id"
        const newEntry = await this.domainRepo.getDomainByName(domain.domain).getOne();

        return (res = {
          status: "Success",
          id: newEntry.id,
          domain: newEntry.domain,
          createdAt: newEntry.createdAt,
        });
      } else {
        return (res = { status: "This Domain already exists in our database" });
      }
    }
  }

  @Authorized(AWSConfig.auth.darvisRole)
  @Put("/update/:id")
  async updateDomain(@QueryParams() domain: Domain, @Param("id") id: number) {
    const currentDateAndTime: Date = new Date();
    domain.updatedAt = currentDateAndTime;

    result = await this.domainRepo
      .getDomainById(id)
      .update()
      .set(domain)
      .execute()
      .catch(function (err) {
        if (err) {
          return (res = {
            status: "fail",
          });
        }
      })
      .then(async () => {
        const entity = await this.domainRepo.getDomainById(id).getOne();

        return (res = {
          status: "Success",
          id: entity.id,
          lastModifiedDate: entity.updatedAt,
        });
      });

    if (result.status === "fail") {
      throw new Error("There is a technical issue with updating this Domain, try again later");
    } else if (result.status === "Success") {
      return result;
    } else {
      throw new Error("No such Domain can be found in our database");
    }
  }

  @Authorized(AWSConfig.auth.darvisRole)
  @Put("/restore/:id")
  async restoreDomain(@Param("id") id: number) {
    query = this.domainRepo.getDomainById(id);
    result = await restore(query);

    if (result.status === "Fail") {
      throw new Error("There is a technical issue with restoring this domain, try again later");
    } else {
      return result;
    }
  }

  @Authorized(AWSConfig.auth.darvisRole)
  @Delete("/delete/:id")
  async deleteDomain(@Param("id") id: number) {
    query = this.domainRepo.getDomainById(id);
    result = await softDelete(query);

    if (result.status === "Fail") {
      throw new Error("There is a technical issue with deleting this domain, try again later");
    } else {
      return result;
    }
  }
}

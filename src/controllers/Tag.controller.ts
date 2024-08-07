import { JsonController, Param, Get, Put, Delete, QueryParams, UseInterceptor, Post, Body, Authorized } from "routing-controllers";
import { TagRepository, Tag } from "../repositories/TagRepository";
import { getCustomRepository } from "typeorm";
import { restore, softDelete } from "../helpers";
import { ListResponseInterceptor } from "../interceptors/ListResponseInterceptor";
import { ISearchTagParams } from "../common/interface/ISearchTagParams";
import { AWSConfig } from "../../config/aws";
var result: any;
var query: any;

@JsonController("/tag")
export class TagController {
  tagRepo: TagRepository;

  constructor() {
    this.tagRepo = getCustomRepository(TagRepository);
  }
  
  @Authorized(AWSConfig.auth.darvisRole)
  @Get('/filters')
  async getFilters(@QueryParams() req: ISearchTagParams) {
    let results = await this.tagRepo.findTag(req)
    .addOrderBy("url.id", "DESC")
    .getManyAndCount();

    return {
      total: results[1],
      data: results[0],
    }
  }

  @Authorized(AWSConfig.auth.darvisRole)
  @Get("/list")
  @UseInterceptor(ListResponseInterceptor)
  async list(@QueryParams() req: ISearchTagParams) {
    const result = await this.tagRepo.list(req)
      .getManyAndCount();
    return result
  }
  
  @Authorized(AWSConfig.auth.darvisRole)
  @Get("/:key/page=:page&take=:take")
  async getTags(@Param("key") key: string, @Param("page") page: number, @Param("take") take: number) {
    return await this.tagRepo.findTag({key:key, page: page, take: take }).getMany();
  }

  @Authorized(AWSConfig.auth.darvisRole)
  @Get("/id/:id")
  async getTagById(@Param("id") id: number) {
    return await this.tagRepo.findTag({id:id}).getOne();
  }

  @Authorized(AWSConfig.auth.darvisRole)
  @Get("/name/:name")
  async getTagByName(@Param("name") name: string) {
    return await this.tagRepo.findTag({name:name,key: undefined});
  }
  
  @Authorized(AWSConfig.auth.darvisRole)
  @Get('/clients')
  @UseInterceptor(ListResponseInterceptor)
  async tagClient(@QueryParams() search: any){
    return this.tagRepo.getTag({key:'client'}).getManyAndCount();
  }

  @Authorized(AWSConfig.auth.darvisRole)
  @Get('/campaigns')
  @UseInterceptor(ListResponseInterceptor)
  async tagCampaign(@QueryParams() search: any){
    return this.tagRepo.getTag({key:'campaign'}).getManyAndCount();
  }

  @Authorized(AWSConfig.auth.darvisRole)
  @Get("/search-tag/:type/:filter")
  @UseInterceptor(ListResponseInterceptor)
  async searchTag(@Param("type") type: string, @Param("filter") filter: string, ) {
    return this.tagRepo.findTag({searchText: filter, key: type}).getManyAndCount();
  }

  @Authorized(AWSConfig.auth.darvisRole)
  @Post('/find-or-create')
  async findOrCreate(@Body() body: {key: string, value: string}){
    return this.tagRepo.findOrCreate({key: body.key, value: body.value})
  }

  @Authorized(AWSConfig.auth.darvisRole)
  @Post("/create")  
  async create(@Body() model: Tag) {
    return this.tagRepo.findOrCreate(model);
  }

  @Authorized(AWSConfig.auth.darvisRole)
  @Put("/update/:id")
  async updateTag(@QueryParams() tag: Tag, @Param("id") id: number) {
    const currentDateAndTime: Date = new Date();
    tag.updatedAt = currentDateAndTime;

    try {
      await this.tagRepo
      .findTag({id:id})
      .update()
      .set(tag)
      .execute()

      return {
        status: "Success",
        id: id,
        lastModifiedDate: tag.updatedAt,
      };

    } catch (error) {
      throw new Error("There is a technical issue with updating this tag, try again later");
    }
  }

  @Authorized(AWSConfig.auth.darvisRole)
  @Put("/restore/:id")
  async restoreTag(@Param("id") id: number) {
    query = this.tagRepo.findTag({id:id});
    result = await restore(query);

    if (result.status === "Fail") {
      throw new Error("There is a technical issue with restoring this Tag, try again later");
    } else {
      return result;
    }
  }

  @Authorized(AWSConfig.auth.darvisRole)
  @Delete("/delete/:id")
  async deleteTag(@Param("id") id: number) {
    query = this.tagRepo.findTag({id:id});
    result = await softDelete(query);

    if (result.status === "Fail") {
      throw new Error("There is a technical issue with deleting this Tag, try again later");
    } else {
      return result;
    }
  }
}
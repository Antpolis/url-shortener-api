import { Service } from "typedi";
import { Entity, PrimaryGeneratedColumn, Column, DeleteDateColumn, ManyToMany, Repository, EntityRepository, Like, Brackets } from "typeorm";
import { Url } from "./UrlRepository";
import { ISearchRequest, SearchSkipHelper } from "../common/interface";
import { ISearchTagParams } from "../common/interface/ISearchTagParams";
var res;

@Entity("tag")
export class Tag {
  @PrimaryGeneratedColumn({ type: "int", unsigned: true })
  id?: number;

  @Column({ type: "varchar", length: 255, nullable: false })
  key?: string;

  @Column({ type: "varchar", length: 255, nullable: false })
  value?: string;

  @Column({ type: "datetime", nullable: false })
  createdAt?: Date;

  @Column({ type: "datetime", nullable: true })
  updatedAt?: Date;

  @DeleteDateColumn({ name: "deletedAt", nullable: true })
  public deletedAt?: Date;

  @Column({ type: "varchar", length: 45, nullable: true })
  foreignKey?: string

  @ManyToMany(() => Url, (url) => url.tags, { cascade: ["insert", "update"], lazy: true })
  urls?: Promise<Url[]>;
}

@Service()
@EntityRepository(Tag)
export class TagRepository extends Repository<Tag> {

  getTag(searchParams: ISearchTagParams){
    const helper = SearchSkipHelper(searchParams);
    let query = this.createQueryBuilder("tag")
    
    if(searchParams.name){
      query =  query.andWhere("tag.value = :name", { name: searchParams.name })
    }
       
    if(searchParams.key){
      query =  query.andWhere("tag.key = :key", { key: searchParams.key })
    }
    
    query = query.addOrderBy("tag.id", "DESC")
   
    query = query.take(helper.take)
    query = query.skip(helper.skip);

    return query;
  }

  list(searchParams: ISearchTagParams) {
    searchParams = SearchSkipHelper(searchParams);
    let query = this.createQueryBuilder("tag")
    
    if(searchParams.id){
      query = query.andWhere("tag.id = :id", { id: searchParams.id })
    }

    if(searchParams.name){
      query =  query.andWhere("tag.value = :name", { name: searchParams.name })
    }
    
    if(searchParams.key){
      query =  query.andWhere("tag.key = :key", { key: searchParams.key })
    }
    
    if(searchParams.searchText && searchParams.searchText != 'undefined'){
      query = query.andWhere("tag.value like :searchStr", { searchStr: "%" + decodeURIComponent(searchParams.searchText) + "%" })
    }
    
    if(searchParams.searchTags && searchParams.searchTags.length > 0) {
      if(!Array.isArray(searchParams.searchTags)) {
        searchParams.searchTags = [searchParams.searchTags]
      }
      query = query.andWhere("UPPER(tag.value) in (:...searchTags)", { searchTags: searchParams.searchTags.map(t=>t.toUpperCase()) })
    }

    if(searchParams.searchIDs && searchParams.searchIDs.length > 0) {
      if(!Array.isArray(searchParams.searchIDs)) {
        searchParams.searchIDs = [searchParams.searchIDs]
      }
      query = query.andWhere("tag.id in (:...searchIDs)", { searchIDs: searchParams.searchIDs })
    }

    query = query.addOrderBy("tag.id", "DESC")
   
    query = query.take(searchParams.take)
    query = query.skip(searchParams.skip);
    return query;
  }

  findTag(searchParams: ISearchTagParams){
    // console.log("searchParams",searchParams);
    const helper = SearchSkipHelper(searchParams);
    let query = this.createQueryBuilder("tag")
    .leftJoinAndSelect("tag.urls", "url")
    
    if(searchParams.id){
      query = query.andWhere("tag.id = :id", { id: searchParams.id })
    }

    if(searchParams.name){
      query =  query.andWhere("tag.value = :name", { name: searchParams.name })
    }
    
    if(searchParams.key){
      query =  query.andWhere("tag.key = :key", { key: searchParams.key })
    }
    
    if(searchParams.searchText && searchParams.searchText != 'undefined'){
      query = query.andWhere("tag.value like :searchStr", { searchStr: "%" + searchParams.searchText + "%" })
    }

    query = query.addOrderBy("tag.id", "DESC")
   
    query = query.take(helper.take)
    query = query.skip(helper.skip);

    return query;
  }

  async findOrCreate(model: Tag) {
    let findModel = await this.findOne({
      where: {
        key: model.key.trim(),
        value: Like(model.value.trim())
      }
    })
    if(findModel) return findModel;

    model.createdAt = new Date();
    model.updatedAt = new Date();

    return await this.save(model);
  }

  findByValueOrUUID(tag: string, value?: string[], UUID?: string[]) {
    let query = this.createQueryBuilder("tag")
    query = query.andWhere(new Brackets((qb) => {
      qb = qb.andWhere(`tag.key = :tagName`, {tagName: tag})
      qb = qb.andWhere(new Brackets((qb) => {
        if(value?.length > 0) {
          qb = qb.orWhere(`tag.value in (:...campaignValue)`,{campaignValue: value})
        }
        if(UUID?.length>0) {
          qb = qb.orWhere(`tag.uuid in (:...campaignUUIDs)`,{campaignUUIDs: UUID})
        }
        return qb
      }))
      return qb
    }))    
    return query
  }


  // @deplicated
  async saveNewTag(key: string, name: string) {
    // Check if Tag is already in database
    const isAvailable = await this.createQueryBuilder("tag")
      .where("tag.key = :key", { key: key })
      .andWhere("tag.value = :name", { name: name })
      .getOne();

    if (isAvailable === undefined) {
      const currentDateAndTime: Date = new Date();
      let tagEntity: Tag = new Tag();
      tagEntity.key = key;
      tagEntity.value = name;
      tagEntity.createdAt = currentDateAndTime;

      // While saving, catch for any errors
      await this.createQueryBuilder("tag")
        .connection.manager.save(tagEntity)
        .catch(function (err) {
          if (err) {
            return (res = { status: "fail" });
          }
        });

      // Retrieve the entry from the db to get "id"
      const result = await this.createQueryBuilder("tag")
        .where("tag.key = :key", { key: key })
        .andWhere("tag.value = :name", { name: name })
        .getOne();

      return (res = {
        status: "success",
        id: result.id,
        createdAt: currentDateAndTime,
      });
    } else {
      if (key === "client") return (res = { status: "This Client already exists in our database" });
      else return (res = { status: "This Campaign already exists in our database" });
    }
  }
}
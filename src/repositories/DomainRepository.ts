import { Service } from "typedi";
import { Entity, PrimaryGeneratedColumn, Column, OneToMany, DeleteDateColumn, Repository, EntityRepository } from "typeorm";
import { Url } from "./UrlRepository";
import { ISearchDomain } from "../common/interface/ISearchDomain";

@Entity("domain")
export class Domain {
  @PrimaryGeneratedColumn({ unsigned: true })
  id?: number;

  @Column({ type: "int", nullable: true })
  accountID?: number;

  @Column({ type: "int", nullable: true })
  totalShortenURL?: number;

  @Column({ type: "varchar", length: 255, nullable: true })
  domain?: string;

  @Column({ type: "int", nullable: true })
  active?: number;

  @Column({ type: "int", nullable: true })
  system?: number;

  @Column({ type: "varchar", length: 1024, nullable: true })
  defaultLink?: string;

  @Column({ type: "datetime", nullable: true })
  createdAt?: Date;

  @Column({ type: "datetime", nullable: true })
  updatedAt?: Date;

  @DeleteDateColumn({ name: "deletedAt", nullable: true })
  public deletedAt?: Date;

  @OneToMany(() => Url, (url) => url.domain, { lazy: true })
  url?: Promise<Url[]>;
}

@Service()
@EntityRepository(Domain)
export class DomainRepository extends Repository<Domain> {
  getDomain() {
    const query = this.createQueryBuilder("domain");
    return query;
  }

  list(searchParams: ISearchDomain) {
    const query = this.createQueryBuilder("domain");
    if(searchParams.domain){
      query.andWhere("domain.domain like :domain", { domain: searchParams.domain })
    }
    if(searchParams.active){
      query.andWhere("domain.active = :active", { active: searchParams.active })
    }
    if(searchParams.searchText) {
      query.andWhere("domain.domain like :domain or domain.defaultLink like :domain", { domain: '%'+searchParams.searchText+"%" })
    }
    return query;
  }

  getDomainById(id: number) {
    const query = this.createQueryBuilder("domain").where("domain.id = :id", { id: id });
    return query;
  }

  getDomainByName(domain: string) {
    const query = this.createQueryBuilder("domain").where("domain.domain = :domain", {
      domain: domain,
    });
    return query;
  }
}

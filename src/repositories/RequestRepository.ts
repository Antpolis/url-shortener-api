import { Service } from "typedi";
import { Repository, EntityRepository } from "typeorm";
import { Entity, PrimaryGeneratedColumn, Column, OneToOne, JoinColumn, DeleteDateColumn } from "typeorm";
import { RequestLocation } from "./RequestLocationRepository";
import { ISearchRequest, SearchSkipHelper } from "../common/interface";
import { Url } from "./UrlRepository";

@Entity("request")
export class Request {
  @PrimaryGeneratedColumn({ unsigned: true })
  id: number;

  @Column({ type: "bigint", nullable: true })
  URLID?: number;

  @JoinColumn({ name: "URLID" })
  @OneToOne(() => Url, (t) => t.id)
  url: Promise<Url>;

  @Column({ type: "varchar", length: 255, nullable: true })
  browser?: string;

  @Column({ type: "varchar", length: 255, nullable: true })
  ip?: string;

  @Column({ type: "varchar", length: 255, nullable: true })
  ipv6?: string;

  @Column({ type: "text", nullable: true })
  rawRequest?: string;

  @Column({ type: "text", nullable: true })
  referrer?: string;

  @Column({ type: "varchar", length: 255, nullable: true })
  requestType?: string;

  @Column({ type: "varchar", length: 255, nullable: true })
  queryString?: string;

  @Column({ type: "text", nullable: true })
  payload?: string;

  @Column({ type: "datetime", nullable: true })
  createdAt?: Date;

  @Column({ type: "datetime", nullable: true })
  updatedAt?: Date;

  @Column({ type: "varchar", length: 256, nullable: true })
  os?: String;

  @Column({ type: "text", nullable: true })
  agentSource?: string;

  @Column({ type: "varchar", length: 256, nullable: true })
  platform?: string;

  @Column({ type: "datetime", nullable: true })
  requestedDate?: Date;

  @Column({ type: "bigint", nullable: true })
  locationID?: number;

  @JoinColumn({ name: "locationID" })
  @OneToOne(() => RequestLocation, (RequestLocation) => RequestLocation.id)
  requestLocation: Promise<RequestLocation>;

  @Column({ type: "datetime", nullable: true })
  requestDate?: Date;

  @Column({ type: "varchar", length: 18, nullable: true })
  forwardIP?: string;

  @Column({ type: "varchar", length: 10, nullable: true })
  port?: string;

  @Column({ type: "varchar", length: 255, nullable: true })
  browserVersion?: string;

  @DeleteDateColumn({ name: "deletedAt", nullable: true })
  deletedAt?: Date;

  @Column({ type: "tinyint", nullable: true })
  isUnique?: number;
}

@Service()
@EntityRepository(Request)
export class RequestRepository extends Repository<Request> {
  getRequest() {
    const query = this.createQueryBuilder("request").leftJoinAndSelect("request.requestLocation", "requestLocation");
    return query;
  }

  getRequestById(id: number) {
    const query = this.createQueryBuilder("request").where("request.id = :id", { id: id });
    return query;
  }

  getRequestByUrlId(id: number) {
    const query = this.createQueryBuilder("request").where("request.URLID = :id", { id: id });
    return query;
  }

  getRequestByUrlIds(id: number[]) {
    const query = this.createQueryBuilder("request").where("request.URLID in (:...ids)", { ids: id });
    return query;
  }

  getRequests(search: ISearchRequest) {
    const helper = SearchSkipHelper(search);

    const query = this.createQueryBuilder("request").take(helper.take).skip(helper.skip).addOrderBy("request.id", "DESC");
    return query;
  }

  getRequestWithUrlAndLocation(id: Number){
    const query = this.createQueryBuilder("request")
    .leftJoinAndSelect("request.requestLocation", " request.locationID = requestLocation.id")
    .where("request.id = :id", { id: id });
  return query;
  }

}

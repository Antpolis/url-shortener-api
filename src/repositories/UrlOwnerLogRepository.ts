import { Service } from "typedi";
import { Entity, PrimaryGeneratedColumn, Column, Repository, EntityRepository } from "typeorm";

@Entity("url_owner_log")
export class Url_Owner_Log {
  @PrimaryGeneratedColumn({ unsigned: true })
  id?: number;

  @Column({ type: "int", nullable: true })
  urlID?: number;

  @Column({ type: "int", nullable: true })
  ownerID?: number;

  @Column({ type: "datetime", nullable: true })
  createdAt?: Date;
}

@Service()
@EntityRepository(Url_Owner_Log)
export class UrlOwnerLogRepository extends Repository<Url_Owner_Log> {
  getLog() {
    const query = this.createQueryBuilder("url_owner_log");
    return query;
  }
}

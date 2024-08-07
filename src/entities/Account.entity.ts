import { Entity, PrimaryGeneratedColumn, Column, DeleteDateColumn, OneToMany, Repository, EntityRepository } from "typeorm";
import { Url } from "./Url.entity";
import { Audit } from "src/common/abstract/Audit";

@Entity("account")
export class Account extends Audit {
  @PrimaryGeneratedColumn({ unsigned: true })
  id?: number;

  @Column({ type: "varchar", length: 255, nullable: true })
  name?: string;

  @Column({ type: "varchar", length: 255, nullable: true })
  contactEmail?: string;

  @Column({ type: "varchar", length: 255, nullable: true })
  cognitoID?: Date;

  @OneToMany(() => Url, (url) => url.account, {lazy: true})
  url?: Promise<Url[]>;
}

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  JoinTable,
  ManyToMany,
} from "typeorm";
import { Domain } from "./Domain.entity";
import { Tag } from "./Tag.entity";
import { Account } from "./Account.entity";
import { Audit } from "src/common/abstract/Audit";

@Entity('url')
export class Url extends Audit {
  @PrimaryGeneratedColumn({ unsigned: true })
  id: number;

  @Column({ type: 'int', nullable: true })
  domainID?: number;

  @Column({ type: 'text', nullable: true })
  redirectURL?: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  fullURL?: string;

  @Column({ type: 'int', nullable: true })
  accountID?: number;

  @Column({ type: 'int', nullable: true })
  ownerID?: number;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ type: 'varchar', length: 125, nullable: true })
  hash?: string;

  @Column({ type: 'datetime', nullable: true })
  startDate?: Date;

  @Column({ type: 'datetime', nullable: true })
  endDate?: Date;

  @Column({ type: 'int', nullable: true })
  campaignID: number;

  @Column({ type: 'int', nullable: true })
  clientID: number;

  @JoinColumn({ name: 'domainID' })
  @ManyToOne(() => Domain, (domain) => domain.url)
  domain: Domain;

  @JoinColumn({ name: 'ownerID' })
  @ManyToOne(() => Account, (account) => account.url)
  account: Account;
}

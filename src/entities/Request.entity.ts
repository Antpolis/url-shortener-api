import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToOne,
  JoinColumn,
} from 'typeorm';
import { RequestLocation } from './RequestLocation.entity';
import { Url } from './Url.entity';
import { Audit } from 'src/common/abstract/Audit';

@Entity('request')
export class Request extends Audit {
  @PrimaryGeneratedColumn({ unsigned: true })
  id: number;

  @Column({ type: 'bigint', nullable: true })
  URLID?: number;

  @JoinColumn({ name: 'URLID' })
  @OneToOne(() => Url, (t) => t.id)
  url: Promise<Url>;

  @Column({ type: 'varchar', length: 255, nullable: true })
  browser?: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  ip?: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  ipv6?: string;

  @Column({ type: 'text', nullable: true })
  rawRequest?: string;

  @Column({ type: 'text', nullable: true })
  referrer?: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  requestType?: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  queryString?: string;

  @Column({ type: 'text', nullable: true })
  payload?: string;

  @Column({ type: 'varchar', length: 256, nullable: true })
  os?: string;

  @Column({ type: 'text', nullable: true })
  agentSource?: string;

  @Column({ type: 'varchar', length: 256, nullable: true })
  platform?: string;

  @Column({ type: 'datetime', nullable: true })
  requestedDate?: Date;

  @Column({ type: 'bigint', nullable: true })
  locationID?: number;

  @JoinColumn({ name: 'locationID' })
  @OneToOne(() => RequestLocation, (RequestLocation) => RequestLocation.id)
  requestLocation: Promise<RequestLocation>;

  @Column({ type: 'datetime', nullable: true })
  requestDate?: Date;

  @Column({ type: 'varchar', length: 18, nullable: true })
  forwardIP?: string;

  @Column({ type: 'varchar', length: 10, nullable: true })
  port?: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  browserVersion?: string;

  @Column({ type: 'tinyint', nullable: true })
  isUnique?: number;
}

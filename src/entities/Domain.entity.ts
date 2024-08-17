import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { Url } from './Url.entity';
import { Audit } from 'src/common/abstract/Audit';

@Entity('domain')
export class Domain extends Audit {
  @PrimaryGeneratedColumn({ unsigned: true })
  id?: number;

  @Column({ type: 'int', nullable: true })
  accountID?: number;

  @Column({ type: 'int', nullable: true })
  totalShortenURL?: number;

  @Column({ type: 'varchar', length: 255, nullable: true })
  domain?: string;

  @Column({ type: 'int', nullable: true })
  system?: number;

  @Column({ type: 'varchar', length: 1024, nullable: true })
  defaultLink?: string;

  @OneToMany(() => Url, (url) => url.domain, { lazy: true })
  url?: Promise<Url[]>;
}

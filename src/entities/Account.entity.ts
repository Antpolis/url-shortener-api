import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { Url } from './Url.entity';
import { Audit } from 'src/common/abstract/Audit';
import { IsAccountExist } from 'src/common/validators/isAccountExists';
import { IsEmail } from 'class-validator';

@Entity('account')
export class Account extends Audit {
  @PrimaryGeneratedColumn({ unsigned: true })
  id?: number;

  @IsAccountExist()
  @Column({ type: 'varchar', length: 255, nullable: true })
  name?: string;

  @IsEmail()
  @Column({ type: 'varchar', length: 255, nullable: true })
  contactEmail?: string;

  @OneToMany(() => Url, (url) => url.account, { lazy: true })
  url?: Promise<Url[]>;
}

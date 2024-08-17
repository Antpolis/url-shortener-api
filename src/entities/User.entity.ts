import { Audit } from 'src/common/abstract/Audit';
import { Entity, Column, Generated } from 'typeorm';

@Entity('user')
export class User extends Audit {
  @Generated('uuid')
  @Column({ name: 'id' })
  id: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  password?: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  email: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  code?: string;

  @Column({ type: 'datetime', nullable: true })
  codeExpire?: Date;
}

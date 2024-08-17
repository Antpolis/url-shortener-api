import { Audit } from 'src/common/abstract/Audit';
import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('requestLocation')
export class RequestLocation extends Audit {
  @PrimaryGeneratedColumn({ unsigned: true })
  id: number;

  @Column({ type: 'varchar', length: 5, nullable: true })
  continent: string;

  @Column({ type: 'varchar', length: 256, nullable: true })
  continentName: string;

  @Column({ type: 'varchar', length: 5, nullable: true })
  ISOCode: string;

  @Column({ type: 'varchar', length: 256, nullable: true })
  countryName: string;

  @Column({ type: 'varchar', length: 256, nullable: true })
  cityName: string;

  @Column({ type: 'varchar', length: 256, nullable: true })
  subdivision: string;

  @Column({ type: 'varchar', nullable: true })
  postalCode: string;

  @Column({ type: 'decimal', nullable: true })
  latitude: number;

  @Column({ type: 'decimal', nullable: true })
  longitude: number;

  @Column({ type: 'int', nullable: true })
  requestID: number;
}

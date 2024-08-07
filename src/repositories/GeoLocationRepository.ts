import { Repository, EntityRepository, OneToOne } from "typeorm";
import { Entity, PrimaryGeneratedColumn, Column, JoinColumn, OneToMany, ManyToOne } from "typeorm";
import { RequestLocation } from "./RequestLocationRepository";

@Entity("geoip")
export class GeoIP {
  @PrimaryGeneratedColumn({ unsigned: true })
  id: Number;

  @Column({ type: "varchar", length: 15, nullable: false })
  networkIP: String;

  @Column({ type: "bigint", unsigned: true, nullable: false })
  highRange: BigInt;

  @Column({ type: "bigint", unsigned: true, nullable: false })
  lowRange: BigInt;

  @Column({ type: "float", nullable: false })
  latitude: Number;

  @Column({ type: "float", nullable: false })
  longitude: Number;

  @Column({ type: "datetime", nullable: true })
  updatedOn?: Date;

  @Column({ type: "int", nullable: true })
  geoCountryNameID?: Number;

  @Column({ type: "varchar", length: 15, nullable: true })
  postalCode?: String;

  @Column({ type: "datetime", nullable: true })
  createdAt?: Date;

  @Column({ type: "datetime", nullable: true })
  updatedAt?: Date;

  @Column({ type: "int", nullable: true })
  geoNameID?: Number;

  @JoinColumn({ name: "geoNameID" })
  @ManyToOne((type) => GeoName, (geoname) => geoname.geoip, { lazy: true })
  geoname: Promise<GeoName>;
}

@Entity("geoname")
export class GeoName {
  @Column({ unsigned: true })
  id: Number;

  @Column({ type: "varchar", length: 5, nullable: true })
  continent?: String;

  @PrimaryGeneratedColumn({ type: "int" })
  geoNameID?: Number;

  @Column({ type: "varchar", length: 256, nullable: true })
  continentName?: String;

  @Column({ type: "varchar", length: 5, nullable: true })
  ISOCode?: String;

  @Column({ type: "varchar", length: 256, nullable: true })
  countryName?: String;

  @Column({ type: "varchar", length: 256, nullable: true })
  cityName?: String;

  @Column({ type: "datetime", nullable: true })
  updatedOn?: Date;

  @Column({ type: "varchar", length: 256, nullable: true })
  subdivision?: String;

  @Column({ type: "datetime", nullable: true })
  createdAt?: Date;

  @Column({ type: "datetime", nullable: true })
  updatedAt?: Date;

  @OneToMany(() => GeoIP, (geoip) => geoip.geoname, { lazy: true })
  geoip: Promise<GeoIP[]>;

  @OneToOne(() => RequestLocation, (requestLocation) => requestLocation.geoName, {lazy: true})
  requestLocation: Promise<RequestLocation>;
}

@EntityRepository(GeoIP)
export class GeoLocationRepository extends Repository<GeoIP> {
  async getGeoByRange(ipLong: number) {
    const query = await this.createQueryBuilder("geoip")
      .leftJoinAndSelect("geoip.geoname", "geoname")
      .where("highRange >= :ipLong", { ipLong: ipLong })
      .andWhere("lowRange <= :ipLong", { ipLong: ipLong })
      .getOne();
    return query;
  }

  async getGeoWithInRange(ipLong: number) {
    const query = await this.createQueryBuilder("geoip")
      .where("highRange >= :ipLong", { ipLong: ipLong })
      .andWhere("lowRange <= :ipLong", { ipLong: ipLong })
      .getOne();
    return query;
  }
}

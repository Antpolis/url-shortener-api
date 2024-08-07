import { Service } from "typedi";
import { Entity, PrimaryGeneratedColumn, Column, OneToOne, JoinColumn, Repository, EntityRepository } from "typeorm";
import { GeoName } from "./GeoLocationRepository";
var res: any;

@Entity("requestLocation")
export class RequestLocation {
  @PrimaryGeneratedColumn({ unsigned: true })
  id: number;

  @Column({ type: "varchar", length: 5, nullable: true })
  continent: String;

  @Column({ type: "varchar", length: 256, nullable: true })
  continentName: String;

  @Column({ type: "varchar", length: 5, nullable: true })
  ISOCode: String;

  @Column({ type: "varchar", length: 256, nullable: true })
  countryName: String;

  @Column({ type: "varchar", length: 256, nullable: true })
  cityName: String;

  @Column({ type: "varchar", length: 256, nullable: true })
  subdivision: String;

  @Column({ type: "varchar", nullable: true })
  postalCode: String;

  @Column({ type: "decimal", nullable: true })
  latitude: Number;

  @Column({ type: "decimal", nullable: true })
  longitude: Number;

  @Column({ type: "datetime", nullable: true })
  createdAt: Date;

  @Column({ type: "datetime", nullable: true })
  updatedAt: Date;

  @Column({ type: "int", nullable: true })
  requestID: Number;

  @Column({ type: "int", nullable: true })
  geoNameID: Number;

  @Column({ type: "int", nullable: true })
  geoCountryNameID: Number;

  @JoinColumn({ name: "geoNameID" })
  @OneToOne(() => GeoName, (geoName) => geoName.requestLocation, { lazy: true })
  geoName: Promise<GeoName>;
}

@Service()
@EntityRepository(RequestLocation)
export class RequestLocationRepository extends Repository<RequestLocation> {
  async getLatestRequestLocationEntry(geoNameID: Number, geoCountryNameID: Number) {
    return await this.createQueryBuilder("requestLocation")
      .where("requestLocation.geoNameID = :geoNameID", { geoNameID: geoNameID })
      .where("requestLocation.geoCountryNameID = :geoCountryNameID", { geoCountryNameID: geoCountryNameID })
      .getOne();
  }

  async saveNewRequestLocation(req: RequestLocation) {
    return await this.save(req)
      
      // .insert()
      // .values(req)
      // .execute()
      // .catch(function (err) {
      //   if (err) {
      //     return (res = {
      //       status: "fail",
      //     });
      //   }
      // });
  }
}

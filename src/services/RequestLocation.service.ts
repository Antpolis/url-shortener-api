import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { RequestLocation } from 'src/entities/RequestLocation.entity';
import { Repository } from 'typeorm';

@Injectable()
export class RequestLocationService {
  constructor(
    @InjectRepository(RequestLocation)
    public readonly repo: Repository<RequestLocation>,
  ) {}

  async getLatestRequestLocationEntry(
    geoNameID: number,
    geoCountryNameID: number,
  ) {
    return await this.repo
      .createQueryBuilder('requestLocation')
      .where('requestLocation.geoNameID = :geoNameID', { geoNameID: geoNameID })
      .where('requestLocation.geoCountryNameID = :geoCountryNameID', {
        geoCountryNameID: geoCountryNameID,
      })
      .getOne();
  }

  async saveNewRequestLocation(req: RequestLocation) {
    return await this.repo.save(req);
  }
}

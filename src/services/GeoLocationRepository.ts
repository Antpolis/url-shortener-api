import { Injectable } from '@nestjs/common';

@Injectable()
export class GeoLocationRepository {
  // async getGeoByRange(ipLong: number) {
  //   const query = await this.createQueryBuilder('geoip')
  //     .leftJoinAndSelect('geoip.geoname', 'geoname')
  //     .where('highRange >= :ipLong', { ipLong: ipLong })
  //     .andWhere('lowRange <= :ipLong', { ipLong: ipLong })
  //     .getOne();
  //   return query;
  // }

  // async getGeoWithInRange(ipLong: number) {
  //   const query = await this.createQueryBuilder('geoip')
  //     .where('highRange >= :ipLong', { ipLong: ipLong })
  //     .andWhere('lowRange <= :ipLong', { ipLong: ipLong })
  //     .getOne();
  //   return query;
  // }
}

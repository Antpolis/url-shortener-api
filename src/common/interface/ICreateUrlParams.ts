import { Tag } from 'src/entities/Tag.entity';

export interface ICreateUrlParams {
  accountID?: number;
  campaignID?: number;
  clientID?: number;
  domainID?: number;
  campaignName?: string;
  clientName?: string;
  description?: string;
  domainName?: string;
  hash?: string;
  id?: number;
  redirectURL?: string;
  ownerName?: string;
  tags?: Tag[];
}

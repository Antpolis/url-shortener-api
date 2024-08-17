import { ISearchRequest } from '../common/interface';
import { ConfigQuery } from '../helpers/QueryHelper';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Account } from 'src/entities/Account.entity';
import { IAuthProfile } from 'src/common/interface/IAuthProfile';
import { DeepPartial, Repository, SelectQueryBuilder } from 'typeorm';
import { RepositoryService } from 'src/common/abstract/RepositoryService';
import { IQuerySearchParams } from 'src/common/interface/IQueryParams';

@Injectable()
export class AccountService extends RepositoryService<Account> {
  constructor(
    @InjectRepository(Account)
    public readonly repo: Repository<Account>,
  ) {
    super();
  }

  listQuery(searchParams?: IQuerySearchParams): SelectQueryBuilder<Account> {
    const query = this.repo.createQueryBuilder('account');
    return query;
  }
  getByPrimaryKeyQuery(id: number): SelectQueryBuilder<Account> {
    const query = this.repo
      .createQueryBuilder('account')
      .where('account.id = :id', { id: id });
    return query;
  }
  save(account: Account): Promise<Account> {
    throw new Error('Method not implemented.');
  }
  async delete(id: number): Promise<Account | null> {
    const exists = await this.repo.existsBy({
      id: id,
    });
    if (exists) {
      await this.repo.restore(id);
      return this.getByPrimaryKeyQuery(id).getOneOrFail();
    }
    return null;
  }
  
  async restore(id: number): Promise<Account | null> {
    const exists = await this.repo.existsBy({
      id: id,
    });
    if(exists) {
      await this.repo.restore(id);
      return this.getByPrimaryKeyQuery(id).getOneOrFail();
    }
    return null;
    
  }

  getAccountByCognitoId(cognitoID: string) {
    const query = this.repo
      .createQueryBuilder('account')
      .where('account.cognitoID = :cognitoID', { cognitoID: cognitoID });
    return query;
  }

  getAccountByName(name: string) {
    const query = this.repo
      .createQueryBuilder('account')
      .where('name = :name', { name: name });
    return query;
  }

  getAccountByEmail(email: string) {
    const query = this.repo
      .createQueryBuilder('account')
      .where('contactEmail = :email', { email: email });
    return query;
  }

  getAccounts(search: ISearchRequest) {
    search.take = 30;
    search.page = 0;
    let query = this.repo
      .createQueryBuilder('account')
      .addOrderBy('account.id', 'DESC');
    query = ConfigQuery(search, query, ['value']);
    return query;
  }

  async saveNewAccount(user: IAuthProfile) {
    try {
      const account: Account = this.repo.create({
        name: user.given_name + ' ' + user.family_name,
        contactEmail: user.email,
        cognitoID: user.sub,
      });

      return await this.repo.save(account);
    } catch (error) {
      return 'Failed to create new account :' + error;
    }
  }
}

import { Service } from "typedi";
import { Entity, PrimaryGeneratedColumn, Column, DeleteDateColumn, OneToMany, Repository, EntityRepository } from "typeorm";
import { Url } from "./UrlRepository";
import { ISearchRequest, SearchSkipHelper } from "../common/interface";
import { ConfigQuery } from "../helpers/QueryHelper";

@Entity("account")
export class Account {
  @PrimaryGeneratedColumn({ unsigned: true })
  id?: number;

  @Column({ type: "varchar", length: 255, nullable: true })
  name?: string;

  @Column({ type: "varchar", length: 255, nullable: true })
  contactEmail?: string;

  @Column({ type: "int", nullable: true })
  lastModifiedBy?: number;

  @Column({ type: "int", nullable: true })
  createBy?: number;

  @Column({ type: "datetime", nullable: true })
  updatedAt?: Date;

  @Column({ type: "datetime", nullable: true })
  createDate?: Date;

  @Column({ type: "varchar", length: 255, nullable: true })
  cognitoID?: Date;

  @DeleteDateColumn({ name: "deletedAt", nullable: true })
  public deletedAt?: Date;

  @OneToMany(() => Url, (url) => url.account, {lazy: true})
  url?: Promise<Url[]>;
}

@Service()
@EntityRepository(Account)
export class AccountRepository extends Repository<Account> {
  getAccount() {
    const query = this.createQueryBuilder("account");
    return query;
  }

  getAccountById(id: number) {
    const query = this.createQueryBuilder("account").where("account.id = :id", { id: id });
    return query;
  }

  getAccountByCognitoId(cognitoID: string) {
    const query = this.createQueryBuilder("account").where("account.cognitoID = :cognitoID", { cognitoID: cognitoID });
    return query;
  }

  getAccountByName(name: string) {
    const query = this.createQueryBuilder("account").where("name = :name", { name: name });
    return query;
  }

  getAccountByEmail(email: string) {
    const query = this.createQueryBuilder("account").where("contactEmail = :email", { email: email });
    return query;
  }

  getAccounts(search: ISearchRequest) {
    search.take = 30;
    search.page = 0;
    let query = this.createQueryBuilder("account")
    .addOrderBy("account.id", "DESC");
    query = ConfigQuery(search, query,['value'])
    return query;
  }

  async saveNewAccount(user:any) {
      try {
          
        let account = {
          name: user.data.given_name +" "+ user.data.family_name,
          contactEmail: user.data.email,
          createDate: new Date(),
          cognitoID: user.data.sub
        } as Account;
        
        return  await this.save(account);
    
      } catch (error) {
        return "Failed to create new account :"+ error
      }
  }
}


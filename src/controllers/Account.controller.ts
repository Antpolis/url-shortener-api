
import { Account, AccountRepository } from "../repositories/AccountRepository";
import { getCustomRepository } from "typeorm";
import { restore, softDelete } from "../helpers";
import { AWSConfig } from "../../config/aws";
import { Controller, Get, Param, Query } from "@nestjs/common";

var result: any;
var res: object = new Object();
var query: any;

@Controller("/account")
export class AccountController {
  accountRepo: AccountRepository;

  constructor() {
    this.accountRepo = getCustomRepository(AccountRepository);
  }
  
  // @Authorized(AWSConfig.auth.darvisRole)
  // @UseInterceptor(ListResponseInterceptor)
  @Get('/list')
  async list(@Query() search: any){
    return await this.accountRepo.getAccounts(search).getManyAndCount();
  } 

  // @Authorized(AWSConfig.auth.darvisRole)
  @Get("/page=:page&take=:take")
  async getAccounts(@Query("page") page: number, @Param("take") take: number) {
    return await this.accountRepo.getAccounts({ page: page, take: take }).getMany();
  }

  // @Authorized(AWSConfig.auth.darvisRole)
  @Get("/all")
  async getAllAccounts() {
    return await this.accountRepo.getAccount().getMany();
  }

  // @Authorized(AWSConfig.auth.darvisRole)
  @Get("/:id")
  async getAccountById(@Query("id") id: number) {
    return await this.accountRepo.getAccountById(id).getOne();
  }

  // @Authorized(AWSConfig.auth.darvisRole)
  @Get("/get-by-email/:email")
  async getAccountByEmail(@Param("email") email: string, @CurrentUser() user:any) {
    let userDetails = await this.accountRepo.getAccountByEmail(email).getOne();
    if(userDetails === undefined){
      if(user.data !== undefined){
        //check account base on email or cognitoID
        let responseViaEmail = await this.accountRepo.getAccountByEmail(user.data.email).getOne();
        let responseViaCognitoId = await this.accountRepo.getAccountByCognitoId(user.data.sub).getOne();
        if(responseViaEmail == undefined && responseViaCognitoId == undefined) await this.accountRepo.saveNewAccount(user);
        return await this.accountRepo.getAccountByEmail(email).getOne();
      }else{
        return null;
      }
    }else{
      return userDetails;
    }
  }

  @Authorized(AWSConfig.auth.darvisRole)
  @Get("/:name")
  async getAccountByName(@Param("name") name: string) {
    return await this.accountRepo.getAccountByName(name).getOne();
  }

  @Authorized(AWSConfig.auth.darvisRole)
  @Post("/create")
  async addNewAccount(@Query() account: Account) {
    // Check if Account is already in database
    const isAvailable = await this.accountRepo.getAccountByName(account.name).getOne();

    if (isAvailable === undefined) {
      const currentDateAndTime: Date = new Date();
      account.createDate = currentDateAndTime;

      // While saving, catch for any errors
      await this.accountRepo
        .getAccount()
        .connection.manager.save(account)
        .catch(function (err) {
          if (err) {
            return (res = {
              status: "fail",
            });
          }
        });

      // Retrieve the entry from the db to get "id"
      let newEntry = await this.accountRepo.getAccountByName(account.name).getOne();

      return (res = {
        status: "success",
        id: newEntry.id,
        createdAt: newEntry.createDate,
      });
    } else {
      return (res = { status: "This Account already exists in our database" });
    }
  }

  @Authorized(AWSConfig.auth.darvisRole)
  @Put("/update/:id")
  async updateAccount(@Query() account: any, @Param("id") id: number) {
    const currentDateAndTime: Date = new Date();
    account.lastModifiedDate = currentDateAndTime;

    result = await this.accountRepo
      .getAccountById(id)
      .connection.manager.save(account)
      .catch(function (err) {
        if (err) {
          return (res = {
            status: "fail",
          });
        }
      })
      .then(async () => {
        let entity = await this.accountRepo.getAccountById(id).getOne();

        return (res = {
          status: "Success",
          id: entity.id,
          lastModifiedDate: entity.updatedAt,
        });
      });

    if (result.status === "fail") {
      throw new Error("There is a technical issue with updating this Account, try again later");
    } else if (result.status === "Success") {
      return result;
    } else {
      throw new Error("No such account can be found in our database");
    }
  }

  @Authorized(AWSConfig.auth.darvisRole)
  @Put("/restore/:id")
  async restoreAccount(@Param("id") id: number) {
    query = this.accountRepo.getAccountById(id);
    result = await restore(query);

    if (result.status === "Fail") {
      throw new Error("There is a technical issue with restoring this account, try again later");
    } else {
      return result;
    }
  }

  @Authorized(AWSConfig.auth.darvisRole)
  @Delete("/delete/:id")
  async deleteAccount(@Param("id") id: number) {
    query = this.accountRepo.getAccountById(id);
    result = await softDelete(query);

    if (result.status === "Fail") {
      throw new Error("There is a technical issue with deleting this account, try again later");
    } else {
      return result;
    }
  }
}
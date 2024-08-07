import { JsonController, Param, Get, Post, Put, Delete, QueryParams, Authorized } from "routing-controllers";
import { User, UserRepository } from "../repositories/UserRepository";
import { getCustomRepository } from "typeorm";
import { restore, softDelete } from "../helpers";
import { AWSConfig } from "../../config/aws";
var result: any;
var res: object = new Object();
var query: any;

@JsonController("/user")
export class UserController {
  userRepo: UserRepository;

  constructor() {
    this.userRepo = getCustomRepository(UserRepository);
  }

  @Authorized(AWSConfig.auth.darvisRole)
  @Get("/:id")
  async getUserById(@Param("id") id: number) {
    return await this.userRepo.getUserById(id).getOne();
  }

  @Authorized(AWSConfig.auth.darvisRole)
  @Post("/create")
  async addNewUser(@QueryParams() user: User) {
    // Check if User is already in database
    const isAvailable = await this.userRepo.getUserByName(user.username).getOne();

    if (isAvailable === undefined) {
      const currentDateAndTime: Date = new Date();
      user.createDate = currentDateAndTime;

      // While saving, catch for any errors
      await this.userRepo
        .getUser()
        .connection.manager.save(user)
        .catch(function (err) {
          if (err) {
            return (res = {
              status: "fail",
            });
          }
        });

      // Retrieve the entry from the db to get "id"
      let newEntry = await this.userRepo.getUserByName(user.username).getOne();

      return (res = {
        status: "success",
        id: newEntry.id,
        createdAt: newEntry.createDate,
      });
    } else {
      return (res = { status: "This Domain already exists in our database" });
    }
  }

  @Authorized(AWSConfig.auth.darvisRole)
  @Put("/update/:id")
  async updateUser(@QueryParams() user: User, @Param("id") id: number) {
    result = await this.userRepo
      .getUserById(id)
      .connection.manager.save(user)
      .catch(function (err) {
        if (err) {
          return (res = {
            status: "fail",
          });
        }
      })
      .then(async () => {
        let entity = await this.userRepo.getUserById(id).getOne();

        return (res = {
          status: "Success",
          id: entity.id,
          lastModifiedDate: entity.updatedAt,
        });
      });

    if (result.status === "fail") {
      throw new Error("There is a technical issue with updating this User, try again later");
    } else if (result.status === "Success") {
      return result;
    } else {
      throw new Error("No such User can be found in our database");
    }
  }

  @Authorized(AWSConfig.auth.darvisRole)
  @Put("/restore/:id")
  async restoreUser(@Param("id") id: number) {
    query = this.userRepo.getUserById(id);
    result = await restore(query);

    if (result.status === "Fail") {
      throw new Error("There is a technical issue with restoring this user, try again later");
    } else {
      return result;
    }
  }

  @Authorized(AWSConfig.auth.darvisRole)
  @Delete("/delete/:id")
  async deleteUser(@Param("id") id: number) {
    query = this.userRepo.getUserById(id);
    result = await softDelete(query);

    if (result.status === "Fail") {
      throw new Error("There is a technical issue with restoring this user, try again later");
    } else {
      return result;
    }
  }
}

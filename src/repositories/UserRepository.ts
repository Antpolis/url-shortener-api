import { Service } from "typedi";
import { Entity, PrimaryGeneratedColumn, Column, DeleteDateColumn, Repository, EntityRepository } from "typeorm";

@Entity("user")
export class User {
  @PrimaryGeneratedColumn({ unsigned: true })
  id: number;

  @Column({ type: "varchar", length: 255, nullable: true })
  username?: string;

  @Column({ type: "varchar", length: 255, nullable: true })
  password?: string;

  @Column({ type: "varchar", length: 255, nullable: true })
  email?: string;

  @Column({ type: "varchar", length: 255, nullable: true })
  code?: string;

  @Column({ type: "datetime", nullable: true })
  codeExpire?: Date;

  @Column({ type: "tinyint", nullable: true })
  active?: number;

  @Column({ type: "datetime", nullable: true })
  updatedAt?: Date;

  @Column({ type: "datetime", nullable: true })
  createDate?: Date;

  @DeleteDateColumn({ name: "deletedAt", nullable: true })
  public deletedAt?: Date;
}

@Service()
@EntityRepository(User)
export class UserRepository extends Repository<User> {
  getUser() {
    const query = this.createQueryBuilder("user");
    return query;
  }

  getUserById(id: number) {
    const query = this.createQueryBuilder("user").where("user.id = :id", { id: id });
    return query;
  }

  getUserByName(username: string) {
    const query = this.createQueryBuilder("user").where("user.username = :username", {
      username: username,
    });
    return query;
  }

  findByEmail(userDetail:any){
    if(userDetail){
      const query = this.createQueryBuilder("user").where("user.email = :email", {
        email: userDetail.email,
      });
      return query;
    }
  }
  
  async createNewIncognitoUser(userDetail:any){
    let userModel = {
      username: null,
      password:null,
      email: userDetail.email,
      code:null,
      codeExpire:null,
      active: 1,
      createDate: new Date(),
    } as User
    return await this.save(userModel);
  }


}

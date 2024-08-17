import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from 'src/entities/User.entity';
import { Service } from 'typedi';
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  DeleteDateColumn,
  Repository,
  EntityRepository,
} from 'typeorm';

@Injectable()
export class UserService {

  constructor(
    @InjectRepository(User)
    public readonly repo: Repository<User>,
  ) {}

  getUserById(id: number) {
    const query = this.repo.createQueryBuilder('user').where('user.id = :id', {
      id: id,
    });
    return query;
  }

  getUserByName(username: string) {
    const query = this.repo.createQueryBuilder('user').where(
      'user.username = :username',
      {
        username: username,
      },
    );
    return query;
  }

  findByEmail(userDetail: any) {
    if (userDetail) {
      const query = this.repo.createQueryBuilder('user').where(
        'user.email = :email',
        {
          email: userDetail.email,
        },
      );
      return query;
    }
  }

  async createNewIncognitoUser(userDetail: any) {
    const userModel = {
      username: null,
      password: null,
      email: userDetail.email,
      code: null,
      codeExpire: null,
      active: 1,
      createDate: new Date(),
    } as User;
    return await this.repo.save(userModel);
  }
}

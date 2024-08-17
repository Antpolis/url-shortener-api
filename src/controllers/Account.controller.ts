import { HttpErrorByCode } from '@nestjs/common/utils/http-error-by-code.util';
import { AccountService } from '../services/Account.service';
import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpException,
  HttpStatus,
  Param,
  Post,
  Put,
  Query,
  UseInterceptors,
} from '@nestjs/common';
import { validate } from 'class-validator';
import { IQuerySearchParams } from 'src/common/interface/IQueryParams';
import { Account } from 'src/entities/Account.entity';
import { ListResponseInterceptor } from 'src/interceptors/ListResponseInterceptor';

@Controller('/account')
export class AccountController {
  constructor(private readonly accountService: AccountService) {}

  @UseInterceptors(ListResponseInterceptor)
  @Get('/list')
  async list(@Query() search: IQuerySearchParams) {
    return await this.accountService.listQuery(search).getManyAndCount();
  }

  @Get('/:id')
  async get(@Query('id') id: number) {
    return await this.accountService.getByPrimaryKeyQuery(id).getOne();
  }

  async save(account: Account) {
    const errors = await validate(account);
    if (errors?.length > 0) {
      throw new HttpException(errors, HttpStatus.UNPROCESSABLE_ENTITY);
    }
    return this.accountService.save(account);
  }

  @HttpCode(HttpStatus.CREATED)
  @Post('/create')
  async create(@Body() account: Account) {
    const model = await this.save(account);
    return model;
  }

  @HttpCode(HttpStatus.ACCEPTED)
  @Post('/update/:id')
  async updateAccount(@Query() account: Account, @Param('id') id: number) {
    account.id = id;
    const model = await this.save(account);
    return model;
  }

  @Put('/restore/:id')
  async restoreAccount(@Param('id') id: number) {
    const model = await this.accountService.restore(id);
    if (model) {
      return model;
    }
    throw new BadRequestException();
  }

  @Delete('/delete/:id')
  async delete(@Param('id') id: number) {
    const model = await this.accountService.delete(id);
    if (model) {
      return model;
    }
    throw new BadRequestException();
  }
}

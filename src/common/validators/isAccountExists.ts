import { Injectable } from '@nestjs/common';
import {
  registerDecorator,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
  ValidationArguments,
} from 'class-validator';
import { AccountService } from 'src/services/Account.service';

@Injectable()
@ValidatorConstraint({ async: true })
export class IsAccountExistConstraint implements ValidatorConstraintInterface {
  constructor(private readonly accountService: AccountService) {}

  async validate(name: string, args: ValidationArguments) {
    let query = this.accountService.getAccountByName(name);
    const id = args.object['id'] || 0;
    if (id > 0) {
      query = query.andWhere('id != :id', { id: id });
    }
    return query.getExists();
  }
}

export function IsAccountExist(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [],
      validator: IsAccountExistConstraint,
    });
  };
}

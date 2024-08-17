import { Module } from '@nestjs/common';
import { AccountController } from './controllers/Account.controller';
import { AccountService } from './services/Account.service';
import { DomainService } from './services/Domain.service';
import { RequestService } from './services/Request.service';
import { RequestLocationService } from './services/RequestLocation.service';
import { TagService } from './services/Tag.service';
import { UrlService } from './services/Url.service';
import { UserService } from './services/User.service';
import { JwtModule } from '@nestjs/jwt';
import { JWTConfig } from 'config/jwt';
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { LocalAuthGuardInterceptor } from './interceptors/LocalAuthGuardInterceptor';
import { ListResponseInterceptor } from './interceptors/ListResponseInterceptor';

@Module({
  imports: [
    JwtModule.register({
      global: true,
      secret: JWTConfig.secret,
      signOptions: { expiresIn: '60s' },
    }),
  ],
  controllers: [AccountController],
  providers: [
    {
      provide: APP_GUARD,
      useClass: LocalAuthGuardInterceptor,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: ListResponseInterceptor,
    },
    AccountService,
    DomainService,
    RequestService,
    RequestLocationService,
    TagService,
    UrlService,
    UserService,
  ],
})
export class AppModule {}

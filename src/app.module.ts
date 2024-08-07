import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AccountController } from './controllers/Account.controller';

@Module({
  imports: [],
  controllers: [AccountController],
  providers: [AppService],
})
export class AppModule {}

import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { CryptoModule } from '../crypto/crypto.module';

@Module({
  imports: [CryptoModule], // 👈 IMPORTANTE
  controllers: [UsersController],
  providers: [UsersService],
})
export class UsersModule {}

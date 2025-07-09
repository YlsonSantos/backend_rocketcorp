import { Module } from '@nestjs/common';
import { SurveyService } from './survey.service';
import { SurveyController } from './survey.controller';
import { CryptoModule } from 'src/crypto/crypto.module';

@Module({
  imports: [CryptoModule],
  controllers: [SurveyController],
  providers: [SurveyService],
})
export class SurveyModule {}

import { Module } from '@nestjs/common';
import { EncryptedPrismaService } from './encrypted-prisma.service';
import { CryptoService } from '../crypto/crypto.service';
import { PrismaModule } from '../../prisma/prisma.module'; // ajusta se o caminho estiver diferente

@Module({
  imports: [PrismaModule],
  providers: [EncryptedPrismaService, CryptoService],
  exports: [EncryptedPrismaService, CryptoService],
})
export class EncryptionModule {}

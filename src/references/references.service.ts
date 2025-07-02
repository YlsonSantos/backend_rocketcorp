import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateReferenceDto } from './dto/create-reference.dto';
import { UpdateReferenceDto } from './dto/update-reference.dto';
import { EncryptedPrismaService } from '../encryption/encrypted-prisma.service';

@Injectable()
export class ReferencesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly encryptedPrisma: EncryptedPrismaService,
  ) {}

  async create(createReferenceDto: CreateReferenceDto, evaluatorId: string) {
    return this.encryptedPrisma.create('reference', {
      ...createReferenceDto,
      evaluatorId,
    });
  }

  async findAll() {
    return this.encryptedPrisma.findMany('reference');
  }

  async findOne(id: string) {
    return this.encryptedPrisma.findUnique('reference', {
      where: { id },
    });
  }

  async update(id: string, updateReferenceDto: UpdateReferenceDto) {
    return this.encryptedPrisma.update('reference', {
      where: { id },
      data: updateReferenceDto,
    });
  }

  async remove(id: string) {
    return this.prisma.reference.delete({ where: { id } });
  }
}

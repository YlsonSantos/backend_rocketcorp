import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateReferenceDto } from './dto/create-reference.dto';
import { UpdateReferenceDto } from './dto/update-reference.dto';

@Injectable()
export class ReferencesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createReferenceDto: CreateReferenceDto, evaluatorId: string) {
    return this.prisma.reference.create({
      data: {
        ...createReferenceDto,
        evaluatorId,
      },
    });
  }

  async findAll() {
    return this.prisma.reference.findMany();
  }

  async findOne(id: string) {
    return this.prisma.reference.findUnique({
      where: { id },
    });
  }

  async update(id: string, updateReferenceDto: UpdateReferenceDto) {
    return this.prisma.reference.update({
      where: { id },
      data: updateReferenceDto,
    });
  }

  async remove(id: string) {
    return this.prisma.reference.delete({ where: { id } });
  }
}

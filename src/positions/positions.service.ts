import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { TrackType } from '@prisma/client';

@Injectable()
export class PositionsService {
  constructor(private readonly prisma: PrismaService) {}

  async findByTrack(track: TrackType) {
    try {
      const positions = await this.prisma.position.findMany({
        where: {
          track: track,
        },
        select: {
          id: true,
          name: true,
          track: true,
        },
        orderBy: {
          name: 'asc',
        },
      });

      return positions;
    } catch (error) {
      throw new BadRequestException(
        `Erro ao buscar posições da track ${track}: ${error.message}`,
      );
    }
  }

  async findAll() {
    try {
      const positions = await this.prisma.position.findMany({
        select: {
          id: true,
          name: true,
          track: true,
        },
        orderBy: [
          {
            track: 'asc',
          },
          {
            name: 'asc',
          },
        ],
      });

      return positions;
    } catch (error) {
      throw new BadRequestException(
        `Erro ao buscar todas as posições: ${error.message}`,
      );
    }
  }

  async findOne(id: string) {
    try {
      const position = await this.prisma.position.findUnique({
        where: { id },
        select: {
          id: true,
          name: true,
          track: true,
        },
      });

      if (!position) {
        throw new BadRequestException('Posição não encontrada');
      }

      return position;
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException(
        `Erro ao buscar posição: ${error.message}`,
      );
    }
  }
} 
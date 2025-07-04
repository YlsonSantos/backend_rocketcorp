import { IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { TrackType } from '@prisma/client';

export class FindByTrackDto {
  @ApiProperty({
    description: 'Track das posições',
    enum: TrackType,
    example: 'DESENVOLVIMENTO',
  })
  @IsEnum(TrackType, {
    message: 'Track deve ser DESENVOLVIMENTO, DESIGN, FINANCEIRO, COMITE ou RH',
  })
  track: TrackType;
}

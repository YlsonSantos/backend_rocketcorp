import { PartialType, ApiPropertyOptional } from '@nestjs/swagger';
import { CreateReferenceDto } from './create-reference.dto';

export class UpdateReferenceDto extends PartialType(CreateReferenceDto) {
  @ApiPropertyOptional({
    example: 'user-uuid',
    description: 'ID of the referenced user',
  })
  referencedId?: string;

  @ApiPropertyOptional({
    example: 'Colaboração',
    description: 'Theme of the reference',
  })
  theme?: string;

  @ApiPropertyOptional({
    example: 'Ótima colaboração no projeto X',
    description: 'Justification for the reference',
  })
  justification?: string;
}

import { PartialType } from '@nestjs/swagger';
import { CreateMentoringDto } from './create-mentoring.dto';

export class UpdateMentoringDto extends PartialType(CreateMentoringDto) {}

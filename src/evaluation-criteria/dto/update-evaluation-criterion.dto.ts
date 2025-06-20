import { PartialType } from '@nestjs/swagger';
import { CreateEvaluationCriterionDto } from './create-evaluation-criterion.dto';

export class UpdateEvaluationCriterionDto extends PartialType(
  CreateEvaluationCriterionDto,
) {} 
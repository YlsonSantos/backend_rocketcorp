import { PartialType } from '@nestjs/swagger';
import { CreateGoalActionDto } from './create-goal-action.dto';

export class UpdateGoalActionDto extends PartialType(CreateGoalActionDto) {}

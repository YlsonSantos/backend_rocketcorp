import { Test, TestingModule } from '@nestjs/testing';
import { ScoreCycleController } from './score-cycle.controller';
import { ScoreCycleService } from './score-cycle.service';

describe('ScoreCycleController', () => {
  let controller: ScoreCycleController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ScoreCycleController],
      providers: [ScoreCycleService],
    }).compile();

    controller = module.get<ScoreCycleController>(ScoreCycleController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});

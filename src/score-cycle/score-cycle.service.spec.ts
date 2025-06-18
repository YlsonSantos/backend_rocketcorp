import { Test, TestingModule } from '@nestjs/testing';
import { ScoreCycleService } from './score-cycle.service';

describe('ScoreCycleService', () => {
  let service: ScoreCycleService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ScoreCycleService],
    }).compile();

    service = module.get<ScoreCycleService>(ScoreCycleService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});

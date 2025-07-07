import {
  Evaluation,
  EvaluationCycle,
  EvaluationAnswer,
  EvaluationType,
} from '@prisma/client';

export type EvaluationWithRelations = Evaluation & {
  cycle: EvaluationCycle;
  evaluated: {
    id: string;
    name: string;
    position: {
      name: string;
    };
  };
  team: {
    id: string;
    name: string;
  };
  answers: (EvaluationAnswer & {
    criterion: {
      title: string;
    };
  })[];
};

export interface EvaluationOutput {
  evaluationId: string;
  completedAt: Date;
  evaluationType: EvaluationType;
  evaluatedUser: {
    id: string;
    name: string;
    position: string;
  };
  selfScore?: number | null;
  finalScore?: number | null;
  answers: {
    criterion: string;
    score: number;
    justification: string;
    type: string
  }[];
}

export type CycleGroup = {
  cycleId: string;
  cycleName: string;
  startDate: Date;
  reviewDate: Date;
  endDate: Date;
  evaluations: EvaluationOutput[];
  scorePerCycle?: {
    selfScore: number | null;
    peerScores: number[] | null;
    leaderScore: number | null;
    finalScore: number | null;
    feedback: string | null;
  } | null;
};

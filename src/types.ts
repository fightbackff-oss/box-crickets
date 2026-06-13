export type ExtraType = 'none' | 'wide' | 'noball';

export interface Ball {
  id: string;
  runs: number; // Total runs added to the team score on this delivery
  isLegal: boolean; // false for wide/noball
  isWicket: boolean;
  extraType: ExtraType;
  timestamp: number;
  scoreAfterBall?: number;
  wicketsAfterBall?: number;
  overNumber?: number;
  ballNumberInOver?: number;
  runRateAfterBall?: number;
  requiredRateAfterBall?: number;
}

export interface Innings {
  teamName: string;
  balls: Ball[];
  runs: number;
  wickets: number;
  isComplete: boolean;
}

export interface CustomRules {
  oneTipOneHandOut: boolean;
  directCatchOut: boolean;
  hitRoofOut: boolean;
  hitNetTwoRuns: boolean;
  hitSideNetOneRun: boolean;
  lastManBatting: boolean;
}

export interface Player {
  id: string;
  name: string;
  matches: number;
  runs: number;
  wickets: number;
  wins: number;
}

export interface Match {
  id: string;
  teamA: string;
  teamB: string;
  maxOvers: number;
  playersPerTeam: number;
  tossWinner: string;
  tossDecision: 'bat' | 'bowl';
  firstInnings: Innings;
  secondInnings: Innings;
  status: 'playing' | 'completed';
  targetScore?: number;
  winner?: string;
  createdAt: number;
  rules?: CustomRules;
}

export interface Tournament {
  id: string;
  name: string;
  teams: string[];
  matches: string[]; // Match IDs
  standings: Record<string, { played: number, won: number, lost: number, points: number, nrr: number }>;
  createdAt: number;
}



export interface Marble {
  id: number;
  color: string;
  name: string;
  logoUrl: string; // URL for the team logo
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  angle: number; // Rotation angle in radians
  omega: number; // Angular velocity in radians/tick
  score: number; // For Points Mode
  finished: boolean;
  finishTime: number;
  rank: number; // 0 if not finished
  trail: { x: number, y: number }[];
  collectedItems: number; // For World Cup mode goals
}

export interface LineSegment {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  type: 'wall' | 'floor' | 'bouncer';
}

export interface CircleObstacle {
  x: number;
  y: number;
  radius: number;
  type: 'pin' | 'bumper';
  initialX?: number;
  speed?: number;
  range?: number;
}

export interface DynamicObstacle {
  id: string;
  type: 'spinner' | 'slider_h' | 'slider_v' | 'fan' | 'repulsor' | 'conveyor' | 'laser' | 'teleporter' | 'hollow_circle';
  x: number;
  y: number;
  width: number; // Length of the line/blade, width of fan source, or portal radius
  height?: number; // Range of the fan wind or laser length
  angle: number;
  speed: number;
  range?: number; // For sliders or repulsor pulse radius, OR gap size (radians) for hollow_circle
  initialX?: number;
  initialY?: number;
  force?: number; // Wind strength, Repulsor force, or Laser push
  destX?: number; // For teleporter exit
  destY?: number; // For teleporter exit
  active?: boolean; // For laser toggle state, and now Portal active state
  timer?: number; // Internal timer
  blinkPhase?: number; // For intermittent portals (0 to 2PI)
  blinkSpeed?: number; // How fast the portal fades in/out
}

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;     // 0.0 to 1.0
  decay: number;    // How much life to remove per tick
  color: string;
  size: number;
}

export interface SoccerBallItem {
  id: string;
  x: number;
  y: number;
  collected: boolean;
}

export interface PhysicsConfig {
  gravity: number;
  restitution: number; // Bounciness 0.1 to 0.9
  friction: number;
}

export interface ObstacleSettings {
  spinner: boolean;
  slider: boolean;
  repulsor: boolean;
  conveyor: boolean;
  teleporter: boolean;
  hollow_circle: boolean;
  laser: boolean;
  fan: boolean;
  funnel: boolean;
}

export type GameMode = 'elimination' | 'inverted_elimination' | 'points' | 'cup' | 'world_cup';

export interface Match {
  id: string;
  name: string;
  marbleIds: number[];
  type: 'group' | 'knockout';
  nextPhase?: boolean; // If true, triggers generation of next round matches
  groupIndex?: number; // 0-11 for groups A-L
  matchups?: [number, number][]; // [[team0Idx, team1Idx], [team2Idx, team3Idx]]
}

export interface GameState {
  gameMode: GameMode;
  phase: 'betting' | 'cup_tree' | 'racing' | 'round_result' | 'champion';
  round: number; // Starts at 1
  totalRounds: number; // Dynamic
  marbles: Marble[]; // All marbles with current stats
  activeMarbleIds: number[]; // IDs of marbles in the CURRENT race
  betMarbleId: number | null;
  lastEliminatedId: number | null;
  roundPoints: Record<number, number>; // Points earned in the current round
  
  // Cup Specifics
  cupMatches: Match[];
  currentMatchIndex: number;
  cupGroups: number[][]; // [ [id1, id2...], [id3, id4...] ]
  cupScores: Record<number, number>;
  cupGoals: Record<number, number>;
  cupGoalsConceded: Record<number, number>;
  cupMatchesPlayed: Record<number, number>;
  cupPhase: 'groups' | 'groups_finished' | 'sixteenths' | 'octavas' | 'quartas' | 'semi' | 'final';
  cupGroupScores?: Record<number, number>;
  cupGroupGoals?: Record<number, number>;
  cupGroupGoalsConceded?: Record<number, number>;
  cupGroupMatchesPlayed?: Record<number, number>;
  cupBestThirdPlacesIds?: number[];
}

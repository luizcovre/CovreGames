
import React, { useState, useEffect, useMemo } from 'react';
import RaceEngine from './components/RaceEngine';
import { Marble, GameState, PhysicsConfig, GameMode, ObstacleSettings, Match } from './types';
import { Trophy, Settings, Skull, Play, Medal, X, Pause, Camera, Sliders, PlayCircle, FastForward, GitMerge, LayoutGrid, BarChart2, Trash2, ZoomIn, ZoomOut } from 'lucide-react';
import { audio } from './services/audioService';

// Data for Brazilian Teams
const BRASIL_TEAMS = [
  { name: "São Paulo", color: "#C62925", logo: "https://a.espncdn.com/i/teamlogos/soccer/500/2026.png" },
  { name: "Santos", color: "#000000", logo: "https://a.espncdn.com/i/teamlogos/soccer/500/2674.png" }, 
  { name: "Palmeiras", color: "#006437", logo: "https://a.espncdn.com/i/teamlogos/soccer/500/2029.png" },
  { name: "Corinthians", color: "#000000", logo: "https://a.espncdn.com/i/teamlogos/soccer/500/874.png" },
  { name: "Flamengo", color: "#C3281E", logo: "https://a.espncdn.com/i/teamlogos/soccer/500/819.png" },
  { name: "Vasco", color: "#000000", logo: "https://a.espncdn.com/i/teamlogos/soccer/500/3454.png" },
  { name: "Fluminense", color: "#8A191D", logo: "https://a.espncdn.com/i/teamlogos/soccer/500/3445.png" },
  { name: "Botafogo", color: "#000000", logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/5/52/Botafogo_de_Futebol_e_Regatas_logo.svg/500px-Botafogo_de_Futebol_e_Regatas_logo.svg.png" },
  { name: "Cruzeiro", color: "#005CA9", logo: "https://a.espncdn.com/i/teamlogos/soccer/500/2022.png" },
  { name: "Atlético MG", color: "#000000", logo: "https://commons.wikimedia.org/wiki/Special:FilePath/Clube%20Atl%C3%A9tico%20Mineiro%20logo.svg?width=500" },
  { name: "Grêmio", color: "#0D80BF", logo: "https://a.espncdn.com/i/teamlogos/soccer/500/6273.png" },
  { name: "Internacional", color: "#E30613", logo: "https://a.espncdn.com/i/teamlogos/soccer/500/1936.png" },
  { name: "Bahia", color: "#0083CA", logo: "https://a.espncdn.com/i/teamlogos/soccer/500/9967.png" },
  { name: "Fortaleza", color: "#132E66", logo: "https://a.espncdn.com/i/teamlogos/soccer/500/6272.png" },
  { name: "Sport", color: "#D30915", logo: "https://a.espncdn.com/i/teamlogos/soccer/500/7635.png" },
  { name: "Vitória", color: "#C8102E", logo: "https://a.espncdn.com/i/teamlogos/soccer/500/3457.png" },
  { name: "Athletico-PR", color: "#CA171D", logo: "https://a.espncdn.com/i/teamlogos/soccer/500/3458.png" },
  { name: "Coritiba", color: "#00532C", logo: "https://commons.wikimedia.org/wiki/Special:FilePath/Coritiba%20FBC%20(2011)%20-%20PR.svg?width=500" },
  { name: "Goiás", color: "#006C47", logo: "https://commons.wikimedia.org/wiki/Special:FilePath/Goi%C3%A1s%20Esporte%20Clube%20logo.svg?width=500" },
  { name: "Mirassol", color: "#FFD700", logo: "https://a.espncdn.com/i/teamlogos/soccer/500/9169.png" }
];

const WORLD_CUP_TEAMS = [
    { name: "México", color: "#006847", code: "mx" }, { name: "África do Sul", color: "#007A4D", code: "za" }, { name: "Coreia do Sul", color: "#CD2E3A", code: "kr" }, { name: "República Tcheca", color: "#11457E", code: "cz" },
    { name: "Canadá", color: "#FF0000", code: "ca" }, { name: "Bósnia", color: "#002395", code: "ba" }, { name: "Catar", color: "#8D1B3D", code: "qa" }, { name: "Suíça", color: "#D52B1E", code: "ch" },
    { name: "Brasil", color: "#FFDC02", code: "br" }, { name: "Marrocos", color: "#C1272D", code: "ma" }, { name: "Haiti", color: "#00209F", code: "ht" }, { name: "Escócia", color: "#005EB8", code: "gb-sct" },
    { name: "Estados Unidos", color: "#B22234", code: "us" }, { name: "Paraguai", color: "#D52B1E", code: "py" }, { name: "Austrália", color: "#00008B", code: "au" }, { name: "Turquia", color: "#E30A17", code: "tr" },
    { name: "Alemanha", color: "#000000", code: "de" }, { name: "Curaçao", color: "#002B7F", code: "cw" }, { name: "Costa do Marfim", color: "#FF8200", code: "ci" }, { name: "Equador", color: "#FFDD00", code: "ec" },
    { name: "Holanda", color: "#F36C21", code: "nl" }, { name: "Japão", color: "#BC002D", code: "jp" }, { name: "Suécia", color: "#006AA7", code: "se" }, { name: "Tunísia", color: "#E70013", code: "tn" },
    { name: "Bélgica", color: "#EF3340", code: "be" }, { name: "Egito", color: "#C8102E", code: "eg" }, { name: "Irã", color: "#239E46", code: "ir" }, { name: "Nova Zelândia", color: "#000000", code: "nz" },
    { name: "Espanha", color: "#AD1519", code: "es" }, { name: "Cabo Verde", color: "#003893", code: "cv" }, { name: "Arábia Saudita", color: "#006C35", code: "sa" }, { name: "Uruguai", color: "#0038A8", code: "uy" },
    { name: "França", color: "#002395", code: "fr" }, { name: "Senegal", color: "#118800", code: "sn" }, { name: "Iraque", color: "#007A33", code: "iq" }, { name: "Noruega", color: "#EF2B2D", code: "no" },
    { name: "Argentina", color: "#75AADB", code: "ar" }, { name: "Argélia", color: "#006233", code: "dz" }, { name: "Áustria", color: "#ED2939", code: "at" }, { name: "Jordânia", color: "#CE1126", code: "jo" },
    { name: "Portugal", color: "#FF0000", code: "pt" }, { name: "RD Congo", color: "#007FFF", code: "cd" }, { name: "Uzbequistão", color: "#0099B5", code: "uz" }, { name: "Colômbia", color: "#FCD116", code: "co" },
    { name: "Inglaterra", color: "#000000", code: "gb-eng" }, { name: "Croácia", color: "#FF0000", code: "hr" }, { name: "Gana", color: "#006B3F", code: "gh" }, { name: "Panamá", color: "#DA121A", code: "pa" }
].map(t => ({ ...t, logo: `https://flagcdn.com/w160/${t.code}.png` }));

const POINTS_SYSTEM = Array.from({length: 48}, (_, i) => 48 - i);
const CUP_GROUP_POINTS = [10, 7, 5, 2, 1];

const WC_GROUP_POINTS = [5, 3, 1, 0];

const getMarblesForTeams = (teams: any[], idOffset: number = 0) => teams.map((team, i) => ({
  id: i + idOffset,
  name: team.name,
  color: team.color,
  logoUrl: team.logo,
  x: 0, y: 0, vx: 0, vy: 0, 
  radius: 18, 
  angle: 0,
  omega: 0,
  score: 0,
  finished: false, finishTime: 0, rank: 0,
  trail: []
}));

const INITIAL_MARBLES = getMarblesForTeams(BRASIL_TEAMS, 0);
const WC_MARBLES = getMarblesForTeams(WORLD_CUP_TEAMS, 100);

function shuffle<T>(array: T[]): T[] {
  const newArr = [...array];
  for (let i = newArr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArr[i], newArr[j]] = [newArr[j], newArr[i]];
  }
  return newArr;
}

interface MatchStats {
    completed: number;
    interrupted: number;
}

interface TeamStats {
    titles: { total: number; elimination: number; inverted_elimination: number; points: number; cup: number; world_cup: number };
    points: { total: number; elimination: number; inverted_elimination: number; points: number; cup: number; world_cup: number };
    raceWins: { total: number; elimination: number; inverted_elimination: number; points: number; cup: number; world_cup: number };
}

interface Statistics {
    matches: {
        total: MatchStats;
        elimination: MatchStats;
        inverted_elimination: MatchStats;
        points: MatchStats;
        cup: MatchStats;
        world_cup: MatchStats;
    };
    teams: Record<number, TeamStats>;
}

const INITIAL_STATS: Statistics = {
    matches: {
        total: { completed: 0, interrupted: 0 },
        elimination: { completed: 0, interrupted: 0 },
        inverted_elimination: { completed: 0, interrupted: 0 },
        points: { completed: 0, interrupted: 0 },
        cup: { completed: 0, interrupted: 0 },
        world_cup: { completed: 0, interrupted: 0 }
    },
    teams: {} 
};

// Populate stats for both sets (max 200 teams for safety)
for (let i = 0; i < 200; i++) {
    INITIAL_STATS.teams[i] = {
        titles: { total: 0, elimination: 0, inverted_elimination: 0, points: 0, cup: 0, world_cup: 0 },
        points: { total: 0, elimination: 0, inverted_elimination: 0, points: 0, cup: 0, world_cup: 0 },
        raceWins: { total: 0, elimination: 0, inverted_elimination: 0, points: 0, cup: 0, world_cup: 0 }
    };
}

export default function App() {
  const [statistics, setStatistics] = useState<Statistics>(() => {
      const saved = localStorage.getItem('marble_royale_stats_v1');
      if (saved) {
          try {
              const parsed = JSON.parse(saved);
              return { 
                  ...INITIAL_STATS, 
                  matches: { ...INITIAL_STATS.matches, ...parsed.matches }, 
                  teams: { ...INITIAL_STATS.teams, ...parsed.teams } 
              };
          } catch(e) {
              return JSON.parse(JSON.stringify(INITIAL_STATS));
          }
      }
      return JSON.parse(JSON.stringify(INITIAL_STATS));
  });

  const saveStats = (newStats: Statistics) => {
      setStatistics(newStats);
      localStorage.setItem('marble_royale_stats_v1', JSON.stringify(newStats));
  };

  const [gameState, setGameState] = useState<GameState>({
    gameMode: 'elimination',
    phase: 'betting',
    round: 1,
    totalRounds: BRASIL_TEAMS.length - 1, 
    marbles: INITIAL_MARBLES,
    activeMarbleIds: INITIAL_MARBLES.map(m => m.id),
    betMarbleId: null,
    lastEliminatedId: null,
    roundPoints: {},
    cupMatches: [],
    currentMatchIndex: 0,
    cupGroups: [],
    cupScores: {},
    cupGoals: {},
    cupGoalsConceded: {},
    cupMatchesPlayed: {},
    cupPhase: 'groups'
  });

  const [physicsConfig, setPhysicsConfig] = useState<PhysicsConfig>({
    gravity: 0.25,
    restitution: 0.6,
    friction: 0.99
  });

  const [obstacleSettings] = useState<ObstacleSettings>({
    spinner: true,
    slider: true,
    repulsor: true,
    conveyor: true,
    teleporter: true,
    hollow_circle: true,
    laser: true,
    fan: true,
    funnel: true
  });

  const [isPaused, setIsPaused] = useState(false);
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const [showStatisticsModal, setShowStatisticsModal] = useState(false);
  const [statsTab, setStatsTab] = useState<'clubs' | 'teams'>('clubs');
  const [cupViewTab, setCupViewTab] = useState<'bracket' | 'groups'>('bracket');

  useEffect(() => {
    if (gameState.cupPhase === 'groups' || gameState.cupPhase === 'groups_finished') {
      setCupViewTab('groups');
    } else {
      setCupViewTab('bracket');
    }
  }, [gameState.cupPhase]);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [isFollowingBet, setIsFollowingBet] = useState(false);
  const [zoom, setZoom] = useState(1.0);
  const [liveMarbles, setLiveMarbles] = useState<Marble[]>([]);
  const isTournamentMode = gameState.gameMode === 'cup' || gameState.gameMode === 'world_cup';
  const isWC = gameState.gameMode === 'world_cup';
  const match = gameState.cupMatches[gameState.currentMatchIndex];

  const activeMarblesList = useMemo(() => 
    gameState.marbles.filter(m => gameState.activeMarbleIds.includes(m.id)),
    [gameState.marbles, gameState.activeMarbleIds]
  );

  const recordMatchInterruption = () => {
      const newStats = JSON.parse(JSON.stringify(statistics));
      const mode = gameState.gameMode;
      newStats.matches.total.interrupted++;
      if (newStats.matches[mode]) newStats.matches[mode].interrupted++;
      saveStats(newStats);
  };

  const recordMatchCompletion = (winnerId: number) => {
      const newStats = JSON.parse(JSON.stringify(statistics));
      const mode = gameState.gameMode;
      newStats.matches.total.completed++;
      if (newStats.matches[mode]) newStats.matches[mode].completed++;
      if (newStats.teams[winnerId]) {
          newStats.teams[winnerId].titles.total++;
          newStats.teams[winnerId].titles[mode]++;
      }
      saveStats(newStats);
  };

  const recordRoundStats = (results: Marble[], roundPoints: Record<number, number>) => {
      const newStats = JSON.parse(JSON.stringify(statistics));
      const mode = gameState.gameMode;
      if (results.length > 0) {
          const winners = results.filter(m => m.finished).sort((a,b) => a.rank - b.rank);
          if (winners.length > 0) {
              const winnerId = winners[0].id;
              if (newStats.teams[winnerId]) {
                  newStats.teams[winnerId].raceWins.total++;
                  newStats.teams[winnerId].raceWins[mode]++;
              }
          }
      }
      Object.entries(roundPoints).forEach(([idStr, points]) => {
          const id = parseInt(idStr);
          if (newStats.teams[id]) {
              newStats.teams[id].points.total += points;
              newStats.teams[id].points[mode] += points;
          }
      });
      saveStats(newStats);
  };

  const resetStatistics = () => {
      if (window.confirm("Tem certeza que deseja apagar todo o histórico de partidas?")) {
          const reset = JSON.parse(JSON.stringify(INITIAL_STATS));
          saveStats(reset);
      }
  };

  const generateCupSchedule = (marbleIds: number[], isWC: boolean = false) => {
      const groups: number[][] = [];
      const matches: Match[] = [];
      
      if (isWC) {
          // World Cup 2026: 12 groups of 4
          for (let i = 0; i < 12; i++) {
              groups.push(marbleIds.slice(i * 4, i * 4 + 4));
          }
          const groupNames = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L'];
          // Round-robin for each group: 3 rounds
          // R1: 0-1, 2-3
          // R2: 0-2, 3-1
          // R3: 0-3, 1-2
          for (let r = 1; r <= 3; r++) {
              groups.forEach((groupIds, gIdx) => {
                  let matchups: [number, number][] = [];
                  if (r === 1) matchups = [[groupIds[0], groupIds[1]], [groupIds[2], groupIds[3]]];
                  if (r === 2) matchups = [[groupIds[0], groupIds[2]], [groupIds[3], groupIds[1]]];
                  if (r === 3) matchups = [[groupIds[0], groupIds[3]], [groupIds[1], groupIds[2]]];
                  
                  matches.push({
                      id: `wc_g${gIdx}_r${r}`,
                      name: `Grupo ${groupNames[gIdx]} - Rodada ${r}`,
                      marbleIds: groupIds,
                      type: 'group',
                      groupIndex: gIdx,
                      matchups,
                      nextPhase: (r === 3 && gIdx === 11)
                  });
              });
          }
      } else {
          const shuffled = shuffle(marbleIds);
          const numGroups = 4;
          const groupSize = Math.floor(shuffled.length / numGroups);
          for (let i = 0; i < numGroups; i++) {
              groups.push(shuffled.slice(i * groupSize, (i + 1) * groupSize));
          }
          const groupNames = ['A', 'B', 'C', 'D'];
          for (let r = 1; r <= 5; r++) {
              groups.forEach((groupIds, gIdx) => {
                  matches.push({
                      id: `g${gIdx}_r${r}`,
                      name: `Grupo ${groupNames[gIdx]} - Rodada ${r}`,
                      marbleIds: groupIds,
                      type: 'group',
                      groupIndex: gIdx,
                      nextPhase: (r === 5 && gIdx === 3)
                  });
              });
          }
      }
      return { groups, matches };
  };

  const getMatchNumberName = (phaseName: string, index: number, isWCMode: boolean) => {
      if (!isWCMode) {
          if (phaseName === 'Terceiro') return 'DISPUTA DE 3º LUGAR';
          return `JOGO ${index + 1}`;
      }
      switch (phaseName) {
          case '16-avos':
              return `JOGO ${index + 1}`;
          case 'Oitavas':
              return `JOGO ${17 + index}`;
          case 'Quartas':
              return `JOGO ${25 + index}`;
          case 'Semi':
              return `JOGO ${29 + index}`;
          case 'Terceiro':
              return `JOGO 31`;
          case 'Final':
              return `JOGO 32`;
          default:
              return `JOGO ${index + 1}`;
      }
  };

  const generateKnockoutMatches = (qualifiers: number[], phaseName: string) => {
      const matches: Match[] = [];
      const isWCMode = gameState.gameMode === 'world_cup';
      for (let i = 0; i < qualifiers.length; i += 2) {
          const matchIdx = Math.floor(i/2);
          const matchName = isWCMode ? getMatchNumberName(phaseName, matchIdx, true) : `${phaseName} - Jogo ${matchIdx + 1}`;
          matches.push({
              id: `${phaseName}_${i}`,
              name: matchName,
              marbleIds: [qualifiers[i], qualifiers[i+1]],
              type: 'knockout',
              nextPhase: (i === qualifiers.length - 2),
              matchups: [[qualifiers[i], qualifiers[i+1]]]
          });
      }
      return matches;
  };

  const handleModeSelect = (mode: GameMode) => {
    let newTotalRounds = 0;
    let newMarbles = INITIAL_MARBLES;
    
    if (mode === 'world_cup') {
        newTotalRounds = 36 + 16 + 8 + 4 + 2 + 2; // 36 group races + knockouts (inc. 3rd place & final)
        newMarbles = WC_MARBLES;
    } else {
        if (mode === 'elimination' || mode === 'inverted_elimination') newTotalRounds = BRASIL_TEAMS.length - 1;
        if (mode === 'points') newTotalRounds = 10;
        if (mode === 'cup') newTotalRounds = 35;
        newMarbles = INITIAL_MARBLES;
    }
    
    setGameState(prev => ({
      ...prev,
      gameMode: mode,
      totalRounds: newTotalRounds,
      marbles: newMarbles,
      activeMarbleIds: newMarbles.map(m => m.id),
      betMarbleId: null // Reset bet when switching team sets
    }));
  };

  const handleStartTournament = () => {
    if (gameState.betMarbleId === null) return;
    if (gameState.gameMode === 'cup' || gameState.gameMode === 'world_cup') {
        const { groups, matches } = generateCupSchedule(gameState.marbles.map(m => m.id), gameState.gameMode === 'world_cup');
        setGameState(prev => ({
            ...prev,
            phase: 'cup_tree',
            cupGroups: groups,
            cupMatches: matches,
            currentMatchIndex: 0,
            cupScores: {},
            cupGoals: {},
            cupGoalsConceded: {},
            cupMatchesPlayed: {},
            cupPhase: 'groups',
            activeMarbleIds: matches[0].marbleIds,
            round: 1,
            cupGroupScores: undefined,
            cupGroupGoals: undefined,
            cupGroupGoalsConceded: undefined,
            cupGroupMatchesPlayed: undefined,
            cupBestThirdPlacesIds: undefined
        }));
    } else {
        setGameState(prev => ({ ...prev, phase: 'racing' }));
        audio.init();
        audio.resume();
        setIsPaused(false);
        setShowExitConfirm(false);
        setIsFollowingBet(false);
    }
  };

  const handleTransitionToKnockouts = () => {
      let finalQualifiers: number[] = [];
      let targetPhase: 'sixteenths' | 'octavas' = 'sixteenths';
      let nextMatches = [...gameState.cupMatches];
      
      if (gameState.gameMode === 'world_cup') {
          targetPhase = 'sixteenths';
          
          const sortedGroups = gameState.cupGroups.map((group) => {
              return [...group].sort((a, b) => {
                  const ptsDiff = (gameState.cupScores[b] || 0) - (gameState.cupScores[a] || 0);
                  if (ptsDiff !== 0) return ptsDiff;
                  const gdDiff = ((gameState.cupGoals[b] || 0) - (gameState.cupGoalsConceded[b] || 0)) - ((gameState.cupGoals[a] || 0) - (gameState.cupGoalsConceded[a] || 0));
                  if (gdDiff !== 0) return gdDiff;
                  return (gameState.cupGoals[b] || 0) - (gameState.cupGoals[a] || 0);
              });
          });
          
          const thirdPlacesInfo = sortedGroups.map((sortedGroup, gIdx) => {
              const tId = sortedGroup[2];
              return {
                  id: tId,
                  groupIdx: gIdx,
                  score: gameState.cupScores[tId] || 0,
                  gd: (gameState.cupGoals[tId] || 0) - (gameState.cupGoalsConceded[tId] || 0),
                  gf: gameState.cupGoals[tId] || 0
              };
          });
          
          const sortedThirdPlaces = [...thirdPlacesInfo].sort((a, b) => {
              if (b.score !== a.score) return b.score - a.score;
              if (b.gd !== a.gd) return b.gd - a.gd;
              return b.gf - a.gf;
          }).slice(0, 8);
          
          const slots = [
              { gameIdx: 1, allowed: [0, 1, 2, 3, 5] },   // A/B/C/D/F (Jogo 74)
              { gameIdx: 4, allowed: [2, 3, 5, 6, 7] },   // C/D/F/G/H (Jogo 77)
              { gameIdx: 6, allowed: [2, 4, 5, 7, 8] },   // C/E/F/H/I (Jogo 79)
              { gameIdx: 7, allowed: [4, 7, 8, 9, 10] },  // E/H/I/J/K (Jogo 80)
              { gameIdx: 8, allowed: [1, 4, 5, 8, 9] },   // B/E/F/I/J (Jogo 81)
              { gameIdx: 9, allowed: [0, 4, 7, 8, 9] },   // A/E/H/I/J (Jogo 82)
              { gameIdx: 12, allowed: [4, 5, 6, 8, 9] },  // E/F/G/I/J (Jogo 85)
              { gameIdx: 14, allowed: [3, 4, 8, 9, 11] }  // D/E/I/J/L (Jogo 87)
          ];
          
          const assignedThirds: { [gameIdx: number]: number } = {};
          const assignedTeamIdsSet = new Set<number>();
          
          const backtrack = (slotIdx: number): boolean => {
              if (slotIdx === 8) return true;
              const slot = slots[slotIdx];
              for (let i = 0; i < sortedThirdPlaces.length; i++) {
                  const team = sortedThirdPlaces[i];
                  if (!assignedTeamIdsSet.has(team.id)) {
                      if (slot.allowed.includes(team.groupIdx)) {
                          assignedTeamIdsSet.add(team.id);
                          assignedThirds[slot.gameIdx] = team.id;
                          if (backtrack(slotIdx + 1)) return true;
                          assignedTeamIdsSet.delete(team.id);
                          delete assignedThirds[slot.gameIdx];
                      }
                  }
              }
              return false;
          };
          
          if (!backtrack(0)) {
              const remainingThirds = [...sortedThirdPlaces];
              slots.forEach((s) => {
                  const idx = remainingThirds.findIndex(t => s.allowed.includes(t.groupIdx));
                  if (idx !== -1) {
                      assignedThirds[s.gameIdx] = remainingThirds[idx].id;
                      remainingThirds.splice(idx, 1);
                  }
              });
              slots.forEach((s) => {
                  if (assignedThirds[s.gameIdx] === undefined && remainingThirds.length > 0) {
                      assignedThirds[s.gameIdx] = remainingThirds[0].id;
                      remainingThirds.splice(0, 1);
                  }
              });
          }
          
          const sixteenthsPairings: [number, number][] = [
              [sortedGroups[0][1], sortedGroups[1][1]], // J73
              [sortedGroups[4][0], assignedThirds[1]],  // J74
              [sortedGroups[5][0], sortedGroups[2][1]], // J75
              [sortedGroups[2][0], sortedGroups[5][1]], // J76
              [sortedGroups[8][0], assignedThirds[4]],  // J77
              [sortedGroups[4][1], sortedGroups[8][1]], // J78
              [sortedGroups[0][0], assignedThirds[6]],  // J79
              [sortedGroups[11][0], assignedThirds[7]], // J80
              [sortedGroups[3][0], assignedThirds[8]],  // J81
              [sortedGroups[6][0], assignedThirds[9]],  // J82
              [sortedGroups[10][1], sortedGroups[11][1]], // J83
              [sortedGroups[7][0], sortedGroups[9][1]], // J84
              [sortedGroups[1][0], assignedThirds[12]], // J85
              [sortedGroups[9][0], sortedGroups[7][1]], // J86
              [sortedGroups[10][0], assignedThirds[14]], // J87
              [sortedGroups[3][1], sortedGroups[6][1]]  // J88
          ];
          
          const sixteenthsMatches = sixteenthsPairings.map((pair, idx) => {
              const matchName = getMatchNumberName("16-avos", idx, true);
              return {
                  id: `16-avos_${idx * 2}`,
                  name: matchName,
                  marbleIds: pair,
                  type: 'knockout' as const,
                  nextPhase: idx === 15,
                  matchups: [pair]
              };
          });
          
          nextMatches = [...nextMatches, ...sixteenthsMatches];
      } else {
          targetPhase = 'octavas';
          const qualifiers: number[] = [];
          gameState.cupGroups.forEach(group => {
              const sorted = [...group].sort((a, b) => (gameState.cupScores[b] || 0) - (gameState.cupScores[a] || 0));
              qualifiers.push(...sorted.slice(0, 4));
          });
          
          const sortedGroups = gameState.cupGroups.map(group => 
              [...group].sort((a, b) => (gameState.cupScores[b] || 0) - (gameState.cupScores[a] || 0))
          );
          
          const finalQualifiersList: number[] = [];
          for(let i=0; i<4; i++) {
             finalQualifiersList.push(sortedGroups[0][i]);
             finalQualifiersList.push(sortedGroups[1][3-i]);
          }
          for(let i=0; i<4; i++) {
             finalQualifiersList.push(sortedGroups[2][i]);
             finalQualifiersList.push(sortedGroups[3][3-i]);
          }
          nextMatches = [...nextMatches, ...generateKnockoutMatches(finalQualifiersList, "Oitavas")];
      }
      
      const firstKnockoutIdx = gameState.gameMode === 'world_cup' ? 36 : 20;
      const firstKnockoutMatch = nextMatches[firstKnockoutIdx];
      
      let nextScores = { ...gameState.cupScores };
      Object.keys(nextScores).forEach(key => { nextScores[parseInt(key)] = 0; });

      const cupGroupScores = { ...gameState.cupScores };
      const cupGroupGoals = { ...gameState.cupGoals };
      const cupGroupGoalsConceded = { ...gameState.cupGoalsConceded };
      const cupGroupMatchesPlayed = { ...gameState.cupMatchesPlayed };
      let cupBestThirdPlacesIds: number[] = [];
      if (gameState.gameMode === 'world_cup') {
          const sortedGroups = gameState.cupGroups.map((group) => {
              return [...group].sort((a, b) => {
                  const ptsDiff = (gameState.cupScores[b] || 0) - (gameState.cupScores[a] || 0);
                  if (ptsDiff !== 0) return ptsDiff;
                  const gdDiff = ((gameState.cupGoals[b] || 0) - (gameState.cupGoalsConceded[b] || 0)) - ((gameState.cupGoals[a] || 0) - (gameState.cupGoalsConceded[a] || 0));
                  if (gdDiff !== 0) return gdDiff;
                  return (gameState.cupGoals[b] || 0) - (gameState.cupGoals[a] || 0);
              });
          });
          const thirdPlacesInfo = sortedGroups.map((sortedGroup, gIdx) => {
              const tId = sortedGroup[2];
              return {
                  id: tId,
                  score: gameState.cupScores[tId] || 0,
                  gd: (gameState.cupGoals[tId] || 0) - (gameState.cupGoalsConceded[tId] || 0),
                  gf: gameState.cupGoals[tId] || 0
              };
          });
          cupBestThirdPlacesIds = [...thirdPlacesInfo].sort((a, b) => {
              if (b.score !== a.score) return b.score - a.score;
              if (b.gd !== a.gd) return b.gd - a.gd;
              return b.gf - a.gf;
          }).slice(0, 8).map(t => t.id);
      }

      setGameState(prev => ({
          ...prev,
          cupMatches: nextMatches,
          cupPhase: targetPhase,
          currentMatchIndex: firstKnockoutIdx,
          activeMarbleIds: firstKnockoutMatch.marbleIds,
          cupScores: nextScores,
          cupGroupScores,
          cupGroupGoals,
          cupGroupGoalsConceded,
          cupGroupMatchesPlayed,
          cupBestThirdPlacesIds,
          round: prev.round + 1
      }));
  };

  const handleStartCupRacing = () => {
      setGameState(prev => ({ ...prev, phase: 'racing' }));
      audio.init();
      audio.resume();
      setIsPaused(false);
      setShowExitConfirm(false);
      setIsFollowingBet(false);
  };

  const handleExitTournament = () => {
      recordMatchInterruption();
      resetGame();
  };

  const handleSimulateAllGroups = () => {
      if (gameState.gameMode !== 'world_cup' || gameState.cupPhase !== 'groups') return;
      
      let newScores = { ...gameState.cupScores };
      let newGoals = { ...gameState.cupGoals };
      let newGoalsConceded = { ...gameState.cupGoalsConceded };
      let newPlayed = { ...gameState.cupMatchesPlayed };
      let updatedMarbles = [...gameState.marbles];
      let nextMatches = [...gameState.cupMatches];

      for (let mIdx = gameState.currentMatchIndex; mIdx < nextMatches.length; mIdx++) {
          const match = nextMatches[mIdx];
          if (match.type !== 'group') continue;

          const matchMarbles: Marble[] = updatedMarbles.filter(m => match.marbleIds.includes(m.id));
          const shuffledResults = shuffle<Marble>(matchMarbles).map((m, i) => ({
              ...m,
              rank: i + 1,
              finished: true,
              finishTime: i * 100,
              collectedItems: Math.floor(Math.random() * 5)
          }));

          match.marbleIds.forEach(id => {
              newPlayed[id] = (newPlayed[id] || 0) + 1;
          });

          let overallWinnerId = shuffledResults[0].id;

          if (match.matchups) {
              match.matchups.forEach(([idA, idB]) => {
                  const marbleA = shuffledResults.find(m => m.id === idA);
                  const marbleB = shuffledResults.find(m => m.id === idB);
                  const goalsA = marbleA?.collectedItems || 0;
                  const goalsB = marbleB?.collectedItems || 0;

                  newGoals[idA] = (newGoals[idA] || 0) + goalsA;
                  newGoals[idB] = (newGoals[idB] || 0) + goalsB;
                  newGoalsConceded[idA] = (newGoalsConceded[idA] || 0) + goalsB;
                  newGoalsConceded[idB] = (newGoalsConceded[idB] || 0) + goalsA;

                  let pointsA = 0;
                  let pointsB = 0;

                  if (goalsA > goalsB) {
                      pointsA = 3;
                  } else if (goalsB > goalsA) {
                      pointsB = 3;
                  } else {
                      pointsA = 1;
                      pointsB = 1;
                  }

                  newScores[idA] = (newScores[idA] || 0) + pointsA;
                  newScores[idB] = (newScores[idB] || 0) + pointsB;
              });

              shuffledResults.forEach((m, idx) => {
                  const mIdxInMarbles = updatedMarbles.findIndex(mar => mar.id === m.id);
                  if (mIdxInMarbles !== -1) {
                      updatedMarbles[mIdxInMarbles] = {
                          ...updatedMarbles[mIdxInMarbles],
                          score: newScores[m.id],
                          rank: idx + 1,
                          finished: true,
                          finishTime: m.finishTime || idx,
                          collectedItems: m.collectedItems
                      };
                  }
              });
          }

          nextMatches[mIdx] = { ...match, winnerId: overallWinnerId };
      }

      const lastGroupMatchIdx = nextMatches.map((m, i) => m.type === 'group' ? i : -1).reduce((max, current) => Math.max(max, current), 0);

      setGameState(prev => ({
          ...prev,
          marbles: updatedMarbles,
          cupScores: newScores,
          cupGoals: newGoals,
          cupGoalsConceded: newGoalsConceded,
          cupMatchesPlayed: newPlayed,
          cupMatches: nextMatches,
          cupPhase: 'groups_finished',
          currentMatchIndex: lastGroupMatchIdx,
          phase: 'cup_tree'
      }));
  };

  const handleSimulateMatch = () => {
      if (gameState.gameMode !== 'cup' && gameState.gameMode !== 'world_cup') return;
      const currentMatch = gameState.cupMatches[gameState.currentMatchIndex];
      if (!currentMatch) return;
      const matchMarbles: Marble[] = gameState.marbles.filter(m => currentMatch.marbleIds.includes(m.id));
      const shuffledResults = shuffle<Marble>(matchMarbles).map((m, i) => ({
          ...m,
          rank: i + 1,
          finished: true,
          finishTime: i * 100,
          collectedItems: gameState.gameMode === 'world_cup' ? Math.floor(Math.random() * 5) : 0
      }));
      handleRaceFinish(shuffledResults);
  };

  const handleRaceFinish = (results: Marble[]) => {
    if (gameState.gameMode === 'cup' || gameState.gameMode === 'world_cup') {
        handleCupRaceFinish(results);
        return;
    }
    if (gameState.gameMode === 'elimination') {
      const loser = results[results.length - 1];
      audio.playEliminated();
      recordRoundStats(results, {});
      setGameState(prev => ({ ...prev, phase: 'round_result', lastEliminatedId: loser.id, roundPoints: {} }));
    } else if (gameState.gameMode === 'inverted_elimination') {
      const loser = results.find(m => m.finished);
      if (loser) {
        audio.playEliminated();
        recordRoundStats(results, {});
        setGameState(prev => ({ ...prev, phase: 'round_result', lastEliminatedId: loser.id, roundPoints: {} }));
      }
    } else {
      const currentRoundPoints: Record<number, number> = {};
      const updatedMarbles = [...gameState.marbles];
      results.forEach((m, index) => {
        const points = POINTS_SYSTEM[index] || 0;
        currentRoundPoints[m.id] = points;
        const marbleIndex = updatedMarbles.findIndex(mar => mar.id === m.id);
        if (marbleIndex !== -1) {
          updatedMarbles[marbleIndex] = {
            ...updatedMarbles[marbleIndex],
            score: updatedMarbles[marbleIndex].score + points,
            rank: index + 1,
            finished: true,
            finishTime: m.finishTime || index
          };
        }
      });
      audio.playFinish();
      recordRoundStats(results, currentRoundPoints);
      setGameState(prev => ({ ...prev, marbles: updatedMarbles, phase: 'round_result', roundPoints: currentRoundPoints }));
    }
  };

  const handleCupRaceFinish = (results: Marble[]) => {
      const match = gameState.cupMatches[gameState.currentMatchIndex];
      const newScores = { ...gameState.cupScores };
      const newGoals = { ...gameState.cupGoals };
      const newGoalsConceded = { ...gameState.cupGoalsConceded };
      const newPlayed = { ...gameState.cupMatchesPlayed };
      const updatedMarbles = [...gameState.marbles];
      const roundPointsForStats: Record<number, number> = {};

      if (match.type === 'group') {
          match.marbleIds.forEach(id => {
              newPlayed[id] = (newPlayed[id] || 0) + 1;
          });
      }

      let overallWinnerId = results[0].id;
      if (gameState.gameMode === 'world_cup' && match.type === 'knockout') {
          const knockoutRes = [...results].sort((a, b) => {
              if ((b.collectedItems || 0) !== (a.collectedItems || 0)) {
                  return (b.collectedItems || 0) - (a.collectedItems || 0);
              }
              return (a.finishTime || 0) - (b.finishTime || 0);
          });
          overallWinnerId = knockoutRes[0].id;
      }

      if (gameState.gameMode === 'world_cup' && match.type === 'group' && match.matchups) {
          // World Cup Group Stage Scoring based on Matchups and Collected Soccer Balls (Goals)
          match.matchups.forEach(([idA, idB]) => {
              const marbleA = results.find(m => m.id === idA);
              const marbleB = results.find(m => m.id === idB);
              const goalsA = marbleA?.collectedItems || 0;
              const goalsB = marbleB?.collectedItems || 0;

              newGoals[idA] = (newGoals[idA] || 0) + goalsA;
              newGoals[idB] = (newGoals[idB] || 0) + goalsB;
              newGoalsConceded[idA] = (newGoalsConceded[idA] || 0) + goalsB;
              newGoalsConceded[idB] = (newGoalsConceded[idB] || 0) + goalsA;

              let pointsA = 0;
              let pointsB = 0;

              if (goalsA > goalsB) {
                  pointsA = 3;
              } else if (goalsB > goalsA) {
                  pointsB = 3;
              } else {
                  pointsA = 1;
                  pointsB = 1;
              }

              newScores[idA] = (newScores[idA] || 0) + pointsA;
              newScores[idB] = (newScores[idB] || 0) + pointsB;

              roundPointsForStats[idA] = pointsA;
              roundPointsForStats[idB] = pointsB;
          });

          // Update updatedMarbles with finishing rank/time
          results.forEach((m, idx) => {
              const mIdx = updatedMarbles.findIndex(mar => mar.id === m.id);
              if (mIdx !== -1) {
                  updatedMarbles[mIdx] = {
                      ...updatedMarbles[mIdx],
                      score: newScores[m.id],
                      rank: idx + 1,
                      finished: true,
                      finishTime: m.finishTime || idx,
                      collectedItems: m.collectedItems
                  };
              }
          });
      } else {
          // Default Cup / Knockout Scoring
          const processedResults = [...results];
          if (gameState.gameMode === 'world_cup' && match.type === 'knockout') {
              processedResults.sort((a, b) => {
                  if ((b.collectedItems || 0) !== (a.collectedItems || 0)) {
                      return (b.collectedItems || 0) - (a.collectedItems || 0);
                  }
                  // Tie-breaker: finish order (first to arrive wins if goals are equal)
                  return (a.finishTime || 0) - (b.finishTime || 0);
              });
          }

          processedResults.forEach((m, idx) => {
              let points = 0;
              if (match.type === 'group') {
                  const pointsTable = gameState.gameMode === 'world_cup' ? WC_GROUP_POINTS : CUP_GROUP_POINTS;
                  points = pointsTable[idx] || 0;
                  newScores[m.id] = (newScores[m.id] || 0) + points;
              } else {
                  if (idx === 0) points = 1; 
                  newScores[m.id] = points;
              }
              roundPointsForStats[m.id] = points;
              const mIdx = updatedMarbles.findIndex(mar => mar.id === m.id);
              if (mIdx !== -1) {
                  updatedMarbles[mIdx] = {
                      ...updatedMarbles[mIdx],
                      score: newScores[m.id],
                      rank: idx + 1,
                      finished: true,
                      finishTime: m.finishTime || idx,
                      collectedItems: m.collectedItems
                  };
              }
          });
      }

      recordRoundStats(results, roundPointsForStats);
      let nextPhase = gameState.cupPhase;
      let nextMatches = [...gameState.cupMatches];
      if (match.nextPhase) {
          if (gameState.cupPhase === 'groups') {
              nextPhase = 'groups_finished';
          } else if (gameState.cupPhase === 'sixteenths') {
              nextPhase = 'octavas';
          } else if (gameState.cupPhase === 'octavas') {
              nextPhase = 'quartas';
          }
      }
      const currentMatchIdx = gameState.currentMatchIndex;
      const finishedMatch = { ...match, winnerId: overallWinnerId };
      nextMatches[currentMatchIdx] = finishedMatch;
      if (match.nextPhase) {
          let winners: number[] = [];
          if (gameState.cupPhase === 'sixteenths') {
              const sixteenthsMatches = nextMatches.filter(m => m.id.startsWith("16-avos"));
              sixteenthsMatches.sort((a, b) => parseInt(a.id.split('_')[1] || "0") - parseInt(b.id.split('_')[1] || "0"));
              winners = sixteenthsMatches.map(m => m.winnerId!).filter(id => id !== undefined);
              nextMatches = [...nextMatches, ...generateKnockoutMatches(winners, "Oitavas")];
              nextPhase = 'octavas';
          } else if (gameState.cupPhase === 'octavas') {
              const octavasMatches = nextMatches.filter(m => m.id.startsWith("Oitavas"));
              octavasMatches.sort((a, b) => parseInt(a.id.split('_')[1] || "0") - parseInt(b.id.split('_')[1] || "0"));
              winners = octavasMatches.map(m => m.winnerId!).filter(id => id !== undefined);
              nextMatches = [...nextMatches, ...generateKnockoutMatches(winners, "Quartas")];
              nextPhase = 'quartas';
          } else if (gameState.cupPhase === 'quartas') {
              const quartasMatches = nextMatches.filter(m => m.id.startsWith("Quartas"));
              quartasMatches.sort((a, b) => parseInt(a.id.split('_')[1] || "0") - parseInt(b.id.split('_')[1] || "0"));
              winners = quartasMatches.map(m => m.winnerId!).filter(id => id !== undefined);
              nextMatches = [...nextMatches, ...generateKnockoutMatches(winners, "Semi")];
              nextPhase = 'semi';
          } else if (gameState.cupPhase === 'semi') {
              const semiMatches = nextMatches.filter(m => m.id.startsWith("Semi"));
              semiMatches.sort((a, b) => parseInt(a.id.split('_')[1] || "0") - parseInt(b.id.split('_')[1] || "0"));
              winners = semiMatches.map(m => m.winnerId!).filter(id => id !== undefined);
              
              if (gameState.gameMode === 'world_cup') {
                  const loserA = semiMatches[0].marbleIds.find(id => id !== semiMatches[0].winnerId)!;
                  const loserB = semiMatches[1].marbleIds.find(id => id !== semiMatches[1].winnerId)!;
                  
                  const terceiroMatch: Match = {
                      id: "Terceiro_0",
                      name: getMatchNumberName("Terceiro", 0, true),
                      marbleIds: [loserA, loserB],
                      type: 'knockout',
                      nextPhase: false,
                      matchups: [[loserA, loserB]]
                  };
                  
                  const finalMatches = generateKnockoutMatches(winners, "Final");
                  nextMatches = [...nextMatches, terceiroMatch, ...finalMatches];
              } else {
                  nextMatches = [...nextMatches, ...generateKnockoutMatches(winners, "Final")];
              }
              nextPhase = 'final';
          } else if (gameState.cupPhase === 'final') {
              if (match.id === 'Final_0') {
                  recordMatchCompletion(overallWinnerId);
              }
          }
      }
      setGameState(prev => ({
          ...prev,
          marbles: updatedMarbles,
          cupScores: newScores,
          cupGoals: newGoals,
          cupGoalsConceded: newGoalsConceded,
          cupMatchesPlayed: newPlayed,
          cupMatches: nextMatches,
          cupPhase: nextPhase as any,
          phase: 'round_result',
          roundPoints: roundPointsForStats
      }));

  };

  const handleNextRound = () => {
    setIsFollowingBet(false); 
    if (gameState.gameMode === 'cup' || gameState.gameMode === 'world_cup') {
        const nextIdx = gameState.currentMatchIndex + 1;
        const currentMatch = gameState.cupMatches[gameState.currentMatchIndex];
        let nextScores = { ...gameState.cupScores };
        if (currentMatch.type === 'group' && gameState.cupPhase !== 'groups' && gameState.cupPhase !== 'groups_finished') {
            Object.keys(nextScores).forEach(key => { nextScores[parseInt(key)] = 0; });
        }
        if (gameState.cupPhase === 'groups_finished') {
            setGameState(prev => ({ ...prev, phase: 'cup_tree' }));
            return;
        }
        if (nextIdx < gameState.cupMatches.length) {
            setGameState(prev => ({ ...prev, cupScores: nextScores, phase: 'cup_tree', currentMatchIndex: nextIdx, activeMarbleIds: prev.cupMatches[nextIdx].marbleIds, round: prev.round + 1 }));
        } else {
            setGameState(prev => ({ ...prev, phase: 'cup_tree' }));
        }
        return;
    }
    if (gameState.gameMode === 'elimination' || gameState.gameMode === 'inverted_elimination') {
      const nextActiveIds = gameState.activeMarbleIds.filter(id => id !== gameState.lastEliminatedId);
      if (nextActiveIds.length === 1) {
        audio.playFinish();
        recordMatchCompletion(nextActiveIds[0]);
        setGameState(prev => ({ ...prev, activeMarbleIds: nextActiveIds, phase: 'champion' }));
      } else {
        setGameState(prev => ({ ...prev, activeMarbleIds: nextActiveIds, phase: 'racing', round: prev.round + 1, lastEliminatedId: null }));
      }
    } else {
      if (gameState.round >= gameState.totalRounds) {
         const sortedByScore = [...gameState.marbles].sort((a, b) => b.score - a.score);
         audio.playFinish();
         recordMatchCompletion(sortedByScore[0].id);
         setGameState(prev => ({ ...prev, activeMarbleIds: [sortedByScore[0].id], phase: 'champion' }));
      } else {
        setGameState(prev => ({ ...prev, phase: 'racing', round: prev.round + 1, roundPoints: {} }));
      }
    }
  };

  const resetGame = () => {
    setGameState({
      gameMode: gameState.gameMode, phase: 'betting', round: 1, totalRounds: (gameState.gameMode === 'elimination' || gameState.gameMode === 'inverted_elimination') ? BRASIL_TEAMS.length - 1 : 10,
      marbles: gameState.gameMode === 'world_cup' ? WC_MARBLES : INITIAL_MARBLES.map(m => ({...m, score: 0})), activeMarbleIds: (gameState.gameMode === 'world_cup' ? WC_MARBLES : INITIAL_MARBLES).map(m => m.id), betMarbleId: null, lastEliminatedId: null, roundPoints: {}, cupMatches: [], currentMatchIndex: 0, cupGroups: [], cupScores: {}, cupGoals: {}, cupGoalsConceded: {}, cupMatchesPlayed: {}, cupPhase: 'groups',
      cupGroupScores: undefined, cupGroupGoals: undefined, cupGroupGoalsConceded: undefined, cupGroupMatchesPlayed: undefined, cupBestThirdPlacesIds: undefined
    });
    setIsPaused(false); setShowExitConfirm(false); setIsFollowingBet(false);
  };

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    if (gameState.phase === 'round_result') {
      timer = setTimeout(() => { handleNextRound(); }, 3000);
    }
    return () => clearTimeout(timer);
  }, [gameState.phase, gameState.activeMarbleIds, gameState.round]);

  if (gameState.phase === 'betting') {
    return (
      <div className="min-h-screen bg-gray-900 flex flex-col items-center justify-center p-4 text-white">
        <h1 className="text-5xl md:text-7xl mb-2 text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-red-500 brand-font tracking-widest text-center">
          MARBLE ROYALE
        </h1>
        <h2 className="text-xl md:text-2xl text-green-400 mb-2 font-bold tracking-widest uppercase">
          {gameState.gameMode === 'world_cup' ? 'WORLD CUP 2026 EDITION' : 'BRASILEIRÃO EDITION'}
        </h2>
        <p className="text-gray-500 font-mono text-sm mb-6 tracking-wide">
          Desenvolvido por Prof Covre
        </p>
        
        <div className="flex flex-wrap justify-center gap-2 mb-6 bg-gray-800 p-2 rounded-lg border border-gray-700">
           <button onClick={() => handleModeSelect('elimination')} className={`px-4 py-2 rounded-md font-bold transition-all ${gameState.gameMode === 'elimination' ? 'bg-red-600 text-white' : 'text-gray-400 hover:text-white'}`}>ELIMINAÇÃO</button>
           <button onClick={() => handleModeSelect('inverted_elimination')} className={`px-4 py-2 rounded-md font-bold transition-all ${gameState.gameMode === 'inverted_elimination' ? 'bg-red-600 text-white' : 'text-gray-400 hover:text-white'}`}>ELIMINAÇÃO INVERTIDA</button>
           <button onClick={() => handleModeSelect('points')} className={`px-4 py-2 rounded-md font-bold transition-all ${gameState.gameMode === 'points' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white'}`}>PONTOS CORRIDOS</button>
           <button onClick={() => handleModeSelect('cup')} className={`px-4 py-2 rounded-md font-bold transition-all ${gameState.gameMode === 'cup' ? 'bg-yellow-600 text-white' : 'text-gray-400 hover:text-white'}`}>COPA</button>
           <button onClick={() => handleModeSelect('world_cup')} className={`px-4 py-2 rounded-md font-bold transition-all ${gameState.gameMode === 'world_cup' ? 'bg-green-600 text-white' : 'text-gray-400 hover:text-white'}`}>COPA DO MUNDO 2026</button>
        </div>

        <div className="bg-gray-800 p-6 rounded-xl border border-gray-700 w-full max-w-4xl shadow-2xl">
          <div className="mb-6">
            <h2 className="text-xl font-bold mb-4 flex items-center text-yellow-400">
              <Trophy className="mr-2" /> Escolha seu Time
            </h2>
            <div className="grid grid-cols-5 gap-2">
              {gameState.marbles.map(m => (
                <button key={m.id} onClick={() => setGameState(prev => ({ ...prev, betMarbleId: m.id }))} className={`p-2 rounded-lg flex flex-col items-center transition-all ${gameState.betMarbleId === m.id ? 'bg-yellow-500/20 border-2 border-yellow-400 scale-105' : 'bg-gray-700 border border-transparent hover:bg-gray-600'}`}>
                  <div className="w-10 h-10 rounded-full mb-1 shadow-lg bg-gray-200 flex items-center justify-center p-0.5 relative overflow-hidden"><img src={m.logoUrl} alt={m.name} className="w-full h-full object-contain" /></div>
                  <span className="text-[10px] font-bold font-mono text-center truncate w-full">{m.name}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="mb-8 border-t border-gray-700 pt-6 flex justify-center space-x-4">
             <button onClick={() => setShowSettingsModal(true)} className="flex items-center text-sm bg-blue-700 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition-colors font-bold uppercase"><Settings className="w-4 h-4 mr-2" />Configurações</button>
             <button onClick={() => setShowStatisticsModal(true)} className="flex items-center text-sm bg-purple-700 hover:bg-purple-600 text-white px-4 py-2 rounded-lg transition-colors font-bold uppercase"><BarChart2 className="w-4 h-4 mr-2" />Estatísticas</button>
          </div>

          <div className="flex w-full">
            <button disabled={gameState.betMarbleId === null} onClick={handleStartTournament} className={`w-full py-4 rounded-lg font-black text-xl tracking-widest transition-all flex items-center justify-center ${gameState.betMarbleId !== null ? 'bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-400 hover:to-emerald-500 text-white shadow-lg transform hover:-translate-y-1' : 'bg-gray-700 text-gray-500 cursor-not-allowed'}`}>
                {isTournamentMode ? 'VER CHAVEAMENTO' : 'INICIAR CORRIDA'}
            </button>
          </div>
        </div>
        
        {/* Settings Modal */}
        {showSettingsModal && (
           <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
              <div className="bg-gray-800 border border-gray-600 rounded-xl p-6 max-w-md w-full shadow-2xl animate-in zoom-in-95 flex flex-col">
                 <div className="flex justify-between items-center mb-6">
                    <h3 className="text-2xl font-bold flex items-center text-blue-400 uppercase"><Settings className="mr-2 w-6 h-6"/> Configurações de Física</h3>
                    <button onClick={() => setShowSettingsModal(false)}><X className="text-gray-400 hover:text-white" /></button>
                 </div>
                 <div className="space-y-6">
                    <div>
                        <label className="text-sm text-gray-300 font-bold block mb-2 uppercase">Gravidade ({(physicsConfig.gravity * 100).toFixed(0)}%)</label>
                        <input type="range" min="0.1" max="0.8" step="0.05" value={physicsConfig.gravity} onChange={(e) => setPhysicsConfig(prev => ({...prev, gravity: parseFloat(e.target.value)}))} className="w-full accent-blue-500" />
                        <div className="flex justify-between text-[10px] text-gray-500 mt-1 uppercase"><span>Lenta</span><span>Normal</span><span>Pesada</span></div>
                    </div>
                    <div>
                        <label className="text-sm text-gray-300 font-bold block mb-2 uppercase">Elasticidade ({(physicsConfig.restitution * 100).toFixed(0)}%)</label>
                        <input type="range" min="0.1" max="0.9" step="0.1" value={physicsConfig.restitution} onChange={(e) => setPhysicsConfig(prev => ({...prev, restitution: parseFloat(e.target.value)}))} className="w-full accent-blue-500" />
                        <div className="flex justify-between text-[10px] text-gray-500 mt-1 uppercase"><span>Dura</span><span>Quicante</span><span>Extrema</span></div>
                    </div>
                 </div>
                 <button onClick={() => setShowSettingsModal(false)} className="mt-8 w-full py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-lg uppercase">Aplicar e Fechar</button>
              </div>
           </div>
        )}

        {showStatisticsModal && (
           <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
              <div className="bg-gray-800 border border-gray-600 rounded-xl p-6 max-w-4xl w-full shadow-2xl animate-in zoom-in-95 flex flex-col max-h-[90vh]">
                  <div className="flex justify-between items-center mb-4">
                     <h3 className="text-2xl font-bold flex items-center text-purple-400 uppercase"><BarChart2 className="mr-2 w-6 h-6"/> Histórico e Estatísticas</h3>
                     <button onClick={() => setShowStatisticsModal(false)}><X className="text-gray-400 hover:text-white" /></button>
                  </div>

                  {/* Tabs */}
                  <div className="flex space-x-1 bg-gray-900/50 p-1 rounded-lg mb-6 border border-gray-700">
                    <button 
                        onClick={() => setStatsTab('clubs')}
                        className={`flex-1 py-2 rounded-md font-bold text-sm transition-all uppercase ${statsTab === 'clubs' ? 'bg-purple-600 text-white' : 'text-gray-500 hover:text-gray-300'}`}
                    >
                        Clubes
                    </button>
                    <button 
                        onClick={() => setStatsTab('teams')}
                        className={`flex-1 py-2 rounded-md font-bold text-sm transition-all uppercase ${statsTab === 'teams' ? 'bg-purple-600 text-white' : 'text-gray-500 hover:text-gray-300'}`}
                    >
                        Seleções
                    </button>
                  </div>

                  <div className="overflow-y-auto pr-2 custom-scrollbar">
                      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 mb-8">
                          <div className="bg-gray-700 p-2 rounded-lg text-center"><div className="text-gray-400 text-[10px] uppercase mb-1">Total</div><div className="text-xl font-bold">{statistics.matches.total.completed}</div></div>
                          <div className="bg-gray-700 p-2 rounded-lg text-center"><div className="text-gray-400 text-[10px] uppercase mb-1">Eliminação</div><div className="text-xl font-bold text-red-400">{statistics.matches.elimination.completed}</div></div>
                          <div className="bg-gray-700 p-2 rounded-lg text-center"><div className="text-gray-400 text-[10px] uppercase mb-1">Inv. Eliminação</div><div className="text-xl font-bold text-red-300">{statistics.matches.inverted_elimination?.completed || 0}</div></div>
                          <div className="bg-gray-700 p-2 rounded-lg text-center"><div className="text-gray-400 text-[10px] uppercase mb-1">Pontos</div><div className="text-xl font-bold text-blue-400">{statistics.matches.points.completed}</div></div>
                          <div className="bg-gray-700 p-2 rounded-lg text-center"><div className="text-gray-400 text-[10px] uppercase mb-1">Copas</div><div className="text-xl font-bold text-yellow-400">{isWC ? (statistics.matches.world_cup?.completed || 0) : (statistics.matches.cup.completed)}</div></div>
                      </div>
                      <h4 className="text-lg font-bold mb-3 text-white border-b border-gray-700 pb-2">Desempenho por {statsTab === 'clubs' ? 'Clube' : 'Seleção'}</h4>
                      <div className="overflow-x-auto">
                          <table className="w-full text-left text-sm">
                              <thead className="text-gray-400 uppercase font-mono text-xs"><tr><th className="p-2">Time</th><th className="p-2 text-center text-yellow-500">Títulos</th><th className="p-2 text-center text-green-400">Vitórias</th><th className="p-2 text-center text-blue-400">Pontos</th></tr></thead>
                              <tbody className="divide-y divide-gray-700">
                                  {Object.entries(statistics.teams).sort(([, a]: [string, TeamStats], [, b]: [string, TeamStats]) => { if (b.titles.total !== a.titles.total) return b.titles.total - a.titles.total; if (b.raceWins.total !== a.raceWins.total) return b.raceWins.total - a.raceWins.total; return b.points.total - a.points.total; }).map(([idStr, stats]: [string, TeamStats]) => {
                                          const tId = parseInt(idStr);
                                          
                                          // Check if this ID belongs to the current tab
                                          if (statsTab === 'clubs' && tId >= 100) return null;
                                          if (statsTab === 'teams' && tId < 100) return null;

                                          const team = tId < 100 ? BRASIL_TEAMS[tId] : WORLD_CUP_TEAMS[tId - 100];
                                          if (!team || (stats.titles.total === 0 && stats.raceWins.total === 0)) return null;
                                          return (
                                              <tr key={idStr} className="hover:bg-gray-700/50"><td className="p-2 flex items-center space-x-2"><img src={team.logo} className="w-6 h-6 object-contain" /><span className="font-bold">{team.name}</span></td><td className="p-2 text-center font-mono font-bold text-yellow-500">{stats.titles.total > 0 ? stats.titles.total : '-'}</td><td className="p-2 text-center font-mono">{stats.raceWins.total}</td><td className="p-2 text-center font-mono text-gray-400">{stats.points.total}</td></tr>
                                          )
                                      })}
                              </tbody>
                          </table>
                      </div>
                 </div>
                 <div className="mt-6 flex justify-between items-center border-t border-gray-700 pt-4">
                    <button onClick={resetStatistics} className="flex items-center text-red-500 hover:text-red-400 text-xs font-bold px-3 py-2 rounded hover:bg-red-900/20 transition-colors"><Trash2 className="w-4 h-4 mr-2" />RESETAR DADOS</button>
                    <button onClick={() => setShowStatisticsModal(false)} className="px-6 py-2 bg-gray-600 hover:bg-gray-500 text-white font-bold rounded-lg">FECHAR</button>
                 </div>
              </div>
           </div>
        )}
      </div>
    );
  }
  
  if (gameState.phase === 'cup_tree') {
      const getSortedGroup = (groupIdx: number) => {
         const groupIds = gameState.cupGroups[groupIdx] || [];
         const scores = gameState.cupGroupScores || gameState.cupScores;
         const goals = gameState.cupGroupGoals || gameState.cupGoals;
         const conceded = gameState.cupGroupGoalsConceded || gameState.cupGoalsConceded;
         return [...groupIds].sort((a, b) => {
             const ptsDiff = (scores[b] || 0) - (scores[a] || 0);
             if (ptsDiff !== 0) return ptsDiff;
             if (gameState.gameMode === 'world_cup') {
                 const gdA = (goals[a] || 0) - (conceded[a] || 0);
                 const gdB = (goals[b] || 0) - (conceded[b] || 0);
                 if (gdB !== gdA) return gdB - gdA;
                 return (goals[b] || 0) - (goals[a] || 0);
             }
             return 0;
         });
      };
      const getTeam = (id: number | undefined) => id !== undefined ? gameState.marbles.find(m => m.id === id) : undefined;
      const isGroupFinished = (gIdx: number) => gameState.currentMatchIndex > (16 + gIdx);
      const getWinnerFromMatch = (phaseName: string, bracketMatchIndex: number) => {
          const targetId = `${phaseName}_${bracketMatchIndex * 2}`;
          const m = gameState.cupMatches.find(match => match.id === targetId);
          return m?.winnerId;
      };

      const getLoserFromMatch = (phaseName: string, bracketMatchIndex: number) => {
          const targetId = `${phaseName}_${bracketMatchIndex * 2}`;
          const m = gameState.cupMatches.find(match => match.id === targetId);
          if (!m || m.winnerId === undefined) return undefined;
          return m.marbleIds.find(id => id !== m.winnerId);
      };

      const get16avosWCLabels = (i: number) => {
          const labels = [
              { t: "2º GRUPO A", b: "2º GRUPO B" },
              { t: "1º GRUPO E", b: "3º GRUPO A/B/C/D/F" },
              { t: "1º GRUPO F", b: "2º GRUPO C" },
              { t: "1º GRUPO C", b: "2º GRUPO F" },
              { t: "1º GRUPO I", b: "3º GRUPO C/D/F/G/H" },
              { t: "2º GRUPO E", b: "2º GRUPO I" },
              { t: "1º GRUPO A", b: "3º GRUPO C/E/F/H/I" },
              { t: "1º GRUPO L", b: "3º GRUPO E/H/I/J/K" },
              { t: "1º GRUPO D", b: "3º GRUPO B/E/F/I/J" },
              { t: "1º GRUPO G", b: "3º GRUPO A/E/H/I/J" },
              { t: "2º GRUPO K", b: "2º GRUPO L" },
              { t: "1º GRUPO H", b: "2º GRUPO J" },
              { t: "1º GRUPO B", b: "3º GRUPO E/F/G/I/J" },
              { t: "1º GRUPO J", b: "2º GRUPO H" },
              { t: "1º GRUPO K", b: "3º GRUPO D/E/I/J/L" },
              { t: "2º GRUPO D", b: "2º GRUPO G" },
          ];
          return labels[i] || { t: "", b: "" };
      };

      const getOitavasWCProj = (i: number) => {
          const mapping = [
              [1, 4],   // J89 (Venc. J74 x Venc. J77)
              [0, 2],   // J90 (Venc. J73 x Venc. J75)
              [3, 5],   // J91 (Venc. J76 x Venc. J78)
              [6, 7],   // J92 (Venc. J79 x Venc. J80)
              [10, 11], // J93 (Venc. J83 x Venc. J84)
              [8, 9],   // J94 (Venc. J81 x Venc. J82)
              [13, 15], // J95 (Venc. J86 x Venc. J88)
              [12, 14], // J96 (Venc. J85 x Venc. J87)
          ];
          const map = mapping[i] || [i*2, i*2+1];
          return {
              t1: getWinnerFromMatch('16-avos', map[0]),
              t2: getWinnerFromMatch('16-avos', map[1]),
          };
      };

      const getOitavasWCLabels = (i: number) => {
          const labels = [
              { t: "VENC. JOGO 2", b: "VENC. JOGO 5" },
              { t: "VENC. JOGO 1", b: "VENC. JOGO 3" },
              { t: "VENC. JOGO 4", b: "VENC. JOGO 6" },
              { t: "VENC. JOGO 7", b: "VENC. JOGO 8" },
              { t: "VENC. JOGO 11", b: "VENC. JOGO 12" },
              { t: "VENC. JOGO 9", b: "VENC. JOGO 10" },
              { t: "VENC. JOGO 14", b: "VENC. JOGO 16" },
              { t: "VENC. JOGO 13", b: "VENC. JOGO 15" },
          ];
          return labels[i] || { t: "", b: "" };
      };

      const getQuartasWCProj = (i: number) => {
          const mapping = [
              [0, 1], // J97: Winner J89 vs Winner J90
              [4, 5], // J98: Winner J93 vs Winner J94
              [2, 3], // J100: Winner J91 vs Winner J92
              [6, 7], // J101: Winner J95 vs Winner J96
          ];
          const map = mapping[i] || [i*2, i*2+1];
          return {
              t1: getWinnerFromMatch('Oitavas', map[0]),
              t2: getWinnerFromMatch('Oitavas', map[1]),
          };
      };

      const getQuartasWCLabels = (i: number) => {
          const labels = [
              { t: "VENC. JOGO 17", b: "VENC. JOGO 18" },
              { t: "VENC. JOGO 21", b: "VENC. JOGO 22" },
              { t: "VENC. JOGO 19", b: "VENC. JOGO 20" },
              { t: "VENC. JOGO 23", b: "VENC. JOGO 24" },
          ];
          return labels[i] || { t: "", b: "" };
      };

      const getSemiWCProj = (i: number) => {
          const mapping = [
              [0, 1], // J101: Winner 97 vs Winner 98
              [2, 3], // J102: Winner 99 vs Winner 100
          ];
          const map = mapping[i] || [i*2, i*2+1];
          return {
              t1: getWinnerFromMatch('Quartas', map[0]),
              t2: getWinnerFromMatch('Quartas', map[1]),
          };
      };

      const getSemiWCLabels = (i: number) => {
          const labels = [
              { t: "VENC. JOGO 25", b: "VENC. JOGO 26" },
              { t: "VENC. JOGO 27", b: "VENC. JOGO 28" },
          ];
          return labels[i] || { t: "", b: "" };
      };

      const getFinalWCProj = () => {
          return {
              t1: getWinnerFromMatch('Semi', 0),
              t2: getWinnerFromMatch('Semi', 1),
          };
      };

      const getTerceiroWCProj = () => {
          return {
              t1: getLoserFromMatch('Semi', 0),
              t2: getLoserFromMatch('Semi', 1),
          };
      };

      const isWC = gameState.gameMode === 'world_cup';
      const finalMatch = gameState.cupMatches.find(m => m.id === "Final_0");
      const isCupFinished = finalMatch && finalMatch.winnerId !== undefined;
      const leaders = gameState.cupGroups.map((_, i) => getSortedGroup(i));
      
      const handleFinishCupAndShowChampion = () => {
          const winnerId = finalMatch?.winnerId;
          if (winnerId !== undefined) {
              setGameState(prev => ({
                  ...prev,
                  phase: 'champion',
                  activeMarbleIds: [winnerId]
              }));
              audio.playFinish();
          }
      };
      
      let bestThirdPlacesIds: number[] = [];
      if (isWC) {
          const thirdPlaces: { id: number; score: number; gd: number; gf: number }[] = [];
          gameState.cupGroups.forEach((group, gIdx) => {
              const sorted = getSortedGroup(gIdx);
              if (sorted.length >= 3) {
                  const thirdId = sorted[2];
                  thirdPlaces.push({
                      id: thirdId,
                      score: gameState.cupScores[thirdId] || 0,
                      gd: (gameState.cupGoals[thirdId] || 0) - (gameState.cupGoalsConceded[thirdId] || 0),
                      gf: gameState.cupGoals[thirdId] || 0
                  });
              }
          });
          bestThirdPlacesIds = thirdPlaces
              .sort((a, b) => {
                  if (b.score !== a.score) return b.score - a.score;
                  if (b.gd !== a.gd) return b.gd - a.gd;
                  return b.gf - a.gf;
              })
              .slice(0, 8)
              .map(t => t.id);
      }
      
      const projections = ((gameState.cupPhase === 'groups' || gameState.cupPhase === 'groups_finished') && !isWC) ? [
          { t1: leaders[0]?.[0], t2: leaders[1]?.[3] }, { t1: leaders[0]?.[1], t2: leaders[1]?.[2] }, { t1: leaders[0]?.[2], t2: leaders[1]?.[1] }, { t1: leaders[0]?.[3], t2: leaders[1]?.[0] },
          { t1: leaders[2]?.[0], t2: leaders[3]?.[3] }, { t1: leaders[2]?.[1], t2: leaders[3]?.[2] }, { t1: leaders[2]?.[2], t2: leaders[3]?.[1] }, { t1: leaders[2]?.[3], t2: leaders[3]?.[0] },
      ] : [];
      
      const octavasLabels = !isWC ? [
          { t: "1º GRUPO A", b: "4º GRUPO B" }, { t: "2º GRUPO A", b: "3º GRUPO B" }, { t: "3º GRUPO A", b: "2º GRUPO B" }, { t: "4º GRUPO A", b: "1º GRUPO B" },
          { t: "1º GRUPO C", b: "4º GRUPO D" }, { t: "2º GRUPO C", b: "3º GRUPO D" }, { t: "3º GRUPO C", b: "2º GRUPO D" }, { t: "4º GRUPO C", b: "1º GRUPO D" },
      ] : [];
      const renderBracketMatch = (phaseName: string, index: number, projection?: {t1: number | undefined, t2: number | undefined}, t1Ready: boolean = true, t2Ready: boolean = true, labelTop: string = "", labelBottom: string = "") => {
         const targetId = `${phaseName}_${index * 2}`;
         const match = gameState.cupMatches.find(m => m.id === targetId);
         let team1Id = match ? match.marbleIds[0] : (t1Ready && projection ? projection.t1 : undefined);
         let team2Id = match ? match.marbleIds[1] : (t2Ready && projection ? projection.t2 : undefined);
         const team1 = getTeam(team1Id); const team2 = getTeam(team2Id); const winnerId = match?.winnerId;
         return (
             <div key={`${phaseName}-${index}`} className={`p-2 rounded-lg border flex flex-col justify-center text-xs mb-4 min-w-[160px] ${match ? 'bg-gray-800 border-gray-600' : 'bg-gray-800/50 border-gray-700 border-dashed opacity-70'}`}>
                 <div className="flex justify-between items-center mb-1"><span className="text-[10px] text-gray-500 font-mono uppercase">{getMatchNumberName(phaseName, index, isWC)}</span></div>
                 <div className="mb-1">
                     <div className={`flex items-center space-x-2 p-1 rounded ${winnerId === team1Id && team1Id !== undefined ? 'bg-green-900/30' : ''}`}>
                          <div className={`w-4 h-4 rounded-full flex items-center justify-center p-[1px] ${winnerId === team1Id && team1Id !== undefined ? 'bg-yellow-400' : 'bg-gray-400'}`}>{team1 ? <img src={team1.logoUrl} className="w-full h-full object-contain rounded-full" /> : <div className="w-full h-full bg-gray-600 rounded-full" />}</div>
                          <div className="flex flex-col overflow-hidden"><span className={`truncate font-mono ${winnerId === team1Id && team1Id !== undefined ? 'text-green-400 font-bold' : 'text-gray-300'}`}>{team1 ? team1.name : ((gameState.cupPhase==='groups' || gameState.cupPhase==='groups_finished') ? '???' : '')}</span>{!team1 && labelTop && <span className="text-[9px] text-gray-500 uppercase">{labelTop}</span>}</div>
                          {winnerId === team1Id && team1Id !== undefined && <Medal className="w-3 h-3 text-yellow-500 ml-auto" />}
                     </div>
                 </div>
                 <div>
                     <div className={`flex items-center space-x-2 p-1 rounded ${winnerId === team2Id && team2Id !== undefined ? 'bg-green-900/30' : ''}`}>
                          <div className={`w-4 h-4 rounded-full flex items-center justify-center p-[1px] ${winnerId === team2Id && team2Id !== undefined ? 'bg-yellow-400' : 'bg-gray-400'}`}>{team2 ? <img src={team2.logoUrl} className="w-full h-full object-contain rounded-full" /> : <div className="w-full h-full bg-gray-600 rounded-full" />}</div>
                          <div className="flex flex-col overflow-hidden"><span className={`truncate font-mono ${winnerId === team2Id && team2Id !== undefined ? 'text-green-400 font-bold' : 'text-gray-300'}`}>{team2 ? team2.name : ((gameState.cupPhase==='groups' || gameState.cupPhase==='groups_finished') ? '???' : '')}</span>{!team2 && labelBottom && <span className="text-[9px] text-gray-500 uppercase">{labelBottom}</span>}</div>
                          {winnerId === team2Id && team2Id !== undefined && <Medal className="w-3 h-3 text-yellow-500 ml-auto" />}
                     </div>
                 </div>
             </div>
         );
      };
      return (
          <div className="min-h-screen bg-gray-900 flex flex-col items-center justify-start p-4 text-white overflow-y-auto">
             <div className="w-full max-w-7xl mt-4">
                 <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
                     <div>
                          <h1 className="text-3xl font-bold brand-font text-yellow-400 uppercase">ORGANIZAÇÃO DA COPA</h1>
                          <p className="text-gray-400 text-sm">
                              {isCupFinished ? 'Copa Concluída! Veja a trajetória dos times.' : (gameState.cupPhase === 'groups_finished' ? 'Fase de Grupos Concluída!' : `Próximo: ${gameState.cupMatches[gameState.currentMatchIndex]?.name}`)}
                          </p>
                      </div>
                     {(isCupFinished || gameState.cupPhase === 'groups_finished') ? (
                          isCupFinished ? (
                               <button onClick={handleFinishCupAndShowChampion} className="bg-yellow-500 hover:bg-yellow-400 border border-yellow-300 text-gray-900 px-8 py-3 rounded-lg font-black flex items-center shadow-lg transition-transform hover:scale-105 uppercase tracking-wider min-w-[200px] justify-center"><Trophy className="mr-2 w-6 h-6" /> FINALIZAR COPA</button>
                           ) : (
                               <button onClick={handleTransitionToKnockouts} className="bg-blue-600 hover:bg-blue-500 border border-blue-400 text-white px-8 py-3 rounded-lg font-bold flex items-center shadow-lg animate-pulse uppercase"><FastForward className="mr-2 w-6 h-6" /> CONTINUAR PARA O MATA-MATA</button>
                           )
                      ) : (
                          <div className="flex gap-2 flex-wrap justify-end">
                              {gameState.gameMode === 'world_cup' && gameState.cupPhase === 'groups' && (
                                  <button onClick={handleSimulateAllGroups} className="bg-purple-600 hover:bg-purple-500 text-white px-6 py-3 rounded-lg font-bold flex items-center shadow-lg uppercase gap-2 transition-colors border border-purple-400">
                                      <FastForward className="w-5 h-5" /> SIMULAR TODA FASE DE GRUPOS
                                  </button>
                              )}
                              <button onClick={handleStartCupRacing} className="bg-green-600 hover:bg-green-500 text-white px-8 py-3 rounded-lg font-bold flex items-center shadow-lg animate-pulse"><PlayCircle className="mr-2 w-6 h-6" /> IR PARA PARTIDA</button>
                          </div>
                      )}
                 </div>
                  {gameState.cupGroups.length > 0 && (
                      <div className="flex bg-gray-800/80 p-1 rounded-xl border border-gray-700/60 max-w-md mb-6 shadow-inner mx-auto">
                          <button
                              onClick={() => setCupViewTab('bracket')}
                              className={`flex-1 py-1.5 px-4 rounded-lg font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all ${
                                  cupViewTab === 'bracket'
                                      ? 'bg-blue-600 text-white shadow-lg border border-blue-500/30'
                                      : 'text-gray-400 hover:text-white'
                              }`}
                          >
                              <Trophy className="w-4 h-4" /> Mata-Mata
                          </button>
                          <button
                              onClick={() => setCupViewTab('groups')}
                              className={`flex-1 py-1.5 px-4 rounded-lg font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all ${
                                  cupViewTab === 'groups'
                                      ? 'bg-blue-600 text-white shadow-lg border border-blue-500/30'
                                      : 'text-gray-400 hover:text-white'
                              }`}
                          >
                              <LayoutGrid className="w-4 h-4" /> Fase de Grupos
                          </button>
                      </div>
                  )}
                  {(gameState.cupGroups.length === 0 || cupViewTab === 'bracket') && (
                      <div className="overflow-x-auto pb-4 custom-scrollbar">
                    <div className="flex gap-4 min-w-[1000px] justify-between h-[800px]">
                        {isWC && (
                           <div className="flex flex-col w-1/5 min-w-[180px]">
                               <h3 className="text-center font-bold text-teal-400 mb-4 bg-gray-800 p-2 rounded uppercase border-b-2 border-teal-500">16-AVOS</h3>
                               <div className="flex flex-col gap-1 overflow-y-auto pr-2 custom-scrollbar">
                                   {[...Array(16)].map((_, i) => {
                                       const label = get16avosWCLabels(i);
                                       return renderBracketMatch("16-avos", i, undefined, true, true, label.t, label.b);
                                   })}
                               </div>
                           </div>
                        )}
                        <div className="flex flex-col w-1/5 min-w-[180px]">
                            <h3 className="text-center font-bold text-blue-400 mb-4 bg-gray-800 p-2 rounded uppercase border-b-2 border-blue-500">OITAVAS</h3>
                            <div className={`flex flex-col justify-around h-full ${isWC ? 'py-4' : 'gap-2'}`}>
                                {[...Array(8)].map((_, i) => {
                                    const proj = isWC ? getOitavasWCProj(i) : projections[i];
                                    const label = isWC ? getOitavasWCLabels(i) : octavasLabels[i];
                                    return renderBracketMatch("Oitavas", i, proj, true, true, label?.t, label?.b);
                                })}
                            </div>
                        </div>
                        <div className="flex flex-col w-1/5 min-w-[180px]">
                            <h3 className="text-center font-bold text-purple-400 mb-4 bg-gray-800 p-2 rounded uppercase border-b-2 border-purple-500">QUARTAS</h3>
                            <div className="flex flex-col justify-around h-full py-8">
                                {[...Array(4)].map((_, i) => {
                                    const proj = isWC ? getQuartasWCProj(i) : { t1: getWinnerFromMatch('Oitavas', i*2), t2: getWinnerFromMatch('Oitavas', i*2+1) };
                                    const label = isWC ? getQuartasWCLabels(i) : { t: `VENC. OIT ${i*2+1}`, b: `VENC. OIT ${i*2+2}` };
                                    return renderBracketMatch("Quartas", i, proj, true, true, label.t, label.b);
                                })}
                            </div>
                        </div>
                        <div className="flex flex-col w-1/5 min-w-[180px]">
                            <h3 className="text-center font-bold text-orange-400 mb-4 bg-gray-800 p-2 rounded uppercase border-b-2 border-orange-500">SEMI</h3>
                            <div className="flex flex-col justify-around h-full py-16">
                                {[...Array(2)].map((_, i) => {
                                    const proj = isWC ? getSemiWCProj(i) : { t1: getWinnerFromMatch('Quartas', i*2), t2: getWinnerFromMatch('Quartas', i*2+1) };
                                    const label = isWC ? getSemiWCLabels(i) : { t: `VENC. QRT ${i*2+1}`, b: `VENC. QRT ${i*2+2}` };
                                    return renderBracketMatch("Semi", i, proj, true, true, label.t, label.b);
                                })}
                            </div>
                        </div>
                        <div className="flex flex-col w-1/5 min-w-[180px]">
                            <h3 className="text-center font-bold text-yellow-400 mb-4 bg-gray-800 p-2 rounded uppercase border-b-2 border-yellow-500">FINAL</h3>
                            <div className="flex flex-col justify-center h-full py-20 gap-8">
                                <div className="flex flex-col">
                                    <span className="text-[10px] text-yellow-500 font-bold uppercase text-center mb-1">FINAL</span>
                                    {renderBracketMatch("Final", 0, isWC ? getFinalWCProj() : { t1: getWinnerFromMatch('Semi', 0), t2: getWinnerFromMatch('Semi', 1) }, true, true, isWC ? "VENC. JOGO 29" : "VENC. SEMI 1", isWC ? "VENC. JOGO 30" : "VENC. SEMI 2")}
                                </div>
                                {isWC && (
                                    <div className="flex flex-col border-t border-gray-700/60 pt-4">
                                        <span className="text-[10px] text-orange-400 font-bold uppercase text-center mb-1">3º LUGAR</span>
                                        {renderBracketMatch("Terceiro", 0, getTerceiroWCProj(), true, true, "PERD. JOGO 29", "PERD. JOGO 30")}
                                    </div>
                                )}
                                {gameState.cupPhase === 'final' && gameState.cupMatches.find(m => m.id === "Final_0")?.winnerId && (
                                    <div className="mt-4 text-center animate-bounce">
                                        <Trophy className="w-12 h-12 text-yellow-400 mx-auto" strokeWidth={1.5} />
                                        <p className="text-yellow-400 text-xs font-black mt-1 uppercase">CAMPEÃO!</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                 </div>
                 )}
                 {gameState.cupGroups.length > 0 && cupViewTab === 'groups' && (
                     <div className="mt-8 border-t border-gray-700 pt-6">
                        <h2 className="text-xl font-bold mb-4 flex items-center text-gray-400 uppercase tracking-widest"><LayoutGrid className="mr-2"/> GRUPOS E CLASSIFICAÇÃO</h2>
                        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
                            {gameState.cupGroups.map((group, idx) => {
                                const sortedIds = getSortedGroup(idx);
                                return (
                                    <div key={idx} className="bg-gray-800 rounded-lg p-3 text-[10px] border border-gray-700 shadow-md">
                                        <h3 className="font-black text-center mb-2 uppercase bg-gray-700 py-1 rounded text-gray-200 tracking-tighter shrink-0">GRUPO {['A','B','C','D','E','F','G','H','I','J','K','L'][idx]}</h3>
                                        <div className="flex flex-col space-y-1">
                                            <div className="flex justify-between items-center text-[8px] text-gray-500 uppercase font-bold px-1 border-b border-gray-700 pb-1">
                                                <div className="flex items-center space-x-1.5 min-w-0 flex-1">
                                                    <span className="w-3 text-center text-gray-400">#</span>
                                                    <span className="truncate">Time</span>
                                                </div>
                                                <div className="flex space-x-2 w-28 justify-end shrink-0">
                                                    <span className="w-4 text-center" title="Partidas Jogadas">J</span>
                                                    <span className="w-4 text-center" title="Gols Pró">GP</span>
                                                    <span className="w-4 text-center" title="Gols Contra">GC</span>
                                                    <span className="w-4 text-center" title="Saldo de Gols">SG</span>
                                                    <span className="w-4 text-center" title="Pontos">P</span>
                                                </div>
                                            </div>
                                            {sortedIds.map((id, rank) => {
                                                const marble = gameState.marbles.find(m=>m.id===id);
                                                const currentBestThirdIds = gameState.cupBestThirdPlacesIds || bestThirdPlacesIds;
                                                const isGroupEnd = gameState.cupPhase !== 'groups';
                                                const isBestThird = isWC && rank === 2 && isGroupEnd && currentBestThirdIds.includes(id);
                                                const isQualified = isWC ? (rank < 2 || isBestThird) : rank < 4;
                                                const pj = (gameState.cupGroupMatchesPlayed || gameState.cupMatchesPlayed)?.[id] || 0;
                                                const gf = (gameState.cupGroupGoals || gameState.cupGoals)?.[id] || 0;
                                                const ga = (gameState.cupGroupGoalsConceded || gameState.cupGoalsConceded)?.[id] || 0;
                                                const sg = gf - ga;
                                                const pts = (gameState.cupGroupScores || gameState.cupScores)?.[id] || 0;
                                                return (
                                                    <div key={id} className={`flex justify-between items-center p-1 rounded ${isQualified ? 'bg-green-500/10' : ''}`}>
                                                        <div className="flex items-center space-x-1.5 min-w-0 flex-1">
                                                            <span className={`font-mono w-4 text-center ${(rank < 2 || isBestThird) ? 'text-green-400 font-bold' : 'text-gray-500'}`}>{rank+1}{isBestThird ? '*' : ''}</span>
                                                            <div className="w-4 h-4 rounded-full bg-white flex items-center justify-center p-0.5 shrink-0"><img src={marble?.logoUrl} className="w-full h-full object-contain" /></div>
                                                            <span className={`truncate ${(rank < 2 || isBestThird) ? 'text-white' : 'text-gray-400'}`}>{marble?.name}</span>
                                                        </div>
                                                        <div className="flex space-x-2 w-28 justify-end items-center font-mono text-[9px] shrink-0">
                                                            <span className="w-4 text-center text-gray-400">{pj}</span>
                                                            <span className="w-4 text-center text-gray-400">{gf}</span>
                                                            <span className="w-4 text-center text-gray-400">{ga}</span>
                                                            <span className={`w-4 text-center ${sg > 0 ? 'text-green-500' : sg < 0 ? 'text-red-500' : 'text-gray-500'}`}>{sg > 0 ? `+${sg}` : sg}</span>
                                                            <span className={`w-4 text-center font-bold ${(rank < 2 || isBestThird) ? 'text-yellow-400' : 'text-gray-300'}`}>{pts}</span>
                                                        </div>
                                                    </div>
                                                )
                                            })}
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                        {gameState.cupPhase !== 'groups' && isWC && (
                            <div className="mt-6 bg-gray-800/50 p-4 rounded-xl border border-gray-700 max-w-2xl mx-auto text-center flex flex-col gap-1.5">
                                <h4 className="text-xs font-bold text-yellow-400 uppercase tracking-widest flex items-center justify-center gap-1.5">
                                    <Medal className="w-4 h-4" /> Classificação de Melhores Terceiros Colocados
                                </h4>
                                <p className="text-[10px] text-gray-400">
                                    As oito melhores equipes entre as terceiras colocadas (<span className="text-green-400 font-bold">*</span>) que avançam para o mata-mata foram definidas conforme os critérios oficiais da Copa do Mundo:
                                </p>
                                <div className="grid grid-cols-3 gap-2 mt-1 text-[9px] font-mono text-gray-300 bg-black/30 p-2 rounded-lg border border-gray-800">
                                    <div>
                                        <span className="text-yellow-400 block font-bold">1º Pontos</span>
                                        Maior número de pontos obtidos
                                    </div>
                                    <div className="border-x border-gray-800">
                                        <span className="text-yellow-400 block font-bold">2º Saldo</span>
                                        Resultante de todos os jogos
                                    </div>
                                    <div>
                                        <span className="text-yellow-400 block font-bold">3º Gols Pró</span>
                                        Maior número de gols marcados
                                    </div>
                                </div>
                            </div>
                        )}
                     </div>
                 )}
             </div>
          </div>
      )
  }

  if (gameState.phase === 'champion') {
    const championId = gameState.activeMarbleIds[0]; const champion = gameState.marbles.find(m => m.id === championId)!; const playerWon = gameState.betMarbleId === championId;
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center p-6 text-center animate-fadeIn">
        <div className="relative mb-8"><div className="absolute inset-0 bg-yellow-500 blur-3xl opacity-20 animate-pulse"></div><Trophy className="w-32 h-32 text-yellow-400 relative z-10 mx-auto mb-4" /><div className="w-32 h-32 rounded-full mx-auto relative z-10 shadow-[0_0_50px_rgba(255,255,255,0.5)] border-4 border-white bg-gray-100 flex items-center justify-center p-2"><img src={champion.logoUrl} alt={champion.name} className="w-full h-full object-contain" /></div></div>
        <h1 className="text-6xl font-black text-white mb-2 brand-font uppercase">{champion.name}</h1><p className="text-2xl text-yellow-500 font-mono mb-4 uppercase">CAMPEÃO DO TORNEIO</p>
        {gameState.gameMode === 'points' && (<div className="text-xl text-blue-400 mb-8 font-mono font-bold uppercase">Pontuação Final: {champion.score} pts</div>)}
        <div className={`p-6 rounded-xl border-2 mb-8 max-w-md w-full ${playerWon ? 'bg-green-900/30 border-green-500' : 'bg-red-900/30 border-red-500'}`}><h3 className="text-xl font-bold mb-2 uppercase">{playerWon ? "PARABÉNS!" : "NÃO FOI DESSA VEZ"}</h3><p className="text-gray-300">{playerWon ? `Sua aposta no ${champion.name} deu certo!` : `Você apostou no ${gameState.marbles.find(m => m.id === gameState.betMarbleId)?.name}. Tente novamente!`}</p></div>
        {gameState.gameMode === 'points' && (<div className="w-full max-w-md bg-gray-800 rounded-lg p-4 mb-8 overflow-y-auto max-h-60"><h4 className="text-gray-400 mb-2 font-bold uppercase text-xs tracking-wider">Tabela Final</h4>{[...gameState.marbles].sort((a,b) => b.score - a.score).map((m, idx) => (<div key={m.id} className="flex justify-between items-center py-2 border-b border-gray-700 last:border-0"><div className="flex items-center space-x-3"><span className="text-gray-500 font-mono w-4">{idx + 1}</span><div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center p-0.5"><img src={m.logoUrl} className="w-full h-full object-contain"/></div><span>{m.name}</span></div><span className="font-mono font-bold text-yellow-500">{m.score}</span></div>))}</div>)}
        <button onClick={resetGame} className="px-8 py-3 bg-white text-black font-bold rounded-full hover:scale-105 transition-transform uppercase">NOVO TORNEIO</button>
      </div>
    );
  }

  const handleElimination = (id: number) => {
    setGameState(prev => ({
      ...prev,
      activeMarbleIds: prev.activeMarbleIds.filter(mid => mid !== id)
    }));
  };

  return (
    <div className="relative w-full h-screen bg-gray-900 overflow-hidden">
      <div className="absolute inset-0 z-0">
        <RaceEngine 
          key={gameState.round + (isTournamentMode ? '_' + gameState.currentMatchIndex : '')} 
          activeMarbles={activeMarblesList} 
          config={physicsConfig} 
          obstacleSettings={obstacleSettings} 
          onRaceFinish={handleRaceFinish} 
          onMarblesUpdate={setLiveMarbles}
          onElimination={handleElimination}
          betMarbleId={gameState.betMarbleId} 
          isPaused={isPaused} 
          isFollowingBet={isFollowingBet} 
          gameMode={gameState.gameMode} 
          zoom={zoom} 
          onZoomChange={setZoom} 
        />
      </div>
      <div className="absolute top-0 left-0 w-full p-4 flex justify-between items-start z-10 pointer-events-none">
          <div className="flex flex-col items-start">
              <div className={`bg-black/60 backdrop-blur p-3 border border-gray-700 text-white pointer-events-auto flex flex-col ${isWC && gameState.phase === 'racing' && match?.matchups ? 'rounded-t-xl border-b-0' : 'rounded-xl shadow-lg'}`}>
                  <div className="text-xs text-gray-400 font-bold uppercase">{isTournamentMode ? gameState.cupMatches[gameState.currentMatchIndex]?.name : 'Rodada'}</div>
                  <div className="text-2xl font-mono text-yellow-400">{isTournamentMode ? '' : `${gameState.round} `}<span className="text-sm text-gray-500">{isTournamentMode ? '' : `/ ${gameState.totalRounds}`}</span></div>
              </div>
              {gameState.phase === 'racing' && isWC && match?.matchups && (
                  <div className="bg-black/60 backdrop-blur-md rounded-b-xl border border-gray-700 p-2 shadow-2xl pointer-events-auto border-t border-gray-800/20 -mt-[1px] animate-in slide-in-from-top-2 duration-300">
                       <div className="space-y-1.5">
                           {match.matchups.map(([idA, idB], idx) => {
                               const marbleA = liveMarbles.find(m => m.id === idA);
                               const marbleB = liveMarbles.find(m => m.id === idB);
                               const teamA = gameState.marbles.find(m => m.id === idA);
                               const teamB = gameState.marbles.find(m => m.id === idB);
                               return (
                                   <div key={idx} className="flex items-center justify-center bg-gray-900/40 px-2 py-1 rounded-lg border border-gray-800/30">
                                       <div className="w-5 h-5 rounded-full bg-white p-0.5 shadow-sm"><img src={teamA?.logoUrl} className="w-full h-full object-contain" /></div>
                                       <div className="flex items-center space-x-2 px-3 font-mono text-sm">
                                           <span className={marbleA?.collectedItems && marbleA.collectedItems > (marbleB?.collectedItems || 0) ? "text-yellow-400 font-bold" : "text-gray-400"}>{marbleA?.collectedItems || 0}</span>
                                           <span className="text-gray-600 font-sans text-[10px]">v</span>
                                           <span className={marbleB?.collectedItems && marbleB.collectedItems > (marbleA?.collectedItems || 0) ? "text-yellow-400 font-bold" : "text-gray-400"}>{marbleB?.collectedItems || 0}</span>
                                       </div>
                                       <div className="w-5 h-5 rounded-full bg-white p-0.5 shadow-sm"><img src={teamB?.logoUrl} className="w-full h-full object-contain" /></div>
                                   </div>
                               );
                           })}
                       </div>
                  </div>
              )}
          </div>
         <div className="flex flex-col items-end pointer-events-auto">
             <button onClick={() => setIsPaused(true)} className="bg-yellow-600/80 backdrop-blur p-2 rounded-full border border-yellow-400 text-white mb-2 hover:bg-yellow-500 transition-colors shadow-lg z-50" title="Pausar"><Pause className="w-6 h-6" /></button>
             <div className="flex flex-col space-y-2 mb-2">
                 <button onClick={() => setZoom(prev => Math.min(3.0, prev + 0.1))} className="bg-blue-600/80 backdrop-blur p-2 rounded-full border border-blue-400 text-white hover:bg-blue-500 transition-colors shadow-lg z-50" title="Zoom In"><ZoomIn className="w-6 h-6" /></button>
                 <button onClick={() => setZoom(prev => Math.max(0.3, prev - 0.1))} className="bg-blue-600/80 backdrop-blur p-2 rounded-full border border-blue-400 text-white hover:bg-blue-500 transition-colors shadow-lg z-50" title="Zoom Out"><ZoomOut className="w-6 h-6" /></button>
                  {isTournamentMode && !isPaused && (
                      <button onClick={handleSimulateMatch} className="bg-blue-600/80 backdrop-blur p-2 rounded-full border border-blue-400 text-white hover:bg-blue-500 transition-colors shadow-lg z-50 animate-pulse" title="Simular Partida"><FastForward className="w-6 h-6" /></button>
                  )}
             </div>
             {gameState.gameMode === 'points' && (<div className="bg-black/50 backdrop-blur p-3 rounded-lg border border-gray-700 text-white min-w-[150px]"><div className="text-xs text-gray-400 font-bold uppercase mb-1">Top Pontos</div>{gameState.marbles.sort((a,b) => b.score - a.score).slice(0, 3).map((m, i) => (<div key={m.id} className="flex justify-between text-xs mb-1"><span className={`${i===0?'text-yellow-400': 'text-gray-300'}`}>{i+1}. {m.name}</span><span className="font-mono">{m.score}</span></div>))}</div>)}
             {isTournamentMode && !isWC && (
                 <div className="bg-black/50 backdrop-blur p-3 rounded-lg border border-gray-700 text-white text-right max-h-40 overflow-y-auto">
                     <div className="text-xs text-gray-400 font-bold uppercase mb-1">{gameState.cupPhase === 'groups' ? `Grupo ${['A','B','C','D','E','F','G','H','I','J','K','L'][gameState.cupMatches[gameState.currentMatchIndex]?.groupIndex || 0]}` : 'Placar'}</div>
                     {gameState.activeMarbleIds.map(id => { 
                         const m = gameState.marbles.find(mar => mar.id === id); 
                         return (
                             <div key={id} className="flex justify-between text-xs space-x-2">
                                 <span>{m?.name}</span>
                                 {gameState.cupPhase === 'groups' && <span className="text-yellow-500 font-bold">{gameState.cupScores[id] || 0}</span>}
                             </div>
                         )
                     })}
                 </div>
             )}
         </div>
      </div>
      {isPaused && !showExitConfirm && (<div className="absolute inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"><div className="bg-gray-800 border border-gray-600 p-8 rounded-2xl shadow-2xl max-w-sm w-full text-center animate-in fade-in zoom-in-95 duration-200"><h2 className="text-3xl font-bold text-white mb-8 brand-font uppercase">JOGO PAUSADO</h2><div className="flex flex-col space-y-4"><button onClick={() => setIsPaused(false)} className="w-full py-4 bg-green-600 hover:bg-green-500 text-white font-bold rounded-lg text-xl shadow-lg transition-transform hover:scale-105 flex items-center justify-center uppercase"><Play className="mr-2 fill-current" /> RETOMAR</button><button onClick={() => setShowExitConfirm(true)} className="w-full py-4 bg-gray-700 hover:bg-red-900/50 hover:border-red-500 border border-transparent text-gray-300 hover:text-red-400 font-bold rounded-lg text-xl transition-colors flex items-center justify-center uppercase"><X className="mr-2" /> SAIR DO JOGO</button></div></div></div>)}
      {showExitConfirm && (<div className="absolute inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4"><div className="bg-gray-900 border-2 border-red-600 p-8 rounded-2xl shadow-[0_0_50px_rgba(220,38,38,0.5)] max-w-sm w-full text-center animate-in zoom-in-95 duration-200"><Skull className="w-16 h-16 text-red-500 mx-auto mb-4" /><h2 className="text-2xl font-bold text-white mb-2 uppercase">ABANDONAR TORNEIO?</h2><p className="text-gray-400 mb-8 uppercase">Todo o progresso atual será perdido e você voltará para a tela de apostas.</p><div className="flex space-x-4"><button onClick={() => setShowExitConfirm(false)} className="flex-1 py-3 bg-gray-700 hover:bg-gray-600 text-white font-bold rounded-lg uppercase">CANCELAR</button><button onClick={() => { setShowExitConfirm(false); setIsPaused(false); handleExitTournament(); }} className="flex-1 py-3 bg-red-600 hover:bg-red-500 text-white font-bold rounded-lg shadow-lg hover:shadow-red-500/50 transition-all uppercase">SAIR</button></div></div></div>)}
      {gameState.phase === 'round_result' && (
          <div className="absolute inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
              <div className="bg-gray-800 rounded-2xl p-8 max-w-sm w-full text-center border border-gray-700 shadow-2xl animate-in slide-in-from-bottom-10 fade-in duration-300 relative overflow-hidden">
                  <h2 className="text-3xl font-bold text-white mb-6 brand-font uppercase">FIM DA RODADA {isTournamentMode ? '' : gameState.round}</h2>
                  {(gameState.gameMode === 'elimination' || gameState.gameMode === 'inverted_elimination') ? (
                      <div className="bg-red-900/20 border border-red-500/50 p-4 rounded-xl mb-6">
                          <Skull className="w-8 h-8 text-red-500 mx-auto mb-2" />
                          <div className="text-red-400 font-bold text-sm uppercase mb-1">Eliminado</div>
                          {gameState.lastEliminatedId !== null && (
                              <div className="flex items-center justify-center space-x-2 mt-2">
                                  <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center p-0.5 relative overflow-hidden">
                                      <img src={gameState.marbles.find(m => m.id === gameState.lastEliminatedId)?.logoUrl} className="w-full h-full object-contain" />
                                  </div>
                                  <span className="text-xl text-white font-mono uppercase">{gameState.marbles.find(m => m.id === gameState.lastEliminatedId)?.name}</span>
                              </div>
                          )}
                      </div>
                  ) : (
                      <div className="bg-gray-900/50 border border-gray-600 p-4 rounded-xl mb-6 max-h-[300px] overflow-y-auto">
                          <div className="flex items-center justify-center mb-4 text-yellow-400 uppercase font-bold tracking-widest"><Medal className="mr-2" /> {isWC && match?.type === 'group' ? 'RESULTADOS DOS CONFRONTOS' : 'RESULTADO DA RODADA'}</div>
                          {isWC && match?.type === 'group' && match.matchups ? (
                              <div className="space-y-4">
                                  {match.matchups.map(([idA, idB], mIdx) => {
                                      const teamA = gameState.marbles.find(m => m.id === idA);
                                      const teamB = gameState.marbles.find(m => m.id === idB);
                                      const marbleA = activeMarblesList.find(m => m.id === idA);
                                      const marbleB = activeMarblesList.find(m => m.id === idB);
                                      const goalsA = marbleA?.collectedItems || 0;
                                      const goalsB = marbleB?.collectedItems || 0;
                                      return (
                                          <div key={mIdx} className="bg-gray-800 p-3 rounded-lg border border-gray-700 shadow-lg">
                                              <div className="flex justify-between items-center mb-2">
                                                  <div className="flex items-center space-x-2 w-2/5">
                                                      <div className="w-5 h-5 rounded-full bg-white p-0.5"><img src={teamA?.logoUrl} className="w-full h-full object-contain" /></div>
                                                      <span className="truncate font-bold text-xs uppercase">{teamA?.name}</span>
                                                  </div>
                                                  <div className="flex items-center justify-center space-x-2 bg-black px-3 py-1 rounded font-mono text-xl text-yellow-400">
                                                      <span>{goalsA}</span>
                                                      <span className="text-gray-500 text-xs">x</span>
                                                      <span>{goalsB}</span>
                                                  </div>
                                                  <div className="flex items-center space-x-2 w-2/5 justify-end">
                                                      <span className="truncate font-bold text-xs uppercase text-right">{teamB?.name}</span>
                                                      <div className="w-5 h-5 rounded-full bg-white p-0.5"><img src={teamB?.logoUrl} className="w-full h-full object-contain" /></div>
                                                  </div>
                                              </div>
                                              <div className="flex justify-between text-[10px] uppercase font-bold">
                                                  <span className={goalsA >= goalsB ? "text-green-400" : "text-gray-500"}>{goalsA > goalsB ? "+3 PTS" : goalsA === goalsB ? "+1 PT" : "0 PTS"}</span>
                                                  <span className={goalsB >= goalsA ? "text-green-400" : "text-gray-500"}>{goalsB > goalsA ? "+3 PTS" : goalsB === goalsA ? "+1 PT" : "0 PTS"}</span>
                                              </div>
                                          </div>
                                      );
                                  })}
                              </div>
                          ) : (
                              activeMarblesList.sort((a,b) => a.rank - b.rank).map((m, idx) => (
                                  <div key={m.id} className="flex justify-between items-center py-2 border-b border-gray-700 last:border-0 text-sm">
                                      <div className="flex items-center space-x-2">
                                          <span className="w-4 text-gray-500">{idx + 1}</span>
                                          <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center p-0.5 relative overflow-hidden"><img src={m.logoUrl} className="w-full h-full object-contain"/></div>
                                          <span>{m.name}</span>
                                      </div>
                                      <div className="flex flex-col text-right">
                                          {isTournamentMode && gameState.cupMatches[gameState.currentMatchIndex]?.type !== 'group' ? (
                                              <div className="flex flex-col items-end">
                                                  <span className={idx===0 ? "text-green-400 font-bold uppercase transition-all scale-110" : "text-red-500 uppercase"}>{idx===0 ? "VENCEU" : "ELIMINADO"}</span>
                                                  {isWC && <span className="text-yellow-400 font-mono text-xs">{m.collectedItems || 0} GOALS</span>}
                                              </div>
                                          ) : (
                                              <>
                                                  <span className="text-green-400 font-bold">+{gameState.roundPoints[m.id]} pts</span>
                                              </>
                                          )}
                                      </div>
                                  </div>
                              ))
                          )}
                      </div>
                  )}
                  {(gameState.gameMode === 'elimination' || gameState.gameMode === 'inverted_elimination') && gameState.lastEliminatedId === gameState.betMarbleId && (
                      <div className="text-red-400 text-sm font-bold mb-6 uppercase">SEU TIME FOI ELIMINADO! 😱</div>
                  )}
                  <div className="mt-4">
                      <p className="text-gray-400 text-xs mb-2 uppercase tracking-widest">Próxima rodada em instantes...</p>
                      <div className="w-full h-2 bg-gray-700 rounded-full overflow-hidden">
                          <div className="h-full bg-blue-500 animate-[width_3s_linear] w-full origin-left" style={{ animationDuration: '3s', animationName: 'shrink', animationTimingFunction: 'linear', animationFillMode: 'forwards' }}></div>
                          <style>{`@keyframes shrink { from { width: 100%; } to { width: 0%; } }`}</style>
                      </div>
                  </div>
              </div>
          </div>
      )}
      {gameState.phase === 'racing' && (<button onClick={() => setIsFollowingBet(!isFollowingBet)} className={`absolute bottom-6 left-1/2 transform -translate-x-1/2 px-6 py-2 rounded-full border flex items-center space-x-2 transition-all shadow-lg hover:scale-105 active:scale-95 z-40 ${isFollowingBet ? 'bg-yellow-900/80 border-yellow-400' : 'bg-black/60 border-yellow-500/30'}`}>{isFollowingBet ? <Camera className="w-4 h-4 text-yellow-400 animate-pulse" /> : <Camera className="w-4 h-4 text-gray-400" />}{isFollowingBet ? (<div className="flex items-center space-x-2"><div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center p-0.5 relative overflow-hidden"><img src={gameState.marbles.find(m => m.id === gameState.betMarbleId)?.logoUrl} className="w-full h-full object-contain" /></div><span className="font-bold text-yellow-400 uppercase">{gameState.marbles.find(m => m.id === gameState.betMarbleId)?.name}</span></div>) : (<span className="text-gray-300 font-bold uppercase text-sm">CÂMERA: LÍDER</span>)}</button>)}
    </div>
  );
}

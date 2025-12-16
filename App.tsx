import React, { useState, useEffect, useMemo } from 'react';
import RaceEngine from './components/RaceEngine';
import { Marble, GameState, PhysicsConfig, GameMode, ObstacleSettings, Match } from './types';
import { Trophy, Settings, Skull, Play, Medal, X, Pause, Camera, Sliders, PlayCircle, FastForward, GitMerge, LayoutGrid } from 'lucide-react';
import { audio } from './services/audioService';

// Data for Brazilian Teams
// CORREÇÃO: Usando fontes mistas (ESPN, Wikimedia, FotMob) para garantir carregamento de todas as imagens
const TEAMS = [
  { name: "São Paulo", color: "#C62925", logo: "https://a.espncdn.com/i/teamlogos/soccer/500/2026.png" },
  { name: "Santos", color: "#000000", logo: "https://a.espncdn.com/i/teamlogos/soccer/500/2674.png" }, 
  { name: "Palmeiras", color: "#006437", logo: "https://a.espncdn.com/i/teamlogos/soccer/500/2029.png" },
  { name: "Corinthians", color: "#000000", logo: "https://a.espncdn.com/i/teamlogos/soccer/500/874.png" },
  { name: "Flamengo", color: "#C3281E", logo: "https://a.espncdn.com/i/teamlogos/soccer/500/819.png" },
  { name: "Vasco", color: "#000000", logo: "https://a.espncdn.com/i/teamlogos/soccer/500/3454.png" },
  { name: "Fluminense", color: "#8A191D", logo: "https://a.espncdn.com/i/teamlogos/soccer/500/3445.png" },

  // ESPN funciona
  { name: "Botafogo", color: "#000000", logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/5/52/Botafogo_de_Futebol_e_Regatas_logo.svg/500px-Botafogo_de_Futebol_e_Regatas_logo.svg.png" },
  { name: "Cruzeiro", color: "#005CA9", logo: "https://a.espncdn.com/i/teamlogos/soccer/500/2022.png" },
  { name: "Atlético MG", color: "#000000", logo: "https://commons.wikimedia.org/wiki/Special:FilePath/Clube%20Atl%C3%A9tico%20Mineiro%20logo.svg?width=500" },
  { name: "Grêmio", color: "#0D80BF", logo: "https://a.espncdn.com/i/teamlogos/soccer/500/6273.png" },
  { name: "Internacional", color: "#E30613", logo: "https://a.espncdn.com/i/teamlogos/soccer/500/1936.png" },
  { name: "Bahia", color: "#0083CA", logo: "https://a.espncdn.com/i/teamlogos/soccer/500/9967.png" },
  // Ajustes confirmados
  { name: "Fortaleza", color: "#132E66", logo: "https://a.espncdn.com/i/teamlogos/soccer/500/6272.png" },
  { name: "Sport", color: "#D30915", logo: "https://a.espncdn.com/i/teamlogos/soccer/500/7635.png" },
  { name: "Vitória", color: "#C8102E", logo: "https://a.espncdn.com/i/teamlogos/soccer/500/3457.png" },
  { name: "Athletico-PR", color: "#CA171D", logo: "https://a.espncdn.com/i/teamlogos/soccer/500/3458.png" },

  // ESPN não possui logo → Wikimedia (funcional)
  { 
    name: "Coritiba",
    color: "#00532C",
    logo: "https://commons.wikimedia.org/wiki/Special:FilePath/Coritiba%20FBC%20(2011)%20-%20PR.svg?width=500"
  },
  { 
    name: "Goiás",
    color: "#006C47",
    logo: "https://commons.wikimedia.org/wiki/Special:FilePath/Goi%C3%A1s%20Esporte%20Clube%20logo.svg?width=500"
  },

  { name: "Mirassol", color: "#FFD700", logo: "https://a.espncdn.com/i/teamlogos/soccer/500/9169.png" }
];

// Points distribution for Points Mode (1st to 20th)
const POINTS_SYSTEM = [20, 19, 18, 17, 16, 15, 14, 13, 12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1];

// Points for Cup Groups (5 marbles per race)
const CUP_GROUP_POINTS = [5, 4, 3, 2, 1];

const INITIAL_MARBLES: Marble[] = TEAMS.map((team, i) => ({
  id: i,
  name: team.name,
  color: team.color,
  logoUrl: team.logo,
  x: 0, y: 0, vx: 0, vy: 0, 
  radius: 18, 
  angle: 0,
  omega: 0,
  score: 0,
  finished: false, finishTime: 0, rank: 0
}));

// Helper to shuffle array
function shuffle<T>(array: T[]): T[] {
  const newArr = [...array];
  for (let i = newArr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArr[i], newArr[j]] = [newArr[j], newArr[i]];
  }
  return newArr;
}

export default function App() {
  const [gameState, setGameState] = useState<GameState>({
    gameMode: 'elimination',
    phase: 'betting',
    round: 1,
    totalRounds: TEAMS.length - 1, 
    marbles: INITIAL_MARBLES,
    activeMarbleIds: INITIAL_MARBLES.map(m => m.id),
    betMarbleId: null,
    lastEliminatedId: null,
    roundPoints: {},
    cupMatches: [],
    currentMatchIndex: 0,
    cupGroups: [],
    cupScores: {},
    cupPhase: 'groups'
  });

  const [physicsConfig, setPhysicsConfig] = useState<PhysicsConfig>({
    gravity: 0.25,
    restitution: 0.6,
    friction: 0.99
  });

  const [obstacleSettings, setObstacleSettings] = useState<ObstacleSettings>({
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
  const [showObstacleConfig, setShowObstacleConfig] = useState(false);
  
  // Default to false (Follow Leader)
  const [isFollowingBet, setIsFollowingBet] = useState(false);

  // Memoize activeMarblesList to prevent unnecessary re-initialization of RaceEngine
  const activeMarblesList = useMemo(() => 
    gameState.marbles.filter(m => gameState.activeMarbleIds.includes(m.id)),
    [gameState.marbles, gameState.activeMarbleIds]
  );

  // --- Cup Logic Generators ---

  const generateCupSchedule = (marbleIds: number[]) => {
      // 1. Shuffle teams and assign 4 groups
      const shuffled = shuffle(marbleIds);
      const groups = [
          shuffled.slice(0, 5),
          shuffled.slice(5, 10),
          shuffled.slice(10, 15),
          shuffled.slice(15, 20)
      ];

      // 2. Generate 5 rounds of races for each group
      const matches: Match[] = [];
      const groupNames = ['A', 'B', 'C', 'D'];
      
      for (let r = 1; r <= 5; r++) {
          groups.forEach((groupIds, gIdx) => {
              matches.push({
                  id: `g${gIdx}_r${r}`,
                  name: `Grupo ${groupNames[gIdx]} - Rodada ${r}`,
                  marbleIds: groupIds,
                  type: 'group',
                  groupIndex: gIdx,
                  nextPhase: (r === 5 && gIdx === 3) // Last match of groups triggers next phase
              });
          });
      }

      return { groups, matches };
  };

  const generateKnockoutMatches = (qualifiers: number[], phaseName: string) => {
      const matches: Match[] = [];
      // Pairs: 0 vs 1, 2 vs 3, etc.
      for (let i = 0; i < qualifiers.length; i += 2) {
          matches.push({
              id: `${phaseName}_${i}`, // ID is strictly tied to index (0, 2, 4...)
              name: `${phaseName} - Jogo ${Math.floor(i/2) + 1}`,
              marbleIds: [qualifiers[i], qualifiers[i+1]],
              type: 'knockout',
              nextPhase: (i === qualifiers.length - 2)
          });
      }
      return matches;
  };

  // --- Handlers ---

  const handleModeSelect = (mode: GameMode) => {
    let newTotalRounds = 0;
    if (mode === 'elimination') newTotalRounds = TEAMS.length - 1;
    if (mode === 'points') newTotalRounds = 10;
    // Cup rounds are dynamic based on matches, but we can set a placeholder
    if (mode === 'cup') newTotalRounds = 35; // 20 group + 8 + 4 + 2 + 1

    setGameState(prev => ({
      ...prev,
      gameMode: mode,
      totalRounds: newTotalRounds
    }));
  };

  const handleStartTournament = () => {
    if (gameState.betMarbleId === null) return;
    
    // Setup for Cup if selected
    if (gameState.gameMode === 'cup') {
        const { groups, matches } = generateCupSchedule(gameState.marbles.map(m => m.id));
        setGameState(prev => ({
            ...prev,
            phase: 'cup_tree', // Show bracket/groups first!
            cupGroups: groups,
            cupMatches: matches,
            currentMatchIndex: 0,
            cupScores: {}, // Reset scores
            cupPhase: 'groups',
            activeMarbleIds: matches[0].marbleIds, // Pre-load first match
            round: 1
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

  const handleStartCupRacing = () => {
      setGameState(prev => ({ ...prev, phase: 'racing' }));
      audio.init();
      audio.resume();
      setIsPaused(false);
      setShowExitConfirm(false);
      setIsFollowingBet(false);
  };

  const handleExitTournament = () => {
      resetGame();
  };

  // Used for simulating non-player matches
  const handleSimulateMatch = () => {
      if (gameState.gameMode !== 'cup') return;
      
      const currentMatch = gameState.cupMatches[gameState.currentMatchIndex];
      if (!currentMatch) return; // Guard clause

      // Simulate random results
      const matchMarbles: Marble[] = gameState.marbles.filter(m => currentMatch.marbleIds.includes(m.id));
      // CRITICAL FIX: Ensure simulated results have valid rank and finished status
      const shuffledResults = shuffle<Marble>(matchMarbles).map((m, i) => ({
          ...m,
          rank: i + 1,
          finished: true,
          finishTime: i * 100 // Dummy time
      }));
      
      // Update state immediately without running physics
      handleRaceFinish(shuffledResults);
  };

  const handleRaceFinish = (results: Marble[]) => {
    if (gameState.gameMode === 'cup') {
        handleCupRaceFinish(results);
        return;
    }

    // Existing Modes Logic
    if (gameState.gameMode === 'elimination') {
      const loser = results[results.length - 1];
      audio.playEliminated();
      setGameState(prev => ({
        ...prev,
        phase: 'round_result',
        lastEliminatedId: loser.id,
        roundPoints: {}
      }));
    } else {
      // Points Mode logic
      const currentRoundPoints: Record<number, number> = {};
      const updatedMarbles = [...gameState.marbles];

      results.forEach((m, index) => {
        const points = POINTS_SYSTEM[index] || 0;
        currentRoundPoints[m.id] = points;
        
        // Update total score AND persist rank/status
        const marbleIndex = updatedMarbles.findIndex(mar => mar.id === m.id);
        if (marbleIndex !== -1) {
          updatedMarbles[marbleIndex] = {
            ...updatedMarbles[marbleIndex],
            score: updatedMarbles[marbleIndex].score + points,
            rank: index + 1,        // FIX: Update Rank
            finished: true,         // FIX: Update Status
            finishTime: m.finishTime || index
          };
        }
      });
      
      audio.playFinish();

      setGameState(prev => ({
        ...prev,
        marbles: updatedMarbles,
        phase: 'round_result',
        roundPoints: currentRoundPoints
      }));
    }
  };

  const handleCupRaceFinish = (results: Marble[]) => {
      const match = gameState.cupMatches[gameState.currentMatchIndex];
      const newScores = { ...gameState.cupScores };
      const updatedMarbles = [...gameState.marbles];

      // Assign Points logic
      results.forEach((m, idx) => {
          let points = 0;
          if (match.type === 'group') {
              points = CUP_GROUP_POINTS[idx] || 0;
              // For group phase, we accumulate
              newScores[m.id] = (newScores[m.id] || 0) + points;
          } else {
              // Knockout: RESET Score to be pure binary (Winner 1, Loser 0)
              // This removes the confusion of "Total Points" from group stage persisting
              if (idx === 0) points = 1; 
              newScores[m.id] = points; // OVERWRITE, do not accumulate
          }

          // Update main marble objects score for global tracking if needed
          // CRITICAL FIX: Also update rank and finished status so UI displays correct order
          const mIdx = updatedMarbles.findIndex(mar => mar.id === m.id);
          if (mIdx !== -1) {
              updatedMarbles[mIdx] = {
                  ...updatedMarbles[mIdx],
                  score: newScores[m.id],
                  rank: idx + 1,       // 1st place = 1
                  finished: true,
                  finishTime: m.finishTime || idx
              };
          }
      });

      // Check if we need to generate next phase
      let nextPhase = gameState.cupPhase;
      let nextMatches = [...gameState.cupMatches];
      
      if (match.nextPhase) {
          if (gameState.cupPhase === 'groups') {
              nextPhase = 'octavas';
              // Determine Qualifiers (Top 4 from each group)
              const qualifiers: number[] = [];
              gameState.cupGroups.forEach(group => {
                  const sorted = group.sort((a, b) => (newScores[b] || 0) - (newScores[a] || 0));
                  qualifiers.push(...sorted.slice(0, 4));
              });
              
              const finalQualifiers: number[] = [];
              
              // A vs B (A1xB4, A2xB3, A3xB2, A4xB1)
              for(let i=0; i<4; i++) {
                 finalQualifiers.push(gameState.cupGroups[0][i]); // A
                 finalQualifiers.push(gameState.cupGroups[1][3-i]); // B
              }
              // C vs D (C1xD4, C2xD3, C3xD2, C4xD1)
              for(let i=0; i<4; i++) {
                 finalQualifiers.push(gameState.cupGroups[2][i]); // C
                 finalQualifiers.push(gameState.cupGroups[3][3-i]); // D
              }
              
              nextMatches = [...nextMatches, ...generateKnockoutMatches(finalQualifiers, "Oitavas")];

          } else if (gameState.cupPhase === 'octavas') {
              nextPhase = 'quartas';
          }
      }

      // Hack for Knockout Progression:
      const currentMatchIdx = gameState.currentMatchIndex;
      // Mark winner ID on the finished match
      const finishedMatch = { ...match, winnerId: results[0].id };
      nextMatches[currentMatchIdx] = finishedMatch;

      // Logic to generate next round matches if phase ended
      if (match.nextPhase) {
          let winners: number[] = [];
          
          if (gameState.cupPhase === 'octavas') {
              // FIX: Ensure strict sorting by ID to guarantee Bracket Order (Match 1 vs Match 2)
              const octavasMatches = nextMatches.filter(m => m.name.includes("Oitavas"));
              octavasMatches.sort((a, b) => {
                  // ID format: Oitavas_0, Oitavas_2, etc.
                  const idxA = parseInt(a.id.split('_')[1] || "0");
                  const idxB = parseInt(b.id.split('_')[1] || "0");
                  return idxA - idxB;
              });
              winners = octavasMatches.map(m => m.winnerId!).filter(id => id !== undefined);
              nextMatches = [...nextMatches, ...generateKnockoutMatches(winners, "Quartas")];
              nextPhase = 'quartas';
          } else if (gameState.cupPhase === 'quartas') {
              const quartasMatches = nextMatches.filter(m => m.name.includes("Quartas"));
              quartasMatches.sort((a, b) => {
                  const idxA = parseInt(a.id.split('_')[1] || "0");
                  const idxB = parseInt(b.id.split('_')[1] || "0");
                  return idxA - idxB;
              });
              winners = quartasMatches.map(m => m.winnerId!).filter(id => id !== undefined);
              nextMatches = [...nextMatches, ...generateKnockoutMatches(winners, "Semi")];
              nextPhase = 'semi';
          } else if (gameState.cupPhase === 'semi') {
              const semiMatches = nextMatches.filter(m => m.name.includes("Semi"));
              semiMatches.sort((a, b) => {
                  const idxA = parseInt(a.id.split('_')[1] || "0");
                  const idxB = parseInt(b.id.split('_')[1] || "0");
                  return idxA - idxB;
              });
              winners = semiMatches.map(m => m.winnerId!).filter(id => id !== undefined);
              nextMatches = [...nextMatches, ...generateKnockoutMatches(winners, "Final")];
              nextPhase = 'final';
          } else if (gameState.cupPhase === 'final') {
              // Champion!
              setGameState(prev => ({
                  ...prev,
                  phase: 'champion',
                  activeMarbleIds: [results[0].id],
                  marbles: updatedMarbles,
                  cupScores: newScores
              }));
              audio.playFinish();
              return;
          }
      }

      setGameState(prev => ({
          ...prev,
          marbles: updatedMarbles,
          cupScores: newScores,
          cupMatches: nextMatches,
          cupPhase: nextPhase as any,
          phase: 'round_result',
          roundPoints: results.reduce((acc, m, i) => ({ ...acc, [m.id]: (match.type === 'group' ? CUP_GROUP_POINTS[i] : (i===0?1:0)) }), {})
      }));
  };

  const handleNextRound = () => {
    // CRITICAL: Always reset camera to follow leader at start of new round
    setIsFollowingBet(false); 
    
    if (gameState.gameMode === 'cup') {
        const nextIdx = gameState.currentMatchIndex + 1;
        
        // CHECK IF WE NEED TO RESET SCORES FOR KNOCKOUT
        const currentMatch = gameState.cupMatches[gameState.currentMatchIndex];
        let nextScores = { ...gameState.cupScores };
        
        // If we just finished a group match, but the NEXT state phase is no longer groups (e.g., we just finished the last group game),
        // we should reset scores so Knockout starts at 0.
        // We can check if we are transitioning phases essentially.
        if (currentMatch.type === 'group' && gameState.cupPhase !== 'groups') {
            Object.keys(nextScores).forEach(key => {
                nextScores[parseInt(key)] = 0;
            });
        }

        if (nextIdx < gameState.cupMatches.length) {
            setGameState(prev => ({
                ...prev,
                cupScores: nextScores, // Apply reset scores
                phase: 'cup_tree', // VOLTA PARA A TREE PARA MOSTRAR ATUALIZAÇÕES
                currentMatchIndex: nextIdx,
                activeMarbleIds: prev.cupMatches[nextIdx].marbleIds,
                round: prev.round + 1
            }));
        } else {
             // End of cup (should be handled in Final logic, but failsafe)
        }
        return;
    }

    if (gameState.gameMode === 'elimination') {
      const nextActiveIds = gameState.activeMarbleIds.filter(id => id !== gameState.lastEliminatedId);
      
      if (nextActiveIds.length === 1) {
        audio.playFinish(); 
        setGameState(prev => ({
          ...prev,
          activeMarbleIds: nextActiveIds,
          phase: 'champion'
        }));
      } else {
        setGameState(prev => ({
          ...prev,
          activeMarbleIds: nextActiveIds,
          phase: 'racing',
          round: prev.round + 1,
          lastEliminatedId: null
        }));
      }
    } else {
      // Points Mode
      if (gameState.round >= gameState.totalRounds) {
         // End of tournament
         const sortedByScore = [...gameState.marbles].sort((a, b) => b.score - a.score);
         const winnerIds = [sortedByScore[0].id]; 
         
         audio.playFinish();
         setGameState(prev => ({
           ...prev,
           activeMarbleIds: winnerIds,
           phase: 'champion'
         }));
      } else {
        // Points Mode: Just increment round, phase -> racing
        setGameState(prev => ({
          ...prev,
          phase: 'racing',
          round: prev.round + 1,
          roundPoints: {}
        }));
      }
    }
  };

  const resetGame = () => {
    setGameState({
      gameMode: gameState.gameMode,
      phase: 'betting',
      round: 1,
      totalRounds: gameState.gameMode === 'elimination' ? TEAMS.length - 1 : 10,
      marbles: INITIAL_MARBLES.map(m => ({...m, score: 0})),
      activeMarbleIds: INITIAL_MARBLES.map(m => m.id),
      betMarbleId: null,
      lastEliminatedId: null,
      roundPoints: {},
      cupMatches: [],
      currentMatchIndex: 0,
      cupGroups: [],
      cupScores: {},
      cupPhase: 'groups'
    });
    setIsPaused(false);
    setShowExitConfirm(false);
    setIsFollowingBet(false);
  };

  const toggleObstacle = (key: keyof ObstacleSettings) => {
    setObstacleSettings(prev => ({ ...prev, [key]: !prev[key] }));
  };

  // --- Auto Advance Effect ---
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    if (gameState.phase === 'round_result') {
      // 3 Seconds Popup Duration
      timer = setTimeout(() => {
        handleNextRound();
      }, 3000);
    }
    return () => clearTimeout(timer);
  }, [gameState.phase, gameState.activeMarbleIds, gameState.round]);


  // --- Render Components ---

  // 1. Betting / Config Screen
  if (gameState.phase === 'betting') {
    return (
      <div className="min-h-screen bg-gray-900 flex flex-col items-center justify-center p-4 text-white">
        <h1 className="text-5xl md:text-7xl mb-2 text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-red-500 brand-font tracking-widest text-center">
          MARBLE ROYALE
        </h1>
        <h2 className="text-xl md:text-2xl text-green-400 mb-2 font-bold tracking-widest">
          BRASILEIRÃO EDITION
        </h2>
        <p className="text-gray-500 font-mono text-sm mb-6 tracking-wide">
          Desenvolvido por Prof Covre
        </p>
        
        {/* Mode Selector */}
        <div className="flex flex-wrap justify-center gap-2 mb-6 bg-gray-800 p-2 rounded-lg border border-gray-700">
           <button 
             onClick={() => handleModeSelect('elimination')}
             className={`px-4 py-2 rounded-md font-bold transition-all ${gameState.gameMode === 'elimination' ? 'bg-red-600 text-white' : 'text-gray-400 hover:text-white'}`}
           >
             MATA-MATA
           </button>
           <button 
             onClick={() => handleModeSelect('points')}
             className={`px-4 py-2 rounded-md font-bold transition-all ${gameState.gameMode === 'points' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white'}`}
           >
             PONTOS CORRIDOS
           </button>
           <button 
             onClick={() => handleModeSelect('cup')}
             className={`px-4 py-2 rounded-md font-bold transition-all ${gameState.gameMode === 'cup' ? 'bg-yellow-600 text-white' : 'text-gray-400 hover:text-white'}`}
           >
             COPA
           </button>
        </div>

        <div className="bg-gray-800 p-6 rounded-xl border border-gray-700 w-full max-w-4xl shadow-2xl">
          <div className="mb-6">
            <h2 className="text-xl font-bold mb-4 flex items-center text-yellow-400">
              <Trophy className="mr-2" /> Escolha seu Time
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
              {gameState.marbles.map(m => (
                <button
                  key={m.id}
                  onClick={() => setGameState(prev => ({ ...prev, betMarbleId: m.id }))}
                  className={`p-3 rounded-lg flex flex-col items-center transition-all ${
                    gameState.betMarbleId === m.id 
                      ? 'bg-yellow-500/20 border-2 border-yellow-400 scale-105' 
                      : 'bg-gray-700 border border-transparent hover:bg-gray-600'
                  }`}
                >
                  <div className="w-12 h-12 rounded-full mb-2 shadow-lg bg-gray-200 flex items-center justify-center p-0.5 relative overflow-hidden">
                     <img src={m.logoUrl} alt={m.name} className="w-full h-full object-contain" />
                  </div>
                  <span className="text-xs font-bold font-mono">{m.name}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="mb-8 border-t border-gray-700 pt-6">
            <div className="flex justify-between items-center mb-4">
               <h2 className="text-xl font-bold flex items-center text-blue-400">
                  <Settings className="mr-2" /> Configurações
               </h2>
               <button 
                  onClick={() => setShowObstacleConfig(true)}
                  className="flex items-center text-sm bg-gray-700 hover:bg-gray-600 px-3 py-1.5 rounded transition-colors"
               >
                  <Sliders className="w-4 h-4 mr-2" />
                  Personalizar Obstáculos
               </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="text-xs text-gray-400 block mb-1">Gravidade ({(physicsConfig.gravity * 100).toFixed(0)}%)</label>
                <input 
                  type="range" min="0.1" max="0.8" step="0.05"
                  value={physicsConfig.gravity}
                  onChange={(e) => setPhysicsConfig(prev => ({...prev, gravity: parseFloat(e.target.value)}))}
                  className="w-full accent-blue-500"
                />
              </div>
              <div>
                <label className="text-xs text-gray-400 block mb-1">Elasticidade ({(physicsConfig.restitution * 100).toFixed(0)}%)</label>
                <input 
                  type="range" min="0.1" max="0.9" step="0.1"
                  value={physicsConfig.restitution}
                  onChange={(e) => setPhysicsConfig(prev => ({...prev, restitution: parseFloat(e.target.value)}))}
                  className="w-full accent-blue-500"
                />
              </div>
            </div>
          </div>

          <div className="flex w-full">
            <button 
                disabled={gameState.betMarbleId === null}
                onClick={handleStartTournament}
                className={`w-full py-4 rounded-lg font-black text-xl tracking-widest transition-all flex items-center justify-center ${
                gameState.betMarbleId !== null
                    ? 'bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-400 hover:to-emerald-500 text-white shadow-lg transform hover:-translate-y-1'
                    : 'bg-gray-700 text-gray-500 cursor-not-allowed'
                }`}
            >
                {gameState.gameMode === 'cup' ? 'VER CHAVEAMENTO' : 'INICIAR CORRIDA'}
            </button>
          </div>

        </div>
        
        {/* Obstacle Config Modal */}
        {showObstacleConfig && (
           <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
              <div className="bg-gray-800 border border-gray-600 rounded-xl p-6 max-w-lg w-full shadow-2xl animate-in zoom-in-95">
                 <div className="flex justify-between items-center mb-6">
                    <h3 className="text-xl font-bold flex items-center"><Sliders className="mr-2 w-5 h-5"/> Obstáculos Ativos</h3>
                    <button onClick={() => setShowObstacleConfig(false)}><X className="text-gray-400 hover:text-white" /></button>
                 </div>
                 
                 <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-h-[60vh] overflow-y-auto pr-2">
                    {[
                      { id: 'spinner', label: 'Giradores' },
                      { id: 'slider', label: 'Esmagadores' },
                      { id: 'repulsor', label: 'Repulsores' },
                      { id: 'conveyor', label: 'Esteiras' },
                      { id: 'teleporter', label: 'Teletransportes' },
                      { id: 'hollow_circle', label: 'Círculos Ocos' },
                      { id: 'laser', label: 'Lasers' },
                      { id: 'fan', label: 'Ventiladores' },
                      { id: 'funnel', label: 'Funis Gigantes' }
                    ].map((obs) => (
                      <button 
                        key={obs.id}
                        onClick={() => toggleObstacle(obs.id as keyof ObstacleSettings)}
                        className={`flex items-center justify-between p-3 rounded-lg border transition-all ${obstacleSettings[obs.id as keyof ObstacleSettings] ? 'bg-blue-900/30 border-blue-500/50' : 'bg-gray-700/30 border-gray-700'}`}
                      >
                         <span className="font-mono text-sm">{obs.label}</span>
                         <div className={`w-10 h-6 rounded-full relative transition-colors ${obstacleSettings[obs.id as keyof ObstacleSettings] ? 'bg-blue-500' : 'bg-gray-600'}`}>
                            <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${obstacleSettings[obs.id as keyof ObstacleSettings] ? 'left-5' : 'left-1'}`} />
                         </div>
                      </button>
                    ))}
                 </div>
                 
                 <div className="mt-6 flex justify-end">
                    <button 
                      onClick={() => setShowObstacleConfig(false)}
                      className="px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-lg"
                    >
                      CONFIRMAR
                    </button>
                 </div>
              </div>
           </div>
        )}

      </div>
    );
  }
  
  // 1.5 CUP TREE VIEW (New Phase)
  if (gameState.phase === 'cup_tree') {
      const getSortedGroup = (groupIdx: number) => {
         const groupIds = gameState.cupGroups[groupIdx] || [];
         return [...groupIds].sort((a, b) => (gameState.cupScores[b] || 0) - (gameState.cupScores[a] || 0));
      };

      const getTeam = (id: number | undefined) => id !== undefined ? gameState.marbles.find(m => m.id === id) : undefined;
      const getTeamName = (id: number | undefined) => getTeam(id)?.name || "???";

      // Helper: Check if group matches are finished (5 rounds)
      const isGroupFinished = (gIdx: number) => gameState.currentMatchIndex > (16 + gIdx);

      // Helper: Get winner from a specific previous match by ID (strictly index-based logic)
      const getWinnerFromMatch = (phaseName: string, bracketMatchIndex: number) => {
          // bracketMatchIndex comes in as 0, 1, 2, 3...
          // The generator uses i, i+2... so ID is phaseName + "_" + (bracketMatchIndex * 2)
          const targetId = `${phaseName}_${bracketMatchIndex * 2}`;
          const m = gameState.cupMatches.find(match => match.id === targetId);
          return m?.winnerId;
      };

      // Bracket Projection Helpers
      const leadersA = getSortedGroup(0);
      const leadersB = getSortedGroup(1);
      const leadersC = getSortedGroup(2);
      const leadersD = getSortedGroup(3);

      const projections = (gameState.cupPhase === 'groups') ? [
          { t1: leadersA[0], t2: leadersB[3] },
          { t1: leadersA[1], t2: leadersB[2] },
          { t1: leadersA[2], t2: leadersB[1] },
          { t1: leadersA[3], t2: leadersB[0] },
          { t1: leadersC[0], t2: leadersD[3] },
          { t1: leadersC[1], t2: leadersD[2] },
          { t1: leadersC[2], t2: leadersD[1] },
          { t1: leadersC[3], t2: leadersD[0] },
      ] : [];
      
      const octavasLabels = [
          { t: "1º GRUPO A", b: "4º GRUPO B" },
          { t: "2º GRUPO A", b: "3º GRUPO B" },
          { t: "3º GRUPO A", b: "2º GRUPO B" },
          { t: "4º GRUPO A", b: "1º GRUPO B" },
          { t: "1º GRUPO C", b: "4º GRUPO D" },
          { t: "2º GRUPO C", b: "3º GRUPO D" },
          { t: "3º GRUPO C", b: "2º GRUPO D" },
          { t: "4º GRUPO C", b: "1º GRUPO D" },
      ];

      const renderBracketMatch = (phaseName: string, index: number, projection?: {t1: number | undefined, t2: number | undefined}, t1Ready: boolean = true, t2Ready: boolean = true, labelTop: string = "", labelBottom: string = "") => {
         // Find actual match by ID
         const targetId = `${phaseName}_${index * 2}`;
         const match = gameState.cupMatches.find(m => m.id === targetId);
         
         let team1Id = match ? match.marbleIds[0] : (t1Ready && projection ? projection.t1 : undefined);
         let team2Id = match ? match.marbleIds[1] : (t2Ready && projection ? projection.t2 : undefined);
         
         const team1 = getTeam(team1Id);
         const team2 = getTeam(team2Id);
         
         // Highlight winner
         const winnerId = match?.winnerId;
         
         return (
             <div className={`p-2 rounded-lg border flex flex-col justify-center text-xs mb-4 min-w-[160px] ${match ? 'bg-gray-800 border-gray-600' : 'bg-gray-800/50 border-gray-700 border-dashed opacity-70'}`}>
                 <div className="flex justify-between items-center mb-1">
                     <span className="text-[10px] text-gray-500 font-mono">JOGO {index + 1}</span>
                 </div>
                 
                 {/* Team 1 */}
                 <div className="mb-1">
                     <div className={`flex items-center space-x-2 p-1 rounded ${winnerId === team1Id && team1Id !== undefined ? 'bg-green-900/30' : ''}`}>
                          <div className={`w-4 h-4 rounded-full flex items-center justify-center p-[1px] ${winnerId === team1Id && team1Id !== undefined ? 'bg-yellow-400' : 'bg-gray-400'}`}>
                              {team1 ? <img src={team1.logoUrl} className="w-full h-full object-contain rounded-full" /> : <div className="w-full h-full bg-gray-600 rounded-full" />}
                          </div>
                          <div className="flex flex-col overflow-hidden">
                              <span className={`truncate font-mono ${winnerId === team1Id && team1Id !== undefined ? 'text-green-400 font-bold' : 'text-gray-300'}`}>
                                  {team1 ? team1.name : (gameState.cupPhase==='groups' ? '???' : '')}
                              </span>
                              {!team1 && labelTop && <span className="text-[9px] text-gray-500 uppercase">{labelTop}</span>}
                          </div>
                          {winnerId === team1Id && team1Id !== undefined && <Medal className="w-3 h-3 text-yellow-500 ml-auto" />}
                     </div>
                 </div>

                 {/* Team 2 */}
                 <div>
                     <div className={`flex items-center space-x-2 p-1 rounded ${winnerId === team2Id && team2Id !== undefined ? 'bg-green-900/30' : ''}`}>
                          <div className={`w-4 h-4 rounded-full flex items-center justify-center p-[1px] ${winnerId === team2Id && team2Id !== undefined ? 'bg-yellow-400' : 'bg-gray-400'}`}>
                              {team2 ? <img src={team2.logoUrl} className="w-full h-full object-contain rounded-full" /> : <div className="w-full h-full bg-gray-600 rounded-full" />}
                          </div>
                          <div className="flex flex-col overflow-hidden">
                              <span className={`truncate font-mono ${winnerId === team2Id && team2Id !== undefined ? 'text-green-400 font-bold' : 'text-gray-300'}`}>
                                  {team2 ? team2.name : (gameState.cupPhase==='groups' ? '???' : '')}
                              </span>
                              {!team2 && labelBottom && <span className="text-[9px] text-gray-500 uppercase">{labelBottom}</span>}
                          </div>
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
                        <h1 className="text-3xl font-bold brand-font text-yellow-400">ORGANIZAÇÃO DA COPA</h1>
                        <p className="text-gray-400 text-sm">Próximo: {gameState.cupMatches[gameState.currentMatchIndex]?.name}</p>
                     </div>
                     <button 
                        onClick={handleStartCupRacing}
                        className="bg-green-600 hover:bg-green-500 text-white px-8 py-3 rounded-lg font-bold flex items-center shadow-lg animate-pulse"
                     >
                         <PlayCircle className="mr-2 w-6 h-6" /> IR PARA PARTIDA
                     </button>
                 </div>

                 {/* FULL BRACKET SCROLL VIEW */}
                 <div className="overflow-x-auto pb-4 custom-scrollbar">
                    <div className="flex gap-4 min-w-[800px] justify-between">
                        
                        {/* COLUNA 1: OITAVAS */}
                        <div className="flex flex-col w-1/4 min-w-[180px]">
                            <h3 className="text-center font-bold text-blue-400 mb-4 bg-gray-800 p-2 rounded">OITAVAS</h3>
                            <div className="flex flex-col gap-2">
                                {[0,1,2,3,4,5,6,7].map(i => {
                                    let t1Ready = true;
                                    let t2Ready = true;
                                    
                                    if (gameState.cupPhase === 'groups') {
                                        if (i < 4) {
                                            // Matches 0-3: A vs B
                                            t1Ready = isGroupFinished(0); // A finished?
                                            t2Ready = isGroupFinished(1); // B finished?
                                        } else {
                                            // Matches 4-7: C vs D
                                            t1Ready = isGroupFinished(2); // C finished?
                                            t2Ready = isGroupFinished(3); // D finished?
                                        }
                                    }
                                    return renderBracketMatch("Oitavas", i, projections[i], t1Ready, t2Ready, octavasLabels[i].t, octavasLabels[i].b);
                                })}
                            </div>
                        </div>

                        {/* COLUNA 2: QUARTAS */}
                        <div className="flex flex-col w-1/4 min-w-[180px]">
                            <h3 className="text-center font-bold text-purple-400 mb-4 bg-gray-800 p-2 rounded">QUARTAS</h3>
                            <div className="flex flex-col justify-around h-full gap-4 py-8">
                                {[0,1,2,3].map(i => {
                                    // Immediate projection: Winners of Octavas
                                    const w1 = getWinnerFromMatch('Oitavas', i*2); // Oitavas_0 (Jogo 1)
                                    const w2 = getWinnerFromMatch('Oitavas', i*2+1); // Oitavas_2 (Jogo 2)
                                    return renderBracketMatch("Quartas", i, { t1: w1, t2: w2 }, true, true, `VENC. OIT ${i*2+1}`, `VENC. OIT ${i*2+2}`);
                                })}
                            </div>
                        </div>

                        {/* COLUNA 3: SEMI */}
                        <div className="flex flex-col w-1/4 min-w-[180px]">
                            <h3 className="text-center font-bold text-orange-400 mb-4 bg-gray-800 p-2 rounded">SEMI</h3>
                            <div className="flex flex-col justify-around h-full gap-8 py-16">
                                {[0,1].map(i => {
                                    // Immediate projection: Winners of Quartas
                                    const w1 = getWinnerFromMatch('Quartas', i*2);
                                    const w2 = getWinnerFromMatch('Quartas', i*2+1);
                                    return renderBracketMatch("Semi", i, { t1: w1, t2: w2 }, true, true, `VENC. QRT ${i*2+1}`, `VENC. QRT ${i*2+2}`);
                                })}
                            </div>
                        </div>

                        {/* COLUNA 4: FINAL */}
                        <div className="flex flex-col w-1/4 min-w-[180px]">
                            <h3 className="text-center font-bold text-yellow-400 mb-4 bg-gray-800 p-2 rounded">FINAL</h3>
                            <div className="flex flex-col justify-center h-full py-20">
                                {(() => {
                                    // Immediate projection: Winners of Semi
                                    const w1 = getWinnerFromMatch('Semi', 0);
                                    const w2 = getWinnerFromMatch('Semi', 1);
                                    return renderBracketMatch("Final", 0, { t1: w1, t2: w2 }, true, true, "VENC. SEMI 1", "VENC. SEMI 2");
                                })()}
                                {gameState.cupPhase === 'final' && gameState.cupMatches.find(m => m.name.includes("Final"))?.winnerId && (
                                     <div className="mt-4 text-center">
                                         <Trophy className="w-16 h-16 text-yellow-400 mx-auto animate-bounce" />
                                         <p className="text-yellow-400 font-bold mt-2">CAMPEÃO!</p>
                                     </div>
                                )}
                            </div>
                        </div>

                    </div>
                 </div>

                 {/* Groups Display (Simplified at bottom) */}
                 {gameState.cupPhase === 'groups' && (
                 <div className="mt-8 border-t border-gray-700 pt-6">
                     <h2 className="text-xl font-bold mb-4 flex items-center text-gray-400"><LayoutGrid className="mr-2"/> GRUPOS (Simulação p/ Oitavas)</h2>
                     <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                         {gameState.cupGroups.map((group, idx) => {
                             const sortedIds = getSortedGroup(idx);
                             return (
                                 <div key={idx} className="bg-gray-800 rounded p-2 text-xs">
                                     <h3 className="font-bold text-center mb-2">GRUPO {['A','B','C','D'][idx]}</h3>
                                     {sortedIds.map((id, rank) => (
                                         <div key={id} className={`flex justify-between p-1 ${rank < 4 ? 'text-white' : 'text-gray-500'}`}>
                                            <span>{rank+1}. {gameState.marbles.find(m=>m.id===id)?.name}</span>
                                            <span>{gameState.cupScores[id]||0}</span>
                                         </div>
                                     ))}
                                 </div>
                             )
                         })}
                     </div>
                 </div>
                 )}

             </div>
          </div>
      )
  }

  // 2. Champion Screen
  if (gameState.phase === 'champion') {
    const championId = gameState.activeMarbleIds[0];
    const champion = gameState.marbles.find(m => m.id === championId)!;
    const playerWon = gameState.betMarbleId === championId;

    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center p-6 text-center animate-fadeIn">
        <div className="relative mb-8">
           <div className="absolute inset-0 bg-yellow-500 blur-3xl opacity-20 animate-pulse"></div>
           <Trophy className="w-32 h-32 text-yellow-400 relative z-10 mx-auto mb-4" />
           <div className="w-32 h-32 rounded-full mx-auto relative z-10 shadow-[0_0_50px_rgba(255,255,255,0.5)] border-4 border-white bg-gray-100 flex items-center justify-center p-2">
             <img src={champion.logoUrl} alt={champion.name} className="w-full h-full object-contain" />
           </div>
        </div>
        
        <h1 className="text-6xl font-black text-white mb-2 brand-font">{champion.name}</h1>
        <p className="text-2xl text-yellow-500 font-mono mb-4">CAMPEÃO DO TORNEIO</p>
        
        {gameState.gameMode === 'points' && (
           <div className="text-xl text-blue-400 mb-8 font-mono font-bold">
              Pontuação Final: {champion.score} pts
           </div>
        )}

        <div className={`p-6 rounded-xl border-2 mb-8 max-w-md w-full ${playerWon ? 'bg-green-900/30 border-green-500' : 'bg-red-900/30 border-red-500'}`}>
          <h3 className="text-xl font-bold mb-2">{playerWon ? "PARABÉNS!" : "NÃO FOI DESSA VEZ"}</h3>
          <p className="text-gray-300">
            {playerWon 
              ? `Sua aposta no ${champion.name} deu certo!` 
              : `Você apostou no ${gameState.marbles.find(m => m.id === gameState.betMarbleId)?.name}. Tente novamente!`}
          </p>
        </div>
        
        {gameState.gameMode === 'points' && (
          <div className="w-full max-w-md bg-gray-800 rounded-lg p-4 mb-8 overflow-y-auto max-h-60">
             <h4 className="text-gray-400 mb-2 font-bold uppercase text-xs tracking-wider">Tabela Final</h4>
             {[...gameState.marbles].sort((a,b) => b.score - a.score).map((m, idx) => (
                <div key={m.id} className="flex justify-between items-center py-2 border-b border-gray-700 last:border-0">
                   <div className="flex items-center space-x-3">
                      <span className="text-gray-500 font-mono w-4">{idx + 1}</span>
                      <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center p-0.5">
                        <img src={m.logoUrl} className="w-full h-full object-contain"/>
                      </div>
                      <span>{m.name}</span>
                   </div>
                   <span className="font-mono font-bold text-yellow-500">{m.score}</span>
                </div>
             ))}
          </div>
        )}

        <button 
          onClick={resetGame}
          className="px-8 py-3 bg-white text-black font-bold rounded-full hover:scale-105 transition-transform"
        >
          NOVO TORNEIO
        </button>
      </div>
    );
  }

  // 3. Racing / Round Result Screen (Game Loop)
  const isCupMatchWithoutPlayer = gameState.gameMode === 'cup' && !gameState.activeMarbleIds.includes(gameState.betMarbleId!);
  
  return (
    <div className="relative w-full h-screen bg-gray-900 overflow-hidden">
      
      {/* Race View */}
      <div className="absolute inset-0 z-0">
        {/* key={gameState.round} ensures the component Re-mounts completely when round changes.
            This resets the physics engine and guarantees a fresh start for every round. */}
        <RaceEngine 
          key={gameState.round}
          activeMarbles={activeMarblesList}
          config={physicsConfig}
          obstacleSettings={obstacleSettings}
          onRaceFinish={handleRaceFinish}
          betMarbleId={gameState.betMarbleId}
          isPaused={isPaused}
          isFollowingBet={isFollowingBet}
        />
      </div>

      {/* CUP SIMULATION OVERLAY */}
      {isCupMatchWithoutPlayer && !isPaused && (
          <div className="absolute top-20 left-1/2 transform -translate-x-1/2 z-50 animate-in fade-in zoom-in">
              <button 
                onClick={handleSimulateMatch}
                className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 px-6 rounded-full shadow-lg border-2 border-blue-400 animate-pulse"
              >
                 <FastForward className="fill-current" />
                 <span>SIMULAR PARTIDA</span>
              </button>
              <div className="text-center mt-2 text-xs text-gray-400 bg-black/50 p-1 rounded">
                  Ou continue assistindo
              </div>
          </div>
      )}

      {/* Overlay UI */}
      <div className="absolute top-0 left-0 w-full p-4 flex justify-between items-start z-10 pointer-events-none">
         <div className="flex items-center">
            <div className="bg-black/50 backdrop-blur p-3 rounded-lg border border-gray-700 text-white pointer-events-auto">
              <div className="text-xs text-gray-400 font-bold uppercase">
                  {gameState.gameMode === 'cup' ? gameState.cupMatches[gameState.currentMatchIndex]?.name : 'Rodada'}
              </div>
              <div className="text-2xl font-mono text-yellow-400">
                  {gameState.gameMode === 'cup' ? '' : `${gameState.round} `}
                  <span className="text-sm text-gray-500">
                      {gameState.gameMode === 'cup' ? '' : `/ ${gameState.totalRounds}`}
                  </span>
              </div>
            </div>
         </div>

         {/* Right Side UI: Points + Exit */}
         <div className="flex flex-col items-end pointer-events-auto">
             <button
                onClick={() => setIsPaused(true)}
                className="bg-yellow-600/80 backdrop-blur p-2 rounded-full border border-yellow-400 text-white mb-2 hover:bg-yellow-500 transition-colors shadow-lg z-50"
                title="Pausar"
             >
                 <Pause className="w-6 h-6" />
             </button>

             {gameState.gameMode === 'points' && (
               <div className="bg-black/50 backdrop-blur p-3 rounded-lg border border-gray-700 text-white min-w-[150px]">
                 <div className="text-xs text-gray-400 font-bold uppercase mb-1">Top Pontos</div>
                 {gameState.marbles
                   .sort((a,b) => b.score - a.score)
                   .slice(0, 3)
                   .map((m, i) => (
                     <div key={m.id} className="flex justify-between text-xs mb-1">
                       <span className={`${i===0?'text-yellow-400': 'text-gray-300'}`}>{i+1}. {m.name}</span>
                       <span className="font-mono">{m.score}</span>
                     </div>
                   ))}
               </div>
             )}
             
             {gameState.gameMode === 'elimination' && (
                <div className="bg-black/50 backdrop-blur p-3 rounded-lg border border-gray-700 text-white text-right">
                  <div className="text-xs text-gray-400 font-bold uppercase">Sobreviventes</div>
                  <div className="text-2xl font-mono text-blue-400">{activeMarblesList.length}</div>
                </div>
             )}

             {gameState.gameMode === 'cup' && (
                <div className="bg-black/50 backdrop-blur p-3 rounded-lg border border-gray-700 text-white text-right max-h-40 overflow-y-auto">
                   <div className="text-xs text-gray-400 font-bold uppercase mb-1">
                       {gameState.cupPhase === 'groups' ? `Grupo ${['A','B','C','D'][gameState.cupMatches[gameState.currentMatchIndex]?.groupIndex || 0]}` : 'Placar'}
                   </div>
                   {gameState.activeMarbleIds.map(id => {
                       const m = gameState.marbles.find(mar => mar.id === id);
                       return (
                           <div key={id} className="flex justify-between text-xs space-x-2">
                               <span>{m?.name}</span>
                               {/* Only show numeric score in groups */}
                               {gameState.cupPhase === 'groups' && <span className="text-yellow-500 font-bold">{gameState.cupScores[id] || 0}</span>}
                           </div>
                       )
                   })}
                </div>
             )}
         </div>
      </div>

      {/* Pause Menu */}
      {isPaused && !showExitConfirm && (
        <div className="absolute inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-gray-800 border border-gray-600 p-8 rounded-2xl shadow-2xl max-w-sm w-full text-center animate-in fade-in zoom-in-95 duration-200">
                <h2 className="text-3xl font-bold text-white mb-8 brand-font">JOGO PAUSADO</h2>
                <div className="flex flex-col space-y-4">
                    <button 
                        onClick={() => setIsPaused(false)}
                        className="w-full py-4 bg-green-600 hover:bg-green-500 text-white font-bold rounded-lg text-xl shadow-lg transition-transform hover:scale-105 flex items-center justify-center"
                    >
                        <Play className="mr-2 fill-current" /> RETOMAR
                    </button>
                    <button 
                        onClick={() => setShowExitConfirm(true)}
                        className="w-full py-4 bg-gray-700 hover:bg-red-900/50 hover:border-red-500 border border-transparent text-gray-300 hover:text-red-400 font-bold rounded-lg text-xl transition-colors flex items-center justify-center"
                    >
                        <X className="mr-2" /> SAIR DO JOGO
                    </button>
                </div>
            </div>
        </div>
      )}

      {/* Exit Confirmation */}
      {showExitConfirm && (
        <div className="absolute inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4">
             <div className="bg-gray-900 border-2 border-red-600 p-8 rounded-2xl shadow-[0_0_50px_rgba(220,38,38,0.5)] max-w-sm w-full text-center animate-in zoom-in-95 duration-200">
                <Skull className="w-16 h-16 text-red-500 mx-auto mb-4" />
                <h2 className="text-2xl font-bold text-white mb-2">ABANDONAR TORNEIO?</h2>
                <p className="text-gray-400 mb-8">Todo o progresso atual será perdido e você voltará para a tela de apostas.</p>
                
                <div className="flex space-x-4">
                    <button 
                        onClick={() => setShowExitConfirm(false)}
                        className="flex-1 py-3 bg-gray-700 hover:bg-gray-600 text-white font-bold rounded-lg"
                    >
                        CANCELAR
                    </button>
                    <button 
                        onClick={() => {
                            setShowExitConfirm(false);
                            setIsPaused(false);
                            handleExitTournament();
                        }}
                        className="flex-1 py-3 bg-red-600 hover:bg-red-500 text-white font-bold rounded-lg shadow-lg hover:shadow-red-500/50 transition-all"
                    >
                        SAIR
                    </button>
                </div>
             </div>
        </div>
      )}

      {/* Round Result Modal - 3 Seconds Duration */}
      {gameState.phase === 'round_result' && (
        <div className="absolute inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-gray-800 rounded-2xl p-8 max-w-sm w-full text-center border border-gray-700 shadow-2xl animate-in slide-in-from-bottom-10 fade-in duration-300 relative overflow-hidden">
            <h2 className="text-3xl font-bold text-white mb-6 brand-font">FIM DA RODADA {gameState.gameMode === 'cup' ? '' : gameState.round}</h2>
            
            {gameState.gameMode === 'elimination' ? (
              <div className="bg-red-900/20 border border-red-500/50 p-4 rounded-xl mb-6">
                 <Skull className="w-8 h-8 text-red-500 mx-auto mb-2" />
                 <div className="text-red-400 font-bold text-sm uppercase mb-1">Eliminado</div>
                 {gameState.lastEliminatedId !== null && (
                   <div className="flex items-center justify-center space-x-2 mt-2">
                      <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center p-0.5 relative overflow-hidden">
                         <img src={gameState.marbles.find(m => m.id === gameState.lastEliminatedId)?.logoUrl} className="w-full h-full object-contain" />
                      </div>
                      <span className="text-xl text-white font-mono">
                        {gameState.marbles.find(m => m.id === gameState.lastEliminatedId)?.name}
                      </span>
                   </div>
                 )}
              </div>
            ) : (
              <div className="bg-gray-900/50 border border-gray-600 p-4 rounded-xl mb-6 max-h-[300px] overflow-y-auto">
                 <div className="flex items-center justify-center mb-4 text-yellow-400">
                    <Medal className="mr-2" /> Resultado da Rodada
                 </div>
                 {[...activeMarblesList].sort((a,b) => a.rank - b.rank).map((m, idx) => (
                   <div key={m.id} className="flex justify-between items-center py-2 border-b border-gray-700 last:border-0 text-sm">
                      <div className="flex items-center space-x-2">
                         <span className="w-4 text-gray-500">{idx + 1}</span>
                         <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center p-0.5 relative overflow-hidden">
                            <img src={m.logoUrl} className="w-full h-full object-contain"/>
                         </div>
                         <span>{m.name}</span>
                      </div>
                      <div className="flex flex-col text-right">
                        {/* Check match type of the CURRENT FINISHED match (which index is pointing to) */}
                        {gameState.gameMode === 'cup' && gameState.cupMatches[gameState.currentMatchIndex]?.type !== 'group' ? (
                            <span className={idx===0 ? "text-green-400 font-bold" : "text-red-500"}>{idx===0 ? "VENCEU" : "ELIMINADO"}</span>
                        ) : (
                            <>
                                <span className="text-green-400 font-bold">+{gameState.roundPoints[m.id]}</span>
                                <span className="text-[10px] text-gray-500">Total: {gameState.gameMode === 'cup' ? gameState.cupScores[m.id] : m.score}</span>
                            </>
                        )}
                      </div>
                   </div>
                 ))}
              </div>
            )}
            
            {gameState.gameMode === 'elimination' && gameState.lastEliminatedId === gameState.betMarbleId && (
              <div className="text-red-400 text-sm font-bold mb-6">
                SEU TIME FOI ELIMINADO! 😱
              </div>
            )}

            {/* Auto Advance Progress Bar - 3 Seconds */}
            <div className="mt-4">
                <p className="text-gray-400 text-xs mb-2 uppercase tracking-widest">Próxima rodada em instantes...</p>
                <div className="w-full h-2 bg-gray-700 rounded-full overflow-hidden">
                    <div className="h-full bg-blue-500 animate-[width_3s_linear] w-full origin-left" style={{ animationDuration: '3s', animationName: 'shrink', animationTimingFunction: 'linear', animationFillMode: 'forwards' }}></div>
                    <style>{`
                        @keyframes shrink {
                            from { width: 100%; }
                            to { width: 0%; }
                        }
                    `}</style>
                </div>
            </div>
            
          </div>
        </div>
      )}
      
      {/* Bet Indicator (Bottom) - Toggle Camera */}
      {gameState.phase === 'racing' && (
        <button
           onClick={() => setIsFollowingBet(!isFollowingBet)}
           className={`absolute bottom-6 left-1/2 transform -translate-x-1/2 px-6 py-2 rounded-full border flex items-center space-x-2 transition-all shadow-lg hover:scale-105 active:scale-95 z-40 ${isFollowingBet ? 'bg-yellow-900/80 border-yellow-400' : 'bg-black/60 border-yellow-500/30'}`}
        >
           {isFollowingBet ? <Camera className="w-4 h-4 text-yellow-400 animate-pulse" /> : <Camera className="w-4 h-4 text-gray-400" />}
           
           {isFollowingBet ? (
               <div className="flex items-center space-x-2">
                   <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center p-0.5 relative overflow-hidden">
                       <img src={gameState.marbles.find(m => m.id === gameState.betMarbleId)?.logoUrl} className="w-full h-full object-contain" />
                   </div>
                   <span className="font-bold text-yellow-400">{gameState.marbles.find(m => m.id === gameState.betMarbleId)?.name}</span>
               </div>
           ) : (
               <span className="text-gray-300 font-bold uppercase text-sm">CÂMERA: LÍDER</span>
           )}
        </button>
      )}

    </div>
  );
}
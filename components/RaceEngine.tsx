
import React, { useRef, useEffect } from 'react';
import { Marble, PhysicsConfig, LineSegment, CircleObstacle, DynamicObstacle, Particle, ObstacleSettings, GameMode, SoccerBallItem } from '../types';
import { audio } from '../services/audioService';

interface RaceEngineProps {
  activeMarbles: Marble[];
  config: PhysicsConfig;
  obstacleSettings: ObstacleSettings;
  onRaceFinish: (results: Marble[]) => void;
  onMarblesUpdate?: (marbles: Marble[]) => void;
  betMarbleId: number | null;
  isPaused: boolean;
  isFollowingBet: boolean;
  gameMode: GameMode;
  zoom: number;
  onZoomChange: (newZoom: number) => void;
  onElimination?: (id: number) => void;
}

const RaceEngine: React.FC<RaceEngineProps> = ({ 
  activeMarbles, 
  config, 
  obstacleSettings, 
  onRaceFinish, 
  onMarblesUpdate,
  betMarbleId, 
  isPaused, 
  isFollowingBet, 
  gameMode,
  zoom,
  onZoomChange,
  onElimination
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const requestRef = useRef<number>();
  
  // Touch Handling for Pinch-to-Zoom
  const lastTouchDist = useRef<number | null>(null);
  
  // Physics State (Mutable refs for performance)
  const marblesRef = useRef<Marble[]>([]);
  const linesRef = useRef<LineSegment[]>([]);
  const pinsRef = useRef<CircleObstacle[]>([]);
  const dynamicRef = useRef<DynamicObstacle[]>([]);
  const particlesRef = useRef<Particle[]>([]); 
  const soccerBallsRef = useRef<SoccerBallItem[]>([]);
  const teleportCooldowns = useRef<Record<number, number>>({});
  
  // Cache for loaded images
  const imagesRef = useRef<Record<number, HTMLImageElement>>({});
  
  const cameraY = useRef(0);
  const raceFinished = useRef(false);
  const finishLineY = useRef(0);
  const startTime = useRef(0);
  const timeRef = useRef(0);
  const gateOpenRef = useRef(false);
  const lastEliminationTime = useRef(0);
  const ELIMINATION_INTERVAL = 12000; // 12 seconds

  // Constants
  const COURSE_WIDTH = 600;
  const GATE_Y = 180; // Position of the starting gate
  const GATE_DELAY = 3000; // Time before gate opens (ms)
  
  // --- Particle Helper ---
  const spawnParticles = (x: number, y: number, color: string, count: number = 5, speed: number = 2, size: number = 2) => {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const velocity = Math.random() * speed;
      particlesRef.current.push({
        x,
        y,
        vx: Math.cos(angle) * velocity,
        vy: Math.sin(angle) * velocity,
        life: 1.0,
        decay: 0.015 + Math.random() * 0.02, // Slower fade
        color: color,
        size: (1 + Math.random() * size) * 1.5
      });
    }
  };

  const spawnFinishParticles = (x: number, y: number, color: string) => {
      // Confetti burst
      for (let i = 0; i < 40; i++) {
          const angle = -Math.PI/2 + (Math.random() - 0.5) * Math.PI;
          const velocity = 5 + Math.random() * 10;
          particlesRef.current.push({
              x, y,
              vx: Math.cos(angle) * velocity,
              vy: Math.sin(angle) * velocity,
              life: 1.0,
              decay: 0.01 + Math.random() * 0.01,
              color: `hsl(${Math.random() * 360}, 100%, 50%)`,
              size: 2 + Math.random() * 3
          });
      }
      // Sparkles
      spawnParticles(x, y, '#fff', 20, 5, 2);
      spawnParticles(x, y, color, 20, 8, 3);
  };

  // --- Level Generation ---
  const generateLevel = () => {
    const lines: LineSegment[] = [];
    const pins: CircleObstacle[] = [];
    const dynamics: DynamicObstacle[] = [];
    
    // Config
    const segments = 12 + Math.floor(Math.random() * 4); 
    const segmentHeight = 450;
    let currentY = 0;

    // --- OBSTÁCULO INICIAL: PLINKO DE PINOS MÓVEIS ---
    const plinkoStartY = GATE_Y + 100;
    const plinkoRows = 10; 
    const plinkoRowHeight = 55; 
    const plinkoEndY = plinkoStartY + (plinkoRows * plinkoRowHeight);

    // Starting Side Walls
    lines.push({ x1: 0, y1: 0, x2: 0, y2: GATE_Y, type: 'wall' }); 
    lines.push({ x1: COURSE_WIDTH, y1: 0, x2: COURSE_WIDTH, y2: GATE_Y, type: 'wall' }); 

    // Main Walls
    lines.push({ x1: 0, y1: GATE_Y, x2: 0, y2: plinkoEndY, type: 'wall' }); 
    lines.push({ x1: COURSE_WIDTH, y1: GATE_Y, x2: COURSE_WIDTH, y2: plinkoEndY, type: 'wall' }); 

    // Gerar Pinos Móveis com Espaçamento Igual
    for (let r = 0; r < plinkoRows; r++) {
        const py = plinkoStartY + (r * plinkoRowHeight);
        const isEven = r % 2 === 0;
        
        // Espaçamento e distribuição
        const pinRadius = 9;
        const spacing = 70; // Espaçamento fixo
        
        // Configuração de Movimento da Linha
        // Alterna direção para caos, velocidade lenta
        const rowSpeed = 0.05 * (isEven ? 1 : -1); 
        const rowRange = 70; // AUMENTADO: Amplitude do movimento (Antes era 35)
        
        // Começa em uma posição que garante pinos centrais
        // Para 600px e espaçamento 70, temos ~8 pinos.
        // StartX = 35 centraliza.
        const startX = 35;
        
        for (let x = startX; x < COURSE_WIDTH; x += spacing) {
             pins.push({
                 x: x, 
                 y: py,
                 radius: pinRadius, 
                 type: 'pin',
                 initialX: x,
                 speed: rowSpeed,
                 range: rowRange
             });
        }
    }

    // --- FUNIL PÓS-PLINKO ---
    const funnelHeight = 180;
    const funnelExitGap = 70;

    // Parede Funil Esquerda
    lines.push({
        x1: 0, y1: plinkoEndY,
        x2: COURSE_WIDTH / 2 - funnelExitGap / 2, y2: plinkoEndY + funnelHeight,
        type: 'wall'
    });
    
    // Parede Funil Direita
    lines.push({
        x1: COURSE_WIDTH, y1: plinkoEndY,
        x2: COURSE_WIDTH / 2 + funnelExitGap / 2, y2: plinkoEndY + funnelHeight,
        type: 'wall'
    });

    // Atualizar onde começa a geração procedural
    currentY = plinkoEndY + funnelHeight + 50;

    const pickObstacleType = () => {
        const options = [];
        if (obstacleSettings.spinner) options.push({ type: 'spinner', weight: 15 });
        if (obstacleSettings.slider) {
            options.push({ type: 'slider_h', weight: 10 });
            options.push({ type: 'slider_v', weight: 10 });
        }
        if (obstacleSettings.repulsor) options.push({ type: 'repulsor', weight: 10 });
        if (obstacleSettings.conveyor) options.push({ type: 'conveyor', weight: 10 });
        if (obstacleSettings.teleporter) options.push({ type: 'teleporter', weight: 15 });
        if (obstacleSettings.hollow_circle) options.push({ type: 'hollow_circle', weight: 10 });
        if (obstacleSettings.laser) options.push({ type: 'laser', weight: 10 });
        if (obstacleSettings.funnel) options.push({ type: 'funnel', weight: 6 });
        if (obstacleSettings.fan) options.push({ type: 'fan', weight: 4 });
        
        if (options.length === 0) return 'none';

        const totalWeight = options.reduce((sum, opt) => sum + opt.weight, 0);
        let random = Math.random() * totalWeight;
        
        for (const opt of options) {
            if (random < opt.weight) return opt.type;
            random -= opt.weight;
        }
        return options[0].type;
    };

    // 2. Procedural Segments
    for (let i = 0; i < segments; i++) {
      const type = pickObstacleType();
      
      // Outer Walls
      lines.push({ x1: 0, y1: currentY - 50, x2: 0, y2: currentY + segmentHeight, type: 'wall' });
      lines.push({ x1: COURSE_WIDTH, y1: currentY - 50, x2: COURSE_WIDTH, y2: currentY + segmentHeight, type: 'wall' });

      // -- DYNAMIC MOVING OBSTACLES --
      
      if (type === 'spinner') {
        // --- DOUBLE SPINNERS ---
        lines.push({ x1: 0, y1: currentY, x2: COURSE_WIDTH * 0.3, y2: currentY + 100, type: 'floor' });
        lines.push({ x1: COURSE_WIDTH, y1: currentY, x2: COURSE_WIDTH * 0.7, y2: currentY + 100, type: 'floor' });

        dynamics.push({
          id: `spin_${i}_1`,
          type: 'spinner',
          x: COURSE_WIDTH * 0.35,
          y: currentY + 250,
          width: 150,
          angle: 0,
          speed: 0.12,
        });
        dynamics.push({
          id: `spin_${i}_2`,
          type: 'spinner',
          x: COURSE_WIDTH * 0.65,
          y: currentY + 350,
          width: 150,
          angle: Math.PI / 2,
          speed: -0.15,
        });

        // CENTRAL OBSTACLE: Force marbles into the spinners
        pins.push({ x: COURSE_WIDTH / 2, y: currentY + 300, radius: 25, type: 'bumper' });

      } else if (type === 'slider_h') {
        // --- MOVING SLIDERS (Cross Horizontal) ---
        lines.push({ x1: 0, y1: currentY + 50, x2: COURSE_WIDTH * 0.2, y2: currentY + 150, type: 'floor' });
        lines.push({ x1: COURSE_WIDTH, y1: currentY + 50, x2: COURSE_WIDTH * 0.8, y2: currentY + 150, type: 'floor' });
        
        dynamics.push({
            id: `slide_h_top_${i}`,
            type: 'slider_h',
            x: COURSE_WIDTH / 2,
            y: currentY + 200,
            width: 200,
            angle: 0,
            speed: 2.5,
            range: 180,
            initialX: COURSE_WIDTH / 2,
            initialY: currentY + 200
        });

        dynamics.push({
            id: `slide_h_bot_${i}`,
            type: 'slider_h',
            x: COURSE_WIDTH / 2,
            y: currentY + 350,
            width: 200,
            angle: 0,
            speed: -3.0, 
            range: 180,
            initialX: COURSE_WIDTH / 2,
            initialY: currentY + 350
        });

      } else if (type === 'slider_v') {
        // --- VERTICAL CRUSHERS ---
        lines.push({ x1: 0, y1: currentY + 50, x2: COURSE_WIDTH * 0.3, y2: currentY + 150, type: 'wall' });
        lines.push({ x1: COURSE_WIDTH, y1: currentY + 50, x2: COURSE_WIDTH * 0.7, y2: currentY + 150, type: 'wall' });

        dynamics.push({
            id: `slide_v_L_${i}`,
            type: 'slider_v',
            x: COURSE_WIDTH * 0.25,
            y: currentY + 250,
            width: 120,
            angle: 0,
            speed: 1.5,
            range: 80,
            initialX: COURSE_WIDTH * 0.25,
            initialY: currentY + 250
        });
        
        dynamics.push({
            id: `slide_v_R_${i}`,
            type: 'slider_v',
            x: COURSE_WIDTH * 0.75,
            y: currentY + 350, 
            width: 120,
            angle: 0,
            speed: 1.5,
            range: 80,
            initialX: COURSE_WIDTH * 0.75,
            initialY: currentY + 350
        });
        
        // CENTRAL OBSTACLE: Block the easy path in the middle
        pins.push({ x: COURSE_WIDTH / 2, y: currentY + 300, radius: 28, type: 'bumper' });

      } else if (type === 'repulsor') {
        // --- REPULSORS ---
        lines.push({ x1: 0, y1: currentY + 50, x2: COURSE_WIDTH * 0.3, y2: currentY + 150, type: 'floor' });
        lines.push({ x1: COURSE_WIDTH, y1: currentY + 50, x2: COURSE_WIDTH * 0.7, y2: currentY + 150, type: 'floor' });
        
        dynamics.push({
          id: `repulse_${i}`,
          type: 'repulsor',
          x: COURSE_WIDTH / 2,
          y: currentY + 300,
          width: 50, 
          range: 140, 
          angle: 0,
          speed: 0.1, 
          force: 3.0
        });

      } else if (type === 'conveyor') {
        // --- CONVEYOR BELTS ---
        const dirType = Math.floor(Math.random() * 5);
        let angle = Math.PI / 2;
        let cx = COURSE_WIDTH * 0.5;
        let width = 200; 
        let height = 100; 

        if (dirType === 1) { angle = Math.PI / 4; cx = COURSE_WIDTH * 0.4; } 
        else if (dirType === 2) { angle = 3 * Math.PI / 4; cx = COURSE_WIDTH * 0.6; } 
        else if (dirType === 3) { angle = 0; cx = COURSE_WIDTH * 0.3; width = 150; height = 150; } 
        else if (dirType === 4) { angle = Math.PI; cx = COURSE_WIDTH * 0.7; width = 150; height = 150; }

        lines.push({ x1: 0, y1: currentY, x2: COURSE_WIDTH * 0.2, y2: currentY + 100, type: 'wall' });
        lines.push({ x1: COURSE_WIDTH, y1: currentY, x2: COURSE_WIDTH * 0.8, y2: currentY + 100, type: 'wall' });
        
        dynamics.push({
          id: `conveyor_${i}`,
          type: 'conveyor',
          x: cx,
          y: currentY + 250,
          width: width, 
          height: height, 
          angle: angle, 
          speed: 0.1, 
          force: 18 
        });

        // CENTRAL OBSTACLE: Add a pin to disrupt smooth conveyor flow
        pins.push({ x: COURSE_WIDTH / 2, y: currentY + 250, radius: 20, type: 'bumper' });

      } else if (type === 'teleporter') {
        // --- ADVANCED TELEPORTERS ---
        const isTrap = Math.random() > 0.5; 
        const entranceX = COURSE_WIDTH * (0.2 + Math.random() * 0.6);
        const exitX = COURSE_WIDTH * (0.2 + Math.random() * 0.6);
        
        let targetY;
        if (isTrap) {
            targetY = Math.max(100, currentY - (300 + Math.random() * 400));
        } else {
            targetY = currentY + (500 + Math.random() * 300);
        }

        lines.push({ x1: 0, y1: currentY + 50, x2: COURSE_WIDTH * 0.1, y2: currentY + 150, type: 'floor' });
        lines.push({ x1: COURSE_WIDTH, y1: currentY + 50, x2: COURSE_WIDTH * 0.9, y2: currentY + 150, type: 'floor' });

        dynamics.push({
          id: `teleport_${i}`,
          type: 'teleporter',
          x: entranceX,
          y: currentY + 200,
          width: 70, 
          destX: exitX,
          destY: targetY,
          angle: 0,
          speed: 0,
          blinkPhase: Math.random() * Math.PI * 2,
          blinkSpeed: 0.02 + Math.random() * 0.02, 
          active: true
        });

        pins.push({ x: entranceX + (Math.random() > 0.5 ? 80 : -80), y: currentY + 200, radius: 20, type: 'bumper' });

      } else if (type === 'hollow_circle') {
        // --- HOLLOW CIRCLE (New Obstacle) ---
        lines.push({ x1: 0, y1: currentY + 50, x2: COURSE_WIDTH * 0.1, y2: currentY + 150, type: 'floor' });
        lines.push({ x1: COURSE_WIDTH, y1: currentY + 50, x2: COURSE_WIDTH * 0.9, y2: currentY + 150, type: 'floor' });

        dynamics.push({
           id: `hollow_${i}`,
           type: 'hollow_circle',
           x: COURSE_WIDTH / 2 + (Math.random() - 0.5) * 60,
           y: currentY + 250,
           width: 250, // Diameter
           angle: 0,
           speed: (Math.random() > 0.5 ? 1 : -1) * (0.02 + Math.random() * 0.02),
           range: Math.PI / 2.5 // Gap size
        });

      } else if (type === 'laser') {
        // --- LASER CANNONS ---
        lines.push({ x1: 0, y1: currentY + 50, x2: COURSE_WIDTH * 0.3, y2: currentY + 150, type: 'wall' });
        lines.push({ x1: COURSE_WIDTH, y1: currentY + 50, x2: COURSE_WIDTH * 0.7, y2: currentY + 150, type: 'wall' });
        
        dynamics.push({
          id: `laser_${i}`,
          type: 'laser',
          x: COURSE_WIDTH * 0.1, 
          y: currentY + 300,
          width: 0, 
          height: COURSE_WIDTH * 0.8, 
          angle: 0, 
          speed: 0,
          force: 25, 
          active: true,
          timer: 0
        });
        lines.push({ x1: 0, y1: currentY + 280, x2: COURSE_WIDTH * 0.15, y2: currentY + 320, type: 'wall' });

        // CENTRAL OBSTACLE: Add a pin to make avoiding the laser harder
        pins.push({ x: COURSE_WIDTH / 2, y: currentY + 300, radius: 22, type: 'bumper' });

      } else if (type === 'funnel') {
        // --- BIG FUNNEL ---
        const funnelTopY = currentY + 50;
        const funnelHeight = 250;
        const exitGap = 55; // Marbles are radius 18 (diam 36). 55 gives clearance.

        // Left Angle Wall
        lines.push({
            x1: 0, y1: funnelTopY,
            x2: COURSE_WIDTH/2 - exitGap/2, y2: funnelTopY + funnelHeight,
            type: 'wall'
        });

        // Right Angle Wall
        lines.push({
            x1: COURSE_WIDTH, y1: funnelTopY,
            x2: COURSE_WIDTH/2 + exitGap/2, y2: funnelTopY + funnelHeight,
            type: 'wall'
        });

        // Chaos Pin below the exit to scatter them
        pins.push({ x: COURSE_WIDTH/2, y: funnelTopY + funnelHeight + 80, radius: 20, type: 'bumper' });

      } else if (type === 'fan') {
         // --- WIND CANNONS ---
        lines.push({ x1: 0, y1: currentY, x2: COURSE_WIDTH * 0.3, y2: currentY + 100, type: 'floor' });
        lines.push({ x1: COURSE_WIDTH, y1: currentY, x2: COURSE_WIDTH * 0.7, y2: currentY + 100, type: 'floor' });

        dynamics.push({
          id: `fan_${i}_1`,
          type: 'fan',
          x: 20, 
          y: currentY + 250,
          width: 40,
          height: 300, 
          angle: 0, 
          speed: 0,
          force: 0.7
        });

        pins.push({ x: COURSE_WIDTH * 0.6, y: currentY + 250, radius: 25, type: 'bumper' });
        
        // CENTRAL OBSTACLES: Catch marbles being blown
        pins.push({ x: COURSE_WIDTH / 2, y: currentY + 200, radius: 15, type: 'bumper' });
        pins.push({ x: COURSE_WIDTH / 2, y: currentY + 350, radius: 15, type: 'bumper' });
      }

      currentY += segmentHeight;
    }

    // 3. Finish Area
    lines.push({ x1: 0, y1: currentY, x2: COURSE_WIDTH * 0.3, y2: currentY + 200, type: 'floor' });
    lines.push({ x1: COURSE_WIDTH, y1: currentY, x2: COURSE_WIDTH * 0.7, y2: currentY + 200, type: 'floor' });
    
    finishLineY.current = currentY + 250;

    linesRef.current = lines;
    pinsRef.current = pins;
    dynamicRef.current = dynamics;

    // Spawn soccer balls for World Cup mode
    if (gameMode === 'world_cup') {
        const soccerBalls: SoccerBallItem[] = [];
        const numBalls = 8 + Math.floor(Math.random() * 5);
        for (let j = 0; j < numBalls; j++) {
            soccerBalls.push({
                id: `sb_${j}`,
                x: 50 + Math.random() * (COURSE_WIDTH - 100),
                y: GATE_Y + 150 + Math.random() * (finishLineY.current - GATE_Y - 300),
                collected: false
            });
        }
        soccerBallsRef.current = soccerBalls;
    } else {
        soccerBallsRef.current = [];
    }
  };

  // --- Physics Logic ---
  const update = () => {
    if (isPaused) {
        audio.updateRolling(0);
        return;
    }

    if (raceFinished.current) {
        audio.updateRolling(0); 
        return;
    }
    
    // Gate Logic - Handle start
    const timeSinceStart = Date.now() - startTime.current;
    
    // If we haven't opened the gate yet
    if (!gateOpenRef.current) {
        if (timeSinceStart > GATE_DELAY) {
            gateOpenRef.current = true;
            audio.playPinHit(15); 
            spawnParticles(COURSE_WIDTH/2, GATE_Y, '#10b981', 30, 8);
        }
    }

    const STEPS = 8;
    const dt = 1 / STEPS;
    timeRef.current += 1;
    const now = Date.now();

    const marbles = marblesRef.current;
    const dynamicObjs = dynamicRef.current;
    
    // Update Particles
    for (let i = particlesRef.current.length - 1; i >= 0; i--) {
        const p = particlesRef.current[i];
        p.x += p.vx;
        p.y += p.vy;
        p.life -= p.decay;
        if (p.life <= 0) {
            particlesRef.current.splice(i, 1);
        }
    }

    let totalSpeed = 0;

    // --- MERCY RULE CHECK ---
    const activeMarblesCount = marbles.filter(m => !m.finished).length;
    const totalMarbles = marbles.length;
    
    if (totalMarbles > 1 && activeMarblesCount === 1 && gameMode !== 'inverted_elimination' && gameMode !== 'world_cup') {
        const loser = marbles.find(m => !m.finished);
        if (loser) {
            loser.finished = true;
            loser.rank = totalMarbles; 
            loser.finishTime = now - startTime.current + 99999; 
        }
        
        if (!raceFinished.current) {
            raceFinished.current = true;
            const sorted = [...marbles].sort((a, b) => a.rank - b.rank);
            audio.playFinish(); 
            setTimeout(() => onRaceFinish(sorted), 1000);
            return;
        }
    }

    // Separate dynamic types
    const fans: DynamicObstacle[] = [];
    const repulsors: DynamicObstacle[] = [];
    const conveyors: DynamicObstacle[] = [];
    const lasers: DynamicObstacle[] = [];
    const teleporters: DynamicObstacle[] = [];
    const hollowCircles: DynamicObstacle[] = [];
    const solidDynamics: DynamicObstacle[] = [];

    dynamicObjs.forEach(obj => {
      if (obj.type === 'fan') { fans.push(obj); return; }
      if (obj.type === 'repulsor') { repulsors.push(obj); return; }
      if (obj.type === 'conveyor') { conveyors.push(obj); return; }
      if (obj.type === 'laser') { lasers.push(obj); return; }
      if (obj.type === 'teleporter') { teleporters.push(obj); return; }
      if (obj.type === 'hollow_circle') { hollowCircles.push(obj); }
      
      if (obj.type !== 'hollow_circle') {
          solidDynamics.push(obj);
      }

      if (obj.type === 'spinner' || obj.type === 'hollow_circle') {
        obj.angle += obj.speed;
      } else if (obj.type === 'slider_h') {
        obj.x = obj.initialX! + Math.sin(timeRef.current * 0.02) * (obj.range || 100);
      } else if (obj.type === 'slider_v') {
        obj.y = obj.initialY! + Math.sin(timeRef.current * 0.015) * (obj.range || 80);
      }
    });

    lasers.forEach(l => {
       l.timer = (l.timer || 0) + 1;
       if (l.timer > 180) {
           l.active = !l.active;
           l.timer = 0;
       }
    });

    // Update Teleporter Opacity/State (Intermittent logic)
    teleporters.forEach(t => {
        if (t.blinkPhase !== undefined && t.blinkSpeed !== undefined) {
            const val = Math.sin(timeRef.current * t.blinkSpeed + t.blinkPhase);
            const opacity = (val + 1) / 2; 
            t.active = opacity > 0.3; 
            t.timer = opacity; 
        }
    });
    
    // --- UPDATE MOVING PINS (PLINKO) ---
    pinsRef.current.forEach(pin => {
         if (pin.initialX !== undefined && pin.speed !== undefined && pin.range !== undefined) {
             pin.x = pin.initialX + Math.sin(timeRef.current * pin.speed) * pin.range;
         }
    });

    const dynamicLines: LineSegment[] = [];
    solidDynamics.forEach(obj => {
      const halfW = obj.width / 2;
      const dx = Math.cos(obj.angle) * halfW;
      const dy = Math.sin(obj.angle) * halfW;
      dynamicLines.push({
        x1: obj.x - dx, y1: obj.y - dy,
        x2: obj.x + dx, y2: obj.y + dy,
        type: obj.type === 'spinner' ? 'bouncer' : 'floor'
      });
    });

    // START GATE PHYSICAL BARRIER
    const gateLine: LineSegment = { x1: 0, y1: GATE_Y, x2: COURSE_WIDTH, y2: GATE_Y, type: 'wall' };

    for (let step = 0; step < STEPS; step++) {
      for (let i = 0; i < marbles.length; i++) {
        const m = marbles[i];
        if (m.finished) continue;

        m.vy += config.gravity * dt;
        m.x += m.vx * dt;
        m.y += m.vy * dt;

        // Trail Update
        if (timeRef.current % 2 === 0) {
            m.trail.push({ x: m.x, y: m.y });
            if (m.trail.length > 20) {
                m.trail.shift();
            }
        }

        // --- SAFETY BOUNDARIES ---
        if (m.x < m.radius) {
            m.x = m.radius;
            m.vx = Math.abs(m.vx) * 0.5; 
        } else if (m.x > COURSE_WIDTH - m.radius) {
            m.x = COURSE_WIDTH - m.radius;
            m.vx = -Math.abs(m.vx) * 0.5; 
        }

        // Fan Physics
        for (const fan of fans) {
          const dx = m.x - fan.x;
          const dy = m.y - fan.y;
          const localX = dx * Math.cos(-fan.angle) - dy * Math.sin(-fan.angle);
          const localY = dx * Math.sin(-fan.angle) + dy * Math.cos(-fan.angle);
          const halfWidth = fan.width / 2; 
          const range = fan.height || 200;

          if (localX > 0 && localX < range && Math.abs(localY) < halfWidth) {
             const force = fan.force || 0.5;
             const forceX = Math.cos(fan.angle) * force;
             const forceY = Math.sin(fan.angle) * force;
             m.vx += forceX * dt;
             m.vy += forceY * dt;
             
             if (Math.random() < 0.1) {
                spawnParticles(m.x, m.y, '#e2e8f0', 1, 1);
             }
          }
        }

        // Repulsor Physics
        for (const rep of repulsors) {
          const dx = m.x - rep.x;
          const dy = m.y - rep.y;
          const distSq = dx*dx + dy*dy;
          const range = rep.range || 100;
          
          if (distSq < range * range) {
             const dist = Math.sqrt(distSq);
             const nx = dx / dist;
             const ny = dy / dist;
             const pulse = (Math.sin(timeRef.current * rep.speed) + 1) * 0.5;
             const force = (rep.force || 1) * (1 - dist/range) * (0.5 + pulse);
             m.vx += nx * force * dt * 50;
             m.vy += ny * force * dt * 50;
          }
        }

        // Conveyor Physics
        for (const conv of conveyors) {
           const dx = m.x - conv.x;
           const dy = m.y - conv.y;
           
           const localParallel = dx * Math.cos(-conv.angle) - dy * Math.sin(-conv.angle); 
           const localPerp = dx * Math.sin(-conv.angle) + dy * Math.cos(-conv.angle); 
           
           const halfLength = conv.width / 2;
           const halfWidth = (conv.height || 50) / 2;
           
           if (Math.abs(localParallel) < halfLength && Math.abs(localPerp) < halfWidth) {
              const force = conv.force || 10;
              const forceX = Math.cos(conv.angle) * force;
              const forceY = Math.sin(conv.angle) * force;
              m.vx += forceX * dt;
              m.vy += forceY * dt;
              
              if (Math.random() < 0.05) {
                 spawnParticles(m.x, m.y, 'rgba(255,255,255,0.3)', 1, 0.5);
              }
           }
        }

        // Hollow Circle Physics
        for (const circle of hollowCircles) {
           const dx = m.x - circle.x;
           const dy = m.y - circle.y;
           const dist = Math.sqrt(dx*dx + dy*dy);
           const r = (circle.width / 2);
           const thickness = 6;

           if (dist + m.radius >= r - thickness && dist - m.radius <= r + thickness) {
               let angle = Math.atan2(dy, dx);
               if (angle < 0) angle += Math.PI * 2;

               let rot = circle.angle % (Math.PI * 2);
               if (rot < 0) rot += Math.PI * 2;
               
               let diff = Math.abs(angle - rot);
               if (diff > Math.PI) diff = Math.PI * 2 - diff; 

               const halfGap = (circle.range || 1.0) / 2;
               
               if (diff < halfGap) {
                   // Inside gap
               } else {
                   const nx = dx / dist;
                   const ny = dy / dist;
                   
                   const pushSign = dist < r ? -1 : 1;
                   const overlap = (m.radius + thickness) - Math.abs(dist - r);
                   
                   if (overlap > 0) {
                       m.x += nx * pushSign * overlap * 0.5;
                       m.y += ny * pushSign * overlap * 0.5;
                       
                       const nX = nx * pushSign;
                       const nY = ny * pushSign;
                       
                       const dot = m.vx * nX + m.vy * nY;
                       
                       m.vx = (m.vx - 2 * dot * nX) * config.restitution;
                       m.vy = (m.vy - 2 * dot * nY) * config.restitution;
                       
                       m.vx *= config.friction;
                       m.vy *= config.friction;
                   }
               }
           }
        }

        // Laser Physics
        for (const laser of lasers) {
            if (!laser.active) continue;
            const len = laser.height || 300;
            const lx1 = laser.x;
            const ly1 = laser.y;
            const lx2 = lx1 + Math.cos(laser.angle) * len;
            const ly2 = ly1 + Math.sin(laser.angle) * len;

            const A = m.x - lx1;
            const B = m.y - ly1;
            const C = lx2 - lx1;
            const D = ly2 - ly1;

            const dot = A * C + B * D;
            const lenSq = C * C + D * D;
            let param = -1;
            if (lenSq !== 0) param = dot / lenSq;

            let xx, yy;

            if (param < 0) {
                xx = lx1; yy = ly1;
            } else if (param > 1) {
                xx = lx2; yy = ly2;
            } else {
                xx = lx1 + param * C;
                yy = ly1 + param * D;
            }

            const dx = m.x - xx;
            const dy = m.y - yy;
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (dist < m.radius + 5) { 
                const force = laser.force || 20;
                m.vx += (dx/dist) * force * dt * 10;
                m.vy += (dy/dist) * force * dt * 10;
                m.vx += (Math.random() - 0.5) * 10;
                m.vy += (Math.random() - 0.5) * 10;
                spawnParticles(m.x, m.y, '#ef4444', 3, 4);
            }
        }

        // Teleporter Physics
        for (const tele of teleporters) {
            if (!tele.active) continue; 

            const dx = m.x - tele.x;
            const dy = m.y - tele.y;
            const dist = Math.sqrt(dx*dx + dy*dy);
            
            if (dist < (tele.width/2) && (!teleportCooldowns.current[m.id] || now > teleportCooldowns.current[m.id])) {
                 
                 const isBackwards = (tele.destY || 0) < tele.y;
                 const color = isBackwards ? '#ef4444' : '#d946ef';

                 spawnParticles(m.x, m.y, color, 15, 4); 
                 
                 m.x = tele.destX || m.x;
                 m.y = tele.destY || m.y;
                 
                 m.vx *= 0.2; 
                 m.vy = isBackwards ? 0 : Math.abs(m.vy) + 2; 

                 teleportCooldowns.current[m.id] = now + 1500; 
                 audio.playPinHit(8); 

                 spawnParticles(m.x, m.y, '#06b6d4', 15, 4); 
            }
        }

        m.angle += m.omega * dt;
        m.omega *= 0.999; 
        
        m.vx *= Math.pow(config.friction, dt);
        m.vy *= Math.pow(config.friction, dt);

        if (m.vx*m.vx + m.vy*m.vy < 0.2) {
             m.vx += (Math.random() - 0.5); 
             m.vy += 0.5; 
        }

        // CHECK GATE COLLISION
        if (!gateOpenRef.current) {
            checkLineCollision(m, gateLine);
        }

        for (const line of linesRef.current) checkLineCollision(m, line);
        for (const dLine of dynamicLines) checkLineCollision(m, dLine, true);
        for (const pin of pinsRef.current) checkPinCollision(m, pin);
        
        for (let j = i + 1; j < marbles.length; j++) {
           if (!marbles[j].finished) checkMarbleCollision(m, marbles[j]);
        }

        if (m.y > finishLineY.current) {
          m.finished = true;
          m.finishTime = Date.now() - startTime.current;
          const finishedSoFar = marbles.filter(b => b.finished).length;
          m.rank = finishedSoFar;
          audio.playPinHit(10);
          spawnFinishParticles(m.x, m.y, m.color);

          // NEW: In Inverted Elimination, the race ends as soon as the first marble crosses.
          if (gameMode === 'inverted_elimination' && !raceFinished.current) {
              raceFinished.current = true;
              onRaceFinish(marblesRef.current);
              return;
          }
        }
        
        if (!m.finished) {
            totalSpeed += Math.sqrt(m.vx*m.vx + m.vy*m.vy + m.omega*m.radius*m.omega*m.radius);
            
            // Check Soccer Ball Collection (World Cup Mode)
            if (gameMode === 'world_cup') {
                for (const sb of soccerBallsRef.current) {
                    if (!sb.collected) {
                        const dx = m.x - sb.x;
                        const dy = m.y - sb.y;
                        const distSq = dx*dx + dy*dy;
                        const collectDist = m.radius + 15;
                        if (distSq < collectDist * collectDist) {
                            sb.collected = true;
                            m.collectedItems++;
                            audio.playPinHit(5); 
                            spawnParticles(sb.x, sb.y, '#fff', 10, 3);
                        }
                    }
                }
            }
        }
      }
    }
    
    audio.updateRolling(totalSpeed);

    // --- CAMERA LOGIC ---
    let targetY = cameraY.current;
    
    // Explicit Camera Logic:
    // 1. If following bet -> Follow bet marble.
    // 2. If bet marble finishes or isFollowingBet is false -> Follow Leader (1st place active marble).
    if (isFollowingBet && betMarbleId !== null) {
        const betMarble = marbles.find(m => m.id === betMarbleId);
        // Only follow if it exists and hasn't finished (or maybe follow even if finished? Usually better to follow active)
        if (betMarble && !betMarble.finished) {
            targetY = betMarble.y - 300; 
        } else {
             // Fallback to leader if bet marble is finished
             const activeMarblesList = marbles.filter(m => !m.finished);
             if (activeMarblesList.length > 0) {
                 activeMarblesList.sort((a, b) => b.y - a.y);
                 targetY = activeMarblesList[0].y - 300;
             }
        }
    } else {
        // Follow Leader Logic - STRICTLY follow the first place marble
        const activeMarblesList = marbles.filter(m => !m.finished);
        if (activeMarblesList.length > 0) {
          activeMarblesList.sort((a, b) => b.y - a.y);
          // Changed: Do NOT average top 3. Just take the leader.
          // This ensures the camera stays with the leader even if they are far ahead.
          targetY = activeMarblesList[0].y - 300;
        } 
    }
    
    cameraY.current += (targetY - cameraY.current) * 0.08;

    if (onMarblesUpdate && timeRef.current % 5 === 0) {
        onMarblesUpdate([...marblesRef.current]);
    }

    if (marbles.filter(m => !m.finished).length === 0) {
      if (!raceFinished.current) {
        raceFinished.current = true;
        const sorted = [...marbles].sort((a, b) => a.rank - b.rank);
        audio.playFinish(); 
        setTimeout(() => onRaceFinish(sorted), 1000);
      }
    }
  };

  const resolveCollisionPhysics = (ball: Marble, nx: number, ny: number, isBouncy: boolean, cx: number, cy: number) => {
    const vDotN = ball.vx * nx + ball.vy * ny;
    if (vDotN > 0) return; 

    const intensity = Math.abs(vDotN);
    if (intensity > 1.0) {
        audio.playBump(intensity);
        if (intensity > 2.0) {
            const particleColor = isBouncy ? '#ef4444' : (intensity > 5 ? '#fff' : '#94a3b8');
            spawnParticles(cx, cy, particleColor, Math.floor(intensity * 2), intensity * 0.6, intensity * 0.2);
        }
    }

    const restitution = isBouncy ? 1.5 : config.restitution;
    const jN = -(1 + restitution) * vDotN;
    ball.vx += jN * nx;
    ball.vy += jN * ny;

    const tx = -ny;
    const ty = nx;
    const vDotT = ball.vx * tx + ball.vy * ty;
    const vSurf = vDotT + ball.omega * ball.radius;

    const mass = 1.0;
    const jT_ideal = -vSurf / (3.5 / mass);
    const mu = 0.5;
    const maxJt = mu * Math.abs(jN);
    
    let jT = jT_ideal;
    if (Math.abs(jT) > maxJt) {
       jT = Math.sign(jT) * maxJt;
    }

    ball.vx += jT * tx;
    ball.vy += jT * ty;
    ball.omega += (2.5 * jT) / (mass * ball.radius);
  };

  const checkLineCollision = (ball: Marble, line: LineSegment, isDynamic = false) => {
    const dx = line.x2 - line.x1;
    const dy = line.y2 - line.y1;
    const lenSq = dx*dx + dy*dy;
    const t = Math.max(0, Math.min(1, ((ball.x - line.x1) * dx + (ball.y - line.y1) * dy) / lenSq));
    const closeX = line.x1 + t * dx;
    const closeY = line.y1 + t * dy;
    
    const distX = ball.x - closeX;
    const distY = ball.y - closeY;
    const distSq = distX*distX + distY*distY;
    
    if (distSq < ball.radius * ball.radius) {
      const dist = Math.sqrt(distSq);
      const nx = distX / dist;
      const ny = distY / dist;
      
      const overlap = ball.radius - dist;
      ball.x += nx * overlap;
      ball.y += ny * overlap;
      
      const isBouncy = isDynamic && line.type === 'bouncer';
      resolveCollisionPhysics(ball, nx, ny, isBouncy, closeX, closeY);
      
      if (isDynamic) {
        ball.vx += (Math.random() - 0.5) * 2;
        ball.vy += (Math.random() - 0.5) * 2;
      }
    }
  };

  const checkPinCollision = (ball: Marble, pin: CircleObstacle) => {
    const dx = ball.x - pin.x;
    const dy = ball.y - pin.y;
    const distSq = dx*dx + dy*dy;
    const minDist = ball.radius + pin.radius;
    
    if (distSq < minDist * minDist) {
      const dist = Math.sqrt(distSq);
      const nx = dx / dist;
      const ny = dy / dist;
      
      const overlap = minDist - dist;
      ball.x += nx * overlap;
      ball.y += ny * overlap;
      
      const isBumper = pin.type === 'bumper';
      
      const intensity = Math.sqrt(ball.vx*ball.vx + ball.vy*ball.vy);
      if (intensity > 1) {
          audio.playPinHit(intensity);
      }

      // Calculate approximate contact point
      const cx = pin.x + nx * pin.radius;
      const cy = pin.y + ny * pin.radius;

      resolveCollisionPhysics(ball, nx, ny, isBumper, cx, cy);
    }
  };

  const checkMarbleCollision = (m1: Marble, m2: Marble) => {
    const dx = m2.x - m1.x;
    const dy = m2.y - m1.y;
    const distSq = dx*dx + dy*dy;
    const minDist = m1.radius + m2.radius;
    
    if (distSq < minDist * minDist) {
      const dist = Math.sqrt(distSq);
      const nx = dx / dist;
      const ny = dy / dist;
      const overlap = (minDist - dist) * 0.5;
      
      m1.x -= nx * overlap;
      m1.y -= ny * overlap;
      m2.x += nx * overlap;
      m2.y += ny * overlap;
      
      const dvx = m1.vx - m2.vx;
      const dvy = m1.vy - m2.vy;
      const dot = dvx * nx + dvy * ny;
      
      if (dot > 0) {
         if (dot > 2) {
             audio.playPinHit(dot * 0.5);
             if (dot > 3) {
                 const cx = m1.x + nx * m1.radius;
                 const cy = m1.y + ny * m1.radius;
                 spawnParticles(cx, cy, '#fff', Math.floor(dot * 1.5), dot * 0.4, 1.5);
                 spawnParticles(cx, cy, m1.color, Math.floor(dot), dot * 0.3, 1);
                 spawnParticles(cx, cy, m2.color, Math.floor(dot), dot * 0.3, 1);
             }
         }

         const impulse = dot * 0.9; 
         m1.vx -= impulse * nx;
         m1.vy -= impulse * ny;
         m2.vx += impulse * nx;
         m2.vy += impulse * ny;
      }
    }
  };

  // --- Initialization ---
  useEffect(() => {
    generateLevel();
    raceFinished.current = false;
    gateOpenRef.current = false; // Reset Gate
    startTime.current = Date.now();
    cameraY.current = 0;
    timeRef.current = 0;
    teleportCooldowns.current = {};
    particlesRef.current = [];
    lastEliminationTime.current = 0;

    activeMarbles.forEach(m => {
        const img = new Image();
        img.src = m.logoUrl;
        // REMOVED crossOrigin = "Anonymous" to allow non-CORS CDNs to display (tainted canvas is OK here)
        imagesRef.current[m.id] = img;
    });

    // HORIZONTAL START POSITIONS
    const totalWidth = COURSE_WIDTH * 0.9;
    const startX = COURSE_WIDTH * 0.05;
    const spacing = totalWidth / Math.max(1, activeMarbles.length);

    marblesRef.current = activeMarbles.map((m, index) => ({
      ...m,
      x: startX + (spacing * index) + (spacing/2), // Evenly spaced horizontally
      y: GATE_Y - 50, // Just above the gate
      vx: 0,
      vy: 0,
      angle: 0,
      omega: 0,
      finished: false,
      rank: 0,
      trail: [],
      collectedItems: 0
    }));
    
    audio.resume();

  }, [activeMarbles]); 

  // --- Drawing Subroutines ---

  const drawRepulsor = (ctx: CanvasRenderingContext2D, obj: DynamicObstacle) => {
    const pulse = (Math.sin(timeRef.current * obj.speed) + 1) * 0.5;
    const currentRadius = obj.width/2 + pulse * (obj.range! - obj.width/2);
    
    ctx.beginPath();
    ctx.arc(0, 0, obj.width/2, 0, Math.PI * 2);
    ctx.fillStyle = '#8b5cf6';
    ctx.fill();
    
    ctx.beginPath();
    ctx.arc(0, 0, currentRadius, 0, Math.PI * 2);
    ctx.strokeStyle = `rgba(139, 92, 246, ${1 - pulse})`;
    ctx.lineWidth = 2;
    ctx.stroke();
  };

  const drawConveyor = (ctx: CanvasRenderingContext2D, obj: DynamicObstacle) => {
    const length = obj.width;  
    const thickness = obj.height || 50; 

    ctx.beginPath();
    ctx.rect(-length/2, -thickness/2, length, thickness);
    ctx.fillStyle = '#334155';
    ctx.fill();
    ctx.strokeStyle = '#475569';
    ctx.stroke();

    const spacing = 40;
    const offset = (timeRef.current * obj.speed * 50) % spacing;
    
    ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
    
    for(let x = -length/2; x < length/2; x += spacing) {
        const currentX = x + offset;
        if (currentX > length/2) continue;
        
        ctx.save();
        ctx.translate(currentX, 0); 
        ctx.beginPath();
        ctx.moveTo(-5, -8);
        ctx.lineTo(5, 0);
        ctx.lineTo(-5, 8);
        ctx.fill();
        ctx.restore();
    }
  };

  const drawLaser = (ctx: CanvasRenderingContext2D, obj: DynamicObstacle) => {
     ctx.fillStyle = '#111';
     ctx.beginPath();
     ctx.arc(0, 0, 10, 0, Math.PI * 2);
     ctx.fill();
     ctx.strokeStyle = '#ef4444';
     ctx.lineWidth = 2;
     ctx.stroke();

     if (obj.active) {
         const len = obj.height || 300;
         ctx.beginPath();
         ctx.moveTo(0, 0);
         ctx.lineTo(len, 0); 
         
         ctx.shadowColor = '#ef4444';
         ctx.shadowBlur = 15;
         ctx.strokeStyle = '#fca5a5';
         ctx.lineWidth = 4;
         ctx.stroke();
         
         ctx.shadowBlur = 0;
         ctx.strokeStyle = '#fff';
         ctx.lineWidth = 1;
         ctx.stroke();
     } else {
         ctx.fillStyle = timeRef.current % 30 < 15 ? '#ef4444' : '#550000';
         ctx.beginPath();
         ctx.arc(0, 0, 4, 0, Math.PI * 2);
         ctx.fill();
     }
  };

  const drawTeleporter = (ctx: CanvasRenderingContext2D, obj: DynamicObstacle, isExit = false) => {
      const opacity = obj.timer !== undefined ? obj.timer : 1.0;
      if (opacity < 0.1 && !isExit) return; 

      ctx.save();
      ctx.globalAlpha = isExit ? 1.0 : opacity; 

      const radius = obj.width / 2;
      const angleOffset = timeRef.current * (isExit ? -0.1 : 0.1);
      const isBackwards = (obj.destY || 0) < obj.y;

      const primaryColor = isExit ? '#06b6d4' : (isBackwards ? '#ef4444' : '#d946ef');
      const glowColor = isExit ? 'rgba(6,182,212,0.5)' : (isBackwards ? 'rgba(239, 68, 68, 0.5)' : 'rgba(217,70,239,0.5)');
      
      ctx.beginPath();
      ctx.arc(0, 0, radius, 0, Math.PI * 2);
      ctx.strokeStyle = primaryColor;
      ctx.lineWidth = 3;
      ctx.shadowColor = primaryColor;
      ctx.shadowBlur = 10 * opacity;
      ctx.stroke();
      ctx.shadowBlur = 0;

      ctx.save();
      ctx.rotate(angleOffset);
      for(let i=0; i<3; i++) {
          ctx.rotate((Math.PI * 2) / 3);
          ctx.beginPath();
          ctx.moveTo(0, 0);
          ctx.quadraticCurveTo(radius/2, 0, radius, radius/2);
          ctx.strokeStyle = glowColor;
          ctx.lineWidth = 2;
          ctx.stroke();
      }
      ctx.restore();

      ctx.fillStyle = '#fff';
      ctx.font = '10px Arial';
      ctx.textAlign = 'center';
      
      let label = isExit ? 'OUT' : (isBackwards ? 'TRAP' : 'IN');
      if (!isExit && opacity < 0.3) label = ''; 
      
      ctx.fillText(label, 0, 4);
      ctx.restore(); 
  };

  const drawParticles = (ctx: CanvasRenderingContext2D) => {
      particlesRef.current.forEach(p => {
          ctx.globalAlpha = p.life;
          ctx.fillStyle = p.color;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          ctx.fill();
      });
      ctx.globalAlpha = 1.0;
  };

  const drawLeaderboard = (ctx: CanvasRenderingContext2D, canvasWidth: number, canvasHeight: number) => {
    const sorted = [...marblesRef.current].sort((a, b) => {
      if (a.finished && b.finished) return a.rank - b.rank;
      if (a.finished) return -1;
      if (b.finished) return 1;
      return b.y - a.y;
    });

    const boxWidth = 40; 
    const itemHeight = 20;
    const startX = 10; 
    const startY = 90; 

    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.beginPath();
    ctx.roundRect(startX, startY, boxWidth, sorted.length * itemHeight + 10, 6);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.font = 'bold 9px "Roboto Mono"'; 
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';

    sorted.forEach((m, index) => {
       const y = startY + 10 + index * itemHeight; 
       
       ctx.fillStyle = index === 0 ? '#fbbf24' : index === 1 ? '#9ca3af' : index === 2 ? '#b45309' : '#6b7280';
       ctx.fillText(`${index + 1}`, startX + 5, y);

       const img = imagesRef.current[m.id];
       const iconSize = 14;
       
       if (img && img.complete && img.naturalHeight !== 0) {
           ctx.save();
           ctx.beginPath();
           ctx.arc(startX + 25, y, iconSize / 2, 0, Math.PI * 2);
           ctx.clip();
           ctx.drawImage(img, startX + 25 - iconSize / 2, y - iconSize / 2, iconSize, iconSize);
           ctx.restore();
           
           ctx.beginPath();
           ctx.arc(startX + 25, y, iconSize / 2, 0, Math.PI * 2);
           ctx.strokeStyle = m.finished ? '#10b981' : m.color;
           ctx.lineWidth = 1;
           ctx.stroke();
       } else {
           ctx.fillStyle = m.color; 
           ctx.beginPath();
           ctx.arc(startX + 25, y, 4, 0, Math.PI*2);
           ctx.fill();
       }
       
       if (m.id === betMarbleId) {
          ctx.strokeStyle = '#fbbf24';
          ctx.lineWidth = 1;
          ctx.strokeRect(startX + 2, y - 8, boxWidth - 4, 16);
       }
    });
  };

  // --- Render Loop ---
  const draw = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { offsetWidth, offsetHeight } = canvas;
    if (canvas.width !== offsetWidth || canvas.height !== offsetHeight) {
      canvas.width = offsetWidth;
      canvas.height = offsetHeight;
    }

    ctx.fillStyle = '#1f2937';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.save();
    const baseScale = canvas.width / COURSE_WIDTH;
    const finalScale = baseScale * zoom;
    ctx.scale(finalScale, finalScale);
    
    // Center the course if zoomed out
    const offsetX = (canvas.width / finalScale - COURSE_WIDTH) / 2;
    ctx.translate(offsetX, 0);

    const camY = Math.max(0, Math.min(cameraY.current, finishLineY.current - canvas.height/finalScale + 100));
    ctx.translate(0, -camY);

    // Draw Static Lines
    ctx.lineWidth = 4;
    ctx.lineCap = 'round';

    linesRef.current.forEach(l => {
      ctx.strokeStyle = l.type === 'wall' ? '#4b5563' : '#60a5fa';
      if (l.type === 'wall') ctx.lineWidth = 6;
      else ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(l.x1, l.y1);
      ctx.lineTo(l.x2, l.y2);
      ctx.stroke();
    });

    // Draw Dynamic Obstacles
    dynamicRef.current.forEach(obj => {
       if (obj.type === 'teleporter') {
           ctx.save();
           ctx.translate(obj.x, obj.y);
           drawTeleporter(ctx, obj, false);
           ctx.restore();
           if (obj.destX !== undefined && obj.destY !== undefined) {
               ctx.save();
               ctx.translate(obj.destX, obj.destY);
               drawTeleporter(ctx, obj, true);
               ctx.restore();
           }
           return;
       }

       ctx.save();
       ctx.translate(obj.x, obj.y);
       ctx.rotate(obj.angle);

       if (obj.type === 'fan') {
          ctx.fillStyle = '#64748b';
          ctx.fillRect(-10, -obj.width/2, 20, obj.width);
          
          const range = obj.height || 200;
          const gradient = ctx.createLinearGradient(0, 0, range, 0);
          gradient.addColorStop(0, 'rgba(255, 255, 255, 0.4)');
          gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
          
          ctx.fillStyle = gradient;
          ctx.fillRect(0, -obj.width/2, range, obj.width);

          ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
          ctx.lineWidth = 1;
          const offset = (timeRef.current * 5) % 50;
          for(let i=0; i<3; i++) {
             const yPos = -obj.width/2 + (obj.width/4) * (i+1);
             ctx.beginPath();
             ctx.moveTo(10 + offset, yPos);
             ctx.lineTo(range - 20, yPos);
             ctx.stroke();
          }

       } else if (obj.type === 'repulsor') {
          drawRepulsor(ctx, obj);
       } else if (obj.type === 'conveyor') {
          drawConveyor(ctx, obj);
       } else if (obj.type === 'laser') {
          drawLaser(ctx, obj);
       } else if (obj.type === 'hollow_circle') {
             const r = obj.width / 2;
             const gap = obj.range || 1.0;
             
             ctx.beginPath();
             ctx.arc(0, 0, r, gap/2, Math.PI * 2 - gap/2);
             ctx.strokeStyle = '#d946ef'; 
             ctx.lineWidth = 12;
             ctx.lineCap = 'round'; 
             ctx.stroke();
             
             ctx.beginPath();
             ctx.arc(0, 0, r - 10, 0, Math.PI * 2);
             ctx.strokeStyle = 'rgba(217, 70, 239, 0.3)';
             ctx.lineWidth = 2;
             ctx.stroke();
       } else {
         ctx.strokeStyle = obj.type === 'spinner' ? '#ef4444' : '#f59e0b';
         ctx.lineWidth = 8;
         ctx.beginPath();
         ctx.moveTo(-obj.width/2, 0);
         ctx.lineTo(obj.width/2, 0);
         ctx.stroke();
         
         if (obj.type === 'spinner') {
           ctx.beginPath();
           ctx.arc(0, 0, 5, 0, Math.PI * 2);
           ctx.fillStyle = '#fff';
           ctx.fill();
         }
       }
       ctx.restore();
    });

    // DRAW GATE (If Closed)
    if (!gateOpenRef.current) {
        ctx.beginPath();
        ctx.moveTo(0, GATE_Y);
        ctx.lineTo(COURSE_WIDTH, GATE_Y);
        ctx.strokeStyle = '#ef4444'; // Red barrier
        ctx.lineWidth = 10;
        ctx.stroke();
        
        // Draw Countdown Text
        const elapsed = Date.now() - startTime.current;
        const timeLeft = Math.max(0, Math.ceil((GATE_DELAY - elapsed) / 1000));
        
        ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        ctx.font = 'bold 80px "Righteous"';
        ctx.textAlign = 'center';
        ctx.fillText(timeLeft.toString(), COURSE_WIDTH / 2, GATE_Y + 150);
        ctx.font = '20px "Roboto Mono"';
        ctx.fillText("PREPARAR...", COURSE_WIDTH / 2, GATE_Y + 180);
    }


    // Draw Soccer Balls (World Cup Mode)
    if (gameMode === 'world_cup') {
        soccerBallsRef.current.forEach(sb => {
            if (!sb.collected) {
                ctx.save();
                ctx.translate(sb.x, sb.y);
                
                // Solid White Background
                ctx.beginPath();
                ctx.arc(0, 0, 15, 0, Math.PI * 2);
                ctx.fillStyle = '#ffffff';
                ctx.fill();
                
                // Black Outline
                ctx.strokeStyle = '#000000';
                ctx.lineWidth = 2;
                ctx.stroke();
                
                // Soccer Pattern
                ctx.fillStyle = '#0a0a0a';
                // Center pentagon
                ctx.beginPath();
                for (let i = 0; i < 5; i++) {
                    const angle = (i * Math.PI * 2) / 5 - Math.PI / 2;
                    const px = Math.cos(angle) * 5;
                    const py = Math.sin(angle) * 5;
                    if (i === 0) ctx.moveTo(px, py);
                    else ctx.lineTo(px, py);
                }
                ctx.closePath();
                ctx.fill();

                // Outer pentagons (partial)
                for (let i = 0; i < 5; i++) {
                    const angle = (i * Math.PI * 2) / 5 - Math.PI / 2;
                    ctx.save();
                    ctx.translate(Math.cos(angle) * 11, Math.sin(angle) * 11);
                    ctx.rotate(angle + Math.PI);
                    ctx.beginPath();
                    for (let j = 0; j < 5; j++) {
                        const subAngle = (j * Math.PI * 2) / 5 - Math.PI / 2;
                        const spx = Math.cos(subAngle) * 4;
                        const spy = Math.sin(subAngle) * 4;
                        if (j === 0) ctx.moveTo(spx, spy);
                        else ctx.lineTo(spx, spy);
                    }
                    ctx.closePath();
                    ctx.fill();
                    ctx.restore();
                }
                
                ctx.restore();
            }
        });
    }

    drawParticles(ctx);

    pinsRef.current.forEach(p => {
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      ctx.fillStyle = p.type === 'bumper' ? '#f472b6' : '#9ca3af';
      ctx.fill();
    });

    // Draw Finish Area
    ctx.fillStyle = '#10b981';
    ctx.fillRect(0, finishLineY.current, COURSE_WIDTH, 10);
    for(let i=0; i<20; i++) {
        ctx.fillStyle = i%2===0 ? '#fff' : '#000';
        ctx.fillRect(i * (COURSE_WIDTH/20), finishLineY.current, COURSE_WIDTH/20, 10);
    }

    // Draw Marbles
    marblesRef.current.forEach(m => {
      // Draw Trail
      if (m.trail.length > 1) {
          ctx.beginPath();
          ctx.moveTo(m.trail[0].x, m.trail[0].y);
          for (let i = 1; i < m.trail.length; i++) {
              ctx.lineTo(m.trail[i].x, m.trail[i].y);
          }
          ctx.strokeStyle = m.color;
          ctx.lineWidth = m.radius * 0.6;
          ctx.lineCap = 'round';
          ctx.lineJoin = 'round';
          ctx.globalAlpha = 0.3;
          ctx.stroke();
          ctx.globalAlpha = 1.0;
      }

      ctx.save();
      ctx.translate(m.x, m.y);
      ctx.rotate(-m.angle); 

      // Draw Background Circle (White) to make transparency logos pop
      ctx.beginPath();
      ctx.arc(0, 0, m.radius, 0, Math.PI * 2);
      ctx.fillStyle = '#ffffff';
      ctx.shadowColor = 'rgba(0,0,0,0.5)';
      ctx.shadowBlur = 5;
      ctx.fill();
      ctx.shadowBlur = 0;

      // Draw Logo Image clipped to circle
      ctx.save();
      ctx.beginPath();
      ctx.arc(0, 0, m.radius, 0, Math.PI * 2);
      ctx.clip();
      
      const img = imagesRef.current[m.id];
      if (img && img.complete && img.naturalHeight !== 0) {
        const imgAspect = img.naturalWidth / img.naturalHeight;
        const targetSize = m.radius * 2;
        let drawWidth, drawHeight;

        if (imgAspect > 1) {
          // Wide image
          drawHeight = targetSize;
          drawWidth = targetSize * imgAspect;
        } else {
          // Tall image
          drawWidth = targetSize;
          drawHeight = targetSize / imgAspect;
        }

        ctx.drawImage(img, -drawWidth / 2, -drawHeight / 2, drawWidth, drawHeight);
      } else {
        // Fallback: Solid Color if image fails
        ctx.fillStyle = m.color;
        ctx.fill();
      }
      ctx.restore();
      
      // Draw Border Ring (Team Color)
      ctx.beginPath();
      ctx.arc(0, 0, m.radius, 0, Math.PI * 2);
      ctx.strokeStyle = m.color;
      ctx.lineWidth = 2;
      ctx.stroke();

      // Glass Shine Effect
      ctx.beginPath();
      ctx.arc(-m.radius*0.3, -m.radius*0.3, m.radius*0.25, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(255,255,255,0.4)';
      ctx.fill();

      ctx.restore(); 
      
      // Selection Highlight
      if (m.id === betMarbleId) {
        ctx.strokeStyle = '#fbbf24';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(m.x, m.y, m.radius + 6, 0, Math.PI * 2);
        ctx.stroke();
      }
      
      if (!m.finished) {
        ctx.fillStyle = '#fff';
        ctx.font = '10px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(m.name, m.x, m.y - m.radius - 8);
      }
    });

    ctx.restore(); 

    if (gameMode !== 'world_cup') {
        drawLeaderboard(ctx, canvas.width, canvas.height);
    }
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const handleTouchStart = (e: TouchEvent) => {
        if (e.touches.length === 2) {
            const dx = e.touches[0].clientX - e.touches[1].clientX;
            const dy = e.touches[0].clientY - e.touches[1].clientY;
            lastTouchDist.current = Math.sqrt(dx * dx + dy * dy);
        }
    };

    const handleTouchMove = (e: TouchEvent) => {
        if (e.touches.length === 2 && lastTouchDist.current !== null) {
            const dx = e.touches[0].clientX - e.touches[1].clientX;
            const dy = e.touches[0].clientY - e.touches[1].clientY;
            const dist = Math.sqrt(dx * dx + dy * dy);
            
            const delta = dist / lastTouchDist.current;
            const newZoom = Math.max(0.3, Math.min(3.0, zoom * delta));
            onZoomChange(newZoom);
            lastTouchDist.current = dist;
        }
    };

    const handleTouchEnd = () => {
        lastTouchDist.current = null;
    };

    canvas.addEventListener('touchstart', handleTouchStart, { passive: false });
    canvas.addEventListener('touchmove', handleTouchMove, { passive: false });
    canvas.addEventListener('touchend', handleTouchEnd);

    return () => {
        canvas.removeEventListener('touchstart', handleTouchStart);
        canvas.removeEventListener('touchmove', handleTouchMove);
        canvas.removeEventListener('touchend', handleTouchEnd);
    };
  }, [zoom, onZoomChange]);

  useEffect(() => {
    const loop = () => {
      update();
      draw();
      requestRef.current = requestAnimationFrame(loop);
    };
    requestRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(requestRef.current!);
  });

  return (
    <canvas ref={canvasRef} className="w-full h-full block" />
  );
};

export default RaceEngine;

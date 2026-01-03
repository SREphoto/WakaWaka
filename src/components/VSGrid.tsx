import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { getIsometricPos } from '../utils/GameEngine';
import './IsometricGrid.css';
import './VSGrid.css';
import WakaBert from './WakaBert';
import ParticleSystem from './ParticleSystem';
import type { ParticleSystemRef } from './ParticleSystem';
import { usePlayerMovement } from '../hooks/usePlayerMovement';
import { sound } from '../utils/SoundEngine';
import type { perk } from '../utils/ProgressionSystem';
import type { PowerUp, PowerUpType } from '../utils/PowerUpSystem';
import { POWER_UPS } from '../utils/PowerUpSystem';
import MobileControls from './MobileControls';
import PowerDiamond from './PowerDiamond';

interface VSTileData {
    q: number;
    r: number;
    state: 'gray' | 'player' | 'rival'; // player=gold, rival=blue
}

interface VSGridProps {
    onStateUpdate: (state: { xp?: number; score?: number; level?: number; activePerks?: perk[] }) => void;
}

const HEX_RADIUS = 5;

const VSGrid: React.FC<VSGridProps> = ({ onStateUpdate }) => {
    const [tiles, setTiles] = useState<VSTileData[]>(() => {
        const initialTiles: VSTileData[] = [];
        for (let q = -HEX_RADIUS; q <= HEX_RADIUS; q++) {
            const rStart = Math.max(-HEX_RADIUS, -q - HEX_RADIUS);
            const rEnd = Math.min(HEX_RADIUS, -q + HEX_RADIUS);
            for (let r = rStart; r <= rEnd; r++) {
                initialTiles.push({ q, r, state: 'gray' });
            }
        }
        return initialTiles;
    });

    const [rivalPos, setRivalPos] = useState({ q: -HEX_RADIUS, r: HEX_RADIUS });
    const [isGameOver, setIsGameOver] = useState(false);
    const [winner, setWinner] = useState<'player' | 'rival' | null>(null);
    const [activePowerUps, setActivePowerUps] = useState<{ q: number, r: number, type: PowerUp }[]>([]);

    // Status Effects
    const [rivalStunned, setRivalStunned] = useState(false);
    const [playerStunned, setPlayerStunned] = useState(false);

    const particlesRef = useRef<ParticleSystemRef>(null);

    const counts = useMemo(() => {
        const p = tiles.filter(t => t.state === 'player').length;
        const r = tiles.filter(t => t.state === 'rival').length;
        const total = tiles.length;
        return {
            player: (p / total) * 100,
            rival: (r / total) * 100,
            pCount: p,
            rCount: r
        };
    }, [tiles]);

    const isValidPos = useCallback((q: number, r: number) => {
        return tiles.some(t => t.q === q && t.r === r);
    }, [tiles]);

    // --- GAME LOGIC ---

    const paintTile = useCallback((q: number, r: number, who: 'player' | 'rival', visualX: number, visualY: number) => {
        let painted = false;
        setTiles(prev => {
            const next = prev.map(t => {
                if (t.q === q && t.r === r && t.state !== who) {
                    painted = true;
                    return { ...t, state: who };
                }
                return t;
            });
            return next;
        });

        if (painted) {
            const color = who === 'player' ? '#ffcc00' : '#00f3ff';
            particlesRef.current?.emit(visualX + window.innerWidth / 2, visualY + window.innerHeight / 2 - 50, color, 5);
            if (who === 'player') sound.playPaint();
        }
        return painted;
    }, []);

    // --- RIVAL AI ---
    useEffect(() => {
        if (isGameOver || rivalStunned) return;

        const interval = setInterval(() => {
            setRivalPos(prev => {
                // Heuristic: Prefer Gray > Player > any
                const possibleTargets = tiles.filter(t => t.state !== 'rival');

                // If no targets left, just wander or game end logic handles it
                if (possibleTargets.length === 0) return prev;

                // Simple 'seek closest high value tile' logic
                // Prioritize power-ups first if close
                let bestTarget = possibleTargets[0];
                let minScore = -Infinity;

                // Look at neighbors for immediate moves
                const neighbors = [
                    { dq: 0, dr: -1 }, { dq: 1, dr: -1 }, { dq: 1, dr: 0 },
                    { dq: 0, dr: 1 }, { dq: -1, dr: 1 }, { dq: -1, dr: 0 }
                ];

                let chosenMove = { q: prev.q, r: prev.r };
                let bestMoveScore = -Infinity;

                neighbors.forEach(({ dq, dr }) => {
                    const nq = prev.q + dq;
                    const nr = prev.r + dr;
                    const tile = tiles.find(t => t.q === nq && t.r === nr);

                    if (tile) {
                        let score = 0;
                        if (tile.state === 'player') score += 20; // Steal from player
                        if (tile.state === 'gray') score += 10;   // Claim free

                        // Check if powerup is here
                        if (activePowerUps.some(p => p.q === nq && p.r === nr)) score += 50;

                        // Random noise to break loops
                        score += Math.random() * 5;

                        if (score > bestMoveScore) {
                            bestMoveScore = score;
                            chosenMove = { q: nq, r: nr };
                        }
                    }
                });

                // Execute Move
                if (isValidPos(chosenMove.q, chosenMove.r)) {
                    // Check Powerups collision for API
                    const puIndex = activePowerUps.findIndex(p => p.q === chosenMove.q && p.r === chosenMove.r);
                    if (puIndex !== -1) {
                        // AI collected powerup
                        const pu = activePowerUps[puIndex];
                        handlePowerUpEffect(pu.type.type, 'rival', chosenMove.q, chosenMove.r);
                        setActivePowerUps(prev => prev.filter((_, i) => i !== puIndex));
                        sound.playPowerUp(); // Maybe different sound for rival?
                    }

                    const { x, y } = getIsometricPos(chosenMove.q, chosenMove.r);
                    paintTile(chosenMove.q, chosenMove.r, 'rival', x, y);
                    return chosenMove;
                }

                return prev;
            });
        }, 400); // AI Speed

        return () => clearInterval(interval);
    }, [isGameOver, tiles, isValidPos, rivalStunned, activePowerUps, paintTile]);


    // --- POWER UPS ---

    // Power-up Spawner
    useEffect(() => {
        if (isGameOver) return;
        const spawnTimer = setInterval(() => {
            if (activePowerUps.length < 3) {
                const randomTile = tiles[Math.floor(Math.random() * tiles.length)];
                // Get VS exclusive powerups or random others
                const vsPowerUps = POWER_UPS.filter(p => p.id.startsWith('vs_'));
                const chosen = vsPowerUps[Math.floor(Math.random() * vsPowerUps.length)];

                setActivePowerUps(prev => [...prev, { q: randomTile.q, r: randomTile.r, type: chosen }]);
            }
        }, 8000);
        return () => clearInterval(spawnTimer);
    }, [isGameOver, tiles, activePowerUps]);

    const handlePowerUpEffect = (type: PowerUpType, who: 'player' | 'rival', originQ: number, _originR: number) => {
        const opponent = who === 'player' ? 'rival' : 'player';

        if (type === 'vs_pellet') { // Stun
            if (opponent === 'rival') {
                setRivalStunned(true);
                setTimeout(() => setRivalStunned(false), 3000);
            } else {
                setPlayerStunned(true);
                setTimeout(() => setPlayerStunned(false), 3000);
            }
        } else if (type === 'vs_shockwave') { // Push
            // Simple logic: Push opponent away from center provided valid pos, or just teleport them to edge
            if (opponent === 'rival') {
                setRivalPos({ q: -HEX_RADIUS, r: HEX_RADIUS }); // Reset position
            } else {
                // Player push handled by hook if possible, or just visual shake?
                // For now, let's just stun them extra long as penalty
                setPlayerStunned(true);
                setTimeout(() => setPlayerStunned(false), 1000);
            }
        } else if (type === 'vs_slide') { // Paint Row
            // Paint the entire row of Q
            const targetRow = tiles.filter(t => t.q === originQ);
            targetRow.forEach(t => {
                const { x, y } = getIsometricPos(t.q, t.r);
                paintTile(t.q, t.r, who, x, y);
            });
        }
    };


    // --- PLAYER MOVEMENT ---

    const handlePlayerMove = useCallback((q: number, r: number) => {
        if (isGameOver || playerStunned) return;

        // Check Powerups
        const puIndex = activePowerUps.findIndex(p => p.q === q && p.r === r);
        if (puIndex !== -1) {
            const pu = activePowerUps[puIndex];
            handlePowerUpEffect(pu.type.type, 'player', q, r);
            setActivePowerUps(prev => prev.filter((_, i) => i !== puIndex));
            sound.playPowerUp();
        }

        sound.playHop();
        const { x, y } = getIsometricPos(q, r);
        const painted = paintTile(q, r, 'player', x, y);
        if (painted) onStateUpdate({ xp: 10 });

        // Win Condition Check
        const allColored = tiles.every(t => t.state !== 'gray');
        // Or simple dominance check, let's stick to full board or time limit? 
        // Original logic was full board.
        if (allColored) {
            const pCount = tiles.filter(t => t.state === 'player').length + (painted ? 1 : 0); // Include current
            const rCount = tiles.length - pCount; // Roughly
            setWinner(pCount > rCount ? 'player' : 'rival');
            setIsGameOver(true);
        }

    }, [isGameOver, playerStunned, activePowerUps, paintTile, onStateUpdate, tiles]);

    const { q, r, isJumping, direction, move, moveTo } = usePlayerMovement(handlePlayerMove, { speedMultiplier: 1.0, maxJumps: 1 }, isValidPos);

    const rivalScreenPos = useMemo(() => getIsometricPos(rivalPos.q, rivalPos.r), [rivalPos]);

    return (
        <div className="grid-container vs-theme">
            {/* Background cleaned up */}
            <div className="vs-progress-bar">
                <div className="progress-segment segment-player" style={{ '--segment-width': `${counts.player}%` } as React.CSSProperties}></div>
                <div className="progress-segment segment-rival" style={{ '--segment-width': `${counts.rival}%` } as React.CSSProperties}></div>
            </div>

            <ParticleSystem ref={particlesRef} />

            <div className="grid-center vs-grid-transform">
                {tiles.map((tile) => {
                    const { x, y } = getIsometricPos(tile.q, tile.r);
                    const stateClass = tile.state === 'rival' ? 'rival-tile' : tile.state === 'player' ? 'player' : 'gray';
                    return (
                        <div
                            key={`${tile.q}-${tile.r}`}
                            className={`tile ${stateClass}`}
                            style={{
                                '--pos-x': `${x}px`,
                                '--pos-y': `${y}px`,
                                'zIndex': Math.floor(y + 1000)
                            } as React.CSSProperties}
                            onClick={(e) => {
                                e.stopPropagation();
                                if (!playerStunned) moveTo(tile.q, tile.r);
                            }}
                        >
                            <div className="tile-side side-1"></div><div className="tile-side side-2"></div><div className="tile-side side-3"></div>
                            <div className="tile-side side-4"></div><div className="tile-side side-5"></div><div className="tile-side side-6"></div>
                            <div className="tile-top"></div>
                        </div>
                    );
                })}

                {/* PowerUps on Board */}
                {activePowerUps.map((pu, i) => (
                    <PowerDiamond
                        key={`pu-${i}`}
                        q={pu.q}
                        r={pu.r}
                        active={true}
                        powerUp={pu.type}
                    />
                ))}

                <WakaBert q={q} r={r} isJumping={isJumping} direction={direction} />

                {/* Visual indicator for Stun */}
                {playerStunned && <div className="stun-indicator" style={{ position: 'absolute', top: '20%', left: '50%', transform: 'translate(-50%, -50%)', color: 'yellow', fontSize: '2rem', zIndex: 9000 }}>⚡ STUNNED ⚡</div>}

                <div className="rival-bert" style={{
                    '--rival-x': `${rivalScreenPos.x}px`,
                    '--rival-y': `${rivalScreenPos.y}px`,
                    'zIndex': Math.floor(rivalScreenPos.y) + 2000
                } as React.CSSProperties}>
                    <WakaBert q={0} r={0} isJumping={false} direction="up" />
                    {rivalStunned && <div className="stun-icon">⚡</div>}
                </div>

                {isGameOver && (
                    <div className={winner === 'player' ? 'victory-banner' : 'victory-banner defeat-banner'}>
                        <h1 className="neon-text-blue">{winner === 'player' ? 'SYSTEM SECURED' : 'SECURITY BREACHED'}</h1>
                        <p className="subtitle">{winner === 'player' ? 'YOU OWN THE BOARD' : 'RIVAL CONTROLLED AREA'}</p>
                        <button onClick={() => window.location.reload()} className="mode-card retry-button">REBOOT SYSTEM</button>
                    </div>
                )}
            </div>

            <MobileControls onMove={move} />
        </div>
    );
};

export default VSGrid;

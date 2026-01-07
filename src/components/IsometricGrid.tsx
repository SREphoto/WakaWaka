import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { getIsometricPos } from '../utils/GameEngine';
import './IsometricGrid.css';
import WakaBert from './WakaBert';
import Ghost from './Ghost';
import PowerDiamond from './PowerDiamond';
import LevelUpShop from './LevelUpShop';
import ParticleSystem from './ParticleSystem';
import type { ParticleSystemRef } from './ParticleSystem';
import { usePlayerMovement } from '../hooks/usePlayerMovement';
import { sound } from '../utils/SoundEngine';
import type { perk } from '../utils/ProgressionSystem';
import type { PowerUp } from '../utils/PowerUpSystem';
import { POWER_UPS } from '../utils/PowerUpSystem';
import MobileControls from './MobileControls';
import type { GameMode } from '../App';
import TutorialOverlay from './TutorialOverlay';
import GameOverStats from './GameOverStats';

export interface TileData {
    q: number;
    r: number;
    h: number; // Height for 3D cascading effect
    state: 'gray' | 'gold' | 'blue';
}

interface IsometricGridProps {
    mode: GameMode;
    onStateUpdate: (state: { xp?: number; score?: number; level?: number; activePerks?: perk[] }) => void;
}

const HEX_RADIUS = 5;

const IsometricGrid: React.FC<IsometricGridProps> = ({ onStateUpdate, mode }) => {
    const [activePerks, setActivePerks] = useState<perk[]>([]);
    const [tiles, setTiles] = useState<TileData[]>(() => {
        const initialTiles: TileData[] = [];
        for (let q = -HEX_RADIUS; q <= HEX_RADIUS; q++) {
            const rStart = Math.max(-HEX_RADIUS, -q - HEX_RADIUS);
            const rEnd = Math.min(HEX_RADIUS, -q + HEX_RADIUS);
            for (let r = rStart; r <= rEnd; r++) {
                // Classic Mode gets random height for "Cascading" look
                // Tilt Mode stays flat (h=0) for clear physics
                const h = mode === 'classic' ? Math.floor(Math.random() * 4) : 0;
                initialTiles.push({ q, r, h, state: q === 0 && r === 0 ? 'gold' : 'gray' });
            }
        }
        return initialTiles;
    });

    const [balance, setBalance] = useState({ x: 0, y: 0 });
    const [isFlipping, setIsFlipping] = useState(false);
    const [ghostPositions, setGhostPositions] = useState<Record<string, { q: number, r: number }>>({});
    const [isPowered, setIsPowered] = useState(false);
    const [currentPowerUp, setCurrentPowerUp] = useState<PowerUp | undefined>(POWER_UPS[0]);
    const [diamondPos, setDiamondPos] = useState({ q: HEX_RADIUS, r: -HEX_RADIUS });
    const [diamondActive, setDiamondActive] = useState(true);
    const [isGameOver, setIsGameOver] = useState(false);
    const [showShop, setShowShop] = useState(false);
    const [level, setLevel] = useState(1);
    const [cameraShake, setCameraShake] = useState(false);
    const [stunnedGhosts, setStunnedGhosts] = useState<string[]>([]);
    const [turrets, setTurrets] = useState<{ q: number, r: number }[]>([]);
    const [hasSpikeArmor, setHasSpikeArmor] = useState(false);
    const [combo, setCombo] = useState(0);
    const comboTimer = useRef<number | null>(null);
    const [showTutorial, setShowTutorial] = useState(true);
    const [isPaused, setIsPaused] = useState(false);
    const [isMuted, setIsMuted] = useState(false);
    const particlesRef = useRef<ParticleSystemRef>(null);
    const [activeEffects, setActiveEffects] = useState<string[]>([]);
    const teleportRef = useRef<((q: number, r: number) => void) | null>(null);

    // Hazard State
    const [spikes, setSpikes] = useState<{ q: number, r: number, active: boolean }[]>([]);
    const [teleporters, setTeleporters] = useState<{ id: string, q: number, r: number, target: { q: number, r: number }, color: string }[]>([]);

    useEffect(() => {
        // Initialize Hazards based on Level
        if (level >= 3) {
            // Spikes
            const newSpikes = [];
            for (let i = 0; i < Math.min(level - 1, 5); i++) {
                const q = Math.floor(Math.random() * 10) - 5;
                const r = Math.floor(Math.random() * 10) - 5;
                if (q !== 0 || r !== 0) newSpikes.push({ q, r, active: false });
            }
            setSpikes(newSpikes);
        }

        if (level >= 4) {
            // Teleporters (Pairs)
            const t1 = { q: -4, r: -1, color: '#00f3ff' }; // Left
            const t2 = { q: 4, r: 1, color: '#00f3ff' };  // Right
            setTeleporters([
                { id: 't1', ...t1, target: { q: t2.q, r: t2.r } },
                { id: 't2', ...t2, target: { q: t1.q, r: t1.r } }
            ]);
        }
    }, [level]);

    // Spike Logic Loop
    useEffect(() => {
        if (spikes.length === 0) return;
        const interval = setInterval(() => {
            setSpikes(prev => prev.map(s => ({ ...s, active: !s.active })));
        }, 2000); // Toggle every 2s
        return () => clearInterval(interval);
    }, [spikes.length]);

    const onGhostPosChange = useCallback((id: string, q: number, r: number) => {
        setGhostPositions(prev => ({ ...prev, [id]: { q, r } }));
    }, []);

    const handleLevelComplete = useCallback(() => {
        sound.playLevelUp();
        setLevel(prev => {
            const nextLevel = prev + 1;
            onStateUpdate({ level: nextLevel, xp: 500 * prev }); // Bonus XP
            return nextLevel;
        });

        // Reset Board
        setTiles(prev => prev.map(t => ({ ...t, state: t.q === 0 && t.r === 0 ? 'gold' : 'gray' })));
        setGhostPositions({}); // Reset ghosts

        // Visual Flare
        particlesRef.current?.emit(window.innerWidth / 2, window.innerHeight / 2, '#ffd700', 50);
    }, [onStateUpdate]);

    const movementConfig = useMemo(() => ({
        speedMultiplier: activePerks.some(p => p.id === 'speed_demon') ? 1.6 : 1.0,
        maxJumps: activePerks.some(p => p.id === 'double_jump') ? 2 : 1
    }), [activePerks]);

    const isValidPos = useCallback((q: number, r: number) => {
        return tiles.some(t => t.q === q && t.r === r);
    }, [tiles]);

    const [comboMessage, setComboMessage] = useState<string | null>(null);
    const [score, setScore] = useState(0);
    const [maxCombo, setMaxCombo] = useState(0);

    // ... (existing state)

    const paintTile = useCallback((q: number, r: number, isSplash = false) => {
        let paintedCount = 0;
        setTiles((prev) => {
            const targetTile = prev.find(t => t.q === q && t.r === r);
            if (targetTile && targetTile.state === 'gray') {
                paintedCount++;
                if (!isSplash) {
                    sound.playPaint();
                    setCombo(c => {
                        const newCombo = c + 1;
                        if (newCombo > maxCombo) setMaxCombo(newCombo);

                        // Score Multiplier
                        const multiplier = Math.min(newCombo, 10);
                        const points = 10 * multiplier;
                        setScore(s => s + points);
                        onStateUpdate({ score: points }); // Pass delta or total? Original logic implies delta, but let's just update local first

                        // Messages
                        if (newCombo === 5) setComboMessage("DOMINATING!");
                        if (newCombo === 10) setComboMessage("UNSTOPPABLE!");
                        if (newCombo === 20) setComboMessage("GODLIKE!");

                        // Clear message
                        if ([5, 10, 20].includes(newCombo)) {
                            setTimeout(() => setComboMessage(null), 2000);
                        }

                        sound.playCombo(newCombo);
                        if (comboTimer.current) window.clearTimeout(comboTimer.current);
                        comboTimer.current = window.setTimeout(() => {
                            setCombo(0);
                            setComboMessage(null);
                        }, 1500); // 1.5s to keep combo
                        return newCombo;
                    });
                }
                const { x, y } = getIsometricPos(q, r);
                particlesRef.current?.emit(x + window.innerWidth / 2, y + window.innerHeight / 2 - 50, isSplash ? '#33ff99' : '#ffcc00', isSplash ? 3 : 5);

                // Check Level Completion
                const totalTiles = prev.length;
                const currentPainted = prev.filter(t => t.state === 'gold').length + 1; // +1 for current

                if (currentPainted >= totalTiles && !isGameOver) {
                    setTimeout(() => handleLevelComplete(), 500);
                }
            }

            return prev.map((t) => {
                if (t.q === q && t.r === r) return { ...t, state: 'gold' as const };
                return t;
            });
        });
        return paintedCount;
    }, [handleLevelComplete, isGameOver]);

    const triggerShake = useCallback(() => {
        setCameraShake(true);
        setTimeout(() => setCameraShake(false), 500);
    }, []);

    const handlePlayerMove = useCallback((q: number, r: number) => {
        if (isGameOver || showShop) return;

        // Hazard Checks
        const spike = spikes.find(s => s.q === q && s.r === r);
        if (spike && spike.active && !hasSpikeArmor) {
            console.log("HIT SPIKE!");
            sound.playDeath();
            triggerShake();
            // Stun or Damage? For now, simple bounce back or game over? Let's do instant death for strict rogue-like feel
            setIsGameOver(true);
            return;
        }

        const tele = teleporters.find(t => t.q === q && t.r === r);
        if (tele) {
            sound.playTeleport();
            teleportRef.current?.(tele.target.q, tele.target.r);
            return; // Exit, because teleportRef will handle the actual move update
        }

        sound.playHop();

        if (activePerks.some(p => p.id === 'stomp')) {
            sound.playStomp();
            triggerShake();
            const { x, y } = getIsometricPos(q, r);
            particlesRef.current?.emit(x + window.innerWidth / 2, y + window.innerHeight / 2 - 50, '#ffffff', 20);
            setStunnedGhosts(['red', 'green']);
            setTimeout(() => setStunnedGhosts([]), 2000);
        }

        let totalPainted = paintTile(q, r);
        if (activePerks.some(p => p.id === 'splash_paint')) {
            const neighbors = [[0, 1], [0, -1], [1, 0], [-1, 0], [1, -1], [-1, 1]];
            neighbors.forEach(([dq, dr]) => {
                totalPainted += paintTile(q + dq, r + dr, true);
            });
        }

        if (totalPainted > 0) {
            const multiplier = 1 + (combo * 0.1);
            onStateUpdate({ xp: Math.floor(totalPainted * 10 * multiplier) });
        }

        setTiles(prev => {
            if (prev.every(t => t.state === 'gold')) {
                sound.playWin();
                setTimeout(() => setShowShop(true), 1000);
            }
            return prev;
        });

        if (diamondActive && q === diamondPos.q && r === diamondPos.r) {
            sound.playPowerUp();
            const { x, y } = getIsometricPos(q, r);
            particlesRef.current?.emit(x + window.innerWidth / 2, y + window.innerHeight / 2 - 50, '#00ccff', 20);

            if (currentPowerUp) {
                const effectId = currentPowerUp.type;
                setActiveEffects(prev => [...prev, effectId]);
                if (currentPowerUp.duration > 0) {
                    setTimeout(() => {
                        setActiveEffects(prev => prev.filter(e => e !== effectId));
                    }, currentPowerUp.duration);
                }

                if (effectId === 'paint_bomb') {
                    const neighbors = [[0, 1], [0, -1], [1, 0], [-1, 0], [1, -1], [-1, 1], [0, 2], [0, -2], [2, 0], [-2, 0]];
                    neighbors.forEach(([dq, dr]) => paintTile(q + dq, r + dr, true));
                }
                if (effectId === 'stabilizer') setBalance({ x: 0, y: 0 });
                if (effectId === 'teleport' && teleportRef.current) teleportRef.current(0, 0);
            }

            setDiamondActive(false);
            setIsPowered(true);
            setTimeout(() => setIsPowered(false), 8000);
            setTimeout(() => {
                const grayTiles = tiles.filter(t => t.state === 'gray');
                if (grayTiles.length > 0) {
                    const nextDiamond = grayTiles[Math.floor(Math.random() * grayTiles.length)];
                    const nextType = POWER_UPS[Math.floor(Math.random() * POWER_UPS.length)];
                    setDiamondPos({ q: nextDiamond.q, r: nextDiamond.r });
                    setCurrentPowerUp(nextType);
                    setDiamondActive(true);
                }
            }, 12000);
        }
    }, [diamondActive, diamondPos, isGameOver, showShop, onStateUpdate, paintTile, activePerks, triggerShake, combo, spikes, teleporters, hasSpikeArmor, isPaused, isPowered, sound, getIsometricPos, particlesRef, setStunnedGhosts, setTiles, teleportRef, currentPowerUp, setActiveEffects, setBalance, setDiamondActive, setIsPowered, setDiamondPos, setCurrentPowerUp, tiles]);

    // HOOKS: Movement
    const { q, r, direction, isJumping, move, moveTo } = usePlayerMovement(handlePlayerMove, movementConfig, isValidPos);

    // Bind teleport ref
    useEffect(() => {
        teleportRef.current = moveTo;
    }, [moveTo]);

    // Physics Engine for TILT Mode
    useEffect(() => {
        if (mode !== 'tilt' || isGameOver || showShop) return;

        const interval = setInterval(() => {
            setBalance(prev => {
                let torqueX = 0;
                let torqueY = 0;

                tiles.forEach(tile => {
                    if (tile.state === 'gray') {
                        const { x, y } = getIsometricPos(tile.q, tile.r);
                        torqueX += (x / 200) * 0.2;
                        torqueY += (y / 200) * 0.2;
                    }
                });

                const { x: px, y: py } = getIsometricPos(q, r);
                torqueX += (px / 200) * 8.0;
                torqueY += (py / 200) * 8.0;

                Object.values(ghostPositions).forEach(pos => {
                    const { x, y } = getIsometricPos(pos.q, pos.r);
                    torqueX += (x / 200) * 4.0;
                    torqueY += (y / 200) * 4.0;
                });

                // Damped physics for better control
                const nextX = prev.x + (torqueX - prev.x) * 0.05; // Reduced from 0.1 to 0.05
                const nextY = prev.y + (torqueY - prev.y) * 0.05;


                if (Math.abs(nextX) > 15 || Math.abs(nextY) > 15) {
                    setIsFlipping(true);
                    setIsGameOver(true);
                    sound.playDeath();
                    setTimeout(() => window.location.reload(), 3000);
                }

                return { x: nextX, y: nextY };
            });
        }, 50);

        return () => clearInterval(interval);
    }, [mode, tiles, q, r, isGameOver, showShop, ghostPositions]);

    const tilt = useMemo(() => {
        if (mode === 'tilt') {
            return {
                rotateX: 55 + balance.y,
                rotateZ: -balance.x
            };
        }
        return {
            rotateX: 55 + (r / HEX_RADIUS) * 5,
            rotateZ: (q / HEX_RADIUS) * 5
        };
    }, [mode, balance, q, r]);

    const [gracePeriod, setGracePeriod] = useState(true);

    useEffect(() => {
        const timer = setTimeout(() => setGracePeriod(false), 2000);
        return () => clearTimeout(timer);
    }, []);

    const handleCollision = useCallback((ghostPos: { q: number, r: number }, isVulnerable: boolean, ghostId: string) => {
        if (isGameOver || showShop || stunnedGhosts.includes(ghostId) || isPaused) return;

        if (gracePeriod) {
            console.log(`Grace period active. Ignoring collision with Ghost(${ghostPos.q},${ghostPos.r})`);
            return;
        }

        // DEBUG: Log collision check
        // console.log(`Checking collision: Ghost(${ghostPos.q},${ghostPos.r}) vs Player(${q},${r})`);
        if (ghostPos.q === q && ghostPos.r === r) {
            console.warn(`COLLISION DETECTED! Ghost(${ghostPos.q},${ghostPos.r}) hit Player(${q},${r}). Vulnerable: ${isVulnerable}`);
            if (isVulnerable) {
                sound.playGhostDeath();
                const { x, y } = getIsometricPos(ghostPos.q, ghostPos.r);
                particlesRef.current?.emit(x + window.innerWidth / 2, y + window.innerHeight / 2 - 50, '#ff3366', 50);
                setCombo(c => c + 5);
                setStunnedGhosts(prev => [...prev, ghostId]);
            } else if (!isJumping) {
                if (hasSpikeArmor) {
                    sound.playPowerUp();
                    setHasSpikeArmor(false);
                    setStunnedGhosts(prev => [...prev, ghostId]);
                    setTimeout(() => setStunnedGhosts(prev => prev.filter(id => id !== ghostId)), 3000);
                    return;
                }
                console.error("GAME OVER TRIGGERED BY COLLISION");
                sound.playDeath();
                triggerShake();
                setIsGameOver(true);
                setTimeout(() => window.location.reload(), 2000);
            }
        }
    }, [q, r, isJumping, isGameOver, showShop, hasSpikeArmor, stunnedGhosts, triggerShake, gracePeriod]);

    useEffect(() => {
        if (activePerks.some(p => p.id === 'spike_armor')) setHasSpikeArmor(true);
        if (activePerks.some(p => p.id === 'turret')) {
            const goldTiles = tiles.filter(t => t.state === 'gold');
            if (goldTiles.length > 0) {
                const randomTile = goldTiles[Math.floor(Math.random() * goldTiles.length)];
                setTurrets(prev => [...prev, { q: randomTile.q, r: randomTile.r }]);
            }
        }
    }, [activePerks, tiles]);

    // EFFECT: Pellet Shooter
    useEffect(() => {
        if (!activeEffects.includes('pellet_shooter')) return;
        const interval = setInterval(() => {
            const neighbors = [[0, 1], [0, -1], [1, 0], [-1, 0], [1, -1], [-1, 1]];
            const [dq, dr] = neighbors[Math.floor(Math.random() * neighbors.length)];
            paintTile(q + dq, r + dr, true);
        }, 300);
        return () => clearInterval(interval);
    }, [activeEffects, q, r, paintTile]);

    useEffect(() => {
        if (turrets.length === 0) return;
        const interval = setInterval(() => {
            setTiles(prev => {
                const grayTiles = prev.filter(t => t.state === 'gray');
                if (grayTiles.length === 0) return prev;
                const randomTile = grayTiles[Math.floor(Math.random() * grayTiles.length)];
                sound.playPaint();
                const { x, y } = getIsometricPos(randomTile.q, randomTile.r);
                particlesRef.current?.emit(x + window.innerWidth / 2, y + window.innerHeight / 2 - 50, '#9933ff', 10);
                return prev.map(t => t.q === randomTile.q && t.r === randomTile.r ? { ...t, state: 'gold' } : t);
            });
        }, 3000);
        return () => clearInterval(interval);
    }, [turrets]);

    return (
        <div className={`grid-container ${cameraShake ? 'shake' : ''}`}>
            {mode === 'tilt' && <div className="pivot-base"></div>}
            <ParticleSystem ref={particlesRef} />
            <div className={`grid-center ${isFlipping ? 'flip-death' : ''}`} style={{ '--tilt-x': `${tilt.rotateX}deg`, '--tilt-z': `${tilt.rotateZ}deg` } as React.CSSProperties}>
                {mode === 'tilt' && (
                    <>
                        <div className="tilt-spirit-level">
                            <div className="bubble-housing">
                                <div className="bubble-liquid"></div>
                                <div className="bubble-air" style={{
                                    transform: `translate(${balance.x * 3}px, ${balance.y * 3}px)`
                                }}></div>
                                <div className="level-markers"></div>
                            </div>
                            <div className="tilt-label">KEEPIN' IT LEVEL</div>
                        </div>
                        <div className="balance-meter">
                            {/* Keep the old small one as a backup or remove? Let's keep for precision */}
                            <div className="balance-dot" style={{ '--dot-x': `${50 + balance.x * 2}%`, '--dot-y': `${50 + balance.y * 2}%` } as React.CSSProperties}></div>
                            <div className="balance-warning" style={{ '--warning-opacity': Math.max(0, (Math.abs(balance.x) + Math.abs(balance.y)) / 20 - 0.5) } as React.CSSProperties}>STABILITY CRITICAL</div>
                        </div>
                    </>
                )}
                {combo > 1 && <div className="combo-counter">COMBO x{combo}</div>}
                {comboMessage && <div className="combo-message">{comboMessage}</div>}

                {/* HUD Controls */}
                <div className="hud-controls">
                    <button className={`hud-btn ${isMuted ? 'active' : ''}`} onClick={(e) => {
                        e.stopPropagation();
                        setIsMuted(!isMuted);
                        sound.toggleMute(); // Need to implement this in SoundEngine or handle here
                    }}>
                        {isMuted ? '🔇' : '🔊'}
                    </button>
                    <button className={`hud-btn ${isPaused ? 'active' : ''}`} onClick={(e) => {
                        e.stopPropagation();
                        setIsPaused(!isPaused);
                    }}>
                        {isPaused ? '▶️' : '⏸️'}
                    </button>
                </div>

                {isPaused && !showTutorial && !showShop && !isGameOver && (
                    <div className="pause-overlay">
                        <h1 className="neon-text-blue">PAUSED</h1>
                        <button className="resume-btn" onClick={() => setIsPaused(false)}>RESUME MISSION</button>
                    </div>
                )}

                {tiles.map((tile) => {
                    const { x, y } = getIsometricPos(tile.q, tile.r);
                    return (
                        <div
                            key={`${tile.q}-${tile.r}`}
                            className={`tile ${tile.state}`}
                            style={{
                                '--pos-x': `${x}px`,
                                '--pos-y': `${y}px`,
                                '--pos-z': `${tile.h * 20}px`,
                                'zIndex': Math.floor(y + (tile.h * 20) + 1000)
                            } as React.CSSProperties}
                            onClick={(e) => {
                                e.stopPropagation();
                                moveTo(tile.q, tile.r);
                            }}
                        >
                            <div className="tile-side side-1"></div><div className="tile-side side-2"></div><div className="tile-side side-3"></div>
                            <div className="tile-side side-4"></div><div className="tile-side side-5"></div><div className="tile-side side-6"></div>
                            <div className="tile-top">
                                {spikes.find(s => s.q === tile.q && s.r === tile.r) && (
                                    <div className={`hazard-spike ${spikes.find(s => s.q === tile.q && s.r === tile.r)?.active ? 'active' : ''}`}></div>
                                )}
                                {teleporters.find(t => t.q === tile.q && t.r === tile.r) && (
                                    <div className="hazard-teleport" style={{ boxShadow: `0 0 15px ${teleporters.find(t => t.q === tile.q && t.r === tile.r)?.color}` }}></div>
                                )}
                            </div>
                        </div>
                    );
                })}
                <WakaBert q={q} r={r} isJumping={isJumping} direction={direction} />
                {!isGameOver && !showShop && (
                    <>
                        {/* Level 1: Red */}
                        <Ghost id="ghost-red-1" type="red" playerPos={{ q, r }} isVulnerable={isPowered} onCollision={handleCollision} onPosChange={onGhostPosChange} isValidPos={isValidPos} />

                        {/* Level 2+: Add Pink (Ambusher) */}
                        {level >= 2 && (
                            <Ghost id="ghost-pink-1" type="pink" playerPos={{ q, r }} isVulnerable={isPowered} onCollision={handleCollision} onPosChange={onGhostPosChange} isValidPos={isValidPos} />
                        )}

                        {/* Level 3+: Add Blue (Patroller) */}
                        {level >= 3 && (
                            <Ghost id="ghost-blue-1" type="blue" playerPos={{ q, r }} isVulnerable={isPowered} onCollision={handleCollision} onPosChange={onGhostPosChange} isValidPos={isValidPos} />
                        )}

                        {/* Level 4+: Add Gold (Fleeing) */}
                        {level >= 4 && (
                            <Ghost id="ghost-gold-1" type="gold" playerPos={{ q, r }} isVulnerable={isPowered} onCollision={handleCollision} onPosChange={onGhostPosChange} isValidPos={isValidPos} />
                        )}

                        {/* Level 5+: RAMPAGE - more reds */}
                        {level >= 5 && (
                            <Ghost id="ghost-red-2" type="red" playerPos={{ q, r }} isVulnerable={isPowered} onCollision={handleCollision} onPosChange={onGhostPosChange} isValidPos={isValidPos} />
                        )}
                        {/* Level 10+: RAMPAGE - more pinks */}
                        {level >= 10 && (
                            <Ghost id="ghost-pink-2" type="pink" playerPos={{ q, r }} isVulnerable={isPowered} onCollision={handleCollision} onPosChange={onGhostPosChange} isValidPos={isValidPos} />
                        )}
                    </>
                )}
                <PowerDiamond q={diamondPos.q} r={diamondPos.r} active={diamondActive} powerUp={currentPowerUp} />
                {showShop && (
                    <LevelUpShop onSelect={(perk: perk) => {
                        sound.playPowerUp();
                        const nextPerks = [...activePerks, perk];
                        setActivePerks(nextPerks);
                        setShowShop(false);
                        setLevel(l => l + 1);
                        onStateUpdate({ level: level + 1, activePerks: nextPerks });
                        setTiles(() => {
                            const newTiles: TileData[] = [];
                            for (let q = -HEX_RADIUS; q <= HEX_RADIUS; q++) {
                                const rStart = Math.max(-HEX_RADIUS, -q - HEX_RADIUS);
                                const rEnd = Math.min(HEX_RADIUS, -q + HEX_RADIUS);
                                for (let r = rStart; r <= rEnd; r++) {
                                    const h = mode === 'classic' ? Math.floor(Math.random() * 4) : 0;
                                    newTiles.push({ q, r, h, state: q === 0 && r === 0 ? 'gold' : 'gray' });
                                }
                            }
                            return newTiles;
                        });
                    }} />
                )}
                {/* ... existing shops ... */}
                {isFlipping && <div className="game-over-overlay"><h1 className="neon-text-red">SYSTEM UNSTABLE: BOARD FLIPPED</h1></div>}

                {isGameOver && !isFlipping && (
                    <GameOverStats
                        score={score}
                        level={level}
                        maxCombo={maxCombo}
                        onRestart={() => window.location.reload()}
                    />
                )}
            </div>
            <div className="mobile-controls-layout">
                <MobileControls onMove={move} />
            </div>
            {showTutorial && <TutorialOverlay onDismiss={() => setShowTutorial(false)} />}
        </div >
    );
};

export default IsometricGrid;

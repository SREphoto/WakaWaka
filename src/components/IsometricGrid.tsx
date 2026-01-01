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
import MobileControls from './MobileControls';
import { GameMode } from '../App';

export interface TileData {
    q: number;
    r: number;
    state: 'gray' | 'gold' | 'blue';
}

interface IsometricGridProps {
    mode: GameMode;
    onStateUpdate: (state: { xp?: number; score?: number; level?: number; activePerks?: perk[] }) => void;
}

const HEX_RADIUS = 5;

const IsometricGrid: React.FC<IsometricGridProps> = ({ onStateUpdate, mode }) => {
    const [balance, setBalance] = useState({ x: 0, y: 0 });
    const [isFlipping, setIsFlipping] = useState(false);
    const [tiles, setTiles] = useState<TileData[]>(() => {
        const initialTiles: TileData[] = [];
        for (let q = -HEX_RADIUS; q <= HEX_RADIUS; q++) {
            const rStart = Math.max(-HEX_RADIUS, -q - HEX_RADIUS);
            const rEnd = Math.min(HEX_RADIUS, -q + HEX_RADIUS);
            for (let r = rStart; r <= rEnd; r++) {
                initialTiles.push({ q, r, state: q === 0 && r === 0 ? 'gold' : 'gray' });
            }
        }
        return initialTiles;
    });

    const [activePerks, setActivePerks] = useState<perk[]>([]);
    const [isPowered, setIsPowered] = useState(false);
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
    const particlesRef = useRef<ParticleSystemRef>(null);

    // Physics Engine for TILT Mode
    useEffect(() => {
        if (mode !== 'tilt' || isGameOver || showShop) return;

        const interval = setInterval(() => {
            setBalance(prev => {
                let torqueX = 0;
                let torqueY = 0;

                // 1. Weight of Tiles (Pellets)
                tiles.forEach(tile => {
                    if (tile.state === 'gray') {
                        const { x, y } = getIsometricPos(tile.q, tile.r);
                        torqueX += (x / 200) * 0.1;
                        torqueY += (y / 200) * 0.1;
                    }
                });

                // 2. Weight of Player (Significant impact)
                const { x: px, y: py } = getIsometricPos(q, r);
                torqueX += (px / 200) * 0.8;
                torqueY += (py / 200) * 0.8;

                // Apply smoothing
                const nextX = prev.x + (torqueX - prev.x) * 0.05;
                const nextY = prev.y + (torqueY - prev.y) * 0.05;

                // Check for Flip Condition
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
    }, [mode, tiles, q, r, isGameOver, showShop]);

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

    const movementConfig = useMemo(() => ({
        speedMultiplier: activePerks.some(p => p.id === 'speed_demon') ? 1.6 : 1.0,
        maxJumps: activePerks.some(p => p.id === 'double_jump') ? 2 : 1
    }), [activePerks]);

    const isValidPos = useCallback((q: number, r: number) => {
        return tiles.some(t => t.q === q && t.r === r);
    }, [tiles]);

    const triggerShake = useCallback(() => {
        setCameraShake(true);
        setTimeout(() => setCameraShake(false), 500);
    }, []);

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
                        sound.playCombo(newCombo);
                        if (comboTimer.current) window.clearTimeout(comboTimer.current);
                        comboTimer.current = window.setTimeout(() => setCombo(0), 1000);
                        return newCombo;
                    });
                }
                const { x, y } = getIsometricPos(q, r);
                particlesRef.current?.emit(x + window.innerWidth / 2, y + window.innerHeight / 2 - 50, isSplash ? '#33ff99' : '#ffcc00', isSplash ? 3 : 5);
            }

            return prev.map((t) => {
                if (t.q === q && t.r === r) return { ...t, state: 'gold' as const };
                return t;
            });
        });
        return paintedCount;
    }, []);

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

    const handlePlayerMove = useCallback((q: number, r: number) => {
        if (isGameOver || showShop) return;
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
            setDiamondActive(false);
            setIsPowered(true);
            setTimeout(() => setIsPowered(false), 8000);
            setTimeout(() => {
                const grayTiles = tiles.filter(t => t.state === 'gray');
                if (grayTiles.length > 0) {
                    const nextDiamond = grayTiles[Math.floor(Math.random() * grayTiles.length)];
                    setDiamondPos({ q: nextDiamond.q, r: nextDiamond.r });
                    setDiamondActive(true);
                }
            }, 12000);
        }
    }, [diamondActive, diamondPos, isGameOver, showShop, onStateUpdate, paintTile, activePerks, triggerShake, combo, tiles]);

    const { q, r, isJumping, direction, move } = usePlayerMovement(handlePlayerMove, movementConfig, isValidPos);

    const handleCollision = useCallback((ghostPos: { q: number, r: number }, isVulnerable: boolean, ghostId: string) => {
        if (isGameOver || showShop || stunnedGhosts.includes(ghostId)) return;
        if (ghostPos.q === q && ghostPos.r === r) {
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
                sound.playDeath();
                triggerShake();
                setIsGameOver(true);
                setTimeout(() => window.location.reload(), 2000);
            }
        }
    }, [q, r, isJumping, isGameOver, showShop, hasSpikeArmor, stunnedGhosts, triggerShake]);

    return (
        <div className={`grid-container ${cameraShake ? 'shake' : ''}`}>
            <div className="bg-mainframe">
                <div className="floating-module mod-1"></div>
                <div className="floating-module mod-2"></div>
                <div className="floating-module mod-3"></div>
            </div>
            <ParticleSystem ref={particlesRef} />
            <div className={`grid-center ${isFlipping ? 'flip-death' : ''}`} style={{ '--tilt-x': `${tilt.rotateX}deg`, '--tilt-z': `${tilt.rotateZ}deg` } as React.CSSProperties}>
                {mode === 'tilt' && (
                    <div className="balance-meter">
                        <div className="balance-dot" style={{ left: `${50 + balance.x * 2}%`, top: `${50 + balance.y * 2}%` }}></div>
                        <div className="balance-warning" style={{ opacity: Math.max(0, (Math.abs(balance.x) + Math.abs(balance.y)) / 20 - 0.5) }}>STABILITY CRITICAL</div>
                    </div>
                )}
                {combo > 1 && <div className="combo-counter">COMBO X{combo}</div>}
                {tiles.map((tile) => {
                    const { x, y } = getIsometricPos(tile.q, tile.r);
                    return (
                        <div key={`${tile.q}-${tile.r}`} className={`tile ${tile.state}`} style={{ '--pos-x': `${x}px`, '--pos-y': `${y}px`, 'zIndex': Math.floor(y + 1000) } as React.CSSProperties}>
                            <div className="tile-side side-1"></div><div className="tile-side side-2"></div><div className="tile-side side-3"></div>
                            <div className="tile-side side-4"></div><div className="tile-side side-5"></div><div className="tile-side side-6"></div>
                            <div className="tile-top"></div>
                        </div>
                    );
                })}
                <WakaBert q={q} r={r} isJumping={isJumping} direction={direction} />
                {!isGameOver && !showShop && (
                    <>
                        <Ghost id="red" type="red" playerPos={{ q, r }} isVulnerable={isPowered} onCollision={handleCollision} isValidPos={isValidPos} />
                        {level > 1 && <Ghost id="green" type="green" playerPos={{ q, r }} isVulnerable={isPowered} onCollision={handleCollision} isValidPos={isValidPos} />}
                    </>
                )}
                <PowerDiamond q={diamondPos.q} r={diamondPos.r} active={diamondActive} />
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
                                    newTiles.push({ q, r, state: q === 0 && r === 0 ? 'gold' : 'gray' });
                                }
                            }
                            return newTiles;
                        });
                    }} />
                )}
                {isFlipping && <div className="game-over-overlay"><h1 className="neon-text-red">SYSTEM UNSTABLE: BOARD FLIPPED</h1></div>}
                {isGameOver && !isFlipping && <div className="game-over-overlay"><h1 className="neon-text-red">SYSTEM CRITICAL: GAME OVER</h1></div>}
            </div>
            <MobileControls onMove={move} />
        </div >
    );
};

export default IsometricGrid;

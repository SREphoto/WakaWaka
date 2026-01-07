import React, { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { getIsometricPos } from '../utils/GameEngine';
import './IsometricGrid.css';
import './WakaWakaGrid.css';
import WakaBert from './WakaBert';
import Ghost from './Ghost';
import Fruit from './Fruit';
import ParticleSystem from './ParticleSystem';
import type { ParticleSystemRef } from './ParticleSystem';
import { usePlayerMovement } from '../hooks/usePlayerMovement';
import { sound } from '../utils/SoundEngine';
import type { perk } from '../utils/ProgressionSystem';
import MobileControls from './MobileControls';

interface WakaTileData {
    q: number;
    r: number;
    state: 'gray' | 'gold' | 'wall';
}

interface WakaWakaGridProps {
    onStateUpdate: (state: { xp?: number; score?: number; level?: number; activePerks?: perk[] }) => void;
}

const HEX_RADIUS = 6;

const WakaWakaGrid: React.FC<WakaWakaGridProps> = ({ onStateUpdate }) => {
    const [tiles, setTiles] = useState<WakaTileData[]>(() => {
        const initialTiles: WakaTileData[] = [];
        for (let q = -HEX_RADIUS; q <= HEX_RADIUS; q++) {
            const rStart = Math.max(-HEX_RADIUS, -q - HEX_RADIUS);
            const rEnd = Math.min(HEX_RADIUS, -q + HEX_RADIUS);
            for (let r = rStart; r <= rEnd; r++) {
                const isWall = (Math.abs(q) === 2 && Math.abs(r) !== 3) || (Math.abs(r) === 2 && Math.abs(q) !== 3);
                initialTiles.push({ q, r, state: isWall ? 'wall' : 'gray' });
            }
        }
        return initialTiles;
    });

    const [fruitPos, setFruitPos] = useState({ q: 3, r: -3 });
    const [fruitType, setFruitType] = useState<'cherry' | 'strawberry' | 'orange'>('cherry');
    const [fruitActive, setFruitActive] = useState(true);
    const [isGameOver, setIsGameOver] = useState(false);
    const [stage, setStage] = useState(1);
    const [isLevelTransition, setIsLevelTransition] = useState(false);
    const particlesRef = useRef<ParticleSystemRef>(null);

    const totalPaintable = useMemo(() => tiles.filter(t => t.state !== 'wall').length, [tiles]);
    const paintedCount = useMemo(() => tiles.filter(t => t.state === 'gold').length, [tiles]);

    const handleLevelComplete = useCallback(() => {
        setIsLevelTransition(true);
        sound.playLevelUp();
        onStateUpdate({ xp: 200, score: 1000 });

        setTimeout(() => {
            setStage(s => s + 1);
            setTiles(prev => prev.map(t => t.state === 'wall' ? t : { ...t, state: 'gray' }));
            setIsLevelTransition(false);
            sound.playPowerUp(); // Start sound
        }, 3000);
    }, [onStateUpdate]);

    useEffect(() => {
        if (paintedCount > 0 && paintedCount === totalPaintable && !isLevelTransition) {
            handleLevelComplete();
        }
    }, [paintedCount, totalPaintable, isLevelTransition, handleLevelComplete]);

    const isValidPos = useCallback((q: number, r: number) => {
        const tile = tiles.find(t => t.q === q && t.r === r);
        return tile !== undefined && tile.state !== 'wall';
    }, [tiles]);

    const handlePlayerMove = useCallback((q: number, r: number) => {
        if (isGameOver || isLevelTransition) return;
        sound.playHop();

        if (fruitActive && q === fruitPos.q && r === fruitPos.r) {
            setFruitActive(false);
            sound.playPowerUp();
            onStateUpdate({ xp: 100 });
            const { x, y } = getIsometricPos(q, r);
            particlesRef.current?.emit(x + window.innerWidth / 2, y + window.innerHeight / 2 - 50, '#ff0055', 30);

            setTimeout(() => {
                const available = tiles.filter(t => t.state !== 'wall');
                const next = available[Math.floor(Math.random() * available.length)];
                setFruitPos({ q: next.q, r: next.r });
                const types: ('cherry' | 'strawberry' | 'orange')[] = ['cherry', 'strawberry', 'orange'];
                setFruitType(types[Math.floor(Math.random() * types.length)]);
                setFruitActive(true);
            }, 5000);
        }

        setTiles(prev => {
            let painted = false;
            const next = prev.map(t => {
                if (t.q === q && t.r === r && t.state === 'gray') {
                    painted = true;
                    return { ...t, state: 'gold' as const };
                }
                return t;
            });
            if (painted) {
                onStateUpdate({ xp: 10 });
            }
            return next;
        });
    }, [isGameOver, isLevelTransition, onStateUpdate, fruitActive, fruitPos, tiles]);

    const { q, r, isJumping, direction, move, teleport } = usePlayerMovement(handlePlayerMove, { speedMultiplier: 1.1, maxJumps: 1 }, isValidPos);

    useEffect(() => {
        if (Math.abs(q) > HEX_RADIUS || Math.abs(r) > HEX_RADIUS || Math.abs(-q - r) > HEX_RADIUS) {
            teleport(-q, -r);
            sound.playTeleport();
        }
    }, [q, r, teleport]);

    useEffect(() => {
        if (!fruitActive || isGameOver) return;
        const interval = setInterval(() => {
            setFruitPos(prev => {
                const neighbors = [[1, 0], [-1, 0], [0, 1], [0, -1], [1, -1], [-1, 1]];
                const [dq, dr] = neighbors[Math.floor(Math.random() * neighbors.length)];
                const nq = prev.q + dq;
                const nr = prev.r + dr;
                if (isValidPos(nq, nr)) return { q: nq, r: nr };
                return prev;
            });
        }, 800);
        return () => clearInterval(interval);
    }, [fruitActive, isGameOver, isValidPos]);

    const handleGhostCollision = useCallback((ghostPos: { q: number, r: number }) => {
        if (ghostPos.q === q && ghostPos.r === r && !isJumping) {
            setIsGameOver(true);
            sound.playDeath();
        }
    }, [q, r, isJumping]);

    return (
        <div className="grid-container waka-waka-theme">
            <div className="bg-mainframe"></div>
            <ParticleSystem ref={particlesRef} />
            <div className="grid-center waka-grid-transform">
                {tiles.map((tile) => {
                    const { x, y } = getIsometricPos(tile.q, tile.r);
                    return (
                        <div key={`${tile.q}-${tile.r}`}
                            className={`tile ${tile.state}`}
                            style={{
                                '--pos-x': `${x}px`,
                                '--pos-y': `${y}px`,
                                'zIndex': Math.floor(y + 1000)
                            } as React.CSSProperties}>
                            <div className="tile-top"></div>
                            {tile.state === 'wall' && <div className="wall-pillar"></div>}
                        </div>
                    );
                })}

                <WakaBert q={q} r={r} isJumping={isJumping} direction={direction} />

                {fruitActive && <Fruit pos={fruitPos} type={fruitType} />}

                {!isGameOver && !isLevelTransition && (
                    <>
                        <Ghost id="blinky" type="red" playerPos={{ q, r }} onCollision={handleGhostCollision} isValidPos={isValidPos} speedMultiplier={1 + (stage - 1) * 0.1} />
                        <Ghost id="pinky" type="pink" playerPos={{ q, r }} onCollision={handleGhostCollision} isValidPos={isValidPos} speedMultiplier={1 + (stage - 1) * 0.1} />
                    </>
                )}

                {isLevelTransition && (
                    <div className="level-transition-overlay">
                        <h1 className="neon-text-gold">STAGE {stage} CLEARED!</h1>
                        <p className="neon-text-blue">PREPARE FOR STAGE {stage + 1}</p>
                    </div>
                )}

                {isGameOver && (
                    <div className="game-over-overlay">
                        <h1 className="neon-text-red">WAKA WAKA OVER</h1>
                        <button className="exit-menu-btn neon-border-red" onClick={() => window.location.reload()}>RETRY</button>
                    </div>
                )}
            </div>
            <MobileControls onMove={move} />
        </div>
    );
};

export default WakaWakaGrid;

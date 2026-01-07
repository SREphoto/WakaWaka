import React, { useState, useCallback, useRef, useEffect } from 'react';
import { getIsometricPos } from '../utils/GameEngine';
import './IsometricGrid.css';
import './PyramidGrid.css';
import WakaBert from './WakaBert';
import QBertEnemy from './QBertEnemy';
import ParticleSystem from './ParticleSystem';
import type { ParticleSystemRef } from './ParticleSystem';
import { usePlayerMovement } from '../hooks/usePlayerMovement';
import { sound } from '../utils/SoundEngine';
import type { perk } from '../utils/ProgressionSystem';
import MobileControls from './MobileControls';

interface PyramidTileData {
    q: number;
    r: number;
    h: number; // height level
    state: 'original' | 'intermediate' | 'target';
}

interface EnemyState {
    id: string;
    type: 'red_ball' | 'purple_ball' | 'coily_snake' | 'slick' | 'sam';
    q: number;
    r: number;
    isJumping: boolean;
}

interface DiscState {
    id: string;
    q: number;
    r: number;
    active: boolean;
}

interface PyramidGridProps {
    onStateUpdate: (state: { xp?: number; score?: number; level?: number; activePerks?: perk[] }) => void;
}

const PYRAMID_LAYERS = 7;

const PyramidGrid: React.FC<PyramidGridProps> = ({ onStateUpdate }) => {
    // --- BOARD INIT ---
    const [tiles, setTiles] = useState<PyramidTileData[]>(() => {
        const initialTiles: PyramidTileData[] = [];
        // Standard Q*bert Pyramid: 
        // Row 0: 1 tile
        // Row 1: 2 tiles
        // ...
        // Row 6: 7 tiles
        for (let row = 0; row < PYRAMID_LAYERS; row++) {
            for (let col = 0; col <= row; col++) {
                const r = row;
                const q = -col;
                initialTiles.push({ q, r, h: PYRAMID_LAYERS - 1 - row, state: 'original' });
            }
        }
        return initialTiles;
    });

    const [enemies, setEnemies] = useState<EnemyState[]>([]);
    const [discs, setDiscs] = useState<DiscState[]>([
        { id: 'd1', q: 1, r: 2, active: true },
        { id: 'd2', q: -PYRAMID_LAYERS, r: PYRAMID_LAYERS - 2, active: true }
    ]);
    const [isGameOver, setIsGameOver] = useState(false);
    const [score, setScore] = useState(0);
    const [onDisc, setOnDisc] = useState<string | null>(null);
    const [levelComplete, setLevelComplete] = useState(false);

    const particlesRef = useRef<ParticleSystemRef>(null);

    const isValidPos = useCallback((q: number, r: number) => {
        return tiles.some(t => t.q === q && t.r === r);
    }, [tiles]);

    const handlePlayerMove = useCallback((q: number, r: number) => {
        if (isGameOver || levelComplete || onDisc) return;

        if (!isValidPos(q, r)) {
            const disc = discs.find(d => d.active && d.q === q && d.r === r);
            if (disc) {
                sound.playTeleport();
                setOnDisc(disc.id);
                return;
            }
            sound.playDeath();
            setIsGameOver(true);
            return;
        }

        sound.playHop();

        setTiles(prev => {
            const index = prev.findIndex(t => t.q === q && t.r === r);
            if (index !== -1) {
                const tile = prev[index];
                if (tile.state === 'original') {
                    const newTiles = [...prev];
                    newTiles[index] = { ...tile, state: 'target' };
                    setScore(s => s + 25);
                    onStateUpdate({ score: 25 });

                    if (newTiles.every(t => t.state === 'target')) {
                        sound.playWin();
                        setLevelComplete(true);
                        setTimeout(() => window.location.reload(), 3000);
                    }
                    return newTiles;
                }
            }
            return prev;
        });

    }, [isGameOver, levelComplete, onDisc, discs, onStateUpdate, isValidPos]);

    const { q, r, isJumping, direction, move, moveTo } = usePlayerMovement(handlePlayerMove, { speedMultiplier: 1.0, maxJumps: 1 }, () => true);

    // Effect for Disc Transport
    useEffect(() => {
        if (onDisc) {
            const timer = setTimeout(() => {
                moveTo(0, 0);
                setOnDisc(null);
                setDiscs(prev => prev.map(d => d.id === onDisc ? { ...d, active: false } : d));
            }, 1000);
            return () => clearTimeout(timer);
        }
    }, [onDisc, moveTo]);

    // Enemy AI
    useEffect(() => {
        if (isGameOver || levelComplete) return;
        const enemyInterval = setInterval(() => {
            setEnemies(prev => {
                const next = prev.map(e => {
                    let nq = e.q;
                    let nr = e.r;
                    if (Math.random() < 0.5) { nq -= 1; nr += 1; } else { nr += 1; }

                    if (!isValidPos(nq, nr)) return null;
                    return { ...e, q: nq, r: nr, isJumping: true };
                }).filter(Boolean) as EnemyState[];

                if (next.length < 3 && Math.random() < 0.3) {
                    next.push({ id: `e-${Date.now()}`, type: 'red_ball', q: 0, r: 0, isJumping: true });
                }
                return next;
            });
        }, 1500);
        return () => clearInterval(enemyInterval);
    }, [isGameOver, levelComplete, isValidPos]);

    // Collision
    useEffect(() => {
        if (enemies.some(e => e.q === q && e.r === r)) {
            sound.playDeath();
            setIsGameOver(true);
        }
    }, [q, r, enemies]);

    return (
        <div className="grid-container qbert-theme">
            <div className="bg-arcade"></div>
            <ParticleSystem ref={particlesRef} />
            <div className="qbert-hud">
                <div className="score">SCORE: {score}</div>
                <div className="lives">LEVEL: 1</div>
            </div>

            <div className="grid-center qbert-pyramid">
                {tiles.map(tile => {
                    const { x, y } = getIsometricPos(tile.q, tile.r);
                    return (
                        <div key={`${tile.q}-${tile.r}`}
                            className={`qbert-cube ${tile.state}`}
                            style={{
                                '--pos-x': `${x}px`,
                                '--pos-y': `${y}px`,
                                'zIndex': Math.floor(y)
                            } as React.CSSProperties}
                        >
                            <div className="face top"></div>
                            <div className="face left"></div>
                            <div className="face right"></div>
                        </div>
                    );
                })}

                {discs.map(disc => {
                    const { x, y } = getIsometricPos(disc.q, disc.r);
                    if (!disc.active) return null;
                    return (
                        <div key={disc.id} className="qbert-disc"
                            style={{
                                '--pos-x': `${x}px`,
                                '--pos-y': `${y}px`,
                                'zIndex': Math.floor(y) + 1
                            } as React.CSSProperties}
                        ></div>
                    );
                })}

                {enemies.map(e => (
                    <QBertEnemy key={e.id} {...e} zIndex={Math.floor(getIsometricPos(e.q, e.r).y) + 10} />
                ))}

                <div className={`wakabert-wrapper ${onDisc ? 'ascend' : ''}`}
                    style={{
                        '--pos-x': `${getIsometricPos(q, r).x}px`,
                        '--pos-y': `${getIsometricPos(q, r).y}px`,
                        'zIndex': Math.floor(getIsometricPos(q, r).y) + 2000
                    } as React.CSSProperties}
                >
                    <WakaBert q={q} r={r} isJumping={isJumping} direction={direction} />
                </div>

                {isGameOver && (
                    <div className="speech-bubble">@!#?@!</div>
                )}

                {isGameOver && (
                    <div className="game-over-panel">
                        <button onClick={() => window.location.reload()}>TRY AGAIN</button>
                    </div>
                )}
            </div>

            <MobileControls onMove={move} />
        </div>
    );
};

export default PyramidGrid;

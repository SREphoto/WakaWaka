import React, { useState, useCallback, useMemo, useRef } from 'react';
import { getIsometricPos } from '../utils/GameEngine';
import './IsometricGrid.css';
import './PyramidGrid.css';
import WakaBert from './WakaBert';
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
    state: 'gray' | 'gold' | 'blue';
}

interface PyramidGridProps {
    onStateUpdate: (state: { xp?: number; score?: number; level?: number; activePerks?: perk[] }) => void;
}

const PYRAMID_LAYERS = 5;

const PyramidGrid: React.FC<PyramidGridProps> = ({ onStateUpdate }) => {
    const [tiles, setTiles] = useState<PyramidTileData[]>(() => {
        const initialTiles: PyramidTileData[] = [];
        for (let h = 0; h < PYRAMID_LAYERS; h++) {
            const radius = PYRAMID_LAYERS - h - 1;
            for (let q = -radius; q <= radius; q++) {
                const rStart = Math.max(-radius, -q - radius);
                const rEnd = Math.min(radius, -q + radius);
                for (let r = rStart; r <= rEnd; r++) {
                    initialTiles.push({ q, r, h, state: 'gray' });
                }
            }
        }
        const startTile = initialTiles.find(t => t.q === 0 && t.r === 0 && t.h === PYRAMID_LAYERS - 1);
        if (startTile) startTile.state = 'gold';
        return initialTiles;
    });

    const [rotation, setRotation] = useState(0);
    const [isGameOver] = useState(false);
    const particlesRef = useRef<ParticleSystemRef>(null);

    const isValidPos = useCallback((q: number, r: number) => {
        return tiles.some(t => t.q === q && t.r === r);
    }, [tiles]);

    const handlePlayerMove = useCallback((q: number, r: number) => {
        if (isGameOver) return;
        sound.playHop();

        const possibleTiles = tiles.filter(t => t.q === q && t.r === r);
        if (possibleTiles.length === 0) return;

        const targetH = Math.max(...possibleTiles.map(t => t.h));

        setTiles(prev => {
            let painted = false;
            const next = prev.map(t => {
                if (t.q === q && t.r === r && t.h === targetH && t.state === 'gray') {
                    painted = true;
                    return { ...t, state: 'gold' as const };
                }
                return t;
            });
            if (painted) {
                onStateUpdate({ xp: 10 });
                const { x, y } = getIsometricPos(q, r);
                particlesRef.current?.emit(x + window.innerWidth / 2, y + window.innerHeight / 2 - targetH * 40 - 50, '#ffcc00', 5);
            }
            return next;
        });

        // Calculate angle and snap to nearest face (60 degrees)
        let angle = Math.atan2(r, q) * (180 / Math.PI);
        // Snap to nearest 60
        angle = Math.round(angle / 60) * 60;

        setRotation(-angle);

    }, [isGameOver, onStateUpdate, tiles]);

    const { q, r, isJumping, direction, move } = usePlayerMovement(handlePlayerMove, { speedMultiplier: 1.2, maxJumps: 1 }, isValidPos);

    const currentLayer = useMemo(() => {
        const possible = tiles.filter(t => t.q === q && t.r === r);
        return possible.length > 0 ? Math.max(...possible.map(t => t.h)) : 0;
    }, [q, r, tiles]);

    return (
        <div className="grid-container pyramid-theme">
            <div className="bg-mainframe"></div>
            <ParticleSystem ref={particlesRef} />
            <div className="grid-center pyramid-rotation" style={{ '--pyramid-rot': `${rotation}deg` } as React.CSSProperties}>
                {tiles.map((tile) => {
                    const { x, y } = getIsometricPos(tile.q, tile.r);
                    const z = tile.h * 40;
                    return (
                        <div key={`${tile.q}-${tile.r}-${tile.h}`}
                            className={`tile pyramid-tile ${tile.state}`}
                            style={{
                                '--pos-x': `${x}px`,
                                '--pos-y': `${y}px`,
                                '--pos-z': `${z}px`,
                                'zIndex': Math.floor(y + z + 2000)
                            } as React.CSSProperties}>
                            <div className="tile-side side-1"></div><div className="tile-side side-2"></div><div className="tile-side side-3"></div>
                            <div className="tile-side side-4"></div><div className="tile-side side-5"></div><div className="tile-side side-6"></div>
                            <div className="tile-top"></div>
                        </div>
                    );
                })}
                <div className="pyramid-player-wrapper" style={{ '--player-z': `${currentLayer * 40}px` } as React.CSSProperties}>
                    <WakaBert q={q} r={r} isJumping={isJumping} direction={direction} />
                </div>
            </div>
            <MobileControls onMove={move} />
        </div>
    );
};

export default PyramidGrid;

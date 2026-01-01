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
import type { PowerUp } from '../utils/PowerUpSystem';
import { POWER_UPS } from '../utils/PowerUpSystem';
import MobileControls from './MobileControls';
import PowerDiamond from './PowerDiamond';

interface VSTileData {
    q: number;
    r: number;
    state: 'gray' | 'player' | 'rival';
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
    const [diamondActive] = useState(true);
    const [diamondPos] = useState({ q: 0, r: 0 });
    const [currentPowerUp] = useState<PowerUp>(POWER_UPS[0]);
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

    useEffect(() => {
        if (isGameOver) return;
        const interval = setInterval(() => {
            setRivalPos(prev => {
                const targets = tiles.filter(t => t.state !== 'rival');
                if (targets.length === 0) return prev;

                let bestTarget = targets[0];
                let minDist = Infinity;
                targets.forEach(t => {
                    const dist = Math.abs(t.q - prev.q) + Math.abs(t.r - prev.r);
                    if (dist < minDist) {
                        minDist = dist;
                        bestTarget = t;
                    }
                });

                let dq = 0, dr = 0;
                if (bestTarget.q > prev.q) dq = 1;
                else if (bestTarget.q < prev.q) dq = -1;
                else if (bestTarget.r > prev.r) dr = 1;
                else if (bestTarget.r < prev.r) dr = -1;

                const nq = prev.q + dq;
                const nr = prev.r + dr;

                if (isValidPos(nq, nr)) {
                    setTiles(prevTiles => prevTiles.map(t =>
                        (t.q === nq && t.r === nr) ? { ...t, state: 'rival' as const } : t
                    ));
                    return { q: nq, r: nr };
                }
                return prev;
            });
        }, 500);
        return () => clearInterval(interval);
    }, [isGameOver, tiles, isValidPos]);

    const handlePlayerMove = useCallback((q: number, r: number) => {
        if (isGameOver) return;
        sound.playHop();
        setTiles(prev => {
            let painted = false;
            const next = prev.map(t => {
                if (t.q === q && t.r === r && t.state !== 'player') {
                    painted = true;
                    return { ...t, state: 'player' as const };
                }
                return t;
            });
            if (painted) {
                onStateUpdate({ xp: 10 });
                const { x, y } = getIsometricPos(q, r);
                particlesRef.current?.emit(x + window.innerWidth / 2, y + window.innerHeight / 2 - 50, '#ffcc00', 5);
            }
            return next;
        });

        if (tiles.every(t => t.state !== 'gray')) {
            setWinner(counts.pCount >= counts.rCount ? 'player' : 'rival');
            setIsGameOver(true);
        }
    }, [isGameOver, onStateUpdate, tiles, counts.pCount, counts.rCount]);

    const { q, r, isJumping, direction, move } = usePlayerMovement(handlePlayerMove, { speedMultiplier: 1.0, maxJumps: 1 }, isValidPos);

    const rivalScreenPos = useMemo(() => getIsometricPos(rivalPos.q, rivalPos.r), [rivalPos]);

    return (
        <div className="grid-container vs-theme">
            <div className="bg-mainframe"></div>
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
                        <div key={`${tile.q}-${tile.r}`} className={`tile ${stateClass}`} style={{
                            '--pos-x': `${x}px`,
                            '--pos-y': `${y}px`,
                            'zIndex': Math.floor(y + 1000)
                        } as React.CSSProperties}>
                            <div className="tile-side side-1"></div><div className="tile-side side-2"></div><div className="tile-side side-3"></div>
                            <div className="tile-side side-4"></div><div className="tile-side side-5"></div><div className="tile-side side-6"></div>
                            <div className="tile-top"></div>
                        </div>
                    );
                })}
                <WakaBert q={q} r={r} isJumping={isJumping} direction={direction} />
                <div className="rival-bert" style={{
                    '--rival-x': `${rivalScreenPos.x}px`,
                    '--rival-y': `${rivalScreenPos.y}px`,
                    'zIndex': Math.floor(rivalScreenPos.y) + 2000
                } as React.CSSProperties}>
                    <WakaBert q={0} r={0} isJumping={false} direction="up" />
                </div>
                <PowerDiamond q={diamondPos.q} r={diamondPos.r} active={diamondActive} powerUp={currentPowerUp} />
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

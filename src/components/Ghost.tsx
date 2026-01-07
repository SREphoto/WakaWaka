import React, { useEffect, useState, useCallback } from 'react';
import { getIsometricPos } from '../utils/GameEngine';
import './Ghost.css';

interface GhostProps {
    id: string;
    type: 'red' | 'green' | 'pink' | 'blue' | 'gold';
    playerPos: { q: number; r: number };
    isVulnerable?: boolean;
    onCollision?: (pos: { q: number, r: number }, isVulnerable: boolean, ghostId: string) => void;
    onPosChange?: (id: string, q: number, r: number) => void;
    isValidPos?: (q: number, r: number) => boolean;
    getZ?: (q: number, r: number) => number;
    speedMultiplier?: number;
}

const Ghost: React.FC<GhostProps> = ({ id, type, playerPos, isVulnerable, onCollision, onPosChange, isValidPos, getZ, speedMultiplier = 1 }) => {
    const [pos, setPos] = useState({ q: id === 'red' ? 5 : -5, r: id === 'red' ? 0 : 0 });
    const [lastMove, setLastMove] = useState<'left' | 'right' | 'up' | 'down'>('down');

    const moveTowardPlayer = useCallback(() => {
        setPos((prev) => {
            let targetQ = playerPos.q;
            let targetR = playerPos.r;

            // AI Behaviors
            if (type === 'pink') { // Ambusher: Target ahead of player
                // Need player direction to do this properly, for now target a bit chaotically
                targetQ += (Math.random() < 0.5 ? 4 : -4);
                targetR += (Math.random() < 0.5 ? 4 : -4);
            } else if (type === 'blue') { // Patroller: Prefers edges
                // Simple patrol: if near center, move out. if near edge, move random.
                if (Math.abs(prev.q) < 3 && Math.abs(prev.r) < 3) {
                    targetQ = prev.q > 0 ? 6 : -6;
                } else {
                    targetQ = (Math.random() * 10) - 5;
                    targetR = (Math.random() * 10) - 5;
                }
            } else if (type === 'gold') { // Fleeing
                // Target is opposite of player
                targetQ = prev.q + (prev.q - playerPos.q);
                targetR = prev.r + (prev.r - playerPos.r);
            }
            // Red is default (Chaser): Targets playerPos directly

            let dq = 0;
            let dr = 0;

            if (isVulnerable && type !== 'gold') { // All run except Gold (who always runs effectively)
                // Invert target for fleeing logic
                if (prev.q < playerPos.q) dq = -1;
                else if (prev.q > playerPos.q) dq = 1;
                if (prev.r < playerPos.r) dr = -1;
                else if (prev.r > playerPos.r) dr = 1;
            } else {
                // Normal pathfinding towards target
                if (prev.q < targetQ) dq = 1;
                else if (prev.q > targetQ) dq = -1;
                if (prev.r < targetR) dr = 1;
                else if (prev.r > targetR) dr = -1;
            }

            if (dq !== 0 && dr !== 0) {
                if (Math.random() > 0.5) dr = 0;
                else dq = 0;
            }

            const nextQ = prev.q + dq;
            const nextR = prev.r + dr;

            if (isValidPos && !isValidPos(nextQ, nextR)) return prev;

            if (dq > 0) setLastMove('right');
            else if (dq < 0) setLastMove('left');
            else if (dr > 0) setLastMove('down');
            else if (dr < 0) setLastMove('up');

            return { q: nextQ, r: nextR };
        });
    }, [playerPos, isVulnerable, isValidPos, type]);

    useEffect(() => {
        const baseSpeed = type === 'red' ? 800 : 1200;
        const speed = baseSpeed / speedMultiplier;
        const interval = setInterval(moveTowardPlayer, isVulnerable ? speed * 1.5 : speed);
        return () => clearInterval(interval);
    }, [moveTowardPlayer, type, isVulnerable, speedMultiplier]);

    useEffect(() => {
        console.log(`Ghost ${id} reporting pos: ${pos.q}, ${pos.r}`);
        if (onPosChange) {
            onPosChange(id, pos.q, pos.r);
        }
        if (onCollision) {
            onCollision(pos, !!isVulnerable, id);
        }
    }, [pos, onCollision, onPosChange, isVulnerable, id]);

    const z = getZ ? getZ(pos.q, pos.r) : 0;
    const { x, y } = getIsometricPos(pos.q, pos.r);

    return (
        <div
            className={`ghost ${isVulnerable ? 'vulnerable' : type} face-${lastMove}`}
            style={{
                '--pos-x': `${x}px`,
                '--pos-y': `${y}px`,
                '--pos-z': `${z}px`,
                '--z-index': Math.floor(y + z) + 1800,
            } as React.CSSProperties}
        >
            <div className="ghost-container-3d">
                <div className="ghost-body-3d">
                    <div className="face front"></div>
                    <div className="face back"></div>
                    <div className="face left"></div>
                    <div className="face right"></div>
                    <div className="face top"></div>

                    <div className="ghost-eyes-3d">
                        <div className="eye-p white"></div>
                        <div className="eye-p white"></div>
                    </div>
                </div>
            </div>
            <div className="ghost-shadow-3d"></div>
        </div>
    );
};

export default Ghost;

import React, { useEffect, useState, useCallback } from 'react';
import { getIsometricPos } from '../utils/GameEngine';
import './Ghost.css';

interface GhostProps {
    id: string;
    type: 'red' | 'green';
    playerPos: { q: number; r: number };
    isVulnerable?: boolean;
    onCollision?: (pos: { q: number, r: number }, isVulnerable: boolean, ghostId: string) => void;
    isValidPos?: (q: number, r: number) => boolean;
}

const Ghost: React.FC<GhostProps> = ({ id, type, playerPos, isVulnerable, onCollision, isValidPos }) => {
    const [pos, setPos] = useState({ q: id === 'red' ? 5 : -5, r: id === 'red' ? 0 : 0 });
    const [lastMove, setLastMove] = useState<'left' | 'right' | 'up' | 'down'>('down');

    const moveTowardPlayer = useCallback(() => {
        setPos((prev) => {
            let dq = 0;
            let dr = 0;

            if (isVulnerable) {
                if (prev.q < playerPos.q) dq = -1;
                else if (prev.q > playerPos.q) dq = 1;
                if (prev.r < playerPos.r) dr = -1;
                else if (prev.r > playerPos.r) dr = 1;
            } else {
                if (prev.q < playerPos.q) dq = 1;
                else if (prev.q > playerPos.q) dq = -1;
                if (prev.r < playerPos.r) dr = 1;
                else if (prev.r > playerPos.r) dr = -1;
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
    }, [playerPos, isVulnerable, isValidPos]);

    useEffect(() => {
        const speed = type === 'red' ? 800 : 1200;
        const interval = setInterval(moveTowardPlayer, isVulnerable ? speed * 1.5 : speed);
        return () => clearInterval(interval);
    }, [moveTowardPlayer, type, isVulnerable]);

    useEffect(() => {
        if (onCollision) {
            onCollision(pos, !!isVulnerable, id);
        }
    }, [pos, onCollision, isVulnerable, id]);

    const { x, y } = getIsometricPos(pos.q, pos.r);

    return (
        <div
            className={`ghost ${isVulnerable ? 'vulnerable' : type} face-${lastMove}`}
            style={{
                '--pos-x': `${x}px`,
                '--pos-y': `${y}px`,
                '--z-index': Math.floor(y) + 1800,
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

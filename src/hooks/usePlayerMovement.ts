import { useState, useEffect, useCallback, useRef } from 'react';

interface MovementConfig {
    speedMultiplier: number; // 1.0 is default
    maxJumps: number; // 1 is default
}

export const usePlayerMovement = (
    onMove?: (q: number, r: number) => void,
    config: MovementConfig = { speedMultiplier: 1, maxJumps: 1 },
    isValidPos?: (q: number, r: number) => boolean
) => {
    const [pos, setPos] = useState({ q: 0, r: 0 });
    const [direction, setDirection] = useState<'left' | 'right' | 'up' | 'down'>('down');
    const [isJumping, setIsJumping] = useState(false);
    const jumpCount = useRef(0);
    const cooldownRef = useRef(false);

    const jumpDuration = 150;
    const cooldownTime = Math.max(20, 150 / config.speedMultiplier);

    const move = useCallback((dq: number, dr: number) => {
        if (cooldownRef.current) return;
        if (isJumping && jumpCount.current >= config.maxJumps) return;

        setPos((prev) => {
            const nq = prev.q + dq;
            const nr = prev.r + dr;

            // Use the validation callback if provided
            if (isValidPos && !isValidPos(nq, nr)) return prev;

            if (nq !== prev.q || nr !== prev.r) {
                if (dq > 0) setDirection('right');
                else if (dq < 0) setDirection('left');
                else if (dr > 0) setDirection('down');
                else if (dr < 0) setDirection('up');

                setIsJumping(true);
                jumpCount.current += 1;
                cooldownRef.current = true;

                setTimeout(() => setIsJumping(false), jumpDuration);
                setTimeout(() => {
                    cooldownRef.current = false;
                    if (!isJumping) jumpCount.current = 0;
                }, cooldownTime);

                if (onMove) onMove(nq, nr);
                return { q: nq, r: nr };
            }
            return prev;
        });
    }, [isJumping, onMove, config.maxJumps, cooldownTime, isValidPos]);

    useEffect(() => {
        if (!isJumping && !cooldownRef.current) {
            jumpCount.current = 0;
        }
    }, [isJumping]);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            const keys = ['ArrowUp', 'w', 'ArrowDown', 's', 'ArrowLeft', 'a', 'ArrowRight', 'd'];
            if (!keys.includes(e.key)) return;
            e.preventDefault(); // Prevent scrolling

            switch (e.key) {
                case 'ArrowUp':
                case 'w': move(0, -1); break;
                case 'ArrowDown':
                case 's': move(0, 1); break;
                case 'ArrowLeft':
                case 'a': move(-1, 0); break;
                case 'ArrowRight':
                case 'd': move(1, 0); break;
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [move]);

    const teleport = useCallback((q: number, r: number) => {
        setPos({ q, r });
        if (onMove) onMove(q, r);
    }, [onMove]);

    return { ...pos, isJumping, direction, move, teleport };
};

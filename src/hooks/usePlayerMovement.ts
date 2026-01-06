import { useState, useEffect, useCallback, useRef } from 'react';

interface MovementConfig {
    speedMultiplier: number; // 1.0 is default
    maxJumps: number; // 1 is default
}

interface PathNode {
    q: number;
    r: number;
    parent?: PathNode;
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
    const pathQueueRef = useRef<{ q: number, r: number }[]>([]);
    const [isAutoMoving, setIsAutoMoving] = useState(false);

    const jumpDuration = 150;
    const cooldownTime = Math.max(20, 150 / config.speedMultiplier);

    const move = useCallback((dq: number, dr: number) => {
        if (cooldownRef.current) return;
        if (isJumping && jumpCount.current >= config.maxJumps) return;

        setPos((prev) => {
            const nq = prev.q + dq;
            const nr = prev.r + dr;

            // Use the validation callback if provided
            if (isValidPos && !isValidPos(nq, nr)) {
                // If auto-moving and hit a wall, stop
                pathQueueRef.current = [];
                setIsAutoMoving(false);
                return prev;
            }

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

    // Path Following Effect
    useEffect(() => {
        if (pathQueueRef.current.length === 0) {
            if (isAutoMoving) setIsAutoMoving(false);
            return;
        }

        if (!isJumping && !cooldownRef.current) {
            const nextStep = pathQueueRef.current.shift();
            if (nextStep) {
                const dq = nextStep.q - pos.q;
                const dr = nextStep.r - pos.r;
                move(dq, dr);
                setIsAutoMoving(true);
            }
        }
    }, [isJumping, pos, move, isAutoMoving]);


    const moveTo = useCallback((targetQ: number, targetR: number) => {
        if (!isValidPos) return;

        // BFS to find path
        const queue: PathNode[] = [{ q: pos.q, r: pos.r }];
        const visited = new Set<string>();
        visited.add(`${pos.q},${pos.r}`);

        let foundNode: PathNode | null = null;

        // Safety break
        let iterations = 0;

        while (queue.length > 0 && iterations < 1000) {
            iterations++;
            const current = queue.shift()!;

            if (current.q === targetQ && current.r === targetR) {
                foundNode = current;
                break;
            }

            const neighbors = [
                { dq: 0, dr: -1 }, { dq: 1, dr: -1 }, { dq: 1, dr: 0 },
                { dq: 0, dr: 1 }, { dq: -1, dr: 1 }, { dq: -1, dr: 0 }
            ];

            for (const { dq, dr } of neighbors) {
                const nq = current.q + dq;
                const nr = current.r + dr;
                const key = `${nq},${nr}`;

                if (!visited.has(key) && isValidPos(nq, nr)) {
                    visited.add(key);
                    queue.push({ q: nq, r: nr, parent: current });
                }
            }
        }

        if (foundNode) {
            const path: { q: number, r: number }[] = [];
            let curr: PathNode | undefined = foundNode;
            while (curr && curr.parent) {
                path.unshift({ q: curr.q, r: curr.r });
                curr = curr.parent;
            }
            pathQueueRef.current = path;
            // Trigger the effect immediately if possible
            if (!isJumping && !cooldownRef.current && path.length > 0) {
                const nextStep = pathQueueRef.current.shift();
                if (nextStep) {
                    const dq = nextStep.q - pos.q;
                    const dr = nextStep.r - pos.r;
                    move(dq, dr);
                    setIsAutoMoving(true);
                }
            }
        }

    }, [pos, isValidPos, move, isJumping]);


    useEffect(() => {
        if (!isJumping && !cooldownRef.current) {
            jumpCount.current = 0;
        }
    }, [isJumping]);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            const keys = ['ArrowUp', 'w', 'ArrowDown', 's', 'ArrowLeft', 'a', 'ArrowRight', 'd'];
            if (!keys.includes(e.key)) return;
            // e.preventDefault(); // allow default usage for accessibility, prevent if game active? 
            // Better to rely on focus, but for now keeping preventing default to stop page scroll
            if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].indexOf(e.code) > -1) {
                e.preventDefault();
            }

            // Cancel auto-move on manual input
            if (pathQueueRef.current.length > 0) {
                pathQueueRef.current = [];
                setIsAutoMoving(false);
            }

            switch (e.key) {
                // North-East / Up-Right Visual
                case 'ArrowUp':
                case 'w': move(1, -1); break;

                // South-West / Down-Left Visual
                case 'ArrowDown':
                case 's': move(-1, 1); break;

                // North-West / Up-Left Visual
                case 'ArrowLeft':
                case 'a': move(0, -1); break;

                // South-East / Down-Right Visual
                case 'ArrowRight':
                case 'd': move(0, 1); break;
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [move]);

    const teleport = useCallback((q: number, r: number) => {
        setPos({ q, r });
        pathQueueRef.current = []; // Clear path on teleport
        if (onMove) onMove(q, r);
    }, [onMove]);

    return { ...pos, isJumping, direction, move, teleport, moveTo };
};

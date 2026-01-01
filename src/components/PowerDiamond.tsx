import React from 'react';
import { getIsometricPos } from '../utils/GameEngine';
import './PowerDiamond.css';
import { PowerUp } from '../utils/PowerUpSystem';

interface PowerDiamondProps {
    q: number;
    r: number;
    active: boolean;
    powerUp?: PowerUp;
}

const PowerDiamond: React.FC<PowerDiamondProps> = ({ q, r, active, powerUp }) => {
    if (!active) return null;

    const { x, y } = getIsometricPos(q, r);

    return (
        <div
            className={`power-diamond ${powerUp?.type || 'classic'}`}
            style={{
                '--pos-x': `${x}px`,
                '--pos-y': `${y}px`,
                '--z-index': Math.floor(y) + 1500,
            } as React.CSSProperties}
        >
            <div className="diamond-shape">
                <span className="powerup-icon">{powerUp?.icon || '💎'}</span>
            </div>
            <div className="diamond-glow"></div>
            <div className="diamond-ring"></div>
        </div>
    );
};

export default PowerDiamond;

import React from 'react';
import { getIsometricPos } from '../utils/GameEngine';
import './PowerDiamond.css';

interface PowerDiamondProps {
    q: number;
    r: number;
    active: boolean;
}

const PowerDiamond: React.FC<PowerDiamondProps> = ({ q, r, active }) => {
    if (!active) return null;

    const { x, y } = getIsometricPos(q, r);

    return (
        <div
            className="power-diamond"
            style={{
                '--pos-x': `${x}px`,
                '--pos-y': `${y}px`,
                '--z-index': Math.floor(y) + 5,
            } as React.CSSProperties}
        >
            <div className="diamond-shape"></div>
            <div className="diamond-glow"></div>
        </div>
    );
};

export default PowerDiamond;

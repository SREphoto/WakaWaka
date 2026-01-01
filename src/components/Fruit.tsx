import React from 'react';
import { getIsometricPos } from '../utils/GameEngine';
import './Fruit.css';

interface FruitProps {
    pos: { q: number; r: number };
    type: 'cherry' | 'strawberry' | 'orange';
}

const Fruit: React.FC<FruitProps> = ({ pos, type }) => {
    const { x, y } = getIsometricPos(pos.q, pos.r);

    const icons = {
        cherry: '🍒',
        strawberry: '🍓',
        orange: '🍊'
    };

    return (
        <div
            className={`fruit-container ${type}`}
            style={{
                '--pos-x': `${x}px`,
                '--pos-y': `${y}px`,
                '--z-axis': Math.floor(y) + 1500,
            } as React.CSSProperties}
        >
            <div className="fruit-sprite">{icons[type]}</div>
            <div className="fruit-glow"></div>
        </div>
    );
};

export default Fruit;

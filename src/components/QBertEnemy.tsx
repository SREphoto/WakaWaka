import React from 'react';
import { getIsometricPos } from '../utils/GameEngine';
import './QBertEnemy.css';

interface QBertEnemyProps {
    id: string;
    type: 'red_ball' | 'purple_ball' | 'coily_snake' | 'slick' | 'sam';
    q: number;
    r: number;
    isJumping: boolean;
    zIndex: number;
}

const QBertEnemy: React.FC<QBertEnemyProps> = ({ type, q, r, isJumping, zIndex }) => {
    const { x, y } = getIsometricPos(q, r);

    return (
        <div
            className={`qbert-enemy ${type} ${isJumping ? 'jumping' : ''}`}
            style={{
                '--pos-x': `${x}px`,
                '--pos-y': `${y}px`,
                'zIndex': zIndex + 2000,
            } as React.CSSProperties}
        >
            <div className="enemy-sprite">
                {/* Visuals for different enemies */}
                {type.includes('ball') && <div className="ball-shape"></div>}

                {type === 'coily_snake' && (
                    <div className="snake-body">
                        <div className="snake-head">
                            <div className="snake-eye left"></div><div className="snake-eye right"></div>
                        </div>
                        <div className="snake-coils"></div>
                    </div>
                )}

                {(type === 'slick' || type === 'sam') && (
                    <div className="gremlin-body">
                        <div className="gremlin-glasses"></div>
                    </div>
                )}
            </div>
            <div className="enemy-shadow"></div>
        </div>
    );
};

export default QBertEnemy;

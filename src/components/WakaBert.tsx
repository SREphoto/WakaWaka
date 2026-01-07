import React from 'react';
import { getIsometricPos } from '../utils/GameEngine';
import './WakaBert.css';

interface WakaBertProps {
    q: number;
    r: number;
    z?: number; // Added z-height prop
    isJumping: boolean;
    direction?: 'left' | 'right' | 'up' | 'down';
}

const WakaBert: React.FC<WakaBertProps> = ({ q, r, z = 0, isJumping, direction = 'down' }) => {
    const { x, y } = getIsometricPos(q, r);

    return (
        <div
            className={`wakabert ${isJumping ? 'jumping' : ''} face-${direction}`}
            style={{
                '--pos-x': `${x}px`,
                '--pos-y': `${y}px`,
                // Incorporate Z into position and layering
                '--pos-z': `${z}px`,
                '--z-index': Math.floor(y + z) + 2000,
            } as React.CSSProperties}
        >
            <div className="wakabert-container">
                <div className="wakabert-body-3d">
                    <div className="face front"></div>
                    <div className="face back"></div>
                    <div className="face left"></div>
                    <div className="face right"></div>
                    <div className="face top"></div>
                    <div className="face bottom"></div>

                    <div className="eyes-3d">
                        <div className="eye-3d left"></div>
                        <div className="eye-3d right"></div>
                    </div>
                </div>
            </div>
            <div className="wakabert-shadow"></div>
        </div>
    );
};

export default WakaBert;

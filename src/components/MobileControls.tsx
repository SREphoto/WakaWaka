import React from 'react';
import './MobileControls.css';

interface MobileControlsProps {
    onMove: (dq: number, dr: number) => void;
}

const MobileControls: React.FC<MobileControlsProps> = ({ onMove }) => {
    return (
        <div className="mobile-controls">
            <div className="dpad">
                <button className="dpad-btn up" onClick={() => onMove(0, -1)}>
                    <span className="arrow">▲</span>
                </button>
                <div className="dpad-mid">
                    <button className="dpad-btn left" onClick={() => onMove(-1, 0)}>
                        <span className="arrow">◀</span>
                    </button>
                    <div className="dpad-center"></div>
                    <button className="dpad-btn right" onClick={() => onMove(1, 0)}>
                        <span className="arrow">▶</span>
                    </button>
                </div>
                <button className="dpad-btn down" onClick={() => onMove(0, 1)}>
                    <span className="arrow">▼</span>
                </button>
            </div>
        </div>
    );
};

export default MobileControls;

import React from 'react';
import './GameHUD.css';
import type { perk } from '../utils/ProgressionSystem';

interface GameHUDProps {
    score: number;
    level: number;
    xp: number;
    xpNext: number;
    activePerks?: perk[];
}

const GameHUD: React.FC<GameHUDProps> = ({ score, level, xp, xpNext, activePerks = [] }) => {
    const xpPercent = Math.min(100, (xp / xpNext) * 100);

    return (
        <header className="game-hud glass-panel">
            <div className="hud-left">
                <div className="hud-item">
                    <span className="label">SCORE</span>
                    <span className="value neon-text-gold">{score.toString().padStart(5, '0')}</span>
                </div>
                <div className="hud-item">
                    <span className="label">LVL</span>
                    <span className="value">{level}</span>
                </div>
            </div>

            <div className="hud-center xp-bar-container">
                <div className="xp-bar">
                    <div className="xp-fill" style={{ '--xp-width': `${xpPercent}%` } as React.CSSProperties}></div>
                    <span className="xp-text">{xp} / {xpNext} XP</span>
                </div>
            </div>

            <div className="hud-right">
                <div className="perks-display">
                    {activePerks.map((perk, i) => (
                        <div key={perk.id + i} className={`active-perk ${perk.class}`} title={perk.description}>
                            {perk.icon}
                        </div>
                    ))}
                </div>
            </div>
        </header>
    );
};

export default GameHUD;

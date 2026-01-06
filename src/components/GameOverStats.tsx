import React, { useEffect } from 'react';
import './GameOverStats.css';
// import { sound } from '../utils/SoundEngine';

interface GameOverStatsProps {
    score: number;
    level: number;
    maxCombo: number;
    onRestart: () => void;
}

const GameOverStats: React.FC<GameOverStatsProps> = ({ score, level, maxCombo, onRestart }) => {
    useEffect(() => {
        // Play game over sound sequence on mount
        // sound.playDefeat(); // Assuming existed or just use built-in death logic
    }, []);

    return (
        <div className="game-over-stats-overlay">
            <div className="stats-container">
                <h1 className="neon-text-red">SYSTEM TERMINATED</h1>

                <div className="stats-grid">
                    <div className="stat-item">
                        <span className="stat-label">SCORE</span>
                        <span className="stat-value neon-blue">{score.toLocaleString()}</span>
                    </div>
                    <div className="stat-item">
                        <span className="stat-label">LEVEL</span>
                        <span className="stat-value neon-gold">{level}</span>
                    </div>
                    <div className="stat-item">
                        <span className="stat-label">MAX COMBO</span>
                        <span className="stat-value neon-pink">x{maxCombo}</span>
                    </div>
                </div>

                <div className="action-area">
                    <button className="restart-btn" onClick={onRestart}>
                        REBOOT SYSTEM
                    </button>
                    <p className="restart-hint">Press R to Quick Restart</p>
                </div>
            </div>
        </div>
    );
};

export default GameOverStats;

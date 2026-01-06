import React from 'react';
import './TutorialOverlay.css';
import { sound } from '../utils/SoundEngine';

interface TutorialOverlayProps {
    onDismiss: () => void;
}

const TutorialOverlay: React.FC<TutorialOverlayProps> = ({ onDismiss }) => {
    return (
        <div className="tutorial-overlay" onClick={() => {
            sound.playHop();
            onDismiss();
        }}>
            <div className="tutorial-content" onClick={e => e.stopPropagation()}>
                <h2 className="tutorial-title">HOW TO PLAY</h2>

                <div className="tutorial-step">
                    <div className="icon-swipe">👆</div>
                    <div className="text-content">
                        <h3>MOVE</h3>
                        <p>Swipe or use Arrow Keys to hop.</p>
                    </div>
                </div>

                <div className="tutorial-step">
                    <div className="tile-demo gold"></div>
                    <div className="text-content">
                        <h3>PAINT IT GOLD</h3>
                        <p>Hop on every grey tile to clear the level.</p>
                    </div>
                </div>

                <div className="tutorial-step">
                    <div className="ghost-demo red"></div>
                    <div className="text-content">
                        <h3>AVOID GHOSTS</h3>
                        <p>Don't let them touch you!</p>
                    </div>
                </div>

                <button className="start-btn" onClick={() => {
                    sound.playPowerUp();
                    onDismiss();
                }}>
                    INITIALIZE MISSION
                </button>
            </div>
        </div>
    );
};

export default TutorialOverlay;

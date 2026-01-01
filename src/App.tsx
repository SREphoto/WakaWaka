import { useState, useMemo, useEffect } from 'react';
import './App.css';
import IsometricGrid from './components/IsometricGrid';
import GameHUD from './components/GameHUD';
import type { perk } from './utils/ProgressionSystem';
import { getXPForLevel } from './utils/ProgressionSystem';
import { music } from './utils/AudioSystem';

function App() {
  const [gameState, setGameState] = useState({
    score: 0,
    level: 1,
    xp: 0,
    activePerks: [] as perk[]
  });

  const xpNext = useMemo(() => getXPForLevel(gameState.level), [gameState.level]);

  useEffect(() => {
    music.setIntensity(gameState.level);
  }, [gameState.level]);

  const handleInteraction = () => {
    music.start();
  };

  return (
    <div className="app-container" onClick={handleInteraction}>
      <div className="vignette"></div>
      <div className="synth-sun"></div>
      <div className="synth-grid"></div>

      <GameHUD {...gameState} xpNext={xpNext} />

      <main className="game-area">
        <IsometricGrid
          onStateUpdate={(state: Partial<typeof gameState>) => setGameState(prev => {
            const nextXp = prev.xp + (state.xp || 0);
            const nextLevel = state.level || prev.level;
            const nextPerks = state.activePerks || prev.activePerks;

            // Central Score Logic
            const scoreGain = (state.xp || 0) * 10;

            return {
              ...prev,
              xp: (state.level && state.level > prev.level) ? 0 : nextXp,
              level: nextLevel,
              activePerks: nextPerks,
              score: prev.score + scoreGain
            };
          })}
        />
      </main>

      <footer className="game-footer">
        <p>Use Arrow Keys or WASD to Move • Level {gameState.level} • {gameState.activePerks.length} Perks Active • CLICK TO START AUDIO</p>
      </footer>
    </div>
  );
}

export default App;

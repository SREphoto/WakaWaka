import { useState, useMemo, useEffect } from 'react';
import './App.css';
import IsometricGrid from './components/IsometricGrid';
import GameHUD from './components/GameHUD';
import type { perk } from './utils/ProgressionSystem';
import { getXPForLevel } from './utils/ProgressionSystem';
import { music } from './utils/AudioSystem';

export type GameMode = 'classic' | 'tilt' | 'pyramid' | 'vs';

function App() {
  const [mode, setMode] = useState<GameMode | null>(null);
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

  const handleModeSelect = (selectedMode: GameMode) => {
    setMode(selectedMode);
    handleInteraction();
  };

  if (!mode) {
    return (
      <div className="app-container" onClick={handleInteraction}>
        <div className="vignette"></div>
        <div className="synth-sun"></div>
        <div className="synth-grid"></div>

        <div className="mode-select-screen glass-panel">
          <h1 className="neon-text-blue main-title">WAKA-WAKA ARENA</h1>
          <p className="subtitle">SELECT YOUR CHALLENGE</p>

          <div className="mode-grid">
            <button onClick={() => handleModeSelect('classic')} className="mode-card neon-border-blue">
              <span className="mode-icon">🕹️</span>
              <h3>CLASSIC</h3>
              <p>Traditional hexagon painting arena.</p>
            </button>
            <button onClick={() => handleModeSelect('tilt')} className="mode-card neon-border-gold">
              <span className="mode-icon">⚖️</span>
              <h3>TILT</h3>
              <p>Physics-based balance. Don't tip the board!</p>
            </button>
            <button onClick={() => handleModeSelect('pyramid')} className="mode-card neon-border-purple">
              <span className="mode-icon">🔺</span>
              <h3>PYRAMID</h3>
              <p>3D Rotational climbing challenge.</p>
            </button>
            <button onClick={() => handleModeSelect('vs')} className="mode-card neon-border-red">
              <span className="mode-icon">⚔️</span>
              <h3>VS MODE</h3>
              <p>Clash against the Cyber-Rival.</p>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="app-container" onClick={handleInteraction}>
      <div className="vignette"></div>
      <div className="synth-sun"></div>
      <div className="synth-grid"></div>

      <GameHUD {...gameState} xpNext={xpNext} />
      <div className="current-mode-label">{mode.toUpperCase()} MODE</div>

      <main className="game-area">
        <IsometricGrid
          mode={mode}
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

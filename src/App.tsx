import { useState, useMemo, useEffect } from 'react';
import './App.css';
import IsometricGrid from './components/IsometricGrid';
import PyramidGrid from './components/PyramidGrid';
import VSGrid from './components/VSGrid';
import WakaWakaGrid from './components/WakaWakaGrid';
import TesseractGrid from './components/TesseractGrid';
import GameHUD from './components/GameHUD';
import type { perk } from './utils/ProgressionSystem';
import { getXPForLevel } from './utils/ProgressionSystem';
import { music } from './utils/AudioSystem';

export type GameMode = 'classic' | 'tilt' | 'pyramid' | 'vs' | 'waka_waka' | 'tesseract';

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

  const onStateUpdate = (state: Partial<typeof gameState>) => setGameState(prev => {
    const nextXp = prev.xp + (state.xp || 0);
    const nextLevel = state.level || prev.level;
    const nextPerks = state.activePerks || prev.activePerks;

    const scoreGain = (state.xp || 0) * 10;

    return {
      ...prev,
      xp: (state.level && state.level > prev.level) ? 0 : nextXp,
      level: nextLevel,
      activePerks: nextPerks,
      score: prev.score + scoreGain
    };
  });

  if (!mode) {
    return (
      <div className="app-container" onClick={handleInteraction}>
        <div className="vignette"></div>
        <div className="synth-sun"></div>
        <div className="synth-grid"></div>

        <div className="mode-selection-overlay">
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
                <p>Physics-based balance challenge.</p>
              </button>
              <button onClick={() => handleModeSelect('pyramid')} className="mode-card neon-border-purple">
                <span className="mode-icon">🔺</span>
                <h3>PYRAMID</h3>
                <p>3D Rotational climbing.</p>
              </button>
              <button onClick={() => handleModeSelect('vs')} className="mode-card neon-border-red">
                <span className="mode-icon">⚔️</span>
                <h3>VS MODE</h3>
                <p>Clash against the Rival AI.</p>
              </button>
              <button onClick={() => handleModeSelect('waka_waka')} className="mode-card neon-border-waka">
                <span className="mode-icon">🍒</span>
                <h3>WAKA WAKA</h3>
                <p>Ms. Pac-Man x Q-Bert Fusion.</p>
              </button>
              <button onClick={() => handleModeSelect('tesseract')} className="mode-card neon-border-4d">
                <span className="mode-icon">🌀</span>
                <h3>TESSERACT</h3>
                <p>4D Hyper-Cube Arena. Morphing geometry.</p>
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const renderGameMode = () => {
    switch (mode) {
      case 'pyramid': return <PyramidGrid onStateUpdate={onStateUpdate} />;
      case 'vs': return <VSGrid onStateUpdate={onStateUpdate} />;
      case 'waka_waka': return <WakaWakaGrid onStateUpdate={onStateUpdate} />;
      case 'tesseract': return <TesseractGrid onStateUpdate={onStateUpdate} />;
      default: return <IsometricGrid mode={mode} onStateUpdate={onStateUpdate} />;
    }
  };

  return (
    <div className="app-container" onClick={handleInteraction}>
      <div className="vignette"></div>
      <div className="synth-sun"></div>
      <div className="synth-grid"></div>

      <GameHUD {...gameState} xpNext={xpNext} />
      <div className="current-mode-label">{mode.replace('_', ' ').toUpperCase()} MODE</div>

      <main className="game-area">
        {renderGameMode()}
      </main>

      <footer className="game-footer">
        <div className="footer-content glass-panel">
          <p>Use Arrow Keys or WASD to Move • Level {gameState.level}</p>
          <button className="exit-menu-btn neon-border-red" onClick={() => setMode(null)}>
            EXIT TO MENU
          </button>
        </div>
      </footer>
    </div>
  );
}

export default App;

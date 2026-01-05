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
type ViewState = 'splash' | 'picker' | 'game';

function App() {
  const [view, setView] = useState<ViewState>('splash');
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

  const handleStart = () => {
    handleInteraction();
    setView('picker');
  };

  const handleModeSelect = (selectedMode: GameMode) => {
    setMode(selectedMode);
    handleInteraction();
    setView('game');
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

  const renderGameMode = () => {
    switch (mode) {
      case 'pyramid': return <PyramidGrid onStateUpdate={onStateUpdate} />;
      case 'vs': return <VSGrid onStateUpdate={onStateUpdate} />;
      case 'waka_waka': return <WakaWakaGrid onStateUpdate={onStateUpdate} />;
      case 'tesseract': return <TesseractGrid onStateUpdate={onStateUpdate} />;
      default: return <IsometricGrid mode={mode || 'classic'} onStateUpdate={onStateUpdate} />;
    }
  };

  return (
    <div className="app-container" onClick={handleInteraction}>
      {/* Background is now clean via CSS, no extra divs needed here */}

      {view === 'splash' && (
        <div className="splash-screen" onClick={handleStart}>
          <h1 className="splash-title neon-text-blue">WAKA-WAKA<br />ARENA</h1>
          <p className="splash-subtitle">TAP TO START</p>
        </div>
      )}

      {view === 'picker' && (
        <div className="picker-modal-overlay">
          <div className="picker-modal glass-panel">
            <h2 className="picker-title neon-text-blue">SELECT ARENA</h2>
            <div className="mode-grid-compact">
              <button onClick={() => handleModeSelect('classic')} className="mode-card neon-border-blue">
                <span className="mode-icon">🕹️</span>
                <h3>CLASSIC</h3>
              </button>
              <button onClick={() => handleModeSelect('tilt')} className="mode-card neon-border-gold">
                <span className="mode-icon">⚖️</span>
                <h3>TILT</h3>
              </button>
              <button onClick={() => handleModeSelect('pyramid')} className="mode-card neon-border-purple">
                <span className="mode-icon">🔺</span>
                <h3>PYRAMID</h3>
              </button>
              <button onClick={() => handleModeSelect('vs')} className="mode-card neon-border-red">
                <span className="mode-icon">⚔️</span>
                <h3>VS MODE</h3>
              </button>
              <button onClick={() => handleModeSelect('waka_waka')} className="mode-card neon-border-waka">
                <span className="mode-icon">🍒</span>
                <h3>WAKA WAKA</h3>
              </button>
              <button onClick={() => handleModeSelect('tesseract')} className="mode-card neon-border-4d">
                <span className="mode-icon">🌀</span>
                <h3>TESSERACT</h3>
              </button>
            </div>
          </div>
        </div>
      )}

      {view === 'game' && mode && (
        <>
          <GameHUD {...gameState} xpNext={xpNext} />
          <div className="current-mode-label">{mode.replace('_', ' ').toUpperCase()} MODE</div>

          <main className="game-area">
            <div className="cyber-grid" />
            <div className="cyber-vignette" />

            {renderGameMode()}
          </main>

          <footer className="game-footer">
            <div className="footer-content glass-panel">
              <button className="exit-menu-btn neon-border-red" onClick={() => setView('picker')}>
                EXIT TO MENU
              </button>
            </div>
          </footer>
        </>
      )}
    </div>
  );
}

export default App;

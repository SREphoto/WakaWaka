# Minimum Viable Product (MVP)

The WakaWaka **MVP** represents the polished core experience required for public release on SREdesigns.com.

## MVP Scope (v2.0)

The following features define the current stable release:

### 1. Functional Requirements

- **Movement**: Smooth, grid-snapped isometric movement using Arrow Keys/WASD.
- **Core Loop**: Painting tiles -> Score increase -> Level Up on 100%.
- **AI**: At least 2 distinct ghost behaviors (Chaser, Random).
- **Game Over**: Fail state upon collision (lives = 0).

### 2. User Experience (UX)

- **Feedback**: Audio cues for Jump, Paint, Die, Level Up.
- **Onboarding**: Simple "How to Play" overlay.
- **Responsive**: Playable on Desktop (Keyboard) and basic Mobile (Tap/Controls).

### 3. Technical Constraints

- **Performance**: 60 FPS on standard laptops.
- **Zero Assets**: All graphics generated via CSS/SVG (no heavy image downloads).
- **Client-Side**: No backend dependency for core gameplay.

## Architecture Diagram (Mermaid)

```mermaid
graph TD
    User[Player] -->|Input: Keys/Touch| InputHandler[usePlayerMovement]
    
    subgraph Game Loop
        InputHandler -->|Update Pos| GameState[Game State (IsometricGrid)]
        AI[Ghost AI System] -->|Tick Update| GameState
        Hazards[Trap System] -->|Toggle Active| GameState
    end
    
    GameState -->|Render| Renderer[3D CSS Renderer]
    GameState -->|Events| Audio[SoundEngine]
    
    Renderer -->|Visuals| Screen[Screen / Canvas]
    
    subgraph Systems
        GameState -->|Check Win| LevelSystem[Level Manager]
        GameState -->|Collsion| HealthSystem[Health Manager]
    end
    
    LevelSystem -->|Reset| GameState
    HealthSystem -->|Game Over| UI[Game Over Screen]
```

## Success Metrics

- **Engagement**: Average session length > 2 minutes.
- **Retention**: Replay rate (Reboot button clicks).
- **Completeness**: Users reaching Level 2+.

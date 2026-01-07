# Product Requirements Document (PRD): WakaWaka 2.0

## 1. Executive Summary

**WakaWaka** is a high-octane, cyber-arcade isometric puzzle game where players control "WakaBert" to claim territory by painting tiles while avoiding enemies and hazards. Built by **SREdesigns.com**, it showcases modern web capabilities using React, TypeScript, and 3D CSS transformations without heavy WebGL engines.

## 2. Core Gameplay Loop

1. **Paint**: Move across the grid to change tiles from "Gray" to "Gold".
2. **Survive**: Avoid 4 unique Ghost types and environmental hazards (Spikes).
3. **Power Up**: Collect power-ups to stun ghosts, speed up, or freeze time.
4. **Advance**: Complete 100% of the board to Level Up, resetting the board with higher difficulty.

## 3. Game Modes

| Mode | Description | Key Mechanics |
| :--- | :--- | :--- |
| **Classic** | The standard arcade experience. | Level progression, High Scores, Survival. |
| **Tilt** | Physics-based movement. | Mobile-first accelerometer control (simulated on desktop). |
| **Pyramid** | 3D verticality. | 5-Layer structure, camera rotation, climbing mechanics. |
| **VS Mode** | 1v1 Territory War against AI. | 2:00 Timer, Stealing tiles, Offensive Power-ups. |

## 4. System Architecture

### Tech Stack

- **Frontend**: React 18, TypeScript, Vite.
- **Styling**: CSS Modules, CSS Variables (Theming), 3D Transforms.
- **State Management**: React Hooks (useReducer/useState) for game loop.
- **Audio**: Web Audio API (Tone generation).

### Entity-Component-System (Lite) via Hooks

- `usePlayerMovement`: Handles physics, collision, and coordinate translation.
- `useGameLoop`: Manages tick-based logic (AI movement, timers).
- `IsometricGrid`: The renderer and state container.

## 5. User Interface (UI)

- **HUD**: Score, Combo Counter, Level, Health, Pause/Mute.
- **Overlays**: Tutorial (First launch), Game Over (Stats), Pause Menu.
- **Theme**: "Cyber-Arcade" – Neon Blue/Pink/Gold palette, Scanlines, Glow effects.

## 6. Future Roadmap (v2.x)

- [ ] **Online Multiplayer**: Real-time WebSocket VS Mode.
- [ ] **Leaderboards**: Global high scores via Firebase.
- [ ] **Skin System**: Unlockable looks for WakaBert and Ghosts.
- [ ] **Level Editor**: JSON-based map sharing.

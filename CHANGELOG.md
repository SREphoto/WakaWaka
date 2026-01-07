# Changelog

All notable changes to the WakaWaka project will be documented in this file.

## [2.0.0] - 2026-01-05

### Added

- **Isometric Engine**: Full 3D isometric rendering for the grid and characters.
- **Cyber-Arcade Theme**: Neon aesthetics, glassmorphism UI, and "Void Cage" animated backgrounds.
- **New Modes**:
  - **Pyramid Mode**: A multi-layered climbing challenge with face-snapping camera.
  - **VS Mode**: Competitive territory control with AI rival, timers, and power-up stealing.
- **Gameplay Depth**:
  - **Level System**: Progression with increasing difficulty and board resets.
  - **Enemy AI Tiers**: Red (Chaser), Pink (Ambusher), Blue (Patroller), Gold (Fleeing).
  - **Hazards**: Spike Traps (timed) and Teleporters.
  - **Combo System**: Score multipliers for continuous tile painting.
- **UX**:
  - **Tutorial Overlay**: First-time user guide.
  - **Game Over Stats**: Detailed breakdown of score, max combo, and level.
  - **Pause/Mute**: HUD controls for game state and audio.
  - **Controls**: Remapped Arrow Keys/WASD for isometric intuition (diagonals).

### Changed

- **Rendering**: Moved from 2D Canvas/DOM to 3D CSS-transformed DOM elements for performance and style.
- **Physics**: Completely rewrote collision detection for the new isometric coordinate system (Axial Coordinates q, r).
- **Sound**: Integrated `SoundEngine` with synthesized SFX for interactivity.

### Fixed

- **Pyramid Visibility**: Camera now snaps to 60-degree increments to prevent the player from being obscured.
- **VS Balance**: Added match timer and escalating rival speed to ensure matches conclude.

## [1.0.0] - 2025-12-30

### Initial Release

- Basic "Pac-Man" inspired tile painting game.
- 2D Grid.
- Simple Ghosts.
- Local Score tracking.

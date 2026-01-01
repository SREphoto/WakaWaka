export type PowerUpType =
    | 'pellet_shooter'
    | 'heavy_stomp'
    | 'feather_mode'
    | 'magnet'
    | 'ghost_freeze'
    | 'paint_bomb'
    | 'stabilizer'
    | 'double_xp'
    | 'shrink_pulse'
    | 'teleport'
    | 'gravity_inv'
    | 'slow_mo'
    | 'shield'
    | 'laser'
    | 'turbo'
    | 'invisible'
    | 'multijump'
    | 'pellet_rain'
    | 'weight_hammer'
    | 'chronos';

export interface PowerUp {
    id: string;
    type: PowerUpType;
    icon: string;
    description: string;
    duration: number; // ms
}

export const POWER_UPS: PowerUp[] = [
    { id: '1', type: 'pellet_shooter', icon: '🔫', description: 'Auto-clears nearby tiles', duration: 10000 },
    { id: '2', type: 'heavy_stomp', icon: '🔨', description: 'Stomp knocks ghosts off the board', duration: 0 },
    { id: '3', type: 'feather_mode', icon: '🪶', description: 'Weightless movement', duration: 12000 },
    { id: '4', type: 'magnet', icon: '🧲', description: 'Pulls pellets towards you', duration: 8000 },
    { id: '5', type: 'ghost_freeze', icon: '❄️', description: 'Freezes all ghosts', duration: 5000 },
    { id: '6', type: 'paint_bomb', icon: '💣', description: 'Clears large area', duration: 0 },
    { id: '7', type: 'stabilizer', icon: '⚖️', description: 'Instantly balances the board', duration: 0 },
    { id: '8', type: 'double_xp', icon: '✨', description: 'X2 XP Multiplier', duration: 15000 },
    { id: '9', type: 'shrink_pulse', icon: '🤏', description: 'Ghosts become vulnerable', duration: 7000 },
    { id: '10', type: 'teleport', icon: '🌀', description: 'Flash to center', duration: 0 },
    { id: '11', type: 'gravity_inv', icon: '🌌', description: 'Repels ghosts', duration: 10000 },
    { id: '12', type: 'slow_mo', icon: '⏳', description: 'Time slows down', duration: 8000 },
    { id: '13', type: 'shield', icon: '🛡️', description: 'Invulnerability', duration: 6000 },
    { id: '14', type: 'laser', icon: '💥', description: 'Line clearance', duration: 0 },
    { id: '15', type: 'turbo', icon: '🚀', description: 'Extreme speed', duration: 10000 },
    { id: '16', type: 'invisible', icon: '👻', description: 'Untouchable by ghosts', duration: 8000 },
    { id: '17', type: 'multijump', icon: '👟', description: 'Triple jump enabled', duration: 12000 },
    { id: '18', type: 'pellet_rain', icon: '🌧️', description: 'Random tile paint', duration: 0 },
    { id: '19', type: 'weight_hammer', icon: '🧱', description: 'Adds weight to landing spot', duration: 10000 },
    { id: '20', type: 'chronos', icon: '⏪', description: 'Resets balance', duration: 0 }
];

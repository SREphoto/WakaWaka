export interface perk {
    id: string;
    name: string;
    description: string;
    icon: string;
    class: 'agility' | 'strength' | 'magic';
}

export const PERKS: perk[] = [
    { id: 'double_jump', name: 'Double Jump', description: 'Jump again in mid-air.', icon: '🚀', class: 'agility' },
    { id: 'speed_demon', name: 'Speed Demon', description: 'Move 10% faster.', icon: '⚡', class: 'agility' },
    { id: 'spike_armor', name: 'Spike Armor', description: 'Damage enemies on touch.', icon: '🛡️', class: 'strength' },
    { id: 'stomp', name: 'Stomp', description: 'Stun nearby enemies on land.', icon: '💥', class: 'strength' },
    { id: 'splash_paint', name: 'Splash Paint', description: 'Paint 4 adjacent tiles.', icon: '🎨', class: 'magic' },
    { id: 'turret', name: 'Turret Builder', description: 'Build auto-turrets.', icon: '🛰️', class: 'magic' },
];

export const getXPForLevel = (level: number) => level * 100;

import React from 'react';
import type { perk } from '../utils/ProgressionSystem';
import { PERKS } from '../utils/ProgressionSystem';
import './LevelUpShop.css';

interface LevelUpShopProps {
    onSelect: (perk: perk) => void;
}

const LevelUpShop: React.FC<LevelUpShopProps> = ({ onSelect }) => {
    const [options] = React.useState(() => {
        const shuffled = [...PERKS].sort(() => 0.5 - Math.random());
        return shuffled.slice(0, 3);
    });

    return (
        <div className="shop-overlay backdrop-blur">
            <div className="shop-container glass-panel">
                <h2 className="neon-text-gold">LEVEL UP!</h2>
                <p>Choose your mutation:</p>
                <div className="perk-options">
                    {options.map((perk) => (
                        <div
                            key={perk.id}
                            className={`perk-card ${perk.class}`}
                            onClick={() => onSelect(perk)}
                        >
                            <div className="perk-icon">{perk.icon}</div>
                            <h3>{perk.name}</h3>
                            <p>{perk.description}</p>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default LevelUpShop;

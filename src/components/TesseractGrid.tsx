import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { TESSERACT_VERTICES, TESSERACT_FACES, rotate4D, project4DTo3D } from '../utils/HyperSpace';
import './TesseractGrid.css';
import WakaBert from './WakaBert';
import ParticleSystem from './ParticleSystem';
import type { ParticleSystemRef } from './ParticleSystem';
import { sound } from '../utils/SoundEngine';
import MobileControls from './MobileControls';

interface TesseractGridProps {
    onStateUpdate: (state: { xp?: number; score?: number }) => void;
}

const TesseractGrid: React.FC<TesseractGridProps> = ({ onStateUpdate }) => {
    const [angle, setAngle] = useState(0);
    const [paintedFaces, setPaintedFaces] = useState<number[]>([]);
    const [playerPos, setPlayerPos] = useState({ faceIndex: 0, x: 0, y: 0 });
    const particlesRef = useRef<ParticleSystemRef>(null);

    useEffect(() => {
        const interval = setInterval(() => {
            setAngle(a => a + 0.015);
        }, 16);
        return () => clearInterval(interval);
    }, []);

    const projectedVertices = useMemo(() => {
        return TESSERACT_VERTICES.map(v => {
            let p = rotate4D(v, angle, 'XW');
            p = rotate4D(p, angle * 0.7, 'YW');
            return project4DTo3D(p);
        });
    }, [angle]);

    const handleMove = useCallback((dq: number, dr: number) => {
        sound.playHop();

        setPlayerPos(prev => {
            let nextX = prev.x + dq * 0.2;
            let nextY = prev.y + dr * 0.2;
            let nextFace = prev.faceIndex;

            if (Math.abs(nextX) > 1 || Math.abs(nextY) > 1) {
                nextFace = (prev.faceIndex + 1) % TESSERACT_FACES.length;
                nextX = -nextX * 0.8;
                nextY = -nextY * 0.8;
                sound.playTeleport();
            }

            if (!paintedFaces.includes(nextFace)) {
                setPaintedFaces(prevFaces => [...prevFaces, nextFace]);
                onStateUpdate({ xp: 50 });
                sound.playPaint();
            }

            return { faceIndex: nextFace, x: nextX, y: nextY };
        });
    }, [paintedFaces, onStateUpdate]);

    const player3D = useMemo(() => {
        const face = TESSERACT_FACES[playerPos.faceIndex];
        const v = face.map(idx => projectedVertices[idx]);

        const tx = (playerPos.x + 1) / 2;
        const ty = (playerPos.y + 1) / 2;

        return {
            x: (v[0].x * (1 - tx) + v[1].x * tx) * (1 - ty) + (v[3].x * (1 - tx) + v[2].x * tx) * ty,
            y: (v[0].y * (1 - tx) + v[1].y * tx) * (1 - ty) + (v[3].y * (1 - tx) + v[2].y * tx) * ty,
            z: (v[0].z * (1 - tx) + v[1].z * tx) * (1 - ty) + (v[3].z * (1 - tx) + v[2].z * tx) * ty
        };
    }, [playerPos, projectedVertices]);

    return (
        <div className="grid-container tesseract-arena">
            <div className="hyper-nebula"></div>
            <ParticleSystem ref={particlesRef} />

            <div className="tesseract-projection">
                <svg viewBox="-1.8 -1.8 3.6 3.6" className="hyper-svg">
                    {TESSERACT_FACES.map((face, i) => {
                        const pts = face.map(idx => projectedVertices[idx]);
                        const isPainted = paintedFaces.includes(i);
                        const isCurrent = playerPos.faceIndex === i;

                        return (
                            <polygon
                                key={i}
                                points={pts.map(p => `${p.x},${p.y}`).join(' ')}
                                className={`tesseract-face ${isPainted ? 'painted' : ''} ${isCurrent ? 'current' : ''}`}
                            />
                        );
                    })}
                </svg>

                <div
                    className="waka-bert-3d-wrapper"
                    style={{
                        '--player-x': `${player3D.x * 400}px`,
                        '--player-y': `${player3D.y * 400}px`,
                        '--player-z': 1 + player3D.z,
                    } as React.CSSProperties}
                >
                    <WakaBert q={0} r={0} isJumping={false} direction="up" />
                </div>
            </div>

            <div className="mode-label-4d">DIMENSION: W-AXIS ROTATION ACTIVE</div>
            <MobileControls onMove={handleMove} />
        </div>
    );
};

export default TesseractGrid;

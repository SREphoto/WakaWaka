import { useEffect, useRef, useImperativeHandle, forwardRef } from 'react';
import './ParticleSystem.css';

interface Particle {
    x: number;
    y: number;
    vx: number;
    vy: number;
    life: number;
    color: string;
    size: number;
    rotation: number;
    vRot: number;
}

export interface ParticleSystemRef {
    emit: (x: number, y: number, color: string, count?: number) => void;
}

const ParticleSystem = forwardRef<ParticleSystemRef>((_, ref) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const particles = useRef<Particle[]>([]);

    useImperativeHandle(ref, () => ({
        emit: (x, y, color, count = 10) => {
            for (let i = 0; i < count; i++) {
                particles.current.push({
                    x, y,
                    vx: (Math.random() - 0.5) * 12, // Faster explosion
                    vy: (Math.random() - 0.5) * 12,
                    life: 1.0,
                    color,
                    size: Math.random() * 6 + 4, // Larger squares
                    rotation: Math.random() * 360,
                    vRot: (Math.random() - 0.5) * 10
                } as Particle); // Cast to ExtendedParticle
            }
        }
    }));

    // ... (resize logic remains the same)

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        let animationId: number;

        const update = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height); // Standard clear

            particles.current.forEach((p: any, i) => { // Type 'any' to avoid strict TS interface issues for now, or extend interface
                p.x += p.vx;
                p.y += p.vy;
                p.rotation += p.vRot; // Rotate
                p.life -= 0.025; // 40 frames approx
                p.vy += 0.2; // Slight gravity

                if (p.life <= 0) {
                    particles.current.splice(i, 1);
                    return;
                }

                ctx.save();
                ctx.translate(p.x, p.y);
                ctx.rotate((p.rotation * Math.PI) / 180);

                ctx.fillStyle = p.color;
                ctx.globalAlpha = p.life;

                // Neon Glow
                ctx.shadowBlur = 15;
                ctx.shadowColor = p.color;

                const s = p.size * p.life; // Shrink over time
                ctx.fillRect(-s / 2, -s / 2, s, s); // Draw Square

                ctx.restore();
            });

            animationId = requestAnimationFrame(update);
        };

        update();
        return () => cancelAnimationFrame(animationId);
    }, []);

    return (
        <canvas
            ref={canvasRef}
            className="particle-canvas"
        />
    );
});

export default ParticleSystem;

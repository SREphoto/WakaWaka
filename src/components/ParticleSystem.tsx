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
                    vx: (Math.random() - 0.5) * 10,
                    vy: (Math.random() - 0.5) * 10,
                    life: 1.0,
                    color,
                    size: Math.random() * 4 + 2
                });
            }
        }
    }));

    useEffect(() => {
        const handleResize = () => {
            if (canvasRef.current) {
                canvasRef.current.width = window.innerWidth;
                canvasRef.current.height = window.innerHeight;
            }
        };
        window.addEventListener('resize', handleResize);
        handleResize();
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        let animationId: number;

        const update = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            particles.current.forEach((p, i) => {
                p.x += p.vx;
                p.y += p.vy;
                p.life -= 0.02;

                ctx.fillStyle = p.color;
                ctx.globalAlpha = p.life > 0 ? p.life : 0;
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
                ctx.fill();

                if (p.life <= 0) {
                    particles.current.splice(i, 1);
                }
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

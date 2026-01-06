class SoundEngine {
    private ctx: AudioContext | null = null;
    private isMuted: boolean = false;

    private init() {
        if (!this.ctx) {
            this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
        }
    }

    toggleMute() {
        this.isMuted = !this.isMuted;
    }

    private playTone(freq: number, type: OscillatorType, duration: number, volume: number = 0.1, slideFreq?: number) {
        if (this.isMuted) return;
        this.init();
        if (!this.ctx) return;

        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = type;
        osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
        if (slideFreq) {
            osc.frequency.exponentialRampToValueAtTime(slideFreq, this.ctx.currentTime + duration);
        }

        gain.gain.setValueAtTime(volume, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + duration);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start();
        osc.stop(this.ctx.currentTime + duration);
    }

    playHop() {
        this.playTone(300, 'sine', 0.1, 0.05, 600);
    }

    playPaint() {
        this.playTone(800, 'triangle', 0.15, 0.1, 400);
    }

    playPowerUp() {
        for (let i = 0; i < 6; i++) {
            setTimeout(() => this.playTone(300 + i * 150, 'square', 0.3, 0.02, 600 + i * 150), i * 80);
        }
    }

    playDeath() {
        this.playTone(150, 'sawtooth', 0.6, 0.1, 50);
        this.playTone(100, 'sawtooth', 0.6, 0.1, 40);
    }

    playWin() {
        const notes = [523.25, 659.25, 783.99, 1046.50, 1318.51, 1567.98];
        notes.forEach((note, i) => {
            setTimeout(() => this.playTone(note, 'sine', 0.5, 0.04, note * 1.05), i * 100);
        });
    }

    playLevelUp() {
        const notes = [440, 554, 659, 880];
        notes.forEach((note, i) => {
            setTimeout(() => this.playTone(note, 'square', 0.4, 0.1, note * 1.01), i * 120);
        });
        setTimeout(() => this.playTone(880, 'sawtooth', 0.6, 0.2, 1760), 600);
    }

    playCombo(count: number) {
        const baseFreq = 400 + (count * 50);
        this.playTone(baseFreq, 'sine', 0.2, 0.08, baseFreq * 1.5);
    }

    playStomp() {
        this.playTone(120, 'square', 0.3, 0.1, 40);
        this.playTone(80, 'sine', 0.4, 0.15, 20);
    }

    playGhostDeath() {
        this.playTone(800, 'sawtooth', 0.1, 0.1, 1200);
        setTimeout(() => this.playTone(1200, 'sawtooth', 0.2, 0.08, 400), 50);
    }

    playTeleport() {
        this.playTone(100, 'sine', 0.5, 0.1, 2000);
        setTimeout(() => this.playTone(50, 'square', 0.2, 0.05, 100), 100);
    }
}

export const sound = new SoundEngine();

/**
 * Procedural Synthwave Engine
 * Generates dynamic music on the fly using Web Audio API.
 */

class MusicEngine {
    private ctx: AudioContext | null = null;
    private masterGain: GainNode | null = null;
    private isPlaying: boolean = false;
    private tempo: number = 110;

    start() {
        if (this.isPlaying) return;
        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
        if (!AudioContextClass) return;

        this.ctx = new AudioContextClass();
        this.masterGain = this.ctx.createGain();
        this.masterGain.connect(this.ctx.destination);
        this.masterGain.gain.value = 0.15;
        this.isPlaying = true;
        this.playDrumLoop();
    }

    setIntensity(level: number) {
        this.tempo = 110 + (level * 5);
        if (this.masterGain && this.ctx) {
            this.masterGain.gain.setTargetAtTime(0.15 + (level * 0.02), this.ctx.currentTime, 0.5);
        }
    }

    private playDrumLoop() {
        if (!this.ctx) return;
        let beat = 0;
        const lookahead = 25.0;
        const scheduleAheadTime = 0.1;
        let nextNoteTime = this.ctx.currentTime;

        const scheduler = () => {
            if (!this.ctx) return;
            while (nextNoteTime < this.ctx.currentTime + scheduleAheadTime) {
                this.playStep(beat, nextNoteTime);
                nextNoteTime += 60.0 / this.tempo / 2;
                beat = (beat + 1) % 16;
            }
            setTimeout(scheduler, lookahead);
        };

        scheduler();
    }

    private playStep(beat: number, time: number) {
        if (!this.ctx || !this.masterGain) return;

        if (beat % 4 === 0) this.kick(time);
        if (beat % 8 === 4) this.snare(time);
        if (beat % 2 === 1) this.hat(time);

        if (beat % 4 === 0) {
            const notes = [40, 40, 43, 38];
            this.synth(this.midiToFreq(notes[Math.floor(beat / 4)]), time, 0.4);
        }

        if (this.tempo > 120 && beat % 2 === 0) {
            const arps = [64, 67, 71, 74];
            this.synth(this.midiToFreq(arps[Math.floor(Math.random() * 4)]), time, 0.1, 'sawtooth');
        }
    }

    private midiToFreq(m: number) { return Math.pow(2, (m - 69) / 12) * 440; }

    private kick(time: number) {
        if (!this.ctx || !this.masterGain) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.connect(gain); gain.connect(this.masterGain);
        osc.frequency.setValueAtTime(150, time);
        osc.frequency.exponentialRampToValueAtTime(0.01, time + 0.5);
        gain.gain.setValueAtTime(1, time);
        gain.gain.exponentialRampToValueAtTime(0.01, time + 0.5);
        osc.start(time); osc.stop(time + 0.5);
    }

    private snare(time: number) {
        if (!this.ctx || !this.masterGain) return;
        const noise = this.ctx.createBufferSource();
        const buffer = this.ctx.createBuffer(1, this.ctx.sampleRate * 0.1, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
        noise.buffer = buffer;
        const filter = this.ctx.createBiquadFilter();
        filter.type = 'highpass'; filter.frequency.value = 1000;
        const gain = this.ctx.createGain();
        noise.connect(filter); filter.connect(gain); gain.connect(this.masterGain);
        gain.gain.setValueAtTime(0.5, time);
        gain.gain.exponentialRampToValueAtTime(0.01, time + 0.1);
        noise.start(time); noise.stop(time + 0.1);
    }

    private hat(time: number) {
        if (!this.ctx || !this.masterGain) return;
        const noise = this.ctx.createBufferSource();
        const buffer = this.ctx.createBuffer(1, this.ctx.sampleRate * 0.05, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
        noise.buffer = buffer;
        const filter = this.ctx.createBiquadFilter();
        filter.type = 'highpass'; filter.frequency.value = 8000;
        const gain = this.ctx.createGain();
        noise.connect(filter); filter.connect(gain); gain.connect(this.masterGain);
        gain.gain.setValueAtTime(0.1, time);
        gain.gain.exponentialRampToValueAtTime(0.01, time + 0.05);
        noise.start(time); noise.stop(time + 0.05);
    }

    private synth(freq: number, time: number, vol: number, type: OscillatorType = 'triangle') {
        if (!this.ctx || !this.masterGain) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = type;
        osc.frequency.setValueAtTime(freq, time);
        osc.connect(gain); gain.connect(this.masterGain);
        gain.gain.setValueAtTime(0, time);
        gain.gain.linearRampToValueAtTime(vol, time + 0.05);
        gain.gain.exponentialRampToValueAtTime(0.01, time + 0.2);
        osc.start(time); osc.stop(time + 0.2);
    }
}

export const music = new MusicEngine();

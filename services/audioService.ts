class AudioService {
  private ctx: AudioContext | null = null;
  private rollingNode: AudioBufferSourceNode | null = null;
  private rollingGain: GainNode | null = null;
  private initialized: boolean = false;
  private lastBumpTime: number = 0;

  init() {
    if (this.initialized) return;
    
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    this.ctx = new AudioContextClass();
    
    // --- Create Rolling Noise (Brown Noise for rumble) ---
    const bufferSize = this.ctx.sampleRate * 2; // 2 seconds loop
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    
    let lastOut = 0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      data[i] = (lastOut + (0.02 * white)) / 1.02;
      lastOut = data[i];
      data[i] *= 3.5; // Auto-gain compensation
    }

    this.rollingGain = this.ctx.createGain();
    this.rollingGain.gain.value = 0;
    
    // Lowpass filter to make it sound like stone/wood rolling
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 300;

    this.rollingNode = this.ctx.createBufferSource();
    this.rollingNode.buffer = buffer;
    this.rollingNode.loop = true;
    
    this.rollingNode.connect(filter);
    filter.connect(this.rollingGain);
    this.rollingGain.connect(this.ctx.destination);
    
    this.rollingNode.start();
    this.initialized = true;
  }

  resume() {
    if (this.ctx?.state === 'suspended') {
      this.ctx.resume();
    }
  }

  // Called every frame with total velocity of all marbles
  updateRolling(totalSpeed: number) {
    if (!this.ctx || !this.rollingGain) return;
    
    // Smooth transition
    const targetGain = Math.min(totalSpeed * 0.005, 0.4);
    const currentGain = this.rollingGain.gain.value;
    this.rollingGain.gain.value = currentGain + (targetGain - currentGain) * 0.1;
  }

  playBump(intensity: number) {
    if (!this.ctx) return;
    
    // Throttle bumps to avoid audio glitching on piles
    const now = this.ctx.currentTime;
    if (now - this.lastBumpTime < 0.05) return; 
    this.lastBumpTime = now;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    
    // Pitch varies with intensity (harder = higher) + random jitter
    const baseFreq = 100 + (intensity * 20);
    osc.frequency.setValueAtTime(baseFreq + Math.random() * 50, now);
    osc.frequency.exponentialRampToValueAtTime(50, now + 0.1);

    // Volume envelope
    const vol = Math.min(intensity * 0.1, 0.8);
    gain.gain.setValueAtTime(vol, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.15);
  }

  playPinHit(intensity: number) {
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    
    osc.type = 'sine';
    osc.frequency.setValueAtTime(800 + Math.random() * 200, now); // Ping sound
    
    const vol = Math.min(intensity * 0.05, 0.5);
    gain.gain.setValueAtTime(vol, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
    
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    
    osc.start(now);
    osc.stop(now + 0.2);
  }

  playFinish() {
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    
    // Major Chord Arpeggio
    [523.25, 659.25, 783.99, 1046.50].forEach((freq, i) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();
      
      osc.type = 'square';
      osc.frequency.value = freq;
      
      const time = now + (i * 0.05);
      gain.gain.setValueAtTime(0, time);
      gain.gain.linearRampToValueAtTime(0.1, time + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, time + 0.4);
      
      osc.connect(gain);
      gain.connect(this.ctx!.destination);
      osc.start(time);
      osc.stop(time + 0.5);
    });
  }

  playEliminated() {
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(150, now);
    osc.frequency.linearRampToValueAtTime(50, now + 0.5);
    
    gain.gain.setValueAtTime(0.3, now);
    gain.gain.linearRampToValueAtTime(0, now + 0.5);
    
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    
    osc.start(now);
    osc.stop(now + 0.5);
  }
}

export const audio = new AudioService();
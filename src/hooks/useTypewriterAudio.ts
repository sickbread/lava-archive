import { useCallback, useEffect, useRef, useState } from 'react';

// Helpers for Noise Generation
const createNoiseBuffer = (ctx: AudioContext, duration: number, type: 'white' | 'pink') => {
    const bufferSize = ctx.sampleRate * duration;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);

    if (type === 'white') {
        for (let i = 0; i < bufferSize; i++) {
            data[i] = Math.random() * 2 - 1;
        }
    } else {
        // Pink noise approximation
        let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
        for (let i = 0; i < bufferSize; i++) {
            const white = Math.random() * 2 - 1;
            b0 = 0.99886 * b0 + white * 0.0555179;
            b1 = 0.99332 * b1 + white * 0.0750759;
            b2 = 0.96900 * b2 + white * 0.1538520;
            b3 = 0.86650 * b3 + white * 0.3104856;
            b4 = 0.55000 * b4 + white * 0.5329522;
            b5 = -0.7616 * b5 - white * 0.0168981;
            data[i] = b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362;
            data[i] *= 0.11;
            b6 = white * 0.115926;
        }
    }
    return buffer;
};

// Transient Detection Helper
const detectTransients = (buffer: AudioBuffer, threshold: number = 0.15, minSilenceDuration: number = 0.1): number[] => {
    const data = buffer.getChannelData(0);
    const sampleRate = buffer.sampleRate;
    const segments: number[] = [];
    let lastTransientTime = -minSilenceDuration;

    for (let i = 0; i < data.length; i++) {
        // Detect peak above threshold
        if (Math.abs(data[i]) > threshold) {
            const currentTime = i / sampleRate;
            // Debounce: Ensure enough time has passed since last transient
            if (currentTime - lastTransientTime > minSilenceDuration) {
                segments.push(currentTime);
                lastTransientTime = currentTime;
            }
        }
    }
    return segments;
};

export const useTypewriterAudio = () => {
    const [muted, setMuted] = useState(false);
    const audioContextRef = useRef<AudioContext | null>(null);
    const masterGainRef = useRef<GainNode | null>(null);

    // Buffers per layer
    const edgeBufferRef = useRef<AudioBuffer | null>(null); // White noise for transients
    const bodyBufferRef = useRef<AudioBuffer | null>(null); // Pink noise for body
    const returnBufferRef = useRef<AudioBuffer | null>(null); // Custom audio file for Return
    const keystrokeBufferRef = useRef<AudioBuffer | null>(null); // Custom audio file for Keystrokes (granular)
    const keystrokeSegmentsRef = useRef<number[]>([]); // Detected start times for keystrokes

    useEffect(() => {
        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
        if (AudioContextClass) {
            const ctx = new AudioContextClass();
            audioContextRef.current = ctx;

            // Mastering: Hard Limiter -3dB
            const masterGain = ctx.createGain();
            // 0.707 is approx -3dB
            masterGain.gain.value = 0.4; // Restored to 0.4 as user only wants specific sounds reduced
            masterGain.connect(ctx.destination);
            masterGainRef.current = masterGain;

            // Generate source buffers
            edgeBufferRef.current = createNoiseBuffer(ctx, 0.1, 'white');
            bodyBufferRef.current = createNoiseBuffer(ctx, 0.2, 'pink');

            // Load Custom Return Sound
            fetch('/sounds/typewriter-line-break-1.mp3')
                .then(res => res.arrayBuffer())
                .then(arrayBuffer => ctx.decodeAudioData(arrayBuffer))
                .then(audioBuffer => {
                    returnBufferRef.current = audioBuffer;
                })
                .catch(err => console.error('Failed to load return sound:', err));

            // Load Custom Keystroke Sound (Long recording)
            fetch('/sounds/typewriter-1.mp3')
                .then(res => res.arrayBuffer())
                .then(arrayBuffer => ctx.decodeAudioData(arrayBuffer))
                .then(audioBuffer => {
                    keystrokeBufferRef.current = audioBuffer;
                    // Analyze the buffer for transients
                    const segments = detectTransients(audioBuffer, 0.1, 0.15);
                    console.log(`[Audio Analysis] Detected ${segments.length} keystroke segments.`);
                    keystrokeSegmentsRef.current = segments;
                })
                .catch(err => console.error('Failed to load keystroke sound:', err));
        }

        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.ctrlKey && (e.key === 'm' || e.key === 'M')) {
                e.preventDefault();
                setMuted(prev => !prev);
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    const triggerLayer = (
        buffer: AudioBuffer,
        startTime: number,
        duration: number,
        filterType: BiquadFilterType,
        freq: number,
        vol: number,
        q: number = 1
    ) => {
        if (!audioContextRef.current || !masterGainRef.current) return;
        const ctx = audioContextRef.current;

        const source = ctx.createBufferSource();
        source.buffer = buffer;

        const filter = ctx.createBiquadFilter();
        filter.type = filterType;
        filter.frequency.setValueAtTime(freq, startTime);
        filter.Q.value = q;

        const gain = ctx.createGain();
        gain.gain.setValueAtTime(vol, startTime);
        // Sharp decay
        gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);

        source.connect(filter);
        filter.connect(gain);
        gain.connect(masterGainRef.current);

        source.start(startTime);
        source.stop(startTime + duration + 0.05); // Cleanup
    };

    const triggerMetalKlang = (startTime: number) => {
        if (!audioContextRef.current || !masterGainRef.current || !edgeBufferRef.current) return;
        const ctx = audioContextRef.current;

        // Physical Modeling: Metallic Klang using filtered noise instead of pure sine
        // This avoids the "digital" feeling of an oscillator
        const source = ctx.createBufferSource();
        source.buffer = edgeBufferRef.current;

        const bandpass = ctx.createBiquadFilter();
        bandpass.type = 'bandpass';
        bandpass.frequency.setValueAtTime(1200, startTime); // Lower metallic ring
        bandpass.Q.value = 8; // High resonance

        const gain = ctx.createGain();
        gain.gain.setValueAtTime(0, startTime);
        gain.gain.linearRampToValueAtTime(0.2, startTime + 0.02); // Sharp attack
        gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.4); // Fast metal decay

        source.connect(bandpass);
        bandpass.connect(gain);
        gain.connect(masterGainRef.current);

        source.start(startTime);
        source.stop(startTime + 0.5);
    };

    const playKeystroke = useCallback(() => {
        if (muted || !audioContextRef.current) return;
        if (audioContextRef.current.state === 'suspended') audioContextRef.current.resume();

        const ctx = audioContextRef.current;
        const t = ctx.currentTime;

        // Granular Playback from Long Recording
        if (keystrokeBufferRef.current && keystrokeSegmentsRef.current.length > 0) {
            const buffer = keystrokeBufferRef.current;
            const segments = keystrokeSegmentsRef.current;

            // Randomly select a valid start segment (Transient)
            const segmentIndex = Math.floor(Math.random() * segments.length);
            const startTime = segments[segmentIndex];

            // Allow slightly longer playback for natural decay
            const playDuration = 0.25;

            const source = ctx.createBufferSource();
            source.buffer = buffer;

            // Randomized Pitch (Subtle)
            const pitchVar = 0.95 + (Math.random() * 0.1);
            source.playbackRate.value = pitchVar;

            const gain = ctx.createGain();
            gain.gain.setValueAtTime(0, t);
            gain.gain.linearRampToValueAtTime(0.8, t + 0.005); // Very fast attack
            gain.gain.exponentialRampToValueAtTime(0.01, t + playDuration); // Natural fade out

            source.connect(gain);
            gain.connect(masterGainRef.current!);

            source.start(t, startTime, playDuration + 0.05);
        } else if (keystrokeBufferRef.current) {
            const buffer = keystrokeBufferRef.current;
            const duration = buffer.duration;

            // Pick a random start point, avoiding the very end
            // We assume the recording is dense with typing sounds.
            // The slice length will be short (e.g. 0.1s to 0.2s)
            const grainDuration = 0.15 + (Math.random() * 0.05); // 0.15s - 0.2s
            const maxStart = Math.max(0, duration - grainDuration);
            const startTime = Math.random() * maxStart;

            const source = ctx.createBufferSource();
            source.buffer = buffer;

            // Randomized Pitch
            const pitchVar = 0.9 + (Math.random() * 0.2); // 0.9 - 1.1
            source.playbackRate.value = pitchVar;

            const gain = ctx.createGain();
            gain.gain.setValueAtTime(0, t);
            gain.gain.linearRampToValueAtTime(0.6, t + 0.01); // Fast attack to avoid clicks
            gain.gain.exponentialRampToValueAtTime(0.01, t + grainDuration); // Fade out

            source.connect(gain);
            gain.connect(masterGainRef.current!);

            source.start(t, startTime, grainDuration);
        } else {
            // FALLBACK: Synthesized Sound
            const pitchVar = 0.95 + Math.random() * 0.1;

            // LAYER 1: IRON BODY
            if (bodyBufferRef.current) triggerLayer(bodyBufferRef.current, t, 0.08, 'lowpass', 350 * pitchVar, 0.6);

            // LAYER 2: STEEL EDGE
            if (edgeBufferRef.current) triggerLayer(edgeBufferRef.current, t, 0.02, 'bandpass', 6000 * pitchVar, 0.35, 1);
        }

    }, [muted]);

    const playSpace = useCallback(() => {
        if (muted || !audioContextRef.current || !bodyBufferRef.current) return;
        const ctx = audioContextRef.current;
        const t = ctx.currentTime;

        // Just Body, deeper
        triggerLayer(bodyBufferRef.current, t, 0.1, 'lowpass', 150, 0.8);
    }, [muted]);

    const playReturn = useCallback(() => {
        if (muted || !audioContextRef.current) return;
        if (audioContextRef.current.state === 'suspended') audioContextRef.current.resume();

        const ctx = audioContextRef.current;
        const t = ctx.currentTime;

        // Use custom audio file if loaded
        if (returnBufferRef.current) {
            const source = ctx.createBufferSource();
            source.buffer = returnBufferRef.current;

            const gain = ctx.createGain();
            gain.gain.setValueAtTime(0.64, t); // Reduced from 0.8 to 0.64 (20% reduction) for top nav tabs

            source.connect(gain);
            gain.connect(masterGainRef.current!);

            source.start(t);
        } else {
            // FALLBACK: Synthesized Sound
            // 1. THE SNAP (Mechanic Latch - High sharp click)
            if (edgeBufferRef.current) triggerLayer(edgeBufferRef.current, t, 0.05, 'highpass', 4000, 0.6);

            // 2. THE THUD (Heavy Carriage Stop - Low impact)
            if (bodyBufferRef.current) triggerLayer(bodyBufferRef.current, t, 0.15, 'lowpass', 150, 0.9);

            // 3. THE SLIDE (Mechanism friction)
            if (bodyBufferRef.current) {
                const slideDur = 0.35;
                const slideNode = ctx.createBufferSource();
                slideNode.buffer = bodyBufferRef.current;
                slideNode.loop = true;

                const slideFilter = ctx.createBiquadFilter();
                slideFilter.type = 'bandpass';
                slideFilter.frequency.setValueAtTime(600, t);

                const slideGain = ctx.createGain();
                slideGain.gain.setValueAtTime(0.5, t);
                slideGain.gain.linearRampToValueAtTime(0, t + slideDur);

                slideNode.connect(slideFilter);
                slideFilter.connect(slideGain);
                slideGain.connect(masterGainRef.current!);

                slideNode.start(t);
                slideNode.stop(t + slideDur);
            }

            // 4. THE KLANG
            triggerMetalKlang(t + 0.05);
        }

    }, [muted]);

    const playDelete = useCallback(() => {
        if (muted) return;
        if (audioContextRef.current && edgeBufferRef.current) {
            const t = audioContextRef.current.currentTime;
            triggerLayer(edgeBufferRef.current, t, 0.04, 'highpass', 3000, 0.3);
        }
    }, [muted]);

    const playShutter = useCallback(() => {
        if (muted || !audioContextRef.current || !edgeBufferRef.current || !bodyBufferRef.current) return;
        if (audioContextRef.current.state === 'suspended') audioContextRef.current.resume();

        const ctx = audioContextRef.current;
        const t = ctx.currentTime;

        // 1. Shutter Open (Sharp Mechanical Click)
        triggerLayer(edgeBufferRef.current, t, 0.04, 'highpass', 2000, 0.5);

        // 2. Mechanism Slide (Brief Friction)
        triggerLayer(bodyBufferRef.current, t, 0.1, 'bandpass', 800, 0.4);

        // 3. Shutter Close (Heavier Thud + Latch)
        triggerLayer(bodyBufferRef.current, t + 0.08, 0.1, 'lowpass', 200, 0.7);
        triggerLayer(edgeBufferRef.current, t + 0.08, 0.05, 'highpass', 3000, 0.4);

    }, [muted]);

    const playConnect = useCallback(() => {
        if (muted || !audioContextRef.current || !edgeBufferRef.current || !bodyBufferRef.current) return;
        const ctx = audioContextRef.current;
        const t = ctx.currentTime;

        // "Chic" - Sharp metal click
        triggerLayer(edgeBufferRef.current, t, 0.03, 'highpass', 4000, 0.4);
        // "Tak" - Heavier latch mechanical sound
        triggerLayer(bodyBufferRef.current, t + 0.04, 0.08, 'lowpass', 400, 0.6);
        triggerLayer(edgeBufferRef.current, t + 0.04, 0.04, 'bandpass', 2000, 0.3);
    }, [muted]);

    const playStatic = useCallback(() => {
        if (muted || !audioContextRef.current || !edgeBufferRef.current) return;
        const ctx = audioContextRef.current;
        const t = ctx.currentTime;

        // Static Noise - Short burst of white noise
        const source = ctx.createBufferSource();
        source.buffer = edgeBufferRef.current;

        const filter = ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.setValueAtTime(1500, t);
        filter.Q.value = 0.5;

        const gain = ctx.createGain();
        gain.gain.setValueAtTime(0.2, t);
        gain.gain.linearRampToValueAtTime(0, t + 0.1);

        source.connect(filter);
        filter.connect(gain);
        gain.connect(masterGainRef.current!);

        source.start(t);
        source.stop(t + 0.15);
    }, [muted]);

    const toggleMute = () => setMuted(prev => !prev);

    return { playKeystroke, playReturn, playSpace, playDelete, playShutter, playConnect, playStatic, toggleMute, muted };
};

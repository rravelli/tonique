import { useCallback, useEffect, useRef, useState } from "react";
import { LOOP_SECONDS, MASTER_GAIN, STEMS } from "./stems";

type Status = "idle" | "loading" | "playing" | "paused" | "error";
type Flags = Record<string, boolean>;

const LOOP_START = 0.5;
const SEAM_SECONDS = 0.012;

/**
 * MP3 doesn't keep a waveform exactly, so the loop's two ends differ slightly
 * once decoded. Fading the end into what precedes the start removes the seam.
 */
function sealLoop(buffer: AudioBuffer) {
	const rate = buffer.sampleRate;
	const start = Math.round(LOOP_START * rate);
	const end = Math.round((LOOP_START + LOOP_SECONDS) * rate);
	const fade = Math.round(SEAM_SECONDS * rate);
	for (let ch = 0; ch < buffer.numberOfChannels; ch++) {
		const data = buffer.getChannelData(ch);
		for (let i = 0; i < fade; i++) {
			const mix = (i + 1) / fade;
			data[end - fade + i] =
				(1 - mix) * data[end - fade + i] + mix * data[start - fade + i];
		}
	}
	return buffer;
}

/** The demo song's stems, looping in sync, with a mute and solo for each. */
export function useStems() {
	const [status, setStatus] = useState<Status>("idle");
	const [muted, setMuted] = useState<Flags>({});
	const [soloed, setSoloed] = useState<Flags>({});
	const context = useRef<AudioContext | null>(null);
	const gains = useRef<Record<string, GainNode>>({});
	const startedAt = useRef(0);

	// Soloing anything silences everything that isn't soloed.
	useEffect(() => {
		const audio = context.current;
		if (!audio) return;
		const anySolo = STEMS.some((stem) => soloed[stem.id]);
		for (const stem of STEMS) {
			const audible = anySolo ? soloed[stem.id] : !muted[stem.id];
			gains.current[stem.id]?.gain.setTargetAtTime(
				audible ? stem.volume : 0,
				audio.currentTime,
				0.01
			);
		}
	}, [muted, soloed, status]);

	useEffect(
		() => () => {
			context.current?.close();
		},
		[]
	);

	const start = useCallback(async () => {
		setStatus("loading");
		try {
			const audio = new AudioContext();
			context.current = audio;
			// Resumed within the click: browsers keep it silent otherwise.
			await audio.resume();
			const buffers = await Promise.all(
				STEMS.map(async (stem) => {
					const response = await fetch(
						`/tonique/stems/${stem.id}.mp3`
					);
					if (!response.ok) throw new Error(response.statusText);
					return sealLoop(await audio.decodeAudioData(await response.arrayBuffer()));
				})
			);
			const compressor = audio.createDynamicsCompressor();
			const master = audio.createGain();
			master.gain.value = MASTER_GAIN;
			master.connect(compressor).connect(audio.destination);
			const at = audio.currentTime + 0.1;
			STEMS.forEach((stem, index) => {
				const source = audio.createBufferSource();
				source.buffer = buffers[index];
				source.loop = true;
				// Each file holds the loop and one more second: looping inside
				// it stays seamless whatever delay its decoder adds.
				source.loopStart = LOOP_START;
				source.loopEnd = LOOP_START + LOOP_SECONDS;
				const gain = audio.createGain();
				gain.gain.value = stem.volume;
				source.connect(gain).connect(master);
				source.start(at);
				gains.current[stem.id] = gain;
			});
			startedAt.current = at;
			setStatus("playing");
		} catch {
			context.current?.close();
			context.current = null;
			setStatus("error");
		}
	}, []);

	const toggle = useCallback(() => {
		if (status === "idle" || status === "error") {
			start();
		} else if (status === "playing") {
			context.current?.suspend();
			setStatus("paused");
		} else if (status === "paused") {
			context.current?.resume();
			setStatus("playing");
		}
	}, [start, status]);

	/** Where the loop is, from 0 to 1. */
	const position = useCallback(() => {
		const audio = context.current;
		if (!audio) return 0;
		const elapsed = Math.max(0, audio.currentTime - startedAt.current);
		return (elapsed % LOOP_SECONDS) / LOOP_SECONDS;
	}, []);

	return {
		status,
		toggle,
		position,
		muted,
		soloed,
		toggleMute: (id: string) =>
			setMuted((flags) => ({ ...flags, [id]: !flags[id] })),
		toggleSolo: (id: string) =>
			setSoloed((flags) => ({ ...flags, [id]: !flags[id] })),
	};
}

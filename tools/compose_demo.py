#!/usr/bin/env python3
"""Tonique's web demo: an 8-bar melodic house loop, 126 BPM, F minor.

Every effect is circular, so tails wrap around and the loop has no seam.
Usage: compose_demo.py OUTPUT_FOLDER

Besides the stems and the project, writes `stems.ts` for `src/`: the
waveforms the page draws.
"""
import json
import sys
import wave
from pathlib import Path

import numpy as np
from scipy.signal import butter, sosfilt

SR = 44100
BPM = 126
S16 = 5250  # samples per sixteenth: exact at 126 BPM
BARS = 8
N = S16 * 16 * BARS
BAR = 16 * S16
rng = np.random.default_rng(11)

CHORDS = [  # two bars each
    [41, 60, 63, 67, 68],  # Fm9: F2 C4 Eb4 G4 Ab4
    [37, 56, 60, 63, 65],  # Dbmaj9: Db2 Ab3 C4 Eb4 F4
    [44, 55, 60, 63, 67],  # Abmaj7: Ab2 G3 C4 Eb4 G4
    [39, 55, 58, 63, 65],  # Eb(add9): Eb2 G3 Bb3 Eb4 F4
]
ROOTS = [41, 37, 32, 39]  # F2, Db2, Ab1, Eb2
ARP_NOTES = [
    [65, 68, 72, 75, 79],  # F Ab C Eb G
    [61, 65, 68, 72, 75],  # Db F Ab C Eb
    [63, 68, 72, 75, 79],  # Eb Ab C Eb G
    [63, 67, 70, 75, 77],  # Eb G Bb Eb F
]
ARP_PATTERN = [0, None, 2, 1, None, 3, 2, None, 4, None, 3, 2, None, 1, 3, None]
C5, Db5, Eb5, F5, G5, Ab4, Bb4, Bb5 = 72, 73, 75, 77, 79, 68, 70, 82
MELODY = [  # bar, sixteenth, length in sixteenths, note
    (0, 0, 6, C5), (0, 6, 2, Eb5), (0, 8, 6, F5), (0, 14, 2, Eb5),
    (1, 0, 10, C5), (1, 12, 2, Ab4), (1, 14, 2, Bb4),
    (2, 0, 6, C5), (2, 6, 2, Db5), (2, 8, 6, F5), (2, 14, 2, Eb5),
    (3, 0, 8, Db5), (3, 8, 4, C5), (3, 12, 4, Ab4),
    (4, 0, 6, Eb5), (4, 6, 2, C5), (4, 8, 6, G5), (4, 14, 2, F5),
    (5, 0, 10, Eb5), (5, 12, 2, C5), (5, 14, 2, Eb5),
    (6, 0, 6, F5), (6, 6, 2, G5), (6, 8, 6, Bb5), (6, 14, 2, G5),
    (7, 0, 8, F5), (7, 8, 4, Eb5), (7, 12, 4, C5),
]


def hz(note):
    return 440.0 * 2 ** ((note - 69) / 12)


def stereo():
    return np.zeros((2, N))


def place(buf, x, at, gain=(1.0, 1.0)):
    """Adds x (mono or stereo) at sample `at`, wrapping around the loop."""
    x = np.atleast_2d(x)
    if x.shape[0] == 1:
        x = np.vstack([x, x])
    idx = (int(at) + np.arange(x.shape[1])) % N
    for ch in range(2):
        np.add.at(buf[ch], idx, x[ch] * gain[ch])


def filt(x, kind, cutoff, order=2):
    sos = butter(order, cutoff, kind, fs=SR, output="sos")
    return sosfilt(sos, x, axis=-1)


def circular_filter(x, kind, cutoff, order=2):
    """Filters two passes around the loop and keeps the settled second."""
    tiled = np.concatenate([x, x], axis=-1)
    return filt(tiled, kind, cutoff, order)[..., N:]


def env_ad(n, attack, tau):
    t = np.arange(n) / SR
    return np.minimum(t / attack, 1.0) * np.exp(-t / tau)


def fade_tail(x, seconds=0.008):
    k = min(int(seconds * SR), x.shape[-1])
    x = x.copy()
    x[..., -k:] *= np.linspace(1, 0, k)
    return x


def additive(freq, n, rolloff, decay_base, decay_per_harm, max_harm=40, gen=rng):
    """A plucked tone: higher harmonics die first, as with a closing filter."""
    t = np.arange(n) / SR
    out = np.zeros(n)
    top = min(max_harm, int(17000 / freq))
    for k in range(1, top + 1):
        amp = k ** -rolloff * np.exp(-t * (decay_base + decay_per_harm * k))
        out += amp * np.sin(2 * np.pi * k * freq * t + gen.uniform(0, 0.3))
    return out * np.minimum(t / 0.0025, 1.0)


def sidechain(depth, tau=0.11):
    """Ducks on every beat, like a compressor keyed by the kick."""
    t = (np.arange(N) % (4 * S16)) / SR
    return 1 - depth * np.exp(-t / tau) * np.minimum(t / 0.004 + 0.6, 1.0)


def reverb(x, seconds, wet, predelay=0.02, low=250, high=7000, seed=1):
    gen = np.random.default_rng(seed)
    n = min(int(seconds * 3 * SR), N - 1)
    t = np.arange(n) / SR
    ir = gen.standard_normal((2, n)) * np.exp(-t * 6.9 / seconds)
    ir = filt(filt(ir, "highpass", low), "lowpass", high)
    ir /= np.sqrt((ir**2).sum(axis=-1, keepdims=True))
    pre = np.zeros((2, N))
    start = int(predelay * SR)
    pre[:, start : start + n] = ir[:, : N - start]
    wet_sig = np.fft.irfft(np.fft.rfft(x, axis=-1) * np.fft.rfft(pre, axis=-1), n=N, axis=-1)
    return x + wet * wet_sig


def ping_pong(x, step16, feedback, repeats, wet, high=4500):
    out = x.copy()
    mono = x.mean(axis=0)
    mono = circular_filter(mono, "lowpass", high)
    level = wet
    for r in range(1, repeats + 1):
        d = np.roll(mono, r * step16 * S16)
        out[(r + 1) % 2] += level * d
        level *= feedback
    return out


def normalized(x, peak=0.89):
    return x * peak / np.abs(x).max()


def swing(sixteenth):
    return int(0.09 * S16) if sixteenth % 2 else 0


# ---------------------------------------------------------------- drums
def kick():
    n = int(0.42 * SR)
    t = np.arange(n) / SR
    f = 52 + 125 * np.exp(-t / 0.016) + 28 * np.exp(-t / 0.07)
    x = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t / 0.2)
    click = filt(rng.standard_normal(n), "highpass", 2500) * np.exp(-t / 0.002) * 0.25
    x = fade_tail(np.tanh(1.8 * (x + click)))
    out = stereo()
    for beat in range(BARS * 4):
        place(out, x, beat * 4 * S16)
    return out


def clap_hit():
    n = int(0.3 * SR)
    t = np.arange(n) / SR
    noise = rng.standard_normal(n)
    body = np.zeros(n)
    for delay, level in [(0, 0.7), (0.011, 0.8), (0.022, 1.0)]:
        d = int(delay * SR)
        burst = np.zeros(n)
        burst[d:] = np.exp(-t[: n - d] / (0.006 if delay < 0.02 else 0.085))
        body += level * burst
    x = filt(filt(noise * body, "highpass", 1100), "lowpass", 7500)
    return fade_tail(x / np.abs(x).max())


def clap():
    out = stereo()
    hit = clap_hit()
    for bar in range(BARS):
        place(out, hit, bar * BAR + 4 * S16)
        place(out, hit, bar * BAR + 12 * S16)
    # A small pickup closes each phrase.
    for bar, levels in [(3, [0.35]), (7, [0.28, 0.42, 0.6])]:
        for i, level in enumerate(levels):
            place(out, hit * level, bar * BAR + (16 - len(levels) + i) * S16)
    return reverb(out, 0.9, 0.32, seed=2)


def hats():
    out = stereo()
    n_c, n_o = int(0.07 * SR), int(0.26 * SR)
    for s in range(BARS * 16):
        pos = s % 16
        at = s * S16 + swing(s)
        if pos % 4 == 2:  # the off-beat open hat drives the groove
            x = rng.standard_normal(n_o) * env_ad(n_o, 0.001, 0.075)
            x = filt(x, "highpass", 7500)
            place(out, fade_tail(x), at, (0.92, 1.0))
        else:
            vel = 0.5 if pos % 2 else 0.28
            vel *= rng.uniform(0.9, 1.1)
            x = rng.standard_normal(n_c) * env_ad(n_c, 0.0008, 0.016)
            x = filt(x, "highpass", 9000)
            pan = (1.0, 0.72) if pos % 2 else (0.72, 1.0)
            place(out, fade_tail(x) * vel, at, pan)
    return reverb(out, 0.5, 0.1, seed=3)


# ------------------------------------------------------------------ bass
BASS_PATTERN = [(2, 2), (5, 1), (6, 2), (10, 2), (13, 1), (14, 2)]


def bass():
    out = np.zeros(N)
    for bar in range(BARS):
        root = ROOTS[bar // 2]
        for start, length in BASS_PATTERN:
            note = root
            if bar % 2 == 1 and start == 14:  # lifts into the next chord
                note = root + 12
            n = int(length * S16 * 0.92)
            t = np.arange(n) / SR
            f = hz(note)
            tone = np.sin(2 * np.pi * f * t)
            upper = additive(f, n, 1.1, 5, 2.4, max_harm=14)
            x = 0.7 * tone + 0.8 * upper
            x = np.tanh(1.15 * x) * np.minimum(t / 0.003, 1)
            place_mono = np.zeros(n)
            place_mono[:] = fade_tail(x, 0.012)
            idx = (bar * BAR + start * S16 + swing(start) + np.arange(n)) % N
            np.add.at(out, idx, place_mono)
    out = circular_filter(out, "lowpass", 3400)
    out *= sidechain(0.35, 0.07)
    return np.vstack([out, out])


# ---------------------------------------------------------------- chords
def pad_chord(notes, n):
    """A wide pad, sustained over two bars, in dark and bright layers."""
    t = np.arange(n) / SR
    dark, bright = np.zeros((2, n)), np.zeros((2, n))
    for note in notes[1:]:  # the bass plays the root
        for voice, cents in enumerate([-11, -5, 0, 5, 11]):
            f = hz(note) * 2 ** (cents / 1200)
            ch = voice % 2
            phases = rng.uniform(0, 2 * np.pi, 16)
            for k in range(1, 17):
                if k * f > 15000:
                    break
                wave_k = np.sin(2 * np.pi * k * f * t + phases[k - 1]) / k**1.15
                if k <= 4:
                    dark[ch] += wave_k
                    if voice == 2:
                        dark[1 - ch] += wave_k
                else:
                    bright[ch] += wave_k
                    if voice == 2:
                        bright[1 - ch] += wave_k
    return dark, bright


def chords():
    pad = stereo()
    n = 2 * BAR
    xf = int(0.09 * SR)
    for i, notes in enumerate(CHORDS):
        dark, bright = pad_chord(notes, n + xf)
        at = i * n
        t = (at + np.arange(n + xf)) / SR
        sweep = 0.34 + 0.26 * np.sin(2 * np.pi * t / (N / SR) - 1.2)
        tone = dark + bright * sweep
        window = np.ones(n + xf)
        window[:xf] = np.linspace(0, 1, xf)
        window[-xf:] = np.linspace(1, 0, xf)
        place(pad, tone * window, at)
    pad = circular_filter(pad, "highpass", 180)
    pad *= sidechain(0.62)

    stabs = stereo()
    rhythm = [3, 6, 11, 14]
    for bar in range(BARS):
        notes = CHORDS[bar // 2][1:]
        for pos in rhythm:
            n_s = int(0.42 * SR)
            for j, note in enumerate(notes):
                left = additive(hz(note) * 2 ** (-6 / 1200), n_s, 1.05, 7, 2.3, 24)
                right = additive(hz(note) * 2 ** (6 / 1200), n_s, 1.05, 7, 2.3, 24)
                x = np.vstack([left, right]) * env_ad(n_s, 0.002, 0.6)
                place(stabs, fade_tail(x), bar * BAR + pos * S16 + swing(pos) + j * 25)
    stabs = circular_filter(stabs, "highpass", 220)
    stabs = reverb(stabs, 1.3, 0.38, seed=4)
    pad = normalized(pad, 0.5)
    stabs = normalized(stabs, 0.75)
    return reverb(pad, 1.6, 0.18, seed=5) + stabs


# ------------------------------------------------------------------- arp
def arp():
    out = stereo()
    for bar in range(BARS):
        notes = ARP_NOTES[bar // 2]
        for s, degree in enumerate(ARP_PATTERN):
            if degree is None:
                continue
            n = int(0.34 * SR)
            f = hz(notes[degree] + 12 if bar % 4 == 3 and s >= 8 else notes[degree])
            x = additive(f, n, 1.3, 9, 3.2, 22) + 0.25 * additive(2 * f, n, 2.2, 14, 4, 6)
            vel = 1.0 if s % 4 == 0 else 0.72
            place(out, fade_tail(x) * vel, bar * BAR + s * S16 + swing(s))
    out = circular_filter(out, "highpass", 380)
    out = ping_pong(out, 3, 0.52, 7, 0.55)
    out *= sidechain(0.28)
    return reverb(out, 1.4, 0.3, seed=6)


# ------------------------------------------------------------------ lead
def lead():
    freq = np.zeros(N)
    level = np.zeros(N)
    bright = np.zeros(N)
    last_note = MELODY[-1][3]
    for bar, s, length, note in MELODY:
        at = bar * BAR + s * S16
        n = length * S16
        glide = int(0.035 * SR)
        idx = (at + np.arange(n)) % N
        target = np.full(n, float(note))
        k = min(glide, n)
        target[:k] = last_note + (note - last_note) * (1 - np.exp(-np.arange(k) / (k / 4)))
        freq[idx] = target
        t = np.arange(n) / SR
        # A touch of vibrato arrives on the longer notes.
        depth = 0.16 * np.clip((t - 0.18) / 0.2, 0, 1)
        freq[idx] += depth * np.sin(2 * np.pi * 5.2 * t)
        gate = int(n * 0.94)
        amp = np.minimum(t / 0.012, 1.0) * (0.72 + 0.28 * np.exp(-t / 0.2))
        amp[gate:] *= np.linspace(1, 0, n - gate)
        level[idx] = amp
        bright[idx] = 0.25 + 0.75 * np.exp(-t / 0.22)
        last_note = note
    out = stereo()
    for ch, cents in enumerate([-7, 7]):
        phase = 2 * np.pi * np.cumsum(hz(freq) * 2 ** (cents / 1200)) / SR
        # Each sample's period must fit the loop: pull the total to a whole cycle.
        phase *= np.round(phase[-1] / (2 * np.pi)) * 2 * np.pi / phase[-1]
        tone = 0.9 * np.sin(phase) + 0.42 * np.sin(2 * phase)
        for k in range(3, 11):
            tone += bright * np.sin(k * phase) / k**1.2
        tone += 0.28 * np.sin(phase / 2 + ch)
        out[ch] = tone * level
    out = circular_filter(out, "highpass", 260)
    out = circular_filter(out, "lowpass", 8000)
    out = ping_pong(out, 3, 0.42, 5, 0.32, high=3800)
    out = reverb(out, 2.0, 0.36, predelay=0.03, seed=7)
    return out * sidechain(0.14)


def write(folder, name, x, frames=None):
    data = np.clip(x, -1, 1)
    if frames:
        idx = np.arange(frames) % N
        data = data[:, idx]
    pcm = (data.T * 32767).astype("<i2")
    with wave.open(str(folder / name), "wb") as w:
        w.setnchannels(2)
        w.setsampwidth(2)
        w.setframerate(SR)
        w.writeframes(pcm.tobytes())


TRACKS = [
    ("Kick", "#e5604c", 0.68, kick),
    ("Clap", "#ec8a3f", 0.5, clap),
    ("Hats", "#e8b33c", 0.6, hats),
    ("Bass", "#4fbf7f", 0.46, bass),
    ("Chords", "#4a9fe0", 0.72, chords),
    ("Arp", "#d46cc8", 0.5, arp),
    ("Lead", "#9a7be6", 0.8, lead),
]

LOOP = N / SR
LAYOUT = {  # bars where each track plays, in the app's arrangement
    "Kick": [(8, 8), (20, 8)],
    "Clap": [(12, 4), (20, 8)],
    "Hats": [(4, 12), (20, 8)],
    "Bass": [(8, 8), (20, 8)],
    "Chords": [(0, 4), (4, 4), (8, 8), (16, 4), (20, 8)],
    "Arp": [(4, 12), (16, 4), (20, 8)],
    "Lead": [(8, 8), (20, 8)],
}


GROUP_VOLUME = 0.9  # the Drums group's fader
ARRANGEMENT_BARS = 28


def project(master_volume):
    tracks = []
    for name, color, volume, _ in TRACKS:
        clips = []
        for bar, bars in LAYOUT[name]:
            clips.append({
                "path": f"{name}.wav",
                "position": bar * 4.0,
                "offset": 0.0,
                "length": bars * 4.0,
                "looped": {"start": 0.0, "end": LOOP},
            })
        tracks.append({
            "name": name,
            "color": color,
            "height": 60.0,
            "collapsed": False,
            "soloed": False,
            "group": 0 if name in ("Kick", "Clap", "Hats") else None,
            "volume": volume,
            "pan": 0.0,
            "muted": False,
            "effects": [],
            "clips": clips,
        })
    return {
        "version": 5,
        "bpm": float(BPM),
        "loop_range": [32.0, 64.0],
        "looping": True,
        "master": {"volume": master_volume, "pan": 0.0, "muted": False, "effects": []},
        "groups": [{
            "name": "Drums",
            "color": "#e5604c",
            "height": 60.0,
            "collapsed": False,
            "soloed": False,
            "parent": None,
            "volume": GROUP_VOLUME,
            "pan": 0.0,
            "muted": False,
            "effects": [],
        }],
        "tracks": tracks,
    }


def arrangement(stems, start_bar, bars):
    """Each track's signal after its fader, as the app plays its clips, and
    the Drums group's, over `bars` from `start_bar`."""
    t = start_bar * BAR + np.arange(bars * BAR)
    tracks = {}
    for name, _, volume, _ in TRACKS:
        y = np.zeros((2, t.size))
        for bar, length in LAYOUT[name]:
            inside = (t >= bar * BAR) & (t < (bar + length) * BAR)
            y[:, inside] = stems[name][:, (t[inside] - bar * BAR) % N]
        tracks[name] = volume * y
    drums = GROUP_VOLUME * (tracks["Kick"] + tracks["Clap"] + tracks["Hats"])
    return tracks, drums


def stems_ts(meta):
    return "\n".join([
        "// The demo song's stems: waveform peaks, one per column, over the 8-bar loop.",
        f"export const LOOP_SECONDS = {LOOP:.6f};",
        f"export const MASTER_GAIN = {meta['master']:.3f};",
        "",
        f"export const STEMS = {json.dumps(meta['stems'], separators=(',', ':'))} as const;",
        "",
    ])


if __name__ == "__main__":
    out = Path(sys.argv[1])
    out.mkdir(parents=True, exist_ok=True)
    mix = stereo()
    meta = []
    stems = {}
    for name, color, volume, render in TRACKS:
        x = normalized(render())
        stems[name] = x
        write(out, f"{name}.wav", x)
        # One extra second: the page loops inside it, past any decoder delay.
        write(out, f"{name}-web.wav", x, frames=N + SR)
        mix += volume * x
        columns = 320
        peaks = [
            int(round(100 * np.abs(x[:, i * N // columns : (i + 1) * N // columns]).max()))
            for i in range(columns)
        ]
        top = max(peaks) or 1
        meta.append({
            "id": name.lower(),
            "name": name,
            "color": color,
            "volume": volume,
            "peaks": [round(p * 100 / top) for p in peaks],
        })
        print(f"{name:7s} rms {20 * np.log10(np.sqrt((x**2).mean())):6.1f} dB", flush=True)
    peak = np.abs(mix).max()
    master = 0.88 / peak
    print(f"mix peak {peak:.2f}, master gain {master:.3f}")
    write(out, "mix.wav", mix * master)
    # The project's master: the whole arrangement, as the app mixes it,
    # peaking just under full scale.
    tracks, drums = arrangement(stems, 0, ARRANGEMENT_BARS)
    app_mix = drums + sum(y for name, y in tracks.items() if name not in ("Kick", "Clap", "Hats"))
    master_volume = round(0.89 / np.abs(app_mix).max(), 2)
    print(f"app mix peak {np.abs(app_mix).max():.2f}, master volume {master_volume}")
    (out / "Demo Song.tonique").write_text(json.dumps(project(master_volume), indent=2))
    meta = {"loop": LOOP, "master": master, "stems": meta}
    (out / "meta.json").write_text(json.dumps(meta))
    (out / "stems.ts").write_text(stems_ts(meta))

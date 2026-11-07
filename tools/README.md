# Tools

How the page's audio and screenshots are made.

## Demo song

`compose_demo.py` writes the stems and a Tonique project into a folder. It needs NumPy and SciPy.

```bash
python3 tools/compose_demo.py /tmp/song
```

It also writes `stems.ts`, the waveform peaks the Listen mixer draws, which `screenshots.sh` copies into
`src/`. It mixes the arrangement as the app plays it, to set the project's master so that it peaks just
under full scale. The page plays each `<Stem>-web.wav`, encoded to `public/stems/<stem>.mp3` (128 kbps).

## Screenshots

```bash
python3 -m venv .venv && .venv/bin/pip install -r tools/requirements.txt
PYTHON=.venv/bin/python tools/screenshots.sh path/to/ToniqueDAW        # the latest tag
PYTHON=.venv/bin/python tools/screenshots.sh path/to/ToniqueDAW v0.3.0 # or a given one
```

It needs a [ToniqueDAW](https://github.com/rravelli/ToniqueDAW) clone, Rust, a GPU with Vulkan and ffmpeg
(with SVT-AV1 and x264), and leaves the clone as it is. It:

1. makes the demo song, keeping only the seven `<Stem>.wav` files and `Demo Song.tonique` in a folder named
   `Demo Song`, because the file browser appears in the captures;
2. checks out the release in a temporary worktree and applies `tonique-page-images.patch`, which doubles the
   capture resolution and adds a `page_images` test that renders every view. The test plays the song by
   rendering its audio offline, a video frame's worth (1/31.5 s) at a time, and times the app's meters by
   that audio, so every run gives the same images. The theme images are taken 2.5 s after bar 13. The
   hero is the project's loop (bars 9 to 17, exactly 480 frames) played twice, the second time recorded,
   so the video loops without a seam;
3. runs that test, then `crop_shots.py`, which writes the captures as lossless WebP: `public/themes/` holds
   the full captures, `public/shots/` the crops, and `public/hero.webp` the video's first frame, its poster;
4. encodes the hero's frames to `public/hero.webm` (AV1) and `public/hero.mp4` (H.264).

If a release moves the panels, change the crop rectangles in `crop_shots.py`. If the patch stops applying,
update it against the release's `src/ui/app/tests/readme.rs`.

# Tools

How the page's audio and screenshots are made.

## Demo song

`compose_demo.py` writes the stems and a Tonique project into a folder. It needs NumPy and SciPy.

```bash
python3 tools/compose_demo.py /tmp/song
```

It also writes `meta.json`: the waveform peaks and levels behind `src/stems.ts`. The page plays each
`<Stem>-web.wav`, encoded to `public/stems/<stem>.mp3` (128 kbps).

## Screenshots

`tonique-page-images.patch` applies to the [ToniqueDAW](https://github.com/rravelli/ToniqueDAW) repo. It
doubles the capture resolution and adds a `page_images` test that renders every view.

Keep only the seven `<Stem>.wav` files and `Demo Song.tonique` in a folder named `Demo Song`, because the
file browser appears in the captures. Then, in ToniqueDAW:

```bash
git apply path/to/tonique-page-images.patch
TONIQUE_DEMO_SONG="/path/to/Demo Song/Demo Song.tonique" WGPU_BACKEND=vulkan TONIQUE_IMAGES_DIR=/tmp/shots \
    cargo test --bin tonique_daw -- --ignored --nocapture ui::app::tests::readme::page_images
```

The site uses them as lossless WebP: `public/themes/` holds the full captures, `public/shots/` the crops.

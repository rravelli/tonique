#!/usr/bin/env bash
# Takes the site's screenshots again, of a ToniqueDAW release.
#
# Usage: tools/screenshots.sh PATH/TO/ToniqueDAW [REF]
#
# REF is the tag or commit to capture, the latest tag by default. The checkout
# is left as it is: the capture runs in a temporary worktree, with the patch
# applied there, and builds into the checkout's own `target/`. Needs Rust, a
# GPU with Vulkan, ffmpeg (with SVT-AV1 and x264), and Python with
# tools/requirements.txt (set PYTHON to use a virtual environment's).
set -euo pipefail

daw=$(realpath "${1:?usage: $0 PATH/TO/ToniqueDAW [REF]}")
ref=${2:-$(git -C "$daw" tag --list 'v*' --sort=-v:refname | head -n 1)}
python=${PYTHON:-python3}
tools=$(dirname "$(realpath "$0")")
work=$(mktemp -d)
cleanup() {
    git -C "$daw" worktree remove --force "$work/daw" 2>/dev/null || true
    rm -rf "$work"
}
trap cleanup EXIT

echo "Capturing ToniqueDAW $ref"

# The demo song. Only the stems and the project go in its folder: the file
# browser shows it.
"$python" "$tools/compose_demo.py" "$work/song"
mkdir "$work/Demo Song"
for stem in Arp Bass Chords Clap Hats Kick Lead; do
    cp "$work/song/$stem.wav" "$work/Demo Song/"
done
cp "$work/song/Demo Song.tonique" "$work/Demo Song/"
# The waveforms the page draws.
cp "$work/song/stems.ts" "$tools/../src/"

git -C "$daw" worktree add --detach "$work/daw" "$ref"
git -C "$work/daw" apply "$tools/tonique-page-images.patch"
(
    cd "$work/daw"
    CARGO_TARGET_DIR="$daw/target" \
        TONIQUE_DEMO_SONG="$work/Demo Song/Demo Song.tonique" \
        TONIQUE_IMAGES_DIR="$work/captures" \
        WGPU_BACKEND=${WGPU_BACKEND:-vulkan} \
        cargo test --bin tonique_daw -- --ignored --nocapture ui::app::tests::readme::page_images
)

"$python" "$tools/crop_shots.py" "$work/captures"

# The hero's video, 2436 pixels wide: sharp on a 2x screen at the width the
# page shows it. 63/2 fps: the loop is exactly 480 frames. AV1, and H.264 for
# browsers without it.
public="$tools/../public"
frames=(-framerate 63/2 -i "$work/captures/hero-frames/%04d.png"
    -vf "scale=2436:-2:flags=lanczos,format=yuv420p" -g 120 -an)
ffmpeg -hide_banner -loglevel error -y "${frames[@]}" \
    -c:v libsvtav1 -preset 4 -crf 32 "$public/hero.webm"
ffmpeg -hide_banner -loglevel error -y "${frames[@]}" \
    -c:v libx264 -preset slow -crf 22 -tune animation -movflags +faststart "$public/hero.mp4"
echo "Wrote public/hero.webm and public/hero.mp4"

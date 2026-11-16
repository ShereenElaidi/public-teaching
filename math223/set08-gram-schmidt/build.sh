#!/usr/bin/env bash
# Render the Manim steps for scenes 002–003 and copy them into clips/.
#
#   ./build.sh                 final quality (1680×1344, 60 fps), dark + bright boards
#   ./build.sh draft           480p drafts (560×448, 15 fps) into clips-draft/ for checking frames
#   ./build.sh final 003       only some scenes
#   PALETTES=dark ./build.sh   only the dark board
#
# Needs Manim Community ≥ 0.18 and LaTeX. Point MANIM at your manim executable if it is not on
# PATH, e.g.  MANIM="$HOME/venvs/manim/bin/manim" ./build.sh
# Output per step: clips/<palette>/<scene>_<step>.mp4 (silent, faststart) and
#                  clips/<palette>/<scene>_<step>.jpg (its last frame, shown when stepping back),
#                  plus <scene>_0.jpg (the first frame of step 1).
set -euo pipefail
HERE="$(cd "$(dirname "$0")" && pwd)"
MODE="${1:-final}"; shift || true
SCENES=("${@:-002 003}"); SCENES=(${SCENES[@]})
PALETTES=(${PALETTES:-dark bright})
MANIM="${MANIM:-$(command -v manim || true)}"
[ -x "$MANIM" ] || { echo "manim not found: set MANIM=/path/to/manim" >&2; exit 1; }
command -v ffmpeg >/dev/null || { echo "ffmpeg not found" >&2; exit 1; }

if [ "$MODE" = draft ]; then RES=560,448; FPS=15; OUT="$HERE/clips-draft"
else RES=1680,1344; FPS=60; OUT="$HERE/clips"; fi

MEDIA="$HERE/manim/.media"
cd "$HERE/manim"
for pal in "${PALETTES[@]}"; do
  mkdir -p "$OUT/$pal"
  for s in "${SCENES[@]}"; do
    echo "== Scene$s ($pal, $MODE)"
    rm -rf "$MEDIA/$pal"
    CHALK_PALETTE="$pal" "$MANIM" scenes.py "Scene$s" -r "$RES" --fps "$FPS" \
      --save_sections --media_dir "$MEDIA/$pal" --disable_caching --progress_bar none -v WARNING >/dev/null
    secdir="$(dirname "$(find "$MEDIA/$pal" -path '*sections*' -name "Scene${s}_*.mp4" | head -1)")"
    first=1
    for f in $(ls "$secdir"/Scene${s}_*.mp4 | sort); do
      name="$(basename "$f" .mp4)"; step="${name##*_}"        # Scene002_0000_002_1 -> 1
      dst="$OUT/$pal/${s}_${step}"
      # Manim encodes with the BT.601 matrix but leaves it untagged; browsers would then decode
      # with BT.709 and the board comes out ~4 levels off the CSS board. Tag it, so the seam vanishes.
      ffmpeg -loglevel error -y -i "$f" -an -c:v libx264 -preset slow -crf 20 -pix_fmt yuv420p \
        -colorspace smpte170m -color_primaries smpte170m -color_trc smpte170m -color_range tv \
        -movflags +faststart "$dst.mp4"
      ffmpeg -loglevel error -y -sseof -0.25 -i "$dst.mp4" -update 1 -q:v 2 "$dst.jpg"
      if [ $first = 1 ]; then
        ffmpeg -loglevel error -y -i "$dst.mp4" -frames:v 1 -q:v 2 "$OUT/$pal/${s}_0.jpg"; first=0
      fi
      echo "   $(basename "$dst").mp4"
    done
  done
done
rm -rf "$MEDIA"
du -sh "$OUT"

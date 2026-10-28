#!/bin/bash
# Assembles the final ARCHON demo video from captured screenshots/footage + narration.
# Free, local, ffmpeg-only pipeline.
set -euo pipefail
cd "$(dirname "$0")"

AUDIO=audio
SHOTS=shots
VIDEO=video
OUT=build
mkdir -p "$OUT"
rm -f "$OUT"/clip_*.mp4

W=1920
H=1080
FPS=30

# --- durations (seconds), from the narration segments ---
D_HOOK=16.152
D_WHAT=18.912
D_LOOP=28.032
D_FORK=29.832
D_LOOPFORK=$(python3 -c "print(${D_LOOP}+${D_FORK})")
D_NUMBERS=23.040
D_MIGRATION=23.280
D_CLOSE=10.200

kenburns() {
  # $1 = input image, $2 = output clip, $3 = duration seconds, $4 = zoom direction (in|out)
  local img="$1" out="$2" dur="$3" dir="$4"
  local frames
  frames=$(python3 -c "print(int(${dur}*${FPS}))")
  local zexpr
  if [ "$dir" = "in" ]; then
    zexpr="zoom+0.0006"
  else
    zexpr="1.15-0.0006*on"
  fi
  ffmpeg -y -loop 1 -i "$img" -filter_complex \
    "[0:v]scale=${W}:-1,crop=${W}:${H},zoompan=z='${zexpr}':d=${frames}:s=${W}x${H}:fps=${FPS},format=yuv420p[v]" \
    -map "[v]" -t "$dur" -c:v libx264 -pix_fmt yuv420p -r ${FPS} "$out" -loglevel error
}

trimvideo() {
  # $1 = input webm, $2 = output clip, $3 = start, $4 = duration
  ffmpeg -y -i "$1" -ss "$3" -t "$4" -vf "scale=${W}:${H}:force_original_aspect_ratio=decrease,pad=${W}:${H}:(ow-iw)/2:(oh-ih)/2,fps=${FPS},format=yuv420p" \
    -c:v libx264 -pix_fmt yuv420p -an "$2" -loglevel error
}

echo "1/7 hook (red failing test, held)"
kenburns "$SHOTS/psf__requests-1142_frame_01.png" "$OUT/clip_01_hook.mp4" "$D_HOOK" "in"

echo "2/7 what it is (home page)"
kenburns "$SHOTS/02_home.png" "$OUT/clip_02_what.mp4" "$D_WHAT" "in"

echo "3/7 loop live + fork (real mission footage)"
PSF_WEBM=$(ls "$VIDEO"/*.webm | sort | sed -n '1p')
trimvideo "$PSF_WEBM" "$OUT/clip_03_loopfork.mp4" 0 "$D_LOOPFORK"

echo "4/7 numbers (final approved state, held)"
ffmpeg -y -sseof -1 -i "$OUT/clip_03_loopfork.mp4" -vframes 1 "$OUT/numbers_still.png" -loglevel error
kenburns "$OUT/numbers_still.png" "$OUT/clip_04_numbers.mp4" "$D_NUMBERS" "out"

echo "5/7 migration (real footage)"
MIGR_WEBM=$(ls "$VIDEO"/*.webm | sort | sed -n '2p')
trimvideo "$MIGR_WEBM" "$OUT/clip_05_migration.mp4" 0 "$D_MIGRATION"

echo "6/7 close (github repo)"
kenburns "$SHOTS/07_github_repo.png" "$OUT/clip_06_close.mp4" "$D_CLOSE" "in"

echo "7/7 concatenating video + narration"
cat > "$OUT/concat_list.txt" <<EOF
file 'clip_01_hook.mp4'
file 'clip_02_what.mp4'
file 'clip_03_loopfork.mp4'
file 'clip_04_numbers.mp4'
file 'clip_05_migration.mp4'
file 'clip_06_close.mp4'
EOF

ffmpeg -y -f concat -safe 0 -i "$OUT/concat_list.txt" -c:v libx264 -pix_fmt yuv420p -r ${FPS} "$OUT/video_only.mp4" -loglevel error

ffmpeg -y -i "$OUT/video_only.mp4" -i "$AUDIO/full_narration_preview.mp3" \
  -c:v copy -c:a aac -b:a 192k -shortest \
  "$OUT/archon_demo.mp4" -loglevel error

echo "Done: $OUT/archon_demo.mp4"
ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "$OUT/archon_demo.mp4"

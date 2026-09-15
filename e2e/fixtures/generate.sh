#!/usr/bin/env bash
# Generates deterministic media fixtures into e2e/fixtures/media/.
# Requires ffmpeg. Commit the outputs (small, ~hundreds of KB) so CI doesn't need ffmpeg.
set -euo pipefail
cd "$(dirname "$0")"
mkdir -p media/hls media/broken

# 8 s mp4: synthetic test pattern + 440 Hz sine, baseline-friendly settings
ffmpeg -y \
  -f lavfi -i "testsrc=duration=8:size=640x360:rate=30" \
  -f lavfi -i "sine=frequency=440:duration=8" \
  -c:v libx264 -profile:v baseline -level 3.0 -pix_fmt yuv420p \
  -force_key_frames "expr:gte(t,n_forced*2)" \
  -c:a aac -b:a 96k -shortest \
  media/short.mp4

# HLS VOD from the same clip, 2 s segments
ffmpeg -y -i media/short.mp4 \
  -c copy -start_number 0 \
  -hls_time 2 -hls_list_size 0 -hls_playlist_type vod \
  -hls_segment_filename "media/hls/seg_%03d.ts" \
  media/hls/index.m3u8

# Intentionally broken manifest (parse error path)
cat > media/broken/index.m3u8 <<'EOF'
#EXTM3U
#EXT-X-VERSION:3
#EXT-X-TARGETDURATION:not-a-number
#EXTINF:2.0,
missing-segment.ts
EOF

echo "Fixtures written to $(pwd)/media"
ls -laR media

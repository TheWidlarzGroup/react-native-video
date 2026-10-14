#!/usr/bin/env bash
# Generates deterministic media fixtures into e2e/fixtures/media/.
# Requires ffmpeg. Commit the outputs (small, ~hundreds of KB) so CI doesn't need ffmpeg.
set -euo pipefail
cd "$(dirname "$0")"
mkdir -p media/hls media/broken media/missing-segment media/hls-quality

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

# Valid manifest whose last two segments do not exist (failure during playback): the
# first two segments load and play, then the next request gets a 404.
cat > media/missing-segment/index.m3u8 <<'EOF'
#EXTM3U
#EXT-X-VERSION:3
#EXT-X-TARGETDURATION:2
#EXT-X-MEDIA-SEQUENCE:0
#EXT-X-PLAYLIST-TYPE:VOD
#EXTINF:2.000000,
../hls/seg_000.ts
#EXTINF:2.000000,
../hls/seg_001.ts
#EXTINF:2.000000,
does-not-exist_002.ts
#EXTINF:2.000000,
does-not-exist_003.ts
#EXT-X-ENDLIST
EOF

# Multi-rendition HLS VOD (video quality selection): three video renditions of the same clip
# (640x360, 320x180, 160x90), 2 s segments, each with its own copy of the audio.
ffmpeg -y \
  -f lavfi -i "testsrc=duration=8:size=640x360:rate=30" \
  -f lavfi -i "sine=frequency=440:duration=8" \
  -filter_complex "[0:v]split=3[a][b][c];[a]scale=640:360[v0];[b]scale=320:180[v1];[c]scale=160:90[v2]" \
  -map "[v0]" -map "[v1]" -map "[v2]" -map 1:a -map 1:a -map 1:a \
  -c:v libx264 -profile:v baseline -level 3.0 -pix_fmt yuv420p \
  -b:v:0 900k -b:v:1 400k -b:v:2 150k \
  -force_key_frames "expr:gte(t,n_forced*2)" \
  -c:a aac -b:a 48k -ac 2 \
  -f hls -hls_time 2 -hls_list_size 0 -hls_playlist_type vod \
  -hls_segment_type mpegts \
  -var_stream_map "v:0,a:0 v:1,a:1 v:2,a:2" \
  -master_pl_name index.m3u8 \
  -hls_segment_filename "media/hls-quality/v%v_%03d.ts" \
  "media/hls-quality/v%v.m3u8"

echo "Fixtures written to $(pwd)/media"
ls -laR media

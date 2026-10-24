#!/bin/bash
# Rebuild the v3 Hinglish sell video from the base render (run from the repo root).
# Base: handoff/v3-kit/v3-base-render-no-overlays.mp4 (Ref 13, 16:9 inside 9:16, stage band y=656..1264, 1080x608).
# Adds 3 "video inside video" moments, then optionally music with mix-music.sh.
set -e
K=handoff/v3-kit; F=$K/v3-base-render-no-overlays.mp4; EX=$K/example-reels/hinglish-example-1.mp4
FONT=/usr/share/fonts/opentype/inter/Inter-ExtraBold.otf; T=$(mktemp -d)
LBL="drawbox=x=36:y=30:w=330:h=58:color=0xE5262A@1:t=fill,drawtext=fontfile=$FONT:text='▶  Made with 1 click':x=56:y=44:fontsize=30:fontcolor=white"
# A (3.0–6.0 s, "Ye video dekho"): blurred dark band + phone frame with a Hinglish example reel + red label.
ffmpeg -loglevel error -y -ss 3.0 -t 3.0 -i $F -ss 0.3 -t 3.0 -i $EX -filter_complex "[0:v]crop=1080:608:0:656,boxblur=18,eq=brightness=-0.28[bg];[1:v]scale=-2:520,pad=iw+16:ih+16:8:8:0x111111,pad=iw+6:ih+6:3:3:white[ph];[bg][ph]overlay=(W-w)/2:(H-h)/2,$LBL[v]" -map "[v]" -an -c:v libx264 -crf 18 -pix_fmt yuv420p $T/A.mp4
# B (7.2–10.6 s, "30 aur videos"): 3x3 grid of 9 reels (value-videos bands) with white borders on dark bg.
V=($(ls value-videos/*.mp4 | head -9)); IN=""; for v in "${V[@]}"; do IN="$IN -ss 1 -t 3.4 -i $v"; done
G=""; L=""; for k in 0 1 2 3 4 5 6 7 8; do G="$G[$k:v]crop=1080:608:0:656,scale=336:189,setsar=1,pad=340:193:2:2:white[g$k];"; L="$L[g$k]"; done
ffmpeg -loglevel error -y $IN -f lavfi -t 3.4 -i color=c=0x15161a:s=1080x608 -filter_complex "$G${L}xstack=inputs=9:layout=0_0|354_0|708_0|0_204|354_204|708_204|0_408|354_408|708_408[grid];[9:v][grid]overlay=(W-w)/2:(H-h)/2+4[v]" -map "[v]" -an -c:v libx264 -crf 18 -pix_fmt yuv420p -r 30 $T/B.mp4
# C (36.7–38.7 s, "ek minute mein ready"): tool demo clip framed on blurred band + "Live demo" label.
ffmpeg -loglevel error -y -ss 36.7 -t 2.0 -i $F -ss 7.0 -t 2.0 -i tool-demo.mp4 -filter_complex "[0:v]crop=1080:608:0:656,boxblur=18,eq=brightness=-0.28[bg];[1:v]scale=860:-2,pad=iw+6:ih+6:3:3:white[d];[bg][d]overlay=(W-w)/2:(H-h)/2+20,drawbox=x=36:y=22:w=250:h=52:color=0xE5262A@1:t=fill,drawtext=fontfile=$FONT:text='▶  Live demo':x=56:y=34:fontsize=28:fontcolor=white[v]" -map "[v]" -an -c:v libx264 -crf 18 -pix_fmt yuv420p $T/C.mp4
ffmpeg -loglevel error -y -i $F -i $T/A.mp4 -i $T/B.mp4 -i $T/C.mp4 -filter_complex "[1:v]setpts=PTS-STARTPTS+3.0/TB[a];[2:v]setpts=PTS-STARTPTS+7.2/TB[b];[3:v]setpts=PTS-STARTPTS+36.7/TB[c];[0:v][a]overlay=0:656:enable='between(t,3.0,6.0)'[v1];[v1][b]overlay=0:656:enable='between(t,7.2,10.6)'[v2];[v2][c]overlay=0:656:enable='between(t,36.7,38.7)'[v]" -map "[v]" -map 0:a -c:v libx264 -crf 19 -pix_fmt yuv420p -c:a aac -b:a 192k ${1:-v3-rebuilt.mp4}
echo "done: ${1:-v3-rebuilt.mp4}  (add music: bash $K/mix-music.sh in.mp4 out.mp4 music.mp3 0)"

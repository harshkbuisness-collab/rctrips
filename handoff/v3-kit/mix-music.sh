#!/bin/bash
# mix.sh in.mp4 out.mp4 music.mp3 offset
IN="$1"; OUT="$2"; M="$3"; OFF="$4"
D=$(ffprobe -v error -show_entries format=duration -of csv=p=0 "$IN")
FO=$(python3 -c "print(max(0,$D-1.2))")
ffmpeg -loglevel error -y -i "$IN" -ss "$OFF" -i "$M" -filter_complex \
"[0:a]asplit=2[v][sc];[1:a]atrim=0:$D,asetpts=PTS-STARTPTS,volume=0.22,afade=t=in:d=0.4,afade=t=out:st=$FO:d=1.2[m];[m][sc]sidechaincompress=threshold=0.03:ratio=8:attack=20:release=300[md];[v][md]amix=inputs=2:duration=first:normalize=0,alimiter=limit=0.95[a]" \
-map 0:v -map "[a]" -c:v copy -c:a aac -b:a 192k "$OUT"

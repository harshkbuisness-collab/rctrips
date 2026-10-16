#!/usr/bin/env python3
"""Puts the owner's thumbnail on the first 0.1 s of a finished reel (no re-render needed).

usage: python3 scripts/add_cover.py video.mp4 thumbnail.jpg [out.mp4] [--seconds 0.1]

The thumbnail is scaled to fill 1080x1920 (cropped in the middle if its shape differs) and shown over
the first 0.1 s; the sound is copied untouched. Without out.mp4 the video is replaced in place.
In the YouTube app the owner then picks that first frame as the Shorts cover.
"""
import os, shutil, subprocess, sys, tempfile


def ffmpeg():
    if shutil.which('ffmpeg'):
        return 'ffmpeg'
    sys.exit('ffmpeg is needed for add_cover.py')


def main():
    args = [a for a in sys.argv[1:]]
    secs = 0.1
    if '--seconds' in args:
        k = args.index('--seconds'); secs = float(args[k + 1]); del args[k:k + 2]
    if len(args) < 2:
        sys.exit(__doc__)
    video, cover = args[0], args[1]
    out = args[2] if len(args) > 2 else video
    tmp = tempfile.NamedTemporaryFile(suffix='.mp4', delete=False, dir=os.path.dirname(os.path.abspath(out))).name
    flt = (f"[1:v]scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920,setsar=1[c];"
           f"[0:v][c]overlay=0:0:enable='lt(t,{secs})'[v]")
    r = subprocess.run([ffmpeg(), '-loglevel', 'error', '-y', '-i', video, '-loop', '1', '-i', cover,
                        '-filter_complex', flt, '-map', '[v]', '-map', '0:a?', '-c:v', 'libx264', '-preset', 'medium',
                        '-crf', '20', '-pix_fmt', 'yuv420p', '-c:a', 'copy', '-shortest', '-movflags', '+faststart', tmp])
    if r.returncode != 0:
        os.unlink(tmp); sys.exit('ffmpeg failed')
    shutil.move(tmp, out)
    os.chmod(out, 0o644)
    print(f'cover added (first {secs} s): {out}')


if __name__ == '__main__':
    main()

#!/usr/bin/env python3
"""Makes a finished Reel Engine video from a voiceover script and a JSON plan, end to end.

usage (--tool is optional: without it the tool bundled in this skill is copied to ~/reel-engine-tool and used):
  python3 make_video.py setup  [--tool <ReelEngine folder>]
  python3 make_video.py video  --tool <ReelEngine folder> --script script.txt --plan plan.json --name my-video
                               [--cover thumbnail.jpg] [--voice am_michael] [--speed 1.1] [--out <folder>] [--port 3011]
  python3 make_video.py check  --tool <ReelEngine folder> --script script.txt --plan plan.json --name my-video

setup : installs the tool (npm install, Python helpers, the AI voice). Run once per computer.
check : makes the voice and loads the plan into the tool, prints the tool's errors and quality notes. No render.
video : check + optional cover (first 0.1 s, the Shorts thumbnail) + render + a compressed MP4 + a frame sheet
        (<name>-frames.jpg, one frame per second) to look at before handing the video over.
The tool's server is started automatically (and left running) when it is not already up.
"""
import argparse, json, os, shutil, subprocess, sys, time, urllib.error, urllib.parse, urllib.request


def say(*a):
    print(*a, flush=True)


def api(port, path, data=None, timeout=180):
    req = urllib.request.Request(f'http://localhost:{port}{path}', data=data, method='GET' if data is None else 'POST')
    try:
        return json.loads(urllib.request.urlopen(req, timeout=timeout).read())
    except urllib.error.HTTPError as e:
        try:
            return json.loads(e.read())
        except Exception:
            return {'error': f'HTTP {e.code}'}


def server_up(port):
    try:
        api(port, '/api/projects', timeout=3)
        return True
    except Exception:
        return False


def ensure_server(tool, port):
    # a server left running from an older tool version keeps the old code loaded: restart it
    ver_file = os.path.join(tool, '.cache', f'server-{port}.version')
    version = open(os.path.join(tool, 'VERSION')).read().strip() if os.path.exists(os.path.join(tool, 'VERSION')) else ''
    started = open(ver_file).read().strip() if os.path.exists(ver_file) else ''
    if server_up(port):
        if started == version:
            return
        say(f'== the running server is an older tool version: restarting it')
        if os.name == 'nt':
            subprocess.run(['powershell', '-NoProfile', '-Command',
                            f'Get-NetTCPConnection -LocalPort {port} -State Listen | ForEach-Object {{ Stop-Process -Id $_.OwningProcess -Force }}'])
        else:
            subprocess.run(['pkill', '-f', '^node tools/server[.]mjs'])
        for _ in range(20):
            if not server_up(port):
                break
            time.sleep(0.5)
    say(f'starting the Reel Engine server on port {port} ...')
    os.makedirs(os.path.dirname(ver_file), exist_ok=True)
    open(ver_file, 'w').write(version)
    log = open(os.path.join(tool, 'out', 'server.log'), 'a') if os.path.isdir(os.path.join(tool, 'out')) else subprocess.DEVNULL
    env = dict(os.environ, PORT=str(port))
    kw = dict(cwd=tool, env=env, stdout=log, stderr=log)
    if os.name == 'nt':
        kw['creationflags'] = 0x00000008 | 0x00000200  # detached, new process group
    else:
        kw['start_new_session'] = True
    subprocess.Popen(['node', 'tools/server.mjs'], **kw)
    for _ in range(90):
        if server_up(port):
            return
        time.sleep(1)
    sys.exit('the server did not start: run "node tools/server.mjs" in the tool folder and read its error')


def wait(port, path, label):
    last = None
    while True:
        s = api(port, path)
        if s.get('step') and s.get('step') != last:
            say(f'  {label}: {s.get("step")}'); last = s.get('step')
        if s.get('state') in ('done', 'error'):
            return s
        time.sleep(4)


def ffmpeg(tool):
    exe = shutil.which('ffmpeg')
    return [exe] if exe else ['npx', '--no-install', 'remotion', 'ffmpeg']


def slug(name):
    return ''.join(c if c.isalnum() else '' for c in name.lower())[:40] or 'video'


def setup(tool):
    py = sys.executable
    steps = [(['npm', 'install'], 'npm install'),
             ([py, '-m', 'pip', 'install', '--disable-pip-version-check', 'pillow', 'numpy', 'scipy'], 'python helpers'),
             ([py, '-m', 'pip', 'install', '--disable-pip-version-check', 'kokoro-onnx', 'soundfile'], 'AI voice (kokoro)'),
             ([py, '-m', 'pip', 'install', '--disable-pip-version-check', '--only-binary=:all:', 'pocketsphinx>=5.0.4'], 'voice sync (optional)')]
    for cmd, label in steps:
        say(f'== {label}')
        r = subprocess.run(cmd, cwd=tool, shell=(os.name == 'nt'))
        if r.returncode and 'optional' not in label:
            sys.exit(f'{label} failed (exit {r.returncode})')
    say('setup done. The first voice also downloads the voice model (~300 MB) once.')


def load(args):
    port = args.port
    tool = os.path.abspath(args.tool)
    if not os.path.isfile(os.path.join(tool, 'tools', 'server.mjs')):
        sys.exit(f'{tool} is not the ReelEngine folder (tools/server.mjs is missing)')
    ensure_server(tool, port)
    p = slug(args.name)
    script = open(args.script, encoding='utf-8-sig').read().strip()
    say(f'== voice ({args.voice}, {args.speed}x)')
    r = api(port, f'/api/projects/{p}/tts', json.dumps({'script': script, 'voice': args.voice, 'speed': args.speed}).encode())
    if r.get('error'):
        sys.exit(f'voice: {r["error"]}')
    s = wait(port, f'/api/projects/{p}/tts', 'voice')
    if s.get('state') != 'done':
        sys.exit(f'voice failed: {s.get("error")}')
    if args.cover:
        ext = os.path.splitext(args.cover)[1] or '.jpg'
        api(port, f'/api/projects/{p}/cover?filename=cover{ext}', open(args.cover, 'rb').read())
        say('== cover set (first 0.1 s)')
    plan = open(args.plan, encoding='utf-8-sig').read()
    r = api(port, f'/api/projects/{p}/timeline', plan.encode())
    if not r.get('ok'):
        say('== THE TOOL REFUSED THE PLAN:')
        for e in (r.get('errors') or [r.get('error')]):
            say('  ERROR', e)
        sys.exit(1)
    q = r.get('quality') or []
    say(f'== plan ok ({len(q)} quality note(s))')
    for x in q:
        say('  NOTE', x)
    return tool, port, p


def video(args):
    tool, port, p = load(args)
    say('== render')
    api(port, f'/api/projects/{p}/render', b'{}')
    t0 = time.time()
    while True:
        s = api(port, f'/api/projects/{p}/render')
        if s.get('state') in ('done', 'error'):
            break
        say(f'  render {round(100 * (s.get("progress") or 0))}%  ({int(time.time() - t0)} s)')
        time.sleep(10)
    if s.get('state') != 'done':
        sys.exit(f'render failed: {s.get("error")}')
    raw = os.path.join(tool, 'out', f'{p}.mp4')
    out = os.path.abspath(args.out or os.path.join(tool, 'out', 'final'))
    os.makedirs(out, exist_ok=True)
    final = os.path.join(out, f'{args.name}.mp4')
    ff = ffmpeg(tool)
    r = subprocess.run(ff + ['-loglevel', 'error', '-y', '-i', raw, '-c:v', 'libx264', '-crf', '23', '-preset', 'fast', '-c:a', 'aac', '-b:a', '128k', final], cwd=tool)
    if r.returncode:
        shutil.copy(raw, final)
    sheet = os.path.join(out, f'{args.name}-frames.jpg')
    subprocess.run(ff + ['-loglevel', 'error', '-y', '-i', final, '-vf', 'fps=1,scale=216:-1,tile=8x6', '-frames:v', '1', sheet], cwd=tool)
    say(f'== DONE\n  video : {final}\n  frames: {sheet} (look at it before handing the video over)')


HERE = os.path.dirname(os.path.abspath(__file__))
BUNDLED = os.path.join(os.path.dirname(HERE), 'tool')


def find_tool(given):
    """The tool folder to work in. The skill's own copy is read-only on some systems, so it is copied once to a
    writable folder (again when the skill ships a newer tool, see tool/VERSION)."""
    if given:
        return os.path.abspath(given)
    dest = os.environ.get('REEL_TOOL_DIR') or os.path.join(os.path.expanduser('~'), 'reel-engine-tool')
    ver = lambda d: open(os.path.join(d, 'VERSION')).read().strip() if os.path.exists(os.path.join(d, 'VERSION')) else ''
    if not os.path.isdir(BUNDLED) and os.path.exists(BUNDLED_TAR):
        unpack_tool(dest, ver(dest))
    elif not os.path.isdir(BUNDLED):
        download_tool(dest, ver(dest))
    elif ver(dest) != ver(BUNDLED) or not os.path.exists(os.path.join(dest, 'package.json')):
        say(f'== copying the Reel Engine tool to {dest}')
        shutil.copytree(BUNDLED, dest, dirs_exist_ok=True)
    hero = os.path.join(dest, 'public', 'library', 'hero')
    have = len([f for f in os.listdir(hero) if f.endswith(('.webp', '.png'))]) if os.path.isdir(hero) else 0
    if have < 300:
        for pack in find_hero_packs():
            say(f'== copying the H images from {pack}')
            shutil.copytree(pack, hero, dirs_exist_ok=True)
    return dest


BUNDLED_TAR = os.path.join(os.path.dirname(HERE), 'tool.tar.gz')


def unpack_tool(dest, have_version):
    """Core version of the skill (skill uploads allow at most 200 files): the tool ships as one tool.tar.gz."""
    import tarfile
    with tarfile.open(BUNDLED_TAR) as tf:
        v = tf.extractfile('VERSION').read().decode().strip()
        if have_version == v and os.path.exists(os.path.join(dest, 'package.json')):
            return
        say(f'== unpacking the Reel Engine tool to {dest}')
        os.makedirs(dest, exist_ok=True)
        try:
            tf.extractall(dest, filter='data')
        except TypeError:          # Python < 3.12
            tf.extractall(dest)


MANIFEST = os.path.join(os.path.dirname(HERE), 'tool-manifest.txt')


def download_tool(dest, have_version):
    """Light version of the skill (no tool/ folder, fits the 30 MB skill upload limit): download the full tool,
    H images, clips and sounds at full quality from GitHub once (~62 MB, 591 files)."""
    if not os.path.exists(MANIFEST):
        sys.exit('no --tool given and this skill has neither a tool/ folder nor tool-manifest.txt')
    meta, files = {}, []
    for line in open(MANIFEST).read().splitlines():
        if not line or line.startswith('#'): continue
        k, _, v = line.partition(' ')
        if k in ('repo', 'ref', 'prefix', 'version') and v: meta[k] = v
        else: files.append(line)
    if have_version == meta['version'] and os.path.exists(os.path.join(dest, 'package.json')):
        return
    from concurrent.futures import ThreadPoolExecutor
    base = f"https://raw.githubusercontent.com/{meta['repo']}/{meta['ref']}/{meta['prefix']}"
    say(f"== downloading the Reel Engine tool ({len(files)} files) to {dest}")

    def get(rel):
        out = os.path.join(dest, rel); os.makedirs(os.path.dirname(out), exist_ok=True)
        for attempt in range(4):
            try:
                with urllib.request.urlopen(base + urllib.parse.quote(rel), timeout=120) as r, open(out, 'wb') as f:
                    shutil.copyfileobj(r, f)
                return
            except Exception as e:
                if attempt == 3: raise SystemExit(f'download failed for {rel}: {e} (is github.com reachable?)')
                time.sleep(2 ** attempt)
    with ThreadPoolExecutor(12) as ex:
        list(ex.map(get, files))
    for sh in ('start.sh',):
        if os.path.exists(os.path.join(dest, sh)): os.chmod(os.path.join(dest, sh), 0o755)
    say('== tool downloaded')


def find_hero_packs():
    """The H images are bundled in tool/public/library/hero. Older installs shipped them as two more skills,
    reel-hero-images-1 and reel-hero-images-2; those are still found when the bundled folder is missing."""
    bundled = os.path.join(BUNDLED, 'public', 'library', 'hero')
    if os.path.isdir(bundled) and len(os.listdir(bundled)) >= 300:
        return [bundled]
    roots = [os.path.dirname(os.path.dirname(HERE)), os.path.expanduser('~/.claude/skills'), '/mnt/skills', '/mnt', os.path.expanduser('~'), '/']
    for root in roots:
        r = subprocess.run(['find', root, '-type', 'd', '-path', '*reel-hero-images-*/hero', '-not', '-path', '/proc/*'],
                           capture_output=True, text=True)
        packs = {os.path.basename(os.path.dirname(h)): h for h in r.stdout.split()}
        if len(packs) >= 2:
            return sorted(packs.values())
    sys.exit('the H images are missing: install the skills "reel-hero-images-1" and "reel-hero-images-2" next to this one')


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('cmd', choices=['setup', 'check', 'video'])
    ap.add_argument('--tool')
    ap.add_argument('--script'); ap.add_argument('--plan'); ap.add_argument('--name')
    ap.add_argument('--cover'); ap.add_argument('--out')
    ap.add_argument('--voice', default='am_michael'); ap.add_argument('--speed', type=float, default=1.1)
    ap.add_argument('--port', type=int, default=3011)
    a = ap.parse_args()
    a.tool = find_tool(a.tool)
    if a.cmd == 'setup':
        return setup(a.tool)
    if not os.path.isdir(os.path.join(a.tool, 'node_modules')):
        setup(a.tool)
    if not (a.script and a.plan and a.name):
        ap.error('--script, --plan and --name are needed')
    (video if a.cmd == 'video' else load)(a)


if __name__ == '__main__':
    main()

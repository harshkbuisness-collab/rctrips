"""Free text-to-speech with Microsoft Edge voices, plus exact word timings.

Used by api/tts.py on Vercel and run directly (stdin -> stdout) for local dev:
    echo '{"text": "...", "voice": "en-IN-PrabhatNeural"}' | python api/_edge.py
"""
import asyncio
import base64
import json
import os
import re
import sys

if os.environ.get('SSL_CERT_FILE'):  # behind a TLS-intercepting proxy
    import certifi
    certifi.where = lambda: os.environ['SSL_CERT_FILE']

import edge_tts

# The voices picked from the sample reel (same IDs and default speed as the samples).
VOICES = [
    'en-US-BrianMultilingualNeural', 'en-US-ChristopherNeural', 'en-US-AvaMultilingualNeural',
    'en-US-EmmaMultilingualNeural', 'en-GB-RyanNeural', 'en-AU-WilliamMultilingualNeural',
]
MAX_CHARS = 3000


def _key(word):
    return re.sub(r'[^\w%]', '', word.lower())


def _with_script_punctuation(spoken, script):
    """Edge returns bare words; restore the script's spelling and punctuation."""
    tokens, j = script.split(), 0
    for w in spoken:
        k = _key(w['word'])
        for look in range(j, min(j + 4, len(tokens))):
            if _key(tokens[look]).startswith(k) and k:
                w['word'], j = tokens[look], look + 1
                break
    return spoken


async def synthesize(text, voice, rate):
    comm = edge_tts.Communicate(text, voice, rate=rate, boundary='WordBoundary')
    audio, words = bytearray(), []
    async for chunk in comm.stream():
        if chunk['type'] == 'audio':
            audio.extend(chunk['data'])
        elif chunk['type'] == 'WordBoundary':
            start = chunk['offset'] / 1e7
            words.append({'word': chunk['text'], 'start': round(start, 3), 'end': round(start + chunk['duration'] / 1e7, 3)})
    return bytes(audio), words


def run(payload):
    text = str(payload.get('text', '')).strip()
    voice = payload.get('voice') or VOICES[0]
    speed = int(payload.get('speed', 12))
    if not text:
        raise ValueError('Script is empty')
    if len(text) > MAX_CHARS:
        raise ValueError(f'Script is too long (max {MAX_CHARS} characters)')
    if voice not in VOICES:
        raise ValueError('Unknown voice')
    rate = f'{max(-50, min(50, speed)):+d}%'
    audio, words = asyncio.run(synthesize(text, voice, rate))
    if not audio:
        raise RuntimeError('No audio returned by the voice service')
    return {'audio': base64.b64encode(audio).decode('ascii'), 'words': _with_script_punctuation(words, text)}


if __name__ == '__main__':
    try:
        print(json.dumps(run(json.loads(sys.stdin.read() or '{}'))))
    except Exception as e:  # report to the caller instead of a traceback
        print(json.dumps({'error': str(e)}))

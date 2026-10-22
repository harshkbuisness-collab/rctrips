"""Vercel Python function: POST /api/tts {text, voice, speed} -> {audio (base64 mp3), words}."""
import base64
import hmac
import json
import os
import sys
from http.server import BaseHTTPRequestHandler

sys.path.insert(0, os.path.dirname(__file__))
from _edge import run  # noqa: E402


def _authorized(header):
    # Same Basic Auth as the rest of the tool (src/proxy.js); Python functions skip Next's proxy.
    user, password = os.environ.get('TOOL_USERNAME'), os.environ.get('TOOL_PASSWORD')
    if not user or not password or not header.startswith('Basic '):
        return False
    try:
        given = base64.b64decode(header[6:]).decode('utf-8')
    except Exception:
        return False
    return hmac.compare_digest(given.encode(), f'{user}:{password}'.encode())


class handler(BaseHTTPRequestHandler):
    def do_POST(self):
        if not _authorized(self.headers.get('authorization') or ''):
            self.send_response(401)
            self.send_header('WWW-Authenticate', 'Basic realm="AI Reel Generator Secure", charset="UTF-8"')
            self.end_headers()
            return
        try:
            length = min(int(self.headers.get('content-length') or 0), 64_000)
            body, status = run(json.loads(self.rfile.read(length) or b'{}')), 200
        except ValueError as e:
            body, status = {'error': str(e)}, 400
        except Exception as e:
            body, status = {'error': f'Voice generation failed: {e}'}, 502
        data = json.dumps(body).encode()
        self.send_response(status)
        self.send_header('Content-Type', 'application/json')
        self.send_header('Content-Length', str(len(data)))
        self.end_headers()
        self.wfile.write(data)

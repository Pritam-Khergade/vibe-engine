import os
import yt_dlp
import requests
from flask import Flask, jsonify, request, Response
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

UA = (
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) '
    'AppleWebKit/537.36 (KHTML, like Gecko) '
    'Chrome/125.0.0.0 Safari/537.36'
)

MAX_BYTES = 1_048_576  # 1 MB preview cap


def _extract(query):
    """Search YouTube for query, return (stream_url, http_headers) of best audio-only format."""
    ydl_opts = {
        'format': 'bestaudio[vcodec=none]/bestaudio',
        'quiet': True,
        'no_warnings': True,
    }
    with yt_dlp.YoutubeDL(ydl_opts) as ydl:
        info = ydl.extract_info(f'ytsearch1:{query}', download=False)
        entries = info.get('entries', [info])
        if not entries:
            return None, None
        entry = entries[0]
        return entry.get('url'), entry.get('http_headers', {})


@app.route('/health')
def health():
    return jsonify({'status': 'ok', 'service': 'vibe-engine-api'})


@app.route('/api/preview')
def preview():
    artist = request.args.get('artist', '').strip()
    track  = request.args.get('track', '').strip()
    if not (artist or track):
        return jsonify({'error': 'artist and track params required'}), 400

    query = f'{artist} {track} official audio'
    try:
        stream_url, yt_headers = _extract(query)
        if not stream_url:
            return jsonify({'error': 'No audio found for this track'}), 404
    except Exception as e:
        print(f'[preview] extract error: {e}')
        return jsonify({'error': str(e)}), 500

    try:
        req_headers = dict(yt_headers or {})
        req_headers.setdefault('User-Agent', UA)
        req_headers['Range'] = f'bytes=0-{MAX_BYTES - 1}'

        r = requests.get(stream_url, headers=req_headers, stream=True, timeout=20)

        resp_headers = {
            'Content-Type':  r.headers.get('Content-Type', 'audio/webm'),
            'Accept-Ranges': 'bytes',
            'Cache-Control': 'no-cache',
        }
        for h in ('Content-Length', 'Content-Range'):
            if h in r.headers:
                resp_headers[h] = r.headers[h]

        def generate():
            sent = 0
            for chunk in r.iter_content(chunk_size=16384):
                if chunk and sent < MAX_BYTES:
                    yield chunk
                    sent += len(chunk)

        return Response(generate(), status=r.status_code, headers=resp_headers)

    except Exception as e:
        print(f'[preview] proxy error: {e}')
        return jsonify({'error': str(e)}), 500


@app.route('/api/search')
def search():
    q = request.args.get('q', '').strip()
    if not q:
        return jsonify({'found': False, 'error': 'q param required'}), 400
    try:
        ydl_opts = {'quiet': True, 'no_warnings': True, 'extract_flat': True}
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            info = ydl.extract_info(f'ytsearch1:{q}', download=False)
            entries = info.get('entries', [])
            if not entries:
                return jsonify({'found': False})
            e = entries[0]
            return jsonify({'found': True, 'duration': e.get('duration', 0), 'title': e.get('title', '')})
    except Exception as ex:
        return jsonify({'found': False, 'error': str(ex)}), 500


if __name__ == '__main__':
    port = int(os.environ.get('PORT', 7860))
    app.run(host='0.0.0.0', port=port)

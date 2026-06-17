from flask import Flask, jsonify, request, Response
from flask_cors import CORS
from ytmusicapi import YTMusic
import yt_dlp
import requests
import time

app = Flask(__name__)
CORS(app)

yt = YTMusic()

MOOD_QUERIES = {
    'energized': 'tech house energy rave',
    'focused':   'neo classical piano focus study',
    'chill':     'dream pop chill indie relax',
    'emotional': 'indie folk emotional acoustic',
}

# Simple in-memory URL cache (stream URLs expire in ~6h, we cache for 4h)
_url_cache = {}
_CACHE_TTL = 4 * 3600  # 4 hours in seconds


def _get_stream_info(video_id):
    """Resolve a YouTube Music video ID to (url, headers) via yt-dlp."""
    now = time.time()
    if video_id in _url_cache:
        url, headers, expires_at = _url_cache[video_id]
        if now < expires_at:
            return url, headers

    ydl_opts = {
        'format': 'bestaudio[ext=webm]/bestaudio[ext=m4a]/bestaudio',
        'quiet': True,
        'no_warnings': True,
    }
    with yt_dlp.YoutubeDL(ydl_opts) as ydl:
        info = ydl.extract_info(
            f'https://music.youtube.com/watch?v={video_id}',
            download=False,
        )
    url = info['url']
    headers = info.get('http_headers', {})
    _url_cache[video_id] = (url, headers, now + _CACHE_TTL)
    return url, headers


@app.route('/api/health')
def health():
    return jsonify({'status': 'ok', 'ytmusicapi': True, 'ytdlp': True})


@app.route('/api/discovery/<mood>')
def discovery(mood):
    query = MOOD_QUERIES.get(mood, mood)
    try:
        results = yt.search(query, filter='songs', limit=9)
        tracks = []
        for r in results:
            tracks.append({
                'videoId':   r.get('videoId'),
                'title':     r.get('title'),
                'artist':    r.get('artists', [{}])[0].get('name') if r.get('artists') else 'Unknown',
                'duration':  r.get('duration'),
                'thumbnail': (r.get('thumbnails') or [{}])[-1].get('url'),
            })
        return jsonify(tracks)
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/find-track')
def find_track():
    artist = request.args.get('artist', '')
    track  = request.args.get('track', '')
    if not (artist or track):
        return jsonify({'error': 'provide artist and/or track'}), 400
    try:
        results = yt.search(f'{artist} {track}', filter='songs', limit=1)
        if not results:
            return jsonify({'error': 'not found'}), 404
        r = results[0]
        return jsonify({
            'videoId': r.get('videoId'),
            'title':   r.get('title'),
            'artist':  r.get('artists', [{}])[0].get('name') if r.get('artists') else '',
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/stream/<video_id>')
def stream_audio(video_id):
    try:
        stream_url, yt_headers = _get_stream_info(video_id)
    except Exception as e:
        print(f'[stream] yt-dlp failed for {video_id}: {e}')
        return jsonify({'error': str(e)}), 500

    try:
        req_headers = dict(yt_headers)  # User-Agent and other required headers
        if 'Range' in request.headers:
            req_headers['Range'] = request.headers['Range']

        upstream = requests.get(stream_url, headers=req_headers, stream=True, timeout=20)

        resp_headers = {
            'Content-Type': upstream.headers.get('Content-Type', 'audio/webm'),
            'Accept-Ranges': 'bytes',
            'Cache-Control': 'no-cache',
        }
        for h in ('Content-Length', 'Content-Range'):
            if h in upstream.headers:
                resp_headers[h] = upstream.headers[h]

        def generate():
            for chunk in upstream.iter_content(chunk_size=16384):
                if chunk:
                    yield chunk

        return Response(generate(), status=upstream.status_code, headers=resp_headers)

    except Exception as e:
        print(f'[stream] proxy error for {video_id}: {e}')
        return jsonify({'error': str(e)}), 500


if __name__ == '__main__':
    app.run(port=5001, debug=True)

import os
import time
import threading
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

MAX_BYTES  = 1_048_576   # 1 MB preview cap
CACHE_TTL  = 4 * 3600    # YouTube stream URLs expire ~6h; refresh at 4h

# ── In-memory URL cache ────────────────────────────────────────────────────────
_cache      = {}   # key -> { url, headers, ts }
_cache_lock = threading.Lock()

def _cache_get(key):
    with _cache_lock:
        entry = _cache.get(key)
    if entry and (time.time() - entry['ts']) < CACHE_TTL:
        return entry['url'], entry['headers']
    return None, None

def _cache_set(key, url, headers):
    with _cache_lock:
        _cache[key] = {'url': url, 'headers': headers, 'ts': time.time()}

# ── yt-dlp extract ─────────────────────────────────────────────────────────────
def _extract(query):
    """Search YouTube for query, return (stream_url, http_headers)."""
    ydl_opts = {
        'format':      'bestaudio[vcodec=none]/bestaudio',
        'quiet':       True,
        'no_warnings': True,
    }
    with yt_dlp.YoutubeDL(ydl_opts) as ydl:
        info    = ydl.extract_info(f'ytsearch1:{query}', download=False)
        entries = info.get('entries', [info])
        if not entries:
            return None, None
        entry = entries[0]
        return entry.get('url'), entry.get('http_headers', {})

# ── Pre-warm pool — all 200 entries, mirrors DISCOVERY_DATA in App.js ──────────
WARMUP_POOL = [
    # ── Energized (50) ──
    ('FISHER',                    'Losing It'),
    ('Calvin Harris',             'Summer'),
    ('Martin Garrix',             'Animals'),
    ('Disclosure',                'Latch'),
    ('Daft Punk',                 'Get Lucky'),
    ('Bicep',                     'Glue'),
    ('Peggy Gou',                 'Nagging'),
    ('Four Tet',                  'Kool FM'),
    ('Skrillex',                  'Scary Monsters'),
    ('Flume',                     'Never Be Like You'),
    ('Kaytranada',                'Glowed Up'),
    ('Caribou',                   "Can't Do Without You"),
    ('Jamie xx',                  'Gosh'),
    ('Aphex Twin',                'Windowlicker'),
    ('The Chemical Brothers',     'Hey Boy Hey Girl'),
    ('Underworld',                'Born Slippy'),
    ('Justice',                   'D.A.N.C.E.'),
    ('Moderat',                   'Bad Kingdom'),
    ('Deadmau5',                  'Ghosts N Stuff'),
    ('Eric Prydz',                'Call On Me'),
    ('Nero',                      'Me and You'),
    ('Chase & Status',            'No More Idols'),
    ('Sub Focus',                 'Tidal Wave'),
    ('Noisia',                    'Split the Atom'),
    ('Pendulum',                  'Watercolour'),
    ('Charlotte de Witte',        'Doppler'),
    ('Amelie Lens',               'Exhale'),
    ('Adam Beyer',                'Ignition Key'),
    ('Nina Kraviz',               "I'm Gonna Get You"),
    ('Richie Hawtin',             'Spastik'),
    ('Ben Klock',                 'One'),
    ('Sven Vath',                 'The Beauty and the Beast'),
    ('Marcel Dettmann',           'Substance'),
    ('Objekt',                    'Needle & Thread'),
    ('Blawan',                    'Getting Me Down'),
    ('Pritam',                    'Badtameez Dil'),
    ('Vishal-Shekhar',            'Desi Girl'),
    ('Shankar Ehsaan Loy',        'Jai Ho'),
    ('Amit Trivedi',              'Ik Bagal'),
    ('Nucleya',                   'Bass Rani'),
    ('Ritviz',                    'Udd Gaye'),
    ('Divine',                    'Mere Gully Mein'),
    ('Raftaar',                   'Swag Mera Desi'),
    ('Badshah',                   'Paagal'),
    ('Yo Yo Honey Singh',         'Brown Rang'),
    ('The PropheC',               'Wohh'),
    ('Diljit Dosanjh',            'Do You Know'),
    ('Guru Randhawa',             'Lahore'),
    ('Harrdy Sandhu',             'Bijlee Bijlee'),
    ('AP Dhillon',                'With You'),
    ('Shubh',                     'Still Rollin'),
    ('Karan Aujla',               'Softly'),
    ('Sidhu Moosewala',           'So High'),
    ('Hardy Sandhu',              'Naah'),
    ('Sunidhi Chauhan',           'Sheila Ki Jawani'),
    ('Neha Kakkar',               'O Humsafar'),
    ('Tony Kakkar',               'Tera Suit'),
    ('Darshan Raval',             'Tera Zikr'),
    ('Jubin Nautiyal',            'Lut Gaye'),
    ('Benny Dayal',               'Tune Maari Entriyaan'),
    # ── Focused (50) ──
    ('Nils Frahm',                'Says'),
    ('Brian Eno',                 'An Ending'),
    ('Max Richter',               'On the Nature of Daylight'),
    ('Bonobo',                    'Kong'),
    ('Tycho',                     'Awake'),
    ('Jon Hopkins',               'Immunity'),
    ('Hammock',                   'Breathturn'),
    ('Rival Consoles',            'Phantom'),
    ('Olafur Arnalds',            'Near Light'),
    ('Thom Yorke',                'Analyse'),
    ('Nicolas Jaar',              'Space is Only Noise'),
    ('Floating Points',           'LesAlpx'),
    ('Apparat',                   'Goodbye'),
    ('Arca',                      'Piel'),
    ('Holly Herndon',             'Chorus'),
    ('Actress',                   'Ascending'),
    ('Lorenzo Senni',             'Superimposition'),
    ('Tim Hecker',                'Ravedeath 1972'),
    ('Stars of the Lid',          'Requiem for Dying Mothers'),
    ('Godspeed You Black Emperor','The Dead Flag Blues'),
    ('Mogwai',                    'Mogwai Fear Satan'),
    ('Explosions in the Sky',     'The Birth and Death of the Day'),
    ('Sigur Ros',                 'Hoppipolla'),
    ('This Will Destroy You',     'Quiet'),
    ('Mono',                      'Ashes in the Snow'),
    ('A.R. Rahman',               'Dil Se Re'),
    ('Prateek Kuhad',             'cold/mess'),
    ('When Chai Met Toast',       'Khoj'),
    ('The Local Train',           'Aaoge Tum Kabhi'),
    ('Ankur Tewari',              'Iktara'),
    ('Peter Cat Recording Co',    'Memory Box'),
    ('Parekh & Singh',            'I Love You Baby'),
    ('Lagori',                    'Aamchi Mumbai'),
    ('Soulmate',                  'Soulmate Theme'),
    ('Thermal and a Quarter',     'The Queue'),
    ('Neon Jungle',               'Bravado'),
    ('Shantanu Moitra',           'Dil Dhoondta Hai'),
    ('Shankar Mahadevan',         'Breathless'),
    ('Pt. Ravi Shankar',          'Raga Jog'),
    ('Zakir Hussain',             'Kirwani'),
    ('Anoushka Shankar',          'Land of Gold'),
    ('Niladri Kumar',             'Zitar'),
    ('Prasanna',                  'Ragadharma'),
    ('Mahesh Kale',               'Abhangas'),
    ('Vasundhara Das',            'Ekla Cholo Re'),
    ('Rabbi Shergill',            'Bulla Ki Jaana'),
    ('Kailash Kher',              'Teri Deewani'),
    ('Ustad Nusrat Fateh Ali Khan', 'Tumhe Dillagi'),
    ('Abida Parveen',             'Tere Ishq Nachaya'),
    ('Hariharan',                 'Allah Ke Bande'),
    # ── Chill (50) ──
    ('Tame Impala',               'The Less I Know The Better'),
    ('Mac DeMarco',               'Chamber of Reflection'),
    ('Rex Orange County',         'Loving is Easy'),
    ('Khruangbin',                'A La Sala'),
    ('Still Woozy',               'Goodie Bag'),
    ('Mild High Club',            'Windowpane'),
    ('Men I Trust',               'Tailwhip'),
    ('Cigarettes After Sex',      'Apocalypse'),
    ('Beach House',               'Space Song'),
    ('SALES',                     'Pope Is a Rockstar'),
    ('Chet Faker',                'Gold'),
    ('Petit Biscuit',             'Sunset Lover'),
    ('Pretty Boy Aaron',          'Feelings'),
    ('Whitney',                   'No Woman'),
    ('Big Thief',                 'Not'),
    ('Soccer Mommy',              'Circle the Drain'),
    ('Snail Mail',                'Pristine'),
    ('Clairo',                    'Pretty Girl'),
    ('Lomelda',                   'Interstate Vision'),
    ('Hand Habits',               'wildfire'),
    ('Pinegrove',                 'Old Friends'),
    ('Hovvdy',                    'Easy'),
    ('Squirrel Flower',           'I Was Born Swimming'),
    ('Florist',                   'Summer Blood'),
    ('Bedouine',                  'Solitary Daughter'),
    ('Arijit Singh',              'Tum Hi Ho'),
    ('Lucky Ali',                 'O Sanam'),
    ('Mohit Chauhan',             'Tum Se Hi'),
    ('Papon',                     'Moh Moh Ke Dhaage'),
    ('Shafqat Amanat Ali',        'Teri Ore'),
    ('Atif Aslam',                'Woh Lamhe'),
    ('Sonu Nigam',                'Kal Ho Naa Ho'),
    ('KK',                        'Zindagi Do Pal Ki'),
    ('Lata Mangeshkar',           'Lag Jaa Gale'),
    ('Kishore Kumar',             'Roop Tera Mastana'),
    ('Mohammed Rafi',             'Baharon Phool Barsao'),
    ('Mukesh',                    'Kabhi Kabhi Mere Dil Mein'),
    ('Hemant Kumar',              'Na Tum Hamen Jano'),
    ('S.D. Burman',               'Tere Mere Sapne'),
    ('Manna Dey',                 'Ae Bhai Zara Dekh Ke Chalo'),
    ('Talat Mahmood',             'Jalte Hain Jiske Liye'),
    ('Asha Bhosle',               'Dum Maro Dum'),
    ('Geeta Dutt',                'Waqt Ne Kiya'),
    ('Noor Jehan',                'Awaz De Kahan Hai'),
    ('Mehdi Hassan',              'Ranjish Hi Sahi'),
    ('Ghulam Ali',                'Chupke Chupke'),
    ('Jagjit Singh',              'Tum Itna Jo Muskura Rahe Ho'),
    ('Pankaj Udhas',              'Chitthi Aayi Hai'),
    ('Anup Jalota',               'Hari Om Hari'),
    ('Hariharan',                 'Dil Ki Baatein'),
    # ── Emotional (50) ──
    ('Novo Amor',                 'Anchor'),
    ('Bon Iver',                  'Holocene'),
    ('Phoebe Bridgers',           'Savior Complex'),
    ('Sufjan Stevens',            'Death With Dignity'),
    ('Daughter',                  'Youth'),
    ('Iron & Wine',               'Flightless Bird'),
    ('Gregory Alan Isakov',       'The Stable Song'),
    ('Adrianne Lenker',           'anything'),
    ('Nick Drake',                'Pink Moon'),
    ('Elliott Smith',             'Between the Bars'),
    ('Conor Oberst',              'Lua'),
    ('Mount Eerie',               'Real Death'),
    ('Car Seat Headrest',         'Drunk Drivers'),
    ('Mitski',                    'Nobody'),
    ('Soccer Mommy',              'Your Dog'),
    ('Snail Mail',                'Heat Wave'),
    ('Lucy Dacus',                'Night Shift'),
    ('Julien Baker',              'Sprained Ankle'),
    ('boygenius',                 'Bite the Hand'),
    ('The National',              'Bloodbuzz Ohio'),
    ('Frightened Rabbit',         'Modern Leper'),
    ('Bright Eyes',               'First Day of My Life'),
    ('Death Cab for Cutie',       'I Will Follow You into the Dark'),
    ('The Antlers',               'Hospice'),
    ('Owen',                      'Bad News'),
    ('Arijit Singh',              'Channa Mereya'),
    ('KK',                        'Yaaron'),
    ('Jubin Nautiyal',            'Tere Liye'),
    ('Shreya Ghoshal',            'Sun Raha Hai'),
    ('Sonu Nigam',                'Dil Ne Yeh Kaha Hai'),
    ('Atif Aslam',                'Doorie'),
    ('Rahat Fateh Ali Khan',      'O Re Piya'),
    ('Lata Mangeshkar',           'Ajeeb Dastan Hai Yeh'),
    ('Mohammed Rafi',             'Kya Hua Tera Wada'),
    ('Kishore Kumar',             'Mere Mehboob Qayamat Hogi'),
    ('Mukesh',                    'Jeena Yahan Marna Yahan'),
    ('Talat Mahmood',             'Ae Mere Dil Kahin Aur Chal'),
    ('Jagjit Singh',              'Hothon Se Chhu Lo Tum'),
    ('Mehdi Hassan',              'Zindagi Mein To Sabhi Pyar Kiya Karte Hain'),
    ('Ghulam Ali',                'Hungama Hai Kyun Barpa'),
    ('Farida Khanum',             'Aaj Jaane Ki Zid Na Karo'),
    ('Nusrat Fateh Ali Khan',     'Afreen Afreen'),
    ('Abida Parveen',             'Tu Jhoom'),
    ('Shafqat Amanat Ali',        'Mann Mayal'),
    ('Kailash Kher',              'Saiyyan'),
    ('Hariharan',                 'Kal Ho Naa Ho'),
    ('Shankar Mahadevan',         'Tanha Dil'),
    ('A.R. Rahman',               'Roja Jaaneman'),
    ('Ilaiyaraaja',               'En Iniya Pon Nilave'),
    ('S.P. Balasubrahmanyam',     'Ye Dil Deewana'),
]

def _prewarm_one(artist, track):
    key = f'{artist}||{track}'
    if _cache_get(key)[0]:
        return  # already cached
    try:
        url, headers = _extract(f'{artist} {track} official audio')
        if url:
            _cache_set(key, url, headers)
            print(f'[prewarm] ✓ {artist} — {track}')
    except Exception as e:
        print(f'[prewarm] ✗ {artist} — {track}: {e}')

def _start_prewarm():
    def run():
        for artist, track in WARMUP_POOL:
            _prewarm_one(artist, track)
            time.sleep(3)  # stagger — avoid YouTube rate-limit
    threading.Thread(target=run, daemon=True).start()

# ── Routes ─────────────────────────────────────────────────────────────────────

@app.route('/health')
def health():
    with _cache_lock:
        n = len(_cache)
    return jsonify({
        'status':         'ok',
        'service':        'vibe-engine-api',
        'cached_entries': n,
        'moods_ready':    n >= 4,
    })


@app.route('/api/preview')
def preview():
    artist = request.args.get('artist', '').strip()
    track  = request.args.get('track',  '').strip()
    if not (artist or track):
        return jsonify({'error': 'artist and track params required'}), 400

    key = f'{artist}||{track}'
    stream_url, yt_headers = _cache_get(key)

    if not stream_url:
        query = f'{artist} {track} official audio'
        try:
            stream_url, yt_headers = _extract(query)
            if not stream_url:
                return jsonify({'error': 'No audio found for this track'}), 404
            _cache_set(key, stream_url, yt_headers)
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
            info    = ydl.extract_info(f'ytsearch1:{q}', download=False)
            entries = info.get('entries', [])
            if not entries:
                return jsonify({'found': False})
            e = entries[0]
            return jsonify({'found': True, 'duration': e.get('duration', 0), 'title': e.get('title', '')})
    except Exception as ex:
        return jsonify({'found': False, 'error': str(ex)}), 500


# ── Startup ────────────────────────────────────────────────────────────────────
# Pre-warm runs at import time so it fires under both gunicorn and python app.py
_start_prewarm()

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 7860))
    app.run(host='0.0.0.0', port=port, debug=False)

import os
import time
import random
import threading
import requests
from flask import Flask, jsonify, request, Response
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

CACHE_TTL = 6 * 3600

# ── In-memory cache ────────────────────────────────────────────────────────────
_cache      = {}
_cache_lock = threading.Lock()

def _cache_get(key):
    with _cache_lock:
        entry = _cache.get(key)
    if entry and (time.time() - entry['ts']) < CACHE_TTL:
        return entry['url']
    return None

def _cache_set(key, url):
    with _cache_lock:
        _cache[key] = {'url': url, 'ts': time.time()}

# ── Mood index: mood -> list of "artist||track" keys ──────────────────────────
_mood_index      = {'energized': [], 'focused': [], 'chill': [], 'emotional': []}
_mood_index_lock = threading.Lock()

def _mood_index_add(mood, key):
    with _mood_index_lock:
        if key not in _mood_index[mood]:
            _mood_index[mood].append(key)

# ── iTunes Search API ──────────────────────────────────────────────────────────
def _itunes_preview(artist, track):
    try:
        r = requests.get(
            'https://itunes.apple.com/search',
            params={'term': f'{artist} {track}', 'media': 'music', 'entity': 'song', 'limit': 5},
            timeout=10,
        )
        results = r.json().get('results', [])
        artist_lower = artist.lower()

        for res in results:
            if artist_lower in res.get('artistName', '').lower() and res.get('previewUrl'):
                return res['previewUrl']

        for res in results:
            if res.get('previewUrl'):
                return res['previewUrl']

    except Exception as e:
        print(f'[itunes] {artist} — {track}: {e}')

    return None

# ── Pre-warm pool: (artist, track, mood) ──────────────────────────────────────
WARMUP_POOL = [
    # ── Energized ──
    ('FISHER',                      'Losing It',                         'energized'),
    ('Calvin Harris',               'Summer',                            'energized'),
    ('Martin Garrix',               'Animals',                           'energized'),
    ('Disclosure',                  'Latch',                             'energized'),
    ('Daft Punk',                   'Get Lucky',                         'energized'),
    ('Bicep',                       'Glue',                              'energized'),
    ('Four Tet',                    'Kool FM',                           'energized'),
    ('Skrillex',                    'Scary Monsters',                    'energized'),
    ('Flume',                       'Never Be Like You',                 'energized'),
    ('Kaytranada',                  'Glowed Up',                         'energized'),
    ('Caribou',                     "Can't Do Without You",              'energized'),
    ('Jamie xx',                    'Gosh',                              'energized'),
    ('Aphex Twin',                  'Windowlicker',                      'energized'),
    ('The Chemical Brothers',       'Hey Boy Hey Girl',                  'energized'),
    ('Underworld',                  'Born Slippy',                       'energized'),
    ('Justice',                     'D.A.N.C.E.',                        'energized'),
    ('Moderat',                     'Bad Kingdom',                       'energized'),
    ('Deadmau5',                    'Ghosts N Stuff',                    'energized'),
    ('Eric Prydz',                  'Call On Me',                        'energized'),
    ('Nero',                        'Me and You',                        'energized'),
    ('Chase & Status',              'No More Idols',                     'energized'),
    ('Sub Focus',                   'Tidal Wave',                        'energized'),
    ('Noisia',                      'Split the Atom',                    'energized'),
    ('Pendulum',                    'Watercolour',                       'energized'),
    ('Charlotte de Witte',          'Doppler',                           'energized'),
    ('Amelie Lens',                 'Exhale',                            'energized'),
    ('Adam Beyer',                  'Ignition Key',                      'energized'),
    ('Nina Kraviz',                 "I'm Gonna Get You",                 'energized'),
    ('Richie Hawtin',               'Spastik',                           'energized'),
    ('Ben Klock',                   'One',                               'energized'),
    ('Sven Vath',                   'The Beauty and the Beast',          'energized'),
    ('Objekt',                      'Needle & Thread',                   'energized'),
    ('Blawan',                      'Getting Me Down',                   'energized'),
    ('Dua Lipa',                    'Levitating',                        'energized'),
    ('The Weeknd',                  'Blinding Lights',                   'energized'),
    ('Post Malone',                 'Rockstar',                          'energized'),
    ('Kanye West',                  'POWER',                             'energized'),
    ('Pritam',                      'Badtameez Dil',                     'energized'),
    ('Vishal-Shekhar',              'Desi Girl',                         'energized'),
    ('Shankar Ehsaan Loy',          'Jai Ho',                            'energized'),
    ('Amit Trivedi',                'Ik Bagal',                          'energized'),
    ('Nucleya',                     'Bass Rani',                         'energized'),
    ('Divine',                      'Mere Gully Mein',                   'energized'),
    ('Raftaar',                     'Swag Mera Desi',                    'energized'),
    ('Badshah',                     'Paagal',                            'energized'),
    ('Yo Yo Honey Singh',           'Brown Rang',                        'energized'),
    ('The PropheC',                 'Wohh',                              'energized'),
    ('Diljit Dosanjh',              'Do You Know',                       'energized'),
    ('Guru Randhawa',               'Lahore',                            'energized'),
    ('Harrdy Sandhu',               'Bijlee Bijlee',                     'energized'),
    ('Shubh',                       'Still Rollin',                      'energized'),
    ('Sidhu Moosewala',             'So High',                           'energized'),
    ('Hardy Sandhu',                'Naah',                              'energized'),
    ('Sunidhi Chauhan',             'Sheila Ki Jawani',                  'energized'),
    ('Tony Kakkar',                 'Tera Suit',                         'energized'),
    ('Mika Singh',                  'Mauja Hi Mauja',                    'energized'),
    ('Honey Singh',                 'Lungi Dance',                       'energized'),
    ('Garry Sandhu',                'Tenu Suit Suit Karda',              'energized'),
    ('Imran Khan',                  'Amplifier',                         'energized'),
    ('Bilal Saeed',                 '12 Saal',                           'energized'),
    # ── Focused ──
    ('Nils Frahm',                  'Says',                              'focused'),
    ('Brian Eno',                   'An Ending',                         'focused'),
    ('Max Richter',                 'On the Nature of Daylight',         'focused'),
    ('Bonobo',                      'Kong',                              'focused'),
    ('Tycho',                       'Awake',                             'focused'),
    ('Jon Hopkins',                 'Immunity',                          'focused'),
    ('Hammock',                     'Breathturn',                        'focused'),
    ('Rival Consoles',              'Phantom',                           'focused'),
    ('Olafur Arnalds',              'Near Light',                        'focused'),
    ('Thom Yorke',                  'Analyse',                           'focused'),
    ('Nicolas Jaar',                'Space is Only Noise',               'focused'),
    ('Floating Points',             'LesAlpx',                           'focused'),
    ('Apparat',                     'Goodbye',                           'focused'),
    ('Arca',                        'Piel',                              'focused'),
    ('Holly Herndon',               'Chorus',                            'focused'),
    ('Actress',                     'Ascending',                         'focused'),
    ('Tim Hecker',                  'Ravedeath 1972',                    'focused'),
    ('Stars of the Lid',            'Requiem for Dying Mothers',         'focused'),
    ('Godspeed You Black Emperor',  'The Dead Flag Blues',               'focused'),
    ('Mogwai',                      'Mogwai Fear Satan',                 'focused'),
    ('Explosions in the Sky',       'The Birth and Death of the Day',    'focused'),
    ('Explosions in the Sky',       'Your Hand in Mine',                 'focused'),
    ('Sigur Ros',                   'Hoppipolla',                        'focused'),
    ('This Will Destroy You',       'Quiet',                             'focused'),
    ('Mono',                        'Ashes in the Snow',                 'focused'),
    ('A.R. Rahman',                 'Dil Se Re',                         'focused'),
    ('A.R. Rahman',                 'Lukka Chuppi',                      'focused'),
    ('Prateek Kuhad',               'cold/mess',                         'focused'),
    ('When Chai Met Toast',         'Khoj',                              'focused'),
    ('The Local Train',             'Aaoge Tum Kabhi',                   'focused'),
    ('Peter Cat Recording Co',      'Memory Box',                        'focused'),
    ('Parekh & Singh',              'I Love You Baby',                   'focused'),
    ('Soulmate',                    'Soulmate Theme',                    'focused'),
    ('Thermal and a Quarter',       'The Queue',                         'focused'),
    ('Neon Jungle',                 'Bravado',                           'focused'),
    ('Ludovico Einaudi',            'Experience',                        'focused'),
    ('Hans Zimmer',                 'Time',                              'focused'),
    ('Yann Tiersen',                'Comptine d un autre ete',           'focused'),
    ('Harshdeep Kaur',              'Maahi Ve',                          'focused'),
    ('Shankar Mahadevan',           'Breathless',                        'focused'),
    ('Pt. Ravi Shankar',            'Raga Jog',                          'focused'),
    ('Zakir Hussain',               'Kirwani',                           'focused'),
    ('Anoushka Shankar',            'Land of Gold',                      'focused'),
    ('Niladri Kumar',               'Zitar',                             'focused'),
    ('Rabbi Shergill',              'Bulla Ki Jaana',                    'focused'),
    ('Kailash Kher',                'Teri Deewani',                      'focused'),
    ('Ustad Nusrat Fateh Ali Khan', 'Tumhe Dillagi',                     'focused'),
    ('Abida Parveen',               'Tere Ishq Nachaya',                 'focused'),
    ('Hariharan',                   'Allah Ke Bande',                    'focused'),
    # ── Chill ──
    ('Tame Impala',                 'The Less I Know The Better',        'chill'),
    ('Mac DeMarco',                 'Chamber of Reflection',             'chill'),
    ('Rex Orange County',           'Loving is Easy',                    'chill'),
    ('Khruangbin',                  'A La Sala',                         'chill'),
    ('Still Woozy',                 'Goodie Bag',                        'chill'),
    ('Mild High Club',              'Windowpane',                        'chill'),
    ('Men I Trust',                 'Tailwhip',                          'chill'),
    ('Cigarettes After Sex',        'Apocalypse',                        'chill'),
    ('Beach House',                 'Space Song',                        'chill'),
    ('SALES',                       'Pope Is a Rockstar',                'chill'),
    ('Chet Faker',                  'Gold',                              'chill'),
    ('Petit Biscuit',               'Sunset Lover',                      'chill'),
    ('Pretty Boy Aaron',            'Feelings',                          'chill'),
    ('Whitney',                     'No Woman',                          'chill'),
    ('Big Thief',                   'Not',                               'chill'),
    ('Soccer Mommy',                'Circle the Drain',                  'chill'),
    ('Snail Mail',                  'Pristine',                          'chill'),
    ('Clairo',                      'Pretty Girl',                       'chill'),
    ('Lomelda',                     'Interstate Vision',                 'chill'),
    ('Hand Habits',                 'wildfire',                          'chill'),
    ('Pinegrove',                   'Old Friends',                       'chill'),
    ('Hovvdy',                      'Easy',                              'chill'),
    ('Squirrel Flower',             'I Was Born Swimming',               'chill'),
    ('Bedouine',                    'Solitary Daughter',                 'chill'),
    ('Ritviz',                      'Udd Gaye',                          'chill'),
    ('AP Dhillon',                  'With You',                          'chill'),
    ('Karan Aujla',                 'Softly',                            'chill'),
    ('Arijit Singh',                'Tum Hi Ho',                         'chill'),
    ('Lucky Ali',                   'O Sanam',                           'chill'),
    ('Mohit Chauhan',               'Tum Se Hi',                         'chill'),
    ('Papon',                       'Moh Moh Ke Dhaage',                 'chill'),
    ('Shafqat Amanat Ali',          'Teri Ore',                          'chill'),
    ('Atif Aslam',                  'Woh Lamhe',                         'chill'),
    ('Sonu Nigam',                  'Kal Ho Naa Ho',                     'chill'),
    ('KK',                          'Zindagi Do Pal Ki',                 'chill'),
    ('Lata Mangeshkar',             'Lag Jaa Gale',                      'chill'),
    ('Kishore Kumar',               'Roop Tera Mastana',                 'chill'),
    ('Mohammed Rafi',               'Baharon Phool Barsao',              'chill'),
    ('Mukesh',                      'Kabhi Kabhi Mere Dil Mein',         'chill'),
    ('Hemant Kumar',                'Na Tum Hamen Jano',                 'chill'),
    ('S.D. Burman',                 'Tere Mere Sapne',                   'chill'),
    ('Manna Dey',                   'Ae Bhai Zara Dekh Ke Chalo',        'chill'),
    ('Talat Mahmood',               'Jalte Hain Jiske Liye',             'chill'),
    ('Asha Bhosle',                 'Dum Maro Dum',                      'chill'),
    ('Geeta Dutt',                  'Waqt Ne Kiya',                      'chill'),
    ('Noor Jehan',                  'Awaz De Kahan Hai',                 'chill'),
    ('Mehdi Hassan',                'Ranjish Hi Sahi',                   'chill'),
    ('Ghulam Ali',                  'Chupke Chupke',                     'chill'),
    ('Jagjit Singh',                'Tum Itna Jo Muskura Rahe Ho',       'chill'),
    ('Pankaj Udhas',                'Chitthi Aayi Hai',                  'chill'),
    ('Anup Jalota',                 'Hari Om Hari',                      'chill'),
    ('Hariharan',                   'Dil Ki Baatein',                    'chill'),
    # ── Emotional ──
    ('Novo Amor',                   'Anchor',                            'emotional'),
    ('Bon Iver',                    'Holocene',                          'emotional'),
    ('Phoebe Bridgers',             'Savior Complex',                    'emotional'),
    ('Sufjan Stevens',              'Death With Dignity',                'emotional'),
    ('Daughter',                    'Youth',                             'emotional'),
    ('Iron & Wine',                 'Flightless Bird',                   'emotional'),
    ('Gregory Alan Isakov',         'The Stable Song',                   'emotional'),
    ('Adrianne Lenker',             'anything',                          'emotional'),
    ('Nick Drake',                  'Pink Moon',                         'emotional'),
    ('Elliott Smith',               'Between the Bars',                  'emotional'),
    ('Conor Oberst',                'Lua',                               'emotional'),
    ('Mount Eerie',                 'Real Death',                        'emotional'),
    ('Car Seat Headrest',           'Drunk Drivers',                     'emotional'),
    ('Mitski',                      'Nobody',                            'emotional'),
    ('Soccer Mommy',                'Your Dog',                          'emotional'),
    ('Snail Mail',                  'Heat Wave',                         'emotional'),
    ('Lucy Dacus',                  'Night Shift',                       'emotional'),
    ('Julien Baker',                'Sprained Ankle',                    'emotional'),
    ('boygenius',                   'Bite the Hand',                     'emotional'),
    ('The National',                'Bloodbuzz Ohio',                    'emotional'),
    ('Frightened Rabbit',           'Modern Leper',                      'emotional'),
    ('Bright Eyes',                 'First Day of My Life',              'emotional'),
    ('Death Cab for Cutie',         'I Will Follow You into the Dark',   'emotional'),
    ('The Antlers',                 'Hospice',                           'emotional'),
    ('Owen',                        'Bad News',                          'emotional'),
    ('Arijit Singh',                'Channa Mereya',                     'emotional'),
    ('KK',                          'Yaaron',                            'emotional'),
    ('Jubin Nautiyal',              'Tere Liye',                         'emotional'),
    ('Shreya Ghoshal',              'Sun Raha Hai',                      'emotional'),
    ('Sonu Nigam',                  'Dil Ne Yeh Kaha Hai',               'emotional'),
    ('Atif Aslam',                  'Doorie',                            'emotional'),
    ('Rahat Fateh Ali Khan',        'O Re Piya',                         'emotional'),
    ('Lata Mangeshkar',             'Ajeeb Dastan Hai Yeh',              'emotional'),
    ('Mohammed Rafi',               'Kya Hua Tera Wada',                 'emotional'),
    ('Kishore Kumar',               'Mere Mehboob Qayamat Hogi',         'emotional'),
    ('Mukesh',                      'Jeena Yahan Marna Yahan',           'emotional'),
    ('Talat Mahmood',               'Ae Mere Dil Kahin Aur Chal',        'emotional'),
    ('Jagjit Singh',                'Hothon Se Chhu Lo Tum',             'emotional'),
    ('Mehdi Hassan',                'Zindagi Mein To Sabhi Pyar Kiya Karte Hain', 'emotional'),
    ('Ghulam Ali',                  'Hungama Hai Kyun Barpa',            'emotional'),
    ('Farida Khanum',               'Aaj Jaane Ki Zid Na Karo',          'emotional'),
    ('Nusrat Fateh Ali Khan',       'Afreen Afreen',                     'emotional'),
    ('Abida Parveen',               'Tu Jhoom',                          'emotional'),
    ('Shafqat Amanat Ali',          'Mann Mayal',                        'emotional'),
    ('Kailash Kher',                'Saiyyan',                           'emotional'),
    ('Hariharan',                   'Kal Ho Naa Ho',                     'emotional'),
    ('Shankar Mahadevan',           'Tanha Dil',                         'emotional'),
    ('A.R. Rahman',                 'Roja Jaaneman',                     'emotional'),
    ('Ilaiyaraaja',                 'En Iniya Pon Nilave',               'emotional'),
    ('S.P. Balasubrahmanyam',       'Ye Dil Deewana',                    'emotional'),
    ('Neha Kakkar',                 'O Humsafar',                        'emotional'),
    ('Darshan Raval',               'Tera Zikr',                         'emotional'),
    ('Jubin Nautiyal',              'Lut Gaye',                          'emotional'),
]

def _prewarm_one(artist, track, mood):
    key = f'{artist}||{track}'
    if _cache_get(key):
        _mood_index_add(mood, key)
        return
    url = _itunes_preview(artist, track)
    if url:
        _cache_set(key, url)
        _mood_index_add(mood, key)
        print(f'[prewarm] ✓ {artist} — {track} [{mood}]')
    else:
        print(f'[prewarm] ✗ {artist} — {track} (no iTunes preview)')

def _start_prewarm():
    def run():
        for artist, track, mood in WARMUP_POOL:
            _prewarm_one(artist, track, mood)
            time.sleep(3)
    threading.Thread(target=run, daemon=True).start()

# ── Routes ─────────────────────────────────────────────────────────────────────

@app.route('/health')
def health():
    with _cache_lock:
        n = len(_cache)
    with _mood_index_lock:
        mood_counts = {m: len(keys) for m, keys in _mood_index.items()}
    return jsonify({'status': 'ok', 'service': 'vibe-engine-api', 'cached_entries': n, 'moods_ready': n >= 4, 'mood_counts': mood_counts})


@app.route('/api/mood')
def mood_tracks():
    mood = request.args.get('mood', '').strip().lower()
    if mood not in _mood_index:
        return jsonify({'error': f'mood must be one of: {", ".join(_mood_index)}'}), 400

    with _mood_index_lock:
        keys = list(_mood_index[mood])

    cached = []
    for key in keys:
        url = _cache_get(key)
        if url:
            artist, track = key.split('||', 1)
            cached.append({'artist': artist, 'track': track, 'previewUrl': url})

    random.shuffle(cached)
    return jsonify({'mood': mood, 'tracks': cached[:10]})


@app.route('/api/preview')
def preview():
    artist = request.args.get('artist', '').strip()
    track  = request.args.get('track',  '').strip()
    if not (artist or track):
        return jsonify({'error': 'artist and track params required'}), 400

    key = f'{artist}||{track}'
    preview_url = _cache_get(key)

    if not preview_url:
        preview_url = _itunes_preview(artist, track)
        if not preview_url:
            return jsonify({'error': 'No preview available for this track'}), 404
        _cache_set(key, preview_url)

    try:
        r = requests.get(preview_url, stream=True, timeout=15)
        ct = r.headers.get('Content-Type', 'audio/mp4')
        resp_headers = {
            'Content-Type':   ct,
            'Accept-Ranges':  'bytes',
            'Cache-Control':  'no-cache',
            'X-Audio-Source': 'itunes',
        }
        for h in ('Content-Length', 'Content-Range'):
            if h in r.headers:
                resp_headers[h] = r.headers[h]

        return Response(r.iter_content(chunk_size=16384), status=r.status_code, headers=resp_headers)

    except Exception as e:
        print(f'[preview] proxy error: {e}')
        return jsonify({'error': str(e)}), 500


@app.route('/api/search')
def search():
    q = request.args.get('q', '').strip()
    if not q:
        return jsonify({'found': False, 'error': 'q param required'}), 400
    try:
        r = requests.get(
            'https://itunes.apple.com/search',
            params={'term': q, 'media': 'music', 'entity': 'song', 'limit': 1},
            timeout=8,
        )
        results = r.json().get('results', [])
        if results:
            res = results[0]
            return jsonify({
                'found':    True,
                'title':    f"{res.get('artistName')} — {res.get('trackName')}",
                'duration': res.get('trackTimeMillis', 0) // 1000,
                'source':   'itunes',
            })
    except Exception:
        pass
    return jsonify({'found': False})


# ── Startup ────────────────────────────────────────────────────────────────────
_start_prewarm()

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 7860))
    app.run(host='0.0.0.0', port=port, debug=False)

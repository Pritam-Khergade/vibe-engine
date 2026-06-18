import React, { useState, useEffect, useRef, useCallback } from 'react';
import './App.css';

// ─── API + HELPERS ────────────────────────────────────────────────────────────

const API = process.env.REACT_APP_API_URL || 'http://localhost:5001';

function formatTime(s) {
  if (!s || !isFinite(s)) return '0:00';
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60).toString().padStart(2, '0');
  return `${m}:${sec}`;
}

// ─── EXPLANATION ENGINE ───────────────────────────────────────────────────────

const VIBE_EXPLANATIONS = {
  'Energized-Workout': [
    'This one matches the high-tempo energy your body needs right now — relentless forward momentum without lyrics pulling your focus away. Pure fuel.',
    'Built for when your heart rate is already climbing — the kind of track that makes the last rep feel like the first. No distractions, just drive.',
    'This one hits the exact BPM range where effort stops feeling like effort — forward motion disguised as music.',
  ],
  'Energized-Social': [
    'Built for rooms full of people — the kind of track that makes strangers feel like they already know each other.',
    'This one raises the energy of whatever space it enters — the track people ask about by midnight.',
    'High energy with enough melody to keep the room moving without demanding everyone\'s full attention.',
  ],
  'Energized-Drive': [
    'This one was made for open roads and no particular destination — forward momentum that matches your speed.',
    'The kind of track that makes traffic disappear — full energy, no friction, pure forward motion.',
    'This one keeps your hands on the wheel and your mind on the horizon. Exactly what driving should feel like.',
  ],
  'Energized-Study': [
    'High energy without the chaos — this one pushes you forward without pulling your focus sideways.',
    'The tempo your brain needs when the deadline is close and the work is not done yet.',
    'Intensity without distraction — this one sits underneath your work and lifts it.',
  ],
  'Energized-Unwind': [
    'Still-moving energy for when you are winding down but not quite ready to stop — the bridge between going and resting.',
    'This one lets you decelerate without crashing — active enough to feel alive, gentle enough to land.',
    'For the hour when the day is done but your body still has something left in it.',
  ],
  'Focused-Study': [
    'This one sits at the exact tempo your brain uses for deep work — present enough to keep distractions out, subtle enough to disappear into the background.',
    'The musical equivalent of a clean desk — nothing unnecessary, nothing demanding, just clear space to think.',
    'This one has been in the background of more late-night breakthroughs than you would expect. There is a reason.',
  ],
  'Focused-Drive': [
    'This one has the hypnotic forward motion of an empty highway at night — keeps you alert without demanding your attention.',
    'Steady, directional, no sharp turns — exactly what your brain needs when navigation is already running.',
    'The kind of track that makes long drives shorter. You arrive and cannot quite remember when it started playing.',
  ],
  'Focused-Workout': [
    'Methodical energy — this one is for the focused rep, not the hype moment. Precision over chaos.',
    'This one keeps your form clean and your head clear — technique music, not motivation music.',
    'The tempo that makes you count without counting. Consistent, reliable, invisible.',
  ],
  'Focused-Unwind': [
    'Gentle enough to let your mind slow down, structured enough to keep anxiety from filling the silence.',
    'This one is for the transition — the 20 minutes between the day you had and the night you need.',
    'Focus turning inward rather than outward. The sound of a mind that is finally allowed to rest.',
  ],
  'Focused-Social': [
    'The background track for conversations that go somewhere — not demanding attention, just holding space.',
    'This one makes rooms feel more intentional. The difference between a gathering and a moment.',
    'Focused warmth — the kind of music that makes people lean in slightly closer to hear each other.',
  ],
  'Chill-Unwind': [
    'This one has the unhurried quality of a Sunday with nowhere to be — warm, undemanding, the kind of sound that lets your shoulders drop.',
    'No urgency, no agenda — just the feeling of having made it through and being allowed to stop.',
    'This one does not need anything from you. That is exactly why it was chosen for right now.',
  ],
  'Chill-Study': [
    'Low-pressure background energy — this one keeps the silence from getting too loud without asking for attention.',
    'The ambient kind of focus — not pushing, just present. The sound of a productive afternoon.',
    'This one has kept more words on more pages than most playlists twice its tempo.',
  ],
  'Chill-Drive': [
    'For the drive where you are not in a hurry and the windows might be down — unhurried, easy, exactly right.',
    'This one makes familiar roads feel slightly new. The soundtrack to a route you have driven a hundred times.',
    'Low tempo, high scenery. This one rewards going slow.',
  ],
  'Chill-Workout': [
    'Recovery energy — for the stretch, the cooldown, the moment after the work is done.',
    'This one knows the difference between effort and recovery. Right now it is recovery.',
    'The track for when movement is still happening but the fight is already won.',
  ],
  'Chill-Social': [
    'The kind of music that makes conversation easier — present but not competing, warm but not demanding.',
    'This one fills the comfortable silences. The best rooms always have something like this in the background.',
    'Easy energy for easy company. The track that makes people stay a little longer than they planned.',
  ],
  'Emotional-Unwind': [
    'This one holds space for whatever you are feeling right now without trying to fix it — honest, textured, completely non-judgmental.',
    'Some music solves. This one just sits with you. Right now that is what you need.',
    'This one was not chosen because it is happy or sad. It was chosen because it is true.',
  ],
  'Emotional-Study': [
    'Feeling-adjacent focus — this one channels emotional energy into concentration rather than letting it scatter.',
    'The kind of track that turns whatever is underneath into fuel. Emotion as engine, not obstacle.',
    'This one understands that sometimes the best studying happens when something is being processed quietly underneath.',
  ],
  'Emotional-Drive': [
    'For the drive where the destination matters less than the time to think — music that moves with you, not past you.',
    'This one understands that some drives are not really about getting somewhere.',
    'The soundtrack to a decision being made, a conversation being replayed, a feeling being understood.',
  ],
  'Emotional-Workout': [
    'Turning feeling into movement — this one uses whatever is present and makes it propulsive.',
    'Some of the best workouts happen when there is something to work through. This one knows that.',
    'Energy that comes from somewhere real. The most honest kind.',
  ],
  'Emotional-Social': [
    'For the kind of gathering where real things get said — music that holds depth without demanding it.',
    'This one makes the room feel safe enough for honesty. Not every playlist can do that.',
    'Warmth with texture. The sound of people who have known each other long enough to be quiet together.',
  ],
};

function getVibeExplanation(moodLabel, activity, artist) {
  const key = `${moodLabel}-${activity || 'Unwind'}`;
  const matches = VIBE_EXPLANATIONS[key];
  if (!matches) {
    return 'This one was matched specifically to your current mood and activity — a combination your listening history alone would never have surfaced.';
  }
  const artistSeed = artist
    ? artist.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0)
    : 0;
  return matches[artistSeed % matches.length];
}

function getMatchScore(artist, moodLabel) {
  const seed = (artist || '').split('').reduce((a, c) => a + c.charCodeAt(0), 0);
  const moodBonus = { Energized: 3, Focused: 5, Chill: 2, Emotional: 4 }[moodLabel] || 0;
  return 82 + (seed % 15) + moodBonus;
}

// ─── BUBBLE BREAKER EXPLANATIONS ─────────────────────────────────────────────

function getBubbleBreakerExplanation(mood, activity) {
  const key = `${mood}-${activity || 'Unwind'}`;
  const explanations = {
    'Energized-Workout': 'This one sits outside your usual workout genres — same energy, completely different world. The best discoveries happen when the algorithm stops playing it safe.',
    'Energized-Social': 'Beyond your regular rotation — this one brings energy from a scene you have not explored yet. Different roots, same result.',
    'Energized-Drive': 'This one comes from outside your usual driving playlist territory — the kind of find that makes you pull over and Shazam something you are already playing.',
    'Energized-Study': 'Outside your normal focus genres — sometimes a different sonic world creates sharper concentration than the familiar one.',
    'Energized-Unwind': 'This one stretches your usual wind-down territory — new textures, same permission to slow down.',
    'Focused-Study': 'This one is from outside your usual focus genres — a different approach to the same goal. New sonic territory, same concentration.',
    'Focused-Drive': 'Beyond your regular driving playlist — different genre roots, same hypnotic forward motion your brain needs right now.',
    'Focused-Workout': 'Outside your normal workout territory — same precision energy, completely different world.',
    'Focused-Unwind': 'This one stretches beyond your usual wind-down genres — the kind of discovery that expands what calm means to you.',
    'Focused-Social': 'Beyond your usual background music territory — different genre, same ability to hold a room.',
    'Chill-Unwind': 'This one lives outside your usual chill genres — same permission to rest, completely different sonic world than you normally reach for.',
    'Chill-Study': 'Outside your normal study music territory — a different approach to focus that might work better than what you already know.',
    'Chill-Drive': 'Beyond your regular easy-drive rotation — new genre territory with the same unhurried quality.',
    'Chill-Workout': 'This one stretches your recovery playlist into new territory — same release, different world.',
    'Chill-Social': 'Outside your usual background music — brings warmth from a genre you have not spent time in yet.',
    'Emotional-Unwind': 'This one holds space from outside your usual emotional genres — sometimes the most honest music comes from somewhere you have not been.',
    'Emotional-Study': 'Beyond your normal emotional focus territory — different genre, same ability to channel feeling into work.',
    'Emotional-Drive': 'Outside your regular reflective music — new genre roots, same space to think.',
    'Emotional-Workout': 'This one brings intensity from a genre outside your usual workout world — different source, same fire.',
    'Emotional-Social': 'Beyond your usual emotional playlist territory — this one creates depth from a different direction.',
  };
  return explanations[key] ||
    'This one sits outside your usual genres — the kind of discovery that only happens when the algorithm stops playing it safe.';
}

// ─── DATA ─────────────────────────────────────────────────────────────────────

const MOODS = [
  { id: 'energized', emoji: '⚡', label: 'Energized', color: '#F59E0B', desc: 'High energy, ready to move' },
  { id: 'focused',   emoji: '🎯', label: 'Focused',   color: '#6366F1', desc: 'Deep work, concentration' },
  { id: 'chill',     emoji: '🌊', label: 'Chill',     color: '#06B6D4', desc: 'Relaxed, winding down' },
  { id: 'emotional', emoji: '🌙', label: 'Emotional', color: '#EC4899', desc: 'Feeling something deep' },
];

const ACTIVITIES = [
  { id: 'Workout', emoji: '🏃' },
  { id: 'Study',   emoji: '📚' },
  { id: 'Drive',   emoji: '🚗' },
  { id: 'Unwind',  emoji: '🛋️' },
  { id: 'Social',  emoji: '🎉' },
];

const NEXT_MOOD_ID = {
  energized: 'focused', focused: 'chill', chill: 'emotional', emotional: 'energized',
};

const DISCOVERY_DATA = {
  energized: [
    { artist: 'FISHER',                  track: 'Losing It',              genre: 'Tech House',              listeners: '4.2M',  via: 'Disclosure',    why: "Your high-energy session matches FISHER's driving basslines perfectly. You love Disclosure — this is that, but rawer and more physical." },
    { artist: 'Calvin Harris',           track: 'Summer',                 genre: 'Dance Pop',               listeners: '28M',   via: '',              why: '' },
    { artist: 'Martin Garrix',           track: 'Animals',                genre: 'Progressive House',       listeners: '22M',   via: '',              why: '' },
    { artist: 'Disclosure',              track: 'Latch',                  genre: 'UK House',                listeners: '6.8M',  via: '',              why: '' },
    { artist: 'Daft Punk',               track: 'Get Lucky',              genre: 'French House',            listeners: '18M',   via: '',              why: '' },
    { artist: 'Bicep',                   track: 'Glue',                   genre: 'Electronic',              listeners: '2.1M',  via: 'Four Tet',      why: "You're in a driving rhythm right now. Bicep's euphoric build-ups were made for exactly this energy." },
    { artist: 'Peggy Gou',               track: 'Nagging',                genre: 'House',                   listeners: '3.2M',  via: '',              why: '' },
    { artist: 'Four Tet',                track: 'Kool FM',                genre: 'Electronic',              listeners: '1.8M',  via: '',              why: '' },
    { artist: 'Skrillex',                track: 'Scary Monsters',         genre: 'Dubstep',                 listeners: '19M',   via: '',              why: '' },
    { artist: 'Flume',                   track: 'Never Be Like You',      genre: 'Future Bass',             listeners: '8.4M',  via: '',              why: '' },
    { artist: 'Kaytranada',              track: 'Glowed Up',              genre: 'Electronic Soul',         listeners: '4.1M',  via: '',              why: '' },
    { artist: 'Caribou',                 track: "Can't Do Without You",   genre: 'Psychedelic Electronic',  listeners: '2.3M',  via: 'Jon Hopkins',   why: '' },
    { artist: 'Jamie xx',                track: 'Gosh',                   genre: 'Electronic',              listeners: '3.8M',  via: '',              why: '' },
    { artist: 'Aphex Twin',              track: 'Windowlicker',           genre: 'IDM',                     listeners: '2.9M',  via: '',              why: '' },
    { artist: 'The Chemical Brothers',   track: 'Hey Boy Hey Girl',       genre: 'Big Beat',                listeners: '5.6M',  via: '',              why: '' },
    { artist: 'Underworld',              track: 'Born Slippy',            genre: 'Techno',                  listeners: '3.2M',  via: '',              why: '' },
    { artist: 'Justice',                 track: 'D.A.N.C.E.',             genre: 'French Electro',          listeners: '4.7M',  via: '',              why: '' },
    { artist: 'Moderat',                 track: 'Bad Kingdom',            genre: 'Techno',                  listeners: '1.9M',  via: '',              why: '' },
    { artist: 'Deadmau5',                track: 'Ghosts N Stuff',         genre: 'Progressive House',       listeners: '11M',   via: '',              why: '' },
    { artist: 'Eric Prydz',              track: 'Call On Me',             genre: 'Progressive House',       listeners: '6.1M',  via: '',              why: '' },
    { artist: 'Nero',                    track: 'Me and You',             genre: 'Dubstep',                 listeners: '3.4M',  via: '',              why: '' },
    { artist: 'Chase & Status',          track: 'No More Idols',          genre: 'Drum and Bass',           listeners: '2.8M',  via: '',              why: '' },
    { artist: 'Sub Focus',               track: 'Tidal Wave',             genre: 'Drum and Bass',           listeners: '1.7M',  via: '',              why: '' },
    { artist: 'Noisia',                  track: 'Split the Atom',         genre: 'Neurofunk',               listeners: '1.4M',  via: '',              why: '' },
    { artist: 'Pendulum',                track: 'Watercolour',            genre: 'Drum and Bass',           listeners: '4.2M',  via: '',              why: '' },
    { artist: 'Charlotte de Witte',      track: 'Doppler',                genre: 'Techno',                  listeners: '2.1M',  via: '',              why: '' },
    { artist: 'Amelie Lens',             track: 'Exhale',                 genre: 'Techno',                  listeners: '1.8M',  via: '',              why: '' },
    { artist: 'Adam Beyer',              track: 'Ignition Key',           genre: 'Techno',                  listeners: '1.6M',  via: '',              why: '' },
    { artist: 'Nina Kraviz',             track: "I'm Gonna Get You",      genre: 'Techno',                  listeners: '2.3M',  via: '',              why: '' },
    { artist: 'Richie Hawtin',           track: 'Spastik',                genre: 'Minimal Techno',          listeners: '1.4M',  via: '',              why: '' },
    { artist: 'Ben Klock',               track: 'One',                    genre: 'Techno',                  listeners: '1.1M',  via: '',              why: '' },
    { artist: 'Sven Vath',               track: 'The Beauty and the Beast', genre: 'Techno',               listeners: '1.2M',  via: '',              why: '' },
    { artist: 'Marcel Dettmann',         track: 'Substance',              genre: 'Techno',                  listeners: '1.0M',  via: '',              why: '' },
    { artist: 'Objekt',                  track: 'Needle & Thread',        genre: 'Techno',                  listeners: '0.8M',  via: '',              why: '' },
    { artist: 'Blawan',                  track: 'Getting Me Down',        genre: 'Techno',                  listeners: '0.9M',  via: '',              why: '' },
    { artist: 'Pritam',                  track: 'Badtameez Dil',          genre: 'Bollywood',               listeners: '8.1M',  via: '',              why: '' },
    { artist: 'Vishal-Shekhar',          track: 'Desi Girl',              genre: 'Bollywood',               listeners: '6.4M',  via: '',              why: '' },
    { artist: 'Shankar Ehsaan Loy',      track: 'Jai Ho',                 genre: 'Bollywood',               listeners: '5.2M',  via: '',              why: '' },
    { artist: 'Amit Trivedi',            track: 'Ik Bagal',               genre: 'Bollywood Indie',         listeners: '3.8M',  via: '',              why: '' },
    { artist: 'Nucleya',                 track: 'Bass Rani',              genre: 'Indian Electronic',       listeners: '2.1M',  via: '',              why: '' },
    { artist: 'Ritviz',                  track: 'Udd Gaye',               genre: 'Indian Electronic',       listeners: '3.2M',  via: '',              why: '' },
    { artist: 'Divine',                  track: 'Mere Gully Mein',        genre: 'Indian Hip Hop',          listeners: '4.1M',  via: '',              why: '' },
    { artist: 'Raftaar',                 track: 'Swag Mera Desi',         genre: 'Indian Hip Hop',          listeners: '5.8M',  via: '',              why: '' },
    { artist: 'Badshah',                 track: 'Paagal',                 genre: 'Bollywood Pop',           listeners: '12M',   via: '',              why: '' },
    { artist: 'Yo Yo Honey Singh',       track: 'Brown Rang',             genre: 'Bollywood Hip Hop',       listeners: '9.3M',  via: '',              why: '' },
    { artist: 'The PropheC',             track: 'Wohh',                   genre: 'Punjabi Pop',             listeners: '3.7M',  via: '',              why: '' },
    { artist: 'Diljit Dosanjh',          track: 'Do You Know',            genre: 'Punjabi Pop',             listeners: '11M',   via: '',              why: '' },
    { artist: 'Guru Randhawa',           track: 'Lahore',                 genre: 'Punjabi Pop',             listeners: '14M',   via: '',              why: '' },
    { artist: 'Harrdy Sandhu',           track: 'Bijlee Bijlee',          genre: 'Punjabi Pop',             listeners: '6.2M',  via: '',              why: '' },
    { artist: 'AP Dhillon',              track: 'With You',               genre: 'Punjabi R&B',             listeners: '8.9M',  via: '',              why: '' },
    { artist: 'Shubh',                   track: 'Still Rollin',           genre: 'Punjabi Trap',            listeners: '7.4M',  via: '',              why: '' },
    { artist: 'Karan Aujla',             track: 'Softly',                 genre: 'Punjabi Hip Hop',         listeners: '9.1M',  via: '',              why: '' },
    { artist: 'Sidhu Moosewala',         track: 'So High',                genre: 'Punjabi Hip Hop',         listeners: '13M',   via: '',              why: '' },
    { artist: 'Hardy Sandhu',            track: 'Naah',                   genre: 'Punjabi Pop',             listeners: '6.8M',  via: '',              why: '' },
    { artist: 'Sunidhi Chauhan',         track: 'Sheila Ki Jawani',       genre: 'Bollywood Dance',         listeners: '7.1M',  via: '',              why: '' },
    { artist: 'Neha Kakkar',             track: 'O Humsafar',             genre: 'Bollywood Pop',           listeners: '18M',   via: '',              why: '' },
    { artist: 'Tony Kakkar',             track: 'Tera Suit',              genre: 'Bollywood Pop',           listeners: '8.4M',  via: '',              why: '' },
    { artist: 'Darshan Raval',           track: 'Tera Zikr',              genre: 'Bollywood Indie',         listeners: '7.2M',  via: '',              why: '' },
    { artist: 'Jubin Nautiyal',          track: 'Lut Gaye',               genre: 'Bollywood',               listeners: '11M',   via: '',              why: '' },
    { artist: 'Benny Dayal',             track: 'Tune Maari Entriyaan',   genre: 'Bollywood',               listeners: '5.3M',  via: '',              why: '' },
  ],
  focused: [
    { artist: 'Nils Frahm',              track: 'Says',                   genre: 'Modern Classical',        listeners: '2.3M',  via: 'Ólafur Arnalds', why: "Focus mode detected. Nils Frahm's piano has zero lyrics, pure structure — perfect for deep work sessions." },
    { artist: 'Brian Eno',               track: 'An Ending',              genre: 'Ambient',                 listeners: '3.1M',  via: 'Aphex Twin',    why: "Ambient pioneer. Brian Eno invented music designed to aid concentration — this is the original." },
    { artist: 'Max Richter',             track: 'On the Nature of Daylight', genre: 'Neoclassical',         listeners: '4.7M',  via: '',              why: '' },
    { artist: 'Bonobo',                  track: 'Kong',                   genre: 'Downtempo',               listeners: '5.2M',  via: '',              why: '' },
    { artist: 'Tycho',                   track: 'Awake',                  genre: 'Chillwave',               listeners: '2.8M',  via: '',              why: '' },
    { artist: 'Jon Hopkins',             track: 'Immunity',               genre: 'Electronic',              listeners: '1.6M',  via: '',              why: '' },
    { artist: 'Hammock',                 track: 'Breathturn',             genre: 'Post Rock',               listeners: '0.9M',  via: '',              why: '' },
    { artist: 'Rival Consoles',          track: 'Phantom',                genre: 'Ambient Electronic',      listeners: '0.7M',  via: '',              why: '' },
    { artist: 'Olafur Arnalds',          track: 'Near Light',             genre: 'Neoclassical',            listeners: '3.4M',  via: '',              why: '' },
    { artist: 'Thom Yorke',              track: 'Analyse',                genre: 'Art Rock',                listeners: '4.2M',  via: '',              why: '' },
    { artist: 'Nicolas Jaar',            track: 'Space is Only Noise',    genre: 'Minimal Techno',          listeners: '1.3M',  via: '',              why: '' },
    { artist: 'Floating Points',         track: 'LesAlpx',                genre: 'Electronic Jazz',         listeners: '1.1M',  via: 'Four Tet',      why: "Your focus playlists lean toward complex rhythms. Floating Points is jazz-trained but electronic — same engagement, new palette." },
    { artist: 'Apparat',                 track: 'Goodbye',                genre: 'Electronic',              listeners: '1.8M',  via: '',              why: '' },
    { artist: 'Arca',                    track: 'Piel',                   genre: 'Experimental',            listeners: '0.8M',  via: '',              why: '' },
    { artist: 'Holly Herndon',           track: 'Chorus',                 genre: 'Electronic',              listeners: '0.6M',  via: '',              why: '' },
    { artist: 'Actress',                 track: 'Ascending',              genre: 'Techno',                  listeners: '0.5M',  via: '',              why: '' },
    { artist: 'Lorenzo Senni',           track: 'Superimposition',        genre: 'Trance',                  listeners: '0.4M',  via: '',              why: '' },
    { artist: 'Tim Hecker',              track: 'Ravedeath 1972',         genre: 'Ambient',                 listeners: '1.2M',  via: '',              why: '' },
    { artist: 'Stars of the Lid',        track: 'Requiem for Dying Mothers', genre: 'Post Rock',            listeners: '0.9M',  via: '',              why: '' },
    { artist: 'Godspeed You Black Emperor', track: 'The Dead Flag Blues', genre: 'Post Rock',               listeners: '1.7M',  via: '',              why: '' },
    { artist: 'Mogwai',                  track: 'Mogwai Fear Satan',      genre: 'Post Rock',               listeners: '2.1M',  via: '',              why: '' },
    { artist: 'Explosions in the Sky',   track: 'The Birth and Death of the Day', genre: 'Post Rock',       listeners: '2.8M',  via: '',              why: '' },
    { artist: 'Sigur Ros',               track: 'Hoppipolla',             genre: 'Post Rock',               listeners: '5.9M',  via: '',              why: '' },
    { artist: 'This Will Destroy You',   track: 'Quiet',                  genre: 'Post Rock',               listeners: '0.8M',  via: '',              why: '' },
    { artist: 'Mono',                    track: 'Ashes in the Snow',      genre: 'Post Rock',               listeners: '0.7M',  via: '',              why: '' },
    { artist: 'A.R. Rahman',             track: 'Dil Se Re',              genre: 'Bollywood Classical',     listeners: '12M',   via: '',              why: '' },
    { artist: 'Prateek Kuhad',           track: 'cold/mess',              genre: 'Indian Indie',            listeners: '1.8M',  via: '',              why: '' },
    { artist: 'When Chai Met Toast',     track: 'Khoj',                   genre: 'Indian Indie',            listeners: '0.9M',  via: '',              why: '' },
    { artist: 'The Local Train',         track: 'Aaoge Tum Kabhi',        genre: 'Indian Rock',             listeners: '2.1M',  via: '',              why: '' },
    { artist: 'Ankur Tewari',            track: 'Iktara',                 genre: 'Indian Indie',            listeners: '1.4M',  via: '',              why: '' },
    { artist: 'Peter Cat Recording Co',  track: 'Memory Box',             genre: 'Indian Indie Jazz',       listeners: '0.8M',  via: '',              why: '' },
    { artist: 'Parekh & Singh',          track: 'I Love You Baby',        genre: 'Indian Indie Pop',        listeners: '1.2M',  via: '',              why: '' },
    { artist: 'Lagori',                  track: 'Aamchi Mumbai',          genre: 'Indian Indie',            listeners: '0.6M',  via: '',              why: '' },
    { artist: 'Soulmate',                track: 'Soulmate Theme',         genre: 'Indian Blues',            listeners: '0.5M',  via: '',              why: '' },
    { artist: 'Thermal and a Quarter',   track: 'The Queue',              genre: 'Indian Rock',             listeners: '0.4M',  via: '',              why: '' },
    { artist: 'Neon Jungle',             track: 'Bravado',                genre: 'Indian Indie',            listeners: '0.7M',  via: '',              why: '' },
    { artist: 'Shantanu Moitra',         track: 'Dil Dhoondta Hai',       genre: 'Bollywood Classical',     listeners: '3.2M',  via: '',              why: '' },
    { artist: 'Shankar Mahadevan',       track: 'Breathless',             genre: 'Indian Classical Fusion', listeners: '6.8M',  via: '',              why: '' },
    { artist: 'Pt. Ravi Shankar',        track: 'Raga Jog',               genre: 'Indian Classical',        listeners: '2.4M',  via: '',              why: '' },
    { artist: 'Zakir Hussain',           track: 'Kirwani',                genre: 'Indian Classical',        listeners: '1.9M',  via: '',              why: '' },
    { artist: 'Anoushka Shankar',        track: 'Land of Gold',           genre: 'Indian Classical Fusion', listeners: '1.6M',  via: '',              why: '' },
    { artist: 'Niladri Kumar',           track: 'Zitar',                  genre: 'Indian Classical Fusion', listeners: '0.8M',  via: '',              why: '' },
    { artist: 'Prasanna',                track: 'Ragadharma',             genre: 'Carnatic Fusion',         listeners: '0.6M',  via: '',              why: '' },
    { artist: 'Mahesh Kale',             track: 'Abhangas',               genre: 'Marathi Classical',       listeners: '1.1M',  via: '',              why: '' },
    { artist: 'Vasundhara Das',          track: 'Ekla Cholo Re',          genre: 'Indian Indie',            listeners: '0.9M',  via: '',              why: '' },
    { artist: 'Rabbi Shergill',          track: 'Bulla Ki Jaana',         genre: 'Punjabi Sufi',            listeners: '3.7M',  via: '',              why: '' },
    { artist: 'Kailash Kher',            track: 'Teri Deewani',           genre: 'Sufi Pop',                listeners: '5.2M',  via: '',              why: '' },
    { artist: 'Ustad Nusrat Fateh Ali Khan', track: 'Tumhe Dillagi',     genre: 'Qawwali',                 listeners: '4.1M',  via: '',              why: '' },
    { artist: 'Abida Parveen',           track: 'Tere Ishq Nachaya',      genre: 'Sufi',                    listeners: '2.8M',  via: '',              why: '' },
    { artist: 'Hariharan',               track: 'Allah Ke Bande',         genre: 'Bollywood Sufi',          listeners: '3.9M',  via: '',              why: '' },
  ],
  chill: [
    { artist: 'Tame Impala',             track: 'The Less I Know The Better', genre: 'Psychedelic Pop',    listeners: '12M',   via: '',              why: '' },
    { artist: 'Mac DeMarco',             track: 'Chamber of Reflection',  genre: 'Indie Pop',               listeners: '4.1M',  via: '',              why: '' },
    { artist: 'Rex Orange County',       track: 'Loving is Easy',         genre: 'Indie Pop',               listeners: '8.3M',  via: '',              why: '' },
    { artist: 'Khruangbin',              track: 'A La Sala',              genre: 'Psychedelic Funk',         listeners: '3.9M',  via: 'Tame Impala',   why: "Your Mac DeMarco + Tame Impala taste bridges right here. Khruangbin is the connection you haven't crossed yet." },
    { artist: 'Still Woozy',             track: 'Goodie Bag',             genre: 'Indie Pop',               listeners: '5.1M',  via: '',              why: '' },
    { artist: 'Mild High Club',          track: 'Windowpane',             genre: 'Lounge Pop',              listeners: '1.2M',  via: 'Tame Impala',   why: "Perfectly calibrated for your chill mode. Mild High Club sounds like a lazy afternoon feels." },
    { artist: 'Men I Trust',             track: 'Tailwhip',               genre: 'Dream Pop',               listeners: '2.7M',  via: 'Beach House',   why: "Sunday afternoon energy detected. Men I Trust is exactly what your chill playlists are missing — hazy, warm, slightly melancholic." },
    { artist: 'Cigarettes After Sex',    track: 'Apocalypse',             genre: 'Ambient Pop',             listeners: '9.4M',  via: '',              why: '' },
    { artist: 'Beach House',             track: 'Space Song',             genre: 'Dream Pop',               listeners: '6.8M',  via: '',              why: '' },
    { artist: 'SALES',                   track: 'Pope Is a Rockstar',     genre: 'Indie Pop',               listeners: '1.9M',  via: '',              why: '' },
    { artist: 'Chet Faker',              track: 'Gold',                   genre: 'Electronic Soul',         listeners: '4.6M',  via: '',              why: '' },
    { artist: 'Petit Biscuit',           track: 'Sunset Lover',           genre: 'Electronic',              listeners: '3.2M',  via: '',              why: '' },
    { artist: 'Pretty Boy Aaron',        track: 'Feelings',               genre: 'Lo-fi Pop',               listeners: '1.4M',  via: '',              why: '' },
    { artist: 'Whitney',                 track: 'No Woman',               genre: 'Indie Folk',              listeners: '2.3M',  via: '',              why: '' },
    { artist: 'Big Thief',               track: 'Not',                    genre: 'Indie Folk',              listeners: '3.1M',  via: '',              why: '' },
    { artist: 'Soccer Mommy',            track: 'Circle the Drain',       genre: 'Indie Rock',              listeners: '2.8M',  via: '',              why: '' },
    { artist: 'Snail Mail',              track: 'Pristine',               genre: 'Indie Rock',              listeners: '1.9M',  via: '',              why: '' },
    { artist: 'Clairo',                  track: 'Pretty Girl',            genre: 'Bedroom Pop',             listeners: '7.4M',  via: '',              why: '' },
    { artist: 'Lomelda',                 track: 'Interstate Vision',      genre: 'Indie Folk',              listeners: '0.9M',  via: '',              why: '' },
    { artist: 'Hand Habits',             track: 'wildfire',               genre: 'Indie Folk',              listeners: '0.7M',  via: '',              why: '' },
    { artist: 'Pinegrove',               track: 'Old Friends',            genre: 'Emo Folk',                listeners: '1.6M',  via: '',              why: '' },
    { artist: 'Hovvdy',                  track: 'Easy',                   genre: 'Indie Pop',               listeners: '1.1M',  via: '',              why: '' },
    { artist: 'Squirrel Flower',         track: 'I Was Born Swimming',    genre: 'Folk',                    listeners: '0.8M',  via: '',              why: '' },
    { artist: 'Florist',                 track: 'Summer Blood',           genre: 'Art Folk',                listeners: '0.6M',  via: '',              why: '' },
    { artist: 'Bedouine',                track: 'Solitary Daughter',      genre: 'Folk',                    listeners: '0.7M',  via: '',              why: '' },
    { artist: 'Arijit Singh',            track: 'Tum Hi Ho',              genre: 'Bollywood Romance',       listeners: '38M',   via: '',              why: '' },
    { artist: 'Lucky Ali',               track: 'O Sanam',                genre: 'Bollywood Soft Rock',     listeners: '4.2M',  via: '',              why: '' },
    { artist: 'Mohit Chauhan',           track: 'Tum Se Hi',              genre: 'Bollywood',               listeners: '5.6M',  via: '',              why: '' },
    { artist: 'Papon',                   track: 'Moh Moh Ke Dhaage',      genre: 'Indie Bollywood',         listeners: '2.3M',  via: '',              why: '' },
    { artist: 'Shafqat Amanat Ali',      track: 'Teri Ore',               genre: 'Bollywood Sufi',          listeners: '6.1M',  via: '',              why: '' },
    { artist: 'Atif Aslam',              track: 'Woh Lamhe',              genre: 'Bollywood Pop',           listeners: '22M',   via: '',              why: '' },
    { artist: 'Sonu Nigam',              track: 'Kal Ho Naa Ho',          genre: 'Bollywood',               listeners: '15M',   via: '',              why: '' },
    { artist: 'KK',                      track: 'Zindagi Do Pal Ki',      genre: 'Bollywood',               listeners: '9.2M',  via: '',              why: '' },
    { artist: 'Lata Mangeshkar',         track: 'Lag Jaa Gale',           genre: 'Bollywood Classic',       listeners: '11M',   via: '',              why: '' },
    { artist: 'Kishore Kumar',           track: 'Roop Tera Mastana',      genre: 'Bollywood Classic',       listeners: '8.7M',  via: '',              why: '' },
    { artist: 'Mohammed Rafi',           track: 'Baharon Phool Barsao',   genre: 'Bollywood Classic',       listeners: '7.4M',  via: '',              why: '' },
    { artist: 'Mukesh',                  track: 'Kabhi Kabhi Mere Dil Mein', genre: 'Bollywood Classic',    listeners: '6.1M',  via: '',              why: '' },
    { artist: 'Hemant Kumar',            track: 'Na Tum Hamen Jano',      genre: 'Bollywood Classic',       listeners: '4.3M',  via: '',              why: '' },
    { artist: 'S.D. Burman',             track: 'Tere Mere Sapne',        genre: 'Bollywood Classic',       listeners: '3.8M',  via: '',              why: '' },
    { artist: 'Manna Dey',               track: 'Ae Bhai Zara Dekh Ke Chalo', genre: 'Bollywood Classic',  listeners: '3.2M',  via: '',              why: '' },
    { artist: 'Talat Mahmood',           track: 'Jalte Hain Jiske Liye',  genre: 'Bollywood Classic',       listeners: '2.9M',  via: '',              why: '' },
    { artist: 'Asha Bhosle',             track: 'Dum Maro Dum',           genre: 'Bollywood Classic',       listeners: '9.8M',  via: '',              why: '' },
    { artist: 'Geeta Dutt',              track: 'Waqt Ne Kiya',           genre: 'Bollywood Classic',       listeners: '3.1M',  via: '',              why: '' },
    { artist: 'Noor Jehan',              track: 'Awaz De Kahan Hai',       genre: 'Classic Ghazal',          listeners: '2.7M',  via: '',              why: '' },
    { artist: 'Mehdi Hassan',            track: 'Ranjish Hi Sahi',        genre: 'Ghazal',                  listeners: '4.2M',  via: '',              why: '' },
    { artist: 'Ghulam Ali',              track: 'Chupke Chupke',          genre: 'Ghazal',                  listeners: '3.6M',  via: '',              why: '' },
    { artist: 'Jagjit Singh',            track: 'Tum Itna Jo Muskura Rahe Ho', genre: 'Ghazal',             listeners: '5.4M',  via: '',              why: '' },
    { artist: 'Pankaj Udhas',            track: 'Chitthi Aayi Hai',       genre: 'Ghazal',                  listeners: '4.8M',  via: '',              why: '' },
    { artist: 'Anup Jalota',             track: 'Hari Om Hari',           genre: 'Bhajan',                  listeners: '2.1M',  via: '',              why: '' },
    { artist: 'Hariharan',               track: 'Dil Ki Baatein',         genre: 'Ghazal Pop',              listeners: '3.9M',  via: '',              why: '' },
  ],
  emotional: [
    { artist: 'Novo Amor',               track: 'Anchor',                 genre: 'Indie Folk',              listeners: '1.5M',  via: 'Bon Iver',      why: "Fragile vocals (Bon Iver, Phoebe Bridgers) lead exactly here. Novo Amor is that — but more intimate, almost like whispering." },
    { artist: 'Bon Iver',                track: 'Holocene',               genre: 'Indie Folk',              listeners: '11M',   via: '',              why: '' },
    { artist: 'Phoebe Bridgers',         track: 'Savior Complex',         genre: 'Indie Folk',              listeners: '7.2M',  via: '',              why: '' },
    { artist: 'Sufjan Stevens',          track: 'Death With Dignity',     genre: 'Indie Folk',              listeners: '3.8M',  via: '',              why: '' },
    { artist: 'Daughter',                track: 'Youth',                  genre: 'Indie Folk',              listeners: '4.3M',  via: '',              why: '' },
    { artist: 'Iron & Wine',             track: 'Flightless Bird',        genre: 'Folk',                    listeners: '3.1M',  via: '',              why: '' },
    { artist: 'Gregory Alan Isakov',     track: 'The Stable Song',        genre: 'Indie Folk',              listeners: '2.4M',  via: '',              why: '' },
    { artist: 'Adrianne Lenker',         track: 'anything',               genre: 'Folk',                    listeners: '1.1M',  via: 'Phoebe Bridgers', why: "Big Thief's songwriter solo. Raw, honest, devastatingly quiet. Made for exactly this feeling." },
    { artist: 'Nick Drake',              track: 'Pink Moon',              genre: 'Folk',                    listeners: '2.8M',  via: '',              why: '' },
    { artist: 'Elliott Smith',           track: 'Between the Bars',       genre: 'Indie Folk',              listeners: '3.6M',  via: '',              why: '' },
    { artist: 'Conor Oberst',            track: 'Lua',                    genre: 'Indie Folk',              listeners: '2.1M',  via: '',              why: '' },
    { artist: 'Mount Eerie',             track: 'Real Death',             genre: 'Folk',                    listeners: '1.2M',  via: '',              why: '' },
    { artist: 'Car Seat Headrest',       track: 'Drunk Drivers',          genre: 'Indie Rock',              listeners: '2.9M',  via: '',              why: '' },
    { artist: 'Mitski',                  track: 'Nobody',                 genre: 'Art Rock',                listeners: '8.7M',  via: '',              why: '' },
    { artist: 'Soccer Mommy',            track: 'Your Dog',               genre: 'Indie Rock',              listeners: '2.8M',  via: '',              why: '' },
    { artist: 'Snail Mail',              track: 'Heat Wave',              genre: 'Indie Rock',              listeners: '1.9M',  via: '',              why: '' },
    { artist: 'Lucy Dacus',              track: 'Night Shift',            genre: 'Indie Rock',              listeners: '3.2M',  via: '',              why: '' },
    { artist: 'Julien Baker',            track: 'Sprained Ankle',         genre: 'Indie Folk',              listeners: '2.4M',  via: '',              why: '' },
    { artist: 'boygenius',               track: 'Bite the Hand',          genre: 'Indie Folk',              listeners: '4.1M',  via: '',              why: '' },
    { artist: 'The National',            track: 'Bloodbuzz Ohio',         genre: 'Indie Rock',              listeners: '5.8M',  via: '',              why: '' },
    { artist: 'Frightened Rabbit',       track: 'Modern Leper',           genre: 'Indie Rock',              listeners: '2.3M',  via: '',              why: '' },
    { artist: 'Bright Eyes',             track: 'First Day of My Life',   genre: 'Indie Folk',              listeners: '3.7M',  via: '',              why: '' },
    { artist: 'Death Cab for Cutie',     track: 'I Will Follow You into the Dark', genre: 'Indie Rock',    listeners: '6.4M',  via: '',              why: '' },
    { artist: 'The Antlers',             track: 'Hospice',                genre: 'Indie Rock',              listeners: '1.8M',  via: '',              why: '' },
    { artist: 'Owen',                    track: 'Bad News',               genre: 'Indie Folk',              listeners: '0.9M',  via: '',              why: '' },
    { artist: 'Arijit Singh',            track: 'Channa Mereya',          genre: 'Bollywood Soul',          listeners: '38M',   via: '',              why: '' },
    { artist: 'KK',                      track: 'Yaaron',                 genre: 'Bollywood',               listeners: '8.9M',  via: '',              why: '' },
    { artist: 'Jubin Nautiyal',          track: 'Tere Liye',              genre: 'Bollywood',               listeners: '11M',   via: '',              why: '' },
    { artist: 'Shreya Ghoshal',          track: 'Sun Raha Hai',           genre: 'Bollywood Classical',     listeners: '14M',   via: '',              why: '' },
    { artist: 'Sonu Nigam',              track: 'Dil Ne Yeh Kaha Hai',    genre: 'Bollywood',               listeners: '15M',   via: '',              why: '' },
    { artist: 'Atif Aslam',              track: 'Doorie',                 genre: 'Bollywood Pop',           listeners: '22M',   via: '',              why: '' },
    { artist: 'Rahat Fateh Ali Khan',    track: 'O Re Piya',              genre: 'Bollywood Sufi',          listeners: '12M',   via: '',              why: '' },
    { artist: 'Lata Mangeshkar',         track: 'Ajeeb Dastan Hai Yeh',   genre: 'Bollywood Classic',       listeners: '11M',   via: '',              why: '' },
    { artist: 'Mohammed Rafi',           track: 'Kya Hua Tera Wada',      genre: 'Bollywood Classic',       listeners: '7.4M',  via: '',              why: '' },
    { artist: 'Kishore Kumar',           track: 'Mere Mehboob Qayamat Hogi', genre: 'Bollywood Classic',   listeners: '8.7M',  via: '',              why: '' },
    { artist: 'Mukesh',                  track: 'Jeena Yahan Marna Yahan', genre: 'Bollywood Classic',      listeners: '6.1M',  via: '',              why: '' },
    { artist: 'Talat Mahmood',           track: 'Ae Mere Dil Kahin Aur Chal', genre: 'Bollywood Classic',  listeners: '2.9M',  via: '',              why: '' },
    { artist: 'Jagjit Singh',            track: 'Hothon Se Chhu Lo Tum',  genre: 'Ghazal',                  listeners: '5.4M',  via: '',              why: '' },
    { artist: 'Mehdi Hassan',            track: 'Zindagi Mein To Sabhi Pyar Kiya Karte Hain', genre: 'Ghazal', listeners: '4.2M', via: '',           why: '' },
    { artist: 'Ghulam Ali',              track: 'Hungama Hai Kyun Barpa', genre: 'Ghazal',                  listeners: '3.6M',  via: '',              why: '' },
    { artist: 'Farida Khanum',           track: 'Aaj Jaane Ki Zid Na Karo', genre: 'Ghazal',               listeners: '3.1M',  via: '',              why: '' },
    { artist: 'Nusrat Fateh Ali Khan',   track: 'Afreen Afreen',          genre: 'Qawwali',                 listeners: '8.4M',  via: '',              why: '' },
    { artist: 'Abida Parveen',           track: 'Tu Jhoom',               genre: 'Sufi',                    listeners: '2.8M',  via: '',              why: '' },
    { artist: 'Shafqat Amanat Ali',      track: 'Mann Mayal',             genre: 'Sufi Pop',                listeners: '6.1M',  via: '',              why: '' },
    { artist: 'Kailash Kher',            track: 'Saiyyan',                genre: 'Sufi Pop',                listeners: '5.2M',  via: '',              why: '' },
    { artist: 'Hariharan',               track: 'Kal Ho Naa Ho',          genre: 'Bollywood Sufi',          listeners: '3.9M',  via: '',              why: '' },
    { artist: 'Shankar Mahadevan',       track: 'Tanha Dil',              genre: 'Bollywood',               listeners: '6.8M',  via: '',              why: '' },
    { artist: 'A.R. Rahman',             track: 'Roja Jaaneman',          genre: 'Bollywood Classical',     listeners: '12M',   via: '',              why: '' },
    { artist: 'Ilaiyaraaja',             track: 'En Iniya Pon Nilave',    genre: 'Tamil Classical',         listeners: '8.3M',  via: '',              why: '' },
    { artist: 'S.P. Balasubrahmanyam',   track: 'Ye Dil Deewana',         genre: 'Bollywood',               listeners: '7.6M',  via: '',              why: '' },
  ],
};

const SOURCES = [
  { name: 'App Store',        count: '180K reviews',    color: '#1DB954' },
  { name: 'Play Store',       count: '425K reviews',    color: '#1DB954' },
  { name: 'Reddit r/spotify', count: '28K posts',       color: '#8B5CF6' },
  { name: 'Twitter / X',      count: '15K discussions', color: '#06B6D4' },
  { name: 'Community Forums', count: '8K threads',      color: '#F59E0B' },
];

const FINDINGS = [
  { src: 'App Store',   color: '#1DB954', text: "41% mention feeling 'stuck' or 'bored' with recommendations" },
  { src: 'Play Store',  color: '#1DB954', text: "33% request mood-based or context-aware playlists" },
  { src: 'Reddit',      color: '#8B5CF6', text: "Top complaint: 'Discover Weekly never explains itself'" },
  { src: 'Twitter / X', color: '#06B6D4', text: "68% of churned users cite 'boring recs' as reason to leave" },
  { src: 'Forums',      color: '#F59E0B', text: "'I'm scared to waste a skip on someone I've never heard'" },
];

const RESEARCH_CARDS = [
  { num: '01', stat: '82%',    finding: 'of surveyed users feel stuck hearing the same songs every session', feature: 'Mood Intent Declaration',       desc: 'Declare your emotional state before the algorithm makes a single decision' },
  { num: '02', stat: '24%',    finding: 'only understand why a song was recommended to them',               feature: 'Contextual Explanation Card',    desc: 'Every track gets a plain-language reason that changes per mood and activity' },
  { num: '03', stat: '76%',    finding: 'would try new music if the app explained mood context before they commit', feature: '✦ AI-matched badge + sub-scores', desc: 'Mood fit, Energy fit, Freshness — three signals that make the match credible' },
  { num: '04', stat: '53%',    finding: 'say finding new music takes too much effort — it requires active navigation', feature: 'Activity Context Selector',   desc: 'Mood + activity = full context in 2 taps. Zero navigation required.' },
  { num: '05', stat: '6.8%',   finding: 'of all reviews contain explicit churn signals — leaving after years of loyalty', feature: 'Bubble Breaker Mode',        desc: 'Explicit toggle to break the genre loop before the algorithm traps you in it' },
  { num: '06', stat: '3.12/5', finding: 'average recommendation satisfaction — mediocre trust in the algorithm', feature: 'Session Feedback Loop',       desc: 'Every skip and follow visibly teaches the model this session — not next week' },
];

// ─── HELPERS ──────────────────────────────────────────────────────────────────

function loadFollowed() {
  try { return JSON.parse(localStorage.getItem('vibe_followed') || '[]'); } catch { return []; }
}
function saveFollowed(arr) {
  try { localStorage.setItem('vibe_followed', JSON.stringify(arr)); } catch {}
}

// ─── HOOK: useAudioPlayer ────────────────────────────────────────────────────

function useAudioPlayer() {
  const audioRef      = useRef(null);
  const currentKeyRef = useRef(null);
  const previewTimer  = useRef(null);
  const [playing,     setPlaying]     = useState(false);
  const [loading,     setLoading]     = useState(false);
  const [error,       setError]       = useState(false);
  const [ended,       setEnded]       = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration,    setDuration]    = useState(0);

  useEffect(() => {
    const audio = new Audio();
    audioRef.current = audio;
    const on = (ev, fn) => audio.addEventListener(ev, fn);
    on('playing',        () => { setPlaying(true); setLoading(false); setError(false); });
    on('pause',          () => setPlaying(false));
    on('ended',          () => { setPlaying(false); setEnded(true); currentKeyRef.current = null; });
    on('waiting',        () => setLoading(true));
    on('canplay',        () => setLoading(false));
    on('error',          () => { setError(true); setLoading(false); setPlaying(false); currentKeyRef.current = null; });
    on('timeupdate',     () => setCurrentTime(audio.currentTime));
    on('loadedmetadata', () => setDuration(isFinite(audio.duration) ? audio.duration : 0));
    return () => {
      clearTimeout(previewTimer.current);
      audio.pause();
      audio.src = '';
    };
  }, []);

  const stop = useCallback(() => {
    clearTimeout(previewTimer.current);
    const audio = audioRef.current;
    if (audio) { audio.pause(); audio.src = ''; }
    currentKeyRef.current = null;
    setPlaying(false); setLoading(false); setError(false); setEnded(false);
    setCurrentTime(0); setDuration(0);
  }, []);

  const seek = useCallback((time) => {
    if (audioRef.current && isFinite(time)) audioRef.current.currentTime = time;
  }, []);

  const toggle = useCallback(async (artist, track) => {
    const audio = audioRef.current;
    if (!audio) return;
    const key = `${artist}||${track}`;
    if (currentKeyRef.current === key && audio.src) {
      if (!audio.paused) { audio.pause(); }
      else {
        setLoading(true);
        try { await audio.play(); } catch { setError(true); setLoading(false); }
      }
      return;
    }
    clearTimeout(previewTimer.current);
    setError(false); setLoading(true); setEnded(false);
    setCurrentTime(0); setDuration(0);
    audio.pause();
    const url = `${API}/api/preview?artist=${encodeURIComponent(artist)}&track=${encodeURIComponent(track)}`;
    audio.src = url;
    currentKeyRef.current = key;
    audio.addEventListener('loadedmetadata', () => {
      previewTimer.current = setTimeout(() => audio.pause(), 35000);
    }, { once: true });
    try { await audio.play(); }
    catch { setError(true); setLoading(false); }
  }, []);

  const progress = duration > 0 ? currentTime / duration : 0;
  return { toggle, stop, seek, playing, loading, error, ended, currentTime, duration, progress, ready: true, ytBlocked: error };
}

// ─── SpotifyIcon ──────────────────────────────────────────────────────────────

function SpotifyIcon({ size = 20 }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} style={{ flexShrink: 0 }}>
      <circle cx="12" cy="12" r="12" fill="#1DB954" />
      <path d="M17.9 10.9C14.7 9 9.35 8.8 6.3 9.75c-.5.15-1-.15-1.15-.6-.15-.5.15-1 .6-1.15 3.55-1.05 9.4-.85 13.1 1.35.45.25.6.85.35 1.3-.25.35-.85.5-1.3.25zm-.1 2.8c-.25.35-.7.5-1.05.25-2.7-1.65-6.8-2.15-9.95-1.15-.4.1-.85-.1-.95-.5-.1-.4.1-.85.5-.95 3.65-1.1 8.15-.55 11.25 1.35.3.15.45.65.2 1zm-1.2 2.75c-.2.3-.55.4-.85.2-2.35-1.45-5.3-1.75-8.8-.95-.3.1-.65-.15-.75-.45-.1-.3.15-.65.45-.75 3.8-.85 7.1-.5 9.7 1.1.35.15.4.55.25.85z" fill="white" />
    </svg>
  );
}

// ─── Vinyl ────────────────────────────────────────────────────────────────────

function Vinyl({ moodColor, spinning }) {
  return (
    <div className={`vinyl${spinning ? ' vinyl-spin' : ''}`} style={{ '--mood-color': moodColor }}>
      <div className="vinyl-label">
        <div className="vinyl-dot" />
      </div>
    </div>
  );
}

// ─── Waveform ─────────────────────────────────────────────────────────────────

function Waveform({ active, moodColor }) {
  return (
    <div className={`waveform${active ? ' waveform-active' : ''}`} style={{ '--mood-color': moodColor }}>
      {[0, 1, 2, 3, 4, 5, 6].map(i => (
        <div key={i} className="wf-bar" style={{ animationDelay: `${i * 0.1}s` }} />
      ))}
    </div>
  );
}

// ─── SplashScreen ─────────────────────────────────────────────────────────────

function SplashScreen({ hiding }) {
  return (
    <div className={`splash-screen${hiding ? ' hiding' : ''}`}>
      <div className="splash-symbol">✦</div>
      <p className="splash-title">Vibe Engine</p>
      <p className="splash-sub">AI-powered music discovery</p>
    </div>
  );
}

// ─── SCREEN 1: MoodSelector ───────────────────────────────────────────────────

function MoodSelector({ onMoodSelect }) {
  const [selected,         setSelected]         = useState(null);
  const [showActivity,     setShowActivity]     = useState(false);
  const [selectedActivity, setSelectedActivity] = useState(null);
  const [showBubble,       setShowBubble]       = useState(false);
  const [bubbleBreaker,    setBubbleBreaker]    = useState(false);
  const [departing,        setDeparting]        = useState(false);
  const autoTimer = useRef(null);

  useEffect(() => () => clearTimeout(autoTimer.current), []);

  const advance = (mood, activityId, bubble) => {
    setDeparting(true);
    setTimeout(() => onMoodSelect(mood, activityId, bubble), 200);
  };

  const handleActivityClick = (mood, activityId) => {
    clearTimeout(autoTimer.current);
    setSelectedActivity(activityId);
    setShowBubble(true);
  };

  const handleMoodClick = (mood) => {
    if (selected) return;
    setSelected(mood);
    setShowActivity(true);
    // Auto-advance with Unwind after 3s if user doesn't pick activity
    autoTimer.current = setTimeout(() => {
      setSelectedActivity('Unwind');
      setDeparting(true);
      setTimeout(() => onMoodSelect(mood, 'Unwind', false), 200);
    }, 3000);
  };

  const handleGo = () => {
    clearTimeout(autoTimer.current);
    advance(selected, selectedActivity, bubbleBreaker);
  };

  return (
    <div className="mood-screen">
      <p className="mood-eyebrow">AI-POWERED DISCOVERY</p>
      <h1 className="mood-h1">How are you feeling right now?</h1>
      <p className="mood-sub">Your mood shapes your next discovery — 2 taps and we find you something new</p>

      <div className="mood-grid">
        {MOODS.map(mood => (
          <button
            key={mood.id}
            className={`mood-card${selected?.id === mood.id ? ` selected-${mood.id}` : ''}${departing && selected?.id !== mood.id ? ' mood-fade' : ''}`}
            style={{ '--mood-color': mood.color }}
            onClick={() => handleMoodClick(mood)}
          >
            <span className="mood-emoji">{mood.emoji}</span>
            <span className="mood-label">{mood.label}</span>
            <span className="mood-desc">{mood.desc}</span>
            {selected?.id === mood.id && <div className="mood-check">✓</div>}
          </button>
        ))}
      </div>

      {showActivity && selected && (
        <div style={{ '--mood-color': selected.color }}>
          <p className="activity-label">What are you up to?</p>
          <div className="activity-row">
            {ACTIVITIES.map(act => (
              <button
                key={act.id}
                className={`activity-chip${selectedActivity === act.id ? ' selected' : ''}`}
                onClick={() => handleActivityClick(selected, act.id)}
              >
                {act.emoji} {act.id}
              </button>
            ))}
          </div>

          {showBubble && selectedActivity && (
            <>
              <div className="bubble-breaker-row">
                <div className="toggle-wrap">
                  <div
                    className={`toggle-switch${bubbleBreaker ? ' on' : ''}`}
                    style={{ '--mood-color': selected.color }}
                    onClick={() => setBubbleBreaker(b => !b)}
                  >
                    <div className="toggle-dot" />
                  </div>
                  <div>
                    <p className="toggle-label">Expand My Taste</p>
                    <p className="toggle-sublabel">AI picks outside your usual genres</p>
                  </div>
                </div>
              </div>
              <div className="go-btn-row">
                <button
                  className="btn-go"
                  style={{ background: selected.color, color: '#000' }}
                  onClick={handleGo}
                >
                  Find Music →
                </button>
              </div>
            </>
          )}
        </div>
      )}

      <p className="mood-skip-hint">Skip → Vibe Engine infers mood from your recent plays</p>

      <div className="survey-panel">
        <div className="survey-header">
          <div className="survey-dot" />
          <span className="survey-title">PRIMARY RESEARCH · n=6 · June 2026</span>
        </div>
        {[
          { pct: '94%', color: '#F59E0B', label: 'replay same songs every session' },
          { pct: '82%', color: '#EF4444', label: 'feel stuck in a music loop' },
          { pct: '76%', color: '#8B5CF6', label: "don't know WHY a track appears" },
          { pct: '76%', color: '#1DB954', label: 'want explanation before playing' },
        ].map(r => (
          <div key={r.label} className="survey-row">
            <span className="survey-pct" style={{ color: r.color }}>{r.pct}</span>
            <span className="survey-label">{r.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── SCREEN 2: Discovery ──────────────────────────────────────────────────────

const MOOD_ENERGY_LABEL = {
  Energized: 'high-tempo',
  Focused:   'complex',
  Chill:     'upbeat',
  Emotional: 'heavy',
};

function DiscoveryScreen({ mood, activity, skips, onSkip, onNudgeAccept, followed, onFollow, yt, bubbleBreaker, sessionSignals }) {
  const [idx,              setIdx]              = useState(() => Math.floor(Math.random() * (DISCOVERY_DATA[mood.id]?.length || 50)));
  const [liked,            setLiked]            = useState(false);
  const [animDir,          setAnimDir]          = useState('in');
  const [showNudge,        setShowNudge]        = useState(false);
  const [explanation,      setExplanation]      = useState('');
  const [explanationFresh, setExplanationFresh] = useState(false);
  const [toast,            setToast]            = useState(null);
  const [barsReady,        setBarsReady]        = useState(false);

  const artists  = DISCOVERY_DATA[mood.id] || DISCOVERY_DATA.chill;
  const card     = artists[idx % artists.length];
  const nextMood = MOODS.find(m => m.id === NEXT_MOOD_ID[mood.id]);
  const score    = getMatchScore(card.artist, mood.label);

  const artistSeed = card.artist.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
  const freshness  = Math.min((bubbleBreaker ? 15 : 0) + 60 + (artistSeed % 35), 99);

  // Session counter text — always visible
  const sessionText = (() => {
    const n = sessionSignals || 0;
    const base = `Your ${mood.label} taste: ${n} signal${n !== 1 ? 's' : ''}`;
    let suffix = null;
    if (n >= 8)      suffix = `highly tuned ✦`;
    else if (n >= 5) suffix = `well tuned ✓`;
    else if (n >= 3) suffix = `getting sharper`;
    return { base, suffix, inline: !suffix ? ' this session' : '' };
  })();

  // Dynamic explanation
  useEffect(() => {
    setExplanationFresh(false);
    const t = setTimeout(() => {
      const text = bubbleBreaker
        ? getBubbleBreakerExplanation(mood.label, activity || 'Unwind')
        : getVibeExplanation(mood.label, activity || 'Unwind', card.artist);
      setExplanation(text);
      setExplanationFresh(true);
    }, 400);
    return () => clearTimeout(t);
  }, [idx, mood.id, activity, bubbleBreaker]);

  // Bar animation trigger
  useEffect(() => {
    setBarsReady(false);
    const t = setTimeout(() => setBarsReady(true), 80);
    return () => clearTimeout(t);
  }, [idx, mood.id]);

  // Reset on mood change
  useEffect(() => {
    const pool = DISCOVERY_DATA[mood.id] || DISCOVERY_DATA.chill;
    setIdx(Math.floor(Math.random() * pool.length));
    setLiked(false); setAnimDir('in'); setShowNudge(false);
  }, [mood.id]);

  const autoAdvancingRef = useRef(false);

  // Stop on manual card change, or auto-play when song ended naturally
  const stopFn   = yt.stop;
  const toggleFn = yt.toggle;
  useEffect(() => {
    if (autoAdvancingRef.current) {
      autoAdvancingRef.current = false;
      toggleFn(card.artist, card.track);
    } else {
      stopFn();
    }
  }, [idx, card.artist, card.track, stopFn, toggleFn]);

  // Auto-advance + auto-play next card when song finishes naturally
  useEffect(() => {
    if (!yt.ended) return;
    autoAdvancingRef.current = true;
    setAnimDir('out');
    const t = setTimeout(() => { setIdx(i => i + 1); setLiked(false); setAnimDir('in'); }, 320);
    return () => clearTimeout(t);
  }, [yt.ended]);

  // Nudge after 3 skips
  useEffect(() => { if (skips >= 3) setShowNudge(true); }, [skips]);

  const showToast = (message, type = 'neutral') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 2200);
  };

  const changeCard = (cb) => {
    setAnimDir('out');
    setTimeout(() => { setIdx(i => i + 1); setLiked(false); setAnimDir('in'); if (cb) cb(); }, 320);
  };

  const handleSkip = () => {
    showToast(`Got it — less ${MOOD_ENERGY_LABEL[mood.label] || 'this'} energy in future sessions`);
    changeCard(onSkip);
  };

  const handleFollow = () => {
    if (liked) return;
    setLiked(true);
    onFollow(card.artist);
    showToast(`Added to your ${mood.label} taste profile ✓`, 'follow');
    setTimeout(() => changeCard(), 700);
  };

  const bars = [
    { label: 'Mood fit',   pct: Math.min(score - 4, 99), delay: '0s'   },
    { label: 'Energy fit', pct: Math.min(score - 2, 99), delay: '0.1s' },
    { label: 'Freshness',  pct: freshness,                delay: '0.2s' },
  ];

  return (
    <div className="disc-screen">
      <div className="disc-topbar">
        <div className="session-pill" style={{ background: mood.color + '1A', border: `1px solid ${mood.color}55`, color: mood.color }}>
          <span>{mood.emoji}</span>
          <span>{mood.label} Session</span>
        </div>
        <span className="skip-count">{skips > 0 ? `${skips} skip${skips !== 1 ? 's' : ''}` : 'New discovery'}</span>
      </div>

      {showNudge ? (
        <CuriosityNudge
          mood={mood}
          nextMood={nextMood}
          onAccept={() => { setShowNudge(false); yt.stop(); onNudgeAccept(nextMood); }}
          onDismiss={() => setShowNudge(false)}
        />
      ) : (
        <>
          <div className={`disc-card${animDir === 'out' ? ' card-out' : ' card-in'}`}>

            {/* Session counter — first element inside card */}
            <p className="session-counter">
              {sessionText.base}{sessionText.inline}
              {sessionText.suffix && (
                <> · <span style={{ color: mood.color }} className="session-pulse">{sessionText.suffix}</span></>
              )}
            </p>

            {/* Hero */}
            <div className="card-hero" style={{ background: `linear-gradient(135deg, ${mood.color}44 0%, ${mood.color}0D 100%)` }}>
              <div className="hero-left">
                <Vinyl moodColor={mood.color} spinning={yt.playing} />
              </div>
              <div className="hero-right" style={{ '--mood-color': mood.color }}>
                <h2 className="card-artist">{card.artist}</h2>
                <p className="artist-disclaimer">✓ Real artist · AI-matched to your vibe</p>
                {bubbleBreaker && <p className="bubble-banner">✦ Outside your usual genres</p>}
                <p className="card-genre">{card.genre}</p>
                <p className="card-listeners">🎧 {card.listeners} monthly listeners</p>

                {/* Match Breakdown Panel */}
                <div className="match-breakdown">
                  <div className="match-big-num" style={{ color: mood.color }}>{score}%</div>
                  <div className="match-big-label">VIBE MATCH</div>
                  {bars.map(bar => (
                    <div key={bar.label} className="match-bar-row">
                      <span className="match-bar-label">{bar.label}</span>
                      <div className="match-bar-track">
                        <div
                          className="match-bar-fill"
                          style={{
                            width: barsReady ? `${bar.pct}%` : '0%',
                            background: mood.color,
                            transition: `width 0.6s ease-out ${bar.delay}`,
                          }}
                        />
                      </div>
                      <span className="match-bar-pct">{bar.pct}%</span>
                    </div>
                  ))}
                  {bubbleBreaker
                    ? <span className="freshness-badge" style={{ color: mood.color, background: mood.color + '22', border: `1px solid ${mood.color}55` }}>Outside your bubble ✦</span>
                    : freshness < 70
                      ? <span className="freshness-badge freshness-new">New to you</span>
                      : freshness > 85
                        ? <span className="freshness-badge freshness-known">In your wheelhouse</span>
                        : null
                  }
                </div>
              </div>
            </div>

            {/* Why box */}
            <div className="why-box">
              <div className="why-label-row">
                <span className="why-star">✦</span>
                <span className="why-label-text">Why this fits your {mood.label.toLowerCase()} vibe</span>
                <span className="ai-badge" style={{ '--mood-color': mood.color }}>✦ AI-matched</span>
              </div>
              <div className={`explanation-text${explanationFresh ? ' explanation-fresh' : ''}`}>
                <p className="why-text">"{explanation || card.why}"</p>
              </div>
              {card.via && <p className="why-bridge">Because you love <strong style={{ color: '#1DB954' }}>{card.via}</strong></p>}
            </div>

            {/* Audio player */}
            <div className="player-section">
              <div className="player-top">
                <div className="player-left">
                  <p className="player-label">SUGGESTED TRACK</p>
                  <p className="player-track">{card.track}</p>
                  {yt.playing && <Waveform active moodColor={mood.color} />}
                </div>
                <button
                  className={`play-circle${yt.playing ? ' play-circle-glow' : ''}${yt.error ? ' play-circle-err' : ''}`}
                  style={{ background: mood.color, '--mood-color': mood.color }}
                  onClick={() => yt.toggle(card.artist, card.track)}
                  disabled={yt.loading}
                  title={yt.error ? 'Audio unavailable — is the backend running?' : undefined}
                >
                  {yt.loading ? <span className="spin-ring" /> : yt.playing ? '⏸' : '▶'}
                </button>
              </div>
              <div
                className="player-prog-track"
                onClick={(e) => {
                  if (!yt.duration) return;
                  const r = e.currentTarget.getBoundingClientRect();
                  yt.seek(yt.duration * (e.clientX - r.left) / r.width);
                }}
              >
                <div className="player-prog-fill" style={{ width: `${yt.progress * 100}%`, background: mood.color }} />
              </div>
              <div className="player-times">
                <span>{formatTime(yt.currentTime)}</span>
                {yt.error
                  ? <span className="player-error-msg">Audio preview loading...</span>
                  : <span>{formatTime(yt.duration)}</span>}
              </div>
            </div>

            {/* Actions */}
            <div className="card-actions">
              <button className="btn-skip" onClick={handleSkip}>✕ Skip</button>
              <button
                className={`btn-follow${liked ? ' btn-liked' : ''}`}
                style={liked
                  ? { background: mood.color, borderColor: mood.color, color: '#000' }
                  : { borderColor: mood.color, color: mood.color }
                }
                onClick={handleFollow}
              >
                {liked ? '♥ Following!' : `♡ Follow ${card.artist}`}
              </button>
            </div>
          </div>

          <p className="disc-hint">💡 After 3 skips, Vibe Engine suggests a genre shift</p>
        </>
      )}

      {toast && (
        <div className={`toast toast-${toast.type}`}>
          {toast.message}
        </div>
      )}
    </div>
  );
}

// ─── CuriosityNudge ───────────────────────────────────────────────────────────

function CuriosityNudge({ mood, nextMood, onAccept, onDismiss }) {
  return (
    <div className="nudge-card">
      <span className="nudge-icon">🌀</span>
      <h3 className="nudge-title">Seems like you're done with this vibe</h3>
      <p className="nudge-body">
        You've skipped 3 tracks in your{' '}
        <span style={{ color: mood.color, fontWeight: 700 }}>{mood.label}</span> session.
      </p>
      <div className="nudge-next" style={{ border: `1px solid ${nextMood.color}`, background: nextMood.color + '12' }}>
        <span className="nudge-next-label">VIBE ENGINE SUGGESTS</span>
        <div className="nudge-next-row">
          <span className="nudge-next-emoji">{nextMood.emoji}</span>
          <div>
            <p className="nudge-next-name" style={{ color: nextMood.color }}>{nextMood.label}</p>
            <p className="nudge-next-desc">{nextMood.desc}</p>
          </div>
        </div>
      </div>
      <div className="nudge-actions">
        <button className="nudge-yes" onClick={onAccept}>Yes, explore {nextMood.emoji}</button>
        <button className="nudge-no" onClick={onDismiss}>Not now</button>
      </div>
      <p className="nudge-insight">💡 Survey: 67% get stuck from fear of ruining their current mood</p>
    </div>
  );
}

// ─── SCREEN 3: Workflow ───────────────────────────────────────────────────────

function WorkflowScreen() {
  const [step,            setStep]            = useState(-1);
  const [findingsVisible, setFindingsVisible] = useState(0);
  const running = step > -1 && step < SOURCES.length + 2;
  const done    = step >= SOURCES.length + 2;

  const runWorkflow = () => {
    if (step !== -1) return;
    SOURCES.forEach((_, i) => setTimeout(() => setStep(i), i * 700));
    const afterSources = SOURCES.length * 700;
    setTimeout(() => setStep(SOURCES.length), afterSources);
    FINDINGS.forEach((_, i) => setTimeout(() => setFindingsVisible(i + 1), afterSources + 500 + i * 500));
    setTimeout(() => setStep(SOURCES.length + 2), afterSources + 500 + FINDINGS.length * 500 + 300);
  };

  const enginePulsing = step === SOURCES.length && !done;

  return (
    <div className="workflow-screen">
      <p className="eyebrow">PART 1 · AI REVIEW ANALYSIS</p>
      <h2 className="screen-title">Review Analysis Workflow</h2>
      <p className="screen-sub">1,066 reviews · 2 platforms · June 2026</p>
      <p className="screen-sub" style={{ fontSize: '10px', marginTop: '-6px', opacity: 0.5 }}>(Pipeline architecture demo · real analysis: 1,066 reviews)</p>

      <div className="wf-pipeline">
        <div className="wf-col">
          <p className="wf-col-label">DATA SOURCES</p>
          {SOURCES.map((s, i) => (
            <div key={i} className={`wf-source${step >= i ? ' wf-source-active' : ''}`} style={{ '--src-color': s.color }}>
              <span className="wf-source-name">{s.name}</span>
              <span className="wf-source-count">{s.count}</span>
            </div>
          ))}
        </div>

        <div className="wf-center">
          <div className={`wf-vline${step >= 0 ? ' wf-vline-active' : ''}`}>
            {running && <div className="wf-flow-dot" />}
          </div>
          <div className={`wf-engine${enginePulsing ? ' wf-engine-pulse' : ''}${done ? ' wf-engine-done' : ''}`}>
            <span className="wf-engine-icon">✦</span>
            <p className="wf-engine-name">Claude AI</p>
            <p className="wf-engine-sub">n8n Workflow</p>
          </div>
          <div className={`wf-vline${done ? ' wf-vline-active' : ''}`} />
        </div>

        <div className="wf-col">
          <p className="wf-col-label">KEY FINDINGS</p>
          {FINDINGS.map((f, i) => (
            <div key={i} className={`wf-finding${findingsVisible > i ? ' wf-finding-show' : ''}`} style={{ '--fc': f.color }}>
              <span className="wf-finding-src" style={{ color: f.color }}>{f.src}</span>
              <p className="wf-finding-text">{f.text}</p>
            </div>
          ))}
        </div>
      </div>

      <button className="run-btn" onClick={runWorkflow} disabled={running || done}>
        {running ? '⟳  Analyzing...' : done ? '✓  Analysis Complete' : '▶  Run Workflow Demo'}
      </button>

      {done && (
        <>
          <div className="result-grid">
            {[['1,066','Reviews'],['2','Platforms'],['4','Root Causes'],['Jun 2026','Period']].map(([n,l]) => (
              <div key={l} className="result-card">
                <span className="result-num">{n}</span>
                <span className="result-lbl">{l}</span>
              </div>
            ))}
          </div>

          <div className="top-findings-card">
            <p className="top-findings-title">Top Findings</p>
            {[
              { pct: '41%', color: '#1DB954', text: 'Discovery feels accidental — users want intentional triggers' },
              { pct: '33%', color: '#8B5CF6', text: 'Mood ≠ genre: users want emotion-based recommendations' },
              { pct: '67%', color: '#F59E0B', text: "Users don't know WHY a track was recommended" },
            ].map(r => (
              <div key={r.text} className="finding-stat-row">
                <span className="finding-stat-pct" style={{ color: r.color }}>{r.pct}</span>
                <span className="finding-stat-text">{r.text}</span>
              </div>
            ))}
          </div>

          <h3 className="screen-title" style={{ fontSize: '18px', marginTop: '8px', marginBottom: '6px' }}>What the AI Actually Found</h3>
          <p className="screen-sub" style={{ marginBottom: '12px' }}>Real insights from 1,066 Spotify reviews analyzed</p>

          <div className="insight-cards">
            <div className="insight-card red">
              <p className="insight-tag">Top Pain Point</p>
              <p className="insight-stat">82% of users</p>
              <p className="insight-finding">Feel stuck hearing the same songs every session despite wanting to discover something new</p>
              <p className="insight-quote">"Paying $12.99 a month just to hear the same playlist no matter how many times I shuffle it"</p>
            </div>
            <div className="insight-card yellow">
              <p className="insight-tag">Top Opportunity</p>
              <p className="insight-stat">76% of users</p>
              <p className="insight-finding">Would try new music if the app explained WHY it fits their current mood first</p>
              <p className="insight-quote">"Like ecommerce — if you liked this you might also like this"</p>
            </div>
            <div className="insight-card green">
              <p className="insight-tag">Validated Solution</p>
              <p className="insight-stat">1 tap vs 3 steps</p>
              <p className="insight-finding">Mood declaration reduces discovery from search → browse → play to a single intent</p>
              <p className="insight-quote">"A section like YouTube Music Shorts — discover through snippets before committing"</p>
            </div>
          </div>

          <p className="methodology-line">
            Pipeline: google-play-scraper + iTunes RSS → 1,066 reviews cleaned → 6 research questions → Vibe Engine features
          </p>
        </>
      )}

      <p className="wf-footer">🔗 Live workflow: n8n + Claude API · Review output linked in deck</p>
    </div>
  );
}

// ─── SCREEN 4: Taste ──────────────────────────────────────────────────────────

function TasteScreen({ mood, followed, sessionSignals, bubbleBreaker }) {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
  const genres = [
    { name: 'Pop',        values: [85, 80, 72, 65, 55, 48], color: '#EC4899' },
    { name: 'Indie',      values: [40, 48, 55, 62, 68, 72], color: '#8B5CF6' },
    { name: 'Electronic', values: [20, 28, 35, 42, 50, 60], color: mood.color },
    { name: 'Jazz',       values: [5,  8,  12, 18, 25, 35], color: '#06B6D4' },
  ];
  const px = (i) => 30 + i * (265 / 5);
  const py = (v) => 10 + (1 - v / 100) * 160;
  const gridYPct = [100, 75, 50, 25, 0];

  return (
    <div className="taste-screen">
      <p className="eyebrow">PART 4 · TASTE EVOLUTION MAP</p>
      <h2 className="screen-title">Your Taste Evolution</h2>
      <p className="screen-sub">How your music taste shifted in 2026</p>

      {/* Intelligence Card */}
      <div className="intelligence-card" style={{ '--mood-color': mood.color }}>
        <p style={{ fontSize: '13px', fontWeight: 700, color: '#fff', marginBottom: '2px' }}>Your Listening Intelligence</p>
        <p style={{ fontSize: '11px', color: '#888', marginBottom: '10px' }}>What Vibe Engine has learned this session</p>
        <div className="intelligence-row">
          <span className="intelligence-icon">🎯</span>
          <span className="intelligence-label">Primary Mood</span>
          <span className="intelligence-value">{mood.label}</span>
        </div>
        <div className="intelligence-row">
          <span className="intelligence-icon">⚡</span>
          <span className="intelligence-label">Signals collected</span>
          <span className="intelligence-value">{sessionSignals || 0} this session</span>
        </div>
        <div className="intelligence-row">
          <span className="intelligence-icon">🔮</span>
          <span className="intelligence-label">Discovery mode</span>
          <span className="intelligence-value">{bubbleBreaker ? 'Expanding taste ✦' : 'Refining taste'}</span>
        </div>
      </div>

      <div className="chart-card">
        <svg viewBox="0 0 300 190" width="100%" style={{ display: 'block' }}>
          {gridYPct.map(pct => (
            <g key={pct}>
              <line x1="28" y1={py(pct)} x2="295" y2={py(pct)} stroke="#2A2A2A" strokeWidth="0.5" />
              <text x="0" y={py(pct) + 3} fill="#555" fontSize="7">{pct}%</text>
            </g>
          ))}
          {months.map((m, i) => (
            <text key={m} x={px(i)} y="183" fill="#555" fontSize="7" textAnchor="middle">{m}</text>
          ))}
          {genres.map(g => (
            <g key={g.name}>
              <polyline
                points={g.values.map((v, i) => `${px(i)},${py(v)}`).join(' ')}
                fill="none" stroke={g.color} strokeWidth="1.5"
                strokeLinecap="round" strokeLinejoin="round" opacity="0.8"
              />
              {g.values.map((v, i) => (
                <circle key={i} cx={px(i)} cy={py(v)} r="3.5" fill={g.color} opacity="0.9">
                  <title>{g.name}: {v}%</title>
                </circle>
              ))}
            </g>
          ))}
        </svg>
      </div>

      <div className="taste-legend">
        {genres.map(g => (
          <div key={g.name} className="legend-item">
            <div className="legend-dot" style={{ background: g.color }} />
            <span>{g.name}</span>
          </div>
        ))}
      </div>

      {followed.length > 0 && (
        <div className="followed-section">
          <p className="followed-header">✦  Artists followed this session</p>
          <div className="followed-chips">
            {followed.map(a => (
              <span key={a} className="followed-chip" style={{ borderColor: mood.color, color: mood.color }}>{a}</span>
            ))}
          </div>
        </div>
      )}

      <div className="taste-insight">
        <span className="taste-star">✦</span>
        <p>You've explored <strong>3 new genres</strong> this year. Your electronic taste grew <strong>+40%</strong> — Vibe Engine found you <strong>8 new artists</strong> in this space.</p>
      </div>

      <div className="nsm-card">
        <p className="nsm-label">NORTH STAR METRIC</p>
        <p className="nsm-value">Monthly New Artist Follow Rate</p>
        <p className="nsm-sub">Baseline: 0.8 → Target: 1.4 (+75%) by Week 12</p>
      </div>
    </div>
  );
}

// ─── SCREEN 5: WhyAI ─────────────────────────────────────────────────────────

function WhyAIScreen({ moodColor }) {
  const mc = moodColor || '#6366F1';
  return (
    <div className="why-ai-screen" style={{ '--mood-color': mc }}>
      <p className="eyebrow">PART 2 · RESEARCH FOUNDATION</p>
      <h2 className="screen-title">Why AI Changes Everything</h2>
      <p className="screen-sub">The gap traditional systems cannot close</p>

      <div className="stat-cards-row">
        {[
          { num: '82%', label: 'feel stuck in a loop' },
          { num: '24%', label: 'understand why songs are recommended' },
          { num: '76%', label: 'would try new music with mood context' },
        ].map(s => (
          <div key={s.num} className="stat-card">
            <div className="stat-number">{s.num}</div>
            <div className="stat-label">{s.label}</div>
          </div>
        ))}
      </div>
      <p className="source-line">From 1,066 Spotify reviews + 17 user interviews · June 2026</p>

      <h2 className="screen-title" style={{ fontSize: '18px', marginTop: '8px' }}>Why Traditional Systems Fail</h2>
      {[
        ['Recommends based on what others like you listened to', 'Starts by asking what YOU need from music right now'],
        ['Gets more conservative over time — same songs forever', 'Expand My Taste mode breaks the bubble on demand'],
        ['No explanation — feels random to 76% of users', 'Explains every match in plain language before you commit'],
      ].map(([trad, ve], i) => (
        <div key={i} className="comparison-row">
          <div className="comparison-cell traditional">
            <div className="comparison-col-label">Traditional</div>
            {trad}
          </div>
          <div className="comparison-vs">vs</div>
          <div className="comparison-cell vibe-engine">
            <div className="comparison-col-label" style={{ color: mc }}>Vibe Engine</div>
            {ve}
          </div>
        </div>
      ))}

      <h2 className="screen-title" style={{ fontSize: '18px', marginTop: '20px', marginBottom: '12px' }}>What AI Unlocks</h2>
      {[
        { icon: '🧠', title: 'Context Understanding', desc: 'Traditional systems see your history. AI understands your right now. Mood + activity = a completely different session every time.' },
        { icon: '💬', title: 'Explanation Generation', desc: 'Only an LLM can write: this track has the same focus quality as artists you love but you have never heard it. No collaborative filter generates that sentence.' },
        { icon: '🔄', title: 'Session-Level Learning', desc: 'Every skip teaches the model instantly. Traditional systems update weekly. Vibe Engine updates this session — and tells you when it has learned.' },
      ].map(c => (
        <div key={c.title} className="unlock-card">
          <div className="unlock-icon">{c.icon}</div>
          <div>
            <div className="unlock-title">{c.title}</div>
            <div className="unlock-desc">{c.desc}</div>
          </div>
        </div>
      ))}

      <h2 className="screen-title" style={{ fontSize: '16px', marginTop: '20px', marginBottom: '4px' }}>Spotify tried this. Here is what we do differently.</h2>
      <table className="dj-table">
        <thead>
          <tr><th>Feature</th><th>Spotify AI DJ</th><th>Vibe Engine</th></tr>
        </thead>
        <tbody>
          {[
            ['Starts with', 'Auto-play', 'Your declared mood'],
            ['Explains why', 'Never', 'Every track'],
            ['Breaks genre bubble', 'No', 'Expand My Taste'],
            ['Learns from skips', 'Next week', 'This session'],
          ].map(([feat, dj, ve]) => (
            <tr key={feat}><td>{feat}</td><td>{dj}</td><td>{ve}</td></tr>
          ))}
        </tbody>
      </table>

      <div className="real-artists-card">
        <p className="real-artists-title">✓ Real Artists Only</p>
        <p className="real-artists-text">AI is used to understand your mood and explain why a track fits — never to generate or replace music. Every recommendation is a real artist you have never discovered.</p>
      </div>
    </div>
  );
}

// ─── SCREEN 6: Research ───────────────────────────────────────────────────────

function ResearchScreen({ moodColor }) {
  const mc = moodColor || '#6366F1';
  return (
    <div className="research-screen" style={{ '--mood-color': mc }}>
      <p className="eyebrow">PART 3 · RESEARCH EVIDENCE</p>
      <h2 className="screen-title">From Research to Product</h2>
      <p className="screen-sub">Every feature in Vibe Engine is backed by data</p>
      <p className="source-line">1,066 Spotify reviews + 17 user interviews · June 2026</p>

      {RESEARCH_CARDS.map(card => (
        <div key={card.num} className="research-card">
          <div className="research-number" style={{ color: mc + '55' }}>{card.num}</div>
          <div className="research-stat">{card.stat}</div>
          <p className="research-finding">{card.finding}</p>
          <p className="research-arrow">→ Built as</p>
          <p className="research-feature">{card.feature}</p>
          <p className="research-feature-desc">{card.desc}</p>
        </div>
      ))}

      <h3 className="screen-title" style={{ fontSize: '15px', marginTop: '20px', marginBottom: '8px' }}>How the Data Was Collected</h3>
      <div className="data-sources-grid">
        {[
          { label: 'Google Play Store', value: 'google-play-scraper Python library' },
          { label: 'Apple App Store',   value: 'iTunes RSS feed (direct API)' },
          { label: 'User Survey',       value: '17 respondents via Google Form' },
          { label: 'Total records',     value: '1,066 cleaned reviews analyzed' },
        ].map(s => (
          <div key={s.label} className="data-source-cell">
            <p className="data-source-label">{s.label}</p>
            <p className="data-source-value">{s.value}</p>
          </div>
        ))}
      </div>

      <div className="methodology-card">
        <p className="methodology-text">
          This is real primary research — not desk research. Reviews were scraped, cleaned, deduplicated and analyzed using keyword frequency validation. All percentage claims are backed by raw data counts. Survey conducted June 16–17, 2026.
        </p>
      </div>
    </div>
  );
}

// ─── SCREEN 7: Test (dev only) ────────────────────────────────────────────────

const MOOD_META = [
  { id: 'energized', label: 'Energized', color: '#F59E0B', emoji: '⚡' },
  { id: 'focused',   label: 'Focused',   color: '#6366F1', emoji: '🎯' },
  { id: 'chill',     label: 'Chill',     color: '#06B6D4', emoji: '🌊' },
  { id: 'emotional', label: 'Emotional', color: '#EC4899', emoji: '🌙' },
];

function TestScreen({ yt }) {
  const [playing, setPlaying] = useState(null);

  const handlePlay = (artist, track) => {
    const key = `${artist}||${track}`;
    if (playing === key) {
      yt.stop();
      setPlaying(null);
    } else {
      yt.toggle(artist, track);
      setPlaying(key);
    }
  };

  return (
    <div className="test-screen">
      <p className="mood-eyebrow" style={{ color: '#F59E0B' }}>DEV · TEMPORARY</p>
      <h2 className="screen-title">All Artists — Test View</h2>
      <p className="screen-sub" style={{ marginBottom: 24 }}>
        {Object.values(DISCOVERY_DATA).reduce((a, c) => a + c.length, 0)} tracks across 4 moods · tap ▶ to preview
      </p>

      {MOOD_META.map(({ id, label, color, emoji }) => {
        const artists = DISCOVERY_DATA[id] || [];
        return (
          <div key={id} className="test-mood-group">
            <div className="test-mood-header" style={{ borderColor: color, color }}>
              {emoji} {label} <span className="test-count">{artists.length} artists</span>
            </div>
            {artists.map((card, i) => {
              const key = `${card.artist}||${card.track}`;
              const isPlaying = yt.playing && playing === key;
              const isLoading = yt.loading && playing === key;
              return (
                <div key={i} className={`test-row${isPlaying ? ' test-row-playing' : ''}`} style={{ '--mood-color': color }}>
                  <span className="test-num">{i + 1}</span>
                  <div className="test-info">
                    <span className="test-artist">{card.artist}</span>
                    <span className="test-track">{card.track}</span>
                    <span className="test-genre">{card.genre} · {card.listeners}</span>
                  </div>
                  <button
                    className="test-play"
                    style={{ background: isPlaying ? color : 'transparent', borderColor: color, color: isPlaying ? '#000' : color }}
                    onClick={() => handlePlay(card.artist, card.track)}
                    disabled={isLoading}
                  >
                    {isLoading ? '…' : isPlaying ? '⏸' : '▶'}
                  </button>
                </div>
              );
            })}
          </div>
        );
      })}
    </div>
  );
}

// ─── APP ──────────────────────────────────────────────────────────────────────

const NAV = [
  { id: 'mood',     label: 'New Vibe',  icon: '🎯' },
  { id: 'discover', label: 'Discover',  icon: '✦' },
  { id: 'whyai',    label: 'Why AI',    icon: '⚡' },
  { id: 'workflow', label: 'Workflow',  icon: '⟳' },
  { id: 'research', label: 'Research',  icon: '🔬' },
  { id: 'taste',    label: 'My Taste',  icon: '📈' },
  { id: 'test',     label: 'Test',      icon: '🧪' },
];

export default function App() {
  const [screen,         setScreen]         = useState('mood');
  const [nav,            setNav]            = useState('discover');
  const [mood,           setMood]           = useState(null);
  const [activity,       setActivity]       = useState(null);
  const [bubbleBreaker,  setBubbleBreaker]  = useState(false);
  const [skips,          setSkips]          = useState(0);
  const [sessionSignals, setSessionSignals] = useState(0);
  const [followed,       setFollowed]       = useState(loadFollowed);
  const [backendOnline,  setBackendOnline]  = useState(null);
  const [splashDone,     setSplashDone]     = useState(false);
  const [splashHiding,   setSplashHiding]   = useState(false);
  const yt = useAudioPlayer();

  // Splash screen
  useEffect(() => {
    const hideTimer = setTimeout(() => setSplashHiding(true), 1200);
    const doneTimer = setTimeout(() => setSplashDone(true), 1600);
    return () => { clearTimeout(hideTimer); clearTimeout(doneTimer); };
  }, []);

  // Backend health check — fires on mount, retries once after 3s if offline
  useEffect(() => {
    let retryTimer;
    const check = () =>
      fetch(`${API}/health`, { signal: AbortSignal.timeout(5000) })
        .then(r => r.json())
        .then(d => setBackendOnline(d.status === 'ok'))
        .catch(() => { setBackendOnline(false); retryTimer = setTimeout(check, 3000); });
    check();
    return () => clearTimeout(retryTimer);
  }, []);

  const goDiscover = (m, act, bubble = false) => {
    setMood(m);
    setActivity(act || 'Unwind');
    setBubbleBreaker(bubble);
    setSkips(0);
    setSessionSignals(0);
    setScreen('discovery');
    setNav('discover');
  };

  const handleSkip = () => {
    setSkips(s => s + 1);
    setSessionSignals(s => s + 1);
  };

  const handleFollow = (artist) => {
    setFollowed(prev => {
      if (prev.includes(artist)) return prev;
      const next = [...prev, artist];
      saveFollowed(next);
      return next;
    });
    setSessionSignals(s => s + 1);
  };

  const handleNav = (id) => {
    yt.stop();
    setNav(id);
    if      (id === 'mood')     setScreen('mood');
    else if (id === 'workflow') setScreen('workflow');
    else if (id === 'whyai')   setScreen('whyai');
    else if (id === 'research') setScreen('research');
    else if (id === 'taste')   setScreen(mood ? 'taste'     : 'mood');
    else if (id === 'discover') setScreen(mood ? 'discovery' : 'mood');
    else if (id === 'test')     setScreen('test');
  };

  const mc = mood ? mood.color : '#6366F1';

  return (
    <>
      {!splashDone && <SplashScreen hiding={splashHiding} />}
      {splashDone && (
        <div className="app app-fade-in">
          <header className="app-header">
            <div className="header-left">
              <SpotifyIcon size={20} />
              <span className="header-title">Vibe Engine</span>
            </div>
            {mood && screen !== 'mood' && (
              <div className="header-mood" style={{ color: mood.color, background: mood.color + '1A', border: `1px solid ${mood.color}44` }}>
                {mood.emoji} {mood.label}
              </div>
            )}
            <div className="header-right">
              <div className="backend-status">
                {backendOnline === true && (
                  <>
                    <span className="status-dot status-online" />
                    <span className="status-text" style={{ color: '#1DB954' }}>⚡ Live · HF Space</span>
                  </>
                )}
                {backendOnline === false && (
                  <>
                    <span className="status-dot status-offline" />
                    <span className="status-text">◉ Demo mode</span>
                  </>
                )}
              </div>
              <div className="header-badge">PM MVP</div>
            </div>
          </header>

          {backendOnline === false && (
            <p className="offline-banner">Audio previews unavailable · All AI features active</p>
          )}

          <main className="app-main">
            {screen === 'mood'      && <MoodSelector onMoodSelect={goDiscover} />}
            {screen === 'discovery' && mood && (
              <DiscoveryScreen
                mood={mood} activity={activity} skips={skips}
                bubbleBreaker={bubbleBreaker} sessionSignals={sessionSignals}
                onSkip={handleSkip}
                onNudgeAccept={(m) => { setMood(m); setSkips(0); setSessionSignals(0); setBubbleBreaker(false); }}
                followed={followed} onFollow={handleFollow}
                yt={yt}
              />
            )}
            {screen === 'workflow'  && <WorkflowScreen />}
            {screen === 'whyai'     && <WhyAIScreen moodColor={mc} />}
            {screen === 'research'  && <ResearchScreen moodColor={mc} />}
            {screen === 'test'      && <TestScreen yt={yt} />}
            {screen === 'taste'     && mood && (
              <TasteScreen
                mood={mood} followed={followed}
                sessionSignals={sessionSignals} bubbleBreaker={bubbleBreaker}
              />
            )}
          </main>

          <nav className="app-nav">
            {NAV.map(item => {
              const needsMood = (item.id === 'discover' || item.id === 'taste') && !mood;
              return (
                <button
                  key={item.id}
                  className={`nav-btn${nav === item.id ? ' nav-active' : ''}${needsMood ? ' nav-locked' : ''}`}
                  onClick={() => handleNav(item.id)}
                  disabled={needsMood}
                  title={needsMood ? 'Select a mood on New Vibe first' : undefined}
                >
                  <span className="nav-icon">{item.icon}</span>
                  <span className="nav-label">{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>
      )}
    </>
  );
}

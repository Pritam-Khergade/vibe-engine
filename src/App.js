import React, { useState, useEffect, useRef, useCallback } from 'react';
import './App.css';

// ─── API + HELPERS ────────────────────────────────────────────────────────────

const API = process.env.REACT_APP_API_URL ||
  (process.env.NODE_ENV === 'production'
    ? 'https://pritamkhergade-vibe-engine-api.hf.space'
    : '');   // empty → CRA proxy forwards /api/* to localhost:7860

function formatTime(s) {
  if (!s || !isFinite(s)) return '0:00';
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60).toString().padStart(2, '0');
  return `${m}:${sec}`;
}

// ─── DATA ─────────────────────────────────────────────────────────────────────

const MOODS = [
  { id: 'energized', emoji: '⚡', label: 'Energized', color: '#F59E0B', desc: 'High energy, ready to move' },
  { id: 'focused',   emoji: '🎯', label: 'Focused',   color: '#6366F1', desc: 'Deep work, concentration' },
  { id: 'chill',     emoji: '🌊', label: 'Chill',     color: '#06B6D4', desc: 'Relaxed, winding down' },
  { id: 'emotional', emoji: '🌙', label: 'Emotional', color: '#EC4899', desc: 'Feeling something deep' },
];

const NEXT_MOOD_ID = {
  energized: 'focused', focused: 'chill', chill: 'emotional', emotional: 'energized',
};

const DISCOVERY_DATA = {
  energized: [
    { artist: 'FISHER', genre: 'Tech House', listeners: '4.2M', match: 94, why: "Your high-energy session matches FISHER's driving basslines perfectly. You love Disclosure — this is that, but rawer and more physical.", track: 'Losing It', via: 'Disclosure', ytId: 'y902FSus0fI', ytStart: 30 },
    { artist: 'Caribou', genre: 'Psychedelic Dance', listeners: '1.8M', match: 87, why: "Your textured electronic taste (Jon Hopkins) points directly here. Caribou is that, but warmer and more hypnotic.", track: 'Sun', via: 'Jon Hopkins', ytId: 'ctX1qcqs6k8', ytStart: 20 },
    { artist: 'Bicep', genre: 'Electronic', listeners: '2.3M', match: 91, why: "You're in a driving rhythm right now. Bicep's euphoric build-ups were made for exactly this energy.", track: 'Glue', via: 'Four Tet', ytId: 'lXc8EHmFXOM', ytStart: 15 },
  ],
  focused: [
    { artist: 'Nils Frahm', genre: 'Neo-Classical', listeners: '2.1M', match: 92, why: "Focus mode detected. Nils Frahm's piano has zero lyrics, pure structure — perfect for deep work sessions.", track: 'Says', via: 'Ólafur Arnalds', ytId: 'luXZuPTJ3f8', ytStart: 10 },
    { artist: 'Floating Points', genre: 'Electronic Jazz', listeners: '890K', match: 88, why: "Your focus playlists lean toward complex rhythms. Floating Points is jazz-trained but electronic — same engagement, new palette.", track: 'LesAlpx', via: 'Four Tet', ytId: 'iuTk8x410mk', ytStart: 25 },
    { artist: 'Brian Eno', genre: 'Ambient', listeners: '3.1M', match: 85, why: "Ambient pioneer. Brian Eno invented music designed to aid concentration — this is the original.", track: 'Music For Airports', via: 'Aphex Twin', ytId: 'LKZ3fGR2SDY', ytStart: 0 },
  ],
  chill: [
    { artist: 'Men I Trust', genre: 'Dream Pop', listeners: '1.2M', match: 91, why: "Sunday afternoon energy detected. Men I Trust is exactly what your chill playlists are missing — hazy, warm, slightly melancholic.", track: 'Tailwhip', via: 'Beach House', ytId: 'uC6wKP_RVqU', ytStart: 20 },
    { artist: 'Khruangbin', genre: 'Psychedelic Soul', listeners: '3.4M', match: 89, why: "Your Mac DeMarco + Tame Impala taste bridges right here. Khruangbin is the connection you haven't crossed yet.", track: 'Lady and Man', via: 'Tame Impala', ytId: '1GBzZyx-mtg', ytStart: 15 },
    { artist: 'Mild High Club', genre: 'Psychedelic Pop', listeners: '980K', match: 86, why: "Perfectly calibrated for your chill mode. Mild High Club sounds like a lazy afternoon feels.", track: 'Windowpane', via: 'Tame Impala', ytId: 'mdJaJsD0Nrk', ytStart: 10 },
  ],
  emotional: [
    { artist: 'Novo Amor', genre: 'Indie Folk', listeners: '1.5M', match: 96, why: "Fragile vocals (Bon Iver, Phoebe Bridgers) lead exactly here. Novo Amor is that — but more intimate, almost like whispering.", track: 'Anchor', via: 'Bon Iver', ytId: 'E-MrJOz1VEY', ytStart: 10 },
    { artist: 'Grouper', genre: 'Ambient Folk', listeners: '420K', match: 83, why: "Niche pick: 420K listeners only. But every one of your emotional favorites leads here eventually. Listen in the dark.", track: 'Dragging a Dead Deer', via: 'Sharon Van Etten', ytId: 'LedYZFvbDTM', ytStart: 5 },
    { artist: 'Adrianne Lenker', genre: 'Folk', listeners: '890K', match: 90, why: "Big Thief's songwriter solo. Raw, honest, devastatingly quiet. Made for exactly this feeling.", track: 'abre', via: 'Phoebe Bridgers', ytId: 'KIXkpSQlFF4', ytStart: 15 },
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
  const currentKeyRef = useRef(null);   // "artist||track" cache key
  const previewTimer  = useRef(null);
  const [playing,     setPlaying]     = useState(false);
  const [loading,     setLoading]     = useState(false);
  const [error,       setError]       = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration,    setDuration]    = useState(0);

  useEffect(() => {
    const audio = new Audio();
    audioRef.current = audio;
    const on = (ev, fn) => audio.addEventListener(ev, fn);
    on('playing',        () => { setPlaying(true); setLoading(false); setError(false); });
    on('pause',          () => setPlaying(false));
    on('ended',          () => { setPlaying(false); currentKeyRef.current = null; });
    on('waiting',        () => setLoading(true));
    on('canplay',        () => setLoading(false));
    on('error',          () => { setError(true); setLoading(false); setPlaying(false); });
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
    setPlaying(false); setLoading(false); setError(false);
    setCurrentTime(0); setDuration(0);
  }, []);

  const seek = useCallback((time) => {
    if (audioRef.current && isFinite(time)) audioRef.current.currentTime = time;
  }, []);

  const toggle = useCallback(async (artist, track) => {
    const audio = audioRef.current;
    if (!audio) return;
    const key = `${artist}||${track}`;

    // Same track — toggle pause / resume
    if (currentKeyRef.current === key && audio.src) {
      if (!audio.paused) { audio.pause(); }
      else {
        setLoading(true);
        try { await audio.play(); } catch { setError(true); setLoading(false); }
      }
      return;
    }

    // New track
    clearTimeout(previewTimer.current);
    setError(false); setLoading(true);
    setCurrentTime(0); setDuration(0);
    audio.pause();

    const url = `${API}/api/preview?artist=${encodeURIComponent(artist)}&track=${encodeURIComponent(track)}`;
    audio.src = url;
    currentKeyRef.current = key;

    // Auto-stop after 35 s
    audio.addEventListener('loadedmetadata', () => {
      previewTimer.current = setTimeout(() => audio.pause(), 35000);
    }, { once: true });

    try { await audio.play(); }
    catch { setError(true); setLoading(false); }
  }, []);

  const progress = duration > 0 ? currentTime / duration : 0;
  return { toggle, stop, seek, playing, loading, error, currentTime, duration, progress, ready: true, ytBlocked: error };
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

// ─── SCREEN 1: MoodSelector ───────────────────────────────────────────────────

function MoodSelector({ onSelect }) {
  const [selected, setSelected] = useState(null);
  const [departing, setDeparting] = useState(false);

  const handle = (mood) => {
    if (selected) return;
    setSelected(mood.id);
    setTimeout(() => { setDeparting(true); setTimeout(() => onSelect(mood), 200); }, 550);
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
            className={`mood-card${selected === mood.id ? ' mood-selected' : ''}${departing && selected !== mood.id ? ' mood-fade' : ''}`}
            style={{ '--mood-color': mood.color }}
            onClick={() => handle(mood)}
          >
            <span className="mood-emoji">{mood.emoji}</span>
            <span className="mood-label">{mood.label}</span>
            <span className="mood-desc">{mood.desc}</span>
            {selected === mood.id && <div className="mood-check">✓</div>}
          </button>
        ))}
      </div>

      <p className="mood-skip-hint">Skip → Vibe Engine infers mood from your recent plays</p>

      <div className="survey-panel">
        <div className="survey-header">
          <div className="survey-dot" />
          <span className="survey-title">PRIMARY RESEARCH · n=6 · June 2026</span>
        </div>
        {[
          { pct: '100%', color: '#F59E0B', label: 'replay same songs every session' },
          { pct: '83%',  color: '#EF4444', label: 'feel stuck in a music loop' },
          { pct: '67%',  color: '#8B5CF6', label: 'don\'t know WHY a track appears' },
          { pct: '100%', color: '#1DB954', label: 'want explanation before playing' },
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

function DiscoveryScreen({ mood, skips, onSkip, onNudgeAccept, followed, onFollow, yt }) {
  const [idx, setIdx] = useState(0);
  const [liked, setLiked] = useState(false);
  const [animDir, setAnimDir] = useState('in');
  const [showNudge, setShowNudge] = useState(false);

  const artists = DISCOVERY_DATA[mood.id] || DISCOVERY_DATA.chill;
  const card = artists[idx % artists.length];
  const nextMood = MOODS.find(m => m.id === NEXT_MOOD_ID[mood.id]);

  // Reset when mood changes (nudge accept)
  useEffect(() => {
    setIdx(0); setLiked(false); setAnimDir('in'); setShowNudge(false);
  }, [mood.id]);

  // Stop audio on card change
  const stopFn = yt.stop;
  useEffect(() => { stopFn(); }, [idx, stopFn]);

  // Show nudge after 3 skips
  useEffect(() => { if (skips >= 3) setShowNudge(true); }, [skips]);

  const changeCard = (cb) => {
    setAnimDir('out');
    setTimeout(() => { setIdx(i => i + 1); setLiked(false); setAnimDir('in'); if (cb) cb(); }, 320);
  };

  const handleSkip = () => changeCard(onSkip);
  const handleFollow = () => {
    if (liked) return;
    setLiked(true);
    onFollow(card.artist);
    setTimeout(() => changeCard(), 700);
  };

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
            {/* Hero */}
            <div className="card-hero" style={{ background: `linear-gradient(135deg, ${mood.color}44 0%, ${mood.color}0D 100%)` }}>
              <div className="match-pill" style={{ background: mood.color }}>{card.match}% match</div>
              <div className="hero-left">
                <Vinyl moodColor={mood.color} spinning={yt.playing} />
              </div>
              <div className="hero-right">
                <h2 className="card-artist">{card.artist}</h2>
                <p className="card-genre">{card.genre}</p>
                <p className="card-listeners">🎧 {card.listeners} monthly listeners</p>
              </div>
            </div>

            {/* Why box */}
            <div className="why-box">
              <div className="why-label-row">
                <span className="why-star">✦</span>
                <span className="why-label-text">Why this fits your {mood.label.toLowerCase()} vibe</span>
              </div>
              <p className="why-text">"{card.why}"</p>
              <p className="why-bridge">Because you love <strong style={{ color: '#1DB954' }}>{card.via}</strong></p>
            </div>

            {/* Enhanced audio player */}
            <div className="player-section">
              <div className="player-top">
                <div className="player-left">
                  <p className="player-label">SUGGESTED TRACK</p>
                  <p className="player-track">{card.track}</p>
                  {yt.playing && <Waveform active moodColor={mood.color} />}
                </div>
                <button
                  className={`play-circle${yt.playing ? ' play-circle-glow' : ''}${yt.error ? ' play-circle-err' : ''}`}
                  style={{ background: yt.error ? '#3a3a3a' : mood.color, '--mood-color': mood.color }}
                  onClick={() => yt.toggle(card.artist, card.track)}
                  disabled={yt.loading}
                  title={yt.error ? 'Audio unavailable — is the backend running?' : undefined}
                >
                  {yt.loading
                    ? <span className="spin-ring" />
                    : yt.error
                      ? '✕'
                      : yt.playing
                        ? '⏸'
                        : '▶'}
                </button>
              </div>

              {/* Progress bar */}
              <div
                className="player-prog-track"
                onClick={(e) => {
                  if (!yt.duration) return;
                  const r = e.currentTarget.getBoundingClientRect();
                  yt.seek(yt.duration * (e.clientX - r.left) / r.width);
                }}
              >
                <div
                  className="player-prog-fill"
                  style={{ width: `${yt.progress * 100}%`, background: mood.color }}
                />
              </div>

              {/* Time display */}
              <div className="player-times">
                <span>{formatTime(yt.currentTime)}</span>
                {yt.error
                  ? <span className="player-error-msg">unavailable — backend offline?</span>
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
  const [step, setStep] = useState(-1);
  const [findingsVisible, setFindingsVisible] = useState(0);
  const running = step > -1 && step < SOURCES.length + 2;
  const done = step >= SOURCES.length + 2;

  const runWorkflow = () => {
    if (step !== -1) return;
    SOURCES.forEach((_, i) => setTimeout(() => setStep(i), i * 700));
    const afterSources = SOURCES.length * 700;
    setTimeout(() => setStep(SOURCES.length), afterSources);       // engine pulsing
    FINDINGS.forEach((_, i) => setTimeout(() => setFindingsVisible(i + 1), afterSources + 500 + i * 500));
    setTimeout(() => setStep(SOURCES.length + 2), afterSources + 500 + FINDINGS.length * 500 + 300);
  };

  const enginePulsing = step === SOURCES.length && !done;

  return (
    <div className="workflow-screen">
      <p className="eyebrow">PART 1 · AI REVIEW ANALYSIS</p>
      <h2 className="screen-title">Review Analysis Workflow</h2>
      <p className="screen-sub">Claude AI agent · 650K+ reviews · 5 platforms · 48 hours</p>

      <div className="wf-pipeline">
        {/* Sources */}
        <div className="wf-col">
          <p className="wf-col-label">DATA SOURCES</p>
          {SOURCES.map((s, i) => (
            <div key={i} className={`wf-source${step >= i ? ' wf-source-active' : ''}`} style={{ '--src-color': s.color }}>
              <span className="wf-source-name">{s.name}</span>
              <span className="wf-source-count">{s.count}</span>
            </div>
          ))}
        </div>

        {/* Center: arrows + engine */}
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

        {/* Findings */}
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
            {[['650K+','Reviews'],['5','Platforms'],['4','Root Causes'],['48h','Analysis']].map(([n,l]) => (
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
              { pct: '67%', color: '#F59E0B', text: 'Users don\'t know WHY a track was recommended' },
            ].map(r => (
              <div key={r.text} className="finding-stat-row">
                <span className="finding-stat-pct" style={{ color: r.color }}>{r.pct}</span>
                <span className="finding-stat-text">{r.text}</span>
              </div>
            ))}
          </div>
        </>
      )}

      <p className="wf-footer">🔗 Live workflow: n8n + Claude API · Review output linked in deck</p>
    </div>
  );
}

// ─── SCREEN 4: Taste ──────────────────────────────────────────────────────────

function TasteScreen({ mood, followed }) {
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
      <p className="screen-sub">How your music taste shifted in 2024</p>

      <div className="chart-card">
        <svg viewBox="0 0 300 190" width="100%" style={{ display: 'block' }}>
          {/* Grid lines + Y labels */}
          {gridYPct.map(pct => (
            <g key={pct}>
              <line x1="28" y1={py(pct)} x2="295" y2={py(pct)} stroke="#2A2A2A" strokeWidth="0.5" />
              <text x="0" y={py(pct) + 3} fill="#555" fontSize="7">{pct}%</text>
            </g>
          ))}
          {/* X labels */}
          {months.map((m, i) => (
            <text key={m} x={px(i)} y="183" fill="#555" fontSize="7" textAnchor="middle">{m}</text>
          ))}
          {/* Lines + dots */}
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

// ─── APP ──────────────────────────────────────────────────────────────────────

const NAV = [
  { id: 'discover', label: 'Discover', icon: '✦' },
  { id: 'workflow', label: 'Workflow', icon: '⟳' },
  { id: 'taste',    label: 'My Taste', icon: '📈' },
  { id: 'mood',     label: 'New Vibe', icon: '🎯' },
];

export default function App() {
  const [screen, setScreen] = useState('mood');
  const [nav, setNav] = useState('discover');
  const [mood, setMood] = useState(null);
  const [skips, setSkips] = useState(0);
  const [followed, setFollowed] = useState(loadFollowed);
  const [backendOnline, setBackendOnline] = useState(null);
  const yt = useAudioPlayer();

  useEffect(() => {
    const ctrl = new AbortController();
    fetch(`${API}/health`, { signal: ctrl.signal })
      .then(r => r.json())
      .then(d => setBackendOnline(d.status === 'ok'))
      .catch(() => setBackendOnline(false));
    return () => ctrl.abort();
  }, []);

  const goDiscover = (m) => { setMood(m); setSkips(0); setScreen('discovery'); setNav('discover'); };

  const handleFollow = (artist) => {
    setFollowed(prev => {
      if (prev.includes(artist)) return prev;
      const next = [...prev, artist];
      saveFollowed(next);
      return next;
    });
  };

  const handleNav = (id) => {
    yt.stop();
    setNav(id);
    if (id === 'mood') setScreen('mood');
    else if (id === 'workflow') setScreen('workflow');
    else if (id === 'taste') setScreen(mood ? 'taste' : 'mood');
    else if (id === 'discover') setScreen(mood ? 'discovery' : 'mood');
  };

  return (
    <div className="app">
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
            <span className={`status-dot${backendOnline === true ? ' status-online' : backendOnline === false ? ' status-offline' : ''}`} />
            {backendOnline !== null && (
              <span className="status-text">{backendOnline ? 'Live' : 'Offline'}</span>
            )}
          </div>
          <div className="header-badge">PM MVP</div>
        </div>
      </header>

      <main className="app-main">
        {screen === 'mood' && <MoodSelector onSelect={goDiscover} />}
        {screen === 'discovery' && mood && (
          <DiscoveryScreen
            mood={mood} skips={skips}
            onSkip={() => setSkips(s => s + 1)}
            onNudgeAccept={(m) => { setMood(m); setSkips(0); }}
            followed={followed} onFollow={handleFollow}
            yt={yt}
          />
        )}
        {screen === 'workflow' && <WorkflowScreen />}
        {screen === 'taste' && mood && <TasteScreen mood={mood} followed={followed} />}
      </main>

      <nav className="app-nav">
        {NAV.map(item => (
          <button key={item.id} className={`nav-btn${nav === item.id ? ' nav-active' : ''}`} onClick={() => handleNav(item.id)}>
            <span className="nav-icon">{item.icon}</span>
            <span className="nav-label">{item.label}</span>
          </button>
        ))}
      </nav>
    </div>
  );
}

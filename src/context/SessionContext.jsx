import { createContext, useCallback, useContext, useState } from 'react';

const SessionContext = createContext(null);

const DEFAULT_SCORES = { Pop: 50, Indie: 50, Electronic: 20, Jazz: 15 };

// Maps a track's genre string to chart-genre weights (must sum to 1.0)
const GENRE_WEIGHT_MAP = {
  // ── Electronic-dominant ────────────────────────────────────────────────────
  'Tech House':              { Electronic: 0.75, Pop: 0.15, Indie: 0.05, Jazz: 0.05 },
  'Dance Pop':               { Pop: 0.70, Electronic: 0.20, Indie: 0.05, Jazz: 0.05 },
  'Progressive House':       { Electronic: 0.80, Pop: 0.15, Indie: 0.03, Jazz: 0.02 },
  'UK House':                { Electronic: 0.70, Pop: 0.20, Indie: 0.07, Jazz: 0.03 },
  'French House':            { Electronic: 0.65, Pop: 0.25, Indie: 0.07, Jazz: 0.03 },
  'Electronic':              { Electronic: 0.80, Pop: 0.10, Indie: 0.05, Jazz: 0.05 },
  'Future Bass':             { Electronic: 0.75, Pop: 0.15, Indie: 0.07, Jazz: 0.03 },
  'Electronic Soul':         { Electronic: 0.55, Pop: 0.30, Indie: 0.10, Jazz: 0.05 },
  'Dubstep':                 { Electronic: 0.85, Pop: 0.10, Indie: 0.03, Jazz: 0.02 },
  'Drum and Bass':           { Electronic: 0.80, Pop: 0.08, Indie: 0.07, Jazz: 0.05 },
  'Neurofunk':               { Electronic: 0.85, Pop: 0.05, Indie: 0.05, Jazz: 0.05 },
  'Techno':                  { Electronic: 0.90, Pop: 0.05, Indie: 0.03, Jazz: 0.02 },
  'Minimal Techno':          { Electronic: 0.85, Pop: 0.05, Indie: 0.05, Jazz: 0.05 },
  'IDM':                     { Electronic: 0.80, Pop: 0.05, Indie: 0.10, Jazz: 0.05 },
  'Big Beat':                { Electronic: 0.70, Pop: 0.15, Indie: 0.10, Jazz: 0.05 },
  'French Electro':          { Electronic: 0.75, Pop: 0.15, Indie: 0.07, Jazz: 0.03 },
  'Psychedelic Electronic':  { Electronic: 0.65, Indie: 0.25, Pop: 0.07, Jazz: 0.03 },
  'Ambient Electronic':      { Electronic: 0.60, Jazz: 0.20, Indie: 0.15, Pop: 0.05 },
  'Electronic Jazz':         { Electronic: 0.50, Jazz: 0.35, Indie: 0.10, Pop: 0.05 },
  'Chillwave':               { Electronic: 0.45, Indie: 0.35, Pop: 0.15, Jazz: 0.05 },
  'Downtempo':               { Electronic: 0.45, Indie: 0.30, Jazz: 0.15, Pop: 0.10 },
  'Indian Electronic':       { Electronic: 0.65, Pop: 0.25, Indie: 0.07, Jazz: 0.03 },
  // ── Indie-dominant ────────────────────────────────────────────────────────
  'Indie Pop':               { Indie: 0.70, Pop: 0.20, Electronic: 0.05, Jazz: 0.05 },
  'Indie Folk':              { Indie: 0.80, Pop: 0.10, Jazz: 0.07, Electronic: 0.03 },
  'Indie Rock':              { Indie: 0.70, Pop: 0.15, Electronic: 0.10, Jazz: 0.05 },
  'Indie Bollywood':         { Indie: 0.50, Pop: 0.35, Electronic: 0.10, Jazz: 0.05 },
  'Indian Indie':            { Indie: 0.65, Pop: 0.20, Electronic: 0.10, Jazz: 0.05 },
  'Indian Indie Pop':        { Indie: 0.55, Pop: 0.30, Electronic: 0.10, Jazz: 0.05 },
  'Indian Rock':             { Indie: 0.65, Pop: 0.20, Electronic: 0.10, Jazz: 0.05 },
  'Psychedelic Pop':         { Indie: 0.60, Pop: 0.25, Electronic: 0.10, Jazz: 0.05 },
  'Psychedelic Funk':        { Indie: 0.50, Jazz: 0.25, Pop: 0.15, Electronic: 0.10 },
  'Art Rock':                { Indie: 0.65, Electronic: 0.20, Pop: 0.10, Jazz: 0.05 },
  'Post Rock':               { Indie: 0.70, Electronic: 0.15, Jazz: 0.10, Pop: 0.05 },
  'Bedroom Pop':             { Indie: 0.65, Pop: 0.25, Electronic: 0.07, Jazz: 0.03 },
  'Lounge Pop':              { Indie: 0.50, Pop: 0.30, Jazz: 0.15, Electronic: 0.05 },
  'Ambient Pop':             { Indie: 0.45, Electronic: 0.30, Pop: 0.20, Jazz: 0.05 },
  'Dream Pop':               { Indie: 0.65, Electronic: 0.20, Pop: 0.10, Jazz: 0.05 },
  'Lo-fi Pop':               { Jazz: 0.35, Indie: 0.40, Electronic: 0.15, Pop: 0.10 },
  'Emo Folk':                { Indie: 0.75, Pop: 0.10, Jazz: 0.10, Electronic: 0.05 },
  'Folk':                    { Indie: 0.75, Pop: 0.15, Jazz: 0.07, Electronic: 0.03 },
  'Synth Pop':               { Pop: 0.50, Electronic: 0.35, Indie: 0.10, Jazz: 0.05 },
  'Hip Hop':                 { Pop: 0.50, Electronic: 0.30, Indie: 0.15, Jazz: 0.05 },
  'Bollywood Soft Rock':     { Indie: 0.40, Pop: 0.40, Jazz: 0.15, Electronic: 0.05 },
  'Bollywood Indie':         { Indie: 0.55, Pop: 0.30, Electronic: 0.10, Jazz: 0.05 },
  // ── Jazz / Classical-dominant ─────────────────────────────────────────────
  'Modern Classical':        { Jazz: 0.40, Indie: 0.30, Electronic: 0.20, Pop: 0.10 },
  'Ambient':                 { Jazz: 0.35, Electronic: 0.35, Indie: 0.20, Pop: 0.10 },
  'Neoclassical':            { Jazz: 0.50, Indie: 0.25, Electronic: 0.15, Pop: 0.10 },
  'Cinematic':               { Jazz: 0.45, Indie: 0.25, Pop: 0.20, Electronic: 0.10 },
  'Indian Indie Jazz':       { Jazz: 0.40, Indie: 0.35, Pop: 0.15, Electronic: 0.10 },
  'Indian Blues':            { Jazz: 0.55, Indie: 0.30, Pop: 0.10, Electronic: 0.05 },
  'Indian Classical':        { Jazz: 0.60, Indie: 0.20, Pop: 0.15, Electronic: 0.05 },
  'Indian Classical Fusion': { Jazz: 0.50, Indie: 0.25, Pop: 0.15, Electronic: 0.10 },
  'Bollywood Classical':     { Jazz: 0.40, Pop: 0.35, Indie: 0.15, Electronic: 0.10 },
  'Tamil Classical':         { Jazz: 0.55, Pop: 0.25, Indie: 0.15, Electronic: 0.05 },
  'Sufi Pop':                { Jazz: 0.40, Pop: 0.40, Indie: 0.15, Electronic: 0.05 },
  'Punjabi Sufi':            { Jazz: 0.35, Pop: 0.45, Indie: 0.15, Electronic: 0.05 },
  'Qawwali':                 { Jazz: 0.55, Pop: 0.30, Indie: 0.10, Electronic: 0.05 },
  'Sufi':                    { Jazz: 0.50, Pop: 0.30, Indie: 0.15, Electronic: 0.05 },
  'Bollywood Sufi':          { Jazz: 0.40, Pop: 0.40, Indie: 0.15, Electronic: 0.05 },
  'Ghazal':                  { Jazz: 0.65, Pop: 0.20, Indie: 0.10, Electronic: 0.05 },
  'Classic Ghazal':          { Jazz: 0.70, Pop: 0.15, Indie: 0.10, Electronic: 0.05 },
  'Ghazal Pop':              { Jazz: 0.45, Pop: 0.35, Indie: 0.15, Electronic: 0.05 },
  'Bhajan':                  { Jazz: 0.50, Pop: 0.25, Indie: 0.20, Electronic: 0.05 },
  // ── Pop-dominant ──────────────────────────────────────────────────────────
  'Bollywood':               { Pop: 0.75, Indie: 0.10, Electronic: 0.10, Jazz: 0.05 },
  'Bollywood Pop':           { Pop: 0.80, Electronic: 0.10, Indie: 0.07, Jazz: 0.03 },
  'Bollywood Dance':         { Pop: 0.65, Electronic: 0.25, Indie: 0.07, Jazz: 0.03 },
  'Bollywood Classic':       { Jazz: 0.35, Pop: 0.45, Indie: 0.15, Electronic: 0.05 },
  'Bollywood Soul':          { Pop: 0.45, Jazz: 0.30, Indie: 0.15, Electronic: 0.10 },
  'Bollywood Romance':       { Pop: 0.55, Jazz: 0.25, Indie: 0.15, Electronic: 0.05 },
  'Punjabi Pop':             { Pop: 0.75, Electronic: 0.15, Indie: 0.07, Jazz: 0.03 },
  'Punjabi Trap':            { Pop: 0.55, Electronic: 0.35, Indie: 0.07, Jazz: 0.03 },
  'Punjabi R&B':             { Pop: 0.60, Electronic: 0.20, Jazz: 0.12, Indie: 0.08 },
  'Bollywood Hip Hop':       { Pop: 0.55, Electronic: 0.25, Indie: 0.15, Jazz: 0.05 },
  'Punjabi Hip Hop':         { Pop: 0.60, Electronic: 0.25, Indie: 0.10, Jazz: 0.05 },
  'Indian Hip Hop':          { Pop: 0.50, Electronic: 0.30, Indie: 0.15, Jazz: 0.05 },
};

const DEFAULT_WEIGHTS = { Pop: 0.25, Indie: 0.25, Electronic: 0.25, Jazz: 0.25 };

// Mood-specific starting baseline (before any interaction)
export const MOOD_BASELINE = {
  emotional:  { Pop: 55, Indie: 30, Electronic: 12, Jazz: 10 },
  energized:  { Pop: 55, Indie: 20, Electronic: 28, Jazz: 5  },
  chill:      { Pop: 65, Indie: 28, Electronic: 18, Jazz: 14 },
  focused:    { Pop: 40, Indie: 30, Electronic: 38, Jazz: 28 },
};

function getTrackWeights(track) {
  if (track.genreWeights) return track.genreWeights;
  return GENRE_WEIGHT_MAP[track.genre] || DEFAULT_WEIGHTS;
}

export function SessionProvider({ children }) {
  const [genreScores, setGenreScores] = useState({ ...DEFAULT_SCORES });
  const [interactions, setInteractions] = useState([]);

  const likeTrack = useCallback((track) => {
    const weights = getTrackWeights(track);
    setGenreScores(prev => {
      const next = { ...prev };
      Object.entries(weights).forEach(([g, w]) => {
        next[g] = Math.min(99, Math.round((next[g] || 0) + w * 15));
      });
      return next;
    });
    setInteractions(prev => [
      ...prev,
      { type: 'like', artist: track.artist, track: track.track, genre: track.genre },
    ]);
  }, []);

  const skipTrack = useCallback((track) => {
    const weights = getTrackWeights(track);
    setGenreScores(prev => {
      const next = { ...prev };
      Object.entries(weights).forEach(([g, w]) => {
        next[g] = Math.max(1, Math.round((next[g] || 0) - w * 10));
      });
      return next;
    });
    setInteractions(prev => [
      ...prev,
      { type: 'skip', artist: track.artist, track: track.track, genre: track.genre },
    ]);
  }, []);

  const resetSession = useCallback(() => {
    setGenreScores({ ...DEFAULT_SCORES });
    setInteractions([]);
  }, []);

  return (
    <SessionContext.Provider value={{ genreScores, interactions, likeTrack, skipTrack, resetSession }}>
      {children}
    </SessionContext.Provider>
  );
}

export function useSession() {
  return useContext(SessionContext);
}

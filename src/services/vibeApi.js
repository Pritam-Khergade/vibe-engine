const BASE = 'https://pritamkhergade-vibe-engine-api.hf.space';

const MOOD_MAP = {
  Emotional: 'emotional',
  Energized: 'energized',
  Chill:     'chill',
  Focused:   'focused',
  Energetic: 'energized',
};

// Mood-level genre weights used when track has no per-genre data
export const MOOD_GENRE_WEIGHTS = {
  emotional: { Indie: 0.70, Pop: 0.20, Electronic: 0.05, Jazz: 0.05 },
  energized: { Electronic: 0.70, Pop: 0.20, Indie: 0.05, Jazz: 0.05 },
  chill:     { Indie: 0.40, Jazz: 0.30, Pop: 0.20, Electronic: 0.10 },
  focused:   { Jazz: 0.40, Electronic: 0.30, Indie: 0.20, Pop: 0.10 },
};

export async function fetchTracksByMood(mood) {
  const mapped = MOOD_MAP[mood] || 'emotional';
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 30000);
  try {
    const res = await fetch(`${BASE}/api/mood?mood=${mapped}`, { signal: controller.signal });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    clearTimeout(timeout);
    return (data.tracks || []).map(t => ({ ...t, _fromApi: true }));
  } catch (err) {
    clearTimeout(timeout);
    throw err;
  }
}

export async function checkHealth() {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10000);
  try {
    const res = await fetch(`${BASE}/health`, { signal: controller.signal });
    clearTimeout(timeout);
    return res.json();
  } catch {
    clearTimeout(timeout);
    throw new Error('Health check failed');
  }
}

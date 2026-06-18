# Vibe Engine — AI Music Discovery
### NextLeap PM Fellowship · Graduation Project 2026

> Mood-aware music discovery that breaks the comfort-zone loop — declare your vibe, get an AI-matched artist, hear a live preview, understand exactly why it fits.

---

## Live

| Surface | URL |
|---------|-----|
| React frontend | Vercel (set `REACT_APP_API_URL` env var) |
| Flask backend | `https://pritamkhergade-vibe-engine-api.hf.space` |

---

## What's Inside

| Feature | Description |
|---------|-------------|
| **Mood Declaration** | 4-mood selector — Energized / Focused / Chill / Emotional |
| **Activity Context** | 5 activity chips refine the match (Workout, Study, Drive, Unwind, Social) |
| **Bubble Breaker** | Toggle to deliberately step outside your genre comfort zone |
| **Discovery Card** | AI-explained artist with mood-match %, energy fit, freshness bars |
| **Live Audio Preview** | 30-second preview streamed from YouTube via HF Space backend |
| **Session Learning** | Every skip and follow visibly tunes the session |
| **Curiosity Nudge** | Triggers after 3 skips — suggests an adjacent mood shift |
| **Taste Profile** | Visual of how your followed artists build a taste fingerprint |
| **Workflow Screen** | Animated demo of the AI review analysis pipeline (1,066 reviews) |
| **Research Screen** | 6 PM research findings → feature decisions |
| **Why AI Screen** | Explains the recommendation logic to users |

---

## Artist Pool

210 artists across 4 moods (60 Energized, 50 each for Focused / Chill / Emotional):

- **Energized** — Tech House · Progressive House · Drum & Bass · **Techno** (Charlotte de Witte, Amelie Lens, Nina Kraviz, Richie Hawtin…) · Bollywood Dance · Punjabi Hip Hop
- **Focused** — Neoclassical · Ambient · Post Rock · Indian Classical · Sufi · Indian Indie
- **Chill** — Dream Pop · Indie Folk · Ghazal · Classic Bollywood · Bedroom Pop
- **Emotional** — Indie Folk · Art Rock · Qawwali · Bollywood Soul · Sufi

---

## Local Development

### Frontend
```bash
npm install
npm start
# Opens at http://localhost:3000
# API points to https://pritamkhergade-vibe-engine-api.hf.space by default
```

### Backend (optional — HF Space is always live)
```bash
python3 hf-space/app.py
# Runs on http://localhost:5001
# Set REACT_APP_API_URL=http://localhost:5001 in .env to use local backend
```

---

## Deploy

### Frontend → Vercel
```bash
# Option A: CLI
npx vercel --prod

# Option B: GitHub → vercel.com → Import repo
# Framework: Create React App (auto-detected)
```

Add environment variable in Vercel dashboard:
```
REACT_APP_API_URL = https://pritamkhergade-vibe-engine-api.hf.space
```

### Backend → HuggingFace Spaces
Push the `hf-space/` folder contents to your HF Space repo. The Space builds automatically from `Dockerfile`.

```bash
# First time
git clone https://huggingface.co/spaces/pritamkhergade/vibe-engine-api
cp hf-space/* vibe-engine-api/
cd vibe-engine-api && git add . && git commit -m "update" && git push

# Updates
cp hf-space/app.py vibe-engine-api/
cd vibe-engine-api && git add app.py && git commit -m "update app" && git push
```

---

## Tech Stack

| Layer | Tech |
|-------|------|
| Frontend | React 18 (CRA), single-file SPA, custom CSS |
| Hosting | Vercel |
| Backend | Flask + yt-dlp, in-memory TTL cache, 210-entry pre-warm |
| Backend hosting | HuggingFace Spaces (Docker, Python 3.11) |
| Audio | HTML5 Audio API — streams first 1MB from YouTube via backend |
| Data | All artist/mood data is local JS — no database |

---

## Architecture

```
Browser (React)
  │
  ├── DISCOVERY_DATA (local JS) ── 210 artists × 4 moods
  │
  └── GET /api/preview?artist=&track=
        │
        HF Space (Flask + yt-dlp)
          ├── Check in-memory cache (4h TTL)
          ├── yt-dlp → YouTube search → stream URL
          └── Proxy first 1MB → browser Audio element
```

---

## n8n Review Analysis Workflow

1. Go to [n8n.io](https://n8n.io) → sign up → **Import workflow** → paste `n8n-workflow.json`
2. Add Anthropic API key: Settings → Credentials → New → Anthropic
3. Click **Test workflow**

**Pipeline:** Reddit r/spotify · App Store · Play Store → Merge → Claude AI → Themes + Findings

---

## Submission Checklist

- [ ] Deploy frontend to Vercel → get live URL
- [ ] Confirm HF Space backend is live → `/health` returns `{"status":"ok"}`
- [ ] Run n8n workflow once, screenshot output
- [ ] Export deck as PDF (max 40MB)
- [ ] Add Vercel URL + n8n link to slide deck
- [ ] Submit before July 6, 3:59 PM IST

---

*Built for NextLeap PM Fellowship · Graduation Project · June 2026*

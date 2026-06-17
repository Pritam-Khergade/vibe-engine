# Vibe Engine — Spotify Discovery MVP
### NextLeap PM Fellowship · Graduation Project

> An AI-powered music discovery engine that breaks the comfort-zone loop using mood-aware, explainable recommendations.

---

## Live Demo
🔗 **Deploy to Vercel** → Follow steps below, takes ~5 minutes

---

## What's Inside

| Feature | Description |
|---------|-------------|
| **Vibe Check-In** | 2-tap mood selector — Energized / Focused / Chill / Emotional |
| **Discovery Card** | AI-explained artist recommendations with mood-match % |
| **Curiosity Nudge** | Triggers after 3 skips — suggests adjacent genre shift |
| **Taste Evolution Map** | Visual of how your music taste changed over 6 months |
| **Review Workflow** | Animated demo of the AI review analysis pipeline |

---

## Deploy to Vercel (5 min)

### Method 1: GitHub + Vercel (Recommended)

1. **Create GitHub repo**
   ```bash
   git init
   git add .
   git commit -m "Vibe Engine MVP - PM Fellowship"
   git branch -M main
   git remote add origin https://github.com/YOUR_USERNAME/vibe-engine.git
   git push -u origin main
   ```

2. **Connect to Vercel**
   - Go to [vercel.com](https://vercel.com)
   - Click "Add New Project"
   - Import your GitHub repo
   - Framework: **Create React App** (auto-detected)
   - Click **Deploy**
   - Your live URL: `https://vibe-engine.vercel.app`

### Method 2: Vercel CLI

```bash
npm install -g vercel
vercel login
vercel --prod
```

---

## Local Development

```bash
npm install
npm start
# Opens at http://localhost:3000
```

---

## n8n Review Analysis Workflow

### Setup (10 min)

1. Go to [n8n.io](https://n8n.io) → Sign up for free cloud account
2. Click **"Import workflow"** → paste contents of `n8n-workflow.json`
3. Add credentials:
   - **Anthropic API key** → [console.anthropic.com](https://console.anthropic.com)
   - Add in n8n: Settings → Credentials → New → Anthropic
4. Click **"Test workflow"** to run
5. Copy the workflow's **shareable link** → paste into your deck

### What it does
```
Reddit r/spotify (25 posts)  ─┐
App Store reviews             ├──→ Merge → Extract Text → Claude AI → Parse → Report
Reddit discovery pain (25)   ─┘
```

**Claude AI prompt:** Extracts top themes, discovery barriers, unmet needs, sentiment breakdown, and feature recommendations from raw review text.

---

## Submission Checklist

- [ ] Deploy to Vercel → get live URL
- [ ] Set up n8n workflow → get shareable link  
- [ ] Export PPT as PDF (max 40MB)
- [ ] Add both links to slide deck
- [ ] Run n8n workflow once, screenshot output
- [ ] Submit before July 6, 3:59 PM IST

---

## Tech Stack

- React 18 (no external UI library — custom CSS)
- Deployed on Vercel
- Review workflow: n8n cloud + Claude API
- No backend required for MVP

---

*Built for NextLeap PM Fellowship · Graduation Project 2026*

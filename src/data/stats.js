// ─── Primary survey data (n=20, June 2026) ────────────────────────────────────
export const STATS = {
  // Survey metadata
  sampleSize:            20,
  surveyDate:            'June 2026',
  totalReviews:          1066,
  userInterviews:        17,

  // Core stats (n=20 primary survey)
  multipleTimesDaily:    70,
  replaySameSongs:       95,
  feelStuck:             80,
  dontKnowWhy:           75,
  wantExplanation:       80,
  recommendationScore:   3.15,
  effortBarrier:         50,
  moodFearBarrier:       45,
  dontKnowWhereToStart:  45,
  recsFeelIrrelevant:    40,
};

// Derived strings ─────────────────────────────────────────────────────────────
export const SOURCE_LINE  = `${STATS.totalReviews.toLocaleString()} Spotify reviews + ${STATS.userInterviews} user interviews · ${STATS.surveyDate}`;
export const SURVEY_LABEL = `Primary Survey · n=${STATS.sampleSize} · ${STATS.surveyDate}`;

// ─── Verbatim user quotes ─────────────────────────────────────────────────────
export const QUOTES = [
  {
    text:   'Like ecommerce websites — if you liked this you might also like this',
    source: 'Survey respondent, June 2026',
    theme:  'explainability',
  },
  {
    text:   'A section like YouTube Music Shorts that helps discover new songs through snippets',
    source: 'Survey respondent, June 2026',
    theme:  'discovery',
  },
  {
    text:   'Understand the mood of the singer — if he\'s working out, recommendations should match',
    source: 'Survey respondent, June 2026',
    theme:  'mood-context',
  },
  {
    text:   'Same songs keep repeating — Spotify doesn\'t know I want something new',
    source: 'Survey respondent, June 2026',
    theme:  'loop',
  },
  {
    text:   'We have same name of songs by different singers — finding the right one is tough',
    source: 'Survey respondent, June 2026',
    theme:  'search',
  },
  {
    text:   'Concert integration with artist where specific artist is having voice chat with friends in real time',
    source: 'Survey respondent, June 2026',
    theme:  'social',
  },
];

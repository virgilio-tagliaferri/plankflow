# PlankFlow – Backlog & Ideas

This file collects future ideas, improvements, and known issues.
Nothing here is committed to implementation yet.

---

## High-value feature ideas

### Workout presets

- Predefined routines (e.g. Classic Plank, Beginner Flow, Core Focus)
- Same engine, different exercise lists

### Progress tracking (local only)

- Total workouts completed
- Total time spent planking
- Last workout date
- Store locally (no accounts)

### Resume last workout

- If the app reloads, offer:
  - Resume last session
  - Start fresh

### Structured audio cues

- Spoken countdown (3–2–1)
- “Rest”
- “Next exercise”
- Optional toggle in settings

---

## Medium-value enhancements

### Custom routines

- Enable / disable exercises
- Reorder exercises
- Save one custom routine

### Improved layouts

- Better tablet / landscape layout
- Side-by-side image and timer

### Visual themes

- Extra-dim “night mode”
- Accessibility-focused contrast mode

---

## UX / polish ideas

- JS-based sticky header for exercise guide (more reliable on Android)
- Progress ring behavior refinements (direction, color per phase)
- Subtle micro-animations during rest vs exercise

---

## Known issues / things to verify

### ⚠️ Vibration not working on Android (Vercel deployment)

- Vibration works inconsistently or not at all when app is served from Vercel
- Likely causes:
  - Browser permissions
  - HTTPS + user gesture requirements
  - Android Chrome restrictions
- Needs verification on:
  - Local dev server
  - Deployed version
  - Different Android versions / browsers

---

## Explicitly out of scope (for now)

- Accounts / login
- Social features
- Calories estimation
- Analytics dashboards
- Cloud sync

Focus remains on a distraction-free, guided workout experience.

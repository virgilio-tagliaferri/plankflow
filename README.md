# PlankFlow

PlankFlow is a focused, timed plank workout app designed to keep you engaged
without distractions.

It guides you through a sequence of plank variations with clear timing,
visual cues, and optional exercise guidance.

## Features

- Structured plank routine with 10 exercises
- Difficulty levels (Beginner → Expert)
- Preparation countdown before each exercise
- Visual progress ring and progress dots
- Pause / resume with visual feedback
- Optional exercise guide with form tips
- Mobile-first design
- Timed plank workouts with countdown, exercise, and rest phases
- Automatic halfway switch for mirrored exercises
- 5-second pre-switch visual cue with progress fill
- Smooth mirrored image transition at halfway
- Haptic feedback on key moments (where supported)

## Switch cue behavior

- The switch cue appears 5 seconds before the halfway point
- A visual fill indicates remaining time before switching position
- At halfway: the image mirrors smoothly, haptic feedback is triggered, the cue disappears automatically, The cue only appears for exercises that support mirroring

## Notes / limitations

- Vibration support depends on browser and PWA context
- Left/right exercise segments are recorded internally but not currently shown in the summary

## Running locally

```bash
npm install
npm run dev
```

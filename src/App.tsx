import { useEffect, useState } from 'react';
import { WORKOUT } from './data/workout';

const DEBUG = import.meta.env.DEV;

type Phase =
  | 'idle'
  | 'config'
  | 'countdown'
  | 'exercise'
  | 'break'
  | 'finished';

type WorkoutConfig = {
  exerciseDuration: number;
  shortBreak: number;
  longBreak: number;
};
type Level = 0 | 1 | 2 | 3 | 4;

const LEVEL_LABELS = [
  'Beginner',
  'Novice',
  'Intermediate',
  'Advanced',
  'Expert',
] as const;

// Harder (right) => longer work, shorter rest
const EXERCISE_BY_LEVEL = [35, 40, 45, 60, 70] as const;
const SHORT_BREAK_BY_LEVEL = [20, 18, 15, 12, 10] as const;
const LONG_BREAK_BY_LEVEL = [70, 65, 60, 50, 45] as const;

function configFromLevel(level: Level) {
  return {
    exerciseDuration: EXERCISE_BY_LEVEL[level],
    shortBreak: SHORT_BREAK_BY_LEVEL[level],
    longBreak: LONG_BREAK_BY_LEVEL[level],
  };
}

export default function App() {
  const TIME_SCALE = DEBUG ? 1 : 1;

  // ---------- STATE ----------
  const [phase, setPhase] = useState<Phase>('idle');
  const [isPaused, setIsPaused] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState(5);
  const [confirmAbort, setConfirmAbort] = useState(false);
  const [level, setLevel] = useState<Level>(2); // 2 = Intermediate default
  const [config, setConfig] = useState<WorkoutConfig>(() => configFromLevel(1));
  const [showGuide, setShowGuide] = useState(false);
  // ---------- DERIVED ----------
  const currentExercise = WORKOUT[currentIndex];

  const displayExercise =
    phase === 'countdown'
      ? WORKOUT[0]
      : phase === 'break'
      ? WORKOUT[currentIndex + 1]
      : currentExercise;

  const isPhaseTransition =
    timeLeft ===
    Math.ceil(
      (phase === 'exercise'
        ? config.exerciseDuration
        : phase === 'break'
        ? getBreakDuration(currentIndex)
        : 10) * TIME_SCALE
    );

  const isPastHalfway =
    phase === 'exercise' &&
    timeLeft <= Math.ceil((config.exerciseDuration * TIME_SCALE) / 2);

  const isEnding = phase === 'exercise' && timeLeft > 0 && timeLeft <= 5;
  const radius = 60;
  const stroke = 4;
  const normalizedRadius = radius - stroke * 2;
  const circumference = normalizedRadius * 2 * Math.PI;

  const totalExerciseTime = Math.ceil(config.exerciseDuration * TIME_SCALE);

  const totalTime =
    phase === 'exercise'
      ? totalExerciseTime
      : phase === 'break'
      ? Math.ceil(getBreakDuration(currentIndex) * TIME_SCALE)
      : Math.ceil(10 * TIME_SCALE);

  const progress =
    phase === 'countdown' || phase === 'exercise' || phase === 'break'
      ? Math.min(1, Math.max(0, 1 - timeLeft / totalTime))
      : 1;

  useEffect(() => {
    setConfig(configFromLevel(level));
  }, [level]);

  useEffect(() => {
    if (!isEnding || isPaused) return;

    vibrate(40);
  }, [timeLeft, isEnding, isPaused]);

  // ---------- HELPERS ----------
  function getBreakDuration(index: number) {
    return index === 4 ? config.longBreak : config.shortBreak;
  }
  // ---------- SOUNDS & VIBRATION ----------
  const [prevPhase, setPrevPhase] = useState<Phase | null>(null);

  function playSound(name: 'play' | 'pause' | 'success') {
    const audio = new Audio(`/sounds/${name}.mp3`);
    audio.volume = 0.6;
    audio.play().catch(() => {});
  }
  function vibrate(pattern: number | number[]) {
    if ('vibrate' in navigator) {
      navigator.vibrate(pattern);
    }
  }

  useEffect(() => {
    if (prevPhase === null) {
      setPrevPhase(phase);
      return;
    }

    // Countdown → Exercise
    if (prevPhase === 'countdown' && phase === 'exercise') {
      playSound('play');
      vibrate(100);
    }

    // Workout finished
    if (phase === 'finished') {
      playSound('success');
      vibrate([100, 50, 100]);
    }

    setPrevPhase(phase);
  }, [phase]);

  // ---------- TIMER ----------
  useEffect(() => {
    if (
      phase === 'idle' ||
      phase === 'config' ||
      phase === 'finished' ||
      isPaused
    ) {
      return;
    }

    const interval = setInterval(() => {
      setTimeLeft((prev) => Math.max(prev - 1, 0));
    }, 1000);

    return () => clearInterval(interval);
  }, [phase, isPaused]);

  useEffect(() => {
    if (timeLeft !== 0 || isPaused) return;

    // Countdown → Exercise
    if (phase === 'countdown') {
      setPhase('exercise');
      setTimeLeft(Math.ceil(config.exerciseDuration * TIME_SCALE));
      return;
    }

    // Exercise → Break or Finish
    if (phase === 'exercise') {
      if (currentIndex === WORKOUT.length - 1) {
        setPhase('finished');
        return;
      }

      setPhase('break');
      setTimeLeft(Math.ceil(getBreakDuration(currentIndex) * TIME_SCALE));
      return;
    }

    // Break → Next Exercise
    if (phase === 'break') {
      setCurrentIndex((i) => i + 1);
      setPhase('exercise');
      setTimeLeft(Math.ceil(config.exerciseDuration * TIME_SCALE));
    }
  }, [timeLeft, phase, currentIndex, isPaused, config.exerciseDuration]);

  // ---------- ACTIONS ----------
  function goToConfig() {
    setPhase('config');
  }

  function beginWorkout() {
    setCurrentIndex(0);
    setTimeLeft(10 * TIME_SCALE);
    setIsPaused(false);
    setConfirmAbort(false);
    setPhase('countdown');
  }

  function togglePause() {
    setIsPaused((p) => {
      const next = !p;
      playSound(next ? 'pause' : 'play');
      vibrate(next ? 50 : 30);
      return next;
    });
    setConfirmAbort(false);
  }

  function next() {
    if (currentIndex < WORKOUT.length - 1) {
      setCurrentIndex((i) => i + 1);
      setPhase('exercise');
      setTimeLeft(Math.ceil(config.exerciseDuration * TIME_SCALE));
      setConfirmAbort(false);
    }
  }

  function previous() {
    if (currentIndex > 0) {
      setCurrentIndex((i) => i - 1);
      setPhase('exercise');
      setTimeLeft(Math.ceil(config.exerciseDuration * TIME_SCALE));
      setConfirmAbort(false);
    }
  }

  function abortWorkout() {
    if (!confirmAbort) {
      setConfirmAbort(true);
      return;
    }

    setPhase('idle');
    setCurrentIndex(0);
    setTimeLeft(5);
    setIsPaused(false);
    setConfirmAbort(false);
  }
  function cancelAbortConfirm() {
    setConfirmAbort(false);
  }

  // ---------- RENDER ----------
  return (
    <main
      className={`workout-container ${
        phase === 'exercise'
          ? 'workout-active'
          : phase === 'break' || phase === 'countdown'
          ? 'workout-inactive'
          : ''
      }`}
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',

        textAlign: 'center',
      }}
    >
      {/* ---------- DEBUG FLAG ---------- */}
      {DEBUG && (
        <div
          style={{
            opacity: 0.1,
            fontSize: '1rem',
            textTransform: 'uppercase',
            position: 'absolute',
            bottom: 0,
            right: 0,
            padding: '0.25rem',
            background: 'white',
            color: 'black',
          }}
        >
          Debug mode (×{1 / TIME_SCALE})
        </div>
      )}
      {/* ---------- IDLE ---------- */}
      {phase === 'idle' && (
        <>
          <h1 style={{ marginTop: '0', marginBottom: '0' }}>
            <span className='material-symbols-rounded logo'>hourglass</span>
            <br />
            PlankFlow
          </h1>

          <p
            style={{
              maxWidth: 320,
              marginTop: 12,
              marginBottom: 32,
            }}
          >
            Stay focused through a full plank routine, timed and structured for
            you.
          </p>
          <button className='start-button' onClick={goToConfig}>
            Set up workout
          </button>
        </>
      )}

      {/* ---------- CONFIG ---------- */}
      {phase === 'config' && (
        <div style={{ maxWidth: 400, width: '90%' }}>
          <h2 style={{ margin: 0 }}>Workout Settings</h2>

          <p style={{ letterSpacing: '-0.025em' }}>
            Choose a difficulty level and get ready to move.
            <br />
            You’ll rest briefly between exercises, with a longer break halfway
            through the workout.
          </p>

          <div style={{ marginBottom: 32, marginTop: 32 }}>
            <label style={{ display: 'block', marginBottom: 8 }}>
              Difficulty: <strong>{LEVEL_LABELS[level]}</strong>
            </label>

            <input
              style={{ width: '66%', maxWidth: 320 }}
              type='range'
              min={0}
              max={4}
              step={1}
              value={level}
              onChange={(e) => setLevel(Number(e.target.value) as Level)}
            />

            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                fontSize: 12,
                opacity: 0.6,
                marginTop: 4,
                padding: '0 8px',
              }}
            ></div>
            <p style={{ margin: '0.5rem' }}>
              Plank hold: <strong>{config.exerciseDuration}s</strong>
            </p>
            <p style={{ margin: '0.5rem' }}>
              Short rest: <strong>{config.shortBreak}s</strong>
            </p>
            <p style={{ margin: '0.5rem' }}>
              Long rest: <strong>{config.longBreak}s</strong>
            </p>
          </div>
          <div></div>
          <div>
            <button
              className='start-button'
              onClick={beginWorkout}
              style={{ marginTop: 0, marginBottom: 16 }}
            >
              Begin workout
            </button>
          </div>

          <button
            type='button'
            onClick={() => setPhase('idle')}
            style={{
              marginRight: 16,
              fontSize: '.85rem',
            }}
          >
            <span
              className='material-symbols-rounded'
              style={{ marginRight: 6, fontSize: '1.5em' }}
            >
              arrow_back
            </span>
            Back
          </button>
          <button
            type='button'
            onClick={() => {
              console.log('Guide clicked');
              setShowGuide(true);
            }}
            style={{ fontSize: '.85rem' }}
          >
            <span
              className='material-symbols-rounded'
              style={{ marginRight: 6, fontSize: '1.5em' }}
            >
              book_5
            </span>
            Guide
          </button>
        </div>
      )}

      {/* ---------- WORKOUT ---------- */}
      {(phase === 'countdown' || phase === 'exercise' || phase === 'break') && (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            flex: 1,
            width: '100%',
            maxWidth: 400,
          }}
        >
          <div className='phase-header'>
            {/* COUNTDOWN */}
            <div
              className={`phase-content ${
                phase === 'countdown' ? 'active' : ''
              }`}
            >
              <h1 style={{ margin: '0' }}>Get into position</h1>
              <h3 style={{ marginTop: '0' }}>{currentExercise.name}</h3>
            </div>
            {/* EXERCISE */}
            <div
              className={`phase-content ${
                phase === 'exercise' ? 'active' : ''
              }`}
            >
              <h1 style={{ margin: '0' }}>Hold steady</h1>
              <h3 style={{ marginTop: '0' }}>{currentExercise.name}</h3>
            </div>
            {/* BREAK */}
            <div
              className={`phase-content ${phase === 'break' ? 'active' : ''}`}
            >
              <h1 style={{ margin: '0' }}>Rest</h1>
              <h3 style={{ marginTop: '0' }}>
                Up next: {WORKOUT[currentIndex + 1]?.name}
              </h3>
            </div>
          </div>

          <div className='progress-dots' aria-hidden='true'>
            {WORKOUT.map((_, i) => (
              <span
                key={i}
                className={
                  i === currentIndex
                    ? 'dot active'
                    : i < currentIndex
                    ? 'dot done'
                    : 'dot'
                }
              />
            ))}
          </div>

          {displayExercise?.image && (
            <div className='exercise-image-wrapper'>
              <img
                src={displayExercise.image}
                alt={displayExercise.name}
                className={`exercise-image ${
                  displayExercise.canMirror && isPastHalfway ? 'mirrored' : ''
                }`}
              />
            </div>
          )}

          <p
            className={`timer ${isPaused ? 'paused' : ''} ${
              isEnding ? 'ending' : ''
            }`}
            style={{ fontSize: 48, margin: '16px 0' }}
            aria-live='polite'
          >
            {timeLeft}s
          </p>

          <div className='controlPanel'>
            <button
              onClick={previous}
              disabled={currentIndex === 0}
              style={{ marginRight: 6 }}
            >
              <span
                className='material-symbols-rounded'
                style={{ marginRight: 6 }}
              >
                skip_previous
              </span>
              Back
            </button>

            <div className='pause-ring'>
              {(phase === 'countdown' ||
                phase === 'exercise' ||
                phase === 'break') && (
                <svg
                  width={radius * 2}
                  height={radius * 2}
                  viewBox={`0 0 ${radius * 2} ${radius * 2}`}
                  className={`progress-ring ${
                    phase === 'break' || phase === 'countdown' ? 'is-rest' : ''
                  } ${isPaused ? 'is-paused' : ''} ${
                    isPhaseTransition ? 'no-transition' : ''
                  }
      `}
                >
                  <circle
                    fill='transparent'
                    strokeWidth={stroke}
                    strokeDasharray={`${circumference} ${circumference}`}
                    strokeDashoffset={circumference * (1 - progress)}
                    r={normalizedRadius}
                    cx={radius}
                    cy={radius}
                  />
                </svg>
              )}

              <button
                onClick={togglePause}
                className={`pause-button ${isPaused ? 'is-resume' : ''}`}
                aria-label={isPaused ? 'Resume workout' : 'Pause workout'}
              >
                <span className='material-symbols-rounded' aria-hidden='true'>
                  {isPaused ? 'play_arrow' : 'pause'}
                </span>
              </button>
            </div>

            <button
              onClick={next}
              disabled={currentIndex === WORKOUT.length - 1}
              style={{ marginLeft: 6 }}
            >
              Skip{' '}
              <span
                className='material-symbols-rounded'
                style={{ marginLeft: 6 }}
              >
                skip_next
              </span>
            </button>
          </div>
          {/* END BUTTON + RENDER CANCEL BACKDROP */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              abortWorkout();
            }}
            className='abort-button'
            style={{ marginTop: 15 }}
          >
            {confirmAbort ? 'Tap again to confirm' : 'End workout'}
          </button>
          {confirmAbort && (
            <button
              type='button'
              className='abort-backdrop'
              onClick={cancelAbortConfirm}
              aria-label='Cancel end workout confirmation'
            />
          )}
        </div>
      )}

      {/* ---------- FINISHED ---------- */}
      {phase === 'finished' && (
        <>
          <h1>
            Workout complete!
            <br />{' '}
            <span
              className='material-symbols-rounded'
              style={{ fontSize: '1.5em' }}
            >
              trophy
            </span>
          </h1>
          <button className='start-button' onClick={goToConfig}>
            Restart
          </button>
        </>
      )}

      {showGuide && <ExerciseGuide onClose={() => setShowGuide(false)} />}
    </main>
  );
}

type ExerciseGuideProps = {
  onClose: () => void;
};

function ExerciseGuide({ onClose }: ExerciseGuideProps) {
  return (
    <div className='guide-backdrop' onClick={onClose}>
      <div
        className='guide-modal'
        onClick={(e) => e.stopPropagation()}
        role='dialog'
        aria-modal='true'
      >
        <header className='guide-header'>
          <h2>Exercise guide</h2>
          <button
            type='button'
            className='text-button'
            onClick={onClose}
            aria-label='Close exercise guide'
          >
            <span className='material-symbols-rounded'>close</span>
          </button>
        </header>

        <div className='guide-content'>
          <p className='guide-intro'>
            Each exercise focuses on form and control. Follow the cues below to
            maintain a safe, effective position.
          </p>
          {WORKOUT.map((ex) => (
            <section key={ex.name} className='guide-exercise'>
              <div className='guide-image-wrapper'>
                <img src={ex.image} alt={ex.name} />
              </div>
              <h3>{ex.name}</h3>
              <ul>
                {(ex.description ?? []).map((line, i) => (
                  <li key={i}>{line}</li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      </div>
    </div>
  );
}

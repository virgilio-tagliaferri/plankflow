import { useEffect, useState } from 'react';
import { WORKOUT } from './data/workout';
import { ExerciseGuide } from './components/ExerciseGuide';
import { computeSessionSummary } from './services/sessionSummary';
import { SessionSummary } from './components/SessionSummary';
import { usePreferences } from './hooks/usePreferences';
import { useSessionRecorder } from './hooks/useSessionRecorder';
import { useRef } from 'react';
import { playSound, vibrate } from './services/feedback';
import {
  type Level,
  configFromLevel,
  type WorkoutConfig,
} from './domain/workoutConfig';
import { IdleScreen } from './components/screens/IdleScreen';
import { ConfigScreen } from './components/screens/ConfigScreen';
import { WorkoutScreen } from './components/screens/WorkoutScreen';

const DEBUG = import.meta.env.DEV;

type Phase =
  | 'idle'
  | 'config'
  | 'countdown'
  | 'exercise'
  | 'break'
  | 'finished';

export default function App() {
  const TIME_SCALE = DEBUG ? 1 : 1;

  // ---------- STATE ----------
  const [phase, setPhase] = useState<Phase>('idle');
  const [isPaused, setIsPaused] = useState(false);

  const [showSwitchCue, setShowSwitchCue] = useState(false);
  const switchedIndexRef = useRef<number | null>(null);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState(5);
  const [confirmAbort, setConfirmAbort] = useState(false);
  const [level, setLevel] = useState<Level>(2); // 2 = Intermediate default
  const [config, setConfig] = useState<WorkoutConfig>(() => configFromLevel(1));
  const [showGuide, setShowGuide] = useState(false);
  const { preferences } = usePreferences();
  const recorder = useSessionRecorder();
  const [summary, setSummary] = useState<ReturnType<
    typeof computeSessionSummary
  > | null>(null);

  // ---------- DERIVED ----------
  const currentExercise = WORKOUT[currentIndex];
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

  const SWITCH_WARNING_SECONDS = 5;

  const totalExerciseTime = Math.ceil(config.exerciseDuration * TIME_SCALE);
  const halfwayTime = Math.ceil(totalExerciseTime / 2);

  const isSwitchImminent =
    phase === 'exercise' &&
    currentExercise.canMirror &&
    timeLeft <= halfwayTime + SWITCH_WARNING_SECONDS &&
    timeLeft > halfwayTime;

  const isEnding = phase === 'exercise' && timeLeft > 0 && timeLeft <= 5;
  const radius = 60;
  const stroke = 4;
  const normalizedRadius = radius - stroke * 2;
  const circumference = normalizedRadius * 2 * Math.PI;

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

  const [isWorkoutMenuOpen, setIsWorkoutMenuOpen] = useState(false);

  const [workoutMenuView, setWorkoutMenuView] = useState<'menu' | 'guide'>(
    'menu'
  );

  // ------- Pause workout when menu opens ------- */
  useEffect(() => {
    if (isWorkoutMenuOpen) {
      setIsPaused(true);
    }
  }, [isWorkoutMenuOpen]);
  // ------- Open workout menu ------- */
  useEffect(() => {
    if (isWorkoutMenuOpen) {
      setWorkoutMenuView('menu');
    }
  }, [isWorkoutMenuOpen]);

  useEffect(() => {
    setConfig(configFromLevel(level));
  }, [level]);

  useEffect(() => {
    if (!isEnding || isPaused) return;

    vibrate(40);
  }, [timeLeft, isEnding, isPaused]);

  useEffect(() => {
    switchedIndexRef.current = null;
  }, [currentIndex, phase]);

  // ---------- HELPERS ----------
  function getBreakDuration(index: number) {
    return index === 4 ? config.longBreak : config.shortBreak;
  }

  const [prevPhase, setPrevPhase] = useState<Phase | null>(null);

  useEffect(() => {
    if (prevPhase === null) {
      setPrevPhase(phase);
      return;
    }

    // Countdown - Exercise
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

    // Countdown - Exercise
    if (phase === 'countdown') {
      switchedIndexRef.current = null;
      setPhase('exercise');
      setTimeLeft(Math.ceil(config.exerciseDuration * TIME_SCALE));
      recorder.startSegment(currentExercise.canMirror ? 'left' : 'front');
      return;
    }

    // Exercise - Break or Finish
    if (phase === 'exercise') {
      recorder.endSegment();

      if (currentIndex === WORKOUT.length - 1) {
        setPhase('finished');
        return;
      }

      setPhase('break');
      setTimeLeft(Math.ceil(getBreakDuration(currentIndex) * TIME_SCALE));
      return;
    }

    // Break - Next Exercise
    if (phase === 'break') {
      setCurrentIndex((i) => i + 1);
      setPhase('exercise');
      setTimeLeft(Math.ceil(config.exerciseDuration * TIME_SCALE));
      recorder.startSegment(currentExercise.canMirror ? 'left' : 'front');
    }
  }, [timeLeft, phase, currentIndex, isPaused, config.exerciseDuration]);

  // HALF-WAY SWITCH
  useEffect(() => {
    if (phase !== 'exercise') return;
    if (!currentExercise.canMirror) return;
    if (!isPastHalfway) return;

    // guard: only once per exercise
    if (switchedIndexRef.current === currentIndex) return;

    vibrate([150, 100, 150]);
    recorder.endSegment();
    recorder.startSegment('right');

    switchedIndexRef.current = currentIndex;
  }, [phase, isPastHalfway, currentIndex, currentExercise]);

  useEffect(() => {
    setShowSwitchCue(!!isSwitchImminent);
  }, [isSwitchImminent]);

  useEffect(() => {
    if (phase !== 'finished') return;

    const session = recorder.endSession();

    if (!session) {
      console.warn('No session recorded');
      return;
    }

    const result = computeSessionSummary(session, preferences);
    setSummary(result);
  }, [phase]);

  // ---------- ACTIONS ----------
  function goToConfig() {
    setPhase('config');
  }

  function beginWorkout() {
    recorder.startSession();
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
      {/* ---------- MENU OVERLAY ---------- */}
      {isWorkoutMenuOpen && (
        <div className='workout-menu-overlay'>
          {workoutMenuView === 'menu' && (
            <ul className='workout-menu-list'>
              <li>
                <button
                  type='button'
                  onClick={() => setWorkoutMenuView('guide')}
                >
                  Exercise guide
                </button>
              </li>
              <li>
                <button type='button' disabled>
                  Sound & vibration
                </button>
              </li>
              <li>
                <button type='button' disabled>
                  Measurements
                </button>
              </li>
              <li>
                <button type='button' disabled>
                  Support
                </button>
              </li>
            </ul>
          )}
          <div className='workout-menu-content'>
            <button
              type='button'
              className='text-button close'
              onClick={() => setIsWorkoutMenuOpen(false)}
              aria-label='Close menu'
            >
              <span className='material-symbols-rounded'>close</span>
            </button>

            {workoutMenuView === 'guide' && (
              <>
                <button
                  type='button'
                  className='text-button back'
                  onClick={() => setWorkoutMenuView('menu')}
                >
                  <span className='material-symbols-rounded'>arrow_back</span>
                </button>

                <div className='workout-menu-item'>
                  <div className='workout-menu-image-wrapper'>
                    <img
                      src={currentExercise.image}
                      alt={currentExercise.name}
                    />
                  </div>
                  <h3>{currentExercise.name}</h3>
                  <ul>
                    {(currentExercise.description ?? []).map((line, i) => (
                      <li key={i}>{line}</li>
                    ))}
                  </ul>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* ---------- IDLE ---------- */}
      {phase === 'idle' && <IdleScreen onStart={goToConfig} />}

      {/* ---------- CONFIG ---------- */}
      {phase === 'config' && (
        <ConfigScreen
          level={level}
          config={config}
          onLevelChange={setLevel}
          onBegin={beginWorkout}
          onBack={() => setPhase('idle')}
          onGuide={() => setShowGuide(true)}
        />
      )}

      {/* ---------- WORKOUT ---------- */}
      {(phase === 'countdown' || phase === 'exercise' || phase === 'break') && (
        <WorkoutScreen
          phase={phase}
          currentIndex={currentIndex}
          timeLeft={timeLeft}
          isPaused={isPaused}
          progress={progress}
          isEnding={isEnding}
          isPastHalfway={isPastHalfway}
          isPhaseTransition={isPhaseTransition}
          setIsWorkoutMenuOpen={setIsWorkoutMenuOpen}
          radius={radius}
          stroke={stroke}
          circumference={circumference}
          normalizedRadius={normalizedRadius}
          onPrevious={previous}
          onTogglePause={togglePause}
          onNext={next}
          onAbort={abortWorkout}
          confirmAbort={confirmAbort}
          onCancelAbort={cancelAbortConfirm}
          showSwitchCue={showSwitchCue}
        />
      )}

      {/* ---------- FINISHED ---------- */}
      {phase === 'finished' && summary && (
        <SessionSummary {...summary} onRestart={goToConfig} />
      )}

      {showGuide && <ExerciseGuide onClose={() => setShowGuide(false)} />}
    </main>
  );
}

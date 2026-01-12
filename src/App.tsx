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
import { SettingsMenu } from './components/SettingsMenu';

const DEBUG = import.meta.env.DEV;

type Phase =
  | 'idle'
  | 'config'
  | 'countdown'
  | 'exercise'
  | 'break'
  | 'finished';

export default function App() {
  const TIME_SCALE = DEBUG ? 0.1 : 1;

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
  type SessionSummaryWithCalories = ReturnType<typeof computeSessionSummary> & {
    calories?: number;
  };
  const [summary, setSummary] = useState<SessionSummaryWithCalories | null>(
    null
  );

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
  const [isSettingsMenuOpen, setIsSettingsMenuOpen] = useState(false);

  // PREFERENCES + LOCAL STORAGE
  const [theme, setTheme] = useState<'light' | 'dark'>(() =>
    load('theme', 'dark')
  );
  const [fontStyle, setFontStyle] = useState<'default' | 'compact'>(() =>
    load('fontStyle', 'default')
  );
  const [soundEnabled, setSoundEnabled] = useState<boolean>(() =>
    load('soundEnabled', true)
  );
  const [vibrationEnabled, setVibrationEnabled] = useState<boolean>(() =>
    load('vibrationEnabled', true)
  );
  const [unitSystem, setUnitSystem] = useState<'metric' | 'imperial'>(() =>
    load('unitSystem', 'metric')
  );
  const [weightKg, setWeightKg] = useState<number | null>(() => {
    const v = load<number | null>('weightKg', null);
    return typeof v === 'number' && v > 0 ? v : null;
  });
  useEffect(() => save('theme', theme), [theme]);
  useEffect(() => save('fontStyle', fontStyle), [fontStyle]);
  useEffect(() => save('soundEnabled', soundEnabled), [soundEnabled]);
  useEffect(
    () => save('vibrationEnabled', vibrationEnabled),
    [vibrationEnabled]
  );
  useEffect(() => save('unitSystem', unitSystem), [unitSystem]);
  useEffect(() => save('weightKg', weightKg), [weightKg]);

  // ------- Pause workout when menu opens ------- */
  useEffect(() => {
    if (isSettingsMenuOpen) {
      setIsPaused(true);
    }
  }, [isSettingsMenuOpen]);
  // ------- Playback for sound/vibration settings turned ON  ------- */
  useEffect(() => {
    if (soundEnabled) {
      playSound('play');
    }
  }, [soundEnabled]);
  useEffect(() => {
    if (vibrationEnabled) {
      vibrate(30);
    }
  }, [vibrationEnabled]);

  useEffect(() => {
    setConfig(configFromLevel(level));
  }, [level]);

  useEffect(() => {
    if (!isEnding || isPaused) return;
    if (vibrationEnabled) {
      vibrate(40);
    }
  }, [timeLeft, isEnding, isPaused]);

  useEffect(() => {
    switchedIndexRef.current = null;
  }, [currentIndex, phase]);

  // ---------- HELPERS ----------
  function load<T>(key: string, fallback: T): T {
    try {
      const raw = localStorage.getItem(key);
      return raw != null ? (JSON.parse(raw) as T) : fallback;
    } catch {
      return fallback;
    }
  }
  function save<T>(key: string, value: T) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {}
  }

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
      if (soundEnabled) {
        playSound('play');
      }
      if (vibrationEnabled) {
        vibrate(100);
      }
    }

    // Workout finished
    if (phase === 'finished') {
      if (soundEnabled) {
        playSound('play');
      }
      if (vibrationEnabled) {
        vibrate([100, 50, 100]);
      }
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

    if (vibrationEnabled) {
      vibrate([150, 100, 150]);
    }
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

    const result = computeSessionSummary(session, preferences, level);
    setSummary(result);
  }, [phase, preferences, recorder]);

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
      if (soundEnabled) {
        playSound(next ? 'pause' : 'play');
      }
      if (vibrationEnabled) {
        vibrate(next ? 50 : 30);
      }
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
      className={`workout-container theme-${theme} font-${fontStyle} ${
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
      <SettingsMenu
        isOpen={isSettingsMenuOpen}
        onClose={() => setIsSettingsMenuOpen(false)}
        phase={phase}
        currentExercise={currentExercise}
        theme={theme}
        setTheme={setTheme}
        fontStyle={fontStyle}
        setFontStyle={setFontStyle}
        soundEnabled={soundEnabled}
        setSoundEnabled={setSoundEnabled}
        vibrationEnabled={vibrationEnabled}
        setVibrationEnabled={setVibrationEnabled}
        unitSystem={unitSystem}
        setUnitSystem={setUnitSystem}
        weightKg={weightKg}
        setWeightKg={setWeightKg}
      />

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
          onOpenSettings={() => setIsSettingsMenuOpen(true)}
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
          setIsSettingsMenuOpen={setIsSettingsMenuOpen}
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

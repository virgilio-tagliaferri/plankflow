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
  type SettingsView = 'menu' | 'guide' | 'sound' | 'appearance' | 'bodyMetrics';
  const [settingsMenuView, setSettingsMenuView] =
    useState<SettingsView>('menu');

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

  // ------- Open workout menu ------- */
  useEffect(() => {
    if (isSettingsMenuOpen) {
      setSettingsMenuView('menu');
    }
  }, [isSettingsMenuOpen]);

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
      {isSettingsMenuOpen && (
        <div className='settings-menu-overlay'>
          {settingsMenuView === 'menu' && (
            <ul className='settings-menu-list'>
              {/* NO GUIDE ON CONFIG PHASE - Redundant because of Guide button */}
              {phase !== 'config' && (
                <li>
                  <button
                    type='button'
                    onClick={() => setSettingsMenuView('guide')}
                  >
                    Exercise guide
                  </button>
                </li>
              )}
              <li>
                <button
                  type='button'
                  onClick={() => setSettingsMenuView('sound')}
                >
                  Sound & vibration
                </button>
              </li>
              <li>
                <button
                  type='button'
                  onClick={() => setSettingsMenuView('appearance')}
                >
                  Appearance
                </button>
              </li>
              <li>
                <button
                  type='button'
                  onClick={() => setSettingsMenuView('bodyMetrics')}
                >
                  Body metrics
                </button>
              </li>
              <li>
                <button type='button' disabled>
                  Support
                </button>
              </li>
              <li>
                <button type='button' disabled>
                  Share this app
                </button>
              </li>
            </ul>
          )}
          <div className='settings-menu-content'>
            <button
              type='button'
              className='text-button close'
              onClick={() => setIsSettingsMenuOpen(false)}
              aria-label='Close menu'
            >
              <span className='material-symbols-rounded'>close</span>
            </button>

            {settingsMenuView === 'guide' && (
              <>
                <button
                  type='button'
                  className='text-button back'
                  onClick={() => setSettingsMenuView('menu')}
                >
                  <span className='material-symbols-rounded'>arrow_back</span>
                </button>

                <div className='settings-menu-item'>
                  <div className='settings-menu-image-wrapper'>
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

            {settingsMenuView === 'sound' && (
              <>
                <button
                  type='button'
                  className='text-button back'
                  onClick={() => setSettingsMenuView('menu')}
                >
                  <span className='material-symbols-rounded'>arrow_back</span>
                </button>
                <div className='settings-menu-item'>
                  <h3>Sound & vibration</h3>

                  <div className='settings-toggle'>
                    <label>Enable sound cues</label>
                    <button
                      type='button'
                      className={`toggle ${soundEnabled ? 'on' : ''}`}
                      onClick={() => setSoundEnabled((v) => !v)}
                      aria-pressed={soundEnabled}
                    >
                      <span className='toggle-thumb' />
                    </button>
                  </div>

                  <div className='settings-toggle'>
                    <label>Enable vibration cues</label>
                    <button
                      type='button'
                      className={`toggle ${vibrationEnabled ? 'on' : ''}`}
                      onClick={() => setVibrationEnabled((v) => !v)}
                      aria-pressed={vibrationEnabled}
                    >
                      <span className='toggle-thumb' />
                    </button>
                  </div>
                </div>
              </>
            )}

            {settingsMenuView === 'appearance' && (
              <>
                <button
                  type='button'
                  className='text-button back'
                  onClick={() => setSettingsMenuView('menu')}
                >
                  <span className='material-symbols-rounded'>arrow_back</span>
                </button>

                <div className='settings-menu-item'>
                  <h3>Appearance</h3>

                  <div className='settings-toggle'>
                    <span
                      className={`theme-label ${
                        theme === 'dark' ? 'active' : ''
                      }`}
                    >
                      Dark theme
                    </span>

                    <button
                      type='button'
                      className={`theme-toggle ${theme}`}
                      onClick={() =>
                        setTheme(theme === 'dark' ? 'light' : 'dark')
                      }
                      aria-label='Toggle theme'
                    >
                      <span className='theme-toggle-thumb'>
                        <span className='material-symbols-rounded'>
                          {theme === 'dark' ? 'dark_mode' : 'light_mode'}
                        </span>
                      </span>
                    </button>

                    <span
                      className={`theme-label ${
                        theme === 'light' ? 'active' : ''
                      }`}
                    >
                      Light theme
                    </span>
                  </div>

                  <div className='settings-toggle'>
                    <span
                      className={`theme-label ${
                        fontStyle === 'default' ? 'active' : ''
                      }`}
                    >
                      Default
                    </span>

                    <button
                      type='button'
                      className={`theme-toggle ${fontStyle}`}
                      onClick={() =>
                        setFontStyle(
                          fontStyle === 'default' ? 'compact' : 'default'
                        )
                      }
                      aria-label='Toggle font style'
                    >
                      <span className='theme-toggle-thumb'>
                        <span
                          className={`font-option ${
                            fontStyle === 'compact' ? 'compact' : 'default'
                          }`}
                        >
                          Aa
                        </span>
                      </span>
                    </button>

                    <span
                      className={`theme-label ${
                        fontStyle === 'compact' ? 'active' : ''
                      }`}
                    >
                      Compact
                    </span>
                  </div>

                  {/* 
                  <h3>Font style</h3>
                  <ul
                    className='settings-segmented'
                    role='radiogroup'
                    aria-label='Font style'
                  >
                    <li>
                      <label className='font-option default'>
                        <input
                          type='radio'
                          name='font-style'
                          value='default'
                          checked={fontStyle === 'default'}
                          onChange={() => setFontStyle('default')}
                        />
                        <span className='radio-ui' />
                        <span className='label'>Default</span>
                        <span className='hint'>Josefin Sans</span>
                      </label>
                    </li>

                    <li>
                      <label className='font-option compact'>
                        <input
                          type='radio'
                          name='font-style'
                          value='compact'
                          checked={fontStyle === 'compact'}
                          onChange={() => setFontStyle('compact')}
                        />
                        <span className='radio-ui' />
                        <span className='label'>Compact</span>
                        <span className='hint'>Roboto Condensed</span>
                      </label>
                    </li>

                    <li>
                      <label className='font-option expressive'>
                        <input
                          type='radio'
                          name='font-style'
                          value='expressive'
                          checked={fontStyle === 'expressive'}
                          onChange={() => setFontStyle('expressive')}
                        />
                        <span className='radio-ui' />
                        <span className='label'>Expressive</span>
                        <span className='hint'>Roboto Slab</span>
                      </label>
                    </li>
                  </ul>
                  */}
                </div>
              </>
            )}

            {settingsMenuView === 'bodyMetrics' && (
              <div className='settings-menu-item'>
                <button
                  type='button'
                  className='text-button back'
                  onClick={() => setSettingsMenuView('menu')}
                >
                  <span className='material-symbols-rounded'>arrow_back</span>
                </button>

                <h3>Body metrics</h3>

                {/* Unit switch */}
                <div className='settings-toggle'>
                  <span
                    className={`theme-label ${
                      unitSystem === 'metric' ? 'active' : ''
                    }`}
                  >
                    Metric
                  </span>

                  <button
                    type='button'
                    className={`theme-toggle ${unitSystem}`}
                    onClick={() =>
                      setUnitSystem(
                        unitSystem === 'metric' ? 'imperial' : 'metric'
                      )
                    }
                    aria-label='Toggle unit system'
                  >
                    <span className='theme-toggle-thumb'>
                      <span className='units-label'>
                        {unitSystem === 'imperial' ? 'lbs' : 'kg'}
                      </span>
                    </span>
                  </button>

                  <span
                    className={`theme-label ${
                      unitSystem === 'imperial' ? 'active' : ''
                    }`}
                  >
                    Imperial
                  </span>
                </div>

                {/* Weight input */}
                <div className='settings-field'>
                  <label>Weight</label>

                  <div className='settings-input'>
                    <input
                      type='number'
                      value={
                        weightKg == null
                          ? ''
                          : unitSystem === 'metric'
                          ? weightKg
                          : Math.round(weightKg * 2.20462)
                      }
                      onChange={(e) => {
                        const v = Number(e.target.value);
                        if (Number.isNaN(v)) return;

                        setWeightKg(
                          unitSystem === 'metric' ? v : Math.round(v / 2.20462)
                        );
                      }}
                    />
                    {/* 
                    <span className='unit-label'>
                      {unitSystem === 'metric' ? 'kg' : 'lb'}
                    </span>
                    */}
                  </div>
                </div>
              </div>
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

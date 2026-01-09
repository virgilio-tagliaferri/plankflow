import { WORKOUT } from '../../data/workout';

type Props = {
  phase: 'countdown' | 'exercise' | 'break';
  currentIndex: number;
  timeLeft: number;
  isPaused: boolean;
  progress: number;
  isEnding: boolean;
  isPastHalfway: boolean;
  isPhaseTransition: boolean;
  setIsWorkoutMenuOpen: React.Dispatch<React.SetStateAction<boolean>>;
  radius: number;
  stroke: number;
  circumference: number;
  normalizedRadius: number;
  onPrevious: () => void;
  onTogglePause: () => void;
  onNext: () => void;
  onAbort: () => void;
  confirmAbort: boolean;
  onCancelAbort: () => void;
  showSwitchCue: boolean;
};

export function WorkoutScreen({
  phase,
  currentIndex,
  timeLeft,
  isPaused,
  progress,
  isEnding,
  isPastHalfway,
  isPhaseTransition,
  setIsWorkoutMenuOpen,
  showSwitchCue,
  radius,
  stroke,
  circumference,
  normalizedRadius,
  onPrevious,
  onTogglePause,
  onNext,
  onAbort,
  confirmAbort,
  onCancelAbort,
}: Props) {
  const currentExercise = WORKOUT[currentIndex];

  const displayExercise =
    phase === 'countdown'
      ? WORKOUT[0]
      : phase === 'break'
      ? WORKOUT[currentIndex + 1]
      : currentExercise;

  return (
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
      <button
        className='workout-menu-button'
        onClick={() => setIsWorkoutMenuOpen(true)}
        aria-label='Workout options'
      >
        <span className='material-symbols-rounded'>more_vert</span>
      </button>
      <div className='phase-header'>
        {/* COUNTDOWN */}
        <div
          className={`phase-content ${phase === 'countdown' ? 'active' : ''}`}
        >
          <h1 style={{ margin: '0' }}>Get into position</h1>
          <h3 style={{ marginTop: '0' }}>{currentExercise.name}</h3>
        </div>

        {/* EXERCISE */}
        <div
          className={`phase-content ${phase === 'exercise' ? 'active' : ''}`}
        >
          <h1 style={{ margin: '0' }}>Hold steady</h1>
          <h3 style={{ marginTop: '0' }}>{currentExercise.name}</h3>
        </div>

        {/* BREAK */}
        <div className={`phase-content ${phase === 'break' ? 'active' : ''}`}>
          <h1 style={{ margin: '0' }}>Rest</h1>
          <h3 style={{ marginTop: '0' }}>
            Up next: {WORKOUT[currentIndex + 1]?.name}
          </h3>
        </div>
      </div>

      <div className='progress-dots'>
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
              displayExercise.canMirror && isPastHalfway && !showSwitchCue
                ? 'mirrored'
                : ''
            }`}
          />
          <div className={`switch-cue ${showSwitchCue ? 'visible' : ''}`}>
            <div className='switch-cue-fill' />
            <label>Switch position</label>
          </div>
        </div>
      )}

      <p
        className={`timer ${isPaused ? 'paused' : ''} ${
          isEnding ? 'ending' : ''
        }`}
      >
        {timeLeft}s
      </p>

      <div className='controlPanel'>
        <button
          onClick={onPrevious}
          disabled={currentIndex === 0}
          style={{ marginRight: 6 }}
        >
          <span className='material-symbols-rounded' style={{ marginRight: 6 }}>
            skip_previous
          </span>
          Back
        </button>

        <div className='pause-ring'>
          <svg
            width={radius * 2}
            height={radius * 2}
            viewBox={`0 0 ${radius * 2} ${radius * 2}`}
            className={`progress-ring ${
              phase !== 'exercise' ? 'is-rest' : ''
            } ${isPaused ? 'is-paused' : ''} ${
              isPhaseTransition ? 'no-transition' : ''
            }`}
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

          <button
            onClick={onTogglePause}
            className={`pause-button ${isPaused ? 'is-resume' : ''}`}
            aria-label={isPaused ? 'Resume workout' : 'Pause workout'}
          >
            <span className='material-symbols-rounded' aria-hidden='true'>
              {isPaused ? 'play_arrow' : 'pause'}
            </span>
          </button>
        </div>

        <button
          onClick={onNext}
          disabled={currentIndex === WORKOUT.length - 1}
          style={{ marginLeft: 6 }}
        >
          Skip
          <span className='material-symbols-rounded' style={{ marginLeft: 6 }}>
            skip_next
          </span>
        </button>
      </div>

      <button
        className='abort-button'
        onClick={onAbort}
        style={{ marginTop: 15 }}
      >
        {confirmAbort ? 'Tap again to confirm' : 'End workout'}
      </button>

      {confirmAbort && (
        <button
          className='abort-backdrop'
          onClick={onCancelAbort}
          aria-label='Cancel end workout confirmation'
        />
      )}
    </div>
  );
}

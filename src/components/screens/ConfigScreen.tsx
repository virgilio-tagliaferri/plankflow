import type { Level, WorkoutConfig } from '../../domain/workoutConfig';
import { LEVEL_LABELS } from '../../domain/workoutConfig';

type Props = {
  level: Level;
  config: WorkoutConfig;
  onLevelChange: (level: Level) => void;
  onBegin: () => void;
  onBack: () => void;
  onGuide: () => void;
  onOpenSettings: () => void;
};

export function ConfigScreen({
  level,
  config,
  onLevelChange,
  onBegin,
  onBack,
  onGuide,
  onOpenSettings,
}: Props) {
  return (
    <div style={{ maxWidth: 400, width: '90%' }}>
      <button
        className='settings-menu-button'
        onClick={onOpenSettings}
        aria-label='Settings'
      >
        <span className='material-symbols-rounded'>more_vert</span>
      </button>

      <h2 style={{ margin: 0 }}>Workout Settings</h2>

      <p style={{ letterSpacing: '-0.025em' }}>
        Choose a difficulty level and get ready to move.
        <br />
        You’ll rest briefly between exercises, with a longer break halfway
        through the workout.
      </p>

      <div style={{ marginBottom: 32, marginTop: 32 }}>
        <label style={{ display: 'block', marginBottom: '1rem' }}>
          Difficulty: <strong>{LEVEL_LABELS[level]}</strong>
        </label>

        <input
          style={{ width: '66%', maxWidth: 320 }}
          type='range'
          min={0}
          max={4}
          step={1}
          value={level}
          onChange={(e) => onLevelChange(Number(e.target.value) as Level)}
        />

        <p style={{ margin: '1rem 0 0.5rem 0' }}>
          Plank hold: <strong>{config.exerciseDuration}s</strong>
        </p>
        <p style={{ margin: '0.5rem 0' }}>
          Short rest: <strong>{config.shortBreak}s</strong>
        </p>
        <p style={{ margin: '0.5rem 0' }}>
          Long rest: <strong>{config.longBreak}s</strong>
        </p>
      </div>

      <button
        className='start-button'
        onClick={onBegin}
        style={{ marginBottom: 16 }}
      >
        Begin workout
      </button>

      <div>
        <button type='button' onClick={onBack} style={{ marginRight: 16 }}>
          <span
            className='material-symbols-rounded'
            style={{ marginRight: 6, fontSize: '1.5em' }}
          >
            arrow_back
          </span>
          Back
        </button>

        <button type='button' onClick={onGuide}>
          <span
            className='material-symbols-rounded'
            style={{ marginRight: 6, fontSize: '1.5em' }}
          >
            book_5
          </span>
          Guide
        </button>
      </div>
    </div>
  );
}

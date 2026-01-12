import { useState } from 'react';

type SettingsMenuProps = {
  isOpen: boolean;
  onClose: () => void;

  phase: any;
  currentExercise: any;

  theme: 'light' | 'dark';
  setTheme: (v: 'light' | 'dark') => void;

  fontStyle: 'default' | 'compact';
  setFontStyle: (v: 'default' | 'compact') => void;

  soundEnabled: boolean;
  setSoundEnabled: (v: boolean | ((v: boolean) => boolean)) => void;

  vibrationEnabled: boolean;
  setVibrationEnabled: (v: boolean | ((v: boolean) => boolean)) => void;

  unitSystem: 'metric' | 'imperial';
  setUnitSystem: (v: 'metric' | 'imperial') => void;

  weightKg: number | null;
  setWeightKg: (v: number | null) => void;
};

export function SettingsMenu({
  isOpen,
  onClose,
  phase,
  currentExercise,
  theme,
  setTheme,
  fontStyle,
  setFontStyle,
  soundEnabled,
  setSoundEnabled,
  vibrationEnabled,
  setVibrationEnabled,
  unitSystem,
  setUnitSystem,
  weightKg,
  setWeightKg,
}: SettingsMenuProps) {
  const [settingsMenuView, setSettingsMenuView] = useState<
    'menu' | 'guide' | 'sound' | 'appearance' | 'bodyMetrics'
  >('menu');

  if (!isOpen) return null;

  return (
    <>
      {isOpen && (
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
              onClick={() => onClose()}
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
                    {(currentExercise.description ?? []).map(
                      (line: string, i: number) => (
                        <li key={i}>{line}</li>
                      )
                    )}
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
      {/* 🔴 PASTE THE SETTINGS MENU JSX FROM App.tsx HERE 🔴 */}
      {/* 🔴 DO NOT CHANGE A SINGLE LINE 🔴 */}
      {/* 🔴 ONLY ALLOWED REPLACEMENTS 🔴 */}
      {/* isSettingsMenuOpen → isOpen */}
      {/* setIsSettingsMenuOpen(false) → onClose() */}
    </>
  );
}

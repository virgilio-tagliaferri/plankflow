import type { Session } from '../types/session.ts';
import type { Preferences } from '../types/preferences.ts';

export type SessionSummary = {
  totalPlankMs: number;
  longestHoldMs: number;
  calories: number;
};

const BASE_MET = 3.3;

const DIFFICULTY_MULTIPLIER: Record<number, number> = {
  1: 0.8,
  2: 0.9,
  3: 1.0,
  4: 1.15,
  5: 1.3,
};

export function computeSessionSummary(
  session: Session,
  preferences: Preferences,
  level: number
): SessionSummary {
  let totalPlankMs = 0;
  let longestHoldMs = 0;

  for (const segment of session.segments) {
    totalPlankMs += segment.durationMs;
    if (segment.durationMs > longestHoldMs) {
      longestHoldMs = segment.durationMs;
    }
  }

  const totalHours = totalPlankMs / 1000 / 60 / 60;

  const multiplier = DIFFICULTY_MULTIPLIER[level] ?? 1;

  const calories = Math.round(
    BASE_MET * multiplier * preferences.weightKg * totalHours
  );

  return {
    totalPlankMs,
    longestHoldMs,
    calories,
  };
}

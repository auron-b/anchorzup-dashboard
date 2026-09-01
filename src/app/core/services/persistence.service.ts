import { Injectable } from '@angular/core';

const STORAGE_KEY = 'anchorzup.dashboard.v1';

export interface PersistedDashboard<TState> {
  version: 1;
  savedAt: string;
  state: TState;
}

/**
 * Thin, typed wrapper around localStorage so the store never touches
 * `window.localStorage` directly (and so swapping this for a real mock
 * backend later is a one-file change, per the brief's "localStorage or a
 * mock backend" option).
 */
@Injectable({ providedIn: 'root' })
export class PersistenceService {
  load<TState>(): TState | null {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return null;
      const parsed = JSON.parse(raw) as PersistedDashboard<TState>;
      return parsed.state ?? null;
    } catch {
      // Corrupted or inaccessible storage should never crash the dashboard.
      return null;
    }
  }

  save<TState>(state: TState): void {
    try {
      const payload: PersistedDashboard<TState> = {
        version: 1,
        savedAt: new Date().toISOString(),
        state,
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    } catch {
      // Ignore quota/availability errors — persistence is a nice-to-have,
      // not something that should break the dashboard.
    }
  }

  clear(): void {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      /* noop */
    }
  }
}

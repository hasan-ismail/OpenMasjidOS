/*
 * prefs — platform-only dashboard preferences (theme/accent live elsewhere).
 *
 * Per CLAUDE.md §3/§38 the platform owns ONLY presentation + advanced toggles;
 * masjid/prayer config belongs to individual apps, never here. These prefs are
 * persisted to localStorage so they survive reloads. (Backend persistence will
 * arrive with the settings API; localStorage is the honest interim store.)
 */

import { browser } from '$app/environment';
import { writable } from 'svelte/store';

export interface Prefs {
  /** Optional custom name shown in the sidebar instead of "OpenMasjidOS". */
  dashboardName: string;
  /** Accent colour id — see ACCENTS. Applied live to the primary CSS tokens. */
  accent: string;
  /** Advanced: when on, the App Store exposes a "3rd Party App" installer. */
  customApps: boolean;
  /** Whether to play the first-load khatam splash. */
  showSplash: boolean;
}

const KEY = 'omos-prefs';

const DEFAULTS: Prefs = {
  dashboardName: '',
  accent: 'cyan',
  customApps: false,
  showSplash: true,
};

/** Selectable accent presets. Each live-applies to the primary tokens. */
export const ACCENTS: Record<string, { label: string; primary: string; hover: string; subtle: string }> = {
  cyan:   { label: 'Cyan',   primary: '#22D3EE', hover: '#67E8F9', subtle: 'rgba(34,211,238,0.12)' },
  teal:   { label: 'Teal',   primary: '#2DD4BF', hover: '#5EEAD4', subtle: 'rgba(45,212,191,0.12)' },
  sky:    { label: 'Sky',    primary: '#38BDF8', hover: '#7DD3FC', subtle: 'rgba(56,189,248,0.12)' },
  violet: { label: 'Violet', primary: '#A78BFA', hover: '#C4B5FD', subtle: 'rgba(167,139,250,0.14)' },
  gold:   { label: 'Gold',   primary: '#FBBF24', hover: '#FCD34D', subtle: 'rgba(251,191,36,0.14)' },
};

function load(): Prefs {
  if (!browser) return { ...DEFAULTS };
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? { ...DEFAULTS, ...JSON.parse(raw) } : { ...DEFAULTS };
  } catch {
    return { ...DEFAULTS };
  }
}

function persist(p: Prefs): void {
  if (!browser) return;
  try {
    localStorage.setItem(KEY, JSON.stringify(p));
  } catch {
    /* private mode / storage disabled — preferences just won't persist */
  }
}

/**
 * Live-apply an accent to the primary CSS custom properties.
 *
 * The default 'cyan' REMOVES any inline override so each theme's own tuned
 * --color-primary applies (#22D3EE dark / #0284C7 light) — keeping light-theme
 * contrast correct. Only a non-default accent writes an inline override (an
 * opt-in preview; persistence + full per-theme tuning arrive with the backend).
 */
export function applyAccent(id: string): void {
  if (!browser) return;
  const el = document.documentElement;
  if (id === 'cyan' || !ACCENTS[id]) {
    el.style.removeProperty('--color-primary');
    el.style.removeProperty('--color-primary-hover');
    el.style.removeProperty('--color-primary-subtle');
    return;
  }
  const a = ACCENTS[id];
  el.style.setProperty('--color-primary', a.primary);
  el.style.setProperty('--color-primary-hover', a.hover);
  el.style.setProperty('--color-primary-subtle', a.subtle);
}

function createPrefs() {
  const { subscribe, set, update } = writable<Prefs>(load());

  return {
    subscribe,
    /** Merge a partial update, persist, and apply side effects (accent). */
    patch(part: Partial<Prefs>) {
      update((p) => {
        const next = { ...p, ...part };
        persist(next);
        if (part.accent !== undefined) applyAccent(next.accent);
        return next;
      });
    },
    /** Re-apply persisted side effects on app load. */
    hydrate() {
      const p = load();
      set(p);
      applyAccent(p.accent);
    },
  };
}

export const prefs = createPrefs();

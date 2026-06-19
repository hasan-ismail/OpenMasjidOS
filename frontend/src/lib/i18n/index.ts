import { writable, derived } from 'svelte/store';
import en from './en.json';

type DeepPartial<T> = { [K in keyof T]?: T[K] extends object ? DeepPartial<T[K]> : T[K] };
type Locale = typeof en;

const locales: Record<string, DeepPartial<Locale>> = { en };

export const locale = writable<string>('en');

// RTL languages — extend this list as new locales are added.
const RTL_LOCALES = new Set(['ar', 'ur', 'fa', 'he']);

// dir: 'rtl' when the active locale is right-to-left, 'ltr' otherwise.
export const dir = derived(locale, ($locale) =>
  RTL_LOCALES.has($locale) ? ('rtl' as const) : ('ltr' as const)
);

export const t = derived(locale, ($locale) => {
  const strings = locales[$locale] ?? locales['en'];

  /**
   * Translate a dot-path key and optionally interpolate {variable} placeholders.
   *
   * Usage:
   *   $t('dashboard.title')
   *   $t('dashboard.coreVersion', { version: '0.1.0' })   → "Core v0.1.0"
   *   $t('dashboard.welcome', { name: 'Al-Noor' })        → "Welcome to Al-Noor"
   */
  return function get(path: string, vars?: Record<string, string>): string {
    const parts = path.split('.');
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- dynamic traversal
    let cur: any = strings;
    for (const p of parts) {
      cur = cur?.[p];
      if (cur === undefined) return path; // missing key — return the key so it's obvious
    }

    let result = typeof cur === 'string' ? cur : path;

    // Replace {placeholder} tokens with values from vars.
    if (vars) {
      for (const [key, value] of Object.entries(vars)) {
        result = result.replaceAll(`{${key}}`, value);
      }
    }

    return result;
  };
});

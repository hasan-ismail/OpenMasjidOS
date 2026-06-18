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
  // Simple dot-path accessor: t('dashboard.title')
  return function get(path: string): string {
    const parts = path.split('.');
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- dynamic traversal
    let cur: any = strings;
    for (const p of parts) {
      cur = cur?.[p];
      if (cur === undefined) return path;
    }
    return typeof cur === 'string' ? cur : path;
  };
});

// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2026 OpenMasjid-Solutions
/**
 * Custom masjid glyph set, used as the brand mark and empty-state art
 * (CLAUDE.md §14 motifs). No sacred text — geometric/architectural motifs only.
 *
 * MasjidMark is the official OpenMasjid logo icon (the actual artwork, cropped
 * from the brand PNG to a transparent silhouette). It is rendered as a CSS mask
 * filled with `currentColor`, so it shows the real mark AND adapts to the theme
 * (dark/light) at any size — exactly the behaviour the old inline glyph had.
 */
import markUrl from '../assets/logo-mark.png';

interface GlyphProps {
  size?: number;
  className?: string;
}

/** The OpenMasjid crescent-and-dome logo icon (real artwork, theme-adaptive). */
export function MasjidMark({ size = 28, className }: GlyphProps) {
  const mask = `url(${markUrl}) center / contain no-repeat`;
  return (
    <span
      className={className}
      aria-hidden="true"
      style={{
        display: 'inline-block',
        width: size,
        height: size,
        backgroundColor: 'currentColor',
        WebkitMask: mask,
        mask,
      }}
    />
  );
}

/** Minaret-and-dome empty-state illustration. */
export function MasjidScene({ size = 96, className }: GlyphProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 120 120"
      fill="none"
      className={className}
      aria-hidden="true"
    >
      <g stroke="currentColor" strokeWidth="2" fill="none" opacity="0.9">
        <path d="M40 70c0-14 9-22 20-22s20 8 20 22" />
        <rect x="34" y="70" width="52" height="34" rx="2" />
        <path d="M52 104V88a8 8 0 0 1 16 0v16" />
        <rect x="20" y="56" width="10" height="48" rx="2" />
        <path d="M25 50a5 5 0 0 1 0 10" />
        <rect x="90" y="56" width="10" height="48" rx="2" />
        <path d="M95 50a5 5 0 0 1 0 10" />
      </g>
      <circle cx="60" cy="34" r="4" stroke="currentColor" strokeWidth="2" fill="none" opacity="0.7" />
    </svg>
  );
}

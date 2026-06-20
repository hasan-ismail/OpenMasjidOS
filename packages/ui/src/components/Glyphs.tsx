/**
 * Custom masjid glyph set (dome + crescent over an arch). Original artwork,
 * used as the brand mark and empty-state art (CLAUDE.md §14 motifs). No sacred
 * text — geometric/architectural motifs only.
 */
interface GlyphProps {
  size?: number;
  className?: string;
}

/** Dome + crescent + mihrab arch — the OpenMasjidOS mark. */
export function MasjidMark({ size = 28, className }: GlyphProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      className={className}
      aria-hidden="true"
    >
      {/* crescent finial */}
      <path
        d="M24 3c1.6 0 3 .6 4 1.6A5.6 5.6 0 0 0 24 14a5.6 5.6 0 0 0 4-1.4A5.8 5.8 0 0 1 24 3Z"
        fill="currentColor"
      />
      {/* dome */}
      <path
        d="M12 26c0-8 5.4-12 12-12s12 4 12 12v2H12v-2Z"
        fill="currentColor"
        opacity="0.9"
      />
      {/* body + mihrab arch */}
      <path
        d="M10 28h28v15H10V28Zm10 15V36a4 4 0 0 1 8 0v7h-8Z"
        fill="currentColor"
        opacity="0.55"
      />
    </svg>
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

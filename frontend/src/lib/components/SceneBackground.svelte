<!--
  SceneBackground — the living ambient scene that lives BEHIND every glass pane.
  A slowly-drifting aurora of cyan/navy/gold, veiled by the faint khatam star
  pattern, grounded by a soft vignette. This is what the frosted glass refracts,
  so the blur always has light and colour to work with.

  Non-interactive and aria-hidden. Fixed at z-index:-1 so it sits under the whole
  app. Under prefers-reduced-motion it collapses to one flat, dignified gradient.
  All colours come from tokens (--scene-*, --aurora-*, --geometric-pattern) so it
  retunes per-theme automatically.
-->
<div class="scene" aria-hidden="true">
  <div class="scene__aurora"></div>
  <div class="scene__pattern"></div>
  <div class="scene__vignette"></div>
</div>

<style>
  .scene {
    position: fixed;
    inset: 0;
    z-index: -1;
    overflow: hidden;
    pointer-events: none;
    background: var(--scene-base);
  }

  /* Oversized so the drifting edges never reveal a seam. Position-static blobs
     (rasterised once); only transform animates → GPU-cheap. */
  .scene__aurora {
    position: absolute;
    inset: -10%;
    background:
      radial-gradient(38vw 38vw at 18% 22%, var(--aurora-cyan), transparent 60%),
      radial-gradient(46vw 46vw at 82% 18%, var(--aurora-navy), transparent 65%),
      radial-gradient(34vw 34vw at 72% 84%, var(--aurora-gold), transparent 60%),
      radial-gradient(50vw 50vw at 28% 88%, var(--aurora-cyan), transparent 62%);
    filter: blur(var(--aurora-blur)) saturate(115%);
    animation: drift 48s ease-in-out infinite alternate;
    will-change: transform;
    transform: translateZ(0);
  }

  .scene__pattern {
    position: absolute;
    inset: 0;
    background-image: var(--geometric-pattern);
    background-size: 64px 64px;
    opacity: var(--pattern-opacity);
    /* fade the pattern out toward the bottom so it never fights content */
    -webkit-mask-image: radial-gradient(120% 120% at 50% 0%, #000 30%, transparent 80%);
    mask-image: radial-gradient(120% 120% at 50% 0%, #000 30%, transparent 80%);
    animation: patternPan 120s linear infinite;
    /* No will-change: animating background-position gains nothing from a
       promoted layer and only wastes VRAM on low-power devices (e.g. Pi). */
  }

  /* Mirror the aurora blob X-positions in RTL so the visual balance follows
     the reading direction (Y unchanged). Percentages, so no left/right literals. */
  :global([dir='rtl']) .scene__aurora {
    background:
      radial-gradient(38vw 38vw at 82% 22%, var(--aurora-cyan), transparent 60%),
      radial-gradient(46vw 46vw at 18% 18%, var(--aurora-navy), transparent 65%),
      radial-gradient(34vw 34vw at 28% 84%, var(--aurora-gold), transparent 60%),
      radial-gradient(50vw 50vw at 72% 88%, var(--aurora-cyan), transparent 62%);
  }

  .scene__vignette {
    position: absolute;
    inset: 0;
    /* Vertical bias (30%) is an intentional brand composition choice — content
       at the top stays brightest. Horizontal 50% is direction-agnostic (RTL-safe). */
    background: radial-gradient(130% 110% at 50% 30%, transparent 55%, var(--scene-vignette));
  }

  @keyframes drift {
    0%   { transform: translate3d(0, 0, 0) scale(1); }
    50%  { transform: translate3d(2%, -2%, 0) scale(1.06); }
    100% { transform: translate3d(-2%, 2%, 0) scale(1.03); }
  }
  @keyframes patternPan {
    to { background-position: 64px 128px; }
  }

  /* Non-negotiable: flatten to a static, tasteful background. */
  @media (prefers-reduced-motion: reduce) {
    .scene__aurora,
    .scene__pattern {
      animation: none !important;
      transform: none !important;
    }
  }
</style>

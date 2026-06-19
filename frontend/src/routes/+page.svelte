<script lang="ts">
  import { onMount } from 'svelte';
  import { t } from '$lib/i18n';
  import { api } from '$lib/api/client';
  import { riseIn, tiltCard, pressable, enterGrid } from '$lib/animations';

  // Health response shape from GET /api/health
  interface HealthResponse {
    status: string;
    version: string;
    masjid_name?: string;
  }

  let health: HealthResponse | null = null;
  let healthError = false;
  let loading = true;

  onMount(async () => {
    try {
      health = await api.health();
    } catch {
      healthError = true;
    } finally {
      loading = false;
    }
  });

  // Staggered-entrance action for the content stack (hides then reveals on view).
  function gridIn(node: HTMLElement) {
    return { destroy: enterGrid(node, { base: 90, y: 16 }) };
  }
</script>

<div class="page">

  <!-- ── Welcome hero — sits on the bare scene (no glass) so the first glass
       pane below has contrast to read against. ── -->
  {#if loading}
    <div class="hero-skeleton shimmer" aria-hidden="true"></div>
  {:else}
    <header class="hero" in:riseIn>
      <h1 class="hero-title">
        {$t('dashboard.welcome')}
      </h1>
      {#if health?.version && !healthError}
        <p class="hero-sub">{$t('dashboard.coreVersion', { version: health.version })}</p>
      {/if}
    </header>
  {/if}

  {#if loading}
    <!-- Skeleton placeholders while health loads -->
    <div class="status-card glass-raised">
      <div class="skel-line skel-line--lg shimmer"></div>
    </div>
    <div class="apps-grid">
      {#each Array(3) as _}
        <div class="glass app-skeleton">
          <div class="skel-block shimmer"></div>
          <div class="skel-line shimmer"></div>
          <div class="skel-line skel-line--sm shimmer"></div>
        </div>
      {/each}
    </div>
  {:else}
    <div class="content-stack" use:gridIn>

      <!-- ── System Status card ── -->
      <div
        class="status-card glass-raised glow-accent"
        use:tiltCard
        role="status"
        aria-live="polite"
      >
        <span
          class="status-dot"
          class:status-dot--error={healthError}
          aria-hidden="true"
        ></span>
        <div class="status-text">
          <p class="status-title">{$t('dashboard.systemStatus')}</p>
          <p class="status-sub">
            {#if healthError}
              {$t('dashboard.statusError')}
            {:else}
              {$t('dashboard.statusOk')}
            {/if}
          </p>
        </div>
        {#if health?.version && !healthError}
          <span class="version-badge">v{health.version}</span>
        {/if}
      </div>

      <!-- ── Installed Apps section ── -->
      <section class="apps-section" aria-labelledby="installed-apps-heading">
        <h2 id="installed-apps-heading" class="section-title">
          {$t('dashboard.installedApps')}
        </h2>

        <!-- Empty state — no apps installed yet -->
        <div class="empty-card glass glow-accent">
          <div class="empty-illustration" aria-hidden="true">
            <svg viewBox="0 0 160 130" width="150" height="122" fill="none" xmlns="http://www.w3.org/2000/svg">
              <!-- side minarets -->
              <rect x="30" y="60" width="9" height="50" rx="2" fill="currentColor" opacity=".30"/>
              <path d="M30 60 Q34.5 46 39 60 Z" fill="currentColor" opacity=".30"/>
              <circle cx="34.5" cy="44" r="2.4" fill="var(--color-gold)" opacity=".7"/>
              <rect x="121" y="60" width="9" height="50" rx="2" fill="currentColor" opacity=".30"/>
              <path d="M121 60 Q125.5 46 130 60 Z" fill="currentColor" opacity=".30"/>
              <circle cx="125.5" cy="44" r="2.4" fill="var(--color-gold)" opacity=".7"/>
              <!-- main dome on a mihrab body -->
              <rect x="26" y="108" width="108" height="5" rx="2" fill="currentColor" opacity=".25"/>
              <path d="M48 108 Q48 64 80 50 Q112 64 112 108 Z" fill="currentColor" opacity=".55"/>
              <!-- mihrab arch doorway -->
              <path d="M70 108 L70 88 Q80 78 90 88 L90 108 Z" fill="var(--color-surface)"/>
              <!-- crescent finial -->
              <circle cx="80" cy="42" r="7" fill="var(--color-gold)" opacity=".85"/>
              <circle cx="83" cy="39" r="5" fill="var(--color-surface)"/>
            </svg>
          </div>

          <h3 class="empty-title">{$t('dashboard.noAppsTitle')}</h3>
          <p class="empty-body">{$t('dashboard.noAppsBody')}</p>

          <a href="/store" class="browse-btn" use:pressable>
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <circle cx="12" cy="12" r="10" />
              <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" />
            </svg>
            {$t('dashboard.browseStore')}
          </a>
        </div>
      </section>

    </div>
  {/if}
</div>

<style>
  .page {
    max-width: 64rem;
    margin: 0 auto;
    display: flex;
    flex-direction: column;
    gap: 2rem;
  }

  /* Hero */
  .hero {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
  }
  .hero-title {
    font-family: 'Playfair Display', Georgia, serif;
    font-size: 2rem;
    font-weight: 600;
    line-height: 1.15;
    letter-spacing: -0.02em;
    color: var(--color-ink);
    margin: 0;
  }
  .hero-sub {
    font-size: 0.875rem;
    color: var(--color-primary);
    margin: 0;
  }
  .hero-skeleton {
    height: 2.75rem;
    width: 18rem;
    border-radius: var(--radius-button);
  }

  /* Skeleton shimmer — gradient sweep (on-brand khatam tint). */
  .shimmer {
    background-image: linear-gradient(
      90deg,
      var(--color-surface-raised) 0%,
      var(--color-surface-shimmer) 50%,
      var(--color-surface-raised) 100%
    );
    background-size: 200% 100%;
    animation: shimmer 1.8s ease-in-out infinite;
  }
  @keyframes shimmer {
    0%   { background-position: 200% 0; }
    100% { background-position: -200% 0; }
  }
  @media (prefers-reduced-motion: reduce) {
    .shimmer {
      animation: none;
      background: var(--color-surface-overlay);
    }
  }

  .content-stack {
    display: flex;
    flex-direction: column;
    gap: 2rem;
  }

  /* System Status card */
  .status-card {
    display: flex;
    align-items: center;
    gap: 1rem;
    padding: 1.25rem 1.5rem;
  }
  .status-text {
    min-width: 0;
    flex: 1;
  }
  .status-title {
    font-weight: 600;
    color: var(--color-ink);
    margin: 0;
  }
  .status-sub {
    font-size: 0.875rem;
    color: var(--color-ink-muted);
    margin: 0.125rem 0 0;
  }
  .version-badge {
    flex-shrink: 0;
    border-radius: 2rem;
    border: 1px solid var(--glass-border);
    padding: 0.125rem 0.75rem;
    font-size: 0.75rem;
    font-weight: 500;
    color: var(--color-ink-muted);
  }

  /* Apps section */
  .section-title {
    font-family: 'Playfair Display', Georgia, serif;
    font-size: 1.25rem;
    font-weight: 600;
    color: var(--color-ink);
    margin: 0 0 1rem;
  }

  .empty-card {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    text-align: center;
    padding: 3.5rem 2rem;
    border: 1px dashed var(--glass-border);
  }
  .empty-illustration {
    color: var(--color-primary);
    margin-block-end: 1rem;
    opacity: 0.9;
  }
  .empty-title {
    font-size: 1.125rem;
    font-weight: 600;
    color: var(--color-ink);
    margin: 0 0 0.5rem;
  }
  .empty-body {
    font-size: 0.875rem;
    color: var(--color-ink-muted);
    max-width: 22rem;
    margin: 0 0 1.5rem;
  }

  .browse-btn {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    border-radius: var(--radius-button);
    background: var(--color-btn);
    color: var(--color-on-primary);
    padding: 0.625rem 1.25rem;
    font-size: 0.875rem;
    font-weight: 600;
    text-decoration: none;
    box-shadow: var(--glow-primary);
    transition: background-color 0.15s ease;
  }
  .browse-btn:hover {
    background: var(--color-btn-hover);
  }

  /* App grid + skeletons */
  .apps-grid {
    display: grid;
    gap: 1rem;
    grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  }
  .app-skeleton {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
    padding: 1.25rem;
  }
  .skel-block {
    width: 48px;
    height: 48px;
    border-radius: 0.75rem;
    background-color: var(--color-surface-overlay);
  }
  .skel-line {
    height: 0.875rem;
    width: 75%;
    border-radius: 0.375rem;
    background-color: var(--color-surface-overlay);
  }
  .skel-line--sm { width: 50%; }
  .skel-line--lg { width: 60%; height: 1.25rem; }
</style>

<script lang="ts">
  import { onMount } from 'svelte';
  import { fly, fade } from 'svelte/transition';
  import { cubicOut } from 'svelte/easing';
  import { t } from '$lib/i18n';

  const prefersReducedMotion =
    typeof window !== 'undefined'
      ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
      : false;

  const flyIn = prefersReducedMotion
    ? { y: 0, duration: 0 }
    : { y: 20, duration: 400, easing: cubicOut };

  type Category = 'all' | 'displays' | 'community' | 'donations' | 'quran' | 'utilities';

  let selectedCategory: Category = 'all';
  let searchQuery = '';
  let loading = true;

  const categories: { id: Category; labelKey: string }[] = [
    { id: 'all',       labelKey: 'store.categories.all' },
    { id: 'displays',  labelKey: 'store.categories.displays' },
    { id: 'community', labelKey: 'store.categories.community' },
    { id: 'donations', labelKey: 'store.categories.donations' },
    { id: 'quran',     labelKey: 'store.categories.quran' },
    { id: 'utilities', labelKey: 'store.categories.utilities' },
  ];

  onMount(() => {
    // Simulate catalog fetch — real implementation fetches from OpenMasjidAPPS
    setTimeout(() => { loading = false; }, 800);
  });
</script>

<div class="page" in:fly={flyIn}>

  <!-- Header -->
  <header class="page-header" in:fly={{ ...flyIn, delay: 0 }}>
    <h1 class="page-title">{$t('store.title')}</h1>
    <p class="page-subtitle">{$t('store.subtitle')}</p>
  </header>

  <!-- Search bar -->
  <div class="search-row" in:fly={{ ...flyIn, delay: 60 }}>
    <div class="search-wrap">
      <svg class="search-icon" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5" width="16" height="16" aria-hidden="true">
        <circle cx="8.5" cy="8.5" r="5.5"/>
        <path d="M13 13 L17 17"/>
      </svg>
      <input
        type="search"
        bind:value={searchQuery}
        placeholder={$t('store.search')}
        class="search-input"
        aria-label={$t('store.search')}
      />
    </div>
  </div>

  <!-- Category pills -->
  <div class="category-row" role="tablist" in:fly={{ ...flyIn, delay: 120 }}>
    {#each categories as cat, i}
      <button
        role="tab"
        class="category-pill"
        class:category-pill--active={selectedCategory === cat.id}
        aria-selected={selectedCategory === cat.id}
        on:click={() => selectedCategory = cat.id}
        style="--delay: {prefersReducedMotion ? 0 : 120 + i * 40}ms"
      >
        {$t(cat.labelKey)}
      </button>
    {/each}
  </div>

  <!-- Loading shimmer -->
  {#if loading}
    <div class="app-grid" aria-busy="true" aria-label={$t('store.loading')}>
      {#each Array(6) as _, i}
        <div
          class="app-card app-card--shimmer"
          style="--delay: {prefersReducedMotion ? 0 : i * 60}ms"
          in:fly={{ ...flyIn, delay: prefersReducedMotion ? 0 : 200 + i * 60 }}
        >
          <div class="shimmer-icon"></div>
          <div class="shimmer-line shimmer-line--title"></div>
          <div class="shimmer-line shimmer-line--sub"></div>
          <div class="shimmer-line shimmer-line--btn"></div>
        </div>
      {/each}
    </div>

  <!-- Empty state -->
  {:else}
    <div class="empty-state" in:fly={{ ...flyIn, delay: 200 }}>
      <!-- Masjid dome illustration -->
      <div class="empty-icon" aria-hidden="true">
        <svg viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg" width="80" height="80">
          <!-- Left minaret -->
          <rect x="10" y="42" width="8" height="22" rx="2" fill="var(--color-primary)" opacity="0.5"/>
          <path d="M10 42 Q14 33 18 42 Z" fill="var(--color-primary)" opacity="0.5"/>
          <!-- Right minaret -->
          <rect x="62" y="42" width="8" height="22" rx="2" fill="var(--color-primary)" opacity="0.5"/>
          <path d="M62 42 Q66 33 70 42 Z" fill="var(--color-primary)" opacity="0.5"/>
          <!-- Base -->
          <rect x="8" y="63" width="64" height="5" rx="2" fill="var(--color-primary)" opacity="0.4"/>
          <!-- Dome -->
          <path d="M20 63 Q20 34 40 28 Q60 34 60 63 Z" fill="var(--color-primary)" opacity="0.7"/>
          <!-- Door -->
          <path d="M34 63 L34 55 Q40 49 46 55 L46 63 Z" fill="var(--color-surface)"/>
          <!-- Crescent -->
          <circle cx="40" cy="24" r="6" fill="var(--color-primary)"/>
          <circle cx="42.8" cy="21.8" r="4.5" fill="var(--color-surface)"/>
        </svg>
      </div>

      <h2 class="empty-title">{$t('store.empty')}</h2>
      <p class="empty-hint">{$t('store.emptyHint')}</p>

      <!-- Coming-soon category teasers -->
      <div class="coming-soon-grid">
        {#each [
          { icon: '🕌', label: 'Prayer Times Display', cat: 'Displays' },
          { icon: '📢', label: 'Announcement Board', cat: 'Community' },
          { icon: '🤲', label: 'Donation Page', cat: 'Donations' },
        ] as teaser, i}
          <div
            class="teaser-card"
            in:fly={{ ...flyIn, delay: prefersReducedMotion ? 0 : 300 + i * 80 }}
          >
            <span class="teaser-icon">{teaser.icon}</span>
            <div>
              <div class="teaser-name">{teaser.label}</div>
              <div class="teaser-cat">{teaser.cat}</div>
            </div>
            <span class="teaser-badge">Coming soon</span>
          </div>
        {/each}
      </div>
    </div>
  {/if}

</div>

<style>
  .page {
    max-width: 900px;
    margin: 0 auto;
  }

  .page-header {
    margin-block-end: 1.75rem;
  }

  .page-title {
    font-size: 1.625rem;
    font-weight: 700;
    color: var(--color-ink);
    margin: 0 0 0.375rem;
    letter-spacing: -0.02em;
  }

  .page-subtitle {
    font-size: 0.9375rem;
    color: var(--color-ink-muted);
    margin: 0;
  }

  /* Search */
  .search-row {
    margin-block-end: 1rem;
  }

  .search-wrap {
    position: relative;
    max-width: 380px;
  }

  .search-icon {
    position: absolute;
    inset-inline-start: 0.75rem;
    top: 50%;
    transform: translateY(-50%);
    color: var(--color-ink-muted);
    pointer-events: none;
  }

  .search-input {
    width: 100%;
    padding: 0.5rem 0.75rem;
    padding-inline-start: 2.25rem;
    border-radius: var(--radius-button);
    border: 1px solid var(--color-border);
    background: var(--color-surface-raised);
    color: var(--color-ink);
    font-size: 0.9375rem;
    outline: none;
    transition: border-color 0.15s ease, box-shadow 0.15s ease;
    box-sizing: border-box;
  }

  .search-input:focus {
    border-color: var(--color-primary);
    box-shadow: 0 0 0 3px var(--color-primary-subtle);
  }

  .search-input::placeholder {
    color: var(--color-ink-faint);
  }

  /* Category pills */
  .category-row {
    display: flex;
    gap: 0.5rem;
    flex-wrap: wrap;
    margin-block-end: 1.75rem;
  }

  .category-pill {
    padding: 0.375rem 0.875rem;
    border-radius: 2rem;
    border: 1px solid var(--color-border);
    background: var(--color-surface-raised);
    color: var(--color-ink-muted);
    font-size: 0.8125rem;
    font-weight: 500;
    cursor: pointer;
    transition: background-color 0.15s ease, color 0.15s ease, border-color 0.15s ease, transform 0.1s ease;
  }

  .category-pill:hover {
    border-color: var(--color-primary);
    color: var(--color-primary);
    transform: translateY(-1px);
  }

  .category-pill--active {
    background: var(--color-primary-subtle);
    border-color: var(--color-primary);
    color: var(--color-primary);
    font-weight: 600;
  }

  .category-pill--active:hover {
    transform: none;
  }

  /* App grid */
  .app-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
    gap: 1rem;
  }

  /* Shimmer loading cards */
  .app-card--shimmer {
    background: var(--color-surface-raised);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-card);
    padding: 1.25rem;
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }

  .shimmer-icon {
    width: 48px;
    height: 48px;
    border-radius: 0.75rem;
    background: linear-gradient(
      90deg,
      var(--color-surface-overlay) 0%,
      var(--color-surface-shimmer) 50%,
      var(--color-surface-overlay) 100%
    );
    background-size: 200% 100%;
    animation: shimmer 1.4s ease-in-out infinite;
    animation-delay: var(--delay, 0ms);
  }

  .shimmer-line {
    border-radius: 0.375rem;
    background: linear-gradient(
      90deg,
      var(--color-surface-overlay) 0%,
      var(--color-surface-shimmer) 50%,
      var(--color-surface-overlay) 100%
    );
    background-size: 200% 100%;
    animation: shimmer 1.4s ease-in-out infinite;
    animation-delay: var(--delay, 0ms);
  }

  .shimmer-line--title { height: 16px; width: 75%; }
  .shimmer-line--sub   { height: 12px; width: 55%; }
  .shimmer-line--btn   { height: 32px; width: 100%; margin-block-start: 0.5rem; }

  @keyframes shimmer {
    0%   { background-position: 200% 0; }
    100% { background-position: -200% 0; }
  }

  /* Empty state */
  .empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
    padding-block: 3rem 2rem;
    gap: 0.75rem;
  }

  .empty-icon {
    margin-block-end: 0.75rem;
    opacity: 0.85;
  }

  .empty-title {
    font-size: 1.25rem;
    font-weight: 600;
    color: var(--color-ink);
    margin: 0;
  }

  .empty-hint {
    font-size: 0.9375rem;
    color: var(--color-ink-muted);
    margin: 0 0 1.25rem;
    max-width: 340px;
  }

  /* Coming-soon teasers */
  .coming-soon-grid {
    display: flex;
    flex-direction: column;
    gap: 0.625rem;
    width: 100%;
    max-width: 420px;
    text-align: start;
  }

  .teaser-card {
    display: flex;
    align-items: center;
    gap: 0.875rem;
    padding: 0.875rem 1rem;
    background: var(--color-surface-raised);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-button);
    opacity: 0.75;
  }

  .teaser-icon {
    font-size: 1.5rem;
    flex-shrink: 0;
  }

  .teaser-name {
    font-size: 0.9375rem;
    font-weight: 500;
    color: var(--color-ink);
  }

  .teaser-cat {
    font-size: 0.8125rem;
    color: var(--color-ink-muted);
    margin-block-start: 0.125rem;
  }

  .teaser-badge {
    margin-inline-start: auto;
    font-size: 0.75rem;
    font-weight: 600;
    color: var(--color-gold);
    background: var(--color-gold-subtle);
    padding: 0.25rem 0.625rem;
    border-radius: 2rem;
    white-space: nowrap;
    flex-shrink: 0;
  }

  @media (prefers-reduced-motion: reduce) {
    .shimmer-icon,
    .shimmer-line {
      animation: none;
      background: var(--color-surface-overlay);
    }
  }
</style>

<script lang="ts">
  import { onMount } from 'svelte';
  import { t } from '$lib/i18n';
  import { riseIn, pressable, enterGrid, liquidIndicator } from '$lib/animations';

  type Category = 'all' | 'displays' | 'community' | 'donations' | 'quran' | 'utilities';

  // This component is in runes mode (it uses $state for pillRow), so all
  // reactive state must use $state — plain `let` would not be reactive here.
  let selectedCategory = $state<Category>('all');
  let searchQuery = $state('');
  let loading = $state(true);

  let pillRow = $state<HTMLElement | undefined>(undefined);
  let pillIndicator: ReturnType<typeof liquidIndicator> | undefined;

  const categories: { id: Category; labelKey: string }[] = [
    { id: 'all',       labelKey: 'store.categories.all' },
    { id: 'displays',  labelKey: 'store.categories.displays' },
    { id: 'community', labelKey: 'store.categories.community' },
    { id: 'donations', labelKey: 'store.categories.donations' },
    { id: 'quran',     labelKey: 'store.categories.quran' },
    { id: 'utilities', labelKey: 'store.categories.utilities' },
  ];

  const teasers = [
    { icon: '🕌', label: 'Prayer Times Display', cat: 'Displays' },
    { icon: '📢', label: 'Announcement Board', cat: 'Community' },
    { icon: '🤲', label: 'Donation Page', cat: 'Donations' },
  ];

  function selectCategory(id: Category) {
    selectedCategory = id;
    // Re-place the liquid pill after the active attribute updates.
    requestAnimationFrame(() => pillIndicator?.update());
  }

  function gridIn(node: HTMLElement) {
    return { destroy: enterGrid(node, { base: 80, y: 16 }) };
  }

  onMount(() => {
    if (pillRow) {
      pillIndicator = liquidIndicator(pillRow, { activeSelector: '[aria-selected="true"]' });
    }
    // Simulate catalog fetch — real implementation fetches from OpenMasjidAPPS.
    const timer = setTimeout(() => { loading = false; }, 900);
    return () => {
      clearTimeout(timer);
      pillIndicator?.destroy();
    };
  });
</script>

<div class="page">

  <!-- Header -->
  <header class="page-header" in:riseIn>
    <h1 class="page-title">{$t('store.title')}</h1>
    <p class="page-subtitle">{$t('store.subtitle')}</p>
  </header>

  <!-- Search -->
  <div class="search-row" in:riseIn={{ delay: 60 }}>
    <div class="search-wrap glass-inset">
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

  <!-- Category pills with liquid indicator -->
  <div class="category-row" role="tablist" bind:this={pillRow} in:riseIn={{ delay: 120 }}>
    {#each categories as cat}
      <button
        role="tab"
        class="category-pill"
        class:category-pill--active={selectedCategory === cat.id}
        aria-selected={selectedCategory === cat.id}
        use:pressable
        on:click={() => selectCategory(cat.id)}
      >
        {$t(cat.labelKey)}
      </button>
    {/each}
  </div>

  {#if loading}
    <!-- Glass skeleton cards -->
    <div class="app-grid" aria-busy="true" aria-label={$t('store.loading')}>
      {#each Array(6) as _}
        <div class="glass app-card-skeleton">
          <div class="shimmer skel-icon"></div>
          <div class="shimmer skel-line skel-line--title"></div>
          <div class="shimmer skel-line skel-line--sub"></div>
          <div class="shimmer skel-line skel-line--btn"></div>
        </div>
      {/each}
    </div>
  {:else}
    <!-- Empty state -->
    <div class="empty-state" in:riseIn={{ delay: 160 }}>
      <div class="empty-icon glow-accent" aria-hidden="true">
        <svg viewBox="0 0 160 130" width="150" height="122" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect x="30" y="60" width="9" height="50" rx="2" fill="currentColor" opacity=".30"/>
          <path d="M30 60 Q34.5 46 39 60 Z" fill="currentColor" opacity=".30"/>
          <circle cx="34.5" cy="44" r="2.4" fill="var(--color-gold)" opacity=".7"/>
          <rect x="121" y="60" width="9" height="50" rx="2" fill="currentColor" opacity=".30"/>
          <path d="M121 60 Q125.5 46 130 60 Z" fill="currentColor" opacity=".30"/>
          <circle cx="125.5" cy="44" r="2.4" fill="var(--color-gold)" opacity=".7"/>
          <rect x="26" y="108" width="108" height="5" rx="2" fill="currentColor" opacity=".25"/>
          <path d="M48 108 Q48 64 80 50 Q112 64 112 108 Z" fill="currentColor" opacity=".55"/>
          <path d="M70 108 L70 88 Q80 78 90 88 L90 108 Z" fill="var(--color-surface)"/>
          <circle cx="80" cy="42" r="7" fill="var(--color-gold)" opacity=".85"/>
          <circle cx="83" cy="39" r="5" fill="var(--color-surface)"/>
        </svg>
      </div>

      <h2 class="empty-title">{$t('store.empty')}</h2>
      <p class="empty-hint">{$t('store.emptyHint')}</p>

      <!-- Coming-soon teasers -->
      <div class="coming-soon-grid" use:gridIn>
        {#each teasers as teaser}
          <div class="teaser-card glass">
            <span class="teaser-icon">{teaser.icon}</span>
            <div>
              <div class="teaser-name">{teaser.label}</div>
              <div class="teaser-cat">{teaser.cat}</div>
            </div>
            <span class="teaser-badge">{$t('store.comingSoon')}</span>
          </div>
        {/each}
      </div>
    </div>
  {/if}

</div>

<style>
  .page {
    max-width: 56rem;
    margin: 0 auto;
  }

  .page-header {
    margin-block-end: 1.75rem;
  }
  .page-title {
    font-family: 'Playfair Display', Georgia, serif;
    font-size: 1.75rem;
    font-weight: 600;
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
    display: flex;
    align-items: center;
  }
  .search-icon {
    position: absolute;
    inset-inline-start: 0.75rem;
    color: var(--color-ink-muted);
    pointer-events: none;
  }
  .search-input {
    width: 100%;
    padding: 0.5rem 0.75rem;
    padding-inline-start: 2.25rem;
    border-radius: var(--radius-button);
    border: none;
    background: transparent;
    color: var(--color-ink);
    font-size: 0.9375rem;
    outline: none;
    box-sizing: border-box;
  }
  .search-input::placeholder { color: var(--color-ink-faint); }
  .search-wrap:focus-within {
    box-shadow: inset 0 1px 2px rgba(0, 0, 0, 0.25), var(--glow-primary);
  }
  /* Restore a clear keyboard focus ring (the input sets outline:none for the
     wrapper glow; keyboard users still need the visible outline). */
  .search-input:focus-visible {
    outline: 2px solid var(--color-primary);
    outline-offset: 2px;
  }

  /* Category pills */
  .category-row {
    position: relative;
    display: flex;
    gap: 0.5rem;
    flex-wrap: wrap;
    margin-block-end: 1.75rem;
  }
  .category-pill {
    position: relative;
    z-index: 1;
    padding: 0.375rem 0.875rem;
    border-radius: 2rem;
    border: 1px solid var(--glass-border);
    background: var(--glass-bg);
    color: var(--color-ink-muted);
    font-size: 0.8125rem;
    font-weight: 500;
    cursor: pointer;
    transition: color 0.15s ease, border-color 0.15s ease;
  }
  .category-pill:hover {
    border-color: var(--color-primary);
    color: var(--color-primary);
  }
  .category-pill--active {
    border-color: var(--color-primary);
    color: var(--color-primary);
    font-weight: 600;
  }

  /* App grid + skeletons */
  .app-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
    gap: 1rem;
  }
  .app-card-skeleton {
    padding: 1.25rem;
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }
  .skel-icon {
    width: 48px;
    height: 48px;
    border-radius: 0.75rem;
  }
  .skel-line {
    border-radius: 0.375rem;
    height: 0.75rem;
  }
  .skel-line--title { height: 1rem; width: 75%; }
  .skel-line--sub   { width: 55%; }
  .skel-line--btn   { height: 2rem; width: 100%; margin-block-start: 0.5rem; }

  /* Shimmer */
  .shimmer {
    background-image: linear-gradient(
      90deg,
      var(--color-surface-overlay) 0%,
      var(--color-surface-shimmer) 50%,
      var(--color-surface-overlay) 100%
    );
    background-size: 200% 100%;
    animation: shimmer 1.8s ease-in-out infinite;
  }
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
    padding-block: 2.5rem 2rem;
    gap: 0.75rem;
  }
  .empty-icon {
    color: var(--color-primary);
    margin-block-end: 0.75rem;
    opacity: 0.9;
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

  /* Teasers */
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
    opacity: 0.75;
  }
  .teaser-icon { font-size: 1.5rem; flex-shrink: 0; }
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
    .shimmer {
      animation: none;
      background: var(--color-surface-overlay);
    }
  }
</style>

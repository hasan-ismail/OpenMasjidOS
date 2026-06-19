<script lang="ts">
  import { page } from '$app/stores';
  import { fly } from 'svelte/transition';
  import { cubicOut } from 'svelte/easing';
  import { t } from '$lib/i18n';

  $: status = $page.status;
  $: isNotFound = status === 404;

  const prefersReducedMotion =
    typeof window !== 'undefined'
      ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
      : false;
</script>

<div
  class="error-page"
  in:fly={prefersReducedMotion ? { y: 0, duration: 0 } : { y: 24, duration: 450, easing: cubicOut }}
>
  <!-- Masjid dome illustration — rendered in a muted style to match the sad state -->
  <div class="error-illustration" aria-hidden="true">
    <svg viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg" width="72" height="72">
      <rect x="14" y="46" width="7" height="18" rx="1.5" fill="currentColor" opacity="0.35"/>
      <path d="M14 46 Q17.5 39 21 46 Z" fill="currentColor" opacity="0.35"/>
      <rect x="59" y="46" width="7" height="18" rx="1.5" fill="currentColor" opacity="0.35"/>
      <path d="M59 46 Q62.5 39 66 46 Z" fill="currentColor" opacity="0.35"/>
      <rect x="12" y="63" width="56" height="4" rx="1.5" fill="currentColor" opacity="0.3"/>
      <path d="M21 63 Q21 38 40 32 Q59 38 59 63 Z" fill="currentColor" opacity="0.5"/>
      <path d="M33 63 L33 56 Q40 50 47 56 L47 63 Z" fill="var(--color-surface)"/>
      <circle cx="40" cy="28" r="5.5" fill="currentColor" opacity="0.6"/>
      <circle cx="42.5" cy="25.8" r="4" fill="var(--color-surface)"/>
    </svg>
  </div>

  <div class="error-code">{status}</div>

  <h1 class="error-title">
    {isNotFound ? $t('errors.notFound') : $t('errors.serverError')}
  </h1>

  <p class="error-hint">
    {isNotFound ? $t('errors.notFoundHint') : $t('errors.serverErrorHint')}
  </p>

  <a href="/" class="home-link">
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" width="14" height="14" aria-hidden="true">
      <path d="M10 14 L4 8 L10 2"/>
    </svg>
    {$t('errors.goHome')}
  </a>
</div>

<style>
  .error-page {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    text-align: center;
    min-height: 60vh;
    padding: 2rem;
    gap: 0.75rem;
    color: var(--color-primary);
  }

  .error-illustration {
    margin-block-end: 0.5rem;
    opacity: 0.9;
  }

  .error-code {
    font-size: 4rem;
    font-weight: 800;
    color: var(--color-primary);
    line-height: 1;
    letter-spacing: -0.04em;
    opacity: 0.6;
  }

  .error-title {
    font-size: 1.375rem;
    font-weight: 600;
    color: var(--color-ink);
    margin: 0;
    letter-spacing: -0.01em;
  }

  .error-hint {
    font-size: 0.9375rem;
    color: var(--color-ink-muted);
    margin: 0 0 0.75rem;
    max-width: 340px;
  }

  .home-link {
    display: inline-flex;
    align-items: center;
    gap: 0.375rem;
    padding: 0.5rem 1.125rem;
    border-radius: var(--radius-button);
    background: var(--color-primary-subtle);
    color: var(--color-primary);
    font-size: 0.9375rem;
    font-weight: 500;
    text-decoration: none;
    transition: background-color 0.15s ease, transform 0.1s ease;
  }

  .home-link:hover {
    background: rgba(34, 211, 238, 0.18);
    transform: translateX(-2px);
  }

  :global([data-theme="light"]) .home-link:hover {
    background: rgba(2, 132, 199, 0.15);
  }
</style>

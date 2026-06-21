<script lang="ts">
  import { _ } from "svelte-i18n";
  import type { RoadmapItem, RoadmapStatus } from "$lib/roadmap";

  const { items: roadmapItems } = $props<{ items: RoadmapItem[] }>();

  const statusKey: Record<RoadmapStatus, string> = {
    done: "roadmap.status_done",
    progress: "roadmap.status_progress",
    planned: "roadmap.status_planned",
    upcoming: "roadmap.status_upcoming",
  };

  function displayStatus(item: RoadmapItem): RoadmapStatus {
    if (item.status !== "planned") return item.status;
    const isNext =
      roadmapItems.findIndex((i: RoadmapItem) => i.status === "planned") ===
      roadmapItems.indexOf(item);
    return isNext ? "upcoming" : "planned";
  }

  function versionId(v: string) {
    return "v-" + v.replace(/\./g, "-");
  }
</script>

<div class="roadmap-layout">
  <nav class="roadmap-sidebar" aria-label="Roadmap versions">
    <div class="roadmap-sidebar__line" aria-hidden="true"></div>
    {#each roadmapItems as item (item.version)}
      <a href={"#" + versionId(item.version)} class="roadmap-sidebar__link">
        <span class="roadmap-sidebar__version">{item.version}</span>
        <span class="roadmap-sidebar__date">{item.date.replace(" 2026", "")}</span>
      </a>
    {/each}
  </nav>

  <div class="roadmap-main">
    <div class="roadmap-notice" role="note">
      <svg class="mcx-icon" aria-hidden="true" style="flex-shrink:0;width:1.25rem;height:1.25rem"><use href="#i-alert-circle-outline" /></svg>
      <span>{$_('roadmap.notice')}</span>
    </div>

    <div class="roadmap-timeline">
      {#each roadmapItems as item (item.version)}
        {@const st = displayStatus(item)}
        {@const labelKey = statusKey[st]}
        <article class="roadmap-item" id={versionId(item.version)}>
          <div class="roadmap-item__dot" aria-hidden="true" data-status={st}></div>
          <div class="roadmap-item__card">
            <div class="roadmap-item__header">
              <span class="roadmap-badge" data-status={st}>{$_(labelKey)}</span>
              <span class="roadmap-version-pill">v{item.version}</span>
              <span class="roadmap-date">{item.date}</span>
            </div>
            <h3 class="roadmap-item__title">{item.title}</h3>
            <p class="roadmap-item__desc">{item.desc}</p>
            {#if item.features.length}
              <ul class="roadmap-features">
                {#each item.features as feature (feature.text)}
                  <li class:roadmap-feature--highlight={feature.highlight}>{feature.text}</li>
                {/each}
              </ul>
            {/if}
            {#if item.notice}
              <p class="roadmap-card-notice">{item.notice}</p>
            {/if}
          </div>
        </article>
      {/each}
    </div>
  </div>
</div>

<style>
  .roadmap-layout {
    display: flex;
    gap: 2rem;
    max-width: 76rem;
    margin: 0 auto;
    padding: 1.5rem 1.5rem 3rem;
  }

  .roadmap-sidebar {
    display: none;
    flex-shrink: 0;
    width: 6rem;
    position: sticky;
    top: 6rem;
    align-self: start;
    flex-direction: column;
    padding: 0.375rem 0 0.5rem;
  }

  .roadmap-sidebar__line {
    position: absolute;
    top: 0.875rem;
    bottom: 0.5rem;
    left: 0;
    width: 1px;
    border-left: 1px dashed var(--border-strong);
  }

  .roadmap-sidebar__link {
    position: relative;
    display: flex;
    flex-direction: column;
    padding: 0.5rem 0 0.5rem 1rem;
    text-decoration: none;
    scroll-margin-top: 5rem;
  }

  .roadmap-sidebar__version {
    font-size: 0.8125rem;
    font-weight: 700;
    font-variant-numeric: tabular-nums;
    color: var(--text-soft);
    letter-spacing: 0.02em;
    transition: color 0.15s;
  }

  .roadmap-sidebar__link:hover .roadmap-sidebar__version {
    color: var(--text);
  }

  .roadmap-sidebar__date {
    font-size: 0.6875rem;
    color: var(--text-soft);
    margin-top: 0.125rem;
  }

  .roadmap-main {
    flex: 1;
    min-width: 0;
    max-width: 48rem;
  }

  .roadmap-notice {
    display: flex;
    align-items: center;
    gap: 0.625rem;
    margin-bottom: 2.5rem;
    padding: 0.75rem 1rem;
    border-radius: 0.75rem;
    font-size: 0.875rem;
    line-height: 1.5;
    color: var(--text-muted);
    background: color-mix(in srgb, var(--amber-500) 8%, var(--bg-muted));
    border: 1px solid color-mix(in srgb, var(--amber-500) 20%, var(--border));
  }

  .roadmap-timeline {
    position: relative;
    padding: 0 0 3rem;
  }

  .roadmap-timeline::before {
    content: "";
    position: absolute;
    top: 0;
    bottom: 0;
    left: 1.5rem;
    width: 2px;
    background: var(--border);
  }

  .roadmap-item {
    position: relative;
    display: flex;
    gap: 1.25rem;
    padding: 0 0 2.5rem;
  }

  .roadmap-item:last-child {
    padding-bottom: 0;
  }

  .roadmap-item__dot {
    flex-shrink: 0;
    width: 1rem;
    height: 1rem;
    border-radius: 50%;
    margin-top: 0.375rem;
    position: relative;
    z-index: 1;
    left: -0.25rem;
    border: 2px solid var(--border);
    background: var(--bg);
  }

  .roadmap-item__dot[data-status="done"] {
    background: var(--emerald-500);
    border-color: var(--emerald-500);
  }

  .roadmap-item__dot[data-status="progress"] {
    background: var(--blue-500);
    border-color: var(--blue-500);
  }

  .roadmap-item__dot[data-status="planned"] {
    background: var(--bg);
    border-color: var(--text-soft);
  }

  .roadmap-item__dot[data-status="upcoming"] {
    background: var(--orange-500);
    border-color: var(--orange-500);
  }

  .roadmap-item__card {
    flex: 1;
    min-width: 0;
    background: var(--glass-bg);
    border: 1px solid var(--glass-border);
    border-radius: 1rem;
    padding: 1.25rem;
  }

  .roadmap-item__header {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    margin-bottom: 0.5rem;
  }

  .roadmap-version-pill {
    font-size: 0.75rem;
    font-weight: 700;
    font-variant-numeric: tabular-nums;
    color: var(--text-soft);
    background: var(--bg-muted);
    border: 1px solid var(--border);
    padding: 0.125rem 0.5rem;
    border-radius: 0.375rem;
    letter-spacing: 0.02em;
  }

  .roadmap-date {
    font-size: 0.75rem;
    color: var(--text-soft);
    margin-left: auto;
  }

  .roadmap-badge {
    display: inline-block;
    font-size: 0.6875rem;
    font-weight: 800;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    padding: 0.25rem 0.625rem;
    border-radius: 9999px;
  }

  .roadmap-badge[data-status="done"] {
    color: var(--emerald-500);
    background: color-mix(in srgb, var(--emerald-500) 12%, transparent);
  }

  .roadmap-badge[data-status="progress"] {
    color: var(--blue-500);
    background: color-mix(in srgb, var(--blue-500) 12%, transparent);
  }

  .roadmap-badge[data-status="planned"] {
    color: var(--text-soft);
    background: color-mix(in srgb, var(--text-soft) 12%, transparent);
  }

  .roadmap-badge[data-status="upcoming"] {
    color: var(--orange-500);
    background: color-mix(in srgb, var(--orange-500) 12%, transparent);
  }

  .roadmap-item__title {
    margin: 0 0 0.375rem;
    font-size: 1.0625rem;
    font-weight: 700;
    letter-spacing: -0.02em;
  }

  .roadmap-item__desc {
    margin: 0 0 0.75rem;
    font-size: 0.9375rem;
    line-height: 1.65;
    color: var(--text-muted);
  }

  .roadmap-features {
    margin: 0;
    padding: 0;
    list-style: none;
    display: flex;
    flex-direction: column;
    gap: 0.375rem;
  }

  .roadmap-features li {
    position: relative;
    padding-left: 1.25rem;
    font-size: 0.875rem;
    line-height: 1.5;
    color: var(--text-muted);
  }

  .roadmap-features li::before {
    content: "";
    position: absolute;
    left: 0;
    top: 0.625rem;
    width: 0.375rem;
    height: 0.375rem;
    border-radius: 50%;
    background: var(--text-soft);
  }

  .roadmap-feature--highlight {
    color: var(--orange-500);
  }

  .roadmap-feature--highlight::before {
    background: var(--orange-500);
  }

  .roadmap-card-notice {
    margin: 0.75rem 0 0;
    padding: 0.625rem 0.75rem;
    border-radius: 0.5rem;
    font-size: 0.8125rem;
    line-height: 1.5;
    color: var(--orange-400);
    background: color-mix(in srgb, var(--orange-500) 8%, transparent);
    border: 1px solid color-mix(in srgb, var(--orange-500) 15%, transparent);
  }

  .roadmap-item {
    scroll-margin-top: 5rem;
  }

  @media (min-width: 1024px) {
    .roadmap-sidebar {
      display: flex;
    }

    .roadmap-timeline::before {
      left: 50%;
      transform: translateX(-50%);
    }

    .roadmap-item {
      padding: 0 0 3rem;
    }

    .roadmap-item:nth-child(odd) {
      flex-direction: row-reverse;
    }

    .roadmap-item__dot {
      position: absolute;
      left: 50%;
      transform: translateX(-50%);
      top: 0.5rem;
      width: 1.25rem;
      height: 1.25rem;
      margin-top: 0;
    }

    .roadmap-item__card {
      width: calc(50% - 2.5rem);
    }

    .roadmap-item:nth-child(odd) .roadmap-item__card {
      text-align: left;
    }

    .roadmap-item:nth-child(odd) .roadmap-item__header {
      justify-content: flex-start;
    }
  }
</style>

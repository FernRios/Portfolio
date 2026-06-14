<script setup lang="ts">
import type { Project } from '../api';

const props = defineProps<{ project: Project }>();

const langColors: Record<string, string> = {
  JavaScript: '#e9c047',
  TypeScript: '#3a7bd0',
  Python: '#4b8bbe',
  Vue: '#41b883',
  HTML: '#e3603b',
  CSS: '#5b4bd0',
  Go: '#4fc3d9',
  Rust: '#c98a52',
  Java: '#c0732f',
  'C++': '#8a6fb0',
  Shell: '#6aa84f',
};

function langDot(lang: string | null): string {
  if (!lang) return 'var(--faint)';
  return langColors[lang] ?? 'var(--muted)';
}

function updatedLabel(iso: string): string {
  const then = new Date(iso).getTime();
  const days = Math.round((Date.now() - then) / 86_400_000);
  if (days <= 0) return 'today';
  if (days === 1) return 'yesterday';
  if (days < 30) return days + 'd ago';
  if (days < 365) return Math.round(days / 30) + 'mo ago';
  return Math.round(days / 365) + 'y ago';
}

const p = props.project;
</script>

<template>
  <article class="card">
    <a class="card-main" :href="p.url" target="_blank" rel="noopener noreferrer">
      <h3 class="name">{{ p.name }}</h3>
      <p class="desc">{{ p.description || 'No description yet.' }}</p>
    </a>

    <ul v-if="p.topics.length" class="topics">
      <li v-for="t in p.topics.slice(0, 4)" :key="t" class="topic">{{ t }}</li>
    </ul>

    <div class="spec mono">
      <span v-if="p.language" class="spec-item">
        <span class="dot" :style="{ background: langDot(p.language) }"></span>
        {{ p.language }}
      </span>
      <span class="spec-item" title="Stars">&#9733; {{ p.stars }}</span>
      <span class="spec-item" title="Forks">&#10547; {{ p.forks }}</span>
      <span class="spec-item spec-time">{{ updatedLabel(p.updatedAt) }}</span>
      <a
        v-if="p.homepage"
        class="spec-live"
        :href="p.homepage"
        target="_blank"
        rel="noopener noreferrer"
        >live &#8599;</a
      >
    </div>
  </article>
</template>

<style scoped>
.card {
  display: flex;
  flex-direction: column;
  background: var(--surface);
  border: 1px solid var(--hairline);
  border-radius: var(--radius);
  padding: 1.25rem 1.25rem 1rem;
  transition: transform 0.18s var(--ease), border-color 0.18s var(--ease);
}
.card:hover {
  transform: translateY(-3px);
  border-color: var(--accent);
}
.card-main {
  display: block;
  flex: 1;
}
.name {
  margin: 0 0 0.4rem;
  font-family: var(--font-display);
  font-weight: 600;
  font-size: 1.15rem;
  letter-spacing: -0.01em;
  word-break: break-word;
}
.card:hover .name {
  color: var(--accent);
}
.desc {
  margin: 0;
  color: var(--muted);
  font-size: 0.92rem;
  line-height: 1.5;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
.topics {
  list-style: none;
  margin: 0.9rem 0 0;
  padding: 0;
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem;
}
.topic {
  font-family: var(--font-mono);
  font-size: 0.7rem;
  color: var(--muted);
  background: var(--accent-soft);
  padding: 0.15rem 0.5rem;
  border-radius: 5px;
}
.spec {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 0.9rem;
  margin-top: 1rem;
  padding-top: 0.85rem;
  border-top: 1px solid var(--hairline);
  color: var(--muted);
}
.spec-item {
  display: inline-flex;
  align-items: center;
  gap: 0.35em;
  white-space: nowrap;
}
.spec-time {
  color: var(--faint);
}
.dot {
  width: 9px;
  height: 9px;
  border-radius: 50%;
  display: inline-block;
}
.spec-live {
  margin-left: auto;
  color: var(--accent);
  font-weight: 500;
}
.spec-live:hover {
  text-decoration: underline;
}
</style>

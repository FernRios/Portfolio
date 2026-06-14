<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { fetchPortfolio, type Profile, type Project } from './api';
import ProjectCard from './components/ProjectCard.vue';
import ContactForm from './components/ContactForm.vue';

// Edit this line to set your own tagline. Your name, bio, and avatar
// are pulled live from GitHub, so there's nothing to hardcode there.
const TAGLINE = 'Things I build, pulled straight from GitHub.';

const loading = ref(true);
const error = ref('');
const profile = ref<Profile | null>(null);
const projects = ref<Project[]>([]);

const search = ref('');
const activeLang = ref<string | null>(null);
const sort = ref<'stars' | 'recent'>('stars');

const displayName = computed(
  () => profile.value?.name || profile.value?.login || 'FernRios'
);

const languages = computed(() => {
  const counts = new Map<string, number>();
  for (const p of projects.value) {
    if (p.language) counts.set(p.language, (counts.get(p.language) ?? 0) + 1);
  }
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([lang]) => lang);
});

const visible = computed(() => {
  const q = search.value.toLowerCase().trim();
  let list = projects.value.filter((p) => {
    const matchesLang = !activeLang.value || p.language === activeLang.value;
    const haystack = (
      p.name +
      ' ' +
      (p.description ?? '') +
      ' ' +
      p.topics.join(' ')
    ).toLowerCase();
    const matchesQuery = !q || haystack.includes(q);
    return matchesLang && matchesQuery;
  });
  list = [...list].sort((a, b) =>
    sort.value === 'stars'
      ? b.stars - a.stars || b.updatedAt.localeCompare(a.updatedAt)
      : b.updatedAt.localeCompare(a.updatedAt)
  );
  return list;
});

function toggleLang(lang: string) {
  activeLang.value = activeLang.value === lang ? null : lang;
}

onMounted(async () => {
  try {
    const data = await fetchPortfolio();
    profile.value = data.profile;
    projects.value = data.projects;
  } catch (err) {
    error.value =
      err instanceof Error ? err.message : 'Could not load projects.';
  } finally {
    loading.value = false;
  }
});
</script>

<template>
  <header class="topbar">
    <div class="wrap topbar-inner">
      <a class="handle mono" :href="profile?.htmlUrl || 'https://github.com/FernRios'" target="_blank" rel="noopener noreferrer">
        @{{ profile?.login || 'FernRios' }}
      </a>
      <nav class="topbar-actions">
        <a class="btn-ghost" :href="profile?.htmlUrl || 'https://github.com/FernRios'" target="_blank" rel="noopener noreferrer">GitHub</a>
        <a class="btn-accent" href="/resume.pdf" download>
          Download r&eacute;sum&eacute;
        </a>
      </nav>
    </div>
  </header>

  <main class="wrap">
    <!-- Hero -->
    <section class="hero">
      <img
        v-if="profile?.avatarUrl"
        class="avatar"
        :src="profile.avatarUrl"
        :alt="displayName + ' avatar'"
        width="84"
        height="84"
      />
      <div>
        <p class="eyebrow">Portfolio</p>
        <h1 class="title">{{ displayName }}</h1>
        <p class="tagline">{{ profile?.bio || TAGLINE }}</p>
        <p v-if="profile" class="stats mono">
          {{ profile.publicRepos }} public repos &middot;
          {{ profile.followers }} followers
        </p>
      </div>
    </section>

    <!-- Controls -->
    <section v-if="!loading && !error && projects.length" class="controls">
      <input
        v-model="search"
        class="search"
        type="search"
        placeholder="Search projects&hellip;"
        aria-label="Search projects"
      />
      <div class="filters" role="group" aria-label="Filter by language">
        <button
          v-for="lang in languages"
          :key="lang"
          class="chip mono"
          :class="{ active: activeLang === lang }"
          @click="toggleLang(lang)"
        >
          {{ lang }}
        </button>
      </div>
      <div class="sort">
        <button
          class="chip mono"
          :class="{ active: sort === 'stars' }"
          @click="sort = 'stars'"
        >
          &#9733; stars
        </button>
        <button
          class="chip mono"
          :class="{ active: sort === 'recent' }"
          @click="sort = 'recent'"
        >
          recent
        </button>
      </div>
    </section>

    <!-- States -->
    <p v-if="loading" class="status mono">Loading projects from GitHub&hellip;</p>

    <div v-else-if="error" class="status status-error">
      <p class="mono">{{ error }}</p>
      <p class="status-hint">
        If you're running locally, add a <code>GITHUB_TOKEN</code> to the
        backend's <code>.env</code> &mdash; GitHub rate-limits unauthenticated
        requests to 60/hour.
      </p>
    </div>

    <p v-else-if="!visible.length" class="status mono">
      No projects match that filter.
    </p>

    <!-- Grid -->
    <section v-else class="grid">
      <ProjectCard
        v-for="(p, i) in visible"
        :key="p.id"
        :project="p"
        class="grid-item"
        :style="{ animationDelay: Math.min(i, 8) * 40 + 'ms' }"
      />
    </section>

    <!-- Contact -->
    <section class="contact-section">
      <p class="eyebrow">Get in touch</p>
      <h2 class="section-title">Start a conversation</h2>
      <ContactForm />
    </section>
  </main>

  <footer class="footer wrap">
    <p class="mono">
      Built with Vue + Node &middot; project data live from the GitHub API
    </p>
  </footer>
</template>

<style scoped>
.topbar {
  position: sticky;
  top: 0;
  z-index: 10;
  background: color-mix(in srgb, var(--bg) 88%, transparent);
  backdrop-filter: blur(8px);
  border-bottom: 1px solid var(--hairline);
}
.topbar-inner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 64px;
}
.handle {
  color: var(--muted);
}
.handle:hover {
  color: var(--ink);
}
.topbar-actions {
  display: flex;
  gap: 0.6rem;
}

.hero {
  display: flex;
  gap: 1.5rem;
  align-items: center;
  padding: 3.5rem 0 2.5rem;
}
.avatar {
  border-radius: 14px;
  border: 1px solid var(--hairline);
  flex-shrink: 0;
}
.title {
  margin: 0.3rem 0 0.5rem;
  font-family: var(--font-display);
  font-weight: 700;
  font-size: clamp(2rem, 6vw, 3.1rem);
  line-height: 1.04;
  letter-spacing: -0.03em;
}
.tagline {
  margin: 0 0 0.6rem;
  color: var(--muted);
  font-size: 1.05rem;
  max-width: 44ch;
}
.stats {
  margin: 0;
  color: var(--faint);
}

.controls {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.75rem;
  padding: 0.5rem 0 1.75rem;
  border-bottom: 1px solid var(--hairline);
  margin-bottom: 1.75rem;
}
.search {
  font: inherit;
  flex: 1 1 220px;
  min-width: 0;
  color: var(--ink);
  background: var(--surface);
  border: 1px solid var(--hairline);
  border-radius: var(--radius);
  padding: 0.6rem 0.85rem;
}
.search:focus {
  outline: none;
  border-color: var(--accent);
}
.filters,
.sort {
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem;
}
.chip {
  background: transparent;
  border: 1px solid var(--hairline);
  color: var(--muted);
  border-radius: 999px;
  padding: 0.35rem 0.7rem;
  transition: all 0.15s var(--ease);
}
.chip:hover {
  border-color: var(--muted);
  color: var(--ink);
}
.chip.active {
  background: var(--accent);
  border-color: var(--accent);
  color: var(--on-accent);
}

.grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(290px, 1fr));
  gap: 1rem;
}
.grid-item {
  animation: rise 0.5s var(--ease) both;
}
@keyframes rise {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.status {
  padding: 3rem 0;
  color: var(--muted);
}
.status-error {
  padding: 2.5rem 0;
}
.status-hint {
  color: var(--faint);
  font-size: 0.9rem;
  max-width: 52ch;
}
code {
  font-family: var(--font-mono);
  font-size: 0.85em;
  background: var(--accent-soft);
  padding: 0.1em 0.35em;
  border-radius: 4px;
}

.contact-section {
  margin: 4.5rem 0 1rem;
  padding-top: 2.5rem;
  border-top: 1px solid var(--hairline);
}
.section-title {
  margin: 0.3rem 0 1.5rem;
  font-family: var(--font-display);
  font-weight: 600;
  font-size: clamp(1.5rem, 4vw, 2rem);
  letter-spacing: -0.02em;
}

.footer {
  padding: 2.5rem 24px 3rem;
  color: var(--faint);
}

@media (max-width: 560px) {
  .hero {
    flex-direction: column;
    align-items: flex-start;
    gap: 1rem;
    padding-top: 2.5rem;
  }
}
</style>

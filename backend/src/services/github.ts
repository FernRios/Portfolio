import { getCached, setCached } from '../lib/cache';

// Why this file exists:
// The browser is rate-limited to 60 GitHub API requests/hour and can't safely
// hold a token (anything in frontend code is public). So we fetch here instead,
// where the token stays secret (raising the limit to 5,000/hour) and the result
// is cached for an hour so the page stays fast and we don't hammer GitHub.

const USERNAME = process.env.GITHUB_USERNAME || 'FernRios';
const TOKEN = process.env.GITHUB_TOKEN;
const CACHE_TTL_MS = 1000 * 60 * 60; // 1 hour

export type Profile = {
  login: string;
  name: string | null;
  bio: string | null;
  avatarUrl: string;
  htmlUrl: string;
  followers: number;
  publicRepos: number;
};

export type Project = {
  id: number;
  name: string;
  description: string | null;
  url: string;
  homepage: string | null;
  language: string | null;
  stars: number;
  forks: number;
  topics: string[];
  updatedAt: string;
};

function githubHeaders(): Record<string, string> {
  const headers: Record<string, string> = {
    Accept: 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
    'User-Agent': 'fern-portfolio',
  };
  if (TOKEN) headers.Authorization = `Bearer ${TOKEN}`;
  return headers;
}

export async function getProfile(): Promise<Profile> {
  const cacheKey = `profile:${USERNAME}`;
  const cached = getCached<Profile>(cacheKey);
  if (cached) return cached;

  const res = await fetch(`https://api.github.com/users/${USERNAME}`, {
    headers: githubHeaders(),
  });
  if (!res.ok) throw new Error(`GitHub profile request failed: ${res.status}`);

  const raw = (await res.json()) as Record<string, unknown>;
  const profile: Profile = {
    login: String(raw.login),
    name: (raw.name as string) ?? null,
    bio: (raw.bio as string) ?? null,
    avatarUrl: String(raw.avatar_url),
    htmlUrl: String(raw.html_url),
    followers: Number(raw.followers ?? 0),
    publicRepos: Number(raw.public_repos ?? 0),
  };

  setCached(cacheKey, profile, CACHE_TTL_MS);
  return profile;
}

export async function getProjects(): Promise<Project[]> {
  const cacheKey = `repos:${USERNAME}`;
  const cached = getCached<Project[]>(cacheKey);
  if (cached) return cached;

  const res = await fetch(
    `https://api.github.com/users/${USERNAME}/repos?per_page=100&sort=updated`,
    { headers: githubHeaders() }
  );
  if (!res.ok) throw new Error(`GitHub repos request failed: ${res.status}`);

  const raw = (await res.json()) as Array<Record<string, unknown>>;
  const projects: Project[] = raw
    // Hide forks and archived repos — a portfolio should show your own active work.
    .filter((r) => !r.fork && !r.archived)
    .map((r) => ({
      id: Number(r.id),
      name: String(r.name),
      description: (r.description as string) ?? null,
      url: String(r.html_url),
      homepage: (r.homepage as string) || null,
      language: (r.language as string) ?? null,
      stars: Number(r.stargazers_count ?? 0),
      forks: Number(r.forks_count ?? 0),
      topics: (r.topics as string[]) ?? [],
      updatedAt: String(r.updated_at),
    }))
    // Most-starred first, then most-recently updated.
    .sort((a, b) => b.stars - a.stars || b.updatedAt.localeCompare(a.updatedAt));

  setCached(cacheKey, projects, CACHE_TTL_MS);
  return projects;
}

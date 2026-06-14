import type { Context } from "@netlify/functions";

const USERNAME = process.env.GITHUB_USERNAME || "FernRios";
const TOKEN = process.env.GITHUB_TOKEN;
const CACHE_TTL_MS = 1000 * 60 * 60;

type Profile = { login: string; name: string | null; bio: string | null; avatarUrl: string; htmlUrl: string; followers: number; publicRepos: number; };
type Project = { id: number; name: string; description: string | null; url: string; homepage: string | null; language: string | null; stars: number; forks: number; topics: string[]; updatedAt: string; };

// Module-level cache: persists only while the function container stays warm.
const store = new Map<string, { value: unknown; expiresAt: number }>();
function getCached<T>(key: string): T | null {
  const e = store.get(key);
  if (!e) return null;
  if (Date.now() > e.expiresAt) { store.delete(key); return null; }
  return e.value as T;
}
function setCached<T>(key: string, value: T, ttlMs: number) {
  store.set(key, { value, expiresAt: Date.now() + ttlMs });
}

function githubHeaders(): Record<string, string> {
  const h: Record<string, string> = {
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
    "User-Agent": "fern-portfolio",
  };
  if (TOKEN) h.Authorization = `Bearer ${TOKEN}`;
  return h;
}

async function getProfile(): Promise<Profile> {
  const key = `profile:${USERNAME}`;
  const cached = getCached<Profile>(key);
  if (cached) return cached;
  const res = await fetch(`https://api.github.com/users/${USERNAME}`, { headers: githubHeaders() });
  if (!res.ok) throw new Error(`GitHub profile request failed: ${res.status}`);
  const raw = (await res.json()) as Record<string, unknown>;
  const profile: Profile = {
    login: String(raw.login), name: (raw.name as string) ?? null, bio: (raw.bio as string) ?? null,
    avatarUrl: String(raw.avatar_url), htmlUrl: String(raw.html_url),
    followers: Number(raw.followers ?? 0), publicRepos: Number(raw.public_repos ?? 0),
  };
  setCached(key, profile, CACHE_TTL_MS);
  return profile;
}

async function getProjects(): Promise<Project[]> {
  const key = `repos:${USERNAME}`;
  const cached = getCached<Project[]>(key);
  if (cached) return cached;
  const res = await fetch(`https://api.github.com/users/${USERNAME}/repos?per_page=100&sort=updated`, { headers: githubHeaders() });
  if (!res.ok) throw new Error(`GitHub repos request failed: ${res.status}`);
  const raw = (await res.json()) as Array<Record<string, unknown>>;
  const projects: Project[] = raw
    .filter((r) => !r.fork && !r.archived)
    .map((r) => ({
      id: Number(r.id), name: String(r.name), description: (r.description as string) ?? null,
      url: String(r.html_url), homepage: (r.homepage as string) || null, language: (r.language as string) ?? null,
      stars: Number(r.stargazers_count ?? 0), forks: Number(r.forks_count ?? 0),
      topics: (r.topics as string[]) ?? [], updatedAt: String(r.updated_at),
    }))
    .sort((a, b) => b.stars - a.stars || b.updatedAt.localeCompare(a.updatedAt));
  setCached(key, projects, CACHE_TTL_MS);
  return projects;
}

export default async (_req: Request, _context: Context) => {
  try {
    const [p, r] = await Promise.allSettled([getProfile(), getProjects()]);
    const projects = r.status === "fulfilled" ? r.value : null;
    if (projects === null)
      return Response.json({ error: "Could not load projects from GitHub right now." }, { status: 502 });
    const profile = p.status === "fulfilled" ? p.value : null;
    return Response.json({ profile, projects });
  } catch (err) {
    console.error("[projects]", err);
    return Response.json({ error: "Could not load projects from GitHub right now." }, { status: 502 });
  }
};
// Talks to the backend. In dev, calls go to /api/* and Vite proxies them to
// the API. In production, set VITE_API_BASE to your deployed API origin.

const BASE = import.meta.env.VITE_API_BASE ?? '';

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

export type PortfolioData = {
  profile: Profile | null;
  projects: Project[];
};

export async function fetchPortfolio(): Promise<PortfolioData> {
  const res = await fetch(`${BASE}/api/projects`);
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || `Request failed (${res.status})`);
  }
  return res.json();
}

export type ContactPayload = { name: string; email: string; message: string };

export async function sendContact(
  payload: ContactPayload
): Promise<{ ok: boolean; delivered?: boolean }> {
  const res = await fetch(`${BASE}/api/contact`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || 'Could not send your message.');
  return data;
}

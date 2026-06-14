import { Router } from 'express';
import { getProfile, getProjects } from '../services/github';

const router = Router();

// GET /api/projects -> { profile, projects }
// Both come from GitHub (cached). We fetch them in parallel and degrade
// gracefully: if the profile call fails, we still return the projects.
router.get('/', async (_req, res) => {
  try {
    const [profileResult, projectsResult] = await Promise.allSettled([
      getProfile(),
      getProjects(),
    ]);

    const projects =
      projectsResult.status === 'fulfilled' ? projectsResult.value : null;

    if (projects === null) {
      return res
        .status(502)
        .json({ error: 'Could not load projects from GitHub right now.' });
    }

    const profile =
      profileResult.status === 'fulfilled' ? profileResult.value : null;

    res.json({ profile, projects });
  } catch (err) {
    console.error('[projects]', err);
    res.status(502).json({ error: 'Could not load projects from GitHub right now.' });
  }
});

export default router;

import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import projectsRouter from './routes/projects';
import contactRouter from './routes/contact';

const app = express();
const PORT = Number(process.env.PORT) || 3000;

// In development the Vite dev server proxies /api to here, so CORS isn't needed.
// In production your frontend lives on a different origin, so allow it explicitly.
app.use(cors({ origin: process.env.CORS_ORIGIN || '*' }));
app.use(express.json());

app.get('/api/health', (_req, res) => {
  res.json({ ok: true });
});

app.use('/api/projects', projectsRouter);
app.use('/api/contact', contactRouter);

app.listen(PORT, () => {
  console.log(`API listening on http://localhost:${PORT}`);
});

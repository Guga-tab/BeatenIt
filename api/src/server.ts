import 'dotenv/config';
import express, { NextFunction, Request, RequestHandler, Response } from 'express';
import path from 'path';
import * as games from './sheets';

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, '..', 'public'))); 

const asyncHandler =
  (fn: (req: Request, res: Response) => Promise<unknown>): RequestHandler =>
  (req, res, next) => {
    fn(req, res).catch(next);
  };

app.get('/api/games', asyncHandler(async (req, res) => {
  let list = await games.list();
  const search = String(req.query.search ?? '').toLowerCase();
  if (search) {
    list = list.filter((g) => Object.values(g).some((v) => String(v).toLowerCase().includes(search)));
  }
  res.json(list);
}));

app.get('/api/games/:id', asyncHandler(async (req, res) => {
  const game = await games.getById(Number(req.params.id));
  if (!game) return res.status(404).json({ error: 'Game not found' });
  res.json(game);
}));

app.post('/api/games', asyncHandler(async (req, res) => {
  res.status(201).json(await games.create(req.body));
}));

app.put('/api/games/:id', asyncHandler(async (req, res) => {
  const game = await games.update(Number(req.params.id), req.body);
  if (!game) return res.status(404).json({ error: 'Game not found' });
  res.json(game);
}));

app.delete('/api/games/:id', asyncHandler(async (req, res) => {
  const deleted = await games.remove(Number(req.params.id));
  if (!deleted) return res.status(404).json({ error: 'Game not found' });
  res.status(204).end();
}));

app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error(err);
  res.status(500).json({ error: err.message });
});

const port = Number(process.env.PORT ?? 3000);
app.listen(port, () => console.log(`Server running at http://localhost:${port}`));
import 'dotenv/config';
import express, { NextFunction, Request, RequestHandler, Response } from 'express';
import path from 'path';
import * as jogos from './sheets';

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, '..', 'public'))); // front end entra aqui

// Repassa erros de funções async para o handler de erros
const assíncrono =
  (fn: (req: Request, res: Response) => Promise<unknown>): RequestHandler =>
  (req, res, next) => {
    fn(req, res).catch(next);
  };

app.get('/api/jogos', assíncrono(async (req, res) => {
  let lista = await jogos.listar();
  const busca = String(req.query.busca ?? '').toLowerCase();
  if (busca) {
    lista = lista.filter((j) => Object.values(j).some((v) => String(v).toLowerCase().includes(busca)));
  }
  res.json(lista);
}));

app.get('/api/jogos/:id', assíncrono(async (req, res) => {
  const jogo = await jogos.buscar(Number(req.params.id));
  if (!jogo) return res.status(404).json({ erro: 'Jogo não encontrado' });
  res.json(jogo);
}));

app.post('/api/jogos', assíncrono(async (req, res) => {
  res.status(201).json(await jogos.criar(req.body));
}));

app.put('/api/jogos/:id', assíncrono(async (req, res) => {
  const jogo = await jogos.atualizar(Number(req.params.id), req.body);
  if (!jogo) return res.status(404).json({ erro: 'Jogo não encontrado' });
  res.json(jogo);
}));

app.delete('/api/jogos/:id', assíncrono(async (req, res) => {
  const ok = await jogos.remover(Number(req.params.id));
  if (!ok) return res.status(404).json({ erro: 'Jogo não encontrado' });
  res.status(204).end();
}));

app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error(err);
  res.status(500).json({ erro: err.message });
});

const porta = Number(process.env.PORT ?? 3000);
app.listen(porta, () => console.log(`Servidor em http://localhost:${porta}`));

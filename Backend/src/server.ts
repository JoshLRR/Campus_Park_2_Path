import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import graphRouter from './routes/graph';

dotenv.config();

const app = express();
const port = process.env.PORT ?? 3001;

app.use(cors());
app.use(express.json());

app.get('/api/health', (_req, res) => {
  res.json({status: 'ok'});
});

app.use('/api/graph', graphRouter);

app.listen(port, () => {
  console.log(`CPP backend running on http://localhost:${port}`);
});

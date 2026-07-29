import express, { Request, Response } from 'express';
import cors from 'cors';
import { db } from './config/data-source';
import crudRouter from './routes/crud.route';

const app = express();

app.use(cors());
app.use(express.json());

// Endpoint GET /health
app.get('/health', async (req: Request, res: Response) => {
  try {
    // Ping DB thật với Knex
    await db.raw('SELECT 1');

    return res.status(200).json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      database: 'connected',
    });
  } catch (error) {
    return res.status(503).json({
      status: 'error',
      timestamp: new Date().toISOString(),
      database: 'disconnected',
    });
  }
});

app.use('/', crudRouter)

export default app;
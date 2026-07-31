import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import swaggerUi from 'swagger-ui-express';
import { db } from './config/data-source';
import { swaggerSpec } from './config/swagger';
import crudRouter from './routes/crud.route';
import authRouter from './routes/auth.route';
import { globalErrorHandler } from './middlewares/error.middleware';

const app = express();

app.use(cors());
app.use(express.json());

// ─── Swagger UI ───────────────────────────────
// Giao diện: http://localhost:3000/api-docs
// Raw JSON:  http://localhost:3000/api-docs.json
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  customSiteTitle: 'Smart API Hub – Docs',
  customCss: '.swagger-ui .topbar { background-color: #1a1a2e; }',
  swaggerOptions: { persistAuthorization: true },
}));

app.get('/api-docs.json', (req: Request, res: Response) => {
  res.setHeader('Content-Type', 'application/json');
  res.send(swaggerSpec);
});

app.get('/health', async (req: Request, res: Response) => {
  try {
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

app.use('/auth', authRouter);
app.use('/', crudRouter);

app.use((req: Request, res: Response) => {
  res.status(404).json({ error: `Route '${req.method} ${req.path}' không tồn tại.` });
});

app.use(globalErrorHandler);

export default app;
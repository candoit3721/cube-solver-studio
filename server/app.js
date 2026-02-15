import express from 'express';
import cors from 'cors';
import swaggerUi from 'swagger-ui-express';
import { swaggerSpec } from './swagger.js';
import healthRouter from './routes/health.js';
import validateRouter from './routes/validate.js';
import solveRouter from './routes/solve.js';
import { errorHandler } from './middleware/errorHandler.js';
import { requestLogger } from './middleware/requestLogger.js';

export function createApp() {
  const app = express();

  app.use(cors());
  app.use(express.json());
  app.use(requestLogger);

  app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

  app.use(healthRouter);
  app.use(validateRouter);
  app.use(solveRouter);

  app.use(errorHandler);

  return app;
}

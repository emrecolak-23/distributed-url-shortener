import express, { Router, Application } from 'express';
import { container } from 'tsyringe';
import { HealthRoute } from '@notification-service/routes/health.route';

const router: Router = express.Router();

const healthRoutes = container.resolve(HealthRoute);

export function appRoutes(app: Application): Router {
  app.use('', healthRoutes.routes());

  return router;
}

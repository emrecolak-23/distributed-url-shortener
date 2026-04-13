import { Application } from 'express';
import { HealthRoute } from '@auth-service/routes/health.route';
import { container } from 'tsyringe';

const healthRoutes = container.resolve(HealthRoute);

// const BASE_PATH = '/api/v1/auth';

export const appRoutes = (app: Application) => {
  app.use('', healthRoutes.routes());
};

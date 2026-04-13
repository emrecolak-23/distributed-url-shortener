import { Application } from 'express';
import { container } from 'tsyringe';
import { HealthRoute } from '@url-generate-service/routes/health.route';

// const BASE_PATH = '/api/v1/url-generate';

export const appRoutes = (app: Application) => {
  const healthRoutes = container.resolve(HealthRoute);
  app.use('', healthRoutes.routes());
};

import { Application } from 'express';
import { container } from 'tsyringe';
import { HealthRoute } from './health.route';

// const BASE_PATH = '/api/gateway/v1';

export const appRoutes = (app: Application) => {
  const healthRoute = container.resolve(HealthRoute);

  app.use('', healthRoute.routes());
};

import { Application } from 'express';
import { container } from 'tsyringe';
import { HealthRoute } from './health.route';
import { AuthRoute } from './auth.route';

const BASE_PATH = '/api/gateway/v1';

export const appRoutes = (app: Application) => {
  const healthRoute = container.resolve(HealthRoute);
  const authRoute = container.resolve(AuthRoute);

  app.use('', healthRoute.routes());
  app.use(`${BASE_PATH}/auth`, authRoute.routes());
};

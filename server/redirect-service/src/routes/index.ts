import { Application } from 'express';
import { container } from 'tsyringe';
import { HealthRoute } from '@redirect-service/routes/health.route';
import { RedirectRoute } from '@redirect-service/routes/redirect.route';

const BASE_PATH = '/api/v1/redirect';

export const appRoutes = (app: Application) => {
  const healthRoutes = container.resolve(HealthRoute);
  app.use('', healthRoutes.routes());
  const redirectRoutes = container.resolve(RedirectRoute);
  app.use(BASE_PATH, redirectRoutes.routes());
};

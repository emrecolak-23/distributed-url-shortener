import { Application } from 'express';
import { container } from 'tsyringe';
import { HealthRoute } from '@url-generate-service/routes/health.route';
import { UrlGenerateRoute } from '@url-generate-service/routes/url-generate.route';

const BASE_PATH = '/api/v1/url-generate';

export const appRoutes = (app: Application) => {
  const healthRoutes = container.resolve(HealthRoute);
  const urlGenerateRoutes = container.resolve(UrlGenerateRoute);
  app.use('', healthRoutes.routes());
  app.use(BASE_PATH, urlGenerateRoutes.routes());
};

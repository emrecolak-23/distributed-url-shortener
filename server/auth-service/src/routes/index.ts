import { Application } from 'express';
import { HealthRoute } from '@auth-service/routes/health.route';
import { container } from 'tsyringe';
import { AuthRoutes } from '@auth-service/routes/auth.route';

const healthRoutes = container.resolve(HealthRoute);
const authRoutes = container.resolve(AuthRoutes);

const BASE_PATH = '/api/v1/auth';

export const appRoutes = (app: Application) => {
  app.use('', healthRoutes.routes());
  app.use(BASE_PATH, authRoutes.routes());
};

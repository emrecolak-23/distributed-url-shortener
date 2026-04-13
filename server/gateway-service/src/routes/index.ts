import { Application } from 'express';
import { container } from 'tsyringe';
import { HealthRoute } from './health.route';
import { AuthRoute } from './auth.route';
import { CurrentUserRoute } from './current-user.route';
import { AuthMiddleware } from '@gateway-service/middlewares';

const BASE_PATH = '/api/gateway/v1';

export const appRoutes = (app: Application) => {
  const healthRoute = container.resolve(HealthRoute);
  const authRoute = container.resolve(AuthRoute);
  const currentUserRoute = container.resolve(CurrentUserRoute);
  const authMiddleware = container.resolve(AuthMiddleware);
  app.use('', healthRoute.routes());
  app.use(`${BASE_PATH}/auth`, authRoute.routes());

  app.use(
    `${BASE_PATH}/auth`,
    authMiddleware.verifyUser.bind(authMiddleware),
    authMiddleware.checkAuthentication.bind(authMiddleware),
    currentUserRoute.routes()
  );
};

import { BadRequestError } from '@emrecolak-23/jobber-share';
import { Request, Response, NextFunction, RequestHandler } from 'express';
import { ObjectSchema } from 'joi';
import { injectable, singleton } from 'tsyringe';

@singleton()
@injectable()
export class ValidateMiddleware {
  private validateRequest(schema: ObjectSchema, data: Record<string, unknown>, req: Request, validationType: 'body' | 'params'): void {
    const path = req.url.split('/')[1];
    const { value, error } = schema.validate(data);

    if (error) {
      const errorMessage = error.details.map((detail) => detail.message).join(', ');
      throw new BadRequestError(
        errorMessage,
        `AuthService ValidateMiddleware for ${path} route validate${validationType === 'body' ? '()' : 'Params()'} method error`
      );
    }

    Object.assign(req, value);
  }

  validate(schema: ObjectSchema): RequestHandler {
    return async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
      this.validateRequest(schema, req.body, req, 'body');
      next();
    };
  }

  validateParams(schema: ObjectSchema): RequestHandler {
    return async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
      this.validateRequest(schema, req.params, req, 'params');
      next();
    };
  }
}

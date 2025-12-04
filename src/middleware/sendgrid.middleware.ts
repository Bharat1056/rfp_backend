import { NextFunction, Request, Response } from 'express';

export const verifySendGridWebhook = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  next();
};

import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export const validateToken = (req: Request, res: Response, next: NextFunction): void => {
  const token = req.headers?.authorization?.split(' ')[1];
  if (!token) {
    res.status(401).json({ isValid: false, message: 'Unauthorized' });
    return;
  }

  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET as string) as any;
    next();
  } catch {
    res.status(401).json({ isValid: false, message: 'Unauthorized' });
  }
};

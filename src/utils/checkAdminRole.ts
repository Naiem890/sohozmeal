import { Request, Response, NextFunction } from 'express';

export const checkAdminRole = (req: Request, res: Response, next: NextFunction): void => {
  const user = req.user;

  if (user && user.role === 'admin') {
    next();
  } else {
    res.status(403).json({ message: 'Access denied. You are not an admin.' });
  }
};

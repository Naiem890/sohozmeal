import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const JWT_SECRET = 'your_jwt_secret_key';

const staffAuthMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  const token = req.headers['authorization'] as string | undefined;

  if (!token) {
    res.status(403).json({ error: 'No token provided' });
    return;
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.staff = decoded as any;
    next();
  } catch (err) {
    res.status(401).json({ error: 'Invalid token' });
  }
};

export default staffAuthMiddleware;

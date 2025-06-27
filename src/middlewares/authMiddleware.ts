import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'secretdevtest';

export const authMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    res.status(401).json({ message: 'Token manquant' });
    return;
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: number; role: string };
    // On attache l'user au req pour la suite
    (req as any).user = decoded;
    next(); // Très important : appeler next() pour dire que le middleware est OK
  } catch (error) {
    res.status(401).json({ message: 'Token invalide' });
  }
};

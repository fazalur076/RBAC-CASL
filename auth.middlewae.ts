import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { defineAbilitiesFor, Actions, Subjects } from './abilities';
import { ForbiddenError } from '@casl/ability';

interface AuthenticatedRequest extends Request {
  decodedToken?: { userId: number, role: string };
}

const validateToken = (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
  try {
    const authorizationHeader = req.headers['authorization'];
    if (!authorizationHeader) {
      throw new Error("Authorization header missing");
    }

    const authHeaderParts = authorizationHeader.split(' ');
    if (authHeaderParts.length !== 2) {
      throw new Error("Invalid Authorization header format");
    }
    const authTokenFromHeader = authHeaderParts[1];

    const secretKey = process.env.JWT_SECRET || 'final';
    const decodedToken = jwt.verify(authTokenFromHeader, secretKey) as { userId: number, role: string };
    req.decodedToken = decodedToken;

    next();
  } catch (error: unknown) {
    const errorMessage = typeof error === 'string' ? error : (error as Error).message || 'An error occurred';
    console.error('Authentication error:', errorMessage);
    res.status(401).json({ success: false, message: errorMessage });
  }
};


const authorizeUser = (action: Actions, subject: Subjects) => (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
  try {
    const decodedToken = req.decodedToken;
    if (!decodedToken || !decodedToken.role) {
      throw new Error("Invalid token or role not found");
    }
    
    const abilities = defineAbilitiesFor(decodedToken.role);
    ForbiddenError.from(abilities).throwUnlessCan(action, subject);

    next();
  } catch (error: unknown) {
    const errorMessage = typeof error === 'string' ? error : (error as Error).message || 'An error occurred';
    console.error('Authorization error:', errorMessage);
    res.status(403).json({ success: false, message: errorMessage });
  }
};

export { validateToken, authorizeUser };

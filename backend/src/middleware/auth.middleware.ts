import { Request, Response, NextFunction } from 'express';
import { supabase } from '../config/supabase';

// Extend Express Request type to include user
declare global {
    namespace Express {
        interface Request {
            user?: any;
        }
    }
}

export const authenticateUser = async (req: Request, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
        res.status(401).json({ error: 'No authorization header' });
        return;
    }

    const token = authHeader.split(' ')[1];

    if (!token) {
        res.status(401).json({ error: 'No token provided' });
        return;
    }

    try {
        const { data: { user }, error } = await supabase.auth.getUser(token);

        if (error || !user) {
            res.status(401).json({ error: 'Invalid token' });
            return;
        }

        req.user = user;
        next();
    } catch (error) {
        console.error('Auth Middleware Error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

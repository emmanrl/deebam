import { Request, Response, NextFunction } from 'express';
import { adminAuth } from '../lib/firebase-admin.ts';
import { db } from '../db/index.ts';
import { users } from '../db/schema.ts';
import { eq } from 'drizzle-orm';

export interface AuthRequest extends Request {
  user?: {
    uid: string;
    email: string;
    role: string;
    name?: string;
    address?: string;
    city?: string;
    postalCode?: string;
    country?: string;
    isEmailVerified?: boolean;
  };
}

export const requireAuth = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized: Missing token' });
  }

  const token = authHeader.split('Bearer ')[1];

  // 1. Check for Pre-configured Admin Token
  if (token === 'admin-secret-token') {
    // Ensure admin exists in database
    try {
      const [adminUser] = await db.insert(users)
        .values({
          uid: 'admin',
          email: 'admin@deebamafromartltd.co.uk',
          role: 'admin',
          name: 'Deebam Admin',
          isEmailVerified: true,
        })
        .onConflictDoUpdate({
          target: users.uid,
          set: {
            email: 'admin@deebamafromartltd.co.uk',
            name: 'Deebam Admin',
            role: 'admin',
          }
        })
        .returning();

      req.user = {
        uid: adminUser.uid,
        email: adminUser.email,
        role: adminUser.role,
        name: adminUser.name || undefined,
        address: adminUser.address || undefined,
        city: adminUser.city || undefined,
        postalCode: adminUser.postalCode || undefined,
        country: adminUser.country || undefined,
        isEmailVerified: adminUser.isEmailVerified || undefined,
      };
      return next();
    } catch (err) {
      console.error('Error seeding/checking admin user:', err);
      return res.status(500).json({ error: 'Internal server error during admin auth' });
    }
  }

  // 2. Standard Firebase ID Token Authentication
  try {
    const decodedToken = await adminAuth.verifyIdToken(token);
    const email = decodedToken.email || '';
    const isVerified = decodedToken.email_verified || false;
    
    // Check if the user already exists, or upsert them
    const isSpecialAdmin = email.toLowerCase() === 'admin@deebamafromartltd.co.uk' || email.toLowerCase() === 'admin@deebamafromart.co.uk';
    const role = isSpecialAdmin ? 'admin' : 'buyer';

    const [dbUser] = await db.insert(users)
      .values({
        uid: decodedToken.uid,
        email: email,
        role: role,
        name: decodedToken.name || '',
        isEmailVerified: isVerified,
      })
      .onConflictDoUpdate({
        target: users.uid,
        set: {
          email: email,
          isEmailVerified: isVerified,
        },
      })
      .returning();

    req.user = {
      uid: dbUser.uid,
      email: dbUser.email,
      role: dbUser.role,
      name: dbUser.name || undefined,
      address: dbUser.address || undefined,
      city: dbUser.city || undefined,
      postalCode: dbUser.postalCode || undefined,
      country: dbUser.country || undefined,
      isEmailVerified: dbUser.isEmailVerified || undefined,
    };

    next();
  } catch (error) {
    console.error('Error verifying Firebase ID token:', error);
    return res.status(401).json({ error: 'Unauthorized: Invalid token' });
  }
};

export const requireAdmin = (req: AuthRequest, res: Response, next: NextFunction) => {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Forbidden: Admin access required' });
  }
  next();
};

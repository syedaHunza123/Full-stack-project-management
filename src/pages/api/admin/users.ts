import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';
import pool from '@/lib/db';
import { UserRole } from '@/types';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions);
  
  if (!session) {
    return res.status(401).json({ message: 'Unauthorized' });
  }
  
  // Only admins can access this endpoint
  if (session.user.role !== UserRole.ADMIN) {
    return res.status(403).json({ message: 'Forbidden' });
  }
  
  if (req.method === 'GET') {
    try {
      const result = await pool.query(
        'SELECT id, email, name, role, created_at FROM users ORDER BY id ASC'
      );
      
      return res.status(200).json(result.rows);
    } catch (error) {
      console.error('Error fetching users:', error);
      return res.status(500).json({ message: 'Error fetching users' });
    }
  }
  
  return res.status(405).json({ message: 'Method not allowed' });
}
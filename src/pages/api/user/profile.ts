import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';
import pool from '@/lib/db';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions);
  
  if (!session) {
    return res.status(401).json({ message: 'Unauthorized' });
  }
  
  if (req.method === 'GET') {
    try {
      const result = await pool.query(
        'SELECT id, email, name, role, created_at FROM users WHERE id = $1',
        [session.user.id]
      );
      
      if (result.rows.length === 0) {
        return res.status(404).json({ message: 'User not found' });
      }
      
      return res.status(200).json(result.rows[0]);
    } catch (error) {
      console.error('Error fetching profile:', error);
      return res.status(500).json({ message: 'Failed to fetch profile' });
    }
  }
  
  return res.status(405).json({ message: 'Method not allowed' });
}
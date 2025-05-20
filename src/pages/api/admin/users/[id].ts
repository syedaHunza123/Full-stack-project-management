import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../auth/[...nextauth]';
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
  
  const userId = parseInt(req.query.id as string);
  
  if (isNaN(userId)) {
    return res.status(400).json({ message: 'Invalid user ID' });
  }
  
  // Don't allow modifying the user's own role
  if (userId === parseInt(session.user.id)) {
    return res.status(400).json({ message: 'Cannot modify your own role' });
  }
  
  switch (req.method) {
    case 'PUT':
      try {
        const { role } = req.body;
        
        if (!role || !Object.values(UserRole).includes(role as UserRole)) {
          return res.status(400).json({ message: 'Invalid role' });
        }
        
        // Check if the user exists
        const checkResult = await pool.query(
          'SELECT * FROM users WHERE id = $1',
          [userId]
        );
        
        if (checkResult.rows.length === 0) {
          return res.status(404).json({ message: 'User not found' });
        }
        
        // Count admins before making changes
        const countResult = await pool.query(
          `SELECT COUNT(*) FROM users WHERE role = '${UserRole.ADMIN}'`
        );
        
        const adminCount = parseInt(countResult.rows[0].count);
        
        // If this is the last admin and we're changing to a regular user, prevent it
        if (adminCount <= 1 && checkResult.rows[0].role === UserRole.ADMIN && role !== UserRole.ADMIN) {
          return res.status(400).json({ message: 'Cannot remove the last admin' });
        }
        
        const result = await pool.query(
          'UPDATE users SET role = $1 WHERE id = $2 RETURNING id, email, name, role, created_at',
          [role, userId]
        );
        
        return res.status(200).json(result.rows[0]);
      } catch (error) {
        console.error('Error updating user:', error);
        return res.status(500).json({ message: 'Error updating user' });
      }
      
    default:
      return res.status(405).json({ message: 'Method not allowed' });
  }
}
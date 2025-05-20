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
  
  const userId = parseInt(session.user.id);
  const projectId = parseInt(req.query.id as string);
  
  if (isNaN(projectId)) {
    return res.status(400).json({ message: 'Invalid project ID' });
  }
  
  // Check if user can manage members
  const canManageMembers = await checkCanManageMembers(projectId, userId, session.user.role);
  
  if (!canManageMembers) {
    return res.status(403).json({ message: 'Only project owners or admins can view available users' });
  }
  
  if (req.method === 'GET') {
    try {
      // Get users that are not members of this project
      const result = await pool.query(
        `SELECT id, email, name 
        FROM users 
        WHERE id NOT IN (
          SELECT user_id FROM project_members WHERE project_id = $1
        )
        ORDER BY name, email`,
        [projectId]
      );
      
      return res.status(200).json(result.rows);
    } catch (error) {
      console.error('Error fetching available users:', error);
      return res.status(500).json({ message: 'Error fetching available users' });
    }
  }
  
  return res.status(405).json({ message: 'Method not allowed' });
}

async function checkCanManageMembers(projectId: number, userId: number, userRole: UserRole): Promise<boolean> {
  // Admins can manage all projects
  if (userRole === UserRole.ADMIN) {
    return true;
  }
  
  // Check if user is the project owner
  try {
    const result = await pool.query(
      "SELECT 1 FROM project_members WHERE project_id = $1 AND user_id = $2 AND role = 'OWNER'",
      [projectId, userId]
    );
    
    return result.rows.length > 0;
  } catch (error) {
    console.error('Error checking if user can manage members:', error);
    return false;
  }
}
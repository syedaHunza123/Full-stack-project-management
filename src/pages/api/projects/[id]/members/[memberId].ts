import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../../auth/[...nextauth]';
import pool from '@/lib/db';
import { UserRole } from '@/types';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions);
  
  if (!session) {
    return res.status(401).json({ message: 'Unauthorized' });
  }
  
  const userId = parseInt(session.user.id);
  const projectId = parseInt(req.query.id as string);
  const memberId = parseInt(req.query.memberId as string);
  
  if (isNaN(projectId) || isNaN(memberId)) {
    return res.status(400).json({ message: 'Invalid project ID or member ID' });
  }
  
  // Check if user can manage members
  const canManageMembers = await checkCanManageMembers(projectId, userId, session.user.role);
  
  if (!canManageMembers) {
    return res.status(403).json({ message: 'Only project owners or admins can manage members' });
  }
  
  switch (req.method) {
    case 'DELETE':
      try {
        // Get the member information
        const memberResult = await pool.query(
          'SELECT * FROM project_members WHERE id = $1 AND project_id = $2',
          [memberId, projectId]
        );
        
        if (memberResult.rows.length === 0) {
          return res.status(404).json({ message: 'Member not found' });
        }
        
        const member = memberResult.rows[0];
        
        // Don't allow removing the last owner
        if (member.role === 'OWNER') {
          const ownersResult = await pool.query(
            "SELECT COUNT(*) FROM project_members WHERE project_id = $1 AND role = 'OWNER'",
            [projectId]
          );
          
          if (parseInt(ownersResult.rows[0].count) <= 1) {
            return res.status(400).json({ message: 'Cannot remove the last owner of the project' });
          }
        }
        
        // Remove the member
        await pool.query(
          'DELETE FROM project_members WHERE id = $1',
          [memberId]
        );
        
        return res.status(200).json({ message: 'Member removed successfully' });
      } catch (error) {
        console.error('Error removing project member:', error);
        return res.status(500).json({ message: 'Error removing project member' });
      }
      
    case 'PUT':
      try {
        const { role } = req.body;
        
        if (!role) {
          return res.status(400).json({ message: 'Role is required' });
        }
        
        // Update the member's role
        const result = await pool.query(
          'UPDATE project_members SET role = $1 WHERE id = $2 AND project_id = $3 RETURNING *',
          [role, memberId, projectId]
        );
        
        if (result.rows.length === 0) {
          return res.status(404).json({ message: 'Member not found' });
        }
        
        return res.status(200).json(result.rows[0]);
      } catch (error) {
        console.error('Error updating project member:', error);
        return res.status(500).json({ message: 'Error updating project member' });
      }
      
    default:
      return res.status(405).json({ message: 'Method not allowed' });
  }
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
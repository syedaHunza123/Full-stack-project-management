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
  
  // Check if user has access to this project
  const hasAccess = await checkProjectAccess(projectId, userId, session.user.role);
  
  if (!hasAccess) {
    return res.status(403).json({ message: 'You do not have access to this project' });
  }
  
  switch (req.method) {
    case 'GET':
      try {
        const result = await pool.query(
          'SELECT * FROM projects WHERE id = $1',
          [projectId]
        );
        
        if (result.rows.length === 0) {
          return res.status(404).json({ message: 'Project not found' });
        }
        
        return res.status(200).json(result.rows[0]);
      } catch (error) {
        console.error('Error fetching project:', error);
        return res.status(500).json({ message: 'Error fetching project' });
      }
      
    case 'PUT':
      try {
        const { name, description } = req.body;
        
        if (!name || !description) {
          return res.status(400).json({ message: 'Name and description are required' });
        }
        
        // Check if user is the project owner or admin
        const isOwnerResult = await pool.query(
          'SELECT role FROM project_members WHERE project_id = $1 AND user_id = $2',
          [projectId, userId]
        );
        
        const isOwner = isOwnerResult.rows.length > 0 && isOwnerResult.rows[0].role === 'OWNER';
        
        if (!isOwner && session.user.role !== UserRole.ADMIN) {
          return res.status(403).json({ message: 'Only project owners or admins can update projects' });
        }
        
        const result = await pool.query(
          'UPDATE projects SET name = $1, description = $2 WHERE id = $3 RETURNING *',
          [name, description, projectId]
        );
        
        return res.status(200).json(result.rows[0]);
      } catch (error) {
        console.error('Error updating project:', error);
        return res.status(500).json({ message: 'Error updating project' });
      }
      
    case 'DELETE':
      try {
        // Check if user is the project owner or admin
        const isOwnerResult = await pool.query(
          'SELECT role FROM project_members WHERE project_id = $1 AND user_id = $2',
          [projectId, userId]
        );
        
        const isOwner = isOwnerResult.rows.length > 0 && isOwnerResult.rows[0].role === 'OWNER';
        
        if (!isOwner && session.user.role !== UserRole.ADMIN) {
          return res.status(403).json({ message: 'Only project owners or admins can delete projects' });
        }
        
        await pool.query('DELETE FROM projects WHERE id = $1', [projectId]);
        
        return res.status(200).json({ message: 'Project deleted successfully' });
      } catch (error) {
        console.error('Error deleting project:', error);
        return res.status(500).json({ message: 'Error deleting project' });
      }
      
    default:
      return res.status(405).json({ message: 'Method not allowed' });
  }
}

async function checkProjectAccess(projectId: number, userId: number, userRole: UserRole): Promise<boolean> {
  // Admins have access to all projects
  if (userRole === UserRole.ADMIN) {
    return true;
  }
  
  // Check if user is a member of this project
  try {
    const result = await pool.query(
      'SELECT 1 FROM project_members WHERE project_id = $1 AND user_id = $2',
      [projectId, userId]
    );
    
    return result.rows.length > 0;
  } catch (error) {
    console.error('Error checking project access:', error);
    return false;
  }
}
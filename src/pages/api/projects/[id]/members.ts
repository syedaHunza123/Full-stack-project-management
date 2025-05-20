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
  
  // Check if the project exists
  const projectExists = await checkProjectExists(projectId);
  
  if (!projectExists) {
    return res.status(404).json({ message: 'Project not found' });
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
          `SELECT pm.*, 
            json_build_object(
              'id', u.id,
              'email', u.email,
              'name', u.name,
              'role', u.role
            ) as user
          FROM project_members pm
          JOIN users u ON pm.user_id = u.id
          WHERE pm.project_id = $1
          ORDER BY pm.role, u.name, u.email`,
          [projectId]
        );
        
        return res.status(200).json(result.rows);
      } catch (error) {
        console.error('Error fetching project members:', error);
        return res.status(500).json({ message: 'Error fetching project members' });
      }
      
    case 'POST':
      try {
        // Check if user is the project owner or admin
        const canManageMembers = await checkCanManageMembers(projectId, userId, session.user.role);
        
        if (!canManageMembers) {
          return res.status(403).json({ message: 'Only project owners or admins can add members' });
        }
        
        const { userId: newMemberId, role } = req.body;
        
        if (!newMemberId || !role) {
          return res.status(400).json({ message: 'User ID and role are required' });
        }
        
        // Check if the user is already a member
        const existingMember = await pool.query(
          'SELECT 1 FROM project_members WHERE project_id = $1 AND user_id = $2',
          [projectId, newMemberId]
        );
        
        if (existingMember.rows.length > 0) {
          return res.status(400).json({ message: 'User is already a member of this project' });
        }
        
        // Add the new member
        const result = await pool.query(
          'INSERT INTO project_members (project_id, user_id, role) VALUES ($1, $2, $3) RETURNING id',
          [projectId, newMemberId, role]
        );
        
        // Fetch the complete member data with user info
        const memberResult = await pool.query(
          `SELECT pm.*, 
            json_build_object(
              'id', u.id,
              'email', u.email,
              'name', u.name,
              'role', u.role
            ) as user
          FROM project_members pm
          JOIN users u ON pm.user_id = u.id
          WHERE pm.id = $1`,
          [result.rows[0].id]
        );
        
        return res.status(201).json(memberResult.rows[0]);
      } catch (error) {
        console.error('Error adding project member:', error);
        return res.status(500).json({ message: 'Error adding project member' });
      }
      
    default:
      return res.status(405).json({ message: 'Method not allowed' });
  }
}

async function checkProjectExists(projectId: number): Promise<boolean> {
  try {
    const result = await pool.query(
      'SELECT 1 FROM projects WHERE id = $1',
      [projectId]
    );
    
    return result.rows.length > 0;
  } catch (error) {
    console.error('Error checking if project exists:', error);
    return false;
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
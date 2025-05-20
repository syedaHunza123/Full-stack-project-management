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
  
  const userId = parseInt(session.user.id);
  
  switch (req.method) {
    case 'GET':
      try {
        const { 
          projectId, 
          assignedTo, 
          status, 
          priority, 
          limit 
        } = req.query;
        
        // Build the query conditions and parameters
        let conditions = [];
        let params = [];
        let paramIndex = 1;
        
        // If admin, can see any task within projects they have access to
        // Otherwise, only see tasks from projects they're members of
        if (session.user.role !== UserRole.ADMIN) {
          conditions.push(`t.project_id IN (
            SELECT project_id FROM project_members WHERE user_id = $${paramIndex}
          )`);
          params.push(userId);
          paramIndex++;
        }
        
        if (projectId) {
          conditions.push(`t.project_id = $${paramIndex}`);
          params.push(parseInt(projectId as string));
          paramIndex++;
        }
        
        if (assignedTo) {
          conditions.push(`t.assigned_to = $${paramIndex}`);
          params.push(parseInt(assignedTo as string));
          paramIndex++;
        }
        
        if (status) {
          conditions.push(`t.status = $${paramIndex}`);
          params.push(status);
          paramIndex++;
        }
        
        if (priority) {
          conditions.push(`t.priority = $${paramIndex}`);
          params.push(priority);
          paramIndex++;
        }
        
        const whereClause = conditions.length > 0 
          ? `WHERE ${conditions.join(' AND ')}` 
          : '';
        
        let limitClause = '';
        if (limit) {
          limitClause = `LIMIT $${paramIndex}`;
          params.push(parseInt(limit as string));
        }
        
        const query = `
          SELECT t.*, 
            json_build_object(
              'id', p.id,
              'name', p.name
            ) as project,
            CASE WHEN t.assigned_to IS NOT NULL THEN
              json_build_object(
                'id', u.id,
                'email', u.email,
                'name', u.name
              )
            ELSE NULL END as assignee
          FROM tasks t
          LEFT JOIN projects p ON t.project_id = p.id
          LEFT JOIN users u ON t.assigned_to = u.id
          ${whereClause}
          ORDER BY 
            CASE 
              WHEN t.status = 'DONE' THEN 1 
              ELSE 0 
            END,
            CASE 
              WHEN t.priority = 'URGENT' THEN 0
              WHEN t.priority = 'HIGH' THEN 1
              WHEN t.priority = 'MEDIUM' THEN 2
              WHEN t.priority = 'LOW' THEN 3
            END,
            t.updated_at DESC
          ${limitClause}
        `;
        
        const result = await pool.query(query, params);
        return res.status(200).json(result.rows);
      } catch (error) {
        console.error('Error fetching tasks:', error);
        return res.status(500).json({ message: 'Error fetching tasks' });
      }
      
    case 'POST':
      try {
        const { 
          title, 
          description, 
          status, 
          priority, 
          project_id, 
          assigned_to 
        } = req.body;
        
        if (!title || !description || !project_id) {
          return res.status(400).json({ message: 'Title, description, and project are required' });
        }
        
        // Check if user has access to the project
        const hasAccess = await checkProjectAccess(project_id, userId, session.user.role);
        
        if (!hasAccess) {
          return res.status(403).json({ message: 'You do not have access to this project' });
        }
        
        // If assigning to someone, check if they are a member of the project
        if (assigned_to) {
          const isMember = await checkUserIsProjectMember(project_id, assigned_to);
          
          if (!isMember) {
            return res.status(400).json({ message: 'Assigned user is not a member of the project' });
          }
        }
        
        const result = await pool.query(
          `INSERT INTO tasks (
            title, description, status, priority, project_id, assigned_to, created_by
          ) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
          [
            title, 
            description, 
            status || 'TODO', 
            priority || 'MEDIUM', 
            project_id, 
            assigned_to, 
            userId
          ]
        );
        
        // Fetch the task with related project and assignee
        const taskResult = await pool.query(
          `SELECT t.*, 
            json_build_object(
              'id', p.id,
              'name', p.name
            ) as project,
            CASE WHEN t.assigned_to IS NOT NULL THEN
              json_build_object(
                'id', u.id,
                'email', u.email,
                'name', u.name
              )
            ELSE NULL END as assignee
          FROM tasks t
          LEFT JOIN projects p ON t.project_id = p.id
          LEFT JOIN users u ON t.assigned_to = u.id
          WHERE t.id = $1`,
          [result.rows[0].id]
        );
        
        return res.status(201).json(taskResult.rows[0]);
      } catch (error) {
        console.error('Error creating task:', error);
        return res.status(500).json({ message: 'Error creating task' });
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

async function checkUserIsProjectMember(projectId: number, userId: number): Promise<boolean> {
  try {
    const result = await pool.query(
      'SELECT 1 FROM project_members WHERE project_id = $1 AND user_id = $2',
      [projectId, userId]
    );
    
    return result.rows.length > 0;
  } catch (error) {
    console.error('Error checking if user is project member:', error);
    return false;
  }
}
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
  const taskId = parseInt(req.query.id as string);
  
  if (isNaN(taskId)) {
    return res.status(400).json({ message: 'Invalid task ID' });
  }
  
  // Check if task exists and user has access to it
  const taskAccess = await checkTaskAccess(taskId, userId, session.user.role);
  
  if (!taskAccess.exists) {
    return res.status(404).json({ message: 'Task not found' });
  }
  
  if (!taskAccess.hasAccess) {
    return res.status(403).json({ message: 'You do not have access to this task' });
  }
  
  switch (req.method) {
    case 'GET':
      try {
        const result = await pool.query(
          `SELECT t.*, 
            json_build_object(
              'id', p.id,
              'name', p.name,
              'description', p.description
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
          [taskId]
        );
        
        if (result.rows.length === 0) {
          return res.status(404).json({ message: 'Task not found' });
        }
        
        return res.status(200).json(result.rows[0]);
      } catch (error) {
        console.error('Error fetching task:', error);
        return res.status(500).json({ message: 'Error fetching task' });
      }
      
    case 'PUT':
      try {
        const { 
          title, 
          description, 
          status, 
          priority, 
          project_id, 
          assigned_to 
        } = req.body;
        
        // Build the update query
        let updates = [];
        let params = [];
        let paramIndex = 1;
        
        if (title !== undefined) {
          updates.push(`title = $${paramIndex}`);
          params.push(title);
          paramIndex++;
        }
        
        if (description !== undefined) {
          updates.push(`description = $${paramIndex}`);
          params.push(description);
          paramIndex++;
        }
        
        if (status !== undefined) {
          updates.push(`status = $${paramIndex}`);
          params.push(status);
          paramIndex++;
        }
        
        if (priority !== undefined) {
          updates.push(`priority = $${paramIndex}`);
          params.push(priority);
          paramIndex++;
        }
        
        if (project_id !== undefined) {
          // Check if user has access to the new project
          const hasAccess = await checkProjectAccess(project_id, userId, session.user.role);
          
          if (!hasAccess) {
            return res.status(403).json({ message: 'You do not have access to the target project' });
          }
          
          updates.push(`project_id = $${paramIndex}`);
          params.push(project_id);
          paramIndex++;
        }
        
        if (assigned_to !== undefined) {
          // If assigning to someone, check if they are a member of the project
          if (assigned_to !== null) {
            const projectId = project_id || taskAccess.projectId;
            const isMember = await checkUserIsProjectMember(projectId, assigned_to);
            
            if (!isMember) {
              return res.status(400).json({ message: 'Assigned user is not a member of the project' });
            }
          }
          
          updates.push(`assigned_to = $${paramIndex}`);
          params.push(assigned_to);
          paramIndex++;
        }
        
        // Add updated_at
        updates.push(`updated_at = NOW()`);
        
        if (updates.length === 0) {
          return res.status(400).json({ message: 'No fields to update' });
        }
        
        // Add task ID to params
        params.push(taskId);
        
        const result = await pool.query(
          `UPDATE tasks SET ${updates.join(', ')} WHERE id = $${paramIndex} RETURNING *`,
          params
        );
        
        // Fetch the updated task with related project and assignee
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
        
        return res.status(200).json(taskResult.rows[0]);
      } catch (error) {
        console.error('Error updating task:', error);
        return res.status(500).json({ message: 'Error updating task' });
      }
      
    case 'DELETE':
      try {
        await pool.query('DELETE FROM tasks WHERE id = $1', [taskId]);
        
        return res.status(200).json({ message: 'Task deleted successfully' });
      } catch (error) {
        console.error('Error deleting task:', error);
        return res.status(500).json({ message: 'Error deleting task' });
      }
      
    default:
      return res.status(405).json({ message: 'Method not allowed' });
  }
}

async function checkTaskAccess(taskId: number, userId: number, userRole: UserRole): Promise<{ exists: boolean; hasAccess: boolean; projectId: number }> {
  try {
    // Get the task
    const taskResult = await pool.query(
      'SELECT project_id FROM tasks WHERE id = $1',
      [taskId]
    );
    
    if (taskResult.rows.length === 0) {
      return { exists: false, hasAccess: false, projectId: 0 };
    }
    
    const projectId = taskResult.rows[0].project_id;
    
    // Admins have access to all tasks
    if (userRole === UserRole.ADMIN) {
      return { exists: true, hasAccess: true, projectId };
    }
    
    // Check if user is a member of the project this task belongs to
    const memberResult = await pool.query(
      'SELECT 1 FROM project_members WHERE project_id = $1 AND user_id = $2',
      [projectId, userId]
    );
    
    return { 
      exists: true, 
      hasAccess: memberResult.rows.length > 0,
      projectId
    };
  } catch (error) {
    console.error('Error checking task access:', error);
    return { exists: false, hasAccess: false, projectId: 0 };
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
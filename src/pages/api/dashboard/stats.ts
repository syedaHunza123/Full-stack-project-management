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
  
  if (req.method === 'GET') {
    try {
      let projectsQuery, tasksQuery;
      
      if (session.user.role === UserRole.ADMIN) {
        // Admins can see all projects and tasks
        projectsQuery = 'SELECT COUNT(*) FROM projects';
        tasksQuery = `
          SELECT 
            COUNT(*) as total_tasks,
            COUNT(*) FILTER (WHERE status = 'DONE') as completed_tasks,
            COUNT(*) FILTER (WHERE status != 'DONE') as pending_tasks
          FROM tasks
        `;
      } else {
        // Regular users can only see their projects and tasks
        projectsQuery = `
          SELECT COUNT(DISTINCT p.id) 
          FROM projects p
          JOIN project_members pm ON p.id = pm.project_id
          WHERE pm.user_id = $1
        `;
        
        tasksQuery = `
          SELECT 
            COUNT(*) as total_tasks,
            COUNT(*) FILTER (WHERE status = 'DONE') as completed_tasks,
            COUNT(*) FILTER (WHERE status != 'DONE') as pending_tasks
          FROM tasks t
          JOIN project_members pm ON t.project_id = pm.project_id
          WHERE pm.user_id = $1
        `;
      }
      
      const projectsResult = await pool.query(
        projectsQuery,
        session.user.role === UserRole.ADMIN ? [] : [userId]
      );
      
      const tasksResult = await pool.query(
        tasksQuery,
        session.user.role === UserRole.ADMIN ? [] : [userId]
      );
      
      const stats = {
        totalProjects: parseInt(projectsResult.rows[0].count),
        totalTasks: parseInt(tasksResult.rows[0].total_tasks),
        completedTasks: parseInt(tasksResult.rows[0].completed_tasks),
        pendingTasks: parseInt(tasksResult.rows[0].pending_tasks),
      };
      
      return res.status(200).json(stats);
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
      return res.status(500).json({ message: 'Error fetching dashboard stats' });
    }
  }
  
  return res.status(405).json({ message: 'Method not allowed' });
}
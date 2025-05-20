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
        const { limit } = req.query;
        const limitQuery = limit ? parseInt(limit as string) : null;
        
        // If admin, can see all projects
        // Otherwise, only see projects where user is a member
        let query;
        let params;
        
        if (session.user.role === UserRole.ADMIN) {
          query = `
            SELECT p.* 
            FROM projects p
            ORDER BY p.created_at DESC
            ${limitQuery ? 'LIMIT $1' : ''}
          `;
          params = limitQuery ? [limitQuery] : [];
        } else {
          query = `
            SELECT p.* 
            FROM projects p
            JOIN project_members pm ON p.id = pm.project_id
            WHERE pm.user_id = $1
            ORDER BY p.created_at DESC
            ${limitQuery ? 'LIMIT $2' : ''}
          `;
          params = limitQuery ? [userId, limitQuery] : [userId];
        }
        
        const result = await pool.query(query, params);
        return res.status(200).json(result.rows);
      } catch (error) {
        console.error('Error fetching projects:', error);
        return res.status(500).json({ message: 'Error fetching projects' });
      }
      
    case 'POST':
      try {
        const { name, description } = req.body;
        
        if (!name || !description) {
          return res.status(400).json({ message: 'Name and description are required' });
        }
        
        // Start a transaction
        const client = await pool.connect();
        
        try {
          await client.query('BEGIN');
          
          // Create the project
          const projectResult = await client.query(
            'INSERT INTO projects (name, description, created_by) VALUES ($1, $2, $3) RETURNING *',
            [name, description, userId]
          );
          
          const project = projectResult.rows[0];
          
          // Add the creator as a project member with OWNER role
          await client.query(
            'INSERT INTO project_members (project_id, user_id, role) VALUES ($1, $2, $3)',
            [project.id, userId, 'OWNER']
          );
          
          await client.query('COMMIT');
          
          return res.status(201).json(project);
        } catch (error) {
          await client.query('ROLLBACK');
          throw error;
        } finally {
          client.release();
        }
      } catch (error) {
        console.error('Error creating project:', error);
        return res.status(500).json({ message: 'Error creating project' });
      }
      
    default:
      return res.status(405).json({ message: 'Method not allowed' });
  }
}
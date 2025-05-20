import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../auth/[...nextauth]';
import pool from '@/lib/db';
import { UserRole } from '@/types';
import { hash } from 'bcryptjs';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions);
  
  if (!session) {
    return res.status(401).json({ message: 'Unauthorized' });
  }
  
  // Only admins can access this endpoint
  if (session.user.role !== UserRole.ADMIN) {
    return res.status(403).json({ message: 'Forbidden' });
  }
  
  switch (req.method) {
    case 'GET':
      try {
        const result = await pool.query(
          'SELECT id, email, name, role, created_at FROM users ORDER BY id ASC'
        );
        
        return res.status(200).json(result.rows);
      } catch (error) {
        console.error('Error fetching users:', error);
        return res.status(500).json({ message: 'Error fetching users' });
      }
    
    case 'POST':
      try {
        const { email, password, name, role } = req.body;
        
        if (!email || !password) {
          return res.status(400).json({ message: 'Email and password are required' });
        }
        
        // Validate email format
        const emailRegex = /\S+@\S+\.\S+/;
        if (!emailRegex.test(email)) {
          return res.status(400).json({ message: 'Invalid email format' });
        }
        
        // Validate password length
        if (password.length < 6) {
          return res.status(400).json({ message: 'Password must be at least 6 characters' });
        }
        
        // Check if user already exists
        const existingUser = await pool.query(
          'SELECT * FROM users WHERE email = $1',
          [email]
        );
        
        if (existingUser.rows.length > 0) {
          return res.status(400).json({ message: 'User with this email already exists' });
        }
        
        // Hash the password
        const hashedPassword = await hash(password, 10);
        
        // Create the user
        const userRole = role || UserRole.USER;
        
        const result = await pool.query(
          'INSERT INTO users (email, password, name, role) VALUES ($1, $2, $3, $4) RETURNING id, email, name, role, created_at',
          [email, hashedPassword, name || null, userRole]
        );
        
        return res.status(201).json(result.rows[0]);
      } catch (error) {
        console.error('Error creating user:', error);
        return res.status(500).json({ message: 'Error creating user' });
      }
    
    default:
      return res.status(405).json({ message: 'Method not allowed' });
  }
}
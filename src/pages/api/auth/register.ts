import { NextApiRequest, NextApiResponse } from 'next';
import { hash } from 'bcryptjs';
import pool from '@/lib/db';
import { UserRole } from '@/types';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }
  
  try {
    const { email, password, name } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }
    
    // Check if user already exists
    const existingUser = await pool.query(
      'SELECT * FROM users WHERE email = $1',
      [email]
    );
    
    if (existingUser.rows.length > 0) {
      return res.status(400).json({ message: 'User already exists' });
    }
    
    // Hash password
    const hashedPassword = await hash(password, 10);
    
    // Check if this is the first user (make them admin)
    const countResult = await pool.query('SELECT COUNT(*) FROM users');
    const isFirstUser = parseInt(countResult.rows[0].count) === 0;
    const role = isFirstUser ? UserRole.ADMIN : UserRole.USER;
    
    // Create user
    const result = await pool.query(
      'INSERT INTO users (email, password, name, role) VALUES ($1, $2, $3, $4) RETURNING id, email, name, role',
      [email, hashedPassword, name || null, role]
    );
    
    return res.status(201).json({ user: result.rows[0] });
  } catch (error) {
    console.error('Error during registration:', error);
    return res.status(500).json({ message: 'Error during registration' });
  }
}
export interface User {
  id: number;
  email: string;
  name: string | null;
  role: UserRole;
  created_at: string;
}

export enum UserRole {
  ADMIN = 'ADMIN',
  USER = 'USER',
}

export interface Project {
  id: number;
  name: string;
  description: string;
  created_by: number;
  created_at: string;
}

export interface ProjectMember {
  id: number;
  project_id: number;
  user_id: number;
  role: ProjectRole;
  user?: User;
  project?: Project;
}

export enum ProjectRole {
  OWNER = 'OWNER',
  MEMBER = 'MEMBER',
}

export interface Task {
  id: number;
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  project_id: number;
  assigned_to: number | null;
  created_by: number;
  created_at: string;
  updated_at: string;
  assignee?: User;
  project?: Project;
}

export enum TaskStatus {
  TODO = 'TODO',
  IN_PROGRESS = 'IN_PROGRESS',
  REVIEW = 'REVIEW',
  DONE = 'DONE',
}

export enum TaskPriority {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  URGENT = 'URGENT',
}

// NextAuth types extension
declare module "next-auth" {
  interface User {
    id: string;
    name?: string;
    email: string;
    role: UserRole;
  }

  interface Session {
    user: {
      id: string;
      name?: string;
      email: string;
      role: UserRole;
    }
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: UserRole;
  }
}
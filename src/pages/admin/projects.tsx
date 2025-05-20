import Layout from '@/components/layout/Layout';
import AuthGuard from '@/components/auth/AuthGuard';
import { UserRole } from '@/types';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Project } from '@/types';

export default function AdminProjects() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    const fetchAllProjects = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/admin/projects');
        
        if (!response.ok) {
          throw new Error('Failed to fetch projects');
        }
        
        const data = await response.json();
        setProjects(data);
        setError(null);
      } catch (error) {
        console.error('Error fetching projects:', error);
        setError('Failed to load projects. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchAllProjects();
  }, []);
  
  const handleDeleteProject = async (projectId: number) => {
    if (!confirm('Are you sure you want to delete this project? This action cannot be undone.')) {
      return;
    }
    
    try {
      const response = await fetch(`/api/projects/${projectId}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete project');
      }
      
      setProjects(projects.filter(p => p.id !== projectId));
    } catch (error) {
      console.error('Error deleting project:', error);
      alert('Failed to delete project');
    }
  };
  
  if (loading) {
    return (
      <Layout title="All Projects - Admin">
        <AuthGuard requiredRole={UserRole.ADMIN}>
          <div className="container py-4">
            <div className="text-center my-5">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
            </div>
          </div>
        </AuthGuard>
      </Layout>
    );
  }
  
  if (error) {
    return (
      <Layout title="All Projects - Admin">
        <AuthGuard requiredRole={UserRole.ADMIN}>
          <div className="container py-4">
            <div className="alert alert-danger">
              {error}
            </div>
          </div>
        </AuthGuard>
      </Layout>
    );
  }
  
  return (
    <Layout title="All Projects - Admin">
      <AuthGuard requiredRole={UserRole.ADMIN}>
        <div className="container py-4">
          <h1 className="mb-4">All Projects</h1>
          
          <div className="card">
            <div className="card-header d-flex justify-content-between align-items-center">
              <h5 className="mb-0">Projects ({projects.length})</h5>
              <Link href="/projects/new" className="btn btn-primary btn-sm">
                Create Project
              </Link>
            </div>
            <div className="table-responsive">
              <table className="table table-striped table-hover mb-0">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Name</th>
                    <th>Created By</th>
                    <th>Created At</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {projects.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="text-center py-4">No projects found</td>
                    </tr>
                  ) : (
                    projects.map((project) => (
                      <tr key={project.id}>
                        <td>{project.id}</td>
                        <td>
                          <Link href={`/projects/${project.id}`} className="text-decoration-none">
                            {project.name}
                          </Link>
                        </td>
                        <td>{project.created_by}</td>
                        <td>{new Date(project.created_at).toLocaleDateString()}</td>
                        <td>
                          <div className="btn-group btn-group-sm">
                            <Link 
                              href={`/projects/${project.id}`}
                              className="btn btn-outline-primary"
                            >
                              View
                            </Link>
                            <Link 
                              href={`/projects/${project.id}/edit`}
                              className="btn btn-outline-secondary"
                            >
                              Edit
                            </Link>
                            <button 
                              className="btn btn-outline-danger"
                              onClick={() => handleDeleteProject(project.id)}
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </AuthGuard>
    </Layout>
  );
}
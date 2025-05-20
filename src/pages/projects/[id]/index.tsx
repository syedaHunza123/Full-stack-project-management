import { useRouter } from 'next/router';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import Layout from '@/components/layout/Layout';
import AuthGuard from '@/components/auth/AuthGuard';
import ProjectMembers from '@/components/projects/ProjectMembers';
import { Project } from '@/types';

export default function ProjectDetails() {
  const router = useRouter();
  const { id } = router.query;
  
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    if (!id) return;
    
    const fetchProject = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/projects/${id}`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch project');
        }
        
        const data = await response.json();
        setProject(data);
        setError(null);
      } catch (error) {
        console.error('Error fetching project:', error);
        setError('Failed to load project details. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchProject();
  }, [id]);
  
  const handleDeleteProject = async () => {
    if (!project) return;
    
    if (!confirm('Are you sure you want to delete this project? This action cannot be undone.')) {
      return;
    }
    
    try {
      const response = await fetch(`/api/projects/${project.id}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete project');
      }
      
      router.push('/projects');
    } catch (error) {
      console.error('Error deleting project:', error);
      alert('Failed to delete project');
    }
  };
  
  if (loading) {
    return (
      <Layout title="Project Details - Project Management System">
        <AuthGuard>
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
  
  if (error || !project) {
    return (
      <Layout title="Project Details - Project Management System">
        <AuthGuard>
          <div className="container py-4">
            <div className="alert alert-danger">
              {error || 'Project not found'}
            </div>
            <Link href="/projects" className="btn btn-primary">
              Back to Projects
            </Link>
          </div>
        </AuthGuard>
      </Layout>
    );
  }
  
  return (
    <Layout title={`${project.name} - Project Management System`}>
      <AuthGuard>
        <div className="container py-4">
          <div className="row mb-4">
            <div className="col-md-8">
              <h1>{project.name}</h1>
              <p className="lead">{project.description}</p>
              <p className="text-muted">
                Created on {new Date(project.created_at).toLocaleDateString()}
              </p>
            </div>
            <div className="col-md-4 text-md-end">
              <div className="btn-group">
                <Link
                  href={`/projects/${project.id}/edit`}
                  className="btn btn-outline-primary"
                >
                  Edit Project
                </Link>
                <button
                  className="btn btn-outline-danger"
                  onClick={handleDeleteProject}
                >
                  Delete Project
                </button>
              </div>
            </div>
          </div>
          
          <div className="row mb-4">
            <div className="col-12">
              <div className="card">
                <div className="card-header d-flex justify-content-between align-items-center">
                  <h2 className="h5 mb-0">Project Tasks</h2>
                  <Link
                    href={`/projects/${project.id}/tasks/new`}
                    className="btn btn-primary btn-sm"
                  >
                    Add Task
                  </Link>
                </div>
                <div className="card-body">
                  <div className="mt-3">
                    <iframe 
                      src={`/projects/${project.id}/tasks`} 
                      style={{ width: '100%', height: '500px', border: 'none' }}
                    ></iframe>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <ProjectMembers projectId={project.id} />
        </div>
      </AuthGuard>
    </Layout>
  );
}
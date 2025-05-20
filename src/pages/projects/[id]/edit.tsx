import { useRouter } from 'next/router';
import { useState, useEffect } from 'react';
import Layout from '@/components/layout/Layout';
import AuthGuard from '@/components/auth/AuthGuard';
import ProjectForm from '@/components/projects/ProjectForm';
import { Project } from '@/types';

export default function EditProject() {
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
  
  if (loading) {
    return (
      <Layout title="Edit Project - Project Management System">
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
      <Layout title="Edit Project - Project Management System">
        <AuthGuard>
          <div className="container py-4">
            <div className="alert alert-danger">
              {error || 'Project not found'}
            </div>
          </div>
        </AuthGuard>
      </Layout>
    );
  }
  
  return (
    <Layout title={`Edit ${project.name} - Project Management System`}>
      <AuthGuard>
        <div className="container py-4">
          <div className="row justify-content-center">
            <div className="col-lg-8">
              <div className="card">
                <div className="card-header">
                  <h1 className="h3 mb-0">Edit Project</h1>
                </div>
                <div className="card-body">
                  <ProjectForm initialData={project} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </AuthGuard>
    </Layout>
  );
}
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Project } from '@/types';

export default function ProjectList() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    const fetchProjects = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/projects');
        
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
    
    fetchProjects();
  }, []);
  
  if (loading) {
    return (
      <div className="text-center my-4">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="alert alert-danger">
        {error}
      </div>
    );
  }
  
  if (projects.length === 0) {
    return (
      <div className="text-center my-5">
        <h4>No projects found</h4>
        <p className="text-muted">Start by creating your first project</p>
        <Link href="/projects/new" className="btn btn-primary mt-3">
          Create New Project
        </Link>
      </div>
    );
  }
  
  return (
    <div className="row row-cols-1 row-cols-md-2 row-cols-lg-3 g-4">
      {projects.map((project) => (
        <div className="col" key={project.id}>
          <div className="card h-100">
            <div className="card-body">
              <h5 className="card-title">{project.name}</h5>
              <p className="card-text">
                {project.description.length > 100
                  ? `${project.description.substring(0, 100)}...`
                  : project.description}
              </p>
              <div className="d-grid gap-2">
                <Link
                  href={`/projects/${project.id}`}
                  className="btn btn-primary"
                >
                  View Details
                </Link>
              </div>
            </div>
            <div className="card-footer text-muted">
              Created on {new Date(project.created_at).toLocaleDateString()}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Project } from '@/types';

export default function ProjectsOverview() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    const fetchProjects = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/projects?limit=4');
        
        if (!response.ok) {
          throw new Error('Failed to fetch projects');
        }
        
        const data = await response.json();
        setProjects(data);
      } catch (error) {
        console.error('Error fetching projects:', error);
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
  
  if (projects.length === 0) {
    return (
      <div className="alert alert-info">
        No projects available. Get started by creating your first project!
      </div>
    );
  }
  
  return (
    <div className="card">
      <div className="card-header d-flex justify-content-between align-items-center">
        <h5 className="card-title mb-0">Your Projects</h5>
        <Link href="/projects" className="btn btn-sm btn-primary">
          View All
        </Link>
      </div>
      <div className="card-body">
        <div className="row g-4">
          {projects.map((project) => (
            <div className="col-md-6" key={project.id}>
              <div className="card h-100">
                <div className="card-body">
                  <h5 className="card-title">{project.name}</h5>
                  <p className="card-text text-truncate">{project.description}</p>
                  <div className="d-grid">
                    <Link 
                      href={`/projects/${project.id}`} 
                      className="btn btn-outline-primary"
                    >
                      View Project
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
      </div>
    </div>
  );
}
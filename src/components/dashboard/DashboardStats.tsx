import { useEffect, useState } from 'react';
import { Task, TaskStatus, Project } from '@/types';

export default function DashboardStats() {
  const [stats, setStats] = useState({
    totalProjects: 0,
    totalTasks: 0,
    completedTasks: 0,
    pendingTasks: 0,
  });
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/dashboard/stats');
        
        if (!response.ok) {
          throw new Error('Failed to fetch stats');
        }
        
        const data = await response.json();
        setStats(data);
      } catch (error) {
        console.error('Error fetching stats:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchStats();
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
  
  const completionRate = stats.totalTasks > 0 
    ? Math.round((stats.completedTasks / stats.totalTasks) * 100) 
    : 0;
  
  return (
    <div className="row g-4 mb-4">
      <div className="col-md-3">
        <div className="card h-100">
          <div className="card-body text-center">
            <h3 className="display-4 fw-bold text-primary">{stats.totalProjects}</h3>
            <p className="card-text">Total Projects</p>
          </div>
        </div>
      </div>
      
      <div className="col-md-3">
        <div className="card h-100">
          <div className="card-body text-center">
            <h3 className="display-4 fw-bold text-primary">{stats.totalTasks}</h3>
            <p className="card-text">Total Tasks</p>
          </div>
        </div>
      </div>
      
      <div className="col-md-3">
        <div className="card h-100">
          <div className="card-body text-center">
            <h3 className="display-4 fw-bold text-success">{stats.completedTasks}</h3>
            <p className="card-text">Completed Tasks</p>
          </div>
        </div>
      </div>
      
      <div className="col-md-3">
        <div className="card h-100">
          <div className="card-body text-center">
            <div className="position-relative">
              <h3 className="display-4 fw-bold text-info">{completionRate}%</h3>
              <div className="progress mt-2">
                <div 
                  className="progress-bar bg-info" 
                  role="progressbar" 
                  style={{width: `${completionRate}%`}}
                  aria-valuenow={completionRate} 
                  aria-valuemin={0} 
                  aria-valuemax={100}
                ></div>
              </div>
            </div>
            <p className="card-text">Completion Rate</p>
          </div>
        </div>
      </div>
    </div>
  );
}
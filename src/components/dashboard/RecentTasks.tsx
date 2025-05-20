import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Task, TaskStatus, TaskPriority } from '@/types';

export default function RecentTasks() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    const fetchRecentTasks = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/tasks?limit=5');
        
        if (!response.ok) {
          throw new Error('Failed to fetch tasks');
        }
        
        const data = await response.json();
        setTasks(data);
      } catch (error) {
        console.error('Error fetching tasks:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchRecentTasks();
  }, []);
  
  const getStatusBadgeClass = (status: TaskStatus) => {
    switch (status) {
      case TaskStatus.TODO:
        return 'bg-secondary';
      case TaskStatus.IN_PROGRESS:
        return 'bg-primary';
      case TaskStatus.REVIEW:
        return 'bg-warning';
      case TaskStatus.DONE:
        return 'bg-success';
      default:
        return 'bg-secondary';
    }
  };
  
  const getPriorityClass = (priority: TaskPriority) => {
    switch (priority) {
      case TaskPriority.LOW:
        return 'priority-low';
      case TaskPriority.MEDIUM:
        return 'priority-medium';
      case TaskPriority.HIGH:
        return 'priority-high';
      case TaskPriority.URGENT:
        return 'priority-urgent';
      default:
        return '';
    }
  };
  
  if (loading) {
    return (
      <div className="text-center my-4">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }
  
  if (tasks.length === 0) {
    return (
      <div className="alert alert-info">
        No tasks available. Get started by creating your first task!
      </div>
    );
  }
  
  return (
    <div className="card">
      <div className="card-header d-flex justify-content-between align-items-center">
        <h5 className="card-title mb-0">Recent Tasks</h5>
        <Link href="/tasks" className="btn btn-sm btn-primary">
          View All
        </Link>
      </div>
      <div className="list-group list-group-flush">
        {tasks.map((task) => (
          <Link 
            href={`/tasks/${task.id}`} 
            key={task.id}
            className={`list-group-item list-group-item-action ${getPriorityClass(task.priority)}`}
          >
            <div className="d-flex w-100 justify-content-between">
              <h6 className="mb-1">{task.title}</h6>
              <small>
                <span className={`badge ${getStatusBadgeClass(task.status)}`}>
                  {task.status.replace('_', ' ')}
                </span>
              </small>
            </div>
            <p className="mb-1 text-truncate">{task.description}</p>
            <small>
              {task.project?.name} • {new Date(task.created_at).toLocaleDateString()}
            </small>
          </Link>
        ))}
      </div>
    </div>
  );
}
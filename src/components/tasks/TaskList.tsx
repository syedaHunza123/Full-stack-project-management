import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Task, TaskStatus, TaskPriority } from '@/types';

interface TaskListProps {
  projectId?: number;
  userId?: number;
}

export default function TaskList({ projectId, userId }: TaskListProps) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [priorityFilter, setPriorityFilter] = useState<string>('');
  
  useEffect(() => {
    const fetchTasks = async () => {
      try {
        setLoading(true);
        
        let url = '/api/tasks';
        const params = new URLSearchParams();
        
        if (projectId) {
          params.append('projectId', projectId.toString());
        }
        
        if (userId) {
          params.append('assignedTo', userId.toString());
        }
        
        if (statusFilter) {
          params.append('status', statusFilter);
        }
        
        if (priorityFilter) {
          params.append('priority', priorityFilter);
        }
        
        if (params.toString()) {
          url += `?${params.toString()}`;
        }
        
        const response = await fetch(url);
        
        if (!response.ok) {
          throw new Error('Failed to fetch tasks');
        }
        
        const data = await response.json();
        setTasks(data);
        setError(null);
      } catch (error) {
        console.error('Error fetching tasks:', error);
        setError('Failed to load tasks. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchTasks();
  }, [projectId, userId, statusFilter, priorityFilter]);
  
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
  
  if (error) {
    return (
      <div className="alert alert-danger">
        {error}
      </div>
    );
  }
  
  return (
    <div>
      <div className="row mb-4">
        <div className="col-md-8">
          <div className="d-flex gap-2">
            <select
              className="form-select form-select-sm w-auto"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="">All Statuses</option>
              {Object.values(TaskStatus).map((status) => (
                <option key={status} value={status}>
                  {status.replace('_', ' ')}
                </option>
              ))}
            </select>
            
            <select
              className="form-select form-select-sm w-auto"
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
            >
              <option value="">All Priorities</option>
              {Object.values(TaskPriority).map((priority) => (
                <option key={priority} value={priority}>
                  {priority}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="col-md-4 text-end">
          <Link 
            href={projectId ? `/projects/${projectId}/tasks/new` : '/tasks/new'} 
            className="btn btn-primary"
          >
            New Task
          </Link>
        </div>
      </div>
      
      {tasks.length === 0 ? (
        <div className="alert alert-info">
          No tasks found. {!projectId && 'Create your first task to get started!'}
        </div>
      ) : (
        <div className="row row-cols-1 row-cols-md-2 row-cols-lg-3 g-4">
          {tasks.map((task) => (
            <div className="col" key={task.id}>
              <div className={`card h-100 task-card ${getPriorityClass(task.priority)}`}>
                <div className="card-body">
                  <div className="d-flex justify-content-between align-items-start mb-2">
                    <h5 className="card-title">{task.title}</h5>
                    <span className={`badge ${getStatusBadgeClass(task.status)}`}>
                      {task.status.replace('_', ' ')}
                    </span>
                  </div>
                  
                  <p className="card-text mb-3">{task.description}</p>
                  
                  {task.project && (
                    <div className="mb-2">
                      <small className="text-muted">
                        <strong>Project:</strong> {task.project.name}
                      </small>
                    </div>
                  )}
                  
                  <div className="d-flex justify-content-between align-items-center">
                    <small className="text-muted">
                      Priority: <span className="fw-bold">{task.priority}</span>
                    </small>
                    
                    <Link
                      href={`/tasks/${task.id}`}
                      className="btn btn-sm btn-outline-primary"
                    >
                      View
                    </Link>
                  </div>
                </div>
                <div className="card-footer d-flex justify-content-between align-items-center">
                  <small className="text-muted">
                    {task.assignee ? (
                      <span>Assigned to: {task.assignee.name || task.assignee.email}</span>
                    ) : (
                      'Unassigned'
                    )}
                  </small>
                  <small className="text-muted">
                    {new Date(task.updated_at).toLocaleDateString()}
                  </small>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
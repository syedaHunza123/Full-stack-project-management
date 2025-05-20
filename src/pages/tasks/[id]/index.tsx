import { useRouter } from 'next/router';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import Layout from '@/components/layout/Layout';
import AuthGuard from '@/components/auth/AuthGuard';
import { Task, TaskStatus, TaskPriority, User } from '@/types';

export default function TaskDetails() {
  const router = useRouter();
  const { id } = router.query;
  
  const [task, setTask] = useState<Task | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [projectMembers, setProjectMembers] = useState<User[]>([]);
  
  useEffect(() => {
    if (!id) return;
    
    const fetchTask = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/tasks/${id}`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch task');
        }
        
        const data = await response.json();
        setTask(data);
        setError(null);
        
        // Fetch project members
        if (data.project_id) {
          const membersResponse = await fetch(`/api/projects/${data.project_id}/members`);
          
          if (membersResponse.ok) {
            const membersData = await membersResponse.json();
            setProjectMembers(membersData.map((member: any) => member.user));
          }
        }
      } catch (error) {
        console.error('Error fetching task:', error);
        setError('Failed to load task details. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchTask();
  }, [id]);
  
  const handleStatusChange = async (newStatus: TaskStatus) => {
    if (!task) return;
    
    try {
      const response = await fetch(`/api/tasks/${task.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to update task status');
      }
      
      const updatedTask = await response.json();
      setTask(updatedTask);
    } catch (error) {
      console.error('Error updating task status:', error);
      alert('Failed to update task status');
    }
  };
  
  const handleAssigneeChange = async (newAssigneeId: number | null) => {
    if (!task) return;
    
    try {
      const response = await fetch(`/api/tasks/${task.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ assigned_to: newAssigneeId }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to update task assignee');
      }
      
      const updatedTask = await response.json();
      setTask(updatedTask);
    } catch (error) {
      console.error('Error updating task assignee:', error);
      alert('Failed to update task assignee');
    }
  };
  
  const handleDeleteTask = async () => {
    if (!task) return;
    
    if (!confirm('Are you sure you want to delete this task? This action cannot be undone.')) {
      return;
    }
    
    try {
      const response = await fetch(`/api/tasks/${task.id}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete task');
      }
      
      router.push(task.project_id ? `/projects/${task.project_id}` : '/tasks');
    } catch (error) {
      console.error('Error deleting task:', error);
      alert('Failed to delete task');
    }
  };
  
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
        return 'text-success';
      case TaskPriority.MEDIUM:
        return 'text-info';
      case TaskPriority.HIGH:
        return 'text-warning';
      case TaskPriority.URGENT:
        return 'text-danger';
      default:
        return '';
    }
  };
  
  if (loading) {
    return (
      <Layout title="Task Details - Project Management System">
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
  
  if (error || !task) {
    return (
      <Layout title="Task Details - Project Management System">
        <AuthGuard>
          <div className="container py-4">
            <div className="alert alert-danger">
              {error || 'Task not found'}
            </div>
            <Link href="/tasks" className="btn btn-primary">
              Back to Tasks
            </Link>
          </div>
        </AuthGuard>
      </Layout>
    );
  }
  
  return (
    <Layout title={`${task.title} - Project Management System`}>
      <AuthGuard>
        <div className="container py-4">
          <div className="row">
            <div className="col-lg-8">
              <div className="card mb-4">
                <div className="card-header">
                  <div className="d-flex justify-content-between align-items-center">
                    <h1 className="h3 mb-0">{task.title}</h1>
                    <div>
                      <Link
                        href={`/tasks/${task.id}/edit`}
                        className="btn btn-sm btn-outline-primary me-2"
                      >
                        Edit
                      </Link>
                      <button
                        className="btn btn-sm btn-outline-danger"
                        onClick={handleDeleteTask}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
                <div className="card-body">
                  <div className="mb-4">
                    <h5 className="card-title">Description</h5>
                    <p className="card-text">{task.description}</p>
                  </div>
                  
                  {task.project && (
                    <div className="mb-4">
                      <h5 className="card-title">Project</h5>
                      <p className="card-text">
                        <Link href={`/projects/${task.project.id}`} className="text-decoration-none">
                          {task.project.name}
                        </Link>
                      </p>
                    </div>
                  )}
                  
                  <div className="row mb-4">
                    <div className="col-md-6">
                      <h5 className="card-title">Created</h5>
                      <p className="card-text">
                        {new Date(task.created_at).toLocaleString()}
                      </p>
                    </div>
                    <div className="col-md-6">
                      <h5 className="card-title">Last Updated</h5>
                      <p className="card-text">
                        {new Date(task.updated_at).toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="col-lg-4">
              <div className="card mb-4">
                <div className="card-header">
                  <h5 className="card-title mb-0">Task Status</h5>
                </div>
                <div className="card-body">
                  <div className="mb-3">
                    <span className={`badge ${getStatusBadgeClass(task.status)} mb-2`}>
                      {task.status.replace('_', ' ')}
                    </span>
                    
                    <div className="d-grid gap-2">
                      {task.status !== TaskStatus.TODO && (
                        <button 
                          className="btn btn-outline-secondary btn-sm"
                          onClick={() => handleStatusChange(TaskStatus.TODO)}
                        >
                          Mark as To Do
                        </button>
                      )}
                      {task.status !== TaskStatus.IN_PROGRESS && (
                        <button 
                          className="btn btn-outline-primary btn-sm"
                          onClick={() => handleStatusChange(TaskStatus.IN_PROGRESS)}
                        >
                          Mark as In Progress
                        </button>
                      )}
                      {task.status !== TaskStatus.REVIEW && (
                        <button 
                          className="btn btn-outline-warning btn-sm"
                          onClick={() => handleStatusChange(TaskStatus.REVIEW)}
                        >
                          Mark as In Review
                        </button>
                      )}
                      {task.status !== TaskStatus.DONE && (
                        <button 
                          className="btn btn-outline-success btn-sm"
                          onClick={() => handleStatusChange(TaskStatus.DONE)}
                        >
                          Mark as Done
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="card mb-4">
                <div className="card-header">
                  <h5 className="card-title mb-0">Task Details</h5>
                </div>
                <div className="card-body">
                  <div className="mb-3">
                    <h6 className="card-subtitle mb-2">Priority</h6>
                    <p className={`card-text fw-bold ${getPriorityClass(task.priority)}`}>
                      {task.priority}
                    </p>
                  </div>
                  
                  <div className="mb-3">
                    <h6 className="card-subtitle mb-2">Assigned To</h6>
                    {task.assignee ? (
                      <p className="card-text">{task.assignee.name || task.assignee.email}</p>
                    ) : (
                      <p className="card-text text-muted">Unassigned</p>
                    )}
                    
                    <div className="mt-2">
                      <select
                        className="form-select form-select-sm"
                        value={task.assigned_to || ''}
                        onChange={(e) => handleAssigneeChange(e.target.value ? parseInt(e.target.value) : null)}
                      >
                        <option value="">Unassigned</option>
                        {projectMembers.map((user) => (
                          <option key={user.id} value={user.id}>
                            {user.name || user.email}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </AuthGuard>
    </Layout>
  );
}
import { useRouter } from 'next/router';
import { useState, useEffect } from 'react';
import Layout from '@/components/layout/Layout';
import AuthGuard from '@/components/auth/AuthGuard';
import TaskForm from '@/components/tasks/TaskForm';
import { Task } from '@/types';

export default function EditTask() {
  const router = useRouter();
  const { id } = router.query;
  
  const [task, setTask] = useState<Task | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
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
      } catch (error) {
        console.error('Error fetching task:', error);
        setError('Failed to load task details. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchTask();
  }, [id]);
  
  if (loading) {
    return (
      <Layout title="Edit Task - Project Management System">
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
      <Layout title="Edit Task - Project Management System">
        <AuthGuard>
          <div className="container py-4">
            <div className="alert alert-danger">
              {error || 'Task not found'}
            </div>
          </div>
        </AuthGuard>
      </Layout>
    );
  }
  
  return (
    <Layout title={`Edit ${task.title} - Project Management System`}>
      <AuthGuard>
        <div className="container py-4">
          <div className="row justify-content-center">
            <div className="col-lg-8">
              <div className="card">
                <div className="card-header">
                  <h1 className="h3 mb-0">Edit Task</h1>
                </div>
                <div className="card-body">
                  <TaskForm initialData={task} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </AuthGuard>
    </Layout>
  );
}
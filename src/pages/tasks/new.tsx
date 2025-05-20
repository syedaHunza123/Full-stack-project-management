import Layout from '@/components/layout/Layout';
import AuthGuard from '@/components/auth/AuthGuard';
import TaskForm from '@/components/tasks/TaskForm';

export default function NewTask() {
  return (
    <Layout title="New Task - Project Management System">
      <AuthGuard>
        <div className="container py-4">
          <div className="row justify-content-center">
            <div className="col-lg-8">
              <div className="card">
                <div className="card-header">
                  <h1 className="h3 mb-0">Create New Task</h1>
                </div>
                <div className="card-body">
                  <TaskForm />
                </div>
              </div>
            </div>
          </div>
        </div>
      </AuthGuard>
    </Layout>
  );
}
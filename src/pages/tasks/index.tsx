import Layout from '@/components/layout/Layout';
import AuthGuard from '@/components/auth/AuthGuard';
import TaskList from '@/components/tasks/TaskList';

export default function Tasks() {
  return (
    <Layout title="Tasks - Project Management System">
      <AuthGuard>
        <div className="container py-4">
          <div className="d-flex justify-content-between align-items-center mb-4">
            <h1>Tasks</h1>
          </div>
          
          <TaskList />
        </div>
      </AuthGuard>
    </Layout>
  );
}
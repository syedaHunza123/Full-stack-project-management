import { useRouter } from 'next/router';
import Layout from '@/components/layout/Layout';
import AuthGuard from '@/components/auth/AuthGuard';
import TaskList from '@/components/tasks/TaskList';

export default function ProjectTasks() {
  const router = useRouter();
  const { id } = router.query;
  const projectId = id ? parseInt(id as string) : undefined;
  
  return (
    <Layout title="Project Tasks - Project Management System">
      <AuthGuard>
        <div className="container-fluid py-4">
          <TaskList projectId={projectId} />
        </div>
      </AuthGuard>
    </Layout>
  );
}
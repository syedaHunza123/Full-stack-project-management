import Layout from '@/components/layout/Layout';
import AuthGuard from '@/components/auth/AuthGuard';
import ProjectList from '@/components/projects/ProjectList';
import Link from 'next/link';

export default function Projects() {
  return (
    <Layout title="Projects - Project Management System">
      <AuthGuard>
        <div className="container py-4">
          <div className="d-flex justify-content-between align-items-center mb-4">
            <h1>Projects</h1>
            <Link href="/projects/new" className="btn btn-primary">
              Create New Project
            </Link>
          </div>
          
          <ProjectList />
        </div>
      </AuthGuard>
    </Layout>
  );
}
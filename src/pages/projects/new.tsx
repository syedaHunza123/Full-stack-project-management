import Layout from '@/components/layout/Layout';
import AuthGuard from '@/components/auth/AuthGuard';
import ProjectForm from '@/components/projects/ProjectForm';

export default function NewProject() {
  return (
    <Layout title="New Project - Project Management System">
      <AuthGuard>
        <div className="container py-4">
          <div className="row justify-content-center">
            <div className="col-lg-8">
              <div className="card">
                <div className="card-header">
                  <h1 className="h3 mb-0">Create New Project</h1>
                </div>
                <div className="card-body">
                  <ProjectForm />
                </div>
              </div>
            </div>
          </div>
        </div>
      </AuthGuard>
    </Layout>
  );
}
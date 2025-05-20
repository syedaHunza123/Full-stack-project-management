import Link from 'next/link';
import Layout from '@/components/layout/Layout';

export default function Unauthorized() {
  return (
    <Layout title="Unauthorized Access - Project Management System">
      <div className="container py-5">
        <div className="row justify-content-center">
          <div className="col-md-8 text-center">
            <div className="card shadow-sm border-danger">
              <div className="card-body p-5">
                <h1 className="text-danger mb-4">Access Denied</h1>
                <p className="lead mb-4">
                  You don't have permission to access this page. Please contact an administrator if you believe this is an error.
                </p>
                <Link href="/dashboard" className="btn btn-primary">
                  Return to Dashboard
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
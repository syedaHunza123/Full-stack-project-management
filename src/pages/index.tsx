import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import { useEffect } from 'react';
import Layout from '@/components/layout/Layout';
import Link from 'next/link';

export default function Home() {
  const { data: session, status } = useSession();
  const router = useRouter();
  
  useEffect(() => {
    if (status === 'authenticated') {
      router.push('/dashboard');
    }
  }, [status, router]);
  
  return (
    <Layout title="Home - Project Management System">
      <div className="container">
        <div className="py-5 text-center">
          <h1 className="display-4 fw-bold mb-4">Project Management System</h1>
          <p className="lead mb-5">
            A comprehensive solution for managing your projects and tasks with role-based access control.
          </p>
          
          {status === 'authenticated' ? (
            <Link href="/dashboard" className="btn btn-primary btn-lg px-5">
              Go to Dashboard
            </Link>
          ) : (
            <div className="d-flex gap-3 justify-content-center">
              <Link href="/login" className="btn btn-primary btn-lg px-5">
                Log In
              </Link>
              <Link href="/signup" className="btn btn-outline-primary btn-lg px-5">
                Sign Up
              </Link>
            </div>
          )}
        </div>
        
        <div className="row g-4 py-5">
          <div className="col-md-4">
            <div className="card h-100">
              <div className="card-body text-center p-4">
                <div className="mb-3 fs-1 text-primary">
                  <i className="bi bi-kanban"></i>
                </div>
                <h3 className="card-title">Project Management</h3>
                <p className="card-text">
                  Create and manage projects with ease. Track progress, set deadlines, and collaborate with team members.
                </p>
              </div>
            </div>
          </div>
          
          <div className="col-md-4">
            <div className="card h-100">
              <div className="card-body text-center p-4">
                <div className="mb-3 fs-1 text-primary">
                  <i className="bi bi-list-check"></i>
                </div>
                <h3 className="card-title">Task Tracking</h3>
                <p className="card-text">
                  Organize tasks by status and priority. Assign tasks to team members and monitor progress.
                </p>
              </div>
            </div>
          </div>
          
          <div className="col-md-4">
            <div className="card h-100">
              <div className="card-body text-center p-4">
                <div className="mb-3 fs-1 text-primary">
                  <i className="bi bi-shield-lock"></i>
                </div>
                <h3 className="card-title">Role-Based Access</h3>
                <p className="card-text">
                  Secure your projects with role-based access control. Admins can manage all projects and users.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import Layout from '@/components/layout/Layout';
import AuthGuard from '@/components/auth/AuthGuard';
import DashboardStats from '@/components/dashboard/DashboardStats';
import RecentTasks from '@/components/dashboard/RecentTasks';
import ProjectsOverview from '@/components/dashboard/ProjectsOverview';

export default function Dashboard() {
  const { data: session } = useSession();
  
  return (
    <Layout title="Dashboard - Project Management System">
      <AuthGuard>
        <div className="container py-4">
          <div className="mb-4">
            <h1 className="display-6">Welcome, {session?.user?.name || 'User'}</h1>
            <p className="lead text-muted">
              Here's an overview of your projects and tasks
            </p>
          </div>
          
          <DashboardStats />
          
          <div className="row g-4 mt-2">
            <div className="col-md-8">
              <ProjectsOverview />
            </div>
            <div className="col-md-4">
              <RecentTasks />
            </div>
          </div>
        </div>
      </AuthGuard>
    </Layout>
  );
}
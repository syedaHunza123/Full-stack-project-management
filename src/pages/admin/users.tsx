import Layout from '@/components/layout/Layout';
import AuthGuard from '@/components/auth/AuthGuard';
import UserList from '@/components/admin/UserList';
import { UserRole } from '@/types';

export default function AdminUsers() {
  return (
    <Layout title="User Management - Admin">
      <AuthGuard requiredRole={UserRole.ADMIN}>
        <div className="container py-4">
          <h1 className="mb-4">User Management</h1>
          <p className="text-muted mb-4">
            Manage system users and their roles. Admin users have full access to all features, while regular users can only access their own projects and tasks.
          </p>
          
          <UserList />
        </div>
      </AuthGuard>
    </Layout>
  );
}
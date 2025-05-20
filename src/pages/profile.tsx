import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import Layout from '@/components/layout/Layout';
import AuthGuard from '@/components/auth/AuthGuard';
import TaskList from '@/components/tasks/TaskList';
import { User } from '@/types';

export default function Profile() {
  const { data: session } = useSession();
  const [profile, setProfile] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/user/profile');
        
        if (!response.ok) {
          throw new Error('Failed to fetch profile');
        }
        
        const data = await response.json();
        setProfile(data);
        setError(null);
      } catch (error) {
        console.error('Error fetching profile:', error);
        setError('Failed to load profile. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchProfile();
  }, []);
  
  if (loading) {
    return (
      <Layout title="Profile - Project Management System">
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
  
  if (error || !profile) {
    return (
      <Layout title="Profile - Project Management System">
        <AuthGuard>
          <div className="container py-4">
            <div className="alert alert-danger">
              {error || 'Failed to load profile'}
            </div>
          </div>
        </AuthGuard>
      </Layout>
    );
  }
  
  return (
    <Layout title="Profile - Project Management System">
      <AuthGuard>
        <div className="profile-header">
          <div className="container">
            <div className="row">
              <div className="col-md-8">
                <h1>{profile.name || 'User'}</h1>
                <p className="lead">{profile.email}</p>
                <p className="text-muted">
                  Member since {new Date(profile.created_at).toLocaleDateString()}
                </p>
              </div>
              <div className="col-md-4 text-md-end">
                <button className="btn btn-outline-primary">
                  Edit Profile
                </button>
              </div>
            </div>
          </div>
        </div>
        
        <div className="container">
          <div className="row g-4">
            <div className="col-md-12">
              <div className="card">
                <div className="card-header">
                  <h2 className="h5 mb-0">My Tasks</h2>
                </div>
                <div className="card-body">
                  <TaskList userId={parseInt(session?.user.id || '0')} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </AuthGuard>
    </Layout>
  );
}
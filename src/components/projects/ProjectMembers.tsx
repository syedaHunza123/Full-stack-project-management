import { useEffect, useState } from 'react';
import { ProjectMember, User, ProjectRole } from '@/types';

interface ProjectMembersProps {
  projectId: number;
}

export default function ProjectMembers({ projectId }: ProjectMembersProps) {
  const [members, setMembers] = useState<ProjectMember[]>([]);
  const [availableUsers, setAvailableUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [selectedUser, setSelectedUser] = useState('');
  const [selectedRole, setSelectedRole] = useState(ProjectRole.MEMBER);
  
  useEffect(() => {
    const fetchMembers = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/projects/${projectId}/members`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch members');
        }
        
        const data = await response.json();
        setMembers(data);
      } catch (error) {
        console.error('Error fetching members:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchMembers();
  }, [projectId]);
  
  const fetchAvailableUsers = async () => {
    try {
      const response = await fetch(`/api/projects/${projectId}/available-users`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch available users');
      }
      
      const data = await response.json();
      setAvailableUsers(data);
    } catch (error) {
      console.error('Error fetching available users:', error);
    }
  };
  
  const handleShowAddMember = async () => {
    setIsAdding(true);
    await fetchAvailableUsers();
  };
  
  const handleAddMember = async () => {
    if (!selectedUser) return;
    
    try {
      const response = await fetch(`/api/projects/${projectId}/members`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: parseInt(selectedUser),
          role: selectedRole,
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to add member');
      }
      
      const newMember = await response.json();
      setMembers([...members, newMember]);
      setIsAdding(false);
      setSelectedUser('');
      setSelectedRole(ProjectRole.MEMBER);
    } catch (error) {
      console.error('Error adding member:', error);
      alert('Failed to add member');
    }
  };
  
  const handleRemoveMember = async (memberId: number) => {
    if (!confirm('Are you sure you want to remove this member?')) {
      return;
    }
    
    try {
      const response = await fetch(`/api/projects/${projectId}/members/${memberId}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new Error('Failed to remove member');
      }
      
      setMembers(members.filter(m => m.id !== memberId));
    } catch (error) {
      console.error('Error removing member:', error);
      alert('Failed to remove member');
    }
  };
  
  if (loading) {
    return (
      <div className="text-center my-4">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }
  
  return (
    <div className="card mt-4">
      <div className="card-header d-flex justify-content-between align-items-center">
        <h5 className="mb-0">Project Members</h5>
        {!isAdding && (
          <button
            className="btn btn-sm btn-primary"
            onClick={handleShowAddMember}
          >
            Add Member
          </button>
        )}
      </div>
      
      {isAdding && (
        <div className="card-body border-bottom">
          <div className="row g-3">
            <div className="col-md-5">
              <select
                className="form-select"
                value={selectedUser}
                onChange={(e) => setSelectedUser(e.target.value)}
              >
                <option value="">Select User</option>
                {availableUsers.map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.name || user.email}
                  </option>
                ))}
              </select>
            </div>
            
            <div className="col-md-4">
              <select
                className="form-select"
                value={selectedRole}
                onChange={(e) => setSelectedRole(e.target.value as ProjectRole)}
              >
                {Object.values(ProjectRole).map((role) => (
                  <option key={role} value={role}>
                    {role}
                  </option>
                ))}
              </select>
            </div>
            
            <div className="col-md-3 d-flex">
              <button
                className="btn btn-primary flex-grow-1 me-2"
                onClick={handleAddMember}
                disabled={!selectedUser}
              >
                Add
              </button>
              <button
                className="btn btn-secondary"
                onClick={() => setIsAdding(false)}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
      
      <div className="list-group list-group-flush">
        {members.length === 0 ? (
          <div className="list-group-item text-center py-4">
            <p className="mb-0 text-muted">No members in this project</p>
          </div>
        ) : (
          members.map((member) => (
            <div
              key={member.id}
              className="list-group-item d-flex justify-content-between align-items-center"
            >
              <div>
                <div className="fw-bold">{member.user?.name || member.user?.email}</div>
                <div className="text-muted small">{member.user?.email}</div>
              </div>
              <div className="d-flex align-items-center">
                <span className="badge bg-info me-3">{member.role}</span>
                <button
                  className="btn btn-sm btn-outline-danger"
                  onClick={() => handleRemoveMember(member.id)}
                >
                  Remove
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
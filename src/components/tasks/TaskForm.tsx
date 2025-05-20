import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { Task, TaskStatus, TaskPriority, Project, User } from '@/types';

interface TaskFormProps {
  initialData?: Task;
  projectId?: number;
  onSuccess?: (task: Task) => void;
}

export default function TaskForm({ initialData, projectId, onSuccess }: TaskFormProps) {
  const router = useRouter();
  const [formData, setFormData] = useState({
    title: initialData?.title || '',
    description: initialData?.description || '',
    status: initialData?.status || TaskStatus.TODO,
    priority: initialData?.priority || TaskPriority.MEDIUM,
    project_id: initialData?.project_id || projectId || 0,
    assigned_to: initialData?.assigned_to || null,
  });
  const [errors, setErrors] = useState({
    title: '',
    description: '',
    project_id: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [projects, setProjects] = useState<Project[]>([]);
  const [projectMembers, setProjectMembers] = useState<User[]>([]);
  
  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const response = await fetch('/api/projects');
        
        if (!response.ok) {
          throw new Error('Failed to fetch projects');
        }
        
        const data = await response.json();
        setProjects(data);
        
        // If no project is pre-selected, select the first one
        if (!formData.project_id && data.length > 0) {
          setFormData(prev => ({
            ...prev,
            project_id: data[0].id
          }));
        }
      } catch (error) {
        console.error('Error fetching projects:', error);
      }
    };
    
    fetchProjects();
  }, []);
  
  useEffect(() => {
    const fetchProjectMembers = async () => {
      if (!formData.project_id) return;
      
      try {
        const response = await fetch(`/api/projects/${formData.project_id}/members`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch project members');
        }
        
        const data = await response.json();
        const memberUsers = data.map((member: any) => member.user);
        setProjectMembers(memberUsers);
      } catch (error) {
        console.error('Error fetching project members:', error);
      }
    };
    
    fetchProjectMembers();
  }, [formData.project_id]);
  
  const validateForm = () => {
    let valid = true;
    const newErrors = {
      title: '',
      description: '',
      project_id: '',
    };
    
    if (!formData.title.trim()) {
      newErrors.title = 'Task title is required';
      valid = false;
    }
    
    if (!formData.description.trim()) {
      newErrors.description = 'Description is required';
      valid = false;
    }
    
    if (!formData.project_id) {
      newErrors.project_id = 'Please select a project';
      valid = false;
    }
    
    setErrors(newErrors);
    return valid;
  };
  
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value === '' ? null : ['project_id', 'assigned_to'].includes(name) ? Number(value) : value,
    });
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const url = initialData 
        ? `/api/tasks/${initialData.id}` 
        : '/api/tasks';
      const method = initialData ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });
      
      if (!response.ok) {
        throw new Error('Failed to save task');
      }
      
      const savedTask = await response.json();
      
      if (onSuccess) {
        onSuccess(savedTask);
      } else {
        router.push(`/tasks/${savedTask.id}`);
      }
    } catch (error) {
      console.error('Error saving task:', error);
      alert('An error occurred while saving the task. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <form onSubmit={handleSubmit}>
      <div className="mb-3">
        <label htmlFor="title" className="form-label">Task Title</label>
        <input
          type="text"
          className={`form-control ${errors.title ? 'is-invalid' : ''}`}
          id="title"
          name="title"
          value={formData.title}
          onChange={handleChange}
          disabled={isSubmitting}
        />
        {errors.title && <div className="invalid-feedback">{errors.title}</div>}
      </div>
      
      <div className="mb-3">
        <label htmlFor="description" className="form-label">Description</label>
        <textarea
          className={`form-control ${errors.description ? 'is-invalid' : ''}`}
          id="description"
          name="description"
          rows={4}
          value={formData.description}
          onChange={handleChange}
          disabled={isSubmitting}
        ></textarea>
        {errors.description && <div className="invalid-feedback">{errors.description}</div>}
      </div>
      
      <div className="row mb-3">
        <div className="col-md-6">
          <label htmlFor="project_id" className="form-label">Project</label>
          <select
            className={`form-select ${errors.project_id ? 'is-invalid' : ''}`}
            id="project_id"
            name="project_id"
            value={formData.project_id || ''}
            onChange={handleChange}
            disabled={isSubmitting || !!projectId}
          >
            <option value="">Select Project</option>
            {projects.map((project) => (
              <option key={project.id} value={project.id}>
                {project.name}
              </option>
            ))}
          </select>
          {errors.project_id && <div className="invalid-feedback">{errors.project_id}</div>}
        </div>
        
        <div className="col-md-6">
          <label htmlFor="assigned_to" className="form-label">Assigned To</label>
          <select
            className="form-select"
            id="assigned_to"
            name="assigned_to"
            value={formData.assigned_to || ''}
            onChange={handleChange}
            disabled={isSubmitting || !formData.project_id}
          >
            <option value="">Unassigned</option>
            {projectMembers.map((user) => (
              <option key={user.id} value={user.id}>
                {user.name || user.email}
              </option>
            ))}
          </select>
        </div>
      </div>
      
      <div className="row mb-3">
        <div className="col-md-6">
          <label htmlFor="status" className="form-label">Status</label>
          <select
            className="form-select"
            id="status"
            name="status"
            value={formData.status}
            onChange={handleChange}
            disabled={isSubmitting}
          >
            {Object.values(TaskStatus).map((status) => (
              <option key={status} value={status}>
                {status.replace('_', ' ')}
              </option>
            ))}
          </select>
        </div>
        
        <div className="col-md-6">
          <label htmlFor="priority" className="form-label">Priority</label>
          <select
            className="form-select"
            id="priority"
            name="priority"
            value={formData.priority}
            onChange={handleChange}
            disabled={isSubmitting}
          >
            {Object.values(TaskPriority).map((priority) => (
              <option key={priority} value={priority}>
                {priority}
              </option>
            ))}
          </select>
        </div>
      </div>
      
      <div className="d-flex gap-2">
        <button
          type="submit"
          className="btn btn-primary"
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <>
              <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
              {initialData ? 'Updating...' : 'Creating...'}
            </>
          ) : (
            initialData ? 'Update Task' : 'Create Task'
          )}
        </button>
        
        <button
          type="button"
          className="btn btn-secondary"
          onClick={() => router.back()}
          disabled={isSubmitting}
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
import { useState } from 'react';
import { useRouter } from 'next/router';
import { Project } from '@/types';

interface ProjectFormProps {
  initialData?: Project;
  onSuccess?: (project: Project) => void;
}

export default function ProjectForm({ initialData, onSuccess }: ProjectFormProps) {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: initialData?.name || '',
    description: initialData?.description || '',
  });
  const [errors, setErrors] = useState({
    name: '',
    description: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const validateForm = () => {
    let valid = true;
    const newErrors = {
      name: '',
      description: '',
    };
    
    if (!formData.name.trim()) {
      newErrors.name = 'Project name is required';
      valid = false;
    }
    
    if (!formData.description.trim()) {
      newErrors.description = 'Description is required';
      valid = false;
    }
    
    setErrors(newErrors);
    return valid;
  };
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
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
        ? `/api/projects/${initialData.id}` 
        : '/api/projects';
      const method = initialData ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });
      
      if (!response.ok) {
        throw new Error('Failed to save project');
      }
      
      const savedProject = await response.json();
      
      if (onSuccess) {
        onSuccess(savedProject);
      } else {
        router.push(`/projects/${savedProject.id}`);
      }
    } catch (error) {
      console.error('Error saving project:', error);
      alert('An error occurred while saving the project. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <form onSubmit={handleSubmit}>
      <div className="mb-3">
        <label htmlFor="name" className="form-label">Project Name</label>
        <input
          type="text"
          className={`form-control ${errors.name ? 'is-invalid' : ''}`}
          id="name"
          name="name"
          value={formData.name}
          onChange={handleChange}
          disabled={isSubmitting}
        />
        {errors.name && <div className="invalid-feedback">{errors.name}</div>}
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
            initialData ? 'Update Project' : 'Create Project'
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
import { useState, useEffect } from 'react';
import DashboardLayout from '../components/DashboardLayout';
import { motion } from 'framer-motion';
import { useAuth } from '../hooks/useAuth';
import { apiClient } from '../api/client';

export default function ProfilePage() {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    company: '',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  // Fetch user profile from database
  useEffect(() => {
    if (user) {
      setFormData({
        firstName: user.first_name || '',
        lastName: user.last_name || '',
        email: user.email || '',
        company: user.company_name || user.company || '',
      });
      setLoading(false);
    }
  }, [user]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage('');

    try {
      await apiClient.put('/auth/profile', {
        first_name: formData.firstName,
        last_name: formData.lastName,
        company: formData.company,
      });
      setMessage('Profile updated successfully');
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      setMessage('Failed to update profile: ' + (error.response?.data?.error || error.message));
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout title="Profile">
        <div className="flex items-center justify-center h-96">
          <div className="spinner" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Profile">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="card max-w-2xl"
      >
        <h2 className="text-2xl font-bold mb-6">Edit Profile</h2>
        
        {message && (
          <div className={`mb-4 p-3 rounded-lg ${
            message.includes('success') ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
          }`}>
            {message}
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">First Name</label>
              <input 
                type="text" 
                name="firstName"
                value={formData.firstName}
                onChange={handleChange}
                className="w-full px-4 py-2 rounded-lg border border-secondary-200" 
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Last Name</label>
              <input 
                type="text" 
                name="lastName"
                value={formData.lastName}
                onChange={handleChange}
                className="w-full px-4 py-2 rounded-lg border border-secondary-200" 
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Email</label>
            <input 
              type="email" 
              value={formData.email}
              disabled
              className="w-full px-4 py-2 rounded-lg border border-secondary-200 bg-gray-100 cursor-not-allowed" 
            />
            <p className="text-xs text-secondary-500 mt-1">Email cannot be changed</p>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Company</label>
            <input 
              type="text" 
              name="company"
              value={formData.company}
              onChange={handleChange}
              className="w-full px-4 py-2 rounded-lg border border-secondary-200" 
            />
          </div>

          <button
            type="submit"
            disabled={saving}
            className="mt-6 px-6 py-2 rounded-lg bg-primary-500 text-white hover:bg-primary-600 transition-smooth disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </form>
      </motion.div>
    </DashboardLayout>
  );
}

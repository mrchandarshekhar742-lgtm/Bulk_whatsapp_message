import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  MdAdd, 
  MdEdit, 
  MdDelete, 
  MdContentCopy,
  MdVisibility,
  MdClose,
  MdSave,
  MdCategory
} from 'react-icons/md';
import DashboardLayout from '../components/DashboardLayout';
import api from '../api/client';

export default function TemplatesPage() {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState(null);
  const [previewTemplate, setPreviewTemplate] = useState(null);
  
  const [formData, setFormData] = useState({
    name: '',
    category: 'Marketing',
    content: '',
    variables: [],
  });

  const categories = ['Marketing', 'Support', 'Notification', 'Promotion', 'Follow-up', 'Other'];

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    try {
      // Mock data for now - you can implement backend API
      const mockTemplates = [
        {
          id: 1,
          name: 'Welcome Message',
          category: 'Marketing',
          content: 'Hello {{name}}! Welcome to our service. We are excited to have you on board!',
          variables: ['name'],
          created_at: new Date().toISOString(),
          usage_count: 15
        },
        {
          id: 2,
          name: 'Order Confirmation',
          category: 'Notification',
          content: 'Hi {{name}}, your order #{{order_id}} has been confirmed. Total amount: {{amount}}. Expected delivery: {{delivery_date}}.',
          variables: ['name', 'order_id', 'amount', 'delivery_date'],
          created_at: new Date().toISOString(),
          usage_count: 8
        },
        {
          id: 3,
          name: 'Special Offer',
          category: 'Promotion',
          content: 'Exclusive offer for {{name}}! Get {{discount}}% off on your next purchase. Use code: {{code}}. Valid till {{expiry}}.',
          variables: ['name', 'discount', 'code', 'expiry'],
          created_at: new Date().toISOString(),
          usage_count: 23
        }
      ];
      setTemplates(mockTemplates);
    } catch (error) {
      console.error('Error fetching templates:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveTemplate = async () => {
    try {
      // Extract variables from content
      const variables = [...formData.content.matchAll(/\{\{(\w+)\}\}/g)].map(match => match[1]);
      
      const templateData = {
        ...formData,
        variables: [...new Set(variables)] // Remove duplicates
      };

      if (editingTemplate) {
        // Update existing template
        const updatedTemplates = templates.map(t => 
          t.id === editingTemplate.id ? { ...t, ...templateData } : t
        );
        setTemplates(updatedTemplates);
      } else {
        // Create new template
        const newTemplate = {
          id: Date.now(),
          ...templateData,
          created_at: new Date().toISOString(),
          usage_count: 0
        };
        setTemplates([newTemplate, ...templates]);
      }

      resetForm();
    } catch (error) {
      console.error('Error saving template:', error);
    }
  };

  const handleDeleteTemplate = async (id) => {
    if (!confirm('Are you sure you want to delete this template?')) return;
    
    try {
      setTemplates(templates.filter(t => t.id !== id));
    } catch (error) {
      console.error('Error deleting template:', error);
    }
  };

  const handleEditTemplate = (template) => {
    setEditingTemplate(template);
    setFormData({
      name: template.name,
      category: template.category,
      content: template.content,
      variables: template.variables
    });
    setShowModal(true);
  };

  const handleCopyTemplate = (template) => {
    navigator.clipboard.writeText(template.content);
    // You can add a toast notification here
    alert('Template copied to clipboard!');
  };

  const resetForm = () => {
    setFormData({
      name: '',
      category: 'Marketing',
      content: '',
      variables: []
    });
    setEditingTemplate(null);
    setShowModal(false);
  };

  const renderPreview = (content, sampleData = {}) => {
    let preview = content;
    const defaultSamples = {
      name: 'John Doe',
      order_id: '12345',
      amount: '$99.99',
      delivery_date: '2024-01-15',
      discount: '20',
      code: 'SAVE20',
      expiry: '2024-01-31'
    };
    
    const samples = { ...defaultSamples, ...sampleData };
    
    Object.keys(samples).forEach(key => {
      preview = preview.replace(new RegExp(`\\{\\{${key}\\}\\}`, 'g'), samples[key]);
    });
    
    return preview;
  };

  if (loading) {
    return (
      <DashboardLayout title="Message Templates">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Message Templates">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <p className="text-gray-600">Create and manage reusable message templates</p>
          <p className="text-sm text-gray-500 mt-1">
            Use variables like {{name}} to personalize messages
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 flex items-center gap-2 transition-colors"
        >
          <MdAdd className="text-lg" />
          New Template
        </button>
      </div>

      {/* Templates Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {templates.map((template, index) => (
          <motion.div
            key={template.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 hover:shadow-md transition-shadow"
          >
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="font-semibold text-gray-900 mb-1">{template.name}</h3>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-1 bg-primary-100 text-primary-700 rounded-full text-xs font-medium">
                    {template.category}
                  </span>
                  <span className="text-xs text-gray-500">
                    Used {template.usage_count} times
                  </span>
                </div>
              </div>
              <div className="flex gap-1">
                <button
                  onClick={() => setPreviewTemplate(template)}
                  className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
                  title="Preview"
                >
                  <MdVisibility className="text-sm" />
                </button>
                <button
                  onClick={() => handleCopyTemplate(template)}
                  className="p-1 text-gray-400 hover:text-green-600 transition-colors"
                  title="Copy"
                >
                  <MdContentCopy className="text-sm" />
                </button>
                <button
                  onClick={() => handleEditTemplate(template)}
                  className="p-1 text-gray-400 hover:text-yellow-600 transition-colors"
                  title="Edit"
                >
                  <MdEdit className="text-sm" />
                </button>
                <button
                  onClick={() => handleDeleteTemplate(template.id)}
                  className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                  title="Delete"
                >
                  <MdDelete className="text-sm" />
                </button>
              </div>
            </div>

            <div className="mb-4">
              <p className="text-sm text-gray-600 line-clamp-3">
                {template.content}
              </p>
            </div>

            {template.variables.length > 0 && (
              <div className="mb-4">
                <p className="text-xs text-gray-500 mb-2">Variables:</p>
                <div className="flex flex-wrap gap-1">
                  {template.variables.map(variable => (
                    <span
                      key={variable}
                      className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs font-mono"
                    >
                      {`{{${variable}}}`}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div className="text-xs text-gray-400">
              Created {new Date(template.created_at).toLocaleDateString()}
            </div>
          </motion.div>
        ))}
      </div>

      {/* Create/Edit Modal */}
      <AnimatePresence>
        {showModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={(e) => e.target === e.currentTarget && resetForm()}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto"
            >
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold text-gray-900">
                  {editingTemplate ? 'Edit Template' : 'Create New Template'}
                </h2>
                <button
                  onClick={resetForm}
                  className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <MdClose className="text-xl" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Template Name *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="e.g., Welcome Message"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Category
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    {categories.map(category => (
                      <option key={category} value={category}>{category}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Message Content *
                  </label>
                  <textarea
                    value={formData.content}
                    onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 h-32"
                    placeholder="Hello {{name}}! This is your message..."
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Use {{variable}} to insert dynamic content
                  </p>
                </div>

                {formData.content && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Preview
                    </label>
                    <div className="p-3 bg-gray-50 rounded-lg border">
                      <p className="text-sm text-gray-700">
                        {renderPreview(formData.content)}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={resetForm}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveTemplate}
                  disabled={!formData.name || !formData.content}
                  className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-colors"
                >
                  <MdSave className="text-lg" />
                  {editingTemplate ? 'Update' : 'Create'} Template
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Preview Modal */}
      <AnimatePresence>
        {previewTemplate && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={(e) => e.target === e.currentTarget && setPreviewTemplate(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-xl p-6 w-full max-w-lg"
            >
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  Preview: {previewTemplate.name}
                </h3>
                <button
                  onClick={() => setPreviewTemplate(null)}
                  className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <MdClose className="text-xl" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Original Template:</h4>
                  <div className="p-3 bg-gray-50 rounded-lg border">
                    <p className="text-sm text-gray-700 font-mono">
                      {previewTemplate.content}
                    </p>
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Preview with Sample Data:</h4>
                  <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                    <p className="text-sm text-gray-700">
                      {renderPreview(previewTemplate.content)}
                    </p>
                  </div>
                </div>

                {previewTemplate.variables.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Variables:</h4>
                    <div className="flex flex-wrap gap-2">
                      {previewTemplate.variables.map(variable => (
                        <span
                          key={variable}
                          className="px-2 py-1 bg-primary-100 text-primary-700 rounded text-xs font-mono"
                        >
                          {`{{${variable}}}`}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </DashboardLayout>
  );
}
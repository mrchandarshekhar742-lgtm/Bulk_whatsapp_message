import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FaWhatsapp, FaArrowRight } from 'react-icons/fa';
import { HiExclamationCircle } from 'react-icons/hi';
import { useAuth } from '../hooks/useAuth';

export default function LoginPage() {
  const navigate = useNavigate();
  const { login, register } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    first_name: '',
    last_name: '',
    company_name: '',
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (error) setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isLogin) {
        await login(formData.email, formData.password);
      } else {
        // Register logic
        await register(formData);
      }
      navigate('/dashboard');
    } catch (err) {
      console.error('Authentication error:', err);
      setError(err.response?.data?.error || err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5 },
    },
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-secondary-50 to-secondary-100 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-primary-200/20 rounded-full blur-3xl -mr-48 -mt-48 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-accent-200/20 rounded-full blur-3xl -ml-48 -mb-48 pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-md relative z-10"
      >
        <div className="card-lg p-8">
          {/* Header */}
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="text-center mb-8"
          >
            <motion.div
              variants={itemVariants}
              className="flex items-center justify-center gap-3 mb-4"
            >
              <div className="p-2 bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl">
                <FaWhatsapp className="text-3xl text-white" />
              </div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-primary-600 to-accent-600 bg-clip-text text-transparent">
                WhatsApp Pro
              </h1>
            </motion.div>
            <motion.p variants={itemVariants} className="text-secondary-600 text-sm">
              Professional Bulk Messaging Platform
            </motion.p>
          </motion.div>

          {/* Tabs */}
          <motion.div
            variants={itemVariants}
            className="flex gap-2 mb-8 bg-secondary-100 p-1 rounded-md"
          >
            <button
              onClick={() => setIsLogin(true)}
              className={`flex-1 py-2.5 rounded-md font-semibold transition-all duration-300 ${
                isLogin
                  ? 'bg-white text-primary-600 shadow-md'
                  : 'text-secondary-600 hover:text-secondary-900'
              }`}
            >
              Sign In
            </button>
            <button
              onClick={() => setIsLogin(false)}
              className={`flex-1 py-2.5 rounded-md font-semibold transition-all duration-300 ${
                !isLogin
                  ? 'bg-white text-primary-600 shadow-md'
                  : 'text-secondary-600 hover:text-secondary-900'
              }`}
            >
              Register
            </button>
          </motion.div>

          {/* Error Message */}
          {error && (
            <motion.div
              variants={itemVariants}
              className="mb-6 p-4 bg-error-50 border border-error-200 rounded-md flex gap-3 items-start"
            >
              <HiExclamationCircle className="text-error-600 text-lg flex-shrink-0 mt-0.5" />
              <p className="text-error-700 text-sm">{error}</p>
            </motion.div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="visible"
            >
              {!isLogin && (
                <>
                  <motion.div variants={itemVariants}>
                    <label className="block text-sm font-semibold text-secondary-700 mb-2">
                      First Name
                    </label>
                    <input
                      type="text"
                      name="first_name"
                      value={formData.first_name}
                      onChange={handleChange}
                      className="input rounded-md"
                      placeholder="John"
                    />
                  </motion.div>

                  <motion.div variants={itemVariants}>
                    <label className="block text-sm font-semibold text-secondary-700 mb-2">
                      Last Name
                    </label>
                    <input
                      type="text"
                      name="last_name"
                      value={formData.last_name}
                      onChange={handleChange}
                      className="input rounded-md"
                      placeholder="Doe"
                    />
                  </motion.div>

                  <motion.div variants={itemVariants}>
                    <label className="block text-sm font-semibold text-secondary-700 mb-2">
                      Company Name
                    </label>
                    <input
                      type="text"
                      name="company_name"
                      value={formData.company_name}
                      onChange={handleChange}
                      className="input rounded-md"
                      placeholder="Your Company"
                    />
                  </motion.div>
                </>
              )}

              <motion.div variants={itemVariants}>
                <label className="block text-sm font-semibold text-secondary-700 mb-2">
                  Email Address
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  className="input rounded-md"
                  placeholder="you@example.com"
                />
              </motion.div>

              <motion.div variants={itemVariants}>
                <label className="block text-sm font-semibold text-secondary-700 mb-2">
                  Password
                </label>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  className="input rounded-md"
                  placeholder="••••••••"
                />
              </motion.div>
            </motion.div>

            {/* Submit Button */}
            <motion.div variants={itemVariants}>
              <button
                type="submit"
                disabled={loading}
                className="w-full btn-primary gap-2 group mt-6"
              >
                {loading ? (
                  <>
                    <div className="spinner w-4 h-4" />
                    Processing...
                  </>
                ) : (
                  <>
                    {isLogin ? 'Sign In' : 'Create Account'}
                    <FaArrowRight className="group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </button>
            </motion.div>
          </form>

          {/* Footer */}
          <motion.p
            variants={itemVariants}
            className="text-center text-secondary-600 text-sm mt-6"
          >
            {isLogin ? "Don't have an account? " : 'Already have an account? '}
            <button
              onClick={() => {
                setIsLogin(!isLogin);
                setError('');
                setFormData({
                  email: '',
                  password: '',
                  first_name: '',
                  last_name: '',
                  company_name: '',
                });
              }}
              className="text-primary-600 hover:text-primary-700 font-semibold"
            >
              {isLogin ? 'Sign up' : 'Sign in'}
            </button>
          </motion.p>
        </div>

        {/* Trust badges */}
        <motion.div
          variants={itemVariants}
          className="mt-8 flex justify-center gap-6 text-secondary-600 text-xs"
        >
          <span className="flex items-center gap-1">✓ Secure & Encrypted</span>
          <span className="flex items-center gap-1">✓ 24/7 Support</span>
        </motion.div>
      </motion.div>
    </div>
  );
}

import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { MessageSquare, Shield, HelpCircle, AlertCircle } from 'lucide-react';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!username || !password) {
      setError('Please fill in all fields.');
      return;
    }
    setError('');
    setSubmitting(true);
    try {
      const user = await login(username, password);
      if (user.role === 'engineer') {
        navigate('/engineer');
      } else {
        navigate('/client');
      }
    } catch (err) {
      setError(err.message || 'Invalid username or password.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleQuickLogin = async (quickUsername, quickPassword) => {
    setError('');
    setSubmitting(true);
    try {
      const user = await login(quickUsername, quickPassword);
      if (user.role === 'engineer') {
        navigate('/engineer');
      } else {
        navigate('/client');
      }
    } catch (err) {
      setError(err.message || 'Quick login failed.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-center items-center bg-discord-darkest px-4">
      <div className="w-full max-w-md bg-discord-dark rounded-lg shadow-2xl p-8 border border-[#2f3136] relative overflow-hidden">
        {/* Decorative background glow */}
        <div className="absolute -top-10 -right-10 w-32 h-32 bg-discord-blurple/20 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-discord-green/10 rounded-full blur-3xl"></div>

        <div className="flex flex-col items-center mb-6">
          <div className="w-12 h-12 bg-discord-blurple flex items-center justify-center rounded-xl shadow-lg mb-3">
            <MessageSquare className="w-7 h-7 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-white tracking-tight">Welcome Back!</h2>
          <p className="text-discord-textMuted text-sm mt-1">We're so excited to see you again!</p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-discord-red/10 border border-discord-red/30 rounded-md flex items-start space-x-2 text-discord-red text-sm">
            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-discord-textMuted text-xs font-bold uppercase tracking-wider mb-2">
              Username
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full p-2.5 bg-discord-darkest border border-black/40 rounded focus:border-discord-blurple focus:outline-none text-white text-sm"
              placeholder="Enter username"
            />
          </div>

          <div>
            <label className="block text-discord-textMuted text-xs font-bold uppercase tracking-wider mb-2">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-2.5 bg-discord-darkest border border-black/40 rounded focus:border-discord-blurple focus:outline-none text-white text-sm"
              placeholder="Enter password"
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3 bg-discord-blurple hover:bg-discord-blurple/95 disabled:bg-discord-blurple/50 text-white font-semibold rounded shadow-lg transition-colors flex items-center justify-center space-x-2 mt-6"
          >
            {submitting ? (
              <>
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span>Authenticating...</span>
              </>
            ) : (
              <span>Log In</span>
            )}
          </button>
        </form>

        <div className="mt-6 text-center text-sm">
          <span className="text-discord-textMuted">Need an account? </span>
          <Link to="/signup" className="text-discord-blurple hover:underline">
            Register
          </Link>
        </div>

        {/* Quick Demo Section */}
        <div className="mt-8 pt-6 border-t border-[#2f3136]">
          <p className="text-discord-textMuted text-xs font-bold uppercase tracking-wider mb-3 text-center flex items-center justify-center gap-1.5">
            <Shield className="w-3.5 h-3.5 text-discord-yellow" />
            Quick Demo Login
          </p>
          <div className="grid grid-cols-1 gap-2.5">
            <button
              onClick={() => handleQuickLogin('arun', 'password123')}
              className="w-full p-2 bg-discord-darkest border border-[#2f3136] rounded hover:bg-[#32353b] text-left text-xs flex justify-between items-center transition"
            >
              <div>
                <span className="font-semibold text-white">arun</span>
                <span className="text-discord-textMuted"> (Client)</span>
              </div>
              <span className="px-2 py-0.5 bg-discord-blurple/20 text-discord-blurple rounded text-[10px] uppercase font-bold">
                Tamil (தமிழ்)
              </span>
            </button>

            <button
              onClick={() => handleQuickLogin('juan', 'password123')}
              className="w-full p-2 bg-discord-darkest border border-[#2f3136] rounded hover:bg-[#32353b] text-left text-xs flex justify-between items-center transition"
            >
              <div>
                <span className="font-semibold text-white">juan</span>
                <span className="text-discord-textMuted"> (Client)</span>
              </div>
              <span className="px-2 py-0.5 bg-discord-yellow/20 text-discord-yellow rounded text-[10px] uppercase font-bold">
                Spanish (Español)
              </span>
            </button>

            <button
              onClick={() => handleQuickLogin('engineer', 'admin123')}
              className="w-full p-2 bg-discord-darkest border border-[#2f3136] rounded hover:bg-[#32353b] text-left text-xs flex justify-between items-center transition"
            >
              <div>
                <span className="font-semibold text-white">engineer</span>
                <span className="text-discord-textMuted"> (Support)</span>
              </div>
              <span className="px-2 py-0.5 bg-discord-green/20 text-discord-green rounded text-[10px] uppercase font-bold">
                English (EN)
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

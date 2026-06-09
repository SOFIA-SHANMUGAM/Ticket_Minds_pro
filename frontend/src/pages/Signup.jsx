import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { UserPlus, AlertCircle, Globe } from 'lucide-react';

export default function Signup() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('client'); // default to client
  const [preferredLanguage, setPreferredLanguage] = useState('en');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const { signup } = useAuth();
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
      const user = await signup(username, password, role, preferredLanguage);
      if (user.role === 'engineer') {
        navigate('/engineer');
      } else {
        navigate('/client');
      }
    } catch (err) {
      setError(err.message || 'Signup failed. Username might be taken.');
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
            <UserPlus className="w-7 h-7 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-white tracking-tight">Create an Account</h2>
          <p className="text-discord-textMuted text-sm mt-1">Join the multilingual support hub today</p>
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
              placeholder="Choose a username"
              required
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
              placeholder="Create a password"
              required
            />
          </div>

          <div>
            <label className="block text-discord-textMuted text-xs font-bold uppercase tracking-wider mb-2">
              Account Role
            </label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="w-full p-2.5 bg-discord-darkest border border-black/40 rounded focus:border-discord-blurple focus:outline-none text-white text-sm"
            >
              <option value="client">Client (Raises Tickets)</option>
              <option value="engineer">Support Engineer (Answers Tickets)</option>
            </select>
          </div>

          {role === 'client' && (
            <div className="p-3 bg-discord-darkest border border-[#2f3136] rounded space-y-3">
              <label className="text-discord-textMuted text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
                <Globe className="w-3.5 h-3.5 text-discord-blurple" />
                Preferred Language
              </label>
              <select
                value={preferredLanguage}
                onChange={(e) => setPreferredLanguage(e.target.value)}
                className="w-full p-2 bg-discord-dark border border-black/40 rounded focus:border-discord-blurple focus:outline-none text-white text-sm"
              >
                <option value="en">English (EN)</option>
                <option value="es">Spanish (Español)</option>
                <option value="ta">Tamil (தமிழ்)</option>
                <option value="hi">Hindi (हिन्दी)</option>
                <option value="fr">French (Français)</option>
                <option value="de">German (Deutsch)</option>
              </select>
              <p className="text-discord-textMuted text-[11px]">
                We will automatically translate engineer responses into this language.
              </p>
            </div>
          )}

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
                <span>Creating Account...</span>
              </>
            ) : (
              <span>Register</span>
            )}
          </button>
        </form>

        <div className="mt-6 text-center text-sm">
          <span className="text-discord-textMuted">Already have an account? </span>
          <Link to="/login" className="text-discord-blurple hover:underline">
            Log In
          </Link>
        </div>
      </div>
    </div>
  );
}

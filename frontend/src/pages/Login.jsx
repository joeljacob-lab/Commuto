import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { loginUser } from '../services/api';
import { Button } from '../components/ui/button';
import { Lock, Mail, AlertCircle, ArrowRight } from 'lucide-react';
import commutoLogo from '../assets/Commuto_ emblem.png';

function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [formData, setFormData] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      const { data } = await loginUser(formData);
      login(data.user, data.token);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Please check your credentials.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4 py-12 relative selection:bg-accent selection:text-accent-foreground">
      {/* Ambient background decoration */}
      <div className="absolute inset-0 theme-glow-warm pointer-events-none" />
      <div className="absolute inset-0 theme-dot-pattern opacity-50 pointer-events-none" />

      <div className="w-full max-w-md bg-card border border-border rounded-[var(--radius)] p-8 shadow-xs relative z-10">
        
        {/* Brand Header */}
        <div className="text-center mb-8">
          <img
            src={commutoLogo}
            alt="Commuto Emblem"
            className="h-12 w-12 object-contain mx-auto mb-3.5 drop-shadow-xs"
          />
          <h1 className="text-2xl font-serif font-bold text-foreground">
            Sign In to Commuto
          </h1>
          <p className="text-xs text-muted-foreground mt-1.5">
            College-exclusive recurring transit &amp; cost-sharing platform
          </p>
        </div>

        {error && (
          <div className="mb-5 text-xs text-destructive bg-secondary/80 border border-destructive/20 rounded-[var(--radius)] p-3 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-destructive mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-foreground uppercase tracking-wider mb-1.5">
              College Email
            </label>
            <div className="relative">
              <input
                type="email"
                name="email"
                required
                value={formData.email}
                onChange={handleChange}
                className="w-full bg-background border border-border rounded-[var(--radius)] px-3.5 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-hidden focus:ring-2 focus:ring-ring focus:border-ring transition"
                placeholder="rollno@college.edu"
              />
              <Mail className="w-4 h-4 text-muted-foreground absolute right-3.5 top-3 pointer-events-none" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-foreground uppercase tracking-wider mb-1.5">
              Password
            </label>
            <div className="relative">
              <input
                type="password"
                name="password"
                required
                value={formData.password}
                onChange={handleChange}
                className="w-full bg-background border border-border rounded-[var(--radius)] px-3.5 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-hidden focus:ring-2 focus:ring-ring focus:border-ring transition"
                placeholder="••••••••"
              />
              <Lock className="w-4 h-4 text-muted-foreground absolute right-3.5 top-3 pointer-events-none" />
            </div>
          </div>

          <Button
            type="submit"
            disabled={submitting}
            className="w-full mt-2 font-semibold shadow-xs"
            size="lg"
          >
            {submitting ? 'Authenticating...' : 'Sign In '}
          </Button>
        </form>

        <div className="mt-6 pt-6 border-t border-border text-center text-xs text-muted-foreground">
          Don&apos;t have an account yet?{' '}
          <Link to="/register" className="text-primary font-semibold hover:underline inline-flex items-center gap-1">
            Register here <ArrowRight className="w-3 h-3" />
          </Link>
        </div>

      </div>
    </div>
  );
}

export default Login;
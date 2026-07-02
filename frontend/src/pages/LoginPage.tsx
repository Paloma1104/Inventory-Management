import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { detail?: string | { msg: string }[] }; status?: number }; message?: string };
      if (axiosErr.message === 'Access Denied' || axiosErr.response?.status === 403) {
        setError('Access Denied');
      } else if (!axiosErr.response) {
        setError('Unable to connect to the server. Please try again later.');
      } else if (axiosErr.response.status === 401) {
        setError('Invalid email or password');
      } else {
        const detail = axiosErr.response.data?.detail;
        const message = typeof detail === 'string'
          ? detail
          : Array.isArray(detail)
            ? detail.map((d) => d.msg).join(', ')
            : 'Login failed. Please try again.';
        setError(message);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen">
      <div className="hidden w-1/2 bg-gradient-to-br from-navy via-primary to-primary-dark lg:flex lg:flex-col lg:justify-center lg:p-12">
        <div>
          <span className="text-xl font-bold text-white">Inventory</span>
        </div>
        <div className="mt-12">
          <h1 className="text-4xl font-bold leading-tight text-white">
            Manage your inventory with confidence
          </h1>
          <p className="mt-4 text-lg text-white/80">
            Track IoT devices, manage stock levels, and monitor every transaction in real time.
          </p>
        </div>
      </div>

      <div className="flex w-full flex-col justify-center bg-surface-muted px-6 py-12 lg:w-1/2 lg:px-16">
        <div className="mx-auto w-full max-w-sm">
          <div className="mb-8 lg:hidden">
            <span className="text-lg font-bold text-navy">Inventory</span>
          </div>

          <h2 className="text-2xl font-bold text-navy">Sign In</h2>
          <p className="mt-2 text-sm text-navy-secondary">Sign in with your account</p>

          <form onSubmit={handleSubmit} className="mt-8 space-y-5">
            {error && <div className="alert-error">{error}</div>}

            <div>
              <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-navy-secondary">Email</label>
              <input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="input-field" placeholder="you@company.com" />
            </div>

            <div>
              <label htmlFor="password" className="mb-1.5 block text-sm font-medium text-navy-secondary">Password</label>
              <div className="relative">
                <input id="password" type={showPassword ? 'text' : 'password'} required value={password} onChange={(e) => setPassword(e.target.value)} className="input-field pr-10" placeholder="Enter your password" />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-navy-secondary hover:text-navy">
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-end">
              <Link to="/forgot-password" className="link-primary text-sm">Forgot password?</Link>
            </div>

            <button type="submit" disabled={loading} className="btn-primary w-full">
              {loading ? 'Signing in...' : 'Sign in'}
            </button>
          </form>

          <p className="mt-8 text-center text-sm text-navy-secondary">
            Don't have an account?{' '}
            <Link to="/register" className="link-primary">Create account</Link>
          </p>
        </div>
      </div>
    </div>
  );
}

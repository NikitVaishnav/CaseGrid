import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Shield, Lock, Mail, KeyRound, AlertCircle } from 'lucide-react';

const QUICK_CREDENTIALS = [
  { role: 'Investigating Officer', email: 'rajesh.kumar@police.gov.in' },
  { role: 'Legal Officer', email: 'priya.sharma@legal.gov.in' },
  { role: 'Judge', email: 'anil.deshmukh@judiciary.gov.in' },
  { role: 'Admin', email: 'admin@casegrid.gov.in' },
];

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('casegrid123');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      await login(email, password);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Login failed');
    } finally {
      setSubmitting(false);
    }
  };

  const handleQuickSelect = (userEmail) => {
    setEmail(userEmail);
    setPassword('casegrid123');
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 px-6 lg:px-8 relative overflow-hidden">
      {/* Soft Background Decorative Elements */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-blue-100/60 blur-3xl rounded-full pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-80 h-80 bg-indigo-100/60 blur-3xl rounded-full pointer-events-none" />

      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center z-10">
        <div className="inline-flex p-3 bg-blue-50 border border-blue-200 rounded-2xl text-blue-600 mb-4 shadow-sm">
          <Shield className="w-10 h-10" />
        </div>
        <h2 className="text-3xl font-extrabold tracking-tight text-slate-900">
          CASEGRID
        </h2>
        <p className="mt-2 text-xs font-mono text-slate-500 uppercase tracking-widest">
          NCRB Digital Document Management System
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md z-10">
        <div className="bg-white p-8 rounded-2xl shadow-xl border border-slate-200">
          {error && (
            <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm flex items-center gap-3">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-xs font-mono text-slate-600 uppercase tracking-wider mb-2">
                Official Email
              </label>
              <div className="relative">
                <Mail className="w-5 h-5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="officer@police.gov.in"
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-600 focus:bg-white focus:ring-1 focus:ring-blue-600 transition text-sm"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-mono text-slate-600 uppercase tracking-wider mb-2">
                Password
              </label>
              <div className="relative">
                <Lock className="w-5 h-5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-600 focus:bg-white focus:ring-1 focus:ring-blue-600 transition text-sm"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-semibold rounded-xl transition shadow-md shadow-blue-500/20 text-sm flex items-center justify-center gap-2"
            >
              {submitting ? (
                <span>Authenticating...</span>
              ) : (
                <>
                  <KeyRound className="w-4 h-4" />
                  Sign In to Secure Vault
                </>
              )}
            </button>
          </form>

          {/* Quick Login Presets */}
          <div className="mt-8 pt-6 border-t border-slate-200">
            <p className="text-xs font-mono text-slate-500 uppercase tracking-wider text-center mb-3">
              Quick Access Demo Roles (Password: casegrid123)
            </p>
            <div className="grid grid-cols-2 gap-2">
              {QUICK_CREDENTIALS.map((cred) => (
                <button
                  key={cred.role}
                  type="button"
                  onClick={() => handleQuickSelect(cred.email)}
                  className="p-2 bg-slate-50 hover:bg-blue-50 hover:border-blue-300 border border-slate-200 rounded-lg text-left transition group"
                >
                  <span className="block text-xs font-semibold text-slate-700 group-hover:text-blue-700">
                    {cred.role}
                  </span>
                  <span className="block text-[10px] text-slate-500 truncate">{cred.email}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Shield, FileText, Upload, LogOut, GitCommit, Activity } from 'lucide-react';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  if (!user) return null;

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isOfficerOrAdmin = ['INVESTIGATING_OFFICER', 'LEGAL_OFFICER', 'ADMIN'].includes(user.role);
  const isAdminOrJudge = ['ADMIN', 'JUDGE'].includes(user.role);

  return (
    <nav className="bg-white sticky top-0 z-50 border-b border-slate-200 px-6 py-3.5 shadow-xs">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <Link to="/" className="flex items-center gap-3">
          <div className="p-2 bg-blue-50 border border-blue-200 rounded-lg text-blue-600">
            <Shield className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xl font-bold tracking-wider text-slate-900">
              CASEGRID
            </span>
            <span className="text-[10px] block font-mono text-slate-500 uppercase tracking-widest">
              NCRB Digital Integrity Vault
            </span>
          </div>
        </Link>

        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <Link
              to="/"
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition ${
                location.pathname === '/'
                  ? 'bg-blue-50 text-blue-700 border border-blue-200'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <FileText className="w-4 h-4" />
              Documents
            </Link>

            <Link
              to="/timeline"
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition ${
                location.pathname === '/timeline'
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <GitCommit className="w-4 h-4 text-emerald-600" />
              Timeline
            </Link>

            {isAdminOrJudge && (
              <Link
                to="/audit-logs"
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition ${
                  location.pathname === '/audit-logs'
                    ? 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <Activity className="w-4 h-4 text-indigo-600" />
                Audit Logs
              </Link>
            )}

            {isOfficerOrAdmin && (
              <Link
                to="/upload"
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition ${
                  location.pathname === '/upload'
                    ? 'bg-blue-50 text-blue-700 border border-blue-200'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <Upload className="w-4 h-4" />
                Upload Doc
              </Link>
            )}
          </div>

          <div className="h-6 w-px bg-slate-200" />

          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-sm font-semibold text-slate-900 leading-none">{user.name}</p>
              <p className="text-[11px] font-mono text-blue-600 mt-0.5 font-medium tracking-wide">
                {user.role.replace('_', ' ')}
              </p>
            </div>

            <button
              onClick={handleLogout}
              className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
              title="Logout"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}

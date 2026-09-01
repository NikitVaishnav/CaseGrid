import React, { useState, useEffect } from 'react';
import client from '../api/client';
import { 
  ShieldAlert, Search, RefreshCw, ChevronDown, ChevronUp, 
  Activity, User, Clock, Terminal, CheckCircle2, XCircle
} from 'lucide-react';

export default function AuditLogsPage() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionFilter, setActionFilter] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedLogId, setExpandedLogId] = useState(null);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });

  const fetchLogs = async (page = 1) => {
    setLoading(true);
    try {
      const params = { page, limit: 30 };
      if (actionFilter) params.action = actionFilter;
      const res = await client.get('/audit-logs', { params });
      if (res.data.success) {
        setLogs(res.data.data.logs);
        setPagination({
          page: res.data.data.page,
          totalPages: res.data.data.totalPages,
          total: res.data.data.total,
        });
      }
    } catch (err) {
      console.error('Failed to fetch audit logs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs(1);
  }, [actionFilter]);

  const filteredLogs = logs.filter((log) => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      log.actor?.name?.toLowerCase().includes(term) ||
      log.actor?.email?.toLowerCase().includes(term) ||
      log.action.toLowerCase().includes(term) ||
      (log.resourceId && log.resourceId.toLowerCase().includes(term))
    );
  });

  const getActionBadgeColor = (action) => {
    switch (action) {
      case 'UPLOAD': return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'VERIFY': return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'VERIFY_FAIL': return 'bg-red-50 text-red-700 border-red-200';
      case 'DOWNLOAD': return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'LOGIN': return 'bg-slate-100 text-slate-700 border-slate-200';
      default: return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  const getResultBadge = (result) => {
    if (['SUCCESS', 'HASH_MATCH'].includes(result)) {
      return (
        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded">
          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
          {result}
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-red-700 bg-red-50 border border-red-200 px-2 py-0.5 rounded">
        <XCircle className="w-3 h-3 text-red-600" />
        {result}
      </span>
    );
  };

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-3">
            <Activity className="w-7 h-7 text-indigo-600" />
            Forensic Audit Trail
          </h1>
          <p className="text-slate-600 text-sm mt-1">
            Immutable log of system authentication, evidence access, decryption, and verification.
          </p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs mb-6 flex flex-col md:flex-row gap-4 justify-between items-center">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search actor, action, resource..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-900 focus:outline-none focus:border-indigo-600 focus:bg-white transition"
          />
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <select
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            className="bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-700 px-3 py-2 focus:outline-none focus:border-indigo-600"
          >
            <option value="">All Actions</option>
            <option value="LOGIN">LOGIN</option>
            <option value="UPLOAD">UPLOAD</option>
            <option value="VIEW">VIEW</option>
            <option value="DOWNLOAD">DOWNLOAD</option>
            <option value="VERIFY">VERIFY</option>
            <option value="VERIFY_FAIL">VERIFY_FAIL</option>
          </select>

          <button
            onClick={() => fetchLogs(pagination.page)}
            className="p-2 bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-300 rounded-lg transition"
            title="Refresh Logs"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Logs Table */}
      {loading ? (
        <div className="bg-white p-12 rounded-xl border border-slate-200 text-center shadow-xs">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-600 mx-auto mb-3"></div>
          <p className="text-sm text-slate-500 font-mono">Loading forensic trail...</p>
        </div>
      ) : filteredLogs.length === 0 ? (
        <div className="bg-white p-12 rounded-xl text-center border-2 border-dashed border-slate-200">
          <ShieldAlert className="w-12 h-12 text-slate-400 mx-auto mb-3" />
          <p className="text-slate-800 font-semibold text-base">No audit logs found</p>
          <p className="text-slate-500 text-xs mt-1">Actions performed in CaseGrid will automatically appear here.</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50 border-b border-slate-200 font-semibold text-slate-900 uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="px-4 py-3">Timestamp</th>
                  <th className="px-4 py-3">Action</th>
                  <th className="px-4 py-3">Actor</th>
                  <th className="px-4 py-3">Resource ID</th>
                  <th className="px-4 py-3">Result</th>
                  <th className="px-4 py-3">IP Address</th>
                  <th className="px-4 py-3 text-right">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono">
                {filteredLogs.map((log) => {
                  const isExpanded = expandedLogId === log.id;
                  return (
                    <React.Fragment key={log.id}>
                      <tr className="hover:bg-slate-50/80 transition">
                        <td className="px-4 py-3 text-slate-500 whitespace-nowrap text-[11px]">
                          <span className="flex items-center gap-1.5">
                            <Clock className="w-3.5 h-3.5 text-slate-400" />
                            {new Date(log.createdAt).toLocaleString()}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-0.5 rounded border text-[10px] font-bold ${getActionBadgeColor(log.action)}`}>
                            {log.action}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1.5 font-sans">
                            <User className="w-3.5 h-3.5 text-slate-400" />
                            <div>
                              <p className="font-medium text-slate-900 text-xs leading-none">{log.actor?.name || 'System'}</p>
                              <p className="text-[10px] text-slate-400">{log.actor?.role?.replace('_', ' ')}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-slate-600 text-[11px]">
                          {log.details?.caseId ? (
                            <div>
                              <span className="px-1.5 py-0.5 bg-blue-50 text-blue-700 font-bold rounded text-[10px]">
                                {log.details.caseId}
                              </span>
                              {log.details.docType && (
                                <span className="block text-[10px] text-slate-400 mt-0.5">{log.details.docType}</span>
                              )}
                            </div>
                          ) : log.resourceId ? (
                            <span className="truncate block max-w-[120px]">{log.resourceId}</span>
                          ) : (
                            <span className="text-slate-400">—</span>
                          )}
                        </td>
                        <td className="px-4 py-3">{getResultBadge(log.result)}</td>
                        <td className="px-4 py-3 text-slate-500 text-[11px]">{log.ipAddress || '127.0.0.1'}</td>
                        <td className="px-4 py-3 text-right">
                          <button
                            onClick={() => setExpandedLogId(isExpanded ? null : log.id)}
                            className="p-1 text-slate-500 hover:text-indigo-600 rounded transition"
                            title="Toggle Details"
                          >
                            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                          </button>
                        </td>
                      </tr>

                      {/* Expandable JSON Details Drawer */}
                      {isExpanded && (
                        <tr className="bg-slate-950 text-slate-200">
                          <td colSpan="7" className="p-4 font-mono text-[11px]">
                            <div className="flex items-center gap-2 text-indigo-400 mb-2 font-bold uppercase text-[10px]">
                              <Terminal className="w-3.5 h-3.5" />
                              Payload & Context Metadata
                            </div>
                            <pre className="overflow-x-auto p-3 bg-slate-900 rounded border border-slate-800 text-emerald-400">
                              {JSON.stringify(log.details || { note: "No additional metadata recorded" }, null, 2)}
                            </pre>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination Footer */}
          <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-600">
            <span>Showing page {pagination.page} of {pagination.totalPages} ({pagination.total} total logs)</span>
            <div className="flex gap-2">
              <button
                disabled={pagination.page <= 1}
                onClick={() => fetchLogs(pagination.page - 1)}
                className="px-3 py-1 bg-white border border-slate-300 rounded hover:bg-slate-100 disabled:opacity-50 font-semibold"
              >
                Previous
              </button>
              <button
                disabled={pagination.page >= pagination.totalPages}
                onClick={() => fetchLogs(pagination.page + 1)}
                className="px-3 py-1 bg-white border border-slate-300 rounded hover:bg-slate-100 disabled:opacity-50 font-semibold"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

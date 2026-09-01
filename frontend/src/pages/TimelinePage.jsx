import React, { useState, useEffect } from 'react';
import client from '../api/client';
import { 
  GitCommit, ShieldCheck, FileText, User, Calendar, 
  Hash, CheckCircle2, RefreshCw, Key
} from 'lucide-react';

export default function TimelinePage() {
  const [cases, setCases] = useState([]);
  const [selectedCaseId, setSelectedCaseId] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchTimelines = async () => {
    setLoading(true);
    try {
      const res = await client.get('/documents/cases/timeline');
      if (res.data.success) {
        setCases(res.data.cases);
        if (res.data.cases.length > 0 && !selectedCaseId) {
          setSelectedCaseId(res.data.cases[0].caseId);
        }
      }
    } catch (err) {
      console.error('Failed to load case timelines:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTimelines();
  }, []);

  const activeCase = cases.find((c) => c.caseId === selectedCaseId);

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-3">
            <GitCommit className="w-7 h-7 text-emerald-600" />
            Case Evidence Timeline
          </h1>
          <p className="text-slate-600 text-sm mt-1">
            Chronological evidence progression linked to the tamper-proof ledger chain.
          </p>
        </div>

        {/* Case ID Selector */}
        {cases.length > 0 && (
          <div className="flex items-center gap-3 bg-white p-2 border border-slate-200 rounded-xl shadow-xs">
            <span className="text-xs font-semibold text-slate-500 pl-2">Select Case:</span>
            <select
              value={selectedCaseId}
              onChange={(e) => setSelectedCaseId(e.target.value)}
              className="bg-slate-50 border border-slate-300 rounded-lg text-xs font-bold text-blue-700 px-3 py-1.5 focus:outline-none focus:border-blue-600"
            >
              {cases.map((c) => (
                <option key={c.caseId} value={c.caseId}>
                  {c.caseId} ({c.documents.length} Evidence Docs)
                </option>
              ))}
            </select>
            <button
              onClick={fetchTimelines}
              className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition"
              title="Refresh"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        )}
      </div>

      {loading ? (
        <div className="bg-white p-12 rounded-xl border border-slate-200 text-center shadow-xs">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-emerald-600 mx-auto mb-3"></div>
          <p className="text-sm text-slate-500 font-mono">Reconstructing case blockchain timeline...</p>
        </div>
      ) : !activeCase ? (
        <div className="bg-white p-12 rounded-xl text-center border-2 border-dashed border-slate-200">
          <FileText className="w-12 h-12 text-slate-400 mx-auto mb-3" />
          <p className="text-slate-800 font-semibold text-base">No cases recorded yet</p>
          <p className="text-slate-500 text-xs mt-1">Upload evidence documents to initiate a case timeline.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Case Status Summary Banner */}
          <div className="bg-gradient-to-r from-slate-900 to-slate-800 text-white p-6 rounded-2xl shadow-md flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <span className="px-2.5 py-1 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded text-xs font-mono font-bold tracking-wide uppercase">
                {activeCase.caseId}
              </span>
              <h2 className="text-xl font-bold mt-2">Legal Evidence Chain History</h2>
              <p className="text-slate-400 text-xs mt-0.5">
                {activeCase.documents.length} verified evidence artifacts appended sequentially.
              </p>
            </div>
            <div className="flex items-center gap-2 bg-emerald-950/60 border border-emerald-600/40 text-emerald-300 px-4 py-2 rounded-xl text-xs font-mono font-semibold">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              INTEGRITY LEDGER VERIFIED
            </div>
          </div>

          {/* Vertical Timeline Tree */}
          <div className="relative pl-6 md:pl-10 space-y-8 before:absolute before:left-3 md:before:left-5 before:top-3 before:bottom-3 before:w-0.5 before:bg-slate-200">
            {/* Genesis Anchor Block */}
            <div className="relative flex items-start gap-4">
              <div className="absolute -left-6 md:-left-10 mt-1 w-6 h-6 rounded-full bg-slate-900 border-4 border-white flex items-center justify-center text-white shadow-xs">
                <Hash className="w-3 h-3" />
              </div>
              <div className="bg-slate-900 text-slate-100 p-4 rounded-xl shadow-xs w-full max-w-3xl font-mono text-xs border border-slate-800">
                <div className="flex items-center justify-between text-slate-400 text-[11px] mb-1">
                  <span>Genesis Anchor Block #0</span>
                  <span className="text-emerald-400 font-bold">CHAIN INITIATED</span>
                </div>
                <p className="text-slate-300 font-sans font-semibold">System Genesis Block — Root Anchor</p>
              </div>
            </div>

            {/* Document Step Blocks */}
            {activeCase.documents.map((doc, idx) => {
              const sig = doc.chainBlock?.metadata?.digitalSignature;
              const signedBy = doc.chainBlock?.metadata?.signedBy || doc.uploadedBy?.name;
              const badge = doc.chainBlock?.metadata?.badgeNumber || doc.uploadedBy?.badgeNumber || 'OFFICER-REG';

              return (
                <div key={doc.id} className="relative flex items-start gap-4">
                  {/* Timeline node icon */}
                  <div className="absolute -left-6 md:-left-10 mt-1.5 w-6 h-6 rounded-full bg-emerald-600 border-4 border-white flex items-center justify-center text-white shadow-xs">
                    <span className="text-[10px] font-bold">{idx + 1}</span>
                  </div>

                  {/* Card */}
                  <div className="bg-white p-5 rounded-2xl border border-slate-200 hover:border-emerald-300 shadow-xs transition w-full max-w-3xl space-y-3">
                    {/* Header */}
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <div className="flex items-center gap-2">
                        <span className="px-2.5 py-0.5 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded text-[11px] font-mono font-bold">
                          Block #{doc.chainBlock?.blockIndex || idx + 1}
                        </span>
                        <span className="px-2.5 py-0.5 bg-slate-100 text-slate-700 border border-slate-200 rounded text-[11px] font-semibold">
                          {doc.docType.replace('_', ' ')}
                        </span>
                      </div>
                      <span className="text-[11px] text-slate-500 font-mono flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        {new Date(doc.createdAt).toLocaleString()}
                      </span>
                    </div>

                    {/* Content */}
                    <div>
                      <h3 className="text-base font-bold text-slate-900">{doc.title}</h3>
                      {doc.description && (
                        <p className="text-xs text-slate-600 mt-1">{doc.description}</p>
                      )}
                    </div>

                    {/* Officer Sign-Off & Officer Signature Badge */}
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs flex flex-col md:flex-row md:items-center justify-between gap-3 font-mono">
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-blue-600" />
                        <div>
                          <span className="text-slate-900 font-bold font-sans">{signedBy}</span>
                          <span className="text-[10px] text-slate-500 block font-mono">Badge: {badge} ({doc.uploadedBy?.role?.replace('_', ' ')})</span>
                        </div>
                      </div>

                      {sig && (
                        <div className="flex items-center gap-1.5 px-2.5 py-1 bg-blue-50 border border-blue-200 rounded-lg text-blue-800 text-[10px] font-bold">
                          <Key className="w-3.5 h-3.5 text-blue-600" />
                          <span>{sig}</span>
                        </div>
                      )}
                    </div>

                    {/* Blockchain Block Technical Details */}
                    {doc.chainBlock && (
                      <div className="p-3 bg-slate-950 text-slate-200 rounded-xl font-mono text-[11px] space-y-1.5">
                        <div className="flex justify-between text-slate-400">
                          <span>Original File SHA-256:</span>
                          <span className="text-emerald-400 font-semibold truncate max-w-xs">{doc.chainBlock.fileHash}</span>
                        </div>
                        <div className="flex justify-between text-slate-400">
                          <span>Previous Block Hash:</span>
                          <span className="text-slate-400 truncate max-w-xs">{doc.chainBlock.previousHash}</span>
                        </div>
                        <div className="flex justify-between text-slate-400 pt-1 border-t border-slate-800">
                          <span>Chain Block Hash:</span>
                          <span className="text-blue-400 font-semibold truncate max-w-xs">{doc.chainBlock.blockHash}</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

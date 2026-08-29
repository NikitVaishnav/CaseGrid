import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import client from '../api/client';
import { useAuth } from '../context/AuthContext';
import VerifyBadge from '../components/VerifyBadge';
import { 
  FileText, ShieldCheck, Download, Search, RefreshCw, Upload, 
  Hash, Calendar, User, FileCode
} from 'lucide-react';

export default function DashboardPage() {
  const { user } = useAuth();
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('');
  const [verifyingDocId, setVerifyingDocId] = useState(null);
  const [verificationResults, setVerificationResults] = useState({});

  const fetchDocuments = async () => {
    setLoading(true);
    try {
      const res = await client.get('/documents');
      if (res.data.success) {
        setDocuments(res.data.documents);
      }
    } catch (err) {
      console.error('Failed to load documents:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, []);

  const handleVerify = async (docId) => {
    setVerifyingDocId(docId);
    try {
      const res = await client.post(`/documents/${docId}/verify`);
      if (res.data.success) {
        setVerificationResults((prev) => ({
          ...prev,
          [docId]: res.data.verification,
        }));
      }
    } catch (err) {
      console.error('Verification failed:', err);
    } finally {
      setVerifyingDocId(null);
    }
  };

  const handleDownload = async (docId, filename) => {
    try {
      const res = await client.get(`/documents/${docId}/download`, {
        responseType: 'blob',
      });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      alert('Failed to download document');
    }
  };

  const filteredDocs = documents.filter((doc) => {
    const matchesSearch =
      doc.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.caseId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.originalName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType ? doc.docType === filterType : true;
    return matchesSearch && matchesType;
  });

  const isOfficerOrAdmin = ['INVESTIGATING_OFFICER', 'LEGAL_OFFICER', 'ADMIN'].includes(user?.role);

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-3">
            <FileText className="w-7 h-7 text-blue-600" />
            Evidentiary Document Vault
          </h1>
          <p className="text-slate-600 text-sm mt-1">
            Tamper-evident legal assets anchored to the CaseGrid integrity ledger.
          </p>
        </div>

        {isOfficerOrAdmin && (
          <Link
            to="/upload"
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-medium rounded-xl transition shadow-md shadow-blue-500/20 text-sm"
          >
            <Upload className="w-4 h-4" />
            Upload New Document
          </Link>
        )}
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs mb-6 flex flex-col md:flex-row gap-4 justify-between items-center">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search case ID, title, file..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-900 focus:outline-none focus:border-blue-600 focus:bg-white transition"
          />
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-700 px-3 py-2 focus:outline-none focus:border-blue-600"
          >
            <option value="">All Document Types</option>
            <option value="FIR">FIR</option>
            <option value="CHARGE_SHEET">Charge Sheet</option>
            <option value="WITNESS_STATEMENT">Witness Statement</option>
            <option value="FORENSIC_REPORT">Forensic Report</option>
            <option value="COURT_FILING">Court Filing</option>
            <option value="OTHER">Other</option>
          </select>

          <button
            onClick={fetchDocuments}
            className="p-2 bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-300 rounded-lg transition"
            title="Refresh List"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Document Grid / Table */}
      {loading ? (
        <div className="bg-white p-12 rounded-xl border border-slate-200 text-center shadow-xs">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-600 mx-auto mb-3"></div>
          <p className="text-sm text-slate-500 font-mono">Fetching ledger documents...</p>
        </div>
      ) : filteredDocs.length === 0 ? (
        <div className="bg-white p-12 rounded-xl text-center border-2 border-dashed border-slate-200">
          <FileText className="w-12 h-12 text-slate-400 mx-auto mb-3" />
          <p className="text-slate-800 font-semibold text-base">No documents found</p>
          <p className="text-slate-500 text-xs mt-1">Upload a document to establish a chain block.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {filteredDocs.map((doc) => {
            const verification = verificationResults[doc.id];
            const isVerifying = verifyingDocId === doc.id;

            return (
              <div
                key={doc.id}
                className="bg-white p-5 rounded-xl border border-slate-200 hover:border-blue-300 shadow-xs transition flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                <div className="space-y-2 max-w-2xl">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="px-2.5 py-0.5 bg-blue-50 text-blue-700 border border-blue-200 rounded font-mono text-[11px] font-medium">
                      {doc.caseId}
                    </span>
                    <span className="px-2.5 py-0.5 bg-slate-100 text-slate-700 border border-slate-200 rounded text-[11px] font-semibold">
                      {doc.docType.replace('_', ' ')}
                    </span>
                    {verification ? (
                      <VerifyBadge status={verification.status} />
                    ) : (
                      <VerifyBadge status="UNVERIFIED" />
                    )}
                  </div>

                  <div>
                    <h3 className="text-base font-bold text-slate-900">{doc.title}</h3>
                    {doc.description && (
                      <p className="text-xs text-slate-600 line-clamp-1 mt-0.5">{doc.description}</p>
                    )}
                  </div>

                  <div className="flex items-center gap-4 text-[11px] font-mono text-slate-500 flex-wrap">
                    <span className="flex items-center gap-1">
                      <FileCode className="w-3.5 h-3.5 text-slate-400" />
                      {doc.originalName} ({(doc.fileSize / 1024).toFixed(1)} KB)
                    </span>
                    <span className="flex items-center gap-1">
                      <User className="w-3.5 h-3.5 text-slate-400" />
                      {doc.uploadedBy?.name || 'Unknown Officer'}
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      {new Date(doc.createdAt).toLocaleString()}
                    </span>
                    {doc.chainBlock && (
                      <span className="flex items-center gap-1 text-blue-600 font-semibold">
                        <Hash className="w-3.5 h-3.5" />
                        Block #{doc.chainBlock.blockIndex}
                      </span>
                    )}
                  </div>

                  {/* Verification Results Dropdown */}
                  {verification && (
                    <div className="mt-3 p-3 bg-slate-50 rounded-lg border border-slate-200 font-mono text-[11px] space-y-1">
                      <div className="flex justify-between text-slate-600">
                        <span>SHA-256 File Hash:</span>
                        <span className="text-slate-900 font-medium truncate ml-2 max-w-xs">{verification.fileHash}</span>
                      </div>
                      <div className="flex justify-between text-slate-600">
                        <span>Chain Recorded Hash:</span>
                        <span className="text-blue-700 font-medium truncate ml-2 max-w-xs">{verification.chainHash}</span>
                      </div>
                      <div className="flex justify-between items-center text-slate-600 pt-1 border-t border-slate-200">
                        <span>Ledger Chain Integrity:</span>
                        <span className={verification.chainValid ? "text-emerald-700 font-bold" : "text-red-600 font-bold"}>
                          {verification.chainValid ? "✓ ALL BLOCKS INTACT" : "✗ CHAIN CORRUPTED"}
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2 border-t md:border-t-0 pt-3 md:pt-0 border-slate-100">
                  <button
                    onClick={() => handleVerify(doc.id)}
                    disabled={isVerifying}
                    className="flex items-center gap-1.5 px-3 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-lg text-xs font-semibold transition"
                  >
                    <ShieldCheck className={`w-4 h-4 ${isVerifying ? 'animate-spin' : ''}`} />
                    {isVerifying ? 'Verifying...' : 'Verify Integrity'}
                  </button>

                  <button
                    onClick={() => handleDownload(doc.id, doc.originalName)}
                    className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 rounded-lg text-xs font-semibold transition"
                  >
                    <Download className="w-4 h-4" />
                    Download
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

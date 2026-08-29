import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import client from '../api/client';
import { Upload, FileUp, Shield, AlertCircle, ArrowLeft, CheckCircle } from 'lucide-react';

export default function UploadPage() {
  const [caseId, setCaseId] = useState('');
  const [docType, setDocType] = useState('FIR');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(null);

  const navigate = useNavigate();

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) {
      setError('Please select a file to upload');
      return;
    }

    setError('');
    setUploading(true);

    const formData = new FormData();
    formData.append('file', file);
    formData.append('caseId', caseId);
    formData.append('docType', docType);
    formData.append('title', title);
    formData.append('description', description);

    try {
      const res = await client.post('/documents/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (res.data.success) {
        setSuccess(res.data.document);
        setTimeout(() => {
          navigate('/');
        }, 2000);
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-6 py-10">
      <button
        onClick={() => navigate('/')}
        className="inline-flex items-center gap-2 text-slate-600 hover:text-slate-900 text-xs font-mono mb-6 transition"
      >
        <ArrowLeft className="w-4 h-4" />
        Return to Dashboard
      </button>

      <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-lg">
        <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-200">
          <div className="p-2 bg-blue-50 border border-blue-200 rounded-lg text-blue-600">
            <FileUp className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900">Upload Evidentiary Document</h1>
            <p className="text-xs text-slate-600">
              Files are automatically encrypted with AES-256 and anchored to the custom integrity chain.
            </p>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm flex items-center gap-3">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="mb-6 p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm flex items-center gap-3">
            <CheckCircle className="w-5 h-5 shrink-0" />
            <div>
              <p className="font-semibold">Document uploaded successfully!</p>
              <p className="text-xs text-emerald-700 font-mono mt-0.5">
                Block #{success.chainBlock?.blockIndex} generated. Hash: {success.chainBlock?.fileHash?.slice(0, 16)}...
              </p>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-mono text-slate-600 uppercase tracking-wider mb-2">
                Case Identifier <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="e.g. FIR-2026-MH-084"
                value={caseId}
                onChange={(e) => setCaseId(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 placeholder-slate-400 text-sm focus:outline-none focus:border-blue-600 focus:bg-white transition"
              />
            </div>

            <div>
              <label className="block text-xs font-mono text-slate-600 uppercase tracking-wider mb-2">
                Document Classification <span className="text-red-500">*</span>
              </label>
              <select
                value={docType}
                onChange={(e) => setDocType(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 text-sm focus:outline-none focus:border-blue-600 focus:bg-white transition"
              >
                <option value="FIR">FIR (First Information Report)</option>
                <option value="CHARGE_SHEET">Charge Sheet</option>
                <option value="WITNESS_STATEMENT">Witness Statement</option>
                <option value="FORENSIC_REPORT">Forensic Report</option>
                <option value="COURT_FILING">Court Filing</option>
                <option value="OTHER">Other Evidence</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-mono text-slate-600 uppercase tracking-wider mb-2">
              Document Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Initial Forensic Ballistics Examination Report"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 placeholder-slate-400 text-sm focus:outline-none focus:border-blue-600 focus:bg-white transition"
            />
          </div>

          <div>
            <label className="block text-xs font-mono text-slate-600 uppercase tracking-wider mb-2">
              Brief Description / Context
            </label>
            <textarea
              rows={3}
              placeholder="Add relevant notes regarding source officer, station, or evidence details..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 placeholder-slate-400 text-sm focus:outline-none focus:border-blue-600 focus:bg-white transition"
            />
          </div>

          <div>
            <label className="block text-xs font-mono text-slate-600 uppercase tracking-wider mb-2">
              Select Document File <span className="text-red-500">*</span>
            </label>
            <div className="relative border-2 border-dashed border-slate-300 hover:border-blue-500 rounded-xl p-6 text-center transition bg-slate-50/50">
              <input
                type="file"
                required
                onChange={handleFileChange}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
              <Upload className="w-8 h-8 text-slate-400 mx-auto mb-2" />
              {file ? (
                <div>
                  <p className="text-sm font-semibold text-blue-700">{file.name}</p>
                  <p className="text-xs text-slate-500 font-mono mt-1 font-normal">
                    {(file.size / 1024).toFixed(1)} KB • Ready for AES-256 Encryption
                  </p>
                </div>
              ) : (
                <div>
                  <p className="text-sm font-medium text-slate-700">Click or drag file to upload</p>
                  <p className="text-xs text-slate-500 font-mono mt-1">PDF, DOCX, PNG, JPG (Max 50MB)</p>
                </div>
              )}
            </div>
          </div>

          <button
            type="submit"
            disabled={uploading}
            className="w-full py-3 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-semibold rounded-xl transition shadow-md shadow-blue-500/20 text-sm flex items-center justify-center gap-2"
          >
            {uploading ? (
              <span>Encrypting & Ledger Mining...</span>
            ) : (
              <>
                <Shield className="w-4 h-4" />
                Commit Document to Vault & Ledger
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
